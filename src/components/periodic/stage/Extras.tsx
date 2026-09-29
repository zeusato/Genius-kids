// GĐ7: 🏙️ Thành phố nguyên tố (bảng dựng đứng thành cột theo tính chất) và 🧪 Bếp phân tử.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CATEGORY_COLORS } from '../../../data/elementsData';
import { ELEMENTS, type ElementFull } from '../engine/elements';
import { ATOMS, type Counts, type Recipe } from '../engine/molecules';
import { rng } from '../engine/atom';
import type { QualityTier } from './params';
import { CellRects, pxToWorld, stageFrame, worldPerPx } from './screen';
import { clamp01, easeInOut, useSurface } from './common';

export type CityProp = 'melt' | 'density' | 'age' | 'crust';

export function cityValue(e: ElementFull, p: CityProp): number {
    switch (p) {
        case 'melt': return e.meltingPoint === undefined ? 0 : clamp01((e.meltingPoint + 273) / 3700);
        case 'density': return e.estimated ? 0 : clamp01((e.density ?? 0) / 22.6);
        case 'age': return e.found.ancient ? 1 : clamp01((2016 - e.found.year) / 400);
        case 'crust': { const v = e.around.crust ?? 0; return v ? clamp01((Math.log10(v) + 2) / 3.7) : 0; }
    }
}

