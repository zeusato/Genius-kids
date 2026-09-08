let audio:AudioContext|null=null;
export function memorySound(kind:'flip'|'match'|'win',enabled:boolean){
    if(!enabled)return;
    try{audio||=new AudioContext();if(audio.state==='suspended')void audio.resume().catch(()=>{});
        const notes=kind==='win'?[523,659,784,1047]:kind==='match'?[659,880]:[420];
        notes.forEach((note,i)=>{const a=audio!,o=a.createOscillator(),g=a.createGain(),t=a.currentTime+i*.1;o.type='sine';o.frequency.setValueAtTime(note,t);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.035,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.15);o.onended=()=>{o.disconnect();g.disconnect();};});
    }catch{/* The visual feedback remains available. */}
}
export function closeMemoryAudio(){if(audio){void audio.close().catch(()=>{});audio=null;}}
