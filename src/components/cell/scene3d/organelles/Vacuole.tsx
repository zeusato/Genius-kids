import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createShellUniforms, createWaves, ShellState, shellPoint, syncShellUniforms } from '../shell';
import { bakedShell, unitSphere } from '../geo';
import { Vec3 } from '../noise';

interface VacuoleProps {
    center: Vec3;
    half: [number, number, number];
    exp: number;
    color: string;
    seed: string;
    water: { value: number }; // 0 = khô héo, 1 = căng nước (thí nghiệm tưới cây)
}

// Không bào trung tâm: túi nước khổng lồ trong veo, màng không bào óng ánh, vân nắng lăn tăn như
// đáy bể bơi. Kích thước theo lượng nước (thí nghiệm "Tưới nước").
export const Vacuole: React.FC<VacuoleProps> = ({ center, half, exp, color, seed, water }) => {
    const { tier } = useCellCtx();
    const focus = useFocus('vacuole');
    const handlers = useSelectHandlers('vacuole');
    const state = useMemo<ShellState>(() => ({
        shape: { half: [...half], exp },
        waves: createWaves(`${seed}-vacuole`, { freq: 1.6, speed: 0.35 }),
        amp: 0.018,
        pinch: 0,
        pinchWidth: 0.3
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [seed]);
    const uniforms = useMemo(() => createShellUniforms(state), [state]);
    const fx = useMemo(() => createFx('#e0f2fe'), []);
    const mat = useMemo(() => createOrganicMaterial({
        physical: true, color, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.7, iridescenceIOR: 1.33,
        iridescenceThicknessRange: [200, 600], emissive: '#0369a1', emissiveIntensity: 0.18,
        jelly: { center: 0.1, edge: 0.72, power: 2.6 }, shell: uniforms, fx,
        surface: { mode: 'water', scale: 3.2, color2: '#bae6fd', strength: 0.55 }
    }, tier).material, [color, tier, uniforms, fx]);
    const proxy = useMemo(() => bakedShell({ half, exp }), [half, exp]);
    useDisposable(mat, proxy);
    const groupRef = useRef<THREE.Group>(null);
    const anchor = useRef<THREE.Object3D>(null);
    useRegister('vacuole', groupRef, Math.max(...half) * 0.75, anchor);

    useFrame((s, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.25 * Math.sin(s.clock.elapsedTime * 2) : 0);
        // khô: túi teo lại & nhăn nheo; đủ nước: căng tròn
        const w = water.value;
        const k = 0.52 + 0.48 * w;
        state.shape.half[0] = half[0] * k;
        state.shape.half[1] = half[1] * (0.6 + 0.4 * w);
        state.shape.half[2] = half[2] * k;
        state.amp = 0.018 + (1 - w) * 0.05;
        syncShellUniforms(uniforms, state);
        if (groupRef.current) groupRef.current.scale.setScalar(1);
        if (anchor.current) shellPoint(anchor.current.position, new THREE.Vector3(0.35, 0.85, 0.4).normalize(), state, 0);
    });

    return (
        <group ref={groupRef} position={center}>
            <object3D ref={anchor} />
            <mesh geometry={unitSphere(tier === 'high' ? 80 : 48, tier === 'high' ? 60 : 36)} material={mat} frustumCulled={false} raycast={() => null} renderOrder={3} />
            <mesh geometry={proxy} visible={false} {...handlers} />
        </group>
    );
};
