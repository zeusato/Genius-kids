import type { StudentProfile, GameResult } from '../../../types';
import { ACHIEVEMENTS, checkAchievements, initializeStats, updateStats } from '../../../services/achievementService';
import { MISSIONS } from '../content/catalog';
import { MemorySession, difficultyOf, resultOf } from '../engine/model';
import { validSession } from '../engine/game';

interface Best { attempts:number; seconds:number; hints:number }
interface MissionProgress { stars:number; completedAt:string; best:Record<string,Best> }
export interface MemoryProgress { version:2; missions:Record<string,MissionProgress>; practiceBest:Record<string,Best>; recent:string[] }
const bounded=(x:unknown,max=100000):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
function bests(value:unknown,limit:number):Record<string,Best>{
    if(!value||typeof value!=='object')return {};
    return Object.fromEntries(Object.entries(value).filter(([key,b])=>key.length<100&&b&&bounded(b.attempts)&&bounded(b.seconds,86400)&&bounded(b.hints)).slice(-limit));
}
export function readMemoryProgress(value:unknown):MemoryProgress {
    const empty:MemoryProgress={version:2,missions:{},practiceBest:{},recent:[]};
    if(!value||typeof value!=='object'||!('version'in value)||value.version!==2)return empty;
    const v=value as MemoryProgress;
    for(const [id,m] of Object.entries(v.missions||{}))if(MISSIONS.some(x=>x.id===id)&&m&&[1,2,3].includes(m.stars))empty.missions[id]={stars:m.stars,completedAt:typeof m.completedAt==='string'?m.completedAt:'',best:bests(m.best,8)};
    empty.practiceBest=bests(v.practiceBest,25);empty.recent=Array.isArray(v.recent)?v.recent.filter(id=>typeof id==='string'&&id.length<=100).slice(-20):[];
    return empty;
}
export function presetKey(s:MemorySession){const c=s.config;return `${c.zone}:${c.pairs}:${c.rule}:${c.preview}:${c.relaxed?'relax':'normal'}:${s.hints?'help':'solo'}`;}
function improve(records:Record<string,Best>,key:string,best:Best,limit:number){
    const old=records[key];if(old&&(old.attempts<best.attempts||(old.attempts===best.attempts&&old.seconds<=best.seconds)))return records;
    const next={...records};delete next[key];next[key]=best;return Object.fromEntries(Object.entries(next).slice(-limit));
}
export function completeMemory(profile:StudentProfile,s:MemorySession){
    const fail={accepted:false,changed:false,profile,earned:0,unlocked:[]};
    if(!validSession(s)||s.phase!=='complete')return fail;
    const progress=readMemoryProgress(profile.memoryMatch), r=resultOf(s), key=presetKey(s),best={attempts:s.attempts,seconds:r.seconds,hints:s.hints};
    if(!s.config.missionId){
        if(progress.recent.includes(s.id))return {...fail,accepted:true};
        progress.practiceBest=improve(progress.practiceBest,key,best,25);progress.recent=[...progress.recent,s.id].slice(-20);
        return {...fail,accepted:true,changed:true,profile:{...profile,memoryMatch:progress}};
    }
    const missionId=s.config.missionId,index=MISSIONS.findIndex(m=>m.id===missionId),old=progress.missions[missionId];
    if(index<0||(!old&&index>0&&!progress.missions[MISSIONS[index-1].id]))return fail;
    const stars=Math.max(old?.stars||0,r.stars),earned=stars-(old?.stars||0),records=improve(old?.best||{},key,best,8);
    if(old&&!earned&&records===old.best)return {...fail,accepted:true};
    const now=new Date().toISOString(),date=old?.completedAt||now;
    progress.missions[missionId]={stars,completedAt:date,best:records};
    const entryId=`memory-v2:${profile.id}:${missionId}`,previous=profile.gameHistory.find(g=>g.id===entryId);
    const awards=previous?.starAwards||(old?[{date,amount:old.stars}]:[]);
    // Keep score, duration and assistance metadata from the same best attempt.
    const retain=previous&&(previous.score>r.score||(previous.score===r.score&&previous.durationSeconds<=r.seconds));
    const entry:GameResult={id:entryId,date,gameType:'memory',difficulty:difficultyOf(s.config.pairs),score:retain?previous.score:r.score,maxScore:1000,
        durationSeconds:retain?previous.durationSeconds:r.seconds,starsEarned:stars,starAwards:[...awards,...(earned?[{date:now,amount:earned}]:[])],memory:retain?previous.memory:r.record};
    const prior=structuredClone(profile.stats||initializeStats(profile));
    const stats=old?{...prior,totalStarsEarned:prior.totalStarsEarned+earned}:updateStats(prior,{type:'GAME_COMPLETE',gameResult:{...entry,starsEarned:earned}});
    const updated:StudentProfile={...profile,memoryMatch:progress,stars:profile.stars+earned,stats,gameHistory:[...profile.gameHistory.filter(g=>g.id!==entryId),entry]};
    const achievements=checkAchievements(updated);updated.achievements=achievements.updatedAchievements;updated.stars+=achievements.rewards;
    return {accepted:true,changed:true,profile:updated,earned,unlocked:achievements.unlocked};
}
export function persistMemory(profiles:StudentProfile[],studentId:string,session:MemorySession,write:(p:StudentProfile[])=>void){
    const p=profiles.find(p=>p.id===studentId),failed={ok:false,earned:0,bonusStars:0,achievementNames:[] as string[],profiles,unlocked:[]};if(!p)return failed;
    const r=completeMemory(p,session);if(!r.accepted)return failed;if(!r.changed)return {...failed,ok:true};
    const next=profiles.map(p=>p.id===studentId?r.profile:p);try{write(next);}catch{return failed;}
    return {ok:true,earned:r.earned,profiles:next,unlocked:r.unlocked,bonusStars:r.profile.stars-p.stars-r.earned,achievementNames:r.unlocked.map(a=>ACHIEVEMENTS.find(item=>item.id===a.id)?.title||a.id)};
}
export function readMemoryDraft(studentId:string):{session:MemorySession|null;corrupt:boolean}{
    try{const raw=localStorage.getItem(`memory-draft:${studentId}`);if(!raw)return {session:null,corrupt:false};const s=JSON.parse(raw);return validSession(s)?{session:{...s,paused:true},corrupt:false}:{session:null,corrupt:true};}catch{return {session:null,corrupt:true};}
}
export function saveMemoryDraft(studentId:string,s:MemorySession){try{localStorage.setItem(`memory-draft:${studentId}`,JSON.stringify(s));return true;}catch{return false;}}
export function clearMemoryDraft(studentId:string){try{localStorage.removeItem(`memory-draft:${studentId}`);return true;}catch{return false;}}
