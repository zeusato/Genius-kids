import { describe, expect, it } from 'vitest';
import { nearestAngle, turnFacing } from './seating';

describe('two-player board orientation', () => {
  it('keeps an opposite-side game fixed through both turns', () => {
    expect(turnFacing('opposite', true, 0, true)).toBeNull();
    expect(turnFacing('opposite', true, 1, true)).toBeNull();
  });
  it('follows both colours only when two humans sit on the same side', () => {
    expect(turnFacing('same', true, 0, true)).toBe(false);
    expect(turnFacing('same', true, 1, true)).toBe(true);
    expect(turnFacing('same', false, 1, true)).toBeNull();
    expect(turnFacing('same', true, 1, false)).toBeNull();
  });
  it('does not turn a full circle at the wrapped black-side orbit limit', () => {
    for (const from of [-Math.PI - .42, -Math.PI + .42, Math.PI - .42, Math.PI + .42, -.42, .42]) {
      for (const target of [0, Math.PI]) {
        const result = nearestAngle(from, target);
        expect(Math.abs(result - from)).toBeLessThanOrEqual(Math.PI + 1e-10);
        expect(Math.cos(result)).toBeCloseTo(Math.cos(target));
        expect(Math.sin(result)).toBeCloseTo(Math.sin(target));
      }
    }
  });
});
