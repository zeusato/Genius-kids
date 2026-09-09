// Authored procedural toy characters. The exported GLBs contain articulated joints
// and real animation clips; no downloaded models or textures are required.
import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(v=>{this.result=`data:${blob.type};base64,${Buffer.from(v).toString('base64')}`;this.onloadend?.();});}};
const folder=path.resolve('public/dragon');fs.mkdirSync(folder,{recursive:true});
const materials=new Map();
function material(name,color,roughness=.72){if(!materials.has(name)){const m=new T.MeshStandardMaterial({color,roughness,metalness:name==='gold'?.25:0});m.name=name;materials.set(name,m);}return materials.get(name);}
const M={green:material('scales','#579c82'),light:material('belly','#e9d7a0'),gold:material('gold','#ddb56b'),cream:material('ivory','#fff2cb'),eye:material('eye','#20323b',.25),white:material('eyeWhite','#fffdf0',.3),cheek:material('cheek','#dc9d91'),wing:material('wing','#dfb377'),teal:material('cloak','#397c7d'),skin:material('skin','#efc69f'),hair:material('hair','#594839'),boot:material('boot','#544d48'),cloth:material('cloth','#e9d7ba'),leaf:material('leaf','#7bae83'),violet:material('violet','#9b8bbb'),red:material('red','#c7856b')};
const ball=new T.SphereGeometry(1,12,8),cone=new T.ConeGeometry(1,1,10),cyl=new T.CylinderGeometry(1,1,1,12),box=new T.BoxGeometry(1,1,1),gem=new T.IcosahedronGeometry(1,0);
function mesh(g,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){const m=new T.Mesh(g,mat);m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);return m;}
function add(root,g,mat,pos,scale,rot){root.add(mesh(g,mat,pos,scale,rot));}
function joint(root,name,pos=[0,0,0]){const g=new T.Group();g.name=name;g.position.set(...pos);root.add(g);return g;}
function pill(root,mat,a,b,r){const start=new T.Vector3(...a),end=new T.Vector3(...b),length=start.distanceTo(end),m=mesh(cyl,mat,start.clone().add(end).multiplyScalar(.5).toArray(),[r,length,r]);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize());root.add(m);add(root,ball,mat,a,[r,r,r]);add(root,ball,mat,b,[r,r,r]);}
const surface=material('surface','#ffffff');surface.vertexColors=true;
function optimize(root){
 for(const child of [...root.children])if(child.isGroup)optimize(child);
 const buckets=new Map();
 for(const child of [...root.children])if(child.isMesh){
  child.updateMatrix();let g=child.geometry.clone().applyMatrix4(child.matrix);if(g.index)g=g.toNonIndexed();g.deleteAttribute('uv');
  // Keep tintable surfaces separate; bake all other materials into vertex colors.
  const tintable=['scales','cloak'].includes(child.material.name),mat=tintable?child.material:surface;
  if(!tintable){const count=g.attributes.position.count,c=child.material.color,colors=new Uint8Array(count*3);for(let i=0;i<count;i++){colors[i*3]=Math.round(c.r*255);colors[i*3+1]=Math.round(c.g*255);colors[i*3+2]=Math.round(c.b*255);}g.setAttribute('color',new T.BufferAttribute(colors,3,true));}
  const a=buckets.get(mat)||[];a.push(g);buckets.set(mat,a);root.remove(child);
 }
 for(const [m,geos]of buckets){const merged=new T.Mesh(mergeGeometries(geos),m);merged.name=`${root.name}_${m.name}`;root.add(merged);}
}
function track(name,axis,values,times=[0,.5,1]){const qs=values.flatMap(v=>{const e=new T.Euler();e[axis]=v;return new T.Quaternion().setFromEuler(e).toArray();});return new T.QuaternionKeyframeTrack(`${name}.quaternion`,times,qs);}
function clips(root,type){const head=`${type}_head`,la=`${type}_armL`,ra=`${type}_armR`,ll=`${type}_legL`,rl=`${type}_legR`,body=`${type}_body`,wingL=`${type}_wingL`,wingR=`${type}_wingR`;
 const has=n=>!!root.getObjectByName(n),make=(name,duration,tracks)=>new T.AnimationClip(name,duration,tracks.filter(t=>has(t.name.split('.')[0])));
 const flap=[track(wingL,'z',[-.15,.25,-.15]),track(wingR,'z',[.15,-.25,.15])];
 return [make('idle',2,[track(head,'y',[-.07,.07,-.07],[0,1,2]),...flap.map(t=>{t.times=new Float32Array([0,1,2]);return t;})]),
 make('walk',.65,[track(ll,'x',[-.45,.45,-.45],[0,.325,.65]),track(rl,'x',[.45,-.45,.45],[0,.325,.65]),track(la,'x',[.3,-.3,.3],[0,.325,.65]),track(ra,'x',[-.3,.3,-.3],[0,.325,.65])]),
 make('cast',1,[track(ra,'x',[0,-1.25,0]),track(la,'z',[0,.4,0]),track(head,'x',[0,-.12,0]),track(wingL,'z',[0,.6,0]),track(wingR,'z',[0,-.6,0])]),
 make('guard',1,[track(la,'x',[0,-1.1,0]),track(ra,'x',[0,-.9,0]),track(head,'x',[0,.2,0])]),
 make('hit',.7,[track(body,'z',[0,-.15,.12,0],[0,.2,.4,.7]),track(head,'x',[0,-.25,0],[0,.3,.7])]),
 make('celebrate',1.5,[track(la,'z',[0,1.4,1.1,1.4,0],[0,.3,.6,1,1.5]),track(ra,'z',[0,-1.4,-1.1,-1.4,0],[0,.3,.6,1,1.5]),track(head,'z',[0,-.12,.12,-.12,0],[0,.3,.6,1,1.5]),track(wingL,'z',[0,.6,0],[0,.75,1.5]),track(wingR,'z',[0,-.6,0],[0,.75,1.5])])];
}
function dragon(){const root=new T.Group();root.name='dragon';const body=joint(root,'dragon_body');
 add(body,ball,M.green,[0,.81,0],[.57,.68,.46]);add(body,ball,M.light,[0,.74,.36],[.39,.48,.16]);
 for(let i=0;i<4;i++)add(body,ball,M.cream,[0,.55+i*.14,.488],[.28-i*.02,.016,.01]);
 const head=joint(body,'dragon_head',[0,1.45,.15]);add(head,ball,M.green,[0,.12,0],[.62,.47,.49]);add(head,ball,M.green,[0,-.08,.4],[.46,.24,.33]);add(head,ball,M.light,[0,-.21,.41],[.37,.09,.23]);
 for(const sign of [-1,1]){add(head,ball,M.white,[sign*.29,.22,.391],[.16,.2,.08]);add(head,ball,M.eye,[sign*.29,.21,.463],[.074,.12,.04]);add(head,ball,M.white,[sign*.31,.255,.493],[.024,.035,.018]);add(head,ball,M.cheek,[sign*.4,-.035,.454],[.10,.05,.025]);add(head,ball,M.eye,[sign*.16,-.02,.684],[.031,.022,.02]);
  add(head,cone,M.gold,[sign*.36,.62,-.13],[.14,.48,.13],[0,0,sign*-.22]);add(head,cone,M.green,[sign*.6,.23,-.19],[.17,.36,.13],[0,0,sign*-.7]);
  const arm=joint(body,sign<0?'dragon_armL':'dragon_armR',[sign*.47,1.02,.07]);add(arm,ball,M.green,[sign*.035,-.2,.05],[.18,.3,.19]);add(arm,ball,M.light,[sign*.035,-.4,.14],[.13,.09,.14]);
  const leg=joint(body,sign<0?'dragon_legL':'dragon_legR',[sign*.32,.37,.06]);add(leg,ball,M.green,[0,-.12,.1],[.23,.23,.29]);for(let j=-1;j<=1;j++)add(leg,cone,M.cream,[j*.087,-.24,.34],[.05,.13,.05],[Math.PI/2,0,0]);
  const wing=joint(body,sign<0?'dragon_wingL':'dragon_wingR',[sign*.46,1.12,-.21]);
  const shape=new T.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(sign*.55,.8,sign*1.18,.83);shape.lineTo(sign*.98,.25);shape.quadraticCurveTo(sign*.62,.48,sign*.63,-.12);shape.quadraticCurveTo(sign*.29,.18,sign*.10,-.22);shape.closePath();
  add(wing,new T.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:false,curveSegments:8}),M.wing,[0,0,0],[1,1,1]);
  pill(wing,M.green,[0,0,.055],[sign*1.18,.83,.055],.047);pill(wing,M.green,[0,0,.055],[sign*.98,.25,.055],.035);pill(wing,M.green,[0,0,.055],[sign*.63,-.12,.055],.026);
 }
 const tail=joint(body,'dragon_tail',[0,.56,-.38]);for(let i=0;i<6;i++){add(tail,ball,M.green,[Math.sin(i*.3)*.34,-i*.035,-i*.2],[.24-i*.034,.24-i*.031,.27-i*.027]);if(i%2===0)add(tail,cone,M.gold,[Math.sin(i*.3)*.34,.22-i*.04,-i*.2],[.095,.20,.095]);}
 return root;
}
function hero(type='hero'){const root=new T.Group();root.name=type;const body=joint(root,`${type}_body`);const fairy=type==='fairy',goblin=type==='goblin',skin=goblin?M.leaf:M.skin;
 add(body,cone,fairy?M.violet:goblin?M.red:M.teal,[0,.64,0],[.37,.73,.31]);add(body,ball,M.cloth,[0,.8,.17],[.18,.26,.1]);
 for(const sign of [-1,1]){const leg=joint(body,`${type}_leg${sign<0?'L':'R'}`,[sign*.14,.35,0]);add(leg,ball,M.boot,[0,-.17,.06],[.13,.20,.20]);
  const arm=joint(body,`${type}_arm${sign<0?'L':'R'}`,[sign*.31,.87,0]);add(arm,ball,fairy?M.violet:goblin?M.red:M.teal,[sign*.025,-.15,0],[.12,.24,.13]);add(arm,ball,skin,[sign*.035,-.36,.02],[.10,.11,.10]);
  if(sign===1){pill(arm,M.hair,[.08,-.54,.06],[.08,.26,.06],.03);add(arm,gem,M.gold,[.08,.34,.06],[.10,.13,.10]);}
 }
 const head=joint(body,`${type}_head`,[0,1.24,0]);add(head,ball,skin,[0,0,0],[.35,.34,.31]);add(head,ball,M.hair,[0,.15,-.07],[.36,.25,.3]);add(head,ball,skin,[0,-.02,.12],[.29,.27,.22]);
 for(const sign of [-1,1]){add(head,ball,M.eye,[sign*.12,.025,.316],[.04,.065,.025]);add(head,ball,M.white,[sign*.13,.04,.336],[.011,.018,.009]);add(head,ball,M.cheek,[sign*.2,-.07,.28],[.055,.028,.013]);if(goblin)add(head,cone,M.leaf,[sign*.42,.05,0],[.12,.34,.12],[0,0,sign*-.85]);}
 add(head,ball,skin,[0,-.055,.34],[.06,.05,.04]);add(head,ball,M.hair,[0,-.13,.317],[.055,.012,.01]);
 if(!goblin){add(head,cone,fairy?M.violet:M.teal,[0,.5,-.04],[.4,.67,.35],[0,0,-.15]);add(head,cyl,fairy?M.violet:M.teal,[0,.24,0],[.43,.08,.37]);add(head,gem,M.gold,[.02,.28,.36],[.07,.085,.027]);}
 else{add(head,cone,M.cream,[-.2,.39,-.04],[.09,.25,.09],[0,0,.2]);add(head,cone,M.cream,[.2,.39,-.04],[.09,.25,.09],[0,0,-.2]);}
 if(fairy)for(const sign of [-1,1]){const wing=joint(body,`${type}_wing${sign<0?'L':'R'}`,[sign*.16,.85,-.14]);add(wing,ball,M.cream,[sign*.28,.2,-.12],[.26,.42,.04],[0,0,sign*-.5]);add(wing,ball,M.gold,[sign*.22,-.14,-.12],[.19,.24,.035],[0,0,sign*.5]);}
 return root;
}

