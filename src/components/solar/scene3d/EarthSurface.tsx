import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { SHARED_SPHERE, texUrl } from './core';

interface EarthSurfaceProps {
    radius: number;
    geometry?: THREE.BufferGeometry;
    // Group quỹ đạo — để tính hướng Mặt Trời mỗi frame (Mặt Trời ở gốc tọa độ).
    // Không truyền (modal) → hướng sáng cố định.
    orbitGroupRef?: React.RefObject<THREE.Group | null>;
    showClouds?: boolean;
    cloudsSpeed?: number;
}

// Trái Đất: shader ngày/đêm (đèn thành phố NASA Black Marble) + lớp mây riêng.
// Chi tiết trẻ em chỉ tay vào đầu tiên.
export const EarthSurface: React.FC<EarthSurfaceProps> = ({
    radius,
    geometry = SHARED_SPHERE,
    orbitGroupRef,
    showClouds = true,
    cloudsSpeed = 0.015
}) => {
    const [dayMap, nightMap, cloudsMap] = useTexture([
        texUrl('earth_day'),
        texUrl('earth_night'),
        texUrl('earth_clouds')
    ]);
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;

    const cloudsRef = useRef<THREE.Mesh>(null);
    const worldPos = useMemo(() => new THREE.Vector3(), []);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uDay: { value: dayMap },
            uNight: { value: nightMap },
            uSunDir: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() }
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            void main() {
                vUv = uv;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D uDay;
            uniform sampler2D uNight;
            uniform vec3 uSunDir;
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            void main() {
                float k = smoothstep(-0.15, 0.25, dot(normalize(vWorldNormal), normalize(uSunDir)));
                vec3 day = texture2D(uDay, vUv).rgb;
                vec3 night = texture2D(uNight, vUv).rgb * vec3(1.0, 0.85, 0.6) * 1.6;
                gl_FragColor = vec4(mix(night, day, k), 1.0);
                #include <colorspace_fragment>
            }
        `
    }), [dayMap, nightMap]);

    useFrame((_, delta) => {
        if (orbitGroupRef?.current) {
            orbitGroupRef.current.getWorldPosition(worldPos);
            // Mặt Trời ở gốc → hướng sáng = -vị trí hành tinh
            (material.uniforms.uSunDir.value as THREE.Vector3).copy(worldPos).multiplyScalar(-1).normalize();
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * cloudsSpeed;
        }
    });

    return (
        <>
            <mesh geometry={geometry} material={material} scale={radius} />
            {showClouds && (
                <mesh ref={cloudsRef} geometry={geometry} scale={radius * 1.018} renderOrder={1}>
                    <meshLambertMaterial
                        color="#ffffff"
                        alphaMap={cloudsMap}
                        transparent
                        depthWrite={false}
                        opacity={0.85}
                    />
                </mesh>
            )}
        </>
    );
};
