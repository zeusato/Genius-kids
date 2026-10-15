// Bọc clipper2-ts cho engine (plan mục 5.2). Toạ độ cm, làm tròn 3 chữ số (0,01 mm) nên phép boolean tất định.
// Quy ước Shape: tập vòng kín, vòng ngoài dương (ngược chiều kim đồng hồ), lỗ âm — đúng đầu ra của Clipper.
// Bẫy: FillRule.NonZero với các vòng NGƯỢC chiều chồng nhau sẽ triệt tiêu nhau → luôn qua `oriented()` trước khi hợp.
import {
  ClipType, EndType, FillRule, JoinType, PolyTreeD, type PolyPathD,
  areaPathsD, booleanOpDWithPolyTree, differenceD, inflatePathsD, intersectD, triangulateD, unionD, getBoundsPathsD,
} from 'clipper2-ts';
import { apply, det, perp, scale, add, type Iso, type Vec } from './geom';

export type Ring = Vec[];
export type Shape = Ring[];

export const PRECISION = 3;
const NZ = FillRule.NonZero;

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
export function oriented(rings: Ring[]): Shape { return unionD(rings.map(r => (ringArea(r) < 0 ? [...r].reverse() : r)), NZ, PRECISION); }

export const union = (...shapes: Shape[]): Shape => unionD(shapes.flat(), NZ, PRECISION);
export const intersect = (a: Shape, b: Shape): Shape => (a.length && b.length ? intersectD(a, b, NZ, PRECISION) : []);
export const difference = (a: Shape, b: Shape): Shape => (a.length && b.length ? differenceD(a, b, NZ, PRECISION) : a);

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
  const tree = new PolyTreeD();
  booleanOpDWithPolyTree(ClipType.Union, s, null, tree, NZ, PRECISION);
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
