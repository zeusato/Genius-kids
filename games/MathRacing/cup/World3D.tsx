import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as T from 'three';
import { GATE, KARTS, Region, SEGMENT, Session } from './model';
import { activeQuestion, finishDistance } from './engine';
import { CAMERA_TRAIL, FrameDriver, RaceFrame, rivalOpacity } from './motion';
import { disposeArt, makeGate, makeKart, makeWorld, moods, roadAngle, roadPosition } from './art';

interface Props { live: React.MutableRefObject<Session | null>; onFrame: FrameDriver; region: Region; kart: number; reduced: boolean; low: boolean; garage?: boolean; onUnavailable: () => void; onMetrics?: (text: string) => void }
function Kart({ index, color, live, motion, garage, reduced }: { index: number; color: string; live: Props['live']; motion: React.MutableRefObject<RaceFrame | null>; garage?: boolean; reduced: boolean }) {
    const root = useRef<T.Group>(null), boost = useRef<T.Mesh>(null), shadow = useRef<T.MeshBasicMaterial>(null), model = useMemo(() => makeKart(color, index), [color, index]);
    const parts = useMemo(() => {
        const materials: T.Material[] = [];
        model.traverse(o => { if (o instanceof T.Mesh) { const items = Array.isArray(o.material) ? o.material : [o.material]; items.forEach(m => { m.transparent = index > 0; materials.push(m); }); } });
        return { materials, wheels: model.children.filter(c => c.name.startsWith('wheel')), driver: model.getObjectByName('driver')! };
    }, [model, index]);
    useEffect(() => () => disposeArt(model), [model]);
    useFrame(({ clock }) => {
        if (!root.current) return; const s = live.current, r = s?.racers[index], frame = motion.current, pose = frame?.racers[index];
        if (garage) { root.current.rotation.y = -.5 + (reduced ? 0 : Math.sin(clock.elapsedTime * .22) * .18); return; }
        if (!r || !s || !pose || !frame) return;
        const opacity = index ? s.config.mode === 'practice' ? 0 : rivalOpacity(pose.distance - frame.racers[0].distance) : 1;
        root.current.visible = opacity > .001;
        if (!root.current.visible) return;
        parts.materials.forEach(m => { m.opacity = opacity; m.depthWrite = opacity > .99; });
        if (shadow.current) shadow.current.opacity = .18 * opacity;
        root.current.position.set(...roadPosition(pose.distance, (pose.lane - 1) * 4, .05));
        root.current.rotation.y = roadAngle(pose.distance);
        const moving = frame.moving, turn = r.target - pose.lane;
        model.rotation.z = reduced ? 0 : turn * -.08;
        parts.driver.rotation.z = reduced ? 0 : turn * .1;
        if (!reduced) parts.wheels.forEach(c => { c.rotation.x = -pose.distance / (.54 * .87); });
        if (boost.current) { boost.current.visible = moving && r.boost > 0 && activeQuestion(s) < 0; (boost.current.material as T.Material).opacity = .7 * opacity; }
    });
    return <group ref={root} scale={garage ? 1.4 : .87}><primitive object={model}/><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .035, 0]} scale={[1.6, 2, 1]}><circleGeometry args={[1, 24]}/><meshBasicMaterial ref={shadow} color="#213e49" transparent opacity={.18} depthWrite={false}/></mesh><mesh ref={boost} position={[0, .56, 2.7]} rotation={[Math.PI / 2, 0, 0]} visible={false}><coneGeometry args={[.55, 3, 8]}/><meshBasicMaterial color="#8cebe0" transparent opacity={.7} depthWrite={false}/></mesh></group>;
}
function World({ region, length, low }: { region: Region; length: number; low: boolean }) {
    const object = useMemo(() => makeWorld(region, length, low), [region, length, low]);
    useEffect(() => () => disposeArt(object), [object]);
    return <primitive object={object}/>;
}
function Gates({ live }: { live: Props['live'] }) {
    const s = live.current!, objects = useMemo(() => [...s.questions.map(q => makeGate(q.options)), makeGate([], true)], [s.id]);
    const group = useRef<T.Group>(null);
    useEffect(() => () => objects.forEach(o => { o.traverse(n => { if (n instanceof T.Mesh) (n.material as T.MeshBasicMaterial).map?.dispose(); }); disposeArt(o); }), [objects]);
    useFrame(() => { const state = live.current; if (!state || !group.current) return;
        group.current.children.forEach((g, i) => { const at = i === state.questions.length ? finishDistance(state) : i * SEGMENT + GATE;
            const distance = at - state.racers[0].distance; g.visible = distance > -12 && distance < (i === state.questions.length ? 200 : 112);
        });
    });
    return <group ref={group}>{objects.map((o, i) => { const at = i === s.questions.length ? finishDistance(s) : i * SEGMENT + GATE; return <primitive key={i} object={o} position={roadPosition(at)} rotation={[0, roadAngle(at), 0]}/>; })}</group>;
}
function Pickups({ live }: { live: Props['live'] }) {
    const group = useRef<T.Group>(null);
    useFrame(({ clock }) => { if (!group.current || !live.current) return; const s = live.current;
        group.current.children.forEach((g, i) => { const o = s.objects[i]; g.visible = !o.hit && o.at - s.racers[0].distance < 160 && o.at > s.racers[0].distance - 5;
            if (o.type === 'energy') g.rotation.y = clock.elapsedTime * 1.5;
        });
    });
    return <group ref={group}>{live.current!.objects.map(o => <group key={o.id} position={roadPosition(o.at, (o.lane - 1) * 4, .15)}>{o.type === 'cone' ? <><mesh position={[0, .55, 0]}><coneGeometry args={[.55, 1.1, 12]}/><meshStandardMaterial color="#e99065"/></mesh><mesh position={[0, .06, 0]}><boxGeometry args={[1.1, .12, 1.1]}/><meshStandardMaterial color="#f0d7a2"/></mesh><mesh position={[0, .6, 0]}><cylinderGeometry args={[.24, .32, .18, 12]}/><meshStandardMaterial color="#fff5d4"/></mesh></> : <><mesh position={[0, 1.15, 0]}><octahedronGeometry args={[.75, 0]}/><meshStandardMaterial color="#f7cc60" emissive="#d79e22" emissiveIntensity={.3}/></mesh><mesh position={[0, .1, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.8, .95, 24]}/><meshBasicMaterial color="#f8da84"/></mesh></>}</group>)}</group>;
}
function Windmill({ s, side, live, region, reduced }: { s: number; side: number; live: Props['live']; region: Region; reduced: boolean }) {
    const blades = useRef<T.Group>(null);
    useFrame((_, dt) => { if (blades.current && !reduced && !live.current?.paused) blades.current.rotation.z += dt * .38; });
    const p = roadPosition(s, side * 18);
    if (region === 'coast') return <group position={p}><mesh position={[0, 5, 0]}><cylinderGeometry args={[1.6, 2.3, 10, 16]}/><meshStandardMaterial color="#faecc9"/></mesh>{[2, 5, 8].map(y => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[2.3 - (y + .6) * .07, 2.3 - (y - .6) * .07, 1.2, 16]}/><meshStandardMaterial color="#d59079"/></mesh>)}<mesh position={[0, 10.4, 0]}><cylinderGeometry args={[2.2, 2.2, .4, 16]}/><meshStandardMaterial color="#4e8988"/></mesh><mesh position={[0, 11.3, 0]}><cylinderGeometry args={[1.3, 1.3, 1.5, 12]}/><meshStandardMaterial color="#f9d88c" emissive="#f4ca6e" emissiveIntensity={.5}/></mesh><mesh position={[0, 12.7, 0]}><coneGeometry args={[2, 1.4, 12]}/><meshStandardMaterial color="#668e86"/></mesh></group>;
    return <group position={p}>{region === 'city' ? <><mesh position={[0, 9, 0]}><cylinderGeometry args={[3, 4, 18, 12]}/><meshStandardMaterial color="#e4d2df"/></mesh><mesh position={[0, 19, 0]}><sphereGeometry args={[3.3, 16, 8]}/><meshStandardMaterial color="#ddb96b"/></mesh></> : <><mesh position={[0, 4, 0]}><cylinderGeometry args={[1.6, 2.5, 8, 12]}/><meshStandardMaterial color={'#efdab0'}/></mesh><mesh position={[0, 9, 0]}><coneGeometry args={[2.25, 3, 12]}/><meshStandardMaterial color={'#608c82'}/></mesh><group ref={blades} position={[0, 6.7, 1.7]}>{[0, 1, 2, 3].map(i => <group key={i} rotation={[0, 0, i * Math.PI / 2]}><mesh position={[0, 2.4, 0]}><boxGeometry args={[.2, 5.5, .15]}/><meshStandardMaterial color="#735b46"/></mesh><mesh position={[.6, 2.5, 0]}><boxGeometry args={[1.05, 3.6, .08]}/><meshStandardMaterial color="#f5e8bf"/></mesh></group>)}</group></>}</group>;
}
function Scene(props: Props) {
    const { live, region, kart, reduced, garage, onUnavailable } = props;
    const motion = useRef<RaceFrame | null>(null);
    // Physics, all kart poses and camera use the same interpolated frame.
    useFrame(() => { motion.current = props.onFrame(performance.now()); }, -2);
    const { camera, gl, scene } = useThree(), length = live.current ? finishDistance(live.current) : 500;
    const samples = useRef<number[]>([]), metricTime = useRef(0), cameraTarget = useMemo(() => new T.Vector3(), []), cameraLook = useMemo(() => new T.Vector3(), []);
    useEffect(() => { const lost = (e: Event) => { e.preventDefault(); onUnavailable(); }; gl.domElement.addEventListener('webglcontextlost', lost); return () => gl.domElement.removeEventListener('webglcontextlost', lost); }, [gl, onUnavailable]);
    useEffect(() => { scene.background = garage ? null : new T.Color(moods[region].sky); scene.fog = garage ? null : new T.Fog(moods[region].sky, 110, 270); }, [region, scene, garage]);
    useFrame((_, dt) => {
        if (import.meta.env.DEV && props.onMetrics) { samples.current.push(dt); if (samples.current.length > 120) samples.current.shift(); metricTime.current += dt;
            if (metricTime.current > 1) { metricTime.current = 0; const sorted = [...samples.current].sort((a, b) => a - b), avg = samples.current.reduce((a, b) => a + b, 0) / samples.current.length;
                props.onMetrics(`${Math.round(1 / avg)} fps · p95 ${(sorted[Math.floor(sorted.length * .95)] * 1000).toFixed(1)} ms · ${gl.info.render.calls} draw calls · ${gl.info.render.triangles.toLocaleString()} triangles`); }
        }
        const d = motion.current?.racers[0]?.distance || 0;
        if (garage) { camera.position.set(8, 6.3, -10); camera.lookAt(0, 1.7, 0); return; }
        const target = cameraTarget.set(...roadPosition(d - CAMERA_TRAIL, 0, 10)), look = cameraLook.set(...roadPosition(d + 18, 0, .8));
        // Follow the same distance for position and look direction. A second
        // camera lag magnifies fixed-tick judder in the foreground.
        camera.position.copy(target); camera.lookAt(look);
        const cam = camera as T.PerspectiveCamera, fov = window.innerWidth < 650 ? 59 : 49;
        if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    }, -1);
    return <><ambientLight intensity={1.5}/><hemisphereLight args={['#fff1d8', '#708784', 1.5]}/><directionalLight position={[-30, 70, 40]} intensity={2.3} color="#fff1d2"/>
        {garage ? <><mesh position={[0, -.2, 0]}><cylinderGeometry args={[5.4, 5.5, .45, 64]}/><meshStandardMaterial color="#c5d1b7"/></mesh><Kart index={0} color={KARTS[kart].color} live={live} motion={motion} garage reduced={reduced}/></> : <><World region={region} length={length} low={props.low}/>{[0, 1, 2, 3].map(i => <Kart key={i} index={i} color={i ? ['#db9286', '#af9cce', '#759ec4'][i - 1] : KARTS[kart].color} live={live} motion={motion} reduced={reduced}/>)}<Gates key={live.current!.id} live={live}/><Pickups key={live.current!.id + 'objects'} live={live}/>{Array.from({ length: Math.ceil(length / 320) }, (_, i) => <Windmill key={i} s={i * 320 + 80} side={i % 2 ? 1 : -1} live={live} region={region} reduced={reduced}/>)}</>}
    </>;
}
export default function World3D(props: Props) {
    return <Canvas dpr={props.low ? 1 : [1, 1.5]} camera={{ position: [0, 10, 18], fov: 49, near: .1, far: 340 }} gl={{ antialias: !props.low, powerPreference: 'high-performance' }} fallback={<span>Trình duyệt cần hỗ trợ canvas.</span>} onCreated={({ gl }) => { gl.toneMapping = T.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; }}><Scene {...props}/></Canvas>;
}
