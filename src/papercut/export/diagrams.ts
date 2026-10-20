// Sơ đồ 2D theo ký hiệu gấp giấy (plan mục 7.2), vẽ bằng Canvas 2D từ chính hình học engine.
// Nét đứt = gấp lõm, nét chấm-gạch = gấp ra sau, mũi tên cong = hướng lật vạt giấy,
// nét đỏ liền = đường cắt, phần tô xám gạch chéo = phần bỏ đi.
import { apply, det, reflection, type Vec } from '../engine/geom';
import { type Facet, outline, placed } from '../engine/fold';
import { clipLine } from '../engine/lines';
import { bounds, halfPlane, intersect, isEmpty, transform, type Shape } from '../engine/poly';
import { perp } from '../engine/geom';
import { initialSheet } from '../engine/sheet';
import type { PaperSpec } from '../model';
import type { Step } from './steps';

export interface Box { x: number; y: number; w: number; h: number }
export const INK = '#1b2a34', SOFT = '#5b6b7a', CUT = '#e5484d', FOLD = '#2d6cdf';

type G = CanvasRenderingContext2D;
interface View { s: number; ox: number; oy: number }
const toPx = (v: View, p: Vec): [number, number] => [v.ox + p.x * v.s, v.oy - p.y * v.s];

function fit(shapes: Shape[], box: Box, pad = 0.12): View {
  const bs = shapes.filter(s => s.length).map(bounds);
  if (!bs.length) return { s: 1, ox: box.x + box.w / 2, oy: box.y + box.h / 2 };
  const x0 = Math.min(...bs.map(b => b.x0)), x1 = Math.max(...bs.map(b => b.x1)), y0 = Math.min(...bs.map(b => b.y0)), y1 = Math.max(...bs.map(b => b.y1));
  const s = Math.min((box.w * (1 - 2 * pad)) / Math.max(x1 - x0, 1e-3), (box.h * (1 - 2 * pad)) / Math.max(y1 - y0, 1e-3));
  return { s, ox: box.x + box.w / 2 - ((x0 + x1) / 2) * s, oy: box.y + box.h / 2 + ((y0 + y1) / 2) * s };
}

function path(g: G, v: View, s: Shape) {
  g.beginPath();
  for (const r of s) { r.forEach((p, i) => { const [x, y] = toPx(v, p); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); }
}

/** Màu nhạt hơn cho mặt sau / bóng. */
export function tint(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  const m = (c: number) => Math.round(c + (255 - c) * k);
  return `rgb(${m(r)},${m(gg)},${m(b)})`;
}

function drawFacets(g: G, v: View, fs: Facet[], spec: PaperSpec, lineW: number) {
  for (const f of [...fs].sort((a, b) => a.layer - b.layer)) {
    path(g, v, placed(f));
    g.fillStyle = det(f.m) > 0 ? tint(spec.front, 0.35) : tint(spec.back, 0.15);
    g.fill('nonzero');
    g.strokeStyle = 'rgba(27,42,52,.55)'; g.lineWidth = lineW; g.stroke();
  }
}

function hatch(g: G, v: View, s: Shape, box: Box, lineW: number) {
  g.save(); path(g, v, s); g.clip('nonzero');
  g.fillStyle = 'rgba(120,130,140,.35)'; g.fillRect(box.x, box.y, box.w, box.h);
  g.strokeStyle = 'rgba(80,90,100,.55)'; g.lineWidth = lineW;
  const step = Math.max(6, lineW * 5);
  g.beginPath();
  for (let d = -box.h; d < box.w + box.h; d += step) { g.moveTo(box.x + d, box.y); g.lineTo(box.x + d - box.h, box.y + box.h); }
  g.stroke(); g.restore();
}

function centroid(s: Shape): Vec {
  let cx = 0, cy = 0, a = 0;
  for (const r of s) for (let i = 0, n = r.length; i < n; i++) { const p = r[i], q = r[(i + 1) % n], c = p.x * q.y - q.x * p.y; a += c; cx += (p.x + q.x) * c; cy += (p.y + q.y) * c; }
  return Math.abs(a) < 1e-9 ? { x: 0, y: 0 } : { x: cx / (3 * a), y: cy / (3 * a) };
}

function arrow(g: G, a: [number, number], b: [number, number], color: string, w: number) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  // cung lệch sang một bên để thấy là "lật" chứ không phải "trượt"
  const cx = mx - (dy / L) * L * 0.35, cy = my + (dx / L) * L * 0.35;
  g.strokeStyle = color; g.lineWidth = w; g.setLineDash([]); g.lineCap = 'round';
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(cx, cy, b[0], b[1]); g.stroke();
  const ang = Math.atan2(b[1] - cy, b[0] - cx), hl = w * 5;
  g.fillStyle = color; g.beginPath(); g.moveTo(b[0], b[1]);
  g.lineTo(b[0] - hl * Math.cos(ang - 0.45), b[1] - hl * Math.sin(ang - 0.45));
  g.lineTo(b[0] - hl * Math.cos(ang + 0.45), b[1] - hl * Math.sin(ang + 0.45)); g.closePath(); g.fill();
}

