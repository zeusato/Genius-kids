import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DNAHelixProps {
    className?: string;
    color?: string;
}

// Create smooth ribbon/strand geometry
const createRibbonCurve = (offset: number, segments: number, height: number, radius: number, twists: number) => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = (t - 0.5) * height;
        const angle = t * Math.PI * 2 * twists + offset;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
};

// Two-color cylinder that connects two points (split in half)
const TwoColorCylinder: React.FC<{
    start: THREE.Vector3;
    end: THREE.Vector3;
    color1: string;
    color2: string;
    radius?: number;
}> = ({ start, end, color1, color2, radius = 0.05 }) => {
    // Calculate position, length and orientation
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const halfLength = length * 0.46;

    // Create quaternion for rotation
    const quaternion = useMemo(() => {
        const up = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(up, direction.clone().normalize());
        return q;
    }, [direction]);

    // Calculate offset for each half
    const offset = direction.clone().normalize().multiplyScalar(halfLength / 2);
    const pos1 = midpoint.clone().sub(offset);
    const pos2 = midpoint.clone().add(offset);

    return (
        <group>
            {/* First half - color1 */}
            <mesh position={[pos1.x, pos1.y, pos1.z]} quaternion={quaternion}>
                <cylinderGeometry args={[radius, radius, halfLength, 12]} />
                <meshStandardMaterial
                    color={color1}
                    emissive={color1}
                    emissiveIntensity={0.4}
                    metalness={0.5}
                    roughness={0.2}
                />
            </mesh>
            {/* Second half - color2 */}
            <mesh position={[pos2.x, pos2.y, pos2.z]} quaternion={quaternion}>
                <cylinderGeometry args={[radius, radius, halfLength, 12]} />
                <meshStandardMaterial
                    color={color2}
                    emissive={color2}
                    emissiveIntensity={0.4}
                    metalness={0.5}
                    roughness={0.2}
                />
            </mesh>
        </group>
    );
};

// DNA Helix 3D Model
const DNAModel: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Smooth rotation
    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.4;
        }
    });

    // Helix parameters
    const height = 6;
    const radius = 0.7;
    const twists = 2;
    const basePairs = 20;
    const segments = 100;

    // Create backbone curves
    const curve1 = useMemo(() => createRibbonCurve(0, segments, height, radius, twists), []);
    const curve2 = useMemo(() => createRibbonCurve(Math.PI, segments, height, radius, twists), []);

    // Base pair color pairs (A-T, G-C pairings)
    const basePairColorPairs = [
        ['#FF1493', '#00CED1'], // Pink - Cyan
        ['#FFD700', '#32CD32'], // Yellow - Green
        ['#FF69B4', '#00BFFF'], // Hot Pink - Sky Blue
        ['#FFA500', '#9370DB'], // Orange - Purple
    ];

    // Generate base pair positions with correct orientation
    const basePairData = useMemo(() => {
        const data: { start: THREE.Vector3; end: THREE.Vector3; color1: string; color2: string }[] = [];
        for (let i = 0; i < basePairs; i++) {
            const t = (i + 0.5) / basePairs;
            const point1 = curve1.getPoint(t);
            const point2 = curve2.getPoint(t);
            const colorPair = basePairColorPairs[i % basePairColorPairs.length];

            data.push({
                start: point1,
                end: point2,
                color1: colorPair[0],
                color2: colorPair[1],
            });
        }
        return data;
    }, [curve1, curve2]);

    return (
        <group ref={groupRef}>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
            <directionalLight position={[-3, -3, 3]} intensity={0.6} color="#60A5FA" />
            <pointLight position={[0, 0, 4]} intensity={0.6} color={primaryColor} />

            {/* Left Backbone Ribbon (Red/Orange) */}
            <mesh>
                <tubeGeometry args={[curve1, segments, 0.07, 16, false]} />
                <meshStandardMaterial
                    color="#F97316"
                    emissive="#F97316"
                    emissiveIntensity={0.25}
                    metalness={0.7}
                    roughness={0.15}
                />
            </mesh>

            {/* Right Backbone Ribbon (Cyan/Blue) */}
            <mesh>
                <tubeGeometry args={[curve2, segments, 0.07, 16, false]} />
                <meshStandardMaterial
                    color="#0EA5E9"
                    emissive="#0EA5E9"
                    emissiveIntensity={0.25}
                    metalness={0.7}
                    roughness={0.15}
                />
            </mesh>

            {/* Base Pairs - Two-color cylinders */}
            {basePairData.map((bp, i) => (
                <TwoColorCylinder
                    key={i}
                    start={bp.start}
                    end={bp.end}
                    color1={bp.color1}
                    color2={bp.color2}
                    radius={0.055}
                />
            ))}

            {/* End caps on backbones */}
            {[curve1, curve2].map((curve, idx) => {
                const color = idx === 0 ? '#F97316' : '#0EA5E9';
                return (
                    <group key={idx}>
                        <mesh position={curve.getPoint(0)}>
                            <sphereGeometry args={[0.09, 16, 16]} />
                            <meshStandardMaterial color={color} metalness={0.7} roughness={0.15} />
                        </mesh>
                        <mesh position={curve.getPoint(1)}>
                            <sphereGeometry args={[0.09, 16, 16]} />
                            <meshStandardMaterial color={color} metalness={0.7} roughness={0.15} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

export const DNAHelix: React.FC<DNAHelixProps> = ({ className = '', color = '#A855F7' }) => {
    return (
        <div className={`relative ${className}`}>
            {/* Subtle glow backdrop */}
            <div
                className="absolute inset-0 blur-3xl opacity-15 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, #38BDF8 0%, transparent 60%)` }}
            />

            {/* 3D Canvas */}
            <Canvas
                camera={{ position: [0, 0, 5.5], fov: 40 }}
                style={{ background: 'transparent' }}
                gl={{ antialias: true, alpha: true }}
            >
                <DNAModel primaryColor={color} />
            </Canvas>

            {/* Label */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-center whitespace-nowrap z-10">
                <p className="text-[10px] text-white/50 font-medium tracking-widest uppercase">
                    DNA
                </p>
            </div>
        </div>
    );
};
