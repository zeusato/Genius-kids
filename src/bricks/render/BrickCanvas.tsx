import { EffectComposer, N8AO } from '@react-three/postprocessing';
// Khung 3D của xưởng (plan mục 8): cảnh, ánh sáng phòng chụp, mặt bàn, camera điều khiển bằng API (không tự nghe pointer).
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { V3 } from '../engine/types';
import type { Quality } from './materials';

/** LDraw (LDU, Y xuống) → three.js: quay 180° quanh X rồi chia 20 (1 núm = 1 đơn vị). */
export const LDRAW_TO_WORLD = new THREE.Matrix4().makeRotationX(Math.PI).premultiply(new THREE.Matrix4().makeScale(1 / 20, 1 / 20, 1 / 20));
export const toWorld = (p: V3) => new THREE.Vector3(p[0] / 20, -p[1] / 20, -p[2] / 20);

export interface CanvasApi {
  /** Tia từ điểm màn hình (px trong khung) → gốc + hướng trong toạ độ LDraw. */
  ray(x: number, y: number): { o: V3; d: V3 } | null;
  /** Chiếu điểm LDraw ra màn hình (px). */
  project(p: V3): { x: number; y: number } | null;
  orbit(dx: number, dy: number): void;
  zoom(scale: number): void;
  pan(dx: number, dy: number): void;
  fit(box: [V3, V3] | null, smooth?: boolean): void;
  view(name: 'front' | 'right' | 'top' | 'iso'): void;
  autoRotate(on: boolean): void;
  /** Đặt góc nhìn (độ): phương vị quanh trục đứng, góc nghiêng từ đỉnh. */
  angle(azimuthDeg: number, polarDeg: number, smooth?: boolean): void;
  invalidate(): void;
  gl(): THREE.WebGLRenderer | null;
  /** Ảnh thu nhỏ của khung hiện tại (vẽ lại rồi chép ngay, không cần preserveDrawingBuffer). */
  snapshot(width: number, height: number): Promise<Blob | null>;
}

interface Props { model: THREE.Object3D; overlay: THREE.Object3D; quality: Quality; reducedMotion?: boolean; onContextLost?: (lost: boolean) => void; /** bản thử: giữ bộ đệm để chụp ảnh canvas */ capture?: boolean; /** chụp ảnh headless: vẽ liên tục */ alwaysRender?: boolean }

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    // Sinh môi trường tại chỗ (không tải HDR qua mạng — bẫy PWA offline)
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const tex = pmrem.fromScene(room, 0.04).texture; room.dispose();
    scene.environment = tex;
    scene.environmentIntensity = 0.6;
    return () => { scene.environment = null; tex.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}

