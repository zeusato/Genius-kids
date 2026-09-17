import { validMidi, type InstrumentId, type NoteEvent } from './model';
export const SAMPLE_NOTES = ['C4','Ds4','Fs4','A4','C5','Ds5','Fs5','A5','C6'];
export const SAMPLE_MIDI = [60,63,66,69,72,75,78,81,84];
export const frequency = (midi:number) => 440 * 2 ** ((midi-69)/12);
export function synthesize(instrument: Exclude<InstrumentId,'piano'|'organ'>, midi:number, sampleRate:number): Float32Array {
    const f=frequency(midi), duration=instrument==='musicbox'?3.5:instrument==='guitar'?3:2.5;
    const pcm=new Float32Array(Math.ceil(sampleRate*duration));
    const delay=new Float32Array(Math.max(2,Math.round(sampleRate/f)));
    let seed=midi*1973+11;
    for(let i=0;i<delay.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;delay[i]=((seed>>>0)/2147483648-1)*.65;}
    for(let i=0;i<pcm.length;i++){
        const t=i/sampleRate, phase=2*Math.PI*f*t, attack=Math.min(1,t/.004), tail=Math.min(1,(duration-t)/.04);
        let x=0;
        if(instrument==='electric') x=(Math.sin(phase+1.5*Math.sin(phase*2)*Math.exp(-4*t))*.65+.12*Math.sin(phase*3))*Math.exp(-2.1*t);
        if(instrument==='wood') x=.7*Math.sin(phase)*Math.exp(-5*t)+.25*Math.sin(phase*3)*Math.exp(-13*t)+.08*Math.sin(phase*7)*Math.exp(-22*t);
        if(instrument==='musicbox') x=.65*Math.sin(phase)*Math.exp(-2.7*t)+.2*Math.sin(phase*2)*Math.exp(-4*t)+.1*Math.sin(phase*4.02)*Math.exp(-5*t);
        if(instrument==='guitar'){const j=i%delay.length;x=delay[j];delay[j]=(delay[j]+delay[(j+1)%delay.length])*.498;}
        pcm[i]=x*attack*tail*.48;
    }
    return pcm;
}
interface Voice { source: AudioBufferSourceNode | OscillatorNode; gain: GainNode; released: boolean }
export class PianoAudio {
    private ctx: AudioContext | null=null;
    private master: GainNode | null=null;
    private buffers=new Map<string,AudioBuffer>();
    private voices=new Map<number,Voice>();
    private nextId=0;
    private disposed=false;
    private loading: Promise<void> | null=null;
    private abort=new AbortController();
    private timer: ReturnType<typeof setInterval> | null=null;
    private epoch=0;
    private instrument: InstrumentId='piano';
    private volume=.55;
    private muted=false;
    onInterrupt:()=>void=()=>{};
    constructor(private factory=()=>new AudioContext({latencyHint:'interactive'}),private fetcher:typeof fetch=(request,options)=>globalThis.fetch(request,options)){}
    get now(){return this.ctx?.currentTime||0;}
    get ready(){return !this.disposed&&this.ctx?.state==='running';}
    get activeVoices(){return this.voices.size;}
    get samplesLoaded(){return SAMPLE_NOTES.every(n=>this.buffers.has(n));}
    get audible(){return this.ready&&!this.muted&&this.volume>0;}
    private makeContext(){
        if(this.ctx)return this.ctx;
        const ctx=this.ctx=this.factory(),master=this.master=ctx.createGain(),compressor=ctx.createDynamicsCompressor();
        master.gain.value=this.muted?0:this.volume;
        compressor.threshold.value=-14;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.15;
        master.connect(compressor);compressor.connect(ctx.destination);
        ctx.onstatechange=()=>{if(!this.disposed&&ctx.state!=='running'){this.stop();this.onInterrupt();}};
        return ctx;
    }
    async unlock(){
        if(this.disposed)return false;
        try {const ctx=this.makeContext();if(ctx.state!=='running')await ctx.resume();return this.ready;} catch{return false;}
    }
    async prepare(instrument:InstrumentId){
        if(this.disposed)throw new Error('Phiên đàn đã đóng.');
        const ctx=this.makeContext();
        if(instrument==='piano'&&!this.samplesLoaded){
            if(!this.loading)this.loading=(async()=>{
                const results=await Promise.allSettled(SAMPLE_NOTES.map(async name=>{
                    if(this.buffers.has(name))return;
                    const r=await this.fetcher(`${import.meta.env.BASE_URL}piano/audio/${name}.mp3`,{signal:this.abort.signal});
                    if(!r.ok)throw new Error('Chưa tải được tiếng piano. Hãy thử lại khi có mạng.');
                    const buffer=await ctx.decodeAudioData(await r.arrayBuffer());
                    if(!this.disposed)this.buffers.set(name,buffer);
                }));
                if(results.some(result=>result.status==='rejected'))throw new Error('Chưa tải được tiếng piano. Hãy thử lại khi có mạng, hoặc chọn tiếng đàn khác.');
            })().finally(()=>{this.loading=null;});
            await this.loading;
        } else if(instrument!=='piano'&&instrument!=='organ') {
            for(let midi=60;midi<=84;midi++){
                const key=`${instrument}:${midi}`;
                if(!this.buffers.has(key)){
                    const pcm=synthesize(instrument,midi,ctx.sampleRate),buffer=ctx.createBuffer(1,pcm.length,ctx.sampleRate);
                    buffer.copyToChannel(pcm,0);this.buffers.set(key,buffer);
                }
            }
        }
    }
    setInstrument(instrument:InstrumentId){this.stop();this.instrument=instrument;}
    setVolume(v:number){this.volume=Math.max(0,Math.min(.85,Number.isFinite(v)?v:0));if(!this.volume)this.stop();this.master?.gain.setTargetAtTime(this.muted?0:this.volume,this.now,.015);}
    setMuted(v:boolean){this.muted=v;if(v)this.stop();this.master?.gain.setTargetAtTime(v?0:this.volume,this.now,.015);}
    noteOn(midi:number,at=this.now,level=1):number|null {
        if(!this.audible||!validMidi(midi)||!this.ctx||!this.master)return null;
        const ctx=this.ctx;
        if(this.voices.size>=24){
            const oldest=[...this.voices].find(([,v])=>v.released)||this.voices.entries().next().value!;
            this.destroy(oldest[0],oldest[1]);
        }
        let source:AudioBufferSourceNode|OscillatorNode;
        if(this.instrument==='organ'){
            const osc=ctx.createOscillator(),real=new Float32Array([0,0,0,0,0,0,0,0,0]),imag=new Float32Array([0,.65,.23,.15,.08,0,.03,0,.01]);
            osc.setPeriodicWave(ctx.createPeriodicWave(real,imag));osc.frequency.value=frequency(midi);source=osc;
        } else {
            let buffer:AudioBuffer|undefined,rate=1;
            if(this.instrument==='piano'){
                const index=SAMPLE_MIDI.reduce((best,n,i)=>Math.abs(n-midi)<Math.abs(SAMPLE_MIDI[best]-midi)?i:best,0);
                buffer=this.buffers.get(SAMPLE_NOTES[index]);rate=2**((midi-SAMPLE_MIDI[index])/12);
            }else buffer=this.buffers.get(`${this.instrument}:${midi}`);
            if(!buffer)return null;
            const sample=ctx.createBufferSource();sample.buffer=buffer;sample.playbackRate.value=rate;source=sample;
        }
        const start=Math.max(at,this.now),gain=ctx.createGain(),id=++this.nextId;
        const amount=(this.instrument==='organ'?.17:this.instrument==='piano'?.75:1)*Math.max(0,Math.min(1,level));
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(amount,start+.006);
        source.connect(gain);gain.connect(this.master);
        const voice={source,gain,released:false};this.voices.set(id,voice);
        source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(id);};
        source.start(start);return id;
    }
    noteOff(id:number,at=this.now){
        const v=this.voices.get(id);if(!v||v.released)return;
        v.released=true;const time=Math.max(at,this.now),release=this.instrument==='musicbox'?.45:this.instrument==='piano'?.28:.12;
        // cancelAndHold keeps the scheduled attack intact for future note-offs.
        if(v.gain.gain.cancelAndHoldAtTime)v.gain.gain.cancelAndHoldAtTime(time);
        else {v.gain.gain.cancelScheduledValues(time);v.gain.gain.setValueAtTime(v.gain.gain.value,time);}
        v.gain.gain.setTargetAtTime(0,time,release/5);
        try{v.source.stop(time+release);}catch{/* already ended */}
    }
    private destroy(id:number,v:Voice){try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();this.voices.delete(id);}
    stop(){
        this.epoch++;if(this.timer!==null)clearInterval(this.timer);this.timer=null;
        for(const [id,v]of this.voices){v.gain.gain.cancelScheduledValues(this.now);v.gain.gain.setTargetAtTime(0,this.now,.004);try{v.source.stop(this.now+.025);}catch{}v.released=true;}
    }
    schedule(events:NoteEvent[],totalBeats:number,bpm:number,speed:number,cue:(notes:number[])=>void,done:()=>void){
        this.stop();if(!this.audible)return false;
        const epoch=this.epoch,start=this.now+.1,seconds=60/bpm/speed,queue=events.filter(e=>e.midi!==null).sort((a,b)=>a.at-b.at);
        let next=0,lastCue='';
        const pump=()=>{
            if(this.disposed||epoch!==this.epoch)return;
            if(!this.ready){this.stop();cue([]);this.onInterrupt();return;}
            while(next<queue.length&&start+queue[next].at*seconds<=this.now+.12){
                const e=queue[next++],at=start+e.at*seconds;
                if(at<this.now-.15){this.stop();cue([]);this.onInterrupt();return;}
                const id=this.noteOn(e.midi!,at);if(id!==null)this.noteOff(id,at+e.beats*seconds*.9);
            }
            let heard=this.now;
            try{const stamp=this.ctx?.getOutputTimestamp?.();if(stamp?.contextTime&&Math.abs(performance.now()-stamp.performanceTime)<250)heard=stamp.contextTime+(performance.now()-stamp.performanceTime)/1000;}catch{}
            const notes=queue.filter(e=>start+e.at*seconds<=heard&&start+(e.at+e.beats*.9)*seconds>heard).map(e=>e.midi!);
            const key=notes.join(',');if(key!==lastCue){lastCue=key;cue(notes);}
            if(heard>=start+totalBeats*seconds+.12){if(this.timer!==null)clearInterval(this.timer);this.timer=null;cue([]);done();}
        };
        this.timer=setInterval(pump,20);pump();return true;
    }
    close(){this.disposed=true;this.stop();this.abort.abort();for(const [id,v]of this.voices)this.destroy(id,v);if(this.ctx){this.ctx.onstatechange=null;void this.ctx.close().catch(()=>{});}this.buffers.clear();}
}
