import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BodyRegistry } from './core';
import { PLANET_FEATURES, featureLocalPosition } from './astro';
import { prefersReducedMotion } from './sceneParams';

interface FeatureSpotlightProps {
    registry: React.MutableRefObject<BodyRegistry>;
    bodyId: string | null; // hành tinh vừa tới nơi (null = không có)
}

// Thuyết minh khớp hình: tới Sao Mộc thì Vết Đỏ Lớn XOAY ra trước mặt, tới Trái Đất thì Việt Nam
// ra giữa kèm ghim "📍 Việt Nam mình ở đây", Sao Hỏa → núi lửa Olympus. Xoay nhóm tự quay của
// hành tinh (mô phỏng đang dừng khi tới nơi nên hành tinh đứng yên, địa danh giữ nguyên chỗ).
export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({ registry, bodyId }) => {
    const camera = useThree((s) => s.camera);
    const markerRef = useRef<THREE.Group>(null);
    const anim = useRef<{ from: number; to: number; t: number; dur: number } | null>(null);
    const [visible, setVisible] = useState(false);
    const feature = bodyId ? PLANET_FEATURES[bodyId] : undefined;
    const local = useMemo(() => (feature ? new THREE.Vector3(...featureLocalPosition(feature)) : null), [feature]);
    const tmp = useMemo(() => ({ v: new THREE.Vector3(), m: new THREE.Matrix4() }), []);

    useEffect(() => {
        setVisible(false);
        anim.current = null;
        if (!bodyId || !local) return;
        const entry = registry.current[bodyId];
        const spin = entry?.spinGroup;
        const tilt = spin?.parent;
        if (!spin || !tilt) return;
        // hướng camera trong khung của group nghiêng (trục quay = Y cục bộ)
        tilt.updateWorldMatrix(true, false);
        tmp.m.copy(tilt.matrixWorld).invert();
        const camLocal = camera.position.clone().applyMatrix4(tmp.m);
        const camAz = Math.atan2(-camLocal.z, camLocal.x);
        const featAz = Math.atan2(-local.z, local.x);
        // xoay quanh +Y một góc θ: phương vị α → α + θ
        let delta = camAz - featAz - spin.rotation.y;
        delta = ((delta % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI; // đường ngắn nhất
        anim.current = { from: spin.rotation.y, to: spin.rotation.y + delta, t: 0, dur: prefersReducedMotion() ? 0.01 : 1.4 };
    }, [bodyId, local, registry, camera, tmp]);

    useFrame((_, dt) => {
        if (!bodyId || !local) return;
        const entry = registry.current[bodyId];
        const spin = entry?.spinGroup;
        if (!spin) return;
        const a = anim.current;
        if (a && a.t < 1) {
            a.t = Math.min(1, a.t + dt / a.dur);
            const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2;
            spin.rotation.y = a.from + (a.to - a.from) * e;
            if (a.t >= 1) setVisible(true);
        }
        if (markerRef.current) {
            tmp.v.copy(local).multiplyScalar(entry.radius * 1.03);
            spin.localToWorld(tmp.v);
            markerRef.current.position.copy(tmp.v);
        }
    });

    if (!feature) return null;
    return (
        <group ref={markerRef}>
            {visible && (
                <Html center zIndexRange={[45, 0]} wrapperClass="pointer-events-none">
                    <div className="flex flex-col items-center -translate-y-1/2 animate-in fade-in zoom-in-75 duration-500">
                        <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-white bg-black/60 backdrop-blur-sm border border-yellow-300/50 whitespace-nowrap shadow-lg">
                            {feature.label}
                        </span>
                        <span className="w-px h-5 bg-yellow-300/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.9)] animate-pulse" />
                    </div>
                </Html>
            )}
        </group>
    );
};
