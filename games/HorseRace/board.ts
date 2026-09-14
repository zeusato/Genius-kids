import type { Match } from './model';

// Counterclockwise in the board's x/z plane (z points down on screen).
// Keep logical cell IDs and player progress stable so existing saves and bot
// collision calculations remain valid when the board's presentation changes.
const corners = [[-1,-7],[-1,-1],[-7,-1],[-7,1],[-1,1],[-1,7],[1,7],[1,1],[7,1],[7,-1],[1,-1],[1,-7]];
export const TRACK: [number, number][] = [];
corners.forEach(([x,z],i)=>{
  const [tx,tz]=corners[(i+1)%corners.length], n=Math.abs(tx-x)+Math.abs(tz-z);
  for(let j=0;j<n;j++)TRACK.push([x+Math.sign(tx-x)*j,z+Math.sign(tz-z)*j]);
});
export const STARTS = [0,14,28,42];
export const STABLES = [[-4.25,-4.25],[-4.25,4.25],[4.25,4.25],[4.25,-4.25]];
export const TEAM_CORNERS = [0,3,2,1];
/** The stable opens toward local +Z, the same forward axis as the horse model. */
export function stableHeading(color:number):number {
  const [x,z]=TRACK[STARTS[color]],[nx,nz]=TRACK[(STARTS[color]+1)%TRACK.length];
  return Math.atan2(nx-x,nz-z);
}
export function trackCell(color:number, position:number) { return (STARTS[color]+position)%56; }
export function homePoint(color:number, step:number):[number,number] {
  const d=7-step;
  return color===0?[0,-d]:color===1?[-d,0]:color===2?[0,d]:[d,0];
}
/** Face the next legal direction, including bends and each private home lane. */
export function pieceHeading(s:Match,piece:number):number {
  const position=s.pieces[piece],color=s.players[Math.floor(piece/4)].color;
  if(position<0)return stableHeading(color);
  const a=piecePoint(s,piece);
  const b=position<55?piecePoint(s,piece,position+1):position===55?homePoint(color,1):[0,0];
  return Math.atan2(b[0]-a[0],b[1]-a[1]);
}
// Arrow-bearing tiles; derived from the route so they cannot disagree
// with the animation or the fallback 2D board.
export const ROUTE_ARROWS = TRACK.flatMap(([x,z],i)=>{
  if(i%7!==2)return [];
  const [nx,nz]=TRACK[(i+1)%TRACK.length];
  return [{x,z,angle:Math.atan2(nz-z,nx-x)}];
});
export function piecePoint(s:Match,piece:number,position=s.pieces[piece]):[number,number] {
  const color=s.players[Math.floor(piece/4)].color;
  if(position<0){const [x,z]=STABLES[color],n=piece%4;return[x+(n%2? .65:-.65),z+(n<2?-.65:.65)];}
  return position<56?TRACK[trackCell(color,position)]:homePoint(color,position-55);
}
