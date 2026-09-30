import React, { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Part } from '../../engine/circuit';
import { reading } from '../../engine/solver';
import type { Simulation } from '../../engine/simulation';
import { glowColor, materials } from '../materials';
import { BASE_TOP, GEO } from './geometry';

/** Trạng thái sống đọc trong useFrame (không setState mỗi khung). */
export interface LiveState {
    sim: () => Simulation;
    night: boolean;
    hdr: boolean;        // tier cao có bloom: màu phát sáng > 1
    reduced: boolean;
    morph: number;       // 0 = đồ thật, 1 = sơ đồ
}
export interface Emitter { position: THREE.Vector3; strength: number; color: THREE.Color }
export type Emitters = Map<string, Emitter>;
interface ModelProps { part: Part; live: React.MutableRefObject<LiveState>; emitters: Emitters }

const LED_COLORS = { red: '#ff5a4d', yellow: '#ffc53d', green: '#4fdc8a', blue: '#4d9dff' } as const;
const damp = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-dt * rate));
const noRaycast = () => undefined;

/** Quầng sáng Fresnel cộng màu quanh bóng (bản thử bench.html). */
function haloMaterial() {
    return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uS: { value: 0 }, uColor: { value: new THREE.Color(1, 0.72, 0.38) } },
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'uniform float uS; uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(max(dot(normalize(vN), normalize(vV)), 0.), 3.0); gl_FragColor = vec4(uColor*f*uS, f*uS);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    });
}

function useDispose(list: THREE.Material[]) { useEffect(() => () => list.forEach(m => m.dispose()), [list]); }
function useWorldPosition(ref: React.RefObject<THREE.Object3D | null>, out: THREE.Vector3) { return () => { ref.current?.getWorldPosition(out); return out; }; }

// ---------------------------------------------------------------------------------------------- bóng đèn
function Bulb({ part, live, emitters }: ModelProps) {
    const m = materials();
    const own = useMemo(() => ({
        glass: new THREE.MeshPhysicalMaterial({ color: '#ffe6b8', roughness: 0.3, transparent: true, opacity: 0.6, emissive: '#ffb04a', emissiveIntensity: 0, clearcoat: 1, clearcoatRoughness: 0.15, depthWrite: false }),
        fil: new THREE.MeshStandardMaterial({ color: '#5a4a3a', emissive: '#ff8a2a', emissiveIntensity: 0, roughness: 0.5 }),
        halo: haloMaterial(),
        pool: m.pool.clone(),
    }), [m]);
    useDispose(useMemo(() => [own.glass, own.fil, own.halo, own.pool], [own]));
    const glow = useRef(0), anchor = useRef<THREE.Group>(null), pos = useMemo(() => new THREE.Vector3(), []), where = useWorldPosition(anchor, pos);
    const loose = !!part.loose, broken = !!part.broken;
    useFrame((_, dt) => {
        const { sim, night, morph, hdr } = live.current;
        const target = broken ? 0 : (sim().runtime.visual[part.id]?.brightness ?? 0);
        glow.current = damp(glow.current, target, 12, Math.min(dt, 0.1));
        const L = glow.current * (1 - morph), e = Math.pow(L, 1.7) * (night ? 1.25 : 1);
        own.glass.emissive.set(L > 0.85 ? '#ffe6b0' : L > 0.5 ? '#ffc27a' : '#ffa050');
        own.glass.emissiveIntensity = 0.03 + (hdr ? 1.9 : 1.1) * e;
        own.glass.opacity = broken ? 0.45 : 0.58 + 0.32 * Math.min(1, L);
        own.glass.color.set(broken ? '#9aa39d' : '#ffe6b8');
        own.fil.emissive.set(L > 0.85 ? '#ffe2b0' : L > 0.5 ? '#ffc98a' : '#ff8a3c');
        own.fil.emissiveIntensity = 0.1 + (hdr ? 9 : 3) * e;
        own.halo.uniforms.uS.value = (hdr ? 1.1 : 1.6) * e;
        own.pool.opacity = (night ? 0.6 : 0.28) * Math.min(1.2, e);
        emitters.set(part.id, { position: where().clone().setY(1.45), strength: e * (night ? 3.6 : 1.2), color: own.glass.emissive });
    });
    useEffect(() => () => { emitters.delete(part.id); }, [emitters, part.id]);
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <mesh geometry={GEO.pool()} material={own.pool} raycast={noRaycast} renderOrder={1} />
        <group position={[0, loose ? 0.12 : 0, 0]} rotation={[loose ? 0.14 : 0, 0, loose ? 0.1 : 0]} ref={anchor}>
            <mesh geometry={GEO.socket()} material={m.brass} castShadow />
            {[0.34, 0.44, 0.54].map(y => <mesh key={y} geometry={GEO.socketRing()} material={m.brass} position={[0, BASE_TOP + y - 0.26 + 0.05, 0]} />)}
            <group position={[0, BASE_TOP + 0.34, 0]} scale={1.15}>
                {[-1, 1].map(s => <mesh key={s} geometry={GEO.support()} material={m.steel} position={[s * 0.16, 0.3, 0]} />)}
                {broken
                    ? <><mesh geometry={GEO.filamentHalf()} material={own.fil} position={[0, 0.52, 0]} /><mesh geometry={GEO.filamentHalf()} material={own.fil} position={[0, 0.52, 0]} rotation={[0, Math.PI, 0.3]} /></>
                    : <mesh geometry={GEO.filament()} material={own.fil} position={[0, 0.52, 0]} />}
                <mesh geometry={GEO.glass()} material={own.glass} renderOrder={2} />
                <mesh geometry={GEO.halo()} material={own.halo} position={[0, 0.52, 0]} raycast={noRaycast} renderOrder={3} />
            </group>
        </group>
    </group>;
}

