import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { createNoise3, createRandom, Vec3 } from '../noise';
import { colorize, merge } from '../geo';
import { getVesicleGeometry } from './shared';

interface GolgiProps {
    position: Vec3;
    axis: Vec3;        // hướng mặt "trans" (mặt lõm, phía gửi hàng đi) — ngược phía nhân
    scale?: number;
    seed: string;
    colors?: [string, string]; // mặt cis → mặt trans
}

// Mặt cắt một túi dẹt: mỏng ở giữa, phình ở mép (như bánh rán dẹt) — quay quanh trục Y
const PROFILE: [number, number][] = [
    [0, 0.05], [0.3, 0.05], [0.6, 0.053], [0.8, 0.062], [0.9, 0.09], [0.97, 0.1],
    [1.02, 0.065], [1.04, 0], [1.02, -0.065],
    [0.97, -0.1], [0.9, -0.09], [0.8, -0.062], [0.6, -0.053], [0.3, -0.05], [0, -0.05]
];

interface VesicleSpot { pos: THREE.Vector3; r: number; phase: number }

function buildGolgi(seed: string, high: boolean, colors: [string, string]) {
    const noise = createNoise3(`${seed}-golgi`);
    const rand = createRandom(`${seed}-golgi`);
    const radii = [0.26, 0.34, 0.39, 0.41, 0.37, 0.29];
    const spacing = 0.078;
    const kappa = 1.15;
    const cis = new THREE.Color(colors[0]), trans = new THREE.Color(colors[1]);
    const parts: THREE.BufferGeometry[] = [];
    const vesicles: VesicleSpot[] = [];
    radii.forEach((R, i) => {
        const pts = PROFILE.map(([x, y]) => new THREE.Vector2(x * R, y * 0.32));
        const g = new THREE.LatheGeometry(pts, high ? 48 : 30);
        const p = g.attributes.position as THREE.BufferAttribute;
        const y0 = (i - (radii.length - 1) / 2) * spacing;
        for (let k = 0; k < p.count; k++) {
            const x = p.getX(k), z = p.getZ(k);
            const bend = kappa * (x * x + z * z);
            const wob = 0.012 * noise(x * 6 + i, z * 6, i * 1.3);
            p.setY(k, p.getY(k) + y0 + bend + wob);
        }
        g.computeVertexNormals();
        const col = cis.clone().lerp(trans, i / (radii.length - 1));
        parts.push(colorize(g, col));
        // túi tiết nảy ra ở mép
        const n = i === radii.length - 1 ? 4 : 2;
        for (let v = 0; v < n; v++) {
            const a = rand() * Math.PI * 2;
            const rr = R * (1.08 + rand() * 0.1);
            const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
            vesicles.push({ pos: new THREE.Vector3(x, y0 + kappa * rr * rr * 0.92 + (rand() - 0.5) * 0.02, z), r: 0.028 + rand() * 0.018, phase: rand() * 6.28 });
        }
    });
    // vài túi vừa tách khỏi mặt trans, lơ lửng phía trên
    for (let v = 0; v < 5; v++) {
        const a = rand() * Math.PI * 2, rr = rand() * 0.3;
        vesicles.push({
            pos: new THREE.Vector3(Math.cos(a) * rr, (radii.length / 2) * spacing + 0.2 + rand() * 0.18, Math.sin(a) * rr),
            r: 0.035 + rand() * 0.015,
            phase: rand() * 6.28
        });
    }
    return { stack: merge(parts, ['position', 'normal', 'color']), vesicles, top: (radii.length / 2) * spacing + 0.35 };
}

// Bộ máy Golgi: chồng 6 túi dẹt cong như chồng bánh kếp úp, đổi màu từ mặt nhận hàng (cis, cam
// đậm) sang mặt gửi hàng (trans, cam nhạt); túi tiết phập phồng ở mép và tách ra ở mặt trans.
export const Golgi: React.FC<GolgiProps> = ({ position, axis, scale = 1, seed, colors = ['#fb7a1e', '#fde68a'] }) => {
    const { tier } = useCellCtx();
    const high = tier === 'high';
    const focus = useFocus('golgi');
    const handlers = useSelectHandlers('golgi');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const geo = useMemo(() => buildGolgi(seed, high, colors), [seed, high]);
    const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...axis).normalize()),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [axis[0], axis[1], axis[2]]);

    const fx = useMemo(() => createFx('#fff7ed'), []);
    const stackMat = useMemo(() => createOrganicMaterial({
        color: '#ffffff', vertexColors: true, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.2,
        sheen: 0.6, sheenColor: '#ffedd5', emissive: '#f97316', emissiveIntensity: 0.22, fx
    }, tier).material, [tier, fx]);
    const vesMat = useMemo(() => createOrganicMaterial({
        color: '#fdba74', roughness: 0.2, clearcoat: 1, emissive: '#fb923c', emissiveIntensity: 0.3,
        jelly: { center: 0.55, edge: 0.95 }, fx
    }, tier).material, [tier, fx]);

    useDisposable(geo.stack, stackMat, vesMat);

    const vesRef = useRef<THREE.InstancedMesh>(null);
    const tmpM = useMemo(() => new THREE.Matrix4(), []);
    const tmpS = useMemo(() => new THREE.Vector3(), []);
    const tmpQ = useMemo(() => new THREE.Quaternion(), []);

    useEffect(() => {
        vesRef.current?.computeBoundingSphere();
    }, [geo]);

    const anchor = useRef<THREE.Object3D>(null);
    const center = useRef<THREE.Group>(null);
    useRegister('golgi', center, 0.5 * scale, anchor);

    useFrame((state, delta) => {
        dampFx(fx, focus, delta, focus === 'this' ? 0.2 * Math.sin(state.clock.elapsedTime * 2.4) : 0);
        const m = vesRef.current;
        if (!m) return;
        const t = state.clock.elapsedTime;
        geo.vesicles.forEach((v, i) => {
            // túi "thở" nhẹ, đang được chọn thì phồng rõ như sắp tách ra
            const k = 1 + (focus === 'this' ? 0.18 : 0.06) * Math.sin(t * 2 + v.phase);
            tmpS.setScalar(v.r * k);
            tmpM.compose(v.pos, tmpQ, tmpS);
            m.setMatrixAt(i, tmpM);
        });
        m.instanceMatrix.needsUpdate = true;
    });

    return (
        <group position={position} quaternion={quat} scale={scale}>
            <group ref={center} />
            <object3D ref={anchor} position={[0, geo.top, 0]} />
            <mesh geometry={geo.stack} material={stackMat} {...handlers} />
            <instancedMesh ref={vesRef} args={[getVesicleGeometry(), vesMat, geo.vesicles.length]} {...handlers} />
            {/* vùng chạm to hơn hình (ngón tay trẻ) */}
            <mesh visible={false} {...handlers} scale={[0.55, 0.4, 0.55]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshBasicMaterial side={THREE.BackSide} />
            </mesh>
        </group>
    );
};
