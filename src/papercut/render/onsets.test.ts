import { describe, expect, it } from 'vitest';
import { findOnsets } from './onsets';

describe('findOnsets', () => {
  it('finds each burst after silence', () => {
    const rate = 8000, data = new Float32Array(rate * 2);
    for (const start of [0.25, 1.1]) for (let i = 0; i < rate * 0.15; i++) data[Math.round(start * rate) + i] = Math.sin(i) * 0.8;
    const on = findOnsets(data, rate);
    expect(on.length).toBe(2);
    expect(on[0]).toBeCloseTo(0.22, 1); expect(on[1]).toBeCloseTo(1.08, 1);
  });
  it('falls back to the start for silence', () => { expect(findOnsets(new Float32Array(1000), 8000)).toEqual([0]); });
});
