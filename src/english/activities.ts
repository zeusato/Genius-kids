import type { EnglishContent } from './content';
import type { EnglishSession, Exercise, ActivityKind, OtherExercise, SentenceExercise } from './model';
import { sourceId, isSentenceExercise, exerciseLevel } from './model';
import { requiredSkills, skillId } from './catalog';
import { shuffle, normalizeAnswer } from './engine';

export function activityPool(content: EnglishContent, family: ActivityKind | 'mixed', exam = false): Exercise[] {
  const result: Exercise[] = [];
  const kinds = exam ? ['fill','order'] : family === 'mixed' ? ['fill','order','pos','roles','conjugate'] : [family];
  for (const s of content.sentences) {
    if (exam && s.source !== 'seed') continue;
    for (const kind of kinds) {
      // Conjugation is the verb-only presentation of an approved fill blank.
      // It never synthesizes a new answer or enables analysis annotations.
      if (!s.exerciseTypes.includes((kind === 'conjugate' ? 'fill' : kind) as never)) continue;
      const targets = kind === 'fill' || kind === 'conjugate' ? s.blanks.flatMap((b,i) => kind !== 'conjugate' || s.tokens[b.tokenIndex].pos === 'verb' ? [i] : []) : kind === 'roles' ? s.roleSpans.map((_,i)=>i) : kind === 'pos' ? s.tokens.flatMap((t,i)=>t.pos==='punct'?[]:[i]) : [0];
      for (const target of targets) result.push({id:`${s.id}:${kind}:${target}`,kind,skill:skillId(s.grammarPoint),sentence:s,target,shuffledIndices:shuffle(s.tokens.map((_,i)=>i))} as SentenceExercise);
    }
  }
  const add = (e: Omit<OtherExercise,'level'|'alternatives'|'hint'> & Partial<Pick<OtherExercise,'alternatives'|'hint'>>) => result.push({level:content.level,alternatives:[],hint:'Đọc kỹ yêu cầu và thử nhớ lại bài học.',...e});
  if (family === 'mixed' || family === 'reading' || exam) for (const p of content.passages) {
    if (exam && p.source !== 'seed') continue;
    for (const q of p.questions) add({id:`${p.id}:${q.id}`,sourceId:p.id,source:p.source,kind:'reading',skill:`reading-${q.type}`,prompt:q.q,answer:q.answer,alternatives:q.alt||[],options:q.type==='tf'?['true','false']:q.options||[],explanation:q.explain,passage:p});
  }
  if (family === 'mixed' || family === 'rewrite' || exam) for (const r of content.rewrites) {
    if (exam && r.source !== 'seed') continue;
    add({id:r.id,sourceId:r.id,source:r.source,kind:'rewrite',skill:r.type,prompt:r.promptVi,answer:r.answer,alternatives:r.alt||[],options:[],explanation:r.vi,hint:r.hint,rewrite:r});
  }
  if (!exam && (['meaning','spelling','picture','listen'].includes(family) || (content.level==='K' && family==='mixed'))) {
    const kind = family === 'mixed' ? 'picture' : family as 'meaning'|'spelling'|'picture'|'listen';
    for (const v of content.vocab) {
      if (kind==='spelling' && !/^[a-z]+$/i.test(v.en)) continue;
      if (kind==='picture' && (!v.image || v.image.includes('/'))) continue;
      // Pictures have one meaning within a question; ambiguous picture groups are excluded.
      if (kind==='picture' && content.vocab.some(w=>w.id!==v.id && w.image===v.image && normalizeAnswer(w.en)!==normalizeAnswer(v.en))) continue;
      const answer = kind==='meaning'?v.vi:kind==='picture'?v.image!:v.en;
      const distractors = [...new Set(content.vocab.filter(w=>w.id!==v.id && normalizeAnswer(w.en)!==normalizeAnswer(v.en)).map(w=>kind==='meaning'?w.vi:kind==='picture'?w.image:w.en).filter((x):x is string=>!!x && x!==answer && !x.includes('/')))];
      if (kind!=='spelling' && distractors.length<3) continue;
      add({id:`${v.id}:${kind}`,sourceId:v.id,source:v.source,kind,skill:`vocab-${kind}`,prompt:kind==='spelling'?`Xếp chữ hoặc viết từ tiếng Anh: ${v.vi}`:kind==='meaning'?`Chọn nghĩa của “${v.en}”.`:kind==='picture'?`Chọn hình: ${v.en}`:'Nghe và chọn từ.',answer,options:kind==='spelling'?[]:shuffle([answer,...shuffle(distractors).slice(0,3)]),letters:kind==='spelling'?shuffle([...v.en.toLowerCase()]):undefined,hint:kind==='spelling'?`Từ có ${v.en.length} chữ cái, bắt đầu bằng ${v.en[0]}.`:kind==='picture'?`Nghĩa của từ: ${v.vi}`:`Ví dụ: ${v.exampleEn}`,explanation:`${v.en}: ${v.vi}. ${v.exampleEn}`,audio:kind==='listen'?v.en:undefined,vocab:v});
    }
  }
  if (!exam && (family==='phrase' || content.level==='K' && family==='mixed')) for (const p of content.phrases) {
    const others=[...new Set(content.phrases.filter(x=>x.en!==p.en).map(x=>x.vi))].filter(x=>x!==p.vi);
    add({id:p.id,sourceId:p.id,source:p.source,kind:'phrase',skill:'phrases',prompt:`${p.image} ${p.en}`,answer:p.vi,options:shuffle([p.vi,...shuffle(others).slice(0,3)]),explanation:`${p.en}: ${p.vi}`,phrase:p});
  }
  if (!exam && family==='letter') for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') add({id:`K-letter-${letter}`,sourceId:`K-letter-${letter}`,source:'seed',kind:'letter',skill:'letters',prompt:`Chọn chữ thường của ${letter}`,answer:letter.toLowerCase(),options:shuffle([letter.toLowerCase(),...shuffle([... 'abcdefghijklmnopqrstuvwxyz'].filter(x=>x!==letter.toLowerCase())).slice(0,3)]),explanation:`${letter} — ${letter.toLowerCase()}`});
  return result;
}

