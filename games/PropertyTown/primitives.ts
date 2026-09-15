import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export class Builder {
 parts:T.BufferGeometry[]=[];
 add(g:T.BufferGeometry,color:string,x=0,y=0,z=0,rx=0,ry=0,rz=0){g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);const c=new T.Color(color),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(a,3));const p=g.index?g.toNonIndexed():g;this.parts.push(p);if(p!==g)g.dispose();}
 box(w:number,h:number,d:number,c:string,x=0,y=0,z=0,rx=0,ry=0,rz=0){this.add(new T.BoxGeometry(w,h,d),c,x,y,z,rx,ry,rz);}
 round(w:number,h:number,d:number,c:string,x=0,y=0,z=0,r=.035){this.add(new RoundedBoxGeometry(w,h,d,1,r),c,x,y,z);}
 ball(r:number,c:string,x=0,y=0,z=0,sx=1,sy=1,sz=1){const g=new T.SphereGeometry(r,10,7);g.scale(sx,sy,sz);this.add(g,c,x,y,z);}
 cyl(top:number,bot:number,h:number,c:string,x=0,y=0,z=0,segments=12,rx=0){this.add(new T.CylinderGeometry(top,bot,h,segments),c,x,y,z,rx);}
 ring(r:number,tube:number,c:string,x=0,y=0,z=0,rx=0){this.add(new T.TorusGeometry(r,tube,5,20),c,x,y,z,rx);}
 rod(a:T.Vector3,b:T.Vector3,r:number,c:string){const d=b.clone().sub(a),g=new T.CylinderGeometry(r,r,d.length(),6),mid=a.clone().add(b).multiplyScalar(.5);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));this.add(g,c,mid.x,mid.y,mid.z);}
 finish(){const g=mergeGeometries(this.parts);this.parts.forEach(p=>p.dispose());return g;}
}
export const C={cream:'#fff0cf',wall:'#efd1a1',wood:'#916040',roof:'#b96945',green:'#30796e',dark:'#304c48',glass:'#659b9b',gold:'#d4aa55'};
export function roof(b:Builder,x:number,y:number,z:number,w:number,d:number,color=C.roof){for(const sign of [-1,1])b.box(w,.06,d*.58,color,x,y,z+sign*d*.23,sign*.48);for(let i=0;i<Math.floor(w/.10);i++)for(const sign of [-1,1])b.box(.028,.034,d*.58,i%3===0?'#d79164':color,x-w/2+.05+i*.1,y+.04,z+sign*d*.23,sign*.48);b.add(new T.CylinderGeometry(.045,.045,w,8),'#d99764',x,y+.16,z,0,0,Math.PI/2);}
export function flower(b:Builder,x:number,y:number,z:number,c='#e6ab82',s=1){b.cyl(.012*s,.014*s,.15*s,'#507f53',x,y+.075*s,z,5);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;b.ball(.032*s,c,x+Math.cos(a)*.041*s,y+.17*s,z+Math.sin(a)*.041*s,1,.6,1);}b.ball(.02*s,'#eccc69',x,y+.185*s,z);}
export function pot(b:Builder,x:number,y:number,z:number,s=1,c='#ba8364'){b.cyl(.075*s,.05*s,.12*s,c,x,y+.06*s,z,8);b.ball(.09*s,'#57865a',x,y+.18*s,z,1,1.3,1);}
export function arch(b:Builder,x:number,y:number,z:number,r:number,color:string){b.add(new T.TorusGeometry(r,.025,5,20,Math.PI),color,x,y,z);for(const sign of [-1,1])b.box(.05,y-.12,.05,color,x+sign*r,(y+.12)/2,z);}
export function windowPane(b:Builder,x:number,y:number,z:number,w=.25,h=.3){b.round(w,h,.025,C.glass,x,y,z,.025);b.box(.025,h,.036,C.cream,x,y,z+.017);b.box(w,.024,.036,C.cream,x,y,z+.017);}
export function canopy(b:Builder,x:number,y:number,z:number,w:number,color:string){for(let i=0;i<8;i++){const dx=x-w/2+w/16+i*w/8;b.box(w/8,.04,.34,i%2?C.cream:color,dx,y,z,.13);b.ball(w/16,i%2?C.cream:color,dx,y-.033,z+.17,1,.5,.35);}for(const side of [-1,1])b.cyl(.016,.016,y-.16,C.wood,x+side*(w/2-.03),(y+.16)/2,z+.15,6);}
