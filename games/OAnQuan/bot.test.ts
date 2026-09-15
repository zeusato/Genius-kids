import {describe,expect,it} from 'vitest';
import {chooseAction,evaluate} from './bot';
import {legalActions,newMatch,positionKey,resolveTurn} from './engine';
import {seeded} from '../HorseRace/rng';
import type {Match,Player,Seat} from './model';
const players:Player[]=[{id:'a',name:'An',avatar:'avatar_01',kind:'human',level:'hard'},{id:'b',name:'Bông',avatar:'avatar_02',kind:'bot',level:'medium'}];
// Exhaustive reference traversal: no pruning, ordering or iterative deepening.
function oracle(s:Match,depth:number,seat:Seat):number{
  if(!depth||s.phase==='over')return evaluate(s,seat);
  const values=legalActions(s).map(a=>oracle(resolveTurn(s,a,false).state,depth-1,seat));
  return s.active===seat?Math.max(...values):Math.min(...values);
}
describe('bot search against an exhaustive reference',()=>{
  it('chooses an optimal three-turn result on 30 distinct seeded reachable boards',()=>{
    const rng=seeded(87133),keys=new Set<string>();let checked=0;
    for(let trial=0;checked<30&&trial<300;trial++){
      let s=newMatch('test',players,'search-'+trial,trial%2 as Seat);
      for(let turn=0;turn<3+trial%24&&s.phase==='play';turn++){const actions=legalActions(s);s=resolveTurn(s,actions[Math.floor(rng()*actions.length)],false).state;}
      if(s.phase==='over'||keys.has(positionKey(s)))continue;keys.add(positionKey(s));
      const result=chooseAction(s,'hard',{deadline:Infinity,nodes:1000000,maxDepth:3});
      expect(result.action).not.toBeNull();expect(legalActions(s)).toContainEqual(result.action);
      const values=legalActions(s).map(a=>oracle(resolveTurn(s,a,false).state,2,s.active));
      const chosen=resolveTurn(s,result.action!,false).state;
      // A proven immediate win may stop deepening before tie-breaking score changes.
      if(chosen.phase==='over'&&chosen.winner===s.active)expect(evaluate(chosen,s.active)).toBeGreaterThan(9000);
      else expect(oracle(chosen,2,s.active)).toBeCloseTo(Math.max(...values),8);
      checked++;
    }
    expect(checked).toBe(30);
  });
  it('returns a legal fallback under an exhausted deadline without changing the state',()=>{
    const s=newMatch('test',players,'timeout'),before=structuredClone(s),r=chooseAction(s,'hard',{deadline:0});
    expect(r.depth).toBe(0);expect(legalActions(s)).toContainEqual(r.action);expect(s).toEqual(before);
  });
});
