// Bộ điều khiển bàn cắt giấy (plan mục 9 — state/): giữ thao tác, trạng thái engine và hoạt ảnh.
// Không dùng React state để vòng khung hình đọc trực tiếp; UI đăng ký `listeners` để vẽ lại.
import type { FoldEntry, Op, PaperSpec } from '../model';
import { foldStack } from '../engine/fold';
import type { Vec } from '../engine/geom';
import { creaseSegments, type Segment } from '../engine/lines';
import type { Shape } from '../engine/poly';
import { applyOp, initialState, type StudioState } from '../engine/recipe';
import { layerSpans, type Motion } from '../render/paperMesh';
import type { Sfx } from '../render/sfx';

export const THICK = 0.02, KERF = 0.03, MIN_DRAG = 1.2;

type Anim = { kind: 'drag' | 'settle' | 'spring' | 'unfold' | 'quick'; motion: Motion; from: number; to: number; t0: number; dur: number; rFrom?: number; rTo?: number; done?: () => void };

export interface BenchStats { deformMs: number; maskMs: number; cutMs: number; fps: number; facets: number; folds: number; ops: number }

export class Bench {
  spec: PaperSpec; ops: Op[] = []; s: StudioState; anim: Anim | null = null; dirty = true; maskDirty = true;
  stroke: Vec[] = []; strokeDirty = false;
  stats: BenchStats = { deformMs: 0, maskMs: 0, cutMs: 0, fps: 0, facets: 1, folds: 0, ops: 0 };
  listeners = new Set<() => void>();
  /** Vết nếp in lại trên giấy (toạ độ giấy) — giữ cả nếp đã mở. */
  creases: Segment[] = [];
  /** Mảnh vụn mới rơi, cảnh 3D lấy ra để tạo hoạt ảnh. */
  scraps: { shape: Shape; height: number; color: string }[] = [];
  /** Nét chấm gợi ý của mẫu (toạ độ xấp). */
  guide: Vec[][] = []; guideDirty = false;
  snapLabel: string | null = null;
  /** Số lớp lớn nhất từng cắt qua (cho huy hiệu bông tuyết). */
  maxLayersCut = 0;
  /** Cảnh 3D đăng ký: chụp ảnh khung hiện tại. */
  capture: ((w?: number, h?: number) => HTMLCanvasElement | null) | null = null;
  /** Phát âm thanh (UI gắn `playSfx`; test để trống). */
  sound: (k: Sfx, o?: { volume?: number }) => void = () => {};

  constructor(spec: PaperSpec) { this.spec = spec; this.s = initialState(spec); }
  notify() { this.stats.facets = this.s.facets.length; this.stats.folds = this.s.entries.length; this.stats.ops = this.ops.length; this.listeners.forEach(f => f()); }
  get busy() { return !!this.anim; }

  reset(spec: PaperSpec) {
    this.spec = spec; this.ops = []; this.s = initialState(spec); this.anim = null; this.creases = []; this.guide = []; this.guideDirty = true;
    this.maxLayersCut = 0; this.dirty = this.maskDirty = true; this.notify();
  }

  /** Dựng lại từ đầu (tải tác phẩm, hoàn tác). */
  load(spec: PaperSpec, ops: readonly Op[]) {
    this.spec = spec; this.anim = null; this.ops = [...ops];
    let s = initialState(spec); const creases: Segment[] = []; let maxLayers = 0;
    for (const op of ops) {
      if (op.kind === 'fold') creases.push(...creaseSegments(s.facets, op));
      if (op.kind === 'cut') maxLayers = Math.max(maxLayers, s.facets.length);
      s = applyOp(s, op);
    }
    this.s = s; this.creases = creases; this.maxLayersCut = maxLayers;
    this.dirty = this.maskDirty = true; this.notify();
  }

  push(op: Op, color?: string) {
    const t0 = performance.now();
    if (op.kind === 'fold') { this.creases.push(...creaseSegments(this.s.facets, op)); this.maskDirty = true; }
    if (op.kind === 'cut') this.maxLayersCut = Math.max(this.maxLayersCut, this.s.facets.length);
    const before = this.s, next = applyOp(this.s, op);
    if (op.kind === 'cut') {
      this.stats.cutMs = performance.now() - t0;
      if (next.sheet === before.sheet) { this.notify(); return false; } // cắt trượt ra ngoài giấy: không ghi
      this.maskDirty = true;
      const top = (Math.max(0, ...before.facets.map(f => f.layer)) + 1.5) * THICK;
      for (const shape of next.dropped ?? []) this.scraps.push({ shape, height: top, color: color ?? this.spec.front });
      if (next.dropped?.length) setTimeout(() => this.sound('scraps'), 120);
    }
    if (op.kind === 'unfold' && !this.s.entries.length) return false;
    this.s = next; this.ops.push(op);
    // nét chấm của mẫu chỉ đúng ở trạng thái gấp của mẫu: gấp/mở khác đi thì ẩn
    if (op.kind !== 'cut' && this.guide.length) { this.guide = []; this.guideDirty = true; }
    this.dirty = true; this.notify();
    return true;
  }

  undo() { if (this.anim || !this.ops.length) return; this.load(this.spec, this.ops.slice(0, -1)); }

  span() { const fs = this.s.facets; return { top: Math.max(...fs.map(f => f.layer), 0), bottom: Math.min(...fs.map(f => f.layer), 0) }; }
  start(a: Omit<Anim, 't0'>) { this.anim = { ...a, t0: performance.now() }; this.dirty = true; }

  /** Gấp có hoạt ảnh θ: 0 → π rồi miết phẳng. */
  foldAnimated(entry: FoldEntry, done?: () => void) {
    if (this.anim) return;
    this.sound('fold');
    this.start({ kind: 'quick', motion: { entry, theta: 0, r: 1.2, span: this.span() }, from: 0, to: Math.PI, dur: 550, done: () => { this.push(entry); this.settle(entry, 1.2, done); } });
  }
  settle(entry: FoldEntry, r: number, done?: () => void) {
    const span = layerSpans(foldStack(this.s.sheet, []), this.s.entries).at(-1)!;
    this.sound('crease');
    this.start({ kind: 'settle', motion: { entry, theta: Math.PI, r, span }, from: Math.PI, to: Math.PI, rFrom: r, rTo: THICK, dur: 260, done });
  }
  unfoldOne(done?: () => void) {
    if (this.anim) return;
    if (!this.s.entries.length) { done?.(); return; }
    const entry = this.s.entries.at(-1)!, span = layerSpans(foldStack(this.s.sheet, []), this.s.entries).at(-1)!;
    const dur = Math.max(320, 650 - 60 * (this.s.entries.length - 1));
    this.sound('fold', { volume: 0.6 });
    this.start({ kind: 'unfold', motion: { entry, theta: Math.PI, r: 1, span }, from: Math.PI, to: 0, dur, done: () => { this.push({ kind: 'unfold' }); done?.(); } });
  }
  unfoldAll(done?: () => void) {
    const had = this.s.entries.length > 0;
    const step = () => { if (this.s.entries.length) this.unfoldOne(step); else { if (had) this.sound('reveal'); done?.(); } };
    step();
  }
  /** Chạy lần lượt các nếp (mẫu, gấp nhanh nhiều bước). */
  foldSequence(entries: FoldEntry[], done?: () => void) {
    const step = (i: number) => { if (i >= entries.length) { done?.(); return; } this.foldAnimated(entries[i], () => step(i + 1)); };
    step(0);
  }

  /** Nếp đang settle/unfold là mục cuối nên loại ra khỏi danh sách tĩnh. */
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
