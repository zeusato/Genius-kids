import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { SceneInteractionBoundary } from '../../shared/SceneInteractionBoundary';
import { PerfOverlay } from '../../solar/scene3d/PerfOverlay';
import { Backdrop, Branches, EraRings, Tips } from './TreeMeshes';
import { CameraApi, CameraRig, FOV, Insets } from './CameraRig';
import { LabelLayer } from './LabelLayer';
import { DEBUG_PERF, FORCED_TIER, FX_DISABLED, QualityTier } from './params';
import type { AtlasInfo, EvoWorld } from './world';

const Effects = lazy(() => import('./Effects'));

interface Props {
    world: EvoWorld;
    atlasInfo: AtlasInfo;
    cameraApi: React.MutableRefObject<CameraApi | null>;
    insets: React.MutableRefObject<Insets>;
    onPick: (i: number | null) => void;
    onReady: () => void;
    onContextLost: () => void;
    paused: boolean;
    labelsHidden: boolean;
    avatarHtml: string;
    reducedMotion: boolean;
}

// Biên dịch shader song song (KHR_parallel_shader_compile) trước khi vẽ frame đầu — bài học Tế bào:
// vừa vẽ vừa biên dịch trên ANGLE làm GPU nghẽn ~2 s/khung.
function ShaderWarmup({ tier, onReady }: { tier: QualityTier; onReady: () => void }) {
    const gl = useThree(s => s.gl), scene = useThree(s => s.scene), camera = useThree(s => s.camera);
    useEffect(() => {
        let alive = true;
        let raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => {
                const t0 = performance.now();
                gl.compileAsync(scene, camera).catch(() => undefined).then(() => {
                    if (!alive) return;
                    if (import.meta.env.DEV) console.info(`[evo] shader ${tier}: ${Math.round(performance.now() - t0)} ms`);
                    onReady();
                });
            });
        });
        return () => { alive = false; cancelAnimationFrame(raf); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tier]);
    return null;
}

/** Vòng frame: cập nhật world, nghiêng hologram, nhãn, chọn bằng chạm. */
function Driver({ world, groupRef, labelsRef, labelsHidden, onPick, tier, reducedMotion }: {
    world: EvoWorld; groupRef: React.RefObject<THREE.Group | null>; labelsRef: React.MutableRefObject<LabelLayer | null>;
    labelsHidden: boolean; onPick: (i: number | null) => void; tier: QualityTier; reducedMotion: boolean;
}) {
    const { gl, camera, size, pointer, raycaster } = useThree();
    const tilt = useRef(new THREE.Vector2());
    const hover = useRef(0);
    useFrame((state, dt) => {
        world.update(Math.min(0.1, dt), state.clock.elapsedTime);
        const g = groupRef.current;
        if (g) {
            const allow = tier === 'high' && !reducedMotion && window.matchMedia?.('(pointer: fine)').matches;
            tilt.current.lerp(allow ? new THREE.Vector2(pointer.x, pointer.y) : new THREE.Vector2(0, 0), Math.min(1, dt * 2));
            g.rotation.y = tilt.current.x * 0.045;
            g.rotation.x = -tilt.current.y * 0.035;
            g.updateMatrixWorld();
            if (labelsRef.current) {
                labelsRef.current.hidden = labelsHidden;
                labelsRef.current.update(world, g, camera, size.width, size.height, state.clock.elapsedTime * 1000);
            }
        }
        // con trỏ tay khi trỏ trúng node (desktop, ~8 Hz)
        hover.current += dt;
        if (hover.current > 0.12 && g) {
            hover.current = 0;
            const p = localPoint(g, raycaster, camera, pointer);
            gl.domElement.style.cursor = p && world.pick(p.x, p.y, world.uniforms.uPxPerUnit.value) !== null ? 'pointer' : '';
        }
    });
    useEffect(() => {
        const el = gl.domElement;
        const onClick = (e: MouseEvent) => {
            const g = groupRef.current;
            if (!g) return;
            const r = el.getBoundingClientRect();
            const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            const p = localPoint(g, raycaster, camera, ndc);
            onPick(p ? world.pick(p.x, p.y, world.uniforms.uPxPerUnit.value) : null);
        };
        el.addEventListener('click', onClick);
        return () => el.removeEventListener('click', onClick);
    }, [gl, camera, raycaster, world, groupRef, onPick]);
    return null;
}

