import type { Match, Move, Player } from './model';
import { trackCell } from './board';

export function validateParty(value:unknown):value is Player[]{
  if(!Array.isArray(value)||value.length<2||value.length>4)return false;
  if(value.some(p=>!p||typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!p.name.trim()||p.name.length>50||!Number.isInteger(p.color)||p.color<0||p.color>3||!['human','bot'].includes(p.kind)||!['easy','medium','hard'].includes(p.level)||typeof p.avatar!=='string')||value[0].kind!=='human')return false;
  return new Set(value.map(p=>p.color)).size===value.length&&new Set(value.map(p=>p.id)).size===value.length;
}
export function newMatch(owner:string,players:Player[],id:string,first=0):Match {
  if(!owner||!id||!validateParty(players)||!Number.isInteger(first)||first<0||first>=players.length)throw Error('Invalid players');
  return {version:1,rulesVersion:1,id,owner,players:players.map(p=>({...p})),pieces:Array(players.length*4).fill(-1),locked:Array(players.length*4).fill(false),finished:players.map(()=>0),captures:players.map(()=>0),active:first%players.length,dice:null,phase:'roll',winner:null,revision:0,turn:1,started:new Date().toISOString(),elapsed:0};
}
export function occupied(s:Match):Int16Array {
  const cells=new Int16Array(56).fill(-1);
  s.pieces.forEach((p,i)=>{if(p>=0&&p<56)cells[trackCell(s.players[Math.floor(i/4)].color,p)]=i;});return cells;
}
export function legalMoves(s:Match):Move[] {
  if(s.phase!=='choose'||!s.dice||s.winner!==null)return[];
  const dice=s.dice, base=s.active*4, color=s.players[s.active].color, cells=occupied(s), moves:Move[]=[];
  for(let i=base;i<base+4;i++){
    if(s.locked[i])continue;
    const from=s.pieces[i];let to:number,kind:Move['kind'],capture:number|null=null;
    if(from<0){if(dice!==6)continue;to=0;kind='deploy';}
    else if(from<55){to=from+dice;if(to>55)continue;kind='walk';}
    else {
      to=from===55?55+dice:from+1;
      if(from>55&&dice!==to-55)continue;
      if(to>61-s.finished[s.active])continue;
      let blocked=false;
      for(let k=base;k<base+4;k++)if(k!==i&&s.pieces[k]>from&&s.pieces[k]<=to)blocked=true;
      if(blocked)continue;kind='home';
    }
    if(to<56){
      let blocked=false;
      for(let p=Math.max(0,from+1);p<to;p++)if(cells[trackCell(color,p)]>=0)blocked=true;
      if(blocked)continue;
      const hit=cells[trackCell(color,to)];
      if(hit>=0){if(Math.floor(hit/4)===s.active)continue;capture=hit;}
    }
    moves.push({piece:i,from,to,capture,kind});
  }return moves;
}
function nextTurn(s:Match):Match {
  const extra=s.dice===6;
  return {...s,active:extra?s.active:(s.active+1)%s.players.length,dice:null,phase:'roll',turn:s.turn+1};
}
export function roll(s:Match,value:number):Match {
  if(s.phase!=='roll'||!Number.isInteger(value)||value<1||value>6)return s;
  return {...s,dice:value,phase:'choose',revision:s.revision+1};
}
export function pass(s:Match):Match {
  if(s.phase!=='choose'||legalMoves(s).length)return s;
  return nextTurn({...s,revision:s.revision+1});
}
export function applyMove(s:Match,piece:number):Match {
  const move=legalMoves(s).find(m=>m.piece===piece);
  return move?applyLegalMove(s,move):s;
}
// Search uses moves produced by legalMoves; UI must call applyMove for revalidation.
export function applyLegalMove(s:Match,m:Move):Match {
  const n={...s,pieces:s.pieces.slice(),locked:s.locked.slice(),finished:s.finished.slice(),captures:s.captures.slice(),revision:s.revision+1};
  n.pieces[m.piece]=m.to;
  if(m.capture!==null){n.pieces[m.capture]=-1;n.captures[s.active]++;}
  if(m.to===61-s.finished[s.active]){n.locked[m.piece]=true;n.finished[s.active]++;}
  if(n.finished[s.active]===4)return {...n,winner:s.active,phase:'over'};
  return nextTurn(n);
}
export function validateMatch(value:unknown,owner?:string):value is Match {
  if(!value||typeof value!=='object')return false;
  const s=value as Match,n=s.players?.length;
  if(s.version!==1||s.rulesVersion!==1||typeof s.id!=='string'||!s.id||typeof s.owner!=='string'||!s.owner||(owner&&s.owner!==owner)||!validateParty(s.players))return false;
  if(!Array.isArray(s.pieces)||s.pieces.length!==n*4||!Array.isArray(s.locked)||s.locked.length!==n*4||!Array.isArray(s.finished)||s.finished.length!==n||!Array.isArray(s.captures)||s.captures.length!==n)return false;
  if(!Number.isInteger(s.active)||s.active<0||s.active>=n||!['roll','choose','over'].includes(s.phase)||!Number.isInteger(s.revision)||s.revision<0||!Number.isInteger(s.turn)||s.turn<1||!Number.isFinite(s.elapsed)||s.elapsed<0||typeof s.started!=='string'||!Number.isFinite(Date.parse(s.started)))return false;
  if(s.phase==='roll'?s.dice!==null:!Number.isInteger(s.dice)||s.dice!<1||s.dice!>6)return false;
  if(s.captures.some(c=>!Number.isInteger(c)||c<0)||s.locked.some(v=>typeof v!=='boolean'))return false;
  const cells=new Set<number>();
  for(let i=0;i<s.pieces.length;i++){
    const p=s.pieces[i],ownerIndex=Math.floor(i/4);
    if(!Number.isInteger(p)||p< -1||p>61||s.locked[i]&&p<58)return false;
    if(p>=0&&p<56){const c=trackCell(s.players[ownerIndex].color,p);if(cells.has(c))return false;cells.add(c);}
  }
  for(let i=0;i<n;i++){
    const positions=s.pieces.slice(i*4,i*4+4),done=s.locked.slice(i*4,i*4+4).filter(Boolean).length;
    if(s.finished[i]!==done||new Set(positions.filter(p=>p>=56)).size!==positions.filter(p=>p>=56).length)return false;
    const goals=positions.filter((_,j)=>s.locked[i*4+j]).sort((a,b)=>b-a);
    if(goals.some((p,j)=>p!==61-j))return false;
    if(positions.some((p,j)=>!s.locked[i*4+j]&&p>=61-done))return false;
  }
  return s.phase==='over'?Number.isInteger(s.winner)&&s.winner===s.active&&s.finished[s.winner!]===4:s.winner===null&&s.finished.every(f=>f<4);
}
