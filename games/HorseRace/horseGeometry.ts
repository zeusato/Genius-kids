import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const cache=new Map<string,THREE.BufferGeometry>();
export function horseGeometry(color:string):THREE.BufferGeometry {
  if(cache.has(color))return cache.get(color)!;
  const parts:THREE.BufferGeometry[]=[];
  function part(shape:THREE.BufferGeometry,paint:string,pos:number[],scale:number[],rot=0){
    const g=shape.index?shape.toNonIndexed():shape.clone();shape.dispose();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(rot,0,0)),new THREE.Vector3(...scale)));
    const c=new THREE.Color(paint),data=new Float32Array(g.attributes.position.count*3);for(let i=0;i<data.length;i+=3){data[i]=c.r;data[i+1]=c.g;data[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(data,3));parts.push(g);
  }
  const ball=(paint:string,p:number[],s:number[],r=0)=>part(new THREE.SphereGeometry(1,Math.max(...s)<.15?8:12,Math.max(...s)<.15?6:8),paint,p,s,r);
  const cream='#fff0cf',dark='#34352e',mane='#65432f',gold='#ddb569';
  // A little collectible toy: broad muzzle, rounded ears, saddle and turned base.
  part(new THREE.CylinderGeometry(.44,.46,.07,24),gold,[0,.045,0],[1,1,1]);
  part(new THREE.CylinderGeometry(.41,.44,.075,24),color,[0,.115,0],[1,1,1]);
  part(new THREE.CylinderGeometry(.36,.39,.035,24),cream,[0,.17,0],[1,1,1]);
  ball(color,[0,.65,-.045],[.31,.29,.41]);
  ball(color,[0,.94,.22],[.245,.36,.22],-.32);
  ball(color,[0,1.26,.36],[.28,.27,.30],-.15);
  ball(cream,[0,1.12,.61],[.245,.155,.22]);
  ball(cream,[0,1.32,.623],[.07,.13,.016],-.15);
  for(const x of [-.17,.17]){
    ball(color,[x,1.55,.27],[.088,.215,.083],-.2);
    ball(cream,[x,1.57,.325],[.042,.105,.025],-.2);
    for(const z of [-.29,.23]){ball(color,[x,.39,z],[.105,.22,.115]);ball(dark,[x,.235,z+.035],[.125,.075,.14]);}
    ball('#fffdf3',[x*1.45,1.30,.465],[.039,.09,.089]);
    ball(dark,[x*1.63,1.30,.505],[.024,.059,.049]);
    ball('#ffffff',[x*1.72,1.33,.529],[.012,.019,.019]);
    ball(dark,[x*.76,1.15,.806],[.025,.018,.016]);
    ball(gold,[x*1.82,.69,-.06],[.035,.07,.08]);
  }
  for(let i=0;i<5;i++)ball(mane,[0,1.00+i*.09,.045+i*.032],[.105,.115,.09]);
  ball(mane,[0,1.47,.36],[.15,.08,.15]);
  const tail=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.76,-.37),new THREE.Vector3(.03,.64,-.54),new THREE.Vector3(.04,.39,-.6),new THREE.Vector3(.11,.35,-.61)]);
  part(new THREE.TubeGeometry(tail,8,.073,6,false),mane,[0,0,0],[1,1,1]);
  ball(cream,[0,.884,-.1],[.32,.055,.235]);ball(gold,[0,.924,-.1],[.255,.03,.185]);
  ball(mane,[0,.944,-.1],[.225,.035,.16]);
  const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());merged.computeBoundingSphere();cache.set(color,merged);return merged;
}
