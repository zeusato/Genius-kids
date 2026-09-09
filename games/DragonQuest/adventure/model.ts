export type RegionId = 'forest' | 'wind' | 'crystal' | 'snow' | 'castle';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Quality = 'light' | 'balanced' | 'detailed';
export type Topic = 'mixed' | 'math' | 'observe' | 'knowledge';
import type { BuffType, PlayerBuffs, TeleportInfo } from '../engine/types';
export type NodeKind = 'normal' | 'combat' | 'buff' | 'teleport' | 'boss';
export interface Region { id:RegionId; name:string; description:string; dragon:string; gift:string; color:string; ground:string; rock:string; sky:string; accent:string }
export interface Mission { id:string; region:RegionId; index:number; title:string; brief:string; bossShields:number; gift:string }
export interface MapNode { id:string; index:number; kind:NodeKind; x:number; z:number; next:string[]; title:string }
export interface Config { missionId:string; grade:number; difficulty:Difficulty; topic:Topic; mode:'story'|'challenge'; ai:boolean }
export type Task =
 | { kind:'arithmetic'; a:number; b:number; op:'add'|'subtract'|'multiply'|'divide'; target:'result'|'missing' }
 | { kind:'count'; left:number; right:number; object:'gem'|'apple'|'star' }
 | { kind:'clock'; hour:number; minute:number }
 | { kind:'shape'; shape:'circle'|'square'|'triangle'|'rectangle' }
 | { kind:'color'; color:'red'|'blue'|'green'|'yellow'|'purple'|'pink' }
 | { kind:'fact'; factId:string };
export type TaskKind = Task['kind'];
export interface Slot { id:string; nodeId:string; bossPhase:number; kind:TaskKind; difficulty:Difficulty; input:boolean }
export interface Question { id:string; slotId:string; task:Task; text:string; leadIn:string; options:{id:string;text:string}[]; answer:string; hint:string; explanation:string; input:boolean; source:'ai'|'local' }
export interface Prepared { questions:Record<string,Question>; source:'ai'|'local'|'mixed'; hash:string; notice:string }
export type Phase = 'readyToRoll'|'rolling'|'moving'|'landing'|'intro'|'question'|'feedback'|'teleport'|'won'|'lost';
export interface Attempt { slotId:string; answers:number; assisted:boolean; resolved:boolean; firstCorrect:boolean; guided?:boolean }
export interface Session {
 version:3; id:string; studentId:string; seed:number; config:Config; map:MapNode[]; slots:Slot[]; prepared:Prepared;
 phase:Phase; paused:boolean; position:string; previousPosition:string; visited:string[]; resolved:string[]; elapsedMs:number; phaseMs:number;
 energy:number; buffs:PlayerBuffs; bossPhase:number; bossTotal:number; attempts:Record<string,Attempt>; combo:number; bestCombo:number;
 dice:number|null; target:number; turn:number; rngCount:number; encounter:number; score:number; pendingBuff:BuffType|null;
 teleport:(TeleportInfo & {protected:boolean})|null;
 feedback:null|{correct:boolean; answer:string; timedOut:boolean; score:number; buff:BuffType|null}; questionReady:boolean; questionMs:number; fx:number; rewardCommitted:boolean;
}
export type Event = { sessionId:string } & (
 | {type:'roll'} | {type:'tick';ms:number} | {type:'continue'} | {type:'ready'} | {type:'listen'}
 | {type:'answer';slotId:string;encounter:number;value:string} | {type:'hint'}
 | {type:'pause'} | {type:'resume'} | {type:'commit'}
);
export interface DragonRecord { missionId:string; source:Prepared['source']; aiRequested:boolean; batchHash:string; mode:Config['mode']; difficulty:Difficulty; grade:number; topic:Topic; independent:number; assisted:number; total:number; bestCombo:number; score?:number; rolls?:number; remainingHp?:number; medal?:'gold'|'silver'|'bronze'|null }
export interface Preferences {ai:boolean;difficulty:Difficulty;topic:Topic;mode:Config['mode'];quality:Quality;reduced:boolean;voice:boolean;renderer:'3d'|'2d';heroColor:string;camera?:'follow'|'free'}
export function rng(seed:number){let a=seed|0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function hash(value:unknown){const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16);}

