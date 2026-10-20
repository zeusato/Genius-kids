// Mô tả nếp gấp bằng lời (plan mục 5.4): dùng cho hướng dẫn xuất ra và đọc to.
// Hướng tính theo toạ độ xấp (y lên = phía trên màn hình), đúng góc nhìn của bàn làm việc và sơ đồ.
import type { FoldEntry } from '../model';
import { apply, dist, reflection, side, sub, type Vec } from './geom';
import { type Facet, outline } from './fold';
import { area, bounds, deviation, difference, halfPlane, intersect, isEmpty, transform, type Shape } from './poly';

function centroid(s: Shape): Vec {
  let cx = 0, cy = 0, a = 0;
  for (const r of s) for (let i = 0, n = r.length; i < n; i++) {
    const p = r[i], q = r[(i + 1) % n], c = p.x * q.y - q.x * p.y;
    a += c; cx += (p.x + q.x) * c; cy += (p.y + q.y) * c;
  }
  return Math.abs(a) < 1e-9 ? { x: 0, y: 0 } : { x: cx / (3 * a), y: cy / (3 * a) };
}

/** Hướng vạt giấy di chuyển → cụm từ "từ … sang/lên/xuống …". */
export function direction(d: Vec): string {
  const a = (Math.atan2(d.y, d.x) * 180) / Math.PI;
  const dirs: [number, string][] = [[0, 'từ trái sang phải'], [45, 'chéo lên bên phải'], [90, 'từ dưới lên'], [135, 'chéo lên bên trái'], [180, 'từ phải sang trái'], [-135, 'chéo xuống bên trái'], [-90, 'từ trên xuống'], [-45, 'chéo xuống bên phải']];
  let best = dirs[0];
  for (const x of dirs) { const diff = Math.abs(((a - x[0] + 540) % 360) - 180); if (diff < Math.abs(((a - best[0] + 540) % 360) - 180)) best = x; }
  return best[1];
}

function cornersOf(s: Shape): Vec[] { return s.flatMap(r => r); }

export function describeFold(before: Facet[], e: FoldEntry): string {
  if (e.kind === 'flip') return 'Lật úp xấp giấy lại.';
  const O = outline(before), hp = halfPlane(e.p, e.n);
  const moving = intersect(O, hp), staying = difference(O, hp);
  if (isEmpty(moving) || isEmpty(staying)) return 'Gấp theo đường nét đứt.';
  const flap = transform(reflection(e.p, e.n), moving);
  const where = direction(sub(centroid(flap), centroid(moving)));
  const back = e.valley ? '' : ' ra phía sau';
  const am = area(moving), as = area(staying);
  const b = bounds(O), size = Math.max(b.x1 - b.x0, b.y1 - b.y0);
  if (Math.abs(am - as) / (am + as) < 0.01 && deviation(flap, staying) < 0.02) return `Gấp đôi${back} ${where}, hai nửa chồng khít lên nhau.`;
  // đường gấp đi qua hai góc của xấp: gấp theo đường chéo
  const pts = cornersOf(O), onLine = pts.filter(p => Math.abs(side(p, e.p, e.n)) < 0.03);
  const far = onLine.length >= 2 && dist(onLine[0], onLine[onLine.length - 1]) > size * 0.3;
  if (far) return `Gấp${back} theo đường chéo, ${where}.`;
  // một góc của vạt đặt đúng lên một góc khác
  const R = reflection(e.p, e.n), mid = centroid(O);
  for (const p of cornersOf(moving)) {
    if (Math.abs(side(p, e.p, e.n)) < 0.03) continue;
    const q = apply(R, p);
    if (pts.some(c => dist(c, q) < 0.05)) return `Gấp${back} ${where} sao cho góc giấy đặt đúng lên góc kia.`;
    if (dist(q, mid) < size * 0.02) return `Gấp${back} ${where}, đưa góc giấy vào đúng giữa.`;
  }
  const frac = am / (am + as);
  const nice = [[1 / 3, 'một phần ba'], [1 / 4, 'một phần tư']] as const;
  for (const [f, name] of nice) if (Math.abs(frac - f) < 0.015) return `Gấp${back} ${where}, phần gấp chiếm khoảng ${name} xấp giấy.`;
  return `Gấp${back} ${where} theo đường nét đứt.`;
}