// ---------------------------------------------------------------------------------------------- LED
function Led({ part, live, emitters }: ModelProps) {
    const m = materials(), hex = LED_COLORS[part.color ?? 'red'];
    const own = useMemo(() => ({
        dome: new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.18, transparent: true, opacity: 0.82, emissive: hex, emissiveIntensity: 0, clearcoat: 1 }),
        halo: haloMaterial(),
        pool: m.pool.clone(),
    }), [m, hex]);
    useDispose(useMemo(() => [own.dome, own.halo, own.pool], [own]));
    const glow = useRef(0), anchor = useRef<THREE.Group>(null), pos = useMemo(() => new THREE.Vector3(), []), where = useWorldPosition(anchor, pos);
    const color = useMemo(() => new THREE.Color(hex), [hex]);
    useEffect(() => { (own.halo.uniforms.uColor.value as THREE.Color).set(hex); own.pool.color.set(hex); }, [own, hex]);
    useFrame((_, dt) => {
        const { sim, night, morph, hdr } = live.current;
        const target = part.broken ? 0 : (sim().runtime.visual[part.id]?.brightness ?? 0);
        glow.current = damp(glow.current, target, 14, Math.min(dt, 0.1));
        const L = glow.current * (1 - morph);
        own.dome.emissiveIntensity = (hdr ? 3.2 : 1.2) * L;
        own.dome.color.set(part.broken ? '#6f7471' : hex);
        own.halo.uniforms.uS.value = (hdr ? 0.9 : 1.3) * L;
        own.pool.opacity = (night ? 0.45 : 0.18) * L;
        emitters.set(part.id, { position: where().clone().setY(0.9), strength: L * (night ? 1.4 : 0.5), color });
    });
    useEffect(() => () => { emitters.delete(part.id); }, [emitters, part.id]);
    return <group>
        <mesh geometry={GEO.baseSmall()} material={m.cream} castShadow receiveShadow />
        <mesh geometry={GEO.pool()} material={own.pool} raycast={noRaycast} scale={0.55} renderOrder={1} />
        <mesh geometry={GEO.leg()} material={m.steel} position={[-0.06, 0.4, 0]} scale={[1, 0.3, 1]} />
        <mesh geometry={GEO.leg()} material={m.steel} position={[0.06, 0.38, 0]} scale={[1, 0.26, 1]} />
        <group ref={anchor} position={[0, 0.62, 0]}>
            <mesh geometry={GEO.ledRim()} material={own.dome} position={[0, -0.13, 0]} />
            <mesh geometry={GEO.ledBody()} material={own.dome} castShadow />
            <mesh geometry={GEO.ledTop()} material={own.dome} position={[0, 0.13, 0]} />
            <mesh geometry={GEO.halo()} material={own.halo} scale={0.5} raycast={noRaycast} renderOrder={3} />
        </group>
    </group>;
}

