import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createRandom } from '../noise';
import { colorize, merge } from '../geo';

// Lục lạp đơn vị (trục x dài 2, dẹt theo y): vỏ kép trong như thạch xanh, bên trong là các chồng
// grana (đĩa thylakoid xếp như chồng đồng xu) nối với nhau bằng phiến mỏng — nhìn xuyên vỏ thấy rõ.
let geoCache: { envelope: THREE.BufferGeometry; grana: THREE.BufferGeometry } | null = null;

function chloroplastGeometry() {
    if (geoCache) return geoCache;
    const envelope = new THREE.SphereGeometry(1, 36, 24).scale(1, 0.46, 0.68);
    const rand = createRandom('chloroplast-grana');
    const parts: THREE.BufferGeometry[] = [];
    const stacks: [number, number][] = [[-0.62, 0.05], [-0.25, -0.18], [0.12, 0.16], [0.5, -0.08], [-0.05, 0.36], [0.28, -0.38]];
    for (const [x, z] of stacks) {
        const n = 5 + Math.floor(rand() * 3);
        const r = 0.15 + rand() * 0.04;
        for (let k = 0; k < n; k++) {
            const y = (k - (n - 1) / 2) * 0.052;
            parts.push(colorize(new THREE.CylinderGeometry(r, r, 0.034, 18, 1).translate(x, y, z), k % 2 ? '#15803d' : '#16a34a'));
        }
    }
    // phiến stroma nối các chồng grana
    for (let i = 0; i < stacks.length - 1; i++) {
        const [x0, z0] = stacks[i], [x1, z1] = stacks[i + 1];
        const len = Math.hypot(x1 - x0, z1 - z0);
        const g = new THREE.BoxGeometry(len, 0.012, 0.07);
        g.rotateY(-Math.atan2(z1 - z0, x1 - x0));
        g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
        parts.push(colorize(g, '#4ade80'));
    }
    const grana = merge(parts, ['position', 'normal', 'color']);
    geoCache = { envelope, grana };
    return geoCache;
}

export interface StreamPath {
    // vòng dòng chảy tế bào chất quanh không bào: elip trong mặt phẳng nghiêng
    center: THREE.Vector3;
    radii: [number, number];
    normal: THREE.Vector3;
    speed: number; // rad/s
}

interface ChloroplastsProps {
    count: number;
    paths: StreamPath[];
    scale: [number, number];
    color: string;
    seed: string;
}

// Lục lạp trôi theo dòng tế bào chất quanh không bào (hiện tượng có thật, soi lá rong dưới kính
// hiển vi thấy rõ) — vừa "sống", vừa dạy điều sách hay nói: tế bào chất luôn chuyển động.
export const Chloroplasts: React.FC<ChloroplastsProps> = ({ count, paths, scale, color, seed }) => {
    const { tier, clock } = useCellCtx();
    const focus = useFocus('chloroplast');
    const handlers = useSelectHandlers('chloroplast');
    const { envelope, grana } = chloroplastGeometry();
    const fx = useMemo(() => createFx('#dcfce7'), []);
    const envMat = useMemo(() => createOrganicMaterial({
        color, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.5, sheenColor: '#bbf7d0',
        emissive: '#15803d', emissiveIntensity: 0.2, jelly: { center: 0.3, edge: 0.96, power: 1.9 }, fx
    }, tier).material, [color, tier, fx]);
    const granaMat = useMemo(() => createOrganicMaterial({
        color: '#ffffff', vertexColors: true, roughness: 0.45, clearcoat: 0.4,
        emissive: '#22c55e', emissiveIntensity: 0.5, fx
    }, tier).material, [tier, fx]);

    useDisposable(envMat, granaMat);

    const items = useMemo(() => {
        const rand = createRandom(`${seed}-chloro`);
        return Array.from({ length: count }, (_, i) => ({
            path: i % paths.length,
            phase: (i / count) * Math.PI * 2 * (paths.length) + rand() * 0.25,
            lift: (rand() - 0.5) * 0.28,
            scale: scale[0] + rand() * (scale[1] - scale[0]),
            spin: rand() * Math.PI * 2,
            tumble: 0.2 + rand() * 0.3
        }));
    }, [count, paths, scale, seed]);

    const bases = useMemo(() => paths.map((p) => {
        const n = p.normal.clone().normalize();
        const u = new THREE.Vector3().crossVectors(n, Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
        const v = new THREE.Vector3().crossVectors(n, u);
        return { n, u, v };
    }), [paths]);

    const aRef = useRef<THREE.InstancedMesh>(null);
    const bRef = useRef<THREE.InstancedMesh>(null);
    const anchor = useRef<THREE.Object3D>(null);
    const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), p: new THREE.Vector3(), t: new THREE.Vector3(), s: new THREE.Vector3(), x: new THREE.Vector3(1, 0, 0) }), []);
    useRegister('chloroplast', anchor, scale[1] * 1.4);
    const localT = useRef(0);

    const update = (time: number) => {
        const a = aRef.current, b = bRef.current;
        if (!a || !b) return;
        items.forEach((it, i) => {
            const path = paths[it.path];
            const { n, u, v } = bases[it.path];
            const ang = it.phase + time * path.speed;
            const [ra, rb] = path.radii;
            tmp.p.copy(path.center).addScaledVector(u, Math.cos(ang) * ra).addScaledVector(v, Math.sin(ang) * rb).addScaledVector(n, it.lift);
            // hướng trục dài theo tiếp tuyến dòng chảy, mặt dẹt quay về phía tâm (đón sáng)
            tmp.t.copy(u).multiplyScalar(-Math.sin(ang) * ra).addScaledVector(v, Math.cos(ang) * rb).normalize();
            tmp.q.setFromUnitVectors(tmp.x, tmp.t);
            tmp.q2.setFromAxisAngle(tmp.x, it.spin + Math.sin(time * it.tumble) * 0.4);
            tmp.q.multiply(tmp.q2);
            tmp.s.setScalar(it.scale);
            tmp.m.compose(tmp.p, tmp.q, tmp.s);
            a.setMatrixAt(i, tmp.m);
            b.setMatrixAt(i, tmp.m);
            if (i === 0 && anchor.current) anchor.current.position.copy(tmp.p);
        });
        a.instanceMatrix.needsUpdate = true;
        b.instanceMatrix.needsUpdate = true;
    };

    useEffect(() => {
        update(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    useFrame((state, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.35 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.6)) : 0);
        if (focus === 'this') return;
        localT.current += Math.min(delta, 0.1) * clock.timeScale;
        update(localT.current);
    });

    return (
        <group>
            <object3D ref={anchor} />
            <instancedMesh ref={bRef} args={[grana, granaMat, items.length]} raycast={() => null} frustumCulled={false} />
            <instancedMesh ref={aRef} args={[envelope, envMat, items.length]} {...handlers} frustumCulled={false} renderOrder={2} />
        </group>
    );
};
