import React, { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FORCED_TIER, FX_DISABLED } from './params';

const Effects = lazy(() => import('./Effects'));

/**
 * Soi bên trong dây (mô hình minh họa, phóng đại có chủ ý):
 *  0 · Vỏ nhựa: đoạn dây bổ dọc, thấy bó sợi đồng
 *  1 · Lõi đồng: sát đầu các sợi đồng
 *  2 · Mạng tinh thể: ion đồng xếp lập phương tâm mặt cạnh chuỗi phân tử nhựa
 * Không điện: electron tự do chỉ dao động vi mô. Có điện: thêm thành phần trôi chậm, NGƯỢC chiều dòng quy ước.
 */
export interface WireDiveProps { layer: number; current: number; reduced: boolean; tone: 'coral' | 'teal'; onError: () => void }

const rng = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const CAMS: { pos: [number, number, number]; target: [number, number, number] }[] = [
    { pos: [-2.5, 6.5, 17], target: [0.5, 0, 0] },
    { pos: [15.8, 2.6, 7.2], target: [7.4, 0, 0] },
    { pos: [5.2, 4.1, 20.5], target: [-0.3, -0.2, 0] },
];

function Environment() {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene);
    useEffect(() => {
        const pm = new THREE.PMREMGenerator(gl), env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = env; scene.environmentIntensity = 0.55;
        return () => { scene.environment = null; env.dispose(); pm.dispose(); };
    }, [gl, scene]);
    return null;
}

/** Tốc độ trôi minh họa theo |I| (log) — chậm hơn nhiều so với dao động nhiệt, đúng tinh thần mô hình. */
const driftSpeed = (current: number) => Math.abs(current) < 1e-6 ? 0 : Math.min(0.9, 0.12 + 0.3 * Math.log10(1 + Math.abs(current) / 0.005));

function MacroWire({ current, reduced, tone, hdr }: { current: number; reduced: boolean; tone: 'coral' | 'teal'; hdr: boolean }) {
    const mats = useMemo(() => ({
        sheath: new THREE.MeshPhysicalMaterial({ color: tone === 'coral' ? '#e07c64' : '#4f9c95', roughness: 0.3, transparent: true, opacity: 0.5, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
        rim: new THREE.MeshStandardMaterial({ color: tone === 'coral' ? '#c9644e' : '#3d7f79', roughness: 0.5 }),
        copper: new THREE.MeshStandardMaterial({ color: '#e39a64', metalness: 1, roughness: 0.3 }),
        face: new THREE.MeshStandardMaterial({ color: '#f3b27c', metalness: 0.35, roughness: 0.35, emissive: '#6b3514', emissiveIntensity: 0.35 }),
        e: new THREE.MeshBasicMaterial({ color: new THREE.Color('#8fe6ff').multiplyScalar(hdr ? 2.6 : 1), toneMapped: false }),
    }), [tone, hdr]);
    useEffect(() => () => Object.values(mats).forEach(m => m.dispose()), [mats]);
    const strands = useMemo<[number, number][]>(() => [[0, 0], ...Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * 1.08, Math.sin(i * Math.PI / 3) * 1.08] as [number, number])], []);
    const N = 420, mesh = useRef<THREE.InstancedMesh>(null);
    const seeds = useMemo(() => Array.from({ length: N }, () => ({ s: Math.floor(rng() * 7), x: -8 + rng() * 17.2, a: rng() * Math.PI * 2, r: 0.53 + rng() * 0.06, p: rng() * 6.28 })), []);
    const m4 = useMemo(() => new THREE.Matrix4(), []), t = useRef(0);
    useFrame((_, dt) => {
        if (!mesh.current) return;
        t.current += reduced ? 0 : Math.min(dt, 0.1);
        const drift = -Math.sign(current) * driftSpeed(current) * 1.6; // electron ngược chiều dòng quy ước (+x)
        seeds.forEach((e, i) => {
            const [cy, cz] = strands[e.s], jig = reduced ? 0 : 0.06;
            let x = e.x + drift * t.current; x = -8 + (((x + 8) % 17.2) + 17.2) % 17.2;
            m4.makeTranslation(x + Math.sin(t.current * 9 + e.p) * jig, cy + Math.cos(e.a) * e.r + Math.sin(t.current * 7 + e.p) * jig, cz + Math.sin(e.a) * e.r);
            mesh.current!.setMatrixAt(i, m4);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });
    return <group>
        {/* vỏ bổ dọc: chừa nửa trước để thấy lõi */}
        <mesh material={mats.sheath} rotation={[0.8, 0, -Math.PI / 2]} position={[-0.6, 0, 0]}>
            <cylinderGeometry args={[2.05, 2.05, 15, 48, 1, true, 0, Math.PI * 1.25]} />
        </mesh>
        <mesh material={mats.rim} position={[6.9, 0, 0]} rotation={[0, Math.PI / 2, 0]}><ringGeometry args={[1.72, 2.05, 48]} /></mesh>
        {strands.map(([y, z], i) => <group key={i} position={[0.6, y, z]}>
            <mesh material={mats.copper} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.5, 0.5, 17.2, 24]} /></mesh>
            <mesh material={mats.face} position={[8.61, 0, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.5, 24]} /></mesh>
        </group>)}
        <instancedMesh ref={mesh} args={[undefined, undefined, N]} material={mats.e} frustumCulled={false}><sphereGeometry args={[0.07, 8, 6]} /></instancedMesh>
    </group>;
}

