import React, { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CLAYS, GLAZES } from '../model';
import { clamp, openVessel, radiusAt, referenceShape, sculpt, setHeight } from '../engine/profile';
import { StudioController } from '../state/studioController';
import { silhouette, vesselGeometry } from './vesselGeometry';
import { PaintSurface, clayBump } from './paintTexture';
import { createCavityMaterial } from './cavityMaterial';
import { claySurface, wheelTexture } from './wheelTexture';

export interface SceneAPI { photo: () => Promise<Blob>; info: () => { calls: number; triangles: number; textures: number; geometries: number } }
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="pt-canvas-error">Thiết bị chưa mở được cảnh 3D. Bản gốm vẫn được giữ; em có thể xuất bản sao bằng nút phía trên.</div> : this.props.children; }
}
function Lighting() {
  const { gl,scene }=useThree();
  useEffect(()=>{const generator=new THREE.PMREMGenerator(gl), room=new RoomEnvironment(),target=generator.fromScene(room,.04);scene.environment=target.texture;return()=>{scene.environment=null;target.dispose();room.dispose();generator.dispose();};},[gl,scene]);
  return <><ambientLight intensity={.18}/><hemisphereLight args={['#fff8e5','#9f8a77',.65]}/><directionalLight position={[-3,6,4]} intensity={2.4} castShadow shadow-mapSize={[2048,2048]} shadow-camera-near={.1} shadow-camera-far={16} shadow-camera-left={-3.3} shadow-camera-right={3.3} shadow-camera-top={4} shadow-camera-bottom={-3} shadow-bias={-.0001}/><directionalLight position={[4,3,-2]} intensity={.7} color="#b7d9cf"/></>;
}
function WorkshopEnvironment({ kiln, backdrop }: { kiln: boolean; backdrop: string }) {
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.62,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color={backdrop}/></mesh>
    <mesh position={[0,-.36,0]} castShadow receiveShadow><cylinderGeometry args={[2.6,2.65,.18,80]}/><meshStandardMaterial color="#b58d68" roughness={.85}/></mesh>
    <mesh position={[0,-.23,0]} castShadow receiveShadow><cylinderGeometry args={[1.8,1.85,.12,80]}/><meshStandardMaterial color="#667f72" metalness={.12} roughness={.5}/></mesh>
    {[0,1,2].map(i=><group key={i} position={[-2.05+i*.35,-.2,-1.2]}><mesh castShadow><cylinderGeometry args={[.16,.13,.28,24]}/><meshStandardMaterial color={['#d5a05e','#7aa68e','#c1d0ca'][i]}/></mesh><mesh position={[0,.145,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.12,24]}/><meshStandardMaterial color={['#bc7543','#416b66','#e8ddc4'][i]} roughness={.25}/></mesh></group>)}
    <group position={[2.15,-.15,-.7]} rotation={[0,0,-.35]}><mesh castShadow><cylinderGeometry args={[.035,.035,.8,12]}/><meshStandardMaterial color="#d8b982"/></mesh><mesh position={[0,.47,0]}><cylinderGeometry args={[.05,.07,.18,12]}/><meshStandardMaterial color="#6c4b33"/></mesh></group>
    <mesh position={[-2,-.2,.9]} rotation={[0,.3,0]}><boxGeometry args={[.42,.12,.32]}/><meshStandardMaterial color="#d9b863" roughness={1}/></mesh>
    {kiln && <group position={[0,0,-2.65]}><mesh position={[0,1.35,0]}><boxGeometry args={[3.5,3.6,.3]}/><meshStandardMaterial color="#a66c4b" emissive="#f08334" emissiveIntensity={.35}/></mesh><pointLight position={[0,2,-1.5]} color="#ffb35c" intensity={9} distance={8}/></group>}
  </group>;
}
function Vessel({ controller: c, low, reference, api, backdrop, flowers }: { controller: StudioController; low: boolean; reference?: string; api: React.MutableRefObject<SceneAPI | null>; backdrop: string; flowers: boolean }) {
  const { gl,camera,scene,invalidate }=useThree();
  const vessel=useRef<THREE.Mesh>(null),wheel=useRef<THREE.Group>(null),controls=useRef<any>(null),halo=useRef<THREE.Mesh>(null);
  const [lost,setLost]=useState(false);
  const resources=useMemo(()=>({geometry:vesselGeometry(c.doc.shape,low?64:96).geometry,paint:new PaintSurface(low?512:1024),bump:clayBump(),clay:claySurface(),wheel:wheelTexture(),outer:new THREE.MeshPhysicalMaterial({envMapIntensity:.75}),rim:new THREE.MeshStandardMaterial({envMapIntensity:.75}),inner:createCavityMaterial()}),[c,low]);
  const seen=useRef({shape:-1,paint:-1}),rotation=useRef(0),speed=useRef(0),hidden=useRef(document.hidden);
  const release=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const drag=useRef<{id:number;x:number;y:number;startX:number;startY:number;at:number;scale:number;side:number;kind:string;since:number;moved:boolean;px:number;py:number}|null>(null);
  const hitRay=useMemo(()=>new THREE.Raycaster(),[]),pointer=useMemo(()=>new THREE.Vector2(),[]);
  const hit=(x:number,y:number)=>{const rect=gl.domElement.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);hitRay.setFromCamera(pointer,camera);vessel.current?.updateWorldMatrix(true,false);return vessel.current?hitRay.intersectObject(vessel.current,false)[0]:undefined;};
  const stop=()=>{const d=drag.current;if(d){try{gl.domElement.releasePointerCapture(d.id);}catch{}drag.current=null;c.end();if(halo.current)halo.current.visible=false;}};
  const paintAt=(x:number,y:number,start=false)=>{
    const h=hit(x,y);if(!h||h.face?.materialIndex!==0||!h.uv){c.activeStroke=undefined;return;}
    const p=vessel.current!.worldToLocal(h.point.clone());
    c.point({u:clamp(h.uv.x,0,1),v:clamp(h.uv.y,0,1),radius:Math.hypot(p.x,p.z)},start);
  };
  useEffect(()=>{
    const el=gl.domElement;
    const down=(e:PointerEvent)=>{
      if(e.button!==0||c.busy||!['shaping','decorating'].includes(c.doc.stage)||c.tool==='view')return;
      if(drag.current){stop();return;}
      const h=hit(e.clientX,e.clientY);if(!h)return;
      const p=vessel.current!.worldToLocal(h.point.clone()),rect=el.getBoundingClientRect();
      const center=new THREE.Vector3(0,p.y,0).project(camera),screenX=rect.left+(center.x+1)*rect.width/2;
      const scale=2*camera.position.length()*Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov/2))/(rect.height*camera.zoom);
      let kind:string=c.tool;
      if(c.doc.stage==='shaping'&&kind==='shape'&&p.y>c.doc.shape.height-.16)kind='height';
      if(c.doc.stage==='decorating'&&h.face?.materialIndex!==0)return;
      e.preventDefault();el.setPointerCapture(e.pointerId);c.begin();invalidate();
      drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,at:clamp(p.y/c.doc.shape.height,0,1),scale,side:e.clientX>=screenX?1:-1,kind,since:performance.now(),moved:false,px:e.clientX,py:e.clientY};
      if(c.doc.stage==='decorating'){paintAt(e.clientX,e.clientY,true);if(c.tool==='stamp'||c.tool==='band'){stop();return;}}
      if(kind==='open'){if(c.doc.shape.depth<=.01)openVessel(c.doc.shape);c.skill('open');c.changed(true);}
      if(halo.current&&c.doc.stage==='shaping'){halo.current.visible=true;halo.current.position.y=p.y;}
    };
    const move=(e:PointerEvent)=>{
      const d=drag.current;if(!d||d.id!==e.pointerId)return;
      const dx=e.clientX-d.x,dy=e.clientY-d.y;d.px=e.clientX;d.py=e.clientY;
      if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>7)d.moved=true;
      if(c.doc.stage==='shaping'){
        const strength=c.assistance==='easy'?.65:c.assistance==='precise'?1.15:1;
        if(d.kind==='height'){setHeight(c.doc.shape,c.doc.shape.height-dy*d.scale*strength);c.skill('height');}
        else if(d.kind==='open'){c.doc.shape.depth=clamp(c.doc.shape.depth+dy*d.scale,.15,c.doc.shape.height-.13);sculpt(c.doc.shape,1,dx*d.side*d.scale*.4);c.skill('open');}
        else if(d.kind==='smooth'){sculpt(c.doc.shape,d.at,.018,.16,true);c.skill('smooth');}
        else if(d.moved){sculpt(c.doc.shape,d.at,dx*d.side*d.scale*strength,c.assistance==='easy'?.2:.13);c.skill('shape');}
        c.changed(true);
      }else paintAt(e.clientX,e.clientY);
      d.x=e.clientX;d.y=e.clientY;invalidate();
    };
    const up=(e:PointerEvent)=>{if(drag.current?.id===e.pointerId)stop();};
    const visibility=()=>{hidden.current=document.hidden;if(hidden.current)stop();invalidate();};
    const loss=(e:Event)=>{e.preventDefault();stop();setLost(true);};const restore=()=>{seen.current={shape:-1,paint:-1};setLost(false);invalidate();};
    el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',visibility);el.addEventListener('webglcontextlost',loss);el.addEventListener('webglcontextrestored',restore);
    const unsubscribe=c.subscribe(()=>invalidate());
    const checkpoint=setInterval(()=>{if(c.editing&&c.dirty)void c.flush();},2000);
    api.current={photo:()=>new Promise((resolve,reject)=>{if(lost){reject(Error('Cảnh 3D đang phục hồi. Hãy thử lại sau.'));return;}gl.render(scene,camera);gl.domElement.toBlob(blob=>blob?resolve(blob):reject(Error('Chưa chụp được ảnh.')),'image/png');}),info:()=>({calls:gl.info.render.calls,triangles:gl.info.render.triangles,textures:gl.info.memory.textures,geometries:gl.info.memory.geometries})};
    return()=>{stop();unsubscribe();clearInterval(checkpoint);api.current=null;el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('lostpointercapture',up);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',visibility);el.removeEventListener('webglcontextlost',loss);el.removeEventListener('webglcontextrestored',restore);};
  },[c,gl,camera,scene,lost]);
  useEffect(()=>{clearTimeout(release.current);return()=>{release.current=setTimeout(()=>{resources.geometry.dispose();resources.paint.dispose();resources.bump.dispose();resources.clay.dispose();resources.wheel.dispose();resources.outer.dispose();resources.rim.dispose();resources.inner.dispose();},0);};},[resources]);
  useEffect(()=>{camera.position.set(...(c.cameraView==='inside'?[2.8,8.2,5.8]:[4.6,5.3,7.2]) as [number,number,number]);controls.current?.target.set(0,1.45,0);controls.current?.update();invalidate();},[c.cameraView,camera,invalidate]);
  useFrame((_,dt)=>{
    if(hidden.current||lost)return;
    const d=drag.current,delta=Math.min(dt,.05),art=c.doc;
    const turning=!c.reduced&&(c.spinning||art.stage==='firing');
    const targetSpeed=turning?(art.stage==='shaping'?(d ? .95 : 1.45):.3):0;
    // A little inertia when shaping; painting and reduced motion stop immediately.
    speed.current=c.reduced||(!turning&&art.stage!=='shaping')?0:THREE.MathUtils.damp(speed.current,targetSpeed,3.5,delta);
    if(!turning&&speed.current<.002)speed.current=0;
    rotation.current=(rotation.current+delta*speed.current)%(Math.PI*2);
    if(wheel.current)wheel.current.rotation.y=rotation.current;
    if(d&&art.stage==='shaping'&&d.kind==='shape'&&!d.moved&&performance.now()-d.since>170){sculpt(art.shape,d.at,-delta*(c.assistance==='easy'?.075:.12),.14);c.skill('pinch');c.changed(true);}
    if(d&&art.stage==='decorating'&&c.spinning&&!c.reduced&&(c.tool==='brush'||c.tool==='erase'))paintAt(d.px,d.py);
    if(d&&halo.current&&art.stage==='shaping'){const radius=radiusAt(art.shape,d.at)+.025;halo.current.scale.setScalar(radius/1.59);halo.current.position.y=d.at*art.shape.height;}
    if(seen.current.shape!==c.shapeVersion){vesselGeometry(art.shape,low?64:96,resources.geometry);camera.zoom=.85*Math.min(1,2.4/art.shape.height);camera.updateProjectionMatrix();seen.current.shape=c.shapeVersion;}
    if(art.stage!=='shaping'&&art.stage!=='preparing'&&seen.current.paint!==c.paintVersion){resources.paint.update(art);seen.current.paint=c.paintVersion;}
    const clay=CLAYS.find(v=>v.id===art.clay)!,glaze=GLAZES.find(v=>v.id===art.glaze)!,shaping=art.stage==='shaping',dry=art.stage==='preparing',painted=!shaping&&!dry;
    const m=resources.outer;
    if(m.map!==(painted?resources.paint.texture:resources.clay)){m.map=painted?resources.paint.texture:resources.clay;m.needsUpdate=true;}
    const glazed=c.preview||art.stage==='reveal'||art.stage==='finished';
    m.color.set(shaping?clay.wet:dry?clay.dry:'#ffffff');m.roughness=shaping?.42:dry?.95:glazed?glaze.roughness:.85;m.clearcoat=shaping?.25:low?0:glazed?glaze.coat:0;m.clearcoatRoughness=.18;m.bumpMap=resources.bump;m.bumpScale=shaping?.016:.003;
    resources.inner.color.set(shaping?clay.wet:dry?clay.dry:art.decoration.insideColor);resources.inner.roughness=m.roughness;
    resources.rim.color.copy(resources.inner.color);resources.rim.roughness=m.roughness;
    if(turning||speed.current>0||d)invalidate();
  });
  const target=useMemo(()=>reference?referenceShape(reference):null,[reference]);
  const reviewing=['reveal','finished'].includes(c.doc.stage),kiln=c.doc.stage==='firing';
  return <>
    <color attach="background" args={[backdrop]}/><fog attach="fog" args={[backdrop,12,28]}/><Lighting/>
    <WorkshopEnvironment kiln={kiln} backdrop={backdrop}/>
    <group ref={wheel}>
      <mesh position={[0,-.09,0]} castShadow receiveShadow><cylinderGeometry args={[1.74,1.74,.16,80]}/><meshStandardMaterial color="#8f998a" metalness={.35} roughness={.42}/></mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.009,0]} receiveShadow><circleGeometry args={[1.72,80]}/><meshStandardMaterial map={resources.wheel} roughness={.57} metalness={.08}/></mesh>
      {[.5,.9,1.3,1.6].map(r=><mesh key={r} rotation={[-Math.PI/2,0,0]} position={[0,-.008,0]}><ringGeometry args={[r,r+.009,96]}/><meshBasicMaterial color="#998c76" transparent opacity={.38}/></mesh>)}
      {[0,1,2].map(i=><mesh key={i} position={[Math.cos(i*Math.PI*2/3)*1.66,-.007,Math.sin(i*Math.PI*2/3)*1.66]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.025,12]}/><meshStandardMaterial color="#667368" metalness={.5} roughness={.4}/></mesh>)}
      <mesh ref={vessel} geometry={resources.geometry} material={[resources.outer,resources.rim,resources.inner]} castShadow receiveShadow/>
      {reviewing&&flowers&&c.doc.shape.depth>0&&<group position={[0,c.doc.shape.height-.2,0]}><mesh position={[.04,.45,0]} rotation={[0,0,-.14]}><cylinderGeometry args={[.018,.023,1.1,8]}/><meshStandardMaterial color="#627a52"/></mesh>{[0,1,2,3,4].map(i=><mesh key={i} position={[.13+Math.cos(i*1.256)*.12,1+Math.sin(i*1.256)*.12,0]}><sphereGeometry args={[.12,16,12]}/><meshStandardMaterial color="#e8be75"/></mesh>)}</group>}
    </group>
    <mesh ref={halo} visible={false} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.58,1.6,80]}/><meshBasicMaterial color="#f7dc9a" transparent opacity={.65} side={THREE.DoubleSide}/></mesh>
    {target&&c.doc.stage==='shaping'&&<group position={[0,.01,0]}><Line points={silhouette(target)} color="#f1c766" lineWidth={2} dashed dashSize={.06} gapSize={.035}/><Line points={silhouette(target).map(p=>new THREE.Vector3(-p.x,p.y,p.z))} color="#f1c766" lineWidth={2} dashed dashSize={.06} gapSize={.035}/></group>}
    <OrbitControls ref={controls} enabled={c.tool==='view'||reviewing} target={[0,1.45,0]} minDistance={4} maxDistance={12} minPolarAngle={.15} maxPolarAngle={Math.PI*.48} enablePan={false} enableDamping/>
  </>;
}
export function StudioCanvas({ controller, api, reference, backdrop='#eee9de', flowers=false }: { controller: StudioController; api: React.MutableRefObject<SceneAPI|null>; reference?: string; backdrop?: string; flowers?: boolean }) {
  const low=useMemo(()=>new URLSearchParams(location.search).get('tier')==='low'||((navigator as Navigator&{deviceMemory?:number}).deviceMemory??8)<=4,[]);
  return <CanvasBoundary><Canvas shadows={!low} dpr={low?[1,1.25]:[1,1.5]} camera={{position:[4.6,5.3,7.2],fov:39}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} frameloop="demand" fallback={<div className="pt-canvas-error">Trình duyệt chưa hỗ trợ cảnh 3D. Em vẫn có thể xuất bản sao tác phẩm.</div>}><Vessel controller={controller} low={low} reference={reference} api={api} backdrop={backdrop} flowers={flowers}/></Canvas></CanvasBoundary>;
}
