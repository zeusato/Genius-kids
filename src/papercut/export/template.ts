// Mẫu in tỉ lệ 1:1 (plan mục 7.3).
// A. "Giấy in sẵn nét": tờ giấy chưa gấp, in nếp gấp (nét đứt) và nét cắt trên đúng mặt sẽ nằm trên cùng khi cắt.
// B. "Mẫu đặt lên xấp": viền xấp đã gấp kèm nét cắt, để đặt lên xấp giấy thật mà đồ theo.
// Trang A4 vẽ ở 1240 × 1754 px (150 dpi) nên 1 cm = 1240 / 21 px; có thước 5 cm để kiểm máy in.
import { det, invert, type Vec } from '../engine/geom';
import { type Facet, outline, placed } from '../engine/fold';
import { creaseSegments } from '../engine/lines';
import { area, bounds, difference, intersect, isEmpty, transform, union, type Shape } from '../engine/poly';
import { initialSheet } from '../engine/sheet';
import type { PaperSpec } from '../model';
import { CUT, FOLD, INK, SOFT, tint } from './diagrams';
import type { Step } from './steps';

export const PAGE_W = 1240, PAGE_H = 1754, PX_PER_CM = PAGE_W / 21;
type G = CanvasRenderingContext2D;

/** Khung vẽ có thể xoay 90° (giấy dải dài) và co lại nếu vẫn không vừa. */
interface Frame { cx: number; cy: number; s: number; rot: boolean; mx: number; my: number; mirror?: boolean }
const px = (f: Frame, p: Vec): [number, number] => {
  const x = (f.mirror ? -1 : 1) * (p.x - f.mx), y = p.y - f.my;
  return f.rot ? [f.cx - y * f.s, f.cy - x * f.s] : [f.cx + x * f.s, f.cy - y * f.s];
};

export function frameFor(shape: Shape, box: { x: number; y: number; w: number; h: number }): Frame & { scale: number } {
  const b = bounds(shape), w = b.x1 - b.x0, h = b.y1 - b.y0;
  const fitsStraight = w * PX_PER_CM <= box.w && h * PX_PER_CM <= box.h, fitsRot = h * PX_PER_CM <= box.w && w * PX_PER_CM <= box.h;
  const rot = !fitsStraight && (fitsRot || (w > h) !== (box.w > box.h));
  const [W, H] = rot ? [h, w] : [w, h];
  const scale = Math.min(1, box.w / (W * PX_PER_CM), box.h / (H * PX_PER_CM));
  return { cx: box.x + box.w / 2, cy: box.y + box.h / 2, s: PX_PER_CM * scale, rot, mx: (b.x0 + b.x1) / 2, my: (b.y0 + b.y1) / 2, scale };
}

