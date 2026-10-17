// Bọc clipper2-ts cho engine (plan mục 5.2). Toạ độ cm, làm tròn 4 chữ số (0,001 mm) nên phép boolean tất định.
// Bẫy: ở lưới 3 chữ số (0,01 mm) clipper2-ts 2.0.1-18 có lúc treo (clipperGuard.ts) và có lúc differenceD lặng lẽ
// làm mất một đảo giấy 0,26 cm² (fuzz seq 950, 15/10/2026); cùng dữ liệu ở lưới 4–5 chữ số cho kết quả đúng.
// Quy ước Shape: tập vòng kín, vòng ngoài dương (ngược chiều kim đồng hồ), lỗ âm — đúng đầu ra của Clipper.
// Bẫy: FillRule.NonZero với các vòng NGƯỢC chiều chồng nhau sẽ triệt tiêu nhau → luôn qua `oriented()` trước khi hợp.
import {
  ClipType, ClipperD, EndType, FillRule, JoinType, PointInPolygonResult, PolyTreeD, type PolyPathD,
  areaPathsD, inflatePathsD, pointInPolygonD, triangulateD, getBoundsPathsD,
} from 'clipper2-ts';
import { installClipperGuard } from './clipperGuard';
import { apply, det, perp, scale, add, type Iso, type Vec } from './geom';

export type Ring = Vec[];
export type Shape = Ring[];

export const PRECISION = 4;
const NZ = FillRule.NonZero;

installClipperGuard();
/** Lưới thử lại khi Clipper báo lỗi (vòng lặp cạnh ngang bị chặn, xem clipperGuard.ts). */
const FALLBACK = [PRECISION, 5, 3];
/** Chẩn đoán cho fuzz/spike-report: số lần thử lại vì Clipper báo lỗi / vì kết quả sai diện tích. */
export const clipperStats = { retries: 0, invalid: 0, unresolved: 0 };

/**
 * Chạy một phép boolean; Clipper báo lỗi hoặc `check` (nếu có) trả số dương (độ sai) thì thử lưới khác.
 * Hết lưới mà vẫn sai thì trả kết quả sai ít nhất.
 */
function run(ct: ClipType, a: Shape, b: Shape | null, check?: (s: Shape, prec: number) => number): Shape;
function run(ct: ClipType, a: Shape, b: Shape | null, check: undefined, tree: PolyTreeD): PolyTreeD;
function run(ct: ClipType, a: Shape, b: Shape | null, check?: (s: Shape, prec: number) => number, tree?: PolyTreeD): Shape | PolyTreeD {
  let best: Shape | null = null, bestErr = Infinity;
  for (const prec of FALLBACK) {
    const c = new ClipperD(prec);
    c.addSubjectPaths(a);
    if (b) c.addClipPaths(b);
    const out: Shape = [];
    if (!(tree ? c.execute(ct, NZ, tree) : c.execute(ct, NZ, out))) { clipperStats.retries++; continue; }
    if (tree || !check) return tree ?? out;
    const err = check(out, prec);
    if (err <= 0) return out;
    clipperStats.invalid++;
    if (err < bestErr) { best = out; bestErr = err; }
  }
  if (best) { clipperStats.unresolved++; return best; }
  throw new Error('papercut: boolean op failed at every precision');
}

/**
 * a − b khi đã biết diện tích phần bị bỏ (= diện tích a ∩ b). Bẫy: differenceD của clipper2-ts 2.0.1-18 đôi khi
 * lặng lẽ làm mất một đảo giấy (fuzz seq 950/887, 15/10/2026) → kiểm bảo toàn diện tích, sai thì đổi lưới.
 */
export function differenceKnown(a: Shape, b: Shape, removedArea: number): Shape {
  if (!a.length || !b.length) return a;
  const A = area(a), edge = perimeter(a) + perimeter(b);
  return run(ClipType.Difference, a, b, (r, prec) => Math.abs(A - area(r) - removedArea) - 10 ** -prec * edge - 1e-6);
}

export const area = (s: Shape) => areaPathsD(s);
export const isEmpty = (s: Shape) => s.length === 0 || Math.abs(areaPathsD(s)) < 1e-6;

export function rect(x0: number, y0: number, x1: number, y1: number): Shape {
  return [[{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }]];
}
export function circle(cx: number, cy: number, r: number, n = 96): Shape {
  const ring: Ring = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2; ring.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) }); }
  return [ring];
}

