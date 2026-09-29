// Phòng thí nghiệm trong canvas: 🎆 Pháo hoa giao thừa (Hồ Gươm) và ⚛️ Xưởng nguyên tử.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { mixColor, type ShellShape } from '../../../data/periodic/fireworks';
import { nucleusPack, protonMask, rng, simpleShells } from '../engine/atom';
import type { QualityTier } from './params';
import { pxToWorld, stageFrame, worldPerPx } from './screen';
import { makeHalo, softDot, useSurface } from './common';
import { ElectronShells3D } from './AtomLevels';

// ---------------------------------------------------------------- pháo hoa
export interface FireworksApi { launch: (x: number, y: number, zs: number[], shape: ShellShape) => void }

interface Shell { t0: number; x: number; y: number; ox: number; colors: THREE.Color[]; shape: ShellShape; dirs: Float32Array; seeds: Float32Array; n: number; willow: boolean; sparkle: boolean }

const RISE = 1.0, WATER = 0.74;   // thời gian bay lên (s); mặt hồ ở 74 % chiều cao màn
const shapeDirs = (shape: ShellShape, n: number, R: () => number): Float32Array => {
    const d = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
        let x = 0, y = 0;
        const a = (i / n) * Math.PI * 2;
        if (shape === 'heart') { x = 16 * Math.sin(a) ** 3 / 17; y = (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17; }
        else if (shape === 'star') { const k = Math.floor((a / (Math.PI * 2)) * 10), f = (a / (Math.PI * 2)) * 10 - k; const r0 = k % 2 ? 0.42 : 1, r1 = k % 2 ? 1 : 0.42; const aa = -Math.PI / 2 + (k + f) * Math.PI / 5; const r = r0 + (r1 - r0) * f; x = Math.cos(aa) * r; y = -Math.sin(aa) * r; }
        else if (shape === 'ring') { x = Math.cos(a); y = Math.sin(a) * 0.45; }
        else { const u = R() * 2 - 1, t = R() * Math.PI * 2, s = Math.sqrt(1 - u * u); x = Math.cos(t) * s; y = u; const m = shape === 'willow' ? 0.9 + R() * 0.1 : 0.75 + R() * 0.25; x *= m; y *= m; }
        d[i * 2] = x; d[i * 2 + 1] = y;
    }
    return d;
};

export const Fireworks: React.FC<{ apiRef: React.MutableRefObject<FireworksApi | null>; tier: QualityTier; onBoom: () => void }> = ({ apiRef, tier, onBoom }) => {
    const size = useThree(s => s.size);
    const MAX = tier === 'high' ? 36000 : 12000;
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
        return g;
    }, [MAX]);
    const shells = useRef<Shell[]>([]);
    const boomed = useRef(new WeakSet<Shell>());
    const R = useMemo(() => rng(2026), []);
    useLayoutEffect(() => {
        apiRef.current = {
            launch: (x, y, zs, shape) => {
                const n = shape === 'heart' || shape === 'star' || shape === 'ring' ? 150 : tier === 'high' ? 260 : 150;
                const colors = mixColor(zs).map(c => new THREE.Color(c));
                shells.current.push({ t0: performance.now() / 1000, x, y: Math.min(y, size.height * WATER - 80), ox: x + (R() - 0.5) * 60, colors, shape, dirs: shapeDirs(shape, n, R),
                    seeds: Float32Array.from({ length: n }, () => R()), n, willow: shape === 'willow' || zs.includes(26), sparkle: zs.includes(12) });
                if (shells.current.length > 12) shells.current.shift();
            },
        };
        return () => { apiRef.current = null; };
    }, [apiRef, size.height, tier, R]);
    const v = new THREE.Vector3();
    useFrame(() => {
        const now = performance.now() / 1000, vp = { w: size.width, h: size.height };
        const pos = geo.attributes.position.array as Float32Array, col = geo.attributes.color.array as Float32Array;
        const waterY = vp.h * WATER;
        let k = 0;
        const put = (x: number, y: number, c: THREE.Color, a: number) => {
            if (k >= MAX - 1) return;
            pxToWorld(x, y, vp, v); pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = 0; col[k * 3] = c.r * a; col[k * 3 + 1] = c.g * a; col[k * 3 + 2] = c.b * a; k++;
            if (y < waterY) { pxToWorld(x + Math.sin(y * 0.05 + now * 3) * 3, 2 * waterY - y, vp, v); pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = 0; const r = a * 0.28; col[k * 3] = c.r * r; col[k * 3 + 1] = c.g * r; col[k * 3 + 2] = c.b * r; k++; }
        };
        shells.current = shells.current.filter(s => now - s.t0 < RISE + (s.willow ? 4.2 : 3));
        for (const s of shells.current) {
            const t = now - s.t0;
            if (t < RISE) {                     // tên lửa bay lên
                const e = 1 - (1 - t / RISE) ** 2;
                const x = s.ox + (s.x - s.ox) * e, y = waterY + (s.y - waterY) * e;
                for (let j = 0; j < 6; j++) put(x, y + j * 6, WARM, 1 - j / 6);
                continue;
            }
            if (!boomed.current.has(s)) { boomed.current.add(s); onBoom(); }
            const tb = t - RISE, life = s.willow ? 4.2 : 3;
            const drag = s.willow ? 1.6 : 2.4, speed = Math.min(vp.w, vp.h) * (s.willow ? 0.42 : s.shape === 'peony' || s.shape === 'chrysanthemum' ? 0.66 : 0.5);
            const fade = Math.max(0, 1 - tb / life);
            const trail = s.shape === 'chrysanthemum' || s.willow ? 8 : 6;
            for (let i = 0; i < s.n; i++) {
                const c = s.willow ? GOLD : s.colors[i % s.colors.length];
                const tw = s.sparkle ? (Math.sin(now * 40 + s.seeds[i] * 50) > 0 ? 1 : 0.2) : 1;
                for (let j = 0; j < trail; j++) {
                    const tt = Math.max(0, tb - j * 0.028);
                    const reach = (1 - Math.exp(-drag * tt)) / drag;
                    const grav = s.shape === 'heart' || s.shape === 'star' || s.shape === 'ring' ? 22 : 60;
                    const x = s.x + s.dirs[i * 2] * speed * reach, y = s.y - s.dirs[i * 2 + 1] * speed * reach + grav * tt * tt;
                    put(x, y, c, (j === 0 ? 2.4 : 1.3) * fade * fade * tw * (1 - j / trail) * (tb < 0.12 ? 2.2 : 1));
                }
            }
        }
        geo.setDrawRange(0, k);
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    });
    return (
        <points geometry={geo} frustumCulled={false}>
            <pointsMaterial size={0.1} map={softDot()} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
    );
};
const WARM = new THREE.Color('#ffd28a'), GOLD = new THREE.Color('#ffb347');