// ---------------------------------------------------------------------------------------------- hộp pin
function Battery({ part, live }: ModelProps) {
    const m = materials(), cells = part.cells ?? [];
    const heatMat = useMemo(() => m.cellBody.clone(), [m]);
    useDispose(useMemo(() => [heatMat], [heatMat]));
    useFrame(() => {
        const heat = live.current.sim().runtime.heat[part.id] ?? 0, h = Math.max(0, Math.min(1, (heat - 0.3) / 1.2));
        heatMat.emissive.setRGB(1, 0.25, 0.1); heatMat.emissiveIntensity = h * 0.8;
    });
    // Các viên nằm dọc theo hai cọc, xếp lớp theo chiều sâu; viên lắp đúng chiều quay đầu (+) về cọc (+).
    const n = Math.max(1, cells.length), pitch = Math.min(0.42, 0.98 / n), r = Math.min(1, pitch / 0.42);
    return <group>
        <mesh geometry={GEO.baseBattery()} material={m.teal} castShadow receiveShadow />
        <mesh geometry={GEO.well()} material={m.tealDark} receiveShadow />
        {cells.map((cell, i) => {
            const z = (i - (n - 1) / 2) * pitch, dir = cell.polarity;
            if (!cell.present) return <group key={i} position={[0, 0.44, z]} rotation={[0, Math.PI / 2, 0]}>{[-1, 1].map(s => <mesh key={s} geometry={GEO.spring()} material={m.steel} position={[0, 0, s * 0.5]} scale={r} />)}</group>;
            const body = cell.charge01 > 0 ? heatMat : m.cellFlat;
            return <group key={i} position={[0, 0.3 + 0.2 * r, z]} rotation={[0, Math.PI / 2, 0]} scale={[r * 1.3, r * 1.3, 1.45]}>
                <mesh geometry={GEO.cellBody()} material={body} castShadow />
                <mesh geometry={GEO.cellBand()} material={cell.charge01 > 0 ? m.coral : m.darkSteel} position={[0, 0, dir * 0.26]} />
                <mesh geometry={GEO.cellNub()} material={m.steel} position={[0, 0, dir * 0.415]} />
                <mesh geometry={GEO.cellDisc()} material={m.steel} position={[0, 0, -dir * 0.395]} />
            </group>;
        })}
    </group>;
}

// ---------------------------------------------------------------------------------------------- cầu dao / cửa
function KnifeSwitch({ part, live }: ModelProps) {
    const m = materials(), pivot = useRef<THREE.Group>(null), door = part.actuator === 'doorContact';
    const closed = door ? !part.doorClosed : !!part.closed;
    useFrame((_, dt) => {
        if (!pivot.current) return;
        const target = door ? (part.doorClosed ? 0 : -1.15) : closed ? 0 : 0.95;
        const key = door ? 'y' : 'z';
        pivot.current.rotation[key] = live.current.reduced ? target : damp(pivot.current.rotation[key], target, 14, Math.min(dt, 0.1));
    });
    if (door) return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <mesh geometry={GEO.doorFrame()} material={m.tealDark} position={[-0.45, BASE_TOP + 0.31, 0]} castShadow />
        <group ref={pivot} position={[-0.45, BASE_TOP + 0.31, 0]}><mesh geometry={GEO.doorPanel()} material={m.teal} castShadow /></group>
        {[-1, 1].map(s => <mesh key={s} geometry={GEO.strip()} material={m.brass} position={[s * 0.72, BASE_TOP + 0.015, 0.3]} />)}
    </group>;
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        {[-1, 1].map(s => <mesh key={s} geometry={GEO.strip()} material={m.brass} position={[s * 0.62, BASE_TOP + 0.015, 0]} />)}
        <mesh geometry={GEO.hinge()} material={m.brass} position={[-0.42, BASE_TOP + 0.15, 0]} castShadow />
        {[-1, 1].map(s => <mesh key={s} geometry={GEO.jaw()} material={m.brass} position={[0.52, BASE_TOP + 0.16, s * 0.075]} castShadow />)}
        <group ref={pivot} position={[-0.42, BASE_TOP + 0.26, 0]} rotation={[0, 0, closed ? 0 : 0.95]}>
            <mesh geometry={GEO.blade()} material={m.brass} castShadow />
            <mesh geometry={GEO.handle()} material={m.coral} position={[1.02, 0.12, 0]} castShadow />
        </group>
    </group>;
}

