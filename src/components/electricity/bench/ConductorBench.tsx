import React, { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Simulation } from '../engine/simulation';
import { BoardView, cropBox, Lights, LightSlots, Room, smooth } from './BoardView';
import { cameraPosition, fitView, toWorld } from './layout';
import { Emitters, LiveState } from './parts/PartModel';
import { FORCED_TIER, FX_DISABLED } from './params';

const Effects = lazy(() => import('./Effects'));
export const TESTER_CROP = { x0: 1.2, z0: 0.9, x1: 12.8, z1: 7.4 };
/** Vị trí kẹp mẫu trên bàn thử (tọa độ bàn) — khớp preset trong Activities. */
export const CLIP_AT: [number, number] = [7, 6.1];

function Environment() {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene);
    useEffect(() => {
        const pm = new THREE.PMREMGenerator(gl), env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = env;
        return () => { scene.environment = null; env.dispose(); pm.dispose(); };
    }, [gl, scene]);
    return null;
}

const std = (color: string, o: THREE.MeshPhysicalMaterialParameters = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, ...o });

/** Đồ vật thật cho từng mẫu (dựng bằng khối cơ bản, đủ nhận ra). Trục dài nằm theo x giữa hai kẹp. */
function SampleObject({ id }: { id: string }) {
    const node = useMemo(() => {
        const g = new THREE.Group(), add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, r?: [number, number, number]) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (r) m.rotation.set(...r); m.castShadow = true; g.add(m); return m; };
        const metal = (c: string) => std(c, { metalness: 1, roughness: 0.25 });
        const rodX = (r: number, l: number, seg = 18) => { const geo = new THREE.CylinderGeometry(r, r, l, seg); geo.rotateZ(Math.PI / 2); return geo; };
        switch (id) {
            case 'copperCore': add(rodX(0.07, 1.1), metal('#e39a64')); break;
            case 'aluminiumStrip': add(new RoundedBoxGeometry(1.15, 0.05, 0.3, 2, 0.02), metal('#d8dde2')); break;
            case 'steelSpoon': { const bowl = new THREE.SphereGeometry(0.3, 24, 12); bowl.scale(1, 0.25, 0.7); add(bowl, metal('#dfe3e8'), 0.42, 0.02, 0); add(new RoundedBoxGeometry(0.95, 0.04, 0.12, 2, 0.02), metal('#dfe3e8'), -0.25, 0, 0); break; }
            case 'brassKey': { const ring = new THREE.TorusGeometry(0.16, 0.05, 10, 24); ring.rotateX(Math.PI / 2); add(ring, metal('#d9b25e'), -0.38, 0, 0); add(new THREE.BoxGeometry(0.7, 0.05, 0.08), metal('#d9b25e'), 0.12, 0, 0); for (const x of [0.2, 0.32, 0.42]) add(new THREE.BoxGeometry(0.05, 0.05, 0.1), metal('#d9b25e'), x, 0, 0.08); break; }
            case 'paperClip': { const path = new THREE.CurvePath<THREE.Vector3>(); const pts = [[-0.5, -0.1], [0.45, -0.1], [0.45, 0.1], [-0.35, 0.1], [-0.35, -0.04], [0.3, -0.04]].map(([x, z]) => new THREE.Vector3(x, 0, z)); for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(pts[i - 1], pts[i])); add(new THREE.TubeGeometry(path, 60, 0.018, 6), metal('#c8ced6')); break; }
            case 'kitchenFoil': { const geo = new THREE.PlaneGeometry(1.1, 0.5, 18, 8); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setY(i, 0.03 * Math.sin(p.getX(i) * 23) * Math.cos(p.getZ(i) * 31)); geo.computeVertexNormals(); add(geo, std('#e6e9ec', { metalness: 1, roughness: 0.35, side: THREE.DoubleSide })); break; }
            case 'metalCoin': { const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 36); add(geo, metal('#d7a55a')); break; }
            case 'plasticRuler': add(new RoundedBoxGeometry(1.25, 0.04, 0.3, 2, 0.02), std('#7cc6c0', { transparent: true, opacity: 0.75, roughness: 0.2 })); break;
            case 'rubberEraser': add(new RoundedBoxGeometry(0.8, 0.26, 0.42, 3, 0.07), std('#f2929f', { roughness: 0.75 }), 0, 0.08, 0); break;
            case 'dryWood': for (const z of [-0.06, 0.06]) add(new THREE.CylinderGeometry(0.03, 0.05, 1.25, 10).rotateZ(Math.PI / 2), std('#d8b67c', { roughness: 0.8 }), 0, 0, z); break;
            case 'glassCup': { const cup = new THREE.CylinderGeometry(0.28, 0.22, 0.55, 28, 1, true); add(cup, std('#eef6f4', { transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide }), 0, 0.22, 0); break; }
            case 'dryPaper': add(new THREE.BoxGeometry(1.1, 0.01, 0.6), std('#fbf8ee', { roughness: 0.9 })); break;
            case 'graphiteRod': { const body = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6); body.rotateZ(Math.PI / 2); add(body, std('#f4c542', { roughness: 0.55 })); add(rodX(0.035, 1.2, 10), std('#3b3f45', { metalness: 0.4, roughness: 0.4 })); break; }
            case 'saltWater': case 'tapWater': {
                add(new THREE.CylinderGeometry(0.34, 0.3, 0.6, 28, 1, true), std('#eef6f4', { transparent: true, opacity: 0.3, roughness: 0.05, side: THREE.DoubleSide }), 0, 0.24, 0);
                add(new THREE.CylinderGeometry(0.32, 0.29, 0.42, 28), std(id === 'saltWater' ? '#9fd3e0' : '#b9dcea', { transparent: true, opacity: 0.55, roughness: 0.1 }), 0, 0.15, 0);
                for (const x of [-0.14, 0.14]) add(new THREE.BoxGeometry(0.04, 0.7, 0.14), metal('#c8ced6'), x, 0.32, 0);
                break;
            }
            case 'plasticJacket': { const j = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 16); j.rotateZ(Math.PI / 2); add(j, std('#e07c64', { roughness: 0.35 })); break; }
            default: add(rodX(0.07, 1), std('#9aa39d'));
        }
        return g;
    }, [id]);
    useEffect(() => () => node.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } }), [node]);
    return <primitive object={node} />;
}

