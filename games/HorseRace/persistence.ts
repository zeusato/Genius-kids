import type { Match, Player, Record as HorseRecord } from './model';
import { validateMatch,validateParty } from './engine';
import type { StudentProfile } from '../../types';
import { initializeStats } from '../../services/achievementService';
const key=(owner:string)=>`horse-race-draft-v1:${owner}`;
export function loadDraft(owner:string):{match:Match|null;error:boolean}{try{const raw=localStorage.getItem(key(owner));if(!raw)return{match:null,error:false};const match=JSON.parse(raw);return validateMatch(match,owner)?{match,error:false}:{match:null,error:true};}catch{return{match:null,error:true};}}
export function saveDraft(match:Match):boolean{try{localStorage.setItem(key(match.owner),JSON.stringify(match));return true;}catch{return false;}}
export function loadParty(owner:string):Player[]|null{try{const p=JSON.parse(localStorage.getItem(`horse-race-party:${owner}`)||'null');return validateParty(p)?p:null;}catch{return null;}}
export function saveParty(owner:string,party:Player[]){try{localStorage.setItem(`horse-race-party:${owner}`,JSON.stringify(party));}catch{/* A game can still start if only preferences cannot be stored. */}}
export function clearHorseData(owner:string){for(const storageKey of [key(owner),`horse-race-party:${owner}`,`horse-race-prefs:${owner}`])try{localStorage.removeItem(storageKey);}catch{/* The profile can still be removed if storage is unavailable. */}}
export function persistResult(profiles:StudentProfile[],owner:string,s:Match,write:(p:StudentProfile[])=>void){
  const fail={ok:false,profiles};
  if(!validateMatch(s,owner)||s.phase!=='over')return fail;
  const profile=profiles.find(p=>p.id===owner);if(!profile)return fail;
  if(profile.gameHistory.some(g=>g.id===s.id))return{ok:true,profiles};
  const record:HorseRecord={version:1,hostWon:s.winner===0,winner:s.players[s.winner!].name,players:s.players.map((p,i)=>({name:p.name,kind:p.kind,level:p.level,finished:s.finished[i],captures:s.captures[i]})),turns:s.turn,rulesVersion:1};
  const stats=structuredClone(profile.stats||initializeStats(profile));stats.totalGamesPlayed++;
  if(record.hostWon)stats.gameWins['horse-race']=(stats.gameWins['horse-race']||0)+1;
  const updated={...profile,stats,gameHistory:[...profile.gameHistory,{id:s.id,gameType:'horse-race',date:new Date().toISOString(),score:s.finished[0],maxScore:4,starsEarned:0,durationSeconds:Math.round(s.elapsed/1000),horseRace:record}]};
  const next=profiles.map(p=>p.id===owner?updated:p);try{write(next);return{ok:true,profiles:next};}catch{return fail;}
}
