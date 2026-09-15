import {Vector3,MathUtils} from 'three';
import {boardPreset} from './view';
import type {BoardView} from './view';
import {piecePoint,pieceHeading,stableHeading} from './board';
import type {Match} from './model';

const ARRIVAL_SECONDS=2,CLOSE_SECONDS=1.8,TRANSFER_SECONDS=1.6,RETURN_SECONDS=2;
export function introDuration(playerCount:number){
 return ARRIVAL_SECONDS+playerCount*CLOSE_SECONDS+Math.max(0,playerCount-1)*TRANSFER_SECONDS+RETURN_SECONDS;
}
export interface IntroSubject {point:[number,number];heading:number}
/** Pick a front-row horse from every participating team in player order. */
export function introSubjects(match:Match):IntroSubject[]{
 return match.players.map((player,index)=>{
  const heading=stableHeading(player.color),pieces=Array.from({length:4},(_,n)=>index*4+n);
  const stabled=pieces.filter(p=>match.pieces[p]<0);
  const piece=(stabled.length?stabled:pieces).sort((a,b)=>{
   const pa=piecePoint(match,a),pb=piecePoint(match,b);
   return (pb[0]-pa[0])*Math.sin(heading)+(pb[1]-pa[1])*Math.cos(heading);
  })[0];
  return {point:piecePoint(match,piece),heading:pieceHeading(match,piece)};
 });
}

/** Each player gets the same unhurried close-up, regardless of the party size. */
export function introPose(progress:number,view:BoardView,distance:number,subjects:IntroSubject[]){
 const total=introDuration(subjects.length),t=MathUtils.clamp(progress,0,1)*total,scale=MathUtils.clamp(distance/42,.8,2);
 const end=new Vector3().setFromSpherical(boardPreset(view,distance));
 const start=new Vector3(-.8,.8,1).normalize().multiplyScalar(distance*1.45);
 const close=(subject:IntroSubject,offset:number)=>{
  const angle=subject.heading+offset,target=new Vector3(subject.point[0],1.3,subject.point[1]);
  const position=target.clone().add(new Vector3(Math.sin(angle)*4.1*scale,2.1*scale,Math.cos(angle)*4.1*scale));
  const velocity=new Vector3(-Math.cos(angle),0,Math.sin(angle)).multiplyScalar(.52*scale);
  return {position,target,velocity};
 };
 const zero=new Vector3(),keys=[{time:0,position:start,target:zero,velocity:zero}];
 subjects.forEach((subject,index)=>{
  const arrival=ARRIVAL_SECONDS+index*(CLOSE_SECONDS+TRANSFER_SECONDS);
  keys.push({time:arrival,...close(subject,.58)},{time:arrival+CLOSE_SECONDS,...close(subject,.35)});
 });
 keys.push({time:total,position:end,target:zero,velocity:zero});
 const index=keys.findIndex((_,i)=>i<keys.length-1&&t<=keys[i+1].time);
 const a=keys[index],b=keys[index+1],duration=b.time-a.time;
 const u=(t-a.time)/(b.time-a.time),u2=u*u,u3=u2*u;
 // Cubic Hermite interpolation preserves position and velocity at every join.
 const position=a.position.clone().multiplyScalar(2*u3-3*u2+1)
  .addScaledVector(a.velocity,(u3-2*u2+u)*duration)
  .addScaledVector(b.position,-2*u3+3*u2)
  .addScaledVector(b.velocity,(u3-u2)*duration);
 // Rise above the stable roofs while travelling between teams.
 if(index>0&&index%2===0&&index<keys.length-2)position.y+=5*Math.sin(Math.PI*u)**2;
 const target=a.target.clone().lerp(b.target,u2*(3-2*u));
 return {position,target};
}
