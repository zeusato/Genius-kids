import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import type { EvoWorld } from './world';
import { playWhoosh } from '../../solar/sfx';

export interface Insets { right: number; bottom: number }
export interface CameraApi {
    fitBox(box: [number, number, number, number], animate?: boolean, pad?: number): void;
    fitAll(animate?: boolean): void;
    flyToNode(i: number, subtree?: boolean): void;
    /** đơn vị thế giới trên mỗi pixel ở mặt phẳng cây */
    worldPerPixel(): number;
    shake(seconds: number): void;
    zoomBy(dir: 1 | -1): void;
    fitNodes(is: number[], pad?: number): void;
    focus(i: number, radius: number): void;
    /** Khung nhìn hiện tại trên mặt phẳng cây (cho bản đồ nhỏ). */
    view(): { cx: number; cy: number; halfW: number; halfH: number };
    /** Dời camera tới điểm (giữ độ zoom). */
    panTo(x: number, y: number, animate?: boolean): void;
}

const FOV = 30;
const TAN = Math.tan((FOV / 2) * Math.PI / 180);

export function CameraRig({ world, insets, apiRef, reducedMotion }: {
    world: EvoWorld; insets: React.MutableRefObject<Insets>; apiRef: React.MutableRefObject<CameraApi | null>; reducedMotion: boolean;
}) {
    const controls = useRef<CameraControlsImpl>(null);
    const { size, camera } = useThree();
    const fitDist = useRef(3000);
    const shakeT = useRef(0);

    const distFor = (w: number, h: number, pad: number) => {
        const availW = Math.max(120, size.width - insets.current.right), availH = Math.max(120, size.height - insets.current.bottom);
        const aspect = availW / availH;
        return Math.max(h / (2 * TAN), w / (2 * TAN * aspect)) * pad * (size.height / availH);
    };

    const fitBox = (box: [number, number, number, number], animate = true, pad = 1.12) => {
        const c = controls.current;
        if (!c) return;
        const [x0, y0, x1, y1] = box;
        const w = Math.max(40, x1 - x0), h = Math.max(40, y1 - y0);
        const d = THREE.MathUtils.clamp(distFor(w, h, pad), c.minDistance, c.maxDistance);
        const wpp = (2 * d * TAN) / size.height;
        const tx = (x0 + x1) / 2 + (insets.current.right / 2) * wpp;
        const ty = (y0 + y1) / 2 - (insets.current.bottom / 2) * wpp;
        c.setLookAt(tx, ty, d, tx, ty, 0, animate);
    };

    useEffect(() => {
        const c = controls.current;
        if (!c) return;
        const A = CameraControlsImpl.ACTION;
        c.mouseButtons.left = A.TRUCK; c.mouseButtons.right = A.TRUCK; c.mouseButtons.middle = A.NONE; c.mouseButtons.wheel = A.DOLLY;
        c.touches.one = A.TOUCH_TRUCK; c.touches.two = A.TOUCH_DOLLY_TRUCK; c.touches.three = A.NONE;
        c.dollyToCursor = true;
        c.minPolarAngle = c.maxPolarAngle = Math.PI / 2;
        c.minAzimuthAngle = c.maxAzimuthAngle = 0;
        c.smoothTime = 0.35; c.draggingSmoothTime = 0.1;
        c.minDistance = 30;
    }, []);

    // khung vừa cả quạt + giới hạn kéo
    useEffect(() => {
        const c = controls.current;
        if (!c) return;
        const [x0, y0, x1, y1] = world.bounds();
        fitDist.current = distFor(x1 - x0, y1 - y0, 1.06);
        c.maxDistance = fitDist.current * 1.35;
        const m = 0.15 * (x1 - x0);
        c.setBoundary(new THREE.Box3(new THREE.Vector3(x0 - m, y0 - m, -1), new THREE.Vector3(x1 + m, y1 + m, 1)));
        (camera as THREE.PerspectiveCamera).far = fitDist.current * 4;
        camera.updateProjectionMatrix();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.width, size.height, world, world.orientation]);

    apiRef.current = {
        fitBox,
        fitAll: (animate = true) => fitBox(world.bounds(), animate, 1.04),
        view: () => {
            const d = Math.max(1, camera.position.z);
            const halfH = d * TAN;
            return { cx: camera.position.x, cy: camera.position.y, halfW: halfH * (size.width / size.height), halfH };
        },
        panTo: (x, y, animate = true) => {
            const c = controls.current;
            if (!c) return;
            c.setLookAt(x, y, c.distance, x, y, 0, animate);
        },
        flyToNode: (i, subtree = true) => {
            const n = world.tree.nodes[i];
            let box: [number, number, number, number];
            if (subtree && !n.isLeaf) box = world.subtreeBox(i);
            else {
                const x = world.nodePos[i * 2], y = world.nodePos[i * 2 + 1];
                const r = Math.max(170, world.tipR[i] * 10);
                box = [x - r, y - r, x + r, y + r];
            }
            fitBox(box, true, 1.2);
            playWhoosh();
        },
        worldPerPixel: () => (2 * Math.max(1, camera.position.z) * TAN) / size.height,
        shake: (s) => { if (!reducedMotion) shakeT.current = s; },
        zoomBy: (dir) => { const c = controls.current; if (c) c.dolly(c.distance * (dir > 0 ? 0.4 : -0.6), true); },
        fitNodes: (is, pad = 1.35) => {
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const i of is) { const x = world.nodePos[i * 2], y = world.nodePos[i * 2 + 1]; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
            const m = 60; fitBox([x0 - m, y0 - m, x1 + m, y1 + m], true, pad);
        },
        focus: (i, radius) => { const x = world.nodePos[i * 2], y = world.nodePos[i * 2 + 1]; fitBox([x - radius, y - radius, x + radius, y + radius], true, 1); },
    };

    useFrame((_, dt) => {
        const dist = Math.max(1, camera.position.z);
        world.uniforms.uPxPerUnit.value = size.height / (2 * dist * TAN);
        if (shakeT.current > 0) {
            shakeT.current = Math.max(0, shakeT.current - dt);
            const k = shakeT.current * dist * 0.004;
            camera.position.x += (Math.random() - 0.5) * k;
            camera.position.y += (Math.random() - 0.5) * k;
        }
    });

    return <CameraControls ref={controls} makeDefault />;
}

export { FOV };
