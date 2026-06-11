import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { MoonData } from '../../../data/solarData';
import { SHARED_SPHERE, SimClock } from './core';

interface MoonMeshProps {
    moon: MoonData;
    parentRadius: number; // bán kính hành tinh chủ (scene units)
    clock: SimClock;
    onSelect: (id: string) => void;
}

// Vệ tinh quay quanh hành tinh — đặt trong group quỹ đạo của hành tinh (theo nó quanh Mặt Trời).
// Chạm → mở thẻ info (không fly-to vì chấm quá nhỏ). Label hiện khi hover.
export const MoonMesh: React.FC<MoonMeshProps> = ({ moon, parentRadius, clock, onSelect }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const phase0 = useMemo(() => Math.random() * Math.PI * 2, []);
    const orbitR = moon.relOrbit * parentRadius;

    useFrame(() => {
        if (!groupRef.current) return;
        const a = phase0 + clock.t * ((2 * Math.PI) / moon.periodSec);
        groupRef.current.position.set(
            Math.cos(a) * orbitR,
            Math.sin(a) * orbitR * moon.tilt,
            Math.sin(a) * orbitR
        );
    });

    const hitR = Math.max(moon.size * 2.4, 0.32);

    return (
        <group ref={groupRef}>
            <mesh geometry={SHARED_SPHERE} scale={moon.size}>
                <meshStandardMaterial color={moon.color} roughness={1} metalness={0} />
            </mesh>

            {/* Vùng chạm to hơn cho ngón tay trẻ em */}
            <mesh
                visible={false}
                onClick={(e) => { e.stopPropagation(); onSelect(moon.id); }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                <sphereGeometry args={[hitR, 10, 10]} />
            </mesh>

            {hovered && (
                <Html center position={[0, moon.size + 0.3, 0]} zIndexRange={[35, 0]} wrapperClass="pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-black/70 border border-white/20 whitespace-nowrap">
                        {moon.name}
                    </span>
                </Html>
            )}
        </group>
    );
};
