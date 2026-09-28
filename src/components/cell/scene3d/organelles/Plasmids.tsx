import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { Vec3 } from '../noise';

// Plasmid: vòng ADN nhỏ xoắn siêu cấp (torus knot 2-5 trông như chiếc nhẫn vặn xoắn)
const knot = new THREE.TorusKnotGeometry(0.1, 0.014, 90, 6, 2, 5);

interface PlasmidsProps {
    positions: Vec3[];
    color: string;
    scale?: number;
    registerId?: string | null;
}

export const Plasmids: React.FC<PlasmidsProps> = ({ positions, color, scale = 1, registerId = 'plasmid' }) => {
    const { tier, clock } = useCellCtx();
    const focus = useFocus('plasmid');
    const handlers = useSelectHandlers('plasmid');
    const fx = useMemo(() => createFx('#fffbeb'), []);
    const mat = useMemo(() => createOrganicMaterial({
        color, roughness: 0.3, clearcoat: 0.8, emissive: '#fbbf24', emissiveIntensity: 0.65, fx
    }, tier).material, [color, tier, fx]);
    useDisposable(mat);
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const anchor = useRef<THREE.Object3D>(null);
    useRegister(registerId, anchor, 0.2 * scale);

    useFrame((s, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.3 * Math.sin(s.clock.elapsedTime * 3) : 0);
        const dt = Math.min(delta, 0.1) * clock.timeScale;
        refs.current.forEach((m, i) => {
            if (!m) return;
            m.rotation.x += dt * (0.4 + i * 0.13);
            m.rotation.y += dt * (0.3 + i * 0.07);
        });
    });

    return (
        <group>
            <object3D ref={anchor} position={positions[0]} />
            {positions.map((p, i) => (
                <group key={i} position={p}>
                    <mesh ref={(m) => { refs.current[i] = m; }} geometry={knot} material={mat} scale={scale} {...handlers} />
                    <mesh visible={false} scale={0.2 * scale} {...handlers}>
                        <sphereGeometry args={[1, 10, 8]} />
                        <meshBasicMaterial side={THREE.BackSide} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};
