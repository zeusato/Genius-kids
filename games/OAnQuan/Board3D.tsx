import {useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Html,RoundedBox} from '@react-three/drei';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {figureGeometry,tableGeometry,baseGeometry,woodTexture} from './geometry';
import {BoardCamera} from './BoardCamera';
import OnBoardChoice from './OnBoardChoice';
import {movementProgress} from './animation';
import {courtyardGeometry} from './scenery';
import {point,isQuan,ownerOf,QUAN_PITS} from './board';
import {BoardGesture} from '../HorseRace/boardGesture';
import type {Position,Seat,TurnEvent} from './model';
import {TEAM_COLORS} from './model';

export interface BoardProps {matchId:string;intro:boolean;onIntroEnd:()=>void;position:Position;active:Seat;selected:number|null;enabled:boolean;event?:TurnEvent;eventId:string;duration:number;paused:boolean;light:boolean;reduced:boolean;view:'tilted'|'straight';reset:number;onPick:(pit:number)=>void;onDirection:(side:'left'|'right')=>void;onCancel:()=>void;onReady:()=>void;onFailure:()=>void}
const temp=new T.Object3D();
function People({p}: {p:BoardProps}){
  const refs=[useRef<T.InstancedMesh>(null),useRef<T.InstancedMesh>(null),useRef<T.InstancedMesh>(null)];
  const slots=useMemo(()=>{const out:{x:number;y:number;z:number;scale:number}[][]=[[],[],[]];
    p.position.board.forEach((count,pit)=>{if(p.event&&['pickup','capture','sweep'].includes(p.event.kind)&&p.event.from===pit)return;const [x,y,z]=point(pit),n=Math.min(12,count),cols=n<=4?2:3;for(let i=0;i<n;i++){const rows=Math.ceil(n/cols),size=n>8?.55:.67;out[(pit+i)%3].push({x:x+(i%cols-(cols-1)/2)*.47,y:y-.11,z:z+(Math.floor(i/cols)-(rows-1)/2)*.43+(isQuan(pit)?.55:0),scale:size});}});return out;},[p.position,p.event]);
  useEffect(()=>{slots.forEach((list,k)=>{const mesh=refs[k].current!;list.forEach((v,i)=>{temp.position.set(v.x,v.y,v.z);temp.rotation.set(0,.12*Math.sin(i),0);temp.scale.setScalar(v.scale);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);});mesh.count=list.length;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();});},[slots]);
  return <>{refs.map((ref,k)=><instancedMesh key={k} ref={ref} args={[figureGeometry(false,k),undefined,144]} castShadow receiveShadow><meshPhysicalMaterial vertexColors roughness={.55} clearcoat={.22}/></instancedMesh>)}{QUAN_PITS.map((pit,q)=>p.position.quan[q]&&!(p.event?.kind==='capture'&&p.event.from===pit)?<mesh key={pit} geometry={figureGeometry(true)} position={[point(pit)[0],.23,-.45]} scale={1.35} castShadow receiveShadow><meshPhysicalMaterial vertexColors roughness={.48} clearcoat={.3}/></mesh>:null)}</>;
}
function Moving({p}:{p:BoardProps}){
  const group=useRef<T.Group>(null),elapsed=useRef(0),{invalidate}=useThree();
  useEffect(()=>{elapsed.current=0;invalidate();},[p.eventId,invalidate]);
  const e=p.event;
  useFrame((_,dt)=>{if(!e||!group.current)return;if(!p.paused)elapsed.current+=Math.min(dt,.05)*1000;const t=p.reduced?1:movementProgress(elapsed.current,p.duration),smooth=t*t*(3-2*t);
    const source=e.from>=0?point(e.from):[0,.6,e.seat===0?3.5:-3.5],target=e.to>=0?point(e.to):e.to===-1?[source[0],1.65,source[2]]:[0,.6,e.seat===0?3.5:-3.5];
    group.current.position.set(T.MathUtils.lerp(source[0],target[0],smooth),T.MathUtils.lerp(source[1],target[1],smooth)+Math.sin(t*Math.PI)*(e.quan?1.4:.8),T.MathUtils.lerp(source[2],target[2],smooth));group.current.rotation.y=Math.sin(t*Math.PI)*.4;if(t<1&&!p.paused)invalidate();
  });
  if(!e||e.kind==='end')return null;
  const count=e.kind==='pickup'?Math.min(e.dân,4):e.quan?1:Math.min(e.dân,5);
  return <group ref={group}>{Array.from({length:count},(_,i)=><mesh key={i} geometry={figureGeometry(!!e.quan,i%3)} scale={e.quan?1.3:.72} position={[(i-(count-1)/2)*.28,0,0]} castShadow><meshPhysicalMaterial vertexColors roughness={.45} clearcoat={.3}/></mesh>)}</group>;
}
function Scene(p:BoardProps){
  const {gl,scene,invalidate}=useThree(),gesture=useMemo(()=>new BoardGesture(),[]),geo=useMemo(tableGeometry,[]),base=useMemo(baseGeometry,[]),courtyard=useMemo(courtyardGeometry,[]);
  useEffect(()=>()=>{geo.dispose();base.dispose();courtyard.dispose();},[geo,base,courtyard]);
  useEffect(()=>{const room=new RoomEnvironment(),generator=new T.PMREMGenerator(gl),env=generator.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.45;room.dispose();generator.dispose();invalidate();return()=>{scene.environment=null;env.dispose();};},[gl,scene,invalidate]);
  // Replay reuses this canvas, so acknowledge readiness for every new match.
  useEffect(()=>{p.onReady();},[p.matchId,p.onReady]);
  useEffect(()=>{const lost=(e:Event)=>{e.preventDefault();p.onFailure();};gl.domElement.addEventListener('webglcontextlost',lost);return()=>gl.domElement.removeEventListener('webglcontextlost',lost);},[gl,p.onFailure]);
  useEffect(()=>{if(!import.meta.env.DEV)return;const id=setInterval(()=>{gl.domElement.dataset.drawCalls=String(gl.info.render.calls);gl.domElement.dataset.triangles=String(gl.info.render.triangles);},1000);return()=>clearInterval(id);},[gl]);
  return <><BoardCamera {...p} gesture={gesture}/><color attach='background' args={['#dfcfad']}/><fog attach='fog' args={['#dfcfad',38,90]}/><ambientLight intensity={.22}/><hemisphereLight args={['#fff7df','#958e72',.85]}/><directionalLight position={[-5,14,6]} intensity={1.8} castShadow={!p.light} shadow-mapSize={[2048,2048]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={.035}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.81,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color='#c5b390' roughness={1}/></mesh>{!p.light&&<mesh geometry={courtyard} receiveShadow castShadow><meshStandardMaterial vertexColors roughness={.9}/></mesh>}
    <mesh geometry={base} position={[0,-.4,0]} receiveShadow castShadow><meshStandardMaterial color='#ac8153' roughness={.6}/></mesh>
    <mesh geometry={geo} position={[0,.08,0]} castShadow receiveShadow><meshPhysicalMaterial map={woodTexture()} roughness={.55} clearcoat={.16}/></mesh>
    {Array.from({length:12},(_,pit)=>{const [x,,z]=point(pit),q=isQuan(pit),selected=p.selected===pit,eligible=p.enabled&&ownerOf(pit)===p.active&&p.position.board[pit]>0,highlight=p.event?.to===pit||p.event?.from===pit;
      return <group key={pit} position={[x,0,z]}><RoundedBox args={[q?2.35:1.83,.12,q?3.7:1.99]} radius={.15} position={[0,.1,0]} receiveShadow><meshStandardMaterial color={selected?'#b4d4b2':highlight?'#e8c778':q?'#d1ac70':pit<5?'#ccdad0':'#e4b998'} roughness={.95}/></RoundedBox>
        <mesh position={[0,.72,0]} onClick={e=>{e.stopPropagation();if(eligible&&e.delta<=6&&gesture.canPick)p.onPick(pit);}}><boxGeometry args={[q?2.4:1.98,1.3,q?3.9:2.15]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
        {!p.intro&&<Html position={[0,.49,q?1.55:.94]} center zIndexRange={[10,0]}><button aria-label={`${q?'Ô quan':`Chọn ô ${pit<5?pit+1:11-pit}`}, ${p.position.board[pit]} dân trên bàn`} disabled={!eligible} onClick={e=>{e.stopPropagation();p.onPick(pit);}} className={'oaq-pit-count'+(selected?' selected':'')+(eligible?' eligible':'')}>{q&&p.position.quan[QUAN_PITS.indexOf(pit)]&&<b>QUAN · </b>}{p.position.board[pit]}<small> dân</small></button></Html>}
        {(selected||highlight)&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.22,0]}><ringGeometry args={[.74,.82,32]}/><meshBasicMaterial color={TEAM_COLORS[p.active]} transparent opacity={.55}/></mesh>}
      </group>;})}
    <People p={p}/><Moving p={p}/>
    {p.selected!==null&&p.enabled&&<Html center position={[point(p.selected)[0],1.8,point(p.selected)[2]]} zIndexRange={[30,20]}><OnBoardChoice count={p.position.board[p.selected]} onDirection={p.onDirection} onCancel={p.onCancel}/></Html>}
  </>;
}
export default function Board3D(p:BoardProps){return <Canvas camera={{position:[0,18,14],fov:38,near:.1,far:180}} shadows={!p.light} dpr={p.light?1:[1,1.5]} frameloop='demand' gl={{antialias:true,powerPreference:'low-power'}} onPointerMissed={p.onCancel} role='group' aria-label='Bàn Ô ăn quan 3D. Chạm một ô dân phía mình rồi chọn trái hoặc phải.'><Scene {...p}/></Canvas>;}
