import React, {useState, useEffect, useRef} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { StudentProfile } from '../../types';
import type { Level } from '../data/english/schema';
import { LEVELS, LEVEL_NAMES, requiredSkills, skillTitle } from './catalog';
import { loadContent, contentCacheStatus, type EnglishContent } from './content';
import { makeSession, makePlacement, activityPool } from './activities';
import { withApprovedAI } from './ai';
import { saveSession } from './storage';
import { type ActivityKind, type EnglishSession, type OtherExercise, type Answer, sourceId } from './model';
import { canSpeak, speak } from '../utils/speech';

export const activityNames: Record<ActivityKind|'mixed',string> = { mixed:'Một chút mỗi dạng',fill:'Điền từ',conjugate:'Chia động từ',order:'Xếp câu',pos:'Từ loại',roles:'Thành phần câu',meaning:'Ghép nghĩa',spelling:'Đánh vần',picture:'Ghép hình',listen:'Nghe và chọn',reading:'Đọc hiểu',rewrite:'Viết lại câu',phrase:'Cụm từ giao tiếp',letter:'Chữ hoa và chữ thường' };

export function OfflineNote({content}:{content:EnglishContent}) {
  const [cached,setCached]=useState(false);
  useEffect(()=>{let active=true;contentCacheStatus(content.level).then(value=>{if(active)setCached(value);}).catch(()=>{});return()=>{active=false;};},[content]);
  return <p className="en-small en-cache-state">{LEVEL_NAMES[content.level]} · {cached?'✓ Bài học này đã lưu để mở lại ngoại tuyến.':'Bài đang mở. Chưa xác nhận đủ tệp ngoại tuyến.'} Giọng đọc phụ thuộc thiết bị.</p>;
}

export function Catalog({student}: {student:StudentProfile}) {
  const due=(student.englishProgress?.reviewItems||[]).filter(x=>x.nextReviewAt<=new Date().toISOString()).length;
  return <section className="en-path"><div className="en-section-heading"><h2>Chọn trang sách của em</h2><span className="en-small">Mọi chủ đề đều có thể bắt đầu ngay</span></div>
    <div className="en-level-grid">{LEVELS.map(level=><article className="en-chapter" key={level}><span className="en-eyebrow">{level==='K'?'LÀM QUEN':'KHÁM PHÁ'} {student.englishProgress?.masteryByLevel[level]?.mastered?'· ĐÃ VỮNG':''}</span><h3>{LEVEL_NAMES[level]}</h3><div className="en-chapter-actions"><Link className="en-text-link" to={`/english/learn/${level}`}>Học bài →</Link><Link className="en-text-link" to={`/english/practice?level=${level}`}>Luyện tập</Link></div></article>)}</div>
    <div className="en-chapter-actions"><Link className="en-button" to="/english/review">Ôn đến hạn · {due}</Link><Link className="en-text-link" to="/english/placement">Tìm điểm bắt đầu</Link><Link className="en-text-link" to="/english/rulebook">Sổ tay ngữ pháp</Link><Link className="en-text-link" to="/english/parent">Góc phụ huynh</Link></div>
  </section>;
}

