import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createRandom } from '../noise';
import { getRibosomeGeometry } from './shared';

interface RibosomesProps {
    points: THREE.Vector3[];
    labelIndex: number;
    color: string;
    size: number;
    seed: string;
}

// Ribôxôm tự do: hàng trăm "người tuyết" tí hon lấp lánh trong tế bào chất (1 draw call)
export const Ribosomes: React.FC<RibosomesProps> = ({ points, labelIndex, color, size, seed }) => {
    const { tier } = useCellCtx();
    const focus = useFocus('ribosome');
    const handlers = useSelectHandlers('ribosome');
    const fx = useMemo(() => createFx('#faf5ff'), []);
    const mat = useMemo(() => createOrganicMaterial({
        color, vertexColors: true, roughness: 0.4, clearcoat: 0.3, emissive: color, emissiveIntensity: 0.6, fx
    }, tier).material, [color, tier, fx]);
    useDisposable(mat);
    const ref = useRef<THREE.InstancedMesh>(null);
    const anchor = useRef<THREE.Object3D>(null);
    useRegister('ribosome', anchor, size * 6);

    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const rand = createRandom(`${seed}-ribo-rot`);
        const mat4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        points.forEach((p, i) => {
            q.setFromEuler(new THREE.Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28));
            const s = size * (0.8 + rand() * 0.4);
            mat4.compose(p, q, new THREE.Vector3(s, s, s));
            m.setMatrixAt(i, mat4);
        });
        m.instanceMatrix.needsUpdate = true;
        m.computeBoundingSphere();
        anchor.current?.position.copy(points[labelIndex] ?? new THREE.Vector3());
    }, [points, labelIndex, size, seed]);

    useFrame((state, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.45 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4)) : 0);
    });

    return (
        <group>
            <object3D ref={anchor} />
            <instancedMesh ref={ref} args={[getRibosomeGeometry(), mat, points.length]} {...handlers} />
        </group>
    );
};
