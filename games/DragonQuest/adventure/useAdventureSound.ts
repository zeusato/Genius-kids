import { useEffect, useRef } from 'react';
import { musicManager } from '../../../services/musicManager';
import { Session } from './model';

/** Small, original synthesized cues; no downloads and no extra music player. */
export function useAdventureSound(s:Session|null,enabled:boolean){
 const context=useRef<AudioContext|null>(null),sources=useRef(new Set<OscillatorNode>());
 useEffect(()=>{
  const unlock=()=>{try{context.current ||= new AudioContext();if(context.current.state==='suspended')void context.current.resume().catch(()=>{});}catch{/* Silent fallback on browsers without Web Audio. */}};
  document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
  return()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);sources.current.forEach(o=>{try{o.stop();}catch{}});sources.current.clear();void context.current?.close();context.current=null;};
 },[]);
 useEffect(()=>{
  if(!enabled||s?.paused||document.hidden){sources.current.forEach(o=>{try{o.stop();}catch{}});sources.current.clear();return;}
  const ctx=context.current;if(!ctx||ctx.state!=='running'||!s)return;
  const cue=(frequency:number,duration:number,delay=0,volume=.035,type:OscillatorType='sine',end=frequency)=>{
   if(!musicManager.isSoundEnabled())return;
   const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+delay;
   oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,at);oscillator.frequency.exponentialRampToValueAtTime(end,at+duration);
   gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(volume,at+.009);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
   oscillator.connect(gain);gain.connect(ctx.destination);sources.current.add(oscillator);
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();sources.current.delete(oscillator);};oscillator.start(at);oscillator.stop(at+duration+.02);
  };
  if(s.phase==='rolling')for(let i=0;i<7;i++)cue(230+i%3*70,.055,i*.13,.026,'triangle',100);
  if(s.phase==='moving')cue(145+s.target%3*15,.055,0,.018,'triangle',85);
  if(s.phase==='landing')cue(420,.12,0,.027,'sine',320);
  if(s.phase==='teleport'){cue(220,.8,0,.025,'sine',880);cue(330,.8,.12,.017,'triangle',1320);}
  if(s.phase==='intro'&&s.position==='tile-49'){cue(90,.7,0,.04,'triangle');cue(135,.7,.18,.025,'triangle');}
 },[s?.id,s?.phase,s?.position,s?.paused,enabled]);
}
