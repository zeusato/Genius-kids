// Mẫu vật 3D sinh bằng code cho 118 nguyên tố (8 kiểu, tham số từ data/periodic/specimen.ts). Cỡ ~2 đơn vị.
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { ElementFull } from '../engine/elements';
import { rng } from '../engine/atom';
import type { QualityTier } from './params';
import { makeHalo, softDot, useGlass, useSurface } from './common';

interface SProps { el: ElementFull; tier: QualityTier; power?: boolean }

// ---------------------------------------------------------------- khối kim loại 1 cm³
const MetalCube: React.FC<SProps> = ({ el, tier }) => {
    const s = el.specimen;
    const glow = s.variant === 'glow';
    const mat = useSurface(tier, { color: s.color, metal: true, roughness: s.roughness, emissive: glow ? s.color : undefined, emissiveIntensity: glow ? 0.6 : 0 });
    return (
        <group>
            <RoundedBox args={[1.45, 1.45, 1.45]} radius={0.09} smoothness={5} material={mat} />
        </group>
    );
};

// ---------------------------------------------------------------- ống hàn kín (kim loại kiềm trong dầu, brom lỏng)
const Ampoule: React.FC<SProps> = ({ el, tier }) => {
    const glass = useGlass(tier, '#e8f4ff', 0.18);
    const oil = useMemo(() => new THREE.MeshStandardMaterial({ color: el.symbol === 'Br' ? '#8a1c06' : '#d9b36a', emissive: el.symbol === 'Br' ? '#4a0a00' : '#000000', transparent: true, opacity: el.symbol === 'Br' ? 0.95 : 0.35, roughness: 0.1 }), [el.symbol]);
    const metal = useSurface(tier, { color: el.specimen.color, metal: true, roughness: 0.3 });
    const vapor = useRef<THREE.Points>(null);
    const isBr = el.symbol === 'Br';
    const geo = useMemo(() => {
        const R = rng(el.atomicNumber), n = 260, p = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * 0.38; p.set([Math.cos(a) * r, -0.1 + R() * 1.1, Math.sin(a) * r], i * 3); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
    }, [el.atomicNumber]);
    useFrame((st) => { if (vapor.current) vapor.current.rotation.y = st.clock.elapsedTime * 0.3; });
    return (
        <group rotation={[0, 0, 0.12]}>
            <mesh material={glass}><capsuleGeometry args={[0.46, 1.5, 8, 32]} /></mesh>
            <mesh position={[0, -0.62, 0]} material={oil}><cylinderGeometry args={[0.43, 0.43, isBr ? 0.55 : 0.75, 32]} /></mesh>
            {!isBr && <RoundedBox args={[0.42, 0.32, 0.36]} radius={0.06} position={[0.02, -0.68, 0]} rotation={[0.2, 0.6, 0.1]} material={metal} />}
            {isBr && (
                <points ref={vapor} geometry={geo}>
                    <pointsMaterial size={0.12} map={softDot()} color="#c2461a" transparent opacity={0.6} depthWrite={false} />
                </points>
            )}
        </group>
    );
};

// ---------------------------------------------------------------- tinh thể
const FILM = ['#e8c46a', '#d98f3f', '#c86fd6', '#8a6ff0', '#4f8ef5', '#46c9d8', '#5fcf98', '#d9c35a'].map(c => new THREE.Color(c));
const Bismuth: React.FC<{ tier: QualityTier }> = ({ tier }) => {
    const mats = useMemo(() => FILM.map(c => tier === 'high'
        ? new THREE.MeshPhysicalMaterial({ color: c.clone().lerp(new THREE.Color('#c9c4cf'), 0.42), metalness: 1, roughness: 0.2, transparent: true, iridescence: 0.7, iridescenceIOR: 1.6, iridescenceThicknessRange: [150, 500] })
        : new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: 0.25, transparent: true })), [tier]);
    const hopper = (size: number, levels: number, seed: number) => {
        const out: React.ReactNode[] = [];
        for (let i = 0; i < levels; i++) {
            const s = size * (1 - i / (levels + 1.5));
            const m = mats[Math.floor(i * 0.9 + seed * 5) % mats.length];
            for (let k = 0; k < 4; k++) {
                const a = k * Math.PI / 2;
                out.push(<mesh key={`${i}-${k}`} material={m} position={[Math.sin(a) * s / 2, i * 0.07, Math.cos(a) * s / 2]} rotation={[0, a + seed + i * 0.035, 0]}><boxGeometry args={[s, 0.065, 0.065]} /></mesh>);
            }
        }
        return out;
    };
    return (
        <group rotation={[0.5, 0.3, 0]} position={[0, -0.3, 0]}>
            <group>{hopper(1.5, 11, 0)}</group>
            <group position={[0.5, 0.58, 0.28]} rotation={[0.5, 0.3, -0.9]}>{hopper(0.9, 8, 0.4)}</group>
            <group position={[-0.55, 0.48, -0.2]} rotation={[-0.3, 0.2, 0.8]}>{hopper(0.75, 7, 0.8)}</group>
        </group>
    );
};

