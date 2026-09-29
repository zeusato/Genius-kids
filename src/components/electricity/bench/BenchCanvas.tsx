import { FrameBudget } from './FrameBudget';
import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { Color, CurvePath, LineCurve3, Plane, Raycaster, Vector2, Vector3, TubeGeometry, Object3D, InstancedMesh } from 'three';
import { BenchProps, layoutKey } from '../ui/benchTypes';
import { displayPoint, boardPoint, Part, postIds, postPosition } from '../engine/circuit';
import { routeAll } from '../engine/route';
import { reading } from '../engine/solver';
import { bulbBrightness } from '../engine/simulation';
import { bindSurface } from '../controller/surface';
import { PARTS } from '../engine/parts';
import { PartGlyph } from '../flat/FlatBench';
const CAMERA = { position: [0, 17, 9] as [
        number,
        number,
        number
    ], near: .1, far: 60 };
const GL = { antialias: true, alpha: false, powerPreference: 'low-power' as const };
const DPR: [
    number,
    number
] = [1, 1.5];
function CopperPosts({parts,portrait,armed}:{parts:Part[];portrait:boolean;armed?:string}){
 const mesh=useRef<InstancedMesh>(null),layout=parts.map(p=>[p.id,p.kind,p.x,p.z,p.rot]).flat().join('|');
 const posts=useMemo(()=>parts.flatMap(p=>postIds(p).map(id=>({id:`${p.id}:${id}`,point:displayPoint(...postPosition(p,id),portrait)}))),[layout,portrait]);
 useEffect(()=>{if(!mesh.current)return;const dummy=new Object3D();posts.forEach((p,i)=>{dummy.position.set(p.point[0],.4,p.point[1]);dummy.scale.setScalar(armed===p.id?1.3:1);dummy.updateMatrix();mesh.current!.setMatrixAt(i,dummy.matrix);mesh.current!.setColorAt(i,new Color(armed===p.id?'#ffdc8b':'#c89f68'));});mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;},[posts,armed]);
 return posts.length?<instancedMesh ref={mesh} args={[undefined,undefined,posts.length]}><cylinderGeometry args={[.12,.14,.2,12]}/><meshStandardMaterial metalness={.6} roughness={.28}/></instancedMesh>:null;
}
function Toy({ part: p, brightness, motorRps = 0, reduced = false }: {
    part: Part;
    brightness: number;
    motorRps?: number;
    reduced?: boolean;
}) {
    const fan = useRef<any>(null);
    useFrame((_, dt) => { if (fan.current && !reduced && !document.hidden)
        fan.current.rotation.y += dt * Math.PI * 2 * motorRps; });
    return <group rotation={[0, -p.rot * Math.PI / 180, 0]}>
  <RoundedBox args={[1.75, .32, .85]} radius={.13} smoothness={3} position={[0, .18, 0]} castShadow receiveShadow><meshStandardMaterial color="#367b77" roughness={.32}/></RoundedBox>
  {p.kind === 'bulb' ? <>
   <mesh position={[0, .42, 0]} castShadow><cylinderGeometry args={[.24, .32, .35, 16]}/><meshStandardMaterial color="#b49360" metalness={.75} roughness={.3}/></mesh>
   <mesh position={[0, .93, 0]}><sphereGeometry args={[.42, 24, 16]}/><meshStandardMaterial color={p.broken ? '#8c9690' : '#ffe5a4'} transparent opacity={p.broken ? .55 : .45 + Math.min(brightness, .55)} emissive="#ffb843" emissiveIntensity={p.broken ? 0 : brightness * 1.8} roughness={.15}/></mesh>
   <mesh position={[0, .88, 0]}><torusGeometry args={[.16, .026, 6, 12, Math.PI]}/><meshStandardMaterial color="#eed6aa" emissive="#ffcf6c" emissiveIntensity={brightness * 3}/></mesh>
   {brightness > .01 && <mesh position={[0, .018, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.9 + brightness * .8, 32]}/><meshBasicMaterial color="#ffcf78" transparent opacity={Math.min(.5, brightness * .36)} depthWrite={false}/></mesh>}
  </> : p.kind === 'battery' ? (p.cells ?? []).map((cell, i) => <group key={i} position={[(i - ((p.cells?.length ?? 1) - 1) / 2) * .3, .45, 0]}><mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.13, .13, .65, 12]}/><meshStandardMaterial color={cell.present ? (cell.charge01 > 0 ? '#deb562' : '#6e7971') : '#203d39'} metalness={.35} roughness={.38}/></mesh><mesh position={[0, .02, cell.polarity === 1 ? -.35 : .35]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.06, .06, .08, 10]}/><meshStandardMaterial color="#e6dac4" metalness={.8}/></mesh></group>) : ['switch', 'button', 'spdt'].includes(p.kind) ? <group position={[-.4, .4, 0]} rotation={[0, 0, p.closed || p.position === 1 ? 0 : .55]}><mesh position={[.38, 0, 0]} castShadow><boxGeometry args={[.85, .07, .16]}/><meshStandardMaterial color="#c6a375" metalness={.6}/></mesh><mesh position={[.65, .1, 0]} castShadow><boxGeometry args={[.48, .18, .33]}/><meshStandardMaterial color="#e4866b" roughness={.32}/></mesh></group> : p.kind === 'motor' ? <group ref={fan} position={[0, .6, 0]}>{[0, 120, 240].map(a => <mesh key={a} rotation={[0, a * Math.PI / 180, 0]} position={[0, 0, 0]}><boxGeometry args={[.22, .08, 1.1]}/><meshStandardMaterial color="#b2d9c8" roughness={.3}/></mesh>)}<mesh><sphereGeometry args={[.16, 12, 8]}/><meshStandardMaterial color="#c9a26d"/></mesh></group> : p.kind === 'led' ? <mesh position={[0, .55, 0]}><sphereGeometry args={[.28, 16, 12]}/><meshStandardMaterial color={({ red: '#e5765e', yellow: '#ebc268', green: '#88cbb3', blue: '#78aecf' })[p.color ?? 'red']} emissive={({ red: '#e5765e', yellow: '#ebc268', green: '#88cbb3', blue: '#78aecf' })[p.color ?? 'red']} emissiveIntensity={brightness * 2}/></mesh> : p.kind === 'bell' ? <mesh position={[0, .55, 0]}><sphereGeometry args={[.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]}/><meshStandardMaterial color="#ceae75" roughness={.22} metalness={.75}/></mesh> : <mesh position={[0, .45, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.18, .18, .85, 12]}/><meshStandardMaterial color={p.kind === 'lemon' ? '#dcc75e' : p.kind === 'potato' ? '#b58d65' : '#d4bd8d'} metalness={.15} roughness={.5}/></mesh>}
 </group>;
}
function WireMesh({ points, color, current, reduced, flow }: {
    points: [
        number,
        number
    ][];
    color: string;
    current: number;
    reduced: boolean;
    flow: BenchProps['flow'];
}) {
    const curve = useMemo(() => (() => { const path = new CurvePath<Vector3>(); for (let i = 1; i < points.length; i++)
        path.add(new LineCurve3(new Vector3(points[i - 1][0], .12, points[i - 1][1]), new Vector3(points[i][0], .12, points[i][1]))); return path; })(), [JSON.stringify(points)]), geometry = useMemo(() => new TubeGeometry(curve, Math.max(12, points.length * 8), .052, 6, false), [curve]);
    const particles = useRef<InstancedMesh>(null), dummy = useMemo(() => new Object3D(), []);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame(({ clock }) => { if (!particles.current || Math.abs(current) < 1e-7 || flow === 'off')
        return; for (let i = 0; i < 8; i++) {
        const speed = reduced ? 0 : Math.log1p(Math.abs(current) / .02) * .06 * (current > 0 ? 1 : -1) * (flow === 'electron' ? -1 : 1);
        dummy.position.copy(curve.getPointAt(((i / 8 + clock.elapsedTime * speed) % 1 + 1) % 1));
        dummy.updateMatrix();
        particles.current.setMatrixAt(i, dummy.matrix);
    } particles.current.instanceMatrix.needsUpdate = true; });
    return <><mesh geometry={geometry}><meshStandardMaterial color={color} roughness={.36} metalness={.1}/></mesh>{Math.abs(current) > 1e-7 && flow !== 'off' && <instancedMesh ref={particles} args={[undefined, undefined, 8]} frustumCulled={false}><sphereGeometry args={[.063, 6, 4]}/><meshBasicMaterial color="#ffecad"/></instancedMesh>}</>;
}
function BoardHoles({ width, depth }: {
    width: number;
    depth: number;
}) { const mesh = useRef<InstancedMesh>(null); const count = (width * 2 - 1) * (depth * 2 - 1); useEffect(() => { if (!mesh.current)
    return; const dummy = new Object3D(); let i = 0; for (let x = .5; x < width; x += .5)
    for (let z = .5; z < depth; z += .5) {
        dummy.position.set(x - width / 2, .012, z - depth / 2);
        dummy.rotation.x = -Math.PI / 2;
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i++, dummy.matrix);
    } mesh.current.instanceMatrix.needsUpdate = true; }, [width, depth]); return <instancedMesh ref={mesh} args={[undefined, undefined, count]}><circleGeometry args={[.028, 6]}/><meshBasicMaterial color="#a99a7b" transparent opacity={.48}/></instancedMesh>; }
