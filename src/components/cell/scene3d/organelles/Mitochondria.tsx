import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createRandom, Vec3 } from '../noise';
import { merge } from '../geo';
import { driftOffset } from './shared';

// Hình một ty thể đơn vị (trục x, dài ~2.5, bán kính 0.5): vỏ ngoài trong như thạch + các mào
// (cristae) gợn sóng phát sáng bên trong — nhìn xuyên vỏ thấy "lò năng lượng" đang đỏ lửa.
const HALF_LEN = 0.75; // nửa đoạn trụ giữa

function profileRadius(x: number): number {
    const ax = Math.abs(x);
    if (ax <= HALF_LEN) return 0.5;
    const d = ax - HALF_LEN;
    return Math.sqrt(Math.max(0, 0.25 - d * d));
}

function bendY(x: number): number {
    return 0.16 * (x / 1.25) * (x / 1.25) - 0.08;
}

let geoCache: { outer: THREE.BufferGeometry; cristae: THREE.BufferGeometry } | null = null;

function mitoGeometry() {
    if (geoCache) return geoCache;
    const outer = new THREE.CapsuleGeometry(0.5, HALF_LEN * 2, 8, 24).rotateZ(Math.PI / 2);
    const bend = (g: THREE.BufferGeometry) => {
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + bendY(p.getX(i)));
        g.computeVertexNormals();
    };
    bend(outer);
    const plates: THREE.BufferGeometry[] = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
        const x = -0.98 + (i / (n - 1)) * 1.96;
        const r = Math.max(0.12, profileRadius(x) * 0.86 - 0.07);
        const g = new THREE.CylinderGeometry(r, r, 0.055, 26, 1).rotateZ(Math.PI / 2);
        const side = i % 2 ? 1 : -1;
        g.translate(x, side * 0.085, 0);
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < p.count; k++) {
            // mào gợn sóng như nếp gấp của rèm cửa
            p.setX(k, p.getX(k) + 0.03 * Math.sin(p.getY(k) * 15 + i) + 0.02 * Math.sin(p.getZ(k) * 11));
        }
        plates.push(g);
    }
    const cristae = merge(plates);
    bend(cristae);
    geoCache = { outer, cristae };
    return geoCache;
}

export interface MitoSpot {
    position: THREE.Vector3;
    scale: number;
    rotation: THREE.Euler;
    phase: number;
}

export function makeMitoSpots(points: THREE.Vector3[], seed: string, scale: [number, number]): MitoSpot[] {
    const rand = createRandom(`${seed}-mito-rot`);
    return points.map((position) => ({
        position,
        scale: scale[0] + rand() * (scale[1] - scale[0]),
        rotation: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
        phase: rand() * Math.PI * 2
    }));
}

interface MitochondriaProps {
    spots: MitoSpot[];
    labelIndex: number;
    color: string;
    drift?: number;
}

export const Mitochondria: React.FC<MitochondriaProps> = ({ spots, labelIndex, color, drift = 0.07 }) => {
    const { tier, clock } = useCellCtx();
    const focus = useFocus('mitochondria');
    const handlers = useSelectHandlers('mitochondria');
    const { outer, cristae } = mitoGeometry();
    const fx = useMemo(() => createFx('#fee2e2'), []);
    const outerMat = useMemo(() => createOrganicMaterial({
        color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.5, sheenColor: '#fecaca',
        emissive: '#991b1b', emissiveIntensity: 0.18, jelly: { center: 0.32, edge: 0.97, power: 1.8 }, fx
    }, tier).material, [color, tier, fx]);
    const cristaeMat = useMemo(() => createOrganicMaterial({
        color: '#fdba74', roughness: 0.45, clearcoat: 0.3, emissive: '#f97316', emissiveIntensity: 0.65, fx,
        wobble: { amp: 0.015, freq: 3, speed: 1.2 }
    }, tier).material, [tier, fx]);

    useDisposable(outerMat, cristaeMat);

    const outerRef = useRef<THREE.InstancedMesh>(null);
    const crRef = useRef<THREE.InstancedMesh>(null);
    const anchor = useRef<THREE.Object3D>(null);
    const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3(), o: new THREE.Vector3() }), []);
    useRegister('mitochondria', anchor, (spots[labelIndex]?.scale ?? 0.2) * 1.4);

    // Đồng hồ riêng: đứng yên khi đang được chọn (camera nhìn cận), bỏ chọn thì trôi tiếp từ chỗ cũ
    const localT = useRef(0);

    const update = (t: number) => {
        const a = outerRef.current, b = crRef.current;
        if (!a || !b) return;
        spots.forEach((s, i) => {
            driftOffset(tmp.o, t, s.phase, drift);
            tmp.p.copy(s.position).add(tmp.o);
            tmp.e.set(s.rotation.x + Math.sin(t * 0.13 + s.phase) * 0.25, s.rotation.y + t * 0.03, s.rotation.z);
            tmp.q.setFromEuler(tmp.e);
            tmp.s.setScalar(s.scale);
            tmp.m.compose(tmp.p, tmp.q, tmp.s);
            a.setMatrixAt(i, tmp.m);
            b.setMatrixAt(i, tmp.m);
            if (i === labelIndex && anchor.current) anchor.current.position.copy(tmp.p);
        });
        a.instanceMatrix.needsUpdate = true;
        b.instanceMatrix.needsUpdate = true;
    };

    useEffect(() => {
        update(0);
        outerRef.current?.computeBoundingSphere();
        crRef.current?.computeBoundingSphere();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spots]);

    useFrame((state, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.35 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3.1)) : 0);
        if (focus === 'this') return;
        localT.current += Math.min(delta, 0.1) * clock.timeScale;
        update(localT.current);
    });

    return (
        <group>
            <object3D ref={anchor} />
            <instancedMesh ref={crRef} args={[cristae, cristaeMat, spots.length]} raycast={() => null} frustumCulled={false} />
            <instancedMesh ref={outerRef} args={[outer, outerMat, spots.length]} {...handlers} frustumCulled={false} renderOrder={2} />
        </group>
    );
};
