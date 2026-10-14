// 24 phép xoay vuông góc (nhóm xoay của khối lập phương), ma trận nguyên 3×3 hàng-chính. Chỉ số 0 = đơn vị.
// Thứ tự bảng cố định: dữ liệu mô hình lưu chỉ số này, KHÔNG được đổi thứ tự.
import type { Box, V3 } from './types';

export type M3 = [number, number, number, number, number, number, number, number, number];

function build(): M3[] {
  const out: M3[] = [];
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  for (const p of perms) for (let s = 0; s < 8; s++) {
    const m: number[] = new Array(9).fill(0);
    for (let r = 0; r < 3; r++) m[r * 3 + p[r]] = (s >> r) & 1 ? -1 : 1;
    if (det(m as M3) === 1) out.push(m as M3);
  }
  // đưa đơn vị lên đầu, giữ thứ tự ổn định cho phần còn lại
  const id = out.findIndex(m => m[0] === 1 && m[4] === 1 && m[8] === 1);
  return [out[id], ...out.filter((_, i) => i !== id)];
}
export function det(m: M3) { return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]); }
export const ORIENTS: readonly M3[] = build();

export const rot = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
export function mul(a: M3, b: M3): M3 {
  const o: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
  return o as M3;
}
const key = (m: readonly number[]) => m.join(',');
const INDEX = new Map(ORIENTS.map((m, i) => [key(m), i]));
export function indexOf(m: M3): number { const i = INDEX.get(key(m)); if (i === undefined) throw Error('Không phải phép xoay vuông góc'); return i; }
/** Hợp hai hướng: áp b trước rồi a. */
export const compose = (a: number, b: number) => indexOf(mul(ORIENTS[a], ORIENTS[b]));

/** Xoay quanh trục đứng (Y của LDraw) 90° × k. */
export const YAW: readonly number[] = [0, 1, 2, 3].map(k => {
  const c = Math.round(Math.cos(k * Math.PI / 2)), s = Math.round(Math.sin(k * Math.PI / 2));
  return indexOf([c, 0, s, 0, 1, 0, -s, 0, c]);
});

/** Hộp vuông góc sau khi xoay (vẫn vuông góc vì ma trận chỉ hoán vị/đổi dấu). */
export function rotBox(m: M3, b: Box): Box {
  const p = rot(m, [b[0], b[1], b[2]]), q = rot(m, [b[3], b[4], b[5]]);
  return [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.min(p[2], q[2]), Math.max(p[0], q[0]), Math.max(p[1], q[1]), Math.max(p[2], q[2])];
}
