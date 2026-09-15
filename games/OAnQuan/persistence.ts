import type { StudentProfile } from '../../types';
import { initializeStats } from '../../services/achievementService';
import { score, validateMatch, validateParty } from './engine';
import type { GameRecord, Match, Player } from './model';
const key=(owner:string,suffix:string)=>`o-an-quan:${owner}:${suffix}`;
export function saveDraft(s:Match){try{localStorage.setItem(key(s.owner,'draft-v1'),JSON.stringify(s));return true;}catch{return false;}}
export function loadDraft(owner:string):{match:Match|null;error:boolean}{try{const raw=localStorage.getItem(key(owner,'draft-v1'));if(!raw)return{match:null,error:false};const s=JSON.parse(raw);return validateMatch(s,owner)?{match:s,error:false}:{match:null,error:true};}catch{return{match:null,error:true};}}
export function saveParty(owner:string,p:Player[]){try{localStorage.setItem(key(owner,'party'),JSON.stringify(p));}catch{/* Play remains available. */}}
export function loadParty(owner:string):Player[]|null{try{const p=JSON.parse(localStorage.getItem(key(owner,'party'))||'null');return validateParty(p)?p:null;}catch{return null;}}
export function clearOAnQuanData(owner:string){for(const suffix of ['draft-v1','party','prefs'])try{localStorage.removeItem(key(owner,suffix));}catch{/* Profile deletion may still continue. */}}
export function recordOf(s:Match):GameRecord{return{version:1,rulesVersion:s.rulesVersion,hostResult:s.winner===null?'draw':s.winner===0?'win':'loss',players:s.players.map(p=>({...p})),scores:[score(s,0),score(s,1)],banks:s.banks.map(b=>({...b})),collected:[...s.collected],unclaimed:70-score(s,0)-score(s,1),reason:s.reason!,turns:s.turn};}
export function persistResult(profiles:StudentProfile[],owner:string,s:Match,write:(p:StudentProfile[])=>void){
  const fail={ok:false,profiles};if(!validateMatch(s,owner)||s.phase!=='over')return fail;
  const profile=profiles.find(p=>p.id===owner);if(!profile)return fail;
  if(profile.gameHistory.some(g=>g.id===s.id))return{ok:true,profiles};
  const stats=structuredClone(profile.stats||initializeStats(profile));stats.totalGamesPlayed++;
  if(s.winner===0)stats.gameWins['o-an-quan']=(stats.gameWins['o-an-quan']||0)+1;
  const updated={...profile,stats,gameHistory:[...profile.gameHistory,{id:s.id,gameType:'o-an-quan',date:new Date().toISOString(),score:score(s,0),maxScore:70,starsEarned:0,durationSeconds:Math.round(s.elapsed/1000),oAnQuan:recordOf(s)}]};
  const next=profiles.map(p=>p.id===owner?updated:p);try{write(next);return{ok:true,profiles:next};}catch{return fail;}
}
