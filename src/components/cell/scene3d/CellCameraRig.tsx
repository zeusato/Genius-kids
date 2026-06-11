import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraControls } from '@react-three/drei';
import { SimClock, BodyRegistry, Scene3DApi } from './core';
import { CellShapeSpec } from './cellScale';

interface CellCameraRigProps {
    focusedId: string | null;
    registry: React.MutableRefObject<BodyRegistry>;
    clock: SimClock;
    spec: CellShapeSpec;
    onFocusComplete: (id: string) => void;
    apiRef: React.MutableRefObject<Scene3DApi | null>;
}

// Port từ solar/CameraRig: drei CameraControls lo mọi cử chỉ (orbit/pinch/wheel);
// chọn bào quan → bay camera tới (setLookAt trả Promise) → tới nơi mới mở panel.
export const CellCameraRig: React.FC<CellCameraRigProps> = ({ focusedId, registry, clock, spec, onFocusComplete, apiRef }) => {
    const controlsRef = useRef<CameraControls>(null);

    useEffect(() => {
        apiRef.current = {
            zoomIn: () => controlsRef.current?.dolly(1.2, true),
            zoomOut: () => controlsRef.current?.dolly(-1.2, true)
        };
        return () => { apiRef.current = null; };
    }, [apiRef]);

    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;
        let cancelled = false;

        if (focusedId) {
            clock.timeScale = 0; // dừng chuyển động để mục tiêu đứng yên khi bay
            const entry = registry.current[focusedId];
            const target = new THREE.Vector3(0, 0, 0);
            let dist = spec.radius * 2.2;
            if (entry) {
                entry.object.getWorldPosition(target);
                dist = Math.max(entry.radius * 3.4, 2.4);
            }
            controls
                .setLookAt(target.x + dist * 0.4, target.y + dist * 0.45, target.z + dist * 0.95, target.x, target.y, target.z, true)
                .then(() => { if (!cancelled) onFocusComplete(focusedId); });
        } else {
            controls.setLookAt(spec.camera[0], spec.camera[1], spec.camera[2], 0, 0, 0, true);
        }
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedId]);

    return (
        <CameraControls
            ref={controlsRef}
            makeDefault
            smoothTime={0.55}
            minDistance={spec.minDistance}
            maxDistance={spec.maxDistance}
        />
    );
};
