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
  /**
   * Cắt: vùng bị loại K trong toạ độ xấp (đã nong kerf hoặc là hình dập lỗ).
   * `stroke` = nét kéo (toạ độ xấp) để vẽ sơ đồ hướng dẫn; với dập lỗ/mẫu là đường viền khép kín.
   */
  | { kind: 'cut'; region: Shape; tool: 'free' | 'line' | 'zigzag' | 'wave' | 'punch'; stroke?: Vec[]; closed?: boolean }
  /** Mở nếp cuối cùng (LIFO), kể cả mục lật. */
  | { kind: 'unfold' };

export type Recipe = Op[];

/** Phạm vi lưu: tài khoản + hồ sơ bé (giống Xưởng Gốm). */
export interface Scope { account: string; student: string }

/** Tác phẩm trong Sổ Cắt Giấy (plan mục 10). Sheet/facets không lưu — dựng lại từ `ops`. */
export interface PapercutArtwork extends Scope {
  id: string; name: string;
  spec: PaperSpec; ops: Op[];
  templateId?: string;
  createdAt: string; updatedAt: string; revision: number;
}
export interface ArtworkSummary { id: string; name: string; updatedAt: string; revision: number; thumb?: Blob }

/** Tiến độ nhẹ trong hồ sơ bé: khoá thưởng đã nhận và huy hiệu. */
export interface PapercutProgress { version: 1; claimed: string[]; badges: string[] }
