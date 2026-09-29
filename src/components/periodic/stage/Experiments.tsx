// 11 mẫu thí nghiệm kinh điển (chỉ để XEM). Mỗi mẫu chạy theo thời gian `t` (giây từ lúc bấm ▶), tham số lấy
// từ data/periodic/experiments.ts. Âm thanh gọi qua onCue (trang lo, đã tôn trọng nút tắt tiếng).
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { ElementFull } from '../engine/elements';
import type { ExperimentSpec } from '../../../data/periodic/experiments';
import { rng } from '../engine/atom';
import type { QualityTier } from './params';
import { clamp01, easeOut, makeHalo, softDot, useGlass, useSurface } from './common';
import { Collider, GasTube, Specimen } from './Specimens';

export type Cue = 'fizz' | 'pop' | 'boom' | 'zap' | 'geiger' | 'whoosh';

interface EProps { el: ElementFull; spec: ExperimentSpec; tier: QualityTier; clock: { t: number }; onCue: (c: Cue, power?: number) => void; heat?: { c: number } }

// Hạt dùng chung: bọt khí / tia lửa / hơi — một Points, vị trí tính trên CPU (≤ 400 hạt).
function useParticles(n: number, seed: number) {
    return useMemo(() => {
        const R = rng(seed);
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const seeds = Float32Array.from({ length: n * 4 }, () => R());
        return { geo, pos, col, seeds, n };
    }, [n, seed]);
}

const Flame: React.FC<{ color: string; size?: number; strength?: number }> = ({ color, size = 1, strength = 1 }) => {
    const mat = useMemo(() => makeHalo(color, 1.1), [color]);
    const inner = useMemo(() => makeHalo('#fff7d6', 0.7), []);
    const ref = useRef<THREE.Group>(null);
    useFrame((st) => {
        const t = st.clock.elapsedTime;
        if (ref.current) { ref.current.scale.set(size * (1 + Math.sin(t * 17) * 0.05), size * (1 + Math.sin(t * 23) * 0.08), size); }
        mat.uniforms.uStrength.value = 1.1 * strength;
        inner.uniforms.uStrength.value = 0.7 * strength;
    });
    return (
        <group ref={ref}>
            <mesh material={mat} position={[0, 0.35, 0]} scale={[0.35, 0.8, 0.35]}><sphereGeometry args={[1, 20, 16]} /></mesh>
            <mesh material={inner} position={[0, 0.2, 0]} scale={[0.14, 0.4, 0.14]}><sphereGeometry args={[1, 16, 12]} /></mesh>
        </group>
    );
};

