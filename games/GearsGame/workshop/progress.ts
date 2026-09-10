import type { StudentProfile, GameResult } from '../../../types';
import { initializeStats, updateStats } from '../../../services/achievementService';
import { missionFor } from './content';
import { designError, evaluate } from './engine';
import { LEVELS, type Design, type Difficulty, type WorkshopRecord } from './model';
export interface Draft { version: 1; mission: number; difficulty: Difficulty; seed: number; design: Design }
export function validDraft(raw: unknown): raw is Draft {
    try { const d=raw as Draft; return d?.version===1&&Number.isInteger(d.mission)&&d.mission>=0&&d.mission<6&&LEVELS.some(l=>l.id===d.difficulty)&&Number.isInteger(d.seed)&&d.seed>=1&&d.seed<=2147483647&&!designError(missionFor(d.mission,d.difficulty,d.seed),d.design); } catch { return false; }
}
export function readDraft(id: string): { draft: Draft | null; error: boolean } {
    try {const raw=localStorage.getItem(`gears-workshop:${id}`);if(!raw)return {draft:null,error:false};const data=raw.length<50000?JSON.parse(raw):null;return validDraft(data)?{draft:data,error:false}:{draft:null,error:true};}catch{return {draft:null,error:true};}
}
export function saveDraft(id: string, d: Draft) {try {if(!validDraft(d))return false;localStorage.setItem(`gears-workshop:${id}`,JSON.stringify(d));return true;}catch{return false;}}
export function clearWorkshopData(id: string) {try{localStorage.removeItem(`gears-workshop:${id}`);}catch{}}
export function progressOf(p: StudentProfile): Record<number,number> {
    const result:Record<number,number>={};for(const g of p.gameHistory)if(g.gears?.version===1&&Number.isInteger(g.gears.mission)&&g.gears.mission>=0&&g.gears.mission<6)result[g.gears.mission]=Math.max(result[g.gears.mission]||0,Math.min(3,Math.max(0,g.gears.stars)));
    return result;
}
export function completeWorkshop(profile: StudentProfile, record: WorkshopRecord, seconds: number) {
    const failure={ok:false,earned:0,profile,changed:false};
    if(!validDraft(record))return failure;
    const m=missionFor(record.mission,record.difficulty,record.seed), result=evaluate(m,record.design); if(!result.success)return failure;
    const previous=progressOf(profile)[m.id]||0, earned=Math.max(0,result.stars-previous);
    const id=`gears-workshop:${profile.id}:${m.id}`;
    if(previous&&earned===0)return {...failure,ok:true};
    const now=new Date().toISOString(), old=profile.gameHistory.find(g=>g.id===id);
    const entry:GameResult={id,gameType:'gears-build',difficulty:record.difficulty,date:now,score:result.stars,maxScore:3,durationSeconds:Math.max(0,Math.min(86400,Math.round(Number.isFinite(seconds)?seconds:0))),starsEarned:Math.max(previous,result.stars),gears:{...record,stars:result.stars,design:structuredClone(record.design)},starAwards:[...(old?.starAwards||[]),{date:now,amount:earned}]};
    const base=structuredClone(profile.stats||initializeStats(profile));
    const stats=old?{...base,totalStarsEarned:base.totalStarsEarned+earned}:updateStats(base,{type:'GAME_COMPLETE',gameResult:{...entry,starsEarned:earned}});
    return {ok:true,earned,changed:true,profile:{...profile,stats,stars:profile.stars+earned,gameHistory:[...profile.gameHistory.filter(g=>g.id!==id),entry]}};
}
export function persistWorkshop(profiles: StudentProfile[], id: string, record: WorkshopRecord, seconds: number, write:(p:StudentProfile[])=>void) {
    const p=profiles.find(p=>p.id===id),fail={ok:false,earned:0,profiles};if(!p)return fail;const result=completeWorkshop(p,record,seconds);if(!result.ok)return fail;if(!result.changed)return {...fail,ok:true};
    const next=profiles.map(p=>p.id===id?result.profile:p);try{write(next);}catch{return fail;}return {ok:true,earned:result.earned,profiles:next};
}