function path(g: G, f: Frame, s: Shape) { g.beginPath(); for (const r of s) { r.forEach((p, i) => { const [x, y] = px(f, p); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); } }
function line(g: G, f: Frame, pts: Vec[], closed: boolean) { g.beginPath(); pts.forEach((p, i) => { const [x, y] = px(f, p); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); if (closed) g.closePath(); g.stroke(); }

function hatch(g: G, f: Frame, s: Shape) {
  g.save(); path(g, f, s); g.clip('nonzero');
  g.fillStyle = 'rgba(150,160,170,.28)'; g.fillRect(0, 0, PAGE_W, PAGE_H);
  g.strokeStyle = 'rgba(90,100,110,.45)'; g.lineWidth = 1.5; g.beginPath();
  for (let d = -PAGE_H; d < PAGE_W + PAGE_H; d += 14) { g.moveTo(d, 0); g.lineTo(d - PAGE_H, PAGE_H); }
  g.stroke(); g.restore();
}

/** Phần nhìn thấy từ trên (hoặc từ dưới) của từng facet, toạ độ xấp. */
function visible(fs: Facet[], fromTop: boolean) {
  let covered: Shape = [];
  const out: { f: Facet; vis: Shape }[] = [];
  for (const f of [...fs].sort((a, b) => (fromTop ? b.layer - a.layer : a.layer - b.layer))) {
    const pl = placed(f), vis = isEmpty(covered) ? pl : difference(pl, covered);
    if (!isEmpty(vis)) out.push({ f, vis });
    covered = union(covered, pl);
  }
  return out;
}

export type Face = 'front' | 'back';

/**
 * Mặt giấy nằm trên cùng lúc cắt. Gấp lõm thường đưa mặt màu vào trong, nên mặt lộ ra thường là mặt sau —
 * giống giấy thật: người ta vẽ mẫu lên mặt trắng. `face` cố định thì chỉ lấy các phần lộ ra đúng mặt đó.
 */
export function printPlan(fs: Facet[], face?: Face) {
  const top = visible(fs, true), total = Math.max(area(outline(fs)), 1e-9);
  const cover = (fc: Face) => top.filter(({ f }) => (det(f.m) > 0) === (fc === 'front')).reduce((a, p) => a + area(p.vis), 0) / total;
  const chosen: Face = face ?? (cover('front') >= cover('back') ? 'front' : 'back');
  return { face: chosen, parts: top.filter(({ f }) => (det(f.m) > 0) === (chosen === 'front')), cover: cover(chosen) };
}

export interface TemplateNotes { face: Face; partial: number[]; scale: number }

/** Trang A: giấy in sẵn nét. Trả ghi chú để trang hướng dẫn nhắc "lật xấp trước khi cắt". */
export function drawPrintedSheet(g: G, steps: Step[], spec: PaperSpec, box: { x: number; y: number; w: number; h: number }): TemplateNotes {
  const firstCut = steps.find(s => s.kind === 'cut');
  const face: Face = firstCut?.kind === 'cut' ? printPlan(firstCut.before).face : 'front';
  // in lên mặt sau thì nhìn từ mặt in là ảnh soi gương của toạ độ giấy (nhìn từ mặt trước)
  const sheet = initialSheet(spec), fr = { ...frameFor(sheet, box), mirror: face === 'back' };
  path(g, fr, sheet); g.fillStyle = face === 'front' ? tint(spec.front, 0.82) : '#fff'; g.fill('nonzero'); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  const notes: TemplateNotes = { face, partial: [], scale: fr.scale };
  // nếp gấp
  g.lineWidth = 2.5; g.strokeStyle = FOLD;
  steps.forEach(st => {
    if (st.kind !== 'fold' || st.entry.kind !== 'fold') return;
    // nhìn từ mặt sau thì gấp lõm thành gấp lồi
    g.setLineDash(st.entry.valley === (face === 'front') ? [16, 10] : [16, 7, 3, 7]);
    for (const [a, b] of creaseSegments(st.before, st.entry)) line(g, fr, [a, b], false);
  });
  g.setLineDash([]);
  // nét cắt trên mặt nhìn thấy
  steps.forEach((st, i) => {
    if (st.kind !== 'cut') return;
    const plan = printPlan(st.before, face);
    if (plan.cover < 0.9) notes.partial.push(i);
    for (const { f, vis } of plan.parts) {
      const inv = invert(f.m), clip = transform(inv, vis);
      g.save(); path(g, fr, clip); g.clip('nonzero');
      const gone = intersect(st.gone, vis);
      if (!isEmpty(gone)) hatch(g, fr, transform(inv, gone));
      g.strokeStyle = CUT; g.lineWidth = 3;
      for (const m of st.marks) if (m.stroke.length > 1) line(g, fr, m.stroke.map(p => ({ x: inv.a * p.x + inv.c * p.y + inv.e, y: inv.b * p.x + inv.d * p.y + inv.f })), m.closed);
      g.restore();
    }
  });
  return notes;
}

/** Trang B: viền xấp ở kích thước thật + nét cắt, cho một bước cắt. */
export function drawOverlay(g: G, st: Extract<Step, { kind: 'cut' }>, spec: PaperSpec, box: { x: number; y: number; w: number; h: number }) {
  const O = outline(st.before), fr = frameFor(O, box);
  path(g, fr, O); g.fillStyle = tint(spec.front, 0.85); g.fill('nonzero'); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  const gone = intersect(st.gone, O);
  if (!isEmpty(gone)) hatch(g, fr, gone);
  g.save(); path(g, fr, O); g.clip('nonzero');
  g.strokeStyle = CUT; g.lineWidth = 3;
  for (const m of st.marks) if (m.stroke.length > 1) line(g, fr, m.stroke, m.closed);
  g.restore();
  return fr.scale;
}

/** Thước hiệu chuẩn 5 cm. */
export function ruler(g: G, x: number, y: number) {
  const L = 5 * PX_PER_CM;
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke();
  for (let k = 0; k <= 50; k++) { const tx = x + (k / 10) * PX_PER_CM, h = k % 10 === 0 ? 18 : k % 5 === 0 ? 12 : 6; g.beginPath(); g.moveTo(tx, y); g.lineTo(tx, y - h); g.stroke(); }
  g.fillStyle = SOFT; g.font = '500 20px "Be Vietnam Pro","Segoe UI",system-ui,sans-serif'; g.textAlign = 'left';
  g.fillText('Đoạn này phải dài đúng 5 cm. Nếu không, hãy in lại và chọn "Kích thước thực / 100%".', x + L + 24, y - 2);
}
