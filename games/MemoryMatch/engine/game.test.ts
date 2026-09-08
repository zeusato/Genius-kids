import { describe, expect, it } from 'vitest';
import { createSession, reduceMemory, validSession } from './game';
import { MemoryConfig, MemoryEvent, MemorySession, PAIR_COUNTS, resultOf } from './model';
import { MISSIONS, ZONES, missionConfig, validConfig } from '../content/catalog';

const config:MemoryConfig={zone:'garden',pairs:3,rule:'same',preview:0,relaxed:false};
type Input=Omit<MemoryEvent,'sessionId'>|{type:'flip';id:string}|{type:'tick';ms:number};
const act=(s:MemorySession,e:Input)=>reduceMemory(s,{...e,sessionId:s.id} as MemoryEvent);
const open=(c=config)=>act(createSession(c,42,'test'),{type:'begin'});
function settle(s:MemorySession){for(let i=0;i<3;i++)s=act(s,{type:'tick',ms:1000});return s;}
function flipPair(s:MemorySession,picture:string){for(const c of s.deck.filter(c=>c.picture===picture))s=act(s,{type:'flip',id:c.id});return settle(s);}
const copy=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));

describe('Memory decks and the complete campaign',()=>{
    it('creates reproducible, distinct pairs across 6,500 seeded boards',()=>{
        const configs=[...MISSIONS.map(m=>missionConfig(m)),...ZONES.flatMap(z=>PAIR_COUNTS.map(pairs=>({...config,zone:z.id,pairs})))];
        for(const c of configs)for(let seed=0;seed<100;seed++){
            const s=createSession(c,seed,'deck');
            expect(validSession(s)).toBe(true);
            expect(s.deck).toEqual(createSession(c,seed,'another').deck);
            expect(new Set(s.deck.map(t=>t.picture)).size).toBe(c.pairs);
        }
        expect(createSession(config,1,'a').deck).not.toEqual(createSession(config,2,'a').deck);
    });
    it('keeps normal boards within their chosen theme and extends only large free play',()=>{
        for(const z of ZONES)for(let seed=0;seed<60;seed++){
            expect(createSession({...config,zone:z.id,pairs:12},seed,'a').deck.every(t=>z.pool.includes(t.picture as never))).toBe(true);
        }
        expect(new Set(createSession({...config,pairs:15},4,'a').deck.map(t=>t.picture)).size).toBe(15);
        expect(validConfig({...config,pairs:15,zone:'shapes',rule:'shadow'})).toBe(false);
        expect(validConfig({...missionConfig(MISSIONS[0]),pairs:15})).toBe(false);
    });
    it.each(MISSIONS)('$id: finishes in exactly the minimum number of attempts',m=>{
        let s=open(missionConfig(m));s=act(s,{type:'endPreview'});
        const deck=copy(s.deck);
        for(const p of new Set(s.deck.map(t=>t.picture))){s=flipPair(s,p);expect(validSession(copy(s))).toBe(true);}
        expect(s.phase).toBe('complete');expect(s.attempts).toBe(m.pairs);expect(s.deck).toEqual(deck);
        expect(resultOf(s)).toMatchObject({stars:3,score:1000});
        expect(act(s,{type:'flip',id:s.deck[0].id})).toBe(s);
        expect(act(s,{type:'tick',ms:1000}).elapsedMs).toBe(s.elapsedMs);
    });
});
describe('Memory interaction and resumable timing',()=>{
    it('rejects double taps, third flips, nonexistent cards and stale session events',()=>{
        let s=open();const a=s.deck[0],b=s.deck.find(t=>t.picture!==a.picture)!,third=s.deck.find(t=>t.id!==a.id&&t.id!==b.id)!;
        const untouched=copy(s);expect(act(s,{type:'flip',id:'missing'})).toBe(s);
        let first=act(s,{type:'flip',id:a.id});expect(act(first,{type:'flip',id:a.id})).toBe(first);
        const pair=act(first,{type:'flip',id:b.id});expect(pair.attempts).toBe(1);
        expect(act(pair,{type:'flip',id:third.id})).toBe(pair);
        expect(reduceMemory(pair,{sessionId:'old',type:'tick',ms:1000})).toBe(pair);
        expect(s).toEqual(untouched);
        expect(settle(pair)).toMatchObject({phase:'first',matched:[],selected:[],attempts:1});
    });
    it('pauses before the first card, during a mismatch and during a preview',()=>{
        let s=open();expect(act(s,{type:'tick',ms:1000}).elapsedMs).toBe(0);
        s=act(s,{type:'flip',id:s.deck[0].id});s=act(s,{type:'flip',id:s.deck.find(t=>t.picture!==s.deck[0].picture)!.id});
        s=act(s,{type:'tick',ms:400});s=act(s,{type:'pause'});expect(validSession(copy(s))).toBe(true);
        const paused=copy(s);s=act(s,{type:'tick',ms:1000});expect(s).toEqual(paused);
        expect(act(s,{type:'flip',id:s.deck[4].id})).toBe(s);
        s=act(copy(s),{type:'resume'});expect(s.waitMs).toBe(720);s=act(s,{type:'tick',ms:719});expect(s.phase).toBe('resolving');
        expect(act(s,{type:'tick',ms:1}).phase).toBe('first');
        let preview=open({...config,preview:3});preview=act(preview,{type:'tick',ms:1000});preview=act(preview,{type:'pause'});
        expect(settle(preview).waitMs).toBe(2000);expect(preview.elapsedMs).toBe(0);
        expect(settle(act(preview,{type:'resume'})).phase).toBe('first');
    });
    it('keeps manual previews open and does not count them as play time',()=>{
        let s=open({...config,preview:-1,relaxed:true});s=settle(s);
        expect(s).toMatchObject({phase:'preview',elapsedMs:0});expect(validSession(s)).toBe(true);
        expect(act(s,{type:'flip',id:s.deck[0].id})).toBe(s);
        s=act(s,{type:'endPreview'});s=act(s,{type:'flip',id:s.deck[0].id});s=act(s,{type:'flip',id:s.deck.find(c=>c.picture!==s.deck[0].picture)!.id});
        expect(s.waitMs).toBe(1820);
    });
    it('gives a matching positional hint without flipping or penalizing the player',()=>{
        let s=open();s=act(s,{type:'flip',id:s.deck[0].id});s=act(s,{type:'hint'});
        expect(s.hintIds).toHaveLength(1);expect(s.deck.find(t=>t.id===s.hintIds[0])?.picture).toBe(s.deck[0].picture);
        expect(s.selected).toHaveLength(1);expect(s.attempts).toBe(0);expect(act(s,{type:'hint'})).toBe(s);
        s=settle(s);expect(s.hintIds).toEqual([]);expect(s.hints).toBe(1);
        expect(resultOf({...s,attempts:3,hints:99}).stars).toBe(3);
    });
    it('restores the last pending match and completes only once',()=>{
        let s=open();const pictures=[...new Set(s.deck.map(c=>c.picture))];
        for(const p of pictures.slice(0,-1))s=flipPair(s,p);
        for(const t of s.deck.filter(c=>c.picture===pictures.at(-1)))s=act(s,{type:'flip',id:t.id});
        s=act(s,{type:'pause'});expect(validSession(copy(s))).toBe(true);
        s=settle(act(copy(s),{type:'resume'}));expect(s.phase).toBe('complete');
        expect(settle(s).matched).toEqual(s.matched);expect(s.matched).toHaveLength(3);
    });
    it('rejects corrupted snapshots instead of restoring an unwinnable board',()=>{
        const s=createSession(config,2,'original');
        const corruptions:MemorySession[]=[{...s,id:''},{...s,version:3 as 2},{...s,deck:s.deck.slice(1)},{...s,phase:'preview'},
            {...s,deck:s.deck.map((t,i)=>i===1?s.deck[0]:t)},{...s,selected:['missing'],phase:'second',started:true},
            {...s,matched:[s.deck[0].picture]},{...s,elapsedMs:Infinity},{...s,phase:'complete'},
            {...s,config:{...config,rule:'shadow'}},{...s,hintIds:[s.deck[0].id],hintMs:0}];
        corruptions.forEach(v=>expect(validSession(v)).toBe(false));
        expect(validSession(null)).toBe(false);expect(validSession({})).toBe(false);
    });
    it('uses published star thresholds independent of time and board size',()=>{
        const s=open();expect(resultOf({...s,attempts:4,elapsedMs:100000}).stars).toBe(3);
        expect(resultOf({...s,attempts:5}).stars).toBe(2);expect(resultOf({...s,attempts:6}).stars).toBe(2);
        expect(resultOf({...s,attempts:7}).stars).toBe(1);
        expect(resultOf({...s,config:{...config,pairs:15},attempts:15}).score).toBe(1000);
    });
    it('preserves columns across restore, including a desktop board resumed on a phone',()=>{
        const s=createSession({...config,pairs:12},11,'landscape',6),restored=copy(s);
        expect(validSession(restored)).toBe(true);expect(restored.columns).toBe(6);
        expect(act(act(restored,{type:'pause'}),{type:'resume'}).deck).toEqual(s.deck);
        expect(validSession({...s,columns:7})).toBe(false);
    });
});