function Lattice({ current, reduced, hdr }: { current: number; reduced: boolean; hdr: boolean }) {
    const a = 1.3, basis = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
    const cu = useMemo(() => { const out: [number, number, number][] = []; for (let i = -6; i <= 1; i++) for (let j = -2; j <= 2; j++) for (let k = -1; k <= 1; k++) for (const b of basis) { const x = (i + b[0]) * a, y = (j + b[1]) * a, z = (k + b[2]) * a; if (x <= 1.6) out.push([x, y, z]); } return out; }, []);
    const cPos = useMemo(() => { const out: [number, number, number][] = []; for (let c = 0; c < 5; c++) for (let d = 0; d < 2; d++) { const y0 = -2.4 + c * 1.2, z0 = -0.6 + d * 1.45; for (let s = 0; s < 9; s++) out.push([2.9 + s * 0.52, y0 + (s % 2 ? 0.3 : -0.3), z0]); } return out; }, []);
    const hPos = useMemo(() => cPos.flatMap((p, i) => [[p[0], p[1] + (i % 2 ? 0.42 : -0.42), p[2] + 0.28], [p[0], p[1] + (i % 2 ? 0.42 : -0.42), p[2] - 0.28]] as [number, number, number][]), [cPos]);
    const mats = useMemo(() => ({
        cu: new THREE.MeshStandardMaterial({ color: '#e0925c', metalness: 1, roughness: 0.28 }),
        c: new THREE.MeshStandardMaterial({ color: '#5b6470', roughness: 0.5 }),
        h: new THREE.MeshStandardMaterial({ color: '#eef2f5', roughness: 0.4 }),
        e: new THREE.MeshBasicMaterial({ color: new THREE.Color('#8fe6ff').multiplyScalar(hdr ? 2.4 : 1), toneMapped: false }),
        face: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    }), [hdr]);
    useEffect(() => () => Object.values(mats).forEach(m => m.dispose()), [mats]);
    const cuRef = useRef<THREE.InstancedMesh>(null), cRef = useRef<THREE.InstancedMesh>(null), hRef = useRef<THREE.InstancedMesh>(null), eRef = useRef<THREE.InstancedMesh>(null), bRef = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m4 = new THREE.Matrix4();
        cu.forEach((p, i) => cuRef.current?.setMatrixAt(i, m4.makeTranslation(...p)));
        cPos.forEach((p, i) => cRef.current?.setMatrixAt(i, m4.makeTranslation(...p)));
        hPos.forEach((p, i) => hRef.current?.setMatrixAt(i, m4.makeTranslation(...p)));
        [cuRef, cRef, hRef].forEach(r => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
    }, [cu, cPos, hPos]);
    const nE = 420, free = useMemo(() => Array.from({ length: nE }, () => [-7.6 + rng() * 9.0, -2.6 + rng() * 5.4, -1.3 + rng() * 3.3, rng() * 6.28, rng() * 6.28]), []);
    const m4 = useMemo(() => new THREE.Matrix4(), []), t = useRef(0), drift = useRef(0);
    useFrame((_, dt) => {
        const d = Math.min(dt, 0.1); t.current += reduced ? 0 : d;
        // electron trôi về cực (+) = ngược chiều dòng điện quy ước; Iab > 0 là dòng quy ước theo +x.
        drift.current += (reduced ? 0 : d) * -Math.sign(current) * driftSpeed(current) * 0.6;
        free.forEach((e, i) => {
            let x = e[0] + drift.current; x = -7.6 + (((x + 7.6) % 9.0) + 9.0) % 9.0;
            const j = reduced ? 0 : 0.18;
            eRef.current?.setMatrixAt(i, m4.makeTranslation(x + j * Math.sin(t.current * 7 + e[3]), e[1] + j * Math.sin(t.current * 6.3 + e[4]), e[2] + j * Math.cos(t.current * 5.1 + e[3])));
        });
        if (eRef.current) eRef.current.instanceMatrix.needsUpdate = true;
        cPos.forEach((p, i) => { for (let k = 0; k < 2; k++) { const ang = t.current * 3 + i * 1.7 + k * Math.PI; bRef.current?.setMatrixAt(i * 2 + k, m4.makeTranslation(p[0] + 0.36 * Math.cos(ang), p[1] + 0.22 * Math.sin(ang), p[2] + 0.36 * Math.sin(ang))); } });
        if (bRef.current) bRef.current.instanceMatrix.needsUpdate = true;
    });
    return <group>
        <instancedMesh ref={cuRef} args={[undefined, mats.cu, cu.length]}><sphereGeometry args={[0.3, 24, 16]} /></instancedMesh>
        <instancedMesh ref={eRef} args={[undefined, mats.e, nE]} frustumCulled={false}><sphereGeometry args={[0.1, 10, 8]} /></instancedMesh>
        <instancedMesh ref={cRef} args={[undefined, mats.c, cPos.length]}><sphereGeometry args={[0.26, 18, 12]} /></instancedMesh>
        <instancedMesh ref={hRef} args={[undefined, mats.h, hPos.length]}><sphereGeometry args={[0.12, 14, 10]} /></instancedMesh>
        <instancedMesh ref={bRef} args={[undefined, mats.e, cPos.length * 2]} frustumCulled={false}><sphereGeometry args={[0.075, 8, 6]} /></instancedMesh>
        <mesh material={mats.face} rotation={[0, Math.PI / 2, 0]} position={[2.25, 0, 0]}><planeGeometry args={[7, 7]} /></mesh>
    </group>;
}

