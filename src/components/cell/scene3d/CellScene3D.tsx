import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor, Preload } from '@react-three/drei';
import { CellType } from '../../../data/cellData';
import { SimClock, BodyRegistry, Scene3DApi } from './core';
import { cellShape } from './cellScale';
import { CellBody } from './CellBody';
import { Organelle3D } from './Organelle3D';
import { CellCameraRig } from './CellCameraRig';

// Tim mô phỏng: tăng clock.t mỗi frame (priority -1, clamp delta) — y hệt solar Scene3D.
function ClockTicker({ clock }: { clock: SimClock }) {
    useFrame((_, delta) => {
        clock.t += Math.min(delta, 0.1) * clock.timeScale;
    }, -1);
    return null;
}

interface CellScene3DProps {
    cellType: CellType;
    focusedId: string | null;
    onSelect: (id: string) => void;
    onFocusComplete: (id: string) => void;
    clock: SimClock;
    paused: boolean;
    apiRef: React.MutableRefObject<Scene3DApi | null>;
    onContextLost: () => void;
}

// Scene 3D tế bào — 1 Canvas, mọi chuyển động qua ref (không setState/frame).
// KHÔNG postprocessing/Bloom (màng fresnel đã đủ glow). Sáng hơn solar để thấy nội thất.
export const CellScene3D: React.FC<CellScene3DProps> = ({
    cellType, focusedId, onSelect, onFocusComplete, clock, paused, apiRef, onContextLost
}) => {
    const registry = useRef<BodyRegistry>({});
    const [quality, setQuality] = useState<'high' | 'low'>('high');
    const spec = cellShape(cellType.id);

    // id tế bào chất (vùng nền) theo loại
    const cytoplasmId = cellType.organelles.find(o => o.id.startsWith('cytoplasm'))?.id ?? 'cytoplasm';

    // Các bộ phận "vỏ" (màng/thành/vỏ nhầy) — label của chúng sẽ rải ngang để không chồng nhau
    const shellIds = cellType.organelles.filter(o => o.threeD?.geometry === 'shell').map(o => o.id);

    return (
        <Canvas
            dpr={quality === 'high' ? [1, 1.5] : 1}
            frameloop={paused ? 'never' : 'always'}
            camera={{ fov: 45, position: spec.camera, near: 0.1, far: 100 }}
            gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
            style={{ touchAction: 'none' }}
            // Chạm ra ngoài mọi bào quan (kể cả khi đã zoom sâu) → coi như chạm nền:
            // đang focus → quay về view tổng; chưa focus → xem tế bào chất.
            onPointerMissed={() => onSelect(cytoplasmId)}
            onCreated={({ gl }) => {
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    onContextLost();
                });
            }}
        >
            <color attach="background" args={['#0a0a1a']} />
            <ambientLight intensity={0.7} />
            <pointLight position={[4, 5, 6]} intensity={1.0} />
            <pointLight position={[-5, -3, -4]} intensity={0.4} color="#9fd8ff" />
            <ClockTicker clock={clock} />

            <Suspense fallback={null}>
                <CellBody cellId={cellType.id} spec={spec} cytoplasmId={cytoplasmId} onSelectBackground={onSelect} />
                {cellType.organelles.map((o) => (
                    <Organelle3D
                        key={o.id}
                        data={o}
                        clock={clock}
                        onSelect={onSelect}
                        registry={registry}
                        focusedId={focusedId}
                        quality={quality}
                        shellIndex={shellIds.indexOf(o.id)}
                        shellTotal={shellIds.length}
                    />
                ))}
                <Preload all />
            </Suspense>

            <CellCameraRig
                focusedId={focusedId}
                registry={registry}
                clock={clock}
                spec={spec}
                onFocusComplete={onFocusComplete}
                apiRef={apiRef}
            />

            <PerformanceMonitor onDecline={() => setQuality('low')} />
        </Canvas>
    );
};
