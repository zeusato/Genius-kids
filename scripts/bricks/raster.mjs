// Bộ vẽ phần mềm (z-buffer, Gouraud) cho bảng duyệt mảnh — chạy trên Node, đọc đúng catalog.json + .bin đã xuất.
import fs from 'node:fs';
import path from 'node:path';
import { octDecode } from './mesh.mjs';

/** Đọc lưới đã đóng gói từ file nhị phân. */
export function readMesh(buf, ref, posScale) {
  const view = (T, [off, len]) => new T(buf.buffer, buf.byteOffset + off, len);
  const pos = view(Int16Array, ref.pos), nrm = view(Int8Array, ref.nrm), idx = view(ref.i32 ? Uint32Array : Uint16Array, ref.idx);
  const P = new Float32Array(pos.length), N = new Float32Array(ref.vc * 3);
  for (let i = 0; i < pos.length; i++) P[i] = pos[i] / posScale;
  for (let i = 0; i < ref.vc; i++) { const n = octDecode(nrm[i * 2], nrm[i * 2 + 1]); N.set(n, i * 3); }
  return { P, N, idx, groups: ref.groups };
}

export function loadCatalog(dir = 'public/bricks') {
  const catalog = JSON.parse(fs.readFileSync(path.join(dir, 'catalog.json'), 'utf8'));
  const bins = new Map();
  const bin = file => { if (!bins.has(file)) bins.set(file, fs.readFileSync(path.join(dir, file))); return bins.get(file); };
  const groupBin = Object.fromEntries(catalog.groups.map(g => [g.id, g.bin]));
  return {
    catalog,
    mesh: key => readMesh(bin(groupBin[catalog.parts[key].group]), catalog.parts[key].mesh, catalog.posScale),
    stud: k => readMesh(bin(catalog.studBin), catalog.studs[k].mesh, catalog.posScale),
  };
}

const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/**
 * Vẽ một mảnh. view: {yaw, pitch} độ. Trả về RGBA Uint8Array kích thước size×size (đã khử răng cưa 2×).
 * overlay: vẽ điểm nối và hộp va chạm.
 */
