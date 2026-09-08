import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MapNode, Quality, Region, Session, rng } from './model';
import { createMap, regionOf } from './content';
import { BoardTiles } from './BoardTiles';



export interface WorldProps {missionId:string;seed:number;session?:Session;quality:Quality;reduced:boolean;heroColor:string;overview?:boolean;onReady:()=>void;onUnavailable:()=>void;onSlow:()=>void}
type Part={shape:'sphere'|'cone'|'box'|'crystal'|'cylinder';position:[number,number,number];scale:[number,number,number];color:string;rotation?:[number,number,number]};
const BASE=import.meta.env.BASE_URL+'dragon/';
const InstancedParts=React.memo(function InstancedParts({parts}:{parts:Part[]}){
 return <>{(['sphere','cone','box','crystal','cylinder'] as const).map(shape=><Instances key={shape} parts={parts.filter(p=>p.shape===shape)} shape={shape}/>)}</>;
});
function Instances({parts,shape}:{parts:Part[];shape:Part['shape']}){
 const ref=useRef<THREE.InstancedMesh>(null);const invalidate=useThree(s=>s.invalidate);
 useEffect(()=>{if(!ref.current)return;const dummy=new THREE.Object3D(),color=new THREE.Color();parts.forEach((p,i)=>{dummy.position.set(...p.position);dummy.scale.set(...p.scale);dummy.rotation.set(...(p.rotation||[0,0,0]));dummy.updateMatrix();ref.current!.setMatrixAt(i,dummy.matrix);ref.current!.setColorAt(i,color.set(p.color));});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();invalidate();},[parts,invalidate]);
 if(!parts.length)return null;
 return <instancedMesh ref={ref} args={[undefined,undefined,parts.length]} receiveShadow>
  {shape==='sphere'?<sphereGeometry args={[1,10,8]}/>:shape==='cone'?<coneGeometry args={[1,1,7]}/>:shape==='crystal'?<octahedronGeometry args={[1,0]}/>:shape==='cylinder'?<cylinderGeometry args={[1,1,1,12]}/>:<boxGeometry/>}
  <meshStandardMaterial roughness={.92} flatShading/>
 </instancedMesh>;
}
function landscape(region:Region,map:MapNode[],seed:number,quality:Quality){
 const parts:Part[]=[],random=rng(seed^12557);const add=(shape:Part['shape'],position:Part['position'],scale:Part['scale'],color:string)=>parts.push({shape,position,scale,color});
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;add('sphere',[Math.cos(a)*6.9,-.2,Math.sin(a)*6.9],[.7,.35,.7],region.ground);add('crystal',[Math.cos(a)*6.5,-1,Math.sin(a)*6.5],[.7,1,.7],region.rock);}
 const count=quality==='light'?12:quality==='balanced'?22:30;
 for(let i=0;i<count;i++){const a=random()*Math.PI*2,x=Math.cos(a)*6.5,z=Math.sin(a)*6.5;if(z>3.8||map.some(n=>Math.hypot(n.x-x,n.z-z)<1.45))continue;
  if(region.id==='crystal'){add('crystal',[x,.65,z],[.38,1.5,.38],i%2?'#c4b0e4':'#85b8ce');add('crystal',[x+.32,.3,z],[.2,.8,.2],'#e6d2ee');}
  else if(region.id==='castle'){add('cylinder',[x,.65,z],[.4,1.3,.4],'#dccdab');add('cone',[x,1.5,z],[.55,.5,.55],region.color);}
  else{add('cylinder',[x,.4,z],[.12,.8,.12],'#958064');add(region.id==='snow'?'cone':'sphere',[x,1.1,z],[.55,1,.55],region.id==='snow'?'#f5faf0':'#91b889');}
 }
 for(let i=0;i<map.length-1;i++){const a=map[i],b=map[i+1];add('cylinder',[(a.x+b.x)/2,.03,(a.z+b.z)/2],[.1,.05,.1],'#d5b57e');}
 return parts;
}function Actor({model,position,rotation=0,scale=1,animation='idle',paused=false,reduced=false,tint,onReady,castShadow=true}:{model:'hero'|'dragon'|'fairy'|'goblin';position:[number,number,number];rotation?:number;scale?:number;animation?:string;paused?:boolean;reduced?:boolean;tint?:string;onReady?:()=>void;castShadow?:boolean}){
 const gltf=useGLTF(BASE+model+'.glb'),ref=useRef<THREE.Group>(null);
 const {object,cloned}=useMemo(()=>{const object=gltf.scene.clone(true),cloned:THREE.Material[]=[];object.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=castShadow;o.receiveShadow=true;const m=(o.material as THREE.MeshStandardMaterial).clone();cloned.push(m);if(tint&&(m.name==='cloak'||m.name==='scales'))m.color.set(tint);o.material=m;}});return {object,cloned};},[gltf.scene,tint,castShadow]);
 const mixer=useMemo(()=>new THREE.AnimationMixer(object),[object]),last=useRef<THREE.AnimationAction|null>(null);
 useEffect(()=>{const clip=gltf.animations.find(c=>c.name===animation)||gltf.animations[0];if(!clip)return;const action=mixer.clipAction(clip);action.reset().fadeIn(.18).play();last.current?.fadeOut(.18);last.current=action;return()=>{action.fadeOut(.12);};},[animation,mixer,gltf.animations]);
 useEffect(()=>{onReady?.();return()=>{mixer.stopAllAction();mixer.uncacheRoot(object);cloned.forEach(m=>m.dispose());};},[mixer,object,cloned]);
 const initial=useRef(true),turn=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,rotation,0));
 useFrame((_,dt)=>{const g=ref.current;if(!g)return;const step=1-Math.exp(-Math.min(dt,.1)*9);if(initial.current||reduced){g.position.set(...position);g.quaternion.copy(turn);initial.current=false;}else{g.position.lerp(new THREE.Vector3(...position),step);g.quaternion.slerp(turn,step);}if(!paused&&!reduced)mixer.update(Math.min(dt,.08));else mixer.update(0);});
 return <group ref={ref} scale={scale}><primitive object={object}/><mesh rotation-x={-Math.PI/2} position-y={.012}><circleGeometry args={[model==='dragon'?.53:.28,20]}/><meshBasicMaterial color="#3c5b52" transparent opacity={.15} depthWrite={false}/></mesh></group>;
}
function Camera(){const {camera,size,invalidate}=useThree();useEffect(()=>{const c=camera as THREE.OrthographicCamera;c.position.set(0,18,12);c.lookAt(0,0,0);c.zoom=Math.min(size.width/12.3,size.height/10.1);c.updateProjectionMatrix();invalidate();},[camera,size,invalidate]);return null;}function Pulse({position,color,active,reduced}:{position:[number,number,number];color:string;active:boolean;reduced:boolean}){const ref=useRef<THREE.Mesh>(null);useFrame(({clock})=>{if(ref.current)ref.current.scale.setScalar(active&&!reduced?1+Math.sin(clock.elapsedTime*3)*.07:1);});return <mesh ref={ref} position={position} rotation-x={-Math.PI/2}><ringGeometry args={[.47,.55,32]}/><meshBasicMaterial color={color} transparent opacity={active?.95:.28} depthWrite={false}/></mesh>;}
function SparkBurst({session,reduced}:{session?:Session;reduced:boolean}){
 const ref=useRef<THREE.InstancedMesh>(null),start=useRef(0),seen=useRef(-1);const particles=useMemo(()=>Array.from({length:24},(_,i)=>({a:i/24*Math.PI*2,s:.8+(i%5)*.16})),[]);const dummy=useMemo(()=>new THREE.Object3D(),[]);
 useFrame(({clock})=>{if(!ref.current)return;if(session&&seen.current!==session.fx){seen.current=session.fx;start.current=clock.elapsedTime;}const t=clock.elapsedTime-start.current,show=!!session&&session.fx>0&&t<1.1&&!reduced&&(session.phase==='feedback'||session.phase==='won'||session.phase==='readyToRoll');ref.current.visible=show;if(!show)return;const node=session!.map.find(n=>n.id===session!.position)!;particles.forEach((p,i)=>{dummy.position.set(node.x+Math.cos(p.a)*t*p.s,.5+Math.sin(Math.min(1,t)*Math.PI)*1.4,node.z+Math.sin(p.a)*t*p.s);dummy.rotation.set(t*2,p.a,t);dummy.scale.setScalar(.05*(1-t/1.2));dummy.updateMatrix();ref.current!.setMatrixAt(i,dummy.matrix);});ref.current.instanceMatrix.needsUpdate=true;});
 return <instancedMesh ref={ref} args={[undefined,undefined,24]} frustumCulled={false}><octahedronGeometry args={[1,0]}/><meshBasicMaterial color="#f5d17b"/></instancedMesh>;
}
function Scene(props:WorldProps){
 useGLTF([BASE+'hero.glb',BASE+'dragon.glb',BASE+'fairy.glb',BASE+'goblin.glb']);
 const {session:s,quality,reduced}=props,region=regionOf(props.missionId),map=useMemo(()=>s?.map||createMap(props.missionId,props.seed),[s?.map,props.missionId,props.seed]);
 
 const parts=useMemo(()=>landscape(region,map,props.seed,quality),[region,map,props.seed,quality]);
 const {gl,invalidate}=useThree(),samples=useRef<number[]>([]),slow=useRef(false),lastSample=useRef(0);
 useEffect(()=>{samples.current=[];slow.current=false;},[quality,reduced]);
 const node=s?map.find(n=>n.id===s.position)!:map[0],previous=s?map.find(n=>n.id===s.previousPosition)!:node,boss=map.at(-1)!;
 const moving=s?.phase==='moving',good=s?.phase==='feedback'&&s.feedback?.correct,bad=s?.phase==='feedback'&&!s.feedback?.correct;
 const active=s&&['intro','question','feedback'].includes(s.phase),isBoss=node.kind==='boss';
 const look=moving?Math.atan2(node.x-previous.x,node.z-previous.z):active?Math.PI:Math.PI*.12;
 useEffect(()=>{props.onReady();const lost=(e:Event)=>{e.preventDefault();props.onUnavailable();};gl.domElement.addEventListener('webglcontextlost',lost);return()=>gl.domElement.removeEventListener('webglcontextlost',lost);},[gl]);
 useEffect(()=>{invalidate();if(reduced||s?.paused)return;let interval:number|undefined;const schedule=()=>{if(interval)clearInterval(interval);if(!document.hidden)interval=window.setInterval(invalidate,moving||s?.phase==='feedback'?16:quality==='light'?80:33);};schedule();document.addEventListener('visibilitychange',schedule);return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',schedule);};},[invalidate,reduced,s?.paused,moving,s?.phase,quality]);
 useFrame((_,dt)=>{if(!document.hidden&&!s?.paused&&!reduced&&(moving||s?.phase==='feedback')&&dt>0&&dt<.3){samples.current.push(dt*1000);if(samples.current.length>120)samples.current.shift();const a=[...samples.current].sort((a,b)=>a-b);if(a.length>=90&&a[Math.floor(a.length*.95)]>48&&!slow.current){slow.current=true;props.onSlow();}}
  if(import.meta.env.DEV&&gl.domElement.parentElement&&performance.now()-lastSample.current>500){lastSample.current=performance.now();const a=[...samples.current].sort((a,b)=>a-b);gl.domElement.parentElement.dataset.dragonMetrics=JSON.stringify({calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,p95:a[Math.floor(a.length*.95)]||0,samples:a.length});}
 });
 return <>
  <Camera/><ambientLight intensity={1.05}/><hemisphereLight args={['#fff6df',region.rock,1.25]}/>
  <directionalLight position={[-7,13,9]} intensity={2.1} castShadow={quality!=='light'} shadow-mapSize={quality==='detailed'?[2048,2048]:[1024,1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-.002} shadow-normalBias={.05}/>
  <mesh position={[0,-.27,0]} receiveShadow><cylinderGeometry args={[7.1,6.8,.55,64]}/><meshStandardMaterial color={region.ground} roughness={1}/></mesh>
  <mesh position={[0,-1.15,0]}><cylinderGeometry args={[6.2,4.5,1.55,14]}/><meshStandardMaterial color={region.rock} flatShading roughness={1}/></mesh>
  <mesh rotation-x={-Math.PI/2} position={[0,-2.2,0]}><circleGeometry args={[7,48]}/><meshBasicMaterial color={region.color} transparent opacity={.055}/></mesh>
  <InstancedParts parts={parts}/>
  <BoardTiles map={map} session={s}/>
  {active&&(node.kind==='combat'||node.kind==='buff')&&<Actor model={node.kind==='buff'?'fairy':'goblin'} position={[-6.1,.15,0]} scale={.72} animation={good?'celebrate':bad?'cast':'idle'} paused={s?.paused} reduced={reduced}/> }
  <Pulse position={[node.x,.17,node.z]} color="#b18c36" active={!!s} reduced={reduced}/>
  <Actor model="hero" position={[node.x,.18,node.z+.24]} rotation={look} scale={.52} animation={s?.phase==='won'?'celebrate':moving?'walk':good?'cast':bad?'hit':'idle'} tint={props.heroColor} paused={s?.paused} reduced={reduced}/>
  {quality!=='light'&&<Actor model="dragon" position={[-6.4,.1,3.2]} rotation={.35} scale={.62} animation={good||s?.phase==='won'?'celebrate':'idle'} castShadow={false} paused={s?.paused} reduced={reduced} tint={region.color}/>}
  <Actor model="dragon" position={[boss.x,.15,boss.z-1.45]} rotation={0} castShadow={!s||isBoss} scale={.76} animation={s?.phase==='won'?'celebrate':isBoss&&bad?'cast':isBoss&&good?'hit':'idle'} tint={region.color} paused={s?.paused} reduced={reduced}/>  <SparkBurst session={s} reduced={reduced}/>
 </>;
}
export default function World3D(props:WorldProps){return <Canvas orthographic camera={{position:[12,16,18],zoom:38,near:.1,far:100}} frameloop="demand" dpr={props.quality==='light'?1:[1,props.quality==='balanced'?1.5:2]} shadows={props.quality!=='light'} gl={{alpha:true,antialias:props.quality!=='light',powerPreference:'low-power'}} role="img" aria-label="Bàn cờ Rồng Thần có đủ 50 ô. Nhân vật di chuyển bằng xúc xắc."><Scene {...props}/></Canvas>;}







