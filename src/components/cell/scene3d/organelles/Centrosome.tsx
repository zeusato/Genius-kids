import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, getSoftDotTexture, useDisposable } from '../materials';
import { createRandom, randomDirection, Vec3 } from '../noise';
import { merge } from '../geo';
import { ShellShape, shellRadius } from '../shell';
import { getVesicleGeometry } from './shared';

// Trung tử: 9 bộ ba vi ống xếp chong chóng — cấu trúc "9 × 3" kinh điển của sách giáo khoa
let centrioleGeo: THREE.BufferGeometry | null = null;
export function centrioleGeometry(): THREE.BufferGeometry {
    if (centrioleGeo) return centrioleGeo;
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const cx = Math.cos(a) * 0.12, cz = Math.sin(a) * 0.12;
        const tx = Math.cos(a + 0.75), tz = Math.sin(a + 0.75);
        for (let m = 0; m < 3; m++) {
            const off = (m - 1) * 0.03;
            parts.push(new THREE.CylinderGeometry(0.0145, 0.0145, 0.36, 6, 1).translate(cx + tx * off, 0, cz + tz * off));
        }
    }
    centrioleGeo = merge(parts);
    return centrioleGeo;
}

interface Polyline {
    pts: THREE.Vector3[];
    cum: number[];   // độ dài cộng dồn
    len: number;
}

function toPolyline(pts: THREE.Vector3[]): Polyline {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    return { pts, cum, len: cum[cum.length - 1] };
}

function samplePolyline(pl: Polyline, s: number, out: THREE.Vector3): THREE.Vector3 {
    const d = THREE.MathUtils.clamp(s, 0, 1) * pl.len;
    let i = 1;
    while (i < pl.cum.length - 1 && pl.cum[i] < d) i++;
    const t = (d - pl.cum[i - 1]) / Math.max(pl.cum[i] - pl.cum[i - 1], 1e-6);
    return out.lerpVectors(pl.pts[i - 1], pl.pts[i], t);
}

// Vi ống tỏa từ trung thể ra sát màng, uốn vòng qua nhân (không xuyên nhân)
function buildMicrotubules(center: THREE.Vector3, count: number, shape: ShellShape, nucleus: { center: Vec3; radius: number }, seed: string): Polyline[] {
    const rand = createRandom(`${seed}-mt`);
    const N = new THREE.Vector3(...nucleus.center);
    const out: Polyline[] = [];
    let guard = 0;
    while (out.length < count && guard < count * 12) {
        guard++;
        const [dx, dy, dz] = randomDirection(rand);
        const end = new THREE.Vector3(dx, dy, dz).multiplyScalar(shellRadius(dx, dy, dz, shape) * 0.94);
        const ctrl = center.clone().add(end).multiplyScalar(0.5);
        ctrl.add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.7));
        let ok = false;
        let pts: THREE.Vector3[] = [];
        for (let iter = 0; iter < 4; iter++) {
            pts = [];
            let minD = Infinity;
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                const p = new THREE.Vector3()
                    .addScaledVector(center, (1 - t) * (1 - t))
                    .addScaledVector(ctrl, 2 * (1 - t) * t)
                    .addScaledVector(end, t * t);
                pts.push(p);
                minD = Math.min(minD, p.distanceTo(N));
            }
            if (minD > nucleus.radius + 0.12) { ok = true; break; }
            const push = ctrl.clone().sub(N).normalize().multiplyScalar(nucleus.radius + 0.45 - minD);
            ctrl.add(push);
        }
        if (ok) out.push(toPolyline(pts));
    }
    return out;
}

interface CentrosomeProps {
    position: Vec3;
    membrane: ShellShape;
    nucleus: { center: Vec3; radius: number };
    seed: string;
    color: string;
    scale?: number;
}

interface Cargo { path: number; s: number; speed: number; r: number }

