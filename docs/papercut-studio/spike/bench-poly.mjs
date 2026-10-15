// So clipper2-ts và polygon-clipping trên tải giống Xưởng Cắt Giấy:
// tờ vuông 15 cm, trừ dần N "vùng cắt" = nét cong nong 0,3 mm + đa giác kín, mỗi vùng lặp qua 8 phép dời hình (đối xứng D4).
import * as C from 'clipper2-ts';
import pc from 'polygon-clipping';
let seed = 1; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const U = 1000; // 1 cm = 1000 đơn vị (0,01 mm)
const L = 15;
const areaPaths = ps => ps.reduce((a, p) => { let s = 0; for (let i = 0, n = p.length; i < n; i++) { const q = p[i], r = p[(i + 1) % n]; s += q.x * r.y - r.x * q.y; } return a + s / 2; }, 0);
const areaMP = mp => mp.reduce((a, poly) => a + poly.reduce((b, ring, k) => { let s = 0; for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]; return b + Math.abs(s / 2) * (k ? -1 : 1); }, 0), 0);
const D4 = [];
for (let k = 0; k < 4; k++) for (const m of [1, -1]) { const a = k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a); D4.push(([x, y]) => { const X = x - L / 2, Y = (y - L / 2) * m; return [c * X - s * Y + L / 2, s * X + c * Y + L / 2]; }); }
function stroke() { const pts = []; let x = rnd() * L, y = rnd() * L, a = rnd() * 6.28; for (let i = 0; i < 120; i++) { a += (rnd() - .5) * .5; x += Math.cos(a) * .08; y += Math.sin(a) * .08; pts.push([x, y]); } return pts; }
function blob() { const cx = rnd() * L, cy = rnd() * L, r = .3 + rnd() * 1.2, pts = []; for (let i = 0; i < 48; i++) { const t = i / 48 * 6.283, rr = r * (1 + .3 * Math.sin(5 * t + rnd())); pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]); } return pts; }
const N = 60;
const ops = []; for (let i = 0; i < N; i++) ops.push(rnd() < .5 ? { k: 'stroke', p: stroke() } : { k: 'blob', p: blob() });
// ---- clipper2-ts ----
{
  let t0 = performance.now(); let sheet = [[{ x: 0, y: 0 }, { x: L * U, y: 0 }, { x: L * U, y: L * U }, { x: 0, y: L * U }]];
  let removedArea = 0, bad = 0, worst = 0;
  for (const op of ops) {
    let cut = [];
    for (const T of D4) {
      const path = op.p.map(T).map(([x, y]) => ({ x: Math.round(x * U), y: Math.round(y * U) }));
      if (op.k === 'stroke') cut.push(...C.inflatePaths([path], 0.015 * U, C.JoinType.Round, C.EndType.Round));
      else cut.push(areaPaths([path]) < 0 ? path.reverse() : path);
    }
    cut = C.union(cut, C.FillRule.NonZero);
    const before = areaPaths(sheet);
    const inter = C.intersect(sheet, cut, C.FillRule.NonZero);
    sheet = C.difference(sheet, cut, C.FillRule.NonZero);
    const err = Math.abs(before - areaPaths(sheet) - areaPaths(inter)) / (U * U);
    worst = Math.max(worst, err); if (err > 1e-4) bad++;
  }
  const t = performance.now() - t0, verts = sheet.reduce((a, p) => a + p.length, 0);
  console.log(`clipper2-ts: ${t.toFixed(0)} ms cho ${N} nhát (x8 đối xứng), ${(t / N).toFixed(1)} ms/nhát; còn ${(areaPaths(sheet) / U / U).toFixed(2)} cm², ${sheet.length} vòng, ${verts} đỉnh; lệch diện tích lớn nhất ${worst.toExponential(2)} cm², lỗi ${bad}`);
}
// ---- polygon-clipping (không có nong polyline: dùng dải tứ giác ghép từ từng đoạn) ----
{
  const ribbon = (p, w) => { const quads = []; for (let i = 0; i < p.length - 1; i++) { const [x0, y0] = p[i], [x1, y1] = p[i + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * w, ny = dx / l * w; quads.push([[[x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx, y1 + ny], [x0 + nx, y0 + ny], [x0 - nx, y0 - ny]]]); } return quads; };
  let t0 = performance.now(); let sheet = [[[[0, 0], [L, 0], [L, L], [0, L], [0, 0]]]]; let bad = 0, worst = 0, threw = 0;
  for (const op of ops) {
    try {
      let polys = [];
      for (const T of D4) { const pts = op.p.map(T); if (op.k === 'stroke') polys.push(...ribbon(pts, 0.015)); else polys.push([[...pts, pts[0]]]); }
      const cut = pc.union(...polys);
      const before = areaMP(sheet), inter = pc.intersection(sheet, cut); sheet = pc.difference(sheet, cut);
      const err = Math.abs(before - areaMP(sheet) - areaMP(inter)); worst = Math.max(worst, err); if (err > 1e-4) bad++;
    } catch (e) { threw++; }
  }
  const t = performance.now() - t0, verts = sheet.reduce((a, poly) => a + poly.reduce((b, r) => b + r.length, 0), 0);
  console.log(`polygon-clipping: ${t.toFixed(0)} ms, ${(t / N).toFixed(1)} ms/nhát; còn ${areaMP(sheet).toFixed(2)} cm², ${verts} đỉnh; lệch lớn nhất ${worst.toExponential(2)}, lỗi ${bad}, ném lỗi ${threw}`);
}
