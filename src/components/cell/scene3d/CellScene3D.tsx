import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CellType } from '../../../data/cellData';
import { BodyRegistry, mergeApi, Scene3DApi, SHARED_TIME, SimClock } from './core';
import { DEBUG_PERF, FORCED_TIER, FX_DISABLED, QualityTier } from './params';
import { CellCtxProvider, CellSceneCtx, createExperiments } from './cellContext';
import { Stage } from './Stage';
import { CellCameraRig, CellViewSpec, Framing } from './CellCameraRig';
import { AnimalCell, ANIMAL_VIEW } from './cells/AnimalCell';
import { PlantCell, PLANT_VIEW } from './cells/PlantCell';
import { BacteriumCell, BACTERIA_VIEW } from './cells/BacteriumCell';
import { PerfOverlay } from '../../solar/scene3d/PerfOverlay';
import { Tissue } from './Tissue';
import { WorkFx } from './WorkFx';
import { Mitosis } from './experiments/Mitosis';

// Hậu kỳ chỉ tải ở tier cao — tablet yếu không bao giờ download chunk postprocessing
const Effects = lazy(() => import('./Effects'));

const VIEWS: Record<string, CellViewSpec> = {
    animal: ANIMAL_VIEW,
    plant: PLANT_VIEW,
    bacteria: BACTERIA_VIEW
};

export function cellView(id: string): CellViewSpec {
    return VIEWS[id] ?? ANIMAL_VIEW;
}

// Tim của scene: thời gian sinh học (clock.t, dừng khi camera bay) + thời gian môi trường cho shader
// (SHARED_TIME, luôn chạy). priority -1 → chạy trước mọi useFrame đọc hai đồng hồ này.
function ClockTicker({ clock }: { clock: SimClock }) {
    useFrame((_, delta) => {
        const d = Math.min(delta, 0.1);
        clock.t += d * clock.timeScale;
        SHARED_TIME.value += d;
    }, -1);
    return null;
}

// Biên dịch shader SONG SONG (KHR_parallel_shader_compile) trước khi hiện tế bào. Nếu để vòng render
// tự biên dịch, mỗi shader Physical chặn luồng 0,2–0,5 s trên ANGLE → đen màn 5–7 giây (đo trên Iris
// Xe). Chờ 2 frame để Environment kịp gán scene.environment (không thì biên dịch lại lần nữa).
function ShaderWarmup({ cellId, tier, variant, onReady }: { cellId: string; tier: QualityTier; variant: string; onReady: () => void }) {
    const gl = useThree((s) => s.gl);
    const scene = useThree((s) => s.scene);
    const camera = useThree((s) => s.camera);
    useEffect(() => {
        let alive = true;
        let raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => {
                const t0 = performance.now();
                gl.compileAsync(scene, camera)
                    .catch(() => undefined)
                    .then(() => {
                        if (!alive) return;
                        if (import.meta.env.DEV) console.info(`[cell] shader ${cellId}/${tier}: ${Math.round(performance.now() - t0)} ms`);
                        onReady();
                    });
            });
        });
        return () => { alive = false; cancelAnimationFrame(raf); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cellId, tier, variant]);
    return null;
}

interface CellScene3DProps {
    cellType: CellType;
    focusedId: string | null;
    working: string | null;
    onSelect: (id: string) => void;
    onBackground: () => void;
    onFocusComplete: (id: string) => void;
    clock: SimClock;
    paused: boolean;
    apiRef: React.MutableRefObject<Scene3DApi | null>;
    onContextLost: () => void;
    intro: boolean;
    onIntroEnd: () => void;
    framing: Framing;
    labelsHidden: boolean;
    onReady?: (cellId: string) => void; // shader đã biên dịch xong, tế bào đã hiện
    experiment?: 'divide' | 'fission' | null;
}

