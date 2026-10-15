import * as THREE from 'three';
import { CLAYS, type ArtworkDoc, type PaintStroke, type Stamp } from '../model';
import { random } from '../engine/document';
import { arcAt } from '../engine/profile';
import { drawBristleBrush } from './bristleBrush';
const canvas = (size: number) => { const c=document.createElement('canvas'); c.width=c.height=size; return c; };
export function drawStamp(ctx: CanvasRenderingContext2D, stamp: Stamp, x: number, y: number, rx: number, ry: number) {
  ctx.save(); ctx.translate(x,y); ctx.scale(rx,ry); ctx.lineWidth=.13; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath();
  switch(stamp) {
    case 'flower': for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.moveTo(Math.cos(a)*.52+.4,Math.sin(a)*.52);ctx.ellipse(Math.cos(a)*.52,Math.sin(a)*.52,.4,.35,a,0,Math.PI*2);} ctx.fill();break;
    case 'star': for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.43:1;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();break;
    case 'heart': ctx.moveTo(0,.9);ctx.bezierCurveTo(-1.8,-.2,-.7,-1.5,0,-.55);ctx.bezierCurveTo(.7,-1.5,1.8,-.2,0,.9);ctx.fill();break;
    case 'leaf': ctx.moveTo(-.8,.8);ctx.quadraticCurveTo(-1,-1,.9,-.9);ctx.quadraticCurveTo(1,1,-.8,.8);ctx.fill();break;
    case 'sun': ctx.arc(0,0,.48,0,Math.PI*2);ctx.fill();for(let i=0;i<10;i++){const a=i*Math.PI/5;ctx.moveTo(.7*Math.cos(a),.7*Math.sin(a));ctx.lineTo(Math.cos(a),Math.sin(a));}ctx.stroke();break;
    case 'moon': ctx.moveTo(.4,-.9);ctx.bezierCurveTo(-1.5,-1.1,-1.3,1.3,.55,.85);ctx.bezierCurveTo(-.2,.55,-.5,-.35,.4,-.9);ctx.fill();break;
    case 'fish':ctx.ellipse(-.2,0,.7,.45,0,0,Math.PI*2);ctx.moveTo(.35,0);ctx.lineTo(.95,-.5);ctx.lineTo(.95,.5);ctx.closePath();ctx.fill();break;
    case 'dots':for(const [a,b] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){ctx.moveTo(a+.25,b);ctx.arc(a,b,.25,0,Math.PI*2);}ctx.fill();break;
    case 'diamond':ctx.moveTo(0,-1);ctx.lineTo(.7,0);ctx.lineTo(0,1);ctx.lineTo(-.7,0);ctx.closePath();ctx.fill();break;
    case 'wave':ctx.moveTo(-1,0);ctx.bezierCurveTo(-.5,-1,.5,1,1,0);ctx.stroke();break;
    case 'sprout':ctx.moveTo(0,1);ctx.lineTo(0,-.4);ctx.stroke();ctx.moveTo(0,0);ctx.bezierCurveTo(-1.4,0,-1,-1,0,-.25);ctx.bezierCurveTo(1,-1,1.4,0,0,0);ctx.fill();break;
    case 'snow':for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a),Math.sin(a));ctx.moveTo(.7*Math.cos(a)+.25*Math.cos(a+2),.7*Math.sin(a)+.25*Math.sin(a+2));ctx.lineTo(.7*Math.cos(a),.7*Math.sin(a));ctx.lineTo(.7*Math.cos(a)+.25*Math.cos(a-2),.7*Math.sin(a)+.25*Math.sin(a-2));}ctx.stroke();break;
  }
  ctx.restore();
}
export class PaintSurface {
  readonly output: HTMLCanvasElement; readonly texture: THREE.CanvasTexture;
  private base: HTMLCanvasElement; private ink: HTMLCanvasElement; private live: HTMLCanvasElement;
  private inkHeight = -1;
  private strokes: PaintStroke[]=[]; private lengths: number[]=[]; private signature='';
  constructor(readonly size: number) {
    this.output=canvas(size);this.base=canvas(size);this.ink=canvas(size);this.live=canvas(size);
    this.texture=new THREE.CanvasTexture(this.output);this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.wrapS=THREE.RepeatWrapping;this.texture.anisotropy=4;
  }
  update(art: ArtworkDoc) {
    const n=this.size,d=art.decoration, sig=JSON.stringify([art.clay,art.glaze,d.color,d.coverage,art.seed,art.shape]);
    if(sig!==this.signature){
      this.signature=sig;const c=this.base.getContext('2d')!, clay=CLAYS.find(v=>v.id===art.clay)!;
      c.fillStyle=clay.dry;c.fillRect(0,0,n,n);c.fillStyle=d.color;c.fillRect(0,(1-arcAt(art.shape,d.coverage))*n,n,n);
      c.save();c.beginPath();c.rect(0,(1-arcAt(art.shape,d.coverage))*n,n,n);c.clip();
      const rnd=random(art.seed);
      if(art.glaze==='speckle')for(let i=0;i<1800;i++){c.fillStyle=i%3?'#442e2428':'#ffffff55';c.beginPath();c.arc(rnd()*n,rnd()*n,(.4+rnd()*1.2)*n/1024,0,Math.PI*2);c.fill();}
      if(art.glaze==='wash')for(let i=0;i<35;i++){const x=rnd()*n,y=rnd()*n,r=n*(.04+rnd()*.2);for(const offset of [-n,0,n]){const g=c.createRadialGradient(x+offset,y,0,x+offset,y,r);g.addColorStop(0,i%2?'#ffffff35':'#253e3728');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(x+offset-r,y-r,r*2,r*2);}}
      if(art.glaze==='crackle'){
        c.strokeStyle='#49463c35';c.lineWidth=.65*n/1024;const step=n/13,grid=Array.from({length:15},(_,j)=>Array.from({length:15},(_,i)=>[i*step+(rnd()-.5)*step*.7,j*step+(rnd()-.5)*step*.7]));
        for(let j=0;j<14;j++)for(let i=0;i<14;i++){c.beginPath();const p=grid[j][i];c.moveTo(p[0],p[1]);c.lineTo(...grid[j][i+1] as [number,number]);c.moveTo(p[0],p[1]);c.lineTo(...grid[j+1][i] as [number,number]);if(rnd()>.6)c.lineTo(...grid[j][i+1] as [number,number]);c.stroke();}
      }
      c.restore();
    }
    const arcLength=art.shape.radii.slice(1).reduce((total,r,i)=>total+Math.hypot(art.shape.height/(art.shape.radii.length-1),r-art.shape.radii[i]),0);
    const committed=d.strokes.slice(0,-1);
    const reset=arcLength!==this.inkHeight || committed.length<this.strokes.length || this.strokes.some((s,i)=>committed[i]!==s || committed[i]?.points.length!==this.lengths[i]);
    if(reset){this.ink.getContext('2d')!.clearRect(0,0,n,n);this.strokes=[];this.lengths=[];}
    for(let i=this.strokes.length;i<committed.length;i++){this.draw(committed[i],0,arcLength,this.ink.getContext('2d')!);this.lengths[i]=committed[i].points.length;}
    this.strokes=[...committed];this.inkHeight=arcLength;
    // Repaint only the live stroke over cached ink so its tail can taper while
    // moving, without opaque build-up, and erasing still affects earlier marks.
    const live=this.live.getContext('2d')!;live.clearRect(0,0,n,n);live.drawImage(this.ink,0,0);
    const last=d.strokes[d.strokes.length-1];if(last)this.draw(last,0,arcLength,live);
    const out=this.output.getContext('2d')!;out.clearRect(0,0,n,n);out.drawImage(this.base,0,0);out.drawImage(this.live,0,0);this.texture.needsUpdate=true;
  }
  private draw(stroke: PaintStroke, from: number, height: number, c: CanvasRenderingContext2D) {
    const n=this.size;
    if(stroke.kind==='brush'&&stroke.brushStyle==='bristle-v1'){drawBristleBrush(c,stroke,height,n);return;}
    c.save();c.fillStyle=c.strokeStyle=stroke.color;c.globalAlpha=stroke.opacity;c.globalCompositeOperation=stroke.kind==='erase'?'destination-out':'source-over';
    for(let i=from;i<stroke.points.length;i++){
      const p=stroke.points[i],rx=Math.min(n*.2,stroke.size/(2*Math.PI*p.radius)*n),ry=Math.min(n*.3,stroke.size/height*n);
      if(stroke.kind==='band'){
        if(i!==0)continue;
        if(stroke.pattern==='plain'){c.fillRect(0,(1-p.v)*n-ry,n,ry*2);continue;}
        const stamp: Stamp=stroke.pattern==='dots'?'dots':stroke.pattern==='leaves'?'leaf':stroke.pattern==='diamonds'?'diamond':'wave';
        const count=Math.max(2,Math.round(n/Math.max(8,rx*2.8))),step=n/count;
        for(let x=-step;x<n+step;x+=step){
          if(stroke.pattern==='scallops'){c.beginPath();c.ellipse(x,(1-p.v)*n-ry*.5,step*.5,ry,0,0,Math.PI);c.lineWidth=Math.max(1,ry*.18);c.stroke();}
          else drawStamp(c,stamp,x,(1-p.v)*n,rx,ry);
        }continue;
      }
      if(stroke.kind==='stamp'){if(i===0)for(const offset of [-n,0,n])drawStamp(c,stroke.stamp,p.u*n+offset,(1-p.v)*n,rx*2.5,ry*2.5);continue;}
      const prev=i?stroke.points[i-1]:p;let du=p.u-prev.u;if(du>.5)du-=1;if(du<-.5)du+=1;
      const steps=Math.max(1,Math.ceil(Math.hypot(du*n,(p.v-prev.v)*n)/Math.max(1,Math.min(rx,ry)*.45)));
      for(let j=1;j<=steps;j++){const f=j/steps,x=(prev.u+du*f)*n,y=(1-(prev.v+(p.v-prev.v)*f))*n;for(const offset of [-n,0,n]){c.beginPath();c.ellipse(x+offset,y,rx,ry,0,0,Math.PI*2);c.fill();}}
    }
    c.restore();
  }
  dispose(){this.texture.dispose();this.output.width=this.base.width=this.ink.width=this.live.width=1;}
}
export function clayBump() {
  const c=canvas(128),ctx=c.getContext('2d')!,data=ctx.createImageData(128,128),rnd=random(8431);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,v=128+Math.sin(y*.7)*18+(rnd()-.5)*35;data.data.set([v,v,v,255],i);}ctx.putImageData(data,0,0);
  const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,4);return texture;
}