export function ExtendedSetup({student,content,mode}: {student:StudentProfile;content:EnglishContent;mode:EnglishSession['mode']}) {
  const navigate=useNavigate();
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[student.id]);
  const [levels,setLevels]=useState<Level[]>([mode==='test'&&content.level==='K'?'A1':content.level]);
  const [family,setFamily]=useState<ActivityKind|'mixed'>('mixed');
  const [count,setCount]=useState(10), [busy,setBusy]=useState(false), [error,setError]=useState('');
  const available=[...new Set(levels.flatMap(level=>level==='K'?['mixed','letter','picture','meaning','listen','phrase']:level==='C3'?['mixed','reading','rewrite','meaning','spelling','listen']:['mixed','fill','conjugate','order','pos','roles','meaning','spelling','listen'].filter(kind=>(kind!=='conjugate'||!['A3','C1','C2'].includes(level))&&(kind!=='roles'||level!=='C2'))))];
  const total=Math.max(count,levels.reduce((n,l)=>n+requiredSkills[l].length,0));
  const reviewItems=student.englishProgress?.reviewItems || [];
  const dueCount=reviewItems.filter(x=>x.nextReviewAt<=new Date().toISOString()).length;
  async function start() {
    setBusy(true);setError('');
    try {
      const selected=mode==='placement'?LEVELS.filter(l=>l!=='K'):levels;
      let bundles=await Promise.all(selected.map(loadContent));
      if(mode==='practice') bundles=await Promise.all(bundles.map(b=>withApprovedAI(b,student.id)));
      const due=(student.englishProgress?.reviewItems||[]).filter(x=>x.nextReviewAt<=new Date().toISOString());
      let snapshots;
      if(mode==='review') {
        const reviewBundles=await Promise.all([...new Set(due.map(x=>x.level||'A1'))].map(loadContent));
        const pool=reviewBundles.flatMap(b=>activityPool(b,'mixed'));
        snapshots=due.flatMap(x=>{const e=x.exercise||pool.find(e=>sourceId(e)===x.sourceId);return e?[e]:[];});
      }
      const previous=selected.flatMap(l=>student.englishProgress?.qualifyingExams[l]?.at(-1)?.sourceIds||[]);
      const draft=mode==='placement'?makePlacement(bundles,student.id):makeSession(bundles,student.id,mode,count,family,previous,snapshots);
      if(!active.current)return;
      await saveSession(draft,null);if(active.current)navigate(`/english/${mode}?session=${draft.id}`);
    } catch(e) {if(active.current){setError(e instanceof Error?e.message:'Chưa tạo được bài.');setBusy(false);}}
  }
  return <section className="en-setup"><span className="en-eyebrow">MỖI NGÀY MỘT CHÚT</span><h1>{mode==='placement'?'Mình bắt đầu từ đâu?':mode==='review'?'Gặp lại những câu cần ôn':mode==='test'?'Một cột mốc nhỏ':'Hôm nay mình luyện gì?'}</h1>
    <p>{mode==='placement'?'8 câu giúp gợi ý nơi bắt đầu. Không tính sao hay chứng nhận đã vững.':mode==='review'?'Ôn những câu đến hạn, xem lại lời giải và thử lại.':mode==='test'?`${total} câu từ các nguồn khác nhau. Đáp án chỉ xuất hiện sau khi nộp bài. Bài trộn nhiều chủ đề không xét Đã vững.`:'Chọn chủ đề, thử từng câu rồi xem lời giải.'}</p>
    {!['review','placement'].includes(mode)&&<fieldset><legend>Chủ đề</legend><div className="en-options">{LEVELS.filter(l=>mode!=='test'||l!=='K').map(l=><button key={l} aria-pressed={levels.includes(l)} onClick={()=>{setLevels(old=>old.includes(l)?old.filter(x=>x!==l):[...old,l]);setFamily('mixed');}}>{LEVEL_NAMES[l]}</button>)}</div></fieldset>}
    {mode!=='placement'&&<fieldset><legend>Số câu</legend><div className="en-options">{(mode==='test'?[10,15]:[5,10,15]).map(n=><button key={n} aria-pressed={count===n} onClick={()=>setCount(n)}>{n} câu</button>)}</div></fieldset>}
    {mode==='practice'&&<fieldset><legend>Cách luyện</legend><div className="en-options">{available.map(k=><button key={k} aria-pressed={family===k} disabled={k==='listen'&&!canSpeak('en-US')} onClick={()=>setFamily(k as ActivityKind|'mixed')}>{activityNames[k]}</button>)}</div>{!canSpeak('en-US')&&<p className="en-small">Thiết bị chưa có giọng tiếng Anh. Các dạng luyện không cần âm thanh vẫn dùng được.</p>}</fieldset>}
    {mode==='review'&&<div className="en-review-schedule"><p>{dueCount?`${dueCount} câu đã đến hẹn ôn.`:'Chưa có câu đến hạn. Em có thể luyện thêm hoặc quay lại vào ngày hẹn.'}</p>{reviewItems.slice().sort((a,b)=>a.nextReviewAt.localeCompare(b.nextReviewAt)).slice(0,10).map(item=><p key={item.sourceId}>{skillTitle(item.skill)} · {new Date(item.nextReviewAt).toLocaleDateString('vi-VN')}</p>)}{!dueCount&&<Link className="en-text-link" to="/english/practice">Chọn bài luyện →</Link>}</div>}
    {error&&<p className="en-notice en-error" role="alert">{error}</p>}<button className="en-button" disabled={busy||!levels.length||(mode==='review'&&!dueCount)} onClick={start}>{busy?'Đang mở sách…':'Bắt đầu →'}</button>
  </section>;
}