// ---------------------------------------------------------------- 💦 thả vào nước
const Water: React.FC<EProps> = ({ el, spec, tier, clock, onCue }) => {
    const power = Number(spec.params?.power ?? 1), sink = !!spec.params?.sink;
    const glass = useGlass(tier, '#dff1ff', 0.2);
    const water = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3aa6ff', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1, depthWrite: false }), []);
    const metal = useSurface(tier, { color: el.specimen.color, metal: true, roughness: 0.3 });
    const chunk = useRef<THREE.Mesh>(null);
    const P = useParticles(260, el.atomicNumber);
    const pts = useRef<THREE.Points>(null);
    const flameC = el.flame ?? '#ffb000';
    const flame = useRef<THREE.Group>(null), blast = useRef<THREE.Mesh>(null);
    const blastMat = useMemo(() => makeHalo('#fff2c0', 1.4), []);
    const cued = useRef(-1);
    useFrame(() => {
        const t = clock.t;
        if (t < 0.1) cued.current = -1;          // bấm ▶ Làm lại
        const drop = clamp01(t / 0.7);
        const react = t > 0.7;
        if (cued.current < 0 && react) { cued.current = 0; onCue('fizz', power); }
        if (cued.current === 0 && power >= 4 && t > 1.3) { cued.current = 1; onCue('boom'); }
        if (chunk.current) {
            const r = power >= 1 ? 0.45 : 0;
            const ang = t * (1 + power) * 1.3;
            const y = sink ? -0.35 - drop * 0.15 : 1.2 - drop * 1.2 + (react ? 0 : 0) - 0.02;
            chunk.current.position.set(react && !sink ? Math.cos(ang) * r : 0, drop < 1 ? 1.2 - drop * (sink ? 1.7 : 1.22) : y, react && !sink ? Math.sin(ang) * r * 0.6 : 0);
            const shrink = react ? Math.max(0.05, 1 - (t - 0.7) * (0.06 + power * 0.06)) : 1;
            chunk.current.scale.setScalar(shrink);
            chunk.current.visible = !(power >= 4 && t > 1.35);
        }
        const cp = chunk.current?.position ?? new THREE.Vector3();
        for (let i = 0; i < P.n; i++) {
            const s = P.seeds[i * 4], s2 = P.seeds[i * 4 + 1], s3 = P.seeds[i * 4 + 2];
            const life = ((t * (0.6 + power * 0.3) + s) % 1);
            const on = react && i < 40 + power * 45;
            const x = cp.x + (s2 - 0.5) * 0.3 * (1 + life), z = cp.z + (s3 - 0.5) * 0.3 * (1 + life), y = (sink ? cp.y : -0.02) + life * (sink ? 0.8 : 0.35);
            P.pos.set(on ? [x, y, z] : [0, -99, 0], i * 3);
            P.col.set([0.85, 0.95, 1], i * 3);
        }
        P.geo.attributes.position.needsUpdate = true; P.geo.attributes.color.needsUpdate = true;
        if (flame.current) { flame.current.visible = react && power >= 2 && !(power >= 4 && t > 1.6); flame.current.position.set(cp.x, 0.05, cp.z); flame.current.scale.setScalar(0.4 + power * 0.12); }
        if (blast.current) { const b = power >= 4 ? clamp01((t - 1.3) / 0.6) : 0; blast.current.visible = b > 0 && b < 1; blast.current.scale.setScalar(0.3 + b * 2.2); blastMat.uniforms.uStrength.value = 1.6 * (1 - b); }
    });
    return (
        <group position={[0, -0.3, 0]}>
            <mesh material={glass}><boxGeometry args={[2.4, 1.1, 1.3]} /></mesh>
            <mesh material={water} position={[0, -0.1, 0]}><boxGeometry args={[2.34, 0.9, 1.24]} /></mesh>
            <RoundedBox ref={chunk} args={[0.28, 0.2, 0.24]} radius={0.04} material={metal} />
            <points ref={pts} geometry={P.geo}><pointsMaterial size={0.06} map={softDot()} vertexColors transparent opacity={0.8} depthWrite={false} /></points>
            <group ref={flame}><Flame color={flameC} /></group>
            <mesh ref={blast} material={blastMat}><sphereGeometry args={[0.5, 20, 16]} /></mesh>
        </group>
    );
};

// ---------------------------------------------------------------- 🔥 màu ngọn lửa
const FlameTest: React.FC<EProps> = ({ el, tier, clock }) => {
    const steel = useSurface(tier, { color: '#9aa3ad', metal: true, roughness: 0.3 });
    const loop = useRef<THREE.Group>(null);
    const [base] = React.useState('#6fa8ff');
    const f1 = useRef<THREE.Group>(null), f2 = useRef<THREE.Group>(null);
    useFrame(() => {
        const t = clock.t, inn = easeOut(t / 1.2);
        if (loop.current) loop.current.position.set(1.4 - inn * 1.15, 0.35, 0);
        if (f1.current && f2.current) { f1.current.visible = inn < 0.95; f2.current.visible = inn >= 0.95; }
    });
    return (
        <group position={[0, -0.4, 0]}>
            <mesh material={steel} position={[0, -0.55, 0]}><cylinderGeometry args={[0.13, 0.22, 0.9, 24]} /></mesh>
            <group position={[0, -0.1, 0]}>
                <group ref={f1}><Flame color={base} size={0.9} strength={0.7} /></group>
                <group ref={f2}><Flame color={el.flame ?? '#ffb000'} size={1.1} strength={1.2} /></group>
            </group>
            <group ref={loop}>
                <mesh material={steel} rotation={[0, 0, Math.PI / 2]} position={[0.6, 0, 0]}><cylinderGeometry args={[0.015, 0.015, 1.2, 8]} /></mesh>
                <mesh material={steel}><torusGeometry args={[0.06, 0.012, 8, 24]} /></mesh>
            </group>
        </group>
    );
};

