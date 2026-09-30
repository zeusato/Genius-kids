import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Simulation } from '../engine/simulation';
import { BoardView, cropBox, Lights, LightSlots, Room, smooth } from './BoardView';
import { cameraPosition, fitView } from './layout';
import { Emitters, LiveState } from './parts/PartModel';
import { FORCED_TIER, FX_DISABLED } from './params';

const Effects = lazy(() => import('./Effects'));
/** Khung mặt bàn gọn cho hai mạch mẫu (preset series/parallel nằm trong x 1,3–11,7). */
export const COMPARE_CROP = { x0: 1, z0: 0.7, x1: 12.4, z1: 7.3 };

export interface CompareBoard { key: string; title: string; subtitle: string; sim: Simulation }

function Environment() {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene);
    useEffect(() => {
        const pm = new THREE.PMREMGenerator(gl), env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = env;
        return () => { scene.environment = null; env.dispose(); pm.dispose(); };
    }, [gl, scene]);
    return null;
}

function CompareScene({ boards, schematic, night, hdr, reduced, selected, onTapPart, insets }: {
    boards: CompareBoard[]; schematic: boolean; night: boolean; hdr: boolean; reduced: boolean; selected: string | null;
    onTapPart: (board: number, partId: string) => void; insets: { top: number; bottom: number };
}) {
    const { camera, gl, size } = useThree();
    const box = cropBox(COMPARE_CROP, false), gap = 1.3, side = size.width / Math.max(1, size.height) > 1.05;
    // Ngang: hai bàn cạnh nhau. Dọc (điện thoại): chồng trên–dưới.
    const offsets = boards.map((_, i) => side ? [(i - 0.5) * (box.W + gap) - box.center[0], 0.7 - box.center[1]] as [number, number] : [-box.center[0], (i - 0.5) * (box.D + gap + 0.8) + 0.4 - box.center[1]] as [number, number]);
    const totalW = side ? box.W * 2 + gap : box.W, totalD = side ? box.D + 1.4 : box.D * 2 + gap + 1.6;
    const lives = useRef(boards.map(b => ({ current: { sim: () => b.sim, night, hdr, reduced, morph: schematic ? 1 : 0 } as LiveState }))).current;
    boards.forEach((b, i) => { lives[i].current.sim = () => b.sim; lives[i].current.night = night; lives[i].current.hdr = hdr; lives[i].current.reduced = reduced; });
    const emitters = useMemo<Emitters[]>(() => boards.map(() => new Map()), [boards.length]);
    const groups = useRef<(THREE.Group | null)[]>([]);
    useFrame((_, raw) => {
        const dt = Math.min(raw, 0.1), goal = schematic ? 1 : 0, speed = reduced ? 1 / 0.15 : 1 / 0.8;
        for (const l of lives) l.current.morph = goal > l.current.morph ? Math.min(goal, l.current.morph + dt * speed) : Math.max(goal, l.current.morph - dt * speed);
        const k = smooth(lives[0].current.morph), cam = camera as THREE.PerspectiveCamera;
        const elevation = 0.95 + (Math.PI / 2 - 0.0005 - 0.95) * k, fov = 30 + (16 - 30) * k, aspect = size.width / Math.max(1, size.height);
        const fit = fitView(totalW, totalD, fov, aspect, elevation, { top: insets.top / size.height, bottom: insets.bottom / size.height, left: 0.01, right: 0.01 }, 0.3, 1.5 * (1 - k) + 0.1);
        cam.fov = fov; cam.aspect = aspect; cam.updateProjectionMatrix();
        cam.position.set(...cameraPosition(fit.target, fit.distance, elevation));
        cam.up.set(0, 1, elevation > 1.55 ? -1 : 0).normalize(); cam.lookAt(fit.target[0], 0, fit.target[1]);
    });
    // Chạm một bóng để vặn lỏng / siết lại (chỉ bàn đó).
    useEffect(() => {
        const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down: [number, number] | null = null;
        const hit = (x: number, y: number) => {
            const r = gl.domElement.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
            for (let b = 0; b < groups.current.length; b++) {
                const g = groups.current[b]; if (!g) continue;
                for (const h of ray.intersectObject(g, true)) { let o: THREE.Object3D | null = h.object; while (o && !o.userData.partId) o = o.parent; if (o) return { b, id: o.userData.partId as string }; }
            }
            return null;
        };
        const pd = (e: PointerEvent) => { down = [e.clientX, e.clientY]; };
        const pu = (e: PointerEvent) => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return; const h = hit(e.clientX, e.clientY); if (h) onTapPart(h.b, h.id); down = null; };
        const pm = (e: PointerEvent) => { gl.domElement.style.cursor = hit(e.clientX, e.clientY) ? 'pointer' : 'default'; };
        gl.domElement.addEventListener('pointerdown', pd); gl.domElement.addEventListener('pointerup', pu); gl.domElement.addEventListener('pointermove', pm);
        return () => { gl.domElement.removeEventListener('pointerdown', pd); gl.domElement.removeEventListener('pointerup', pu); gl.domElement.removeEventListener('pointermove', pm); };
    }, [gl, camera, onTapPart]);
    return <>
        <color attach="background" args={[night ? '#0b1210' : '#afc6b6']} />
        <Lights night={night} hdr={hdr} span={16} />
        <LightSlots emitters={emitters} />
        <Room night={night} />
        {boards.map((b, i) => <group key={b.key} position={[offsets[i][0], 0, offsets[i][1]]}>
            <group ref={el => { groups.current[i] = el; }}>
                <BoardView sim={b.sim} portrait={false} flow="electron" selected={selected} live={lives[i]} emitters={emitters[i]} crop={COMPARE_CROP} />
            </group>
            <Html position={[box.center[0], 0.2, box.center[1] - box.D / 2 - (side ? 1.25 : 0.7)]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
                <div className="ew-compare-title"><b>{b.title}</b><span>{b.subtitle}</span></div>
            </Html>
        </group>)}
    </>;
}

export default function CompareCanvas(props: { boards: CompareBoard[]; schematic: boolean; reduced: boolean; selected: string | null; onTapPart: (board: number, partId: string) => void; insets: { top: number; bottom: number } }) {
    const [tier] = useState(FORCED_TIER ?? 'high'), hdr = tier === 'high' && !FX_DISABLED;
    return <div className="ew-3d-canvas">
        <Canvas shadows dpr={tier === 'high' ? [1, 1.75] : 1} camera={{ fov: 30, position: [0, 18, 12] }} gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }}
            onCreated={s => { s.gl.toneMapping = hdr ? THREE.NoToneMapping : THREE.NeutralToneMapping; }} aria-label="Hai mạch mẫu đặt cạnh nhau: nối tiếp và song song">
            <Environment />
            <Suspense fallback={null}><CompareScene {...props} night hdr={hdr} /></Suspense>
            {hdr && <Suspense fallback={null}><Effects /></Suspense>}
        </Canvas>
    </div>;
}
