// Tầng L1–L3 khi "lặn vào nguyên tử": sắp xếp nguyên tử → nguyên tử Bohr kiểu SGK → hạt nhân đúng số hạt.
// Mọi hình nằm trong bán kính ~1,2 đơn vị; tầng được phóng/mờ bởi FadeGroup của sân khấu.
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ElementFull } from '../engine/elements';
import { nucleonCounts, nucleusPack, protonMask, rng } from '../engine/atom';
import type { QualityTier } from './params';
import { softDot, useSurface } from './common';
import { BohrShells } from './BohrShells';

// ---------------------------------------------------------------- L1: sắp xếp
function latticePoints(kind: string, n: number): number[][] {
    const pts: number[][] = [];
    const basis: Record<string, number[][]> = {
        fcc: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]],
        bcc: [[0, 0, 0], [0.5, 0.5, 0.5]],
        diamond: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5], [0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75]],
    };
    if (kind === 'hcp' || kind === 'graphite') {
        const layers = kind === 'graphite' ? 3 : 5;
        for (let l = 0; l < layers; l++) for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
            const off = l % 2 ? [0.5, 0.29] : [0, 0];
            const x = i + j * 0.5 + off[0], y = j * 0.866 + off[1];
            if (x * x + y * y > 9) continue;
            if (kind === 'graphite' && ((i - j) % 3 + 3) % 3 === 0) continue;   // lỗ lục giác
            pts.push([x / 3.2, (l - (layers - 1) / 2) * (kind === 'graphite' ? 0.42 : 0.26), y / 3.2]);
        }
        return pts;
    }
    const b = basis[kind] ?? basis.fcc;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) for (const q of b) pts.push([(i + q[0]) / n - 0.5, (j + q[1]) / n - 0.5, (k + q[2]) / n - 0.5]);
    return pts.map(p => p.map(c => c * 2));
}

const MOL_ATOMS: Record<string, number[][]> = {
    H2: [[-0.5, 0, 0], [0.5, 0, 0]], N2: [[-0.5, 0, 0], [0.5, 0, 0]], O2: [[-0.5, 0, 0], [0.5, 0, 0]], F2: [[-0.5, 0, 0], [0.5, 0, 0]],
    Cl2: [[-0.5, 0, 0], [0.5, 0, 0]], Br2: [[-0.5, 0, 0], [0.5, 0, 0]], I2: [[-0.5, 0, 0], [0.5, 0, 0]], mono: [[0, 0, 0]],
    P4: [[0, 0.6, 0], [-0.5, -0.25, 0.3], [0.5, -0.25, 0.3], [0, -0.25, -0.58]],
    S8: Array.from({ length: 8 }, (_, i) => [Math.cos(i * Math.PI / 4) * 0.9, (i % 2 ? 0.25 : -0.25), Math.sin(i * Math.PI / 4) * 0.9]),
};

