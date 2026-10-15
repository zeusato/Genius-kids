// Đặt menu nổi (✓ ↻ ✥ của bóng mờ, bong bóng chế độ Chọn) RA NGOÀI hình chiếu của mảnh, để không che mảnh trên màn nhỏ
// (góp ý 15/10). Thứ tự ưu tiên: trên → dưới → phải → trái; không chỗ nào vừa thì đặt trên, ép trong khung.
export interface Rect { x0: number; y0: number; x1: number; y1: number }

const PAD = 8;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** `r`: hình chiếu mảnh (px trong khung); `w×h`: cỡ menu; `W×H`: cỡ khung. */
export function placeMenu(r: Rect, w: number, h: number, W: number, H: number, gap = 12): { left: number; top: number } {
  const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
  const hx = clamp(cx - w / 2, PAD, W - w - PAD), vy = clamp(cy - h / 2, PAD, H - h - PAD);
  if (r.y0 - gap - h >= PAD) return { left: hx, top: r.y0 - gap - h };            // trên
  if (r.y1 + gap + h <= H - PAD) return { left: hx, top: r.y1 + gap };            // dưới
  if (r.x1 + gap + w <= W - PAD) return { left: r.x1 + gap, top: vy };            // phải
  if (r.x0 - gap - w >= PAD) return { left: r.x0 - gap - w, top: vy };            // trái
  return { left: hx, top: PAD };
}

/** Hình chiếu hộp bao (LDraw) lên màn hình qua `project`; null nếu mọi góc ở sau camera. */
export function projectBox(bb: number[], project: (p: [number, number, number]) => { x: number; y: number } | null): Rect | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const X of [bb[0], bb[3]]) for (const Y of [bb[1], bb[4]]) for (const Z of [bb[2], bb[5]]) {
    const s = project([X, Y, Z]); if (!s) continue;
    x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y); x1 = Math.max(x1, s.x); y1 = Math.max(y1, s.y);
  }
  return x0 === Infinity ? null : { x0, y0, x1, y1 };
}
