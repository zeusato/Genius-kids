import { expect, it } from 'vitest';
import fs from 'node:fs';
import { decodeMesh, fixStudWalls } from './loader';
import type { Catalog } from '../engine/types';

const cat: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));
const b = fs.readFileSync('public/bricks/parts/studs.bin');
const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

/** Số tam giác / đỉnh vách quay sai hướng (vách ngoài r > 5 phải quay ra, vách trong quay vào). */
function wrongWalls(k: 's' | 'h') {
  const g = decodeMesh(buf, cat.studs[k].mesh, cat.posScale).geometry;
  const before = count(g); fixStudWalls(g); const after = count(g); fixStudWalls(g);
  return { before, after, again: count(g) };
}
function count(g: ReturnType<typeof decodeMesh>['geometry']) {
  const P = g.getAttribute('position'), N = g.getAttribute('normal'), I = g.getIndex()!;
  let tris = 0, verts = 0;
  const sign = (x: number, z: number) => (Math.hypot(x, z) > 5 ? 1 : -1);
  for (let t = 0; t < I.count; t += 3) {
    const [a, b2, c] = [I.getX(t), I.getX(t + 1), I.getX(t + 2)];
    const u = [P.getX(b2) - P.getX(a), P.getY(b2) - P.getY(a), P.getZ(b2) - P.getZ(a)], v = [P.getX(c) - P.getX(a), P.getY(c) - P.getY(a), P.getZ(c) - P.getZ(a)];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (Math.abs(n[1]) > 0.3 * Math.hypot(...n)) continue;
    const cx = (P.getX(a) + P.getX(b2) + P.getX(c)) / 3, cz = (P.getZ(a) + P.getZ(b2) + P.getZ(c)) / 3;
    if ((n[0] * cx + n[2] * cz) * sign(cx, cz) < 0) tris++;
  }
  for (let i = 0; i < N.count; i++) if (Math.abs(N.getY(i)) < 0.3 && (N.getX(i) * P.getX(i) + N.getZ(i) * P.getZ(i)) * sign(P.getX(i), P.getZ(i)) < 0) verts++;
  return { tris, verts };
}

it('vách núm quay ra ngoài sau khi nạp (studs.bin cũ bị đảo BFC → núm trông trong suốt)', () => {
  const s = wrongWalls('s'), h = wrongWalls('h');
  expect(s.before.tris).toBeGreaterThan(0);                 // dữ liệu hiện có đúng là sai — test bắt được lỗi
  expect(s.after).toEqual({ tris: 0, verts: 0 }); expect(h.after).toEqual({ tris: 0, verts: 0 });
  expect(s.again).toEqual({ tris: 0, verts: 0 }); expect(h.again).toEqual({ tris: 0, verts: 0 });   // chạy lại không đổi
});