export const Arrangement: React.FC<{ el: ElementFull; tier: QualityTier; tempC: number }> = ({ el, tier, tempC }) => {
    const s = el.specimen;
    const mat = useSurface(tier, { color: el.specimen.kind === 'gas-tube' ? '#dfe7ff' : s.color, metal: s.metal, roughness: s.metal ? 0.3 : 0.45 });
    const inst = useRef<THREE.InstancedMesh>(null);
    const moving = s.structure === 'monatomic' || s.structure === 'molecular' || s.structure === 'liquid';
    const gasLike = moving && (el.state === 'gas' || el.specimen.kind === 'atoms-only');
    const setup = useMemo(() => {
        const R = rng(el.atomicNumber * 31);
        if (!moving) {
            const pts = latticePoints(s.structure === 'other' ? 'fcc' : s.structure, 4);
            return { pts: pts.map(p => new THREE.Vector3(...p)), unit: [[0, 0, 0]], r: s.structure === 'graphite' ? 0.07 : 0.17, mols: pts.length, vel: [] as THREE.Vector3[], rot: [] as THREE.Euler[] };
        }
        const unit = MOL_ATOMS[s.molecule ?? 'mono'];
        const nMol = el.specimen.kind === 'atoms-only' ? 5 : gasLike ? (unit.length > 2 ? 10 : 26) : unit.length > 2 ? 14 : 70;
        const pts: THREE.Vector3[] = [], vel: THREE.Vector3[] = [], rot: THREE.Euler[] = [];
        for (let i = 0; i < nMol; i++) {
            pts.push(new THREE.Vector3((R() - 0.5) * 2, (R() - 0.5) * 2, (R() - 0.5) * 2));
            vel.push(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(gasLike ? 0.9 : 0.15));
            rot.push(new THREE.Euler(R() * 6, R() * 6, R() * 6));
        }
        return { pts, unit, r: unit.length > 2 ? 0.07 : gasLike ? 0.09 : 0.12, mols: nMol, vel, rot };
    }, [el.atomicNumber, moving, gasLike, s.structure, s.molecule, el.specimen.kind]);
    const count = setup.mols * setup.unit.length;
    const m4 = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), v = useMemo(() => new THREE.Vector3(), []), one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
    const write = (t: number, dt: number) => {
        const m = inst.current; if (!m) return;
        const speed = Math.sqrt(Math.max(20, tempC + 273) / 298);
        let k = 0;
        for (let i = 0; i < setup.mols; i++) {
            const p = setup.pts[i];
            if (moving) {
                p.addScaledVector(setup.vel[i], dt * speed);
                (['x', 'y', 'z'] as const).forEach(ax => { if (Math.abs(p[ax]) > 1) { p[ax] = Math.sign(p[ax]); setup.vel[i][ax] *= -1; } });
                setup.rot[i].x += dt * speed; setup.rot[i].y += dt * 0.7 * speed;
                q.setFromEuler(setup.rot[i]);
            } else q.identity();
            for (const u of setup.unit) {
                v.set(u[0], u[1], u[2]).multiplyScalar(setup.r * 1.7).applyQuaternion(q).add(p);
                if (!moving) v.addScalar(Math.sin(t * 9 + i * 1.7) * 0.004);
                m4.compose(v, q, one.set(setup.r, setup.r, setup.r)); m.setMatrixAt(k++, m4);
            }
        }
        m.instanceMatrix.needsUpdate = true;
    };
    useLayoutEffect(() => write(0, 0));
    useFrame((st, dt) => write(st.clock.elapsedTime, Math.min(dt, 0.05)));
    return (
        <group rotation={[0.45, 0.6, 0]} scale={0.72}>
            <instancedMesh key={count} ref={inst} args={[undefined, undefined, count]} material={mat}>
                <sphereGeometry args={[1, 18, 12]} />
            </instancedMesh>
        </group>
    );
};

// ---------------------------------------------------------------- L2: nguyên tử Bohr kiểu SGK + mây electron
function lastSubshell(config: string): 's' | 'p' | 'd' | 'f' {
    const m = config.match(/[spdf](?=[⁰¹²³⁴⁵⁶⁷⁸⁹]*\s*$)/);
    return (m?.[0] as 's' | 'p' | 'd' | 'f') ?? 's';
}

function cloudPoints(kind: 's' | 'p' | 'd' | 'f', n: number, seed: number): { pos: Float32Array; col: Float32Array } {
    const R = rng(seed), pos: number[] = [], col: number[] = [];
    const A = new THREE.Color('#38bdf8'), B = new THREE.Color('#f472b6');
    let tries = 0;
    while (pos.length / 3 < n && tries < n * 300) {
        tries++;
        const x = (R() * 2 - 1) * 14, y = (R() * 2 - 1) * 14, z = (R() * 2 - 1) * 14;
        const r = Math.hypot(x, y, z) + 1e-6, ct = z / r;
        let psi: number, k: number;
        if (kind === 's') { psi = Math.exp(-r / 2.2) * (1 - r / 7); k = 1.4; }
        else if (kind === 'p') { psi = r * Math.exp(-r / 2) * ct / 2.5; k = 3.2; }
        else if (kind === 'd') { psi = r * r * Math.exp(-r / 3) * (3 * ct * ct - 1) / 30; k = 0.9; }
        else { psi = r * r * r * Math.exp(-r / 3.2) * ct * (5 * ct * ct - 3) / 260; k = 0.7; }
        if (R() < psi * psi * k) { pos.push(x / 12, z / 12, y / 12); const c = psi >= 0 ? A : B; col.push(c.r, c.g, c.b); }
    }
    return { pos: new Float32Array(pos), col: new Float32Array(col) };
}

