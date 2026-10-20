// Nam châm gấp (plan mục 4.1): các đường "đẹp" của viền xấp hiện tại, và hút đường kéo-gấp vào đường gần nhất.
import { add, cross, dist, dot, norm, perp, scale, side, sub, v, type Vec } from './geom';
import { contains, type Shape } from './poly';

export type SnapKind = 'diagonal' | 'corner' | 'edge' | 'third';
export interface SnapLine { p: Vec; n: Vec; kind: SnapKind; label: string }

/** Rút gọn vòng ngoài lớn nhất: bỏ đỉnh gần thẳng hàng (< 2°) hoặc quá gần nhau (< 2 mm). */
function corners(s: Shape): Vec[] {
  let ring = s[0] ?? [], best = 0;
  for (const r of s) { let a = 0; for (let i = 0; i < r.length; i++) a += cross(r[i], r[(i + 1) % r.length]); if (a > best) { best = a; ring = r; } }
  let pts = ring.filter((p, i) => dist(p, ring[(i + 1) % ring.length]) > 0.02);
  for (let changed = true; changed && pts.length > 3;) {
    changed = false;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
      const t = Math.abs(cross(norm(sub(b, a)), norm(sub(c, b))));
      if (t < 0.035 || dist(a, b) < 0.2) { pts.splice(i, 1); changed = true; break; }
    }
  }
  return pts;
}

/** Đường cắt qua phần trong của viền (có đỉnh ở cả hai phía). */
function crosses(pts: Vec[], p: Vec, n: Vec) {
  let pos = false, neg = false;
  for (const q of pts) { const s = side(q, p, n); if (s > 0.05) pos = true; else if (s < -0.05) neg = true; }
  return pos && neg;
}

export function snapLines(outline: Shape): SnapLine[] {
  const pts = corners(outline);
  if (pts.length < 3 || pts.length > 24) return [];
  const out: SnapLine[] = [];
  const push = (p: Vec, n: Vec, kind: SnapKind, label: string) => {
    n = norm(n);
    if (!crosses(pts, p, n)) return;
    // bỏ đường trùng (cùng phương, cùng vị trí)
    if (out.some(l => Math.abs(cross(l.n, n)) < 0.01 && Math.abs(side(p, l.p, l.n)) < 0.02)) return;
    out.push({ p, n, kind, label });
  };
  const k = pts.length;
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const a = pts[i], b = pts[j], mid = scale(add(a, b), 0.5);
    // đường qua hai góc (không phải cạnh): đường chéo
    if (j !== i + 1 && !(i === 0 && j === k - 1) && contains(outline, mid)) push(a, perp(sub(b, a)), 'diagonal', 'Đường chéo');
    // trung trực hai góc: đưa góc này trùng góc kia
    push(mid, sub(b, a), 'corner', j === i + 1 || (i === 0 && j === k - 1) ? '½' : 'Góc → góc');
  }
  // phân giác hai cạnh: mép trùng mép
  const edges = pts.map((a, i) => [a, pts[(i + 1) % k]] as const);
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const [a, b] = edges[i], [c, d] = edges[j], u = norm(sub(b, a)), w = norm(sub(d, c));
    const den = cross(u, w);
    if (Math.abs(den) < 1e-6) { // song song: đường giữa
      const off = side(c, a, perp(u));
      if (Math.abs(off) > 0.1) push(add(a, scale(perp(u), off / 2)), perp(u), 'edge', '½');
      continue;
    }
    const t = cross(sub(c, a), w) / den, x = add(a, scale(u, t));
    push(x, sub(u, w), 'edge', 'Mép → mép');
    push(x, add(u, w), 'edge', 'Mép → mép');
  }
  // chia ba góc tại mỗi đỉnh (bông tuyết 6 cánh: 60°)
  for (let i = 0; i < k; i++) {
    const a = pts[(i + k - 1) % k], b = pts[i], c = pts[(i + 1) % k];
    const u = norm(sub(a, b)), w = norm(sub(c, b));
    const ang = Math.acos(Math.max(-1, Math.min(1, dot(u, w))));
    if (ang < 0.5) continue;
    const base = Math.atan2(u.y, u.x), dir = cross(u, w) > 0 ? 1 : -1;
    for (const f of [1 / 3, 2 / 3]) {
      const t = base + dir * ang * f, d = v(Math.cos(t), Math.sin(t));
      push(b, perp(d), 'third', `${Math.round((ang * 180 / Math.PI) / 3)}°`);
    }
  }
  // chia ba nửa mặt phẳng tại trung điểm mỗi cạnh (giấy đã gấp đôi → gấp bông tuyết 6 cánh quanh tâm)
  for (const [a, b] of edges) {
    const m = scale(add(a, b), 0.5), u = norm(sub(b, a));
    for (const t of [Math.PI / 3, (2 * Math.PI) / 3]) {
      const d = v(u.x * Math.cos(t) - u.y * Math.sin(t), u.x * Math.sin(t) + u.y * Math.cos(t));
      push(m, perp(d), 'third', '60°');
    }
  }
  return out;
}

export interface Snapped { p: Vec; n: Vec; line: SnapLine }

/**
 * Hút đường kéo-gấp (trung trực PF, phía chứa P bị lật) vào đường đẹp gần nhất:
 * lệch góc ≤ `maxAngle` (rad) và trung điểm PF cách đường ≤ `maxDist` (cm). Trả null nếu không có.
 */
export function snapFold(lines: SnapLine[], P: Vec, F: Vec, maxDist: number, maxAngle = (4 * Math.PI) / 180): Snapped | null {
  if (dist(P, F) < 1e-6) return null;
  const n0 = norm(sub(P, F)), mid = scale(add(P, F), 0.5);
  let best: Snapped | null = null, score = Infinity;
  for (const l of lines) {
    const n = dot(l.n, n0) >= 0 ? l.n : scale(l.n, -1);
    const ang = Math.acos(Math.min(1, Math.abs(dot(n, n0)))), d = Math.abs(side(mid, l.p, n));
    if (ang > maxAngle || d > maxDist || side(P, l.p, n) <= 0) continue;
    const sc = ang / maxAngle + d / maxDist;
    if (sc < score) { score = sc; best = { p: l.p, n, line: l }; }
  }
  return best;
}
