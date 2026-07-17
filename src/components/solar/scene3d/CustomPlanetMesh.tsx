import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SimClock } from './core';
import { orbitRadius, hitRadius, scenePeriodSeconds } from './scale';
import { PlanetModel } from '../../planetmaker/PlanetModel';
import { createTerrain, deserializeTerrain, randomizeTerrain } from '../../planetmaker/terrainOps';
import { CustomPlanetDoc } from '../../planetmaker/planetStore';

// Hành tinh do bé tự nặn trong Xưởng Hành Tinh — bay quỹ đạo riêng giữa Sao Hỏa
// và vành đai tiểu hành tinh (AU 2.2 là "khoảng trống" tự nhiên của Hệ Mặt Trời).
// Chạm → mở thẻ info (không fly-to, như vệ tinh/sao chổi).

const CUSTOM_AU = 2.2;
const CUSTOM_PERIOD_YEARS = 3.26;
const CUSTOM_RADIUS = 0.5; // cỡ Trái Đất trong scene

const noRaycast = () => null as any;

interface CustomPlanetMeshProps {
    doc: CustomPlanetDoc;
    clock: SimClock;
    onSelect: (id: string) => void;
}

export const CustomPlanetMesh: React.FC<CustomPlanetMeshProps> = ({ doc, clock, onSelect }) => {
    const orbitGroupRef = useRef<THREE.Group>(null);
    const dirtyRef = useRef(true);
    const [hovered, setHovered] = React.useState(false);

    // Dựng lại địa hình từ bản lưu; hỏng dữ liệu → gieo ngẫu nhiên thay vì vỡ scene
    const terrain = useMemo(() => {
        const t = createTerrain(5);
        if (!deserializeTerrain(t, doc)) randomizeTerrain(t, 7, doc.seaLevel);
        dirtyRef.current = true;
        return t;
    }, [doc]);

    const d = orbitRadius(CUSTOM_AU);
    const period = scenePeriodSeconds(CUSTOM_PERIOD_YEARS);
    const hitR = hitRadius(CUSTOM_RADIUS);
    const phase0 = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame(() => {
        const g = orbitGroupRef.current;
        if (!g) return;
        const alpha = phase0 + clock.t * ((2 * Math.PI) / period);
        g.position.set(Math.cos(alpha) * d, 0, Math.sin(alpha) * d);
    });

    return (
        <>
            {/* Vạch quỹ đạo vàng nhạt — phân biệt với quỹ đạo hành tinh thật */}
            <mesh rotation-x={-Math.PI / 2} raycast={noRaycast}>
                <ringGeometry args={[d - 0.03, d + 0.03, 128]} />
                <meshBasicMaterial color="#FFD54F" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>

            <group ref={orbitGroupRef}>
                <group scale={hovered ? CUSTOM_RADIUS * 1.15 : CUSTOM_RADIUS}>
                    <PlanetModel
                        terrain={terrain}
                        seaLevel={doc.seaLevel}
                        cosmetics={doc.cosmetics}
                        dirtyRef={dirtyRef}
                        spin
                    />
                </group>

                {/* Vùng chạm ≥48px cho ngón tay trẻ em */}
                <mesh
                    visible={false}
                    onClick={(ev) => { ev.stopPropagation(); onSelect('custom-planet'); }}
                    onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                >
                    <sphereGeometry args={[hitR, 12, 12]} />
                </mesh>

                <Html
                    center
                    position={[0, CUSTOM_RADIUS + 0.6, 0]}
                    zIndexRange={[40, 0]}
                    wrapperClass="pointer-events-none"
                >
                    <button
                        onClick={() => onSelect('custom-planet')}
                        className="pointer-events-auto px-2.5 py-1 rounded-full text-[11px] font-semibold text-yellow-100 bg-yellow-500/25 backdrop-blur-sm border border-yellow-300/40 whitespace-nowrap hover:bg-yellow-400/30 transition-colors select-none"
                    >
                        ⭐ {doc.name}
                    </button>
                </Html>
            </group>
        </>
    );
};
