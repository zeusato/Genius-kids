import { describe, expect, it, vi } from 'vitest';
import type { StudentProfile } from '../../../types';
import { missionFor } from './content';
import { designError, evaluate, placeGear, removePart } from './engine';
import { LEVELS, type WorkshopRecord } from './model';
import { completeWorkshop, persistWorkshop, progressOf, readDraft, saveDraft, validDraft } from './progress';
const profile=():StudentProfile=>({id:'p',name:'Engineer',grade:3,age:9,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:20,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[],shopDailyPhotos:[],achievements:[]});
function win(id=0,perfect=true):WorkshopRecord {const m=missionFor(id);const design=structuredClone(m.solution);if(perfect)for(const g of m.predictions)design.guesses[g.id]=evaluate(m,design).sim.runtime.get(g.id)!.dir;else design.guesses={};return {version:1,mission:id,difficulty:m.difficulty,seed:m.seed,stars:999,design};}
describe('Workshop physical rules and authored missions',()=>{
    it('every mission and difficulty has a valid, non-jammed solution for both direction variants',()=>{
        for(let id=0;id<6;id++)for(const level of LEVELS)for(const seed of [1,2,3,20,2147483647]){
            const m=missionFor(id,level.id,seed),r=evaluate(m,m.solution);
            expect(designError(m,m.initial),`${id}/${level.id}: initial`).toBeNull();
            expect(r.valid,`${id}/${level.id}: ${r.checks.map(c=>c.detail).join(';')}`).toBe(true);
            expect(r.success,`${id}/${level.id}: solution`).toBe(true);expect(r.sim.jammed).toBe(false);expect(r.stars).toBeGreaterThanOrEqual(2);
            for(const g of m.goals){expect(r.sim.runtime.get(g.id)?.dir).toBe(g.dir);if(g.speed)expect(r.sim.runtime.get(g.id)?.speed).toBeCloseTo(g.speed);}
            expect(r.used).toBeLessThanOrEqual(m.par);
        }
    });
    it('makes each difficulty structurally distinct, not just a different label',()=>{
        for(let id=0;id<6;id++){
            const configurations=LEVELS.map(l=>{const m=missionFor(id,l.id);return JSON.stringify([m.sockets,m.initial,m.goals,m.maxParts,m.stock]);});
            expect(new Set(configurations).size,`mission ${id}`).toBe(3);
        }
        for(const id of [1,4,5])for(const l of LEVELS)expect(missionFor(id,l.id,1).goals).not.toEqual(missionFor(id,l.id,2).goals);
    });
    it('rejects overlap, fixed-slot replacement and spent stock without changing the design',()=>{
        const m=missionFor(0,'medium'),d=structuredClone(m.initial);
        expect(placeGear(m,d,'g1',16).error).toContain('chồng');expect(d).toEqual(m.initial);
        expect(placeGear(m,d,'motor',12).error).toBeTruthy();
        const limited={...m,stock:{12:1}};expect(designError(limited,m.solution)).toContain('Không còn');
        expect(designError({...m,maxParts:1},m.solution)).toContain('Vượt');
        const small=placeGear(m,d,'g1',8);expect(small.error).toBeNull();expect(evaluate(m,small.design).success).toBe(false);
    });
    it('requires every output, and the correct belt orientation',()=>{
        const m=missionFor(4,'medium'),d=structuredClone(m.solution);delete d.gears.a;
        expect(evaluate(m,d).checks.find(c=>c.id==='target2:drive')?.ok).toBe(true);expect(evaluate(m,d).success).toBe(false);
        const wrong=structuredClone(m.solution);wrong.belts[0].kind='belt-crossed';expect(evaluate(m,wrong).success).toBe(false);
        const duplicate=structuredClone(m.solution);duplicate.belts.push({...duplicate.belts[0],id:'second'});
        expect(designError({...m,belts:2,maxParts:10},duplicate)).toContain('đã có');
        const far=missionFor(5,'hard'),farD=structuredClone(far.solution);farD.belts[0]={id:'far',a:'a',b:'target2',kind:'belt'};
        expect(designError(far,farD)).toContain('quá xa');
    });
    it('distinguishes an unconnected mechanism from a contradictory, jammed loop',()=>{
        expect(evaluate(missionFor(0),missionFor(0).initial).sim.jammed).toBe(false);
        for(const level of LEVELS){const m=missionFor(3,level.id);expect(evaluate(m,m.initial).sim.jammed).toBe(true);let d=removePart(m,m.initial,'b');
            if(level.id!=='easy')expect(evaluate(m,d).sim.jammed).toBe(true);
            d.belts=[];if(level.id==='hard'){expect(evaluate(m,d).sim.jammed).toBe(true);d=removePart(m,d,'c');}
            expect(evaluate(m,d).success).toBe(true);
        }
    });
    it('changes speed by changing the output gear, while preserving direction and connectivity',()=>{
        const m=missionFor(5,'medium'),d=structuredClone(m.solution);d.gears.target=16;
        const r=evaluate(m,d);expect(r.sim.runtime.get('target')).toMatchObject({dir:1,speed:1,state:'driven'});expect(r.success).toBe(false);
        expect(evaluate(m,m.solution).sim.runtime.get('target')?.speed).toBe(2);
    });
    it('requires an actual prediction in the train mission, and returns connected belts when removing a wheel',()=>{
        const m=missionFor(2);expect(evaluate(m,m.initial).success).toBe(false);expect(evaluate(m,m.solution).success).toBe(true);
        const pump=missionFor(1),d=removePart(pump,pump.solution,'b');expect(d.belts).toEqual([]);expect(d.gears.b).toBeUndefined();expect(pump.solution.belts).toHaveLength(1);
    });
});
describe('Workshop durable rewards and drafts',()=>{
    it('recomputes stars, awards only improvement and preserves the original profile',()=>{
        const p=profile(),before=structuredClone(p),a=completeWorkshop(p,win(0,false),30),b=completeWorkshop(a.profile,win(),45),c=completeWorkshop(b.profile,win(),45);
        expect(a.earned).toBe(2);expect(b.earned).toBe(1);expect(c.earned).toBe(0);expect(c.changed).toBe(false);expect(p).toEqual(before);
        expect(b.profile.stars).toBe(23);expect(b.profile.gameHistory).toHaveLength(1);expect(b.profile.gameHistory[0].starsEarned).toBe(3);expect(b.profile.gameHistory[0].starAwards?.map(a=>a.amount)).toEqual([2,1]);
    });
    it('has an 18-star lifetime cap across difficulty changes and retries',()=>{
        let p=profile();for(let id=0;id<6;id++)p=completeWorkshop(p,win(id),30).profile;
        expect(p.stars).toBe(38);expect(Object.keys(progressOf(p))).toHaveLength(6);
        for(let id=0;id<6;id++){const m=missionFor(id,'hard',2),d=structuredClone(m.solution);m.predictions.forEach(g=>{d.guesses[g.id]=evaluate(m,d).sim.runtime.get(g.id)!.dir;});const r=completeWorkshop(p,{version:1,mission:id,difficulty:'hard',seed:2,stars:3,design:d},30);expect(r.earned).toBe(0);p=r.profile;}
        expect(p.stars).toBe(38);
    });
    it('cannot complete an invalid machine, and retries failed persistence without consuming the reward',()=>{
        const ps=[profile(),{...profile(),id:'other'}],bad=win();bad.design.gears={};expect(completeWorkshop(ps[0],bad,1).ok).toBe(false);
        const failed=persistWorkshop(ps,'p',win(),20,()=>{throw Error('quota');});expect(failed.ok).toBe(false);expect(failed.profiles).toBe(ps);
        const write=vi.fn(),a=persistWorkshop(ps,'p',win(),20,write),b=persistWorkshop(a.profiles,'p',win(),20,write);expect(a.earned).toBe(3);expect(b.earned).toBe(0);expect(write).toHaveBeenCalledTimes(1);expect(a.profiles[1]).toBe(ps[1]);expect(persistWorkshop(ps,'missing',win(),20,write).ok).toBe(false);
    });
    it('validates and isolates unfinished drafts, including quota failure and damaged JSON',()=>{
        const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v)});
        try{const d=win();expect(saveDraft('p',d)).toBe(true);expect(readDraft('p').draft).toEqual(d);expect(readDraft('other').draft).toBeNull();data.set('gears-workshop:p','{');expect(readDraft('p').error).toBe(true);
            for(const raw of [null,{}, {...d,seed:0},{...d,mission:9},{...d,difficulty:'expert'},{...d,design:{gears:[],belts:[],guesses:{}}},{...d,design:{...d.design,belts:[null]}}])expect(validDraft(raw)).toBe(false);
            vi.stubGlobal('localStorage',{setItem:()=>{throw Error('quota');}});expect(saveDraft('p',d)).toBe(false);
        }finally{vi.unstubAllGlobals();}
    });
});
