import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SONGS } from './content/songs';
import { LESSONS } from './content/lessons';
import { SONG_IDS, INSTRUMENTS, defaultPreferences } from './model';
import { canAdvance, eventsFromSteps, phrasesFor, stepsFromNotes } from './engine';
import { applyProgress, persistPiano, readProgress } from './progress';
import { PianoAudio, synthesize, frequency } from './audio';
import type { StudentProfile } from '../../types';

describe('piano repertoire and learning content',()=>{
    it('ships 24 distinct complete, traceable melodies with valid durations and keyboard range',()=>{
        expect(SONGS).toHaveLength(24);expect(new Set(SONGS.map(s=>s.melodyFamilyId)).size).toBe(24);
        expect(SONGS.map(s=>s.id).sort()).toEqual([...SONG_IDS].sort());
        const fingerprints=new Set<string>();
        for(const song of SONGS){
            expect(song.notes.filter(n=>n.midi!==null).length).toBeGreaterThanOrEqual(20);
            let end=0;
            for(const n of song.notes){expect(n.at).toBeCloseTo(end,6);expect(n.beats).toBeGreaterThan(0);expect(n.midi===null||Number.isInteger(n.midi)&&n.midi>=60&&n.midi<=84).toBe(true);end=n.at+n.beats;}
            expect(end).toBeCloseTo(song.totalBeats,6);
            const pitches=song.notes.filter(n=>n.midi!==null).map(n=>n.midi!);
            const fingerprint=pitches.map(n=>n-pitches[0]).join(',');expect(fingerprints.has(fingerprint)).toBe(false);fingerprints.add(fingerprint);
            const xml=readFileSync(new URL(`./content/sources/${song.id}.xml`,import.meta.url));
            expect(createHash('sha256').update(xml).digest('hex')).toBe(song.source.sha256);
            expect(song.source.url).toMatch(/^https:\/\/www.gutenberg.org\/files\//);
        }
    });
    it('retains every target and rest when splitting a full melody into phrases',()=>{
        for(const song of SONGS){const steps=stepsFromNotes(song.notes),phrases=phrasesFor(steps);expect(phrases.flat()).toEqual(steps);expect(phrases.every(p=>p.length>0&&p.length<=8)).toBe(true);const e=eventsFromSteps(steps);const first=song.notes.find(n=>n.midi!==null)!;expect(e.beats).toBeCloseTo(song.totalBeats-first.at,6);}
    });
    it('includes ten guided lessons, hold/release, silence and genuine two-note chords',()=>{
        expect(LESSONS).toHaveLength(10);expect(new Set(LESSONS.map(l=>l.id)).size).toBe(10);
        expect(LESSONS[1].steps.every(s=>s.holdMs!>=500)).toBe(true);
        expect(LESSONS[7].steps.some(s=>s.gapBeats)).toBe(true);
        expect(LESSONS[8].steps.every(s=>s.pitches.length===2)).toBe(true);
    });
    it('requires a newly played target, ignores wrong notes, and requires both chord notes',()=>{
        const step={pitches:[60,64],beats:2};expect(canAdvance(step,new Set([60]),60)).toBe(false);expect(canAdvance(step,new Set([60,64]),64)).toBe(true);expect(canAdvance(step,new Set([60,64,65]),65)).toBe(false);
    });
});
describe('piano profile persistence',()=>{
    const blank=()=>readProgress(null);
    const action={type:'practice' as const,id:SONG_IDS[0],phrase:0,total:2,guided:true};
    const student=(id:string)=>({id,name:id,stars:19,gameHistory:[],soundMemory:{version:2,missions:{},practiceBest:{},compositions:[]}} as StudentProfile);
    it('merges phrase progress idempotently and only completes after all phrases',()=>{
        const a=applyProgress(blank(),action)!;expect(a.records[action.id].completed).toBe(false);
        const b=applyProgress(a,action)!;expect(b.records[action.id].phrases).toEqual([0]);
        const c=applyProgress(b,{...action,phrase:1})!;expect(c.records[action.id].completed).toBe(true);
    });
    it('isolates profiles and never awards stars or game history for piano practice',()=>{
        const profiles=[student('a'),student('b')],write=vi.fn(),r=persistPiano(profiles,'a',action,write);
        expect(r.ok).toBe(true);expect(r.profiles[1]).toBe(profiles[1]);expect(r.profiles[0].stars).toBe(19);expect(r.profiles[0].gameHistory).toEqual([]);expect(r.profiles[0].soundMemory).toBe(profiles[0].soundMemory);expect(profiles[0].piano).toBeUndefined();
    });
    it('requires every phrase without hints before marking a multi-phrase song independent',()=>{
        let p=applyProgress(blank(),{...action,guided:false})!;
        p=applyProgress(p,{...action,phrase:1,guided:true})!;
        expect(p.records[action.id].completed).toBe(true);expect(p.records[action.id].independent).toBe(false);
        p=applyProgress(p,{...action,phrase:1,guided:false})!;
        expect(readProgress(p).records[action.id].independent).toBe(true);
    });
    it('does not mutate snapshot on quota failure, and supports retry',()=>{
        const profiles=[student('a')];const fail=persistPiano(profiles,'a',action,()=>{throw new Error('quota');});expect(fail.ok).toBe(false);expect(fail.profiles).toBe(profiles);expect(profiles[0].piano).toBeUndefined();expect(persistPiano(profiles,'a',action,()=>{}).ok).toBe(true);
    });
    it('rejects invalid owners, unknown lessons and impossible phrase indices',()=>{
        expect(persistPiano([student('a')],'b',action,()=>{}).ok).toBe(false);
        for(const a of [{...action,id:'arbitrary'},{...action,phrase:2},{...action,phrase:-1},{...action,total:0}])expect(applyProgress(blank(),a)).toBeNull();
    });
    it('normalizes malformed persisted values and preserves valid preferences',()=>{
        const p=readProgress({version:1,records:{bad:{},[SONG_IDS[0]]:{phrases:[0,0,1,999],total:2}},preferences:{instrument:'organ',volume:100,labels:'letters',guidance:false}});
        expect(p.records[SONG_IDS[0]].phrases).toEqual([0,1]);expect(p.records.bad).toBeUndefined();expect(p.preferences).toEqual({...defaultPreferences,instrument:'organ',volume:.85,labels:'letters',guidance:false});
        expect(readProgress({version:88}).records).toEqual({});
    });
});
function fakeAudio(){
    const sources:any[]=[],param=()=>({value:1,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),setTargetAtTime:vi.fn(),cancelScheduledValues:vi.fn(),cancelAndHoldAtTime:vi.fn()});
    const makeSource=()=>{const s={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),frequency:param(),playbackRate:param(),setPeriodicWave:vi.fn(),onended:null};sources.push(s);return s;};
    const ctx:any={state:'running',currentTime:1,sampleRate:16000,destination:{},resume:vi.fn(async()=>{ctx.state='running';}),close:vi.fn(async()=>{}),createGain:()=>({gain:param(),connect:vi.fn(),disconnect:vi.fn()}),createDynamicsCompressor:()=>({threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect:vi.fn()}),createBuffer:()=>({copyToChannel:vi.fn()}),createBufferSource:makeSource,createOscillator:makeSource,createPeriodicWave:vi.fn(),decodeAudioData:vi.fn(async()=>({})),getOutputTimestamp:()=>({contextTime:ctx.currentTime,performanceTime:performance.now()})};
    const fetcher=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})) as unknown as typeof fetch;
    return{ctx,sources,fetcher,audio:new PianoAudio(()=>ctx,fetcher)};
}
afterEach(()=>vi.useRealTimers());
describe('piano audio lifecycle',()=>{
    it('preserves the platform fetch receiver when downloading browser samples',async()=>{
        const {ctx}=fakeAudio();
        const platformFetch=vi.spyOn(globalThis,'fetch').mockImplementation(async function(){
            if(this!==globalThis)throw new TypeError('Illegal invocation');
            return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)} as Response;
        });
        const audio=new PianoAudio(()=>ctx);
        try {await audio.unlock();await audio.prepare('piano');expect(audio.samplesLoaded).toBe(true);expect(platformFetch).toHaveBeenCalledTimes(9);}
        finally {audio.close();platformFetch.mockRestore();}
    });
    it('loads piano once and maps neighbor samples to the correct semitone',async()=>{
        const {audio,fetcher,sources}=fakeAudio();await audio.unlock();await audio.prepare('piano');await audio.prepare('piano');expect(fetcher).toHaveBeenCalledTimes(9);expect(audio.samplesLoaded).toBe(true);audio.noteOn(61);expect(sources[0].playbackRate.value).toBeCloseTo(2**(1/12));audio.close();
    });
    it('keeps independent voices for two fingers on the same note',async()=>{
        const {audio,sources}=fakeAudio();await audio.unlock();await audio.prepare('piano');const a=audio.noteOn(60)!,b=audio.noteOn(60)!;expect(a).not.toBe(b);audio.noteOff(a);expect(sources[0].stop).toHaveBeenCalledOnce();expect(sources[1].stop).not.toHaveBeenCalled();audio.noteOff(b);expect(sources[1].stop).toHaveBeenCalledOnce();audio.close();
    });
    it('sustains organ until release and bounds rapid polyphony including release tails',async()=>{
        const {audio,sources}=fakeAudio();await audio.unlock();audio.setInstrument('organ');const id=audio.noteOn(69)!;expect(sources[0].frequency.value).toBe(440);expect(sources[0].stop).not.toHaveBeenCalled();audio.noteOff(id);expect(sources[0].stop).toHaveBeenCalled();for(let i=0;i<100;i++)audio.noteOn(60+i%25);expect(audio.activeVoices).toBeLessThanOrEqual(24);audio.close();expect(audio.activeVoices).toBe(0);
    });
    it('does not play after unlock failure, mute or close',async()=>{
        const {audio,ctx,sources}=fakeAudio();ctx.state='suspended';ctx.resume=async()=>{throw Error();};expect(await audio.unlock()).toBe(false);expect(audio.noteOn(60)).toBeNull();ctx.state='running';audio.setInstrument('organ');audio.setMuted(true);expect(audio.noteOn(60)).toBeNull();audio.setMuted(false);expect(audio.noteOn(60)).not.toBeNull();audio.close();expect(await audio.unlock()).toBe(false);expect(audio.noteOn(60)).toBeNull();expect(sources).toHaveLength(1);
    });
    it('uses audio-clock scheduling, cancels demonstrations on instrument changes',async()=>{
        vi.useFakeTimers();const{audio,ctx,sources}=fakeAudio();await audio.unlock();audio.setInstrument('organ');const done=vi.fn(),cue=vi.fn();audio.schedule([{midi:60,at:0,beats:1},{midi:64,at:1,beats:1}],2,60,.5,cue,done);expect(sources[0].start).toHaveBeenCalledWith(1.1);expect(sources[0].stop.mock.calls[0][0]).toBeCloseTo(3.02);audio.setInstrument('electric');ctx.currentTime=8;vi.advanceTimersByTime(8000);expect(sources).toHaveLength(1);expect(done).not.toHaveBeenCalled();audio.close();
    });
    it('interrupts late schedules instead of bursting overdue notes',async()=>{
        vi.useFakeTimers();const{audio,ctx}=fakeAudio();await audio.unlock();audio.setInstrument('organ');audio.onInterrupt=vi.fn();audio.schedule([{midi:60,at:1,beats:1}],2,60,1,vi.fn(),vi.fn());ctx.currentTime=10;vi.advanceTimersByTime(20);expect(audio.onInterrupt).toHaveBeenCalledOnce();audio.close();
    });
    it('retries sample downloads after failure',async()=>{
        const{audio,fetcher}=fakeAudio();vi.mocked(fetcher).mockRejectedValueOnce(new Error('network'));await audio.unlock();await expect(audio.prepare('piano')).rejects.toThrow('Chưa tải được tiếng piano');await audio.prepare('piano');expect(audio.samplesLoaded).toBe(true);audio.close();
    });
    it.each(['electric','wood','guitar','musicbox'] as const)('%s produces finite, distinct, bounded pitches with clean tails',instrument=>{
        for(const midi of [60,69,84]){const pcm=synthesize(instrument,midi,24000);expect(pcm.every(x=>Number.isFinite(x)&&Math.abs(x)<.7)).toBe(true);expect(pcm[0]).toBeCloseTo(0);expect(Math.abs(pcm.at(-1)!)).toBeLessThan(.0001);expect(pcm.reduce((sum,n)=>sum+n*n,0)).toBeGreaterThan(1);}
        expect(frequency(69)).toBe(440);
    });
    it('defines six real instrument choices',()=>expect(INSTRUMENTS).toHaveLength(6));
});
