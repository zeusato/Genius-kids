// Read-only content review. Candidate lists require editorial interpretation;
// reproductions call the actual sentence grader, not a bag-of-words surrogate.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { buildSync } from 'esbuild';
import { validateContent } from '../src/english/validation.mjs';
import { generateInMemory } from './english-review-generator.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'src/data/english');
const files={},data={};
const hash=f=>createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex');
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
  files[f]={sha256:hash(f)};data[f]=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
}
for(const [f,x]of Object.entries(data)){
  const [level,kind]=f.split('.');
  Object.assign(files[f],{count:Array.isArray(x)?x.length:1,errors:validateContent(kind,x,{level,sentenceIds:(data[`${level}.sentences.json`]||[]).map(s=>s.id)}).errors});
}
const code=buildSync({entryPoints:[path.join(root,'src/english/engine.ts')],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,structuredClone});
const {grade,normalizeAnswer}=module.exports;
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const contains=(text,term)=>new RegExp(`(?<![\\p{L}])${escape(term)}(?![\\p{L}])`,'iu').test(text);
const sentences=Object.entries(data).filter(([f])=>f.endsWith('.sentences.json')).flatMap(([,x])=>x);
const ids=x=>x.map(s=>s.id);
const levels={};
for(const level of [...new Set(sentences.map(s=>s.level))]){
  const ss=sentences.filter(s=>s.level===level);
  levels[level]={count:ss.length,difficulty:[1,2,3].map(d=>ss.filter(s=>s.difficulty===d).length),
    exerciseTypes:ss.reduce((a,s)=>{for(const k of s.exerciseTypes)a[k]=(a[k]||0)+1;return a;},{}),
    grammarPoints:ss.reduce((a,s)=>(a[s.grammarPoint]=(a[s.grammarPoint]||0)+1,a),{}),
    multiwordTokens:ss.flatMap(s=>s.tokens.flatMap((t,i)=>/\s/.test(t.text)?[{id:s.id,index:i,text:t.text}]:[])),
    roleGaps:ss.filter(s=>s.exerciseTypes.includes('roles')).map(s=>({id:s.id,missing:s.tokens.flatMap((t,i)=>!['punct','conjunction'].includes(t.pos)&&!s.roleSpans.some(r=>r.tokenIndices.includes(i))?[{index:i,text:t.text}]:[])})).filter(x=>x.missing.length),
    repeatedRoleTargets:ss.filter(s=>s.exerciseTypes.includes('roles')).map(s=>({id:s.id,roles:s.roleSpans.map(r=>r.clauseId+'/'+r.role).filter((r,i,a)=>a.indexOf(r)!==i)})).filter(x=>x.roles.length),
    // Lexical inputs may legitimately equal the answer (base-form verbs).
    // Only C1/C2 question words/prepositions/conjunctions are reported as leaks.
    promptCopiesAnswer:['C1','C2'].includes(level)?ss.flatMap(s=>s.blanks.filter(b=>contains(b.promptVi.replace(/\[[^\]]+\]/g,''),b.answer)).map(b=>({id:s.id,answer:b.answer,prompt:b.promptVi}))):[],
    boundedChoicePrompts:ss.flatMap(s=>s.blanks.filter(b=>/Chọn một từ trong nhóm \[[^\]]+\]/.test(b.promptVi)).map(b=>({id:s.id,prompt:b.promptVi}))),
    contractedOnlyPromptWithFullAlt:ss.flatMap(s=>s.blanks.filter(b=>/viết tắt|rút gọn/i.test(b.promptVi)&&b.alt?.some(a=>/\snot\b/.test(a))).map(b=>({id:s.id,prompt:b.promptVi,answer:b.answer,alt:b.alt}))),
    prepLocalRoleCandidates:['C1','C2'].includes(level)?ss.flatMap(s=>s.tokens.flatMap((t,i)=>t.pos==='preposition'&&t.role!=='prep'?[{id:s.id,index:i,text:t.text,role:t.role}]:[])):[],
    lastNextPosCandidates:['C1','C2'].includes(level)?ss.flatMap(s=>s.tokens.flatMap((t,i)=>['last','next'].includes(t.text.toLowerCase())&&s.tokens[i+1]?.pos==='noun'?[{id:s.id,index:i,text:t.text,pos:t.pos}]:[])):[],
    notPos:ids(ss.filter(s=>s.tokens.some(t=>t.text==='not'&&t.pos!=='adverb'))),
    beAuxWithoutLexicalVerb:ids(ss.filter(s=>s.tokens.some(t=>t.lemma==='be'&&t.feature?.startsWith('aux-'))&&!s.tokens.some(t=>t.pos==='verb'&&t.lemma!=='be'))),
    rolesOnExistential:ids(ss.filter(s=>s.exerciseTypes.includes('roles')&&s.tokens.some(t=>t.role==='expletive'))),
  };
}
function indices(s,text){const used=new Set();return (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu)||[]).map(w=>{const i=s.tokens.findIndex((t,i)=>!used.has(i)&&normalizeAnswer(t.text,false)===normalizeAnswer(w,false));used.add(i);return i;});}
const reproductions=[];
for(const s of sentences)for(const a of s.orderAlternatives||[])if(/\bright now[.?]$/.test(s.en)&&/^Now .* right[.?]$/.test(a)){
  const good='Right now '+(s.tokens[0].text==='I'?'I'+s.en.slice(1):s.en[0].toLowerCase()+s.en.slice(1)).replace(/ right now([.?])$/,'$1');
  reproductions.push({id:s.id,kind:'order',issue:'right-now-split',source:s.en,wrong:a,wrongAccepted:grade({kind:'order',sentence:s,target:0},indices(s,a)),correct:good,correctAccepted:grade({kind:'order',sentence:s,target:0},indices(s,good))});
}
for(const [id,role,phrase]of [['C1-s-0068','verb','do get up'],['C1-s-0125','verb','did not call'],['C1-s-0129','verb','will not come'],['C1-s-0194','subject','the girl wearing pink shoes'],['C1-s-0195','verb','do wake up']]){
  const s=sentences.find(s=>s.id===id),target=s.roleSpans.findIndex(r=>r.role===role);
  reproductions.push({id,kind:'roles',expected:phrase,stored:s.roleSpans[target].tokenIndices.map(i=>s.tokens[i].text).join(' '),accepted:grade({kind:'roles',sentence:s,target},indices(s,phrase))});
}
for(const id of ['B1-s-0030','C1-s-0038','C1-s-0104']){
  const s=sentences.find(s=>s.id===id);
  const target=s.roleSpans.findIndex((r,i,a)=>a.some((other,j)=>j!==i&&other.role===r.role&&other.clauseId===r.clauseId));
  const spans=s.roleSpans.filter(r=>r.role===s.roleSpans[target].role&&r.clauseId===s.roleSpans[target].clauseId);
  reproductions.push({id,kind:'roles',enabled:s.exerciseTypes.includes('roles'),issue:'ambiguous-same-clause-target',role:spans[0].role,
    phrases:spans.map(r=>r.tokenIndices.map(i=>s.tokens[i].text).join(' ')),
    secondValidPhraseAccepted:grade({kind:'roles',sentence:s,target},spans[1].tokenIndices),
    allValidPhrasesAccepted:grade({kind:'roles',sentence:s,target},spans.flatMap(r=>r.tokenIndices))});
}
for(const [id,answer]of [['B2-s-0071','is not'],['C2-s-0045','beside']]){
  const s=sentences.find(s=>s.id===id);reproductions.push({id,kind:'fill',prompt:s.blanks[0].promptVi,answer,accepted:grade({kind:'fill',sentence:s,target:0},answer)});
}
const passages=data['C3.passages.json'];
const groups=new Map();for(const p of passages){const key=normalizeAnswer(p.en);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p.id);}
const passageReview={count:passages.length,uniqueEnglish:groups.size,duplicateGroups:[...groups.values()].filter(g=>g.length>1),
  wordCounts:passages.map(p=>({id:p.id,stored:p.wordCount,actual:p.en.trim().split(/\s+/).length})),
  outOfLength:ids(passages.filter(p=>p.en.trim().split(/\s+/).length<60||p.en.trim().split(/\s+/).length>90)),
  tfCase:passages.flatMap(p=>p.questions.filter(q=>q.type==='tf'&&!['true','false'].includes(q.answer)).map(q=>q.id)),
  genericTail:ids(passages.filter(p=>p.en.includes('Every student in our group participated actively in this activity.'))),
  placeholderGlossary:passages.flatMap(p=>(p.glossary||[]).filter(g=>g.vi.startsWith('thuộc chủ đề')).map(g=>({id:p.id,...g}))),
  genericMcq:passages.flatMap(p=>p.questions.filter(q=>q.q==='Nhân vật hoặc sự kiện chính được nhắc tới là gì?').map(q=>({id:q.id,answer:q.answer}))),
  genericShort:passages.flatMap(p=>p.questions.filter(q=>q.type==='short'&&q.answer==='study notebooks').map(q=>q.id)),
  shortExactPhraseCandidates:[['C3-p-0003','inside a cozy tree hollow'],['C3-p-0004','everyone is reading quietly and attentively']].map(([id,answer])=>{const q=passages.find(p=>p.id===id).questions.find(q=>q.type==='short');return {id:q.id,answer,acceptedByNormalizedExactMatch:[q.answer,...(q.alt||[])].some(a=>normalizeAnswer(a)===normalizeAnswer(answer)),note:'Data membership only; C3 grader is not implemented.'};}),
};
const passageText=passages.map(p=>p.en).join('\n');
const vocabWithoutPassageMatch=data['C3.vocab.json'].filter(v=>![v.en,...Object.values(v.forms||{}).filter(x=>typeof x==='string')].some(word=>contains(passageText,word))).map(v=>({id:v.id,en:v.en}));
const k=data['K.vocab.json'];
const kReview={vocab:k.length,phrases:data['K.phrases.json'].length,alphabet:k.filter(v=>v.tags.includes('alphabet')).map(v=>({id:v.id,en:v.en,letter:v.tags.find(t=>t.startsWith('letter-')),example:v.exampleEn,image:v.image})),
  exampleWordCountOutside2to5:k.filter(v=>v.exampleEn.trim().split(/\s+/).length<2||v.exampleEn.trim().split(/\s+/).length>5).map(v=>({id:v.id,example:v.exampleEn})),
  phraseWordCountOutside2to5:data['K.phrases.json'].filter(p=>p.en.trim().split(/\s+/).length<2||p.en.trim().split(/\s+/).length>5).map(p=>({id:p.id,en:p.en})),
};
const generatorDiff={};
for(const f of ['build-c1-full.mjs','build-c2-full.mjs','build-c3-full.mjs','build-k-full.mjs']){
  for(const [name,out]of generateInMemory(f)){
    const live=data[name],differences=[];
    if(Array.isArray(out))for(const r of out){const current=live.find(x=>x.id===r.id);for(const key of new Set([...Object.keys(r),...Object.keys(current||{})]))if(!isDeepStrictEqual(r[key],current?.[key]))differences.push(`${r.id}.${key}`);}
    else if(!isDeepStrictEqual(out,live))differences.push('theory');
    generatorDiff[name]={generator:f,differences};
  }
}
const normalizedTheoryRemainingErrors={};
for(const l of ['C1','C2','C3']){
  const t=structuredClone(data[`${l}.theory.json`]);delete t.topic;delete t.exampleIds;
  t.formulas=t.formulas.map(f=>({label:f.label||f.name,pattern:f.pattern,example:f.example||f.examples.join('\n')}));
  t.sections=t.sections.map(s=>({heading:s.heading||s.title,body:s.body||s.content,...(s.exampleIds?{exampleIds:s.exampleIds}:{})}));
  normalizedTheoryRemainingErrors[l]=validateContent('theory',t,{level:l,sentenceIds:(data[`${l}.sentences.json`]||[]).map(s=>s.id)}).errors;
}
for(const [f,r]of Object.entries(files))r.unchangedDuringAudit=r.sha256===hash(f);
const report={reviewedAt:new Date().toISOString(),files,levels,reproductions,passages:passageReview,vocabWithoutPassageMatch,k:kReview,generatorDiff,normalizedTheoryRemainingErrors,sourceStable:Object.values(files).every(f=>f.unchangedDuringAudit)};
const output=process.argv.includes('--after-fixes')?'docs/english-content-fixes-v4.audit.json':'docs/english-content-review-v4.audit.json';
fs.writeFileSync(path.join(root,output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceStable:report.sourceStable,counts:Object.fromEntries(Object.entries(files).map(([f,r])=>[f,r.count])),
  errors:Object.fromEntries(Object.entries(files).filter(([,r])=>r.errors.length).map(([f,r])=>[f,r.errors.length])),
  levels:Object.fromEntries(Object.entries(levels).map(([l,r])=>[l,{leaks:r.promptCopiesAnswer.length,multiword:r.multiwordTokens.length,gaps:r.roleGaps.length,repeatedRoles:r.repeatedRoleTargets.length,contractionConflict:r.contractedOnlyPromptWithFullAlt.length,prepLocalRoleCandidates:r.prepLocalRoleCandidates.length,beAuxWithoutLexicalVerb:r.beAuxWithoutLexicalVerb,rolesOnExistential:r.rolesOnExistential}])),
  wrongOrderAccepted:reproductions.filter(r=>r.wrongAccepted),passages:{unique:groups.size,tooLong:passageReview.outOfLength.length,placeholderGlossary:passageReview.placeholderGlossary.length},
  vocabWithoutPassageMatch:vocabWithoutPassageMatch.length,k:kReview.exampleWordCountOutside2to5,
  generatorDiff:Object.fromEntries(Object.entries(generatorDiff).map(([f,r])=>[f,r.differences.length])),normalizedTheoryRemainingErrors},null,2));
