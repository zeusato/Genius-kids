import {describe,expect,it} from 'vitest';
import {newMatch,roll,legalMoves,validateMatch} from './engine';
import {chooseMove} from './bot';
import type {Match,Player} from './model';
interface Position {name:string;pieces:number[];die:number;accept:number[];finished?:number;locked?:number[]}
const positions:Position[]=[
 {name:'finish the first horse instead of deploying',pieces:[55,20],die:6,accept:[0]},
 {name:'finish the second horse instead of racing',pieces:[61,55,21],die:5,finished:1,locked:[0],accept:[1]},
 {name:'finish the third horse',pieces:[61,60,55,20],die:4,finished:2,locked:[0,1],accept:[2]},
 {name:'take a winning gate entry',pieces:[61,60,59,55],die:3,finished:3,locked:[0,1,2],accept:[3]},
 {name:'finish a horse already on rung five',pieces:[60,15],die:6,accept:[0]},
 {name:'finish rung four after a previous finish',pieces:[61,59,14],die:5,finished:1,locked:[0],accept:[1]},
 {name:'advance the leading horse on an open road',pieces:[8,35],die:2,accept:[1]},
 {name:'keep the advanced horse moving when deployment is blocked',pieces:[0,20],die:6,accept:[1]},
 {name:'capture rather than move a low reserve',pieces:[4,1,-1,-1,36],die:4,accept:[0]},
 {name:'capture with the front horse',pieces:[4,10,-1,-1,42],die:4,accept:[1]},
 {name:'escape with an exposed advanced horse',pieces:[45,5,-1,-1,14],die:6,accept:[0]},
 {name:'capture an opponent at their gate',pieces:[24,5,-1,-1,55],die:3,accept:[0]},
 {name:'deploy onto an occupied start',pieces:[20,-1,-1,-1,28],die:6,accept:[1,2,3]},
 {name:'clear a home blocker ahead of the gate horse',pieces:[58,55,20],die:4,accept:[0]},
 {name:'avoid entering rung one while another horse can move',pieces:[55,20],die:1,accept:[1]},
 {name:'avoid entering rung two while the reserve is advancing',pieces:[55,40],die:2,accept:[1]},
 {name:'enter rung five to become safe',pieces:[55,45],die:5,accept:[0]},
 {name:'land at the gate exactly',pieces:[52,2],die:3,accept:[0]},
 {name:'move the clear front horse when another is blocked',pieces:[10,12,24],die:3,accept:[2]},
 {name:'complete the final home step to win',pieces:[61,60,59,57],die:3,finished:3,locked:[0,1,2],accept:[3]},
];
function state(p:Position,rotation=0):Match{const players:Player[]=[{id:'host',name:'An',color:rotation,kind:'human',level:'hard',avatar:'avatar_01'},{id:'bot',name:'Máy',color:(rotation+2)%4,kind:'bot',level:'hard',avatar:'avatar_02'}];const s=newMatch('owner',players,'tactic');s.pieces=[...p.pieces,...Array(8-p.pieces.length).fill(-1)];s.finished[0]=p.finished??0;for(const piece of p.locked??[])s.locked[piece]=true;return roll(s,p.die);}
describe('bot tactical acceptance',()=>{
 it('passes at least 90% of twenty distinct tactical positions across four color rotations',()=>{
  const misses:string[]=[];let total=0;
  for(const p of positions)for(let rotation=0;rotation<4;rotation++){const s=state(p,rotation);expect(validateMatch(s),p.name).toBe(true);const before=JSON.stringify(s),answer=chooseMove(s,'hard',{seed:317});expect(legalMoves(s).some(m=>m.piece===answer.piece),p.name).toBe(true);expect(JSON.stringify(s)).toBe(before);if(!p.accept.includes(answer.piece!))misses.push(p.name+' / '+rotation+' -> '+answer.piece);total++;}
  console.info(`Horse tactical cases: ${total-misses.length}/${total} passed (${positions.length} positions × 4 colors).`);
  expect(1-misses.length/total,misses.join('\n')).toBeGreaterThanOrEqual(.9);
 });
 it('never targets a seat differently because it is controlled by a child',()=>{const s=state(positions[10]),other={...s,players:s.players.map(p=>({...p,kind:'human' as const}))};expect(chooseMove(s,'hard',{seed:8})).toEqual(chooseMove(other,'hard',{seed:8}));});
});
