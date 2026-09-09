import React, { useEffect, useRef, useState } from 'react';
import { Apple, Diamond, Lightbulb, Star, Volume2, VolumeX } from 'lucide-react';
import { Session, Task } from './model';
import { attemptOf, questionOf, timeLimit } from './engine';
import { COLORS } from './questions';

function Visual({task:t}:{task:Task}){
 if(t.kind==='count'){
  const Icon=t.object==='apple'?Apple:t.object==='star'?Star:Diamond;
  return <div className="dq-count" role="group" aria-label="Hai nhóm đồ vật">
   {[t.left,t.right].map((count,index)=><React.Fragment key={index}>
    {index===1&&<b aria-hidden="true">+</b>}
    <div className="dq-count-group" role="group" aria-label={`Nhóm ${index+1}: ${count} vật`}>
     <span className="dq-count-label">Nhóm {index+1}</span>
     <div className="dq-count-items">{count>0?Array.from({length:count},(_,i)=><Icon aria-hidden="true" key={i} size={28}/>):<span className="dq-count-empty">Không có vật nào</span>}</div>
    </div>
   </React.Fragment>)}
  </div>;
 }
 if(t.kind==='clock'){return <svg viewBox="0 0 180 180" className="dq-clock" role="img" aria-label={`Đồng hồ kim giờ ở ${t.hour} giờ, kim phút ở ${t.minute} phút`}><circle cx="90" cy="90" r="84" fill="#fffcf1" stroke="#357466" strokeWidth="7"/>{Array.from({length:12},(_,i)=>{const a=(i+1)*Math.PI/6;return <text key={i} x={90+65*Math.sin(a)} y={96-65*Math.cos(a)} textAnchor="middle" fill="#284f48" fontSize="16" fontWeight="800">{i+1}</text>;})}<g strokeLinecap="round"><path d="M90 90V48" transform={`rotate(${t.hour*30+t.minute*.5} 90 90)`} stroke="#284f48" strokeWidth="7"/><path d="M90 90V30" transform={`rotate(${t.minute*6} 90 90)`} stroke="#bd693d" strokeWidth="4"/><circle cx="90" cy="90" r="6" fill="#284f48"/></g></svg>;}
 if(t.kind==='shape')return <svg viewBox="0 0 180 130" className="dq-shape" role="img" aria-label="Hình cần nhận biết"><g fill="#91b9a1" stroke="#326d60" strokeWidth="5" strokeLinejoin="round">{t.shape==='circle'?<circle cx="90" cy="65" r="51"/>:t.shape==='triangle'?<path d="M90 12 155 117H25Z"/>:<rect x={t.shape==='square'?39:16} y="14" width={t.shape==='square'?102:148} height="102" rx="4"/>}</g></svg>;
 if(t.kind==='color')return <span className="dq-color-orb" style={{background:COLORS[t.color].hex}} role="img" aria-label="Viên ngọc cần nhận biết màu"/>;
 return null;
}
export function QuestionView({session:s,onAnswer,onHint,onRead,onReady}:{session:Session;onAnswer:(value:string)=>void;onHint:()=>void;onRead:()=>void;onReady:()=>void}){
 const q=questionOf(s)!,a=attemptOf(s),feedback=s.phase==='feedback',reading=s.phase==='question'&&!s.questionReady,assist=!!a?.assisted;
 const [value,setValue]=useState(''),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(s.phase==='question')setValue('');},[q.slotId,s.phase]);
 useEffect(()=>{if(q.input&&s.questionReady)input.current?.focus({preventScroll:true});},[q.slotId,s.questionReady,q.input]);
 return <div className="dq-question">
  <div className="dq-question-top"><span>{q.input?'Điền đáp án':'Chọn một đáp án'}</span><button className="dq-icon dq-read-question" aria-label={reading?"Dừng đọc và bắt đầu trả lời":"Đọc lại câu hỏi"} title={reading?"Dừng đọc và bắt đầu trả lời":"Đọc lại câu hỏi"} aria-pressed={reading} disabled={s.phase!=='question'} onClick={reading?onReady:onRead}>{reading?<VolumeX size={20}/>:<Volume2 size={20}/>}</button></div>
  <h2 id="dq-question-text" tabIndex={-1}>{q.text}</h2><Visual task={q.task}/>
  {s.config.mode==='challenge'&&<div className="dq-timer" aria-label={`Còn ${Math.ceil((timeLimit(s)-s.questionMs)/1000)} giây`}><span style={{width:`${Math.max(0,100-s.questionMs/timeLimit(s)*100)}%`}}/><b>{Math.max(0,Math.ceil((timeLimit(s)-s.questionMs)/1000))}s</b></div>}
  {q.input?<form className="dq-answer-form" onSubmit={e=>{e.preventDefault();if(value.trim())onAnswer(value);}}><input ref={input} aria-label="Đáp án của em" inputMode="numeric" autoComplete="off" maxLength={7} value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9]/g,''))} disabled={feedback||!s.questionReady} placeholder="?"/><button className="dq-primary" disabled={feedback||!s.questionReady||!value} type="submit">Trả lời</button></form>:<div className="dq-options" role="group" aria-labelledby="dq-question-text">{q.options.map((o,i)=><button key={o.id} disabled={feedback||!s.questionReady} className={`dq-answer ${feedback&&o.text===q.answer?'is-correct':''} ${feedback&&!s.feedback?.correct&&s.feedback?.answer===o.id?'is-wrong':''}`} onClick={()=>onAnswer(o.id)}><span>{String.fromCharCode(65+i)}</span>{o.text}</button>)}</div>}
  {assist&&!s.feedback?.correct&&<p className="dq-hint"><Lightbulb size={18}/><span>{q.hint}</span></p>}
  {!feedback&&!assist&&<button className="dq-text-button" onClick={onHint}><Lightbulb size={16}/> Cùng rồng gợi ý</button>}
  {feedback&&<div className={`dq-feedback ${s.feedback?.correct?'good':'retry'}`} role="status"><strong>{s.feedback?.correct?(s.combo>=3?`Liên tiếp ${s.combo} câu đúng!`:'Đúng rồi, phép thuật đã sáng!'):s.feedback?.timedOut?'Hết giờ rồi. Cùng xem lại nhé.':'Chưa đúng. Cùng xem đáp án nhé.'}</strong><p>{q.explanation}</p></div>}
 </div>;
}