function Rig({ layer, reduced }: { layer: number; reduced: boolean }) {
    const camera = useThree(s => s.camera), look = useRef(new THREE.Vector3(...CAMS[layer].target)), first = useRef(true);
    useFrame(({ clock }, dt) => {
        const c = CAMS[layer], k = first.current || reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 3.2);
        first.current = false;
        const sway = reduced ? 0 : Math.sin(clock.elapsedTime * 0.25) * 0.35;
        camera.position.lerp(new THREE.Vector3(c.pos[0] + sway, c.pos[1], c.pos[2]), k);
        look.current.lerp(new THREE.Vector3(...c.target), k);
        camera.lookAt(look.current);
    });
    return null;
}

function Scene({ layer, current, reduced, tone, hdr, onError }: WireDiveProps & { hdr: boolean }) {
    const gl = useThree(s => s.gl);
    useEffect(() => { const lost = (e: Event) => { e.preventDefault(); onError(); }; gl.domElement.addEventListener('webglcontextlost', lost); return () => gl.domElement.removeEventListener('webglcontextlost', lost); }, [gl, onError]);
    return <>
        <color attach="background" args={['#0d1822']} />
        <Environment />
        <directionalLight position={[4, 8, 9]} intensity={1.2} />
        <hemisphereLight args={['#dfeff5', '#1b2a33', 0.35]} />
        <Rig layer={layer} reduced={reduced} />
        {layer < 2 ? <MacroWire current={current} reduced={reduced} tone={tone} hdr={hdr} /> : <Lattice current={current} reduced={reduced} hdr={hdr} />}
    </>;
}

export default function WireDive(props: WireDiveProps) {
    const hdr = (FORCED_TIER ?? 'high') === 'high' && !FX_DISABLED;
    return <Canvas dpr={[1, 1.75]} camera={{ fov: 30, position: CAMS[props.layer].pos, near: 0.1, far: 200 }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={s => { s.gl.toneMapping = hdr ? THREE.NoToneMapping : THREE.NeutralToneMapping; }} aria-label="Đi từ vỏ nhựa đến lõi đồng và mạng tinh thể">
        <Suspense fallback={null}><Scene {...props} hdr={hdr} /></Suspense>
        {hdr && <Suspense fallback={null}><Effects /></Suspense>}
    </Canvas>;
}
