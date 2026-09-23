import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bookmark, Check, RotateCcw, Search } from 'lucide-react';
import type { StudentProfile } from '../../types';
import type { Vocab, Pos } from '../data/english/schema';
import type { EnglishContent } from './content';
import { LEVELS, LEVEL_NAMES } from './catalog';
import { POS_NAMES } from './model';
import { AudioButton } from './LessonParts';
import { useLibrary } from './useLibrary';
import { shuffle } from './engine';
import { activityPool, makeSession } from './activities';
import { saveSession } from './storage';

export function VocabularyLab({ content, student }: { content: EnglishContent; student: StudentProfile }) {
  const navigate = useNavigate();
  const { entries, save, error: storageError, ready } = useLibrary(student.id);
  const [mode,setMode]=useState<'dictionary'|'cards'|'saved'>('dictionary');
  const [query,setQuery]=useState(''),[pos,setPos]=useState('all'),[page,setPage]=useState(0);
  const [scope,setScope]=useState('all'),[direction,setDirection]=useState('en-vi');
  const [deck,setDeck]=useState<Vocab[]>([]),[index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[remembered,setRemembered]=useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const note=(v:Vocab)=>entries.find(e=>e.id==='word:'+v.id);
  const saved=content.vocab.filter(v=>note(v)?.saved);
  const matching=content.vocab.filter(v=>(mode!=='saved'||note(v)?.saved)&&`${v.en} ${v.vi} ${v.exampleEn}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))&&(pos==='all'||v.pos===pos));
  const cardWords=scope==='all'?content.vocab:scope==='saved'?saved:saved.filter(v=>note(v)?.status!=='remembered');
  const active=deck[index];
  async function toggle(v:Vocab){setBusy(true);await save({id:'word:'+v.id,level:v.level,saved:!note(v)?.saved,status:note(v)?.status||'learning'});setBusy(false);}
  function startCards(){setDeck(shuffle(cardWords).slice(0,10));setIndex(0);setRevealed(false);setRemembered(0);}
  async function rate(known:boolean){
    setBusy(true);
    if(await save({id:'word:'+active.id,level:active.level,saved:true,status:known?'remembered':'learning'})){setRemembered(n=>n+Number(known));setIndex(n=>n+1);setRevealed(false);}
    setBusy(false);
  }
  async function practice(kind:'meaning'|'spelling'){
    setBusy(true);setError('');
    try{const bundle={...content,vocab:saved};const count=Math.min(10,activityPool(bundle,kind).length);if(count<5)throw new Error('Cần ít nhất 5 từ phù hợp đã lưu để mở bài luyện. Với đánh vần, hãy lưu các từ đơn không có dấu cách.');const session=makeSession([bundle],student.id,'practice',count,kind);await saveSession(session,null);navigate('/english/practice?session='+session.id);}
    catch(e){setError(e instanceof Error?e.message:'Chưa mở được bài luyện.');setBusy(false);}
  }
  return <section className="book-vocab"><header className="book-vocab-heading"><div><span className="en-eyebrow">GÓC TỪ VỰNG</span><h1>Gặp một từ.<br/><em>Nhớ thêm một điều.</em></h1></div><label>Chủ đề<select value={content.level} onChange={e=>navigate('/english/vocabulary?level='+e.target.value)}>{LEVELS.map(l=><option key={l} value={l}>{LEVEL_NAMES[l]}</option>)}</select><small>{content.vocab.length} từ · {saved.length} từ đã lưu</small></label></header>
    <div className="book-mode-switch" role="group" aria-label="Cách học từ vựng">{([['dictionary','Từ điển'],['cards','Thẻ ghi nhớ'],['saved','Bộ từ của em']] as const).map(([value,title])=><button key={value} aria-pressed={mode===value} onClick={()=>{setMode(value);setPage(0);setDeck([]);setError('');}}>{title}</button>)}</div>
    {(error||storageError)&&<p className="en-notice en-error" role="alert">{error||storageError}</p>}
    {mode==='cards'?<div className="book-flash-workspace"><aside><span className="en-eyebrow">THỬ NHỚ TRƯỚC KHI LẬT</span><h2>Mười từ mỗi lượt</h2><p>Đọc mặt trước, tự nói đáp án rồi lật thẻ kiểm tra. Những từ cần ôn sẽ ở lại bộ từ của em.</p><label>Bộ thẻ<select value={scope} disabled={!!deck.length} onChange={e=>setScope(e.target.value)}><option value="all">Tất cả từ trong chương</option><option value="saved">Từ đã lưu</option><option value="learning">Từ cần ôn thêm</option></select></label><label>Mặt trước<select value={direction} disabled={!!deck.length} onChange={e=>setDirection(e.target.value)}><option value="en-vi">Tiếng Anh → nghĩa tiếng Việt</option><option value="vi-en">Nghĩa tiếng Việt → tiếng Anh</option></select></label>{!deck.length?<button className="en-button" disabled={!ready||!cardWords.length} onClick={startCards}>Bắt đầu {Math.min(10,cardWords.length)} thẻ <ArrowRight size={16}/></button>:<button className="en-text-link" onClick={()=>setDeck([])}>Chọn lại bộ thẻ</button>}<p className="en-small">“Đã nhớ” là tự đánh giá của em. Kết quả kiểm tra kiến thức được lưu riêng.</p></aside>
      <div className="book-flash-stage">{!deck.length?<div className="book-flash-intro"><Bookmark size={42}/><h2>Sẵn sàng thử trí nhớ?</h2><p>{cardWords.length?'Chọn bộ thẻ rồi bắt đầu.':'Chưa có từ trong bộ này. Hãy lưu từ ở từ điển trước nhé.'}</p></div>:active?<><span className="en-eyebrow">THẺ {index+1} / {deck.length}</span><div className="book-flashcard"><small>{direction==='en-vi'?'TỪ NÀY CÓ NGHĨA LÀ GÌ?':'EM NHỚ TỪ TIẾNG ANH NÀO?'}</small><h2 lang={direction==='en-vi'?'en':'vi'}>{direction==='en-vi'?active.en:active.vi}</h2>{direction==='en-vi'&&<AudioButton text={active.en}/>}<button className="en-text-link" aria-expanded={revealed} onClick={()=>setRevealed(true)} disabled={revealed}>Lật thẻ xem đáp án <RotateCcw size={16}/></button>{revealed&&<div className="book-flash-answer"><h3>{direction==='en-vi'?active.vi:active.en}</h3><p>{active.ipa} · {POS_NAMES[active.pos]}</p><p lang="en">{active.exampleEn}</p><p>{active.exampleVi}</p><AudioButton text={active.exampleEn}/></div>}</div><div className="book-flash-actions"><button className="en-secondary" disabled={!revealed||busy} onClick={()=>rate(false)}>Cần ôn thêm</button><button className="en-button" disabled={!revealed||busy} onClick={()=>rate(true)}><Check size={17}/>Em đã nhớ</button></div></>:<div className="book-flash-intro" role="status"><Check size={42}/><h2>Đã xem hết {deck.length} thẻ</h2><p>Em tự nhớ được {remembered}/{deck.length} từ. Các từ đã được lưu để em luyện tiếp.</p><button className="en-button" onClick={()=>{setMode('saved');setDeck([]);}}>Xem bộ từ của em</button></div>}</div>
    </div>:<>
      {mode==='saved'&&<div className="book-saved-intro"><div><h2>Những từ em muốn giữ lại</h2><p>Từ đã lưu của chương này. Luyện lại để nhớ cả nghĩa lẫn cách viết.</p></div><div className="en-chapter-actions"><button className="en-secondary" disabled={busy||!ready||!saved.length} onClick={()=>practice('meaning')}>Luyện nghĩa</button><button className="en-button" disabled={busy||!ready||!saved.length} onClick={()=>practice('spelling')}>Luyện đánh vần</button></div></div>}
      <div className="book-dictionary-tools"><label className="en-search"><Search size={18}/><input aria-label="Tìm từ vựng" placeholder="Tìm từ, nghĩa hoặc câu ví dụ…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label><select aria-label="Lọc loại từ" value={pos} onChange={e=>{setPos(e.target.value);setPage(0);}}><option value="all">Mọi loại từ</option>{[...new Set(content.vocab.map(v=>v.pos))].map(p=><option key={p} value={p}>{POS_NAMES[p as Pos]}</option>)}</select><span>{matching.length} từ</span></div>
      <div className="book-dictionary">{matching.slice(page*8,page*8+8).map(v=><article key={v.id}><div className="book-word-heading"><div>{v.image&&!v.image.includes('/')&&<span className="book-word-image">{v.image}</span>}<h2 lang="en">{v.en}</h2><small>{v.ipa} · {POS_NAMES[v.pos]}</small></div><AudioButton text={v.en}/><button className="en-icon" disabled={!ready||busy} aria-pressed={!!note(v)?.saved} aria-label={`${note(v)?.saved?'Bỏ lưu':'Lưu từ'} ${v.en}`} onClick={()=>toggle(v)}><Bookmark size={18} fill={note(v)?.saved?'currentColor':'none'}/></button></div><p className="book-word-meaning">{v.vi}</p><details><summary>Ví dụ & cách dùng</summary><div className="book-word-example"><p lang="en">{v.exampleEn}</p><AudioButton text={v.exampleEn}/><p>{v.exampleVi}</p>{v.forms&&<dl>{Object.entries(v.forms).filter(([k])=>k!=='irregular').map(([k,value])=><div key={k}><dt>{({plural:'Số nhiều',thirdSg:'Ngôi thứ ba số ít',past:'Quá khứ',ing:'Dạng -ing'})[k]}</dt><dd>{String(value)}</dd></div>)}</dl>}</div></details>{mode==='saved'&&<small className="book-word-status">{note(v)?.status==='remembered'?'Tự đánh giá: đã nhớ':'Cần ôn thêm'}</small>}</article>)}</div>
      {!matching.length&&<p className="en-empty">{mode==='saved'&&!query?'Chưa có từ đã lưu. Mở từ điển và nhấn dấu trang bên cạnh từ em muốn học.':'Chưa tìm thấy từ phù hợp. Thử thay từ khóa hoặc bộ lọc nhé.'}</p>}
      <nav className="book-pagination" aria-label="Trang từ điển"><button className="en-secondary" disabled={!page} onClick={()=>setPage(p=>p-1)}><ArrowLeft size={17}/>Trước</button><span>{page+1} / {Math.max(1,Math.ceil(matching.length/8))}</span><button className="en-secondary" disabled={(page+1)*8>=matching.length} onClick={()=>setPage(p=>p+1)}>Tiếp <ArrowRight size={17}/></button></nav>
    </>}
    <Link className="en-text-link" to={`/english/learn/${content.level}`}>Về chương {LEVEL_NAMES[content.level]} <ArrowRight size={16}/></Link>
  </section>;
}
