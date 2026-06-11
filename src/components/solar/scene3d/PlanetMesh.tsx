import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { damp3 } from 'maath/easing';
import { PlanetData, MoonData } from '../../../data/solarData';
import { SHARED_SPHERE, texUrl, SimClock, BodyRegistry } from './core';
import { orbitRadius, planetRadius, hitRadius, scenePeriodSeconds, spinPeriodSeconds } from './scale';
import { AtmosphereRim, ATMOSPHERE_COLORS } from './AtmosphereRim';
import { EarthSurface } from './EarthSurface';
import { SaturnRings, UranusRings } from './PlanetRings';
import { MoonMesh } from './MoonMesh';

interface PlanetMeshProps {
    data: PlanetData;
    clock: SimClock;
    onSelect: (id: string) => void;
    registry: React.MutableRefObject<BodyRegistry>;
    quality: 'high' | 'low';
    moons?: MoonData[];
}

export const PlanetMesh: React.FC<PlanetMeshProps> = ({ data, clock, onSelect, registry, quality, moons }) => {
    const phys = data.physical!;
    const orbitGroupRef = useRef<THREE.Group>(null);
    const tiltGroupRef = useRef<THREE.Group>(null);
    const spinGroupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    const d = orbitRadius(phys.au);
    const r = planetRadius(phys.diameterKm);
    const hitR = hitRadius(r);
    const period = scenePeriodSeconds(phys.periodYears);
    const spin = spinPeriodSeconds(phys.rotationHours);

    // Sao Kim nghiêng 177.4° = lật úp → render nghiêng 2.6° + tự quay ngược (rotationHours âm).
    // Sao Thiên Vương 97.8° giữ nguyên — "lăn nghiêng" là điểm nhấn thị giác đúng NASA.
    const renderTiltDeg = data.id === 'venus' ? 180 - phys.axialTiltDeg : phys.axialTiltDeg;

    // Quỹ đạo elip chỉ cho Sao Thủy (e=0.206 — điểm dạy học); 7 hành tinh còn lại
    // e<0.1 khác biệt dưới 1px ở tỷ lệ nén này.
    const e = data.id === 'mercury' ? phys.eccentricity : 0;
    const semiMinor = d * Math.sqrt(1 - e * e);
    const focusOffset = d * e;

    // Góc xuất phát ngẫu nhiên — như initialOffsets của view cũ
    const phase0 = useMemo(() => Math.random() * Math.PI * 2, []);

    // Earth dùng EarthSurface (shader riêng) — vẫn gọi useTexture vô điều kiện (rule of hooks),
    // trỏ vào earth_day đã được drei cache nên không tốn thêm request
    const texture = useTexture(texUrl(data.id === 'earth' ? 'earth_day' : data.id));
    texture.colorSpace = THREE.SRGBColorSpace;

    // Đăng ký vào registry để CameraRig bay tới
    useEffect(() => {
        if (orbitGroupRef.current) {
            registry.current[data.id] = { object: orbitGroupRef.current, radius: r };
        }
        return () => {
            delete registry.current[data.id];
        };
    }, [data.id, r, registry]);

    useFrame((_, delta) => {
        const orbitGroup = orbitGroupRef.current;
        if (!orbitGroup) return;

        // Vị trí quỹ đạo từ đồng hồ mô phỏng — KHÔNG setState, chỉ mutate ref
        const alpha = phase0 + clock.t * ((2 * Math.PI) / period);
        orbitGroup.position.set(
            Math.cos(alpha) * d - focusOffset,
            0,
            Math.sin(alpha) * semiMinor
        );

        // Tự quay quanh trục đã nghiêng (dấu của spin xử lý chiều quay ngược)
        if (spinGroupRef.current) {
            spinGroupRef.current.rotation.y += delta * clock.timeScale * ((2 * Math.PI) / spin);
        }

        // Phóng to mượt khi hover/chạm (maath damp — không re-render)
        if (tiltGroupRef.current) {
            const target = hovered ? 1.18 : 1;
            damp3(tiltGroupRef.current.scale, [target, target, target], 0.12, delta);
        }
    });

    const atmosphereColor = ATMOSPHERE_COLORS[data.id];

    return (
        <group ref={orbitGroupRef}>
            <group ref={tiltGroupRef} rotation-z={-THREE.MathUtils.degToRad(renderTiltDeg)}>
                <group ref={spinGroupRef}>
                    {data.id === 'earth' ? (
                        <EarthSurface
                            radius={r}
                            orbitGroupRef={orbitGroupRef}
                            showClouds={quality === 'high'}
                        />
                    ) : (
                        <mesh geometry={SHARED_SPHERE} scale={r}>
                            <meshStandardMaterial map={texture} roughness={1} metalness={0} />
                        </mesh>
                    )}
                </group>

                {data.id === 'saturn' && <SaturnRings radius={r} />}
                {data.id === 'uranus' && <UranusRings radius={r} />}
                {atmosphereColor && (
                    <AtmosphereRim radius={r} color={atmosphereColor} strength={data.id === 'mars' ? 0.5 : 0.9} />
                )}
            </group>

            {/* Hit sphere vô hình — vùng chạm ≥ chuẩn 48px cho ngón tay trẻ em.
                visible=false vẫn raycast được trong three.js → 0 draw call */}
            <mesh
                visible={false}
                onClick={(ev) => {
                    ev.stopPropagation();
                    onSelect(data.id);
                }}
                onPointerOver={() => {
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'default';
                }}
            >
                <sphereGeometry args={[hitR, 12, 12]} />
            </mesh>

            {/* Label tiếng Việt luôn hiển thị — label cũng là nút chạm (pattern NASA Eyes).
                zIndexRange thấp hơn UI page (z-50) và modal (z-100) */}
            <Html
                center
                position={[0, r + 0.55, 0]}
                zIndexRange={[40, 0]}
                wrapperClass="pointer-events-none"
            >
                <button
                    onClick={() => onSelect(data.id)}
                    className="pointer-events-auto px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/95 bg-black/45 backdrop-blur-sm border border-white/15 whitespace-nowrap hover:bg-white/20 transition-colors select-none"
                >
                    {data.name}
                </button>
            </Html>

            {/* Vệ tinh quay quanh hành tinh — nằm trong group quỹ đạo nên theo hành tinh quanh Mặt Trời */}
            {moons?.map((m) => (
                <MoonMesh key={m.id} moon={m} parentRadius={r} clock={clock} onSelect={onSelect} />
            ))}
        </group>
    );
};
