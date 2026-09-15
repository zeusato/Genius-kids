let context:AudioContext|null=null;
export function playTone(kind:'select'|'drop'|'capture'|'quan'|'end',enabled:boolean){
  if(!enabled)return;
  try{const C=window.AudioContext||(window as any).webkitAudioContext;if(!C)return;context??=new C();void context.resume();const ctx=context,notes=kind==='quan'||kind==='end'?[523,659,784]:[kind==='drop'?620:kind==='capture'?440:330];notes.forEach((f,i)=>{const t=ctx.currentTime+i*.08,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.7,t+.1);g.gain.setValueAtTime(kind==='drop'?.022:.045,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.2);});}catch{/* Sound never blocks the board. */}
}
export function closeAudio(){if(context){void context.close();context=null;}}
