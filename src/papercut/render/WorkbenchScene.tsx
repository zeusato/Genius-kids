// Cảnh 3D của bàn cắt giấy (plan mục 6): lưới 160² + mặt nạ 2048² + uốn trụ, vết nếp, mảnh vụn rơi,
// nét kéo đang vẽ, nét chấm gợi ý của mẫu, nam châm gấp. Chuột/cảm ứng → toạ độ xấp (mặt bàn y = 0, y giấy = −z).
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FoldEntry } from '../model';
import { foldStack, outline } from '../engine/fold';
import { add, dist, norm, scale, sub, v, type Vec } from '../engine/geom';
import { circle, contains, kerf, triangles } from '../engine/poly';
import { snapFold, snapLines, type SnapLine } from '../engine/snap';
import { cleanStroke } from '../input/cutStroke';
import { Bench, KERF, MIN_DRAG, THICK } from '../state/bench';
import { CutMask } from './maskTexture';
import { createPaperMaterial } from './paperMaterial';
import { deform, layerSpans, makeGrid } from './paperMesh';

export type Tool = 'fold' | 'cut' | 'punch';

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

interface Scrap { mesh: THREE.Mesh; t0: number; from: THREE.Vector3; drift: THREE.Vector3; spin: number }

export function WorkbenchScene({ bench, tool, mountain, preschool }: { bench: Bench; tool: Tool; mountain: boolean; preschool: boolean }) {
  const { gl, camera, scene } = useThree();
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
  useEffect(() => { bench.dirty = bench.maskDirty = bench.guideDirty = true; }, [res, bench]);
  // Camera lùi theo cỡ giấy để tờ dải dài vẫn nằm gọn giữa các thanh dụng cụ.
  useEffect(() => {
    const k = Math.max(1, Math.max(spec.w, spec.h * 1.4) / 15 * 0.82);
    camera.position.set(0, 24 * k, 13 * k); camera.lookAt(0, 0, 0.5 * k); camera.updateProjectionMatrix();
  }, [camera, spec.w, spec.h]);

  const strokeLine = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 4096), 3)); g.setDrawRange(0, 0); return g; }, []);
  const guideGeo = useMemo(() => new THREE.BufferGeometry(), []);
  const guideRef = useRef<THREE.LineSegments>(null);
  const scrapGroup = useRef<THREE.Group>(null);
  const scraps = useRef<Scrap[]>([]);
  const frames = useRef({ n: 0, t: performance.now() });

  // Chụp khung hình (thumbnail, bìa tài liệu): vẽ lại rồi chép ngay trong cùng tác vụ — không cần preserveDrawingBuffer.
  useEffect(() => {
    bench.capture = (w = 1200, h = 800) => {
      const src = gl.domElement; if (!src.width) return null;
      gl.render(scene, camera);
      // khung bao tờ giấy trên màn hình (chiếu 4 góc tờ giấy gốc) → cắt sát tác phẩm, chừa lề 8%
      const half = new THREE.Vector3(), xs: number[] = [], ys: number[] = [];
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { half.set(sx * spec.w / 2, 0, -sy * spec.h / 2).project(camera); xs.push((half.x + 1) / 2 * src.width); ys.push((1 - half.y) / 2 * src.height); }
      let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const pw = (x1 - x0) * 0.08, ph = (y1 - y0) * 0.08; x0 -= pw; x1 += pw; y0 -= ph; y1 += ph;
      // giữ đúng tỉ lệ khung ra
      const want = w / h, cw = x1 - x0, ch = y1 - y0;
      if (cw / ch < want) { const d = ch * want - cw; x0 -= d / 2; x1 += d / 2; } else { const d = cw / want - ch; y0 -= d / 2; y1 += d / 2; }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d')!.drawImage(src, x0, y0, x1 - x0, y1 - y0, 0, 0, w, h);
      return c;
    };
    return () => { bench.capture = null; };
  }, [bench, gl, scene, camera, spec]);

  useFrame(() => {
    const now = performance.now();
    bench.tick(now);
    if (bench.maskDirty) { bench.stats.maskMs = res.mask.draw(bench.s.sheet, bench.creases); bench.maskDirty = false; }
    if (bench.dirty) {
      const entries = bench.staticEntries();
      const spans = layerSpans(foldStack(bench.s.sheet, []), entries);
      bench.stats.deformMs = deform(res.grid, entries, spans, bench.anim?.motion ?? null, THICK, res.pos);
      res.geo.attributes.position.needsUpdate = true; res.geo.computeVertexNormals(); res.geo.computeBoundingSphere();
      bench.dirty = false;
    }
    const top = (bench.span().top - bench.span().bottom + 1.5) * THICK + 0.05;
    if (bench.strokeDirty) {
      const a = strokeLine.attributes.position as THREE.BufferAttribute, n = Math.min(bench.stroke.length, 4096);
      for (let i = 0; i < n; i++) a.setXYZ(i, bench.stroke[i].x, top, -bench.stroke[i].y);
      a.needsUpdate = true; strokeLine.setDrawRange(0, n); bench.strokeDirty = false;
    }
    if (bench.guideDirty) {
      const pts: number[] = [];
      for (const s of bench.guide) for (let i = 0; i + 1 < s.length; i++) pts.push(s[i].x, top, -s[i].y, s[i + 1].x, top, -s[i + 1].y);
      guideGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); guideGeo.computeBoundingSphere();
      guideRef.current?.computeLineDistances();
      bench.guideDirty = false;
    }
    // mảnh vụn mới → mesh rơi lả tả xuống bàn
    const group = scrapGroup.current;
    if (group && bench.scraps.length) {
      for (const sc of bench.scraps.splice(0)) {
        const tris = triangles(sc.shape); if (!tris.length) continue;
        const arr = new Float32Array(tris.length * 9);
        let cx = 0, cy = 0, k = 0;
        for (const t of tris) for (const p of t) { cx += p.x; cy += p.y; k++; }
        cx /= k; cy /= k;
        tris.forEach((t, i) => t.forEach((p, j) => arr.set([p.x - cx, 0, -(p.y - cy)], i * 9 + j * 3)));
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3)); geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: sc.color, side: THREE.DoubleSide, roughness: 0.9, transparent: true }));
        mesh.castShadow = true; mesh.position.set(cx, sc.height, -cy); group.add(mesh);
        const out = norm(v(cx, cy));
        scraps.current.push({ mesh, t0: now, from: mesh.position.clone(), drift: new THREE.Vector3(out.x * (1 + Math.random()), 0, -out.y * (1 + Math.random())), spin: (Math.random() - 0.5) * 3 });
      }
      while (scraps.current.length > 40) { const old = scraps.current.shift()!; group.remove(old.mesh); old.mesh.geometry.dispose(); (old.mesh.material as THREE.Material).dispose(); }
    }
    for (const s of scraps.current) {
      const t = Math.min(1, (now - s.t0) / 900), e = 1 - (1 - t) ** 2;
      s.mesh.position.set(s.from.x + s.drift.x * e, s.from.y + 0.8 * Math.sin(Math.PI * t) * (1 - t) - (s.from.y - 0.003) * e, s.from.z + s.drift.z * e);
      s.mesh.rotation.set(Math.sin(t * Math.PI * 2) * 0.6 * (1 - t), s.spin * e, Math.cos(t * Math.PI * 3) * 0.4 * (1 - t));
    }
    const f = frames.current; f.n++;
    if (now - f.t > 1000) { bench.stats.fps = (f.n * 1000) / (now - f.t); f.n = 0; f.t = now; bench.notify(); }
  });

  // Dọn mảnh vụn khi đổi giấy (res đổi = tờ giấy mới).
  useEffect(() => () => { const g = scrapGroup.current; for (const s of scraps.current) { g?.remove(s.mesh); s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose(); } scraps.current = []; }, [res]);

  useEffect(() => {
    const el = gl.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    const at = (e: PointerEvent): Vec | null => {
      const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); return ray.ray.intersectPlane(plane, hit) ? v(hit.x, -hit.z) : null;
    };
    const cmPerPx = () => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const a = at({ clientX: cx, clientY: cy } as PointerEvent), b = at({ clientX: cx + 100, clientY: cy } as PointerEvent);
      return a && b ? dist(a, b) / 100 : 0.05;
    };
    let P: Vec | null = null, id = -1, lines: SnapLine[] = [];
    const down = (e: PointerEvent) => {
      if (bench.anim || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const q = at(e); if (!q) return;
      const O = outline(bench.s.facets);
      if (tool === 'punch') {
        if (!contains(O, q)) return;
        const r = preschool ? 0.9 : 0.7, c = circle(q.x, q.y, r, 48);
        bench.push({ kind: 'cut', region: c, tool: 'punch', stroke: c[0], closed: true });
        return;
      }
      if (tool === 'fold' && !contains(O, q)) return;
      P = q; id = e.pointerId; el.setPointerCapture(id);
      if (tool === 'fold') lines = snapLines(O);
      if (tool === 'cut') { bench.stroke = [q]; bench.strokeDirty = true; }
    };
    const move = (e: PointerEvent) => {
      if (!P || e.pointerId !== id) return;
      const F = at(e); if (!F) return;
      if (tool === 'cut') {
        if (dist(F, bench.stroke.at(-1)!) > 0.06) { bench.stroke.push(F); bench.strokeDirty = true; }
        return;
      }
      const d = dist(P, F); if (d < 0.05) return;
      let entry: FoldEntry = { kind: 'fold', p: scale(add(P, F), 0.5), n: norm(sub(P, F)), valley: !mountain };
      const snapped = d > MIN_DRAG ? snapFold(lines, P, F, (preschool ? 30 : 16) * cmPerPx()) : null;
      if (snapped) entry = { kind: 'fold', p: snapped.p, n: snapped.n, valley: !mountain };
      const label = snapped ? snapped.line.label : null;
      if (label !== bench.snapLabel) { bench.snapLabel = label; bench.notify(); }
      bench.anim = { kind: 'drag', motion: { entry, theta: Math.PI, r: Math.min(2, Math.max(0.3, 0.25 * d)), span: bench.span() }, from: Math.PI, to: Math.PI, t0: 0, dur: 1 };
      bench.dirty = true;
    };
    const up = (e: PointerEvent) => {
      if (!P || e.pointerId !== id) return;
      try { el.releasePointerCapture(id); } catch { /* đã nhả */ }
      const start = P; P = null;
      if (bench.snapLabel) { bench.snapLabel = null; bench.notify(); }
      if (tool === 'cut') {
        const raw = bench.stroke; bench.stroke = []; bench.strokeDirty = true;
        const stroke = cleanStroke(raw, outline(bench.s.facets), preschool ? 1.4 : 0.8);
        if (stroke) bench.push({ kind: 'cut', region: kerf(stroke, KERF), tool: 'free', stroke });
        return;
      }
      const a = bench.anim; if (!a || a.kind !== 'drag') return;
      const F = at(e) ?? start, entry = a.motion.entry;
      if (dist(start, F) < MIN_DRAG) bench.start({ kind: 'spring', motion: a.motion, from: Math.PI, to: 0, dur: 220 });
      else { bench.anim = null; bench.push(entry); bench.settle(entry, a.motion.r); }
    };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, [gl, camera, bench, tool, mountain, preschool]);

  return <>
    <hemisphereLight args={['#fffaf0', '#8a7a6a', 0.9]} />
    <directionalLight position={[-8, 30, 12]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-0.0004} shadow-radius={4} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={res.mat} roughness={0.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#b98d61" roughness={0.9} /></mesh>
    <mesh geometry={res.geo} material={res.paper.mat} customDepthMaterial={res.paper.depth} castShadow receiveShadow />
    <group ref={scrapGroup} />
    <line>
      <primitive object={strokeLine} attach="geometry" />
      <lineBasicMaterial color="#111" />
    </line>
    <lineSegments ref={guideRef} geometry={guideGeo}>
      <lineDashedMaterial color="#1b2a34" dashSize={0.35} gapSize={0.25} />
    </lineSegments>
  </>;
}
