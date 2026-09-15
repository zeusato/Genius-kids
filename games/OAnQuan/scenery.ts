import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Shared, baked courtyard props: one material and one draw call. */
export function courtyardGeometry(){
  const parts:T.BufferGeometry[]=[];
  const add=(g:T.BufferGeometry,color:string,p:number[],s=[1,1,1],r=[0,0,0])=>{g.scale(...s as [number,number,number]);g.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...r as [number,number,number])));g.translate(...p as [number,number,number]);const c=new T.Color(color),values=new Float32Array(g.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(values,3));if(g.index){parts.push(g.toNonIndexed());g.dispose();}else parts.push(g);};
  const box=(p:number[],s:number[],color:string,r=[0,0,0])=>add(new T.BoxGeometry(),color,p,s,r);
  const beam=(a:T.Vector3,b:T.Vector3,r:number,color:string)=>{const d=b.clone().sub(a),g=new T.CylinderGeometry(r*.8,r,d.length(),7);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));add(g,color,a.clone().add(b).multiplyScalar(.5).toArray());};
  const pot=(x:number,z:number,size=1)=>{const profile=[[0,0],[.28,0],[.4,.15],[.44,.45],[.35,.7],[.24,.8],[.27,.85],[.22,.88]].map(([x,y])=>new T.Vector2(x,y));add(new T.LatheGeometry(profile,14),'#996349',[x,-.62,z],[size,size,size]);add(new T.TorusGeometry(.245,.04,6,16),'#be8c60',[x,-.62+.83*size,z],[size,size,size],[Math.PI/2,0,0]);add(new T.CircleGeometry(.22,16),'#454c38',[x,-.62+.80*size,z],[size,size,size],[-Math.PI/2,0,0]);};
  // Brick courses, with alternating joints and subtle handmade variations.
  for(let row=0;row<22;row++)for(let col=0;col<32;col++){const x=(col-15.5)*1.14+(row%2)*.57,z=(row-10.5)*.62;box([x,-.72,z],[1.10,.08,.58],['#b98363','#c6916d','#b78768','#cc9c77'][(row*7+col*3)%4]);}
  // Low steps and an open communal pavilion behind the board.
  box([0,-.56,-7.2],[9,.25,3.9],'#ad9c7d');box([0,-.34,-7.35],[8.4,.21,3.2],'#bdb096');
  for(const x of [-3.6,-1.2,1.2,3.6]){add(new T.CylinderGeometry(.15,.20,2.6,12),'#72523a',[x,1,-6.4]);box([x,-.11,-6.4],[.5,.25,.5],'#d1bea0');}
  box([0,.89,-8.3],[7.3,2.4,.18],'#997657');
  for(const x of [-2.4,0,2.4]){box([x,.65,-8.16],[1.5,1.9,.14],'#634e3a');for(let j=0;j<7;j++)box([x+(j-3)*.19,.75,-8.04],[.075,1.52,.045],'#b2946b');box([x,1.42,-7.99],[1.38,.08,.05],'#c09c6c');}
  box([0,2.15,-6.4],[7.7,.25,.28],'#86613f');
  for(const front of [-1,1]){
    box([0,2.64,-7.25+front*.87],[8.5,.12,2.02],'#986448',[front*.509,0,0]);
    for(let i=0;i<30;i++){const x=(i-14.5)*.28;for(let j=0;j<4;j++){const z=-7.25+front*(j+.5)*.43,y=3.05-j*.24+Math.pow(Math.abs(x)/4.2,6)*.28;add(new T.CylinderGeometry(.11,.115,.51,7),'#9b5f43',[x,y,z],[1,1,1],[front*.99,0,0]);}}
    box([0,2.13,-7.25+front*1.85],[8.6,.16,.15],'#bf8657');
  }
  add(new T.CylinderGeometry(.15,.15,8.7,10),'#b47b51',[0,3.3,-7.25],[1,1,1],[0,0,Math.PI/2]);
  // Warm lanterns beneath the eaves.
  for(const x of [-2.4,2.4]){beam(new T.Vector3(x,2.1,-6),new T.Vector3(x,1.75,-6),.014,'#62523b');add(new T.SphereGeometry(.26,12,8),'#e4b85f',[x,1.5,-6],[.8,1.1,.8]);for(const y of [1.23,1.76])add(new T.CylinderGeometry(.13,.13,.05,12),'#885738',[x,y,-6]);beam(new T.Vector3(x,1.2,-6),new T.Vector3(x,.97,-6),.022,'#b75c3d');}
  // Banyan tree, branches and hanging roots; canopy stays clear of the board.
  for(const side of [-1,1]){
    const x=side*10.6,z=-5.5;
    beam(new T.Vector3(x,-.6,z),new T.Vector3(x-.35*side,3.6,z),.48,'#827252');
    for(let j=0;j<5;j++){const angle=j*1.45,tx=x+Math.cos(angle)*2.1,tz=z+Math.sin(angle)*1.7;
      beam(new T.Vector3(x,1.5,z),new T.Vector3(tx,3.1+j%2*.5,tz),.17,'#827252');
      add(new T.IcosahedronGeometry(1,2),['#7f9463','#8b9d6b','#a1ad75'][j%3],[tx,3.6+j%2*.4,tz],[1.75,1.1,1.55]);
      beam(new T.Vector3(tx,3.1,tz),new T.Vector3(tx+.12,1.4,tz+.08),.019,'#978967');
      beam(new T.Vector3(x,-.4,z),new T.Vector3(x+Math.cos(angle)*1.1,-.65,z+Math.sin(angle)*1.1),.1,'#91815d');
    }
    box([x,-.52,z],[2.8,.25,2.6],'#b6ac8d');
    // Bamboo fence and a few leafy stalks.
    for(let j=0;j<8;j++){const fx=side*(8.7+j*.48),fz=2.8;add(new T.CylinderGeometry(.042,.055,1.7+(j%2)*.12,6),'#9b9f62',[fx,.2,fz]);}
    for(const y of [-.2,.6])box([side*10.4,y,2.8],[3.9,.07,.08],'#a5a06a');
    for(let j=0;j<5;j++){const bx=side*(10.7+j*.18),bz=1.3+j%2*.25,h=2.2+j*.2;add(new T.CylinderGeometry(.044,.058,h,7),'#7c965e',[bx,h/2-.65,bz]);for(let k=0;k<5;k++){add(new T.TorusGeometry(.054,.009,4,7),'#a3ae71',[bx,k*h/5-.5,bz],[1,1,1],[Math.PI/2,0,0]);add(new T.SphereGeometry(1,8,5),'#658b52',[bx+Math.sin(k+j)*.35,k*h/5-.3,bz],[.42,.035,.12],[0,k*.8,.4]);}}
  }
  // Ceramic planters, flowers, a water jar, stool and woven baskets.
  for(const [x,z,size] of [[-8.7,-2,.9],[8.8,-2.8,.75],[-9,3.5,.7],[9,4,.8]]){pot(x,z,size);for(let j=0;j<8;j++){const a=j*2.4,fx=x+Math.cos(a)*.32,fz=z+Math.sin(a)*.32,fy=.3+(j%3)*.13;beam(new T.Vector3(x,-.1,z),new T.Vector3(fx,fy,fz),.014,'#628754');for(let k=0;k<5;k++)add(new T.SphereGeometry(.075,7,5),j%2?'#e9c56a':'#d28b66',[fx+Math.cos(k*1.256)*.07,fy,fz+Math.sin(k*1.256)*.07],[1,.45,1]);}}
  pot(6.8,-5.5,1.35);pot(7.8,-5.7,.7);
  for(const x of [-6.9,6.6]){box([x,-.12,4.7],[1.8,.18,.7],'#9b734c');for(const dx of [-.65,.65])box([x+dx,-.4,4.7],[.14,.5,.55],'#886342');}
  for(const [x,z] of [[-7.3,-5.5],[7.4,4.3]]){add(new T.CylinderGeometry(.55,.38,.45,16),'#bca06b',[x,-.45,z]);for(let j=0;j<6;j++)add(new T.TorusGeometry(.4+j*.025,.017,4,20),'#977b4d',[x,-.66+j*.075,z],[1,1,1],[Math.PI/2,0,0]);}
  // Patches of grass and fallen leaves along the perimeter.
  for(let i=0;i<80;i++){const side=i%2?1:-1,x=side*(8.8+(i%11)*.43),z=-7+(i%17)*.75;add(new T.ConeGeometry(.09,.3,4),'#86945c',[x,-.51,z]);add(new T.SphereGeometry(1,6,4),i%3?'#bba16b':'#8e9c69',[x-.15,-.65,z+.2],[.13,.016,.07],[0,i,0]);}
  const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
}
