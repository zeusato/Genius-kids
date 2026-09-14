import {describe,it,expect} from 'vitest';
import {TRACK,STARTS,STABLES,TEAM_CORNERS,pieceHeading,homePoint,trackCell} from './board';
import {newMatch} from './engine';
import type {Player} from './model';

describe('board direction',()=>{
 it('travels counterclockwise: north, west, south, east, with the same logical cell IDs',()=>{
  expect(STARTS).toEqual([0,14,28,42]);
  expect(STARTS.map(i=>TRACK[i])).toEqual([[-1,-7],[-7,1],[1,7],[7,-1]]);
  // Screen z grows down; a negative signed area is counterclockwise.
  const area=TRACK.reduce((a,[x,z],i)=>{const [nx,nz]=TRACK[(i+1)%56];return a+x*nz-nx*z;},0)/2;
  expect(area).toBeLessThan(0);
 });
 it('keeps each final gate next to its own home and badge next to its stable',()=>{
  for(let c=0;c<4;c++){
   const gate=TRACK[trackCell(c,55)],home=homePoint(c,1);
   expect(Math.hypot(home[0]-gate[0],home[1]-gate[1])).toBe(1);
   const [x,z]=STABLES[c];expect(TEAM_CORNERS[c]).toBe(z<0?(x<0?0:1):(x<0?3:2));
  }
 });
 it('faces the next segment at bends and faces inward from the gate and home',()=>{
  const players:Player[]=[0,1,2,3].map(color=>({id:String(color),name:'Bạn '+color,color,kind:'human',level:'hard',avatar:'avatar_01'}));
  const state=newMatch('owner',players,'heading');
  state.pieces[0]=6;expect(pieceHeading(state,0)).toBeCloseTo(-Math.PI/2); // turn west
  state.pieces[0]=13;expect(pieceHeading(state,0)).toBeCloseTo(0); // turn south
  for(let c=0;c<4;c++)for(const position of [55,56,61]){
   state.pieces[c*4]=position;
   const heading=pieceHeading(state,c*4),[hx,hz]=homePoint(c,1);
   expect(Math.sin(heading)).toBeCloseTo(-hx/6);expect(Math.cos(heading)).toBeCloseTo(-hz/6);
  }
 });
});
