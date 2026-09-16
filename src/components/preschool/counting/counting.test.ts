import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { ACTIVITIES, NUMBERS, TOYS, answerSession, emptyProgress, makeSession, mastered, nextRound, readProgress, validSession, type Activity, type Level, type Session } from './model';
import { persistCounting, type PendingSession } from './persistence';
import { CountingVoice } from './audio';
import { VOICE_LINES } from './voiceLines';
import { numberTrace } from './NumberTracing';
import { advanceTrace, canStartTrace, traceFinished, type TraceState } from '../letterTracingModel';
import { createProfile, migrateProfile } from '../../../../services/profileService';
import { Grade, Rarity } from '../../../../types';
import { LEARN_STORIES, storyFor } from './learnStories';
import { advanceStory, beginTracing, isTracing, storyComplete } from './learnStoryModel';

describe('counting curriculum',()=>{
    it.each(ACTIVITIES)('%s covers valid rounds for all levels, fixed values and 200 seeds',activity=>{
        for(const level of [1,2,3] as Level[])for(let seed=0;seed<200;seed++)for(const fixed of [0,1,10]){
            const s=makeSession('a',activity,level,seed,emptyProgress(),fixed);
            expect(validSession(s,'a')).toBe(true);
            expect(s.rounds).toHaveLength(activity==='learn'?1:6);
            for(const r of s.rounds){
                expect(new Set(r.options).size).toBe(r.options.length);expect(r.options).toContain(r.answer);
                if(fixed)expect(r.value).toBe(fixed);
                if(activity==='add'){expect(r.a+r.b).toBe(r.answer);expect(r.answer).toBeLessThanOrEqual(10);expect(r.a).toBeGreaterThanOrEqual(0);}
                if(activity==='compare')expect(r.answer).toBe(r.a===r.b?2:(r.direction==='more'?r.a>r.b:r.a<r.b)?0:1);
            }
        }
    });
    it('covers all spatial comparison types, directions and equality',()=>{
        const s=makeSession('a','compare',3,3,emptyProgress());
        expect(new Set(s.rounds.map(r=>r.kind)).size).toBe(5);expect(s.rounds.at(-1)?.answer).toBe(2);
        expect(s.rounds.some(r=>r.direction==='more')).toBe(true);expect(s.rounds.some(r=>r.direction==='less')).toBe(true);
    });
    it('prioritizes struggling numbers without excluding new numbers',()=>{
        const p=emptyProgress();p.skills.count={'7':{independent:0,recent:[false],sessions:[]}};
        let weak=0, other=0;
        for(let seed=0;seed<500;seed++){const s=makeSession('a','count',3,seed,p,0,true);weak+=s.rounds.filter(r=>r.value===7).length;other+=s.rounds.filter(r=>r.value===2).length;}
        expect(weak).toBeGreaterThan(other*1.4);
    });
    it('offers both directions of every comparison, not always long, low or big',()=>{
        const directions:Record<string,Set<string>>={};
        for(let seed=0;seed<50;seed++)for(const round of makeSession('a','compare',3,seed,emptyProgress()).rounds){
            (directions[round.kind]??=new Set()).add(round.direction);
        }
        for(const kind of ['count','number','length','height','size']){
            expect(directions[kind].has('more')).toBe(true);
            expect(directions[kind].has('less')).toBe(true);
        }
    });
    it('rejects corrupt checkpoints and isolates owners',()=>{
        const s=makeSession('a','count',1,1,emptyProgress());
        expect(validSession(s,'b')).toBe(false);
        for(const broken of [{...s,index:99},{...s,collected:[0,0]},{...s,phase:'complete'},{...s,rounds:[null]},{...s,trace:null},{...s,seconds:Infinity}])expect(validSession(broken)).toBe(false);
        expect(readProgress({version:1,drafts:{count:{...s,index:99}}}).drafts.count).toBeUndefined();
    });
    it('never answers listening before successful playback and ignores duplicate answers',()=>{
        let s=makeSession('a','pick',1,1,emptyProgress());
        expect(answerSession(s,s.rounds[0].answer,false)).toBe(s);
        s=answerSession(s,s.rounds[0].answer,true);expect(s.outcomes).toHaveLength(1);
        expect(answerSession(s,s.rounds[0].answer,true)).toBe(s);
        expect(nextRound(s).index).toBe(1);
    });
    it('help and retries never count as independent work',()=>{
        const s=makeSession('a','count',1,1,emptyProgress());
        expect(answerSession({...s,assisted:true},s.rounds[0].answer).outcomes[0].independent).toBe(false);
        expect(answerSession({...s,mistakes:1},s.rounds[0].answer).outcomes[0].independent).toBe(false);
    });
    it('all referenced counting objects, ten distinct scenes and audio numbers exist',()=>{
        for(const name of TOYS)expect(fs.existsSync(`public/preschool/alphabet-games/objects/${name}.webp`)).toBe(true);
        const scenes=LEARN_STORIES.map(story=>story.art);
        expect(new Set(scenes).size).toBe(10);for(const name of scenes)expect(fs.existsSync(`public/preschool/garden/${name}.webp`)).toBe(true);
        for(const name of ['mot','hai','ba','bon','nam','sau','bay','tam','chin','muoi'])expect(fs.statSync(`public/audio/vi/${name}.mp3`).size).toBeGreaterThan(100);
        for(const {file} of Object.values(VOICE_LINES))expect(fs.statSync(`public/audio/vi/${file}.mp3`).size).toBeGreaterThan(100);
    });
});

