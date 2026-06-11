import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { GEO } from './core';
import { MembraneRim } from './MembraneRim';
import { CellShapeSpec } from './cellScale';

interface CellBodyProps {
    cellId: string;
    spec: CellShapeSpec;
    cytoplasmId: string;
    onSelectBackground: (id: string) => void;
}

// Capsule dùng chung cho vi khuẩn (trục Y mặc định → xoay về X khi dùng)
const CAPSULE = new THREE.CapsuleGeometry(1, 2, 8, 20);

// Thân tế bào: vỏ trong mờ theo hình (blob/box/rod) — KHÔNG che nội thất.
// Vùng tế bào chất = cầu hit BackSide (chỉ bắt click vào khoảng trống bên trong,
// không chặn click vào bào quan ở gần camera hơn).
export const CellBody: React.FC<CellBodyProps> = ({ cellId, spec, cytoplasmId, onSelectBackground }) => {
    const bgHit = (
        <mesh
            geometry={GEO.sphere}
            scale={spec.radius * 0.92}
            onClick={(e) => {
                e.stopPropagation();
                onSelectBackground(cytoplasmId);
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'default')}
        >
            <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
        </mesh>
    );

    if (cellId === 'plant') {
        // Hộp bo góc: thành cứng (ngoài) + màng mềm (trong)
        const [dx, dy, dz] = spec.dims;
        const wallR = 2.7, memR = 2.5;
        return (
            <group>
                <RoundedBox args={[wallR * dx * 2, wallR * dy * 2, wallR * dz * 2]} radius={0.35} smoothness={3}>
                    <meshStandardMaterial color="#15803D" transparent opacity={0.12} roughness={0.5} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
                </RoundedBox>
                <RoundedBox args={[memR * dx * 2, memR * dy * 2, memR * dz * 2]} radius={0.3} smoothness={3}>
                    <meshStandardMaterial color="#4ADE80" transparent opacity={0.1} roughness={0.3} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
                </RoundedBox>
                {bgHit}
            </group>
        );
    }

    if (cellId === 'bacteria') {
        // Hình que: vỏ nhầy + thành + màng (capsule lồng nhau)
        const shells = [
            { r: 1.25, color: '#FB923C', opacity: 0.1 },
            { r: 1.12, color: '#92400E', opacity: 0.13 },
            { r: 1.02, color: '#CA8A04', opacity: 0.14 }
        ];
        return (
            <group rotation={[0, 0, Math.PI / 2]}>
                {shells.map((s, i) => (
                    <mesh key={i} geometry={CAPSULE} scale={s.r}>
                        <meshStandardMaterial color={s.color} transparent opacity={s.opacity} roughness={0.35} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
                    </mesh>
                ))}
                <mesh
                    geometry={CAPSULE}
                    scale={0.98}
                    onClick={(e) => { e.stopPropagation(); onSelectBackground(cytoplasmId); }}
                    onPointerOver={() => (document.body.style.cursor = 'pointer')}
                    onPointerOut={() => (document.body.style.cursor = 'default')}
                >
                    <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
                </mesh>
            </group>
        );
    }

    // animal: blob cầu mềm + viền màng fresnel
    return (
        <group scale={spec.dims}>
            <MembraneRim radius={spec.radius} color="#7DD3FC" opacity={0.12} />
            {bgHit}
        </group>
    );
};
