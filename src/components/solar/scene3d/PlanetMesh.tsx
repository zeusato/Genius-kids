import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { damp3 } from 'maath/easing';
import { PlanetData, MoonData } from '../../../data/solarData';
import { SHARED_SPHERE, texUrl, SimClock, BodyRegistry, LabelRegistry } from './core';
import { orbitRadius, planetRadius, hitRadius, spinPeriodSeconds } from './scale';
import { orbitAngle, orbitPoint } from './orbit';
import { AtmosphereRim, ATMOSPHERE_COLORS } from './AtmosphereRim';
import { EarthSurface } from './EarthSurface';
import { SaturnRings, UranusRings } from './PlanetRings';
import { MoonMesh } from './MoonMesh';
import { createPlanetSurfaceMaterial, SATURN_RING_INNER, SATURN_RING_OUTER, tiltedNormal } from './planetSurface';

interface PlanetMeshProps {
    data: PlanetData;
    clock: SimClock;
    onSelect: (id: string) => void;
    registry: React.MutableRefObject<BodyRegistry>;
    labels: React.MutableRefObject<LabelRegistry>;
    quality: 'high' | 'low';
    moons?: MoonData[];
    auroraRef?: React.MutableRefObject<number>;
}

export const PlanetMesh: React.FC<PlanetMeshProps> = ({ data, clock, onSelect, registry, labels, quality, moons, auroraRef }) => {
    const phys = data.physical!;
    const orbitGroupRef = useRef<THREE.Group>(null);
    const tiltGroupRef = useRef<THREE.Group>(null);
    const spinGroupRef = useRef<THREE.Group>(null);
    const labelRef = useRef<HTMLButtonElement>(null);
    const [hovered, setHovered] = useState(false);

    const d = orbitRadius(phys.au);
    const r = planetRadius(phys.diameterKm);
    const hitR = hitRadius(r);
    const spin = spinPeriodSeconds(phys.rotationHours);

    // Sao Kim nghiêng 177.4° = lật úp → render nghiêng 2.6° + tự quay ngược (rotationHours âm).
    // Sao Thiên Vương 97.8° giữ nguyên — "lăn nghiêng" là điểm nhấn thị giác đúng NASA.
    const renderTiltDeg = data.id === 'venus' ? 180 - phys.axialTiltDeg : phys.axialTiltDeg;

    // Quỹ đạo elip chỉ cho Sao Thủy (e=0.206 — điểm dạy học); 7 hành tinh còn lại
    // e<0.1 khác biệt dưới 1px ở tỷ lệ nén này.
    const e = data.id === 'mercury' ? phys.eccentricity : 0;

    // Earth dùng EarthSurface (shader riêng) — vẫn gọi useTexture vô điều kiện (rule of hooks),
    // trỏ vào earth_day đã được drei cache nên không tốn thêm request
    const texture = useTexture(texUrl(data.id === 'earth' ? 'earth_day' : data.id));
    texture.colorSpace = THREE.SRGBColorSpace;
    const ringTex = useTexture(texUrl('saturn_ring'));

    const isSaturn = data.id === 'saturn';
    const ringNormal = useMemo(() => tiltedNormal(renderTiltDeg), [renderTiltDeg]);
    const material = useMemo(
        () => createPlanetSurfaceMaterial(texture, {
            sunAtOrigin: true,
            ring: isSaturn ? { texture: ringTex, inner: r * SATURN_RING_INNER, outer: r * SATURN_RING_OUTER } : undefined
        }),
        [texture, ringTex, isSaturn, r]
    );
    useEffect(() => () => material.dispose(), [material]);

    // Đăng ký vào registry để CameraRig bay tới + nhãn vào LabelDeclutter
    useEffect(() => {
        if (orbitGroupRef.current) {
            registry.current[data.id] = {
                object: orbitGroupRef.current,
                radius: r,
                ringNormal: isSaturn ? ringNormal : undefined,
                spinGroup: spinGroupRef.current ?? undefined
            };
            labels.current.set(data.id, { id: data.id, anchor: orbitGroupRef.current, offsetY: r + 0.55, el: labelRef });
        }
        return () => {
            delete registry.current[data.id];
            labels.current.delete(data.id);
        };
    }, [data.id, r, registry, labels, isSaturn, ringNormal]);

    useFrame((_, delta) => {
        const orbitGroup = orbitGroupRef.current;
        if (!orbitGroup) return;

        // Vị trí quỹ đạo từ đồng hồ mô phỏng — KHÔNG setState, chỉ mutate ref
        orbitPoint(d, e, orbitAngle(data.id, phys.periodYears, clock.t), orbitGroup.position);

        // Tự quay quanh trục đã nghiêng (dấu của spin xử lý chiều quay ngược)
        if (spinGroupRef.current) {
            spinGroupRef.current.rotation.y += delta * clock.timeScale * ((2 * Math.PI) / spin);
        }

        if (isSaturn) {
            orbitGroup.getWorldPosition(material.userData.uniforms.uRingCenter.value);
            material.userData.uniforms.uRingNormal.value.copy(ringNormal);
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
                            auroraRef={auroraRef}
                            sceneFill
                        />
                    ) : (
                        <mesh geometry={SHARED_SPHERE} material={material} scale={r} />
                    )}
                </group>

                {isSaturn && <SaturnRings radius={r} sunAtOrigin />}
                {data.id === 'uranus' && <UranusRings radius={r} />}
                {atmosphereColor && (
                    <AtmosphereRim radius={r} color={atmosphereColor} strength={data.id === 'mars' ? 0.55 : 0.95} sunAtOrigin />
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

            {/* Label tiếng Việt — label cũng là nút chạm (pattern NASA Eyes). LabelDeclutter
                ẩn nhãn khi bị Mặt Trời che / đang focus / đè nhãn gần hơn.
                zIndexRange thấp hơn UI page (z-50) và modal (z-100) */}
            <Html
                center
                position={[0, r + 0.55, 0]}
                zIndexRange={[40, 0]}
                wrapperClass="pointer-events-none"
            >
                <button
                    ref={labelRef}
                    onClick={() => onSelect(data.id)}
                    className="pointer-events-auto px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/95 bg-black/45 backdrop-blur-sm border border-white/15 whitespace-nowrap hover:bg-white/20 transition-[opacity,background-color] duration-300 select-none"
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