// ---------------------------------------------------------------- 🌡️ nóng · lạnh
const Heat: React.FC<EProps> = ({ el, spec, tier, clock, onCue }) => {
    const mode = String(spec.params?.mode ?? 'melt');
    const t = useRef(0);
    const mat = useSurface(tier, { color: el.specimen.color, metal: el.specimen.metal, roughness: 0.2 });
    const blob = useRef<THREE.Mesh>(null);
    const coil = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.9) * 0.12, -0.6 + i * 0.016, Math.sin(i * 0.9) * 0.12))), 300, 0.02, 8), []);
    const coilMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#331100', transparent: true }), []);
    const bulb = useGlass(tier, '#fff8e8', 0.14);
    const flowerMat = useSurface(tier, { color: '#f472b6', metal: false, roughness: 0.5 });
    const ice = useMemo(() => new THREE.Color('#bfe8ff'), []);
    const pink = useMemo(() => new THREE.Color('#f472b6'), []);
    const nitro = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.4, roughness: 0.05 }), []);
    const P = useParticles(200, 7);
    const vapC = new THREE.Color(mode === 'sublime' ? '#9b4dff' : mode === 'vapor' ? '#b8501f' : '#e6f4ff');
    const shards = useRef<THREE.Group>(null), petals = useRef<THREE.Group>(null);
    const hand = useSurface(tier, { color: '#c99a7a', metal: false, roughness: 0.8 });
    const cued = useRef(false);
    useFrame((_, dt) => {
        t.current = clock.t;
        if (t.current < 0.1) cued.current = false;
        const k = clamp01((t.current - 0.3) / 2.5);
        if (blob.current) {
            if (mode === 'hand' || mode === 'freeze-metal') {
                const melt = mode === 'hand' ? k : 1 - k;
                blob.current.scale.set(0.55 + melt * 0.5, 0.55 - melt * 0.4, 0.55 + melt * 0.5);
                blob.current.position.y = -0.15 - melt * 0.12;
                blob.current.rotation.y += dt * 0.2;
            } else if (mode === 'sublime' || mode === 'vapor') {
                blob.current.scale.setScalar(0.5 * (1 - 0.6 * k));
            }
        }
        if (mode === 'filament') coilMat.color.setRGB(0.2 + 2.8 * k, 0.05 + 1.6 * k * k, 0.02 + 0.9 * k * k * k);
        if (petals.current && mode === 'freeze') {
            petals.current.children.forEach(c => ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).color.copy(pink).lerp(ice, k));
            petals.current.visible = t.current < 3.2;
            if (!cued.current && t.current >= 3.2) { cued.current = true; onCue('pop'); }
        }
        if (shards.current) {
            shards.current.visible = mode === 'freeze' && t.current >= 3.2;
            const b = clamp01((t.current - 3.2) / 1.2);
            shards.current.children.forEach((c, i) => { const a = i * 2.4; c.position.set(Math.cos(a) * b * 1.2, 0.3 - b * b * 1.4 + Math.sin(i) * 0.2, Math.sin(a) * b * 0.8); c.rotation.x += 0.1; });
        }
        const vap = mode === 'sublime' || mode === 'vapor' || mode === 'liquefy' || mode === 'freeze';
        for (let i = 0; i < P.n; i++) {
            const s = P.seeds[i * 4], life = (t.current * 0.35 + s) % 1;
            const on = vap && (mode === 'freeze' || mode === 'liquefy' || k > 0.05);
            P.pos.set(on ? [(P.seeds[i * 4 + 1] - 0.5) * (0.4 + life), -0.2 + life * 1.8, (P.seeds[i * 4 + 2] - 0.5) * (0.4 + life)] : [0, -99, 0], i * 3);
            P.col.set([vapC.r, vapC.g, vapC.b], i * 3);
        }
        P.geo.attributes.position.needsUpdate = true; P.geo.attributes.color.needsUpdate = true;
    });
    return (
        <group>
            {(mode === 'hand') && <mesh material={hand} position={[0, -0.55, 0]} scale={[1.3, 0.35, 0.9]}><sphereGeometry args={[1, 32, 20]} /></mesh>}
            {(mode === 'hand' || mode === 'freeze-metal' || mode === 'sublime' || mode === 'vapor') && (
                <mesh ref={blob} material={mat} position={[0, -0.1, 0]}>{mode === 'hand' || mode === 'freeze-metal' ? <sphereGeometry args={[0.8, 48, 32]} /> : <boxGeometry args={[1, 0.6, 1]} />}</mesh>
            )}
            {mode === 'filament' && (
                <group>
                    <mesh geometry={coil} material={coilMat} />
                    <mesh material={bulb} position={[0, 0, 0]}><sphereGeometry args={[0.8, 40, 28]} /></mesh>
                </group>
            )}
            {(mode === 'freeze' || mode === 'liquefy') && <mesh material={nitro} position={[0, -0.75, 0]}><cylinderGeometry args={[0.8, 0.7, 0.6, 40]} /></mesh>}
            {mode === 'freeze' && (
                <>
                    <group ref={petals} position={[0, 0.3, 0]}>
                        {Array.from({ length: 6 }, (_, i) => <mesh key={i} material={flowerMat.clone()} position={[Math.cos(i * 1.047) * 0.28, 0, Math.sin(i * 1.047) * 0.28]} scale={[0.25, 0.08, 0.14]} rotation={[0, -i * 1.047, 0]}><sphereGeometry args={[1, 16, 10]} /></mesh>)}
                    </group>
                    <group ref={shards}>{Array.from({ length: 10 }, (_, i) => <mesh key={i} material={nitro}><tetrahedronGeometry args={[0.1, 0]} /></mesh>)}</group>
                </>
            )}
            <points geometry={P.geo}><pointsMaterial size={0.14} map={softDot()} vertexColors transparent opacity={0.45} depthWrite={false} /></points>
        </group>
    );
};

