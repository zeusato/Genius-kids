import {writeFileSync} from 'node:fs';
import {newMatch,legalActions,resolveTurn,positionKey,score} from '../games/OAnQuan/engine';
import {chooseAction,greedyAction} from '../games/OAnQuan/bot';
import {seeded} from '../games/HorseRace/rng';
import type {Match,Player,Seat} from '../games/OAnQuan/model';
const count=Number(process.argv[2]||128),opponent=process.argv[3]||'greedy',seed=Number(process.argv[4]||20260915);
const party:Player[]=[{id:'a',name:'A',avatar:'avatar_01',kind:'human',level:'hard'},{id:'b',name:'B',avatar:'avatar_02',kind:'bot',level:'hard'}];
const random=seeded(seed),positions:Match[]=[],keys=new Set<string>();
for(let attempt=0;positions.length<count;attempt++){let s=newMatch('benchmark',party,'seed-'+attempt,attempt%2 as Seat);const target=3+Math.floor(random()*22);for(let t=0;t<target&&s.phase==='play';t++){const a=legalActions(s);s=resolveTurn(s,a[Math.floor(random()*a.length)],false).state;}const key=positionKey(s);if(s.phase==='play'&&!keys.has(key)){keys.add(key);positions.push(s);}}
const times:number[]=[],depths:number[]=[];let wins=0,draws=0,losses=0,unfinished=0,turns=0,difference=0;const reasons:Record<string,number>={},started=Date.now();
for(let index=0;index<positions.length;index++)for(const challenger of [0,1] as Seat[]){let s=structuredClone(positions[index]),steps=0;for(;steps<400&&s.phase==='play';steps++){const actions=legalActions(s);let action;
  if(s.active===challenger){const start=performance.now(),r=chooseAction(s,'hard',{deadline:Infinity,nodes:4000,maxDepth:6});times.push(performance.now()-start);depths.push(r.depth);action=r.action!;}
  else if(opponent==='random')action=actions[Math.floor(random()*actions.length)];
  else if(opponent==='medium')action=chooseAction(s,'medium',{deadline:Infinity,nodes:1000,maxDepth:3}).action!;
  else action=greedyAction(s)!;
  s=resolveTurn(s,action,false).state;
}turns+=steps;difference+=score(s,challenger)-score(s,1-challenger);if(s.phase!=='over')unfinished++;else{reasons[s.reason!]=(reasons[s.reason!]||0)+1;if(s.winner===null)draws++;else if(s.winner===challenger)wins++;else losses++;}
 if(challenger===1&&(index+1)%16===0)console.log(JSON.stringify({positions:index+1,count,wins,draws,losses,seconds:Math.round((Date.now()-started)/1000)}));
}
times.sort((a,b)=>a-b);const total=count*2,report={seed,opponent,uniquePositions:positions.length,games:total,search:{hard:{nodes:4000,maxDepth:6},medium:{nodes:1000,maxDepth:3},deadline:'none, fixed work'},wins,draws,losses,unfinished,matchScore:(wins+.5*draws)/total,averageDifference:difference/total,averageTurns:turns/total,reasons,decisions:times.length,meanDepth:depths.reduce((a,b)=>a+b,0)/depths.length,p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],seconds:(Date.now()-started)/1000};writeFileSync(`docs/o-an-quan-benchmark-${opponent}-${count}-${seed}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
