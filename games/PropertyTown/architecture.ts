import * as T from 'three';
import {Builder,C,roof,arch,pot} from './primitives';

function glassWing(b:Builder,x:number,z:number,w:number,d:number,h:number,color=C.green){
 b.round(w,.08,d,C.cream,x,.19,z);
 b.box(w-.04,h-.08,d-.04,'#94bdb9',x,.23+h/2,z);
 for(const dx of [-w/2,0,w/2])for(const dz of [-d/2,d/2])b.box(.035,h,.035,C.cream,x+dx,.23+h/2,z+dz);
 b.box(w+.08,.055,d+.08,color,x,.25+h,z);
}
function pergola(b:Builder,x:number,z:number,w:number,d:number,h:number,color=C.wood){
 for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])b.box(.035,h,.035,color,x+dx,.18+h/2,z+dz);
 for(let i=0;i<7;i++)b.box(w+.09,.035,.035,color,x,h+.2,z-d/2+i*d/6);
}

// Structural additions change the footprint and roofline of each business.
// They are separate from signage and never replace the business with a generic tower.
export function expandArchitecture(b:Builder,id:number,level:number){
 if(!level)return;
 const grand=level===2;
 switch(id){
 case 1:
  glassWing(b,grand?-.48:.48,.27,.50,.60,.65,'#bc794f');
  if(grand){roof(b,-.48,1.03,.27,.65,.71);pergola(b,.30,.55,.60,.4,.78);b.box(.53,.22,.22,'#bb7953',.30,.31,.55);}break;
 case 3:
  pergola(b,0,.32,1.23,.75,.99,'#3d7b65');
  if(grand){glassWing(b,-.46,-.14,.49,.97,.87);b.round(.45,.38,.28,C.wood,.45,.4,.54);for(const x of [-.59,.59])pot(b,x,.16,.69,1.3);}break;
 case 4:
  if(grand){for(const x of [-.55,.55]){glassWing(b,x,.30,.46,.59,.63,'#c88293');b.cyl(.27,.27,.06,C.cream,x,.92,.30,12);}b.round(.86,.06,.36,'#eccf98',0,.20,.63);}break;
 case 6:
  glassWing(b,.51,.26,.53,.68,.80);
  if(grand){b.cyl(.44,.44,.33,C.cream,0,1.29,-.27,16);b.ball(.46,'#4c877e',0,1.46,-.27,1,.70,1);arch(b,0,.80,.63,.35,C.cream);pergola(b,-.51,.38,.40,.64,.88);}
  break;
 case 9:
  glassWing(b,-.47,.21,.57,.74,.91);
  if(grand){b.box(.75,.07,.60,'#5b9186',.30,1.08,.33,0,0,-.16);for(const x of [.07,.61])b.cyl(.02,.02,.84,C.cream,x,.64,.53,6);b.cyl(.14,.16,.28,C.cream,.38,.33,.57);b.ring(.12,.05,'#dba868',.38,.63,.57);}break;
 case 10:
  b.box(1.14,.21,.33,'#d3b37d',0,1.05,-.03);
  if(grand){for(const x of [-.59,.59]){b.cyl(.15,.17,.69,'#bca1c3',x,.53,.42,8);b.cyl(0,.23,.33,'#417f80',x,1.03,.42,8);}arch(b,0,.55,.50,.36,C.cream);}break;
 case 12:
  pergola(b,-.49,0,.35,1.08,.69,'#69875b');
  if(grand){for(const x of [-.45,.45])b.cyl(.02,.025,.76,C.cream,x,.58,-.43,6);b.cyl(0,.61,.33,'#6e9b84',0,1.13,-.43,8);}break;
 case 14:
  for(const x of [-.62,.62]){glassWing(b,x,0,.29,1.18,.60);roof(b,x,.93,0,.35,1.23,'#74a5a0');}
  if(grand){b.ball(.44,'#b9d4c2',0,1.27,-.13,1,.66,1);for(const z of [-.40,.16])arch(b,0,1.24,z,.4,C.cream);}break;
 case 17:
  pergola(b,-.39,.34,.66,.73,.94,'#3c7079');
  if(grand){glassWing(b,.47,.17,.58,.87,.78,'#397d88');b.add(new T.CylinderGeometry(.37,.37,.70,16,1,false,0,Math.PI),'#558e96',.36,1.01,.05,Math.PI/2);}break;
 case 19:
  if(grand)for(const x of [-.72,.72]){b.box(.32,.05,1.21,'#a26051',x,.80,0,0,0,x<0?-.15:.15);for(const z of [-.53,.53])b.box(.025,.59,.025,C.cream,x,.51,z);}break;
 case 22:
  pergola(b,0,.11,1.34,.54,.83,'#b5a06a');
  if(grand){for(const x of [-.67,.67]){b.box(.07,.66,.07,C.cream,x,.5,.63);b.cyl(0,.15,.18,'#89709a',x,.93,.63,4);}b.box(1.36,.09,.09,'#b6a47b',0,.83,.63);}break;
 case 25:
  glassWing(b,-.50,.21,.57,.78,.74,'#6799aa');
  if(grand){glassWing(b,.52,.12,.55,.91,1.05,'#6799aa');b.box(1.44,.08,.42,'#87afb1',0,.94,.48);for(const x of [-.64,.64])b.box(.06,.70,.06,C.cream,x,.56,.60);}break;
 case 26:
  glassWing(b,-.48,.16,.57,.66,.76,'#a28caf');
  if(grand){b.add(new T.CylinderGeometry(.50,.50,.77,20,1,false,0,Math.PI),'#c9a5c3',0,1.20,.07,Math.PI/2);pergola(b,.47,.45,.42,.5,.84,'#ad94a8');}break;
 case 28:
  b.box(1.47,.11,.63,'#c08e55',0,.85,.43);
  if(grand){for(const x of [-.58,.58]){b.round(.39,1.23,.79,'#bfa482',x,.79,-.24);for(let i=0;i<4;i++)b.box(.05,1.03,.035,C.cream,x-.12+i*.08,.80,.17);b.box(.45,.10,.87,C.green,x,1.46,-.24);}b.box(.9,.16,.56,C.green,0,1.74,-.27);}break;
 case 31:
  if(grand){const points=Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return new T.Vector3(Math.cos(a)*.70,.42+Math.sin(a*2)*.16,Math.sin(a)*.27+.47);});const curve=new T.CatmullRomCurve3(points);b.add(new T.TubeGeometry(curve,48,.026,5,false),'#b77558');for(let i=0;i<8;i++){const v=points[i*4];b.cyl(.014,.02,v.y-.16,C.cream,v.x,(v.y+.16)/2,v.z,5);}b.round(.20,.15,.14,'#d5ad5b',.45,.67,.68);}break;
 }
}
