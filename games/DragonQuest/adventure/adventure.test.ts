import { describe, expect, it, vi } from 'vitest';
import { Grade, StudentProfile } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
import { migrateProfile } from '../../../services/profileService';
import { generateMap } from '../engine/map';
import { makeRng } from '../engine/rng';
import { BuffType } from '../engine/types';
import { buildRequest, parseBatch, prepareQuestions } from './ai';
import { createMap, createSlots, MISSIONS } from './content';
import { attemptOf, createSession, finished, medalOf, nodeOf, questionOf, recordOf, reduce, timeLimit, validSession } from './engine';
import { Config, Event, NodeKind, Session, hash } from './model';
import { completeDragon, persistDragon, readDraft, readProgress, saveDraft, unlocked } from './progress';
import { assemble, correct, createLocalQuestions, validatePrepared, validateTask } from './questions';

const config=(p:Partial<Config>={}):Config=>({missionId:'forest-1',grade:2,difficulty:'easy',topic:'mixed',mode:'story',ai:false,...p});
const slotsFor=(c:Config)=>createSlots(c,createMap(c.missionId,42));
function fresh(c=config(),seed=42){return createSession(c,seed,`round-${seed}`,'dragon-test',assemble(createLocalQuestions(c,createSlots(c,createMap(c.missionId,seed)),seed)));}
function event(s:Session,e:Omit<Event,'sessionId'>|Record<string,unknown>){return reduce(s,{...e,sessionId:s.id} as Event);}
// Focused event fixtures enter a real tile through the landing transition.
function land(s:Session,index:number){const id=`tile-${index}`;return event({...s,phase:'landing',position:id,target:index,visited:[...new Set([...s.visited,id])],phaseMs:0},{type:'tick',ms:350});}
function atKind(kind:NodeKind,s=fresh()){return land(s,s.map.find(n=>n.kind===kind&&n.index>0)!.index);}
function toQuestion(s=fresh()){return event(event(atKind('combat',s),{type:'continue'}),{type:'ready'});}
function answer(s:Session,ok=true){const q=questionOf(s)!;return event(s,{type:'answer',encounter:s.encounter,slotId:q.slotId,value:q.input?ok?q.answer:'999999':q.options.find(o=>(o.text===q.answer)===ok)!.id});}
function win(c=config(),_unused=false,assisted=false,seed=42){let s=fresh(c,seed);for(let i=0;i<2500&&!finished(s);i++){
 if(s.phase==='readyToRoll')s=event(s,{type:'roll'});
 else if(['rolling','moving','landing'].includes(s.phase))s=event(s,{type:'tick',ms:1000});
 else if(s.phase==='question'){s=event(s,{type:'ready'});if(assisted)s=event(s,{type:'hint'});s=answer(s);}
 else s=event(s,{type:'continue'});
 }
 expect(s.phase).toBe('won');return s;
}
function profile():StudentProfile{const p:StudentProfile={id:'dragon-test',name:'Dragon',age:8,grade:Grade.Grade2,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:7,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[{id:'legacy',date:'2026-01-01',gameType:'dragon-quest',score:10,maxScore:20,starsEarned:1,difficulty:'easy',durationSeconds:20}],shopDailyPhotos:[],achievements:[]};p.stats=initializeStats(p);return p;}