function rockGeometry(seed: number, detail = 3, amp = 0.22): THREE.BufferGeometry {
    const g = new THREE.IcosahedronGeometry(0.8, detail);
    const p = g.attributes.position as THREE.BufferAttribute;
    const R = rng(seed);
    const bumps = Array.from({ length: 7 }, () => new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize());
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = v.clone().normalize();
        let d = 0; bumps.forEach((b, k) => { d += Math.max(0, n.dot(b)) ** 3 * (k % 2 ? -0.6 : 1); });
        v.multiplyScalar(1 + amp * d); p.setXYZ(i, v.x, v.y * 0.8, v.z);
    }
    g.computeVertexNormals();
    return g;
}

const Crystal: React.FC<SProps> = ({ el, tier }) => {
    const s = el.specimen, v = s.variant;
    const mat = useSurface(tier, { color: s.color, metal: s.metal, roughness: v === 'sulfur' ? 0.45 : s.roughness });
    const rock = useMemo(() => rockGeometry(el.atomicNumber, 2, v === 'shard' ? 0.35 : 0.22), [el.atomicNumber, v]);
    const diamondMat = useMemo(() => tier === 'high'
        ? new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0, transmission: 1, thickness: 0.8, ior: 2.42, dispersion: 5, transparent: true, envMapIntensity: 2.5 })
        : new THREE.MeshStandardMaterial({ color: '#dff4ff', metalness: 0.6, roughness: 0.02, transparent: true, opacity: 0.85 }), [tier]);
    const vapor = useRef<THREE.Points>(null);
    const vaporGeo = useMemo(() => {
        const R = rng(53), n = 320, p = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) p.set([(R() - 0.5) * 1.4, R() * 1.8 - 0.2, (R() - 0.5) * 1.4], i * 3);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
    }, []);
    useFrame((st) => { if (vapor.current) { vapor.current.rotation.y = st.clock.elapsedTime * 0.2; vapor.current.position.y = Math.sin(st.clock.elapsedTime) * 0.05; } });
    if (v === 'bismuth') return <Bismuth tier={tier} />;
    if (v === 'graphite') return (
        <group>
            <mesh material={mat} position={[-0.55, -0.2, 0]} rotation={[0.3, 0.4, 0]}><cylinderGeometry args={[0.55, 0.55, 0.35, 6]} /></mesh>
            <mesh material={diamondMat} position={[0.6, 0.15, 0.2]} rotation={[0.4, 0.6, 0]} scale={[0.6, 0.72, 0.6]}><octahedronGeometry args={[1, 0]} /></mesh>
        </group>
    );
    if (v === 'sulfur') return (
        <group rotation={[0.2, 0, 0]}>
            {[[0, 0, 0, 1], [0.55, -0.15, 0.2, 0.7], [-0.5, -0.2, -0.1, 0.75], [0.1, 0.45, -0.3, 0.55]].map(([x, y, z, k], i) => (
                <mesh key={i} material={mat} position={[x, y, z]} rotation={[i * 0.7, i * 1.1, i * 0.4]} scale={[0.45 * k, 0.8 * k, 0.45 * k]}><octahedronGeometry args={[1, 0]} /></mesh>
            ))}
        </group>
    );
    if (v === 'iodine') return (
        <group>
            {Array.from({ length: 9 }, (_, i) => {
                const R = rng(i + 3);
                return <mesh key={i} material={mat} position={[(R() - 0.5) * 1.2, -0.55 + R() * 0.3, (R() - 0.5) * 1.0]} rotation={[R() * 0.6, R() * 3, R() * 0.6]}><boxGeometry args={[0.35 + R() * 0.25, 0.06, 0.22 + R() * 0.2]} /></mesh>;
            })}
            <points ref={vapor} geometry={vaporGeo}><pointsMaterial size={0.12} map={softDot()} color="#9b4dff" transparent opacity={0.4} depthWrite={false} /></points>
        </group>
    );
    if (v === 'phosphorus') return (
        <mesh material={mat} position={[0, -0.35, 0]}><coneGeometry args={[0.95, 0.9, 48, 1]} /></mesh>
    );
    return <mesh geometry={rock} material={mat} rotation={[0.3, 0.5, 0]} />;
};