// ---------------------------------------------------------------- 🧲 nam châm
// Nam châm chữ U thật (thân ống cong đỏ, hai cực bạc N/S) trượt tới; vật bị hút thì tăng tốc lao vào, dính hai
// cực và nảy nhẹ; đường sức từ (cung sáng) hiện dần khi nam châm lại gần. Không bị hút: vật đứng yên + dấu ✕.
// Nd: nam châm tròn hút chùm kẹp giấy. O lỏng: giọt xanh nhạt rơi xuống, bị giữ lơ lửng giữa hai cực.
const POLE_Y = 0.24, POLE_LEN = 0.22, BEND = 0.72;
function letterTex(ch: string, bg: string): THREE.Texture {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d')!;
    x.fillStyle = bg; x.fillRect(0, 0, 64, 64);
    x.fillStyle = '#ffffff'; x.font = 'bold 44px Verdana'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 32, 35);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const Horseshoe: React.FC<{ tier: QualityTier }> = ({ tier }) => {
    const body = useSurface(tier, { color: '#dc2626', metal: false, roughness: 0.32 });
    const steel = useSurface(tier, { color: '#d1d5db', metal: true, roughness: 0.22 });
    // thân chữ U nằm ngang, hai cực quay về −x; mặt cực ở x = 0
    const path = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(POLE_LEN, POLE_Y, 0), new THREE.Vector3(BEND, POLE_Y, 0),
        new THREE.Vector3(BEND + POLE_Y * 0.9, POLE_Y * 0.7, 0), new THREE.Vector3(BEND + POLE_Y * 1.25, 0, 0),
        new THREE.Vector3(BEND + POLE_Y * 0.9, -POLE_Y * 0.7, 0), new THREE.Vector3(BEND, -POLE_Y, 0),
        new THREE.Vector3(POLE_LEN, -POLE_Y, 0)]), []);
    const n = useMemo(() => new THREE.MeshBasicMaterial({ map: letterTex('N', '#dc2626'), transparent: true }), []);
    const sMat = useMemo(() => new THREE.MeshBasicMaterial({ map: letterTex('S', '#2563eb'), transparent: true }), []);
    return (
        <group>
            <mesh material={body}><tubeGeometry args={[path, 64, 0.11, 20, false]} /></mesh>
            {[POLE_Y, -POLE_Y].map((y, i) => (
                <group key={i}>
                    <mesh material={steel} position={[POLE_LEN / 2, y, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.11, 0.11, POLE_LEN, 20]} /></mesh>
                    <mesh material={i ? sMat : n} position={[POLE_LEN + 0.22, y, 0.111]}><planeGeometry args={[0.13, 0.13]} /></mesh>
                </group>
            ))}
        </group>
    );
};

const FieldLines: React.FC<{ strength: { v: number } }> = ({ strength }) => {
    const lines = useMemo(() => [0.18, 0.34, 0.52].flatMap(r => [1, -1].map(side => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
        Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI; return new THREE.Vector3(-Math.sin(a) * r * 1.2, Math.cos(a) * POLE_Y, side * Math.sin(a) * r * 0.25); })), 48, 0.008, 6, false))), []);
    const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#7dd3fc').multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), []);
    useFrame((st) => { mat.opacity = strength.v * (0.45 + 0.25 * Math.sin(st.clock.elapsedTime * 4)); });
    return <group>{lines.map((g, i) => <mesh key={i} geometry={g} material={mat} />)}</group>;
};