export const BohrAtom: React.FC<{ el: ElementFull; tier: QualityTier; cloud: boolean }> = ({ el, tier, cloud }) => {
    const cloudGeo = useMemo(() => {
        if (!cloud) return null;
        const { pos, col } = cloudPoints(lastSubshell(el.electronConfig), tier === 'high' ? 16000 : 6000, el.atomicNumber);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
    }, [el.electronConfig, el.atomicNumber, tier, cloud]);
    useEffect(() => () => { cloudGeo?.dispose(); }, [cloudGeo]);
    const cloudRef = useRef<THREE.Points>(null);
    useFrame((st) => {
        if (cloudRef.current) cloudRef.current.rotation.y = st.clock.elapsedTime * 0.25;
    });
    return (
        <group position={[0, 0.32, 0]} rotation={[-0.65, 0.2, -0.12]}>
            <Nucleus el={el} tier={tier} compact />
            {!cloud && <BohrShells shells={el.electronShells} tier={tier} />}
            {cloud && cloudGeo && (
                <points ref={cloudRef} geometry={cloudGeo}>
                    <pointsMaterial size={0.035} map={softDot()} vertexColors transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
                </points>
            )}
        </group>
    );
};

// ---------------------------------------------------------------- L3: hạt nhân
export const Nucleus: React.FC<{ el: ElementFull; tier: QualityTier; compact?: boolean }> = ({ el, tier, compact = false }) => {
    const { A, protons } = nucleonCounts(el.atomicNumber);
    const pos = useMemo(() => nucleusPack(el.atomicNumber, A), [el.atomicNumber, A]);
    const mask = useMemo(() => protonMask(el.atomicNumber, A), [el.atomicNumber, A]);
    const scale = useMemo(() => { let m = 0; for (let i = 0; i < A; i++) m = Math.max(m, Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])); return (compact ? 0.18 : 0.8) / (m + 1); }, [pos, A, compact]);
    const mat = useSurface(tier, { color: '#ffffff', metal: false, roughness: 0.35 });
    const inst = useRef<THREE.InstancedMesh>(null), grp = useRef<THREE.Group>(null), alpha = useRef<THREE.Group>(null);
    useLayoutEffect(() => {
        const m = inst.current; if (!m) return;
        const m4 = new THREE.Matrix4(), red = new THREE.Color('#ef4444'), blue = new THREE.Color('#93c5fd');
        for (let i = 0; i < A; i++) { m4.makeTranslation(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); m.setMatrixAt(i, m4); m.setColorAt(i, mask[i] ? red : blue); }
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [pos, mask, A]);
    const unstable = !compact && !el.isotope.stable;
    const red = useSurface(tier, { color: '#ef4444', metal: false, roughness: 0.35 }), blue = useSurface(tier, { color: '#93c5fd', metal: false, roughness: 0.35 });
    useFrame((st) => {
        const t = st.clock.elapsedTime;
        if (grp.current) {
            grp.current.rotation.set(0.3, t * 0.25, 0);
            if (unstable) grp.current.position.set(Math.sin(t * 37) * 0.012, Math.cos(t * 41) * 0.012, 0);
        }
        if (alpha.current) {
            const c = (t % 3.2) / 3.2;
            alpha.current.visible = unstable && protons > 20;
            alpha.current.position.set(0.3 + c * 2.4, 0.2 + c * 0.9, 0);
        }
    });
    return (
        <group>
            <group ref={grp} scale={scale}>
                <instancedMesh key={A} ref={inst} args={[undefined, undefined, A]} material={mat}><sphereGeometry args={[1, 18, 12]} /></instancedMesh>
            </group>
            {!compact && <group ref={alpha} scale={scale}>
                {[[0, 0, 0, 1], [2, 0, 0, 0], [1, 1.7, 0, 1], [1, 0.6, 1.6, 0]].map(([x, y, z, p], i) => <mesh key={i} material={p ? red : blue} position={[x, y, z]}><sphereGeometry args={[1, 14, 10]} /></mesh>)}
            </group>}
        </group>
    );
};

