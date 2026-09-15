import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as T from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { pieceGeometry, point, slab, woodTexture, roomGeometry } from './geometry';
import type { Match, Move } from './model';
import { algToSq } from './board';
export interface Motion extends Move { at: number; duration: number }
export interface BoardProps { match: Match; flip: boolean; view: 'top'|'angled'; light: boolean; selected: number|null; targets: number[]; interactive: boolean; motion: Motion|null; onPick(sq:number):void; onFailure():void }
function Camera({flip,view}: Pick<BoardProps,'flip'|'view'>) {
  const {camera,size,invalidate}=useThree();
  useEffect(() => { const cam=camera as T.OrthographicCamera; cam.position.set(0,view==='top'?20:19,(flip?-1:1)*(view==='top'?.001:9));cam.lookAt(0,.25,0);cam.zoom=Math.min(size.width/9.8,size.height/(view==='top'?10:9.75));cam.updateProjectionMatrix();invalidate(); },[camera,size,flip,view,invalidate]);
  return null;
}
function Pieces(p:BoardProps) {
  const meshes=useRef(new Map<number,T.InstancedMesh>()), {invalidate}=useThree(), dummy=useMemo(()=>new T.Object3D(),[]);
  const geometries=useMemo(()=>Array.from({length:6},(_,i)=>pieceGeometry(i+1)),[]), codes=[1,2,3,4,5,6,9,10,11,12,13,14];
  useEffect(()=>()=>geometries.forEach(g=>g.dispose()),[geometries]);
  function update(t:number) {
    const slots=new Map<number,number>(), ease=t*t*(3-2*t);
    p.match.board.forEach((code,sq)=> { if(!code)return; const mesh=meshes.current.get(code);if(!mesh)return;
      let [x,y,z]=point(sq), from:number|undefined;
      if(p.motion?.to===sq)from=p.motion.from;
      if(p.motion && (p.match.board[p.motion.to]&7)===6 && Math.abs(p.motion.from-p.motion.to)===2) {
        const rookTo=p.motion.to>p.motion.from?p.motion.to-1:p.motion.to+1;
        if(sq===rookTo)from=p.motion.to>p.motion.from?p.motion.from+3:p.motion.from-4;
      }
      if(from!==undefined) { const src=point(from);x=T.MathUtils.lerp(src[0],x,ease);z=T.MathUtils.lerp(src[2],z,ease);y+=Math.sin(t*Math.PI)*.32; }
      if(p.selected===sq)y+=.06;
      dummy.position.set(x,y,z);dummy.rotation.set(0,(code&7)===2?(code<9?-Math.PI/5:Math.PI/5):0,0);dummy.scale.setScalar(1);dummy.updateMatrix();
      const index=slots.get(code)??0;mesh.setMatrixAt(index,dummy.matrix);slots.set(code,index+1);
    });
    meshes.current.forEach((mesh,code)=>{mesh.count=slots.get(code)??0;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();});
  }
  useEffect(()=>{update(p.motion?0:1);invalidate();},[p.match.board,p.selected,p.motion]);
  useFrame(()=>{if(p.motion){const t=Math.min(1,(performance.now()-p.motion.at)/p.motion.duration);update(t);if(t<1)invalidate();}});
  return <>{codes.map(code=><instancedMesh key={code} ref={ref=>{if(ref)meshes.current.set(code,ref);else meshes.current.delete(code);}} args={[geometries[(code&7)-1],undefined,16]} castShadow receiveShadow onClick={event=>{event.stopPropagation();if(!p.interactive||event.instanceId===undefined)return;const square=p.match.board.flatMap((piece,sq)=>piece===code?[sq]:[])[event.instanceId];if(square!==undefined)p.onPick(square);}}>
    <meshStandardMaterial color={code<9?'#d7c09a':'#362d24'} roughness={.44} metalness={.02} vertexColors/>
  </instancedMesh>)}</>;
}
function Markers(p:BoardProps) {
  const last=p.match.history.at(-1), recent=last?[algToSq(last.slice(0,2)),algToSq(last.slice(2,4))]:[];
  const king=p.match.inCheck?p.match.board.indexOf(p.match.active===0?6:14):-1;
  const marked=[...new Set([...recent,...(p.selected===null?[]:[p.selected]),...(king<0?[]:[king])])];
  return <>{marked.map(sq=><mesh key={sq} position={[point(sq)[0],.118,point(sq)[2]]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><planeGeometry args={[.96,.96]}/><meshBasicMaterial color={sq===king?'#cc5346':sq===p.selected?'#67956b':'#d8bb64'} transparent opacity={sq===p.selected?.6:.35} depthWrite={false}/></mesh>)}
    {[...new Set(p.targets)].map(sq=><mesh key={'t'+sq} position={[point(sq)[0],.125,point(sq)[2]]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={p.match.board[sq]?[.39,.46,40]:[0,.115,24]}/><meshBasicMaterial color='#37624a' transparent opacity={.85} depthWrite={false}/></mesh>)}</>;
}
function Scene(p:BoardProps) {
  const {gl,scene,invalidate}=useThree();
  const board=useMemo(()=>slab(8.85,8.85,.3),[]), trim=useMemo(()=>slab(8.98,8.98,.08),[]), table=useMemo(()=>woodTexture(),[]), texture=useMemo(()=>woodTexture(true),[]);
  const room=useMemo(roomGeometry,[]);useEffect(()=>()=>room.dispose(),[room]);
  useEffect(()=>()=>{board.dispose();trim.dispose();table.dispose();texture.dispose();},[board,trim,table,texture]);
  useEffect(()=>{const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(gl),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.22;room.dispose();pmrem.dispose();invalidate();return()=>{scene.environment=null;env.dispose();};},[gl,scene,invalidate]);
  useEffect(()=>{const lost=(e:Event)=>{e.preventDefault();p.onFailure();};gl.domElement.addEventListener('webglcontextlost',lost);return()=>gl.domElement.removeEventListener('webglcontextlost',lost);},[gl,p.onFailure]);
  useFrame(()=>{if(import.meta.env.DEV){gl.domElement.dataset.drawCalls=String(gl.info.render.calls);gl.domElement.dataset.triangles=String(gl.info.render.triangles);}});
  return <><Camera flip={p.flip} view={p.view}/><color attach='background' args={['#e8decb']}/><ambientLight intensity={.05}/><hemisphereLight args={['#fff4db','#95765b',.35]}/>
    <directionalLight position={[-7,14,6]} intensity={1.7} castShadow={!p.light} shadow-mapSize={[2048,2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.025} shadow-bias={-.00015} shadow-radius={3}/>
    <directionalLight position={[5,6,-8]} intensity={.4} color='#fff2dc'/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.41,0]} receiveShadow><planeGeometry args={[100,100]}/><meshStandardMaterial color='#ede6d5' map={table} roughness={.86}/></mesh>
    {!p.light&&<mesh geometry={room} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.8}/></mesh>}
    <mesh geometry={trim} position={[0,-.32,0]} castShadow receiveShadow><meshStandardMaterial color='#30291e' roughness={.58}/></mesh>
    <mesh geometry={board} position={[0,-.30,0]} castShadow receiveShadow><meshStandardMaterial color='#6c4830' roughness={.4}/></mesh>
    <group onClick={e=>{e.stopPropagation();if(!p.interactive)return;const f=Math.floor(e.point.x+4),r=Math.floor(4-e.point.z);if(f>=0&&f<8&&r>=0&&r<8)p.onPick(r*8+f);}}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,.11,0]} receiveShadow><planeGeometry args={[8.8,8.8]}/><meshStandardMaterial map={texture} roughness={.59}/></mesh>
      <Pieces {...p}/><Markers {...p}/>
    </group>
  </>;
}
export default function Board3D(p:BoardProps) { return <Canvas orthographic camera={{position:[0,13,11],near:.1,far:150,zoom:60}} role='img' aria-label='Bàn cờ vua 3D. Chọn quân rồi chọn ô đến. Chế độ 2D hỗ trợ bàn phím.' dpr={p.light?1:[1,1.75]} shadows={!p.light} frameloop='demand' gl={{antialias:true,powerPreference:'low-power'}}><Scene {...p}/></Canvas>; }
