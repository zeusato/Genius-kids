import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PerfOverlay } from '../../solar/scene3d/PerfOverlay';
import { CAM_Z, FOV } from './screen';
import { DEBUG_PERF, FORCED_TIER, FX_DISABLED, type QualityTier } from './params';

const Effects = lazy(() => import('./Effects'));

export type CanvasMode = 'table' | 'element' | 'lab';

// Môi trường phản chiếu sinh bằng code (không tải HDR) — kim loại, thủy tinh, thủy ngân đều dùng.
function Environment() {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene);
    useEffect(() => {
        const pm = new THREE.PMREMGenerator(gl);
        const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = env;
        return () => { scene.environment = null; env.dispose(); pm.dispose(); };
    }, [gl, scene]);
    return null;
}

// Biên dịch shader song song (KHR_parallel_shader_compile) trước frame đầu — bài học Tế bào (ANGLE nghẽn
// ~2 s/khung nếu vừa vẽ vừa biên dịch). `warmKey` đổi (lần đầu mở sân khấu, lab…) → biên dịch nền lượt mới.
function ShaderWarmup({ warmKey, onReady }: { warmKey: string; onReady: (k: string) => void }) {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene), camera = useThree(s => s.camera);
    useEffect(() => {
        let alive = true, done = false;
        const finish = (why: string, t0: number) => {
            if (!alive || done) return;
            done = true;
            if (import.meta.env.DEV) console.info(`[ptable] shader ${warmKey}: ${Math.round(performance.now() - t0)} ms (${why})`);
            onReady(warmKey);
        };
        // An toàn: compileAsync của three có thể văng lỗi nội bộ (vật liệu bị thay giữa chừng → program
        // undefined) và KHÔNG BAO GIỜ resolve → sân khấu kẹt màn chờ. Quá 2,5 s thì vẫn cho vẽ.
        let safety = 0;
        let raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => {
                const t0 = performance.now();
                safety = window.setTimeout(() => finish('hẹn giờ', t0), 2500);
                try {
                    gl.compileAsync(scene, camera).catch(() => undefined).then(() => finish('xong', t0));
                } catch { finish('lỗi', t0); }
            });
        });
        return () => { alive = false; cancelAnimationFrame(raf); window.clearTimeout(safety); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [warmKey]);
    return null;
}

interface Props {
    mode: CanvasMode;
    /** Có FX đang chạy ở chế độ bảng (mở màn, bọt khí…) → vẽ liên tục; không thì ngừng vẽ. */
    active: boolean;
    warmKey: string;
    onReady: (k: string) => void;
    onContextLost: () => void;
    onTier?: (t: QualityTier) => void;
    children: (tier: QualityTier) => React.ReactNode;
}

/**
 * MỘT canvas trong suốt phủ cả trang, mount một lần rồi không bao giờ unmount:
 *  - chế độ 'table': pointer-events none, chỉ vẽ FX bám ô (bọt, bụi sao mở màn); rảnh thì frameloop 'never'
 *  - 'element' / 'lab': nhận chạm; nền sân khấu là DOM phía dưới, canvas vẫn trong suốt
 * Composer (tier cao) chạy ở mọi chế độ nên không phải đổi tone mapping khi chuyển (tránh biên dịch lại).
 */
export const PeriodicCanvas: React.FC<Props> = ({ mode, active, warmKey, onReady, onContextLost, onTier, children }) => {
    const [tier, setTier] = useState<QualityTier>(FORCED_TIER ?? 'high');
    const [readyKey, setReadyKey] = useState<string | null>(null);
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const ready = readyKey === `${warmKey}/${tier}`;
    const useFx = tier === 'high' && !FX_DISABLED;
    useEffect(() => { if (glRef.current) glRef.current.toneMapping = useFx ? THREE.NoToneMapping : THREE.NeutralToneMapping; }, [useFx]);
    useEffect(() => { onTier?.(tier); }, [tier, onTier]);

    const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
    useEffect(() => {
        const on = () => setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', on);
        return () => document.removeEventListener('visibilitychange', on);
    }, []);
    const running = ready && visible && (mode !== 'table' || active);
    if (import.meta.env.DEV) (window as any).__ptDebug = { readyKey, warmKey, tier, visible, mode, active, running };
    const [monitor, setMonitor] = useState(false);
    useEffect(() => {
        if (!running || mode === 'table') { setMonitor(false); return; }
        const t = window.setTimeout(() => setMonitor(true), 4000);
        return () => window.clearTimeout(t);
    }, [running, mode]);

    return (
        <div data-ptcanvas className="fixed inset-0" style={{ zIndex: mode === 'table' ? 35 : 45, pointerEvents: mode === 'table' ? 'none' : 'auto' }}>
            <Canvas
                dpr={tier === 'high' ? [1, 1.75] : 1}
                frameloop={running ? 'always' : 'never'}
                camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.05, far: 100 }}
                gl={{ alpha: true, antialias: false, premultipliedAlpha: true, stencil: false, powerPreference: 'high-performance' }}
                style={{ touchAction: 'none', background: 'transparent' }}
                onCreated={(state) => {
                    const { gl } = state;
                    glRef.current = gl;
                    gl.setClearColor(0x000000, 0);
                    gl.toneMapping = useFx ? THREE.NoToneMapping : THREE.NeutralToneMapping;
                    if (import.meta.env.DEV) Object.assign(window, { __ptR3F: state });
                    gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onContextLost(); });
                }}
            >
                <Environment />
                <directionalLight position={[4, 6, 7]} intensity={1.3} />
                <ambientLight intensity={0.25} />
                <Suspense fallback={null}>
                    {children(tier)}
                    <ShaderWarmup warmKey={`${warmKey}/${tier}`} onReady={setReadyKey} />
                </Suspense>
                {useFx && (
                    <Suspense fallback={null}>
                        <Effects />
                    </Suspense>
                )}
                {!FORCED_TIER && monitor && <PerformanceMonitor onDecline={() => setTier('low')} />}
                {DEBUG_PERF && <PerfOverlay tier={tier} />}
                <ReadyReporter ready={ready} warmKey={warmKey} onReady={onReady} />
            </Canvas>
        </div>
    );
};

function ReadyReporter({ ready, warmKey, onReady }: { ready: boolean; warmKey: string; onReady: (k: string) => void }) {
    useEffect(() => { if (ready) onReady(warmKey); }, [ready, warmKey, onReady]);
    return null;
}
