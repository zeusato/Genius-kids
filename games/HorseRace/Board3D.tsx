import React,{useMemo,useRef,useEffect} from 'react';
import { Canvas,useThree,useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {BOARD_SIDE,BOARD_CAMERA,BOARD_FOV} from './view';
import {BoardCamera} from './BoardCamera';
import type {SeatProjection} from './BoardCamera';
import {BoardGesture} from './boardGesture';
import type {BoardView,BoardFrame} from './view';
import { TRACK,STABLES,ROUTE_ARROWS,piecePoint,pieceHeading,homePoint,stableHeading } from './board';
import { TEAMS,Match,Move } from './model';
import { horseGeometry } from './horseGeometry';
import {stableGeometry,woodGrain,boardSurface,contactTexture} from './scenery';
export interface Motion { id:number;before:Match;move?:Move;dice?:number;duration:number }
export interface BoardProps { state:Match; motion:Motion|null; paused:boolean; reduced:boolean; light:boolean; view:BoardView; cameraReset:number; onManualView:()=>void; onSeats:(positions:SeatProjection)=>void; frame?:BoardFrame; enabled:boolean; moves:Move[]; onPick:(piece:number)=>void; onFailure:()=>void; onReady:()=>void }
const temp=new T.Object3D();
function DirectionArrows(){
 const mesh=useRef<T.InstancedMesh>(null);
 const geometry=useMemo(()=>{const shape=new T.Shape();shape.moveTo(-.12,-.14);shape.lineTo(.12,0);shape.lineTo(-.12,.14);shape.lineTo(-.055,0);shape.closePath();return new T.ShapeGeometry(shape);},[]);
 useEffect(()=>{ROUTE_ARROWS.forEach(({x,z,angle},i)=>{temp.position.set(x,.568,z);temp.rotation.set(-Math.PI/2,0,-angle);temp.scale.set(1,1,1);temp.updateMatrix();mesh.current!.setMatrixAt(i,temp.matrix);});mesh.current!.instanceMatrix.needsUpdate=true;},[]);
 return <instancedMesh ref={mesh} geometry={geometry} args={[undefined,undefined,ROUTE_ARROWS.length]}><meshBasicMaterial color='#ac9262'/></instancedMesh>;
}
function Tiles(){
 const mesh=useRef<T.InstancedMesh>(null),rims=useRef<T.InstancedMesh>(null);
 useEffect(()=>{TRACK.forEach(([x,z],i)=>{temp.position.set(x,.47,z);temp.rotation.set(0,0,0);temp.scale.set(1,1,1);temp.updateMatrix();mesh.current!.setMatrixAt(i,temp.matrix);mesh.current!.setColorAt(i,new T.Color(i%14===0?TEAMS[i/14].color:'#fffaf0'));temp.position.y=.566;temp.rotation.x=-Math.PI/2;temp.updateMatrix();rims.current!.setMatrixAt(i,temp.matrix);rims.current!.setColorAt(i,i%14===0?new T.Color(TEAMS[i/14].color).multiplyScalar(.7):new T.Color('#c6b88f'));});for(const m of [mesh.current!,rims.current!]){m.instanceMatrix.needsUpdate=true;m.instanceColor!.needsUpdate=true;}},[]);
 return <><instancedMesh ref={mesh} args={[undefined,undefined,56]} castShadow receiveShadow><cylinderGeometry args={[.40,.44,.18,32]}/><meshStandardMaterial roughness={.32} metalness={.05}/></instancedMesh><instancedMesh ref={rims} args={[undefined,undefined,56]} receiveShadow><ringGeometry args={[.365,.397,24]}/><meshStandardMaterial roughness={.8}/></instancedMesh></>;
}
const numberTextures=new Map<string,T.CanvasTexture>();
function digit(n:number,color?:string){const key=n+':'+(color||'');if(numberTextures.has(key))return numberTextures.get(key)!;const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;if(color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(32,32,31,0,Math.PI*2);ctx.fill();}ctx.font='bold 42px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffffff';ctx.fillText(String(n),32,34);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;numberTextures.set(key,t);return t;}
function Homes(){
 const mesh=useRef<T.InstancedMesh>(null);
 useEffect(()=>{TEAMS.forEach((team,color)=>{for(let i=0;i<6;i++){const [x,z]=homePoint(color,i+1);temp.position.set(x,.49,z);temp.rotation.set(0,0,0);temp.scale.set(1,1,1);temp.updateMatrix();mesh.current!.setMatrixAt(color*6+i,temp.matrix);mesh.current!.setColorAt(color*6+i,new T.Color(team.color));}});mesh.current!.instanceMatrix.needsUpdate=true;mesh.current!.instanceColor!.needsUpdate=true;},[]);
 return <><instancedMesh ref={mesh} args={[undefined,undefined,24]} castShadow receiveShadow><cylinderGeometry args={[.4,.44,.16,32]}/><meshStandardMaterial roughness={.3} metalness={.05}/></instancedMesh>{TEAMS.flatMap((_,color)=>Array.from({length:6},(_,i)=>{const [x,z]=homePoint(color,i+1);return <mesh key={color*6+i} rotation={[-Math.PI/2,0,0]} position={[x,.576,z]}><planeGeometry args={[.46,.46]}/><meshBasicMaterial map={digit(i+1)} transparent depthWrite={false}/></mesh>;}))}</>;
}
function Stable({color,active}:{color:number;active:boolean}){
 const [x,z]=STABLES[color],team=TEAMS[color];
 const geometry=useMemo(()=>stableGeometry(color),[color]);
 return <group position={[x,.42,z]} rotation={[0,stableHeading(color),0]}><RoundedBox args={[3.55,.14,3.55]} radius={.065} receiveShadow><meshStandardMaterial color={team.color} roughness={.65}/></RoundedBox><RoundedBox args={[3.35,.08,3.35]} radius={.035} position={[0,.075,0]} receiveShadow><meshStandardMaterial color={active?team.light:'#e6e6c8'} roughness={.85}/></RoundedBox><mesh geometry={geometry} scale={[1,.82,1]} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.4} side={T.DoubleSide}/></mesh></group>;
}
function Garden(){
 const foliage=useRef<T.InstancedMesh>(null),trunks=useRef<T.InstancedMesh>(null),shrubs=useRef<T.InstancedMesh>(null),flowers=useRef<T.InstancedMesh>(null);
 useEffect(()=>{
  for(let i=0;i<8;i++){
   const sx=i%4<2?-1:1,sz=i%2?-1:1;
   const x=sx*(i<4?9.45:7.9),z=sz*(i<4?7.9:9.35),h=sz>0?1.25:1.9;
   temp.rotation.set(0,0,0);temp.position.set(x,h*.5-.88,z);temp.scale.set(.12,h,.12);temp.updateMatrix();trunks.current!.setMatrixAt(i,temp.matrix);
   for(let j=0;j<3;j++){temp.position.set(x+(j-1)*.32,h-.58+(j===1?.26:0),z+(j===1?-.1:.08));temp.scale.set(.49,j===1?.64:.45,.47);temp.updateMatrix();foliage.current!.setMatrixAt(i*3+j,temp.matrix);foliage.current!.setColorAt(i*3+j,new T.Color(['#709258','#91ad6f','#537b53'][(i+j)%3]));}
  }
  for(let i=0;i<36;i++){
   const corner=i%4,angle=i*2.4,r=1+(i%3)*.3,x=(corner<2?-1:1)*9.3+Math.sin(angle)*r,z=(corner%2?-1:1)*9.3+Math.cos(angle)*r;
   temp.position.set(x,-.58,z);temp.scale.set(.35+i%3*.1,.38,.38);temp.updateMatrix();shrubs.current!.setMatrixAt(i,temp.matrix);shrubs.current!.setColorAt(i,new T.Color(['#547b49','#8b9e56','#73905a'][i%3]));
   for(let j=0;j<2;j++){temp.position.set(x+Math.sin(i+j)*.28,-.15+j*.08,z+Math.cos(i*2+j)*.26);temp.scale.set(.09,.065,.09);temp.updateMatrix();flowers.current!.setMatrixAt(i*2+j,temp.matrix);flowers.current!.setColorAt(i*2+j,new T.Color(['#f6ce7a','#f0aa98','#f8ead1','#b9b0da'][i%4]));}
  }
  for(const m of [trunks.current!,foliage.current!,shrubs.current!,flowers.current!]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
 },[]);
 return <><instancedMesh ref={trunks} args={[undefined,undefined,8]} castShadow><cylinderGeometry args={[1,1,1,8]}/><meshStandardMaterial color='#977348'/></instancedMesh><instancedMesh ref={foliage} args={[undefined,undefined,24]} castShadow><icosahedronGeometry args={[1,2]}/><meshStandardMaterial roughness={.85}/></instancedMesh><instancedMesh ref={shrubs} args={[undefined,undefined,36]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1}/></instancedMesh><instancedMesh ref={flowers} args={[undefined,undefined,72]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial roughness={.7}/></instancedMesh></>;
}
function Table(){
 const grain=useMemo(woodGrain,[]),surface=useMemo(boardSurface,[]);
 const body=useRef<T.Mesh>(null),{gl}=useThree();
 useEffect(()=>{
  if(!import.meta.env.DEV||!body.current)return;
  const mesh=body.current;mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingBox();
  const box=mesh.geometry.boundingBox!,corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>mesh.localToWorld(new T.Vector3(x<0?box.min.x:box.max.x,box.max.y,z<0?box.min.z:box.max.z)));
  const edges=corners.map((p,i)=>corners[(i+1)%4].clone().sub(p));
  gl.domElement.dataset.horseGeometry=JSON.stringify({edges:edges.map(e=>+e.length().toFixed(4)),angles:edges.map((e,i)=>+T.MathUtils.radToDeg(e.angleTo(edges[(i+1)%4])).toFixed(4)),scale:mesh.getWorldScale(new T.Vector3()).toArray()});
 },[gl]);
 return <>
  <RoundedBox args={[17.6,.14,17.6]} radius={.06} position={[0,-.64,0]} castShadow receiveShadow><meshStandardMaterial color='#725642' roughness={.65}/></RoundedBox>
  <RoundedBox ref={body} name='horse-board-body' args={[BOARD_SIDE,1,BOARD_SIDE]} radius={.18} position={[0,-.17,0]} castShadow receiveShadow><meshStandardMaterial map={grain} color='#a77c51' roughness={.36}/></RoundedBox>
  <RoundedBox args={[17.2,.12,17.2]} radius={.05} position={[0,.37,0]} receiveShadow><meshStandardMaterial map={grain} color='#f9e5c5' roughness={.34}/></RoundedBox>
  <RoundedBox args={[15.9,.02,15.9]} radius={.008} position={[0,.435,0]} receiveShadow><meshStandardMaterial color='#c19c56' roughness={.65}/></RoundedBox>
  <RoundedBox args={[15.65,.025,15.65]} radius={.01} position={[0,.4525,0]} receiveShadow><meshStandardMaterial color='#f5edda' roughness={.75}/></RoundedBox>
  <mesh position={[0,.478,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[15.65,15.65]}/><meshStandardMaterial map={surface} roughness={.8} envMapIntensity={.2}/></mesh>
  {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={x+':'+z} position={[x*7,-.76,z*7]} castShadow><cylinderGeometry args={[.5,.43,.24,12]}/><meshStandardMaterial color='#715239'/></mesh>))}
  <mesh position={[0,.49,0]} receiveShadow><cylinderGeometry args={[1.05,1.1,.09,48]}/><meshStandardMaterial color='#b99757' roughness={.55}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.541,0]}><ringGeometry args={[.86,.90,48]}/><meshBasicMaterial color='#f5dfaa'/></mesh>
 </>;
}
function Horse({piece,...props}:BoardProps&{piece:number}){
 const root=useRef<T.Group>(null),contact=useRef<T.Mesh>(null),label=useRef<T.Mesh>(null),elapsed=useRef(0),{invalidate,camera}=useThree();
 const color=props.state.players[Math.floor(piece/4)].color,geo=useMemo(()=>horseGeometry(TEAMS[color].color),[color]);
 const valid=props.enabled&&props.moves.some(m=>m.piece===piece),motion=props.motion;
 useEffect(()=>{elapsed.current=0;invalidate();},[motion?.id,props.state.pieces[piece],invalidate]);
 useFrame((_,dt)=>{
   if(!root.current)return;let [x,z]=piecePoint(props.state,piece),y=.59,turn=pieceHeading(props.state,piece);
   if(motion?.move&&!props.reduced){
     if(!props.paused)elapsed.current+=Math.min(dt,.05)*1000;
     const progress=Math.min(1,elapsed.current/motion.duration),m=motion.move;
     if(m.piece===piece){
       const from=piecePoint(motion.before,piece),to=piecePoint(props.state,piece);
       if(m.kind==='walk'){
         const step=(m.to-m.from)*progress,idx=Math.min(m.to-m.from-1,Math.floor(step)),t=Math.min(1,step-idx),a=piecePoint(motion.before,piece,m.from+idx),b=piecePoint(motion.before,piece,m.from+idx+1);x=a[0]+(b[0]-a[0])*t;z=a[1]+(b[1]-a[1])*t;y+=Math.sin(t*Math.PI)*.4;turn=Math.atan2(b[0]-a[0],b[1]-a[1]);
       }else{x=from[0]+(to[0]-from[0])*progress;z=from[1]+(to[1]-from[1])*progress;y+=Math.sin(progress*Math.PI)*(m.kind==='deploy'?.9:.4);if(progress<1)turn=Math.atan2(to[0]-from[0],to[1]-from[1]);}
     }else if(m.capture===piece){const from=piecePoint(motion.before,piece),to=piecePoint(props.state,piece),t=Math.max(0,(progress-.65)/.35);x=from[0]+(to[0]-from[0])*t;z=from[1]+(to[1]-from[1])*t;y+=Math.sin(t*Math.PI)*1.8;}
     if(progress<1&&!props.paused)invalidate();
   }
   root.current.position.set(x,y,z);root.current.rotation.y=turn;
   if(contact.current)contact.current.position.y=.578-y;
   if(label.current)label.current.quaternion.copy(root.current.quaternion).invert().multiply(camera.quaternion);
 });
 return <group ref={root}><mesh geometry={geo} scale={.82} castShadow receiveShadow><meshPhysicalMaterial vertexColors roughness={.3} clearcoat={.5} clearcoatRoughness={.25}/></mesh><mesh ref={contact} rotation={[-Math.PI/2,0,0]} position={[0,-.012,0]}><planeGeometry args={[1.2,1.2]}/><meshBasicMaterial map={contactTexture()} transparent depthWrite={false}/></mesh><mesh visible={valid} rotation={[-Math.PI/2,0,0]} position={[0,.015,0]}><ringGeometry args={[.35,.47,32]}/><meshBasicMaterial color={TEAMS[color].color}/></mesh>{valid&&<mesh ref={label} position={[0,1.65,0]} renderOrder={5}><planeGeometry args={[.5,.5]}/><meshBasicMaterial map={digit(piece%4+1,TEAMS[color].color)} transparent depthTest={false}/></mesh>}<mesh visible={valid} position={[0,.45,0]} onClick={e=>{e.stopPropagation();if(valid&&e.delta<=6)props.onPick(piece);}}><sphereGeometry args={[.62,8,8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>{props.state.locked[piece]&&<mesh position={[0,1.38,0]}><sphereGeometry args={[.08,8,6]}/><meshStandardMaterial color='#ffd05b' emissive='#9d6b11' emissiveIntensity={.3}/></mesh>}</group>;
}
const pipTextures=new Map<number,T.CanvasTexture>();
function pips(n:number){
 if(pipTextures.has(n))return pipTextures.get(n)!;
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;
 const positions:number[][]=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
 ctx.fillStyle='#37543e';for(const p of positions[n]){ctx.beginPath();ctx.arc(32+(p%3)*32,32+Math.floor(p/3)*32,8,0,Math.PI*2);ctx.fill();}
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;pipTextures.set(n,texture);return texture;
}
function Dice({value,motion,paused}:{value:number|null;motion:Motion|null;paused:boolean}){
 const group=useRef<T.Group>(null),elapsed=useRef(0),{invalidate}=useThree();
 const top=value||1,[front,right]=[[3,2],[3,2],[3,6],[6,2],[1,2],[3,1],[3,5]][top];
 const faces:{n:number;p:[number,number,number];r:[number,number,number]}[]=[{n:top,p:[0,.608,0],r:[-Math.PI/2,0,0]},{n:7-top,p:[0,-.608,0],r:[Math.PI/2,0,0]},{n:front,p:[0,0,.608],r:[0,0,0]},{n:7-front,p:[0,0,-.608],r:[0,Math.PI,0]},{n:right,p:[.608,0,0],r:[0,Math.PI/2,0]},{n:7-right,p:[-.608,0,0],r:[0,-Math.PI/2,0]}];
 useEffect(()=>{elapsed.current=0;invalidate();},[motion?.id,invalidate]);
 useFrame((_,dt)=>{if(!group.current)return;const rolling=!!motion?.dice;if(rolling&&!paused)elapsed.current+=Math.min(dt,.05)*1000;const t=rolling?Math.min(1,elapsed.current/motion!.duration):1;group.current.rotation.set((1-t)*Math.PI*4,Math.PI/8+(1-t)*Math.PI*3,0);group.current.position.y=.95+Math.sin(t*Math.PI)*1.3;if(rolling&&t<1&&!paused)invalidate();});
 return <group ref={group} position={[0,.95,0]}><RoundedBox args={[1.2,1.2,1.2]} radius={.16} castShadow><meshStandardMaterial color='#fff7db' roughness={.4}/></RoundedBox>{faces.map((f,i)=><mesh key={i} position={f.p} rotation={f.r}><planeGeometry args={[1.1,1.1]}/><meshBasicMaterial map={pips(f.n)} transparent depthWrite={false}/></mesh>)}</group>;
}
function Scene(props:BoardProps){
 const {gl,scene,invalidate}=useThree();
 const gesture=useMemo(()=>new BoardGesture(),[]);
 const pick=(piece:number)=>{if(gesture.canPick)props.onPick(piece);};
 useEffect(()=>{if(!import.meta.env.DEV)return;const timer=setInterval(()=>{gl.domElement.dataset.renderCalls=String(gl.info.render.calls);gl.domElement.dataset.triangles=String(gl.info.render.triangles);},1000);return()=>clearInterval(timer);},[gl]);
 useEffect(()=>{const room=new RoomEnvironment(),generator=new T.PMREMGenerator(gl);const env=generator.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.3;room.dispose();generator.dispose();invalidate();return()=>{scene.environment=null;env.dispose();};},[gl,scene,invalidate]);
 useEffect(()=>{props.onReady();const canvas=gl.domElement;const lost=(e:Event)=>{e.preventDefault();props.onFailure();};canvas.addEventListener('webglcontextlost',lost);return()=>canvas.removeEventListener('webglcontextlost',lost);},[gl,props.onReady,props.onFailure]);
 return <>
  <BoardCamera view={props.view} reset={props.cameraReset} frame={props.frame} paused={props.paused} reduced={props.reduced} gesture={gesture} onManual={props.onManualView} onSeats={props.onSeats}/>
  <color attach='background' args={['#dce6ce']}/><ambientLight intensity={.2}/><hemisphereLight args={['#fff8e9','#82906e',.7]}/>
  <directionalLight position={[-6,18,-7]} intensity={1.9} castShadow={!props.light} shadow-mapSize={[2048,2048]} shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={13} shadow-camera-bottom={-13} shadow-normalBias={.035} shadow-bias={-.00015}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.9,0]} receiveShadow><planeGeometry args={[1000,1000]}/><meshStandardMaterial color='#d0ddbb' roughness={1}/></mesh>
  <Table/><Tiles/><DirectionArrows/><Homes/>{TEAMS.map((_,c)=><Stable key={c} color={c} active={props.state.players[props.state.active].color===c}/>)}
  {!props.light&&<Garden/>}{props.state.pieces.map((_,i)=><Horse key={i} piece={i} {...props} onPick={pick}/>)}
  <Dice value={props.state.dice||props.motion?.dice||props.motion?.before.dice||null} motion={props.reduced?null:props.motion} paused={props.paused}/>
  {props.enabled&&props.moves.map(m=>{const [x,z]=piecePoint(props.state,m.piece,m.to);return <mesh key={m.piece} position={[x,.6,z]} rotation={[-Math.PI/2,0,0]} onClick={e=>{e.stopPropagation();if(e.delta<=6)pick(m.piece);}}><ringGeometry args={[.25,.32,24]}/><meshBasicMaterial color={TEAMS[props.state.players[props.state.active].color].color} transparent opacity={.55}/></mesh>;})}
 </>;
}
export default function Board3D(props:BoardProps){return <Canvas camera={{position:BOARD_CAMERA,fov:BOARD_FOV,near:.1,far:350}} shadows={!props.light} dpr={props.light?1:[1,1.5]} frameloop='demand' gl={{antialias:true,powerPreference:'low-power'}} role='img' aria-label='Bàn cờ cá ngựa 3D. Kéo để xoay, cuộn hoặc chụm hai ngón để thu phóng. Chạm ngựa sáng để đi.'><Scene {...props}/></Canvas>;}