function PushButton({ part, live }: ModelProps) {
    const m = materials(), cap = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => { if (cap.current) cap.current.position.y = damp(cap.current.position.y, BASE_TOP + (part.closed ? 0.2 : 0.27), 30, Math.min(dt, 0.1)); });
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        {[-1, 1].map(s => <mesh key={s} geometry={GEO.strip()} material={m.brass} position={[s * 0.6, BASE_TOP + 0.015, 0]} />)}
        <mesh geometry={GEO.buttonHousing()} material={m.teal} castShadow />
        <mesh ref={cap} geometry={GEO.buttonCap()} material={m.coral} position={[0, BASE_TOP + 0.27, 0]} castShadow />
    </group>;
}

function TwoWay({ part, live }: ModelProps) {
    const m = materials(), pivot = useRef<THREE.Group>(null);
    const angle = (p: Part) => (p.position ? -0.37 : 0.37);
    useFrame((_, dt) => { if (pivot.current) pivot.current.rotation.y = live.current.reduced ? angle(part) : damp(pivot.current.rotation.y, angle(part), 14, Math.min(dt, 0.1)); });
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <mesh geometry={GEO.hinge()} material={m.brass} position={[-0.4, BASE_TOP + 0.15, 0]} castShadow />
        {[-0.45, 0.45].map(z => [-1, 1].map(s => <mesh key={`${z}${s}`} geometry={GEO.jaw()} material={m.brass} position={[0.62, BASE_TOP + 0.16, z + s * 0.07]} scale={[0.8, 1, 1]} />))}
        <group ref={pivot} position={[-0.4, BASE_TOP + 0.24, 0]} rotation={[0, angle(part), 0]}>
            <mesh geometry={GEO.blade()} material={m.brass} scale={[1.08, 1, 1]} castShadow />
            <mesh geometry={GEO.handle()} material={m.coral} position={[0.6, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} scale={0.8} castShadow />
        </group>
    </group>;
}

// ---------------------------------------------------------------------------------------------- chuông, còi, quạt
function Bell({ part, live }: ModelProps) {
    const m = materials(), arm = useRef<THREE.Group>(null), dome = useRef<THREE.Mesh>(null), ring = useRef(0);
    useFrame((_, dt) => {
        const r = live.current.sim().runtime, open = !!r.bellOpen[part.id];
        if (arm.current) arm.current.rotation.z = damp(arm.current.rotation.z, open ? 0.42 : 0, 40, Math.min(dt, 0.05));
        if (open) ring.current = 1;
        ring.current = Math.max(0, ring.current - dt * 3);
        if (dome.current && !live.current.reduced) dome.current.rotation.z = Math.sin(performance.now() * 0.06) * 0.03 * ring.current;
    });
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <mesh geometry={GEO.stand()} material={m.steel} position={[0, BASE_TOP + 0.24, -0.18]} />
        <mesh ref={dome} geometry={GEO.dome()} material={m.brass} position={[0, BASE_TOP + 0.48, -0.18]} castShadow />
        <mesh geometry={GEO.coil()} material={m.coral} position={[-0.1, BASE_TOP + 0.15, 0.3]} castShadow />
        <group ref={arm} position={[0.2, BASE_TOP + 0.1, 0.3]}>
            <mesh geometry={GEO.arm()} material={m.steel} rotation={[-0.5, 0, 0]} />
            <mesh geometry={GEO.ball()} material={m.steel} position={[0, 0.3, -0.16]} />
        </group>
    </group>;
}

function Buzzer({ part, live }: ModelProps) {
    const m = materials(), body = useRef<THREE.Group>(null);
    useFrame(() => {
        if (!body.current) return;
        const on = Math.abs(reading(live.current.sim().solution, part.id).Iab) >= 0.004 && !live.current.reduced && !part.broken;
        body.current.position.y = on ? Math.sin(performance.now() * 0.9) * 0.008 : 0;
    });
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <group ref={body}>
            <mesh geometry={GEO.buzzerBody()} material={m.rubber} castShadow />
            <mesh geometry={GEO.buzzerTop()} material={m.darkSteel} position={[0, BASE_TOP + 0.265, 0]} />
        </group>
    </group>;
}

function Motor({ part, live }: ModelProps) {
    const m = materials(), hub = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!hub.current || live.current.reduced) return;
        hub.current.rotation.z -= Math.min(dt, 0.1) * Math.PI * 2 * (live.current.sim().runtime.visual[part.id]?.motorRps ?? 0);
    });
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <mesh geometry={GEO.cradle()} material={m.teal} castShadow />
        <mesh geometry={GEO.can()} material={m.steel} position={[0, BASE_TOP + 0.42, -0.08]} castShadow />
        <group ref={hub} position={[0, BASE_TOP + 0.42, 0.28]}>
            {[0, 1, 2].map(k => <mesh key={k} geometry={GEO.fanBlade()} material={m.coral} rotation={[0, 0, k * Math.PI * 2 / 3 + 0.3]} castShadow />)}
            <mesh geometry={GEO.hub()} material={m.cream} />
        </group>
    </group>;
}