function scissors(g: G, x: number, y: number, size: number) {
  g.save(); g.font = `${size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = CUT; g.fillText('✂', x, y); g.restore();
}

/** Vẽ một bước vào ô `box`. `lw` = độ dày nét cơ sở (px). */
export function drawStep(g: G, step: Step, spec: PaperSpec, box: Box, lw = 2) {
  g.save();
  g.beginPath(); g.rect(box.x, box.y, box.w, box.h); g.clip();
  g.lineJoin = 'round';
  switch (step.kind) {
    case 'paper': case 'result': {
      const sheet = step.kind === 'result' ? step.sheet : null;
      const shape = sheet ?? initialSheet(spec);
      const v = fit([shape], box, 0.1);
      path(g, v, shape); g.fillStyle = spec.front; g.fill('nonzero'); g.strokeStyle = 'rgba(27,42,52,.6)'; g.lineWidth = lw; g.stroke();
      break;
    }
    case 'fold': {
      const O = outline(step.before), e = step.entry;
      const flap = e.kind === 'fold' ? transform(reflection(e.p, e.n), intersect(O, halfPlane(e.p, e.n))) : [];
      const v = fit([O, flap], box);
      drawFacets(g, v, step.before, spec, lw * 0.6);
      if (e.kind === 'fold') {
        // vạt sau khi gấp: viền chấm mờ
        if (!isEmpty(flap)) { path(g, v, flap); g.setLineDash([lw * 1.5, lw * 2.5]); g.strokeStyle = 'rgba(45,108,223,.55)'; g.lineWidth = lw; g.stroke(); }
        g.setLineDash(e.valley ? [lw * 6, lw * 4] : [lw * 6, lw * 3, lw, lw * 3]);
        g.strokeStyle = FOLD; g.lineWidth = lw * 1.6;
        for (const [a, b] of clipLine(O, e.p, perp(e.n))) { const pa = toPx(v, a), pb = toPx(v, b); g.beginPath(); g.moveTo(...pa); g.lineTo(...pb); g.stroke(); }
        g.setLineDash([]);
        const moving = intersect(O, halfPlane(e.p, e.n));
        if (!isEmpty(moving)) {
          const c0 = centroid(moving), c1 = apply(reflection(e.p, e.n), c0);
          arrow(g, toPx(v, c0), toPx(v, c1), FOLD, lw * 1.4);
        }
      } else {
        // lật xấp: mũi tên vòng
        const c = centroid(O), [x, y] = toPx(v, c), r = Math.min(box.w, box.h) * 0.12;
        g.strokeStyle = FOLD; g.lineWidth = lw * 1.6; g.beginPath(); g.arc(x, y, r, Math.PI * 0.15, Math.PI * 1.75); g.stroke();
        arrow(g, [x + r * Math.cos(Math.PI * 1.6), y + r * Math.sin(Math.PI * 1.6)], [x + r * Math.cos(Math.PI * 1.85), y + r * Math.sin(Math.PI * 1.85)], FOLD, lw * 1.4);
      }
      break;
    }
    case 'cut': {
      const O = outline(step.before), v = fit([O], box);
      drawFacets(g, v, step.before, spec, lw * 0.6);
      hatch(g, v, intersect(step.gone, O), box, lw * 0.6);
      g.strokeStyle = CUT; g.lineWidth = lw * 1.6; g.setLineDash([]);
      for (const m of step.marks) {
        if (m.stroke.length < 2) continue;
        g.beginPath(); m.stroke.forEach((p, i) => { const [x, y] = toPx(v, p); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
        if (m.closed) g.closePath();
        g.stroke();
      }
      const first = step.marks.find(m => !m.punch && m.stroke.length > 1) ?? step.marks[0];
      if (first?.stroke.length) { const [x, y] = toPx(v, first.stroke[0]); scissors(g, x, y, Math.max(18, lw * 11)); }
      break;
    }
    case 'unfold': {
      const O = outline(step.after), v = fit([O], box);
      drawFacets(g, v, step.after, spec, lw * 0.6);
      break;
    }
  }
  g.restore();
}

/** Viền xấp một bước (để vẽ mẫu, ảnh nhỏ). */
export const stepOutline = (step: Step): Shape => step.kind === 'fold' || step.kind === 'cut' ? outline(step.before) : step.kind === 'unfold' ? outline(step.after) : step.kind === 'result' ? step.sheet : [];
