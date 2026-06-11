import React, { Suspense, lazy, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor, Preload } from '@react-three/drei';
import { SOLAR_SYSTEM_DATA, MOON_DATA } from '../../../data/solarData';
import { SimClock, BodyRegistry, Scene3DApi } from './core';
import { Sun } from './Sun';
import { PlanetMesh } from './PlanetMesh';
import { OrbitLines } from './OrbitLines';
import { AsteroidBelt } from './AsteroidBelt';
import { StarsBackground } from './StarsBackground';
import { CameraRig } from './CameraRig';
import { DwarfPlanetMesh } from './DwarfPlanetMesh';
import { Comet } from './Comet';

// Bloom chỉ tải ở tier cao — tablet yếu không bao giờ download chunk postprocessing
const Effects = lazy(() => import('./Effects'));

// Tim của mô phỏng: tăng clock.t mỗi frame (priority -1 → chạy TRƯỚC mọi useFrame
// đọc clock.t để tính vị trí quỹ đạo). Clamp delta tránh nhảy vọt khi tab bị ẩn lâu.
function ClockTicker({ clock }: { clock: SimClock }) {
    useFrame((_, delta) => {
        clock.t += Math.min(delta, 0.1) * clock.timeScale;
    }, -1);
    return null;
}

interface Scene3DProps {
    focusedId: string | null;
    onPlanetSelect: (id: string) => void;
    onFocusComplete: (id: string) => void;
    clock: SimClock;
    paused: boolean; // modal đang mở → frameloop 'never', GPU nghỉ hoàn toàn
    apiRef: React.MutableRefObject<Scene3DApi | null>;
    onContextLost: () => void;
}

// Scene 3D chính — thay thế CSS orrery. Mọi chuyển động per-frame đi qua ref
// (useFrame mutation), React render ~0 lần/giây khi idle.
export const Scene3D: React.FC<Scene3DProps> = ({
    focusedId,
    onPlanetSelect,
    onFocusComplete,
    clock,
    paused,
    apiRef,
    onContextLost
}) => {
    const registry = useRef<BodyRegistry>({});
    // Tier chất lượng: tụt fps → hạ dpr, tắt bloom/mây, giảm asteroid. Không tự nâng lại
    // (tránh nhấp nháy qua lại trên máy ở ranh giới).
    const [quality, setQuality] = useState<'high' | 'low'>('high');

    return (
        <Canvas
            dpr={quality === 'high' ? [1, 1.5] : 1}
            frameloop={paused ? 'never' : 'always'}
            camera={{ fov: 45, position: [0, 30, 62], near: 0.1, far: 500 }}
            gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
            style={{ touchAction: 'none' }}
            onCreated={({ gl }) => {
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    onContextLost();
                });
            }}
        >
            <color attach="background" args={['#030615']} />
            <ambientLight intensity={0.15} />
            <ClockTicker clock={clock} />

            <Suspense fallback={null}>
                <StarsBackground quality={quality} />
                <Sun clock={clock} onSelect={onPlanetSelect} />

                {SOLAR_SYSTEM_DATA.map((planet) => (
                    <PlanetMesh
                        key={planet.id}
                        data={planet}
                        clock={clock}
                        onSelect={onPlanetSelect}
                        registry={registry}
                        quality={quality}
                        moons={MOON_DATA.filter((m) => m.parentId === planet.id)}
                    />
                ))}

                <OrbitLines />
                <AsteroidBelt
                    clock={clock}
                    onSelect={onPlanetSelect}
                    count={quality === 'high' ? 1500 : 600}
                />
                <DwarfPlanetMesh clock={clock} onSelect={onPlanetSelect} />
                <Comet clock={clock} onSelect={onPlanetSelect} />

                {quality === 'high' && (
                    <Suspense fallback={null}>
                        <Effects />
                    </Suspense>
                )}

                <Preload all />
            </Suspense>

            <CameraRig
                focusedId={focusedId}
                registry={registry}
                clock={clock}
                onFocusComplete={onFocusComplete}
                apiRef={apiRef}
            />

            <PerformanceMonitor onDecline={() => setQuality('low')} />
        </Canvas>
    );
};