/** 118 cột đặt đúng lên ô DOM; mặt bảng ngả ra sau rồi cột mọc lên. Chạm cột → mở nguyên tố. */
export const CityScape: React.FC<{ rects: CellRects; prop: CityProp; tier: QualityTier; onPick: (e: ElementFull) => void }> = ({ rects, prop, tier, onPick }) => {
    const size = useThree(s => s.size);
    const inst = useRef<THREE.InstancedMesh>(null), pivot = useRef<THREE.Group>(null);
    const mat = useSurface(tier, { color: '#ffffff', metal: false, roughness: 0.35 });
    const t0 = useRef(performance.now());
    const cur = useRef(new Float32Array(119)), target = useRef(new Float32Array(119));
    useLayoutEffect(() => { ELEMENTS.forEach(e => { target.current[e.atomicNumber] = cityValue(e, prop); }); }, [prop]);
    useLayoutEffect(() => {
        const m = inst.current; if (!m) return;
        ELEMENTS.forEach((e, i) => m.setColorAt(i, new THREE.Color(CATEGORY_COLORS[e.category].color)));
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, []);
    const m4 = useMemo(() => new THREE.Matrix4(), []), v = useMemo(() => new THREE.Vector3(), []), c = useMemo(() => new THREE.Vector3(), []);
    const q = useMemo(() => new THREE.Quaternion(), []), s = useMemo(() => new THREE.Vector3(), []);
    useFrame((st, dt) => {
        const m = inst.current, g = pivot.current; if (!m || !g) return;
        const vp = { w: size.width, h: size.height }, k = worldPerPx(vp);
        const tilt = easeInOut((performance.now() - t0.current) / 1400);
        // tâm bảng (ô Fe ở giữa) làm trục ngả
        pxToWorld((rects.x[1] + rects.x[18]) / 2, (rects.y[1] + rects.y[103]) / 2, vp, c);
        g.position.copy(c); g.position.z = -3.2 * tilt; g.position.y += 0.4 * tilt;
        g.rotation.set(-0.85 * tilt, Math.sin(st.clock.elapsedTime * 0.2) * 0.12 * tilt, 0);
        ELEMENTS.forEach((e, i) => {
            const z = e.atomicNumber;
            cur.current[z] += (target.current[z] * tilt - cur.current[z]) * Math.min(1, dt * 3);
            pxToWorld(rects.x[z], rects.y[z], vp, v).sub(c);
            const w = rects.s[z] * k * 0.9, h = Math.max(0.02, cur.current[z] * 260 * k);
            m4.compose(v.set(v.x, v.y, h / 2), q.identity(), s.set(w, w, h));
            m.setMatrixAt(i, m4);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <group ref={pivot}>
            <instancedMesh ref={inst} args={[undefined, undefined, ELEMENTS.length]} material={mat}
                onClick={(ev) => { ev.stopPropagation(); if (ev.instanceId !== undefined) onPick(ELEMENTS[ev.instanceId]); }}>
                <boxGeometry args={[1, 1, 1]} />
            </instancedMesh>
        </group>
    );
};

// ---------------------------------------------------------------- bếp phân tử
export const MoleculeView: React.FC<{ recipe: Recipe | null; counts: Counts; tier: QualityTier }> = ({ recipe, counts, tier }) => {
    const size = useThree(s => s.size);
    const root = useRef<THREE.Group>(null);
    const mats = useMemo(() => Object.fromEntries(ATOMS.map(a => [a.id, tier === 'high'
        ? new THREE.MeshPhysicalMaterial({ color: a.color, roughness: 0.25, clearcoat: 0.8 })
        : new THREE.MeshStandardMaterial({ color: a.color, roughness: 0.3 })])), [tier]);
    const bond = useSurface(tier, { color: '#cbd5e1', metal: false, roughness: 0.4 });
    const loose = useMemo(() => {
        const R = rng(7), out: { a: string; p: THREE.Vector3 }[] = [];
        ATOMS.forEach(a => { for (let i = 0; i < (counts[a.id] ?? 0); i++) out.push({ a: a.id, p: new THREE.Vector3((R() - 0.5) * 3, (R() - 0.5) * 2, (R() - 0.5) * 1.5) }); });
        return out;
    }, [counts]);
    useFrame((st) => {
        const vp = { w: size.width, h: size.height }, f = stageFrame(vp), k = worldPerPx(vp);
        if (root.current) { pxToWorld(f.cx, f.cy, vp, root.current.position); root.current.scale.setScalar((f.size * k) / 3.4); root.current.rotation.y = st.clock.elapsedTime * 0.5; root.current.rotation.x = 0.25; }
    });
    const rad = (a: string) => 0.72 * (a === 'H' ? 0.32 : a === 'Na' ? 0.55 : a === 'Cl' ? 0.6 : 0.45);
    if (recipe?.ionic) {
        const cells: React.ReactNode[] = [];
        for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
            const na = (x + y + z) % 2 === 0;
            cells.push(<mesh key={`${x}${y}${z}`} material={mats[na ? 'Na' : 'Cl']} position={[x * 0.95, y * 0.95, z * 0.95]}><sphereGeometry args={[na ? 0.3 : 0.45, 24, 16]} /></mesh>);
        }
        return <group ref={root}>{cells}</group>;
    }
    if (recipe) {
        return (
            <group ref={root}>
                {recipe.atoms.map(([a, x, y, z], i) => <mesh key={i} material={mats[a]} position={[x * 1.2, y * 1.2, z * 1.2]}><sphereGeometry args={[rad(a), 32, 20]} /></mesh>)}
                {recipe.bonds.flatMap(([i, j, order]) => {
                    const A = new THREE.Vector3(...recipe.atoms[i].slice(1) as [number, number, number]).multiplyScalar(1.2);
                    const B = new THREE.Vector3(...recipe.atoms[j].slice(1) as [number, number, number]).multiplyScalar(1.2);
                    const mid = A.clone().add(B).multiplyScalar(0.5), dir = B.clone().sub(A), len = dir.length();
                    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
                    const side = new THREE.Vector3(0, 0, 1).cross(dir).normalize().multiplyScalar(0.12);
                    return Array.from({ length: order }, (_, o) => {
                        const off = side.clone().multiplyScalar(o - (order - 1) / 2);
                        return <mesh key={`${i}-${j}-${o}`} material={bond} position={mid.clone().add(off)} quaternion={quat}><cylinderGeometry args={[0.07, 0.07, len, 12]} /></mesh>;
                    });
                })}
            </group>
        );
    }
    return (
        <group ref={root}>
            {loose.map((l, i) => <mesh key={i} material={mats[l.a]} position={l.p}><sphereGeometry args={[rad(l.a), 24, 16]} /></mesh>)}
        </group>
    );
};
