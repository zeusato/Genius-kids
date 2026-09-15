import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export const point = (sq: number): [number,number,number] => [(sq % 8)-3.5, .11, 3.5-Math.floor(sq/8)];
const profile = (points: number[][]) => new T.LatheGeometry(points.map(([r,y]) => new T.Vector2(r,y)), 40);
const ball = (r: number,x:number,y:number,z:number) => new T.SphereGeometry(r,20,12).translate(x,y,z);
const box = (x:number,y:number,z:number,px:number,py:number,pz:number) => new T.BoxGeometry(x,y,z).translate(px,py,pz);
function merge(parts: T.BufferGeometry[]) {
  const prepared = parts.map(p => { const g = p.index ? p.toNonIndexed() : p.clone(); g.deleteAttribute('uv'); return g; });
  const result = mergeGeometries(prepared); prepared.forEach(p => p.dispose()); parts.forEach(p => p.dispose()); return result;
}
/** Original Staunton silhouettes, merged per type and instanced per colour. */
export function pieceGeometry(type: number): T.BufferGeometry {
  const tall = type === 1 ? .73 : type === 6 ? 1.46 : type === 5 ? 1.32 : type === 4 ? 1.0 : 1.17;
  const parts: T.BufferGeometry[] = [profile([[0,0],[.30,0],[.345,.025],[.36,.065],[.35,.105],[.32,.14],[.285,.16],[.285,.20],[.30,.215],[.28,.24],[.23,.26],[.20,.29],[.17,.34],[.15,.42],[.125,tall*.49],[.13,tall*.55],[.19,tall*.58],[.205,tall*.60],[.20,tall*.64],[.12,tall*.66],[0,tall*.66]])];
  if (type === 1) parts.push(ball(.17,0,.58,0));
  if (type === 2) {
    const s = new T.Shape();
    s.moveTo(-.22,.53); s.bezierCurveTo(-.31,.74,-.27,1.05,-.10,1.14); s.lineTo(-.07,1.32); s.lineTo(.025,1.20); s.lineTo(.12,1.29); s.lineTo(.14,1.13);
    s.bezierCurveTo(.20,1.08,.23,1.01,.28,.98); s.lineTo(.37,.91); s.quadraticCurveTo(.43,.79,.31,.78); s.lineTo(.16,.80); s.lineTo(.08,.86);
    s.quadraticCurveTo(.00,.76,.13,.62); s.lineTo(.22,.53); s.closePath();
    parts.push(new T.ExtrudeGeometry(s,{ depth:.19, bevelEnabled:true, bevelSegments:3, steps:1, bevelSize:.035, bevelThickness:.04, curveSegments:12 }).translate(0,0,-.095));
    for(let i=0;i<6;i++) parts.push(box(.055,.055,.25,-.22+i*.013,.69+i*.063,0));
    parts.push(ball(.025,.14,1.035,.142),ball(.025,.14,1.035,-.142));
  }
  if (type === 3) {
    const head = (left:boolean) => { const s = new T.Shape();
      if(left) { s.moveTo(-.01,.80); s.bezierCurveTo(-.31,.87,-.19,1.08,0,1.20); s.lineTo(.025,1.11); s.lineTo(-.09,.94); s.lineTo(.065,.82); }
      else { s.moveTo(.11,.83); s.bezierCurveTo(.26,.89,.18,1.08,.055,1.16); s.lineTo(-.025,.945); }
      s.closePath(); return new T.ExtrudeGeometry(s,{depth:.13,bevelEnabled:true,bevelSize:.045,bevelThickness:.065,bevelSegments:3,curveSegments:14}).translate(0,0,-.065); };
    parts.push(head(true),head(false),ball(.055,0,1.23,0));
  }
  if(type === 4) {
    parts.push(profile([[0,.65],[.20,.65],[.23,.70],[.24,.87],[.28,.9],[.28,.97],[.21,.97],[.21,.87],[0,.87]]));
    for(let i=0;i<6;i++) { const a=i*Math.PI/3; const g=new T.BoxGeometry(.13,.16,.13); g.rotateY(-a); g.translate(Math.sin(a)*.23,1.01,Math.cos(a)*.23); parts.push(g); }
  }
  if(type === 5) {
    parts.push(profile([[0,.86],[.15,.86],[.19,.92],[.245,1.10],[.21,1.13],[.14,.98],[0,.98]]));
    for(let i=0;i<8;i++) { const a=i*Math.PI/4; parts.push(ball(.055,Math.sin(a)*.23,1.15,Math.cos(a)*.23)); }
    parts.push(ball(.08,0,1.16,0),ball(.045,0,1.265,0));
  }
  if(type === 6) {
    parts.push(profile([[0,.95],[.15,.95],[.21,1.01],[.22,1.06],[.18,1.10],[.13,1.12],[0,1.12]]),ball(.09,0,1.145,0));
    const s = new T.Shape(); s.moveTo(-.045,1.17); s.lineTo(.045,1.17); s.lineTo(.045,1.29); s.lineTo(.15,1.29); s.lineTo(.15,1.375); s.lineTo(.045,1.375); s.lineTo(.045,1.48); s.lineTo(-.045,1.48); s.lineTo(-.045,1.375); s.lineTo(-.15,1.375); s.lineTo(-.15,1.29); s.lineTo(-.045,1.29); s.closePath();
    parts.push(new T.ExtrudeGeometry(s,{depth:.065,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2}).translate(0,0,-.0325));
  }
  const geometry=merge(parts),positions=geometry.getAttribute('position'),colors=new Float32Array(positions.count*3);
  for(let i=0;i<positions.count;i++){const y=positions.getY(i),shade=y<.023?.4:y>.14&&y<.165?.72:y>.21&&y<.245?.82:1;colors.set([shade,shade,shade],i*3);}
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));return geometry;
}
export function slab(width:number,depth:number,height:number,bevel=.055) {
  const s=new T.Shape(); s.moveTo(-width/2,-depth/2); s.lineTo(width/2,-depth/2); s.lineTo(width/2,depth/2); s.lineTo(-width/2,depth/2); s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,steps:1}); g.rotateX(-Math.PI/2); return g;
}
function random(seed:number) { let n=seed; return () => { n=(Math.imul(n,1664525)+1013904223)|0; return (n>>>0)/4294967296; }; }
export function woodTexture(board=false): T.CanvasTexture {
  const c=document.createElement('canvas'); c.width=c.height=1536; const ctx=c.getContext('2d')!, rand=random(812); const size=1536;
  ctx.fillStyle=board?'#69452e':'#d5bf9b'; ctx.fillRect(0,0,size,size);
  const inset=board?size/2-size*4/8.8:0, cell=size/8.8;
  if(board) for(let r=0;r<8;r++) for(let f=0;f<8;f++) { ctx.fillStyle=(r+f)%2?'#99714d':'#e6d2a5'; ctx.fillRect(inset+f*cell,inset+r*cell,cell+.5,cell+.5); }
  for(let i=0;i<3500;i++) { const y=rand()*size; ctx.strokeStyle=rand()>.5?'rgba(65,37,15,.035)':'rgba(255,245,200,.06)'; ctx.lineWidth=rand()*2+.5; ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=size;x+=64)ctx.lineTo(x,y+Math.sin(x/170+i)*rand()*3);ctx.stroke(); }
  if(board) {
    ctx.strokeStyle='#cfad6c';ctx.lineWidth=3;ctx.strokeRect(inset-8,inset-8,cell*8+16,cell*8+16);
    ctx.font='500 25px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e9d4a7';
    for(let i=0;i<8;i++) { ctx.fillText('abcdefgh'[i],inset+(i+.5)*cell,size-30);ctx.fillText(String(8-i),29,inset+(i+.5)*cell);
      ctx.save();ctx.translate(inset+(i+.5)*cell,30);ctx.rotate(Math.PI);ctx.fillText('abcdefgh'[i],0,0);ctx.restore();ctx.save();ctx.translate(size-29,inset+(i+.5)*cell);ctx.rotate(Math.PI);ctx.fillText(String(8-i),0,0);ctx.restore(); }
  }
  if(!board){ctx.fillStyle='#d3c5ab';ctx.fillRect(0,0,size,size);for(let i=0;i<12000;i++){ctx.fillStyle=rand()>.5?'rgba(90,71,42,.025)':'rgba(255,250,232,.04)';ctx.fillRect(rand()*size,rand()*size,1,rand()*4+1);}}
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;if(!board){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(16,16);}return texture;
}

