import React, { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, Crown, Flag, Heart, HelpCircle, Leaf, LockKeyhole, Map, Music2, Pause, Play, Settings2, Shield, Sparkles, Star, Volume2, VolumeX, WandSparkles } from 'lucide-react';
import type { StudentProfile } from '../../../types';
import { useStudent, useStudentActions } from '../../../src/contexts/StudentContext';
import { useMusicControls } from '../../../src/contexts/MusicContext';
import { AIAgentSettingsModal } from '../../../src/components/AIAgentSettingsModal';
import { musicManager } from '../../../services/musicManager';
import { MusicTrack } from '../../../services/musicConfig';
import { cancelSpeech, speak } from '../../../src/utils/speech';
import { soundManager } from '../../../utils/sound';
import { apiGenerator, Generate, prepareQuestions } from './ai';
import { createMap, createSlots, MISSIONS, missionOf, NODE_COPY, REGIONS, regionOf } from './content';
import { createSession, finished, nodeOf, questionOf, recordOf, reduce } from './engine';
import { Config, Event, Preferences, Session } from './model';
import { readDraft, readPreferences, readProgress, saveDraft, savePreferences, unlocked } from './progress';
import { Modal } from './Modal';
import { RoundPanel } from './RoundPanel';
import { TILE_STYLE } from './content';
import World2D, { DragonPortrait } from './World2D';
import './dragon.css';
import './immersive.css';
import { GameHUD } from './GameHUD';
import { regionArt, regionMood } from './art';
import { useAdventureSound } from './useAdventureSound';
const World3D=lazy(()=>import('./World3D'));
type Action=Event extends infer T?T extends Event?Omit<T,'sessionId'>:never:never;
type Completion=(id:string,s:Session)=>{ok:boolean;earned:number;bonusStars?:number;achievementNames?:string[]};
type Controls=ReturnType<typeof useMusicControls>;
class WorldBoundary extends Component<{children:React.ReactNode;fallback:React.ReactNode;onFail:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.onFail();}render(){return this.state.failed?this.props.fallback:this.props.children;}
}
export default function ConnectedDragon(props:{onExit:()=>void;onLegacy:()=>void}){
 const {currentStudent}=useStudent(),{completeDragonGame}=useStudentActions(),controls=useMusicControls();
 return currentStudent?<DragonAdventure key={currentStudent.id} {...props} student={currentStudent} complete={completeDragonGame} controls={controls}/>:null;
}
export function DragonAdventure({student,complete,controls,onExit,onLegacy,generate,initialSession}:{student:StudentProfile;complete:Completion;controls:Controls;onExit:()=>void;onLegacy:()=>void;generate?:Generate;initialSession?:Session}){
 const progress=readProgress(student.dragonQuest),count=Object.keys(progress.missions).length,next=MISSIONS.find(m=>!progress.missions[m.id])||MISSIONS[19];
 const [prefs,setPrefs]=useState(()=>readPreferences(student.id)),[regionId,setRegion]=useState(next.region),[selected,setSelected]=useState(next.id);
 const [draft,setDraft]=useState(()=>readDraft(student.id)),[session,setSession]=useState<Session|null>(initialSession||null),sessionRef=useRef(session);
 const [modal,setModal]=useState<'settings'|'guide'|'book'|'start'|null>(null),[aiSetup,setAiSetup]=useState(false);
 const [preparing,setPreparing]=useState(false),[prepareText,setPrepareText]=useState(''),[message,setMessage]=useState(''),[saveError,setSaveError]=useState(false),[reward,setReward]=useState<ReturnType<Completion>|null>(null);
 const [worldReady,setWorldReady]=useState(false),[readVersion,setReadVersion]=useState(0);
 const [overview,setOverview]=useState(false),[recenter,setRecenter]=useState(0);
 const panelRef=useRef<HTMLElement>(null),manualRead=useRef(false),pending=useRef<AbortController|null>(null),mounted=useRef(true),committing=useRef(''),speechStop=useRef<()=>void>(()=>{}),saveFailed=useRef(false);
 const patchPrefs=(p:Partial<Preferences>)=>setPrefs(old=>({...old,...p}));
 const setRound=useCallback((s:Session|null)=>{sessionRef.current=s;setSession(s);},[]);
 const send=useCallback((e:Action)=>{const s=sessionRef.current;if(s){const n=reduce(s,{...e,sessionId:s.id} as Event);if(n!==s)setRound(n);}},[setRound]);
 const pause=useCallback(()=>{speechStop.current();send({type:'pause'});},[send]);
 useEffect(()=>{mounted.current=true;musicManager.playTrack(MusicTrack.DRAGON_FOREST);return()=>{mounted.current=false;pending.current?.abort();speechStop.current();const s=sessionRef.current;if(s)saveDraft({...s,paused:!finished(s),questionReady:false});musicManager.resumeRouteMusic();};},[]);
 useEffect(()=>{savePreferences(student.id,prefs);},[student.id,prefs]);
 useEffect(()=>{const handler=()=>{if(document.hidden)pause();};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&sessionRef.current&&!finished(sessionRef.current)){e.preventDefault();pause();}};document.addEventListener('visibilitychange',handler);window.addEventListener('pagehide',pause);document.addEventListener('keydown',key);return()=>{document.removeEventListener('visibilitychange',handler);window.removeEventListener('pagehide',pause);document.removeEventListener('keydown',key);};},[pause]);
 useEffect(()=>{if(!session||session.paused||finished(session)||!worldReady)return;let last=performance.now();const timer=window.setInterval(()=>{const now=performance.now();send({type:'tick',ms:now-last});last=now;},100);return()=>clearInterval(timer);},[session?.id,session?.paused,session?.phase,worldReady,send]);
 useEffect(()=>{if(!session)return;const ok=saveDraft(session);if(!ok&&!saveFailed.current){saveFailed.current=true;setMessage('Bộ nhớ đang đầy. Giữ trang này mở để tiếp tục hành trình.');}},[session?.id,session?.phase,session?.paused,session?.position,session?.rewardCommitted]);
 useEffect(()=>{const timer=window.setInterval(()=>{if(sessionRef.current)saveDraft(sessionRef.current);},5000);return()=>clearInterval(timer);},[]);
 const q=session?questionOf(session):null;
 useAdventureSound(session,controls.soundEnabled);
 useEffect(()=>{musicManager.setPaused(!!session?.paused);return()=>musicManager.setPaused(false);},[session?.paused]);
 useEffect(()=>{const retry=()=>musicManager.setPaused(!!sessionRef.current?.paused);document.addEventListener('pointerdown',retry);return()=>document.removeEventListener('pointerdown',retry);},[]);
 useEffect(()=>{if(!session||session.paused||['intro','question','feedback'].includes(session.phase))return;const el=panelRef.current?.querySelector<HTMLElement>(session.phase==='feedback'?'.dq-primary':'h2');if(!el)return;if(el.tagName!=='BUTTON')el.setAttribute('tabindex','-1');el.focus({preventScroll:true});},[session?.id,session?.phase,session?.paused,q?.slotId]);
 useEffect(()=>{
  if(!session||session.phase!=='question'||session.paused||!worldReady||!q)return;
  let active=true,timer:number|undefined;const prior=musicManager.getVolume();const done=()=>{if(!active)return;active=false;clearTimeout(timer);musicManager.setVolume(prior);send({type:'ready'});};
  speechStop.current=()=>{active=false;clearTimeout(timer);cancelSpeech();musicManager.setVolume(prior);};
  const shouldRead=prefs.voice||manualRead.current;manualRead.current=false;
  if(shouldRead&&controls.soundEnabled){musicManager.setVolume(prior*.25);const started=speak(q.text,{rate:.88,onEnd:done,onError:done});timer=window.setTimeout(done,16000);if(!started)done();}else done();
  return()=>speechStop.current();
 },[session?.id,session?.phase,session?.paused,q?.slotId,worldReady,readVersion,prefs.voice,controls.soundEnabled,send]);
 useEffect(()=>{if(session?.phase==='feedback'){if(session.feedback?.correct)soundManager.playCorrect();else soundManager.playWrong();}if(session?.phase==='won')soundManager.playComplete();},[session?.id,session?.phase]);
 const commit=useCallback((s:Session)=>{const result=complete(student.id,s);if(!mounted.current)return;setReward(result);setSaveError(!result.ok);if(result.ok)send({type:'commit'});},[complete,student.id,send]);
 useEffect(()=>{if(session?.phase==='won'&&!session.rewardCommitted&&committing.current!==session.id){committing.current=session.id;commit(session);}},[session?.id,session?.phase,session?.rewardCommitted,commit]);
 const unavailable=useCallback(()=>{setWorldReady(true);setPrefs(p=>({...p,renderer:'2d'}));setMessage('Đã chuyển sang bản đồ 2D để hành trình tiếp tục mượt mà.');},[]);
 const slow=useCallback(()=>{if(prefs.quality==='light'){unavailable();return;}setPrefs(p=>({...p,quality:'light'}));setMessage('Đã giảm chi tiết đồ họa để máy chạy mượt hơn.');},[prefs.quality,unavailable]);
 const ready=useCallback(()=>setWorldReady(true),[]);
 useEffect(()=>{if(prefs.renderer==='2d')setWorldReady(true);},[prefs.renderer]);
 const goHome=()=>{speechStop.current();const s=sessionRef.current;if(s){saveDraft({...s,paused:!finished(s),questionReady:false});setDraft(readDraft(student.id));}setRound(null);setModal(null);setReward(null);setSaveError(false);};
 const begin=async(forceLocal=false)=>{
  pending.current?.abort();const controller=new AbortController();pending.current=controller;setPreparing(true);setPrepareText('Đang chuẩn bị hành trình…');setMessage('');
  const seed=crypto.getRandomValues(new Uint32Array(1))[0],config:Config={missionId:selected,grade:Number(student.grade),difficulty:prefs.difficulty,topic:prefs.topic,mode:prefs.mode,ai:prefs.ai};
  const slots=createSlots(config,createMap(selected,seed));let transport=generate;
  if(!transport&&!forceLocal&&student.aiEnabled){try{const key=localStorage.getItem('mathgenius_gemini_key');if(key)transport=apiGenerator(key);}catch{}}
  try{const prepared=await prepareQuestions(config,slots,seed,{signal:controller.signal,generate:forceLocal?undefined:transport,onProgress:text=>{if(pending.current===controller)setPrepareText(text);}});
   if(controller.signal.aborted||pending.current!==controller||!mounted.current)return;
   const s=createSession(config,seed,crypto.randomUUID(),student.id,prepared);setOverview(false);setRecenter(v=>v+1);setRound(s);saveDraft(s);setDraft({session:s,corrupt:false});setModal(null);setReward(null);setSaveError(false);setMessage(prepared.notice);
  }catch{if(!controller.signal.aborted)setMessage('Chưa chuẩn bị được hành trình. Em thử lại nhé.');}finally{if(pending.current===controller&&mounted.current){pending.current=null;setPreparing(false);}}
 };
 const cancelPrepare=()=>{pending.current?.abort();pending.current=null;setPreparing(false);setModal(null);};
 const resume=()=>{if(!draft.session)return;setSelected(draft.session.config.missionId);setRegion(missionOf(draft.session.config.missionId).region);setRound({...draft.session,paused:false,questionReady:false});setMessage(draft.session.prepared.notice);};
 const selectedMission=missionOf(selected),region=regionOf(session?.config.missionId||selected),s=session,node=s?nodeOf(s):null;
 const chooseMission=(id:string)=>{setSelected(id);setRegion(missionOf(id).region);setModal('start');};
 const encounter=!!s&&!['readyToRoll','rolling','moving','landing'].includes(s.phase),blocked=!!s?.paused||!!modal;
 const wp={missionId:s?.config.missionId||selected,seed:s?.seed||2718,session:s||undefined,quality:prefs.quality,reduced:prefs.reduced,heroColor:prefs.heroColor,cameraMode:prefs.camera||'follow',overview:!s||overview,recenter,blocked,onReady:ready,onUnavailable:unavailable,onSlow:slow};
 const fallback=<World2D {...wp}/>;
 useEffect(()=>{musicManager.transitionTrack(['forest','snow'].includes(region.id)?MusicTrack.DRAGON_FOREST:MusicTrack.DRAGON_JOURNEY);},[region.id]);
 return <div className={`dq-app ${s?'dq-playing':'dq-home'} ${prefs.reduced?'dq-reduced':''}`} style={{'--dq-sky':regionMood[region.id].sky,'--dq-accent':region.color,'--dq-art':`url("${regionArt(region.id)}")`} as React.CSSProperties}>
  <div className="dq-shell">
   <header className="dq-header"><button className="dq-icon" onClick={s?!finished(s)?pause:goHome:onExit} aria-label={s?!finished(s)?'Tạm dừng':'Về bản đồ':'Về danh sách trò chơi'}>{s&&!finished(s)?<Pause size={21}/>:<ArrowLeft size={21}/>}</button><div className="dq-brand"><span>GENIUS KIDS · PHIÊU LƯU</span><strong>Đại chiến rồng thần</strong></div><div className="dq-header-tools">{s?<span className="dq-energy" aria-label={`${s.energy} trên 3 tim năng lượng`}>{[1,2,3].map(i=><Heart key={i} size={21} fill={i<=s.energy?'currentColor':'none'} opacity={i<=s.energy?1:.25}/>)}</span>:<span className="dq-stars"><Star size={17} fill="currentColor"/>{count*3}<small>/ 60</small></span>}<button className="dq-icon" aria-label="Hướng dẫn" onClick={()=>{if(s)pause();setModal('guide');}}><HelpCircle size={20}/></button><button className="dq-icon" aria-label="Cài đặt hành trình" onClick={()=>{if(s)pause();setModal('settings');}}><Settings2 size={20}/></button></div></header>
   {message&&<div className="dq-notice" role="status"><span>{message}</span><button aria-label="Ẩn thông báo" onClick={()=>setMessage('')}>×</button></div>}
   <main className="dq-main">
    <section className="dq-scene-area" aria-label="Vùng đất của rồng">
     <div className="dq-world-art" aria-hidden="true"/>
     <div className="dq-world-title"><span className="dq-eyebrow">{s?`CHẶNG ${missionOf(s.config.missionId).index+1} / 20`:`VÙNG ĐẤT ${REGIONS.findIndex(r=>r.id===region.id)+1} / 5`}</span><h1>{region.name}</h1><p>{s?missionOf(s.config.missionId).title:region.description}</p></div>
     <div className="dq-world">{prefs.renderer==='2d'?fallback:<WorldBoundary key={prefs.renderer} fallback={fallback} onFail={unavailable}><Suspense fallback={<div className="dq-world-loading">{fallback}<span role="status">Rồng đang thức giấc…</span><button className="dq-text-button" onClick={unavailable}>Mở bản đồ 2D</button></div>}><World3D {...wp}/></Suspense></WorldBoundary>}</div>
     {s&&<GameHUD s={s} ready={worldReady} roll={()=>send({type:'roll'})} camera={prefs.camera||'follow'} overview={overview} setCamera={camera=>patchPrefs({camera})} setOverview={setOverview} recenter={()=>setRecenter(v=>v+1)} blocked={blocked||encounter} music={controls.musicEnabled} sound={controls.soundEnabled} toggleMusic={controls.toggleMusic} toggleSound={controls.toggleSound}/>}
     <div className="dq-scene-footer"><span>{!s||overview?'Toàn bộ 50 ô':prefs.camera==='free'?'Kéo để xoay · Chụm để thu phóng':'Camera theo nhân vật'} · {prefs.renderer==='3d'?'3D':'2D'}</span><span>{s?s.prepared.source==='ai'?'Câu hỏi AI':s.prepared.source==='mixed'?'AI + câu hỏi có sẵn':'Câu hỏi có sẵn':'Gieo xúc xắc để di chuyển'}</span></div>
     <div className="dq-board-legend" aria-label="Chú giải các ô">{Object.entries(TILE_STYLE).map(([kind,style])=><span key={kind}><b style={{background:style.color,color:style.ink}}>{style.symbol}</b>{style.name}</span>)}</div>    </section>
    {!s?<section className="dq-journey"><div className="dq-journey-heading"><div><span className="dq-eyebrow">CHUYẾN ĐI CỦA EM</span><h2>Đánh thức phép màu.</h2></div><button className="dq-icon" aria-label="Mở sổ rồng" onClick={()=>{if(s)pause();setModal('book');}}><BookOpen size={23}/></button></div><p>Gieo xúc xắc trên bàn 50 ô, vượt cạm bẫy, nhận buff và đấu Rồng Thần.</p>
     {draft.session&&!finished(draft.session)&&<button className="dq-resume" onClick={resume}><Play size={19} fill="currentColor"/><span>Tiếp tục chuyến đi<strong>{missionOf(draft.session.config.missionId).title}</strong></span><ArrowRight size={19}/></button>}
     {draft.session?.phase==='won'&&!draft.session.rewardCommitted&&<button className="dq-resume" onClick={resume}>Nhận phần thưởng chưa lưu <ArrowRight size={19}/></button>}
     {draft.corrupt&&<p className="dq-hint">Bản lưu dở cũ không tương thích với luật bàn cờ hiện tại. Các chặng đã hoàn thành vẫn được giữ.</p>}
     <nav className="dq-regions" aria-label="Chọn vùng đất">{REGIONS.map((r,i)=><button key={r.id} onClick={()=>{setRegion(r.id);setSelected(MISSIONS.find(m=>m.region===r.id&&!progress.missions[m.id])?.id||`${r.id}-1`);}} className={regionId===r.id?'active':''} aria-label={r.name} aria-pressed={regionId===r.id}><span>{i+1}</span><small>{['Rừng','Gió','Pha lê','Tuyết','Thành'][i]}</small></button>)}</nav>
     <div className="dq-missions">{MISSIONS.filter(m=>m.region===regionId).map(m=>{const done=!!progress.missions[m.id],open=unlocked(m.id,progress);return <button className={`dq-mission ${done?'done':''} ${m.id===selected?'selected':''}`} key={m.id} disabled={!open} onClick={()=>chooseMission(m.id)}><span className="dq-mission-number">{done?<Check size={22}/>:!open?<LockKeyhole size={18}/>:String(m.index+1).padStart(2,'0')}</span><span><strong>{m.title}</strong><small>{done?'Đã đánh thức phép màu':open?m.gift:`Hoàn thành chặng ${m.index} để mở`}</small></span>{done?<span className="dq-mini-stars">★★★</span>:<ArrowRight size={18}/>}</button>;})}</div>
     <button className="dq-primary dq-wide" disabled={!unlocked(selected,progress)} onClick={()=>chooseMission(selected)}><Compass size={20}/> {progress.missions[selected]?'Khám phá lại':'Bắt đầu khám phá'}<ArrowRight size={19}/></button><p className="dq-footnote">20 màn chơi · Mỗi màn 50 ô · Xúc xắc 1–6</p>
    </section>:<RoundPanel reduced={prefs.reduced} pause={pause} s={s} panelRef={panelRef} worldReady={worldReady} send={send} onRead={()=>{manualRead.current=true;speechStop.current();send({type:'listen'});setReadVersion(v=>v+1);}} onReady={()=>{speechStop.current();send({type:'ready'});}} home={goHome} replay={()=>{setRound(createSession(s.config,s.seed,crypto.randomUUID(),student.id,s.prepared));setReward(null);setSaveError(false);}} next={()=>{const id=MISSIONS[missionOf(s.config.missionId).index+1].id;goHome();chooseMission(id);}} commit={()=>commit(s)} reward={reward} saveError={saveError}/>}   </main>
   <footer className="dq-bottom"><span><Leaf size={14}/>{s?s.config.mode==='story'?'Luật gốc · Gieo xúc xắc 1–6':'Thử thách · Sẵn sàng rồi mới tính giờ':'Mỗi câu hỏi đúng, một điều kỳ diệu.'}</span><button onClick={()=>{if(s)pause();setModal('book');}}><BookOpen size={15}/> Sổ rồng · {count}/20</button></footer>
  </div>
  {s?.paused&&!modal&&!finished(s)&&<Modal title="Nghỉ một chút nhé" onClose={()=>send({type:'resume'})}><DragonPortrait className="dq-modal-dragon" color={region.color}/><p>Hành trình đã tạm dừng. Bàn cờ và kết quả xúc xắc đang chờ em.</p><button className="dq-primary dq-wide" onClick={()=>send({type:'resume'})}><Play size={19}/> Tiếp tục</button><div className="dq-button-row"><button className="dq-secondary" onClick={()=>setModal('settings')}>Cài đặt</button><button className="dq-secondary" onClick={goHome}>Lưu và về bản đồ</button></div></Modal>}
  {modal==='start'&&!aiSetup&&<Modal title={preparing?'Rồng đang chuẩn bị chuyến đi':selectedMission.title} onClose={cancelPrepare}>{preparing?<div className="dq-preparing"><DragonPortrait color={region.color}/><p role="status">{prepareText}</p><p className="dq-footnote">Câu hỏi cho cả bản đồ được chuẩn bị trước khi xuất phát.</p><button className="dq-secondary dq-wide" onClick={()=>begin(true)}>Chơi ngay với câu hỏi có sẵn</button><button className="dq-text-button" onClick={cancelPrepare}>Hủy chuẩn bị</button></div>:<><p>{selectedMission.brief}</p><div className="dq-setting-row dq-ai-toggle"><span><strong><Sparkles size={18}/> Ra đề bằng AI</strong><small>Rồng tự chuẩn bị câu đố mới theo lớp {Number(student.grade)||'mầm non'} và nội dung em chọn.</small></span><button role="switch" aria-checked={prefs.ai} aria-label="Ra đề bằng AI" className="dq-switch" onClick={()=>patchPrefs({ai:!prefs.ai})}><span/></button></div>{prefs.ai&&!student.aiEnabled&&!generate&&<p className="dq-hint">AI chưa được bật cho hồ sơ này. <button className="dq-text-button" onClick={()=>setAiSetup(true)}>Mở cài đặt AI</button> Nếu chưa kết nối được, rồng sẽ dùng câu hỏi có sẵn.</p>}<label className="dq-field">Nội dung khám phá<select value={prefs.topic} onChange={e=>patchPrefs({topic:e.target.value as Preferences['topic']})}><option value="mixed">Tổng hợp · Toán, quan sát, hiểu biết</option><option value="math">Toán học</option><option value="observe">Quan sát hình, màu và đồng hồ</option><option value="knowledge">Hiểu biết quanh em</option></select></label><div className="dq-field-grid"><label className="dq-field">Độ khó<select value={prefs.difficulty} onChange={e=>patchPrefs({difficulty:e.target.value as Preferences['difficulty']})}><option value="easy">Khởi đầu</option><option value="medium">Vừa sức</option><option value="hard">Nâng cao</option></select></label><label className="dq-field">Cách chơi<select value={prefs.mode} onChange={e=>patchPrefs({mode:e.target.value as Preferences['mode']})}><option value="story">Luật gốc · Không đếm giờ</option><option value="challenge">Thử thách</option></select></label></div><p className="dq-footnote">{prefs.mode==='story'?'Luật gốc: 3 máu, gieo xúc xắc, buff và cạm bẫy. Không đếm ngược.':'Có đếm ngược sau khi đọc câu hỏi. Hết 3 tim sẽ kết thúc lượt.'}</p>{draft.session&&!finished(draft.session)&&<p className="dq-hint">Bắt đầu chuyến mới sẽ thay bản lưu dở “{missionOf(draft.session.config.missionId).title}”.</p>}<button className="dq-primary dq-wide" onClick={()=>begin()}><Play size={18} fill="currentColor"/> Lên đường</button></>}</Modal>}
  {modal==='guide'&&<Modal title="Cùng rồng đi phiêu lưu" onClose={()=>setModal(null)}><ol className="dq-guide"><li><strong>Toàn bộ bàn cờ có 50 ô.</strong> Gieo xúc xắc 1–6, dũng sĩ cưỡi ngựa tiến đúng số ô theo đường đi của từng vùng. Tới cuối thì dừng tại ô 50.</li><li><strong>Đổi góc nhìn bất cứ lúc nào.</strong> Chọn Theo nhân vật để bám dũng sĩ; 3D tự do để kéo xoay và thu phóng; Toàn cảnh để xem 50 ô; nút tâm ngắm để về vị trí hiện tại.</li><li><strong>Chỉ xử lý ô dừng.</strong> Ô thường được gieo tiếp; ô quái vật hỏi một câu, đúng +10 điểm, sai mất 1 máu.</li><li><strong>Ô nàng tiên tặng buff.</strong> Đúng +15 điểm và nhận Kiếm Thánh, Chén Thánh hoặc Áo Choàng Bay. Sai không mất máu.</li><li><strong>Cạm bẫy dịch chuyển ±8 ô.</strong> Xử lý tiếp sự kiện ở ô mới. Áo Choàng Bay ngăn dịch chuyển lùi.</li><li><strong>Boss ở ô 50.</strong> Có 5 câu, mỗi Kiếm Thánh giảm một câu, tối đa giảm còn 3. Theo luật gốc, cả đúng và sai đều qua một lượt câu; sai mất 1 máu. Hết câu khi còn máu thì thắng; hết máu thì thua.</li></ol><p>Chén Thánh hồi 1 máu, tối đa 3 máu. Huy chương Vàng/Bạc/Đồng theo 3/2/1 máu còn lại.</p><button className="dq-primary dq-wide" onClick={()=>setModal(null)}>Đã hiểu, đi thôi!</button></Modal>}
  {modal==='book'&&<Modal title="Sổ rồng của em" onClose={()=>setModal(null)}><p>{count}/20 món quà đã mang về. Cứ bốn chặng, em kết bạn với một rồng hộ vệ.</p><div className="dq-book">{REGIONS.map(r=><section key={r.id}><DragonPortrait color={r.color}/><h3>{r.dragon}</h3><div>{MISSIONS.filter(m=>m.region===r.id).map(m=><span className={progress.missions[m.id]?'earned':''} key={m.id}>{progress.missions[m.id]?<Check size={14}/>:<LockKeyhole size={13}/>} {m.gift}</span>)}</div></section>)}</div><p className="dq-footnote">Thu thập 4 món để mở áo choàng Đất Ấm, 8 món để mở áo choàng Trời Xanh.</p></Modal>}
  {modal==='settings'&&!aiSetup&&<Modal title="Cài đặt hành trình" onClose={()=>setModal(null)}><div className="dq-setting-row"><span><Music2 size={19}/> Nhạc nền</span><button className="dq-switch" role="switch" aria-label="Nhạc nền" aria-checked={controls.musicEnabled} onClick={controls.toggleMusic}><span/></button></div><div className="dq-setting-row"><span>{controls.soundEnabled?<Volume2 size={19}/>:<VolumeX size={19}/>} Âm thanh</span><button className="dq-switch" role="switch" aria-label="Âm thanh" aria-checked={controls.soundEnabled} onClick={controls.toggleSound}><span/></button></div><div className="dq-setting-row"><span>Tự đọc câu hỏi</span><button className="dq-switch" role="switch" aria-label="Tự đọc câu hỏi" aria-checked={prefs.voice} onClick={()=>patchPrefs({voice:!prefs.voice})}><span/></button></div><div className="dq-setting-row"><span>Giảm chuyển động</span><button className="dq-switch" role="switch" aria-label="Giảm chuyển động" aria-checked={prefs.reduced} onClick={()=>patchPrefs({reduced:!prefs.reduced})}><span/></button></div><div className="dq-field-grid"><label className="dq-field">Bản đồ<select value={prefs.renderer} onChange={e=>{setWorldReady(e.target.value==='2d');patchPrefs({renderer:e.target.value as '3d'|'2d'});}}><option value="3d">3D sinh động</option><option value="2d">2D nhẹ</option></select></label><label className="dq-field">Chi tiết đồ họa<select value={prefs.quality} onChange={e=>patchPrefs({quality:e.target.value as Preferences['quality']})}><option value="light">Nhẹ</option><option value="balanced">Cân bằng</option><option value="detailed">Chi tiết</option></select></label></div><label className="dq-field">Áo choàng của em<select value={prefs.heroColor} onChange={e=>patchPrefs({heroColor:e.target.value})}><option value="#347e7d">Lá Rừng</option><option value="#a66748" disabled={count<4}>Đất Ấm {count<4?'· Cần 4 món quà':''}</option><option value="#667db0" disabled={count<8}>Trời Xanh {count<8?'· Cần 8 món quà':''}</option></select></label><p className="dq-footnote">Chế độ Nhẹ giảm bóng và cảnh vật. Bản đồ 2D giữ nguyên câu hỏi, đường đi và phần thưởng.</p><button className="dq-text-button" onClick={()=>setAiSetup(true)}>Cài đặt kết nối AI</button>{!s&&<button className="dq-text-button" onClick={onLegacy}>Mở phiên bản trò chơi cũ</button>}</Modal>}
  {aiSetup&&<AIAgentSettingsModal onClose={()=>setAiSetup(false)}/>}
 </div>;
}








