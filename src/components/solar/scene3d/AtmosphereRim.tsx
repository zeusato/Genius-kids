import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SHARED_SPHERE } from './core';

interface AtmosphereRimProps {
    radius: number;
    color: string;
    strength?: number;
    geometry?: THREE.BufferGeometry;
}

// Viền khí quyển fresnel — shader ~10 dòng, "wow rẻ nhất" trong scene.
// Sphere BackSide scale 1.07, additive, depthWrite off.
export const AtmosphereRim: React.FC<AtmosphereRimProps> = ({ radius, color, strength = 0.9, geometry = SHARED_SPHERE }) => {
    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(color) },
            uStrength: { value: strength }
        },
        vertexShader: /* glsl */`
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalize(normalMatrix * normal);
                vViewDir = normalize(-mvPosition.xyz);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uColor;
            uniform float uStrength;
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
                float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 3.0);
                gl_FragColor = vec4(uColor, fres * uStrength);
            }
        `,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }), [color, strength]);

    return <mesh geometry={geometry} material={material} scale={radius * 1.07} renderOrder={2} />;
};

// Màu khí quyển theo màu thật NASA
export const ATMOSPHERE_COLORS: Record<string, string> = {
    earth: '#6FA8DC',
    venus: '#E8DCC3',
    mars: '#D98559',
    neptune: '#8FBDD3',
    uranus: '#ACD8D8'
};
