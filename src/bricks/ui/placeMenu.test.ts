import { expect, it } from 'vitest';
import { placeMenu, type Rect } from './placeMenu';

const overlaps = (r: Rect, m: { left: number; top: number }, w: number, h: number) => m.left < r.x1 && m.left + w > r.x0 && m.top < r.y1 && m.top + h > r.y0;

it('menu nổi không bao giờ che hình chiếu mảnh khi còn chỗ, và luôn nằm trong khung', () => {
  const W = 390, H = 420, w = 170, h = 52;                       // khung 3D của điện thoại dọc
  const cases: Rect[] = [
    { x0: 120, y0: 200, x1: 260, y1: 260 },                      // giữa → trên
    { x0: 120, y0: 20, x1: 260, y1: 90 },                        // sát mép trên → dưới
    { x0: 20, y0: 40, x1: 140, y1: 380 },                        // cao gần hết khung, bên trái → phải
    { x0: 250, y0: 40, x1: 380, y1: 380 },                       // cao gần hết khung, bên phải → trái
  ];
  const where = cases.map(r => { const m = placeMenu(r, w, h, W, H); expect(overlaps(r, m, w, h), JSON.stringify(r)).toBe(false);
    expect(m.left).toBeGreaterThanOrEqual(8); expect(m.left + w).toBeLessThanOrEqual(W - 8); expect(m.top).toBeGreaterThanOrEqual(8); expect(m.top + h).toBeLessThanOrEqual(H - 8);
    return m; });
  expect(where[0].top).toBe(200 - 12 - h);
  expect(where[1].top).toBe(90 + 12);
  expect(where[2].left).toBe(140 + 12);
  expect(where[3].left).toBe(250 - 12 - w);
});
