import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {BOARD,GROUPS} from './board';
export class Builder {
 parts:T.BufferGeometry[]=[];
 add(g:T.BufferGeometry,color:string,x=0,y=0,z=0,rx=0,ry=0,rz=0){g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);const c=new T.Color(color),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(a,3));const p=g.index?g.toNonIndexed():g;this.parts.push(p);if(p!==g)g.dispose();}
 box(w:number,h:number,d:number,c:string,x=0,y=0,z=0,rx=0,ry=0,rz=0){this.add(new T.BoxGeometry(w,h,d),c,x,y,z,rx,ry,rz);}
 round(w:number,h:number,d:number,c:string,x=0,y=0,z=0,r=.06){this.add(new RoundedBoxGeometry(w,h,d,2,r),c,x,y,z);}
 ball(r:number,c:string,x=0,y=0,z=0,sx=1,sy=1,sz=1){const g=new T.SphereGeometry(r,12,8);g.scale(sx,sy,sz);this.add(g,c,x,y,z);}
 cyl(top:number,bot:number,h:number,c:string,x=0,y=0,z=0,segments=12,rx=0){this.add(new T.CylinderGeometry(top,bot,h,segments),c,x,y,z,rx);}
 ring(r:number,tube:number,c:string,x=0,y=0,z=0,rx=0){this.add(new T.TorusGeometry(r,tube,6,24),c,x,y,z,rx);}
 finish(){const g=mergeGeometries(this.parts);this.parts.forEach(p=>p.dispose());return g;}
}
const C={cream:'#fff0cf',wall:'#f4dbaa',wood:'#966848',roof:'#c77550',green:'#39847b',dark:'#344d4a',glass:'#779f9b',gold:'#d4ab60'};
function roof(b:Builder,x:number,y:number,z:number,w:number,d:number,color=C.roof){for(const sign of [-1,1])b.box(w,.065,d*.58,color,x,y,z+sign*d*.23,sign*.48);for(let i=0;i<Math.floor(w/.12);i++)for(const sign of [-1,1])b.box(.032,.04,d*.58,i%3===0?'#dc9365':color,x-w/2+.08+i*.12,y+.04,z+sign*d*.23,sign*.48);b.add(new T.CylinderGeometry(.048,.048,w,8),'#df9c6b',x,y+.16,z,0,0,Math.PI/2);}
export function tree(b:Builder,x:number,z:number,size=1){b.cyl(.065*size,.09*size,.65*size,C.wood,x,.4*size,z,8);b.ball(.40*size,'#417f54',x,.92*size,z,1,1.22,1);b.ball(.31*size,'#659c68',x-.18*size,1.05*size,z+.1*size);b.ball(.25*size,'#7bab72',x+.18*size,1.16*size,z-.08*size);for(let i=0;i<6;i++){const a=i*Math.PI/3;b.ball(.14*size,i%2?'#73a775':'#568c5c',x+Math.cos(a)*.31*size,(.93+(i%3)*.13)*size,z+Math.sin(a)*.31*size,1,.8,1);}}
function flowerPot(b:Builder,x:number,y:number,z:number,color='#e1a185'){b.cyl(.09,.06,.14,color,x,y+.07,z,8);b.ball(.11,'#62966c',x,y+.2,z);b.ball(.046,'#f3bc87',x+.035,y+.3,z);}
export {buildingGeometry} from './buildings';
export function characterGeometry(seat:number,color:string){const b=new Builder(),fur=['#c7a17b','#d99a64','#f4e4ca','#bcb3a1'][seat];b.cyl(.27,.3,.1,color,0,.055,0);b.ball(.22,color,0,.36,0,1,1.15,.8);b.ball(.265,fur,0,.72,0,1,1,.87);for(const sign of [-1,1]){b.ball(seat===2?.085:.11,fur,sign*.18,seat===2?1.02:.91,0,1,seat===2?2.5:1,.7);b.ball(.045,'#e3b8a1',sign*.18,seat===2?1.03:.94,.065,1,seat===2?2:1,.35);b.ball(.035,C.dark,sign*.092,.75,.21,1,1.2,.7);b.ball(.011,C.cream,sign*.085,.76,.236);b.ball(.063,fur,sign*.24,.4,.025);b.ball(.087,C.dark,sign*.12,.16,.08,1,.5,1.2);b.ball(.045,'#dbad91',sign*.16,.66,.2,1,.5,.3);}
 b.ball(.108,'#f6dfbc',0,.65,.20,1.1,.7,.45);b.ball(.031,C.dark,0,.69,.248);b.box(.026,.07,.017,C.gold,0,.41,.18);b.round(.23,.25,.09,C.wood,0,.39,-.21,.035);b.box(.36,.07,.05,C.cream,0,.51,.11);
 if(seat===1||seat===3){for(const sign of [-1,1]){b.cyl(0,.115,.27,fur,sign*.18,1.01,0,3);b.ball(.08,'#f5dfb9',sign*.14,.62,.2,1.2,.6,.6);}b.ball(.13,fur,.15,.29,-.29,1.6,.8,1.2);b.ball(.08,C.cream,.31,.3,-.33);}
 return b.finish();}
