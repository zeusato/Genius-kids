import {MathUtils,Vector3} from 'three';
import {point} from './board';
import type {Position} from './model';

export type BoardView='tilted'|'straight';
export const INTRO_SECONDS=9.2;
export function boardDistance(aspect:number){return Math.max(8.7/(Math.tan(38*Math.PI/360)*aspect),4.6/Math.tan(38*Math.PI/360))*1.1;}
export function boardCameraPosition(view:BoardView,distance:number){return new Vector3(0,view==='straight'?1:.79,view==='straight'?.001:.61).normalize().multiplyScalar(distance);}
/** Follow occupied pits in preview fixtures as well as the standard opening. */
export function introTargets(position:Position){
 const occupied=(pits:number[])=>pits.find(pit=>position.board[pit]>0)??pits[0];
 const citizen=(pit:number)=>{const [x,,z]=point(pit);return new Vector3(x,.53,z);};
 const quan=position.quan[0]?5:position.quan[1]?11:null;
 return [citizen(occupied([1,2,0,3,4])),quan===null?citizen(occupied([3,4,2,1,0])):new Vector3(point(quan)[0],.84,-.45)];
}
export function introPose(progress:number,view:BoardView,distance:number,targets:Vector3[]){
 const t=MathUtils.clamp(progress,0,1)*INTRO_SECONDS,scale=MathUtils.clamp(distance/21,.85,3);
 const zero=new Vector3(),keys=[{time:0,position:new Vector3(-.5,.85,1).normalize().multiplyScalar(distance*1.4),target:zero,velocity:zero}];
 targets.forEach((target,index)=>{
  const shot=(angle:number)=>({target,position:target.clone().add(new Vector3(Math.sin(angle)*3.2,1.65,Math.cos(angle)*3.2).multiplyScalar(scale)),velocity:new Vector3(-Math.cos(angle),0,Math.sin(angle)).multiplyScalar(.41*scale)});
  keys.push({time:2+index*3.4,...shot(.5)},{time:3.8+index*3.4,...shot(.27)});
 });
 keys.push({time:INTRO_SECONDS,position:boardCameraPosition(view,distance),target:zero,velocity:zero});
 const index=keys.findIndex((_,i)=>i<keys.length-1&&t<=keys[i+1].time),a=keys[index],b=keys[index+1],duration=b.time-a.time;
 const u=(t-a.time)/duration,u2=u*u,u3=u2*u;
 const position=a.position.clone().multiplyScalar(2*u3-3*u2+1).addScaledVector(a.velocity,(u3-2*u2+u)*duration).addScaledVector(b.position,-2*u3+3*u2).addScaledVector(b.velocity,(u3-u2)*duration);
 if(index===2)position.y+=2.5*Math.sin(Math.PI*u)**2;
 return {position,target:a.target.clone().lerp(b.target,u2*(3-2*u))};
}
