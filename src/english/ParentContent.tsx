import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Settings2, Sparkles } from 'lucide-react';
import type { StudentProfile } from '../../types';
import type { Level } from '../data/english/schema';
import { LEVELS, LEVEL_NAMES, isLevel } from './catalog';
import { loadContent } from './content';
import { listAI, saveAI, deleteAI, generateDrafts, type AIDraft, type AIKind } from './ai';
import { makeAIPractice } from './aiPractice';
import { saveSession } from './storage';
import { AIAgentSettingsModal } from '../components/AIAgentSettingsModal';

const plain=(value:unknown)=>typeof value==='string'?value:'';
const names:Record<AIKind,string>={sentences:'Ngữ pháp & mẫu câu',vocab:'Từ vựng',passages:'Đọc hiểu',rewrites:'Viết lại câu',phrases:'Cụm từ giao tiếp'};
export function ParentContent({student}:{student:StudentProfile}) {
  const [params]=useSearchParams();
  const navigate=useNavigate();
  const initial=params.get('level');
  const [level,setLevel]=useState<Level>(isLevel(initial)?initial:'A1');
  const [kind,setKind]=useState<AIKind>(initial==='K'?'phrases':initial==='C3'?'passages':'sentences');
  const [count,setCount]=useState<3|5>(5),[difficulty,setDifficulty]=useState<1|2|3>(1),[theme,setTheme]=useState('');
  const [items,setItems]=useState<AIDraft[]>([]),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[settings,setSettings]=useState(false);
  const [filter,setFilter]=useState<'all'|'draft'|'approved'|'rejected'>('all');
  const controller=useRef<AbortController|null>(null),active=useRef(true);
  async function refresh(){const rows=await listAI(student.id);if(active.current)setItems(rows);}
  useEffect(()=>{active.current=true;void refresh().catch(()=>setError('Chưa đọc được kho nội dung AI.'));return()=>{active.current=false;controller.current?.abort();};},[student.id]);
  async function generate(){
    setBusy(true);setError('');setMessage('');
    const abort=new AbortController();controller.current=abort;
    const timer=setTimeout(()=>abort.abort(),60000);
    try {
      const key=localStorage.getItem('mathgenius_gemini_key');
      if(!key||!student.aiEnabled)throw new Error('Mở cài đặt AI, nhập khóa Gemini và bật AI cho hồ sơ này trước.');
      const drafts=await generateDrafts(key,kind,await loadContent(level),student.id,abort.signal,{count,difficulty,theme});
      if(active.current){await refresh();setFilter('all');setMessage(`Đã nhận ${drafts.length} mục. ${drafts.filter(d=>!d.errors.length).length} mục chờ phụ huynh đọc và duyệt.`);}
    }catch(e){if(active.current)setError(abort.signal.aborted?'Đã dừng hoặc hết thời gian chờ. Em vẫn có thể luyện từ thư viện có sẵn.':e instanceof Error?e.message:'Chưa tạo được nội dung.');}
    finally{clearTimeout(timer);if(active.current)setBusy(false);}
  }
  async function review(item:AIDraft,status:'approved'|'rejected'|'delete'){
    setSaving(true);setError('');
    try{if(status==='delete')await deleteAI(student.id,item.id);else await saveAI([{...item,reviewStatus:status,reviewedAt:new Date().toISOString()}]);await refresh();}
    catch(e){if(active.current)setError(e instanceof Error?e.message:'Chưa lưu được thay đổi.');}
    finally{if(active.current)setSaving(false);}
  }
  async function start(){
    setSaving(true);setError('');
    try{
      const bundle=await loadContent(level);
      const {session}=makeAIPractice(bundle,await listAI(student.id),student.id,kind);
      if(!active.current)return;
      await saveSession(session,null);
      if(active.current)navigate('/english/practice?session='+session.id);
    }catch(e){if(active.current)setError(e instanceof Error?e.message:'Chưa mở được bài luyện.');}
    finally{if(active.current)setSaving(false);}
  }
  const kinds:AIKind[]=level==='K'?['vocab','phrases']:level==='C3'?['vocab','passages','rewrites']:['sentences','vocab'];
  const current=items.filter(item=>item.level===level&&item.kind===kind);
  const approved=current.filter(item=>item.reviewStatus==='approved'&&!item.errors.length);
  const shown=current.filter(item=>filter==='all'||item.reviewStatus===filter).slice().reverse();
  return <section className="book-ai">
    <header><span className="en-eyebrow">XƯỞNG RA ĐỀ · CÙNG PHỤ HUYNH</span><h1>Thêm câu hỏi mới,<br/><em>đúng điều đang học.</em></h1><p>Chọn nội dung để AI soạn bài. Phụ huynh xem câu hỏi và đáp án, duyệt rồi mở một bài luyện ngay tại đây.</p></header>
    <ol className="book-ai-steps"><li><span>1</span>Chọn kiến thức</li><li><span>2</span>Tạo & duyệt câu hỏi</li><li><span>3</span>Mở bài luyện</li></ol>
    <div className="book-ai-layout"><section className="book-ai-config"><span className="en-eyebrow">01 / SOẠN BÀI</span><h2>Hôm nay luyện gì?</h2>
      <button className="en-text-link" onClick={()=>setSettings(true)}><Settings2 size={16}/>Cài đặt AI {student.aiEnabled?'· Đã bật cho hồ sơ':'· Chưa bật cho hồ sơ'}</button>
      <fieldset disabled={busy||saving}><label>Kiến thức<select value={level} onChange={e=>{const l=e.target.value as Level;setLevel(l);setKind(l==='K'?'phrases':l==='C3'?'passages':'sentences');setMessage('');}}>{LEVELS.map(l=><option key={l} value={l}>{LEVEL_NAMES[l]}</option>)}</select></label>
      <label>Dạng nội dung<select value={kind} onChange={e=>{setKind(e.target.value as AIKind);setMessage('');}}>{kinds.map(k=><option key={k} value={k}>{names[k]}</option>)}</select></label>
      <div className="book-ai-row"><label>Số mục<select value={count} onChange={e=>setCount(Number(e.target.value) as 3|5)}><option value={3}>3 mục</option><option value={5}>5 mục</option></select></label><label>Độ khó<select value={difficulty} onChange={e=>setDifficulty(Number(e.target.value) as 1|2|3)}><option value={1}>Làm quen</option><option value={2}>Luyện thêm</option><option value={3}>Thử thách</option></select></label></div>
      <label>Bối cảnh yêu thích <small>Không bắt buộc</small><input value={theme} maxLength={180} placeholder="Ví dụ: động vật, bóng đá, chuyến đi biển…" onChange={e=>setTheme(e.target.value)}/></label>
      <button className="en-button" disabled={busy||saving} onClick={generate}><Sparkles size={17}/>{busy?'Đang soạn câu hỏi…':`Tạo ${count} mục mới`}</button></fieldset>
      {busy&&<button className="en-text-link" onClick={()=>controller.current?.abort()}>Hủy yêu cầu</button>}
      <p className="en-small">AI dùng khóa Gemini trong cài đặt. Chỉ kiến thức và bối cảnh trên được gửi để soạn bài; không gửi hồ sơ hay lịch sử học.</p>
      <p className="en-small">Kho của hồ sơ: {items.length}/200 mục · tối đa 2 MB.</p>
    </section><section className="book-ai-review"><div className="en-section-heading"><div><span className="en-eyebrow">02 / ĐỌC VÀ DUYỆT</span><h2>Câu hỏi của chương</h2></div><select aria-label="Lọc trạng thái bản nháp" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">Tất cả · {current.length}</option><option value="draft">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Đã loại / có lỗi</option></select></div>
      {message&&<p className="en-notice" role="status">{message}</p>}{error&&<p className="en-notice en-error" role="alert">{error}</p>}
      {!shown.length&&<div className="book-ai-empty"><Sparkles size={32}/><h3>{current.length?'Chưa có mục ở trạng thái này.':'Bắt đầu với một ý tưởng nhỏ.'}</h3><p>Chọn chương và tạo nội dung ở bên cạnh. Câu hỏi mới sẽ xuất hiện tại đây để đọc, kiểm tra và duyệt.</p></div>}
      {shown.map(item=>{const c=item.content as any;return <article className="book-draft" key={item.id}><span className="en-eyebrow">{item.reviewStatus==='approved'?'ĐÃ DUYỆT':item.reviewStatus==='rejected'?'ĐÃ LOẠI / CÓ LỖI':'CHỜ PHỤ HUYNH DUYỆT'}</span><h3 lang="en">{plain(c?.title)||plain(c?.en)||plain(c?.promptEn)||'Nội dung không hợp lệ'}</h3>{c?.title&&<p lang="en">{plain(c.en)}</p>}<p>{plain(c?.vi)}</p>
        {plain(c?.exampleEn)&&<p>{plain(c.exampleEn)} — {plain(c.exampleVi)}</p>}
        {plain(c?.promptVi)&&<p>Yêu cầu: {plain(c.promptVi)}</p>}
        {plain(c?.answer)&&<p><strong>Đáp án:</strong> {plain(c.answer)}</p>}
        <details><summary>Xem câu hỏi, lời giải & cách phân tích</summary>
          {plain(c?.hint)&&<p>Gợi ý: {plain(c.hint)}</p>}
          {Array.isArray(c?.alt)&&<p>Chấp nhận thêm: {c.alt.filter((x:unknown)=>typeof x==='string').join(' / ')}</p>}
          {Array.isArray(c?.questions)&&c.questions.map((q:any,i:number)=><div className="book-draft-question" key={i}><p><strong>{plain(q?.q)}</strong></p><p>Lựa chọn: {Array.isArray(q?.options)?q.options.filter((x:unknown)=>typeof x==='string').join(' · '):q?.type==='tf'?'Đúng / Sai':'Tự trả lời'}</p><p>Đáp án: {plain(q?.answer)}{Array.isArray(q?.alt)&&' / '+q.alt.filter((x:unknown)=>typeof x==='string').join(' / ')}</p><p>{plain(q?.explain)}</p></div>)}
          {Array.isArray(c?.blanks)&&c.blanks.map((b:any,i:number)=><p key={i}>{plain(b?.promptVi)} → <strong>{plain(b?.answer)}</strong>{Array.isArray(b?.alt)&&' / '+b.alt.filter((x:unknown)=>typeof x==='string').join(' / ')}. {plain(b?.hint)}</p>)}
          {Array.isArray(c?.tokens)&&<p>Từ loại: {c.tokens.map((t:any)=>plain(t?.text)+' ('+plain(t?.pos)+')').join(' · ')}</p>}
          {Array.isArray(c?.roleSpans)&&<p>Cụm vai trò: {c.roleSpans.map((s:any)=>plain(s.role)+': '+(Array.isArray(s.tokenIndices)?s.tokenIndices.map((i:number)=>plain(c.tokens?.[i]?.text)).join(' '):'')).join(' · ')}</p>}
          {Array.isArray(c?.orderAlternatives)&&<p>Cách xếp khác: {c.orderAlternatives.filter((x:unknown)=>typeof x==='string').join(' / ')}</p>}
        </details>
        {item.errors.length>0&&<p className="en-notice en-error">{item.errors.join('; ')}</p>}
        <div className="en-chapter-actions"><button className="en-secondary" disabled={busy||saving||!!item.errors.length||item.reviewStatus==='approved'} onClick={()=>review(item,'approved')}><Check size={16}/>Duyệt câu này</button><button className="en-text-link" disabled={busy||saving||item.reviewStatus==='rejected'} onClick={()=>review(item,'rejected')}>Loại</button><button className="en-text-link" disabled={busy||saving} onClick={()=>review(item,'delete')}>Xóa</button></div></article>;})}
    </section></div>
    <section className="book-ai-launch"><div><span className="en-eyebrow">03 / DÙNG BÀI VỪA SOẠN</span><h2>{approved.length} mục đã duyệt để luyện</h2><p>Bài luyện 5 câu ưu tiên nội dung AI đã duyệt của chủ đề và dạng đang chọn. Nếu chưa đủ, thêm câu từ thư viện có sẵn. Bài kiểm tra “Đã vững” vẫn dùng nội dung đã biên soạn.</p></div><button className="en-button" disabled={busy||saving||!approved.length} onClick={start}>Mở bài luyện <ArrowRight size={18}/></button></section>
    <Link className="en-text-link" to="/english/workshop">Về bàn ôn luyện</Link>
    {settings&&<AIAgentSettingsModal onClose={()=>setSettings(false)}/>}
  </section>;
}
