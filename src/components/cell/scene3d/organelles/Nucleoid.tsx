import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createNoise3, createRandom, Vec3 } from '../noise';
import { colorize, merge } from '../geo';

interface NucleoidProps {
    center: Vec3;
    half: [number, number, number]; // vùng chứa ADN (elip)
    color: string;
    seed: string;
    registerId?: string | null; // null = bản sao lúc nhân đôi (không đăng ký nhãn/camera)
}

// Vùng nhân: MỘT phân tử ADN vòng rất dài cuộn rối (không có màng bao) + quầng mờ đánh dấu vùng.
// Vòng khép kín thật (CatmullRom closed) — đúng đặc điểm ADN vi khuẩn.
export const Nucleoid: React.FC<NucleoidProps> = ({ center, half, color, seed, registerId = 'nucleoid' }) => {
    const { tier } = useCellCtx();
    const high = tier === 'high';
    const focus = useFocus('nucleoid');
    const handlers = useSelectHandlers('nucleoid');
    const geo = useMemo(() => {
        const rand = createRandom(`${seed}-dna`);
        const noise = createNoise3(`${seed}-dna`);
        const pts: THREE.Vector3[] = [];
        const n = high ? 190 : 120;
        // đường vòng lớn quanh trục x + nhiễu mạnh → cuộn chỉ rối nhưng vẫn khép kín
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const wind = a * 9;
            const x = Math.cos(a) * 0.82 + noise(Math.cos(a) * 2, Math.sin(a) * 2, 0.5) * 0.35;
            const y = Math.sin(wind) * 0.62 + noise(Math.sin(a) * 2.3, 1.7, Math.cos(a) * 2.3) * 0.45;
            const z = Math.cos(wind * 0.9 + 1.2) * 0.62 + noise(3.1, Math.cos(a) * 2.1, Math.sin(a) * 2.1) * 0.45;
            pts.push(new THREE.Vector3(x * half[0], y * half[1], z * half[2]));
        }
        void rand;
        const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
        const tube = colorize(new THREE.TubeGeometry(curve, high ? 900 : 520, 0.021, high ? 5 : 4, true), color);
        return merge([tube], ['position', 'normal', 'color']);
    }, [seed, half, color, high]);

    const fx = useMemo(() => createFx('#fef3c7'), []);
    const dnaMat = useMemo(() => createOrganicMaterial({
        color: '#ffffff', vertexColors: true, roughness: 0.35, clearcoat: 0.6,
        emissive: '#f59e0b', emissiveIntensity: 0.55, fx
    }, tier).material, [tier, fx]);
    const cloudMat = useMemo(() => createOrganicMaterial({
        color: '#fcd34d', roughness: 0.4, emissive: '#f59e0b', emissiveIntensity: 0.25,
        jelly: { center: 0.04, edge: 0.22, power: 2.5 }, fx
    }, tier).material, [tier, fx]);

    useDisposable(geo, dnaMat, cloudMat);

    const group = useRef<THREE.Group>(null);
    const anchor = useRef<THREE.Object3D>(null);
    useRegister(registerId, group, Math.max(...half) * 0.85, anchor);

    useFrame((s, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.3 * Math.sin(s.clock.elapsedTime * 2.5) : 0);
        // ADN "thở" và xoay rất chậm — vật chất di truyền không đứng yên
        if (group.current && focus !== 'this') group.current.rotation.x += delta * 0.05;
    });

    return (
        <group position={center}>
            <object3D ref={anchor} position={[0.2, half[1] + 0.12, 0.1]} />
            <group ref={group}>
                <mesh geometry={geo} material={dnaMat} {...handlers} />
            </group>
            <mesh material={cloudMat} scale={[half[0] * 1.12, half[1] * 1.25, half[2] * 1.25]} {...handlers} renderOrder={2}>
                <sphereGeometry args={[1, 32, 20]} />
            </mesh>
        </group>
    );
};