export const CellScene3D: React.FC<CellScene3DProps> = ({
    cellType, focusedId, working, onSelect, onBackground, onFocusComplete, clock, paused, apiRef, onContextLost,
    intro, onIntroEnd, framing, labelsHidden, onReady, experiment = null
}) => {
    const registry = useRef<BodyRegistry>({});
    // Tier: tụt fps → hạ dpr, bỏ hậu kỳ, vật liệu Standard, giảm instance. Không tự nâng lại.
    const [quality, setQuality] = useState<QualityTier>(FORCED_TIER ?? 'high');
    const [introPlaying, setIntroPlaying] = useState(intro);
    useEffect(() => {
        if (intro) setIntroPlaying(true);
    }, [intro, cellType.id]);
    const view = cellView(cellType.id);
    const experiments = useRef(createExperiments()).current;
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    // tụt xuống tier thấp (bỏ composer) → renderer tự lo tone mapping
    useEffect(() => {
        if (glRef.current) glRef.current.toneMapping = quality === 'high' ? THREE.NoToneMapping : THREE.NeutralToneMapping;
    }, [quality]);
    useEffect(() => {
        mergeApi(apiRef, {
            setWater: (v: number) => { experiments.water.target = Math.min(1, Math.max(0, v)); },
            timeline: (which) => experiments[which]
        });
    }, [apiRef, experiments]);

    const ctx = useMemo<CellSceneCtx>(() => ({
        tier: quality,
        focusedId,
        working,
        onSelect,
        registry,
        clock,
        interactive: !introPlaying,
        experiments
    }), [quality, focusedId, working, onSelect, clock, introPlaying, experiments]);

    // Tế bào (theo tier) đã biên dịch shader xong chưa. CHƯA xong thì KHÔNG vẽ frame nào: nếu vẫn vẽ
    // (dù chỉ nền + mô), GPU process phải chờ đúng các shader đó trong hàng đợi biên dịch song song
    // → cứ ~2 s mới ra một khung hình, kéo đứng cả hoạt ảnh CSS của trang (đo trên Iris Xe, lần đầu
    // vào khi Chrome chưa có shader cache). Trang hiện màn "đang chỉnh tiêu cự" trong lúc chờ.
    const [readyKey, setReadyKey] = useState<string | null>(null);
    const warmKey = `${cellType.id}/${quality}/${experiment ?? ''}`;
    const ready = readyKey === warmKey;
    const windowOpen = !introPlaying;
    const hideLabels = labelsHidden || introPlaying || !ready;
    // PerformanceMonitor chỉ đo khi đã chạy ổn định vài giây VÀ trang đang hiển thị: cửa sổ bị che/thu
    // nhỏ thì trình duyệt bóp còn ~0,5 khung/giây → monitor tưởng máy yếu, hạ tier vĩnh viễn (đã dính
    // khi test: bé chuyển sang app khác một lúc là quay lại thấy đồ họa tier thấp).
    const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
    useEffect(() => {
        const on = () => setPageVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', on);
        return () => document.removeEventListener('visibilitychange', on);
    }, []);
    const [monitor, setMonitor] = useState(false);
    useEffect(() => {
        if (!ready || !pageVisible) { setMonitor(false); return; }
        const t = window.setTimeout(() => setMonitor(true), 4000);
        return () => window.clearTimeout(t);
    }, [ready, pageVisible]);

    return (
        <Canvas
            dpr={quality === 'high' ? [1, 1.75] : 1}
            frameloop={paused || !ready ? 'never' : 'always'}
            camera={{ fov: 42, position: intro ? view.introFrom : view.home, near: 0.02, far: 260 }}
            gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
            style={{ touchAction: 'none' }}
            onPointerMissed={() => { if (!introPlaying) onBackground(); }}
            onCreated={(state) => {
                const { gl } = state;
                glRef.current = gl;
                // Tone mapping: tier thấp = Neutral ở renderer; tier cao = <ToneMapping> cuối chuỗi Effects,
                // renderer phải là NoToneMapping NGAY TỪ ĐẦU. toneMapping nằm trong khóa cache program:
                // nếu biên dịch nền (compileAsync) lúc còn Neutral rồi chunk Effects nạp xong mới đổi sang
                // None, MỌI shader bị biên dịch lại đồng bộ giữa cảnh lặn (đo: 5 khung hình ~2 s).
                // Đặt ở đây (chạy 1 lần) thay vì prop gl — prop gl bị áp lại mỗi lần Canvas render.
                gl.toneMapping = quality === 'high' ? THREE.NoToneMapping : THREE.NeutralToneMapping;
                // dev: cửa ngõ đo đạc trong browser pane (camera, renderer.info...)
                if (import.meta.env.DEV) Object.assign(window, { __cellR3F: state, __cellRegistry: registry, __cellExperiments: experiments });
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    onContextLost();
                });
            }}
        >
            <ClockTicker clock={clock} />
            <Stage cellId={cellType.id} />
            <CellCtxProvider value={ctx}>
                <Suspense fallback={null}>
                    <group visible={ready}>
                        {cellType.id === 'animal' && (
                            <group visible={experiment !== 'divide'}>
                                <AnimalCell cell={cellType} windowOpen={windowOpen} labelsHidden={hideLabels || experiment === 'divide'} />
                            </group>
                        )}
                        {cellType.id === 'animal' && experiment === 'divide' && <Mitosis state={experiments.mitosis} />}
                        {cellType.id === 'plant' && <PlantCell cell={cellType} windowOpen={windowOpen} labelsHidden={hideLabels} />}
                        {cellType.id === 'bacteria' && <BacteriumCell cell={cellType} windowOpen={windowOpen} labelsHidden={hideLabels} fission={experiment === 'fission'} />}
                    </group>
                    <WorkFx working={ready ? working : null} registry={registry} />
                    <Tissue cellId={cellType.id} tier={quality} heroReady={ready} viewFrom={view.introFrom} visible={introPlaying} />
                    <ShaderWarmup
                        cellId={cellType.id}
                        tier={quality}
                        variant={experiment ?? ''}
                        onReady={() => { setReadyKey(warmKey); onReady?.(cellType.id); }}
                    />
                    {quality === 'high' && !FX_DISABLED && (
                        <Suspense fallback={null}>
                            <Effects />
                        </Suspense>
                    )}
                </Suspense>
            </CellCtxProvider>
            <CellCameraRig
                focusedId={focusedId}
                registry={registry}
                clock={clock}
                view={view}
                viewKey={cellType.id}
                intro={intro}
                onIntroEnd={() => { setIntroPlaying(false); onIntroEnd(); }}
                onFocusComplete={onFocusComplete}
                apiRef={apiRef}
                framing={framing}
                homeScale={experiment === 'fission' ? 1.45 : experiment === 'divide' ? 1.18 : 1}
            />
            {!FORCED_TIER && monitor && <PerformanceMonitor onDecline={() => setQuality('low')} />}
            {DEBUG_PERF && <PerfOverlay tier={quality} />}
        </Canvas>
    );
};