const Inner = forwardRef<CanvasApi, Props>(function Inner({ model, overlay, quality, reducedMotion, onContextLost }, ref) {
  const { camera, gl, size, invalidate, scene } = useThree();
  const controls = useRef<CameraControls>(null);
  const spin = useRef<number | null>(null);
  const root = useMemo(() => { const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(LDRAW_TO_WORLD); return g; }, []);
  useEffect(() => { root.add(model, overlay); invalidate(); return () => { root.remove(model, overlay); }; }, [root, model, overlay, invalidate]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    // Máy trạng thái là nơi DUY NHẤT nhận pointer (bẫy mục 17): tắt bộ nghe của camera-controls.
    c.mouseButtons.left = 0; c.mouseButtons.right = 0; c.mouseButtons.middle = 0; c.mouseButtons.wheel = 0;
    c.touches.one = 0; c.touches.two = 0; c.touches.three = 0;
    c.minPolarAngle = THREE.MathUtils.degToRad(8);
    c.maxPolarAngle = THREE.MathUtils.degToRad(100);
    c.minDistance = 3; c.maxDistance = 120;
    c.smoothTime = reducedMotion ? 0.05 : 0.18;
    c.setLookAt(14, 13, 18, 0, 1, 0, false);
    const onUpdate = () => invalidate();
    c.addEventListener('update', onUpdate);
    return () => c.removeEventListener('update', onUpdate);
  }, [invalidate, reducedMotion]);

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => { e.preventDefault(); onContextLost?.(true); };
    const restored = () => { onContextLost?.(false); invalidate(); };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored); };
  }, [gl, invalidate, onContextLost]);

  useImperativeHandle(ref, () => {
    const inv = new THREE.Matrix4().copy(LDRAW_TO_WORLD).invert();
    const ray = new THREE.Raycaster();
    return {
      ray(x, y) {
        ray.setFromCamera(new THREE.Vector2((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1), camera);
        const o = ray.ray.origin.clone().applyMatrix4(inv), d = ray.ray.direction.clone().transformDirection(inv);
        return { o: [o.x, o.y, o.z], d: [d.x, d.y, d.z] };
      },
      project(p) {
        const v = toWorld(p).project(camera);
        if (v.z > 1) return null;
        return { x: (v.x + 1) / 2 * size.width, y: (1 - v.y) / 2 * size.height };
      },
      orbit(dx, dy) { controls.current?.rotate(-dx * 0.008, -dy * 0.008, true); },
      zoom(scale) { const c = controls.current; if (c) c.dolly(c.distance * (1 - 1 / scale), true); },
      pan(dx, dy) { const c = controls.current; if (c) c.truck(-dx * c.distance * 0.0016, -dy * c.distance * 0.0016, true); },
      fit(box, smooth = true) {
        const c = controls.current; if (!c) return;
        if (!box) { c.setLookAt(14, 13, 18, 0, 1, 0, smooth); return; }
        const a = toWorld(box[0]), b = toWorld(box[1]);
        // Tự tính khoảng cách (fitToBox của camera-controls tự xoay camera về mặt thẳng của hộp — làm mất góc nghiêng).
        const b3 = new THREE.Box3().setFromPoints([a, b]);
        const center = b3.getCenter(new THREE.Vector3()), radius = b3.getSize(new THREE.Vector3()).length() / 2 + 1;
        const fov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov ?? 38);
        const dist = radius / Math.sin(Math.min(fov, fov * (size.width / size.height)) / 2) * 0.95;
        const dir = new THREE.Vector3(); c.getPosition(dir); const t = new THREE.Vector3(); c.getTarget(t); dir.sub(t).normalize();
        c.setLookAt(center.x + dir.x * dist, center.y + dir.y * dist, center.z + dir.z * dist, center.x, center.y, center.z, smooth);
      },
      view(name) {
        const c = controls.current; if (!c) return;
        const t = new THREE.Vector3(); c.getTarget(t); const d = Math.max(c.distance, 10);
        const pos = { front: [t.x, t.y + d * 0.25, t.z + d], right: [t.x + d, t.y + d * 0.25, t.z], top: [t.x, t.y + d, t.z + 0.01], iso: [t.x + d * 0.6, t.y + d * 0.55, t.z + d * 0.6] }[name];
        c.setLookAt(pos[0], pos[1], pos[2], t.x, t.y, t.z, !reducedMotion);
      },
      angle(az, polar, smooth = true) { controls.current?.rotateTo(THREE.MathUtils.degToRad(az), THREE.MathUtils.degToRad(polar), smooth); },
      autoRotate(on) {
        if (spin.current) { cancelAnimationFrame(spin.current); spin.current = null; }
        if (!on || reducedMotion) return;
        let last = performance.now(); const start = last;
        const step = (now: number) => { if (document.hidden || now - start >= 8000) { spin.current = null; return; } controls.current?.rotate(((now - last) / 8000) * Math.PI * 2, 0, false); last = now; invalidate(); spin.current = requestAnimationFrame(step); };
        spin.current = requestAnimationFrame(step);
      },
      invalidate,
      gl: () => gl,
      snapshot(width, height) {
        gl.render(scene, camera);
        const src = gl.domElement, out = document.createElement('canvas');
        out.width = width; out.height = height;
        const ctx = out.getContext('2d'); if (!ctx) return Promise.resolve(null);
        // cắt giữa theo tỉ lệ đích
        const r = width / height, sw = Math.min(src.width, src.height * r), sh = sw / r;
        ctx.fillStyle = '#eef2f6'; ctx.fillRect(0, 0, width, height);
        ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, width, height);
        return new Promise(res => out.toBlob(b => { out.width = out.height = 0; res(b); }, 'image/webp', 0.8));
      },
    };
  }, [camera, size, invalidate, gl, reducedMotion, scene]);

  useEffect(() => () => { if (spin.current) cancelAnimationFrame(spin.current); }, []);

  const shadowSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <Env />
      {quality !== "low" && <EffectComposer multisampling={0}><N8AO aoRadius={0.5} intensity={1.1} quality={quality === "high" ? "high" : "performance"} halfRes={quality === "mid"} /></EffectComposer>}
      <CameraControls ref={controls} makeDefault />
      <hemisphereLight args={['#ffffff', '#c9d3df', 0.55]} />
      <directionalLight position={[18, 30, 14]} intensity={1.6} castShadow={quality !== 'low'}
        shadow-mapSize-width={shadowSize} shadow-mapSize-height={shadowSize} shadow-bias={-0.0004} shadow-normalBias={0.02}
        shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34} shadow-camera-near={1} shadow-camera-far={90} />
      <primitive object={root} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.002, 0]}>
        <planeGeometry args={[64, 64]} />
        <meshStandardMaterial color="#eef2f6" roughness={0.95} />
      </mesh>
      <Grid position={[0, 0.001, 0]} args={[64, 64]} cellSize={1} sectionSize={8} cellThickness={0.6} sectionThickness={1.1}
        cellColor="#cfd8e3" sectionColor="#a7b6c8" fadeDistance={70} fadeStrength={1.5} infiniteGrid={false} />
    </>
  );
});

export const BrickCanvas = forwardRef<CanvasApi, Props>(function BrickCanvas(props, ref) {
  const dpr: [number, number] = props.quality === 'high' ? [1, 2] : props.quality === 'mid' ? [1, 1.5] : [1, 1];
  return (
    <Canvas frameloop={props.alwaysRender ? 'always' : 'demand'} shadows={props.quality !== 'low' ? 'soft' : false} dpr={dpr}
      camera={{ fov: 38, near: 0.1, far: 400, position: [14, 13, 18] }}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!props.capture }}
      style={{ touchAction: 'none' }} aria-label="Bàn lắp ghép 3D">
      <Inner ref={ref} {...props} />
    </Canvas>
  );
});
