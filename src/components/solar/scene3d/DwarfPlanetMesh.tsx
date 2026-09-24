import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PLUTO_PHYSICAL } from '../../../data/solarData';
import { LabelRegistry, LOW_SPHERE, SimClock } from './core';
import { orbitRadius, planetRadius } from './scale';
import { orbitAngle, orbitPoint } from './orbit';

interface DwarfPlanetMeshProps {
    clock: SimClock;
    onSelect: (id: string) => void;
    labels: React.MutableRefObject<LabelRegistry>;
}

// Sao Diêm Vương — hành tinh lùn ngoài Sao Hải Vương, quỹ đạo elip dẹt (e=0.244).
// Không texture → cầu màu tan đặc. Có đường quỹ đạo elip riêng (nét nhạt).
export const DwarfPlanetMesh: React.FC<DwarfPlanetMeshProps> = ({ clock, onSelect, labels }) => {
    const phys = PLUTO_PHYSICAL;
    const groupRef = useRef<THREE.Group>(null);
    const labelRef = useRef<HTMLButtonElement>(null);
    const [hovered, setHovered] = useState(false);

    const d = orbitRadius(phys.au);
    const r = Math.max(planetRadius(phys.diameterKm), 0.28);
    const e = phys.eccentricity;

    // Đường quỹ đạo elip
    const orbitGeo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < 160; i++) pts.push(orbitPoint(d, e, (i / 160) * Math.PI * 2));
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, [d, e]);

    useEffect(() => {
        if (!groupRef.current) return;
        labels.current.set('pluto', { id: 'pluto', anchor: groupRef.current, offsetY: r + 0.5, el: labelRef });
        return () => { labels.current.delete('pluto'); };
    }, [labels, r]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        orbitPoint(d, e, orbitAngle('pluto', phys.periodYears, clock.t), groupRef.current.position);
        groupRef.current.rotation.y += delta * clock.timeScale * 0.3;
    });

    return (
        <>
            <lineLoop geometry={orbitGeo}>
                <lineBasicMaterial color="#9ca3af" transparent opacity={0.18} />
            </lineLoop>

            <group ref={groupRef}>
                <mesh geometry={LOW_SPHERE} scale={r}>
                    <meshStandardMaterial color="#C9B29B" roughness={1} metalness={0} />
                </mesh>

                <mesh
                    visible={false}
                    onClick={(e2) => { e2.stopPropagation(); onSelect('pluto'); }}
                    onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                >
                    <sphereGeometry args={[Math.max(r * 2.2, 0.9), 10, 10]} />
                </mesh>

                <Html center position={[0, r + 0.5, 0]} zIndexRange={[35, 0]} wrapperClass="pointer-events-none">
                    <button
                        ref={labelRef}
                        onClick={() => onSelect('pluto')}
                        className={`pointer-events-auto px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap border transition-all ${hovered ? 'bg-black/70 border-white/40' : 'bg-black/40 border-white/15'}`}
                    >
                        Sao Diêm Vương
                    </button>
                </Html>
            </group>
        </>
    );
};
