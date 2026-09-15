import {describe,it,expect} from 'vitest';
import {INTRO_SECONDS,boardDistance,boardCameraPosition,introTargets,introPose} from './cameraIntro';
import type {Position} from './model';

const opening:Position={board:Array.from({length:12},(_,i)=>i===5||i===11?0:5),quan:[true,true],banks:[{dân:0,quan:0},{dân:0,quan:0}]};
const targets=introTargets(opening);
describe('Ô ăn quan camera intro',()=>{
 it.each(['tilted','straight'] as const)('returns exactly to the %s playing view on desktop and phone',view=>{
  for(const aspect of [.5,1,2]){
   const distance=boardDistance(aspect),pose=introPose(1,view,distance,targets);
   expect(pose.position.distanceTo(boardCameraPosition(view,distance))).toBeLessThan(1e-10);
   expect(pose.target.length()).toBe(0);
   expect(introPose(2,view,distance,targets)).toEqual(pose);
  }
 });
 it('holds exactly one dân shot and one quan shot for 1.8 seconds each',()=>{
  expect(INTRO_SECONDS).toBe(9.2);
  expect(targets.map(t=>t.toArray())).toEqual([[-2.05,.53,1.15],[6.45,.84,-.45]]);
  targets.forEach((target,i)=>{
   for(const beat of [.05,.9,1.75]){
    const pose=introPose((2+3.4*i+beat)/INTRO_SECONDS,'tilted',21,targets);
    expect(pose.target.distanceTo(target)).toBeLessThan(1e-10);
    expect(pose.position.distanceTo(target)).toBeLessThan(3.7);
    expect(pose.position.distanceTo(target)).toBeGreaterThan(3.4);
   }
  });
 });
 it('uses occupied pits and the remaining quan in custom starting positions',()=>{
  const custom={...opening,board:Array.from({length:12},(_,i)=>i===4||i===6?2:0),quan:[false,true]};
  expect(introTargets(custom).map(t=>t.toArray())).toEqual([[4.1,.53,1.15],[-6.45,.84,-.45]]);
  expect(introTargets({...custom,quan:[false,false]})[1].x).toBe(4.1);
 });
 it('keeps the camera above the pieces throughout every transition',()=>{
  for(const aspect of [.5,1,2])for(const view of ['tilted','straight'] as const)for(let i=0;i<=250;i++){
   const pose=introPose(i/250,view,boardDistance(aspect),targets);
   expect(pose.position.toArray().every(Number.isFinite)).toBe(true);
   expect(pose.position.y).toBeGreaterThan(1.8);
   expect(pose.position.y).toBeGreaterThan(pose.target.y);
  }
 });
 it('joins close-ups without position, velocity or focus jumps',()=>{
  const h=.000001;
  for(const seconds of [2,3.8,5.4,7.2]){
   const t=seconds/INTRO_SECONDS,a=introPose(t-h,'tilted',21,targets),b=introPose(t,'tilted',21,targets),c=introPose(t+h,'tilted',21,targets);
   expect(a.position.distanceTo(c.position)).toBeLessThan(.001);
   expect(b.position.clone().sub(a.position).divideScalar(h).distanceTo(c.position.clone().sub(b.position).divideScalar(h))).toBeLessThan(.15);
   expect(a.target.distanceTo(c.target)).toBeLessThan(.00001);
  }
 });
});
