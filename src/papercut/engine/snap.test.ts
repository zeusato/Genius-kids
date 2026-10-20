import { describe as group, expect, it } from 'vitest';
import type { FoldEntry, PaperSpec } from '../model';
import { norm, v } from './geom';
import { foldStack, outline } from './fold';
import { initialSheet } from './sheet';
import { snapFold, snapLines } from './snap';
import { describeFold } from './describe';
import { clipLine, creaseSegments } from './lines';
import { rect } from './poly';

const SQ: PaperSpec = { shape: 'square', w: 15, h: 15, front: '#e53935', back: '#fff' };
const HEX: PaperSpec = { shape: 'hexagon', w: 15, h: 15, front: '#1e88e5', back: '#fff' };
const fold = (px: number, py: number, nx: number, ny: number, valley = true): FoldEntry => ({ kind: 'fold', p: v(px, py), n: norm(v(nx, ny)), valley });

group('lines', () => {
  it('clips a line to a square with a hole', () => {
    const s = [...rect(-5, -5, 5, 5), ...rect(-1, -1, 1, 1).map(r => [...r].reverse())];
    const segs = clipLine(s, v(0, 0), v(1, 0));
    expect(segs.length).toBe(2);
    expect(segs.map(([a, b]) => b.x - a.x).reduce((x, y) => x + y)).toBeCloseTo(8, 6);
  });
  it('crease of a half fold spans the whole paper', () => {
    const fs = foldStack(initialSheet(SQ), []);
    const segs = creaseSegments(fs, fold(0, 0, 1, 0));
    expect(segs.length).toBe(1);
    expect(Math.abs(segs[0][1].y - segs[0][0].y)).toBeCloseTo(15, 3);
  });
});

group('snap', () => {
  it('square offers halves, diagonals and edge bisectors', () => {
    const lines = snapLines(outline(foldStack(initialSheet(SQ), [])));
    expect(lines.some(l => l.kind === 'diagonal')).toBe(true);
    expect(lines.filter(l => l.label === '½').length).toBeGreaterThanOrEqual(2);
  });
  it('pulls a sloppy drag onto the vertical half line', () => {
    const lines = snapLines(outline(foldStack(initialSheet(SQ), [])));
    const s = snapFold(lines, v(7.5, 7.5), v(-7.2, 7.9), 0.6);
    expect(s).not.toBeNull();
    expect(Math.abs(s!.n.x)).toBeCloseTo(1, 6);
    expect(s!.p.x).toBeCloseTo(0, 3);
    expect(s!.n.x).toBeGreaterThan(0); // phía chứa P (bên phải) vẫn là phía bị lật
  });
  it('ignores drags far from any nice line', () => {
    const lines = snapLines(outline(foldStack(initialSheet(SQ), [])));
    expect(snapFold(lines, v(7.5, 3), v(1.1, 4.7), 0.3)).toBeNull();
  });
  it('hexagon half offers 60° trisectors at the centre', () => {
    const lines = snapLines(outline(foldStack(initialSheet(HEX), [fold(0, 0, 0, 1)])));
    expect(lines.some(l => l.kind === 'third' && l.label === '60°')).toBe(true);
  });
});

group('describe', () => {
  const base = foldStack(initialSheet(SQ), []);
  it('names halves with a direction', () => {
    expect(describeFold(base, fold(0, 0, 0, -1))).toBe('Gấp đôi từ dưới lên, hai nửa chồng khít lên nhau.');
    expect(describeFold(base, fold(0, 0, 1, 0))).toContain('từ phải sang trái');
    expect(describeFold(base, fold(0, 0, 1, 0, false))).toContain('ra phía sau');
  });
  it('names a diagonal of the folded strip', () => {
    const half = foldStack(initialSheet(SQ), [fold(0, 0, 0, -1)]);
    expect(describeFold(half, fold(0, 3.75, 7.5, 15))).toContain('đường chéo');
  });
  it('names a corner fold and a flip', () => {
    expect(describeFold(base, fold(3.75, 3.75, 1, 1))).toContain('vào đúng giữa');
    expect(describeFold(base, { kind: 'flip', p: v(0, 0), n: v(1, 0) })).toBe('Lật úp xấp giấy lại.');
  });
  it('names a third', () => {
    expect(describeFold(base, fold(2.5, 0, 1, 0))).toContain('một phần ba');
  });
});
