// Nét kéo của bé (plan mục 4.2): làm mượt (Chaikin), rút gọn (RDP), và nối đầu/cuối ra tới mép giấy
// khi chúng dừng sát mép — để nét "gần tới mép" vẫn cắt rời được như bé muốn.
import { add, dist, norm, scale, sub, type Vec } from '../engine/geom';
import { contains, type Shape } from '../engine/poly';

export function chaikin(p: Vec[], iterations = 2): Vec[] {
  let a = p;
  for (let k = 0; k < iterations && a.length > 2; k++) {
    const q: Vec[] = [a[0]];
    for (let i = 0; i + 1 < a.length; i++) {
      const s = a[i], t = a[i + 1];
      q.push({ x: 0.75 * s.x + 0.25 * t.x, y: 0.75 * s.y + 0.25 * t.y }, { x: 0.25 * s.x + 0.75 * t.x, y: 0.25 * s.y + 0.75 * t.y });
    }
    q.push(a[a.length - 1]); a = q;
  }
  return a;
}

export function simplify(p: Vec[], eps: number): Vec[] {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const stack: [number, number][] = [[0, p.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!, a = p[i], b = p[j], d = sub(b, a), L = Math.hypot(d.x, d.y) || 1e-9;
    let far = -1, best = eps;
    for (let k = i + 1; k < j; k++) { const e = Math.abs((p[k].x - a.x) * d.y - (p[k].y - a.y) * d.x) / L; if (e > best) { best = e; far = k; } }
    if (far >= 0) { keep[far] = 1; stack.push([i, far], [far, j]); }
  }
  return p.filter((_, i) => keep[i]);
}

/** Kéo dài một đầu nét ra ngoài viền nếu đầu đó nằm trong giấy và cách mép ≤ `reach` cm. */
function extendEnd(p: Vec[], O: Shape, reach: number, atStart: boolean): Vec[] {
  if (p.length < 2) return p;
  const end = atStart ? p[0] : p[p.length - 1], prev = atStart ? p[Math.min(3, p.length - 1)] : p[Math.max(0, p.length - 4)];
  if (!contains(O, end)) return p;
  const dir = norm(sub(end, prev));
  for (let t = 0.05; t <= reach; t += 0.05) {
    const q = add(end, scale(dir, t));
    if (!contains(O, q)) { const out = add(end, scale(dir, t + 0.15)); return atStart ? [out, ...p] : [...p, out]; }
  }
  return p;
}

/** Nét thô (toạ độ xấp) → nét sạch để cắt. Trả null nếu nét quá ngắn. */
export function cleanStroke(raw: Vec[], O: Shape, reach: number): Vec[] | null {
  if (raw.length < 2) return null;
  let length = 0; for (let i = 1; i < raw.length; i++) length += dist(raw[i - 1], raw[i]);
  if (length < 0.3) return null;
  let p = simplify(chaikin(raw, 2), 0.01);
  p = extendEnd(extendEnd(p, O, reach, true), O, reach, false);
  return p;
}
