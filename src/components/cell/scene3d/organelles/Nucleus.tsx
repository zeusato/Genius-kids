import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createCutUniforms, createWaves, ShellState } from '../shell';
import { ShellLayer, ShellLayerSpec, useCutWindow } from '../ShellLayer';
import { createNoise3, createRandom, fbm3, fibonacciSphere, Vec3 } from '../noise';
import { colorize, merge, randomWalkInSphere, tubeThrough } from '../geo';
import { nuclearPoreGeometry } from './shared';

interface NucleusProps {
    id?: string;
    center: Vec3;
    radius: number;
    color: string;
    seed: string;
    pores?: number;
    strands?: number;
}

// Nhân: màng kép (thấy rõ trên mặt cắt) có hàng trăm lỗ nhân, bên trong là chất nhiễm sắc rối như
// cuộn len phát sáng và nhân con sần sùi. Cửa sổ riêng của nhân luôn hé mở về phía camera (kiểu mô
// hình "búp bê Nga": cắt tế bào thấy nhân, cắt nhân thấy ADN); được chọn thì mở rộng hơn.
export const Nucleus: React.FC<NucleusProps> = ({ id = 'nucleus', center, radius: R, color, seed, pores = 140, strands = 6 }) => {
    const ctx = useCellCtx();
    const { tier, registry, onSelect, interactive } = ctx;
    const focus = useFocus(id);
    const handlers = useSelectHandlers(id);
    const groupRef = useRef<THREE.Group>(null);

    const cut = useMemo(() => createCutUniforms([R, R, R]), [R]);
    const openTarget = useRef(0.62);
    openTarget.current = focus === 'this' ? 1.05 : 0.6;
    useCutWindow(cut, groupRef, openTarget);

    const spec = useMemo<ShellLayerSpec>(() => {
        const state: ShellState = {
            shape: { half: [R, R * 0.965, R * 0.985], exp: 2 },
            waves: createWaves(`${seed}-envelope`, { freq: 2.4, speed: 0.22 }),
            amp: 0.012,
            pinch: 0,
            pinchWidth: 0.3
        };
        const rand = createRandom(`${seed}-pores`);
        return {
            id,
            state,
            thickness: R * 0.075,
            outer: {
                physical: true,
                color,
                roughness: 0.3,
                clearcoat: 1,
                clearcoatRoughness: 0.18,
                sheen: 0.7,
                sheenColor: '#f5d0fe',
                emissive: color,
                emissiveIntensity: 0.1
            },
            inner: { color: '#3b0764', roughness: 0.75, emissive: '#6b21a8', emissiveIntensity: 0.3, clearcoat: 0 },
            band: { mode: 'double', a: '#e9d5ff', b: '#fbcfe8', c: '#4c1d95' },
            cutGlow: { color: '#f0abfc', strength: 0.55 },
            highlight: '#f5d0fe',
            proteins: [{
                geometry: nuclearPoreGeometry('#f5d0fe', '#a855f7'),
                dirs: fibonacciSphere(tier === 'high' ? pores : Math.round(pores * 0.55), 0.8, rand),
                lift: 0,
                scale: () => R * 0.05,
                material: { roughness: 0.35, emissive: '#e879f9', emissiveIntensity: 0.25 }
            }]
        };
    }, [R, color, seed, id, pores, tier]);

    // Chất nhiễm sắc: vài sợi đi bộ ngẫu nhiên, mỗi sợi một tông hồng/tím, gộp 1 draw call
    const chromatin = useMemo(() => {
        const rand = createRandom(`${seed}-chromatin`);
        const noise = createNoise3(`${seed}-chromatin`);
        const palette = ['#f0abfc', '#f9a8d4', '#c4b5fd', '#e879f9', '#fbcfe8'];
        const parts: THREE.BufferGeometry[] = [];
        const n = tier === 'high' ? strands : Math.max(3, strands - 2);
        for (let i = 0; i < n; i++) {
            const start = new THREE.Vector3((rand() - 0.5), (rand() - 0.5), (rand() - 0.5)).multiplyScalar(R * 0.9);
            const pts = randomWalkInSphere(rand, noise, start, 64, R * 0.055, new THREE.Vector3(), R * 0.72, i * 3.1);
            parts.push(colorize(tubeThrough(pts, R * 0.017, tier === 'high' ? 200 : 110, tier === 'high' ? 5 : 4), palette[i % palette.length]));
        }
        return merge(parts, ['position', 'normal', 'color']);
    }, [R, seed, strands, tier]);

    // Nhân con: cầu sần sùi (nhiễu tĩnh nướng sẵn)
    const nucleolus = useMemo(() => {
        const g = new THREE.SphereGeometry(1, 40, 28);
        const noise = createNoise3(`${seed}-nucleolus`);
        const p = g.attributes.position as THREE.BufferAttribute;
        const v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i);
            const k = 1 + 0.2 * fbm3(noise, v.x * 2.2, v.y * 2.2, v.z * 2.2, 3);
            p.setXYZ(i, v.x * k, v.y * k, v.z * k);
        }
        g.computeVertexNormals();
        return g;
    }, [seed]);

    const innerFx = useMemo(() => createFx('#fdf4ff'), []);
    const chromatinMat = useMemo(() => createOrganicMaterial({
        color: '#ffffff', vertexColors: true, roughness: 0.4, clearcoat: 0.4,
        emissive: '#d946ef', emissiveIntensity: 0.55, fx: innerFx
    }, tier).material, [tier, innerFx]);
    const nucleolusMat = useMemo(() => createOrganicMaterial({
        color: '#7e22ce', roughness: 0.55, clearcoat: 0.5, sheen: 0.5, sheenColor: '#e9d5ff',
        emissive: '#a21caf', emissiveIntensity: 0.35, fx: innerFx
    }, tier).material, [tier, innerFx]);

    useDisposable(chromatin, nucleolus, chromatinMat, nucleolusMat);

    useFrame((state, delta) => {
        dampFx(innerFx, focus, delta, focus === 'this' ? 0.25 * Math.sin(state.clock.elapsedTime * 2.2) : 0);
    });

    return (
        <group ref={groupRef} position={center}>
            <ShellLayer
                spec={spec}
                cut={cut}
                tier={tier}
                focus={focus}
                segments={tier === 'high' ? [72, 54] : [48, 36]}
                onSelect={onSelect}
                registry={registry}
                interiorId={id}
                anchorDir={[0.15, 1, 0.35]}
                registerAs="body"
                interactive={interactive}
            />
            <mesh geometry={chromatin} material={chromatinMat} {...handlers} />
            <mesh geometry={nucleolus} material={nucleolusMat} position={[R * 0.22, R * 0.14, -R * 0.12]} scale={R * 0.28} {...handlers} />
        </group>
    );
};