// ---------------------------------------------------------------------------------------------- điện trở, biến trở, cầu chì
const BAND_COLORS = ['#1b1b1b', '#7a4a2a', '#d23c2c', '#ef8a2b', '#f3d23b', '#3f9c4f', '#3a6fd1', '#7b4fc0', '#8c8c8c', '#f4f4f4'];
function bands(ohms: number): string[] {
    const exp = Math.max(0, Math.floor(Math.log10(Math.max(10, ohms))) - 1), sig = Math.round(ohms / 10 ** exp);
    return [BAND_COLORS[Math.floor(sig / 10) % 10], BAND_COLORS[sig % 10], BAND_COLORS[exp % 10], '#c9a646'];
}
const bandMats = new Map<string, THREE.MeshStandardMaterial>();
const bandMat = (c: string) => bandMats.get(c) ?? (bandMats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: c === '#c9a646' ? 0.8 : 0 })), bandMats.get(c)!);

function Leads({ inner }: { inner: number }) {
    const m = materials(), len = 0.8 - inner;
    return <>{[-1, 1].map(s => <mesh key={s} geometry={GEO.lead()} material={m.steel} position={[s * (inner + len / 2), BASE_TOP + 0.16, 0]} scale={[len, 1, 1]} />)}</>;
}
function Resistor({ part }: ModelProps) {
    const m = materials(), list = bands(part.resistance ?? 100);
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <Leads inner={0.3} />
        <group position={[0, BASE_TOP + 0.16, 0]}>
            <mesh geometry={GEO.resistorBody()} material={m.beige} castShadow />
            {list.map((c, i) => <mesh key={i} geometry={GEO.band()} material={bandMat(c)} position={[-0.18 + i * 0.1 + (i === 3 ? 0.06 : 0), 0, 0]} />)}
        </group>
    </group>;
}
function Rheostat({ part }: ModelProps) {
    const m = materials(), x = -0.55 + 1.1 * (part.knob01 ?? 0.1);
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <group position={[0, BASE_TOP + 0.2, -0.05]}>
            <mesh geometry={GEO.rheoCore()} material={m.white} castShadow />
            <mesh geometry={GEO.rheoWinding()} material={m.copper} />
        </group>
        <mesh geometry={GEO.rail()} material={m.brass} position={[0, BASE_TOP + 0.44, -0.05]} />
        <mesh geometry={GEO.slider()} material={m.coral} position={[x, BASE_TOP + 0.4, -0.05]} castShadow />
    </group>;
}
function Fuse({ part, live }: ModelProps) {
    const m = materials(), wire = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e39a64', emissive: '#ff6a1a', emissiveIntensity: 0, metalness: 0.6, roughness: 0.4 }), []);
    useDispose(useMemo(() => [wire], [wire]));
    useFrame(() => { wire.emissiveIntensity = Math.min(1, live.current.sim().runtime.damage[part.id] ?? 0) * (live.current.hdr ? 4 : 1.5); });
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <Leads inner={0.42} />
        <group position={[0, BASE_TOP + 0.16, 0]}>
            {[-1, 1].map(s => <mesh key={s} geometry={GEO.fuseCap()} material={m.steel} position={[s * 0.35, 0, 0]} castShadow />)}
            {!part.broken && <mesh geometry={GEO.fuseWire()} material={wire} />}
            {part.broken && <mesh geometry={GEO.fuseWire()} material={m.rubber} scale={[0.3, 3, 3]} />}
            <mesh geometry={GEO.fuseTube()} material={m.glass} renderOrder={2} />
        </group>
    </group>;
}

