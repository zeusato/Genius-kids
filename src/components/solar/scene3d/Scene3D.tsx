import React, { Suspense, lazy, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor, Preload } from '@react-three/drei';
import { SOLAR_SYSTEM_DATA, MOON_DATA } from '../../../data/solarData';
import { SimClock, BodyRegistry, LabelRegistry, Scene3DApi } from './core';
import { Sun } from './Sun';
import { PlanetMesh } from './PlanetMesh';
import { OrbitTrails } from './OrbitLines';
import { AsteroidBelt } from './AsteroidBelt';
import { StarsBackground } from './StarsBackground';
import { CameraRig, ArrivalFraming } from './CameraRig';
import { DwarfPlanetMesh } from './DwarfPlanetMesh';
import { Comet } from './Comet';
import { CustomPlanetMesh } from './CustomPlanetMesh';
import { LabelDeclutter } from './LabelDeclutter';
import { FeatureSpotlight } from './FeatureSpotlight';
import { SolarStorm, StormState } from './SolarStorm';
import { PerfOverlay } from './PerfOverlay';
import { DEBUG_PERF, FORCED_TIER, QualityTier } from './sceneParams';
import { CustomPlanetDoc } from '../../planetmaker/planetStore';

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
    customPlanet?: CustomPlanetDoc | null; // hành tinh bé tạo trong Xưởng (null = ẩn)
    arrivedId?: string | null;             // thiên thể camera vừa tới nơi (xoay địa danh ra trước)
    framing?: ArrivalFraming;              // khung hình khi tới nơi (chừa chỗ cho thẻ)
    showConstellations?: boolean;
    intro?: boolean;                       // cảnh bay mở màn
    onIntroEnd?: () => void;
}

// Scene 3D chính. Mọi chuyển động per-frame đi qua ref (useFrame mutation), React render
// ~0 lần/giây khi idle.
export const Scene3D: React.FC<Scene3DProps> = ({
    focusedId,
    onPlanetSelect,
    onFocusComplete,
    clock,
    paused,
    apiRef,
    onContextLost,
    customPlanet,
    arrivedId = null,
    framing = 'center',
    showConstellations = false,
    intro = false,
    onIntroEnd
}) => {
    const registry = useRef<BodyRegistry>({});
    const labels = useRef<LabelRegistry>(new Map());
    const aurora = useRef(0);
    const storm = useRef<StormState>({ startedAt: null });
    const [introActive, setIntroActive] = useState(intro);
    // Tier chất lượng: tụt fps → hạ dpr, tắt bloom/mây/granule, giảm asteroid & hạt. Không tự
    // nâng lại (tránh nhấp nháy qua lại). ?tier=low|high ép tier và tắt tự hạ.
    const [quality, setQuality] = useState<QualityTier>(FORCED_TIER ?? 'high');

    return (
        <Canvas
            dpr={quality === 'high' ? [1, 1.5] : 1}
            frameloop={paused ? 'never' : 'always'}
            camera={{ fov: 45, position: [0, 30, 62], near: 0.1, far: 500 }}
            gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
            style={{ touchAction: 'none' }}
            onCreated={({ gl }) => {
                // Tone mapping Neutral cho tier thấp (tier cao: <ToneMapping> trong Effects).
                // Đặt ở đây (chạy 1 lần) thay vì prop gl — prop gl bị áp lại mỗi lần Canvas render,
                // sẽ ghi đè NoToneMapping mà EffectComposer cần.
                gl.toneMapping = THREE.NeutralToneMapping;
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    onContextLost();
                });
            }}
        >
            <color attach="background" args={['#02040c']} />
            {/* Ambient gần 0 để lằn ranh ngày/đêm sắc nét (0.15 cũ làm mặt đêm sáng ~25–30%
                mặt ngày sau mã hoá sRGB → hành tinh trông phẳng). Viền mờ mặt đêm do planetSurface lo. */}
            <ambientLight intensity={0.04} />
            <ClockTicker clock={clock} />

            <Suspense fallback={null}>
                <StarsBackground quality={quality} showConstellations={showConstellations} />
                <Sun clock={clock} onSelect={onPlanetSelect} quality={quality} registry={registry} />

                {SOLAR_SYSTEM_DATA.map((planet) => (
                    <PlanetMesh
                        key={planet.id}
                        data={planet}
                        clock={clock}
                        onSelect={onPlanetSelect}
                        registry={registry}
                        labels={labels}
                        quality={quality}
                        moons={MOON_DATA.filter((m) => m.parentId === planet.id)}
                        auroraRef={aurora}
                    />
                ))}

                <OrbitTrails clock={clock} focusedId={focusedId} />
                <AsteroidBelt
                    clock={clock}
                    onSelect={onPlanetSelect}
                    count={quality === 'high' ? 1500 : 600}
                />
                <DwarfPlanetMesh clock={clock} onSelect={onPlanetSelect} labels={labels} />
                <Comet clock={clock} onSelect={onPlanetSelect} quality={quality} />
                {customPlanet && (
                    <CustomPlanetMesh doc={customPlanet} clock={clock} onSelect={onPlanetSelect} />
                )}
                <SolarStorm registry={registry} storm={storm} aurora={aurora} apiRef={apiRef} />
                <FeatureSpotlight registry={registry} bodyId={arrivedId} />

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
                framing={framing}
                intro={intro}
                onIntroEnd={() => {
                    setIntroActive(false);
                    onIntroEnd?.();
                }}
            />
            <LabelDeclutter labels={labels} focusedId={focusedId} hideAll={introActive} />

            {!FORCED_TIER && <PerformanceMonitor onDecline={() => setQuality('low')} />}
            {DEBUG_PERF && <PerfOverlay tier={quality} />}
        </Canvas>
    );
};
