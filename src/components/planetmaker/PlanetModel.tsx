import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { TerrainState, computeColors, MAX_TREES } from './terrainOps';
import { PlanetCosmetics } from './planetStore';
import { SHARED_SPHERE, texUrl } from '../solar/scene3d/core';
import { AtmosphereRim } from '../solar/scene3d/AtmosphereRim';
import { SaturnRings } from '../solar/scene3d/PlanetRings';

// Model hành tinh tự tạo (bán kính chuẩn = 1) — dùng chung cho Xưởng (editable,
// cập nhật buffer khi dirtyRef bật) và scene Hệ Mặt Trời (static, dirty 1 lần).
// Mọi cập nhật mesh đi qua useFrame + mutable ref, không setState per-frame.

export interface TerrainEvents {
    onPointerDown?: (e: any) => void;
    onPointerMove?: (e: any) => void;
    onPointerUp?: (e: any) => void;
    onPointerLeave?: (e: any) => void;
}

interface PlanetModelProps {
    terrain: TerrainState;
    seaLevel: number;
    cosmetics: PlanetCosmetics;
    dirtyRef: React.MutableRefObject<boolean>;
    spin?: boolean;
    terrainEvents?: TerrainEvents;
    children?: React.ReactNode; // ví dụ vòng cọ preview của editor
}

const noRaycast = () => null as any;
const UP = new THREE.Vector3(0, 1, 0);
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _m = new THREE.Matrix4();

function treeHash(i: number): number {
    const x = Math.sin(i * 91.7 + 47.3) * 43758.5453;
    return x - Math.floor(x);
}

// Mây tách component riêng để hook useTexture không bị điều kiện hoá
const CloudsSphere: React.FC = () => {
    const tex = useTexture(texUrl('earth_clouds'));
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.y += delta * 0.02;
    });
    return (
        <mesh ref={ref} geometry={SHARED_SPHERE} scale={1.16} raycast={noRaycast} renderOrder={2}>
            <meshStandardMaterial map={tex} transparent opacity={0.5} depthWrite={false} roughness={1} />
        </mesh>
    );
};

const MOON_ORBITS = [
    { r: 1.85, tilt: 0.35, speed: 0.35, size: 0.07, phase: 0 },
    { r: 2.35, tilt: -0.2, speed: 0.22, size: 0.055, phase: 2.4 }
];

const Moons: React.FC<{ count: number }> = ({ count }) => {
    const refs = useRef<(THREE.Group | null)[]>([]);
    useFrame((_, delta) => {
        refs.current.forEach((g, i) => {
            if (g) g.rotation.y += delta * MOON_ORBITS[i].speed;
        });
    });
    return (
        <>
            {MOON_ORBITS.slice(0, count).map((o, i) => (
                <group key={i} rotation-z={o.tilt} rotation-y={o.phase}>
                    <group ref={(el) => { refs.current[i] = el; }}>
                        <mesh geometry={SHARED_SPHERE} scale={o.size} position={[o.r, 0, 0]} raycast={noRaycast}>
                            <meshStandardMaterial color="#C9CCD4" roughness={1} metalness={0} />
                        </mesh>
                    </group>
                </group>
            ))}
        </>
    );
};

