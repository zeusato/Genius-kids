import type {TownEvent} from './model';
export function eventDuration(e:TownEvent,reduced=false){if(reduced)return 100;return e.kind==='move'?Math.max(900,((e.path?.length||2)-1)*240):e.kind==='build'?1300:e.kind==='money'?1250:900;}
let audio:AudioContext|undefined;
export function sound(kind:string){try{audio??=new AudioContext();void audio.resume();const notes=kind==='build'?[523,659,784]:kind==='money'?[880,1175]:kind==='roll'?[220,330,440]:[660];notes.forEach((hz,i)=>{const o=audio!.createOscillator(),g=audio!.createGain(),t=audio!.currentTime+i*.08;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.055,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(audio!.destination);o.start(t);o.stop(t+.18);});}catch{/* Silent devices remain playable. */}}
export function closeAudio(){void audio?.close();audio=undefined;}
