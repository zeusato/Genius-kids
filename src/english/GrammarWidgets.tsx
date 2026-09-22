import React,{useState} from 'react';
import type {EnglishContent} from './content';
import {activityPool} from './activities';
import {isSentenceExercise} from './model';
import {grade,joinTokens} from './engine';

export function GrammarWidget({kind,content}:{kind:string;content:EnglishContent}) {
  const [index,setIndex]=useState(0),[order,setOrder]=useState<number[]>([]),[checked,setChecked]=useState(false);
  if(kind==='conjugation-wheel') {
    const verbs=content.vocab.filter(v=>v.pos==='verb'&&v.forms);
    if(!verbs.length)return null;const v=verbs[index%verbs.length];
    return <div className="en-widget"><label>Khám phá dạng của động từ<select value={index%verbs.length} onChange={e=>setIndex(Number(e.target.value))}>{verbs.map((v,i)=><option key={v.id} value={i}>{v.en} — {v.vi}</option>)}</select></label><div className="en-options">{Object.entries(v.forms!).filter(([key])=>key!=='irregular').map(([key,value])=><span className="en-form-card" key={key}><small>{({thirdSg:'Ngôi thứ ba số ít',past:'Quá khứ',ing:'Dạng -ing',plural:'Số nhiều'} as Record<string,string>)[key]}</small><strong lang="en">{String(value)}</strong></span>)}</div><p>{v.exampleEn}</p></div>;
  }
  if(kind==='sentence-builder') {
    const pool=activityPool(content,'order').filter(isSentenceExercise);if(!pool.length)return null;const e=pool[index%pool.length];
    const last=e.sentence.tokens.length-1;const punctuation=e.sentence.tokens[last].pos==='punct'?last:-1;
    return <div className="en-widget"><h3>Thử xếp một câu</h3><p>{e.sentence.vi}</p><p className="en-answer-tray" lang="en">{joinTokens([...order,...(punctuation<0?[]:[punctuation])].map(i=>e.sentence.tokens[i].text))||'Chọn những mảnh từ bên dưới.'}</p><div className="en-options">{e.shuffledIndices.filter(i=>i!==punctuation).map(i=><button disabled={order.includes(i)} key={i} onClick={()=>{setOrder([...order,i]);setChecked(false);}}>{e.sentence.tokens[i].text}</button>)}</div><div className="en-chapter-actions"><button className="en-text-link" onClick={()=>setChecked(true)}>Kiểm tra</button><button className="en-text-link" onClick={()=>{setOrder([]);setChecked(false);}}>Xếp lại</button><button className="en-text-link" onClick={()=>{setIndex(index+1);setOrder([]);setChecked(false);}}>Câu khác</button></div>{checked&&<p role="status">{grade(e,[...order,...(punctuation<0?[]:[punctuation])])?'Đúng rồi!':`Cùng đọc lại: ${e.sentence.en}`}</p>}</div>;
  }
  if(kind==='tense-compare') {
    const groups=[...new Set(content.sentences.map(s=>s.grammarPoint))];
    return <div className="en-widget"><h3>Quan sát các cách diễn đạt</h3><div className="en-options">{groups.map((g,i)=><button key={g} aria-pressed={index%groups.length===i} onClick={()=>setIndex(i)}>Ví dụ {i+1}</button>)}</div>{content.sentences.filter(s=>s.grammarPoint===groups[index%groups.length]).slice(0,2).map(s=><div key={s.id}><p lang="en"><strong>{s.en}</strong></p><p>{s.vi}</p></div>)}</div>;
  }
  return null;
}

export function IrregularVerbs({content}:{content:EnglishContent}) {
  const words=content.vocab.filter(v=>v.pos==='verb'&&v.forms?.irregular&&v.forms.past);
  if(!words.length)return null;
  return <section className="en-lesson-section"><h2>Động từ bất quy tắc trong bài</h2><div className="en-table-scroll"><table><thead><tr><th>Nguyên thể</th><th>Quá khứ</th><th>Nghĩa</th></tr></thead><tbody>{words.map(v=><tr key={v.id}><td>{v.en}</td><td>{v.forms!.past}</td><td>{v.vi}</td></tr>)}</tbody></table></div></section>;
}
