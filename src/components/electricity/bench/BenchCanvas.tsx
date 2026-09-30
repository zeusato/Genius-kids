import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PerfOverlay } from '../../solar/scene3d/PerfOverlay';
import { BenchProps } from '../ui/benchTypes';
import { BenchScene } from './BenchScene';
import { getPartIcons } from './icons';
import { IconBaker } from './IconBaker';
import { DEBUG_PERF, FORCED_TIER, FX_DISABLED, QualityTier } from './params';

const Effects = lazy(() => import('./Effects'));

/** Môi trường phản chiếu sinh bằng code (không tải HDR) cho cọc đồng, vỏ dây và bầu kính. */
function Environment() {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene);
    useEffect(() => {
        const pm = new THREE.PMREMGenerator(gl), env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = env;
        return () => { scene.environment = null; env.dispose(); pm.dispose(); };
    }, [gl, scene]);
    return null;
}

/**
 * Biên dịch shader nền trước khi vẽ (bài học Tế bào/Bảng tuần hoàn: ANGLE nghẽn nếu vừa vẽ vừa biên dịch).
 * compileAsync có thể không bao giờ resolve → hẹn giờ an toàn 2,5 s.
 */
function ShaderWarmup({ warmKey, onReady }: { warmKey: string; onReady: (k: string) => void }) {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene), camera = useThree(s => s.camera);
    useEffect(() => {
        let alive = true, done = false, safety = 0;
        const finish = () => { if (alive && !done) { done = true; onReady(warmKey); } };
        let raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => {
                safety = window.setTimeout(finish, 2500);
                try { gl.compileAsync(scene, camera).catch(() => undefined).then(finish); } catch { finish(); }
            });
        });
        return () => { alive = false; cancelAnimationFrame(raf); window.clearTimeout(safety); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [warmKey]);
    return null;
}

export default function BenchCanvas(props: BenchProps) {
    const [tier, setTier] = useState<QualityTier>(FORCED_TIER ?? 'high');
    const [ready, setReady] = useState<string | null>(null);
    const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const hdr = tier === 'high' && !FX_DISABLED;
    useEffect(() => { if (glRef.current) glRef.current.toneMapping = hdr ? THREE.NoToneMapping : THREE.NeutralToneMapping; }, [hdr]);
    useEffect(() => { const on = () => setVisible(document.visibilityState === 'visible'); document.addEventListener('visibilitychange', on); return () => document.removeEventListener('visibilitychange', on); }, []);
    // Chỉ theo dõi hiệu năng sau khi đã ổn định vài giây và khi trang đang hiện (tránh hạ tier oan).
    const [monitor, setMonitor] = useState(false);
    useEffect(() => { if (!ready || !visible) { setMonitor(false); return; } const t = window.setTimeout(() => setMonitor(true), 4000); return () => window.clearTimeout(t); }, [ready, visible]);
    const warmKey = `${tier}`;
    const isReady = ready === warmKey;
    return <div className="ew-3d-canvas" data-ready={isReady ? 'true' : 'false'}>
        <Canvas
            shadows
            dpr={tier === 'high' ? [1, 1.75] : 1}
            frameloop={visible ? 'always' : 'never'}
            camera={{ fov: 30, position: [0, 14, 10], near: 0.1, far: 400 }}
            gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }}
            style={{ touchAction: 'none' }}
            aria-label="Bàn thí nghiệm ba chiều"
            onCreated={state => {
                glRef.current = state.gl;
                state.gl.toneMapping = hdr ? THREE.NoToneMapping : THREE.NeutralToneMapping;
                if (import.meta.env.DEV) Object.assign(window, { __ewR3F: state });
            }}
        >
            <Environment />
            <Suspense fallback={null}>
                <BenchScene {...props} hdr={hdr} />
                <ShaderWarmup warmKey={warmKey} onReady={setReady} />
            </Suspense>
            {hdr && <Suspense fallback={null}><Effects /></Suspense>}
            {isReady && !getPartIcons() && <IconBaker />}
            {!FORCED_TIER && monitor && <PerformanceMonitor onDecline={() => setTier('low')} />}
            {DEBUG_PERF && <PerfOverlay tier={tier} />}
        </Canvas>
        {!isReady && <div className="ew-canvas-veil"><span>Đang bày bàn ánh sáng…</span></div>}
    </div>;
}
