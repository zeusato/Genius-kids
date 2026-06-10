import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SOLAR_SYSTEM_DATA } from '../../../data/solarData';
import { orbitRadius } from './scale';

// 8 đường quỹ đạo lineLoop 128 điểm — không dùng drei fat Line (linewidth>1 bị ANGLE/mobile
// bỏ qua, không cần trả chi phí cho 8 vòng tròn tĩnh). Quỹ đạo Sao Thủy là elip thật (e=0.206).
export const OrbitLines: React.FC = () => {
    const geometries = useMemo(() => {
        return SOLAR_SYSTEM_DATA.map((p) => {
            const phys = p.physical!;
            const d = orbitRadius(phys.au);
            const e = p.id === 'mercury' ? phys.eccentricity : 0;
            const b = d * Math.sqrt(1 - e * e);
            const c = d * e;

            const points: THREE.Vector3[] = [];
            const SEGMENTS = 128;
            for (let i = 0; i < SEGMENTS; i++) {
                const a = (i / SEGMENTS) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(a) * d - c, 0, Math.sin(a) * b));
            }
            return new THREE.BufferGeometry().setFromPoints(points);
        });
    }, []);

    return (
        <>
            {geometries.map((geo, i) => (
                <lineLoop key={SOLAR_SYSTEM_DATA[i].id} geometry={geo}>
                    <lineBasicMaterial color="#ffffff" transparent opacity={0.22} />
                </lineLoop>
            ))}
        </>
    );
};
