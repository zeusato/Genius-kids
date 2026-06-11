import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SHARED_SPHERE, getGlowTexture, SimClock } from './core';

interface CometProps {
    clock: SimClock;
    onSelect: (id: string) => void;
}

// Quỹ đạo cực dẹt: cận nhật ~6, viễn nhật ~52 (units)
const A = 29, E = 0.793;
const B = A * Math.sqrt(1 - E * E);
const C = A * E;
const PERIOD = 48;

const UP = new THREE.Vector3(0, 1, 0);

// Sao chổi — nhân băng nhỏ + đuôi nón phát sáng LUÔN hướng ra xa Mặt Trời (gốc tọa độ),
// dài và sáng hơn khi tới gần Mặt Trời. Minh họa quỹ đạo elip đẹp nhất.
export const Comet: React.FC<CometProps> = ({ clock, onSelect }) => {
    const groupRef = useRef<THREE.Group>(null);
    const tailRef = useRef<THREE.Mesh>(null);
    const tailMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const [hovered, setHovered] = useState(false);
    const phase0 = useMemo(() => Math.random() * Math.PI * 2, []);

    const orbitGeo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 200; i++) {
            const t = (i / 200) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(t) * A - C, Math.sin(t + 0.5) * A * 0.12, Math.sin(t) * B));
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, []);

    const away = useMemo(() => new THREE.Vector3(), []);
    const quat = useMemo(() => new THREE.Quaternion(), []);

    useFrame(() => {
        const grp = groupRef.current;
        if (!grp) return;
        const t = phase0 + clock.t * ((2 * Math.PI) / PERIOD);
        const x = Math.cos(t) * A - C;
        const y = Math.sin(t + 0.5) * A * 0.12;
        const z = Math.sin(t) * B;
        grp.position.set(x, y, z);

        // Đuôi hướng ra xa Mặt Trời (gốc) + dài/sáng hơn khi gần
        const dist = Math.hypot(x, y, z);
        away.set(x, y, z).normalize();
        const near = Math.max(0, Math.min(1, (22 - dist) / 16));
        const len = 1 + near * 7;
        if (tailRef.current) {
            quat.setFromUnitVectors(UP, away);
            tailRef.current.quaternion.copy(quat);
            tailRef.current.position.copy(away).multiplyScalar(len / 2);
            tailRef.current.scale.set(1, len, 1);
        }
        if (tailMatRef.current) tailMatRef.current.opacity = 0.15 + near * 0.45;
    });

    return (
        <>
            <lineLoop geometry={orbitGeo}>
                <lineBasicMaterial color="#7fd8ff" transparent opacity={0.16} />
            </lineLoop>

            <group ref={groupRef}>
                {/* Nhân băng */}
                <mesh geometry={SHARED_SPHERE} scale={0.13}>
                    <meshStandardMaterial color="#E0FBFF" emissive="#A7E8FF" emissiveIntensity={0.5} roughness={0.6} />
                </mesh>

                {/* Quầng sáng đầu */}
                <sprite scale={[0.9, 0.9, 1]}>
                    <spriteMaterial map={getGlowTexture()} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.7} color="#Bfeeff" />
                </sprite>

                {/* Đuôi nón — gốc rộng ở đầu sao chổi, thuôn ra xa */}
                <mesh ref={tailRef}>
                    <coneGeometry args={[0.35, 1, 14, 1, true]} />
                    <meshBasicMaterial ref={tailMatRef} color="#A7E8FF" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>

                {/* Vùng chạm */}
                <mesh
                    visible={false}
                    onClick={(e) => { e.stopPropagation(); onSelect('comet'); }}
                    onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                >
                    <sphereGeometry args={[0.7, 10, 10]} />
                </mesh>

                {hovered && (
                    <Html center position={[0, 0.7, 0]} zIndexRange={[35, 0]} wrapperClass="pointer-events-none">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-black/70 border border-white/20 whitespace-nowrap">Sao chổi ☄️</span>
                    </Html>
                )}
            </group>
        </>
    );
};