const Magnet: React.FC<EProps> = ({ el, spec, tier, clock }) => {
    const attracts = !spec.params?.none, strong = !!spec.params?.strong, liquid = !!spec.params?.liquid;
    const mag = useRef<THREE.Group>(null), obj = useRef<THREE.Group>(null), cross = useRef<THREE.Group>(null), drop = useRef<THREE.Mesh>(null);
    const field = useRef({ v: 0 }).current;
    const sample = useSurface(tier, { color: el.specimen.color, metal: el.specimen.metal, roughness: el.specimen.roughness });
    const plate = useGlass(tier, '#cbd5e1', 0.22);
    const crossMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#f87171').multiplyScalar(1.4), transparent: true, opacity: 0 }), []);
    const lox = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#a5d8ff', roughness: 0.05, transmission: tier === 'high' ? 0.6 : 0, transparent: true, opacity: 0.85 }), [tier]);
    const clipMat = useSurface(tier, { color: '#e5e7eb', metal: true, roughness: 0.25 });
    const clips = useMemo(() => { const R = rng(60); return Array.from({ length: strong ? 10 : 0 }, (_, i) => ({ y0: (R() - 0.5) * 1.4, z0: (R() - 0.5) * 0.6, d: 0.2 + i * 0.13, a: R() * 6.28, sy: (R() - 0.5) * 0.5, sz: (R() - 0.5) * 0.3 })); }, [strong]);
    const clipRefs = useRef<(THREE.Group | null)[]>([]);
    const HALF = 0.2, START = -0.95;          // nửa cạnh khối mẫu, vị trí ban đầu
    useFrame(() => {
        const t = clock.t;
        if (strong) {                          // Nd: nam châm tròn đứng giữa, kẹp giấy bay tới dính quanh
            field.v = 0;
            clips.forEach((c, i) => {
                const g = clipRefs.current[i]; if (!g) return;
                const k = clamp01((t - c.d) / 0.45), e = k * k;
                const sx = 0.36 + Math.cos(c.a) * 0.05, stickY = c.sy, stickZ = c.sz;
                g.position.set(1.7 + (sx - 1.7) * e, c.y0 + (stickY - c.y0) * e, c.z0 + (stickZ - c.z0) * e);
                g.rotation.set(c.a * (1 - e), 0, c.a + (Math.PI / 2 - c.a) * e);
            });
            return;
        }
        const come = easeOut(t / 1.6);
        const poleX = 1.9 - (1.9 - HALF * 1.0) * come;                   // mặt cực dừng ở x = 0,2
        if (mag.current) mag.current.position.x = liquid ? HALF : poleX;
        field.v = clamp01((2.2 - poleX) / 1.6) * (attracts ? 1 : 0.7);
        if (liquid && drop.current) {
            const k = clamp01((t - 0.6) / 0.9), fall = 1 - (1 - k) * (1 - k);
            drop.current.position.set(0, 1.1 - fall * 1.1, 0);
            drop.current.scale.set(0.16 + 0.05 * k, (0.16 + 0.05 * k) * (1 + 0.08 * Math.sin(t * 9)), 0.16);
        }
        if (obj.current && !liquid) {
            let x = START;
            if (attracts) {
                const k = clamp01((t - 1.45) / 0.35);                    // tăng tốc như bị hút thật (x ∝ k²)
                const target = HALF - HALF;                               // mặt phải khối chạm mặt cực
                x = START + (target - START) * k * k;
                if (k >= 1) x = target - Math.max(0, Math.sin((t - 1.8) * 30) * 0.03 * Math.exp(-(t - 1.8) * 8));   // nảy nhẹ
                obj.current.rotation.z = -0.25 * k * (1 - k) * 4 * 0.2;
            }
            obj.current.position.x = x;
        }
        if (cross.current) { const k = !attracts && t > 2 ? clamp01((t - 2) / 0.3) : 0; crossMat.opacity = k; cross.current.visible = k > 0; }
    });
    if (strong) return (
        <group position={[0, -0.1, 0]}>
            <mesh material={sample} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.34, 0.34, 0.22, 48]} /></mesh>
            {clips.map((c, i) => (
                <group key={i} ref={g => { clipRefs.current[i] = g; }}>
                    <mesh material={clipMat} scale={[1, 1.7, 1]}><torusGeometry args={[0.06, 0.011, 6, 20]} /></mesh>
                </group>
            ))}
        </group>
    );
    return (
        <group position={[0, -0.35, 0]}>
            <mesh material={plate} position={[-0.4, -HALF - 0.03, 0]}><boxGeometry args={[2.6, 0.05, 0.9]} /></mesh>
            <group ref={mag}>
                <Horseshoe tier={tier} />
                <group position={[0, 0, 0]}><FieldLines strength={field} /></group>
            </group>
            {liquid
                ? <mesh ref={drop} material={lox}><sphereGeometry args={[1, 32, 20]} /></mesh>
                : <group ref={obj} position={[START, 0, 0]}><RoundedBox args={[HALF * 2, HALF * 2, HALF * 2]} radius={0.03} material={sample} /></group>}
            {!attracts && (
                <group ref={cross} position={[START, HALF + 0.32, 0]} visible={false}>
                    {[Math.PI / 4, -Math.PI / 4].map(r => <mesh key={r} material={crossMat} rotation={[0, 0, r]}><boxGeometry args={[0.3, 0.06, 0.02]} /></mesh>)}
                </group>
            )}
        </group>
    );
};