describe('Dragon board matches the original rules',()=>{
 it('exposes all 50 tiles, identical to the original seeded map and distribution',()=>{for(const seed of [1,42,813,2026]){
  const map=createMap('forest-1',seed);expect(map.map(n=>n.kind)).toEqual(generateMap(makeRng(seed)).map(n=>n.type));expect(map).toHaveLength(50);
  expect(['combat','buff','teleport','normal','boss'].map(k=>map.filter(n=>n.kind===k).length)).toEqual([19,9,7,14,1]);
  map.forEach((n,i)=>{expect(n.index).toBe(i);expect(n.next).toEqual(i===49?[]:[`tile-${i+1}`]);if(i<49)expect(Math.hypot(n.x-map[i+1].x,n.z-map[i+1].z)).toBeLessThanOrEqual(1.51);});
 }});
 it('rolls 1–6, ignores double taps, steps through tiles and triggers only the landing tile',()=>{
  const seen=new Set<number>();for(let seed=1;seed<=36;seed++){
   let s=fresh(config(),seed);expect(s.phase).toBe('readyToRoll');expect(s.map).toHaveLength(50);expect(s.encounter).toBe(0);
   s=event(s,{type:'roll'});seen.add(s.dice!);expect(s.target).toBe(s.dice);expect(event(s,{type:'roll'})).toBe(s);
   s=event(s,{type:'tick',ms:1000});expect(s.phase).toBe('rolling');s=event(s,{type:'tick',ms:100});expect(s.phase).toBe('moving');
   const target=s.target;for(let i=1;i<=target;i++){s=event(s,{type:'tick',ms:300});expect(nodeOf(s).index).toBe(i);expect(s.encounter).toBe(0);expect(s.energy).toBe(3);expect(s.score).toBe(0);}
   expect(s.phase).toBe('landing');s=event(s,{type:'tick',ms:350});expect(s.phase).toBe(nodeOf(s).kind==='normal'?'readyToRoll':nodeOf(s).kind==='teleport'?'teleport':'intro');
  }expect([...seen].sort()).toEqual([1,2,3,4,5,6]);
 });
 it('clamps an overshoot at tile 50 and preserves the dice across reload',()=>{let s=fresh();s={...s,position:'tile-48',visited:['tile-0','tile-48']};const rolled=event(s,{type:'roll'});expect(rolled.target).toBe(49);expect(validSession(rolled)).toBe(true);expect(event(rolled,{type:'tick',ms:1000})).toEqual(event(JSON.parse(JSON.stringify(rolled)),{type:'tick',ms:1000}));});
 it('normal tiles release the dice; correct combat earns 10 and a miss costs one HP immediately',()=>{expect(atKind('normal').phase).toBe('readyToRoll');const s=toQuestion();expect(answer(s).score).toBe(10);const missed=answer(s,false);expect(missed.energy).toBe(2);expect(event(missed,{type:'continue'}).phase).toBe('readyToRoll');expect(event(answer({...s,energy:1},false),{type:'continue'}).phase).toBe('lost');});
 it('fairy questions award 15 and the original passive buffs, with original caps',()=>{for(const buff of Object.values(BuffType)){
  let s=event(event(atKind('buff'),{type:'continue'}),{type:'ready'});s={...s,energy:2,pendingBuff:buff};const right=answer(s);expect(right.score).toBe(15);expect(right.feedback?.buff).toBe(buff);expect(answer(s,false).energy).toBe(2);
  if(buff===BuffType.HolySword)expect(right.buffs.holySword).toBe(1);
  if(buff===BuffType.HolyGrail)expect(right.energy).toBe(3);
  if(buff===BuffType.FlyingCloak)expect(right.buffs.flyingCloak).toBe(true);
  const capped=answer({...s,buffs:{holySword:2,holyGrail:3,flyingCloak:true}});expect(capped.buffs).toEqual({holySword:2,holyGrail:3,flyingCloak:true});expect(capped.energy).toBe(2);
 }});
 it('teleports in [-8,+8], triggers the destination and lets the persistent cloak block backward moves',()=>{
  const distances=new Set<number>();for(let n=0;n<100;n++){
   const s=atKind('teleport',{...fresh(),rngCount:n});const tp=s.teleport!;distances.add(tp.distance);expect(tp.newPosition).toBe(Math.max(0,Math.min(49,nodeOf(s).index+tp.distance)));
   const moved=event(s,{type:'continue'});if(tp.newPosition===nodeOf(s).index){expect(moved.phase).toBe('readyToRoll');continue;}
   expect(nodeOf(moved).index).toBe(tp.newPosition);expect(moved.phase).toBe('landing');const arrived=event(moved,{type:'tick',ms:350});expect(arrived.phase).toBe(nodeOf(arrived).kind==='normal'?'readyToRoll':nodeOf(arrived).kind==='teleport'?'teleport':'intro');
   const protectedState=atKind('teleport',{...fresh(),rngCount:n,buffs:{holySword:0,holyGrail:0,flyingCloak:true}});const after=event(protectedState,{type:'continue'});if(tp.isBackward){expect(after.position).toBe(s.position);expect(after.phase).toBe('readyToRoll');}expect(after.buffs.flyingCloak).toBe(true);
  }expect(distances.size).toBe(17);
 });
 it('uses 5 minus swords boss questions; wrong answers consume a question and death takes priority',()=>{for(const swords of [0,1,2]){
  let s=atKind('boss',{...fresh(),buffs:{holySword:swords,holyGrail:0,flyingCloak:false}});expect(s.bossTotal).toBe(5-swords);
  for(let i=0;i<s.bossTotal;i++){s=event(event(s,{type:'continue'}),{type:'ready'});s=answer(s,i!==0);s=event(s,{type:'continue'});expect(s.bossPhase).toBe(i+1);}
  expect(s.phase).toBe('won');expect(s.energy).toBe(2);expect(s.score).toBe((s.bossTotal-1)*20);expect(medalOf(s)).toBe('silver');expect(validSession(s)).toBe(true);
 }
 let dead=atKind('boss',fresh());dead={...dead,bossPhase:4,energy:1};dead=event(event(dead,{type:'continue'}),{type:'ready'});expect(event(answer(dead,false),{type:'continue'}).phase).toBe('lost');
 });
 it('revisiting a tile reuses its prepared question with a new guarded attempt',()=>{let s=toQuestion();const encounter=s.encounter,slot=questionOf(s)!.slotId;s=event(answer(s),{type:'continue'});s=land(s,nodeOf(s).index);s=event(event(s,{type:'continue'}),{type:'ready'});expect(s.encounter).toBe(encounter+1);expect(questionOf(s)!.slotId).toBe(slot);expect(event(s,{type:'answer',slotId:slot,encounter,value:'a'})).toBe(s);s=answer(s);expect(recordOf(s).total).toBe(2);expect(s.score).toBe(20);expect(validSession(s)).toBe(true);});
});

