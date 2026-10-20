// Đường thẳng × đa giác: cắt một đường vô hạn theo Shape (chẵn–lẻ) → các đoạn nằm trong.
// Dùng cho vết nếp trên mặt nạ (plan mục 6.3) và nếp in sẵn trên mẫu 1:1 (mục 7.3).
import { applyLinear, apply, invert, perp, type Iso, type Vec } from './geom';
import type { Shape } from './poly';
import type { Facet } from './fold';
import type { FoldEntry } from '../model';

export type Segment = [Vec, Vec];

/** Đoạn của đường (p, hướng d) nằm trong Shape. */
export function clipLine(s: Shape, p: Vec, d: Vec): Segment[] {
  const ts: number[] = [];
  for (const r of s) for (let i = 0, n = r.length; i < n; i++) {
    const a = r[i], b = r[(i + 1) % n], e = { x: b.x - a.x, y: b.y - a.y };
    const den = d.x * e.y - d.y * e.x;
    if (Math.abs(den) < 1e-12) continue;
    const w = { x: a.x - p.x, y: a.y - p.y };
    const t = (w.x * e.y - w.y * e.x) / den, u = (w.x * d.y - w.y * d.x) / den;
    // nửa mở [0, 1) để đỉnh chung hai cạnh chỉ tính một lần
    if (u >= 0 && u < 1) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const out: Segment[] = [];
  for (let i = 0; i + 1 < ts.length; i += 2) {
    if (ts[i + 1] - ts[i] < 1e-6) continue;
    out.push([{ x: p.x + d.x * ts[i], y: p.y + d.y * ts[i] }, { x: p.x + d.x * ts[i + 1], y: p.y + d.y * ts[i + 1] }]);
  }
  return out;
}

/** Đường (p, n) trong toạ độ xấp đổi về toạ độ giấy của một facet: trả điểm và hướng. */
export function lineInPaper(m: Iso, p: Vec, n: Vec): { p: Vec; d: Vec } {
  const inv = invert(m);
  return { p: apply(inv, p), d: perp(applyLinear(inv, n)) };
}

/** Vết nếp của một mục gấp trên giấy phẳng: mọi đoạn của đường gấp nằm trong các facet ngay trước khi gấp. */
export function creaseSegments(before: Facet[], e: FoldEntry): Segment[] {
  if (e.kind !== 'fold') return [];
  const out: Segment[] = [];
  for (const f of before) { const l = lineInPaper(f.m, e.p, e.n); out.push(...clipLine(f.region, l.p, l.d)); }
  return out;
}
