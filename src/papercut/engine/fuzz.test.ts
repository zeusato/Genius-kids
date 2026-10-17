// Fuzz bất biến engine (plan mục 5.3). Mặc định 1 000 chuỗi; PAPERCUT_FUZZ=10000 cho GĐ1.
import { describe, expect, it } from 'vitest';
import type { Op, PaperSpec } from '../model';
import { foldStack, outline, paperArea } from './fold';
import { norm, v, type Vec } from './geom';
import { area, bounds, circle, clipperStats, kerf, perimeter } from './poly';
import { applyOp, initialState, replay, type StudioState } from './recipe';

const TRACE = !!globalThis.process?.env?.PAPERCUT_TRACE;
const N = Number(globalThis.process?.env?.PAPERCUT_FUZZ ?? 150); // GĐ0: PAPERCUT_FUZZ=1000, GĐ1: 10000
const PAPERS: PaperSpec[] = [
  { shape: 'square', w: 15, h: 15, front: '#f00', back: '#fff' },
  { shape: 'rect', w: 21, h: 10, front: '#0a0', back: '#ff0' },
  { shape: 'hexagon', w: 14, h: 14, front: '#00f', back: '#fff' },
  { shape: 'circle', w: 12, h: 12, front: '#f0f', back: '#0ff' },
];

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

function randomOp(s: StudioState, r: () => number): Op {
  const b = bounds(outline(s.facets));
  const at = (): Vec => v(b.x0 + r() * (b.x1 - b.x0), b.y0 + r() * (b.y1 - b.y0));
  const t = r();
  if (s.facets.length && s.entries.length < 6 && t < 0.4) {
    const a = r() * Math.PI * 2;
    return { kind: 'fold', p: at(), n: norm(v(Math.cos(a), Math.sin(a))), valley: r() < 0.7 };
  }
  if (t < 0.45) return { kind: 'flip', p: v((b.x0 + b.x1) / 2, 0), n: v(1, 0) };
  if (t < 0.55) return { kind: 'unfold' };
  if (t < 0.7) { const c = at(); return { kind: 'cut', region: circle(c.x, c.y, 0.2 + r() * 1.5, 48), tool: 'punch' }; }
  const pts = Array.from({ length: 2 + Math.floor(r() * 10) }, () => at());
  const pad = (p: Vec, q: Vec) => v(p.x + (p.x - q.x) * 0.3, p.y + (p.y - q.y) * 0.3); // thường kéo ra ngoài mép
  if (r() < 0.6 && pts.length > 1) { pts[0] = pad(pts[0], pts[1]); pts[pts.length - 1] = pad(pts[pts.length - 1], pts[pts.length - 2]); }
  return { kind: 'cut', region: kerf(pts, 0.03), tool: 'free' };
}

describe(`engine fuzz × ${N}`, () => {
  it('keeps paper area, unfolds back to the sheet and replays deterministically', () => {
    let ops = 0, cuts = 0, cutMs = 0, worstDrift = 0;
    for (let i = 0; i < N; i++) {
      const r = rng(0x9e3779b9 ^ (i * 2654435761)), spec = PAPERS[i % PAPERS.length];
      let s = initialState(spec), prevArea = area(s.sheet);
      const recipe: Op[] = [];
      const len = 4 + Math.floor(r() * 14);
      for (let k = 0; k < len; k++) {
        const op = randomOp(s, r);
        const t0 = performance.now();
        s = applyOp(s, op);
        if (op.kind === 'cut') { cutMs += performance.now() - t0; cuts++; }
        recipe.push(op); ops++;
        if (TRACE && performance.now() - t0 > 200) console.info(`[slow] seq ${i} op ${k} ${op.kind} ${(performance.now() - t0).toFixed(0)} ms facets ${s.facets.length} entries ${s.entries.length}`);
        const a = area(s.sheet), pa = paperArea(s.facets);
        const drift = Math.abs(pa - a);
        worstDrift = Math.max(worstDrift, drift);
        // Gấp không làm mất/sinh giấy (sai số làm tròn 0,01 mm dọc các nếp).
        const edge = s.facets.reduce((t, f) => t + perimeter(f.region), 0);
        expect(drift, `seq ${i} op ${k} ${op.kind}`).toBeLessThan(5e-4 * (edge + perimeter(s.sheet)) + 1e-6); // ≤ nửa ô lưới × (mép facet + mép Sheet): hai bên làm tròn độc lập
        expect(a, `seq ${i} op ${k} ${op.kind} removed ${(prevArea - a).toExponential(2)} perim ${perimeter(s.sheet).toFixed(1)}`).toBeLessThanOrEqual(prevArea + 1e-4 * perimeter(s.sheet)); // chỉ cho phép nhiễu làm tròn lưới
        expect(area(outline(s.facets))).toBeLessThanOrEqual(a + 0.02);
        prevArea = a;
      }
      // Mở hết các nếp → một facet đồng nhất trùng Sheet.
      const flat = foldStack(s.sheet, []);
      expect(flat.length <= 1).toBe(true);
      if (flat.length) expect(flat[0].m).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      // Tất định.
      expect(replay(spec, recipe).sheet).toEqual(s.sheet);
    }
    console.info(`[papercut fuzz] ${N} seqs, ${ops} ops, ${cuts} cuts, avg ${(cutMs / Math.max(cuts, 1)).toFixed(2)} ms/cut, worst area drift ${worstDrift.toFixed(4)} cm², clipper retries ${clipperStats.retries}, invalid ${clipperStats.invalid}, unresolved ${clipperStats.unresolved}`);
  }, 600_000);

  it('a 200-point cut through 6 folds stays fast', () => {
    const spec = PAPERS[0];
    let s = initialState(spec);
    // Gấp đôi nêm quanh tâm 6 lần (đôi, tư, 8, 16, 32, 64 lớp): pháp tuyến hướng về nửa góc lớn → nêm còn [a0, giữa].
    let a0 = 0, a1 = Math.PI * 2;
    for (let i = 0; i < 6; i++) {
      const mid = (a0 + a1) / 2;
      s = applyOp(s, { kind: 'fold', p: v(0, 0), n: v(-Math.sin(mid), Math.cos(mid)), valley: true });
      a1 = mid;
    }
    expect(s.facets.length).toBe(64);
    const b = bounds(outline(s.facets));
    const stroke = Array.from({ length: 200 }, (_, i) => v(b.x0 - 1 + (i / 199) * (b.x1 - b.x0 + 2), (b.y0 + b.y1) / 2 + Math.sin(i / 7) * (b.y1 - b.y0) * 0.3));
    const K = kerf(stroke, 0.03);
    const t0 = performance.now();
    for (let i = 0; i < 5; i++) applyOp(s, { kind: 'cut', region: K, tool: 'free' });
    const ms = (performance.now() - t0) / 5;
    console.info(`[papercut perf] 6 folds, ${s.facets.length} facets, 200-pt stroke: ${ms.toFixed(1)} ms/cut (incl. refold)`);
    expect(ms).toBeLessThan(300); // máy CI chậm; mục tiêu thật ≤ 30 ms trên tablet ghi ở spike-report
  });
});
