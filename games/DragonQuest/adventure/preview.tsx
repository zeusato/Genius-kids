// Development-only fixture: this HTML is not a Vite production entry.
// All campaign results stay in memory and use a separate, throwaway profile id.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StudentProfile } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
import { DragonAdventure } from './DragonAdventure';
import { createLocalQuestions, assemble, makeQuestion } from './questions';
import { completeDragon } from './progress';
import { Config, Session, Event } from './model';
import { MISSIONS, REGIONS, createMap, createSlots } from './content';
import { Generate } from './ai';
import { musicManager } from '../../../services/musicManager';
import { createSession, reduce, finished, questionOf } from './engine';
function fixture(region:string,phase:string):Session{
 const config:Config={missionId:region+'-1',grade:2,difficulty:'easy',topic:phase==='input'?'math':'mixed',mode:phase==='timed'?'challenge':'story',ai:false},seed=42,map=createMap(config.missionId,seed);
 const slots=createSlots(config,map),questions=createLocalQuestions(config,slots,seed);
 const countSlot=slots.find(slot=>slot.kind==='count'&&map.find(n=>n.id===slot.nodeId)?.kind==='combat');
 if(phase.startsWith('count')&&countSlot)questions[countSlot.id]=makeQuestion(countSlot,{kind:'count',left:phase==='count-empty'?3:10,right:phase==='count-empty'?0:10,object:'gem'},seed);
 let s=createSession(config,seed,crypto.randomUUID(),'dragon-dev-preview',assemble(questions));
 const send=(e:Record<string,unknown>)=>{s=reduce(s,{...e,sessionId:s.id} as Event);};
 if(phase==='play')return s;
 if(phase==='won'){for(let i=0;i<2500&&!finished(s);i++){if(s.phase==='readyToRoll')send({type:'roll'});else if(['rolling','moving','landing'].includes(s.phase))send({type:'tick',ms:1000});else if(s.phase==='question'){send({type:'ready'});const q=questionOf(s)!;send({type:'answer',slotId:q.slotId,encounter:s.encounter,value:q.input?q.answer:q.options.find(o=>o.text===q.answer)!.id});}else send({type:'continue'});}return s;}
 const inputSlot=slots.find(slot=>slot.input&&map.find(n=>n.id===slot.nodeId)?.kind==='combat');
 const n=phase==='input'&&inputSlot?map.find(n=>n.id===inputSlot.nodeId)!:phase.startsWith('count')&&countSlot?map.find(n=>n.id===countSlot.nodeId)!:map.find(n=>n.kind===(phase==='boss'?'boss':phase==='portal'?'teleport':phase==='fairy'?'buff':'combat')&&n.index>0)!;
 s={...s,position:n.id,target:n.index,phase:'landing',visited:['tile-0',n.id]};send({type:'tick',ms:350});return s;
}
const base:StudentProfile={id:'dragon-dev-preview',name:'Preview',age:8,grade:2,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:0,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[],shopDailyPhotos:[],achievements:[],aiEnabled:true};base.stats=initializeStats(base);
function Preview(){
 const [student,setStudent]=useState(base),[scenario,setScenario]=useState('success'),[requests,setRequests]=useState(0),[unlocked,setUnlocked]=useState(false),[run,setRun]=useState(0),[sound,setSound]=useState(musicManager.getMusicState());
 const [qaRegion,setQaRegion]=useState('forest'),[qaPhase,setQaPhase]=useState('play'),[initial,setInitial]=useState<Session>();
 const generate:Generate=async(body,signal)=>{setRequests(n=>n+1);await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},scenario==='slow'?30000:1000);const cancel=()=>{clearTimeout(timer);reject(signal.reason);};signal.addEventListener('abort',cancel,{once:true});});signal.throwIfAborted();if(scenario==='error')throw Error('Fixture network failure');const data=JSON.parse(body.contents[0].parts[0].text),c:Config={missionId:'forest-1',grade:data.grade,difficulty:data.difficulty,topic:data.topic,mode:'story',ai:true},slots=data.slots.map((s:any)=>({id:s.slotId,nodeId:s.context,bossPhase:s.bossPhase,kind:s.taskKind,input:false,difficulty:data.difficulty}));const qs=Object.values(createLocalQuestions(c,slots,data.seed));return JSON.stringify({schemaVersion:1,questions:qs.map(q=>({slotId:q.slotId,task:q.task,correctAnswer:scenario==='invalid'?'not correct':q.answer,leadIn:'Rồng đã tìm được một thử thách mới cho em.'}))});};
 const viewed=unlocked?{...student,dragonQuest:{version:2 as const,missions:Object.fromEntries(MISSIONS.map(m=>[m.id,{stars:3,completedAt:'2026-09-08',record:{missionId:m.id},seconds:0}]))}}:student;
 return <><details className="dq-dev-tools"><summary>DEV · Kiểm thử</summary><label>Vùng <select aria-label="Vùng kiểm thử" value={qaRegion} onChange={e=>setQaRegion(e.target.value)}>{REGIONS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>Cảnh <select aria-label="Cảnh kiểm thử" value={qaPhase} onChange={e=>setQaPhase(e.target.value)}><option value="play">Di chuyển</option><option value="question">Câu hỏi</option><option value="input">Câu hỏi · Nhập số</option><option value="count-empty">Đếm · Nhóm rỗng</option><option value="count-full">Đếm · Hai nhóm 10 vật</option><option value="timed">Câu hỏi · Đếm giờ</option><option value="fairy">Nàng tiên</option><option value="portal">Cổng</option><option value="boss">Boss</option><option value="won">Chiến thắng</option></select></label><button onClick={()=>{setInitial(fixture(qaRegion,qaPhase));setRun(v=>v+1);}}>Mở cảnh kiểm thử</button><button onClick={()=>document.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()}>Thử mất WebGL</button></details><div style={{padding:12,background:'#163d36',color:'white',display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',font:'13px system-ui'}}><strong>DEV PREVIEW</strong><button onClick={()=>{const canvas=document.querySelector('canvas');const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');gl?.getExtension('WEBGL_lose_context')?.loseContext();}}>Mất WebGL</button><label>AI fixture <select aria-label="AI fixture" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="success">Đúng định dạng</option><option value="invalid">Sai đáp án</option><option value="error">Lỗi mạng</option><option value="slow">Chờ quá lâu</option></select></label><label><input type="checkbox" checked={unlocked} onChange={e=>{setUnlocked(e.target.checked);setRun(v=>v+1);}}/> Mở tất cả chặng</label><span role="status">Requests: {requests}</span><button onClick={()=>{setRun(v=>v+1);setRequests(0);}}>Khởi động lại UI</button></div><DragonAdventure initialSession={initial} key={run} student={viewed as StudentProfile} complete={(id,s)=>{const result=completeDragon(student,s);if(result.accepted)setStudent(result.profile);return{ok:result.accepted,earned:result.earned};}} generate={generate} controls={{...sound,toggleMusic:()=>{musicManager.toggleMusic();setSound(musicManager.getMusicState());},toggleSound:()=>{musicManager.toggleSound();setSound(musicManager.getMusicState());},playTrack:musicManager.playTrack.bind(musicManager),resumeRouteMusic:musicManager.resumeRouteMusic.bind(musicManager)}} onExit={()=>setRun(v=>v+1)} onLegacy={()=>setRun(v=>v+1)}/></>;
}
if(import.meta.env.DEV){const root=import.meta.hot?.data.root||createRoot(document.getElementById('root')!);if(import.meta.hot)import.meta.hot.data.root=root;root.render(<Preview/>);}

