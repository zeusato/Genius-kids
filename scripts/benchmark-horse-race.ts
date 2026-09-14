import {writeFileSync} from 'node:fs';
import {newMatch,roll,pass,legalMoves,applyLegalMove} from '../games/HorseRace/engine';
import {chooseMove,greedyMove} from '../games/HorseRace/bot';
import {seeded} from '../games/HorseRace/rng';
import type {Player} from '../games/HorseRace/model';
const count=Number(process.argv[2]||64),opponent=process.argv[3]||'greedy',n=Number(process.argv[4]||2),offset=Number(process.argv[5]||90210),rollouts=Number(process.argv[6]||256);
let wins=0,unfinished=0,turns=0;const times:number[]=[],started=Date.now();
for(let game=0;game<count;game++){
 const challenger=game%n,rotation=Math.floor(game/n)%4,players:Player[]=Array.from({length:n},(_,i)=>({id:'p'+i,name:'P'+i,color:(rotation+(n===2?i*2:i))%4,kind:i?'bot':'human',level:'hard',avatar:'avatar_01'}));
 let s=newMatch('test',players,'bench-'+game,Math.floor(game/(n*4))%n);const dice=seeded(offset+game*7919),tie=seeded(offset+game*17+123);
 for(let turn=0;turn<3500&&s.winner===null;turn++){
  s=roll(s,1+Math.floor(dice()*6));const moves=legalMoves(s);if(!moves.length){s=pass(s);continue;}
  let move;
  if(s.active===challenger){const t=performance.now(),result=chooseMove(s,'hard',{seed:offset+game*8191+s.turn,rollouts});times.push(performance.now()-t);move=moves.find(m=>m.piece===result.piece)!;}
  else if(opponent==='random')move=moves[Math.floor(tie()*moves.length)];
  else if(opponent==='medium')move=moves.find(m=>m.piece===chooseMove(s,'medium',{seed:offset+game*5003+s.turn}).piece)!;
  else move=greedyMove(s,moves)!;
  s=applyLegalMove(s,move);
 }
 if(s.winner===challenger)wins++;if(s.winner===null)unfinished++;turns+=s.turn;
 if((game+1)%32===0)console.log(JSON.stringify({progress:game+1,count,wins,unfinished,seconds:Math.round((Date.now()-started)/1000)}));
}
times.sort((a,b)=>a-b);const p=wins/count,z=1.96,den=1+z*z/count,center=(p+z*z/(2*count))/den,half=z*Math.sqrt(p*(1-p)/count+z*z/(4*count*count))/den;
const report={count,opponent,players:n,offset,rollouts,wins,unfinished,winRate:p,ci95:[center-half,center+half],averageTurns:turns/count,decisions:times.length,p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],seconds:(Date.now()-started)/1000};
console.log(JSON.stringify(report,null,2));writeFileSync(`docs/horse-race-benchmark-${opponent}-${n}-${count}-${offset}.json`,JSON.stringify(report,null,2)+'\n');