export const PlanetModel: React.FC<PlanetModelProps> = ({
    terrain, seaLevel, cosmetics, dirtyRef, spin, terrainEvents, children
}) => {
    const spinRef = useRef<THREE.Group>(null);
    const trunkRef = useRef<THREE.InstancedMesh>(null);
    const canopyRef = useRef<THREE.InstancedMesh>(null);
    const seaRef = useRef(seaLevel);

    // Geometry địa hình: buffer cấp phát 1 lần, refresh ghi đè khi dirty
    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setIndex(new THREE.BufferAttribute(terrain.index, 1));
        const pos = new THREE.BufferAttribute(new Float32Array(terrain.count * 3), 3);
        pos.setUsage(THREE.DynamicDrawUsage);
        g.setAttribute('position', pos);
        const col = new THREE.BufferAttribute(new Float32Array(terrain.count * 3), 3);
        col.setUsage(THREE.DynamicDrawUsage);
        g.setAttribute('color', col);
        return g;
    }, [terrain]);

    const treeGeos = useMemo(() => {
        const trunk = new THREE.CylinderGeometry(0.01, 0.014, 0.05, 5);
        trunk.translate(0, 0.025, 0);
        const canopy = new THREE.ConeGeometry(0.052, 0.105, 6);
        canopy.translate(0, 0.1, 0);
        return { trunk, canopy };
    }, []);

    useEffect(() => {
        return () => {
            geometry.dispose();
            treeGeos.trunk.dispose();
            treeGeos.canopy.dispose();
        };
    }, [geometry, treeGeos]);

    // Đổi mực nước → tô màu lại (không đổi vị trí đỉnh nhưng refresh chung cho gọn)
    useEffect(() => {
        seaRef.current = seaLevel;
        dirtyRef.current = true;
    }, [seaLevel, dirtyRef]);

    useFrame((_, delta) => {
        if (spin && spinRef.current) spinRef.current.rotation.y += delta * 0.05;
        if (!dirtyRef.current) return;
        dirtyRef.current = false;

        const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
        const col = geometry.getAttribute('color') as THREE.BufferAttribute;
        const posArr = pos.array as Float32Array;
        for (let i = 0; i < terrain.count; i++) {
            const r = 1 + terrain.elevation[i];
            posArr[i * 3] = terrain.dirs[i * 3] * r;
            posArr[i * 3 + 1] = terrain.dirs[i * 3 + 1] * r;
            posArr[i * 3 + 2] = terrain.dirs[i * 3 + 2] * r;
        }
        computeColors(terrain, seaRef.current, col.array as Float32Array);
        pos.needsUpdate = true;
        col.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        // Cây: matrix per-instance, cây chìm dưới nước thì scale 0 (bị "nhấn chìm")
        const trunk = trunkRef.current;
        const canopy = canopyRef.current;
        if (trunk && canopy) {
            const n = Math.min(terrain.trees.length, MAX_TREES);
            for (let k = 0; k < n; k++) {
                const vi = terrain.trees[k];
                const e = terrain.elevation[vi];
                _p.set(terrain.dirs[vi * 3], terrain.dirs[vi * 3 + 1], terrain.dirs[vi * 3 + 2]);
                _q.setFromUnitVectors(UP, _p);
                const sc = e < seaRef.current + 0.002 ? 0 : 0.65 + treeHash(vi) * 0.5;
                _s.setScalar(sc);
                _m.compose(_p.clone().multiplyScalar(1 + e - 0.005), _q, _s);
                trunk.setMatrixAt(k, _m);
                canopy.setMatrixAt(k, _m);
            }
            trunk.count = n;
            canopy.count = n;
            trunk.instanceMatrix.needsUpdate = true;
            canopy.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group>
            <group ref={spinRef}>
                {/* Địa hình — mesh duy nhất nhận raycast/sự kiện nặn */}
                <mesh geometry={geometry} {...(terrainEvents ?? {})}>
                    <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
                </mesh>

                {/* Đại dương — cầu trong mờ tại mực nước biển */}
                <mesh geometry={SHARED_SPHERE} scale={Math.max(0.85, 1 + seaLevel)} raycast={noRaycast} renderOrder={1}>
                    <meshStandardMaterial
                        color="#2E7CC7"
                        transparent
                        opacity={0.68}
                        roughness={0.18}
                        metalness={0}
                        depthWrite={false}
                    />
                </mesh>

                {/* Cây instanced — 2 mesh (thân + tán) dùng chung matrix */}
                <instancedMesh ref={trunkRef} args={[treeGeos.trunk, undefined, MAX_TREES]} raycast={noRaycast} frustumCulled={false}>
                    <meshStandardMaterial color="#6B4A2F" roughness={1} metalness={0} />
                </instancedMesh>
                <instancedMesh ref={canopyRef} args={[treeGeos.canopy, undefined, MAX_TREES]} raycast={noRaycast} frustumCulled={false}>
                    <meshStandardMaterial color="#2F7A3A" roughness={0.9} metalness={0} />
                </instancedMesh>

                {cosmetics.clouds && <CloudsSphere />}
                {cosmetics.rings && <SaturnRings radius={1} />}
            </group>

            {/* Khí quyển + mặt trăng không xoay theo hành tinh (đứng yên/quỹ đạo riêng) */}
            {cosmetics.atmosphere && (
                <AtmosphereRim radius={1.14} color={cosmetics.atmosphere} strength={0.85} />
            )}
            <Moons count={cosmetics.moons} />

            {children}
        </group>
    );
};
