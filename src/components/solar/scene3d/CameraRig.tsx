import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraControls } from '@react-three/drei';
import { SimClock, BodyRegistry, Scene3DApi } from './core';
import { SUN_RADIUS, HOME_CAMERA_POSITION, HOME_CAMERA_TARGET } from './scale';

interface CameraRigProps {
    focusedId: string | null;
    registry: React.MutableRefObject<BodyRegistry>;
    clock: SimClock;
    onFocusComplete: (id: string) => void;
    apiRef: React.MutableRefObject<Scene3DApi | null>;
}

// CameraControls (drei) đảm nhận TOÀN BỘ cử chỉ: 1 ngón xoay, 2 ngón pinch zoom + pan,
// wheel zoom. Fly-to khi chọn hành tinh: setLookAt trả Promise — bay xong mới mở modal.
// timeScale=0 trước khi bay để hành tinh không trôi khỏi khung hình.
export const CameraRig: React.FC<CameraRigProps> = ({
    focusedId,
    registry,
    clock,
    onFocusComplete,
    apiRef
}) => {
    const controlsRef = useRef<CameraControls>(null);

    // Expose zoom +/- cho nút bấm quen thuộc trên page (giữ song song với pinch)
    useEffect(() => {
        apiRef.current = {
            zoomIn: () => controlsRef.current?.dolly(8, true),
            zoomOut: () => controlsRef.current?.dolly(-8, true)
        };
        return () => {
            apiRef.current = null;
        };
    }, [apiRef]);

    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;
        let cancelled = false;

        if (focusedId) {
            // Dừng mô phỏng để mục tiêu đứng yên trong suốt chuyến bay
            clock.timeScale = 0;

            const target = new THREE.Vector3(0, 0, 0);
            let dist = SUN_RADIUS * 6;

            if (focusedId !== 'sun') {
                const entry = registry.current[focusedId];
                if (!entry) {
                    onFocusComplete(focusedId);
                    return;
                }
                entry.object.getWorldPosition(target);
                dist = Math.max(entry.radius * 6.5, 3.2);
            }

            controls
                .setLookAt(
                    target.x + dist * 0.45,
                    target.y + dist * 0.4,
                    target.z + dist * 0.85,
                    target.x,
                    target.y,
                    target.z,
                    true
                )
                .then(() => {
                    if (!cancelled) onFocusComplete(focusedId);
                });
        } else {
            // Quay về góc nhìn toàn hệ (page tự khôi phục timeScale theo tốc độ UI)
            controls.setLookAt(
                HOME_CAMERA_POSITION[0],
                HOME_CAMERA_POSITION[1],
                HOME_CAMERA_POSITION[2],
                HOME_CAMERA_TARGET[0],
                HOME_CAMERA_TARGET[1],
                HOME_CAMERA_TARGET[2],
                true
            );
        }

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedId]);

    return (
        <CameraControls
            ref={controlsRef}
            makeDefault
            smoothTime={0.6}
            minDistance={6}
            maxDistance={140}
            maxPolarAngle={1.45}
        />
    );
};