// ---------------------------------------------------------------- ống phóng điện
export const TUBE_PATH = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, -0.95, 0), new THREE.Vector3(-0.55, 0.55, 0), new THREE.Vector3(-0.28, 0.95, 0),
    new THREE.Vector3(0.28, 0.95, 0), new THREE.Vector3(0.55, 0.55, 0), new THREE.Vector3(0.55, -0.95, 0)]);

export const GasTube: React.FC<SProps & { color?: string }> = ({ el, tier, power = true, color }) => {
    const c = color ?? el.discharge ?? el.specimen.color;
    const glass = useGlass(tier, '#ffffff', 0.16);
    const core = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.4), transparent: true }), [c]);
    const off = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(0.12), transparent: true }), [c]);
    const halo = useMemo(() => makeHalo(c, tier === 'high' ? 0.35 : 0.9), [c, tier]);
    const flick = useRef(0);
    useFrame((_, dt) => {
        flick.current += dt;
        const f = power ? (flick.current < 0.35 ? (Math.sin(flick.current * 90) > 0 ? 1 : 0.2) : 0.94 + Math.sin(flick.current * 23) * 0.03) : 0;
        core.color.set(c).multiplyScalar(2.4 * f + 0.001);
        halo.uniforms.uStrength.value = (tier === 'high' ? 0.35 : 0.9) * f;
    });
    const electrode = useSurface(tier, { color: '#8a8f96', metal: true, roughness: 0.35 });
    return (
        <group>
            <mesh material={power ? core : off}><tubeGeometry args={[TUBE_PATH, 140, 0.045, 10]} /></mesh>
            <mesh material={glass}><tubeGeometry args={[TUBE_PATH, 140, 0.12, 20]} /></mesh>
            {power && <mesh material={halo}><tubeGeometry args={[TUBE_PATH, 140, 0.42, 20]} /></mesh>}
            {[-0.55, 0.55].map(x => <mesh key={x} material={electrode} position={[x, -1.1, 0]}><cylinderGeometry args={[0.13, 0.13, 0.3, 20]} /></mesh>)}
        </group>
    );
};

// ---------------------------------------------------------------- bình khí màu (F₂, Cl₂)
const GAS_VS = `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const GAS_FS = `uniform vec3 uColor; uniform float uTime; varying vec3 vP;
float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
 return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
void main(){ float n = n3(vP*3.0 + vec3(0., uTime*0.4, uTime*0.2)) * 0.6 + n3(vP*7.0 - uTime*0.3) * 0.4;
 gl_FragColor = vec4(uColor*1.15, 0.45 + 0.4*n);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const GasFlask: React.FC<SProps> = ({ el, tier }) => {
    const glass = useGlass(tier, '#ffffff', 0.07);
    const gas = useMemo(() => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uColor: { value: new THREE.Color(el.specimen.color) }, uTime: { value: 0 } }, vertexShader: GAS_VS, fragmentShader: GAS_FS }), [el.specimen.color]);
    useFrame((st) => { gas.uniforms.uTime.value = st.clock.elapsedTime; });
    return (
        <group position={[0, -0.2, 0]}>
            <mesh material={gas}><sphereGeometry args={[0.8, 40, 28]} /></mesh>
            <mesh material={glass}><sphereGeometry args={[0.84, 40, 28]} /></mesh>
            <mesh material={glass} position={[0, 1.0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.55, 24, 1, true]} /></mesh>
        </group>
    );
};