describe('ten learning stories and deliberate tracing transition',()=>{
    it.each(NUMBERS)('number %i stays in its finished story until the child chooses tracing',value=>{
        let s=makeSession('a','learn',3,1,emptyProgress(),value);
        expect(beginTracing(s)).toBe(s);
        for(let i=0;i<value;i++){
            s=advanceStory(s,i,3);
            if(value===6){expect(s.collected).not.toContain(i);s=advanceStory(s,i);}
            expect(validSession(s,'a')).toBe(true);
            expect(advanceStory(s,i)).toBe(s);
        }
        expect(storyComplete(s)).toBe(true);expect(isTracing(s)).toBe(false);
        expect(s.phase).toBe('playing');expect(s.outcomes).toHaveLength(0);
        const tracing=beginTracing(s);expect(isTracing(tracing)).toBe(true);expect(validSession(tracing)).toBe(true);
        expect(advanceStory(tracing,0)).toBe(tracing);expect(beginTracing(tracing)).toBe(tracing);
    });
    it('keeps the star path ordered and rejects invalid paint or object IDs',()=>{
        const stars=makeSession('a','learn',3,1,emptyProgress(),7);
        expect(advanceStory(stars,1)).toBe(stars);
        for(const index of [-1,7,1.5])expect(advanceStory(stars,index)).toBe(stars);
        const paint=makeSession('a','learn',3,1,emptyProgress(),9);
        expect(advanceStory(paint,0,0)).toBe(paint);
        expect(advanceStory(paint,0,4)).toBe(paint);
        expect(advanceStory(paint,0,2).storySteps?.[0]).toBe(2);
    });
    it('restores cracked eggs and the explicit tracing page without losing checkpoints',()=>{
        vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});
        try {
            const profile={...createProfile('Kịch bản QA',Grade.Preschool),id:'a'};
            let s=advanceStory(makeSession('a','learn',3,1,emptyProgress(),6),0);
            const save=persistCounting([profile],'a',s,()=>{});
            s=readProgress(JSON.parse(JSON.stringify(save.profiles[0].counting)),'a').drafts.learn!;
            expect(s.storySteps?.[0]).toBe(1);expect(s.collected).toEqual([]);
            s=advanceStory(s,0);for(let i=1;i<6;i++){s=advanceStory(s,i);s=advanceStory(s,i);}
            const ready=persistCounting(save.profiles,'a',s,()=>{});
            expect(isTracing(readProgress(ready.profiles[0].counting).drafts.learn!)).toBe(false);
            const traced=persistCounting(ready.profiles,'a',beginTracing(s),()=>{});
            expect(isTracing(readProgress(traced.profiles[0].counting).drafts.learn!)).toBe(true);
            expect(traced.profiles[0].gameHistory).toEqual(profile.gameHistory);
        } finally {vi.unstubAllGlobals();}
    });
    it('preserves real tracing progress from older drafts but no longer auto-switches at the last object',()=>{
        const old={...makeSession('a','learn',3,1,emptyProgress(),1),collected:[0]};
        expect(isTracing(old)).toBe(false);
        expect(isTracing({...old,trace:{stroke:0,point:5}})).toBe(true);
        expect(validSession({...old,collected:[],learningStep:'trace'})).toBe(false);
        expect(validSession({...old,storySteps:[-1]})).toBe(false);
    });
});

