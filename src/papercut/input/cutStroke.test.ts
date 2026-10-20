import { describe, expect, it } from 'vitest';
import { v } from '../engine/geom';
import { contains, rect } from '../engine/poly';
import { chaikin, cleanStroke, simplify } from './cutStroke';

describe('cutStroke', () => {
  const O = rect(-5, -5, 5, 5);
  it('smooths and simplifies without moving the ends', () => {
    const raw = [v(0, 0), v(1, 1), v(2, 0), v(3, 1), v(4, 0)];
    const s = chaikin(raw, 2);
    expect(s[0]).toEqual(raw[0]); expect(s[s.length - 1]).toEqual(raw[4]);
    expect(simplify([v(0, 0), v(1, 0.001), v(2, 0)], 0.01).length).toBe(2);
  });
  it('extends an end that stops just short of the edge', () => {
    const s = cleanStroke([v(0, 0), v(2, 0), v(4.6, 0)], O, 0.8)!;
    expect(contains(O, s[s.length - 1])).toBe(false);
    expect(contains(O, s[0])).toBe(true); // đầu kia xa mép: giữ nguyên (thành khe)
  });
  it('drops taps', () => { expect(cleanStroke([v(0, 0), v(0.1, 0)], O, 0.8)).toBeNull(); });
});
