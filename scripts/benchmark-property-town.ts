
import {writeFileSync} from 'node:fs';
import {createMatch,actor,reduce,validateMatch,winners} from '../games/PropertyTown/engine';
import {choose,observation} from '../games/PropertyTown/bot';
import type {Player} from '../games/PropertyTown/model';
const count=Number(process.argv[2]||100),results=[];const started=Date.now();
for(const seats of [2,3,4]){const wins=Array(seats).fill(0),times:number[]=[];let unfinished=0,upgrades=0,invalid=0;
 for(let seed=0;seed<count;seed++){const party:Player[]=Array.from({length:seats},(_,i)=>({name:'P'+i,kind:i===0?'human':'bot',skill:'medium',cash:1500,position:0}));let s=createMatch('benchmark',party,'family',seed+seats*100000,'bench-'+seed),actions=0;
 while(s.phase!=='over'&&actions++<6000){const command=choose(observation(s)),n=reduce(s,{id:s.id,revision:s.revision,actor:actor(s),command});if(n===s)throw Error('Stuck '+s.phase);if(command.type==='upgrade')upgrades++;s=n;}
 if(!validateMatch(s,'benchmark'))invalid++;if(s.phase!=='over')unfinished++;else{times.push(s.turn);winners(s).forEach(i=>wins[i]++);}
 }
 times.sort((a,b)=>a-b);const result={seats,games:count,unfinished,invalid,winPercent:wins.map(v=>v/count*100),medianTurns:times[Math.floor(times.length*.5)],p90Turns:times[Math.floor(times.length*.9)],maxTurns:times.at(-1),averageUpgrades:upgrades/count};results.push(result);console.log(JSON.stringify(result));
}
writeFileSync('docs/co-ti-phu-benchmark-v2.json',JSON.stringify({version:2,date:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,policy:'Equal medium bots, random starting seat; cap 6000 actions for reporting, no in-game turn cap.',results},null,2));

