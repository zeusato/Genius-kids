// Kiểu dữ liệu chung của Xưởng Cắt Giấy (plan mục 5.1, 10). Thuần dữ liệu, lưu được dạng JSON.
import type { Vec } from './engine/geom';
import type { Shape } from './engine/poly';

export type PaperShape = 'square' | 'rect' | 'strip' | 'circle' | 'hexagon';

export interface PaperSpec {
  shape: PaperShape;
  /** Bề rộng/cao tờ giấy, cm. Với hình tròn/lục giác dùng `w` làm đường kính. */
  w: number; h: number;
  front: string; back: string;
  pattern?: 'dots' | 'grid' | 'stripes' | 'diamond' | 'glitter';
}

/**
 * Một mục trong danh sách nếp (toạ độ XẤP lúc thực hiện).
 * - fold: vạt nằm ở phía (q − p)·n > 0 lật qua đường (p, n). `valley` = lật lên trên xấp, ngược lại luồn xuống dưới.
 * - flip: lật cả xấp qua đường (p, n), đảo thứ tự lớp.
 */
export type FoldEntry =
  | { kind: 'fold'; p: Vec; n: Vec; valley: boolean }
  | { kind: 'flip'; p: Vec; n: Vec };

export type Op =
  | FoldEntry
  /** Cắt: vùng bị loại K trong toạ độ xấp (đã nong kerf hoặc là hình dập lỗ). */
  | { kind: 'cut'; region: Shape; tool: 'free' | 'line' | 'zigzag' | 'wave' | 'punch' }
  /** Mở nếp cuối cùng (LIFO), kể cả mục lật. */
  | { kind: 'unfold' };

export type Recipe = Op[];