// Trung thể (2 trung tử vuông góc + quầng vật chất quanh trung tử) và bộ khung tế bào: vi ống phát
// sáng như "đường ray" tỏa khắp tế bào; túi hàng từ Golgi chạy dọc đường ray ra màng (cảnh đáng nhớ
// nhất của The Inner Life of the Cell).
export const Centrosome: React.FC<CentrosomeProps> = ({ position, membrane, nucleus, seed, color, scale = 1 }) => {
    const { tier, clock } = useCellCtx();
    const high = tier === 'high';
    const focusC = useFocus('centrosome');
    const focusK = useFocus('cytoskeleton');
    const handlersC = useSelectHandlers('centrosome');
    const center = useMemo(() => new THREE.Vector3(...position), [position]);

    const fx = useMemo(() => createFx('#fefce8'), []);
    const cMat = useMemo(() => createOrganicMaterial({
        color, roughness: 0.35, clearcoat: 0.8, emissive: '#facc15', emissiveIntensity: 0.45, fx
    }, tier).material, [color, tier, fx]);
    const cargoFx = useMemo(() => createFx('#fff7ed'), []);
    const cargoMat = useMemo(() => createOrganicMaterial({
        color: '#fdba74', roughness: 0.2, clearcoat: 1, emissive: '#fb923c', emissiveIntensity: 0.45,
        jelly: { center: 0.6, edge: 0.98 }, fx: cargoFx
    }, tier).material, [tier, cargoFx]);

    useDisposable(cMat, cargoMat);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const tubes = useMemo(() => buildMicrotubules(center, high ? 46 : 24, membrane, nucleus, seed), [seed, high]);

    // Line segments: cặp điểm liên tiếp, màu HDR sáng ở gốc (trung thể) nhạt dần ra màng
    const { segPoints, segColors } = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const cols: [number, number, number][] = [];
        tubes.forEach((pl) => {
            for (let i = 1; i < pl.pts.length; i++) {
                pts.push(pl.pts[i - 1], pl.pts[i]);
                const f0 = 1 - (i - 1) / (pl.pts.length - 1), f1 = 1 - i / (pl.pts.length - 1);
                cols.push([0.35 + 0.9 * f0, 0.9 + 0.9 * f0, 1.0 + 0.9 * f0], [0.35 + 0.9 * f1, 0.9 + 0.9 * f1, 1.0 + 0.9 * f1]);
            }
        });
        return { segPoints: pts, segColors: cols };
    }, [tubes]);

    const lineRef = useRef<{ material: THREE.Material & { opacity: number; linewidth: number } } | null>(null);

    // Túi hàng chạy trên vi ống
    const cargo = useMemo<Cargo[]>(() => {
        const rand = createRandom(`${seed}-cargo`);
        return Array.from({ length: high ? 8 : 4 }, () => ({
            path: Math.floor(rand() * tubes.length),
            s: rand(),
            speed: 0.05 + rand() * 0.04,
            r: 0.04 + rand() * 0.02
        }));
    }, [tubes, seed, high]);
    const cargoRef = useRef<THREE.InstancedMesh>(null);
    const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
    const rand = useMemo(() => createRandom(`${seed}-cargo-respawn`), [seed]);

    const glowTex = getSoftDotTexture();
    const cAnchor = useRef<THREE.Group>(null);
    const cLabel = useRef<THREE.Object3D>(null);
    const kAnchor = useRef<THREE.Object3D>(null);
    useRegister('centrosome', cAnchor, 0.3 * scale, cLabel);
    useRegister('cytoskeleton', kAnchor, 1.1);

    useEffect(() => {
        // nhãn "bộ khung" đặt trên vi ống chạy về phía trên-phải (tách xa nhãn trung thể)
        const slot = new THREE.Vector3(0.5, 0.85, 0.25).normalize();
        let pl = tubes[0], best = -Infinity;
        for (const t of tubes) {
            const d = t.pts[t.pts.length - 1].clone().sub(t.pts[0]).normalize().dot(slot);
            if (d > best) { best = d; pl = t; }
        }
        if (pl && kAnchor.current) samplePolyline(pl, 0.62, kAnchor.current.position);
        cargoRef.current?.computeBoundingSphere();
    }, [tubes]);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        dampFx(fx, focusC, delta, focusC === 'this' ? 0.3 * Math.sin(t * 3) : 0);
        dampFx(cargoFx, focusK === 'this' ? 'this' : focusC === 'this' ? 'none' : focusK, delta);
        const line = lineRef.current;
        if (line) {
            const target = focusK === 'this' || focusC === 'this' ? 0.9 : focusK === 'other' ? 0.12 : 0.32;
            line.material.opacity += (target - line.material.opacity) * (1 - Math.exp(-delta * 5));
        }
        const m = cargoRef.current;
        if (!m) return;
        const dt = Math.min(delta, 0.1) * clock.timeScale;
        cargo.forEach((c, i) => {
            c.s += (c.speed * dt) / Math.max(tubes[c.path]?.len ?? 1, 0.5) * 2.2;
            if (c.s > 1) {
                c.s = 0;
                c.path = Math.floor(rand() * tubes.length);
            }
            const pl = tubes[c.path];
            if (!pl) return;
            samplePolyline(pl, c.s, tmp.p);
            // lớn dần khi rời trung tâm, co lại khi hòa vào màng ở cuối đường
            const grow = Math.min(1, c.s * 8) * Math.min(1, (1 - c.s) * 10);
            tmp.s.setScalar(c.r * (0.3 + 0.7 * grow));
            tmp.m.compose(tmp.p, tmp.q, tmp.s);
            m.setMatrixAt(i, tmp.m);
        });
        m.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <Line
                ref={lineRef as never}
                points={segPoints}
                segments
                vertexColors={segColors}
                lineWidth={high ? 1.5 : 1.2}
                transparent
                opacity={0.32}
                depthWrite={false}
                toneMapped={false}
                raycast={() => null}
            />
            <instancedMesh ref={cargoRef} args={[getVesicleGeometry(), cargoMat, cargo.length]} raycast={() => null} frustumCulled={false} renderOrder={2} />
            <object3D ref={kAnchor} />
            <group ref={cAnchor} position={position} scale={scale}>
                <object3D ref={cLabel} position={[0.05, 0.42, 0.05]} />
                <mesh geometry={centrioleGeometry()} material={cMat} {...handlersC} />
                <mesh geometry={centrioleGeometry()} material={cMat} rotation={[0, 0, Math.PI / 2]} position={[0.2, 0.22, 0.02]} {...handlersC} />
                <sprite scale={0.95} raycast={() => null}>
                    <spriteMaterial map={glowTex} color="#fde68a" transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
                </sprite>
                <mesh visible={false} {...handlersC} scale={0.34}>
                    <sphereGeometry args={[1, 12, 10]} />
                    <meshBasicMaterial side={THREE.BackSide} />
                </mesh>
            </group>
        </group>
    );
};