export function ExtraInput({exercise:e,answer,onAnswer,disabled,onAudioReady,onReplaceAudio}: {exercise:OtherExercise;answer:Answer;onAnswer:(a:Answer)=>void;disabled:boolean;onAudioReady:(ready:boolean)=>void;onReplaceAudio:()=>void}) {
  const [audioError,setAudioError]=useState(false);
  return <div className="en-extra-input">{e.passage&&<article className="en-reading"><h2>{e.passage.title}</h2><p lang="en">{e.passage.en}</p></article>}{e.rewrite&&<p className="en-plain-sentence" lang="en">{e.rewrite.promptEn}</p>}<h2>{e.prompt}</h2>
    {e.kind==='picture'&&e.vocab&&<><button className="en-text-link" disabled={!canSpeak('en-US')} onClick={()=>{setAudioError(false);if(!speak(e.vocab!.en,{lang:'en-US',onError:()=>setAudioError(true)}))setAudioError(true);}}>Nghe từ</button>{audioError&&<p role="status">Chưa phát được giọng đọc. Có thể dùng gợi ý nghĩa tiếng Việt.</p>}</>}
    {e.audio&&<><button className="en-button" disabled={disabled} onClick={()=>{setAudioError(false);onAudioReady(false);if(!speak(e.audio!,{lang:'en-US',onEnd:()=>onAudioReady(true),onError:()=>{setAudioError(true);onAudioReady(false);}}))setAudioError(true);}}>Nghe từ</button>{audioError&&<p role="alert">Chưa phát được âm thanh. Thử nghe lại hoặc đổi sang ghép nghĩa, không mất điểm.</p>}{audioError&&<button className="en-text-link" disabled={disabled} onClick={onReplaceAudio}>Đổi sang ghép nghĩa</button>}</>}
    {e.letters&&<div className="en-options">{e.letters.map((letter,index)=>{const used=typeof answer==='string'?[...answer.toLowerCase()].filter(c=>c===letter).length:0;const occurrence=e.letters!.slice(0,index+1).filter(c=>c===letter).length;return <button key={index} disabled={disabled||occurrence<=used} onClick={()=>onAnswer((typeof answer==='string'?answer:'')+letter)}>{letter}</button>;})}<button disabled={disabled} onClick={()=>onAnswer('')}>Xếp lại</button></div>}
    {e.options.length?<div className="en-options">{e.options.map(option=><button key={option} className={e.kind==='picture'?'en-picture-choice':''} disabled={disabled} aria-pressed={answer===option} onClick={()=>onAnswer(option)}>{option==='true'?'Đúng':option==='false'?'Sai':option}</button>)}</div>:<input className="en-answer-input" aria-label="Câu trả lời" autoComplete="off" spellCheck={false} value={typeof answer==='string'?answer:''} disabled={disabled} onChange={ev=>onAnswer(ev.target.value)}/>}
  </div>;
}

export function EarlyLearn({content}: {content:EnglishContent}) {
  const [page,setPage]=useState(0);
  return <section className="en-learn"><h1>{LEVEL_NAMES.K}</h1><p>Cùng người lớn nghe, nhìn và nói từng chút.</p><div className="en-options">{[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter=><button key={letter} onClick={()=>speak(letter,{lang:'en-US'})}>{letter} {letter.toLowerCase()}</button>)}</div><div className="en-level-grid">{content.phrases.slice(page*10,page*10+10).map(p=><article className="en-chapter" key={p.id}><h2>{p.image} {p.en}</h2><p>{p.vi}</p><button className="en-text-link" onClick={()=>speak(p.audioHint,{lang:'en-US'})}>Nghe cụm từ</button></article>)}</div><div className="en-options"><button disabled={page===0} onClick={()=>setPage(page-1)}>Trang trước</button><span>Trang {page+1}/{Math.ceil(content.phrases.length/10)}</span><button disabled={(page+1)*10>=content.phrases.length} onClick={()=>setPage(page+1)}>Trang sau</button></div><Link className="en-button" to="/english/practice?level=K">Cùng chơi với chữ và từ →</Link></section>;
}

export function Rulebook() {
  const [bundles,setBundles]=useState<EnglishContent[]>([]),[query,setQuery]=useState(''),[error,setError]=useState('');
  useEffect(()=>{let active=true;Promise.all(LEVELS.filter(l=>l!=='K').map(loadContent)).then(b=>{if(active)setBundles(b);}).catch(()=>{if(active)setError('Chưa tải được sổ tay. Hãy kết nối mạng để mở các bài lần đầu.');});return()=>{active=false;};},[]);
  const q=query.toLocaleLowerCase('vi');
  return <section className="en-setup en-rulebook"><h1>Sổ tay ngữ pháp</h1><p>Tra nhanh công thức, ví dụ và những lỗi dễ nhầm.</p><input aria-label="Tìm trong sổ tay" placeholder="Tìm từ khóa hoặc công thức…" value={query} onChange={e=>setQuery(e.target.value)}/>{error&&<p role="alert">{error}</p>}{bundles.flatMap(b=>b.theory!.sections.filter(s=>(s.heading+' '+s.body).toLocaleLowerCase('vi').includes(q)).map((s,i)=><details key={b.level+':'+i}><summary>{LEVEL_NAMES[b.level]} · {s.heading}</summary><p style={{whiteSpace:'pre-line'}}>{s.body}</p><Link to={'/english/learn/'+b.level}>Xem công thức và ví dụ →</Link></details>))}</section>;
}