/** Quiet room details sit outside the board and leave the mobile camera uncluttered. */
export function roomGeometry():T.BufferGeometry {
  const parts:T.BufferGeometry[]=[];
  const add=(g:T.BufferGeometry,color:string)=>{const c=new T.Color(color),a=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<a.length;i+=3)a.set([c.r,c.g,c.b],i);g.setAttribute('color',new T.BufferAttribute(a,3));parts.push(g);};
  for(const [x,y,z,w,d,angle,color] of [[6.5,-.24,2.1,1.8,2.5,-.15,'#485e4b'],[6.5,-.02,2.1,1.65,2.3,.08,'#aa7950']] as const){
    const pages=new T.BoxGeometry(w-.08,.17,d-.08).rotateY(angle).translate(x,y,z);add(pages,'#d8cbb0');
    for(const dy of [-.105,.105])add(new T.BoxGeometry(w,.035,d).rotateY(angle).translate(x,y+dy,z),color);
  }
  add(new T.BoxGeometry(.13,.015,1.05).rotateY(.08).translate(6.8,.104,3.02),'#ab9862');
  const vase=profile([[0,0],[.30,0],[.44,.09],[.50,.4],[.44,.72],[.27,.94],[.26,1.02],[.22,1.02],[.21,.90],[.20,.5],[0,.45]]).translate(-6.3,-.35,-1.6);add(vase,'#7b8260');
  const leaf=(x:number,y:number,z:number,angle:number)=>new T.SphereGeometry(.2,10,6).scale(.55,1.9,.18).rotateZ(angle).rotateY(.5).translate(x,y,z);
  for(let i=0;i<3;i++){
    add(new T.CylinderGeometry(.017,.02,1.9,6).rotateZ((i-1)*.16).translate(-6.3+(i-1)*.15,1.18,-1.6+i*.08),'#697448');
    for(let j=0;j<5;j++)add(leaf(-6.3+(i-1)*.25+(j%2?.16:-.16),.83+j*.26,-1.6+i*.09,(j%2?1:-1)*.8),'#718257');
  }
  return merge(parts);
}