function knight(){
 const root=new T.Group();root.name='knight';const body=joint(root,'knight_body');
 const chestnut=material('horseChestnut','#945732'),muzzle=material('horseMuzzle','#d8b481'),mane=material('horseMane','#3d3028'),silver=material('knightSilver','#a8c5d0'),armor=material('knightArmor','#658a99');
 add(body,ball,chestnut,[0,.94,-.08],[.34,.39,.7]);
 add(body,ball,chestnut,[0,1.22,.49],[.24,.46,.27],[.35,0,0]);
 const horseHead=joint(body,'horse_head',[0,1.63,.69]);
 add(horseHead,ball,chestnut,[0,0,.1],[.245,.3,.34]);
 add(horseHead,ball,muzzle,[0,-.12,.36],[.24,.19,.23]);
 for(const side of [-1,1]){
  add(horseHead,cone,chestnut,[side*.14,.34,-.06],[.095,.33,.11],[.1,0,side*-.15]);
  add(horseHead,ball,M.white,[side*.205,.05,.22],[.04,.08,.08]);
  add(horseHead,ball,M.eye,[side*.228,.04,.245],[.022,.05,.045]);
  add(horseHead,ball,M.eye,[side*.12,-.1,.56],[.025,.018,.015]);
  pill(horseHead,M.boot,[side*.24,.1,.05],[side*.24,-.12,.36],.02);
  for(const front of [true,false]){
   const leg=joint(body,`horse_${front?'front':'rear'}${side<0?'L':'R'}`,[side*.245,.84,front?.43:-.55]);
   pill(leg,chestnut,[0,0,0],[0,-.51,front?.02:-.04],.072);
   add(leg,ball,muzzle,[0,-.52,front?.02:-.04],[.078,.105,.085]);
   add(leg,box,M.boot,[0,-.67,front?.075:0],[.17,.16,.22]);
  }
 }
 for(let i=0;i<6;i++)add(body,ball,mane,[0,1.16+i*.105,.27+i*.07],[.095,.16,.115]);
 add(horseHead,ball,mane,[0,.21,.14],[.14,.105,.16]);
 const tail=joint(body,'horse_tail',[0,1.08,-.76]);
 pill(tail,mane,[0,0,0],[.05,-.34,-.25],.09);add(tail,ball,mane,[.07,-.43,-.28],[.12,.24,.13],[.3,0,-.1]);
 add(body,box,M.teal,[0,1.18,-.14],[.75,.13,.66]);add(body,ball,M.boot,[0,1.29,-.12],[.34,.13,.34]);
 // The young rider sits on the saddle; no wizard hat or beard.
 add(body,ball,armor,[0,1.63,-.13],[.26,.32,.2]);add(body,ball,silver,[0,1.67,.03],[.23,.23,.07]);
 add(body,cyl,M.gold,[0,1.4,-.12],[.27,.075,.2]);
 add(body,cone,M.teal,[0,1.59,-.36],[.34,.72,.1],[.22,0,0]);
 for(const side of [-1,1]){
  pill(body,armor,[side*.21,1.43,-.12],[side*.41,1.13,.08],.1);
  pill(body,M.boot,[side*.41,1.13,.08],[side*.4,.93,.23],.095);
  add(body,ball,M.boot,[side*.4,.91,.29],[.12,.1,.17]);
  const arm=joint(body,side<0?'knight_armL':'knight_armR',[side*.26,1.81,-.1]);
  add(arm,ball,silver,[side*.03,-.02,0],[.14,.15,.15]);
  pill(arm,armor,[side*.06,-.08,.02],[side*.09,-.27,.28],.075);
  add(arm,ball,M.skin,[side*.09,-.29,.31],[.075,.075,.075]);
  pill(body,M.boot,[side*.35,1.52,.21],[side*.23,1.52,.97],.013);
 }
 const head=joint(body,'knight_head',[0,2.1,-.08]);
 add(head,ball,M.skin,[0,0,.02],[.25,.26,.24]);
 add(head,new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI*.53),silver,[0,.055,0],[.27,.29,.255]);
 add(head,ball,M.skin,[0,-.045,.24],[.045,.045,.04]);
 for(const side of [-1,1]){
  add(head,ball,M.eye,[side*.093,-.006,.242],[.028,.044,.018]);
  add(head,ball,M.white,[side*.099,.005,.256],[.009,.012,.006]);
  add(head,ball,M.cheek,[side*.15,-.085,.21],[.035,.018,.009]);
  add(head,box,silver,[side*.225,-.075,-.025],[.07,.22,.17]);
 }
 add(head,ball,M.hair,[0,-.12,.23],[.045,.008,.01]);
 add(head,ball,M.teal,[0,.39,-.08],[.07,.17,.24],[.45,0,0]);add(head,gem,M.gold,[0,.17,.25],[.055,.075,.018]);
 const sword=joint(body,'knight_sword',[-.37,1.38,-.26]);add(sword,box,M.boot,[0,-.21,0],[.09,.58,.075],[0,0,-.22]);add(sword,box,M.gold,[0,.11,0],[.25,.045,.09]);add(sword,cyl,M.boot,[0,.21,0],[.04,.18,.04]);add(sword,ball,M.gold,[0,.31,0],[.055,.05,.055]);
 return root;
}
function knightClips(root){
 const result=clips(root,'knight');
 result[0].tracks.push(track('horse_head','x',[-.04,.04,-.04],[0,1,2]),track('horse_tail','z',[-.15,.15,-.15],[0,1,2]));
 result[1]=new T.AnimationClip('walk',.56,[
  track('horse_frontL','x',[-.45,.45,-.45],[0,.28,.56]),track('horse_rearR','x',[-.45,.45,-.45],[0,.28,.56]),
  track('horse_frontR','x',[.45,-.45,.45],[0,.28,.56]),track('horse_rearL','x',[.45,-.45,.45],[0,.28,.56]),
  track('horse_head','x',[-.05,.07,-.05],[0,.28,.56]),
  new T.VectorKeyframeTrack('knight_body.position',[0,.14,.28,.42,.56],[0,0,0,0,.055,0,0,0,0,0,.055,0,0,0,0]),
 ]);
 return result;
}

const exporter=new GLTFExporter();const onlyKnight=process.argv.includes('--knight');const report=onlyKnight&&fs.existsSync(path.join(folder,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8')).models.filter(m=>m.name!=='knight'):[];
for(const root of (onlyKnight?[knight()]:[dragon(),hero(),hero('fairy'),hero('goblin'),knight()])){const animations=root.name==='knight'?knightClips(root):clips(root,root.name);optimize(root);const data=await exporter.parseAsync(root,{binary:true,animations});fs.writeFileSync(path.join(folder,`${root.name}.glb`),Buffer.from(data));let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=o.geometry.attributes.position.count/3;}});report.push({name:root.name,bytes:data.byteLength,meshes,triangles,clips:animations.map(c=>c.name)});}
fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify({version:1,author:'Genius Kids procedural character workshop',models:report},null,2));console.log(JSON.stringify(report,null,2));

