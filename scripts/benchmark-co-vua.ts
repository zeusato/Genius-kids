// Run through esbuild; defaults are a smoke run, not a strength certification.
import { writeFileSync } from 'node:fs';
import { newMatch,applyMove,legalMoves,moveToStr } from '../games/CoVua/engine';
import { chooseMove,randomMove,greedyMove } from '../games/CoVua/bot';
import type { Match,Move,Player,Level } from '../games/CoVua/model';
import { algToSq } from '../games/CoVua/board';
const openings=[[],['e2e4','e7e5','g1f3','b8c6'],['d2d4','d7d5','c2c4','e7e6'],['g1f3','d7d5','g2g3','g8f6'],['c2c4','e7e5','b1c3','g8f6']];
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const pairs=Number(args.pairs??5),plyLimit=Number(args.plies??160),seed=Number(args.seed??20260915),opponent=args.opponent??'random',level=(args.level??'hard') as Level;
const work=args.mode!=='deadline',nodes=Number(args.nodes??2500),timeMs=Number(args.ms??1200);
if(!Number.isInteger(pairs)||pairs<1||pairs>1000||!['random','greedy','depth4','easy','medium','hard'].includes(opponent)||!['easy','medium','hard'].includes(level))throw Error('Invalid benchmark arguments');
const player=(id:string):Player=>({id,name:id,avatar:'',kind:'bot',level:'hard'});
const make=()=>newMatch('bench',[player('W'),player('B')],'bench');
const parse=(s:string):Move=>({from:algToSq(s.slice(0,2)),to:algToSq(s.slice(2,4))});
const pick=(m:Match,strategy:string,s:number)=>strategy==='random'?randomMove(m,s):strategy==='greedy'?greedyMove(m):chooseMove(m,strategy==='depth4'?'hard':strategy as Level,{seed:s,...(strategy==='depth4'?{maxDepth:4,maxNodes:1000000,deadline:30000}:work?{maxNodes:nodes,deadline:30000}:{deadline:timeMs})}).move;
const games:{pair:number;side:number;outcome:'win'|'draw'|'loss'|'unfinished';plies:number;reason:string|null;opening:string[]}[]=[];
let illegal=0;const started=performance.now();
for(let pair=0;pair<pairs;pair++) {
  const opening=openings[pair%openings.length];
  for(const side of [0,1]){
    let m=make();for(const text of opening)m=applyMove(m,parse(text)).match;
    while(m.phase==='play'&&m.turn<plyLimit){const move=pick(m,m.active===side?level:opponent,seed+pair*997+m.turn);if(!move)break;const next=applyMove(m,move).match;if(next===m){illegal++;break;}m=next;}
    games.push({pair,side,outcome:m.phase!=='over'?'unfinished':m.winner===null?'draw':m.winner===side?'win':'loss',plies:m.turn,reason:m.reason,opening});
  }
}
const counts={win:0,draw:0,loss:0,unfinished:0};games.forEach(g=>counts[g.outcome]++);
// Bootstrap complete paired colour swaps; unfinished games are never labelled draws.
const pairScores=Array.from({length:pairs},(_,p)=>games.filter(g=>g.pair===p)).filter(pair=>pair.every(g=>g.outcome!=='unfinished')).map(pair=>pair.reduce((s,g)=>s+(g.outcome==='win'?1:g.outcome==='draw'?.5:0),0)/2);
let state=seed;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return (state>>>0)/4294967296;};
const samples=pairScores.length>=10?Array.from({length:5000},()=>pairScores.reduce(s=>s+pairScores[Math.floor(rand()*pairScores.length)],0)/pairScores.length).sort((a,b)=>a-b):[];
const latency:Record<string,unknown>={};
for(const tier of ['easy','medium','hard'] as const){const times:number[]=[],depths:number[]=[];for(const opening of openings){let m=make();for(const text of opening)m=applyMove(m,parse(text)).match;const result=chooseMove(m,tier,{seed});if(!result.move||!legalMoves(m).some(move=>moveToStr(move)===moveToStr(result.move!)))illegal++;times.push(result.elapsedMs);depths.push(result.depth);}times.sort((a,b)=>a-b);latency[tier]={samples:times.length,p50Ms:Math.round(times[Math.floor(times.length*.5)]),p95Ms:Math.round(times[Math.ceil(times.length*.95)-1]),depths};}
const output={date:new Date().toISOString(),rulesVersion:'gk-chess-v2',purpose:'smoke; does not establish skill relative to people',configuration:{pairs,plyLimit,seed,opponent,level,mode:work?'fixed-nodes':'deadline',nodes:work?nodes:null,timeMs:work?null:timeMs},counts,illegalMoves:illegal,finishedScore:counts.win+counts.draw+counts.loss?(counts.win+.5*counts.draw)/(counts.win+counts.draw+counts.loss):null,completePairs:pairScores.length,pairedBootstrap95:samples.length?[samples[125],samples[4874]]:null,ciNote:samples.length?'Conditional on complete pairs; inspect unfinished count.':'At least 10 complete pairs required; no confidence interval reported.',latency,seconds:Math.round((performance.now()-started)/1000),games};
if(args.output)writeFileSync(args.output,JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
