import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { texUrl } from './core';

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

// Vành Sao Thổ: texture alpha thật (băng + khe Cassini), thay border-div CSS cũ.
// Đặt trong group nghiêng 26.7° của hành tinh → vành nghiêng theo, đúng vật lý.
export const SaturnRings: React.FC<{ radius: number }> = ({ radius }) => {
    const ringTex = useTexture(texUrl('saturn_ring'));
    ringTex.colorSpace = THREE.SRGBColorSpace;

    const geometry = useMemo(
        () => makeRingGeometry(radius * 1.4, radius * 2.3),
        [radius]
    );

    return (
        <mesh geometry={geometry} rotation-x={-Math.PI / 2} renderOrder={1}>
            <meshBasicMaterial
                map={ringTex}
                side={THREE.DoubleSide}
                transparent
                alphaTest={0.05}
                depthWrite={false}
                opacity={0.96}
            />
        </mesh>
    );
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