describe('checkpoints, atomic rewards and mastery',()=>{
    beforeEach(()=>{vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});vi.spyOn(Math,'random').mockReturnValue(.99);});
    afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
    const profile=()=>({...createProfile('Đếm số QA',Grade.Preschool),id:'a'});
    const complete=(activity:Activity,seed=1)=>{let s=makeSession('a',activity,3,seed,emptyProgress(),2);while(s.phase!=='complete'){s=answerSession(s,s.rounds[s.index].answer,true);s=nextRound(s);}return s;};
    it('saves and reloads an unfinished round including retries and collected objects',()=>{
        const p=profile(),s={...makeSession('a','count',3,1,emptyProgress(),3),collected:[0,2],mistakes:2,assisted:true};
        const result=persistCounting([p],'a',s,()=>{});expect(result.ok).toBe(true);
        const restored=readProgress(JSON.parse(JSON.stringify(result.profiles[0].counting)),'a');expect(restored.drafts.count).toEqual(s);
        expect(result.profiles[0].gameHistory).toEqual(p.gameHistory);expect(result.profiles[0].stars).toBe(p.stars);
    });
    it('deduplicates round checkpoints and rewards on repeated completion',()=>{
        const p=profile();let s=makeSession('a','count',1,1,emptyProgress(),2);s=answerSession(s,2);
        let result=persistCounting([p],'a',s,()=>{});result=persistCounting(result.profiles,'a',s,()=>{});
        expect(result.profiles[0].counting?.skills.count?.['2'].independent).toBe(1);
        const full=complete('count');result=persistCounting(result.profiles,'a',full,()=>{});
        const again=persistCounting(result.profiles,'a',full,()=>{});expect(again.profiles).toBe(result.profiles);
        expect(again.profiles[0].gameHistory.filter(g=>g.id.includes(full.id))).toHaveLength(1);
    });
    it('retains the exact pending reward across write failure and retry',()=>{
        const p=profile(),s=complete('add');let writes=0;
        const failed=persistCounting([p],'a',s,()=>{writes++;throw new Error('quota');});expect(failed.ok).toBe(false);expect(failed.profiles[0]).toBe(p);expect(failed.session.reward).toBeDefined();
        const result=persistCounting([p],'a',failed.session,()=>{writes++;});expect(result.ok).toBe(true);expect(result.session.reward).toBe(failed.session.reward);expect(writes).toBe(2);
        expect(result.earned).toBe(failed.session.reward?.stars);
    });
    it('keeps other profiles and rejects stale owner/session callbacks',()=>{
        const a=profile(),b={...profile(),id:'b'},s=makeSession('a','count',2,3,emptyProgress());
        expect(persistCounting([a,b],'b',s,()=>{}).ok).toBe(false);
        const result=persistCounting([a,b],'a',s,()=>{});expect(result.profiles[1]).toBe(b);
        expect(persistCounting(result.profiles,'a',makeSession('a','count',2,2,emptyProgress()),()=>{}).ok).toBe(false);
    });
    it('does not show a duplicate-card exchange that has not awarded exchange stars',()=>{
        const p={...profile(),ownedImageIds:['owned-card']};
        const s:PendingSession={...complete('learn'),reward:{stars:3,image:{id:'owned-card',collectionId:'animals',name:'Owned',imagePath:'/owned.webp',rarity:Rarity.Common}}};
        const result=persistCounting([p],'a',s,()=>{});
        expect(result.ok).toBe(true);expect(result.image).toBeUndefined();expect(result.profiles[0].ownedImageIds).toEqual(['owned-card']);expect(result.earned).toBe(3);
    });
    it('requires independent work in at least two sessions',()=>{
        let result=persistCounting([profile()],'a',complete('count',1),()=>{});
        expect(mastered(result.profiles[0].counting?.skills.count?.['2'])).toBe(false);
        result=persistCounting(result.profiles,'a',complete('count',2),()=>{});
        expect(mastered(result.profiles[0].counting?.skills.count?.['2'])).toBe(true);
    });
    it('preserves counting and other data in old profile migration',()=>{
        const counting=emptyProgress();counting.stickers=[2,5];const p=migrateProfile({id:'old',name:'Bé',stars:12,counting,alphabetPractice:{version:1}});
        expect(p.counting).toEqual(counting);expect(p.stars).toBe(12);expect(p.alphabetPractice).toEqual({version:1});
    });
});

