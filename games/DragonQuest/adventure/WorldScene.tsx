import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Quality, RegionId, Session, rng } from './model';
import { createMap, regionOf } from './content';
import { BoardTiles } from './BoardTiles';
import { CameraMode, WorldNode, worldLayout, worldBounds } from './worldLayout';
import { WorldCamera } from './WorldCamera';
import { regionMood } from './art';
import { buildScenery, SceneryPart as Part } from './scenery';

export interface WorldProps {
    missionId: string; seed: number; session?: Session; quality: Quality; reduced: boolean; heroColor: string;
    cameraMode?: CameraMode; overview?: boolean; recenter?: number; blocked?: boolean;
    onReady: () => void; onUnavailable: () => void; onSlow: () => void;
}
const BASE = import.meta.env.BASE_URL + 'dragon/';

function Instances({ parts, shape }: { parts: Part[]; shape: Part['shape'] }) {
    const ref = useRef<THREE.InstancedMesh>(null), invalidate = useThree(s => s.invalidate);
    useEffect(() => {
        if (!ref.current) return;
        const d = new THREE.Object3D(), c = new THREE.Color();
        parts.forEach((p, i) => { d.position.set(...p.p); d.scale.set(...p.s); d.rotation.set(0, i * 2.4, shape === 'crystal' ? .13 : 0); d.updateMatrix(); ref.current!.setMatrixAt(i, d.matrix); ref.current!.setColorAt(i, c.set(p.color)); });
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
        ref.current.computeBoundingSphere(); invalidate();
    }, [parts, shape, invalidate]);
    if (!parts.length) return null;
    return <instancedMesh ref={ref} args={[undefined, undefined, parts.length]} castShadow={shape !== 'pool'} receiveShadow>
        {shape === 'leaf' ? <icosahedronGeometry args={[1, 1]} /> : shape === 'cone' ? <coneGeometry args={[1, 1, 9]} /> : shape === 'pool' ? <cylinderGeometry args={[1, 1, 1, 24]} /> : shape === 'trunk' ? <cylinderGeometry args={[.7, 1, 1, 7]} /> : <octahedronGeometry args={[1, 0]} />}
        <meshStandardMaterial roughness={shape === 'crystal' || shape === 'pool' ? .3 : .9} metalness={shape === 'crystal' ? .15 : 0} emissive={shape === 'crystal' ? '#54868c' : '#000000'} emissiveIntensity={.15} flatShading />
    </instancedMesh>;
}


function groundTexture(color:string){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const context=canvas.getContext('2d')!;
 context.fillStyle=color;context.fillRect(0,0,128,128);const random=rng(937),tone=new THREE.Color();
 for(let i=0;i<450;i++){tone.set(color).offsetHSL(0,0,(random()-.5)*.08);context.fillStyle='#'+tone.getHexString();context.beginPath();context.ellipse(random()*128,random()*128,1+random()*5,1+random()*3,random()*3,0,Math.PI*2);context.fill();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);texture.anisotropy=2;return texture;
}

