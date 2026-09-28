// NGUYÊN MẪU THAM CHIẾU (không nằm trong build) — thuật toán bố cục "quạt thời gian" đã kiểm bằng dữ liệu thật.
// engine/timeScale.ts + engine/layout.ts phải cho cùng kết quả (cùng KNOTS, WEIGHT, GAP, nội suy chuỗi).
// Chạy: node docs/evolution-tree-wow/prototype-layout.mjs docs/evolution-tree-wow/target-tree.txt docs/evolution-tree-wow/times.json out.svg [linear]
// Phác thảo bố cục cây ĐÍCH (sau tái cấu trúc) với số liệu thời gian thật + nội suy chuỗi
import { readFileSync, writeFileSync } from 'node:fs';
const [treePath, timesPath, outSvg, mode] = process.argv.slice(2);
const lines = readFileSync(treePath, 'utf8').split(/\r?\n/).filter(l => l.trim());
const nodes = new Map(); const stack = []; const order = [];
for (const l of lines) {
  const depth = (l.length - l.trimStart().length) / 2;
  const parts = l.trim().split(/\s+/);
  const n = { id: parts[0], depth, extinct: parts.includes('X'), parent: null, kids: [] };
  while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
  if (stack.length) { n.parent = stack[stack.length - 1]; n.parent.kids.push(n); }
  nodes.set(n.id, n); stack.push(n); order.push(n);
}
const T = JSON.parse(readFileSync(timesPath, 'utf8'));
const LINEAR = mode === 'linear';
const KNOTS = [[4540, 0], [4000, 0.07], [2500, 0.2], [538.8, 0.42], [251.9, 0.66], [66, 0.84], [23, 0.93], [0, 1]];
const frac = (t) => { if (LINEAR) return 1 - t / 4540; for (let i = 1; i < KNOTS.length; i++) { const [t0, f0] = KNOTS[i - 1], [t1, f1] = KNOTS[i]; if (t >= t1) return f0 + (f1 - f0) * (t0 - t) / (t0 - t1); } return 1; };
const invFrac = (f) => { for (let i = 1; i < KNOTS.length; i++) { const [t0, f0] = KNOTS[i - 1], [t1, f1] = KNOTS[i]; if (f <= f1) return t0 + (t1 - t0) * (f - f0) / (f1 - f0); } return 0; };
// thời gian: split có số; lá = 0 hoặc endMa; chuỗi 1 con: chia đều theo bán kính (thang đại) giữa tổ tiên có số và mốc kế tiếp
const root = order[0];
root.t = 4540;
const endOf = (n) => n.kids.length === 0 ? (T.extinct[n.id]?.endMa ?? 0) : T.splits[n.id]?.ma;
const assign = (n) => {
  if (n !== root && n.t === undefined) {
    if (T.splits[n.id]) n.t = T.splits[n.id].ma;
    else if (n.kids.length === 0) n.t = endOf(n);
    else {
      // chuỗi: gom các node 1-con liên tiếp chưa có số
      const chain = []; let c = n;
      while (c.kids.length === 1 && !T.splits[c.id]) { chain.push(c); c = c.kids[0]; }
      const tEnd = c.kids.length === 0 ? endOf(c) : T.splits[c.id].ma;
      const fA = frac(n.parent.t), fB = frac(tEnd);
      chain.forEach((x, k) => { x.t = invFrac(fA + (fB - fA) * (k + 1) / (chain.length + 1)); x.approx = true; });
    }
  }
  n.kids.forEach(assign);
};
assign(root);
// sector
const SECTOR_ROOT = { bacteria: 'bacteria', archaea: 'archaea', amoebozoa: 'protist', sar: 'protist', flagellates: 'protist', archaeplastida: 'plant', fungi_simple: 'fungi', animalia: 'animal' };
const TRUNK = new Set(['life_origin', 'luca', 'eukarya', 'amorphea', 'opisthokonta']);
const COLORS = { bacteria: '#38bdf8', archaea: '#cbd5e1', protist: '#c084fc', plant: '#4ade80', fungi: '#fbbf24', animal: '#fb7185', trunk: '#e0f2fe' };
const WEIGHT = { bacteria: 1.6, archaea: 1.8, protist: 1.8, fungi: 1.5, plant: 1.5, animal: 1.0 };
const sectorOf = (n) => { let c = n; while (c) { if (SECTOR_ROOT[c.id]) return SECTOR_ROOT[c.id]; c = c.parent; } return 'trunk'; };
for (const n of order) n.sector = TRUNK.has(n.id) ? 'trunk' : sectorOf(n);
// góc
const leaves = order.filter(n => n.kids.length === 0);
const GAP = 0.6 * Math.PI / 180;
let total = 0, prev = null;
for (const l of leaves) { if (prev && prev.sector !== l.sector) total += GAP / 1; total += WEIGHT[l.sector] ?? 1; prev = l; }
// quy đổi: tổng trọng số + gap -> dải góc
const SPAN = Math.PI + 2 * 0.035;
const gapsCount = leaves.reduce((acc, l, i) => acc + (i && leaves[i - 1].sector !== l.sector ? 1 : 0), 0);
const weightSum = leaves.reduce((a, l) => a + (WEIGHT[l.sector] ?? 1), 0);
const unit = (SPAN - gapsCount * GAP) / weightSum;
let a = Math.PI + 0.035; prev = null;
for (const l of leaves) { if (prev && prev.sector !== l.sector) a -= GAP; const w = (WEIGHT[l.sector] ?? 1) * unit; l.ang = a - w / 2; l.w = w; a -= w; prev = l; }
const setAng = (n) => { if (!n.kids.length) { n.leaves = 1; return; } n.kids.forEach(setAng); n.leaves = n.kids.reduce((s, k) => s + k.leaves, 0); const angs = n.kids.map(k => k.ang); n.ang = (Math.min(...angs) + Math.max(...angs)) / 2; };
setAng(root);
const R = 1000, W = 1600, H = 1000, SC = 0.76, CX = 800, CY = 965;
const P = (ang, r) => [CX + SC * r * Math.cos(ang), CY - SC * r * Math.sin(ang)];
const smooth = (x) => x * x * (3 - 2 * x);
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<radialGradient id="bg" cx="50%" cy="96%" r="80%"><stop offset="0" stop-color="#15324a"/><stop offset="0.55" stop-color="#0a1428"/><stop offset="1" stop-color="#04070f"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft"><feGaussianBlur stdDeviation="9"/></filter></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>`;
const ERAS = [[4540, 4000, 'Hỏa Thành', '#5a1e14'], [4000, 2500, 'Thái Cổ', '#113a44'], [2500, 538.8, 'Nguyên Sinh', '#1a2c52'], [538.8, 251.9, 'Cổ Sinh', '#15413a'], [251.9, 66, 'Trung Sinh', '#3f3a17'], [66, 0, 'Tân Sinh', '#44301f']];
const A0 = Math.PI + 0.035, A1 = -0.035;
for (const [t0, t1, name, col] of ERAS) {
  const r0 = R * frac(t0) * SC, r1 = R * frac(t1) * SC;
  const [x0, y0] = [CX + r1 * Math.cos(A0), CY - r1 * Math.sin(A0)], [x1, y1] = [CX + r1 * Math.cos(A1), CY - r1 * Math.sin(A1)];
  const [x2, y2] = [CX + r0 * Math.cos(A1), CY - r0 * Math.sin(A1)], [x3, y3] = [CX + r0 * Math.cos(A0), CY - r0 * Math.sin(A0)];
  svg += `<path d="M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3} Z" fill="${col}" opacity="0.5"/>`;
  svg += `<circle cx="${CX}" cy="${CY}" r="${r1}" fill="none" stroke="#fff" stroke-opacity="0.1" stroke-dasharray="3 6"/>`;
  const lr = (r0 + r1) / 2; svg += `<text x="${CX - lr - 6}" y="${CY - 6}" fill="#fff" fill-opacity="0.5" font-family="Segoe UI, Arial" font-size="12" text-anchor="middle">${name}</text>`;
}
svg += `<circle cx="${CX}" cy="${CY}" r="${R * frac(66) * SC}" fill="none" stroke="#f87171" stroke-opacity="0.5" stroke-width="1.5"/>`;
const branch = (n) => {
  const p = n.parent; if (!p) return;
  const rp = R * frac(p.t), rc = R * frac(n.t);
  const pts = [];
  for (let i = 0; i <= 28; i++) { const s = i / 28; const an = p.ang + (n.ang - p.ang) * smooth(Math.min(1, s / 0.45)); const [x, y] = P(an, rp + (rc - rp) * s); pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`); }
  const w = (1.2 + 2.2 * Math.sqrt(n.leaves)) * SC * 0.55;
  const ext = n.extinct; const col = ext ? '#9aa3ad' : COLORS[n.sector];
  svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" opacity="${ext ? 0.8 : 0.9}" ${ext ? 'stroke-dasharray="5 3"' : 'filter="url(#glow)"'}/>`;
  if (!n.kids.length) { const [x, y] = P(n.ang, rc); svg += ext ? `<circle cx="${x}" cy="${y}" r="3.6" fill="#1f2937" stroke="#cbd5e1" stroke-width="1.3"/>` : `<circle cx="${x}" cy="${y}" r="${n.id === 'humans' ? 7 : 4}" fill="${n.id === 'humans' ? '#fde68a' : COLORS[n.sector]}" stroke="#fff" stroke-opacity="0.85" stroke-width="1" filter="url(#glow)"/>`; }
};
order.forEach(branch);
svg += `<ellipse cx="${CX}" cy="${CY + 16}" rx="110" ry="30" fill="#38bdf8" opacity="0.35" filter="url(#soft)"/><circle cx="${CX}" cy="${CY}" r="8" fill="#e0f2fe" filter="url(#glow)"/>`;
const LABEL = { bacteria: 'Vi khuẩn', archaea: 'Cổ khuẩn', eukarya: 'Nhân thực', fungi_simple: 'Nấm', animalia: 'Động vật', plantae_simple: 'Thực vật', sar: 'Tảo nâu, tảo cát…', amoebozoa: 'Amip', vertebrates: 'Có xương sống', tetrapods: 'Bốn chân', mammals: 'Thú', dinosaurs: 'Khủng long', birds: 'Chim', arthropoda: 'Chân khớp', mollusca: 'Thân mềm', angiosperms: 'Cây có hoa', hominini: 'Người &amp; tinh tinh' };
for (const [id, txt] of Object.entries(LABEL)) { const n = nodes.get(id); const [x, y] = P(n.ang, R * frac(n.t)); svg += `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/><text x="${x + 6}" y="${y - 6}" fill="#fff" font-family="Segoe UI, Arial" font-size="13" font-weight="600" paint-order="stroke" stroke="#04070f" stroke-width="4">${txt}</text>`; }
const hu = nodes.get('humans'); const [hx, hy] = P(hu.ang, R); svg += `<text x="${hx}" y="${hy - 12}" fill="#fde68a" font-family="Segoe UI, Arial" font-size="13" font-weight="700" text-anchor="middle" paint-order="stroke" stroke="#04070f" stroke-width="4">Bạn ở đây</text>`;
svg += LINEAR ? `<text x="30" y="60" fill="#fff" font-family="Segoe UI, Arial" font-size="40" font-weight="700">Thời gian thật (tuyến tính)</text>` : `<text x="30" y="44" fill="#fff" font-family="Segoe UI, Arial" font-size="24" font-weight="700">Phác thảo 2: cây sau khi sửa (251 nhánh), thời gian thật, thang "mỗi đại một vòng"</text><text x="30" y="70" fill="#fff" fill-opacity="0.6" font-family="Segoe UI, Arial" font-size="14">Cành xám nét đứt = tuyệt chủng · vòng đỏ = 66 triệu năm · ngọn vàng = Người ("Bạn ở đây") · màu theo giới</text>`;
svg += '</svg>';
writeFileSync(outSvg, svg);
const bySector = {}; for (const l of leaves) bySector[l.sector] = (bySector[l.sector] || 0) + l.w; for (const k in bySector) bySector[k] = +(bySector[k] / SPAN * 100).toFixed(1);
console.log({ leaves: leaves.length, anglePctBySector: bySector, minLeafSpacingAtRim: +(Math.min(...leaves.map(l => l.w)) * R).toFixed(1), maxLeafSpacing: +(Math.max(...leaves.map(l => l.w)) * R).toFixed(1) });
