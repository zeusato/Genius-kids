import React,{useState,useEffect,useRef} from 'react';
import type {StudentProfile} from '../../types';
import type {Level} from '../data/english/schema';
import {LEVELS,LEVEL_NAMES} from './catalog';
import {loadContent} from './content';
import {listAI,saveAI,deleteAI,generateDrafts,type AIDraft,type AIKind} from './ai';
import {AIAgentSettingsModal} from '../components/AIAgentSettingsModal';
const plain=(value:unknown)=>typeof value==='string'?value:'';
const names:Record<AIKind,string>={sentences:'Mẫu câu',vocab:'Từ vựng',passages:'Đoạn đọc',rewrites:'Viết lại câu',phrases:'Cụm từ ngắn'};
export function ParentContent({student}:{student:StudentProfile}) {
  const [level,setLevel]=useState<Level>('A1'),[kind,setKind]=useState<AIKind>('vocab'),[items,setItems]=useState<AIDraft[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[settings,setSettings]=useState(false);
  const controller=useRef<AbortController|null>(null),active=useRef(true);
  async function refresh(){const items=await listAI(student.id);if(active.current)setItems(items);}
  useEffect(()=>{active.current=true;void refresh().catch(()=>setError('Chưa đọc được kho nội dung AI.'));return()=>{active.current=false;controller.current?.abort();};},[student.id]);
  async function generate(){
    setBusy(true);setError('');const abort=new AbortController();controller.current=abort;const timer=setTimeout(()=>abort.abort(),60000);
    try {const key=localStorage.getItem('mathgenius_gemini_key');if(!key||!student.aiEnabled)throw new Error('Mở cài đặt AI, nhập khóa và bật AI cho hồ sơ này trước.');await generateDrafts(key,kind,await loadContent(level),student.id,abort.signal);if(active.current)await refresh();}
    catch(e){if(active.current)setError(abort.signal.aborted?'Đã dừng yêu cầu hoặc quá thời gian. Thư viện có sẵn vẫn dùng được.':e instanceof Error?e.message:'Chưa tạo được nội dung.');}
    finally{clearTimeout(timer);if(active.current)setBusy(false);}
  }
  async function review(item:AIDraft,status:'approved'|'rejected'|'delete'){
    setError('');try{if(status==='delete')await deleteAI(student.id,item.id);else await saveAI([{...item,reviewStatus:status,reviewedAt:new Date().toISOString()}]);await refresh();}catch(e){setError(e instanceof Error?e.message:'Chưa lưu được thay đổi.');}
  }
  const kinds:AIKind[]=level==='K'?['vocab','phrases']:level==='C3'?['vocab','passages','rewrites']:['vocab','sentences'];
  return <section className="en-setup en-parent"><span className="en-eyebrow">GÓC PHỤ HUYNH</span><h1>Thêm những bài học nhỏ</h1><p>AI tạo bản nháp để phụ huynh đọc và duyệt. Chỉ nội dung được duyệt mới xuất hiện trong luyện tập; bài kiểm tra dùng thư viện đã biên soạn.</p><button className="en-text-link" onClick={()=>setSettings(true)}>Cài đặt khóa AI</button>
    <label>Chủ đề<select value={level} disabled={busy} onChange={e=>{setLevel(e.target.value as Level);setKind('vocab');}}>{LEVELS.map(l=><option key={l} value={l}>{LEVEL_NAMES[l]}</option>)}</select></label><label>Loại nội dung<select value={kind} disabled={busy} onChange={e=>setKind(e.target.value as AIKind)}>{kinds.map(k=><option key={k} value={k}>{names[k]}</option>)}</select></label>
    <button className="en-button" disabled={busy} onClick={generate}>{busy?'Đang tạo bản nháp…':'Tạo 3 bản nháp'}</button>{busy&&<button className="en-text-link" onClick={()=>controller.current?.abort()}>Hủy yêu cầu</button>}
    <p className="en-small">Đã lưu {items.length}/200 mục trên thiết bị này. Giới hạn 2 MB cho mỗi hồ sơ.</p>{error&&<p className="en-notice en-error" role="alert">{error}</p>}
    {items.slice().reverse().map(item=>{const c=item.content as any;return <article className="en-chapter" key={item.id}><span className="en-eyebrow">{LEVEL_NAMES[item.level]} · {item.reviewStatus==='approved'?'ĐÃ DUYỆT':item.reviewStatus==='rejected'?'ĐÃ CÁCH LY':'CHỜ DUYỆT'}</span><h2>{plain(c?.en)||plain(c?.promptEn)||'Nội dung lỗi'}</h2><p>{plain(c?.vi)}</p>{plain(c?.exampleEn)&&<p>{plain(c.exampleEn)} — {plain(c.exampleVi)}</p>}{plain(c?.answer)&&<p>Đáp án: {plain(c.answer)}</p>}<details><summary>Xem toàn bộ nội dung và đáp án</summary><div>{plain(c?.promptVi)&&<p>Yêu cầu: {plain(c.promptVi)}</p>}{plain(c?.hint)&&<p>Gợi ý: {plain(c.hint)}</p>}{Array.isArray(c?.alt)&&<p>Chấp nhận thêm: {c.alt.filter(x=>typeof x==='string').join(' / ')}</p>}{Array.isArray(c?.questions)&&c.questions.map((q:any,i:number)=><div key={i}><p><strong>{plain(q?.q)}</strong></p><p>Lựa chọn: {Array.isArray(q?.options)?q.options.filter(x=>typeof x==='string').join(' · '):'Tự trả lời'}</p><p>Đáp án: {plain(q?.answer)}</p><p>{plain(q?.explain)}</p></div>)}{Array.isArray(c?.blanks)&&c.blanks.map((b:any,i:number)=><p key={i}>{plain(b?.promptVi)} → {plain(b?.answer)}. {plain(b?.hint)}</p>)}{Array.isArray(c?.tokens)&&<p>Từ loại: {c.tokens.map((t:any)=>plain(t?.text)+' ('+plain(t?.pos)+')').join(' · ')}</p>}</div></details>{item.errors.length>0&&<p className="en-error">{item.errors.join('; ')}</p>}<div className="en-chapter-actions"><button className="en-button" disabled={!!item.errors.length||item.reviewStatus==='approved'} onClick={()=>review(item,'approved')}>Duyệt cho luyện tập</button><button className="en-text-link" onClick={()=>review(item,'rejected')}>Loại</button><button className="en-text-link" onClick={()=>review(item,'delete')}>Xóa</button></div></article>;})}
    {settings&&<AIAgentSettingsModal onClose={()=>setSettings(false)}/>}
  </section>;
}
