import { describe, expect, it, vi } from 'vitest';
import { StudentProfile, Grade } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
import { getDailyStarsEarned, migrateProfile } from '../../../services/profileService';
import { MISSIONS, missionConfig } from '../content/catalog';
import { createSession, reduceMemory, validSession } from '../engine/game';
import { completeMemory, persistMemory, readMemoryProgress, presetKey, readMemoryDraft, saveMemoryDraft } from './progress';
function profile():StudentProfile{
 const p:StudentProfile={id:'test',name:'Memory',age:7,grade:Grade.Grade1,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:42,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[{id:'legacy',date:'2026-01-01',gameType:'memory',score:600,maxScore:1000,starsEarned:2,difficulty:'easy',durationSeconds:10}],shopDailyPhotos:[],achievements:[]};p.stats=initializeStats(p);return p;
}
function win(index=0){let s=createSession(missionConfig(MISSIONS[index]),42,`session-${index}`);s=reduceMemory(s,{sessionId:s.id,type:'begin'});s=reduceMemory(s,{sessionId:s.id,type:'endPreview'});for(const picture of new Set(s.deck.map(t=>t.picture))){for(const t of s.deck.filter(t=>t.picture===picture))s=reduceMemory(s,{sessionId:s.id,type:'flip',id:t.id});s=reduceMemory(s,{sessionId:s.id,type:'tick',ms:500});}return s;}
describe('Memory rewards and durable completion',()=>{
 it('saves once, preserves legacy records and round-trips through profile migration',()=>{
  const before=profile(),snapshot=structuredClone(before),s=win(),first=completeMemory(before,s);
  expect(first.earned).toBe(3);expect(before).toEqual(snapshot);
  const loaded=migrateProfile(JSON.parse(JSON.stringify(first.profile))),second=completeMemory(loaded,s);
  expect(second.changed).toBe(false);expect(second.earned).toBe(0);expect(second.profile.stars).toBe(first.profile.stars);
  expect(loaded.gameHistory).toHaveLength(2);expect(loaded.gameHistory[0]).toEqual(snapshot.gameHistory[0]);
  expect(loaded.memoryMatch!.missions['garden-1'].stars).toBe(3);
 });
 it('retries a failed storage write without changing either profile or granting twice',()=>{
  const profiles=[profile(),{...profile(),id:'other',stars:500}],snapshot=structuredClone(profiles),s=win();
  const failed=persistMemory(profiles,'test',s,()=>{throw new Error('quota');});
  expect(failed.ok).toBe(false);expect(failed.profiles).toBe(profiles);expect(profiles).toEqual(snapshot);
  const write=vi.fn(),retry=persistMemory(profiles,'test',s,write),again=persistMemory(retry.profiles,'test',s,write);
  expect(retry.earned).toBe(3);expect(again.earned).toBe(0);expect(write).toHaveBeenCalledTimes(1);expect(again.profiles[1]).toEqual(snapshot[1]);
  expect(persistMemory(profiles,'missing',s,write).ok).toBe(false);
 });
 it('only awards improved stars on the day of improvement and counts a mission once',()=>{
  vi.useFakeTimers();try{
   vi.setSystemTime(new Date('2026-09-07T10:00:00+07:00'));
   const s=win(),first=completeMemory(profile(),{...s,attempts:8});expect(first.earned).toBe(1);expect(getDailyStarsEarned(first.profile)).toBe(1);
   vi.setSystemTime(new Date('2026-09-08T10:00:00+07:00'));
   const second=completeMemory(first.profile,s);expect(second.earned).toBe(2);expect(getDailyStarsEarned(second.profile)).toBe(2);
   expect(second.profile.stats!.totalGamesPlayed).toBe(first.profile.stats!.totalGamesPlayed);
   expect(second.profile.stats!.totalStarsEarned-first.profile.stats!.totalStarsEarned).toBe(2);
   expect(second.profile.gameHistory.find(g=>g.memory)?.starAwards).toHaveLength(2);
  }finally{vi.useRealTimers();}
 });
 it('rejects locked, incomplete and malformed mission results',()=>{
  const p=profile(),s=win();expect(completeMemory(p,win(1)).accepted).toBe(false);
  expect(completeMemory(p,createSession(missionConfig(MISSIONS[0]),1,'a')).accepted).toBe(false);
  expect(completeMemory(p,{...s,config:{...s.config,pairs:15}}).accepted).toBe(false);
  expect(completeMemory(completeMemory(p,s).profile,win(1)).accepted).toBe(true);
 });
 it('completes all 30 missions, uses correct difficulty and keeps reward totals bounded',()=>{
  let p=profile(),awarded=0;
  for(let i=0;i<MISSIONS.length;i++){const r=completeMemory(p,win(i));expect(r.accepted).toBe(true);awarded+=r.earned;p=r.profile;}
  expect(Object.keys(p.memoryMatch!.missions)).toHaveLength(30);expect(awarded).toBe(90);
  expect(p.gameHistory.find(g=>g.memory?.missionId==='space-6')!.difficulty).toBe('hard');
  for(let i=0;i<MISSIONS.length;i++){const r=completeMemory(p,win(i));expect(r.earned).toBe(0);p=r.profile;}
  expect(p.gameHistory.filter(g=>g.memory)).toHaveLength(30);
 });
 it('stores practice records without awarding currency, stats or achievements',()=>{
  const p=profile(),s=win();delete s.config.missionId;expect(validSession(s)).toBe(true);
  const r=completeMemory(p,s);expect(r.accepted).toBe(true);expect(r.earned).toBe(0);
  expect(r.profile.stars).toBe(p.stars);expect(r.profile.stats).toEqual(p.stats);expect(r.profile.achievements).toEqual(p.achievements);expect(r.profile.gameHistory).toEqual(p.gameHistory);
  expect(Object.keys(r.profile.memoryMatch!.practiceBest)).toHaveLength(1);expect(completeMemory(r.profile,s).changed).toBe(false);
 });
 it('separates assisted bests while keeping history metadata tied to its best attempt',()=>{
  const s=win(),a=completeMemory(profile(),s),assisted={...s,id:'helped',hints:2,attempts:6,elapsedMs:9000};
  const b=completeMemory(a.profile,assisted);expect(b.earned).toBe(0);
  expect(Object.keys(b.profile.memoryMatch!.missions['garden-1'].best)).toHaveLength(2);
  const record=b.profile.gameHistory.find(g=>g.memory)!;expect(record.score).toBe(1000);expect(record.memory?.hints).toBe(0);expect(record.memory?.attempts).toBe(3);
  expect(presetKey(s)).not.toBe(presetKey(assisted));
 });
 it('normalizes corrupt progress without modifying old currency',()=>{
  expect(readMemoryProgress(null)).toEqual({version:2,missions:{},practiceBest:{},recent:[]});
  expect(readMemoryProgress({version:2,missions:{fake:{stars:3},'garden-1':{stars:99}},recent:[null,'a'],practiceBest:{x:{attempts:-5}}})).toEqual({version:2,missions:{},practiceBest:{},recent:['a']});
  expect(migrateProfile(profile()).stars).toBe(42);
 });
 it('scopes drafts per profile, restores paused and reports corruption/storage failure',()=>{
  const data=new Map<string,string>(),storage={getItem:(key:string)=>data.get(key)||null,setItem:(key:string,value:string)=>data.set(key,value)};
  vi.stubGlobal('localStorage',storage);try{
   const s=createSession(missionConfig(MISSIONS[0]),1,'draft');expect(saveMemoryDraft('test',s)).toBe(true);
   expect(readMemoryDraft('test').session).toMatchObject({paused:true,id:'draft'});expect(readMemoryDraft('other').session).toBeNull();
   data.set('memory-draft:test','broken');expect(readMemoryDraft('test').corrupt).toBe(true);
   storage.setItem=()=>{throw new Error('full');};expect(saveMemoryDraft('test',s)).toBe(false);
  }finally{vi.unstubAllGlobals();}
 });
});