describe('Dragon questions, clocks and durable sessions',()=>{
 it('prepares 33 slots including all possible boss questions for every grade and topic',()=>{
  for(const m of MISSIONS)for(const grade of [0,1,2,3,4,5])for(const topic of ['mixed','math','observe','knowledge'] as const)for(const difficulty of ['easy','medium','hard'] as const){
   const c=config({missionId:m.id,grade,topic,difficulty}),slots=slotsFor(c),q=createLocalQuestions(c,slots,813+m.index);expect(slots).toHaveLength(33);expect(validatePrepared(assemble(q),slots,c),JSON.stringify(c)).toBe(true);
  }
 });
 it('completes all missions by rolling and answering, with valid serialized victory proof',()=>{for(const m of MISSIONS){const s=win(config({missionId:m.id}),false,false,42+m.index);expect(validSession(JSON.parse(JSON.stringify(s))),m.id).toBe(true);expect(recordOf(s).independent).toBe(recordOf(s).total);expect(medalOf(s)).toBe('gold');}});
 it('rejects invalid task scopes and mismatched canonical answers',()=>{const c=config({grade:1}),slot={...slotsFor(c)[0],kind:'arithmetic' as const};expect(validateTask({kind:'arithmetic',a:99,b:8,op:'add',target:'result'},slot,c)).toBe(false);const s=fresh();s.prepared.questions[s.slots[0].id].answer='evil';s.prepared.hash=hash(s.prepared.questions);expect(validSession(s)).toBe(false);});
 it('normalizes numeric input but never accepts option text as an option id',()=>{const s=fresh(config({missionId:'forest-4',topic:'math'}));for(const q of Object.values(s.prepared.questions)){expect(correct(q,q.input?' 00'+q.answer+' ':q.options.find(o=>o.text===q.answer)!.id)).toBe(true);expect(correct(q,q.input?'1e2':q.answer)).toBe(false);}});
 it('guards invalid moves, stale sessions, duplicate answers and unanswered continuation',()=>{const s=fresh();expect(event(s,{type:'move',nodeId:'tile-49'})).toBe(s);const q=toQuestion(s);expect(event(q,{type:'continue'})).toBe(q);expect(reduce(q,{type:'roll',sessionId:'stale'})).toBe(q);const a=answer(q);expect(answer(a)).toBe(a);expect(attemptOf(a)?.answers).toBe(1);});
 it('pauses movement and challenge clocks, gates reading and survives JSON resume',()=>{let s=toQuestion(fresh(config({mode:'challenge'})));s=event(s,{type:'listen'});s=event(s,{type:'tick',ms:1000});expect(s.questionMs).toBe(0);s=event(s,{type:'ready'});s=event(s,{type:'tick',ms:500});expect(s.questionMs).toBe(500);s=event(s,{type:'pause'});expect(event(s,{type:'tick',ms:1000})).toBe(s);expect(validSession(JSON.parse(JSON.stringify(s)))).toBe(true);s=event(s,{type:'resume'});expect(s.questionReady).toBe(false);s=event(s,{type:'ready'});expect(event(s,{type:'tick',ms:500}).questionMs).toBe(1000);});
 it('timeout costs exactly once; standard mode does not count down',()=>{let s=toQuestion(fresh(config({mode:'challenge'})));s=event({...s,questionMs:timeLimit(s)-200},{type:'tick',ms:300});expect(s.phase).toBe('feedback');expect(s.energy).toBe(2);expect(s.feedback?.timedOut).toBe(true);expect(event(s,{type:'tick',ms:1000}).energy).toBe(2);expect(event(toQuestion(),{type:'tick',ms:1000}).questionMs).toBe(0);});
 it('rejects old branching snapshots, corrupt maps and forged incomplete victory',()=>{const s=win();expect(validSession({...s,version:2})).toBe(false);expect(validSession({...s,map:s.map.slice(0,10)})).toBe(false);expect(validSession({...s,questionMs:NaN})).toBe(false);expect(validSession({...s,attempts:{}})).toBe(false);expect(validSession({...s,prepared:{...s.prepared,hash:'x'}})).toBe(false);});
});
describe('Dragon AI preparation',()=>{
 const c=config({ai:true}),slots=slotsFor(c),local=createLocalQuestions(c,slots,123);
 const raw=(questions=Object.values(local))=>JSON.stringify({schemaVersion:1,questions:questions.map(q=>({slotId:q.slotId,task:q.task,correctAnswer:q.answer,leadIn:'Cánh cổng đang đợi phép thuật của em.'}))});
 it('builds its prompt entirely from configuration and map slots',()=>{const request=buildRequest(c,slots,42),data=JSON.parse(request.contents[0].parts[0].text);expect(data.grade).toBe(2);expect(data.slots.map(s=>s.slotId)).toEqual(slots.map(s=>s.id));expect(data).not.toHaveProperty('studentId');expect(data).not.toHaveProperty('apiKey');});
 it('toggle off makes no request; toggle on freezes a complete verified batch',async()=>{const generate=vi.fn(async()=>raw());const a=await prepareQuestions({...c,ai:false},slots,42,{signal:new AbortController().signal,generate});expect(a.source).toBe('local');expect(generate).not.toHaveBeenCalled();const b=await prepareQuestions(c,slots,42,{signal:new AbortController().signal,generate});expect(b.source).toBe('ai');expect(validatePrepared(b,slots,c)).toBe(true);expect(generate).toHaveBeenCalledTimes(1);});
 it('rejects duplicate slots, unknown slots, wrong answers and injected descriptions',()=>{const data=JSON.parse(raw());data.questions[0].correctAnswer='999999';data.questions[1].leadIn='<script>hack</script>';data.questions.push(data.questions[2],{...data.questions[3],slotId:'not-on-map'});const accepted=parseBatch(JSON.stringify(data),c,slots,42);expect(accepted[slots[0].id]).toBeUndefined();expect(accepted[slots[1].id]).toBeUndefined();expect(accepted[slots[2].id]).toBeUndefined();expect(accepted['not-on-map']).toBeUndefined();expect(Object.keys(accepted).length).toBeGreaterThan(0);});
 it('repairs only missing slots once, retaining valid AI questions and filling the rest locally',async()=>{const generate=vi.fn().mockResolvedValueOnce(raw(Object.values(local).slice(0,2))).mockResolvedValueOnce('{bad');const p=await prepareQuestions(c,slots,42,{signal:new AbortController().signal,generate});expect(generate).toHaveBeenCalledTimes(2);const repair=JSON.parse(generate.mock.calls[1][0].contents[0].parts[0].text);expect(repair.slots).toHaveLength(slots.length-2);expect(repair.excluded).toHaveLength(2);expect(p.source).toBe('mixed');expect(validatePrepared(p,slots,c)).toBe(true);expect(p.questions[slots[0].id].task).toEqual(local[slots[0].id].task);});
 it('times out uncooperative transport and never swaps in late questions',async()=>{let late:(v:string)=>void;const generate=vi.fn(()=>new Promise<string>(r=>late=r));const p=await prepareQuestions(c,slots,42,{signal:new AbortController().signal,generate,budgetMs:10});expect(p.source).toBe('local');const frozen=JSON.stringify(p);late!(raw());await Promise.resolve();expect(JSON.stringify(p)).toBe(frozen);expect(generate).toHaveBeenCalledTimes(1);});
 it('external cancellation rejects instead of starting a fallback round',async()=>{const controller=new AbortController();const p=prepareQuestions(c,slots,42,{signal:controller.signal,generate:()=>new Promise(()=>{})});controller.abort();await expect(p).rejects.toMatchObject({name:'AbortError'});});
 it('offline, unavailable key and transport failures use a full valid local batch',async()=>{for(const generate of [undefined,async()=>{throw Error('429');}]){const p=await prepareQuestions(c,slots,42,{signal:new AbortController().signal,generate});expect(p.source).toBe('local');expect(validatePrepared(p,slots,c)).toBe(true);}});
});
describe('Dragon durable campaign rewards',()=>{
 it('awards exactly sixty campaign stars across all missions and never farms AI replays',()=>{let p=profile(),earned=0;for(const m of MISSIONS){const r=completeDragon(p,win(config({missionId:m.id})));expect(r.accepted,m.id).toBe(true);earned+=r.earned;p=r.profile;}expect(earned).toBe(60);expect(Object.keys(p.dragonQuest!.missions)).toHaveLength(20);for(const m of MISSIONS){const r=completeDragon(p,win(config({missionId:m.id,ai:true,mode:'challenge'})));expect(r.earned).toBe(0);p=r.profile;}expect(p.gameHistory.filter(g=>g.dragon)).toHaveLength(20);expect(p.gameHistory[0].id).toBe('legacy');});
 it('assisted play unlocks next mission, but records help separately',()=>{const first=completeDragon(profile(),win(config(),true,true));expect(first.earned).toBe(3);expect(first.profile.gameHistory.at(-1)!.dragon!.assisted).toBeGreaterThan(0);expect(unlocked('forest-2',readProgress(first.profile.dragonQuest))).toBe(true);expect(completeDragon(first.profile,win()).earned).toBe(0);expect(completeDragon(profile(),win(config({missionId:'forest-2'}))).accepted).toBe(false);});
 it('failed storage never publishes changes; retry is atomic and idempotent',()=>{const p=profile(),profiles=[p,{...p,id:'other'}],before=structuredClone(profiles),s=win();const failure=persistDragon(profiles,p.id,s,()=>{throw Error('quota');});expect(failure.ok).toBe(false);expect(profiles).toEqual(before);const write=vi.fn(),first=persistDragon(profiles,p.id,s,write),again=persistDragon(first.profiles,p.id,s,write);expect(first.earned).toBe(3);expect(again.ok).toBe(true);expect(again.earned).toBe(0);expect(write).toHaveBeenCalledTimes(1);expect(first.profiles[1]).toEqual(before[1]);expect(persistDragon(profiles,'other',s,write).ok).toBe(false);});
 it('migrates progress and preserves a full snapshot independently per profile',()=>{const p=completeDragon(profile(),win()).profile;expect(migrateProfile(JSON.parse(JSON.stringify(p))).dragonQuest).toEqual(p.dragonQuest);const data=new Map<string,string>();vi.stubGlobal('localStorage',{setItem:(k:string,v:string)=>data.set(k,v),getItem:(k:string)=>data.get(k)});try{const s=toQuestion();expect(saveDraft(s)).toBe(true);const draft=readDraft(s.studentId);expect(draft.session!.paused).toBe(true);expect(draft.session!.prepared).toEqual(s.prepared);expect(draft.session!.questionReady).toBe(false);expect(readDraft('other').session).toBeNull();data.set('dragon-draft:dragon-test','{broken');expect(readDraft(s.studentId).corrupt).toBe(true);}finally{vi.unstubAllGlobals();}});
});

