import { describe, expect, it } from 'vitest';
import { reflection, rotationAbout, v } from './geom';
import { area, circle, components, contains, difference, halfPlane, kerf, oriented, rect, transform, union } from './poly';

describe('poly', () => {
  it('keeps 0.01 mm precision through union (unionD single-arg trap)', () => {
    const s = union(rect(0, 0, 1.0004, 1));
    expect(Math.max(...s[0].map(p => p.x))).toBeCloseTo(1, 3);
    expect(area(union(rect(0, 0, 0.123, 1)))).toBeCloseTo(0.123, 3);
  });

  it('normalises winding so opposite-orientation overlaps do not cancel', () => {
    const a = rect(0, 0, 2, 2)[0], b = [...rect(1, 1, 3, 3)[0]].reverse();
    expect(area(oriented([a, b]))).toBeCloseTo(7, 3);
  });

  it('transform by a reflection keeps positive area', () => {
    const s = rect(0, 0, 3, 1), m = reflection(v(0, 0), v(1, 0));
    expect(area(transform(m, s))).toBeCloseTo(3, 6);
    expect(area(union(s, transform(m, s)))).toBeCloseTo(6, 3);
    expect(area(transform(rotationAbout(v(1, 1), 1.3), s))).toBeCloseTo(3, 6);
  });

  it('halfPlane splits a square in two', () => {
    const sq = rect(-1, -1, 1, 1), hp = halfPlane(v(0, 0), v(1, 0));
    expect(area(difference(sq, hp))).toBeCloseTo(2, 3);
    expect(area(difference(sq, difference(sq, hp)))).toBeCloseTo(2, 3);
  });

  it('components keep holes and islands inside holes', () => {
    const ring = difference(rect(0, 0, 10, 10), rect(2, 2, 8, 8));
    const s = union(ring, rect(4, 4, 6, 6));
    const cs = components(s);
    expect(cs.length).toBe(2);
    const big = cs.find(c => area(c) > 50)!;
    expect(big.length).toBe(2);
    expect(area(big)).toBeCloseTo(64, 3);
    expect(contains(s, v(5, 5))).toBe(true);
    expect(contains(s, v(3, 3))).toBe(false);
    expect(contains(s, v(1, 1))).toBe(true);
  });

  it('kerf is a thin strip of the requested width', () => {
    const k = kerf([v(0, 0), v(10, 0)], 0.03);
    expect(area(k)).toBeCloseTo(10 * 0.03 + Math.PI * 0.015 ** 2, 3);
    expect(components(difference(rect(-1, -1, 11, 1), kerf([v(-2, 0), v(12, 0)], 0.03))).length).toBe(2);
  });

  it('circle area converges', () => { expect(area(circle(0, 0, 2, 256))).toBeCloseTo(Math.PI * 4, 1); });
});
