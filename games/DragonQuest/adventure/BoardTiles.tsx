import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Session } from './model';
import { WorldNode } from './worldLayout';
import { TILE_STYLE } from './content';

/** One instanced draw for every tile; one atlas draw for all fifty labels. */
export function BoardTiles({map,session}:{map:WorldNode[];session?:Session}){
 const ref=useRef<THREE.InstancedMesh>(null),invalidate=useThree(s=>s.invalidate);
 const atlas=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d')!;
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  map.forEach((n,i)=>{
   const col=i%8,row=Math.floor(i/8),style=TILE_STYLE[n.kind],x=col*128,y=row*128;
   ctx.fillStyle=style.ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 60px Arial';ctx.fillText(String(i+1).padStart(2,'0'),x+64,y+43);
   ctx.font='bold 39px Segoe UI Symbol, Arial';ctx.fillText(style.symbol,x+64,y+98);
   const h=.43,offset=i*4,yTop=n.y+.19;positions.push(n.x-h,yTop,n.z+h,n.x+h,yTop,n.z+h,n.x+h,yTop,n.z-h,n.x-h,yTop,n.z-h);
   const u=col/8,v=1-(row+1)/8;uvs.push(u,v,u+1/8,v,u+1/8,v+1/8,u,v+1/8);indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);
  });
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return {geometry,texture};
 },[map]);
 useEffect(()=>()=>{atlas.geometry.dispose();atlas.texture.dispose();},[atlas]);
 useEffect(()=>{if(!ref.current)return;const d=new THREE.Object3D(),c=new THREE.Color();map.forEach((n,i)=>{d.position.set(n.x,n.y,n.z);d.scale.set(1,.36,1);d.updateMatrix();ref.current!.setMatrixAt(i,d.matrix);const target=session&&['rolling','moving','landing'].includes(session.phase)&&session.target===i;ref.current!.setColorAt(i,c.set(target?'#ffe093':TILE_STYLE[n.kind].color));});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();invalidate();},[map,session?.target,session?.phase,invalidate]);
 const path=useMemo(()=>new THREE.CatmullRomCurve3(map.map(n=>new THREE.Vector3(n.x,n.y-.18,n.z))),[map]);
 return <><mesh receiveShadow><tubeGeometry args={[path,196,.16,5,false]}/><meshStandardMaterial color="#c6a96f" roughness={1}/></mesh><instancedMesh ref={ref} args={[undefined,undefined,map.length]} receiveShadow castShadow><cylinderGeometry args={[.64,.7,1,12]}/><meshStandardMaterial roughness={.88}/></instancedMesh><mesh geometry={atlas.geometry}><meshBasicMaterial map={atlas.texture} transparent depthWrite={false}/></mesh></>;
}

