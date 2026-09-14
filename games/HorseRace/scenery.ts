import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TEAMS} from './model';
import {TRACK,STABLES,homePoint,ROUTE_ARROWS} from './board';

let grain:T.CanvasTexture|undefined;
export function woodGrain(){
 if(grain)return grain;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext('2d')!;ctx.fillStyle='#dbc6a6';ctx.fillRect(0,0,1024,512);
 for(let i=0;i<210;i++){
  const y=i*2.5;ctx.beginPath();ctx.moveTo(0,y);
  for(let x=0;x<=1024;x+=16)ctx.lineTo(x,y+Math.sin(x*.009+i*.13)*3+Math.sin(x*.023+i)*1.2);
  ctx.strokeStyle=i%3===0?'#97633223':'#fff2ce32';ctx.lineWidth=i%5===0?1.8:.65;ctx.stroke();
 }
 grain=new T.CanvasTexture(canvas);grain.colorSpace=T.SRGBColorSpace;grain.anisotropy=4;return grain;
}

let surface:T.CanvasTexture|undefined;
/** Painted details stay under the 3D tiles and never replace playable geometry. */
export function boardSurface(){
 if(surface)return surface;
 const c=document.createElement('canvas');c.width=c.height=1536;
 const ctx=c.getContext('2d')!,unit=1536/15.65;
 ctx.fillStyle='#f5edda';ctx.fillRect(0,0,1536,1536);
 ctx.translate(768,768);ctx.scale(unit,unit);
 // Subtle, deterministic ceramic grain, with no texture/network dependency.
 for(let i=0;i<18000;i++){const x=((i*73)%1536)/unit-7.825,z=((i*173)%1531)/unit-7.825;ctx.fillStyle=i%2?'#ad97720a':'#ffffff30';ctx.fillRect(x,z,.012,.012);}
 ctx.strokeStyle='#bc9e6480';ctx.lineWidth=.018;ctx.strokeRect(-7.57,-7.57,15.14,15.14);
 STABLES.forEach(([x,z],color)=>{
  ctx.fillStyle=TEAMS[color].light;ctx.globalAlpha=.8;ctx.beginPath();ctx.roundRect(x-2.45,z-2.45,4.9,4.9,.55);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=TEAMS[color].color+'80';ctx.lineWidth=.026;ctx.beginPath();ctx.roundRect(x-2.31,z-2.31,4.62,4.62,.45);ctx.stroke();
  // Small leaf engravings outside the horse paddock.
  for(const side of [-1,1])for(let j=0;j<3;j++){ctx.save();ctx.translate(x+side*(1.75+j*.16),z+side*2.06);ctx.rotate(side*.6);ctx.fillStyle=TEAMS[color].color+'50';ctx.beginPath();ctx.ellipse(0,0,.13,.035,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  const a=homePoint(color,1),b=homePoint(color,6);
  ctx.strokeStyle=TEAMS[color].color+'50';ctx.lineWidth=1.02;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
 });
 ctx.strokeStyle='#bcaa824c';ctx.lineWidth=.09;ctx.lineJoin='round';ctx.beginPath();TRACK.forEach(([x,z],i)=>i?ctx.lineTo(x,z):ctx.moveTo(x,z));ctx.closePath();ctx.stroke();
 ROUTE_ARROWS.forEach(({x,z,angle})=>{ctx.save();ctx.translate(x,z);ctx.rotate(angle);ctx.strokeStyle='#887142';ctx.lineWidth=.037;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-.055,-.09);ctx.lineTo(.045,0);ctx.lineTo(-.055,.09);ctx.stroke();ctx.restore();});
 surface=new T.CanvasTexture(c);surface.colorSpace=T.SRGBColorSpace;surface.anisotropy=8;return surface;
}

let contact:T.CanvasTexture|undefined;
export function contactTexture(){
 if(contact)return contact;
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;
 const fill=ctx.createRadialGradient(32,32,4,32,32,32);fill.addColorStop(0,'#40351f66');fill.addColorStop(.5,'#40351f27');fill.addColorStop(1,'#40351f00');ctx.fillStyle=fill;ctx.fillRect(0,0,64,64);
 contact=new T.CanvasTexture(c);contact.colorSpace=T.SRGBColorSpace;return contact;
}

const stables=new Map<number,T.BufferGeometry>();
/** One colored mesh per miniature stable, including its trim and fences. */
export function stableGeometry(color:number){
 if(stables.has(color))return stables.get(color)!;
 const team=TEAMS[color],parts:T.BufferGeometry[]=[];
 const add=(shape:T.BufferGeometry,paint:string,p:[number,number,number],scale:[number,number,number]=[1,1,1],rotation:[number,number,number]=[0,0,0])=>{
  const g=shape.index?shape.toNonIndexed():shape.clone();shape.dispose();
  g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale)));
  const c=new T.Color(paint),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(a,3));parts.push(g);
 };
 for(const side of [-1,1]){
  const x=side*1.4,z=-1.4;
  add(new T.CylinderGeometry(.28,.33,.16,12),'#b68b56',[x,.18,z]);
  add(new T.CylinderGeometry(.24,.27,1.1,12),'#fff0cc',[x,.79,z]);
  add(new T.CylinderGeometry(.29,.29,.12,12),team.color,[x,1.33,z]);
  add(new T.ConeGeometry(.43,.63,12),team.color,[x,1.70,z]);
  add(new T.SphereGeometry(.075,8,6),'#edbc5d',[x,2.05,z]);
  add(new T.BoxGeometry(.10,.26,.025),'#6c795c',[x,.92,z+.252]);
  for(const depth of [-.55,.35,1.25])add(new T.BoxGeometry(.09,.45,.09),'#fff1d0',[side*1.48,.34,depth]);
  for(const y of [.25,.48])add(new T.BoxGeometry(.065,.065,2.7),'#e4cca0',[side*1.48,y,.03]);
 }
 add(new T.BoxGeometry(2.8,.19,.20),team.color,[0,.95,-1.4]);
 add(new T.BoxGeometry(2.3,.035,.22),'#f3cc77',[0,1.065,-1.4]);
 add(new T.SphereGeometry(1,12,8),team.color,[0,1.08,-1.37],[.39,.34,.11]);
 add(new T.TorusGeometry(.17,.025,6,20),'#fff0bf',[0,1.1,-1.235]);
 add(new T.CylinderGeometry(.018,.018,.85,6),'#b38542',[1.4,2.15,-1.4]);
 const flag=new T.Shape();flag.moveTo(0,0);flag.lineTo(.57,-.05);flag.lineTo(.42,-.20);flag.lineTo(.57,-.34);flag.lineTo(0,-.31);flag.closePath();
 add(new T.ShapeGeometry(flag),team.color,[1.42,2.58,-1.4]);
 const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());merged.computeBoundingSphere();stables.set(color,merged);return merged;
}
