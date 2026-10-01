// A readable Bohr schematic: one thin ring per shell, with evenly spaced electrons.
// Each shell slowly changes its plane independently; its electrons and trails inherit that rotation.
// Radii and angular speeds are illustrative, not physical orbital trajectories.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSurface } from './common';
import { prefersReducedMotion, type QualityTier } from './params';

function Shell({ count, index, total, tier }: { count: number; index: number; total: number; tier: QualityTier }) {
    const outer = index === total - 1;
    // Keep even the one-shell elements large enough to explore on a phone.
    const radius = total === 1 ? 0.78 : 0.34 + index * 0.64 / (total - 1);
    const size = outer ? 0.029 : 0.023;
    const electrons = useRef<THREE.InstancedMesh>(null);
    const plane = useRef<THREE.Group>(null);
    const trail = useRef<THREE.InstancedMesh>(null);
    const clock = useRef(0);
    const reducedMotion = useMemo(prefersReducedMotion, []);
    const matrix = useMemo(() => new THREE.Matrix4(), []);
    const material = useSurface(tier, {
        color: outer ? '#fde047' : '#6ee7b7', metal: false, roughness: 0.25,
        emissive: outer ? '#eab308' : '#10b981', emissiveIntensity: 0.22,
    });
    const segments = tier === 'high' ? 128 : 80;
    const trailSteps = tier === 'high' ? 9 : 5;
    const speed = 0.48 / Math.pow(index + 1, 0.55);
    const orient = (time: number) => {
        if (!plane.current) return;
        const direction = index % 2 ? -1 : 1;
        plane.current.rotation.set(
            index * 0.32 + direction * time * (0.13 + index * 0.025),
            index * -0.24 + time * (0.09 + index * 0.018),
            Math.sin(time * 0.12 + index * 0.6) * 0.18,
        );
    };
    const place = (time: number) => {
        const mesh = electrons.current;
        if (!mesh) return;
        for (let i = 0; i < count; i++) {
            const angle = i * Math.PI * 2 / count + index * 0.7 + time * speed;
            matrix.makeTranslation(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
            mesh.setMatrixAt(i, matrix);
            if (trail.current) for (let j = 0; j < trailSteps; j++) {
                const behind = angle - (j + 1) * Math.min(0.018, 0.5 / count);
                const dotSize = size * 0.45 * (1 - j / trailSteps);
                matrix.makeScale(dotSize, dotSize, dotSize);
                matrix.setPosition(Math.cos(behind) * radius, Math.sin(behind) * radius, 0);
                trail.current.setMatrixAt(i * trailSteps + j, matrix);
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (trail.current) trail.current.instanceMatrix.needsUpdate = true;
    };
    useLayoutEffect(() => { place(clock.current); orient(clock.current); });
    useFrame((_, dt) => {
        if (reducedMotion) return;
        clock.current += Math.min(dt, 0.05);
        place(clock.current);
        orient(clock.current);
    });
    return (
        <group ref={plane}>
            <mesh>
                <torusGeometry args={[radius, outer ? 0.0028 : 0.002, 6, segments]} />
                <meshBasicMaterial color={outer ? '#e9cc6b' : '#94c5d5'} transparent opacity={outer ? 0.6 : 0.32} depthWrite={false} />
            </mesh>
            {!reducedMotion && <instancedMesh key={`trail-${count}-${trailSteps}`} ref={trail} args={[undefined, undefined, count * trailSteps]} frustumCulled={false}>
                <sphereGeometry args={[1, 6, 4]} />
                <meshBasicMaterial color={outer ? '#fde047' : '#6ee7b7'} transparent opacity={0.32} depthWrite={false} />
            </instancedMesh>}
            <instancedMesh key={count} ref={electrons} args={[undefined, undefined, count]} material={material} frustumCulled={false}>
                <sphereGeometry args={[size, tier === 'high' ? 20 : 12, 12]} />
            </instancedMesh>
        </group>
    );
}

export function BohrShells({ shells, tier }: { shells: number[]; tier: QualityTier }) {
    return <group>{shells.map((count, index) => <Shell key={index} count={count} index={index} total={shells.length} tier={tier} />)}</group>;
}
