import { describe, expect, it } from 'vitest';
import type { FoldEntry, Op, PaperSpec } from '../model';
import { norm, v, type Vec } from '../engine/geom';
import { kerf } from '../engine/poly';
import { buildSteps } from './steps';
import { printPlan, frameFor, PX_PER_CM } from './template';
import { foldStack } from '../engine/fold';
import { initialSheet } from '../engine/sheet';

const SQ: PaperSpec = { shape: 'square', w: 15, h: 15, front: '#e53935', back: '#fff' };
const fold = (px: number, py: number, nx: number, ny: number, valley = true): FoldEntry => ({ kind: 'fold', p: v(px, py), n: norm(v(nx, ny)), valley });
const cutOp = (pts: [number, number][]): Op => { const stroke: Vec[] = pts.map(([x, y]) => v(x, y)); return { kind: 'cut', region: kerf(stroke, 0.03), tool: 'free', stroke }; };

describe('buildSteps', () => {
  it('drops a scratch fold, merges cuts at one state and the final unfolds', () => {
    const f1 = fold(0, 0, 1, 0), f2 = fold(0, 0, 0, 1), scratch = fold(-3, 0, -1, 0);
    const ops: Op[] = [f1, scratch, { kind: 'unfold' }, f2,
      cutOp([[-8, 5], [-5, 2], [-8, -1]]), cutOp([[-2, -8], [-4, -5], [-6, -8]]), cutOp([[-1, -1], [-2, -3]]),
      { kind: 'unfold' }, { kind: 'unfold' }];
    const steps = buildSteps(SQ, ops);
    expect(steps.map(s => s.kind)).toEqual(['paper', 'fold', 'fold', 'cut', 'unfold', 'result']);
    const c = steps[3];
    expect(c.kind === 'cut' && c.marks.length).toBe(3);
    expect(steps[4].text).toBe('Mở nhẹ từng nếp gấp ra.');
    expect(steps[0].text).toContain('vuông cạnh 15 cm');
  });

  it('skips cuts that miss the paper', () => {
    const steps = buildSteps(SQ, [fold(0, 0, 1, 0), cutOp([[20, 20], [25, 25]])]);
    expect(steps.some(s => s.kind === 'cut')).toBe(false);
  });

  it('reports a sheet that fell apart', () => {
    // gấp đôi rồi cắt đứt hẳn nếp gấp → hai mảnh
    const steps = buildSteps(SQ, [fold(0, 0, 1, 0), cutOp([[-1, 9], [-1, -9]]), { kind: 'unfold' }]);
    const r = steps[steps.length - 1];
    expect(r.kind === 'result' && r.pieces).toBe(2);
  });
});

describe('template', () => {
  it('prints on the face that lies on top when cutting', () => {
    // gấp lõm: mặt màu vào trong, mặt sau lộ ra trên cùng
    const valley = printPlan(foldStack(initialSheet(SQ), [fold(0, 0, 1, 0)]));
    expect(valley.face).toBe('back');
    expect(valley.cover).toBeGreaterThan(0.99);
    const mountain = printPlan(foldStack(initialSheet(SQ), [fold(0, 0, 1, 0, false)]));
    expect(mountain.face).toBe('front');
  });
  it('keeps a 15 cm square at real size and shrinks a long strip', () => {
    const box = { x: 70, y: 340, w: 1100, h: 1300 };
    expect(frameFor(initialSheet(SQ), box).scale).toBe(1);
    expect(frameFor(initialSheet(SQ), box).s).toBeCloseTo(PX_PER_CM, 6);
    const strip = frameFor(initialSheet({ ...SQ, shape: 'strip', w: 28, h: 7 }), box);
    expect(strip.rot).toBe(true);
    expect(strip.scale).toBeLessThan(1);
  });
});
