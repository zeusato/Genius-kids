import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const figures=new Map<string,T.BufferGeometry>();
export function figureGeometry(quan=false,variant=0){
  const key=`${quan}:${variant}`;if(figures.has(key))return figures.get(key)!;
  const parts:T.BufferGeometry[]=[];
  function part(g:T.BufferGeometry,color:string,x=0,y=0,z=0,sx=1,sy=1,sz=1){g.scale(sx,sy,sz);g.translate(x,y,z);const c=new T.Color(color),colors=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(g.toNonIndexed());g.dispose();}
  const robe=quan?'#b75335':['#3e8f88','#e4bf76','#c77958'][variant%3],skin='#f2c39a',dark='#343b34';
  part(new T.CylinderGeometry(.25,.28,.09,12),'#876744',0,.045);
  part(new T.CylinderGeometry(.15,.26,.43,10),robe,0,.30);
  part(new T.SphereGeometry(.205,12,8),skin,0,.65,0,1,1.06,.94);
  part(new T.SphereGeometry(.18,10,6),dark,0,.73,-.035,1,.5,1);
  for(const side of [-1,1]){
    part(new T.SphereGeometry(.032,6,4),'#343c37',side*.073,.66,.175,1,1.25,.6);
    part(new T.SphereGeometry(.044,6,4),'#dc8b71',side*.14,.595,.13,1,.55,.35);
    part(new T.SphereGeometry(.07,8,5),skin,side*.23,.40,.10,1,1.15,1);
    part(new T.CylinderGeometry(.064,.08,.23,8),robe,side*.205,.38,.02);
    part(new T.SphereGeometry(.095,6,4),dark,side*.12,.12,.08,1,.55,1.3);
  }
  part(new T.SphereGeometry(.035,6,4),skin,0,.619,.192,.8,.8,.7);
  part(new T.BoxGeometry(.075,.015,.014),'#975741',0,.565,.185);
  part(new T.BoxGeometry(.035,.29,.022),'#edcd85',0,.31,.193);
  if(quan){
    part(new T.CylinderGeometry(.21,.23,.18,16),dark,0,.86);
    part(new T.BoxGeometry(.64,.055,.13),dark,0,.86,-.02);
    part(new T.SphereGeometry(.042,10,6),'#e3bf68',0,.87,.215);
    part(new T.BoxGeometry(.27,.12,.04),'#e6c47e',0,.4,.245);
  }else{
    part(new T.TorusGeometry(.181,.032,4,12),robe,0,.735,0,1,.55,1);
  }
  const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());merged.computeVertexNormals();figures.set(key,merged);return merged;
}
export function tableGeometry(){
  const shape=new T.Shape();shape.moveTo(-5.3,-2.75);shape.lineTo(5.3,-2.75);shape.absarc(5.3,0,2.75,-Math.PI/2,Math.PI/2,false);shape.lineTo(-5.3,2.75);shape.absarc(-5.3,0,2.75,Math.PI/2,Math.PI*1.5,false);
  for(let row=0;row<2;row++)for(let col=0;col<5;col++){
    const x=(col-2)*2.05,z=row?1.15:-1.15,w=.91,h=.99,r=.15,p=new T.Path();
    p.moveTo(x-w+r,z-h);p.lineTo(x+w-r,z-h);p.quadraticCurveTo(x+w,z-h,x+w,z-h+r);p.lineTo(x+w,z+h-r);p.quadraticCurveTo(x+w,z+h,x+w-r,z+h);p.lineTo(x-w+r,z+h);p.quadraticCurveTo(x-w,z+h,x-w,z+h-r);p.lineTo(x-w,z-h+r);p.quadraticCurveTo(x-w,z-h,x-w+r,z-h);shape.holes.push(p);
  }
  for(const sign of [-1,1]){const p=new T.Path();p.moveTo(sign*5.3,-2.15);p.absarc(sign*5.3,0,2.15,-Math.PI/2,Math.PI/2,sign<0);p.lineTo(sign*5.3,-2.15);shape.holes.push(p);}
  const g=new T.ExtrudeGeometry(shape,{depth:.30,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.07,bevelThickness:.06,curveSegments:24});g.rotateX(-Math.PI/2);return g;
}
export function baseGeometry(){
  const shape=new T.Shape();shape.moveTo(-5.3,-2.74);shape.lineTo(5.3,-2.74);shape.absarc(5.3,0,2.74,-Math.PI/2,Math.PI/2,false);shape.lineTo(-5.3,2.74);shape.absarc(-5.3,0,2.74,Math.PI/2,Math.PI*1.5,false);
  const g=new T.ExtrudeGeometry(shape,{depth:.52,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.055,bevelThickness:.055,curveSegments:24});g.rotateX(-Math.PI/2);return g;
}
let grain:T.CanvasTexture|undefined;
export function woodTexture(){
  if(grain)return grain;const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d')!;
  ctx.fillStyle='#ead4a5';ctx.fillRect(0,0,512,256);
  for(let i=0;i<100;i++){ctx.strokeStyle=`rgba(130,83,38,${.025+(i%7)*.006})`;ctx.lineWidth=.4+i%3*.4;ctx.beginPath();for(let x=0;x<=512;x+=8){const y=i*2.6+Math.sin(x*.016+i*.45)*2+Math.sin(x*.04+i)*.8;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  grain=new T.CanvasTexture(c);grain.colorSpace=T.SRGBColorSpace;grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(2,1);return grain;
}
