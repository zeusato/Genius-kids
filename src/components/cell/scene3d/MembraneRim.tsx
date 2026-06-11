import React, { useMemo } from 'react';
import * as THREE from 'three';
import { GEO } from './core';

interface MembraneRimProps {
    radius: number;
    color: string;
    strength?: number;
    opacity?: number;
}

// Vỏ màng trong mờ kiểu bong bóng xà phòng — port từ solar/AtmosphereRim nhưng đổi
// Additive → Normal alpha thấp, thêm mặt trước mờ để có cảm giác "vỏ" mà KHÔNG che nội thất.
export const MembraneRim: React.FC<MembraneRimProps> = ({ radius, color, strength = 1.0, opacity = 0.16 }) => {
    const rimMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(color) },
            uStrength: { value: strength }
        },
        vertexShader: /* glsl */`
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalize(normalMatrix * normal);
                vViewDir = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uColor;
            uniform float uStrength;
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
                float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.5);
                gl_FragColor = vec4(uColor, fres * uStrength);
            }
        `,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
    }), [color, strength]);

    return (
        <group>
            {/* Viền fresnel (mặt trong) — tạo glow rìa */}
            <mesh geometry={GEO.sphere} material={rimMaterial} scale={radius} renderOrder={3} />
            {/* Mặt trước rất mờ — thấy có "lớp vỏ" nhưng vẫn nhìn xuyên vào trong */}
            <mesh geometry={GEO.sphere} scale={radius} renderOrder={2}>
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={opacity}
                    roughness={0.2}
                    metalness={0}
                    side={THREE.FrontSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
};
