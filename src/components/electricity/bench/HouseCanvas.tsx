import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { APPLIANCES } from '../../../data/electricity/labs';
const CAMERA = { position: [11, 9, 16] as [
        number,
        number,
        number
    ], zoom: 47 };
export interface HouseProps {
    off: string[];
    ledCount: number;
    onToggle: (id: string) => void;
    onError: () => void;
}
function RoomScene({ off, ledCount, onToggle, onError }: HouseProps) {
    const { camera, gl, size } = useThree();
    useEffect(() => { camera.lookAt(0, 3, 0); const c = camera as any; c.zoom = Math.min(size.width / 12, size.height / 10); c.updateProjectionMatrix(); }, [camera, size.width, size.height]);
    useEffect(() => { const lost = (e: Event) => { e.preventDefault(); onError(); }; gl.domElement.addEventListener('webglcontextlost', lost); return () => gl.domElement.removeEventListener('webglcontextlost', lost); }, [gl, onError]);
    return <><color attach="background" args={['#e9e1ce']}/><ambientLight intensity={1.8}/><directionalLight position={[-7, 14, 9]} intensity={3}/>
 <RoundedBox args={[9.2, .35, 5.8]} radius={.16} position={[0, -.2, 0]}><meshStandardMaterial color="#93ada0"/></RoundedBox>
 {[0, 1, 2].map(floor => <group key={floor} position={[0, floor * 2.55, 0]}>
  <mesh position={[0, 0, 0]}><boxGeometry args={[8.5, .18, 5]}/><meshStandardMaterial color="#bf9f77"/></mesh>
  <mesh position={[0, 1.25, -2.4]}><boxGeometry args={[8.5, 2.4, .16]}/><meshStandardMaterial color={floor === 1 ? '#cad3bc' : '#eee3c9'}/></mesh>
  <mesh position={[-4.15, 1.25, 0]}><boxGeometry args={[.16, 2.4, 5]}/><meshStandardMaterial color="#d5c9af"/></mesh>
  <mesh position={[0, 1.25, -2.29]}><boxGeometry args={[.14, 2.4, .2]}/><meshStandardMaterial color="#b69d77"/></mesh>
  {[-2.2, 2.2].map(x => <group key={x} position={[x, 1.4, -2.27]}><mesh><boxGeometry args={[1.45, 1.1, .1]}/><meshStandardMaterial color="#7dada5"/></mesh><mesh><boxGeometry args={[.07, 1.1, .14]}/><meshStandardMaterial color="#f9eed3"/></mesh><mesh><boxGeometry args={[1.45, .07, .14]}/><meshStandardMaterial color="#f9eed3"/></mesh></group>)}
  <RoundedBox args={[1.6, .4, .7]} radius={.12} position={[-2.3, .4, -.6]}><meshStandardMaterial color={floor === 1 ? '#cb8d72' : '#6d9b8f'}/></RoundedBox>
  <RoundedBox args={[1.6, .7, .2]} radius={.08} position={[-2.3, .7, -1]}><meshStandardMaterial color={floor === 1 ? '#cb8d72' : '#6d9b8f'}/></RoundedBox>
  {APPLIANCES.filter(a => a.floor === floor).map((a, i, items) => {
                const x = -3.1 + i * (6.2 / Math.max(1, items.length - 1)), on = !off.includes(a.id), lamp = a.id.startsWith('lamp');
                return <group key={a.id} position={[x, .15, .65]}>
   {lamp ? <><mesh position={[0, .65, 0]}><cylinderGeometry args={[.04, .06, 1.25, 8]}/><meshStandardMaterial color="#967548"/></mesh><mesh position={[0, 1.32, 0]}><coneGeometry args={[.35, .4, 14, 1, true]}/><meshStandardMaterial color="#edc382" emissive="#ffd88b" emissiveIntensity={on ? .6 : 0}/></mesh><mesh position={[0, .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.65, 24]}/><meshBasicMaterial color="#ffd892" transparent opacity={on ? .32 : 0} depthWrite={false}/></mesh></> : a.id === 'fridge' ? <RoundedBox args={[.7, 1.7, .65]} radius={.08} position={[0, .85, 0]}><meshStandardMaterial color="#e5ece0"/></RoundedBox> : a.id === 'fan' ? <><mesh position={[0, .45, 0]}><cylinderGeometry args={[.05, .1, .8, 8]}/><meshStandardMaterial color="#40796f"/></mesh><mesh position={[0, .95, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.32, .07, 8, 16]}/><meshStandardMaterial color="#71ab9b"/></mesh></> : <RoundedBox args={[.95, .65, .2]} radius={.05} position={[0, .65, 0]}><meshStandardMaterial color={on ? '#567e76' : '#263f3a'} emissive="#b9d9c5" emissiveIntensity={on ? .15 : 0}/></RoundedBox>}
   <Html position={[0, -.12, .6]} center><button className={`ew-house-tag ${on ? 'is-on' : ''}`} onClick={() => onToggle(a.id)} aria-pressed={on}>{a.name}<small>{on ? (lamp && +a.id.slice(4) < ledCount ? 9 : a.powerW) + ' W' : 'Đã tắt'}</small></button></Html>
  </group>;
            })}
  <Html position={[4.5, 1, -2]} center style={{ pointerEvents: 'none' }}><span className="ew-floor-label">{floor + 1}</span></Html>
 </group>)}
 <mesh position={[0, 8, -.5]} rotation={[0, 0, .1]}><boxGeometry args={[9, .18, 5.8]}/><meshStandardMaterial color="#527e70"/></mesh>
 </>;
}
export default function HouseCanvas(props: HouseProps) { return <Canvas orthographic camera={CAMERA} dpr={[1, 1.5]} aria-label="Ngôi nhà ba tầng tương tác"><RoomScene {...props}/></Canvas>; }
