import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import {MathUtils,PerspectiveCamera,Spherical,Vector3} from 'three';
import {boardOrbitDistance,boardPreset,frameBoardCamera,MIN_POLAR,MAX_POLAR,MIN_MAGNIFICATION,MAX_MAGNIFICATION} from './view';
import type {BoardFrame,BoardView} from './view';
import {STABLES} from './board';
import type {BoardGesture} from './boardGesture';

export type SeatProjection={color:number;x:number;y:number}[];
interface Props {
 view:BoardView;reset:number;frame?:BoardFrame;paused:boolean;reduced:boolean;
 gesture:BoardGesture;onManual:()=>void;onSeats:(positions:SeatProjection)=>void;
}
export function BoardCamera({view,reset,frame,paused,reduced,gesture,onManual,onSeats}:Props){
 const control=useRef<Controls>(null),{camera:rawCamera,size,gl,invalidate,scene}=useThree();
 const camera=rawCamera as PerspectiveCamera;
 const region=useMemo(()=>frame??{left:0,top:0,width:size.width,height:size.height},[frame,size.width,size.height]);
 const initialized=useRef(false),baseDistance=useRef(0),interacting=useRef(false);
 const reduceMotion=useRef(reduced);reduceMotion.current=reduced;
 const transition=useRef<{from:Spherical;to:Spherical;elapsed:number}|null>(null);
 const v=useMemo(()=>new Vector3(),[]),lastSeats=useRef('');

 useEffect(()=>{
  const canvas=gl.domElement,document=canvas.ownerDocument;
  const down=(e:PointerEvent)=>gesture.begin(e.pointerId,e.clientX,e.clientY);
  const move=(e:PointerEvent)=>gesture.move(e.pointerId,e.clientX,e.clientY);
  const up=(e:PointerEvent)=>gesture.end(e.pointerId);
  const cancel=(e:PointerEvent)=>gesture.cancel(e.pointerId);
  canvas.addEventListener('pointerdown',down,true);
  document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',cancel,true);
  return()=>{canvas.removeEventListener('pointerdown',down,true);document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('pointercancel',cancel,true);};
 },[gl,gesture]);

 // Preserve the orbit and relative dolly distance across layout changes.
 useEffect(()=>{
  frameBoardCamera(camera,size.width,size.height,region);
  const distance=boardOrbitDistance(camera,size.height,region),previous=baseDistance.current;
  if(previous>0){
   const ratio=distance/previous;camera.position.multiplyScalar(ratio);
   if(transition.current){transition.current.from.radius*=ratio;transition.current.to.radius*=ratio;}
  }
  baseDistance.current=distance;
  if(control.current){control.current.minDistance=distance/MAX_MAGNIFICATION;control.current.maxDistance=distance/MIN_MAGNIFICATION;}
  camera.updateMatrixWorld();invalidate();
 },[camera,size.width,size.height,region,invalidate]);

 useEffect(()=>{
  const controls=control.current;if(!controls)return;
  controls.enableDamping=false;controls.update();controls.enableDamping=!reduceMotion.current;
  controls.target.set(0,0,0);camera.up.set(0,1,0);
  const from=new Spherical().setFromVector3(camera.position),to=boardPreset(view,baseDistance.current);
  to.theta=from.theta+Math.atan2(Math.sin(to.theta-from.theta),Math.cos(to.theta-from.theta));
  transition.current={from,to,elapsed:0};
  if(!initialized.current||reduceMotion.current){camera.position.setFromSpherical(to);camera.lookAt(0,0,0);transition.current=null;initialized.current=true;}
  invalidate();
 },[view,reset,camera,invalidate]);

 useFrame((_,dt)=>{
  const controls=control.current;if(!controls)return;
  const moving=transition.current;
  if(moving&&!paused){
   moving.elapsed=reduced?.55:moving.elapsed+Math.min(dt,.05);const t=Math.min(1,moving.elapsed/.55),ease=t*t*(3-2*t);
   camera.position.setFromSpherical(new Spherical(MathUtils.lerp(moving.from.radius,moving.to.radius,ease),MathUtils.lerp(moving.from.phi,moving.to.phi,ease),MathUtils.lerp(moving.from.theta,moving.to.theta,ease)));
   camera.lookAt(0,0,0);
   if(t===1)transition.current=null;else invalidate();
  }
  // Free orbit belongs entirely to OrbitControls. Do not fit, change zoom/FOV,
  // or rescale the world as its projected outline changes.
  camera.updateMatrixWorld();
  const seats=STABLES.map(([x,z],color)=>{v.set(Math.sign(x)*9.25,.7,Math.sign(z)*9.25).project(camera);return{color,x:(v.x+1)*size.width/2-region.left,y:(1-v.y)*size.height/2-region.top};});
  const key=seats.map(p=>Math.round(p.x)+','+Math.round(p.y)).join(';');
  if(key!==lastSeats.current){lastSeats.current=key;onSeats(seats);}
  if(import.meta.env.DEV)gl.domElement.dataset.horseCamera=JSON.stringify({scene:scene.uuid,camera:camera.uuid,projection:camera.type,position:camera.position.toArray().map(n=>+n.toFixed(3)),distance:+camera.position.length().toFixed(4),fov:camera.fov,aspect:camera.aspect,zoom:+(baseDistance.current/camera.position.length()).toFixed(3),transition:!!transition.current});
 });

 return <OrbitControls ref={control} makeDefault enabled={!paused} enablePan={false} enableRotate enableZoom
  enableDamping={!reduced} dampingFactor={.12} rotateSpeed={.65} zoomSpeed={.7}
  minPolarAngle={MIN_POLAR} maxPolarAngle={MAX_POLAR}
  onStart={()=>{interacting.current=true;transition.current=null;gl.domElement.style.cursor='grabbing';}}
  onChange={()=>{if(interacting.current)onManual();invalidate();}}
  onEnd={()=>{interacting.current=false;gl.domElement.style.cursor='grab';}}/>;
}
