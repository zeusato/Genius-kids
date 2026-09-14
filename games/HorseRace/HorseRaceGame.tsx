import React,{Component,lazy,Suspense,useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Box,Square,Bot,Check,Crown,Dices,HelpCircle,Leaf,Pause,Play,Plus,RotateCcw,Settings2,ShieldCheck,Sun,UserRound,Users,Volume2,VolumeX,X} from 'lucide-react';
import {useStudent,useStudentActions} from '../../src/contexts/StudentContext';
import {useMusicControls} from '../../src/contexts/MusicContext';
import {getAvatarById} from '../../services/avatarService';
import {musicManager} from '../../services/musicManager';
import {MusicTrack} from '../../services/musicConfig';
import type {StudentProfile} from '../../types';
import {newMatch,roll,pass,applyMove,legalMoves} from './engine';
import {chooseMove} from './bot';
import {loadDraft,saveDraft,loadParty,saveParty} from './persistence';
import {throwDice,randomInt} from './rng';
import {TEAM_CORNERS} from './board';
import {BOT_NAMES,LEVEL_NAMES,TEAMS,Match,Player,Level,Move} from './model';
import type {Motion} from './Board3D';
import type {SeatProjection} from './BoardCamera';
import type {BoardView,BoardFrame} from './view';
import Board2D from './Board2D';
import './horse-race.css';
import './immersive.css';
const Board3D=lazy(()=>import('./Board3D'));
const art=(name:string)=>`${import.meta.env.BASE_URL}horse-race/art/${name}.webp`;
interface Prefs {view:BoardView;light:boolean;flat:boolean;reduced:boolean;fast:boolean;handoff:boolean}
const defaults:Prefs={view:'tilted',light:false,flat:false,reduced:typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,fast:false,handoff:false};
function preferences(owner:string):Prefs{try{const p=JSON.parse(localStorage.getItem('horse-race-prefs:'+owner)||'{}');return Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,k==='view'?(p.view==='straight'||p.view==='tilted'?p.view:v):typeof p[k]==='boolean'?p[k]:v])) as unknown as Prefs;}catch{return defaults;}}
class Boundary extends Component<{children:React.ReactNode;fallback:React.ReactNode;onFail:()=>void},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return{error:true};}componentDidCatch(){this.props.onFail();}render(){return this.state.error?this.props.fallback:this.props.children;}}
function Avatar({player}:{player:Player}){const a=getAvatarById(player.avatar);return <span className='hr-avatar' style={{background:TEAMS[player.color].light,color:TEAMS[player.color].color}}>{player.kind==='bot'?<Bot size={25}/>:a?.isEmoji?<span className='hr-emoji'>{a.imagePath}</span>:a?<img src={a.imagePath} alt=''/>:<UserRound size={25}/>}</span>;}
function Dialog({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>dialog.close();},[]);
 return <dialog ref={ref} className='hr-dialog' onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className='hr-dialog-top'><h2>{title}</h2><button className='hr-icon' onClick={onClose} aria-label='Đóng'><X/></button></div>{children}</dialog>;
}
function diceSound(enabled:boolean,win=false){if(!enabled)return;try{const C=window.AudioContext||(window as any).webkitAudioContext;if(!C)return;const ctx=new C();void ctx.resume();[0,1,2].forEach((i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=(win?523:340)*[1,1.25,1.5][i];g.gain.setValueAtTime(.06,ctx.currentTime+i*.075);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.075+.12);o.start(ctx.currentTime+i*.075);o.stop(ctx.currentTime+i*.075+.14);});setTimeout(()=>void ctx.close(),450);}catch{/* Audio is optional. */}}
export default function ConnectedHorseRace({onExit}:{onExit:()=>void}){
 const {currentStudent}=useStudent(),{completeHorseRace}=useStudentActions(),sound=useMusicControls();
 return currentStudent?<HorseRace key={currentStudent.id} student={currentStudent} onExit={onExit} complete={completeHorseRace} sound={sound}/>:null;
}
type Sound={soundEnabled:boolean;musicEnabled:boolean;toggleSound:()=>void;toggleMusic:()=>void};
export function HorseRace({student,onExit,complete,sound,initialMatch,manageMusic=true}:{student:StudentProfile;onExit:()=>void;complete:(owner:string,s:Match)=>{ok:boolean};sound:Sound;initialMatch?:Match;manageMusic?:boolean}){
 const [party,setParty]=useState<Player[]>(()=>{const saved=loadParty(student.id),host:Player={id:'host',name:student.name,color:saved?.[0]?.color??0,kind:'human',avatar:student.currentAvatarId,level:'medium'};return saved?[host,...saved.slice(1)]:[host,{id:'bot-2',name:'Máy Lá',color:2,kind:'bot',level:student.grade===0?'easy':'medium',avatar:'avatar_17'}];});
 const [draft,setDraft]=useState(()=>loadDraft(student.id));
 const [match,setMatch]=useState<Match|null>(initialMatch||null),live=useRef(match);
 const [motion,setMotion]=useState<Motion|null>(null),motionRef=useRef<Motion|null>(null);
 const [paused,setPaused]=useState(false),pausedRef=useRef(false);
 const [prefs,setPrefs]=useState(()=>preferences(student.id));
 const [dialog,setDialog]=useState<'settings'|'guide'|'leave'|null>(null);
 const [message,setMessage]=useState(''),[saved,setSaved]=useState(true),[recorded,setRecorded]=useState<boolean|null>(null),attempted=useRef('');
 const [ready,setReady]=useState(false),[handoff,setHandoff]=useState(false),[botReason,setBotReason]=useState(''),[newGameWarning,setNewGameWarning]=useState(false);
 const boardRef=useRef<HTMLDivElement>(null),stageRef=useRef<HTMLDivElement>(null);
 const [frame,setFrame]=useState<BoardFrame>();
 const [cameraReset,setCameraReset]=useState(0),[freeView,setFreeView]=useState(false);
 const badges=useRef(new Map<number,HTMLDivElement>());
 const onManualView=useCallback(()=>setFreeView(true),[]);
 const selectView=(view:BoardView)=>{setFreeView(false);setCameraReset(n=>n+1);setPrefs(p=>({...p,view,flat:false}));};
 const onSeats=useCallback((seats:SeatProjection)=>{
   for(const seat of seats){const badge=badges.current.get(seat.color);if(!badge)continue;
     badge.style.setProperty('--seat-x',seat.x.toFixed(1)+'px');badge.style.setProperty('--seat-y',seat.y.toFixed(1)+'px');
   }
 },[]);
 useLayoutEffect(()=>{
   if(!match||!boardRef.current||!stageRef.current)return;
   const measure=()=>{const board=boardRef.current!.getBoundingClientRect(),stage=stageRef.current!.getBoundingClientRect();
     const next={left:stage.left-board.left,top:stage.top-board.top,width:stage.width,height:stage.height};
     if(next.width>0&&next.height>0)setFrame(old=>old&&Object.keys(next).every(k=>old[k as keyof BoardFrame]===next[k as keyof BoardFrame])?old:next);
   };
   const observer=new ResizeObserver(measure);observer.observe(boardRef.current);observer.observe(stageRef.current);measure();return()=>observer.disconnect();
 },[!!match]);
 useEffect(()=>{if(!match)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[!!match]);
 const clock=useRef(performance.now()),worker=useRef<Worker|null>(null),request=useRef(0);
 const update=useCallback((s:Match)=>{live.current=s;setMatch(s);setSaved(saveDraft(s));},[]);
 const animate=useCallback((m:Motion)=>{motionRef.current=m;setMotion(m);},[]);
 const pauseGame=useCallback(()=>{pausedRef.current=true;setPaused(true);worker.current?.terminate();worker.current=null;request.current++;},[]);
 const resume=()=>{pausedRef.current=false;setPaused(false);clock.current=performance.now();};
 const makeMove=useCallback((piece:number)=>{
   const s=live.current;if(!s||pausedRef.current||motionRef.current)return;
   const move=legalMoves(s).find(m=>m.piece===piece);if(!move)return;
   const n=applyMove(s,piece);animate({id:n.revision,before:s,move,duration:prefs.reduced?100:prefs.fast?340:move.kind==='walk'?Math.max(500,(move.to-move.from)*190):750});update(n);diceSound(sound.soundEnabled,n.winner!==null);
 },[animate,update,prefs.fast,prefs.reduced,sound.soundEnabled]);
 const toss=useCallback(()=>{const s=live.current;if(!s||s.phase!=='roll'||motionRef.current||pausedRef.current)return;const d=throwDice(),n=roll(s,d);animate({id:n.revision,before:s,dice:d,duration:prefs.reduced?100:prefs.fast?380:780});update(n);setBotReason('');diceSound(sound.soundEnabled);},[animate,update,prefs.fast,prefs.reduced,sound.soundEnabled]);
 useEffect(()=>{if(!motion||paused)return;const timer=setTimeout(()=>{motionRef.current=null;setMotion(null);},motion.duration+70);return()=>clearTimeout(timer);},[motion,paused]);
 useEffect(()=>{live.current=match;},[match]);
 useEffect(()=>{const onHide=()=>{if(document.hidden&&live.current?.phase!=='over')pauseGame();};document.addEventListener('visibilitychange',onHide);window.addEventListener('pagehide',pauseGame);return()=>{document.removeEventListener('visibilitychange',onHide);window.removeEventListener('pagehide',pauseGame);worker.current?.terminate();if(live.current)saveDraft(live.current);};},[pauseGame]);
 useEffect(()=>{const timer=setInterval(()=>{const now=performance.now(),dt=now-clock.current;clock.current=now;const s=live.current;if(s&&!pausedRef.current&&!document.hidden&&s.phase!=='over'){live.current={...s,elapsed:s.elapsed+Math.min(dt,2000)};setSaved(saveDraft(live.current));}},1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{try{localStorage.setItem('horse-race-prefs:'+student.id,JSON.stringify(prefs));}catch{/* Preferences do not block gameplay. */}},[prefs,student.id]);
 useEffect(()=>{if(!manageMusic)return;musicManager.playTrack(MusicTrack.DRAGON_FOREST);return()=>{musicManager.setPaused(false);musicManager.resumeRouteMusic();};},[manageMusic]);
 useEffect(()=>{if(manageMusic)musicManager.setPaused(paused);},[paused,manageMusic]);
 useEffect(()=>{setHandoff(false);},[match?.active,match?.id]);
 const doRecord=useCallback(()=>{const s=live.current;if(s?.phase==='over'){const result=complete(student.id,s);setRecorded(result.ok);}},[student.id,complete]);
 useEffect(()=>{if(match?.phase==='over'&&!motion&&attempted.current!==match.id){attempted.current=match.id;doRecord();}},[match?.phase,match?.id,motion,doRecord]);
 useEffect(()=>{
   const s=match;if(!s||s.phase==='over'||paused||motion||dialog||!ready)return;
   const bot=s.players[s.active].kind==='bot';
   if(s.phase==='choose'&&!legalMoves(s).length){const timer=setTimeout(()=>{const current=live.current;if(current?.id===s.id&&current.revision===s.revision&&!pausedRef.current)update(pass(current));},prefs.fast?450:1050);return()=>clearTimeout(timer);}
   if(!bot)return;
   if(s.phase==='roll'){const timer=setTimeout(toss,prefs.fast?250:650);return()=>clearTimeout(timer);}
   const token=`${s.id}:${s.revision}:${++request.current}`,level=s.players[s.active].level;let cancelled=false,settled=false,timeout:ReturnType<typeof setTimeout>;
   const accept=(piece:number|null,reason:string)=>{const current=live.current;if(cancelled||settled||pausedRef.current||current?.id!==s.id||current.revision!==s.revision)return;settled=true;setBotReason(reason);if(piece!==null)makeMove(piece);};
   const fallback=()=>{if(cancelled||settled)return;clearTimeout(timeout);worker.current?.terminate();worker.current=null;const result=chooseMove(s,level,{rollouts:0});setMessage('Máy đang dùng chế độ tính gọn để ván tiếp tục.');accept(result.piece,result.reason);};
   try{const w=new Worker(new URL('./bot.worker.ts',import.meta.url),{type:'module'});worker.current=w;timeout=setTimeout(fallback,2200);w.onmessage=e=>{if(e.data.request!==token||e.data.revision!==s.revision||e.data.matchId!==s.id)return;if(!legalMoves(s).some(m=>m.piece===e.data.piece)){fallback();return;}clearTimeout(timeout);accept(e.data.piece,e.data.reason);w.terminate();};w.onerror=fallback;w.postMessage({state:s,level,request:token});}catch{fallback();}
   return()=>{cancelled=true;clearTimeout(timeout);worker.current?.terminate();worker.current=null;};
 },[match?.revision,match?.id,paused,motion,dialog,ready,prefs.fast,makeMove,toss,update]);
 const begin=()=>{
   const names=party.map(p=>p.name.normalize('NFC').trim());if(names.some(n=>!n)){setMessage('Điền tên cho mỗi bạn nhé.');return;}if(new Set(names.map(n=>n.toLocaleLowerCase('vi'))).size!==names.length){setMessage('Chọn tên khác nhau để dễ gọi lượt nhé.');return;}
   const hostColor=party[0].color;const players=party.map((p,i)=>({...p,name:names[i]})).sort((a,b)=>(a.color-hostColor+4)%4-(b.color-hostColor+4)%4);setParty(players);saveParty(student.id,players);setNewGameWarning(false);setMessage('');setRecorded(null);setBotReason('');setHandoff(false);resume();setReady(prefs.flat);update(newMatch(student.id,players,crypto.randomUUID(),randomInt(players.length)));
 };
 const exitToLobby=()=>{worker.current?.terminate();setDraft(loadDraft(student.id));motionRef.current=null;setMotion(null);live.current=null;setMatch(null);setDialog(null);resume();};
 const patch=(i:number,p:Partial<Player>)=>{setParty(old=>old.map((v,j)=>i===j?{...v,...p}:v));setMessage('');};
 const add=(kind:Player['kind'])=>{const color=[2,1,3,0].find(c=>!party.some(p=>p.color===c));if(color===undefined)return;setParty(p=>[...p,{id:crypto.randomUUID(),name:kind==='bot'?'Máy '+BOT_NAMES[color]:'Bạn '+(p.length+1),color,kind,level:student.grade===0?'easy':'medium',avatar:'avatar_0'+(color+2)}]);setMessage('');};
 const unavailable=useCallback(()=>{setPrefs(p=>({...p,flat:true}));setReady(true);setMessage('Đã chuyển sang bàn 2D để giữ ván đang chơi.');},[]);
 const onReady=useCallback(()=>{setReady(true);setFreeView(false);},[]);
 useEffect(()=>{if(prefs.flat)setReady(true);},[prefs.flat]);
 const active=match?.players[match.active],displayPlayer=motion?motion.before.players[motion.before.active]:active,shownDice=match?.dice||motion?.dice||motion?.before.dice||0;
 const moves=match?legalMoves(match):[],needHandoff=!!(prefs.handoff&&active?.kind==='human'&&!handoff&&match?.phase!=='over'),canPlay=!!match&&!paused&&!motion&&!dialog&&ready&&!needHandoff&&active?.kind==='human';
 const boardProps=match?{state:match,motion,paused,reduced:prefs.reduced,light:prefs.light,view:prefs.view,cameraReset,onManualView,onSeats,frame,enabled:canPlay,moves,onPick:makeMove,onFailure:unavailable,onReady}:null;
 return <div className={'hr-root'+(match?' hr-immersive':'')+(match?.phase==='over'?' hr-finished':'')}>
  <header className='hr-header'><button className='hr-icon' aria-label={match?'Tạm dừng':'Về danh sách trò chơi'} onClick={()=>{if(match){pauseGame();setDialog('leave');}else onExit();}}>{match?<Pause size={21}/>:<ArrowLeft size={21}/>}</button><div className='hr-brand'><span>GENIUS KIDS · CÙNG NHAU CHƠI</span><strong>Cờ Cá Ngựa</strong></div><div className='hr-header-tools'><button className='hr-icon' onClick={sound.toggleSound} aria-label={sound.soundEnabled?'Tắt âm thanh':'Bật âm thanh'}>{sound.soundEnabled?<Volume2 size={20}/>:<VolumeX size={20}/>}</button><button className='hr-icon' onClick={()=>{if(match)pauseGame();setDialog('guide');}} aria-label='Luật chơi'><HelpCircle size={21}/></button><button className='hr-icon' onClick={()=>{if(match)pauseGame();setDialog('settings');}} aria-label='Cài đặt'><Settings2 size={21}/></button></div></header>
  {!match?<main className='hr-lobby'>
    <section className='hr-intro'><div className='hr-eyebrow'><Leaf size={16}/> KHU VƯỜN CỦA NHỮNG CUỘC ĐUA</div><h1>Bốn màu ngựa.<br/><em>Một bàn đầy tiếng cười.</em></h1><p>Rủ bạn ngồi lại, chọn màu yêu thích.<br/>Cuộc đua về chuồng sắp bắt đầu!</p><div className='hr-cover'><img src={art('cover')} alt='Bàn cờ đồ chơi với những chú ngựa bốn màu trong khu vườn' onError={e=>{e.currentTarget.style.visibility='hidden';}}/><span className='hr-cover-label'><Dices size={19}/> Ra 6 xuất quân · Ra 6 thêm lượt</span></div><div className='hr-promises'><span><Users size={17}/> 2–4 người</span><span><Bot size={17}/> Chơi cùng máy</span><span><ShieldCheck size={17}/> Lưu ván tự động</span></div></section>
    <section className='hr-party'><div className='hr-party-heading'><div><span className='hr-eyebrow'>SẴN SÀNG LÊN ĐƯỜNG</span><h2>Ai cùng chơi hôm nay?</h2></div><span className='hr-seat-count'>{party.length}<small>/4</small></span></div>
      <div className='hr-party-list'>{party.map((p,i)=><div className='hr-seat' key={p.id} style={{'--team':TEAMS[p.color].color} as React.CSSProperties}><Avatar player={p}/><div className='hr-seat-content'>{i===0?<><label>Chủ hồ sơ</label><strong className='hr-host-name'>{p.name}</strong></>:<label>{p.kind==='bot'?'Tên máy':'Tên của bạn'}<input aria-label={'Tên người chơi '+(i+1)} value={p.name} maxLength={20} onChange={e=>patch(i,{name:e.target.value})}/></label>}<div className='hr-seat-meta'><label className='hr-color-select'><span className='hr-color-dot' style={{background:TEAMS[p.color].color}}/><select aria-label={'Màu của '+p.name} value={p.color} onChange={e=>patch(i,{color:Number(e.target.value)})}>{TEAMS.map((t,c)=><option key={c} value={c} disabled={party.some((q,j)=>j!==i&&q.color===c)}>{t.name}</option>)}</select></label>{p.kind==='bot'?<label className='hr-level-select'><Bot size={14}/><select aria-label={'Độ khó của '+p.name} value={p.level} onChange={e=>patch(i,{level:e.target.value as Level})}>{Object.entries(LEVEL_NAMES).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>:i===0?<span><Crown size={13}/> Hồ sơ hiện tại</span>:<label className='hr-level-select'><select aria-label={'Avatar của '+p.name} value={p.avatar} onChange={e=>patch(i,{avatar:e.target.value})}>{['Chó con','Mèo con','Gấu trúc','Thỏ','Gấu','Cáo','Sư tử'].map((name,j)=><option key={j} value={'avatar_0'+(j+1)}>{name}</option>)}</select></label>}</div></div>{i>0&&<button className='hr-remove' aria-label={'Bỏ '+p.name} onClick={()=>setParty(old=>old.filter((_,j)=>j!==i))}><X size={17}/></button>}</div>)}</div>
      {party.length<4&&<div className='hr-add-row'><button onClick={()=>add('human')}><UserRound size={19}/><span>Thêm bạn</span><Plus size={16}/></button><button onClick={()=>add('bot')}><Bot size={19}/><span>Thêm máy</span><Plus size={16}/></button></div>}
      {message&&<p className='hr-notice' role='alert'>{message}</p>}
      <button className='hr-primary hr-start' disabled={party.length<2} onClick={()=>{if(draft.match?.phase!=='over'&&draft.match)setNewGameWarning(true);else begin();}}>Bắt đầu cuộc đua <ArrowRight size={20}/></button>
      {draft.match&&<button className='hr-resume' onClick={()=>{setParty(draft.match!.players);setRecorded(null);attempted.current='';setReady(prefs.flat);resume();update(draft.match!);}}> <Play size={16}/>{draft.match.phase==='over'?'Xem ván trước':'Tiếp tục ván đang chơi'}<span>{draft.match.players.length} người · lượt {draft.match.turn}</span></button>}
      {draft.error&&<p className='hr-notice'>Ván cũ không đọc được. Có thể bắt đầu ván mới nhé.</p>}
      <p className='hr-party-note'>Cùng một tablet. Mỗi người một lượt.<br/>Máy tự chơi, bạn chỉ cần chọn ngựa!</p>
    </section>
  </main>:<main className='hr-play'>

    <div className='hr-arena'><section className='hr-board-wrap'><div className='hr-board' ref={boardRef}>{boardProps&&(prefs.flat?<Board2D {...boardProps}/>:<Boundary fallback={<Board2D {...boardProps}/>} onFail={unavailable}><Suspense fallback={<div className='hr-loading'><Dices/>Đang dựng bàn cờ…</div>}><Board3D {...boardProps}/></Suspense></Boundary>)}</div><div className='hr-players-overlay' data-projected={!prefs.flat} ref={stageRef}>{match.players.map((p,i)=><div key={p.id} ref={node=>{if(node)badges.current.set(p.color,node);else badges.current.delete(p.color);}} className={'hr-player-badge corner-'+TEAM_CORNERS[p.color]+((motion?.before.active??match.active)===i?' is-active':'')} style={{'--team':TEAMS[p.color].color} as React.CSSProperties}><Avatar player={p}/><div><strong>{p.name}</strong><span>{p.kind==='bot'?'Máy · '+LEVEL_NAMES[p.level]:i===0?'Chủ hồ sơ':'Bạn chơi'} · {match.finished[i]}/4</span></div></div>)}</div>{!prefs.flat&&<div className='hr-camera-hint'>Kéo để xoay · Cuộn / chụm để thu phóng</div>}</section>
    <aside className='hr-turn-panel' aria-label='Xúc xắc và thao tác' data-phase={match.phase==='over'?'over':needHandoff?'handoff':'play'} style={{'--team':TEAMS[displayPlayer!.color].color} as React.CSSProperties}>
      <div className='hr-view-switch' role='group' aria-label='Góc nhìn bàn cờ'><span>Góc nhìn{freeView&&!prefs.flat?' · Tự do':''}</span><div><button type='button' aria-label='Góc nhìn thẳng' aria-pressed={prefs.flat||(!freeView&&prefs.view==='straight')} onClick={()=>selectView('straight')}><Square size={16}/>Thẳng</button><button type='button' aria-label='Góc nhìn nghiêng' aria-pressed={!prefs.flat&&!freeView&&prefs.view==='tilted'} onClick={()=>selectView('tilted')}><Box size={17}/>Nghiêng</button></div></div>
      <div className='hr-match-heading'><span className='hr-live-dot'/><span>Lượt {match.turn} · {saved?'Đã lưu':'Chưa lưu được'}</span></div>
      <div className='hr-turn-kicker'>{match.phase==='over'?'CUỘC ĐUA ĐÃ CÓ CHỦ NHÂN':motion?'NGỰA ĐANG LÊN ĐƯỜNG':'ĐẾN LƯỢT'}</div><div className='hr-turn-person'><Avatar player={displayPlayer!}/><h2>{displayPlayer!.name}</h2></div>
      <div className={'hr-die '+(motion?.dice?'rolling':'')} aria-label={'Xúc xắc '+(shownDice||'chưa gieo')}>{!shownDice&&<Dices className='hr-die-idle'/>}{Array.from({length:9},(_,i)=>{const value=shownDice;const map:{[n:number]:number[]}={0:[],1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};return <i key={i} className={map[value].includes(i)?'on':''}/>;})}</div>
      {match.phase==='over'?<><h3>{match.players[match.winner!].name} chiến thắng!</h3><p>Cả bốn ngựa đã về chuồng.</p><button className='hr-primary' onClick={begin}><RotateCcw size={18}/> Chơi lại cùng nhóm</button><button className='hr-secondary' onClick={exitToLobby}>Đổi người chơi</button><button className='hr-text-button' onClick={onExit}>Về danh sách trò chơi</button>{recorded===false&&<button className='hr-notice' onClick={doRecord}>Chưa lưu được kết quả. Chạm để thử lại.</button>}<span className='hr-save-note'>{recorded?'Đã lưu kết quả vào hồ sơ':''}</span></>:needHandoff?<><p>Chuyền máy cho {active!.name} nhé.</p><button className='hr-primary' onClick={()=>setHandoff(true)}><Play size={19}/> Sẵn sàng</button></>:<>
      <p className='hr-turn-help' role='status' aria-live='polite'>{motion?.dice?'Xúc xắc đang lăn…':motion?.move?motion.move.capture!==null?'Đá ngựa! Quay lại xuất phát nhé.':motion.move.kind==='home'?'Về chuồng an toàn!':'Từng bước tiến về đích.':match.phase==='roll'?active!.kind==='bot'?'Máy chuẩn bị gieo xúc xắc…':'Gieo xúc xắc để bắt đầu lượt.':!moves.length?'Chưa có nước đi. Chờ lượt tiếp nhé!':active!.kind==='bot'?'Máy đang tính nước đi…':match.dice===6?'Ra 6! Xuất thêm ngựa hoặc tiến lên.':'Chọn một ngựa đang sáng trên bàn.'}</p>
      {match.phase==='roll'||motion?.dice?<button className='hr-primary' disabled={!canPlay||match.phase!=='roll'} onClick={toss}><Dices size={22}/>{active!.kind==='bot'?'Máy đang chơi':'Gieo xúc xắc'}</button>:<div className='hr-move-choices'>{moves.map(m=><button key={m.piece} disabled={!canPlay} onClick={()=>makeMove(m.piece)}><span>Ngựa {m.piece%4+1}</span><small>{m.kind==='deploy'?'Xuất quân':m.capture!==null?'Đá ngựa':m.kind==='home'?'Vào ô '+(m.to-55):'Tiến '+match.dice+' ô'}</small></button>)}</div>}
      {botReason&&<span className='hr-bot-reason'><Bot size={14}/>{botReason}</span>}
      <div className='hr-turn-rule'><Sun size={18}/><span>Gieo được <strong>6</strong><br/>được thêm một lượt!</span></div><button className='hr-text-button' onClick={()=>{pauseGame();setDialog('leave');}}><Pause size={15}/> Nghỉ một chút</button></>}
    {message&&<div className='hr-status' role='status'>{message}<button aria-label='Ẩn thông báo' onClick={()=>setMessage('')}><X size={14}/></button></div>}
    {!saved&&<div className='hr-notice' role='alert'>Bộ nhớ chưa lưu được ván này. Giữ trang đang mở và thử lại.<button onClick={()=>{if(live.current)setSaved(saveDraft(live.current));}}>Thử lưu lại</button></div>}
    </aside></div>
    {paused&&!dialog&&<div className='hr-pause-overlay'><div><Pause size={30}/><h2>Cuộc đua đang nghỉ</h2><button className='hr-primary' onClick={resume}><Play size={20}/> Chơi tiếp</button></div></div>}
  </main>}
  {dialog==='guide'&&<Dialog title='Chơi cờ cá ngựa' onClose={()=>{setDialog(null);resume();}}><ol className='hr-guide'><li><strong>Gieo 6 để xuất quân.</strong> Chọn một ngựa ra ô xuất phát hoặc đi một ngựa khác. Ra 6 luôn được thêm lượt.</li><li><strong>Đi ngược chiều kim đồng hồ, đúng số ô.</strong> Theo mũi tên trên bàn. Ngựa sáng là quân có thể đi. Không vượt qua ngựa đang chắn, kể cả ngựa của mình.</li><li><strong>Dừng đúng ô để đá.</strong> Ngựa đối thủ trở về khu chờ và cần gieo 6 để ra lại.</li><li><strong>Vào chuồng đúng điểm.</strong> Tới đúng cửa rồi gieo số tương ứng ô muốn vào. Trong chuồng phải leo từng bậc: ở ô 4 cần mặt 5 để lên ô 5.</li><li><strong>Đủ 6–5–4–3 là thắng.</strong> Đưa bốn ngựa vào bốn vị trí cuối trước mọi người!</li></ol><button className='hr-primary' onClick={()=>{setDialog(null);resume();}}>Đã hiểu <Check size={18}/></button></Dialog>}
  {dialog==='settings'&&<Dialog title='Cách chơi của nhóm' onClose={()=>{setDialog(null);resume();}}><div className='hr-settings'>{([['fast','Hoạt ảnh nhanh','Rút ngắn thời gian chờ giữa các nước.'],['handoff','Chuyền máy','Chạm Sẵn sàng khi đến người tiếp theo.'],['light','Đồ họa nhẹ','Giảm bóng và cảnh vật quanh bàn.'],['reduced','Giảm chuyển động','Chuyển quân ngắn, không xoay xúc xắc.'],['flat','Bàn cờ 2D','Góc nhìn phẳng, dễ theo dõi.']] as const).map(([k,title,note])=><label key={k}><span><strong>{title}</strong><small>{note}</small></span><input type='checkbox' checked={prefs[k]} onChange={e=>setPrefs(p=>({...p,[k]:e.target.checked}))}/></label>)}<label><span><strong>Nhạc nền</strong><small>Giai điệu nhẹ nhàng trong khu vườn.</small></span><input type='checkbox' checked={sound.musicEnabled} onChange={sound.toggleMusic}/></label></div></Dialog>}
  {dialog==='leave'&&<Dialog title='Nghỉ một chút nhé?' onClose={()=>{setDialog(null);resume();}}><p>Ván cờ được giữ lại để nhóm mình chơi tiếp.</p><button className='hr-primary' onClick={()=>{setDialog(null);resume();}}><Play size={18}/> Chơi tiếp</button><button className='hr-secondary' onClick={exitToLobby}>Về màn chuẩn bị</button><button className='hr-text-button' onClick={onExit}>Về danh sách trò chơi</button></Dialog>}
  {newGameWarning&&<Dialog title='Bắt đầu cuộc đua mới?' onClose={()=>setNewGameWarning(false)}><p>Ván đang dở sẽ được thay bằng cuộc đua mới của nhóm này.</p><button className='hr-primary' onClick={begin}>Bắt đầu ván mới</button><button className='hr-secondary' onClick={()=>setNewGameWarning(false)}>Giữ ván đang chơi</button></Dialog>}
 </div>;
}
