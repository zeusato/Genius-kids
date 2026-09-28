import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createRandom } from '../noise';
import { colorize, merge } from '../geo';
import { driftOffset } from './shared';

let contentGeo: THREE.BufferGeometry | null = null;

// Hạt enzyme tiêu hóa lơ lửng bên trong túi
function enzymeGeometry(): THREE.BufferGeometry {
    if (contentGeo) return contentGeo;
    const rand = createRandom('lysosome-enzymes');
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 7; i++) {
        const r = 0.13 + rand() * 0.1;
        const d = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(rand() * 0.5);
        parts.push(colorize(new THREE.IcosahedronGeometry(r, 1).translate(d.x, d.y, d.z), i % 2 ? '#bfdbfe' : '#e0f2fe'));
    }
    contentGeo = merge(parts, ['position', 'normal', 'color']);
    return contentGeo;
}

const shellGeo = new THREE.SphereGeometry(1, 28, 20);

export interface BlobSpot {
    position: THREE.Vector3;
    scale: number;
    phase: number;
}

interface LysosomesProps {
    id?: string;
    spots: BlobSpot[];
    labelIndex: number;
    color: string;
    glow: string;
}

// Tiêu thể: túi tròn trong như thạch xanh, bên trong lấp lánh hạt enzyme tiêu hóa
export const Lysosomes: React.FC<LysosomesProps> = ({ id = 'lysosome', spots, labelIndex, color, glow }) => {
    const { tier, clock } = useCellCtx();
    const focus = useFocus(id);
    const handlers = useSelectHandlers(id);
    const fx = useMemo(() => createFx('#e0f2fe'), []);
    const outerMat = useMemo(() => createOrganicMaterial({
        color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: '#dbeafe',
        emissive: glow, emissiveIntensity: 0.25, jelly: { center: 0.3, edge: 0.95 }, fx,
        wobble: { amp: 0.035, freq: 2.2, speed: 1.1 }
    }, tier).material, [color, glow, tier, fx]);
    const innerMat = useMemo(() => createOrganicMaterial({
        color: '#ffffff', vertexColors: true, roughness: 0.4, emissive: glow, emissiveIntensity: 0.7, fx
    }, tier).material, [glow, tier, fx]);

    useDisposable(outerMat, innerMat);

    const aRef = useRef<THREE.InstancedMesh>(null);
    const bRef = useRef<THREE.InstancedMesh>(null);
    const anchor = useRef<THREE.Object3D>(null);
    useRegister(id, anchor, (spots[labelIndex]?.scale ?? 0.12) * 1.6);
    const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), o: new THREE.Vector3(), e: new THREE.Euler() }), []);
    const localT = useRef(0);

    const update = (t: number) => {
        const a = aRef.current, b = bRef.current;
        if (!a || !b) return;
        spots.forEach((s, i) => {
            driftOffset(tmp.o, t, s.phase, 0.08);
            tmp.p.copy(s.position).add(tmp.o);
            tmp.e.set(t * 0.2 + s.phase, t * 0.15, 0);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spots]);

    useFrame((state, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.3 * Math.sin(state.clock.elapsedTime * 3) : 0);
        if (focus === 'this') return;
        localT.current += Math.min(delta, 0.1) * clock.timeScale;
        update(localT.current);
    });

    return (
        <group>
            <object3D ref={anchor} />
            <instancedMesh ref={bRef} args={[enzymeGeometry(), innerMat, spots.length]} raycast={() => null} frustumCulled={false} />
            <instancedMesh ref={aRef} args={[shellGeo, outerMat, spots.length]} {...handlers} frustumCulled={false} renderOrder={2} />
        </group>
    );
};
