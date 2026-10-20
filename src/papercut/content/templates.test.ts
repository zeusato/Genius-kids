import { describe, expect, it } from 'vitest';
import { area, components, deviation, transform } from '../engine/poly';
import { reflection, rotationAbout, v } from '../engine/geom';
import { replay } from '../engine/recipe';
import { initialSheet } from '../engine/sheet';
import { buildSteps } from '../export/steps';
import { TEMPLATES } from './templates';

describe('templates', () => {
  for (const t of TEMPLATES) {
    it(`${t.id}: every cut bites, ends unfolded in one piece with a real pattern`, () => {
      const ops = t.ops(), s = replay(t.spec, ops), full = area(initialSheet(t.spec)), left = area(s.sheet);
      expect(s.entries.length).toBe(0);
      expect(components(s.sheet).length).toBe(1);
      expect(left / full).toBeGreaterThan(0.15);
      expect(left / full).toBeLessThan(0.97);
      const steps = buildSteps(t.spec, ops);
      const cutMarks = steps.reduce((n, st) => n + (st.kind === 'cut' ? st.marks.length : 0), 0);
      expect(cutMarks).toBe(ops.filter(o => o.kind === 'cut').length);
    });
  }
  it('snowflake has 6-fold symmetry, flowers 4/8-fold, heart and butterfly a mirror axis', () => {
    const sym = (id: string) => replay(TEMPLATES.find(t => t.id === id)!.spec, TEMPLATES.find(t => t.id === id)!.ops()).sheet;
    const sf = sym('snowflake');
    expect(deviation(sf, transform(rotationAbout(v(0, 0), Math.PI / 3), sf))).toBeLessThan(0.005);
    const f8 = sym('flower8');
    expect(deviation(f8, transform(rotationAbout(v(0, 0), Math.PI / 4), f8))).toBeLessThan(0.005);
    const f4 = sym('flower4');
    expect(deviation(f4, transform(rotationAbout(v(0, 0), Math.PI / 2), f4))).toBeLessThan(0.005);
    for (const id of ['heart', 'butterfly']) { const h = sym(id); expect(deviation(h, transform(reflection(v(0, 0), v(1, 0)), h))).toBeLessThan(0.005); }
  });
});
