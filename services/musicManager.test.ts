import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeAudio{
 static instances:FakeAudio[]=[];
 src='';volume=1;currentTime=0;loop=false;preload='';paused=true;
 constructor(src=''){this.src=src;FakeAudio.instances.push(this);}
 play=vi.fn(()=>{this.paused=false;return Promise.resolve();});
 pause=vi.fn(()=>{this.paused=true;});load=vi.fn();
 getAttribute(name:string){return name==='src'?this.src:null;}
}
beforeEach(()=>{vi.resetModules();FakeAudio.instances=[];vi.useFakeTimers();vi.stubGlobal('window',{location:{pathname:'/game'}});vi.stubGlobal('Audio',FakeAudio);vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
describe('Game music transport',()=>{
 it('resumes a paused track at its existing position',async()=>{
  const {musicManager:m}=await import('./musicManager'),{MusicTrack:T}=await import('./musicConfig');
  m.playTrack(T.DRAGON_FOREST);const a=FakeAudio.instances[0];a.currentTime=42;
  m.setPaused(true);expect(a.paused).toBe(true);m.setPaused(false);
  expect(a.currentTime).toBe(42);expect(a.load).toHaveBeenCalledTimes(1);expect(a.paused).toBe(false);
 });
 it('ducks both sides of a transition and stops the old track after fading',async()=>{
  const {musicManager:m}=await import('./musicManager'),{MusicTrack:T}=await import('./musicConfig');
  m.playTrack(T.DRAGON_FOREST);m.transitionTrack(T.DRAGON_JOURNEY);
  const [a,b]=FakeAudio.instances;m.setVolume(.1);expect(m.getVolume()).toBe(.1);
  await vi.advanceTimersByTimeAsync(600);expect(a.volume+b.volume).toBeCloseTo(.1);
  await vi.advanceTimersByTimeAsync(700);expect(a.paused).toBe(true);expect(b.volume).toBeCloseTo(.1);
  m.setVolume(.4);expect(b.volume).toBe(.4);
 });
 it('never starts muted music and cancels a transition when paused',async()=>{
  const {musicManager:m}=await import('./musicManager'),{MusicTrack:T}=await import('./musicConfig');
  m.toggleMusic();m.transitionTrack(T.DRAGON_FOREST);expect(FakeAudio.instances[0].play).not.toHaveBeenCalled();
  m.toggleMusic();m.transitionTrack(T.DRAGON_JOURNEY);m.setPaused(true);
  await vi.advanceTimersByTimeAsync(2000);expect(FakeAudio.instances.every(a=>a.paused)).toBe(true);
 });
});
