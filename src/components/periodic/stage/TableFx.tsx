// FX bám ô DOM ở chế độ bảng (canvas trong suốt, pointer-events none):
//  - bọt khí nổi lên từ ô đang ở thể khí (kính 🌡️), lấp lánh ở ô lỏng
//  - tia lóe khi một ô vừa được sưu tầm
//  - mở màn "Từ Vụ Nổ Lớn đến em": tia bay từ nguồn (Vụ Nổ Lớn, sao, siêu tân tinh, kilonova…) vào đúng ô
// Vị trí ô lấy từ CellRects (cache, đọc lại khi resize/scroll). Một Points cho mỗi loại, CPU cập nhật ≤ ~2k hạt.
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CellRects, pxToWorld } from './screen';
import { makeHalo, softDot, clamp01 } from './common';
import { rng } from '../engine/atom';
import { INTRO_BEATS, type IntroFx } from '../engine/intro';

const v = new THREE.Vector3();

function points(n: number) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { geo, pos, col, size, n };
}

// ---------------------------------------------------------------- bọt khí + sưu tầm
export interface CellFxState { gas: number[]; liquid: number[]; bursts: { z: number; t0: number; color: THREE.Color }[] }

export const CellFx: React.FC<{ rects: CellRects; state: CellFxState }> = ({ rects, state }) => {
    const P = useMemo(() => points(118 * 3 + 118 * 2 + 240), []);
    const size = useThree(s => s.size);
    const seeds = useMemo(() => { const R = rng(99); return Float32Array.from({ length: P.n * 2 }, () => R()); }, [P.n]);
    const warm = useMemo(() => new THREE.Color('#fed7aa'), []), cyan = useMemo(() => new THREE.Color('#a5f3fc'), []);
    useFrame((st) => {
        const t = st.clock.elapsedTime, vp = { w: size.width, h: size.height };
        let k = 0;
        const put = (x: number, y: number, c: THREE.Color, a: number) => {
            pxToWorld(x, y, vp, v); P.pos.set([v.x, v.y, 0], k * 3); P.col.set([c.r * a, c.g * a, c.b * a], k * 3); k++;
        };
        for (const z of state.gas) {
            const x0 = rects.x[z], y0 = rects.y[z], s = rects.s[z];
            if (!s) continue;
            for (let j = 0; j < 3; j++) {
                const r = seeds[k * 2], life = (t * 0.45 + r + j / 3) % 1;
                put(x0 + (seeds[k * 2 + 1] - 0.5) * s * 0.7 + Math.sin(t * 2 + r * 9) * 3, y0 + s * 0.3 - life * s * 1.1, warm, (1 - life) * 0.9);
            }
        }
        for (const z of state.liquid) {
            const x0 = rects.x[z], y0 = rects.y[z], s = rects.s[z];
            if (!s) continue;
            for (let j = 0; j < 2; j++) {
                const r = seeds[k * 2], tw = 0.5 + 0.5 * Math.sin(t * 3 + r * 20);
                put(x0 + (seeds[k * 2 + 1] - 0.5) * s * 0.8, y0 + s * (0.05 + r * 0.35), cyan, tw * 0.9);
            }
        }
        const now = performance.now() / 1000;
        state.bursts = state.bursts.filter(b => now - b.t0 < 1.2);
        for (const b of state.bursts) {
            const x0 = rects.x[b.z], y0 = rects.y[b.z], s = rects.s[b.z], age = (now - b.t0) / 1.2;
            for (let j = 0; j < 24 && k < P.n; j++) { const a = j / 24 * 6.28; put(x0 + Math.cos(a) * s * (0.4 + age * 1.2), y0 + Math.sin(a) * s * (0.4 + age * 1.2), b.color, 1 - age); }
        }
        for (let i = k; i < P.n; i++) P.pos.set([0, 0, -50], i * 3);
        P.geo.setDrawRange(0, k);
        P.geo.attributes.position.needsUpdate = true; P.geo.attributes.color.needsUpdate = true;
    });
    return (
        <points geometry={P.geo} frustumCulled={false}>
            <pointsMaterial size={0.08} map={softDot()} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
    );
};