const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _hit = new THREE.Vector3();
const _inv = new THREE.Matrix4();
const _ray = new THREE.Ray();
function localPoint(g: THREE.Group, raycaster: THREE.Raycaster, camera: THREE.Camera, ndc: THREE.Vector2) {
    raycaster.setFromCamera(ndc, camera);
    _inv.copy(g.matrixWorld).invert();
    _ray.copy(raycaster.ray).applyMatrix4(_inv);                // đổi tia sang hệ tọa độ cây (có nghiêng hologram)
    return _ray.intersectPlane(_plane, _hit) ? { x: _hit.x, y: _hit.y } : null;
}

export const EvoScene3D: React.FC<Props> = ({ world, atlasInfo, cameraApi, insets, onPick, onReady, onContextLost, paused, labelsHidden, avatarHtml, reducedMotion }) => {
    const [tier, setTier] = useState<QualityTier>(FORCED_TIER ?? 'high');
    const [ready, setReady] = useState(false);
    const groupRef = useRef<THREE.Group>(null);
    const labelHost = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<LabelLayer | null>(null);
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    useEffect(() => {
        if (!labelHost.current) return;
        const l = new LabelLayer(labelHost.current, avatarHtml);
        l.onPick = (i) => onPick(i === -2 ? world.youAreHere : i);
        labelsRef.current = l;
        return () => { l.dispose(); labelsRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [avatarHtml, world]);
    useEffect(() => { if (labelsRef.current) labelsRef.current.onPick = (i) => onPick(i === -2 ? world.youAreHere : i); }, [onPick, world]);
    useEffect(() => { if (glRef.current) glRef.current.toneMapping = tier === 'high' && !FX_DISABLED ? THREE.NoToneMapping : THREE.NeutralToneMapping; }, [tier]);

    // PerformanceMonitor chỉ đo khi đã ổn định và trang đang hiển thị (tránh hạ tier oan khi cửa sổ bị che)
    const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
    useEffect(() => {
        const on = () => setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', on);
        return () => document.removeEventListener('visibilitychange', on);
    }, []);
    const [monitor, setMonitor] = useState(false);
    useEffect(() => {
        if (!ready || !visible) { setMonitor(false); return; }
        const t = window.setTimeout(() => setMonitor(true), 4000);
        return () => window.clearTimeout(t);
    }, [ready, visible]);

    return (
        <SceneInteractionBoundary>
            <div className="absolute inset-0">
                <Canvas
                    dpr={tier === 'high' ? [1, 1.75] : 1}
                    frameloop={paused || !ready ? 'never' : 'always'}
                    camera={{ fov: FOV, position: [0, 480, 3000], near: 1, far: 12000 }}
                    gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
                    style={{ touchAction: 'none' }}
                    onCreated={(state) => {
                        const { gl } = state;
                        glRef.current = gl;
                        gl.toneMapping = tier === 'high' && !FX_DISABLED ? THREE.NoToneMapping : THREE.NeutralToneMapping;
                        gl.setClearColor('#04070f');
                        if (import.meta.env.DEV) Object.assign(window, { __evoR3F: state, __evoWorld: world });
                        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onContextLost(); });
                    }}
                >
                    <Backdrop world={world} tier={tier} />
                    <group ref={groupRef}>
                        <EraRings world={world} />
                        <Branches world={world} tier={tier} />
                        <Suspense fallback={null}>
                            <Tips world={world} atlasInfo={atlasInfo} />
                            <ShaderWarmup tier={tier} onReady={() => { setReady(true); onReady(); }} />
                        </Suspense>
                    </group>
                    {tier === 'high' && !FX_DISABLED && (
                        <Suspense fallback={null}>
                            <Effects />
                        </Suspense>
                    )}
                    <CameraRig world={world} insets={insets} apiRef={cameraApi} reducedMotion={reducedMotion} />
                    <Driver world={world} groupRef={groupRef} labelsRef={labelsRef} labelsHidden={labelsHidden || !ready} onPick={onPick} tier={tier} reducedMotion={reducedMotion} />
                    {!FORCED_TIER && monitor && <PerformanceMonitor onDecline={() => setTier('low')} />}
                    {DEBUG_PERF && <PerfOverlay tier={tier} />}
                </Canvas>
                <div ref={labelHost} className="absolute inset-0 pointer-events-none overflow-hidden" />
            </div>
        </SceneInteractionBoundary>
    );
};
