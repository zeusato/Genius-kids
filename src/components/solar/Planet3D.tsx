import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, Stars } from '@react-three/drei';
import { PlanetData } from '../../data/solarData';
import { PLANET_MODELS } from '../../utils/modelMap';

interface Planet3DProps {
    planet: PlanetData;
}

function Model({ planetId }: { planetId: string }) {
    const modelUrl = PLANET_MODELS[planetId];

    if (!modelUrl) return null;

    const gltf = useGLTF(modelUrl);
    const meshRef = useRef<any>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
        }
    });

    return (
        <primitive
            ref={meshRef}
            object={gltf.scene}
            scale={2.5}
        />
    );
}

function LoadingFallback() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-xl animate-pulse">Đang tải...</div>
        </div>
    );
}

export const Planet3D: React.FC<Planet3DProps> = ({ planet }) => {
    return (
        <div className="w-full h-full relative bg-black">
            <Canvas shadows dpr={[1, 2]} camera={{ fov: 45 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        <Model planetId={planet.id} />
                    </Stage>
                    <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={true} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                </Suspense>
            </Canvas>
        </div>
    );
};