// ---------------------------------------------------------------------------------------------- đồng hồ đo
const dialTex = new Map<string, THREE.Texture>();
function dialTexture(letter: 'A' | 'V') {
    if (dialTex.has(letter)) return dialTex.get(letter)!;
    const c = document.createElement('canvas'); c.width = 320; c.height = 196; const g = c.getContext('2d')!;
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, 320, 196);
    g.strokeStyle = '#1f2a37'; g.lineWidth = 4; g.beginPath(); g.arc(160, 170, 128, Math.PI * 1.17, Math.PI * 1.83); g.stroke();
    for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (1.17 + 0.66 * i / 10), r0 = i % 5 ? 116 : 106;
        g.lineWidth = i % 5 ? 3 : 5; g.beginPath(); g.moveTo(160 + Math.cos(a) * r0, 170 + Math.sin(a) * r0); g.lineTo(160 + Math.cos(a) * 128, 170 + Math.sin(a) * 128); g.stroke();
    }
    g.fillStyle = letter === 'A' ? '#c8553d' : '#2f6fb0'; g.font = '900 64px ElectricityNunito, Nunito, sans-serif'; g.textAlign = 'center'; g.fillText(letter, 160, 150);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; dialTex.set(letter, t); return t;
}
function Meter({ part, live }: ModelProps) {
    const m = materials(), letter = part.kind === 'ammeter' ? 'A' : 'V', needle = useRef<THREE.Mesh>(null);
    const face = useMemo(() => new THREE.MeshBasicMaterial({ map: dialTexture(letter), toneMapped: false }), [letter]);
    const needleMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#c8553d' }), []);
    useDispose(useMemo(() => [face, needleMat], [face, needleMat]));
    useFrame((_, dt) => {
        if (!needle.current) return;
        const r = reading(live.current.sim().solution, part.id), v = letter === 'A' ? Math.abs(r.Iab) / 0.5 : Math.abs(r.Uab) / 6;
        const target = 0.99 - 1.98 * Math.min(1, v); // −57°…+57° quanh trục z (dương = trái)
        needle.current.rotation.z = live.current.reduced ? target : damp(needle.current.rotation.z, target, 8, Math.min(dt, 0.1));
    });
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <group position={[0, BASE_TOP + 0.38, -0.12]} rotation={[-0.42, 0, 0]}>
            <mesh geometry={GEO.meterBody()} material={m.teal} castShadow />
            <mesh geometry={GEO.meterFace()} material={face} position={[0, 0.02, 0.135]} />
            <mesh ref={needle} geometry={GEO.needle()} material={needleMat} position={[0, -0.23, 0.145]} rotation={[0, 0, 0.99]} />
        </group>
    </group>;
}

