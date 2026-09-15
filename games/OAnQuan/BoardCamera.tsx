import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import type {PerspectiveCamera} from 'three';
import {boardDistance,boardCameraPosition,introTargets,introPose,INTRO_SECONDS} from './cameraIntro';
import type {BoardProps} from './Board3D';
import type {BoardGesture} from '../HorseRace/boardGesture';

type Props=Pick<BoardProps,'view'|'reset'|'paused'|'selected'|'intro'|'matchId'|'position'|'onIntroEnd'|'reduced'>&{gesture:BoardGesture};
export function BoardCamera({view,reset,paused,selected,intro,matchId,position,onIntroEnd,reduced,gesture}:Props){
 const {camera:rawCamera,size,invalidate,gl}=useThree(),controls=useRef<Controls>(null),flight=useRef<{elapsed:number}|null>(null);
 const camera=rawCamera as PerspectiveCamera,distance=boardDistance(size.width/size.height),flying=intro&&!reduced;
 // Snapshot the opening pieces so subsequent moves never restart or redirect the intro.
 const targets=useMemo(()=>introTargets(position),[matchId]);
 const applyPose=(progress:number)=>{const pose=introPose(progress,view,distance,targets);camera.position.copy(pose.position);controls.current?.target.copy(pose.target);camera.lookAt(pose.target);};
 useEffect(()=>{
  if(flying)flight.current={elapsed:0};else flight.current=null;
  invalidate();
 },[flying,matchId,invalidate]);
 useEffect(()=>{
  camera.fov=38;camera.updateProjectionMatrix();
  if(controls.current){controls.current.minDistance=flying?.1:distance/1.45;controls.current.maxDistance=flying?distance*2:distance*1.15;}
  if(flying)applyPose((flight.current?.elapsed??0)/INTRO_SECONDS);
  else{camera.position.copy(boardCameraPosition(view,distance));controls.current?.target.set(0,0,0);camera.lookAt(0,0,0);}
  controls.current?.update();invalidate();
 },[camera,distance,view,reset,flying,matchId,invalidate]);
 useFrame((_,dt)=>{
  if(flight.current&&!paused){
   flight.current.elapsed+=Math.min(dt,.05);const t=Math.min(1,flight.current.elapsed/INTRO_SECONDS);applyPose(t);
   if(t===1){flight.current=null;onIntroEnd();}else invalidate();
  }
  if(import.meta.env.DEV)gl.domElement.dataset.oaqCamera=JSON.stringify({position:camera.position.toArray(),target:controls.current?.target.toArray(),aspect:camera.aspect,size,zoom:camera.zoom,intro:!!flight.current,introSeconds:INTRO_SECONDS,introProgress:flight.current?flight.current.elapsed/INTRO_SECONDS:1});
 });
 useEffect(()=>{const c=gl.domElement,d=c.ownerDocument;const down=(e:PointerEvent)=>gesture.begin(e.pointerId,e.clientX,e.clientY),move=(e:PointerEvent)=>gesture.move(e.pointerId,e.clientX,e.clientY),up=(e:PointerEvent)=>gesture.end(e.pointerId),cancel=(e:PointerEvent)=>gesture.cancel(e.pointerId);c.addEventListener('pointerdown',down,true);d.addEventListener('pointermove',move,true);d.addEventListener('pointerup',up,true);d.addEventListener('pointercancel',cancel,true);return()=>{c.removeEventListener('pointerdown',down,true);d.removeEventListener('pointermove',move,true);d.removeEventListener('pointerup',up,true);d.removeEventListener('pointercancel',cancel,true);};},[gl,gesture]);
 return <OrbitControls ref={controls} makeDefault enabled={!paused&&!flying&&selected===null} enablePan={false} enableDamping={false} minAzimuthAngle={flying?-Infinity:-.42} maxAzimuthAngle={flying?Infinity:.42} minPolarAngle={.001} maxPolarAngle={flying?Math.PI/2:Math.PI*.28} rotateSpeed={.45} zoomSpeed={.6}/>;
}
