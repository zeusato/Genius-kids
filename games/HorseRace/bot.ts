import type { Match, Move, Level } from './model';
import { applyLegalMove, legalMoves, occupied, pass, roll } from './engine';
import { trackCell } from './board';
import { seeded } from './rng';

export const valueOf=(p:number,locked=false,finished=0)=>locked?150:p<0?0:p<56?3+p*.5+p*p*.018:150-Math.max(0,61-finished-p)*12;
export function risk(s:Match,player:number):number {
  const cells=occupied(s);let cost=0;
  for(let i=player*4;i<player*4+4;i++){
    const pos=s.pieces[i];if(pos<0||pos>=56)continue;
    const target=trackCell(s.players[player].color,pos);let chances=0;
    for(let j=0;j<s.pieces.length;j++){
      const other=Math.floor(j/4),op=s.pieces[j];if(other===player)continue;
      if(op<0){if(target===s.players[other].color*14)chances=Math.max(chances,1/6);continue;}
      if(op>=55)continue;
      const source=trackCell(s.players[other].color,op),d=(target-source+56)%56;
      if(d<1||d>6||op+d>55)continue;
      let clear=true;for(let k=1;k<d;k++)if(cells[(source+k)%56]>=0)clear=false;
      if(clear)chances+=1/6;
    }
    cost+=Math.min(.65,chances)*(valueOf(pos)+18)*(s.active===player?.45:1);
  }return cost;
}
export function positionScore(s:Match,player:number):number {
  let sum=0,live=0;
  for(let i=player*4;i<player*4+4;i++){sum+=valueOf(s.pieces[i],s.locked[i],s.finished[player]);if(s.pieces[i]>=0&&!s.locked[i])live++;}
  return sum+Math.min(live,2)*2-risk(s,player)*.45;
}
export function tacticalScore(s:Match,m:Move):number {
  const after=applyLegalMove(s,m),who=s.active;
  if(after.winner===who)return 100000;
  // Leading horses clear bottlenecks; deploying a reserve matters before the
  // leader is far ahead. Exposure accounts for every opponent's legal capture.
  return m.to+(m.kind==='deploy'?30:0)+(m.kind==='home'?30:0)
    +(m.capture!==null?(s.pieces[m.capture]+10)*.5:0)
    +(after.finished[who]>s.finished[who]?1000:0)-risk(after,who)*4
    -(s.players.length===2&&m.from===55?Math.max(0,60-s.finished[who]-m.to)*35:0);
}
export function greedyMove(s:Match,moves=legalMoves(s)):Move|undefined {
  return moves.reduce<Move|undefined>((best,m)=>!best||greedyScore(s,m)>greedyScore(s,best)?m:best,undefined);
}
function greedyScore(s:Match,m:Move){return(m.to===61-s.finished[s.active]?10000:0)+(m.kind==='home'?1000:0)+(m.capture!==null?200:0)+m.to;}
function rolloutMove(s:Match,moves:Move[],random:()=>number):Move {
  // Use the same self-interested racing policy in every seat. Keep dice draws
  // independent of the number of available moves so candidate trials stay paired.
  let best=moves[0],score=-Infinity;
  for(const m of moves){const v=(m.to===61-s.finished[s.active]?1000:0)+m.to+(m.capture!==null?(s.pieces[m.capture]+10)*.5:0)+(m.kind==='home'?30:0);if(v>score){score=v;best=m;}}
  return best;
}
export interface SearchOptions { seed?:number; rollouts?:number; depth?:number; deadline?:number }
export function chooseMove(s:Match,level:Level,options:SearchOptions={}):{piece:number|null;reason:string;simulations:number} {
  const moves=legalMoves(s);if(!moves.length)return{piece:null,reason:'Không có nước đi',simulations:0};
  const ranked=moves.map(m=>({move:m,score:tacticalScore(s,m)})).sort((a,b)=>b.score-a.score);
  if(ranked[0].score>=100000||moves.length===1)return{piece:ranked[0].move.piece,reason:ranked[0].score>=100000?'Về đích để chiến thắng':'Nước đi duy nhất',simulations:0};
  const random=seeded(options.seed??(s.turn*7919+s.revision*131+s.active*17)),count=options.rollouts??(level==='hard'?256:level==='medium'?64:0),depth=options.depth??(level==='hard'?24:8);
  let sims=0;
  if(level!=='easy'&&count>0){
    const sums=ranked.map(()=>0),runs=ranked.map(()=>0),initial=ranked.map(r=>applyLegalMove(s,r.move));
    for(let round=0;round<Math.ceil(count/ranked.length);round++){
      if(options.deadline&&performance.now()>options.deadline)break;
      const seed=Math.floor(random()*0x7fffffff);
      for(let k=0;k<ranked.length;k++){
        const rng=seeded(seed);let t=initial[k];
        for(let d=0;d<depth&&t.winner===null;d++){t=roll(t,1+Math.floor(rng()*6));const legal=legalMoves(t);t=legal.length?applyLegalMove(t,rolloutMove(t,legal,rng)):pass(t);}
        const own=positionScore(t,s.active),others=t.players.map((_,p)=>p===s.active?-Infinity:positionScore(t,p));
        const utility=t.winner===s.active?1200:t.winner!==null?-1200:own-Math.max(...others)*.65;
        sums[k]+=utility;runs[k]++;sims++;
      }
    }
    // Immediate tactical evidence remains influential when short rollouts are noisy.
    ranked.forEach((r,k)=>{if(runs[k])r.score+=(sums[k]/runs[k]-(positionScore(s,s.active)-Math.max(...s.players.map((_,p)=>p===s.active?-Infinity:positionScore(s,p)))*.65))*.15;});
    ranked.sort((a,b)=>b.score-a.score);
  }
  const chosen=level==='easy'?ranked.filter(r=>r.score>=ranked[0].score-12)[Math.floor(random()*ranked.filter(r=>r.score>=ranked[0].score-12).length)]:ranked[0];
  const m=chosen.move,reason=m.to===61-s.finished[s.active]?'Đưa ngựa về đích':m.kind==='home'?'Vào chuồng an toàn':m.capture!==null?'Đá ngựa và giành lợi thế':m.kind==='deploy'?'Thêm ngựa vào cuộc đua':'Tiến lên và giữ thế cờ';
  return{piece:m.piece,reason,simulations:sims};
}
