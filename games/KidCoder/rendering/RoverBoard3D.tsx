import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Board, ChapterId, World } from '../engine/model';
import { Batch } from '../../../src/components/planetmaker/rendering/Instances';
import type { Shape } from '../../../src/components/planetmaker/rendering/architecture';
import { objectParts, roverParts, terrainParts } from './assetAdapter';

export type Quality = 'light' | 'balanced' | 'detailed';
export interface BoardProps { board: Board; world: World; chapter: ChapterId; color: string; reduced: boolean; scanning: boolean; moving: boolean; quality: Quality; onUnavailable: () => void; onSlow?: () => void }
function Parts({ parts }: { parts: ReturnType<typeof objectParts> }) {
    return <>{Object.entries(parts).filter(([,v]) => v.length).map(([shape,items]) => <Batch key={shape} shape={shape as Shape} items={items}/>)}</>;
}
function Camera({ board, onUnavailable }: Pick<BoardProps, 'board' | 'onUnavailable'>) {
    const { camera, size, gl, invalidate } = useThree();
    useLayoutEffect(() => {
        const c = camera as THREE.OrthographicCamera;
        c.position.set(5, 10, 7); c.lookAt(0,0,0); c.zoom = Math.min(size.width / (board.size * 1.7), size.height / (board.size * 1.55)); c.updateProjectionMatrix(); invalidate();
    }, [camera, size, board.size, invalidate]);
    useEffect(() => {
        const canvas = gl.domElement;
        const lost = (e: Event) => { e.preventDefault(); onUnavailable(); };
        canvas.addEventListener('webglcontextlost', lost); return () => canvas.removeEventListener('webglcontextlost', lost);
    }, [gl, onUnavailable]);
    return null;
}
function Rover({ board, world, color, reduced, scanning, moving, quality, onSlow }: BoardProps) {
    const group = useRef<THREE.Group>(null), wheels = useRef<THREE.Group>(null), beam = useRef<THREE.Mesh>(null);
    const invalidate = useThree(s => s.invalidate), body = useMemo(() => roverParts(color), [color]);
    const lastTime = useRef(0), frameWindow = useRef<number[]>([]);
    const degraded = useRef(false);
    useEffect(()=>{degraded.current=false;frameWindow.current=[];},[quality]);
    const offset = board.size / 2 - .5, x = world.rover.x-offset, z = world.rover.y-offset, angle = -world.direction * Math.PI / 2;
    useEffect(() => { lastTime.current = performance.now(); invalidate(); }, [world, scanning, reduced, invalidate]);
    useLayoutEffect(() => { if (group.current) { group.current.position.set(x, .15, z); group.current.rotation.y = angle; } }, [board]);
    useFrame(({ gl }, dt) => {
        const g = group.current; if (!g) return;
        const distance = Math.hypot(g.position.x-x, g.position.z-z), delta = Math.atan2(Math.sin(angle-g.rotation.y), Math.cos(angle-g.rotation.y));
        const factor = reduced ? 1 : 1 - Math.exp(-Math.min(dt, .05) * 14);
        g.position.x += (x-g.position.x) * factor; g.position.z += (z-g.position.z) * factor; g.rotation.y += delta * factor;
        if (wheels.current && distance > .004) wheels.current.children.forEach(w => { w.rotation.x += distance * factor * 5; });
        const progress = Math.min(1, (performance.now()-lastTime.current)/500);
        if (beam.current) { beam.current.visible = scanning && !reduced && progress < 1; beam.current.scale.x = 1 + Math.sin(progress*Math.PI)*.45; }
        if (distance > .002 || Math.abs(delta) > .002 || (scanning && progress < 1 && !reduced)) invalidate();
        if (moving && dt > 0 && dt < .1) {
            frameWindow.current.push(dt * 1000); if (frameWindow.current.length > 120) frameWindow.current.shift();
            if (quality!=='light' && !degraded.current && frameWindow.current.length>=60) {
                const sorted=[...frameWindow.current].sort((a,b)=>a-b);
                if(sorted[Math.floor(sorted.length*.9)]>45){degraded.current=true;onSlow?.();}
            }
        }
        if (import.meta.env.DEV && gl.domElement.parentElement) {
            const sorted = [...frameWindow.current].sort((a,b)=>a-b);
            gl.domElement.parentElement.dataset.kidcoderMetrics = JSON.stringify({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, p95: sorted[Math.floor(sorted.length*.95)] || 0 });
        }
    });
    return <group ref={group}>
        <mesh rotation-x={-Math.PI/2} position={[0,.008,0]}><circleGeometry args={[.42,20]}/><meshBasicMaterial color="#172d40" transparent opacity={.26} depthWrite={false}/></mesh>
        <Parts parts={body}/>
        <group ref={wheels}>{[-1,1].flatMap(side => [-.23,0,.23].map(z => <group key={`${side}:${z}`} position={[side*.29,.19,z]}><mesh rotation-z={Math.PI/2} castShadow><cylinderGeometry args={[.13,.13,.12,10]}/><meshStandardMaterial color="#26364a" roughness={.9}/></mesh><mesh rotation-z={Math.PI/2} position={[side*.067,0,0]}><cylinderGeometry args={[.07,.07,.01,6]}/><meshStandardMaterial color="#a9c2cc"/></mesh></group>))}</group>
        <mesh position={[0,.92,-.06]} rotation-x={-Math.PI/2}><coneGeometry args={[.105,.22,3]}/><meshBasicMaterial color="#f9f4be"/></mesh>
        <mesh ref={beam} position={[0,.34,-.68]} rotation-x={-Math.PI/2} visible={false}><coneGeometry args={[.25,.65,16,1,true]}/><meshBasicMaterial color="#83f7de" transparent opacity={.3} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    </group>;
}
function Scene(props: BoardProps) {
    const { board, world, chapter, quality } = props;
    const terrain = useMemo(() => terrainParts(board, chapter, quality !== 'light'), [board, chapter, quality]);
    const objects = useMemo(() => objectParts(board, world), [board, world]);
    const offset = board.size / 2 - .5;
    return <>
        <Camera board={board} onUnavailable={props.onUnavailable}/>
        <ambientLight intensity={1.15}/><hemisphereLight args={['#e9f5ff','#65736a',1.2]}/>
        <directionalLight position={[-5,10,4]} intensity={2.3} castShadow={quality !== 'light'} shadow-mapSize={quality === 'detailed' ? [2048,2048] : [1024,1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-.001}/>
        <Parts parts={terrain}/><Parts parts={objects}/>
        <group position={[board.exit.x-offset,.16,board.exit.y-offset]}>
            <mesh rotation-x={-Math.PI/2}><ringGeometry args={[.23,.35,24]}/><meshBasicMaterial color="#fff3a2" side={THREE.DoubleSide}/></mesh>
            <mesh position={[.34,.28,-.3]}><cylinderGeometry args={[.025,.025,.6,6]}/><meshStandardMaterial color="#f5e6b2"/></mesh>
            <mesh position={[.47,.5,-.3]}><boxGeometry args={[.27,.17,.025]}/><meshBasicMaterial color="#71e7c6"/></mesh>
        </group>
        <Rover {...props}/>
    </>;
}
export default function RoverBoard3D(props: BoardProps) {
    return <Canvas orthographic camera={{ position: [5,10,7], near: .1, far: 100 }} frameloop="demand" dpr={props.quality === 'light' ? 1 : [1,props.quality === 'balanced' ? 1.5 : 2]} shadows={props.quality !== 'light'} gl={{ antialias: props.quality !== 'light', alpha: true, powerPreference: 'low-power' }} role="img" aria-label="Bàn thám hiểm 3D. Rover đi theo các lệnh trong chương trình."><Scene {...props}/></Canvas>;
}
