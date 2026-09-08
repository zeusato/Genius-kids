// Development-only fixture: this HTML is not a Vite production entry.
// All campaign results stay in memory and use a separate, throwaway profile id.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StudentProfile } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
import { DragonAdventure } from './DragonAdventure';
import { createLocalQuestions } from './questions';
import { completeDragon } from './progress';
import { Config } from './model';
import { MISSIONS } from './content';
import { Generate } from './ai';
import { musicManager } from '../../../services/musicManager';
const base:StudentProfile={id:'dragon-dev-preview',name:'Preview',age:8,grade:2,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:0,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[],shopDailyPhotos:[],achievements:[],aiEnabled:true};base.stats=initializeStats(base);
function Preview(){
 const [student,setStudent]=useState(base),[scenario,setScenario]=useState('success'),[requests,setRequests]=useState(0),[unlocked,setUnlocked]=useState(false),[run,setRun]=useState(0),[sound,setSound]=useState(musicManager.getMusicState());
 const generate:Generate=async(body,signal)=>{setRequests(n=>n+1);await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},scenario==='slow'?30000:1000);const cancel=()=>{clearTimeout(timer);reject(signal.reason);};signal.addEventListener('abort',cancel,{once:true});});signal.throwIfAborted();if(scenario==='error')throw Error('Fixture network failure');const data=JSON.parse(body.contents[0].parts[0].text),c:Config={missionId:'forest-1',grade:data.grade,difficulty:data.difficulty,topic:data.topic,mode:'story',ai:true},slots=data.slots.map((s:any)=>({id:s.slotId,nodeId:s.context,bossPhase:s.bossPhase,kind:s.taskKind,input:false,difficulty:data.difficulty}));const qs=Object.values(createLocalQuestions(c,slots,data.seed));return JSON.stringify({schemaVersion:1,questions:qs.map(q=>({slotId:q.slotId,task:q.task,correctAnswer:scenario==='invalid'?'not correct':q.answer,leadIn:'Rồng đã tìm được một thử thách mới cho em.'}))});};
 const viewed=unlocked?{...student,dragonQuest:{version:2 as const,missions:Object.fromEntries(MISSIONS.map(m=>[m.id,{stars:3,completedAt:'2026-09-08',record:{missionId:m.id},seconds:0}]))}}:student;
 return <><div style={{padding:12,background:'#163d36',color:'white',display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',font:'13px system-ui'}}><strong>DEV PREVIEW</strong><button onClick={()=>{const canvas=document.querySelector('canvas');const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');gl?.getExtension('WEBGL_lose_context')?.loseContext();}}>Mất WebGL</button><label>AI fixture <select aria-label="AI fixture" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="success">Đúng định dạng</option><option value="invalid">Sai đáp án</option><option value="error">Lỗi mạng</option><option value="slow">Chờ quá lâu</option></select></label><label><input type="checkbox" checked={unlocked} onChange={e=>{setUnlocked(e.target.checked);setRun(v=>v+1);}}/> Mở tất cả chặng</label><span role="status">Requests: {requests}</span><button onClick={()=>{setRun(v=>v+1);setRequests(0);}}>Khởi động lại UI</button></div><DragonAdventure key={run} student={viewed as StudentProfile} complete={(id,s)=>{const result=completeDragon(student,s);if(result.accepted)setStudent(result.profile);return{ok:result.accepted,earned:result.earned};}} generate={generate} controls={{...sound,toggleMusic:()=>{musicManager.toggleMusic();setSound(musicManager.getMusicState());},toggleSound:()=>{musicManager.toggleSound();setSound(musicManager.getMusicState());},playTrack:musicManager.playTrack.bind(musicManager),resumeRouteMusic:musicManager.resumeRouteMusic.bind(musicManager)}} onExit={()=>setRun(v=>v+1)} onLegacy={()=>setRun(v=>v+1)}/></>;
}
if(import.meta.env.DEV)createRoot(document.getElementById('root')!).render(<Preview/>);

