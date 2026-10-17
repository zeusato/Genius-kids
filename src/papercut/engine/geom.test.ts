import { describe, expect, it } from 'vitest';
import { IDENTITY, apply, compose, det, invert, norm, reflection, rotationAbout, side, v, type Iso, type Vec } from './geom';

const close = (p: Vec, q: Vec) => { expect(p.x).toBeCloseTo(q.x, 9); expect(p.y).toBeCloseTo(q.y, 9); };
const pts = [v(0, 0), v(3, -2), v(-7.5, 4.25), v(1e-3, 12)];

describe('geom', () => {
  it('compose applies right-to-left', () => {
    const r = rotationAbout(v(1, 2), 0.7), m = reflection(v(0, 3), norm(v(1, 1)));
    for (const p of pts) close(apply(compose(m, r), p), apply(m, apply(r, p)));
  });

  it('invert undoes rotations and reflections', () => {
    const ms: Iso[] = [rotationAbout(v(-2, 5), 2.1), reflection(v(4, -1), norm(v(3, -4))), compose(rotationAbout(v(0, 0), 1), reflection(v(1, 1), v(0, 1)))];
    for (const m of ms) for (const p of pts) { close(apply(invert(m), apply(m, p)), p); close(apply(compose(m, invert(m)), p), p); }
  });

  it('reflection fixes its line, flips sides, is an involution with det −1', () => {
    const p = v(2, -1), n = norm(v(1, 2)), R = reflection(p, n);
    expect(det(R)).toBeCloseTo(-1, 12);
    close(apply(R, p), p);
    for (const q of pts) {
      expect(side(apply(R, q), p, n)).toBeCloseTo(-side(q, p, n), 9);
      close(apply(R, apply(R, q)), q);
    }
    close(apply(compose(R, R), v(9, 9)), apply(IDENTITY, v(9, 9)));
  });
});