// ---------------------------------------------------------------- mở màn
/** clock.t = thời gian ảo của mở màn (giây) — trang ghi, có thể chạy chậm lại khi đang chờ đọc xong. */
export interface IntroPlan { start: number; clock: { t: number }; ignite: Map<number, number>; colors: Map<number, string>; fxOf: Map<number, IntroFx> }

const SPARKS = 9;

export const IntroFxLayer: React.FC<{ rects: CellRects; plan: IntroPlan }> = ({ rects, plan }) => {
    const size = useThree(s => s.size);
    const zs = useMemo(() => [...plan.ignite.keys()], [plan]);
    const P = useMemo(() => points(zs.length * SPARKS + 700), [zs.length]);
    const R = useMemo(() => { const r = rng(7); return Float32Array.from({ length: (zs.length * SPARKS + 700) * 4 }, () => r()); }, [zs.length]);
    const ring = useRef<THREE.Mesh>(null), orbA = useRef<THREE.Mesh>(null), orbB = useRef<THREE.Mesh>(null), flash = useRef<THREE.Mesh>(null);
    const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#f9a8d4').multiplyScalar(2), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }), []);
    const orbMat = useMemo(() => makeHalo('#fde68a', 1.6), []);
    const flashMat = useMemo(() => makeHalo('#ffffff', 2), []);
    const cols = useMemo(() => new Map([...plan.colors].map(([z, c]) => [z, new THREE.Color(c)])), [plan]);
    const src = new THREE.Vector2();
    useFrame(() => {
        const t = plan.clock.t;
        const vp = { w: size.width, h: size.height };
        let k = 0;
        const put = (x: number, y: number, c: THREE.Color, a: number) => { pxToWorld(x, y, vp, v); P.pos.set([v.x, v.y, 0.5], k * 3); P.col.set([c.r * a, c.g * a, c.b * a], k * 3); k++; };
        // nền sao lấp lánh trong nhịp "các ngôi sao"
        const starA = clamp01((t - 3.3) / 0.6) * clamp01((12.5 - t) / 1);
        if (starA > 0) for (let i = 0; i < 260; i++) {
            const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + R[i * 4] * 3) + R[i * 4 + 1] * 9));
            put(R[i * 4 + 2] * vp.w, R[i * 4 + 3] * vp.h, WHITE, starA * tw * 0.7);
        }
        // tia bay vào ô
        zs.forEach((z, zi) => {
            const ti = plan.ignite.get(z)!, fx = plan.fxOf.get(z)!, c = cols.get(z) ?? WHITE;
            const x1 = rects.x[z], y1 = rects.y[z];
            if (!rects.s[z]) return;
            for (let j = 0; j < SPARKS; j++) {
                const q = (zi * SPARKS + j) * 4, dur = 1.1 + R[q] * 0.5, u = (t - (ti - dur)) / dur;
                if (u < 0 || u > 1.15) continue;
                sourceOf(fx, vp, R[q + 1], R[q + 2], src);
                const cx = (src.x + x1) / 2 + (R[q + 3] - 0.5) * vp.w * 0.35, cy = Math.min(src.y, y1) - vp.h * 0.15 * R[q + 1];
                const e = Math.min(1, u), a = 1 - e, b = e;
                const x = a * a * src.x + 2 * a * b * cx + b * b * x1, y = a * a * src.y + 2 * a * b * cy + b * b * y1;
                put(x, y, c, u > 1 ? (1.15 - u) / 0.15 : 0.4 + 0.6 * e);
            }
        });
        for (let i = k; i < P.n; i++) P.pos.set([0, 0, -50], i * 3);
        P.geo.setDrawRange(0, k);
        P.geo.attributes.position.needsUpdate = true; P.geo.attributes.color.needsUpdate = true;
        // chớp Vụ Nổ Lớn / sao lùn trắng
        const fl = Math.max(pulse(t, 0.6, 1.2), pulse(t, 10, 0.8) * 0.6);
        if (flash.current) { flash.current.visible = fl > 0.01; pxToWorld(t < 5 ? vp.w / 2 : vp.w * 0.82, t < 5 ? vp.h / 2 : vp.h * 0.3, vp, v); flash.current.position.set(v.x, v.y, 1); flash.current.scale.setScalar(0.5 + fl * 4 + (t < 5 ? (t - 0.6) * 3 : 0)); flashMat.uniforms.uStrength.value = 2 * fl; }
        // sóng xung kích siêu tân tinh
        const sn = clamp01((t - 7) / 1.6);
        if (ring.current) { ring.current.visible = sn > 0 && sn < 1; pxToWorld(vp.w * 0.22, vp.h * 0.3, vp, v); ring.current.position.set(v.x, v.y, 1); ring.current.scale.setScalar(0.2 + sn * 9); ringMat.opacity = 0.9 * (1 - sn); }
        // kilonova: hai chấm xoắn vào nhau rồi hòa làm một
        const kn = clamp01((t - 12.3) / 0.9);
        if (orbA.current && orbB.current) {
            const on = t > 12.3 && t < 14; orbA.current.visible = orbB.current.visible = on;
            pxToWorld(vp.w / 2, vp.h * 0.18, vp, v);
            const r = (1 - kn) * 0.9, ang = kn * 14;
            orbA.current.position.set(v.x + Math.cos(ang) * r, v.y + Math.sin(ang) * r * 0.5, 1);
            orbB.current.position.set(v.x - Math.cos(ang) * r, v.y - Math.sin(ang) * r * 0.5, 1);
            const s = kn < 1 ? 0.25 : 0.25 + (t - 13.2) * 2.2; orbA.current.scale.setScalar(s); orbB.current.scale.setScalar(s);
            orbMat.uniforms.uStrength.value = kn < 1 ? 1.6 : Math.max(0, 1.6 * (1 - (t - 13.2) / 0.8));
        }
    });
    return (
        <>
            <points geometry={P.geo} frustumCulled={false}>
                <pointsMaterial size={0.09} map={softDot()} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>
            <mesh ref={flash} material={flashMat} visible={false}><sphereGeometry args={[0.3, 24, 16]} /></mesh>
            <mesh ref={ring} material={ringMat} visible={false}><torusGeometry args={[0.3, 0.012, 8, 96]} /></mesh>
            <mesh ref={orbA} material={orbMat} visible={false}><sphereGeometry args={[0.3, 20, 14]} /></mesh>
            <mesh ref={orbB} material={orbMat} visible={false}><sphereGeometry args={[0.3, 20, 14]} /></mesh>
        </>
    );
};

const WHITE = new THREE.Color('#ffffff');
const pulse = (t: number, at: number, dur: number) => (t < at || t > at + dur ? 0 : 1 - (t - at) / dur);

function sourceOf(fx: IntroFx, vp: { w: number; h: number }, a: number, b: number, out: THREE.Vector2) {
    switch (fx) {
        case 'bigbang': return out.set(vp.w / 2, vp.h / 2);
        case 'stars': return out.set(a * vp.w, b * vp.h);
        case 'supernova': return out.set(vp.w * 0.22, vp.h * 0.3);
        case 'whitedwarf': return out.set(vp.w * 0.82, vp.h * 0.3);
        case 'kilonova': return out.set(vp.w / 2, vp.h * 0.18);
        case 'cosmicray': return out.set(-20, b * vp.h * 0.6);
        case 'lab': return out.set(vp.w / 2 + (a - 0.5) * 200, vp.h + 20);
        default: return out.set(vp.w / 2, vp.h / 2);
    }
}

export function introFxOf(origin: string): IntroFx {
    return INTRO_BEATS.find(b => b.origin === origin)?.fx ?? 'stars';
}
