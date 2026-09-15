import React, { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpDown, Bot, Check, ChevronRight, CircleHelp, Flag, Handshake, Layers, Pause, Play, RotateCcw, Settings2, Users, Volume2, VolumeX, X } from 'lucide-react';
import { applyMove, finishMatch, legalMoves, newMatch, capturedPieces } from './engine';
import { loadDraft, saveDraft, persistStandaloneResult } from './persistence';
import { BotController } from './bot-controller';
import { GameAudio } from './audio';
import { PIECE_NAMES, END_NAMES, LEVEL_NAMES, SIDE_NAMES } from './model';
import type { Match, Move, Player, Level, Side } from './model';
import type { Motion } from './Board3D';
import PieceIcon from './PieceIcon';
import Board2D from './Board2D';
import cover from './assets/cover.webp';
import './co-vua.css';
const Board3D=lazy(()=>import('./Board3D'));
interface Prefs {flat:boolean;light:boolean;view:'top'|'angled';sound:boolean;reduced:boolean}
const defaults:Prefs={flat:false,light:false,view:'angled',sound:true,reduced:typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches};
function readPrefs(owner:string):Prefs {try {const raw=JSON.parse(localStorage.getItem(`co-vua:${owner}:prefs`)||'{}');return {...defaults,...Object.fromEntries(['flat','light','sound','reduced'].filter(k=>typeof raw[k]==='boolean').map(k=>[k,raw[k]])),view:raw.view==='top'?'top':'angled'};}catch{return defaults;}}
class Boundary extends Component<{children:React.ReactNode;onFail():void},{failed:boolean}> {state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFail();}render(){return this.state.failed?null:this.props.children;}}
function Dialog({title,children,onClose}:{title:string;children:React.ReactNode;onClose():void}) {
  const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const d=ref.current!;d.showModal();return()=>d.close();},[]);
  return <dialog ref={ref} className='cv-dialog' aria-labelledby='cv-dialog-title' onCancel={e=>{e.preventDefault();onClose();}}><div className='cv-dialog-heading'><h2 id='cv-dialog-title'>{title}</h2><button className='cv-icon' onClick={onClose} aria-label='Đóng'><X/></button></div>{children}</dialog>;
}
const clock=(ms:number)=>`${Math.floor(ms/60000).toString().padStart(2,'0')}:${Math.floor(ms/1000)%60<10?'0':''}${Math.floor(ms/1000)%60}`;
const prettyMove=(text:string)=>`${text.slice(0,2)}–${text.slice(2,4)}${text[4]?'='+text[4].toUpperCase():''}`;
type Owner={id:string;name:string};
/** Standalone contract: a host can supply a durable completion callback when integrating. */
export function CoVua({owner={id:'co-vua-standalone',name:'Bạn'},onExit,initialMatch,complete}:{owner?:Owner;onExit?:()=>void;initialMatch?:Match;complete?:(match:Match)=>boolean}) {
  const [match,setMatch]=useState<Match|null>(initialMatch??null), current=useRef(match);
  const [draft,setDraft]=useState(()=>loadDraft(owner.id)),[prefs,setPrefs]=useState(()=>readPrefs(owner.id));
  const [mode,setMode]=useState<'bot'|'human'>('bot'),[level,setLevel]=useState<Level>('medium'),[ownerSide,setOwnerSide]=useState<Side>(0);
  const [flip,setFlip]=useState(initialMatch?.ownerSide===1),[selected,setSelected]=useState<number|null>(null),[motion,setMotion]=useState<Motion|null>(null);
  const [modal,setModal]=useState<'help'|'settings'|'resign'|'draw'|'lobby'|null>(null),[promotion,setPromotion]=useState<Move[]|null>(null),[paused,setPaused]=useState(false),[handoff,setHandoff]=useState(false);
  const [hidden,setHidden]=useState(document.hidden),[saved,setSaved]=useState(true),[resultSaved,setResultSaved]=useState(false),[notice,setNotice]=useState(''),[elapsed,setElapsed]=useState(initialMatch?.elapsed??0);
  const controller=useRef(new BotController()),audio=useRef(new GameAudio()),baseTime=useRef(initialMatch?.elapsed??0),runningAt=useRef<number|null>(null),recorded=useRef('');
  const blocked=paused||hidden||!!modal||!!promotion||handoff||!!motion;
  const totalTime=useCallback(()=>baseTime.current+(runningAt.current===null?0:performance.now()-runningAt.current),[]);
  const store=useCallback((m:Match)=>{const ok=saveDraft(m);setSaved(ok);return ok;},[]);
  const publish=useCallback((m:Match)=>{current.current=m;setMatch(m);store(m);},[store]);
  const tryResult=useCallback((m:Match)=>{if(recorded.current===m.id)return;let ok=false;try{ok=complete?complete(m):persistStandaloneResult(m);}catch{}setResultSaved(ok);if(ok)recorded.current=m.id;},[complete]);
  useEffect(()=>{try{localStorage.setItem(`co-vua:${owner.id}:prefs`,JSON.stringify(prefs));}catch{}},[prefs,owner.id]);
  useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[]);
  useEffect(()=>{
    if(!match||match.phase==='over'||blocked)return;
    runningAt.current=performance.now();const timer=setInterval(()=>setElapsed(totalTime()),1000);
    const save=setInterval(()=>{if(current.current)store({...current.current,elapsed:totalTime()});},5000);
    return()=>{baseTime.current=totalTime();runningAt.current=null;clearInterval(timer);clearInterval(save);};
  },[match?.id,match?.phase,blocked,totalTime,store]);
  useEffect(()=>{
    const save=(event?:Event)=>{if(current.current){const ok=saveDraft({...current.current,elapsed:totalTime()});if(event?.type==='cv-before-update'&&!ok){event.preventDefault();setSaved(false);}}};
    window.addEventListener('pagehide',save);window.addEventListener('cv-before-update',save);
    return()=>{save();window.removeEventListener('pagehide',save);window.removeEventListener('cv-before-update',save);controller.current.cancel();audio.current.dispose();};
  },[totalTime]);
  useEffect(()=>{if(match?.phase==='over')tryResult(match);},[match,tryResult]);
  useEffect(()=>{if(!motion)return;const timer=setTimeout(()=>setMotion(null),motion.duration+25);return()=>clearTimeout(timer);},[motion]);
  const commit=useCallback((move:Move)=>{
    const before=current.current;if(!before)return;const next=applyMove(before,move).match;if(next===before)return;
    const capture=before.board[move.to]!==0||((before.board[move.from]&7)===1&&move.to===before.epSquare);
    next.elapsed=totalTime();publish(next);setSelected(null);setPromotion(null);setNotice('');
    if(!prefs.reduced)setMotion({...move,at:performance.now(),duration:340});
    if(next.phase==='play'&&next.players.every(p=>p.kind==='human'))setHandoff(true);
    if(prefs.sound)audio.current.play(next.phase==='over'?'finish':next.inCheck?'check':capture?'capture':'move');
  },[prefs.reduced,prefs.sound,publish,totalTime]);
  const moves=useMemo(()=>match?legalMoves(match):[],[match]);
  useEffect(()=>{
    if(!match||blocked||match.phase!=='play')return;
    controller.current.start(match,moves,(move,fallback)=>{if(current.current?.id!==match.id||current.current.revision!==match.revision)return;commit(move);if(fallback)setNotice('Máy gặp gián đoạn, đã dùng một nước đi dự phòng hợp lệ.');});
    return()=>controller.current.cancelPending();
  },[match,moves,blocked,commit]);
  const onFailure=useCallback(()=>{setPrefs(p=>({...p,flat:true}));setNotice('Thiết bị đã chuyển sang bàn 2D. Ván cờ được giữ nguyên.');},[]);
  const start=(resume?:Match)=>{
    controller.current.cancel();const human:Player={id:owner.id,name:owner.name,kind:'human',avatar:'',level},other:Player={id:mode==='bot'?'bot':'guest',name:mode==='bot'?`Máy ${LEVEL_NAMES[level]}`:'Bạn cùng chơi',kind:mode,avatar:'',level};
    const players:[Player,Player]=ownerSide===0?[human,other]:[other,human];const m=resume??newMatch(owner.id,players,crypto.randomUUID(),ownerSide);
    baseTime.current=m.elapsed;runningAt.current=null;setElapsed(m.elapsed);setFlip(m.ownerSide===1);setPaused(false);setHandoff(false);setSelected(null);setMotion(null);setModal(null);setPromotion(null);setResultSaved(false);recorded.current='';setNotice('');publish(m);window.scrollTo({top:0,behavior:'instant'});
  };
  const pick=(sq:number)=>{
    if(!match||blocked||match.phase==='over'||match.players[match.active].kind==='bot')return;
    if(sq<0){setSelected(null);return;}const options=selected===null?[]:moves.filter(m=>m.from===selected&&m.to===sq);
    if(options.length>1){setPromotion(options);return;}if(options.length===1){commit(options[0]);return;}
    if(match.board[sq]&&((match.board[sq]<9?0:1)===match.active)){setSelected(sq===selected?null:sq);if(prefs.sound)audio.current.play('select');}else setSelected(null);
  };
  const leave=()=>{controller.current.cancel();if(current.current)store({...current.current,elapsed:totalTime()});setDraft(loadDraft(owner.id));current.current=null;setMatch(null);setModal(null);setPaused(false);setHandoff(false);setMotion(null);onExit?.();};
  const end=(reason:'resign'|'agreement')=>{if(!match)return;const side=match.players.some(p=>p.kind==='bot')?match.ownerSide:match.active;publish({...finishMatch(match,reason,side),elapsed:totalTime()});setModal(null);setHandoff(false);if(prefs.sound)audio.current.play('finish');};
  const targets=selected===null?[]:moves.filter(m=>m.from===selected).map(m=>m.to), active=match?.players[match.active];
  const turnText=match?.phase==='over'?END_NAMES[match.reason!]:paused?'Ván cờ đang tạm dừng':match?.inCheck?'Vua đang bị chiếu':active?.kind==='bot'?'Máy đang suy nghĩ…':`Lượt ${SIDE_NAMES[match?.active??0]}`;
  const playerBar=(side:Side)=>match&&<div className={`cv-player ${match.active===side&&match.phase==='play'?'active':''}`}><span className={`cv-avatar ${side?'ebony':'ivory'}`}><PieceIcon code={side?14:6}/></span><div><strong>{match.players[side].name}</strong><small>{SIDE_NAMES[side]}{match.players[side].kind==='bot'?` · Máy ${LEVEL_NAMES[match.players[side].level]}`:side===match.ownerSide?' · Bạn':' · Người chơi'}</small></div><span className='cv-player-state'>{match.active===side&&match.phase==='play'?<><i/>{match.players[side].kind==='bot'?'Đang nghĩ':'Đến lượt'}</>:side===match.ownerSide?clock(elapsed):'Cờ tự do'}</span></div>;
  const captures=useMemo(()=>match?capturedPieces(match):[[],[]],[match]);
  return <div className='cv-app'>
    <header className='cv-header'><div className='cv-brand'><span className='cv-brand-mark'><PieceIcon code={2}/></span><div><strong>Cờ Vua</strong><small>Câu lạc bộ trí tuệ</small></div></div><nav>{match&&<button className='cv-text-button' aria-label='Phòng chơi' onClick={()=>setModal('lobby')}><ArrowLeft/><span>Phòng chơi</span></button>}<button className='cv-icon' aria-label='Luật chơi' onClick={()=>setModal('help')}><CircleHelp/></button><button className='cv-icon' aria-label={prefs.sound?'Tắt âm thanh':'Bật âm thanh'} onClick={()=>setPrefs(p=>({...p,sound:!p.sound}))}>{prefs.sound?<Volume2/>:<VolumeX/>}</button></nav></header>
    {!match?<main className='cv-lobby'><section className='cv-intro'><span className='cv-eyebrow'>64 ô cờ · Muôn vàn ý tưởng</span><h1>Mỗi nước cờ,<br/><em>một khám phá.</em></h1><p>Chậm một nhịp, nghĩ thêm một bước.<br/>Cùng rèn trí tuệ qua một ván cờ thật vui.</p><div className='cv-cover'><img src={cover} alt='Bộ cờ Staunton trong căn phòng ngập nắng' fetchPriority='high'/><span>Bàn gỗ cổ điển <i/> Quân Staunton</span></div><div className='cv-lobby-note'><span><Check/> Chơi khi không có mạng</span><span><Check/> Tự lưu ván đang chơi</span></div></section>
      <section className='cv-setup'><span className='cv-eyebrow'>Mời bạn vào bàn</span><h2>Một ván cờ mới</h2><p>Chọn bạn chơi, chọn màu quân. Sẵn sàng!</p><fieldset><legend>Chơi cùng ai?</legend><div className='cv-choice-row'>{(['bot','human'] as const).map(m=><button key={m} className={`cv-mode ${mode===m?'chosen':''}`} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m==='bot'?<Bot/>:<Users/>}<strong>{m==='bot'?'Chơi với máy':'Hai người'}</strong><small>{m==='bot'?'Luyện tập mỗi ngày':'Chung một thiết bị'}</small></button>)}</div></fieldset>
      {mode==='bot'&&<fieldset><legend>Độ khó</legend><div className='cv-segment'>{(['easy','medium','hard'] as const).map(l=><button key={l} className={level===l?'chosen':''} aria-pressed={level===l} onClick={()=>setLevel(l)}>{LEVEL_NAMES[l]}</button>)}</div><small className='cv-hint'>{level==='easy'?'Làm quen quân cờ và cách di chuyển.':level==='medium'?'Thử những ý tưởng và học cách phòng thủ.':'Tính kỹ hơn trước mỗi nước đi.'}</small></fieldset>}
      <fieldset><legend>Bạn cầm quân</legend><div className='cv-choice-row'>{([0,1] as const).map(side=><button key={side} className={`cv-color ${ownerSide===side?'chosen':''}`} aria-pressed={ownerSide===side} onClick={()=>setOwnerSide(side)}><PieceIcon code={side?14:6}/><span><strong>{SIDE_NAMES[side]}</strong><small>{side?'Đi sau':'Đi trước'}</small></span>{ownerSide===side&&<Check/>}</button>)}</div></fieldset><button className='cv-primary cv-start' onClick={()=>start()}>Vào bàn cờ <ArrowRight/></button>
      {draft.match&&<button className='cv-resume' onClick={()=>start(draft.match!)}><RotateCcw/><span><strong>{draft.match.phase==='over'?'Xem ván gần nhất':'Tiếp tục ván đang chơi'}</strong><small>{draft.match.turn} nước · {clock(draft.match.elapsed)}</small></span><ChevronRight/></button>}{draft.error&&<p className='cv-warning'>Bản lưu cũ không hợp lệ hoặc không đọc được. Bạn có thể bắt đầu ván mới.</p>}<p className='cv-setup-foot'>Không giới hạn thời gian. Cứ thong thả suy nghĩ.</p></section>
    </main>:<main className='cv-play-layout'><section className='cv-table-area'><div className='cv-table-heading'><div><span className='cv-eyebrow'>Phòng cờ buổi sáng</span><h1>Bàn gỗ cổ điển</h1></div><div className='cv-view-switch' aria-label='Chế độ bàn cờ'><button aria-pressed={!prefs.flat} className={!prefs.flat?'chosen':''} onClick={()=>setPrefs(p=>({...p,flat:false}))}>3D</button><button aria-pressed={prefs.flat} className={prefs.flat?'chosen':''} onClick={()=>setPrefs(p=>({...p,flat:true}))}>2D</button></div></div>
      {playerBar(flip?0:1)}<div className='cv-board-stage'>{(()=>{const props={match,flip,view:prefs.view,light:prefs.light,selected,targets,interactive:!blocked&&match.phase==='play'&&active?.kind==='human',motion,onPick:pick,onFailure};return prefs.flat?<Board2D {...props}/>:<Boundary onFail={onFailure}><Suspense fallback={<div className='cv-board-loading'><PieceIcon code={2}/><p>Đang chuẩn bị bàn cờ…</p></div>}><Board3D {...props}/></Suspense></Boundary>;})()}
        {(paused||handoff)&&!motion&&match.phase==='play'&&<div className='cv-board-curtain'><span className='cv-curtain-piece'><PieceIcon code={match.active?14:6}/></span><h2>{handoff?`Lượt ${match.players[match.active].name}`:'Nghỉ một chút nhé'}</h2><p>{handoff?`Chuyển thiết bị cho người cầm quân ${SIDE_NAMES[match.active].toLowerCase()}.`:'Ván cờ sẽ tiếp tục khi bạn sẵn sàng.'}</p><button className='cv-primary' onClick={()=>{setHandoff(false);setPaused(false);}}><Play/>{handoff?'Sẵn sàng':'Tiếp tục chơi'}</button></div>}
      </div>{playerBar(flip?1:0)}<div className='cv-board-tools'><button onClick={()=>setFlip(v=>!v)}><ArrowUpDown/>Đổi hướng</button><button onClick={()=>setPrefs(p=>({...p,view:p.view==='top'?'angled':'top'}))} disabled={prefs.flat}><Layers/>{prefs.view==='top'?'Góc nghiêng':'Nhìn từ trên'}</button><button onClick={()=>setModal('settings')}><Settings2/>Tùy chỉnh</button></div>
      </section><aside className='cv-sidebar'><section className={`cv-status ${match.inCheck&&match.phase==='play'?'is-check':''}`} aria-live='polite'><span className='cv-eyebrow'>{match.phase==='over'?'Ván cờ kết thúc':`Nước ${match.fullmove} · ${SIDE_NAMES[match.active]}`}</span><h2>{turnText}</h2><p>{match.phase==='over'?match.winner===null?'Một ván hòa. Hẹn gặp ở ván tiếp theo.':`${match.players[match.winner].name} giành chiến thắng.`:selected===null?'Chọn một quân cờ để xem các ô có thể đi.':`${PIECE_NAMES[match.board[selected]&7]} ${'abcdefgh'[selected%8]}${Math.floor(selected/8)+1} · Chọn ô được đánh dấu để đi.`}</p></section>
      <section className='cv-history'><div className='cv-section-heading'><h3>Nhật ký ván cờ</h3><span>{match.turn} nước</span></div><div className='cv-history-head'><span>#</span><span>Trắng</span><span>Đen</span></div><ol className='cv-move-list'>{Array.from({length:Math.ceil(match.history.length/2)},(_,i)=><li key={i}><span>{i+1}.</span><span>{prettyMove(match.history[i*2])}</span><span>{match.history[i*2+1]?prettyMove(match.history[i*2+1]):'…'}</span></li>)}</ol>{!match.history.length&&<div className='cv-history-empty'><PieceIcon code={1}/><p>Nước đi đầu tiên<br/>đang chờ bạn.</p></div>}</section>
      <section className='cv-captures'><h3>Quân đã bắt</h3>{([0,1] as const).map(side=><div key={side}><span>{SIDE_NAMES[side]}</span><div>{captures[side].length?captures[side].map((code,i)=><PieceIcon code={code} key={i}/>):<small>Chưa có</small>}</div></div>)}</section>
      <div className='cv-game-actions'>{match.phase==='play'?<><button className='cv-secondary' onClick={()=>setPaused(v=>!v)}>{paused?<Play/>:<Pause/>}{paused?'Tiếp tục':'Tạm dừng'}</button><button className='cv-secondary' onClick={()=>setModal('resign')}><Flag/>Xin thua</button>{match.players.every(p=>p.kind==='human')&&<button className='cv-draw' onClick={()=>setModal('draw')}><Handshake/>Thỏa thuận hòa</button>}</>:<button className='cv-primary' onClick={leave}>Chơi ván mới <ArrowRight/></button>}</div>
      <div className='cv-save-state' role='status'>{saved?<><Check/>Đã lưu trên thiết bị</>:<>Chưa lưu được ván.<button onClick={()=>store({...match,elapsed:totalTime()})}>Thử lại</button></>}{match.phase==='over'&&!resultSaved&&<p>Chưa ghi được kết quả. <button onClick={()=>tryResult(match)}>Thử lại</button></p>}</div>
      </aside>{notice&&<p className='cv-notice' role='status'>{notice}</p>}</main>}
    <footer className='cv-footer'><span>Cờ Vua · Genius Kids</span><span>Chơi vui. Nghĩ sâu. Lớn từng ngày.</span></footer>
    {modal&&<Dialog title={{help:'Cùng học cờ vua',settings:'Theo cách bạn thích',resign:'Kết thúc bằng xin thua?',draw:'Hai bạn đồng ý hòa?',lobby:'Trở về phòng chơi?'}[modal]} onClose={()=>setModal(null)}>
      {modal==='help'?<div className='cv-help'><p>Mục tiêu là <strong>chiếu bí Vua đối phương</strong>: Vua bị tấn công và không còn cách thoát.</p><div className='cv-piece-guide'>{[6,5,4,3,2,1].map((t,i)=><div key={t}><PieceIcon code={t}/><p><strong>{PIECE_NAMES[t]}</strong><span>{['Một ô ở mọi hướng. Không được đi vào ô bị tấn công.','Đi thẳng và chéo, không giới hạn ô.','Đi thẳng theo hàng hoặc cột.','Đi chéo, luôn giữ màu ô.','Đi hình chữ L, có thể nhảy qua quân khác.','Tiến một ô, bắt chéo; từ vị trí đầu có thể tiến hai ô.'][i]}</span></p></div>)}</div><p><strong>Luật đặc biệt:</strong> nhập thành, bắt tốt qua đường và phong cấp đều được hỗ trợ. Chọn quân để xem các nước hợp lệ.</p><p>Trong phiên bản này, lặp thế cờ ba lần hoặc đủ 50 nước không bắt quân, không đi Tốt sẽ <strong>tự động hòa</strong>. Đây là quy ước chơi nhanh của ứng dụng.</p><p>Chế độ 2D: dùng phím mũi tên để chọn ô, Enter để chọn quân hoặc đi, Esc để bỏ chọn.</p></div>:modal==='settings'?<div className='cv-settings'>{([['light','Đồ họa nhẹ','Giảm độ phân giải và tắt bóng đổ.'],['reduced','Giảm chuyển động','Quân đến vị trí mới ngay lập tức.'],['sound','Âm thanh quân cờ','Âm nhẹ khi chọn, đi và bắt quân.']] as const).map(([key,label,description])=><label key={key}><span><strong>{label}</strong><small>{description}</small></span><input type='checkbox' checked={prefs[key]} onChange={e=>setPrefs(p=>({...p,[key]:e.target.checked}))}/></label>)}</div>:<><p>{modal==='resign'?`${match?.players[match.players.some(p=>p.kind==='bot')?match.ownerSide:match.active].name} sẽ nhận kết quả thua ván này.`:modal==='draw'?'Chỉ xác nhận khi cả hai người chơi cùng đồng ý kết thúc ván hòa.':'Ván hiện tại được lưu trên thiết bị để bạn tiếp tục sau.'}</p><div className='cv-dialog-actions'><button className='cv-secondary' onClick={()=>setModal(null)}>Chơi tiếp</button><button className='cv-primary' onClick={()=>modal==='lobby'?leave():end(modal==='resign'?'resign':'agreement')}>{modal==='lobby'?'Về phòng chơi':modal==='resign'?'Xác nhận xin thua':'Cả hai đồng ý'}</button></div></>}
    </Dialog>}
    {promotion&&<Dialog title='Chọn quân phong cấp' onClose={()=>setPromotion(null)}><p>Tốt đã đến hàng cuối. Bạn muốn đổi thành quân nào?</p><div className='cv-promotions'>{promotion.map(move=>{const type={q:5,r:4,b:3,n:2}[move.promote!];return <button key={move.promote} onClick={()=>commit(move)}><PieceIcon code={type+(match!.active?8:0)}/><strong>{PIECE_NAMES[type]}</strong></button>;})}</div></Dialog>}
  </div>;
}
export default CoVua;