// ---------------------------------------------------------------- lớp electron 3D của Xưởng
// Mỗi lớp là một vỏ cầu mờ; mỗi electron bay trên quỹ đạo RIÊNG, mặt phẳng nghiêng theo một hướng khác nhau
// (hướng pháp tuyến rải đều kiểu Fibonacci trên mặt cầu) — xoay thế nào cũng không thành "cái đĩa".
// Lớp ngoài cùng sáng vàng và có vệt quỹ đạo.
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
interface Orbit { r: number; u: THREE.Vector3; v: THREE.Vector3; phase: number; w: number; valence: boolean; normal: THREE.Vector3 }
function buildOrbits(shells: number[], radius: (s: number) => number): Orbit[] {
    const out: Orbit[] = [];
    shells.forEach((n, s) => {
        for (let i = 0; i < n; i++) {
            const k = (i + 0.5) / n, y = 1 - 2 * k, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = GOLDEN * i + s * 1.3;
            const normal = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr).normalize();
            const u = new THREE.Vector3(0, 1, 0).cross(normal); if (u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize();
            const v = normal.clone().cross(u).normalize();
            out.push({ r: radius(s), u, v, normal, phase: (i / n) * Math.PI * 2 + s, w: (i % 2 ? -1 : 1) * 1.5 / Math.pow(s + 1, 0.7), valence: s === shells.length - 1 });
        }
    });
    return out;
}

export const ElectronShells3D: React.FC<{ shells: number[]; radius: (s: number) => number; eSize: number; vSize: number }> = ({ shells, radius, eSize, vSize }) => {
    const key = shells.join(',');
    const orbits = useMemo(() => buildOrbits(shells, radius), [key]);   // eslint-disable-line react-hooks/exhaustive-deps
    const inner = orbits.filter(o => !o.valence), outer = orbits.filter(o => o.valence);
    const eMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#67e8f9').multiplyScalar(1.5), transparent: true }), []);
    const vMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#fde047').multiplyScalar(2.6), transparent: true }), []);
    // vỏ lớp như bong bóng: chỉ sáng ở viền (fresnel), giữa trong suốt → các lớp lồng nhau không thành khối đục
    const shellMat = useMemo(() => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color('#7c8cf0') } },
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
        fragmentShader: `uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0); gl_FragColor = vec4(uColor * f * 0.55, f * 0.55);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    }), []);
    const trailMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.28, depthWrite: false }), []);
    const iRef = useRef<THREE.InstancedMesh>(null), oRef = useRef<THREE.InstancedMesh>(null);
    const m4 = useMemo(() => new THREE.Matrix4(), []), p = useMemo(() => new THREE.Vector3(), []);
    const place = (mesh: THREE.InstancedMesh | null, list: Orbit[], t: number) => {
        if (!mesh) return;
        list.forEach((o, i) => { const a = o.phase + t * o.w; p.copy(o.u).multiplyScalar(Math.cos(a) * o.r).addScaledVector(o.v, Math.sin(a) * o.r); m4.makeTranslation(p.x, p.y, p.z); mesh.setMatrixAt(i, m4); });
        mesh.instanceMatrix.needsUpdate = true;
    };
    useFrame((st) => { const t = st.clock.elapsedTime; place(iRef.current, inner, t); place(oRef.current, outer, t); });
    const radii = shells.map((_, s) => radius(s));
    return (
        <group>
            {radii.map((r, s) => <mesh key={s} material={shellMat}><sphereGeometry args={[r, 32, 20]} /></mesh>)}
            {outer.map((o, i) => (
                <mesh key={`t${i}`} material={trailMat} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), o.normal)}>
                    <torusGeometry args={[o.r, 0.004, 6, 120]} />
                </mesh>
            ))}
            {inner.length > 0 && <instancedMesh key={`i${key}`} ref={iRef} args={[undefined, undefined, inner.length]} material={eMat}><sphereGeometry args={[eSize, 10, 8]} /></instancedMesh>}
            {outer.length > 0 && <instancedMesh key={`o${key}`} ref={oRef} args={[undefined, undefined, outer.length]} material={vMat}><sphereGeometry args={[vSize, 12, 10]} /></instancedMesh>}
        </group>
    );
};