// ---------------------------------------------------------------------------------------------- nam châm điện, máy phát, pin trái cây, mẫu vật, nút nối
function Electromagnet({ part, live }: ModelProps) {
    const m = materials(), coil = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e39a64', metalness: 0.9, roughness: 0.3, emissive: '#ff9a4a', emissiveIntensity: 0 }), []);
    useDispose(useMemo(() => [coil], [coil]));
    useFrame(() => { coil.emissiveIntensity = Math.min(1, Math.abs(reading(live.current.sim().solution, part.id).Iab) / 0.3) * 0.35; });
    const turns = part.turns === 80 ? 18 : part.turns === 20 ? 7 : 12;
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        <group position={[0, BASE_TOP + 0.14, 0]}>
            <mesh geometry={GEO.nail()} material={part.iron === false ? m.white : m.darkSteel} castShadow />
            <mesh geometry={GEO.nailHead()} material={m.darkSteel} position={[-0.62, 0, 0]} />
            <mesh geometry={GEO.magnetCoil(turns)} material={coil} castShadow />
        </group>
    </group>;
}
function Generator({ part, live }: ModelProps) {
    const m = materials(), crank = useRef<THREE.Group>(null);
    useFrame((_, dt) => { if (crank.current && !live.current.reduced) crank.current.rotation.z -= Math.min(dt, 0.1) * Math.PI * 2 * (part.speed ?? 0); });
    return <group>
        <mesh geometry={GEO.baseBattery()} material={m.teal} castShadow receiveShadow />
        <mesh geometry={GEO.can()} material={m.steel} position={[0, 0.62, -0.12]} scale={[1.2, 1.2, 1]} castShadow />
        <group ref={crank} position={[0, 0.62, 0.24]}>
            <mesh geometry={GEO.crankArm()} material={m.coral} castShadow />
            <mesh geometry={GEO.crankKnob()} material={m.cream} position={[0, 0.4, 0.12]} castShadow />
        </group>
    </group>;
}
function Fruit({ part }: ModelProps) {
    const m = materials();
    return <group>
        <mesh geometry={GEO.baseSmall()} material={m.cream} castShadow receiveShadow />
        <mesh geometry={part.kind === 'lemon' ? GEO.lemon() : GEO.potato()} material={part.kind === 'lemon' ? m.lemon : m.potato} position={[0, 0.58, 0]} castShadow />
        <mesh geometry={GEO.electrode()} material={m.zinc} position={[-0.34, 0.86, 0]} />
        <mesh geometry={GEO.electrode()} material={m.copper} position={[0.34, 0.86, 0]} />
    </group>;
}
function Sample({ part }: ModelProps) {
    const m = materials();
    return <group>
        <mesh geometry={GEO.base()} material={m.cream} castShadow receiveShadow />
        {[-1, 1].map(s => <group key={s} position={[s * 0.5, BASE_TOP + 0.14, 0]} rotation={[0, s > 0 ? Math.PI : 0, 0]}>
            <mesh geometry={GEO.clipSleeve()} material={s > 0 ? m.teal : m.coral} position={[-0.12, 0, 0]} castShadow />
            {[-1, 1].map(k => <mesh key={k} geometry={GEO.clipJaw()} material={m.steel} position={[0.2, k * 0.04, 0]} rotation={[0, 0, k * 0.1]} />)}
        </group>)}
        <mesh geometry={GEO.sampleRod()} material={part.resistance === null ? m.white : m.steel} position={[0, BASE_TOP + 0.14, 0]} castShadow />
    </group>;
}
function Junction() {
    const m = materials();
    return <mesh geometry={GEO.baseRound()} material={m.cream} castShadow receiveShadow />;
}

const MODELS: Partial<Record<Part['kind'], React.FC<ModelProps>>> = {
    battery: Battery, bulb: Bulb, led: Led, switch: KnifeSwitch, button: PushButton, spdt: TwoWay, bell: Bell, buzzer: Buzzer,
    motor: Motor, resistor: Resistor, rheostat: Rheostat, fuse: Fuse, ammeter: Meter, voltmeter: Meter, electromagnet: Electromagnet,
    generator: Generator, lemon: Fruit, potato: Fruit, sample: Sample, junction: Junction,
};

/** Mô hình một linh kiện trong tọa độ riêng (cọc ở x = ±0,8; cọc đồng vẽ riêng ở BenchScene). */
export const PartModel = memo(function PartModel(props: ModelProps) {
    const Model = MODELS[props.part.kind] ?? Resistor;
    return <Model {...props} />;
}, (a, b) => a.live === b.live && a.emitters === b.emitters && JSON.stringify(a.part) === JSON.stringify(b.part));

/** Kích thước thân (cho viền chọn và bóng đổ). */
export function footprint(kind: Part['kind']): [number, number] {
    return kind === 'junction' ? [0.95, 0.95] : kind === 'battery' || kind === 'generator' ? [2.04, 1.18] : ['led', 'lemon', 'potato'].includes(kind) ? [1.8, 1.0] : [2.0, 1.12];
}

export { glowColor };