export function makeSession(bundles: EnglishContent[], studentId: string, mode: EnglishSession['mode'], count=10, family: ActivityKind|'mixed'='mixed', previous: string[]=[], snapshots?: Exercise[]): EnglishSession {
  if (!bundles.length) throw new Error('Chọn ít nhất một chủ đề.');
  if (mode==='test' && bundles.some(b=>b.level==='K')) throw new Error('Góc cho bé chỉ có hoạt động làm quen.');
  const exam = mode==='test' || mode==='placement';
  const pool=shuffle(snapshots || bundles.flatMap(b=>activityPool(b,family,exam))).sort((a,b)=>Number(previous.includes(sourceId(a)))-Number(previous.includes(sourceId(b))));
  const wanted = mode==='test' ? bundles.flatMap(b=>requiredSkills[b.level].map(s=>`${b.level}:${s}`)) : [...new Set(pool.map(e=>`${isSentenceExercise(e)?e.sentence.level:e.level}:${e.skill}`))];
  if (mode==='test') count=Math.max(count,wanted.length);
  if (mode==='placement') count=8;
  if (mode==='review') count=Math.min(count,new Set(pool.map(sourceId)).size);
  if (!count || count>100) throw new Error('Chưa có câu đến hạn ôn hoặc số câu vượt giới hạn.');
  const selected: Exercise[]=[];
  for(let i=0;i<count;i++) {
    const key=wanted[i%wanted.length];
    const available=pool.filter(e=>!selected.some(x=>sourceId(x)===sourceId(e)));
    const e=available.find(e=>`${isSentenceExercise(e)?e.sentence.level:e.level}:${e.skill}`===key) || (mode!=='test'?available[0]:undefined);
    if(!e) throw new Error('Chưa đủ nguồn câu khác nhau cho lựa chọn này. Hãy giảm số câu hoặc đổi dạng luyện.');
    selected.push(e);
  }
  const now=new Date().toISOString();
  return {schemaVersion:1,id:crypto.randomUUID(),studentId,contentVersion:bundles.map(b=>b.version).join(':'),level:mode==='review'?exerciseLevel(selected[0]):bundles[0].level,levels:mode==='review'?[...new Set(selected.map(exerciseLevel))]:bundles.map(b=>b.level),mode,startedAt:now,updatedAt:now,elapsedSeconds:0,status:'draft',exercises:structuredClone(shuffle(selected)),responses:{},cursor:0,revision:0};
}

export function makePlacement(bundles:EnglishContent[],studentId:string):EnglishSession {
  const ordered=bundles.filter(b=>b.level!=='K');
  if(ordered.length<5)throw new Error('Cần ít nhất 5 chủ đề để gợi ý điểm bắt đầu.');
  // Eight samples span the released curriculum; middle topics rotate between attempts.
  const middle=shuffle(ordered.slice(1,-1)).slice(0,6);
  const chosen=[ordered[0],...ordered.slice(1,-1).filter(b=>middle.includes(b)),ordered.at(-1)!];
  const session=makeSession(chosen,studentId,'placement');
  session.exercises=chosen.map(b=>shuffle(activityPool(b,'mixed',true))[0]);
  return session;
}
