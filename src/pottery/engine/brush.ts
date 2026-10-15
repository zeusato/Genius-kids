import type { PaintPoint, PaintStroke } from '../model';
import { clamp } from './profile';

export const wrapDelta = (du: number) => du > .5 ? du - 1 : du < -.5 ? du + 1 : du;
export function brushDistance(a: PaintPoint, b: PaintPoint, height: number) {
  return Math.hypot(wrapDelta(b.u-a.u)*Math.PI*(a.radius+b.radius), (b.v-a.v)*height);
}
export function brushPressure(previous: number, speed: number, elapsed: number, pen?: number) {
  const target = pen === undefined ? .28 + .66 / (1 + Math.max(0,speed)*.7) : clamp(pen,.05,1);
  return previous + (target-previous)*(1-Math.exp(-clamp(elapsed,0,.15)*18));
}
export interface BrushSample extends PaintPoint { distance: number; width: number }

// Unwrap first, then round the input corners with quadratic midpoint curves.
// Width is measured along the surface, independent of event frequency and UV seam.
export function brushSamples(stroke: PaintStroke, height: number): BrushSample[] {
  const points: PaintPoint[] = [];
  stroke.points.forEach((p,i)=>points.push({...p,u:i?points[i-1].u+wrapDelta(p.u-stroke.points[i-1].u):p.u}));
  if(!points.length)return [];
  const mix=(a:PaintPoint,b:PaintPoint,t:number):PaintPoint=>({u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t,radius:a.radius+(b.radius-a.radius)*t,pressure:(a.pressure??.65)+((b.pressure??.65)-(a.pressure??.65))*t});
  const distance=(a:PaintPoint,b:PaintPoint)=>Math.hypot((b.u-a.u)*Math.PI*(a.radius+b.radius),(b.v-a.v)*height);
  const total=points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
  const spacing=Math.max(.003,stroke.size*.12,total/8192);
  const result:BrushSample[]=[{...points[0],distance:0,width:0}];
  let start=points[0];
  for(let i=0;i<points.length;i++){
    const control=points[i],end=i===points.length-1?control:mix(control,points[i+1],.5);
    const steps=Math.max(1,Math.ceil((distance(start,control)+distance(control,end))/spacing));
    for(let j=1;j<=steps;j++){
      const t=j/steps,p=mix(mix(start,control,t),mix(control,end,t),t),prev=result[result.length-1];
      const length=distance(prev,p);
      if(length>1e-7)result.push({...p,distance:prev.distance+length,width:0});
    }
    start=end;
  }
  const length=result[result.length-1].distance;
  for(const p of result){
    const taper=Math.min(1,p.distance/(stroke.size*2.8), (length-p.distance)/(stroke.size*3.6));
    const envelope=length<stroke.size*.3?.65:.09+.91*Math.sin(clamp(taper,0,1)*Math.PI/2);
    const grain=1+.035*Math.sin(p.distance*43)+.025*Math.sin(p.distance*91);
    p.width=stroke.size*(.18+.82*(p.pressure??.65))*envelope*grain;
  }
  return result;
}
