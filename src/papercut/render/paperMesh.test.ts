import { describe, expect, it } from 'vitest';
import type { FoldEntry } from '../model';
import { foldStack } from '../engine/fold';
import { apply, norm, v } from '../engine/geom';
import { contains } from '../engine/poly';
import { initialSheet } from '../engine/sheet';
import { deform, layerSpans, makeGrid } from './paperMesh';

const SQ = { shape: 'square' as const, w: 15, h: 15, front: '#f00', back: '#fff' };
const ENTRIES: FoldEntry[] = [
  { kind: 'fold', p: v(0.3, 0), n: v(1, 0), valley: true },
  { kind: 'fold', p: v(0, -1), n: norm(v(0.2, 1)), valley: false },
  { kind: 'flip', p: v(-2, 0), n: v(1, 0) },
  { kind: 'fold', p: v(-3, -3), n: norm(v(-1, -1)), valley: true },
];
const T = 0.02;
const segDist = (q: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(a.x + t * dx - q.x, a.y + t * dy - q.y);
};
const nearEdge = (s: { x: number; y: number }[][], q: { x: number; y: number }) => s.some(r => r.some((a, i) => segDist(q, a, r[(i + 1) % r.length]) < 0.01));

describe('paperMesh deform', () => {
  it('completed folds place every vertex exactly where the engine facet puts it, at its layer height', () => {
    const sheet = initialSheet(SQ), fs = foldStack(sheet, ENTRIES), g = makeGrid(40, -7.5, -7.5, 15, 15);
    const out = new Float32Array((g.paper.length / 2) * 3);
    deform(g, ENTRIES, layerSpans(foldStack(sheet, []), ENTRIES), null, T, out);
    const lift = T / 2 - Math.min(...fs.map(f => f.layer)) * T;
    let checked = 0;
    for (let k = 0; k < g.paper.length / 2; k++) {
      const q = v(g.paper[2 * k], g.paper[2 * k + 1]);
      // Bỏ đỉnh nằm sát mép facet (trên đường nếp phía nào cũng đúng vị trí, nhưng lớp thì mơ hồ).
      if (fs.some(f => nearEdge(f.region, q))) continue;
      const f = fs.find(f => contains(f.region, q));
      if (!f) continue;
      const p = apply(f.m, q);
      expect(out[3 * k]).toBeCloseTo(p.x, 4);
      expect(-out[3 * k + 2]).toBeCloseTo(p.y, 4);
      expect(out[3 * k + 1]).toBeCloseTo(f.layer * T + lift, 5);
      checked++;
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('an animated fold at θ = π with r → 0 lands on the committed result', () => {
    const sheet = initialSheet(SQ), g = makeGrid(30, -7.5, -7.5, 15, 15), n = g.paper.length / 2;
    const done = new Float32Array(n * 3), moving = new Float32Array(n * 3);
    const spans = layerSpans(foldStack(sheet, []), ENTRIES);
    deform(g, ENTRIES, spans, null, T, done);
    deform(g, ENTRIES.slice(0, -1), spans.slice(0, -1), { entry: ENTRIES.at(-1)!, theta: Math.PI, r: 1e-5, span: spans.at(-1)! }, T, moving);
    for (let i = 0; i < n * 3; i++) expect(moving[i]).toBeCloseTo(done[i], 3);
  });
});