// ---------------------------------------------------------------- xưởng nguyên tử
export const BuilderAtom: React.FC<{ p: number; n: number; e: number; tier: QualityTier; unstable: boolean }> = ({ p, n, e, tier, unstable }) => {
    const size = useThree(s => s.size);
    const root = useRef<THREE.Group>(null), nuc = useRef<THREE.Group>(null);
    const A = p + n;
    const pack = useMemo(() => (A > 0 ? nucleusPack(Math.max(1, p), A) : new Float32Array()), [p, A]);
    const mask = useMemo(() => (A > 0 ? protonMask(p, A) : new Uint8Array()), [p, A]);
    const scale = useMemo(() => { let m = 0; for (let i = 0; i < A; i++) m = Math.max(m, Math.hypot(pack[i * 3], pack[i * 3 + 1], pack[i * 3 + 2])); return 0.3 / (m + 1); }, [pack, A]);
    const mat = useSurface(tier, { color: '#ffffff', metal: false, roughness: 0.35 });
    const inst = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const m = inst.current; if (!m) return;
        const m4 = new THREE.Matrix4(), red = new THREE.Color('#ef4444'), blue = new THREE.Color('#93c5fd');
        for (let i = 0; i < A; i++) { m4.makeTranslation(pack[i * 3], pack[i * 3 + 1], pack[i * 3 + 2]); m.setMatrixAt(i, m4); m.setColorAt(i, mask[i] ? red : blue); }
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [pack, mask, A]);
    const shells = simpleShells(e);
    const halo = useMemo(() => makeHalo('#fb7185', 0.5), []);
    useFrame((st) => {
        const vp = { w: size.width, h: size.height }, f = stageFrame(vp), k = worldPerPx(vp);
        if (root.current) { pxToWorld(f.cx, f.cy, vp, root.current.position); root.current.scale.setScalar((f.size * k) / 2.6); }
        if (nuc.current) { nuc.current.rotation.y = st.clock.elapsedTime * 0.4; const sh = unstable ? 0.01 : 0; nuc.current.position.set(Math.sin(st.clock.elapsedTime * 40) * sh, Math.cos(st.clock.elapsedTime * 47) * sh, 0); }
    });
    return (
        <group ref={root}>
            <group ref={nuc} scale={scale}>
                {A > 0 && <instancedMesh key={A} ref={inst} args={[undefined, undefined, A]} material={mat}><sphereGeometry args={[1, 16, 12]} /></instancedMesh>}
            </group>
            {A > 0 && <mesh material={halo}><sphereGeometry args={[0.42, 20, 14]} /></mesh>}
            <ElectronShells3D shells={shells} radius={(i) => 0.55 + i * 0.2} eSize={0.045} vSize={0.05} />

        </group>
    );
};
