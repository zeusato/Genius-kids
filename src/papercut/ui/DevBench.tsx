// Bàn thử GĐ0 (plan mục 12, spike-report GĐ0): lưới 160² + mặt nạ 2048² + uốn trụ, kéo-gấp bằng chuột,
// cắt tự do, dập lỗ, mở ngược từng nếp. Chỉ để kiểm chứng cảm giác và đo hiệu năng — chưa phải giao diện cho bé.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FoldEntry, Op, PaperSpec } from '../model';
import { foldStack, outline } from '../engine/fold';
import { add, dist, norm, perp, scale, sub, v, type Vec } from '../engine/geom';
import { bounds, circle, contains, kerf } from '../engine/poly';
import { applyOp, initialState, replay, type StudioState } from '../engine/recipe';
import { CutMask } from '../render/maskTexture';
import { createPaperMaterial } from '../render/paperMaterial';
import { deform, layerSpans, makeGrid, type Motion } from '../render/paperMesh';

const THICK = 0.02, KERF = 0.03, MIN_DRAG = 1.2;
const PAPERS: Record<string, PaperSpec> = {
  square: { shape: 'square', w: 15, h: 15, front: '#e53935', back: '#fff4e0' },
  hexagon: { shape: 'hexagon', w: 15, h: 15, front: '#1e88e5', back: '#fffde7' },
  strip: { shape: 'strip', w: 28, h: 7, front: '#43a047', back: '#fff' },
};

type Anim = { kind: 'drag' | 'settle' | 'spring' | 'unfold' | 'quick'; motion: Motion; from: number; to: number; t0: number; dur: number; rFrom?: number; rTo?: number; done?: () => void };

export interface BenchStats { deformMs: number; maskMs: number; cutMs: number; fps: number; facets: number; folds: number; ops: number }

/** Bộ điều khiển thuần (không React state) để vòng khung hình đọc trực tiếp. */
class Bench {
  spec: PaperSpec; ops: Op[] = []; s: StudioState; anim: Anim | null = null; dirty = true; maskDirty = true;
  stroke: Vec[] = []; strokeDirty = false; stats: BenchStats = { deformMs: 0, maskMs: 0, cutMs: 0, fps: 0, facets: 1, folds: 0, ops: 0 };
  queue: (() => void)[] = []; listeners = new Set<() => void>();
  constructor(spec: PaperSpec) { this.spec = spec; this.s = initialState(spec); }
  notify() { this.stats.facets = this.s.facets.length; this.stats.folds = this.s.entries.length; this.stats.ops = this.ops.length; this.listeners.forEach(f => f()); }
  reset(spec: PaperSpec) { this.spec = spec; this.ops = []; this.s = initialState(spec); this.anim = null; this.dirty = this.maskDirty = true; this.notify(); }
  push(op: Op) {
    const t0 = performance.now();
    this.s = applyOp(this.s, op); this.ops.push(op);
    if (op.kind === 'cut') { this.stats.cutMs = performance.now() - t0; this.maskDirty = true; }
    this.dirty = true; this.notify();
  }
  undo() { if (this.anim) return; this.ops.pop(); this.s = replay(this.spec, this.ops); this.dirty = this.maskDirty = true; this.notify(); }
  span() { const fs = this.s.facets; return { top: Math.max(...fs.map(f => f.layer), 0), bottom: Math.min(...fs.map(f => f.layer), 0) }; }
  start(a: Omit<Anim, 't0'>) { this.anim = { ...a, t0: performance.now() }; this.dirty = true; }
  /** Gấp có hoạt ảnh θ: 0 → π rồi miết phẳng. */
  foldAnimated(entry: FoldEntry, done?: () => void) {
    this.start({ kind: 'quick', motion: { entry, theta: 0, r: 1.2, span: this.span() }, from: 0, to: Math.PI, dur: 550, done: () => { this.push(entry); this.settle(entry, 1.2, done); } });
  }
  settle(entry: FoldEntry, r: number, done?: () => void) {
    const span = layerSpans(foldStack(this.s.sheet, []), this.s.entries).at(-1)!;
    this.start({ kind: 'settle', motion: { entry, theta: Math.PI, r, span }, from: Math.PI, to: Math.PI, rFrom: r, rTo: THICK, dur: 260, done });
  }
  unfoldOne(done?: () => void) {
    if (this.anim || !this.s.entries.length) return done?.();
    const entry = this.s.entries.at(-1)!, span = layerSpans(foldStack(this.s.sheet, []), this.s.entries).at(-1)!;
    this.start({ kind: 'unfold', motion: { entry, theta: Math.PI, r: 1, span }, from: Math.PI, to: 0, dur: 600, done: () => { this.push({ kind: 'unfold' }); done?.(); } });
  }
  unfoldAll() { const step = () => { if (this.s.entries.length) this.unfoldOne(step); }; step(); }
  /** Mục nếp hiển thị bị động: nếp đang settle/unfold là mục cuối nên loại ra khỏi danh sách tĩnh. */
  staticEntries() { const a = this.anim; return a && (a.kind === 'settle' || a.kind === 'unfold') ? this.s.entries.slice(0, -1) : this.s.entries; }
  tick(now: number) {
    const a = this.anim;
    if (!a || a.kind === 'drag') return;
    const k = Math.min(1, (now - a.t0) / a.dur), e = 1 - (1 - k) ** 3;
    a.motion.theta = a.from + (a.to - a.from) * e;
    if (a.rFrom !== undefined) a.motion.r = a.rFrom + (a.rTo! - a.rFrom) * e;
    this.dirty = true;
    if (k >= 1) { this.anim = null; a.done?.(); }
  }
}

function matTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d')!; g.fillStyle = '#2f6b57'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i <= 40; i++) {
    const p = (i / 40) * 1024; g.strokeStyle = i % 5 ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.45)'; g.lineWidth = i % 5 ? 1 : 2;
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 1024); g.moveTo(0, p); g.lineTo(1024, p); g.stroke();
    if (i % 5 === 0 && i) { g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '18px sans-serif'; g.fillText(String(i - 20), p + 3, 20); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function Scene({ bench, mode, mountain }: { bench: Bench; mode: 'fold' | 'cut' | 'punch'; mountain: boolean }) {
  const { gl, camera } = useThree();
  const spec = bench.spec;
  const res = useMemo(() => {
    const pad = 0.2, x0 = -spec.w / 2 - pad, y0 = -spec.h / 2 - pad, w = spec.w + 2 * pad, h = spec.h + 2 * pad;
    const grid = makeGrid(160, x0, y0, w, h), mask = new CutMask({ x0, y0, w, h });
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((grid.paper.length / 2) * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(grid.uv, 2));
    geo.setIndex(new THREE.BufferAttribute(grid.index, 1));
    const paper = createPaperMaterial(spec.front, spec.back, mask.texture);
    return { grid, mask, geo, pos, paper, mat: matTexture() };
  }, [spec]);
  useEffect(() => () => { res.mask.dispose(); res.geo.dispose(); res.paper.mat.dispose(); res.paper.depth.dispose(); res.mat.dispose(); }, [res]);
  useEffect(() => { bench.dirty = bench.maskDirty = true; }, [res, bench]);

  const strokeLine = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 4096), 3)); g.setDrawRange(0, 0); return g; }, []);
  const frames = useRef({ n: 0, t: performance.now() });

  useFrame(() => {
    const now = performance.now();
    bench.tick(now);
    if (bench.maskDirty) { bench.stats.maskMs = res.mask.draw(bench.s.sheet); bench.maskDirty = false; }
    if (bench.dirty) {
      const entries = bench.staticEntries();
      const spans = layerSpans(foldStack(bench.s.sheet, []), entries);
      bench.stats.deformMs = deform(res.grid, entries, spans, bench.anim?.motion ?? null, THICK, res.pos);
      res.geo.attributes.position.needsUpdate = true; res.geo.computeVertexNormals(); res.geo.computeBoundingSphere();
      bench.dirty = false;
    }
    if (bench.strokeDirty) {
      const a = strokeLine.attributes.position as THREE.BufferAttribute, n = Math.min(bench.stroke.length, 4096);
      const top = (bench.span().top + 1.5) * THICK + 0.05;
      for (let i = 0; i < n; i++) a.setXYZ(i, bench.stroke[i].x, top, -bench.stroke[i].y);
      a.needsUpdate = true; strokeLine.setDrawRange(0, n); bench.strokeDirty = false;
    }
    const f = frames.current; f.n++;
    if (now - f.t > 1000) { bench.stats.fps = (f.n * 1000) / (now - f.t); f.n = 0; f.t = now; bench.notify(); }
  });

  // Chuột/cảm ứng → toạ độ xấp (mặt bàn y = 0, trục y của giấy = −z của three).
  useEffect(() => {
    const el = gl.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    const at = (e: PointerEvent): Vec | null => {
      const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); return ray.ray.intersectPlane(plane, hit) ? v(hit.x, -hit.z) : null;
    };
    let P: Vec | null = null, id = -1;
    const down = (e: PointerEvent) => {
      if (bench.anim || e.button !== 0) return;
      const q = at(e); if (!q) return;
      if (mode === 'punch') { bench.push({ kind: 'cut', region: circle(q.x, q.y, 0.7, 64), tool: 'punch' }); return; }
      if (mode === 'fold' && !contains(outline(bench.s.facets), q)) return;
      P = q; id = e.pointerId; el.setPointerCapture(id);
      if (mode === 'cut') { bench.stroke = [q]; bench.strokeDirty = true; }
    };
    const move = (e: PointerEvent) => {
      if (!P || e.pointerId !== id) return;
      const F = at(e); if (!F) return;
      if (mode === 'cut') {
        if (dist(F, bench.stroke.at(-1)!) > 0.08) { bench.stroke.push(F); bench.strokeDirty = true; }
        return;
      }
      const d = dist(P, F); if (d < 0.05) return;
      const entry: FoldEntry = { kind: 'fold', p: scale(add(P, F), 0.5), n: norm(sub(P, F)), valley: !mountain };
      bench.anim = { kind: 'drag', motion: { entry, theta: Math.PI, r: Math.min(2, Math.max(0.3, 0.25 * d)), span: bench.span() }, from: Math.PI, to: Math.PI, t0: 0, dur: 1 };
      bench.dirty = true;
    };
    const up = (e: PointerEvent) => {
      if (!P || e.pointerId !== id) return;
      try { el.releasePointerCapture(id); } catch { /* đã nhả */ }
      const start = P; P = null;
      if (mode === 'cut') {
        const stroke = bench.stroke; bench.stroke = []; bench.strokeDirty = true;
        if (stroke.length > 1) bench.push({ kind: 'cut', region: kerf(stroke, KERF), tool: 'free' });
        return;
      }
      const a = bench.anim; if (!a || a.kind !== 'drag') return;
      const F = at(e) ?? start, entry = a.motion.entry;
      if (dist(start, F) < MIN_DRAG) bench.start({ kind: 'spring', motion: a.motion, from: Math.PI, to: 0, dur: 220 });
      else { bench.anim = null; bench.push(entry); bench.settle(entry, a.motion.r); }
    };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, [gl, camera, bench, mode, mountain]);

  return <>
    <hemisphereLight args={['#fffaf0', '#8a7a6a', 0.9]} />
    <directionalLight position={[-8, 30, 12]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-0.0004} shadow-radius={4} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={res.mat} roughness={0.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#b98d61" roughness={0.9} /></mesh>
    <mesh geometry={res.geo} material={res.paper.mat} customDepthMaterial={res.paper.depth} castShadow receiveShadow />
    <line>
      <primitive object={strokeLine} attach="geometry" />
      <lineBasicMaterial color="#111" />
    </line>
  </>;
}

