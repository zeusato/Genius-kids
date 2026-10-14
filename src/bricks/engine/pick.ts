// Chọn điểm bằng tia trong không gian LDU (plan mục 7.4 bước 2). Thử tia với hộp bao từng mảnh rồi với hộp va chạm.
import type { Box, V3 } from './types';
import { AREA, type World } from './world';

export type Hit = { kind: 'piece'; id: number; point: V3; normal: V3; t: number } | { kind: 'ground'; point: V3; normal: V3; t: number };

/** Giao tia với hộp vuông góc (slab). Trả về t vào và pháp tuyến mặt vào, hoặc null. */
export function rayBox(o: V3, d: V3, b: Box): { t: number; n: V3 } | null {
  let t0 = -Infinity, t1 = Infinity, axis = -1, sign = 0;
  for (let i = 0; i < 3; i++) {
    const lo = b[i], hi = b[i + 3];
    if (Math.abs(d[i]) < 1e-12) { if (o[i] < lo || o[i] > hi) return null; continue; }
    let a = (lo - o[i]) / d[i], c = (hi - o[i]) / d[i], s = -1;
    if (a > c) { [a, c] = [c, a]; s = 1; }
    if (a > t0) { t0 = a; axis = i; sign = s; }
    if (c < t1) t1 = c;
    if (t0 > t1) return null;
  }
  if (t1 < 0 || axis < 0) return null;
  const n: V3 = [0, 0, 0]; n[axis] = sign;
  return { t: Math.max(t0, 0), n };
}

/** Tia o + t·d (LDU). Bỏ qua các mảnh trong `ignore`. */
export function pick(world: World, o: V3, d: V3, ignore?: Set<number>): Hit | null {
  let best: Hit | null = null;
  for (const p of world.pieces.values()) {
    if (ignore?.has(p.id)) continue;
    const bb = rayBox(o, d, p.bbox);
    if (!bb || (best && bb.t > best.t)) continue;
    let mine: { t: number; n: V3 } | null = null;
    for (const b of p.boxes) { const h = rayBox(o, d, b); if (h && (!mine || h.t < mine.t)) mine = h; }
    // Không trúng hộp con nào nhưng tia vào hộp bao ngay tại lỗ xuyên tâm (đã khoét quanh trục điểm nối) → vẫn là chạm mặt hộp bao.
    if (!mine) {
      const e: V3 = [o[0] + d[0] * bb.t, o[1] + d[1] * bb.t, o[2] + d[2] * bb.t];
      const nearAxis = p.geo.conns.some(c => {
        const v: V3 = [e[0] - c.p[0] - p.pos[0], e[1] - c.p[1] - p.pos[1], e[2] - c.p[2] - p.pos[2]];
        const along = v[0] * c.a[0] + v[1] * c.a[1] + v[2] * c.a[2];
        return Math.hypot(v[0] - c.a[0] * along, v[1] - c.a[1] * along, v[2] - c.a[2] * along) < 9;
      });
      if (!nearAxis) continue;
      mine = bb;
    }
    // Hộp va chạm bị khoét ở núm/lòng lỗ → tia có thể lọt sâu vào trong. Sâu quá 6 LDU so với mặt hộp bao thì lấy mặt hộp bao.
    if (mine.t - bb.t > 6) mine = bb;
    if (!best || mine.t < best.t) best = { kind: 'piece', id: p.id, t: mine.t, normal: mine.n, point: [o[0] + d[0] * mine.t, o[1] + d[1] * mine.t, o[2] + d[2] * mine.t] };
  }
  // Mặt bàn y = 0 (Y hướng xuống nên tia phải đi theo +Y)
  if (d[1] > 1e-9) {
    const t = -o[1] / d[1];
    if (t >= 0 && (!best || t < best.t)) {
      const p: V3 = [o[0] + d[0] * t, 0, o[2] + d[2] * t];
      if (p[0] >= AREA.min && p[0] <= AREA.max && p[2] >= AREA.min && p[2] <= AREA.max) best = { kind: 'ground', point: p, normal: [0, -1, 0], t };
    }
  }
  return best;
}
