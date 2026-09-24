import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { texUrl } from './core';
import { SATURN_RING_INNER, SATURN_RING_OUTER } from './planetSurface';

// RingGeometry mặc định có UV phẳng làm texture dải vành bị nhòe —
// remap UV theo bán kính: uv.x = (r - inner) / (outer - inner)
function makeRingGeometry(inner: number, outer: number): THREE.RingGeometry {
    const geo = new THREE.RingGeometry(inner, outer, 96, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return geo;
}

interface SaturnRingsProps {
    radius: number;
    // true: Mặt Trời ở gốc tọa độ (scene chính); false: dùng lightDir cố định (modal, Xưởng...)
    sunAtOrigin?: boolean;
    lightDir?: [number, number, number];
}

// Vành Sao Thổ: texture alpha thật (băng + khe Cassini), đặt trong group nghiêng 26.7° của hành tinh.
// Shader riêng để vành NHẬN SÁNG như thật:
//  - bóng hành tinh đổ lên vành (giao tia điểm vành → Mặt Trời với quả cầu hành tinh)
//  - nhìn mặt không được chiếu sáng thì vành tối hơn (ánh sáng chỉ lọt qua lớp băng mỏng)
//  - Mặt Trời càng thấp so với mặt phẳng vành, vành càng tối
export const SaturnRings: React.FC<SaturnRingsProps> = ({ radius, sunAtOrigin = false, lightDir = [5, 2, 4] }) => {
    const ringTex = useTexture(texUrl('saturn_ring'));
    ringTex.colorSpace = THREE.SRGBColorSpace;

    const geometry = useMemo(
        () => makeRingGeometry(radius * SATURN_RING_INNER, radius * SATURN_RING_OUTER),
        [radius]
    );

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTex: { value: ringTex },
            uPlanetR: { value: radius },
            uLightDir: { value: new THREE.Vector3(...lightDir).normalize() }
        },
        defines: sunAtOrigin ? { SUN_AT_ORIGIN: '' } : {},
        vertexShader: /* glsl */`
            varying vec2 vUv;
            varying vec3 vPWorld;
            varying vec3 vCenter;
            varying vec3 vNWorld;
            void main() {
                vUv = uv;
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vPWorld = wp.xyz;
                vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                vNWorld = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
                gl_Position = projectionMatrix * viewMatrix * wp;
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D uTex;
            uniform float uPlanetR;
            uniform vec3 uLightDir;
            varying vec2 vUv;
            varying vec3 vPWorld;
            varying vec3 vCenter;
            varying vec3 vNWorld;
            void main() {
                vec4 tex = texture2D(uTex, vUv);
                if (tex.a < 0.03) discard;
            #ifdef SUN_AT_ORIGIN
                vec3 L = normalize(-vPWorld);
            #else
                vec3 L = normalize(uLightDir);
            #endif
                vec3 V = normalize(cameraPosition - vPWorld);
                vec3 N = normalize(vNWorld);

                // Bóng hành tinh
                vec3 toC = vCenter - vPWorld;
                float along = dot(toC, L);
                float shadow = 1.0;
                if (along > 0.0) {
                    float dPerp = length(toC - L * along);
                    shadow = mix(0.06, 1.0, smoothstep(uPlanetR * 0.96, uPlanetR * 1.04, dPerp));
                }

                float sL = dot(N, L);
                float sV = dot(N, V);
                float face = sL * sV > 0.0 ? 1.0 : 0.42;
                float elev = mix(0.5, 1.0, sqrt(abs(sL)));

                gl_FragColor = vec4(tex.rgb * shadow * face * elev * 1.08, tex.a * 0.96);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [ringTex, radius, sunAtOrigin, lightDir[0], lightDir[1], lightDir[2]]);

    return <mesh geometry={geometry} material={material} rotation-x={-Math.PI / 2} renderOrder={1} />;
};

// Vành Sao Thiên Vương: 13 vành rất mờ — 1 annulus mảnh là đủ chính xác với lứa tuổi 5-12.
// Nghiêng 97.8° theo hành tinh → vành gần như dựng đứng, điểm nhấn thị giác thú vị.
export const UranusRings: React.FC<{ radius: number }> = ({ radius }) => {
    const geometry = useMemo(
        () => new THREE.RingGeometry(radius * 1.7, radius * 1.85, 80, 1),
        [radius]
    );
    return (
        <mesh geometry={geometry} rotation-x={-Math.PI / 2} renderOrder={1}>
            <meshBasicMaterial
                color="#9BC4C4"
                side={THREE.DoubleSide}
                transparent
                opacity={0.22}
                depthWrite={false}
            />
        </mesh>
    );
};
