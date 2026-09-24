import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { SHARED_SPHERE, texUrl } from './core';
import { GLSL_NOISE } from './glslNoise';

interface EarthSurfaceProps {
    radius: number;
    geometry?: THREE.BufferGeometry;
    // Group quỹ đạo — để tính hướng Mặt Trời mỗi frame (Mặt Trời ở gốc tọa độ).
    // Không truyền (modal) → hướng sáng cố định.
    orbitGroupRef?: React.RefObject<THREE.Group | null>;
    showClouds?: boolean;
    cloudsSpeed?: number;
    lightDir?: [number, number, number];
    // 0..1 — cường độ cực quang (bão Mặt Trời vừa tới). Đọc qua ref để không re-render.
    auroraRef?: React.MutableRefObject<number>;
}

// Trái Đất: shader ngày/đêm (đèn thành phố NASA Black Marble) + lớp mây riêng. Chi tiết trẻ
// chỉ tay vào đầu tiên, nên được chăm nhất:
//  - mặt ngày tối dần về phía lằn ranh (thay vì sáng phẳng) → khối cầu rõ
//  - ánh Mặt Trời lấp lánh trên BIỂN (mặt nạ đại dương), đất liền thì không
//  - bóng mây đổ xuống mặt đất
//  - viền khí quyển xanh ở mép đĩa + ửng cam ở hoàng hôn
//  - cực quang xanh lục quanh hai cực khi có bão Mặt Trời (auroraRef)
export const EarthSurface: React.FC<EarthSurfaceProps> = ({
    radius,
    geometry = SHARED_SPHERE,
    orbitGroupRef,
    showClouds = true,
    cloudsSpeed = 0.015,
    lightDir = [1, 0.35, 0.6],
    auroraRef
}) => {
    const [dayMap, nightMap, cloudsMap, oceanMap] = useTexture([
        texUrl('earth_day'),
        texUrl('earth_night'),
        texUrl('earth_clouds'),
        texUrl('earth_ocean')
    ]);
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    cloudsMap.wrapS = THREE.RepeatWrapping;

    const cloudsRef = useRef<THREE.Mesh>(null);
    const worldPos = useMemo(() => new THREE.Vector3(), []);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uDay: { value: dayMap },
            uNight: { value: nightMap },
            uClouds: { value: cloudsMap },
            uOcean: { value: oceanMap },
            uCloudShift: { value: 0 },
            uSunDir: { value: new THREE.Vector3(...lightDir).normalize() },
            uAurora: { value: 0 },
            uTime: { value: 0 }
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            varying vec3 vObjNormal;
            void main() {
                vUv = uv;
                vObjNormal = normal;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWorldPos = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D uDay;
            uniform sampler2D uNight;
            uniform sampler2D uClouds;
            uniform sampler2D uOcean;
            uniform float uCloudShift;
            uniform vec3 uSunDir;
            uniform float uAurora;
            uniform float uTime;
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            varying vec3 vObjNormal;
            ${GLSL_NOISE}
            void main() {
                vec3 N = normalize(vWorldNormal);
                vec3 L = normalize(uSunDir);
                vec3 V = normalize(cameraPosition - vWorldPos);
                float ndl = dot(N, L);
                float k = smoothstep(-0.15, 0.25, ndl);

                vec3 day = texture2D(uDay, vUv).rgb;
                // bóng mây (mây quay riêng → dịch u theo góc quay tương đối)
                float cloud = texture2D(uClouds, vec2(vUv.x - uCloudShift, vUv.y)).r;
                day *= 1.0 - cloud * 0.35;
                day *= 0.22 + 0.9 * pow(clamp(ndl, 0.0, 1.0), 0.7);

                // lấp lánh trên biển
                float ocean = texture2D(uOcean, vUv).r;
                vec3 R = reflect(-L, N);
                float spec = pow(max(dot(R, V), 0.0), 48.0) * ocean * (1.0 - cloud) * step(0.0, ndl);
                day += vec3(1.0, 0.93, 0.8) * spec * 0.85;

                vec3 night = texture2D(uNight, vUv).rgb * vec3(1.0, 0.85, 0.6) * 1.6;
                vec3 col = mix(night, day, k);

                // viền khí quyển + ửng hoàng hôn ở lằn ranh
                float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.4);
                vec3 atmo = mix(vec3(1.0, 0.55, 0.3), vec3(0.42, 0.66, 1.0), smoothstep(-0.05, 0.4, ndl));
                col += atmo * fres * smoothstep(-0.3, 0.2, ndl) * 0.55;

                // cực quang: dải vĩ độ 62–76° hai cực, rèm sáng dao động
                if (uAurora > 0.001) {
                    vec3 n = normalize(vObjNormal);
                    float lat = abs(asin(clamp(n.y, -1.0, 1.0))) * 57.2958;
                    float band = smoothstep(55.0, 62.0, lat) * (1.0 - smoothstep(74.0, 82.0, lat));
                    float lon = atan(n.z, n.x);
                    float curtain = snoise(vec3(cos(lon) * 5.0, sin(lon) * 5.0, uTime * 0.6)) * 0.5 + 0.5;
                    curtain *= snoise(vec3(n * 18.0 + uTime * 0.3)) * 0.4 + 0.6;
                    // mặt đêm rực hơn, nhưng mặt ngày vẫn thấy để bé nhận ra ngay khi tới nơi
                    float nightBoost = 1.0 - k * 0.45;
                    col += vec3(0.25, 1.0, 0.55) * band * curtain * uAurora * nightBoost * 2.4
                         + vec3(0.8, 0.2, 0.9) * band * curtain * curtain * uAurora * 0.6;
                }

                gl_FragColor = vec4(col, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [dayMap, nightMap, cloudsMap, oceanMap]);

    useEffect(() => () => material.dispose(), [material]);

    useFrame((state, delta) => {
        if (orbitGroupRef?.current) {
            orbitGroupRef.current.getWorldPosition(worldPos);
            // Mặt Trời ở gốc → hướng sáng = -vị trí hành tinh
            (material.uniforms.uSunDir.value as THREE.Vector3).copy(worldPos).multiplyScalar(-1).normalize();
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * cloudsSpeed;
            material.uniforms.uCloudShift.value = cloudsRef.current.rotation.y / (Math.PI * 2);
        }
        material.uniforms.uTime.value = state.clock.elapsedTime;
        material.uniforms.uAurora.value = auroraRef?.current ?? 0;
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
