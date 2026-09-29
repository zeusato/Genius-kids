// Tầng L1–L3 khi "lặn vào nguyên tử": sắp xếp nguyên tử → nguyên tử Bohr kiểu SGK → hạt nhân đúng số hạt.
// Mọi hình nằm trong bán kính ~1,2 đơn vị; tầng được phóng/mờ bởi FadeGroup của sân khấu.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ElementFull } from '../engine/elements';
import { nucleonCounts, nucleusPack, protonMask, rng } from '../engine/atom';
import type { QualityTier } from './params';
import { makeHalo, softDot, useSurface } from './common';

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
    const shells = el.electronShells;
    const R0 = 0.28, step = Math.min(0.17, 0.95 / Math.max(1, shells.length));
    const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#6b7bd6', transparent: true, opacity: 0.55 }), []);
    const eMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#67e8f9').multiplyScalar(1.5), transparent: true }), []);
    const vMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#fde047').multiplyScalar(2.6), transparent: true }), []);
    const nuc = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#fb7185').multiplyScalar(2), transparent: true }), []);
    const halo = useMemo(() => makeHalo('#fb7185', tier === 'high' ? 0.4 : 0.9), [tier]);
    const groups = useRef<(THREE.Group | null)[]>([]);
    const cloudGeo = useMemo(() => {
        if (!cloud) return null;
        const { pos, col } = cloudPoints(lastSubshell(el.electronConfig), tier === 'high' ? 16000 : 6000, el.atomicNumber);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
    }, [el.electronConfig, el.atomicNumber, tier, cloud]);
    const cloudRef = useRef<THREE.Points>(null);
    useFrame((st, dt) => {
        groups.current.forEach((g, i) => { if (g) g.rotation.z += dt * 0.9 / (i + 1); });
        if (cloudRef.current) cloudRef.current.rotation.y = st.clock.elapsedTime * 0.25;
    });
    return (
        <group rotation={[-0.3, 0.2, 0]} scale={1.3}>
            <mesh material={nuc}><sphereGeometry args={[0.1, 20, 14]} /></mesh>
            <mesh material={halo}><sphereGeometry args={[0.2, 20, 14]} /></mesh>
            <group visible={!cloud}>
                {shells.map((n, s) => {
                    const r = R0 + s * step, outer = s === shells.length - 1;
                    return (
                        <group key={s}>
                            <mesh material={ringMat}><torusGeometry args={[r, 0.005, 6, 160]} /></mesh>
                            <group ref={g => { groups.current[s] = g; }}>
                                {Array.from({ length: n }, (_, i) => {
                                    const a = (i / n) * Math.PI * 2;
                                    return <mesh key={i} material={outer ? vMat : eMat} position={[Math.cos(a) * r, Math.sin(a) * r, 0]}><sphereGeometry args={[outer ? 0.034 : 0.026, 10, 8]} /></mesh>;
                                })}
                            </group>
                        </group>
                    );
                })}
            </group>
            {cloud && cloudGeo && (
                <points ref={cloudRef} geometry={cloudGeo}>
                    <pointsMaterial size={0.035} map={softDot()} vertexColors transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
                </points>
            )}
        </group>
    );
};

// ---------------------------------------------------------------- L3: hạt nhân
export const Nucleus: React.FC<{ el: ElementFull; tier: QualityTier }> = ({ el, tier }) => {
    const { A, protons } = nucleonCounts(el.atomicNumber);
    const pos = useMemo(() => nucleusPack(el.atomicNumber, A), [el.atomicNumber, A]);
    const mask = useMemo(() => protonMask(el.atomicNumber, A), [el.atomicNumber, A]);
    const scale = useMemo(() => { let m = 0; for (let i = 0; i < A; i++) m = Math.max(m, Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])); return 0.8 / (m + 1); }, [pos, A]);
    const mat = useSurface(tier, { color: '#ffffff', metal: false, roughness: 0.35 });
    const inst = useRef<THREE.InstancedMesh>(null), grp = useRef<THREE.Group>(null), alpha = useRef<THREE.Group>(null);
    useLayoutEffect(() => {
        const m = inst.current; if (!m) return;
        const m4 = new THREE.Matrix4(), red = new THREE.Color('#ef4444'), blue = new THREE.Color('#93c5fd');
        for (let i = 0; i < A; i++) { m4.makeTranslation(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); m.setMatrixAt(i, m4); m.setColorAt(i, mask[i] ? red : blue); }
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [pos, mask, A]);
    const unstable = !el.isotope.stable;
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
            <group ref={alpha} scale={scale}>
                {[[0, 0, 0, 1], [2, 0, 0, 0], [1, 1.7, 0, 1], [1, 0.6, 1.6, 0]].map(([x, y, z, p], i) => <mesh key={i} material={p ? red : blue} position={[x, y, z]}><sphereGeometry args={[1, 14, 10]} /></mesh>)}
            </group>
        </group>
    );
};