function ringArea(r: Ring) { let s = 0; for (let i = 0, n = r.length; i < n; i++) { const p = r[i], q = r[(i + 1) % n]; s += p.x * q.y - q.x * p.y; } return s / 2; }

/** Đưa mọi vòng về chiều dương rồi hợp (dùng cho các đa giác người dùng vẽ, chiều tuỳ ý). */
export function oriented(rings: Ring[]): Shape { return unionAll(rings.map(r => (ringArea(r) < 0 ? [...r].reverse() : r))); }

// Bẫy: unionD(subject, fillRule) một tham số KHÔNG nhận precision (rơi về 2 chữ số) → luôn đi qua run().
const unionAll = (paths: Ring[]): Shape => (paths.length ? run(ClipType.Union, paths, null) : []);
export const union = (...shapes: Shape[]): Shape => unionAll(shapes.flat());
export const intersect = (a: Shape, b: Shape): Shape => (a.length && b.length ? run(ClipType.Intersection, a, b) : []);
export const difference = (a: Shape, b: Shape): Shape => (a.length && b.length ? run(ClipType.Difference, a, b) : a);

/** Biến đổi Shape bằng phép dời hình; phép lật (det < 0) đảo chiều vòng nên đảo lại để giữ quy ước. */
export function transform(m: Iso, s: Shape): Shape {
  const flip = det(m) < 0;
  return s.map(r => { const out = r.map(p => apply(m, p)); return flip ? out.reverse() : out; });
}

/** Nửa mặt phẳng {q : (q − p)·n > 0} cắt gọn trong hình vuông cạnh 2·R quanh p. */
export function halfPlane(p: Vec, n: Vec, R = 2000): Shape {
  const t = perp(n), a = add(p, scale(t, R)), b = add(p, scale(t, -R));
  return [[b, a, add(a, scale(n, R)), add(b, scale(n, R))].map(q => ({ x: q.x, y: q.y }))].map(r => (ringArea(r) < 0 ? r.reverse() : r));
}

/** Nét cắt (polyline) → dải hẹp bề rộng `width` (kerf), đầu tròn. */
export function kerf(stroke: Vec[], width: number): Shape {
  if (stroke.length < 2) return [];
  return inflatePathsD([stroke], width / 2, JoinType.Round, EndType.Round, 2, PRECISION);
}

/** Tách Shape thành các mảnh liền (mỗi mảnh = 1 vòng ngoài + các lỗ của nó). */
export function components(s: Shape): Shape[] {
  if (!s.length) return [];
  const tree = run(ClipType.Union, s, null, undefined, new PolyTreeD());
  const out: Shape[] = [];
  const walk = (node: PolyPathD) => {
    for (let i = 0; i < node.count; i++) {
      const outer = node.child(i);
      const piece: Shape = [outer.poly!];
      for (let j = 0; j < outer.count; j++) { const hole = outer.child(j); piece.push(hole.poly!); walk(hole); }
      out.push(piece);
    }
  };
  walk(tree);
  return out;
}

export function bounds(s: Shape) { const r = getBoundsPathsD(s); return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }; }

/** Tam giác hoá (cho mảnh vụn và sơ đồ). Trả mảng tam giác, mỗi tam giác 3 điểm. */
export function triangles(s: Shape): Vec[][] {
  if (!s.length) return [];
  const { solution } = triangulateD(s, PRECISION);
  return solution;
}

export const xor = (a: Shape, b: Shape): Shape => run(ClipType.Xor, a, b);

/** Điểm nằm trong Shape (vòng ngoài dương, lỗ âm → cộng số vòng có dấu). Điểm trên biên tính là trong. */
export function contains(s: Shape, q: Vec): boolean {
  let w = 0;
  for (const r of s) {
    const res = pointInPolygonD(q, r, PRECISION);
    if (res === PointInPolygonResult.IsOn) return true;
    if (res === PointInPolygonResult.IsInside) w += ringArea(r) > 0 ? 1 : -1;
  }
  return w > 0;
}

export const perimeter = (s: Shape) => s.reduce((t, r) => t + r.reduce((u, p, i) => u + Math.hypot(r[(i + 1) % r.length].x - p.x, r[(i + 1) % r.length].y - p.y), 0), 0);

/** Độ lệch trung bình giữa hai hình (cm) ≈ diện tích XOR / chu vi — dùng cho bất biến đối xứng (≤ 0,005 cm). */
export const deviation = (a: Shape, b: Shape) => area(xor(a, b)) / Math.max(perimeter(a), 1e-9);