// ---------------------------------------------------------------- 🕯️ đốt cháy
const Burn: React.FC<EProps> = ({ el, spec, tier, clock, onCue }) => {
    const style = String(spec.params?.style ?? 'white');
    const P = useParticles(300, 11);
    const cued = useRef(false);
    const colorOf = style === 'white' ? '#ffffff' : style === 'blue' ? '#4f7dff' : style === 'sparks' ? '#ffb347' : '#ff9a3c';
    const glow = useMemo(() => makeHalo(colorOf, style === 'white' ? 2 : 1), [colorOf, style]);
    const balloon = useSurface(tier, { color: '#f9a8d4', metal: false, roughness: 0.3 });
    const bRef = useRef<THREE.Mesh>(null), gRef = useRef<THREE.Mesh>(null);
    const c = new THREE.Color(colorOf);
    useFrame(() => {
        const t = clock.t;
        if (t < 0.1) cued.current = false;
        const lit = t > 0.8;
        if (!cued.current && lit) { cued.current = true; onCue(style === 'pop' ? 'pop' : 'whoosh'); }
        if (bRef.current) bRef.current.visible = style === 'pop' && !lit;
        if (gRef.current) {
            const f = style === 'pop' ? clamp01(1 - (t - 0.8) / 0.4) : lit ? 1 : 0;
            gRef.current.visible = lit && f > 0;
            gRef.current.scale.setScalar((style === 'white' ? 0.7 : 0.45) * (style === 'pop' ? 1 + (t - 0.8) * 4 : 1 + Math.sin(t * 30) * 0.05));
            glow.uniforms.uStrength.value = (style === 'white' ? 2 : 1.1) * f;
        }
        for (let i = 0; i < P.n; i++) {
            const s = P.seeds[i * 4], life = (t * 0.9 + s) % 1;
            const on = lit && (style === 'sparks' || style === 'white');
            const a = P.seeds[i * 4 + 1] * 6.28, sp = style === 'sparks' ? 1.6 : 0.5;
            P.pos.set(on ? [Math.cos(a) * life * sp, life * (style === 'white' ? 1.4 : 0.6) - life * life * (style === 'sparks' ? 1.4 : 0), Math.sin(a) * life * sp * 0.6] : [0, -99, 0], i * 3);
            P.col.set(style === 'white' ? [0.8, 0.8, 0.85] : [c.r, c.g, c.b], i * 3);
        }
        P.geo.attributes.position.needsUpdate = true; P.geo.attributes.color.needsUpdate = true;
    });
    return (
        <group>
            {style === 'pop' ? <mesh ref={bRef} material={balloon} position={[0, 0.2, 0]} scale={[0.7, 0.85, 0.7]}><sphereGeometry args={[1, 32, 24]} /></mesh>
                : <group scale={0.5} position={[0, -0.5, 0]}><Specimen el={el} tier={tier} /></group>}
            <mesh ref={gRef} material={glow} position={[0, style === 'pop' ? 0.2 : -0.1, 0]}><sphereGeometry args={[1, 24, 16]} /></mesh>
            <points geometry={P.geo}><pointsMaterial size={style === 'white' ? 0.18 : 0.05} map={softDot()} vertexColors transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
        </group>
    );
};

