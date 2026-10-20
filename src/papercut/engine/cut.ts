// Một luật cắt chung cho mọi loại nét (plan mục 4.2, 5.2; thuật toán ở mục 5.5):
// K = vùng bị loại (toạ độ xấp), O = viền xấp. Tách O − K thành mảnh; giữ mảnh có nhiều giấy nhất (cộng mọi lớp),
// các mảnh khác rơi. Vùng bỏ = K ∪ mảnh rơi; tiền ảnh của nó qua từng facet bị trừ khỏi Sheet.
// Nét kín, khe hở, nét mép-tới-mép đều tự đúng — không cần phân loại nét.
import { invert } from './geom';
import { type Facet, outline, paperAreaIn } from './fold';
import { area, components, difference, differenceKnown, intersect, isEmpty, transform, union, type Shape } from './poly';
import type { Sheet } from './sheet';

/** Mảnh rơi nhỏ hơn mức này (cm², cộng mọi lớp) là bụi: vẫn bị bỏ nhưng không thành mảnh vụn hiển thị. */
const DUST = 1e-3;

export interface CutResult {
  sheet: Sheet;
  /** Các mảnh rơi trong toạ độ xấp (để vẽ mảnh vụn). */
  dropped: Shape[];
  /** Phần giấy bị bỏ, toạ độ giấy. */
  removed: Shape;
  /** Facets sau khi cắt — cập nhật tăng dần (region − tiền ảnh vùng bỏ), rẻ hơn gấp lại từ đầu ~3 lần. */
  facets: Facet[];
}

export function cut(sheet: Sheet, facets: Facet[], K: Shape): CutResult {
  if (isEmpty(K) || !facets.length) return { sheet, dropped: [], removed: [], facets };
  const parts = components(difference(outline(facets), K));
  const pieces = parts.map(pc => ({ pc, w: parts.length > 1 ? paperAreaIn(facets, pc) : 0 }));
  let keep = -1;
  pieces.forEach((p, i) => { if (keep < 0 || p.w > pieces[keep].w) keep = i; });
  const falling = pieces.filter((_, i) => i !== keep);
  const gone = union(K, ...falling.map(p => p.pc));
  const pre = facets.map(f => transform(invert(f.m), gone));
  const cutParts = facets.map((f, i) => intersect(f.region, pre[i]));
  const removed = union(...cutParts);
  const dropped = falling.filter(p => p.w >= DUST).map(p => p.pc);
  if (isEmpty(removed)) return { sheet, dropped, removed, facets };
  // Facets cập nhật tăng dần; mỗi phép trừ được kiểm bảo toàn diện tích (xem differenceKnown).
  const next = facets.map((f, i) => ({ ...f, region: differenceKnown(f.region, pre[i], area(cutParts[i])) })).filter(f => !isEmpty(f.region));
  return { sheet: differenceKnown(sheet, removed, area(removed)), dropped, removed, facets: next };
}
