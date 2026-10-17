import { describe, expect, it } from 'vitest';
import type { FoldEntry, PaperSpec } from '../model';
import { cut } from './cut';
import { det, norm, reflection, v } from './geom';
import { foldStack, layersAt, outline, paperArea, topLayer } from './fold';
import { area, circle, components, deviation, kerf, rect, transform, xor } from './poly';
import { replay } from './recipe';
import { initialSheet, pieceCount } from './sheet';

const SQ: PaperSpec = { shape: 'square', w: 15, h: 15, front: '#e53935', back: '#ffffff' };
const fold = (px: number, py: number, nx: number, ny: number, valley = true): FoldEntry => ({ kind: 'fold', p: v(px, py), n: norm(v(nx, ny)), valley });
/** Gấp D4: đôi dọc, đôi ngang, rồi chéo — xấp là tam giác 1/8 quanh tâm. */
const D4: FoldEntry[] = [fold(0, 0, 1, 0), fold(0, 0, 0, 1), fold(0, 0, -1, 1)];

describe('fold', () => {
  it('folding in half gives 2 facets, half the outline, same paper area', () => {
    const sheet = initialSheet(SQ), fs = foldStack(sheet, [fold(0, 0, 1, 0)]);
    expect(fs.length).toBe(2);
    expect(paperArea(fs)).toBeCloseTo(225, 2);
    expect(area(outline(fs))).toBeCloseTo(112.5, 2);
    const flap = fs.find(f => f.layer !== 0)!;
    expect(flap.layer).toBe(1);
    expect(det(flap.m)).toBeCloseTo(-1, 9);
    expect(layersAt(fs, v(-3, 2))).toBe(2);
  });

  it('mountain fold puts the flap underneath', () => {
    const fs = foldStack(initialSheet(SQ), [fold(0, 0, 1, 0, false)]);
    expect(Math.min(...fs.map(f => f.layer))).toBe(-1);
  });

  it('D4 folds stack 8 layers in a triangle, layers stay distinct', () => {
    const fs = foldStack(initialSheet(SQ), D4);
    expect(fs.length).toBe(8);
    expect(new Set(fs.map(f => f.layer)).size).toBe(8);
    expect(area(outline(fs))).toBeCloseTo(225 / 8, 2);
    expect(layersAt(fs, v(-1, -3))).toBe(8);
    expect(topLayer(fs) - Math.min(...fs.map(f => f.layer))).toBe(7);
  });

  it('unfolding everything restores the sheet with identity transforms', () => {
    const s = replay(SQ, [...D4, { kind: 'unfold' }, { kind: 'unfold' }, { kind: 'unfold' }]);
    expect(s.facets.length).toBe(1);
    expect(s.facets[0].m).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
  });

  it('flip reverses the stack and mirrors it', () => {
    const fs = foldStack(initialSheet(SQ), [fold(0, 0, 1, 0), { kind: 'flip', p: v(-3.75, 0), n: v(1, 0) }]);
    expect(paperArea(fs)).toBeCloseTo(225, 2);
    expect(area(outline(fs))).toBeCloseTo(112.5, 2);
    const base = fs.find(f => det(f.m) < 0)!;
    expect(base.layer).toBe(1); // lớp đáy cũ giờ nằm trên, mặt sau hướng lên
  });
});

