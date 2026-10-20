// Áp danh sách nếp lên Sheet → các facet xếp chồng (plan mục 5.1, thuật toán ở mục 5.5).
import type { FoldEntry } from '../model';
import { IDENTITY, applyLinear, apply, compose, invert, reflection, type Iso, type Vec } from './geom';
import { area, contains, difference, halfPlane, intersect, isEmpty, transform, union, type Shape } from './poly';
import type { Sheet } from './sheet';

/** Một mảnh phẳng của xấp: `region` trong toạ độ giấy, `m` đưa giấy → xấp, `layer` càng lớn càng nằm trên. */
export interface Facet { region: Shape; m: Iso; layer: number }

export const topLayer = (fs: Facet[]) => fs.reduce((t, f) => Math.max(t, f.layer), -Infinity);
export const bottomLayer = (fs: Facet[]) => fs.reduce((b, f) => Math.min(b, f.layer), Infinity);

/** Đường (p, n) của toạ độ xấp đổi về toạ độ giấy của facet. */
function lineInPaper(m: Iso, p: Vec, n: Vec) {
  const inv = invert(m);
  return { p: apply(inv, p), n: applyLinear(inv, n) };
}

/**
 * Áp một mục nếp. Lớp KHÔNG nén thứ hạng (renderer dùng z = 2T − z với T = (top + 0,5)·h cho khớp engine):
 * gấp lõm → 2·top + 1 − layer, gấp lồi → 2·bottom − 1 − layer, lật xấp → top + bottom − layer.
 */
export function applyFold(facets: Facet[], e: FoldEntry): Facet[] {
  const R = reflection(e.p, e.n);
  const top = topLayer(facets), bottom = bottomLayer(facets);
  if (e.kind === 'flip') return facets.map(f => ({ region: f.region, m: compose(R, f.m), layer: top + bottom - f.layer }));
  const out: Facet[] = [];
  for (const f of facets) {
    const l = lineInPaper(f.m, e.p, e.n), hp = halfPlane(l.p, l.n);
    const moving = intersect(f.region, hp), staying = difference(f.region, hp);
    if (!isEmpty(staying)) out.push({ region: staying, m: f.m, layer: f.layer });
    if (!isEmpty(moving)) out.push({ region: moving, m: compose(R, f.m), layer: e.valley ? 2 * top + 1 - f.layer : 2 * bottom - 1 - f.layer });
  }
  return out;
}

export function foldStack(sheet: Sheet, entries: readonly FoldEntry[]): Facet[] {
  let fs: Facet[] = isEmpty(sheet) ? [] : [{ region: sheet, m: IDENTITY, layer: 0 }];
  for (const e of entries) fs = applyFold(fs, e);
  return fs;
}

/** Ảnh của facet trên mặt bàn (toạ độ xấp). */
export const placed = (f: Facet): Shape => transform(f.m, f.region);

/** Viền xấp = hợp ảnh các facet. */
export const outline = (fs: Facet[]): Shape => union(...fs.map(placed));

/** Tổng diện tích giấy (cộng mọi lớp) — bằng diện tích Sheet. */
export const paperArea = (fs: Facet[]) => fs.reduce((s, f) => s + area(f.region), 0);

/** Số lớp giấy tại một điểm của xấp. */
export const layersAt = (fs: Facet[], q: Vec) => fs.reduce((n, f) => n + (contains(placed(f), q) ? 1 : 0), 0);

/** Diện tích giấy (cộng mọi lớp) nằm trong vùng `s` của xấp. */
export const paperAreaIn = (fs: Facet[], s: Shape) => fs.reduce((a, f) => a + area(intersect(placed(f), s)), 0);