// ---------------------------------------------------------------- ⚖️ nổi hay chìm
// Cốc có nhãn (tên + khối lượng riêng); thí nghiệm "trên thủy ngân" luôn đặt CẠNH cốc nước để thấy sự tương
// phản (sắt chìm trong nước nhưng nổi trên thủy ngân). Phần chìm = khối lượng riêng vật / khối lượng riêng chất lỏng.
const LIQ: Record<string, { d: number; color: string; metal: boolean; name: string }> = {
    water: { d: 1, color: '#3aa6ff', metal: false, name: 'Nước' },
    oil: { d: 0.85, color: '#e0b04e', metal: false, name: 'Dầu ăn' },
    mercury: { d: 13.53, color: '#d8dadf', metal: true, name: 'Thủy ngân' },
};
function labelTex(lines: [string, string]): THREE.Texture {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96;
    const x = c.getContext('2d')!;
    x.fillStyle = 'rgba(15,23,42,0.85)'; x.beginPath(); x.roundRect(4, 4, 248, 88, 18); x.fill();
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = 'bold 36px Verdana'; x.fillText(lines[0], 128, 44);
    x.fillStyle = '#93c5fd'; x.font = '24px Verdana'; x.fillText(lines[1], 128, 78);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const Beaker: React.FC<{ liq: typeof LIQ[string]; el: ElementFull; tier: QualityTier; clock: { t: number }; x: number; delay: number }> = ({ liq, el, tier, clock, x, delay }) => {
    const glass = useGlass(tier, '#e8f4ff', 0.18);
    const liquidMat = useMemo(() => liq.metal ? new THREE.MeshStandardMaterial({ color: liq.color, metalness: 1, roughness: 0.06, transparent: true, opacity: 0.92 })
        : new THREE.MeshStandardMaterial({ color: liq.color, transparent: true, opacity: 0.4, roughness: 0.1, depthWrite: false }), [liq]);
    const cube = useSurface(tier, { color: el.specimen.color, metal: true, roughness: 0.25 });
    const d = el.density ?? 1, sub = Math.min(1, d / liq.d), floats = sub < 1;
    const label = useMemo(() => new THREE.MeshBasicMaterial({ map: labelTex([liq.name, `${liq.d.toLocaleString('vi-VN')} g/cm³`]), transparent: true }), [liq]);
    const verdict = useMemo(() => new THREE.MeshBasicMaterial({ map: labelTex([floats ? 'NỔI ⬆' : 'CHÌM ⬇', floats ? 'nhẹ hơn chất lỏng' : 'nặng hơn chất lỏng']), transparent: true, opacity: 0 }), [floats]);
    const ref = useRef<THREE.Mesh>(null);
    const R = 0.46, H = 1.3, top = 0.05, bottom = -0.6, size = 0.3;
    useFrame(() => {
        const t = clock.t - delay, k = easeOut(t / 1.3);
        const restY = floats ? top + size / 2 - sub * size : bottom + size / 2 + 0.02;
        if (ref.current) { ref.current.position.y = 1.1 + (restY - 1.1) * clamp01(k) + (floats && k >= 1 ? Math.sin(clock.t * 2) * 0.008 : 0); ref.current.rotation.y = clock.t * 0.3; }
        verdict.opacity = clamp01((t - 1.4) / 0.4);
    });
    return (
        <group position={[x, -0.15, 0]}>
            <mesh material={glass}><cylinderGeometry args={[R, R, H, 48, 1, true]} /></mesh>
            <mesh material={liquidMat} position={[0, (top + bottom) / 2, 0]}><cylinderGeometry args={[R - 0.02, R - 0.02, top - bottom, 48]} /></mesh>
            <RoundedBox ref={ref} args={[size, size, size]} radius={0.03} material={cube} />
            <mesh material={label} position={[0, H / 2 + 0.26, 0]}><planeGeometry args={[0.8, 0.3]} /></mesh>
            <mesh material={verdict} position={[0, H / 2 + 0.6, 0]}><planeGeometry args={[0.8, 0.3]} /></mesh>
        </group>
    );
};
const FloatSink: React.FC<EProps> = ({ el, spec, tier, clock }) => {
    const main = String(spec.params?.liquid ?? 'water');
    const list = main === 'mercury' ? ['water', 'mercury'] : [main];
    return (
        <group>
            {list.map((k, i) => <Beaker key={k} liq={LIQ[k]} el={el} tier={tier} clock={clock} x={list.length === 1 ? 0 : (i - 0.5) * 1.35} delay={i * 0.5} />)}
        </group>
    );
};

// ---------------------------------------------------------------- 🔦 đèn cực tím
const UvLamp: React.FC<EProps> = ({ el, spec, tier, clock }) => {
    const glowC = String(spec.params?.glow ?? '#7dff5a'), self = !!spec.params?.self;
    const lamp = useSurface(tier, { color: '#312e81', metal: true, roughness: 0.4 });
    const tubeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#8b5cf6').multiplyScalar(2) }), []);
    const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(glowC), transparent: true }), [glowC]);
    const halo = useMemo(() => makeHalo(glowC, 0.8), [glowC]);
    const obj = useRef<THREE.Group>(null);
    useFrame(() => {
        const k = self ? 1 : clamp01((clock.t - 0.6) / 0.6);
        glowMat.color.set(glowC).multiplyScalar(0.15 + 1.8 * k);
        halo.uniforms.uStrength.value = 0.8 * k;
        if (obj.current) obj.current.rotation.y = clock.t * 0.3;
    });
    const isEu = el.symbol === 'Eu';
    return (
        <group>
            {!self && (
                <group position={[0, 1.1, 0]}>
                    <mesh material={lamp}><boxGeometry args={[1.6, 0.18, 0.3]} /></mesh>
                    <mesh material={tubeMat} position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 1.4, 12]} /></mesh>
                </group>
            )}
            <group ref={obj} position={[0, -0.35, 0]}>
                {isEu ? (
                    <group rotation={[-0.9, 0, 0]}>
                        <mesh><planeGeometry args={[1.6, 0.8]} /><meshStandardMaterial color="#8fb3a0" transparent /></mesh>
                        {[-0.5, -0.1, 0.35].map((x, i) => <mesh key={i} material={glowMat} position={[x, (i - 1) * 0.15, 0.01]}><planeGeometry args={[0.08 + i * 0.05, 0.5]} /></mesh>)}
                    </group>
                ) : self ? (
                    <group>
                        <group scale={0.8}><Specimen el={el} tier={tier} /></group>
                        <mesh material={halo}><sphereGeometry args={[0.7, 24, 16]} /></mesh>
                    </group>
                ) : (
                    <group>
                        <mesh material={glowMat}><latheGeometry args={[[0.22, 0.34, 0.38, 0.3, 0.18, 0.15, 0.22].map((r, i) => new THREE.Vector2(r, i * 0.15 - 0.45)), 40]} /></mesh>
                        <mesh material={halo} scale={[0.6, 0.8, 0.6]}><sphereGeometry args={[1, 24, 16]} /></mesh>
                    </group>
                )}
            </group>
        </group>
    );
};

