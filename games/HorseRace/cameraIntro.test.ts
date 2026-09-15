import {describe,it,expect} from 'vitest';
import {Vector3} from 'three';
import {introPose,introSubjects,introDuration} from './cameraIntro';
import {boardPreset} from './view';
import {newMatch} from './engine';
import {piecePoint} from './board';
import type {Player} from './model';

const game=(colors:number[])=>{
 const players:Player[]=colors.map(color=>({id:String(color),name:'Bạn',color,kind:'human',level:'easy',avatar:'avatar_01'}));
 return newMatch('owner',players,'intro-test',0);
};
const subjects=introSubjects(game([0,2]));

describe('opening camera flight',()=>{
 it.each(['straight','tilted'] as const)('ends exactly at the %s playing preset',view=>{
  const actual=introPose(1,view,42,subjects).position;
  const expected=new Vector3().setFromSpherical(boardPreset(view,42));
  expect(actual.distanceTo(expected)).toBeLessThan(1e-10);
  expect(introPose(1,view,42,subjects).target.length()).toBe(0);
  expect(introPose(2,view,42,subjects)).toEqual(introPose(1,view,42,subjects));
 });
 it.each([[2,9.2],[3,12.6],[4,16]])('gives a %s-player intro %s seconds', (count,seconds)=>{
  expect(introDuration(count)).toBeCloseTo(seconds);
 });
 it.each([[3,1],[2,0,3],[1,3,0,2]])('visits every actual player color in order: %j',(...colors:number[])=>{
  const match=game(colors),selected=introSubjects(match),duration=introDuration(colors.length);
  expect(selected).toHaveLength(colors.length);
  selected.forEach((subject,index)=>{
   expect(Array.from({length:4},(_,n)=>piecePoint(match,index*4+n))).toContainEqual(subject.point);
   // Check the beginning, middle and end of every 1.8-second close-up.
   for(const beat of [.05,.9,1.75]){
    const time=(2+index*3.4+beat)/duration,pose=introPose(time,'tilted',42,selected);
    expect(pose.target.toArray()).toEqual([subject.point[0],1.3,subject.point[1]]);
    expect(pose.position.distanceTo(pose.target)).toBeLessThan(5);
    expect(pose.position.distanceTo(pose.target)).toBeGreaterThan(4);
   }
  });
 });
 it('still focuses on real horses when a team has left its stable',()=>{
  const match={...game([3,0,2]),pieces:[0,8,16,24,...Array(8).fill(-1)]};
  expect(Array.from({length:4},(_,piece)=>piecePoint(match,piece))).toContainEqual(introSubjects(match)[0].point);
 });
 it.each([2,3,4])('keeps the %s-player path above the scenery and ends at either preset',count=>{
  const selected=introSubjects(game([3,0,2,1].slice(0,count)));
  for(const view of ['straight','tilted'] as const)for(const distance of [30,42,75]){
   for(let i=0;i<=200;i++){
    const pose=introPose(i/200,view,distance,selected);
    expect(pose.position.toArray().every(Number.isFinite)).toBe(true);
    expect(pose.position.y).toBeGreaterThan(2.9);
   }
   expect(introPose(1,view,distance,selected).position.distanceTo(new Vector3().setFromSpherical(boardPreset(view,distance)))).toBeLessThan(1e-10);
   expect(introPose(1,view,distance,selected).target.length()).toBe(0);
  }
  for(let i=0;i<count-1;i++){
   expect(introPose((4.6+i*3.4)/introDuration(count),'tilted',42,selected).position.y).toBeGreaterThan(8);
  }
 });
 it('joins all shots without jumps in camera position, velocity or focus',()=>{
  const h=.000001,selected=introSubjects(game([3,1,0,2]));
  for(const seconds of [2,3.8,5.4,7.2,8.8,10.6,12.2,14]){
   const time=seconds/introDuration(4);
   const a=introPose(time-h,'tilted',42,selected),b=introPose(time,'tilted',42,selected),c=introPose(time+h,'tilted',42,selected);
   expect(a.position.distanceTo(c.position)).toBeLessThan(.001);
   const before=b.position.clone().sub(a.position).divideScalar(h),after=c.position.clone().sub(b.position).divideScalar(h);
   expect(before.distanceTo(after)).toBeLessThan(.15);
   expect(a.target.distanceTo(c.target)).toBeLessThan(.00001);
  }
  expect(introPose(0,'tilted',42,subjects).position.distanceTo(introPose(h,'tilted',42,subjects).position)).toBeLessThan(.00001);
  expect(introPose(1,'tilted',42,subjects).position.distanceTo(introPose(1-h,'tilted',42,subjects).position)).toBeLessThan(.00001);
 });
});
