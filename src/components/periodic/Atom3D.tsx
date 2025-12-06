import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ElementData, CATEGORY_COLORS } from '@/src/data/elementsData';

interface Atom3DProps {
    element: ElementData;
}

// Nucleus with protons and neutrons
const Nucleus: React.FC<{ element: ElementData }> = ({ element }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Slow rotation for nucleus
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.15;
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
        }
    });

    // Calculate nucleon positions (simplified - creates a cluster)
    const nucleons = useMemo(() => {
        const protons = element.atomicNumber;
        // Neutrons roughly equal to protons for light elements, more for heavy
        const neutrons = Math.round(element.atomicMass - protons);
        const totalNucleons = Math.min(protons + neutrons, 50); // Limit for performance

        const positions: { pos: [number, number, number]; isProton: boolean }[] = [];
        const nucleonRadius = 0.12;

        // Create clustered positions using golden spiral for even distribution
        for (let i = 0; i < totalNucleons; i++) {
            const isProton = i < protons;
            const phi = Math.acos(1 - 2 * (i + 0.5) / totalNucleons);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;

            // Radius varies slightly for natural look
            const r = nucleonRadius * 2 * Math.pow(totalNucleons / 8, 0.4) * (0.9 + Math.random() * 0.2);

            positions.push({
                pos: [
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                ],
                isProton
            });
        }

        return positions;
    }, [element.atomicNumber, element.atomicMass]);

    return (
        <group ref={groupRef}>
            {nucleons.map((nucleon, i) => (
                <mesh key={i} position={nucleon.pos}>
                    <sphereGeometry args={[0.12, 24, 24]} />
                    <meshStandardMaterial
                        color={nucleon.isProton ? '#FF4444' : '#4488FF'}
                        emissive={nucleon.isProton ? '#FF2222' : '#2266FF'}
                        emissiveIntensity={0.3}
                        metalness={0.4}
                        roughness={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
};

// Electron shells with proper 3D orbital motion
const ElectronShells: React.FC<{ element: ElementData }> = ({ element }) => {
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const orbitRingsRef = useRef<THREE.Group>(null);
    const categoryStyle = CATEGORY_COLORS[element.category];

    // Calculate electrons per shell and shell radii
    const { totalElectrons, shellRadii, electronsPerShell, orbitTilts } = useMemo(() => {
        const shells = element.electronShells;
        const total = shells.reduce((sum, n) => sum + n, 0);
        // Increase base radius to be further from nucleus
        const radii = shells.map((_, i) => 1.2 + i * 0.7);
        // Random tilt for each shell for 3D effect
        const tilts = shells.map((_, i) => ({
            x: (Math.random() - 0.5) * Math.PI * 0.5 + i * 0.2,
            y: (Math.random() - 0.5) * Math.PI * 0.3,
            z: i * 0.3
        }));
        return { totalElectrons: total, shellRadii: radii, electronsPerShell: shells, orbitTilts: tilts };
    }, [element.electronShells]);

    // Animate electrons orbiting in 3D
    useFrame((state) => {
        if (!instancedMeshRef.current) return;

        const time = state.clock.getElapsedTime();
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        let electronIndex = 0;

        electronsPerShell.forEach((electronCount, shellIndex) => {
            const radius = shellRadii[shellIndex];
            const speed = 2 / (shellIndex + 1); // Outer shells slower
            const tilt = orbitTilts[shellIndex];

            for (let i = 0; i < electronCount; i++) {
                // Calculate position on tilted orbit
                const angle = (i / electronCount) * Math.PI * 2 + time * speed;

                // Base circular orbit
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const z = 0;

                // Apply rotation for 3D orbit (tilted ellipse)
                position.set(x, y, z);

                // Rotate around X axis for tilt
                const cosX = Math.cos(tilt.x);
                const sinX = Math.sin(tilt.x);
                const newY = position.y * cosX - position.z * sinX;
                const newZ = position.y * sinX + position.z * cosX;
                position.y = newY;
                position.z = newZ;

                // Rotate around Y axis
                const cosY = Math.cos(tilt.y);
                const sinY = Math.sin(tilt.y);
                const newX = position.x * cosY + position.z * sinY;
                position.z = -position.x * sinY + position.z * cosY;
                position.x = newX;

                matrix.compose(position, quaternion, scale);
                instancedMeshRef.current!.setMatrixAt(electronIndex, matrix);
                electronIndex++;
            }
        });

        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            {/* Orbital rings with 3D tilts */}
            <group ref={orbitRingsRef}>
                {shellRadii.map((radius, i) => (
                    <mesh
                        key={`ring-${i}`}
                        rotation={[orbitTilts[i].x, orbitTilts[i].y, 0]}
                    >
                        <torusGeometry args={[radius, 0.015, 8, 100]} />
                        <meshStandardMaterial
                            color={categoryStyle.color}
                            transparent
                            opacity={0.25}
                            emissive={categoryStyle.color}
                            emissiveIntensity={0.15}
                        />
                    </mesh>
                ))}
            </group>

            {/* Electrons using InstancedMesh for performance */}
            <instancedMesh
                ref={instancedMeshRef}
                args={[undefined, undefined, totalElectrons]}
            >
                <sphereGeometry args={[0.08, 20, 20]} />
                <meshStandardMaterial
                    color="#00FFFF"
                    emissive="#00CCFF"
                    emissiveIntensity={0.8}
                    metalness={0.6}
                    roughness={0.2}
                />
            </instancedMesh>

            {/* Electron glow points */}
            <instancedMesh
                args={[undefined, undefined, totalElectrons]}
            >
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshBasicMaterial
                    color="#00FFFF"
                    transparent
                    opacity={0.3}
                />
            </instancedMesh>
        </>
    );
};

// Main Atom scene
const AtomScene: React.FC<{ element: ElementData }> = ({ element }) => {
    return (
        <>
            {/* Enhanced lighting for 3D effect */}
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
            <pointLight position={[-10, -5, -10]} intensity={0.6} color="#4488FF" />
            <pointLight position={[0, -10, 5]} intensity={0.4} color="#FF4444" />
            <directionalLight position={[5, 5, 5]} intensity={0.5} />

            <Nucleus element={element} />
            <ElectronShells element={element} />

            <Stars radius={100} depth={50} count={800} factor={2} fade speed={0.5} />
        </>
    );
};

export const Atom3D: React.FC<Atom3DProps> = ({ element }) => {
    // Calculate camera distance based on number of shells
    const cameraDistance = useMemo(() => {
        const shellCount = element.electronShells.length;
        return 4 + shellCount * 0.9;
    }, [element.electronShells.length]);

    return (
        <div className="w-full h-full min-h-[300px]">
            <Canvas
                camera={{ position: [cameraDistance * 0.7, cameraDistance * 0.5, cameraDistance], fov: 50 }}
                dpr={[1, 2]}
            >
                <AtomScene element={element} />
                <OrbitControls
                    enablePan={false}
                    minDistance={2}
                    maxDistance={20}
                    autoRotate
                    autoRotateSpeed={0.3}
                />
            </Canvas>
        </div>
    );
};