describe('cut', () => {
  it('half-fold then snip a corner: one scrap falls, sheet loses two mirrored corners', () => {
    const sheet = initialSheet(SQ), fs = foldStack(sheet, [fold(0, 0, 1, 0)]);
    // Góc trên-trái của xấp (−7.5, 7.5): cắt chéo từ (−8, 5) tới (−5, 8).
    const r = cut(sheet, fs, kerf([v(-8.5, 4.5), v(-4.5, 8.5)], 0.03));
    expect(r.dropped.length).toBe(1);
    expect(pieceCount(r.sheet)).toBe(1);
    const lost = 225 - area(r.sheet);
    expect(lost).toBeGreaterThan(2 * 0.5 * 2 * 2);
    expect(lost).toBeLessThan(2 * 0.5 * 2.6 * 2.6);
    // đối xứng qua nếp x = 0
    expect(area(xor(r.sheet, transform(reflection(v(0, 0), v(1, 0)), r.sheet)))).toBeLessThan(1e-3);
  });

  it('a closed shape inside the stack punches a hole through every layer', () => {
    const sheet = initialSheet(SQ), fs = foldStack(sheet, [fold(0, 0, 1, 0)]);
    const r = cut(sheet, fs, circle(-3, 0, 1));
    expect(r.dropped.length).toBe(0);
    expect(area(r.sheet)).toBeCloseTo(225 - 2 * area(circle(-3, 0, 1)), 2);
    expect(components(r.sheet)[0].length).toBe(3); // 1 viền ngoài + 2 lỗ
  });

  it('a slit from the edge removes only the kerf', () => {
    const sheet = initialSheet(SQ), fs = foldStack(sheet, []);
    const k = kerf([v(-8, 0), v(0, 0)], 0.03), r = cut(sheet, fs, k);
    expect(r.dropped.length).toBe(0);
    expect(225 - area(r.sheet)).toBeCloseTo(7.5 * 0.03, 2);
  });

  it('cutting across every crease splits the paper into several pieces', () => {
    const sheet = initialSheet(SQ), fs = foldStack(sheet, [fold(0, 0, 1, 0)]);
    // Cắt dọc sát nếp: x = −0.5 từ dưới lên trên → phần nếp rơi, hai nửa rời nhau.
    const r = cut(sheet, fs, kerf([v(-0.5, -9), v(-0.5, 9)], 0.03));
    expect(r.dropped.length).toBe(1);
    expect(pieceCount(r.sheet)).toBe(2);
  });

  it('D4 folds + any cut leave the sheet invariant under D4', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    let sheet = initialSheet(SQ);
    for (let i = 0; i < 6; i++) {
      const fs = foldStack(sheet, D4);
      const stroke = Array.from({ length: 8 }, () => v(rnd() * 10 - 9, rnd() * 10 - 9));
      sheet = i % 2 ? cut(sheet, fs, circle(-1 - rnd() * 4, -1 - rnd() * 3, 0.3 + rnd() * 0.6)).sheet : cut(sheet, fs, kerf(stroke, 0.03)).sheet;
    }
    expect(area(sheet)).toBeLessThan(225);
    const gens = [reflection(v(0, 0), v(1, 0)), reflection(v(0, 0), v(0, 1)), reflection(v(0, 0), norm(v(-1, 1)))];
    for (const g of gens) expect(deviation(sheet, transform(g, sheet))).toBeLessThan(0.005);
  });

  it('snowflake-style 6-fold symmetry (fold in half, then thirds at 60°)', () => {
    const c = Math.cos(Math.PI / 3), s = Math.sin(Math.PI / 3);
    const hex: PaperSpec = { shape: 'hexagon', w: 15, h: 15, front: '#90caf9', back: '#fff' };
    // Đường nếp qua tâm với pháp tuyến n, vạt nằm phía n.
    const entries: FoldEntry[] = [fold(0, 0, 0, -1), fold(0, 0, s, -c), fold(0, 0, -s, -c)];
    let sheet = initialSheet(hex);
    const fs = foldStack(sheet, entries);
    expect(paperArea(fs)).toBeCloseTo(area(sheet), 2);
    sheet = cut(sheet, fs, circle(0, 4, 1.2)).sheet;
    sheet = cut(sheet, foldStack(sheet, entries), kerf([v(-3, 8), v(0, 5.5), v(3, 8)], 0.03)).sheet;
    for (const k of [0, 1, 2]) {
      const t = (k * Math.PI) / 3, g = reflection(v(0, 0), v(Math.cos(t), Math.sin(t)));
      expect(deviation(sheet, transform(g, sheet))).toBeLessThan(0.005);
    }
  });
});

describe('outline sanity', () => { it('rect helper', () => expect(area(rect(0, 0, 2, 3))).toBe(6)); });