function TesterScene({ sim, sampleId, clamped, sensitive, hdr, reduced }: { sim: Simulation; sampleId: string; clamped: boolean; sensitive: boolean; hdr: boolean; reduced: boolean }) {
    const { camera, size } = useThree();
    const box = cropBox(TESTER_CROP, false);
    const live = useRef<LiveState>({ sim: () => sim, night: false, hdr, reduced, morph: 0, hideSampleRod: true });
    live.current.sim = () => sim; live.current.hdr = hdr;
    const emitters = useMemo<Emitters>(() => new Map(), []), list = useMemo(() => [emitters], [emitters]);
    const drop = useRef<THREE.Group>(null), t = useRef(clamped ? 1 : 0);
    const [cx, cz] = toWorld(CLIP_AT[0], CLIP_AT[1], false);
    useFrame((_, raw) => {
        const dt = Math.min(raw, 0.1), cam = camera as THREE.PerspectiveCamera, aspect = size.width / Math.max(1, size.height);
        t.current = reduced ? (clamped ? 1 : 0) : clamped ? Math.min(1, t.current + dt * 3) : Math.max(0, t.current - dt * 3);
        if (drop.current) { const k = smooth(t.current); drop.current.position.set(cx, 0.44 + 0.7 * (1 - k), cz); drop.current.rotation.z = (1 - k) * 0.12; drop.current.scale.setScalar(1.45); }
        const fit = fitView(box.W, box.D, 30, aspect, 0.95, { top: 0.02, bottom: 0.02, left: 0.02, right: 0.02 }, 0.2, 1.5);
        cam.fov = 30; cam.aspect = aspect; cam.updateProjectionMatrix();
        const target: [number, number] = [fit.target[0] + box.center[0], fit.target[1] + box.center[1]];
        cam.position.set(...cameraPosition(target, fit.distance, 0.95)); cam.up.set(0, 1, 0); cam.lookAt(target[0], 0, target[1]);
    });
    void sensitive;
    return <>
        <color attach="background" args={['#e9e8d6']} />
        <Lights night={false} hdr={hdr} span={10} />
        <LightSlots emitters={list} />
        <Room night={false} />
        <BoardView sim={sim} portrait={false} flow="electron" selected={null} live={live} emitters={emitters} crop={TESTER_CROP} />
        <group ref={drop}><SampleObject id={sampleId} /></group>
    </>;
}

/** Bàn thử vật dẫn: pin 3 V → bóng thử → ampe kế → hai kẹp mẫu. Kết quả điện lấy từ cùng bộ giải. */
export default function ConductorBench(props: { sim: Simulation; sampleId: string; clamped: boolean; sensitive: boolean; reduced: boolean }) {
    const hdr = (FORCED_TIER ?? 'high') === 'high' && !FX_DISABLED;
    return <div className="ew-3d-canvas">
        <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 30, position: [0, 14, 10] }} gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }}
            onCreated={s => { s.gl.toneMapping = hdr ? THREE.NoToneMapping : THREE.NeutralToneMapping; }} aria-label="Bàn thử vật dẫn điện: pin, bóng thử, ampe kế và hai kẹp mẫu">
            <Environment />
            <Suspense fallback={null}><TesterScene {...props} hdr={hdr} /></Suspense>
            {hdr && <Suspense fallback={null}><Effects /></Suspense>}
        </Canvas>
    </div>;
}
