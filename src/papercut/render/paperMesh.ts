// Lưới đều + biến dạng uốn trụ (plan mục 6.1–6.2; công thức ở mục 5.5). Thuần TS, không Three,
// để test được và dùng chung cho raycast. Nếp đã xong: phản xạ chính xác + số học lớp giống hệt engine (fold.ts),
// nên z = lớp·h khớp facet. Chỉ nếp đang chuyển động mới uốn theo cung trụ bán kính r.
import type { FoldEntry } from '../model';
import { type Facet, applyFold, bottomLayer, topLayer } from '../engine/fold';

/** Lớp trên/dưới cùng của xấp ngay TRƯỚC mỗi mục nếp (cần cho z' = 2T − z). */
export interface LayerSpan { top: number; bottom: number }

export function layerSpans(base: Facet[], entries: readonly FoldEntry[]): LayerSpan[] {
  const spans: LayerSpan[] = [];
  let fs = base;
  for (const e of entries) {
    spans.push({ top: fs.length ? topLayer(fs) : 0, bottom: fs.length ? bottomLayer(fs) : 0 });
    fs = applyFold(fs, e);
  }
  return spans;
}

export interface Grid { n: number; x0: number; y0: number; w: number; h: number; paper: Float32Array; index: Uint32Array; uv: Float32Array }

/** Lưới (n+1)² đỉnh phủ khung bao tờ giấy gốc, toạ độ giấy (cm). */
export function makeGrid(n: number, x0: number, y0: number, w: number, h: number): Grid {
  const m = n + 1, paper = new Float32Array(m * m * 2), uv = new Float32Array(m * m * 2), index = new Uint32Array(n * n * 6);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
    const k = j * m + i;
    paper[2 * k] = x0 + (i / n) * w; paper[2 * k + 1] = y0 + (j / n) * h;
    uv[2 * k] = i / n; uv[2 * k + 1] = j / n;
  }
  let t = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * m + i, b = a + 1, c = a + m, d = c + 1;
    index.set([a, b, d, a, d, c], t); t += 6;
  }
  return { n, x0, y0, w, h, paper, index, uv };
}

/** Nếp đang chuyển động: θ ∈ [0, π] (π = đã lật hẳn), r = bán kính uốn (cm). */
export interface Motion { entry: FoldEntry; theta: number; r: number; span: LayerSpan }

/**
 * Ghi vị trí 3D (x, cao, −y) cho mọi đỉnh. `thick` = độ dày hiển thị một lớp (cm).
 * Trả số đo chi phí (ms) để báo cáo spike.
 */
export function deform(g: Grid, entries: readonly FoldEntry[], spans: readonly LayerSpan[], motion: Motion | null, thick: number, out: Float32Array): number {
  const t0 = performance.now();
  const count = g.paper.length / 2;
  let minZ = Infinity;
  for (let k = 0; k < count; k++) {
    let x = g.paper[2 * k], y = g.paper[2 * k + 1], L = 0;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i], sp = spans[i];
      const s = (x - e.p.x) * e.n.x + (y - e.p.y) * e.n.y;
      if (e.kind === 'flip') { x -= 2 * s * e.n.x; y -= 2 * s * e.n.y; L = sp.top + sp.bottom - L; continue; }
      if (s > 0) { x -= 2 * s * e.n.x; y -= 2 * s * e.n.y; L = e.valley ? 2 * sp.top + 1 - L : 2 * sp.bottom - 1 - L; }
    }
    let z = L * thick;
    if (motion) {
      const e = motion.entry, sp = motion.span;
      const u = (x - e.p.x) * e.n.x + (y - e.p.y) * e.n.y;
      const th = motion.theta, k2 = (th / Math.PI) ** 2;
      if (e.kind === 'flip') {
        // Lật xấp: quay cứng quanh trục, rồi trượt về lớp đảo ngược.
        const end = (sp.top + sp.bottom - L) * thick;
        z += u * Math.sin(th) + (end - z) * k2;
        x += (u * Math.cos(th) - u) * e.n.x; y += (u * Math.cos(th) - u) * e.n.y;
      } else if (u > 0) {
        const r = Math.max(motion.r, 1e-4), arc = r * th;
        let u2: number, w2: number;
        if (u <= arc) { const f = u / r; u2 = r * Math.sin(f); w2 = r * (1 - Math.cos(f)); }
        else { const rest = u - arc; u2 = r * Math.sin(th) + rest * Math.cos(th); w2 = r * (1 - Math.cos(th)) + rest * Math.sin(th); }
        const up = e.valley ? 1 : -1, end = (e.valley ? 2 * sp.top + 1 - L : 2 * sp.bottom - 1 - L) * thick;
        // Khi θ → π, đỉnh ngoài vùng uốn (w2 = 2r) trượt dần về đúng lớp mới để khớp engine.
        z = z + up * w2 + (end - (z + up * 2 * r)) * k2;
        x += (u2 - u) * e.n.x; y += (u2 - u) * e.n.y;
      }
    }
    out[3 * k] = x; out[3 * k + 1] = z; out[3 * k + 2] = -y;
    if (z < minZ) minZ = z;
  }
  // Nâng cả xấp để không chui xuống mặt bàn (gấp lồi đưa vạt xuống dưới).
  const lift = thick * 0.5 - minZ;
  for (let k = 0; k < count; k++) out[3 * k + 1] += lift;
  return performance.now() - t0;
}