function Landscape({ id, nodes, seed, quality, still }: { id: RegionId; nodes: WorldNode[]; seed: number; quality: Quality; still:boolean }) {
    const mood = regionMood[id];
    const texture=useMemo(()=>groundTexture(mood.ground),[mood.ground]);
    useEffect(()=>()=>texture.dispose(),[texture]);
    const {parts, islands} = useMemo(() => buildScenery(id, nodes, seed, quality), [id, nodes, seed, quality]);
    const grouped = useMemo(() => (['leaf', 'cone', 'rock', 'trunk', 'crystal', 'pool'] as const).map(shape => ({ shape, parts: parts.filter(p => p.shape === shape) })), [parts]);
    return <>
        {islands.map(({x,z,y,rx,rz},i)=><group key={i} position={[x,y,z]}>
             <mesh receiveShadow scale={[rx,1,rz]}><cylinderGeometry args={[1,.96,.75,32]}/><meshStandardMaterial map={texture} roughness={1}/></mesh>
             <mesh position={[0,-1.2,0]} scale={[rx,1,rz]}><cylinderGeometry args={[.96,.65,2,11]}/><meshStandardMaterial color={mood.rock} roughness={1} flatShading/></mesh>
             <mesh position={[0,-2.7,0]} rotation-z={Math.PI} scale={[rx,1,rz]}><coneGeometry args={[.66,2.5,9]}/><meshStandardMaterial color={mood.rock} flatShading/></mesh>
             {i%2===0&&id!=='castle'&&<group position={[rx*.98,-1.8,0]}>
               <mesh><boxGeometry args={[.5,4.4,.15]}/><meshStandardMaterial color={id==='snow'?'#d4e8eb':id==='crystal'?'#96bcdf':'#8ddcd8'} transparent opacity={.68} depthWrite={false}/></mesh>
               <mesh position={[0,0,.1]}><boxGeometry args={[.16,4.5,.035]}/><meshBasicMaterial color="#e1f7ea" transparent opacity={.38} depthWrite={false}/></mesh>
             </group>}
             {id==='wind'&&<group position={[-rx*.6,1.5,1]}><mesh><cylinderGeometry args={[.3,.7,2.4,10]}/><meshStandardMaterial color="#eee1b9"/></mesh><Windmill still={still}/></group>}
            </group>)}
        {grouped.map(p => <Instances key={p.shape} {...p} />)}
        <mesh rotation-x={-Math.PI / 2} position={[0, -4, 0]}><planeGeometry args={[120, 120]} /><meshBasicMaterial color={mood.fog} transparent opacity={.15} depthWrite={false} /></mesh>
    </>;
}
function Windmill({still}:{still:boolean}) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => { if (ref.current&&!still) ref.current.rotation.z += Math.min(dt, .05) * .4; });
    return <group ref={ref} position={[0, .8, .42]}>{[0, 1].map(i => <mesh key={i} rotation-z={i * Math.PI / 2}><boxGeometry args={[.18, 2.4, .05]} /><meshStandardMaterial color="#f5eacb" /></mesh>)}</group>;
}

function Actor({ model, node, scale = 1, animation = 'idle', paused, reduced, tint }: {
    model: 'knight' | 'dragon' | 'fairy' | 'goblin'; node: { x: number; y: number; z: number; heading: number };
    scale?: number; animation?: string; paused?: boolean; reduced?: boolean; tint?: string;
}) {
    const gltf = useGLTF(BASE + model + '.glb'), ref = useRef<THREE.Group>(null);
    const { object, materials } = useMemo(() => {
        const object = gltf.scene.clone(true), materials: THREE.Material[] = [];
        object.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; const m = (o.material as THREE.MeshStandardMaterial).clone(); materials.push(m); if (tint && (m.name === 'cloak' || m.name === 'scales')) m.color.set(tint); o.material = m; } });
        return { object, materials };
    }, [gltf.scene, tint]);
    const mixer = useMemo(() => new THREE.AnimationMixer(object), [object]);
    const first = useRef(true), dest = useMemo(() => new THREE.Vector3(), []), turn = useMemo(() => new THREE.Quaternion(), []);
    useEffect(() => {
        const clip = gltf.animations.find(c => c.name === animation) || gltf.animations[0];
        if (!clip) return;
        const action = mixer.clipAction(clip); action.reset().fadeIn(.18).play();
        return () => { action.fadeOut(.15); };
    }, [animation, mixer, gltf.animations]);
    useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(object); materials.forEach(m => m.dispose()); }, [mixer, object, materials]);
    useFrame((_, dt) => {
        if (!ref.current) return;
        dest.set(node.x, node.y + .2, node.z); turn.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, node.heading);
        const f = first.current || reduced ? 1 : 1 - Math.exp(-Math.min(dt, .07) * 12);
        ref.current.position.lerp(dest, f); ref.current.quaternion.slerp(turn, f); first.current = false;
        if (!paused && !reduced) mixer.update(Math.min(dt, .05));
    });
    return <group ref={ref} scale={scale}><primitive object={object} /><mesh rotation-x={-Math.PI / 2} position-y={.015}><circleGeometry args={[model === 'dragon' ? .8 : .36, 24]} /><meshBasicMaterial color="#173a32" transparent opacity={.22} depthWrite={false} /></mesh></group>;
}

