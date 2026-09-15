import { legalActions, resolveTurn, score } from './engine';
import { ROWS } from './board';
import type { Action, Level, Match, Seat } from './model';

export function evaluate(s: Match, seat: Seat): number {
  const enemy = 1-seat;
  if (s.phase === 'over') return s.winner === null ? 0 : (s.winner === seat ? 10000 : -10000) + score(s,seat)-score(s,enemy);
  const mobility = ROWS.map(row => row.filter(p=>s.board[p]>0).length);
  return (score(s,seat)-score(s,enemy))*12 + (mobility[seat]-mobility[enemy])*2 + (Math.min(5,s.banks[seat].dân)-Math.min(5,s.banks[enemy].dân))*.3;
}
export function greedyAction(s: Match): Action | null {
  let best: Action | null = null, value = -Infinity;
  for (const a of legalActions(s)) { const t = resolveTurn(s,a,false).state, v = t.phase === 'over' ? evaluate(t,s.active) : score(t,s.active)-score(s,s.active); if (v > value) { value=v; best=a; } }
  return best;
}
export interface SearchOptions { deadline?: number; maxDepth?: number; nodes?: number; seed?: number }
export function chooseAction(s: Match, level: Level, options: SearchOptions = {}) {
  const actions = legalActions(s), seat = s.active;
  if (!actions.length) return { action: null as Action | null, depth: 0, nodes: 0, reason: '' };
  let nodes=0, completed=0, best=greedyAction(s)!, bestValue=-Infinity;
  const deadline = options.deadline ?? performance.now() + ({easy:30,medium:160,hard:480}[level]);
  const maxNodes = options.nodes ?? ({easy:1500,medium:18000,hard:80000}[level]);
  const maxDepth = options.maxDepth ?? ({easy:2,medium:6,hard:10}[level]);
  const cutoff = Symbol('budget');
  function search(t:Match, depth:number, alpha:number, beta:number):number {
    if (++nodes > maxNodes || performance.now() >= deadline) throw cutoff;
    if (!depth || t.phase==='over') return evaluate(t,seat);
    const maximize=t.active===seat;
    const children=legalActions(t).map(a=>resolveTurn(t,a,false).state).sort((a,b)=>(evaluate(b,seat)-evaluate(a,seat))*(maximize?1:-1));
    let value=maximize?-Infinity:Infinity;
    for(const child of children){const v=search(child,depth-1,alpha,beta);value=maximize?Math.max(value,v):Math.min(value,v);if(maximize)alpha=Math.max(alpha,value);else beta=Math.min(beta,value);if(alpha>=beta)break;}
    return value;
  }
  for(let depth=1;depth<=maxDepth;depth++) {
    try {
      const ranked=actions.map(a=>({action:a,state:resolveTurn(s,a,false).state})).sort((a,b)=>evaluate(b.state,seat)-evaluate(a.state,seat));
      const values=ranked.map(r=>({...r,value:search(r.state,depth-1,-Infinity,Infinity)})).sort((a,b)=>b.value-a.value);
      const near=level==='easy'?values.filter(v=>v.value>=values[0].value-18 && (values[0].value<9000||v.value>=9000)):values.filter(v=>v.value===values[0].value);
      const index=level==='easy'?Math.abs((options.seed??s.revision*17+7)%near.length):0;
      best=near[index].action;bestValue=near[index].value;completed=depth;
      if(bestValue>=9000)break;
    }catch(e){if(e!==cutoff)throw e;break;}
  }
  const after=resolveTurn(s,best,false).state;
  const reason=after.phase==='over'&&after.winner===seat?'Kết thúc ván với lợi thế':after.banks[seat].quan>s.banks[seat].quan?'Đưa quan về khay':score(after,seat)>score(s,seat)?'Thu quân và giữ thế cờ':'Rải dân để chuẩn bị lượt sau';
  return {action:best as Action|null,depth:completed,nodes,reason};
}
