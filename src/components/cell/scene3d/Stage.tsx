import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { GLSL_NOISE } from '../../solar/scene3d/glslNoise';
import { SHARED_TIME } from './core';

// Bảng màu "đại dương" bên ngoài tế bào theo loại mẫu vật
export interface StagePalette {
    top: string;
    mid: string;
    bottom: string;
    fog: string;
    glow: string; // màu các đốm mờ xa xa
}

export const STAGE_PALETTES: Record<string, StagePalette> = {
    animal: { top: '#1d2f5c', mid: '#113f55', bottom: '#050c18', fog: '#0f3346', glow: '#3fb6c9' },
    plant: { top: '#123d45', mid: '#0f4536', bottom: '#04120d', fog: '#0e3a30', glow: '#58c98a' },
    bacteria: { top: '#262a4d', mid: '#35361f', bottom: '#0b0906', fog: '#2c2f25', glow: '#d8b25a' }
};

// Nền vòm gradient (bám theo camera — luôn "xa vô tận") + đốm mờ trôi chậm như tế bào lân cận
// ngoài tiêu cự. Không texture, không cubemap (bài học VRAM của solar/StarsBackground).
function BackgroundDome({ palette }: { palette: StagePalette }) {
    const ref = useRef<THREE.Mesh>(null);
    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTop: { value: new THREE.Color(palette.top) },
            uMid: { value: new THREE.Color(palette.mid) },
            uBottom: { value: new THREE.Color(palette.bottom) },
            uGlow: { value: new THREE.Color(palette.glow) },
            uTime: SHARED_TIME
        },
        vertexShader: /* glsl */`
            varying vec3 vDir;
            void main() {
                vDir = normalize(position);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uTop;
            uniform vec3 uMid;
            uniform vec3 uBottom;
            uniform vec3 uGlow;
            uniform float uTime;
            varying vec3 vDir;
            ${GLSL_NOISE}
            void main() {
                vec3 d = normalize(vDir);
                vec3 col = mix(uMid, uTop, smoothstep(0.0, 0.85, d.y));
                col = mix(col, uBottom, smoothstep(0.0, -0.8, d.y));
                float n = snoise(d * 2.2 + vec3(0.0, uTime * 0.012, uTime * 0.006)) * 0.5 + 0.5;
                float m = snoise(d * 5.5 - vec3(uTime * 0.01, 0.0, 0.0)) * 0.5 + 0.5;
                col += uGlow * (0.22 * smoothstep(0.62, 0.95, n) + 0.08 * smoothstep(0.7, 1.0, m));
                gl_FragColor = vec4(col, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false
    }), [palette]);

    useFrame(({ camera }) => {
        if (ref.current) ref.current.position.copy(camera.position);
    });

    return <mesh ref={ref} material={material} scale={150} renderOrder={-10} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[1, 48, 32]} />
    </mesh>;
}

// Ánh sáng: đèn chính ấm từ trên-trước, hai đèn viền lạnh/hồng từ phía sau tạo khối và viền sáng
// cho vật liệu trong mờ. Environment dựng từ Lightformer (0 byte tải, render 1 lần) cho phản chiếu
// bóng ướt trên clearcoat.
export const Stage: React.FC<{ cellId: string }> = ({ cellId }) => {
    const palette = STAGE_PALETTES[cellId] ?? STAGE_PALETTES.animal;
    return (
        <>
            <fogExp2 attach="fog" args={[palette.fog, 0.016]} />
            <BackgroundDome palette={palette} />
            <hemisphereLight args={['#d6f3ff', '#0b2533', 0.55]} />
            <directionalLight position={[4, 6, 5]} intensity={1.9} color="#fff2e2" />
            <directionalLight position={[-6, 1.5, -5]} intensity={1.25} color="#7df3ff" />
            <directionalLight position={[5, -3, -4]} intensity={0.6} color="#ff9ad8" />
            <Environment resolution={128} frames={1} background={false}>
                <Lightformer form="rect" intensity={2.4} color="#fff4e6" position={[0, 5, 6]} scale={[10, 4, 1]} target={[0, 0, 0]} />
                <Lightformer form="circle" intensity={1.6} color="#88f6ff" position={[-7, 2, -4]} scale={5} target={[0, 0, 0]} />
                <Lightformer form="rect" intensity={1.1} color="#ff8ad6" position={[7, -1, -3]} scale={[4, 7, 1]} target={[0, 0, 0]} />
                <Lightformer form="rect" intensity={0.5} color="#1f7d92" position={[0, -7, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
                <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[3, 3, -7]} scale={3} target={[0, 0, 0]} />
            </Environment>
        </>
    );
};
