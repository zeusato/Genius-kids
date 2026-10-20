// Mẫu gợi ý (plan mục 8): mỗi mẫu là một chuỗi thao tác chuẩn. Bé có thể rẽ ngang bất cứ lúc nào.
// Nếp gấp ghi theo đường (p, n): phía (q − p)·n > 0 bị lật. Nét cắt: kerf của nét vẽ, hoặc vùng bỏ đi tính sẵn.
import type { FoldEntry, Op, PaperSpec } from '../model';
import { norm, v, type Vec } from '../engine/geom';
import { circle, difference, kerf, oriented, rect, union, type Shape } from '../engine/poly';

export const KERF = 0.03;
export interface Template { id: string; name: string; hint: string; spec: PaperSpec; ops: () => Op[] }

const BACK = '#fff6e6';
const fold = (px: number, py: number, nx: number, ny: number, valley = true): FoldEntry => ({ kind: 'fold', p: v(px, py), n: norm(v(nx, ny)), valley });
const pts = (a: [number, number][]): Vec[] => a.map(([x, y]) => v(x, y));
/** Nét kéo (mở hoặc khép) → thao tác cắt. */
const stroke = (a: [number, number][], closed = false): Op => { const s = pts(closed ? [...a, a[0]] : a); return { kind: 'cut', region: kerf(s, KERF), tool: 'free', stroke: s, closed }; };
/** Vòng tròn nhỏ (đục lỗ). */
const hole = (cx: number, cy: number, r: number): Op => { const c = circle(cx, cy, r, 40); return { kind: 'cut', region: c, tool: 'punch', stroke: c[0], closed: true }; };
/** Giữ hình `keep` trong khung `frame`, bỏ phần còn lại; `outlineStroke` là nét vẽ cho sơ đồ. */
const keepOnly = (frame: Shape, keep: Shape, outlineStroke: Vec[]): Op => ({ kind: 'cut', region: difference(frame, keep), tool: 'free', stroke: outlineStroke, closed: false });
const smooth = (a: [number, number][], n = 3): [number, number][] => {
  let p = a;
  for (let k = 0; k < n; k++) { const q: [number, number][] = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[i + 1]; q.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1], [0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]); } q.push(p[p.length - 1]); p = q; }
  return p;
};

const C30 = Math.cos(Math.PI / 6);

/** Gấp bông tuyết 6 cánh trên giấy lục giác: đôi ngang, rồi chia ba nửa dưới (60° mỗi phần). */
const HEX_FOLDS: FoldEntry[] = [fold(0, 0, 0, 1), fold(0, 0, C30, 0.5), fold(0, 0, -C30, 0.5)];
/** Gấp D4 trên giấy vuông: đôi dọc, đôi ngang, chéo → tam giác 1/8. */
const D4_FOLDS: FoldEntry[] = [fold(0, 0, 1, 0), fold(0, 0, 0, 1), fold(0, 0, -1, 1)];

