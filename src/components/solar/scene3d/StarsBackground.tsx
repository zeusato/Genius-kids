import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { texUrl } from './core';

// Nền dải Ngân Hà (texture equirectangular từ Solar System Scope, dẫn xuất ảnh NASA/Gaia)
// gắn vào scene.background — 0 draw call thêm, đẹp hơn hàng nghìn point của drei <Stars>
// trên GPU tablet yếu. Màn hình nhỏ dùng bản 2K.
export function StarsBackground({ quality = 'high' as 'high' | 'low' }) {
    const small =
        quality === 'low' ||
        (typeof window !== 'undefined' && window.innerWidth * window.devicePixelRatio < 1600);
    const tex = useTexture(texUrl(small ? 'stars_2k' : 'stars_4k'));
    const scene = useThree((s) => s.scene);

    useEffect(() => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = tex;
        scene.backgroundIntensity = 0.7;
        return () => {
            scene.background = null;
        };
    }, [tex, scene]);

    return null;
}
