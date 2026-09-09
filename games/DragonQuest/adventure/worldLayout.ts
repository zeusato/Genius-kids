import type { MapNode, RegionId } from './model';

export type CameraMode = 'follow' | 'free';
export interface WorldNode extends MapNode { y: number; heading: number }
type Point = [number, number];
const routes: Record<Exclude<RegionId,'crystal'>,Point[]> = {
 forest:[[0,22],[9,17],[9,8],[-8,1],[-9,-10],[8,-18],[0,-26]],
 wind:[[0,23],[-11,17],[-11,5],[7,3],[12,-9],[2,-20],[-8,-24]],
 snow:[[-8,24],[9,16],[-9,7],[9,-2],[-9,-11],[7,-21],[0,-27]],
 castle:[[-10,23],[-10,8],[8,8],[8,-7],[-8,-7],[-8,-22],[4,-22],[4,-31]],
};
function sample(points:Point[], count=600):Point[]{
 return Array.from({length:count+1},(_,i)=>{
  const t=i/count*(points.length-1),j=Math.min(points.length-2,Math.floor(t)),u=t-j;
  const a=points[Math.max(0,j-1)],b=points[j],c=points[j+1],d=points[Math.min(points.length-1,j+2)];
  return [0,1].map(axis=>.5*((2*b[axis])+(-a[axis]+c[axis])*u+(2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*u*u+(-a[axis]+3*b[axis]-3*c[axis]+d[axis])*u*u*u)) as Point;
 });
}
/** Equal distances along five distinct routes. Saved rule coordinates never change. */
export function worldLayout(map:readonly MapNode[],region:RegionId='forest'):WorldNode[]{
 if(!map.length)return [];
 const curve:Point[]=region==='crystal'?Array.from({length:601},(_,i)=>{
  const t=i/600,a=t*Math.PI*2*1.45,r=19-12*t;return [Math.sin(a)*r,Math.cos(a)*r] as Point;
 }):sample(routes[region]);
 const lengths=[0];
 for(let i=1;i<curve.length;i++)lengths.push(lengths[i-1]+Math.hypot(curve[i][0]-curve[i-1][0],curve[i][1]-curve[i-1][1]));
 const total=lengths.at(-1)!,points=map.map((n,i)=>{
  const at=i/Math.max(1,map.length-1)*total;let j=1;while(j<lengths.length-1&&lengths[j]<at)j++;
  const f=(at-lengths[j-1])/(lengths[j]-lengths[j-1]||1);
  return {...n,x:curve[j-1][0]+(curve[j][0]-curve[j-1][0])*f,z:curve[j-1][1]+(curve[j][1]-curve[j-1][1])*f,y:.45+(region==='snow'?i/map.length*4:Math.sin(i/map.length*Math.PI*3)*.3)};
 });
 // Every pair of tile disks needs a visible gap, including the tightest bend.
 let min=Infinity;
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)min=Math.min(min,Math.hypot(points[i].x-points[j].x,points[i].z-points[j].z));
 const scale=Math.max(1,1.65/min);
 return points.map((n,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];return {...n,x:n.x*scale,z:n.z*scale,heading:Math.atan2(b.x-a.x,b.z-a.z)};});
}
export function worldBounds(nodes:readonly WorldNode[]){
 const xs=nodes.map(n=>n.x),zs=nodes.map(n=>n.z);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 return {x:(minX+maxX)/2,z:(minZ+maxZ)/2,width:maxX-minX+9,depth:maxZ-minZ+9};
}
export function cameraDistance(aspect:number,overview:boolean,bounds={width:24,depth:44}){
 if(!overview)return aspect<.85?19:15;
 return Math.max(bounds.depth*1.7,bounds.width*1.8/Math.max(.35,aspect));
}