function Scene(props: BenchProps) {
    const { camera, gl, size } = useThree(), latest = useRef(props), view = useRef({ panX: 0, panZ: 0, tilt: 9, height: 17 });
    latest.current = props;
    const paths = useMemo(() => routeAll(props.sim.circuit), [layoutKey(props.sim.circuit)]);
    const portrait = props.portrait;
    const width = portrait ? 8 : 14, depth = portrait ? 14 : 8;
    const toWorld = (x: number, z: number) => { const d = displayPoint(x, z, portrait); return new Vector3(d[0] - width / 2, 0, d[1] - depth / 2); };
    useEffect(() => { const cam = camera as any; view.current.panX = 0; view.current.panZ = 0; cam.up.set(0, 1, -.001); const span = Math.max((width + .8) / size.width, (depth + 1) / size.height) * 1.03; cam.left = -size.width * span / 2; cam.right = size.width * span / 2; cam.top = size.height * span / 2; cam.bottom = -size.height * span / 2; cam.zoom = 1; cam.updateProjectionMatrix(); }, [camera, size.width, size.height, width, depth, props.fitKey]);
    useFrame((_, dt) => { const v = view.current, t = props.reduced ? 1 : 1 - Math.exp(-dt * 6); const target = props.schematic ? .001 : portrait ? 5 : 9; v.tilt += (target - v.tilt) * t; v.height += ((props.schematic ? 20 : 17) - v.height) * t; camera.position.set(v.panX, v.height, v.panZ + v.tilt); camera.lookAt(v.panX, 0, v.panZ); });
    useEffect(() => { const ray = new Raycaster(), plane = new Plane(new Vector3(0, 1, 0), 0); const toBoard = (x: number, y: number): [
        number,
        number
    ] => { const rect = gl.domElement.getBoundingClientRect(); ray.setFromCamera(new Vector2((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1), camera); const point = new Vector3(); ray.ray.intersectPlane(plane, point); return boardPoint(point.x + width / 2, point.z + depth / 2, portrait); }; const toScreen = (p: [
        number,
        number
    ]): [
        number,
        number
    ] => { const world = toWorld(...p); world.y = .4; const v = world.project(camera), rect = gl.domElement.getBoundingClientRect(); return [rect.left + (v.x + 1) / 2 * rect.width, rect.top + (1 - v.y) / 2 * rect.height]; }; const clean = bindSurface(gl.domElement, () => latest.current, toBoard, toScreen, (dx, dy, scale) => { const cam = camera as any; cam.zoom = Math.max(1, Math.min(3, cam.zoom * scale)); view.current.panX = Math.max(-width / 2, Math.min(width / 2, view.current.panX - dx / size.width * width / cam.zoom)); view.current.panZ = Math.max(-depth / 2, Math.min(depth / 2, view.current.panZ - dy / size.height * depth / cam.zoom)); cam.updateProjectionMatrix(); }); const lost = (e: Event) => { e.preventDefault(); latest.current.onContextLost?.(); }; gl.domElement.addEventListener('webglcontextlost', lost); return () => { clean(); gl.domElement.removeEventListener('webglcontextlost', lost); }; }, [camera, gl, portrait, width, depth, size.width, size.height]);
    const lamps = props.sim.circuit.parts.filter(p => p.kind === 'bulb').sort((a, b) => reading(props.sim.solution, b.id).Pabsorbed - reading(props.sim.solution, a.id).Pabsorbed).slice(0, 4);
    return <><color attach="background" args={[props.night ? '#263c38' : '#ded6c1']}/><ambientLight intensity={props.night ? 1.05 : 1.8}/><directionalLight position={[-5, 12, -7]} intensity={props.night ? 1.3 : 3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9}/>
  <RoundedBox args={[width + .25, .4, depth + .25]} radius={.22} smoothness={3} position={[0, -.2, 0]} receiveShadow><meshStandardMaterial color={props.night ? '#aaab8e' : '#eee3c9'} roughness={.85}/></RoundedBox><BoardHoles width={width} depth={depth}/>
  {Array.from({ length: 4 }, (_, i) => { const p = lamps[i], pos = p ? toWorld(p.x, p.z) : new Vector3(0, 1, 0); return <pointLight key={i} position={[pos.x, 1.2, pos.z]} color="#ffca6f" intensity={p ? bulbBrightness(reading(props.sim.solution, p.id).Pabsorbed) * 5 : 0} distance={4} decay={2}/>; })}
  <group position={[-width / 2, 0, -depth / 2]}><CopperPosts parts={props.sim.circuit.parts} portrait={portrait} armed={props.preview?.from?`${props.preview.from.partId}:${props.preview.from.postId}`:undefined}/>
   {[...paths].map(([id, points], i) => <WireMesh key={id} points={points.map(([x, z]) => displayPoint(x, z, portrait))} color={(props.selected === id||props.sim.circuit.wires.some(w=>w.id===id&&(w.a.partId===props.selected||w.b.partId===props.selected))) ? '#edc36e' : i % 2 ? '#438c85' : '#da826a'} current={reading(props.sim.solution, id).Iab} reduced={props.reduced} flow={props.flow}/>)}
   {props.sim.circuit.parts.map(p => { const [x, z] = displayPoint(p.x, p.z, portrait), r = reading(props.sim.solution, p.id), brightness = p.kind === 'bulb' ? bulbBrightness(r.Pabsorbed) : p.kind === 'led' ? Math.pow(Math.max(0, Math.min(1, r.Iab / .02)), .6) : Math.abs(r.Iab) > .05 ? 1 : 0; return <group key={p.id}><group position={[x, 0, z]} rotation={[0, portrait ? Math.PI / 2 : 0, 0]}>{!props.schematic && <Toy part={p} brightness={props.sim.runtime.visual[p.id]?.brightness ?? brightness} motorRps={props.sim.runtime.visual[p.id]?.motorRps ?? 0} reduced={props.reduced}/>}<Html position={[0, .05, props.schematic ? 0 : .95]} center style={{ pointerEvents: 'none' }}>{props.schematic ? <svg className="ew-board-transition" width="85" height="65" viewBox="-110 -75 220 150" style={{ color: '#355e50' }}><PartGlyph part={p} schematic/></svg> : <span className="ew-3d-label">{PARTS[p.kind].name} {p.id}</span>}</Html>{props.selected === p.id && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]}><ringGeometry args={[.95, 1.02, 40]}/><meshBasicMaterial color="#edc16d"/></mesh>}</group>{postIds(p).map(id => { const [px, pz] = displayPoint(...postPosition(p, id), portrait), armed = props.preview?.from?.partId === p.id && props.preview.from.postId === id; return <group key={id}><Html position={[px, .4, pz - .35]} center style={{ pointerEvents: 'none' }}><span className="ew-3d-post">{id === 'plus' ? '+' : id === 'minus' ? '−' : id === 'anode' ? 'A+' : id === 'cathode' ? 'K−' : id === 'a' ? 'A' : id === 'b' ? 'B' : id === 'common' ? 'C' : id === 'throw0' ? '1' : id === 'throw1' ? '2' : '●'}</span></Html></group>; })}</group>; })}
   {props.preview?.part && props.preview.point && (() => { const p = props.sim.circuit.parts.find(p => p.id === props.preview!.part); const [x, z] = displayPoint(...props.preview!.point!, portrait); return p ? <group position={[x, .2, z]}><Toy part={p} brightness={0}/></group> : null; })()}
   {props.preview?.from && props.preview.point && (() => { const part = props.sim.circuit.parts.find(p => p.id === props.preview!.from!.partId); return part ? <WireMesh points={[displayPoint(...postPosition(part, props.preview!.from!.postId), portrait), displayPoint(...props.preview!.point!, portrait)]} color="#e5bd67" current={0} reduced flow="off"/> : null; })()}
  </group>
 </>;
}
export default function BenchCanvas(props: BenchProps) { return <Canvas orthographic shadows dpr={DPR} camera={CAMERA} gl={GL} className="ew-3d-canvas" aria-label="Bàn thí nghiệm ba chiều"><FrameBudget onSlow={() => props.onContextLost?.()}/><Scene {...props}/></Canvas>; }
