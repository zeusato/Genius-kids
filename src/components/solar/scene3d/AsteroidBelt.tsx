import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimClock } from './core';
import { BELT_INNER, BELT_OUTER, BELT_CENTER, scenePeriodSeconds } from './scale';

interface AsteroidBeltProps {
    clock: SimClock;
    onSelect: (id: string) => void;
    count?: number; // tier cao 1500, tier thấp 600
}

// Vành đai 2,2–3,2 AU (NASA): InstancedMesh — matrix ghi MỘT LẦN lúc mount, mỗi frame chỉ
// xoay GROUP (zero setMatrixAt, zero upload). 200 div CSS cũ → 2 draw call.
// Hai group quay lệch tốc độ ±5% tạo parallax như speedOffset cũ.
const BeltRing: React.FC<{
    clock: SimClock;
    count: number;
    speedFactor: number;
    seedOffset: number;
}> = ({ clock, count, speedFactor, seedOffset }) => {
    const groupRef = useRef<THREE.Group>(null);
    const instancedRef = useRef<THREE.InstancedMesh>(null);

    const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);

    // Chu kỳ Kepler của vành đai (~2.7 AU → 4.43 năm) qua cùng luật nén với các hành tinh
    const beltPeriod = scenePeriodSeconds(Math.pow(2.7, 1.5));
    const angularSpeed = ((2 * Math.PI) / beltPeriod) * speedFactor;

    useLayoutEffect(() => {
        const mesh = instancedRef.current;
        if (!mesh) return;
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const eul = new THREE.Euler();
        const pos = new THREE.Vector3();
        const scl = new THREE.Vector3();

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2 + seedOffset;
            const radius = BELT_INNER + Math.random() * (BELT_OUTER - BELT_INNER);
            const y = (Math.random() - 0.5) * 0.7;
            const s = 0.025 + Math.random() * 0.06;
            eul.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            q.setFromEuler(eul);
            pos.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
            scl.setScalar(s);
            m.compose(pos, q, scl);
            mesh.setMatrixAt(i, m);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, [count, seedOffset]);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y -= delta * clock.timeScale * angularSpeed;
        }
    });

    return (
        <group ref={groupRef}>
            <instancedMesh
                ref={instancedRef}
                args={[geometry, undefined, count]}
                frustumCulled={false}
            >
                <meshStandardMaterial color="#9C8F7F" roughness={1} metalness={0} />
            </instancedMesh>
        </group>
    );
};

export const AsteroidBelt: React.FC<AsteroidBeltProps> = ({ clock, onSelect, count = 1500 }) => {
    const half = Math.floor(count / 2);
    const torusRadius = (BELT_OUTER - BELT_INNER) / 2 + 0.6;

    return (
        <group>
            <BeltRing clock={clock} count={half} speedFactor={1.05} seedOffset={0} />
            <BeltRing clock={clock} count={count - half} speedFactor={0.95} seedOffset={1.7} />

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
