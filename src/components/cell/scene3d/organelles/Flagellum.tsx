import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { colorize, merge } from '../geo';
import { Vec3 } from '../noise';

export interface FlagellumSpec {
    base: Vec3;      // chân roi trên vỏ (local tế bào)
    dir: Vec3;       // hướng roi mọc ra
    length: number;
    amp: number;     // biên độ xoắn
    pitch: number;   // bước xoắn
}

// Sợi roi xoắn lò xo: biên độ tăng dần từ chân (móc) ra ngọn. Quay cả sợi quanh trục của nó →
// sóng xoắn "chạy" dọc sợi như chân vịt — đúng cách roi vi khuẩn đẩy tế bào đi.
function filamentGeometry(length: number, amp: number, pitch: number): THREE.BufferGeometry {
    const pts: THREE.Vector3[] = [];
    const n = 140;
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = t * length;
        const ramp = Math.min(1, t * 5);
        const a = (x / pitch) * Math.PI * 2;
        pts.push(new THREE.Vector3(x, Math.sin(a) * amp * ramp, Math.cos(a) * amp * ramp));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.028, 6, false);
}

// Động cơ ở chân roi: các vòng protein xếp chồng xuyên qua màng và thành (nhìn thấy ở mặt cắt)
function motorGeometry(): THREE.BufferGeometry {
    return merge([
        colorize(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20).rotateZ(Math.PI / 2).translate(-0.02, 0, 0), '#f59e0b'),
        colorize(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 20).rotateZ(Math.PI / 2).translate(0.07, 0, 0), '#fbbf24'),
        colorize(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20).rotateZ(Math.PI / 2).translate(0.15, 0, 0), '#fcd34d'),
        colorize(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 8).rotateZ(Math.PI / 2).translate(0.12, 0, 0), '#fde68a'),
        colorize(new THREE.TorusGeometry(0.07, 0.025, 8, 16, Math.PI * 0.8).rotateY(Math.PI / 2).translate(0.28, 0.05, 0), '#eab308')
    ], ['position', 'normal', 'color']);
}

interface FlagellaProps {
    specs: FlagellumSpec[];
    color: string;
    speed?: number; // rad/s
}

export const Flagella: React.FC<FlagellaProps> = ({ specs, color, speed = 9 }) => {
    const { tier, clock } = useCellCtx();
    const focus = useFocus('flagellum');
    const handlers = useSelectHandlers('flagellum');
    const fx = useMemo(() => createFx('#fefce8'), []);
    const mat = useMemo(() => createOrganicMaterial({
        color, roughness: 0.3, clearcoat: 0.8, sheen: 0.4, sheenColor: '#fef9c3', emissive: '#ca8a04', emissiveIntensity: 0.3, fx
    }, tier).material, [color, tier, fx]);
    const motorMat = useMemo(() => createOrganicMaterial({
        color: '#ffffff', vertexColors: true, roughness: 0.35, clearcoat: 0.6, emissive: '#f59e0b', emissiveIntensity: 0.35, fx
    }, tier).material, [tier, fx]);
    const filaments = useMemo(() => specs.map((s) => filamentGeometry(s.length, s.amp, s.pitch)), [specs]);
    const motor = useMemo(() => motorGeometry(), []);
    useDisposable(mat, motorMat, motor, ...filaments);
    const quats = useMemo(() => specs.map((s) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(...s.dir).normalize())), [specs]);
    const spinRefs = useRef<(THREE.Group | null)[]>([]);
    const anchor = useRef<THREE.Object3D>(null);
    useRegister('flagellum', anchor, 1.1);
    const labelPos = useMemo<Vec3>(() => {
        const s = specs[0];
        const d = new THREE.Vector3(...s.dir).normalize();
        return new THREE.Vector3(...s.base).addScaledVector(d, s.length * 0.45).toArray() as Vec3;
    }, [specs]);

    useFrame((st, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.3 * Math.sin(st.clock.elapsedTime * 3) : 0);
        // đang được chọn: quay nhanh gấp đôi cho bé thấy rõ "chân vịt"
        const w = speed * (focus === 'this' ? 2 : 1) * clock.timeScale;
        spinRefs.current.forEach((g, i) => {
            if (g) g.rotation.x += Math.min(delta, 0.1) * w * (i % 2 ? 0.93 : 1);
        });
    });

    return (
        <group>
            <object3D ref={anchor} position={labelPos} />
            {specs.map((s, i) => (
                <group key={i} position={s.base} quaternion={quats[i]}>
                    <mesh geometry={motor} material={motorMat} position={[-0.3, 0, 0]} {...handlers} />
                    <group ref={(g) => { spinRefs.current[i] = g; }}>
                        <mesh geometry={filaments[i]} material={mat} {...handlers} />
                    </group>
                    <mesh visible={false} position={[s.length * 0.5, 0, 0]} scale={[s.length * 0.5, s.amp * 2.4, s.amp * 2.4]} {...handlers}>
                        <sphereGeometry args={[1, 12, 8]} />
                        <meshBasicMaterial side={THREE.BackSide} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};
