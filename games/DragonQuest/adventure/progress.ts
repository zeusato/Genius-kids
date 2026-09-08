import type { GameResult, StudentProfile } from '../../../types';
import { ACHIEVEMENTS, checkAchievements, initializeStats, updateStats } from '../../../services/achievementService';
import { MISSIONS } from './content';
import { MAX_SCORE } from '../engine/constants';
import { recordOf, validSession } from './engine';
import { DragonRecord, Preferences, Session } from './model';

interface CompletedMission { stars:number; completedAt:string; record:DragonRecord; seconds:number }
export interface DragonProgress { version:2; missions:Record<string,CompletedMission> }
export function readProgress(input:unknown):DragonProgress {
 const out:DragonProgress={version:2,missions:{}};if(!input||typeof input!=='object'||!('version'in input)||input.version!==2)return out;
 const v=input as DragonProgress;for(const [id,m]of Object.entries(v.missions||{}))if(MISSIONS.some(q=>q.id===id)&&m&&m.stars===3&&typeof m.completedAt==='string'&&m.record?.missionId===id&&Number.isFinite(m.seconds)&&m.seconds>=0)out.missions[id]=m;
 return out;
}
export function unlocked(id:string,progress:DragonProgress){const i=MISSIONS.findIndex(m=>m.id===id);return i===0||!!progress.missions[id]||i>0&&!!progress.missions[MISSIONS[i-1].id];}
export function completeDragon(profile:StudentProfile,s:Session){
 const fail={accepted:false,changed:false,profile,earned:0,bonusStars:0,achievementNames:[] as string[]};
 if(profile.id!==s.studentId||!validSession(s)||s.phase!=='won')return fail;
 const progress=readProgress(profile.dragonQuest);if(!unlocked(s.config.missionId,progress))return fail;
 const old=progress.missions[s.config.missionId],r=recordOf(s),seconds=Math.round(s.elapsedMs/1000),earned=old?0:3,now=new Date().toISOString(),date=old?.completedAt||now;
 // A score is always from the same batch/assistance conditions; the log retains the best full attempt.
 const improve=!old||r.independent/r.total>old.record.independent/old.record.total||(r.independent/r.total===old.record.independent/old.record.total&&seconds<old.seconds);
 if(!improve)return {...fail,accepted:true};
 progress.missions[s.config.missionId]={stars:3,completedAt:date,record:r,seconds};
 const id=`dragon-v2:${profile.id}:${s.config.missionId}`,previous=profile.gameHistory.find(g=>g.id===id);
 const entry:GameResult={id,date,gameType:'dragon-quest',difficulty:s.config.difficulty,score:s.score,maxScore:MAX_SCORE,durationSeconds:seconds,starsEarned:3,starAwards:previous?.starAwards||[{date,amount:3}],dragon:r};
 const prior=structuredClone(profile.stats||initializeStats(profile));
 const stats=old?prior:updateStats(prior,{type:'GAME_COMPLETE',gameResult:{...entry,starsEarned:earned}});
 const updated:StudentProfile={...profile,dragonQuest:progress,stars:profile.stars+earned,stats,gameHistory:[...profile.gameHistory.filter(g=>g.id!==id),entry]};
 const ach=checkAchievements(updated);updated.achievements=ach.updatedAchievements;updated.stars+=ach.rewards;
 return {accepted:true,changed:true,profile:updated,earned,bonusStars:ach.rewards,achievementNames:ach.unlocked.map(a=>ACHIEVEMENTS.find(x=>x.id===a.id)?.title||a.id)};
}
export function persistDragon(profiles:StudentProfile[],studentId:string,s:Session,write:(p:StudentProfile[])=>void){
 const fail={ok:false,earned:0,bonusStars:0,achievementNames:[] as string[],profiles},p=profiles.find(p=>p.id===studentId);if(!p)return fail;
 const r=completeDragon(p,s);if(!r.accepted)return fail;if(!r.changed)return {...fail,ok:true};
 const next=profiles.map(p=>p.id===studentId?r.profile:p);try{write(next);}catch{return fail;}
 return {ok:true,earned:r.earned,bonusStars:r.bonusStars,achievementNames:r.achievementNames,profiles:next};
}
export function readDraft(studentId:string):{session:Session|null;corrupt:boolean}{
 try{const raw=localStorage.getItem(`dragon-draft:${studentId}`);if(!raw)return {session:null,corrupt:false};if(raw.length>300000)return{session:null,corrupt:true};const s=JSON.parse(raw);return validSession(s)&&s.studentId===studentId?{session:{...s,paused:!['won','lost'].includes(s.phase),questionReady:false},corrupt:false}:{session:null,corrupt:true};}catch{return{session:null,corrupt:true};}
}
export function saveDraft(s:Session){try{localStorage.setItem(`dragon-draft:${s.studentId}`,JSON.stringify(s));return true;}catch{return false;}}
export function clearDraft(studentId:string){try{localStorage.removeItem(`dragon-draft:${studentId}`);}catch{}}
export function readPreferences(id:string):Preferences{
 const defaults:Preferences={ai:false,difficulty:'easy',topic:'mixed',mode:'story',quality:'balanced',reduced:typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,voice:true,renderer:'3d',heroColor:'#347e7d'};
 try{const p=JSON.parse(localStorage.getItem(`dragon-prefs:${id}`)||'{}');return {...defaults,ai:typeof p.ai==='boolean'?p.ai:false,difficulty:['easy','medium','hard'].includes(p.difficulty)?p.difficulty:'easy',topic:['mixed','math','observe','knowledge'].includes(p.topic)?p.topic:'mixed',mode:p.mode==='challenge'?'challenge':'story',quality:['light','balanced','detailed'].includes(p.quality)?p.quality:'balanced',reduced:typeof p.reduced==='boolean'?p.reduced:defaults.reduced,voice:typeof p.voice==='boolean'?p.voice:true,renderer:p.renderer==='2d'?'2d':'3d',heroColor:['#347e7d','#a66748','#667db0'].includes(p.heroColor)?p.heroColor:defaults.heroColor};}catch{return defaults;}
}
export function savePreferences(id:string,p:Preferences){try{localStorage.setItem(`dragon-prefs:${id}`,JSON.stringify(p));}catch{}}

