import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { SHARED_SPHERE, getGlowTexture, texUrl, SimClock } from './core';
import { SUN_RADIUS, SUN_HIT_RADIUS, spinPeriodSeconds } from './scale';

interface SunProps {
    clock: SimClock;
    onSelect: (id: string) => void;
}

// Mặt Trời: sphere HDR (toneMapped=false, màu >1 để Bloom bắt được) + sprite glow additive
// (mọi tier đều có glow) + pointLight decay=0 chiếu sáng các hành tinh + hit sphere vô hình.
export const Sun: React.FC<SunProps> = ({ clock, onSelect }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const sunTex = useTexture(texUrl('sun'));
    sunTex.colorSpace = THREE.SRGBColorSpace;

    // Mặt Trời tự quay ~25 ngày (xích đạo) → nén
    const spinSpeed = (2 * Math.PI) / spinPeriodSeconds(25 * 24);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * clock.timeScale * spinSpeed;
        }
    });

    return (
        <group>
            <mesh ref={meshRef} geometry={SHARED_SPHERE} scale={SUN_RADIUS}>
                <meshBasicMaterial
                    map={sunTex}
                    toneMapped={false}
                    color={[1.8, 1.45, 1.0] as unknown as THREE.Color}
                />
            </mesh>

            {/* Quầng sáng — sprite gradient additive, gần như miễn phí */}
            <sprite scale={[SUN_RADIUS * 4.6, SUN_RADIUS * 4.6, 1]} renderOrder={3}>
                <spriteMaterial
                    map={getGlowTexture()}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    transparent
                    opacity={0.85}
                    color="#FFCC80"
                />
            </sprite>

            {/* Vùng chạm to cho trẻ em */}
            <mesh
                visible={false}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect('sun');
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'default')}
            >
                <sphereGeometry args={[SUN_HIT_RADIUS, 12, 12]} />
            </mesh>

            {/* Nguồn sáng duy nhất của hệ — KHÔNG shadow map (đường ranh ngày/đêm
                từ ánh sáng thường chính là "bóng" trẻ cần thấy) */}
            <pointLight intensity={2.4} decay={0} color="#FFF4E0" />
        </group>
    );
};