export function DevBench() {
  const [paper, setPaper] = useState<keyof typeof PAPERS>('square');
  const bench = useMemo(() => new Bench(PAPERS.square), []);
  const [mode, setMode] = useState<'fold' | 'cut' | 'punch'>('fold');
  const [mountain, setMountain] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => { const f = () => setTick(t => t + 1); bench.listeners.add(f); return () => { bench.listeners.delete(f); }; }, [bench]);
  useEffect(() => { bench.reset(PAPERS[paper]); }, [bench, paper]);
  // Móc cho kiểm thử tự động trong trình duyệt.
  useEffect(() => {
    (window as unknown as { __papercut?: unknown }).__papercut = {
      bench, fold: (px: number, py: number, fx: number, fy: number, valley = true) => bench.foldAnimated({ kind: 'fold', p: scale(add(v(px, py), v(fx, fy)), 0.5), n: norm(sub(v(px, py), v(fx, fy))), valley }),
      cut: (pts: [number, number][]) => bench.push({ kind: 'cut', region: kerf(pts.map(([x, y]) => v(x, y)), KERF), tool: 'free' }),
      unfoldAll: () => bench.unfoldAll(),
    };
  }, [bench]);

  const quick = (kind: 'v' | 'h' | 'd') => {
    if (bench.anim) return;
    const b = bounds(outline(bench.s.facets)), c = v((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    const n = kind === 'v' ? v(1, 0) : kind === 'h' ? v(0, 1) : norm(perp(v(b.x1 - b.x0, b.y1 - b.y0)));
    bench.foldAnimated({ kind: 'fold', p: c, n, valley: true });
  };
  const s = bench.stats;
  return <div className="pc-dev">
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 24, 13], fov: 42, near: 0.1, far: 300 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0.5)} gl={{ antialias: true }}>
      <color attach="background" args={['#3b2f26']} />
      <Scene key={paper} bench={bench} mode={mode} mountain={mountain} />
    </Canvas>
    <div className="pc-dev-bar">
      <select value={paper} onChange={e => setPaper(e.target.value as keyof typeof PAPERS)}>{Object.keys(PAPERS).map(k => <option key={k}>{k}</option>)}</select>
      {(['fold', 'cut', 'punch'] as const).map(m => <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{{ fold: 'Gấp (kéo)', cut: 'Kéo cắt', punch: 'Dập lỗ' }[m]}</button>)}
      <label><input type="checkbox" checked={mountain} onChange={e => setMountain(e.target.checked)} /> gấp lồi</label>
      <span className="sep" />
      <button onClick={() => quick('v')}>Gấp đôi dọc</button>
      <button onClick={() => quick('h')}>Gấp đôi ngang</button>
      <button onClick={() => quick('d')}>Gấp chéo</button>
      <span className="sep" />
      <button onClick={() => bench.unfoldOne()}>Mở một nếp</button>
      <button onClick={() => bench.unfoldAll()}>Mở ra!</button>
      <button onClick={() => bench.undo()}>Hoàn tác</button>
    </div>
    <pre className="pc-dev-stats">{`fps ${s.fps.toFixed(0)} · biến dạng ${s.deformMs.toFixed(2)} ms · mặt nạ ${s.maskMs.toFixed(1)} ms · cắt ${s.cutMs.toFixed(1)} ms\n${s.folds} nếp · ${s.facets} facet · ${s.ops} thao tác`}</pre>
  </div>;
}