export function tramGeometry(){const b=new Builder();b.round(1.15,.46,.46,'#eed49a',0,.36,0);b.round(1.22,.1,.54,C.green,0,.64,0);for(let i=0;i<5;i++)for(const sign of [-1,1])b.round(.15,.23,.018,C.glass,-.43+i*.215,.43,sign*.238,.02);b.box(1.12,.055,.48,C.cream,0,.23,0);for(const x of [-.4,.4])for(const z of [-.25,.25])b.ball(.09,C.dark,x,.15,z,1,1,.4);b.box(.4,.04,.35,C.wood,0,.73,0);return b.finish();}
export function sceneryGeometry(){const b=new Builder();
 b.round(20.6,.46,20.6,'#a9835d',0,-.42,0,.2);b.round(20.45,.12,20.45,'#d9bd8f',0,-.15,0,.2);b.round(20.2,.09,20.2,'#bcc2ad',0,-.055,0,.2);b.round(16.65,.14,16.65,'#e2d6b9',0,.02,0,.15);
 b.round(10.85,.15,10.85,'#c4c7a3',0,.015,0,.2);b.round(10.25,.05,10.25,'#e2d8b9',0,.10,0,.2);
 for(const sign of [-1,1])for(const rail of [5.32,5.55]){b.box(11.1,.018,.025,'#a29d83',0,.13,sign*rail);b.box(.025,.018,11.1,'#a29d83',sign*rail,.13,0);}
 for(let i=0;i<39;i++){const n=-4.9+i*.26;for(const sign of [-1,1]){b.box(.025,.012,.22,'#c2b090',n,.11,sign*5.43);b.box(.22,.012,.025,'#c2b090',sign*5.43,.11,n);}}
 for(let row=0;row<39;row++)for(let col=0;col<4;col++){const x=-.58+col*.39+(row%2)*.1,z=-4.85+row*.25;if(Math.abs(z-1.2)<1.4||z<-1.1&&z>-2.9)continue;b.box(.36,.018,.22,(row+col)%3===0?'#eee0c3':'#d8c8a8',x,.16,z);}
 for(const sign of [-1,1])for(let i=0;i<9;i++){b.box(.035,.012,20,'#b68d5a',sign*(10.08+i*.022),-.073,0);}
 // Cream promenades and four low garden beds leave a clear sight line.
 for(const x of [-2.95,2.95])for(const z of [-2.9,2.9]){b.round(3.6,.11,3.45,'#b3bea0',x,.16,z,.15);b.round(3.35,.06,3.18,'#739569',x,.23,z,.15);for(let i=0;i<6;i++){const dx=x-1.3+i*.52;flowerPot(b,dx,.26,z+1.15,'#b19a72');for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5;b.ball(.045,i%2?'#f4dc95':'#df9478',dx+Math.cos(a)*.07,.55,z+1.15+Math.sin(a)*.07,1,.5,1);}}tree(b,x-.75,z-.6,1.1);tree(b,x+.85,z-.7,.85);for(let i=0;i<3;i++)b.ball(.25,'#87ab76',x-.8+i*.75,.36,z+.35,1,.4,1);for(let i=0;i<12;i++)b.box(.07,.24,.07,'#e9debd',x-1.42+i*.258,.4,z-1.58);b.box(3.1,.05,.06,'#e9debd',x,.47,z-1.58);}
 for(const sign of [-1,1])for(let i=0;i<7;i++){b.box(.43,.026,.11,'#f8efda',-1.4+i*.47,.15,sign*5.0);b.box(.11,.026,.43,'#f8efda',sign*5,.15,-1.4+i*.47);}
 // Two-tier turquoise fountain with sculpted rings and small jets.
 b.cyl(1.36,1.4,.16,C.cream,0,.24,1.2,48);b.cyl(1.17,1.17,.045,'#79c4c0',0,.33,1.2,48);b.ring(1.3,.095,'#e1d1a7',0,.33,1.2,Math.PI/2);b.cyl(.15,.3,.72,C.cream,0,.66,1.2);b.cyl(.56,.25,.12,C.cream,0,1.01,1.2,32);b.cyl(.48,.48,.035,'#94d6cd',0,1.09,1.2,32);b.cyl(.1,.17,.4,C.cream,0,1.24,1.2);b.ball(.13,'#a6e0d7',0,1.53,1.2);for(let i=0;i<8;i++){const a=i*Math.PI/4;b.ball(.045,'#c0e6dc',Math.sin(a)*.55,.85,1.2+Math.cos(a)*.55,1,2,1);}
 // Clock pavilion: arched doorway, fluted columns, tiled roof and hands.
 b.round(1.65,.18,1.65,'#d8bf95',0,.2,-2);b.round(1.4,1.72,1.25,C.wall,0,1.13,-2,.04);b.round(.53,.92,.03,C.green,0,.79,-1.355,.22);for(const x of [-.56,.56]){b.cyl(.07,.09,1.55,C.cream,x,1.04,-1.33);b.box(.23,.14,.22,C.cream,x,1.84,-1.33);}
 b.box(1.55,.14,1.4,C.cream,0,1.98,-2);b.round(1.08,.84,1.05,C.wall,0,2.42,-2);b.cyl(.3,.3,.035,C.cream,0,2.45,-1.458,32,Math.PI/2);b.ring(.3,.025,C.gold,0,2.45,-1.43);b.box(.023,.19,.03,C.dark,0,2.5,-1.41);b.box(.16,.023,.03,C.dark,.07,2.44,-1.41);roof(b,0,3.02,-2,1.6,1.4);b.ball(.075,C.gold,0,3.3,-2);
 for(const x of [-4.8,4.8])for(const z of [-4.8,0,4.8]){b.cyl(.027,.04,1.05,C.dark,x,.64,z,8);b.round(.18,.25,.18,'#ffe8b0',x,1.28,z,.03);b.cyl(0,.16,.15,C.green,x,1.47,z,4);}
 for(const x of [-1.6,1.6])for(const z of [-.6,3.6]){for(let i=0;i<3;i++)b.box(.74,.055,.07,C.wood,x,.35,z+i*.095);b.box(.74,.23,.045,C.wood,x,.49,z-.06);for(const sign of [-1,1])b.box(.055,.24,.32,C.dark,x+sign*.26,.21,z+.06);}
 for(let i=0;i<10;i++){const x=-8.3+i*1.85;tree(b,x,-11,.8+(i%3)*.12);}
 return b.finish();
}
export function roadGeometry(id:number,ownerColor?:string){const b=new Builder(),t=BOARD[id],color=GROUPS[t.group]?.color||'#b6c9b9',ground=ownerColor?'#'+new T.Color(ownerColor).lerp(new T.Color('#fff1d4'),.16).getHexString():'#f5ead4';if(id%8===0){b.round(3.4,.065,1.50,ground,-1,.05,0,.04);b.round(1.50,.065,3.4,ground,0,.051,-1,.04);b.box(1.37,.02,.11,color,0,.096,.61);}else{b.round(1.77,.065,1.5,ground,0,.05,0,.045);b.box(1.68,.024,.13,color,0,.097,-.61);b.box(.26,.016,.025,ownerColor||'#b3ad92',-.12,.09,.46,0,-.5);b.box(.26,.016,.025,ownerColor||'#b3ad92',-.12,.09,.34,0,.5);}return b.finish();}