describe('number tracing corridors',()=>{
    it.each(NUMBERS)('can trace every stroke of %i and rejects shortcuts',n=>{
        const model=numberTrace(n);let state:TraceState={stroke:0,point:0};
        for(const [i,stroke] of model.strokes.entries()){
            expect(canStartTrace(model,state,stroke.points[0])).toBe(true);
            for(let p=1;p<stroke.points.length&&state.stroke===i;p++)state=advanceTrace(model,state,stroke.points[p-1],stroke.points[p]).state;
            expect(state.stroke).toBe(i+1);
        }
        expect(traceFinished(model,state)).toBe(true);
        const bad=advanceTrace(model,{stroke:0,point:0},[0,0],[300,350]);expect(bad.offPath).toBe(true);expect(traceFinished(model,bad.state)).toBe(false);
    });
});

describe('strict number audio lifecycle',()=>{
    let audio:any,voice:CountingVoice;
    beforeEach(()=>{
        vi.useFakeTimers();vi.stubGlobal('window',{speechSynthesis:{cancel:vi.fn(),getVoices:()=>[]}});
        vi.stubGlobal('Audio',class{onended:any;onerror:any;src:string;pause=vi.fn();play=vi.fn(()=>Promise.resolve());constructor(src:string){this.src=src;audio=this;}});voice=new CountingVoice();
    });
    afterEach(()=>{voice.cancel();vi.useRealTimers();vi.unstubAllGlobals();});
    it('reads English then Vietnamese and succeeds only after both ended events',async()=>{
        let settled=false;const promise=voice.number(3).then(r=>{settled=true;return r;});
        await Promise.resolve();expect(settled).toBe(false);expect(audio.src).toContain('counting-en-three.mp3');
        audio.onended();await Promise.resolve();expect(settled).toBe(false);expect(audio.src).toContain('audio/vi/ba.mp3');
        audio.onended();expect(await promise).toBe('ended');
    });
    it('reports decode/play errors and a timeout as failure',async()=>{
        const p=voice.number(2);audio.onerror();await Promise.resolve();expect(audio.src).toContain('/hai.mp3');audio.onended();expect(await p).toBe('error');
        const q=voice.number(1);await vi.advanceTimersByTimeAsync(30000);expect(await q).toBe('error');
    });
    it('cancels stale audio and settles only once',async()=>{
        const p=voice.number(1),late=audio.onended;const q=voice.number(2);expect(await p).toBe('cancelled');late();
        expect(audio.src).toContain('counting-en-two.mp3');audio.onended();await Promise.resolve();expect(audio.src).toContain('/hai.mp3');audio.onended();expect(await q).toBe('ended');
    });
    it('continues with the story instruction after both languages',async()=>{
        const instruction=storyFor(1).guide,p=voice.number(1,instruction);
        expect(audio.src).toContain('counting-en-one.mp3');audio.onended();await Promise.resolve();
        expect(audio.src).toContain('/mot.mp3');audio.onended();await Promise.resolve();
        expect(audio.src).toContain(`/${VOICE_LINES[instruction].file}.mp3`);audio.onended();expect(await p).toBe('ended');
    });
    it('does not start a queued language after cancellation between clips',async()=>{
        const p=voice.number(4),first=audio;audio.onended();voice.cancel();
        expect(await p).toBe('cancelled');expect(audio).toBe(first);
    });
    it('cancels explicitly on hidden page/unmount',async()=>{const p=voice.number(7);voice.cancel();expect(await p).toBe('cancelled');expect(audio.pause).toHaveBeenCalled();});
    it('uses bundled guidance and English audio without depending on a device voice or proxy',async()=>{
        for(const [text,{file,lang}] of Object.entries(VOICE_LINES)){
            const p=voice.play(text,lang==='en'?'en-US':'vi-VN');expect(audio.src).toContain(`/audio/vi/${file}.mp3`);audio.onended();expect(await p).toBe('ended');
        }
    });
});