// ---------------------------------------------------------------- giọt thủy ngân
const LiquidBlob: React.FC<SProps> = ({ el, tier }) => {
    const mat = useMemo(() => {
        const m = tier === 'high'
            ? new THREE.MeshPhysicalMaterial({ color: el.specimen.color, metalness: 1, roughness: 0.04, transparent: true })
            : new THREE.MeshStandardMaterial({ color: el.specimen.color, metalness: 1, roughness: 0.06, transparent: true });
        const u = { value: 0 };
        m.userData.uT = u;
        m.onBeforeCompile = (s) => {
            s.uniforms.uT = u;
            s.vertexShader = 'uniform float uT;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
              float w = sin(position.x*6.0 + uT*3.1)*0.02 + sin(position.z*7.0 - uT*2.3)*0.018;
              transformed += normal * w * smoothstep(-0.2, 0.3, position.y);`);
        };
        return m;
    }, [tier, el.specimen.color]);
    const dish = useGlass(tier, '#cfe6ff', 0.3);
    useFrame((st) => { (mat.userData.uT as { value: number }).value = st.clock.elapsedTime; });
    return (
        <group position={[0, -0.35, 0]}>
            <mesh material={mat} scale={[1.2, 0.5, 1.2]}><sphereGeometry args={[0.62, 96, 48]} /></mesh>
            <mesh material={dish} position={[0, -0.33, 0]}><cylinderGeometry args={[1.25, 1.1, 0.1, 64]} /></mesh>
        </group>
    );
};

// ---------------------------------------------------------------- hộp chì + mẫu phóng xạ
let trefoil: THREE.Texture | null = null;
function trefoilTex() {
    if (trefoil) return trefoil;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d')!;
    x.fillStyle = '#facc15'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#111';
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * 2.094; x.beginPath(); x.moveTo(64, 64); x.arc(64, 64, 50, a - 0.52, a + 0.52); x.closePath(); x.fill(); }
    x.fillStyle = '#facc15'; x.beginPath(); x.arc(64, 64, 15, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(64, 64, 10, 0, 7); x.fill();
    trefoil = new THREE.CanvasTexture(c); trefoil.colorSpace = THREE.SRGBColorSpace;
    return trefoil;
}
const RadioBox: React.FC<SProps> = ({ el, tier }) => {
    const lead = useSurface(tier, { color: '#5b6068', metal: true, roughness: 0.6 });
    const glowC = el.symbol === 'Ra' ? '#9dffb0' : el.symbol === 'Ac' ? '#9cc8ff' : el.symbol === 'Pu' ? '#ffb070' : el.specimen.color;
    const self = ['Ra', 'Ac', 'Pu', 'Cm', 'Am', 'Cf'].includes(el.symbol);
    const sample = useSurface(tier, { color: el.specimen.color, metal: true, roughness: 0.35, emissive: self ? glowC : undefined, emissiveIntensity: self ? 1.2 : 0 });
    const halo = useMemo(() => makeHalo(glowC, tier === 'high' ? 0.3 : 0.7), [glowC, tier]);
    const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: trefoilTex(), transparent: true }), []);
    return (
        <group position={[0, -0.25, 0]}>
            <mesh material={lead} position={[0, -0.35, 0]}><boxGeometry args={[1.6, 0.7, 1.2]} /></mesh>
            <mesh material={lead} position={[0, 0.25, -0.75]} rotation={[-1.1, 0, 0]}><boxGeometry args={[1.6, 0.12, 1.2]} /></mesh>
            <mesh material={sign} position={[0, -0.35, 0.605]}><planeGeometry args={[0.45, 0.45]} /></mesh>
            <mesh material={sample} position={[0, 0.15, 0]}><cylinderGeometry args={[0.28, 0.28, 0.3, 32]} /></mesh>
            {self && <mesh material={halo} position={[0, 0.15, 0]}><sphereGeometry args={[0.55, 24, 16]} /></mesh>}
        </group>
    );
};

// ---------------------------------------------------------------- máy gia tốc (nguyên tố chưa ai nhìn thấy)
export const Collider: React.FC<{ tier: QualityTier; z: number; loop?: boolean }> = ({ tier, z }) => {
    const g = useRef<THREE.Group>(null), a = useRef<THREE.Group>(null), b = useRef<THREE.Group>(null), flash = useRef<THREE.Mesh>(null), merged = useRef<THREE.Group>(null);
    const red = useSurface(tier, { color: '#ef4444', metal: false, roughness: 0.4 }), blue = useSurface(tier, { color: '#93c5fd', metal: false, roughness: 0.4 });
    const halo = useMemo(() => makeHalo('#fde68a', 1.2), []);
    const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#67e8f9').multiplyScalar(1.6), transparent: true, opacity: 0.5 }), []);
    const blob = (n: number, r: number, seed: number) => {
        const R = rng(seed);
        return Array.from({ length: n }, (_, i) => { const u = R() * 2 - 1, t = R() * 6.28, rr = Math.cbrt(R()) * r, s = Math.sqrt(1 - u * u);
            return <mesh key={i} material={i % 2 ? red : blue} position={[Math.cos(t) * s * rr, Math.sin(t) * s * rr, u * rr]}><sphereGeometry args={[0.07, 10, 8]} /></mesh>; });
    };
    useFrame((st) => {
        const t = st.clock.elapsedTime % 4;
        const approach = Math.min(1, t / 1.4);
        if (a.current && b.current) {
            a.current.position.x = -1.6 + 1.45 * approach; b.current.position.x = 1.6 - 1.45 * approach;
            a.current.visible = b.current.visible = t < 1.4;
        }
        if (flash.current) { const f = t > 1.35 && t < 1.9 ? 1 - (t - 1.35) / 0.55 : 0; flash.current.scale.setScalar(0.2 + f * 1.4); flash.current.visible = f > 0; }
        if (merged.current) { merged.current.visible = t >= 1.4 && t < 3.2; merged.current.scale.setScalar(t < 3 ? 1 + Math.sin(t * 40) * 0.03 : 1 - (t - 3) * 3); }
        if (g.current) g.current.rotation.y = Math.sin(st.clock.elapsedTime * 0.3) * 0.3;
    });
    return (
        <group ref={g}>
            <mesh material={ringMat} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.7, 0.02, 8, 120]} /></mesh>
            <group ref={a}>{blob(20, 0.22, 3)}</group>
            <group ref={b}>{blob(Math.min(60, 20 + z - 100), 0.4, 5)}</group>
            <group ref={merged}>{blob(Math.min(80, 40 + (z - 100)), 0.5, z)}</group>
            <mesh ref={flash} material={halo}><sphereGeometry args={[0.5, 24, 16]} /></mesh>
        </group>
    );
};

// ---------------------------------------------------------------- đế trưng bày
export const Pedestal: React.FC<{ color: string; tier: QualityTier }> = ({ color, tier }) => {
    const top = useSurface(tier, { color: '#1e2436', metal: false, roughness: 0.35 });
    const rim = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.4), transparent: true, opacity: 0.9 }), [color]);
    return (
        <group position={[0, -1.25, 0]}>
            <mesh material={top}><cylinderGeometry args={[1.35, 1.45, 0.16, 64]} /></mesh>
            <mesh material={rim} position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.36, 0.012, 8, 128]} /></mesh>
        </group>
    );
};

export const Specimen: React.FC<SProps> = (p) => {
    switch (p.el.specimen.kind) {
        case 'metal-cube': return <MetalCube {...p} />;
        case 'ampoule': return <Ampoule {...p} />;
        case 'crystal': return <Crystal {...p} />;
        case 'gas-tube': return <GasTube {...p} />;
        case 'gas-flask': return <GasFlask {...p} />;
        case 'liquid': return <LiquidBlob {...p} />;
        case 'radioactive': return <RadioBox {...p} />;
        case 'atoms-only': return <Collider tier={p.tier} z={p.el.atomicNumber} />;
    }
};
