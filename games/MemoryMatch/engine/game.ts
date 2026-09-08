import { MemoryConfig, MemoryEvent, MemorySession, MemoryTile, activePhase, matching, columnsFor } from './model';
import { PICTURES, poolFor, validConfig } from '../content/catalog';

function random(seed:number){let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=Math.imul(n^(n>>>15),n|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function shuffle<T>(items:T[],rng:()=>number){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createSession(config:MemoryConfig,seed:number,id:string,columns=columnsFor(config.pairs)):MemorySession {
    if(!validConfig(config))throw new Error('Cấu hình bàn chơi không hợp lệ.');
    const rng=random(seed), pictures=shuffle(poolFor(config),rng).slice(0,config.pairs);
    const deck=shuffle(pictures.flatMap((picture,i):MemoryTile[]=>[{id:`tile-${i}-a`,picture,face:'picture'},{id:`tile-${i}-b`,picture,face:config.rule==='shadow'?'shadow':'picture'}]),rng);
    return {version:2,id,seed:seed>>>0,columns,config:{...config},deck,phase:'ready',selected:[],matched:[],attempts:0,hints:0,hintIds:[],hintMs:0,waitMs:0,elapsedMs:0,started:false,paused:false};
}
export function reduceMemory(s:MemorySession,e:MemoryEvent):MemorySession {
    if(e.sessionId!==s.id)return s;
    if(e.type==='pause')return s.paused?s:{...s,paused:true};
    if(e.type==='resume')return !s.paused?s:{...s,paused:false};
    if(s.paused)return s;
    if(e.type==='begin'&&s.phase==='ready')return {...s,phase:s.config.preview?'preview':'first',waitMs:Math.max(0,s.config.preview)*1000};
    if(e.type==='endPreview'&&s.phase==='preview')return {...s,phase:'first',waitMs:0};
    if(e.type==='flip'){
        if(!['first','second'].includes(s.phase)||s.selected.includes(e.id))return s;
        const tile=s.deck.find(c=>c.id===e.id);if(!tile||s.matched.includes(tile.picture))return s;
        const selected=[...s.selected,e.id];
        return {...s,selected,started:true,hintIds:[],hintMs:0,phase:selected.length===2?'resolving':'second',attempts:s.attempts+(selected.length===2?1:0),
            waitMs:selected.length===2?(matching(s.deck.find(c=>c.id===selected[0])!,tile,s.config.rule)?470:s.config.relaxed?1820:1120):0};
    }
    if(e.type==='hint'){
        if(!['first','second'].includes(s.phase)||s.hintMs>0)return s;
        const first=s.deck.find(c=>c.id===s.selected[0])||s.deck.find(c=>!s.matched.includes(c.picture));
        if(!first)return s;
        return {...s,hints:s.hints+1,hintIds:s.deck.filter(c=>c.picture===first.picture&&!s.selected.includes(c.id)).map(c=>c.id),hintMs:1800};
    }
    if(e.type==='tick'){
        if(!Number.isFinite(e.ms)||e.ms<=0)return s;
        const ms=Math.min(1000,e.ms),waitMs=Math.max(0,s.waitMs-ms),hintMs=Math.max(0,s.hintMs-ms);
        let next={...s,waitMs,hintMs,hintIds:hintMs?s.hintIds:[],elapsedMs:s.elapsedMs+(s.started&&activePhase(s)?ms:0)};
        if(s.phase==='preview'&&s.config.preview>0&&waitMs===0)next.phase='first';
        if(s.phase==='resolving'&&waitMs===0){
            const [a,b]=s.selected.map(id=>s.deck.find(c=>c.id===id)!);
            const matched=matching(a,b,s.config.rule)?[...s.matched,a.picture]:s.matched;
            next={...next,selected:[],matched,phase:matched.length===s.config.pairs?'complete':'first'};
        }
        return next;
    }
    return s;
}

/** Restore only bounded, internally consistent snapshots from this game's store. */
export function validSession(value:unknown):value is MemorySession {
    if(!value||typeof value!=='object')return false;
    const s=value as MemorySession;
    if(s.version!==2||typeof s.id!=='string'||!s.id.length||s.id.length>100||!Number.isInteger(s.seed)||s.seed<0||s.seed>0xffffffff||!validConfig(s.config))return false;
    if(!Array.isArray(s.deck)||s.deck.length!==s.config.pairs*2||!['ready','preview','first','second','resolving','complete'].includes(s.phase))return false;
    if(![columnsFor(s.config.pairs,360),columnsFor(s.config.pairs,1280)].includes(s.columns))return false;
    const ids=new Set<string>(),groups=new Map<string,MemoryTile[]>(),pool=poolFor(s.config);
    for(const c of s.deck){if(!c||typeof c.id!=='string'||c.id.length>80||ids.has(c.id)||!Object.hasOwn(PICTURES,c.picture)||!pool.includes(c.picture as keyof typeof PICTURES)||!['picture','shadow'].includes(c.face))return false;ids.add(c.id);groups.set(c.picture,[...(groups.get(c.picture)||[]),c]);}
    if(groups.size!==s.config.pairs||[...groups.values()].some(g=>g.length!==2||!matching(g[0],g[1],s.config.rule)||(s.config.rule==='same'&&g.some(c=>c.face!=='picture'))))return false;
    if(!Array.isArray(s.matched)||new Set(s.matched).size!==s.matched.length||s.matched.some(k=>!groups.has(k)))return false;
    if(!Array.isArray(s.selected)||s.selected.length>2||new Set(s.selected).size!==s.selected.length||s.selected.some(id=>!ids.has(id)||s.matched.includes(s.deck.find(c=>c.id===id)!.picture)))return false;
    if(s.selected.length!==(s.phase==='second'?1:s.phase==='resolving'?2:0))return false;
    if((s.phase==='complete')!==(s.matched.length===s.config.pairs))return false;
    if(![s.attempts,s.hints].every(n=>Number.isInteger(n)&&n>=0&&n<=100000)||s.attempts<s.matched.length+(s.phase==='resolving'?1:0))return false;
    if(![s.waitMs,s.hintMs,s.elapsedMs].every(n=>Number.isFinite(n)&&n>=0)||s.waitMs>8000||s.hintMs>1800||s.elapsedMs>86400000)return false;
    if(!Array.isArray(s.hintIds)||s.hintIds.length>2||s.hintIds.some(id=>!ids.has(id))||typeof s.started!=='boolean'||typeof s.paused!=='boolean')return false;
    if(['ready','preview'].includes(s.phase)&&(s.started||s.attempts||s.matched.length||s.selected.length||s.elapsedMs))return false;
    if(['second','resolving','complete'].includes(s.phase)&&!s.started)return false;
    if(!s.started&&(s.attempts||s.elapsedMs||s.matched.length))return false;
    if(s.phase==='preview'&&!s.config.preview)return false;
    if(s.waitMs>0&&!['preview','resolving'].includes(s.phase))return false;
    if(s.phase==='preview'&&s.waitMs>Math.max(0,s.config.preview)*1000)return false;
    if(new Set(s.hintIds).size!==s.hintIds.length||(!s.hintMs&&s.hintIds.length)||(!['first','second'].includes(s.phase)&&s.hintMs))return false;
    return true;
}