// ---------------------------------------------------------------- 📟 máy đếm Geiger
const Geiger: React.FC<EProps> = ({ el, spec, tier, clock, onCue }) => {
    const rate = Number(spec.params?.rate ?? 5);
    const body = useSurface(tier, { color: '#facc15', metal: false, roughness: 0.5 });
    const needle = useRef<THREE.Mesh>(null);
    const P = useParticles(120, el.atomicNumber);
    const last = useRef(0);
    const R = useMemo(() => rng(el.atomicNumber + 5), [el.atomicNumber]);
    useFrame(() => {
        const t = clock.t;
        if (t - last.current > (0.7 / rate) * (0.3 + R() * 1.4)) { last.current = t; onCue('geiger'); if (needle.current) needle.current.rotation.z = -0.3 - R() * 0.6 * (rate / 10); }
        else if (needle.current) needle.current.rotation.z += (0.5 - needle.current.rotation.z) * 0.05;
        for (let i = 0; i < P.n; i++) {
            const s = P.seeds[i * 4], life = (t * (0.5 + rate * 0.08) + s) % 1, a = P.seeds[i * 4 + 1] * 6.28, b = P.seeds[i * 4 + 2] * 3.14;
            const on = i < rate * 10;
            P.pos.set(on ? [-0.6 + Math.cos(a) * Math.sin(b) * life * 1.6, -0.1 + Math.cos(b) * life * 1.6, Math.sin(a) * Math.sin(b) * life * 1.6] : [0, -99, 0], i * 3);
            P.col.set([0.6, 1, 0.5], i * 3);
        }
        P.geo.attributes.position.needsUpdate = true; P.geo.attributes.color.needsUpdate = true;
    });
    return (
        <group>
            <group position={[-0.6, 0, 0]} scale={0.6}><Specimen el={el} tier={tier} /></group>
            <group position={[0.9, -0.2, 0.2]}>
                <mesh material={body}><boxGeometry args={[0.7, 0.5, 0.3]} /></mesh>
                <mesh position={[0, 0.05, 0.155]}><planeGeometry args={[0.5, 0.28]} /><meshBasicMaterial color="#f8fafc" transparent /></mesh>
                <mesh ref={needle} position={[0, -0.08, 0.16]}><boxGeometry args={[0.01, 0.26, 0.005]} /><meshBasicMaterial color="#111827" transparent /></mesh>
            </group>
            <points geometry={P.geo}><pointsMaterial size={0.05} map={softDot()} vertexColors transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
        </group>
    );
};

export const Experiment: React.FC<EProps & { power?: boolean }> = (p) => {
    switch (p.spec.id) {
        case 'water': return <Water {...p} />;
        case 'flame': return <FlameTest {...p} />;
        case 'discharge': return <GasTube el={p.el} tier={p.tier} power={p.power ?? true} />;
        case 'voice': return p.el.specimen.kind === 'gas-tube' ? <GasTube el={p.el} tier={p.tier} /> : <Specimen el={p.el} tier={p.tier} />;
        case 'heat': return <Heat {...p} />;
        case 'magnet': return <Magnet {...p} />;
        case 'burn': return <Burn {...p} />;
        case 'float': return <FloatSink {...p} />;
        case 'uv': return <UvLamp {...p} />;
        case 'geiger': return <Geiger {...p} />;
        case 'collide': return <Collider tier={p.tier} z={p.el.atomicNumber} />;
    }
};
