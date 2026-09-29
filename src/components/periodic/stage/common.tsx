import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { QualityTier } from './params';

/** Giá trị thay đổi theo frame truyền qua ref (không setState theo frame). */
export interface Live<T> { current: T }

/**
 * Nhóm có độ hiện `vis` (0..1) và độ phóng `scale` đọc từ hàm mỗi frame. Mọi material con phải transparent
 * TỪ ĐẦU (đổi opaque ↔ transparent = biên dịch lại shader) — FadeGroup tự bật transparent lúc mount và nhớ
 * opacity gốc trong userData.
 */
export const FadeGroup: React.FC<React.PropsWithChildren<{ get: () => { vis: number; scale: number }; name?: string }>> = ({ get, children }) => {
    const g = useRef<THREE.Group>(null);
    const mats = useRef<THREE.Material[]>([]);
    const collect = () => {
        const list: THREE.Material[] = [];
        g.current?.traverse(o => {
            const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
            if (!m) return;
            (Array.isArray(m) ? m : [m]).forEach(x => {
                if (x.userData.baseOpacity === undefined) { x.userData.baseOpacity = x.opacity; x.transparent = true; x.needsUpdate = true; }
                list.push(x);
            });
        });
        mats.current = list;
    };
    useLayoutEffect(collect);
    useFrame(() => {
        const o = g.current;
        if (!o) return;
        const { vis, scale } = get();
        o.visible = vis > 0.01;
        o.scale.setScalar(scale);
        if (!o.visible) return;
        for (const m of mats.current) m.opacity = (m.userData.baseOpacity as number) * vis;
    });
    return <group ref={g}>{children}</group>;
};

/** Vật liệu kim loại/đá theo tier: Physical ở tier cao, Standard ở tier thấp. */
export function useSurface(tier: QualityTier, p: { color: string; metal: boolean; roughness: number; emissive?: string; emissiveIntensity?: number; iridescence?: number }) {
    return useMemo(() => {
        const common = { color: new THREE.Color(p.color), metalness: p.metal ? 1 : 0.05, roughness: p.roughness, transparent: true,
            emissive: new THREE.Color(p.emissive ?? '#000000'), emissiveIntensity: p.emissiveIntensity ?? 0 };
        const m = tier === 'high'
            ? new THREE.MeshPhysicalMaterial({ ...common, clearcoat: p.metal ? 0 : 0.3, iridescence: p.iridescence ?? 0, iridescenceIOR: 1.6, iridescenceThicknessRange: [120, 480] })
            : new THREE.MeshStandardMaterial(common);
        return m;
    }, [tier, p.color, p.metal, p.roughness, p.emissive, p.emissiveIntensity, p.iridescence]);
}

/** Thủy tinh giả (không transmission — rẻ): mờ, phản chiếu môi trường. */
export function useGlass(tier: QualityTier, tint = '#ffffff', opacity = 0.16) {
    return useMemo(() => tier === 'high'
        ? new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: 0.03, transparent: true, opacity, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 })
        : new THREE.MeshStandardMaterial({ color: tint, metalness: 0.1, roughness: 0.05, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }),
    [tier, tint, opacity]);
}

// Quầng sáng rẻ: fresnel ngược, cộng màu. Dùng cho ống neon, ngọn lửa, mẫu phóng xạ (tier thấp không có bloom).
const HALO_VS = `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const HALO_FS = `uniform vec3 uColor; uniform float uStrength; varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(max(dot(normalize(vN), normalize(vV)), 0.), 2.5); gl_FragColor = vec4(uColor*f*uStrength, f*uStrength);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export function makeHalo(color: string, strength = 0.6) {
    return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
        vertexShader: HALO_VS, fragmentShader: HALO_FS,
    });
}

/** Họa tiết chấm tròn mềm cho Points. */
let dotTex: THREE.Texture | null = null;
export function softDot(): THREE.Texture {
    if (dotTex) return dotTex;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    dotTex = new THREE.CanvasTexture(c);
    return dotTex;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