export function renderPart(lib, key, { size = 200, yaw = 35, pitch = 28, mainHex = '#C91A09', overlay = true, bg = [255, 255, 255] } = {}) {
  const S = size * 2, part = lib.catalog.parts[key], m = lib.mesh(key);
  const cy = Math.cos(yaw * Math.PI / 180), sy = Math.sin(yaw * Math.PI / 180), cp = Math.cos(pitch * Math.PI / 180), sp = Math.sin(pitch * Math.PI / 180);
  // LDraw (Y xuống) → không gian nhìn: x phải, y lên, z về phía người xem
  const tf = (x, y, z) => { const X = x, Y = -y, Z = -z; const x1 = cy * X + sy * Z, z1 = -sy * X + cy * Z; return [x1, cp * Y - sp * z1, sp * Y + cp * z1]; };
  const rot = (x, y, z) => tf(x, y, z);
  const [mn, mx] = part.bbox;
  const corners = [];
  for (const x of [mn[0], mx[0]]) for (const y of [mn[1] - 4, mx[1]]) for (const z of [mn[2], mx[2]]) corners.push(tf(x, y, z));
  const lo = [Math.min(...corners.map(c => c[0])), Math.min(...corners.map(c => c[1]))], hi = [Math.max(...corners.map(c => c[0])), Math.max(...corners.map(c => c[1]))];
  const scale = (S * 0.84) / Math.max(hi[0] - lo[0], hi[1] - lo[1], 1);
  const cx = (lo[0] + hi[0]) / 2, cyy = (lo[1] + hi[1]) / 2;
  const proj = v => [S / 2 + (v[0] - cx) * scale, S / 2 - (v[1] - cyy) * scale, v[2]];
  const color = new Uint8ClampedArray(S * S * 3), depth = new Float32Array(S * S).fill(-Infinity);
  for (let i = 0; i < S * S; i++) color.set(bg, i * 3);
  const L = (() => { const l = [-0.45, 0.75, 0.5], n = Math.hypot(...l); return l.map(v => v / n); })();
  const shade = (rgb, n, alpha = 1) => { const d = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]); const k = 0.38 + 0.62 * d; const spec = Math.pow(Math.max(0, n[2] * 0.6 + d * 0.4), 24) * 70; return rgb.map(c => Math.min(255, c * k + spec)).concat(alpha); };
  const fixed = lib.catalog.fixedColors;
  const drawMesh = (mesh, M, colorOf) => {
    const vp = [], vc = [];
    for (let i = 0; i < mesh.P.length / 3; i++) {
      let x = mesh.P[i * 3], y = mesh.P[i * 3 + 1], z = mesh.P[i * 3 + 2], nx = mesh.N[i * 3], ny = mesh.N[i * 3 + 1], nz = mesh.N[i * 3 + 2];
      if (M) { const [a, b, c, d, e, f, g, h, k] = M.slice(3); [x, y, z] = [a * x + b * y + c * z + M[0], d * x + e * y + f * z + M[1], g * x + h * y + k * z + M[2]]; [nx, ny, nz] = [a * nx + b * ny + c * nz, d * nx + e * ny + f * nz, g * nx + h * ny + k * nz]; }
      vp.push(proj(tf(x, y, z))); vc.push(rot(nx, ny, nz));
    }
    for (const g of mesh.groups) {
      const [rgb, alpha] = colorOf(g.color);
      for (let t = g.start; t < g.start + g.count; t += 3) {
        const ia = mesh.idx[t], ib = mesh.idx[t + 1], ic = mesh.idx[t + 2];
        tri(vp[ia], vp[ib], vp[ic], shade(rgb, vc[ia], alpha), shade(rgb, vc[ib], alpha), shade(rgb, vc[ic], alpha));
      }
    }
  };
  const tri = (a, b, c, ca, cb, cc) => {
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (area >= 0) return; // khuất mặt sau (màn hình y xuống → CCW thành âm)
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(S - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(S - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area, w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area, w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const z = w0 * a[2] + w1 * b[2] + w2 * c[2], i = y * S + x;
      if (z <= depth[i]) continue;
      const al = ca[3];
      if (al >= 1) depth[i] = z;
      for (let k = 0; k < 3; k++) { const v = w0 * ca[k] + w1 * cb[k] + w2 * cc[k]; color[i * 3 + k] = al >= 1 ? v : color[i * 3 + k] * (1 - al) + v * al; }
    }
  };
  const main = hexRgb(mainHex);
  const colorOf = c => c === 16 ? [main, 1] : fixed[c] ? [hexRgb(fixed[c].hex), fixed[c].alpha < 255 ? 0.55 : 1] : [[128, 128, 128], 1];
  drawMesh(m, null, colorOf);
  const studMesh = { s: lib.stud('s'), h: lib.stud('h') };
  for (const s of part.studs) drawMesh(studMesh[s.k], s.m, c => colorOf(c === 16 ? s.c : c));
  if (overlay) {
    const dot = (p, rgb, r = 4) => { const [x, y] = proj(tf(...p)); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round(x + dx), Y = Math.round(y + dy); if (X >= 0 && Y >= 0 && X < S && Y < S && dx * dx + dy * dy <= r * r) color.set(rgb, (Y * S + X) * 3); } };
    const line = (p, q, rgb) => { const [ax, ay] = proj(tf(...p)), [bx, by] = proj(tf(...q)); const n = Math.ceil(Math.hypot(bx - ax, by - ay)); for (let i = 0; i <= n; i++) { const X = Math.round(ax + (bx - ax) * i / n), Y = Math.round(ay + (by - ay) * i / n); if (X >= 0 && Y >= 0 && X < S && Y < S) color.set(rgb, (Y * S + X) * 3); } };
    for (const b of part.boxes) {
      const v = (i, j, k) => [i ? b[3] : b[0], j ? b[4] : b[1], k ? b[5] : b[2]];
      for (const [p, q] of [[[0,0,0],[1,0,0]],[[0,1,0],[1,1,0]],[[0,0,1],[1,0,1]],[[0,1,1],[1,1,1]],[[0,0,0],[0,1,0]],[[1,0,0],[1,1,0]],[[0,0,1],[0,1,1]],[[1,0,1],[1,1,1]],[[0,0,0],[0,0,1]],[[1,0,0],[1,0,1]],[[0,1,0],[0,1,1]],[[1,1,0],[1,1,1]]]) line(v(...p), v(...q), [60, 120, 255]);
    }
    const C = { s: [20, 170, 60], a: [255, 140, 0], p: [150, 60, 200], h: [0, 190, 210] };
    for (const c of part.conns) dot(c.p, C[c.k], c.k === 's' || c.k === 'p' ? 5 : 3);
  }
  return { data: Buffer.from(color), width: S, height: S, channels: 3 };
}
