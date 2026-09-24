import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimClock } from './core';
import { BELT_INNER, BELT_OUTER, BELT_CENTER, scenePeriodSeconds } from './scale';
import { sceneRandom } from './sceneParams';

interface AsteroidBeltProps {
    clock: SimClock;
    onSelect: (id: string) => void;
    count?: number; // tier cao 1500, tier thấp 600
}

// Bảng màu đá thật: loại C (carbon, xám tối — phổ biến nhất), S (silicat, nâu đỏ), M (kim loại, xám sáng)
const ROCK_COLORS = ['#6f6a64', '#7d7468', '#8f7a63', '#9a8f84', '#5f5a55', '#a39480'].map((c) => new THREE.Color(c));

// Vành đai 2,2–3,2 AU (NASA): InstancedMesh — matrix ghi MỘT LẦN lúc mount, mỗi frame chỉ
// xoay GROUP (zero setMatrixAt, zero upload). Hai group quay lệch tốc độ ±5% tạo parallax.
//
// Ánh sáng: pointLight ở tâm Mặt Trời → mỗi viên sáng ở mặt HƯỚNG VÀO TRONG, tối mặt ngoài,
// trên cả vòng (đúng vật lý). Nửa vành phía gần camera vì thế trông tối (nhìn vào mặt ngoài) —
// như pha Mặt Trăng. Đá chỉ vài pixel nên thêm một mức sáng tối thiểu (emissive rất nhẹ) để nửa
// gần không tan vào nền trời khi ambient đã hạ gần 0.
const BeltRing: React.FC<{
    clock: SimClock;
    count: number;
    speedFactor: number;
    seedKey: string;
}> = ({ clock, count, speedFactor, seedKey }) => {
    const groupRef = useRef<THREE.Group>(null);
    const instancedRef = useRef<THREE.InstancedMesh>(null);

    // Icosahedron 20 tam giác (Dodecahedron cũ 36) — scale lệch trục cho dáng đá méo
    const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);

    // Chu kỳ Kepler của vành đai (~2.7 AU → 4.43 năm) qua cùng luật nén với các hành tinh
    const beltPeriod = scenePeriodSeconds(Math.pow(2.7, 1.5));
    const angularSpeed = ((2 * Math.PI) / beltPeriod) * speedFactor;

    useLayoutEffect(() => {
        const mesh = instancedRef.current;
        if (!mesh) return;
        const rnd = sceneRandom(seedKey);
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const eul = new THREE.Euler();
        const pos = new THREE.Vector3();
        const scl = new THREE.Vector3();
        const col = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const angle = rnd() * Math.PI * 2;
            // phân bố dày ở giữa vành, thưa ở rìa (tổng 2 số ngẫu nhiên ≈ tam giác)
            const u = (rnd() + rnd()) / 2;
            const radius = BELT_INNER + u * (BELT_OUTER - BELT_INNER);
            const y = (rnd() - 0.5) * 0.7 * (1 - Math.abs(u - 0.5));
            const s = 0.025 + Math.pow(rnd(), 2.2) * 0.075;
            eul.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
            q.setFromEuler(eul);
            pos.set(Math.cos(angle) * radius, y, -Math.sin(angle) * radius);
            scl.set(s * (0.7 + rnd() * 0.6), s * (0.6 + rnd() * 0.5), s * (0.7 + rnd() * 0.6));
            m.compose(pos, q, scl);
            mesh.setMatrixAt(i, m);
            col.copy(ROCK_COLORS[Math.floor(rnd() * ROCK_COLORS.length)]).multiplyScalar(0.85 + rnd() * 0.3);
            mesh.setColorAt(i, col);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }, [count, seedKey]);

    useFrame((_, delta) => {
        // ngược chiều kim đồng hồ nhìn từ bắc — cùng chiều các hành tinh
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * clock.timeScale * angularSpeed;
        }
    });

    return (
        <group ref={groupRef}>
            <instancedMesh
                ref={instancedRef}
                args={[geometry, undefined, count]}
                frustumCulled={false}
            >
                <meshStandardMaterial
                    color="#ffffff"
                    roughness={1}
                    metalness={0}
                    flatShading
                    emissive="#3a3632"
                    emissiveIntensity={0.35}
                />
            </instancedMesh>
        </group>
    );
};

export const AsteroidBelt: React.FC<AsteroidBeltProps> = ({ clock, onSelect, count = 1500 }) => {
    const half = Math.floor(count / 2);
    const torusRadius = (BELT_OUTER - BELT_INNER) / 2 + 0.6;

    return (
        <group>
            <BeltRing clock={clock} count={half} speedFactor={1.05} seedKey="belt:a" />
            <BeltRing clock={clock} count={count - half} speedFactor={0.95} seedKey="belt:b" />

            {/* Torus vô hình = vùng chạm của cả vành đai → mở thẻ thông tin */}
            <mesh
                visible={false}
                rotation-x={-Math.PI / 2}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect('asteroid-belt');
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'default')}
            >
                <torusGeometry args={[BELT_CENTER, torusRadius, 8, 64]} />
            </mesh>
        </group>
    );
};