function Magic({ node, session, reduced, color }: { node: WorldNode; session?: Session; reduced: boolean; color: string }) {
    const motes = useRef<THREE.InstancedMesh>(null), d = useMemo(() => new THREE.Object3D(), []), start = useRef(0), seen = useRef(session?.fx || 0);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (!motes.current) return;
        if (session && seen.current !== session.fx) { seen.current = session.fx; start.current = t; }
        const age = t - start.current, burst = !!session && session.fx > 0 && age < 1.3 && !reduced;
        for (let i = 0; i < 32; i++) {
            const angle = i * Math.PI * 2 / 32, r = burst ? age * 2.5 : .9 + Math.sin(i * 17) * .25;
            d.position.set(node.x + Math.cos(angle) * r, node.y + (burst ? .5 + Math.sin(age * 2) * 2 : .5 + (i % 5) * .12), node.z + Math.sin(angle) * r);
            d.scale.setScalar(reduced ? 0 : burst ? .065 * (1 - age / 1.4) : .018 + Math.sin(t + i) * .01); d.updateMatrix(); motes.current.setMatrixAt(i, d.matrix);
        }
        motes.current.instanceMatrix.needsUpdate = true;
    });
    return <><mesh rotation-x={-Math.PI / 2} position={[node.x, node.y + .2, node.z]}><ringGeometry args={[.66, .71, 48]} /><meshBasicMaterial color={color} transparent opacity={.9} depthWrite={false} /></mesh><instancedMesh ref={motes} args={[undefined, undefined, 32]} frustumCulled={false}><octahedronGeometry args={[1]} /><meshBasicMaterial color={color} toneMapped={false} /></instancedMesh></>;
}