export const TEMPLATES: Template[] = [
  {
    id: 'snowflake', name: 'Bông tuyết 6 cánh', hint: 'Giấy lục giác, gấp 3 lần thành 6 phần bằng nhau.',
    spec: { shape: 'hexagon', w: 15, h: 15, front: '#1e88e5', back: BACK },
    ops: () => [...HEX_FOLDS,
      stroke([[-1.4, -7.2], [-0.6, -6.0], [0, -5.0], [0.6, -6.0], [1.4, -7.2]]),
      stroke([[3.3, -3.4], [2.2, -3.7], [1.5, -4.3], [2.4, -4.6], [3.6, -5.1]]),
      stroke([[-3.3, -3.4], [-2.2, -3.7], [-1.5, -4.3], [-2.4, -4.6], [-3.6, -5.1]]),
      stroke([[-1.2, -1.0], [-0.5, -1.8], [0, -2.6], [0.5, -1.8], [1.2, -1.0]]),
      stroke([[-4.4, -5.4], [-3.2, -5.7], [-2.6, -6.2], [-2.9, -7.0]]),
      stroke([[4.4, -5.4], [3.2, -5.7], [2.6, -6.2], [2.9, -7.0]]),
      hole(0, -3.9, 0.55), hole(1.1, -5.6, 0.3), hole(-1.1, -5.6, 0.3),
      { kind: 'unfold' }, { kind: 'unfold' }, { kind: 'unfold' }],
  },
  {
    id: 'flower4', name: 'Hoa 4 cánh', hint: 'Giấy vuông, gấp đôi, gấp đôi, rồi gấp chéo.',
    spec: { shape: 'square', w: 15, h: 15, front: '#e53935', back: BACK },
    ops: () => [...D4_FOLDS,
      stroke(smooth([[0.6, -5.6], [-1.4, -6.9], [-3.6, -6.4], [-5.2, -5.4], [-6.0, -6.8], [-6.6, -8.2]])),
      stroke([[-2.6, -1.6], [-2.9, -3.1], [-4.4, -3.6], [-4.6, -4.0]]),
      stroke([[0.5, -3.2], [-1.2, -3.8], [0.5, -4.6]]),
      stroke([[-0.6, 0.2], [-0.5, -0.9], [0.3, -1.1]]),
      hole(-3.6, -5.0, 0.4),
      { kind: 'unfold' }, { kind: 'unfold' }, { kind: 'unfold' }],
  },
  {
    id: 'flower8', name: 'Hoa 8 cánh', hint: 'Như hoa 4 cánh nhưng gấp thêm một lần nữa.',
    spec: { shape: 'square', w: 15, h: 15, front: '#8e24aa', back: BACK },
    ops: () => {
      const d = -112.5 * Math.PI / 180, wedge = fold(0, 0, -Math.sin(d), Math.cos(d));
      const arc: [number, number][] = [];
      for (let i = 0; i <= 24; i++) { const t = (-98 - (i / 24) * 52) * Math.PI / 180, r = 6.6 + 0.7 * Math.cos(((i / 24) * 52 - 26) * Math.PI / 52 * 2); arc.push([r * Math.cos(t), r * Math.sin(t)]); }
      const at = (deg: number, r: number): [number, number] => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
      return [...D4_FOLDS, wedge,
        stroke(arc),
        stroke([at(-108, 3.0), at(-120, 3.6), at(-108, 4.4)]),
        stroke([at(-139, 2.2), at(-126, 2.9), at(-139, 3.6)]),
        stroke([at(-100, 1.0), at(-123, 1.4), at(-146, 1.0)]),
        hole(...at(-123, 5.2), 0.35),
        { kind: 'unfold' }, { kind: 'unfold' }, { kind: 'unfold' }, { kind: 'unfold' }];
    },
  },
  {
    id: 'heart', name: 'Trái tim', hint: 'Gấp đôi, vẽ nửa trái tim sát nếp gấp rồi cắt.',
    spec: { shape: 'square', w: 15, h: 15, front: '#ec407a', back: BACK },
    ops: () => {
      const half: [number, number][] = [[0, 3.6]];
      for (let i = 0; i <= 20; i++) { const t = Math.PI * (0.05 + (i / 20) * 1.05); half.push([-3.4 - 3.4 * Math.cos(t), 3.4 + 3.4 * Math.sin(t)]); }
      half.push([-5.9, 0.2], [-3.9, -2.8], [-1.8, -5.0], [0, -6.6]);
      const s = pts(half), keep = oriented([[...s, v(0.01, -6.6), v(0.01, 3.6)]]);
      return [fold(0, 0, 1, 0), keepOnly(rect(-8, -8, 0.5, 8), keep, s), { kind: 'unfold' }];
    },
  },
  {
    id: 'butterfly', name: 'Con bướm', hint: 'Gấp đôi, cắt nửa con bướm, đục lỗ trang trí trên cánh.',
    spec: { shape: 'square', w: 15, h: 15, front: '#fb8c00', back: BACK },
    ops: () => {
      const wing = smooth([[0, 5.6], [-0.4, 6.6], [-1.0, 7.0], [-0.6, 4.6], [-2.6, 6.4], [-5.6, 6.6], [-6.8, 4.4], [-5.6, 1.6], [-3.2, 0.4], [-5.6, -1.2], [-6.4, -4.2], [-4.6, -6.2], [-2.2, -5.2], [-0.8, -3.4], [0, -4.6]], 3);
      const s = pts(wing), keep = oriented([[...s, v(0.01, -4.6), v(0.01, 5.6)]]);
      return [fold(0, 0, 1, 0), keepOnly(rect(-8, -8, 0.5, 8), keep, s), hole(-4.0, 4.4, 0.7), hole(-4.2, -3.2, 0.55), hole(-2.4, 2.4, 0.35), { kind: 'unfold' }];
    },
  },
  {
    id: 'people', name: 'Dây người nắm tay', hint: 'Giấy dải dài gấp quạt 4 phần. Tay phải chạm hai mép gấp để dây không đứt.',
    spec: { shape: 'strip', w: 28, h: 7, front: '#43a047', back: BACK },
    ops: () => {
      const body = union(circle(10.5, 2.0, 1.15, 48), rect(9.5, -1.0, 11.5, 0.9), rect(6.5, 0.0, 14.5, 0.75), rect(9.6, -3.6, 10.3, -0.9), rect(10.7, -3.6, 11.4, -0.9));
      const outline = body[0];
      return [fold(-7, 0, -1, 0), fold(0, 0, -1, 0, false), fold(7, 0, -1, 0),
        { kind: 'cut', region: difference(rect(6.5, -4.5, 14.5, 4.5), body), tool: 'free', stroke: outline, closed: true },
        { kind: 'unfold' }, { kind: 'unfold' }, { kind: 'unfold' }];
    },
  },
];

/** Các bước gấp và cắt của mẫu (bỏ các lần mở ở cuối) — dùng cho chế độ làm theo. */
export function templatePlan(t: Template) {
  const ops = t.ops();
  return { folds: ops.filter((o): o is FoldEntry => o.kind === 'fold' || o.kind === 'flip'), cuts: ops.filter(o => o.kind === 'cut') };
}
