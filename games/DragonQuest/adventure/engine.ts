import { Attempt, Config, DragonRecord, Event, Prepared, Session, hash, rng } from './model';
import { createMap, createSlots, missionOf } from './content';
import { correct, validConfig, validatePrepared } from './questions';
import { DICE_MS, STEP_MS, LAND_DELAY_MS, MAX_HP, SCORE } from '../engine/constants';
import { calculateBossQuestions, calculateTeleport, getRandomBuff, rollDice } from '../engine/mechanics';
import { addBuff } from '../engine/buffs';
import { BuffType } from '../engine/types';
export { DICE_MS, STEP_MS, LAND_DELAY_MS };
export const nodeOf=(s:Session)=>s.map.find(n=>n.id===s.position)!;
export const slotOf=(s:Session)=>s.slots.find(q=>q.nodeId===s.position&&q.bossPhase===s.bossPhase);
export const questionOf=(s:Session)=>{const slot=slotOf(s);return slot?s.prepared.questions[slot.id]:null;};
export const attemptKey=(s:Session)=>`${slotOf(s)?.id}@${s.encounter}`;
export const attemptOf=(s:Session)=>s.attempts[attemptKey(s)];
export const finished=(s:Session)=>s.phase==='won'||s.phase==='lost';
export const timeLimit=(s:Session)=>(s.config.grade===0?40:s.config.difficulty==='easy'?40:s.config.difficulty==='medium'?32:25)*1000;
export const medalOf=(s:Session)=>s.phase!=='won'?null:s.energy===3?'gold':s.energy===2?'silver':'bronze';
const randomFor=(s:Session)=>rng(s.seed^Math.imul(s.rngCount+1,0x9e3779b9));
export function createSession(config:Config,seed:number,id:string,studentId:string,prepared:Prepared):Session{
 const map=createMap(config.missionId,seed),slots=createSlots(config,map);
 if(!validConfig(config)||!validatePrepared(prepared,slots,config))throw new Error('Bộ câu hỏi chưa sẵn sàng.');
 return {version:3,id,studentId,seed,config,map,slots,prepared,phase:'readyToRoll',paused:false,position:'tile-0',previousPosition:'tile-0',visited:['tile-0'],resolved:[],elapsedMs:0,phaseMs:0,energy:3,buffs:{holySword:0,holyGrail:0,flyingCloak:false},bossPhase:0,bossTotal:5,attempts:{},combo:0,bestCombo:0,feedback:null,questionReady:false,questionMs:0,fx:0,rewardCommitted:false,dice:null,target:0,turn:0,rngCount:0,encounter:0,score:0,pendingBuff:null,teleport:null};
}
/** Only landings trigger events; every intervening tile is just a movement step. */
function arrive(s:Session):Session{
 const node=nodeOf(s),next={...s,phaseMs:0,questionMs:0,questionReady:false,feedback:null,pendingBuff:null,teleport:null,bossPhase:0};
 if(node.kind==='normal')return {...next,phase:'readyToRoll'};
 if(node.kind==='teleport'){const tp=calculateTeleport(node.index,s.map.length,randomFor(s));return {...next,phase:'teleport',rngCount:s.rngCount+1,teleport:{...tp,protected:tp.isBackward&&s.buffs.flyingCloak},fx:s.fx+1};}
 return {...next,phase:'intro',encounter:s.encounter+1,bossTotal:calculateBossQuestions(s.buffs.holySword),pendingBuff:node.kind==='buff'?getRandomBuff(randomFor(s)):null,rngCount:s.rngCount+(node.kind==='buff'?1:0)};
}
function answer(s:Session,value:string,timedOut=false):Session{
 // Narration readiness controls the challenge clock, never the player's answer.
 const q=questionOf(s);if(!q||s.phase!=='question')return s;
 const key=attemptKey(s),old=attemptOf(s);if(old?.answers)return s;
 const ok=correct(q,value),node=nodeOf(s),entry:Attempt={slotId:q.slotId,answers:1,assisted:!!old?.assisted,resolved:ok,firstCorrect:ok&&!old?.assisted};
 const score=ok?node.kind==='boss'?SCORE.boss:node.kind==='buff'?SCORE.buff:SCORE.combat:0;
 let next:Session={...s,phase:'feedback',attempts:{...s.attempts,[key]:entry},feedback:{correct:ok,answer:value,timedOut,score,buff:ok&&node.kind==='buff'?s.pendingBuff:null},questionReady:false,combo:ok?s.combo+1:0,bestCombo:Math.max(s.bestCombo,ok?s.combo+1:0),score:s.score+score,fx:s.fx+1};
 if(!ok&&node.kind!=='buff')next.energy=Math.max(0,s.energy-1);
 if(ok&&node.kind==='buff'&&s.pendingBuff){const result=addBuff(s.buffs,s.energy,s.pendingBuff,MAX_HP);next={...next,buffs:result.buffs,energy:result.hp};}
 return next;
}
export function reduce(s:Session,e:Event):Session{
 if(e.sessionId!==s.id)return s;
 if(e.type==='commit')return finished(s)?{...s,rewardCommitted:true}:s;
 if(e.type==='pause')return finished(s)||s.paused?s:{...s,paused:true,questionReady:false};
 if(e.type==='resume')return s.paused?{...s,paused:false}:s;
 if(s.paused||finished(s))return s;
 switch(e.type){
  case 'roll':{
   if(s.phase!=='readyToRoll')return s;const dice=rollDice(randomFor(s));
   return {...s,phase:'rolling',phaseMs:0,dice,target:Math.min(49,nodeOf(s).index+dice),turn:s.turn+1,rngCount:s.rngCount+1,feedback:null,teleport:null};
  }
  case 'tick':{
   if(!Number.isFinite(e.ms)||e.ms<=0)return s;const ms=Math.min(e.ms,1000);let next={...s,elapsedMs:s.elapsedMs+ms};
   if(['rolling','moving','landing'].includes(s.phase)){
    next.phaseMs+=ms;
    if(s.phase==='rolling'&&next.phaseMs>=DICE_MS)next={...next,phase:'moving',phaseMs:0};
    else if(s.phase==='moving'){
     while(next.phaseMs>=STEP_MS&&nodeOf(next).index<next.target){const id=`tile-${nodeOf(next).index+1}`;next={...next,phaseMs:next.phaseMs-STEP_MS,previousPosition:next.position,position:id,visited:[...new Set([...next.visited,id])]};}
     if(nodeOf(next).index>=next.target)next={...next,phase:'landing',phaseMs:0};
    }else if(s.phase==='landing'&&next.phaseMs>=LAND_DELAY_MS)next=arrive(next);
   }
   if(s.phase==='question'&&s.questionReady&&s.config.mode==='challenge'){next.questionMs+=ms;if(next.questionMs>=timeLimit(s))next=answer(next,'',true);}
   return next;
  }
  case 'ready':return s.phase==='question'?{...s,questionReady:true}:s;
  case 'listen':return s.phase==='question'?{...s,questionReady:false}:s;
  case 'answer':return slotOf(s)?.id===e.slotId&&s.encounter===e.encounter?answer(s,e.value):s;
  case 'hint':{
   const q=questionOf(s);if(s.phase!=='question'||!q)return s;const key=attemptKey(s),a=attemptOf(s)||{slotId:q.slotId,answers:0,assisted:false,resolved:false,firstCorrect:false};return {...s,attempts:{...s.attempts,[key]:{...a,assisted:true}}};
  }
  case 'continue':{
   if(s.phase==='intro')return {...s,phase:'question',questionReady:false,questionMs:0};
   if(s.phase==='teleport'&&s.teleport){
    const tp=s.teleport;
    // A zero-distance portal must release the dice, never loop on itself.
    if(tp.protected||tp.newPosition===nodeOf(s).index)return {...s,phase:'readyToRoll',teleport:null};
    const id=`tile-${tp.newPosition}`;return {...s,phase:'landing',previousPosition:s.position,position:id,target:tp.newPosition,visited:[...new Set([...s.visited,id])],teleport:null,phaseMs:0};
   }
   if(s.phase!=='feedback'||!s.feedback)return s;
   const next={...s,resolved:[...new Set([...s.resolved,slotOf(s)!.id])],feedback:null,questionMs:0,questionReady:false,pendingBuff:null};
   if(s.energy===0)return {...next,phase:'lost'};
   // Original boss rule: correct AND incorrect answers consume one question.
   if(nodeOf(s).kind==='boss')return {...next,bossPhase:s.bossPhase+1,phase:s.bossPhase+1>=s.bossTotal?'won':'intro',fx:s.fx+1};
   return {...next,phase:'readyToRoll'};
  }
  default:return s;
 }
}
export function recordOf(s:Session):DragonRecord{const all=Object.values(s.attempts).filter(a=>a.answers>0);return {missionId:s.config.missionId,source:s.prepared.source,aiRequested:s.config.ai,batchHash:s.prepared.hash,mode:s.config.mode,difficulty:s.config.difficulty,grade:s.config.grade,topic:s.config.topic,independent:all.filter(a=>a.firstCorrect).length,assisted:all.filter(a=>a.assisted).length,total:all.length,bestCombo:s.bestCombo,score:s.score,rolls:s.turn,remainingHp:s.energy,medal:medalOf(s)};}
export function starsOf(s:Session){return s.phase==='won'?3:0;}
export function validSession(v:any):v is Session{
 try{
  const s=v as Session;if(!s||s.version!==3||typeof s.id!=='string'||s.id.length>100||typeof s.studentId!=='string'||!Number.isInteger(s.seed)||!validConfig(s.config)||!missionOf(s.config.missionId))return false;
  const map=createMap(s.config.missionId,s.seed),slots=createSlots(s.config,map);
  if(hash(s.map)!==hash(map)||hash(s.slots)!==hash(slots)||!validatePrepared(s.prepared,slots,s.config)||!map.some(n=>n.id===s.position)||!map.some(n=>n.id===s.previousPosition))return false;
  if(!['readyToRoll','rolling','moving','landing','intro','question','feedback','teleport','won','lost'].includes(s.phase)||typeof s.paused!=='boolean'||typeof s.questionReady!=='boolean'||typeof s.rewardCommitted!=='boolean')return false;
  const int=(n:unknown,min:number,max:number)=>Number.isInteger(n)&&Number(n)>=min&&Number(n)<=max;
  if(!int(s.energy,0,3)||!int(s.buffs?.holySword,0,2)||!int(s.buffs?.holyGrail,0,3)||typeof s.buffs?.flyingCloak!=='boolean'||!int(s.target,0,49)||!int(s.bossTotal,3,5)||!int(s.bossPhase,0,s.bossTotal)||s.dice!==null&&!int(s.dice,1,6))return false;
  if(!['turn','rngCount','encounter','score','combo','bestCombo','fx'].every(k=>int(s[k],0,1000000))||!['elapsedMs','phaseMs','questionMs'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=86400000))return false;
  if(!Array.isArray(s.visited)||s.visited.length>50||s.visited[0]!=='tile-0'||new Set(s.visited).size!==s.visited.length||!s.visited.includes(s.position)||s.visited.some(id=>!map.some(n=>n.id===id)))return false;
  if(!Array.isArray(s.resolved)||new Set(s.resolved).size!==s.resolved.length||s.resolved.some(id=>!slots.some(slot=>slot.id===id&&s.visited.includes(slot.nodeId))))return false;
  if(!s.attempts||typeof s.attempts!=='object'||Object.keys(s.attempts).length>10000)return false;
  for(const [key,a]of Object.entries(s.attempts)){if(!a||!slots.some(slot=>slot.id===a.slotId&&s.visited.includes(slot.nodeId))||!key.startsWith(a.slotId+'@')||!int(Number(key.split('@')[1]),1,s.encounter)||!int(a.answers,0,1)||typeof a.assisted!=='boolean'||typeof a.resolved!=='boolean'||typeof a.firstCorrect!=='boolean'||a.firstCorrect&&(!a.resolved||a.assisted)||a.resolved&&a.answers!==1)return false;}
  const earned=Object.values(s.attempts).reduce((sum,a)=>{const slot=slots.find(q=>q.id===a.slotId)!;const kind=map.find(n=>n.id===slot.nodeId)!.kind;return sum+(a.resolved?(kind==='boss'?SCORE.boss:kind==='buff'?SCORE.buff:SCORE.combat):0);},0);
  if(s.score!==earned)return false;
  if(['intro','question','feedback'].includes(s.phase)&&!slotOf(s))return false;
  if(s.phase==='feedback'&&(!s.feedback||typeof s.feedback.correct!=='boolean'||typeof s.feedback.answer!=='string'||attemptOf(s)?.answers!==1))return false;
  if(s.pendingBuff!==null&&!Object.values(BuffType).includes(s.pendingBuff))return false;
  if(s.phase==='teleport'){const tp=s.teleport;if(nodeOf(s).kind!=='teleport'||!tp||!int(tp.distance,-8,8)||tp.newPosition!==Math.max(0,Math.min(49,nodeOf(s).index+tp.distance))||tp.isBackward!==(tp.distance<0)||tp.protected!==(tp.isBackward&&s.buffs.flyingCloak))return false;}
  if(s.phase==='won'){if(nodeOf(s).index!==49||s.energy===0||s.bossTotal!==calculateBossQuestions(s.buffs.holySword)||s.bossPhase!==s.bossTotal)return false;for(let i=0;i<s.bossTotal;i++)if(s.attempts[`tile-49:${i}@${s.encounter}`]?.answers!==1||!s.resolved.includes(`tile-49:${i}`))return false;}
  if(s.phase==='lost'&&s.energy!==0)return false;
  return true;
 }catch{return false;}
}