function Scene(props: WorldProps) {
    const { session: s, quality, reduced } = props, region = regionOf(props.missionId), mood = regionMood[region.id];
    const map = useMemo(() => worldLayout(s?.map || createMap(props.missionId, props.seed),region.id), [s?.map, props.missionId, props.seed]);
    const bounds=useMemo(()=>worldBounds(map),[map]);
    const node = map.find(n => n.id === s?.position) || map[0], boss = map[49];
    const moving = s?.phase === 'moving', active = !!s && ['intro', 'question', 'feedback'].includes(s.phase);
    const good = s?.phase === 'feedback' && s.feedback?.correct, bad = s?.phase === 'feedback' && !s.feedback?.correct;
    const { gl, invalidate } = useThree(), samples = useRef<number[]>([]), warned = useRef(false), lastMetric = useRef(0);
    useEffect(() => { props.onReady(); const lost = (e: Event) => { e.preventDefault(); props.onUnavailable(); }; gl.domElement.addEventListener('webglcontextlost', lost); return () => gl.domElement.removeEventListener('webglcontextlost', lost); }, [gl, props.onReady, props.onUnavailable]);
    useEffect(() => { warned.current = false; samples.current = []; }, [quality]);
    useEffect(() => {
        invalidate(); if (reduced || s?.paused || props.blocked) return;
        let timer: number | undefined;
        const schedule = () => { clearInterval(timer); if (!document.hidden) timer = window.setInterval(invalidate, moving ? 16 : quality === 'light' ? 66 : 33); };
        schedule(); document.addEventListener('visibilitychange', schedule);
        return () => { clearInterval(timer); document.removeEventListener('visibilitychange', schedule); };
    }, [invalidate, reduced, s?.paused, props.blocked, quality, moving]);
    useFrame((_, dt) => {
        if (moving && !document.hidden && !s?.paused && dt < .2) {
            samples.current.push(dt * 1000); if (samples.current.length > 120) samples.current.shift();
            if (samples.current.length === 120 && !warned.current) { const a = [...samples.current].sort((a, b) => a - b); if (a[114] > 55) { warned.current = true; props.onSlow(); } }
        }
        if (import.meta.env.DEV && performance.now() - lastMetric.current > 600) {
            lastMetric.current = performance.now(); const a = [...samples.current].sort((a, b) => a - b);
            gl.domElement.dataset.dragonMetrics = JSON.stringify({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, textures: gl.info.memory.textures, p95: a[Math.floor(a.length * .95)] || 0, samples: a.length });
        }
    });
    return <>
        <WorldCamera bounds={bounds} node={node} mode={props.cameraMode || 'follow'} overview={!!props.overview} recenter={props.recenter || 0} reduced={reduced} blocked={!!props.blocked || !!s?.paused} active={active} />
        <fog attach="fog" args={[mood.fog, props.overview?130:45, props.overview?280:125]} /><ambientLight intensity={.65} /><hemisphereLight args={[mood.light, mood.rock, 1.1]} />
        <directionalLight position={[-12, 25, 16]} intensity={1.9} color={mood.light} castShadow={quality !== 'light'} shadow-mapSize={quality === 'detailed' ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={28} shadow-camera-bottom={-28} shadow-bias={-.001} shadow-normalBias={.06} />
        <Landscape id={region.id} nodes={map} seed={props.seed} quality={quality} still={reduced||!!s?.paused||!!props.blocked} /><BoardTiles map={map} session={s} />
        <Magic node={node} session={s} reduced={reduced || !!props.blocked || !!s?.paused} color={bad ? '#ef9b81' : mood.accent} />
        <Actor model="knight" node={{ ...node, heading: moving ? node.heading : active ? Math.PI * .3 : Math.PI * .27 }} scale={.86} animation={s?.phase === 'won' ? 'celebrate' : moving ? 'walk' : good ? 'cast' : bad ? 'hit' : 'idle'} tint={props.heroColor} paused={s?.paused || props.blocked} reduced={reduced} />
        {active && node.kind !== 'boss' && <Actor model={node.kind === 'buff' ? 'fairy' : 'goblin'} node={{ ...node, x: node.x + 1.4, z: node.z - .8, heading: -.8 }} scale={1} animation={good ? 'celebrate' : bad ? 'cast' : 'idle'} paused={s?.paused} reduced={reduced} />}
        <Actor model="dragon" node={{ ...boss, z: boss.z - 2.4, y: boss.y + .3, heading: .2 }} scale={2} tint={region.color} animation={s?.phase === 'won' ? 'celebrate' : node.kind === 'boss' && bad ? 'cast' : node.kind === 'boss' && good ? 'hit' : 'idle'} paused={s?.paused || props.blocked} reduced={reduced} />
        <mesh position={[boss.x, boss.y - .15, boss.z - 1]} receiveShadow><cylinderGeometry args={[2.6, 2.9, .5, 24]} /><meshStandardMaterial color={mood.rock} roughness={.8} /></mesh>
    </>;
}
export default function WorldScene(props: WorldProps) {
    return <Canvas camera={{ position: [8, 13, 29], fov: 39, near: .1, far: 350 }} frameloop="demand"
        dpr={props.quality === 'light' ? 1 : [1, props.quality === 'balanced' ? 1.5 : 2]} shadows={props.quality !== 'light'}
        gl={{ alpha: true, antialias: props.quality !== 'light', powerPreference: 'high-performance' }}
        role="img" aria-label="Thế giới Rồng Thần 3D, đường đi 50 ô và camera góc chếch"><Scene {...props} /></Canvas>;
}
