import type { PaintStroke } from '../model';
import { brushSamples } from '../engine/brush';

export function drawBristleBrush(ctx: CanvasRenderingContext2D, stroke: PaintStroke, height: number, size: number) {
  const samples=brushSamples(stroke,height);
  if(!samples.length)return;
  const centers=samples.map(p=>({x:p.u*size,y:(1-p.v)*size}));
  const normals=samples.map((p,i)=>{
    const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)];
    const dx=(b.u-a.u)*Math.PI*2*p.radius,dy=-(b.v-a.v)*height,length=Math.hypot(dx,dy)||1;
    return {x:-dy/length*p.width/(Math.PI*2*p.radius)*size,y:dx/length*p.width/height*size};
  });
  ctx.save();ctx.fillStyle=stroke.color;
  if(samples.length===1){
    const p=samples[0];ctx.globalAlpha=stroke.opacity*.8;
    for(const offset of [-size,0,size]){ctx.beginPath();ctx.ellipse(centers[0].x+offset,centers[0].y,p.width/(Math.PI*2*p.radius)*size,p.width/height*size,0,0,Math.PI*2);ctx.fill();}
  }else{
    // Adjacent ribbons are individual bundles of hairs. Fine translucent channels
    // run along the stroke, instead of random dots changing on every replay.
    const hairs=13,step=2/hairs;
    for(let h=-1;h<hairs;h++){
      const left=h<0?-1:-1+h*step,right=h<0?1:left+step*.95;
      ctx.globalAlpha=stroke.opacity*(h<0?.5:.45+.4*Math.sin((h+1)*2.17)**2);
      // Short overlapping-at-one-vertex spans keep repeated wheel revolutions
      // wrapped without copying an arbitrarily long path for every revolution.
      for(let start=0;start<samples.length-1;start+=128){
        const end=Math.min(samples.length-1,start+128);
        let minU=Infinity,maxU=-Infinity;
        for(let i=start;i<=end;i++){minU=Math.min(minU,samples[i].u);maxU=Math.max(maxU,samples[i].u);}
        for(let repeat=Math.ceil(-maxU-1);repeat<=Math.floor(2-minU);repeat++){
          const offset=repeat*size;
          ctx.beginPath();
          for(let i=start;i<=end;i++){
            const t=left+(h<0?0:.006*Math.sin(samples[i].distance*32+h*1.7)),p=centers[i],n=normals[i];
            if(i===start)ctx.moveTo(p.x+n.x*t+offset,p.y+n.y*t);else ctx.lineTo(p.x+n.x*t+offset,p.y+n.y*t);
          }
          for(let i=end;i>=start;i--){const t=right+(h<0?0:.006*Math.sin(samples[i].distance*32+h*1.7)),p=centers[i],n=normals[i];ctx.lineTo(p.x+n.x*t+offset,p.y+n.y*t);}
          ctx.closePath();ctx.fill();
        }
      }
    }
  }
  ctx.restore();
}
