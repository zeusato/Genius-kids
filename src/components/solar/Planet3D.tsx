import React, { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { PlanetData } from '../../data/solarData';
import { DETAIL_SPHERE, getGlowTexture, texUrl } from './scene3d/core';
import { AtmosphereRim, ATMOSPHERE_COLORS } from './scene3d/AtmosphereRim';
import { EarthSurface } from './scene3d/EarthSurface';
import { SaturnRings, UranusRings } from './scene3d/PlanetRings';
import { StarsBackground } from './scene3d/StarsBackground';

interface Planet3DProps {
    planet: PlanetData;
}

const BODY_RADIUS = 1.15;

// Quả cầu texture NASA thay cho GLB cũ (9.7MB, chất lượng lệch nhau) —
// cùng component shader/vành với scene chính → hình ảnh nhất quán toàn app.
function TexturedBody({ planet }: { planet: PlanetData }) {
    const texture = useTexture(texUrl(planet.id === 'earth' ? 'earth_day' : planet.id));
    texture.colorSpace = THREE.SRGBColorSpace;

    const tiltDeg = planet.physical
        ? (planet.id === 'venus' ? 180 - planet.physical.axialTiltDeg : planet.physical.axialTiltDeg)
        : 0;
    const atmosphereColor = ATMOSPHERE_COLORS[planet.id];

    if (planet.id === 'sun') {
        return (
            <group>
                <mesh geometry={DETAIL_SPHERE} scale={BODY_RADIUS}>
                    <meshBasicMaterial
                        map={texture}
                        toneMapped={false}
                        color={[1.6, 1.35, 1.0] as unknown as THREE.Color}
                    />
                </mesh>
                <sprite scale={[BODY_RADIUS * 4.2, BODY_RADIUS * 4.2, 1]}>
                    <spriteMaterial
                        map={getGlowTexture()}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        transparent
                        opacity={0.8}
                        color="#FFCC80"
                    />
                </sprite>
            </group>
        );
    }

    return (
        <group rotation-z={-THREE.MathUtils.degToRad(tiltDeg)}>
            {planet.id === 'earth' ? (
                <EarthSurface radius={BODY_RADIUS} geometry={DETAIL_SPHERE} showClouds />
            ) : (
                <mesh geometry={DETAIL_SPHERE} scale={BODY_RADIUS}>
                    <meshStandardMaterial map={texture} roughness={1} metalness={0} />
                </mesh>
            )}
            {planet.id === 'saturn' && <SaturnRings radius={BODY_RADIUS} />}
            {planet.id === 'uranus' && <UranusRings radius={BODY_RADIUS} />}
            {atmosphereColor && (
                <AtmosphereRim
                    radius={BODY_RADIUS}
                    color={atmosphereColor}
                    strength={planet.id === 'mars' ? 0.5 : 0.9}
                    geometry={DETAIL_SPHERE}
                />
            )}
        </group>
    );
}

// Vành đai tiểu hành tinh: cụm đá instanced lơ lửng (không có texture riêng)
function AsteroidCluster() {
    const instancedRef = useRef<THREE.InstancedMesh>(null);
    const COUNT = 120;
    const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);

    useLayoutEffect(() => {
        const mesh = instancedRef.current;
        if (!mesh) return;
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const eul = new THREE.Euler();
        const pos = new THREE.Vector3();
        const scl = new THREE.Vector3();
        for (let i = 0; i < COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.1 + Math.random() * 0.7;
            pos.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * radius
            );
            eul.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            q.setFromEuler(eul);
            scl.setScalar(0.04 + Math.random() * 0.12);
            m.compose(pos, q, scl);
            mesh.setMatrixAt(i, m);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, []);

    return (
        <group rotation-x={0.35}>
            <instancedMesh ref={instancedRef} args={[geometry, undefined, COUNT]} frustumCulled={false}>
                <meshStandardMaterial color="#9C8F7F" roughness={1} metalness={0} />
            </instancedMesh>
        </group>
    );
}

export const Planet3D: React.FC<Planet3DProps> = ({ planet }) => {
    const isSun = planet.id === 'sun';
    return (
        <div className="w-full h-full relative bg-black">
            <Canvas
                dpr={[1, 1.5]}
                camera={{ fov: 45, position: [0, 0.6, 4.2], near: 0.1, far: 100 }}
                gl={{ antialias: true, stencil: false }}
            >
                <color attach="background" args={['#05080f']} />
                <Suspense fallback={null}>
                    <StarsBackground quality="low" />
                    <ambientLight intensity={isSun ? 1 : 0.3} />
                    {!isSun && <directionalLight position={[5, 2, 4]} intensity={2.2} color="#FFF4E0" />}

                    {planet.id === 'asteroid-belt' ? (
                        <AsteroidCluster />
                    ) : (
                        <TexturedBody planet={planet} />
                    )}

                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={0.8}
                        enableZoom
                        enablePan={false}
                        minDistance={2.2}
                        maxDistance={8}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};
