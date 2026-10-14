// Mảnh dạng bộ (mục 4.4 / D5): một mảnh trong app = nhiều mảnh thật đã ghép sẵn.
// Vị trí mảnh phụ tính bằng khớp snap (GEN cùng group / FGR cùng group) có cùng hướng: dịch = posA − posB.

/** Định nghĩa bộ v1. `color`: 'self' = theo màu bé chọn, số = mã màu LDraw cố định (47 kính trong, 0 đen). */
export const KITS = [
  { key: 'kit-window-1x2x2', group: 'window', nameVi: 'Cửa sổ 1×2×2 có kính', base: '60592.dat', baseVi: 'Khung cửa sổ 1×2×2', parts: [{ ldraw: '60601.dat', nameVi: 'Kính cửa sổ 1×2×2', color: 47, match: { type: 'gen', group: 'win-1-2-2' } }] },
  { key: 'kit-window-1x4x3', group: 'window', nameVi: 'Cửa sổ 1×4×3 có kính', base: '60594.dat', baseVi: 'Khung cửa sổ 1×4×3', parts: [{ ldraw: '60603.dat', nameVi: 'Kính cửa sổ 1×4×3', color: 47, match: { type: 'fgr', index: 0 } }] },
  { key: 'kit-door-1x4x6', group: 'window', nameVi: 'Cửa ra vào 1×4×6', base: '60596.dat', baseVi: 'Khung cửa ra vào 1×4×6', parts: [{ ldraw: '60616b.dat', nameVi: 'Cánh cửa 1×4×6', color: 'self', match: { type: 'fgr', group: 'door', index: 0 } }] },
  { key: 'kit-wheel-small', group: 'vehicle', nameVi: 'Bánh xe nhỏ có lốp', base: '4624.dat', baseVi: 'Vành bánh xe nhỏ', parts: [{ ldraw: '3641.dat', nameVi: 'Lốp xe nhỏ', color: 0, match: { type: 'gen', group: 'rim8_6' } }] },
];

const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);

/** Tìm phép dịch đặt mảnh phụ vào mảnh gốc. Trả về ma trận LDraw [x y z 1 0 0 0 1 0 0 0 1]. */
export function solveKitPart(baseSnaps, subSnaps, match) {
  const fit = s => s.type === match.type && (!match.group || (s.group || '') === match.group);
  const A = baseSnaps.filter(fit), B = subSnaps.filter(fit);
  const pairs = [];
  for (const a of A) for (const b of B) if (same(a.ori, b.ori) && (a.type !== 'gen' || a.gender !== b.gender)) pairs.push([a, b]);
  const pick = pairs[match.index ?? 0];
  if (!pick) throw Error(`Không khớp được snap bộ ${JSON.stringify(match)}`);
  const [a, b] = pick;
  return [a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2], 1, 0, 0, 0, 1, 0, 0, 0, 1];
}

/**
 * Làm phẳng một bộ thành một "mảnh" duy nhất: hình học gộp (màu phụ cố định giữ mã màu riêng),
 * điểm nối chỉ lấy của mảnh gốc (mảnh phụ không nhận thêm mảnh khác ở v1), BOM liệt kê từng mảnh thật.
 */
export function flattenKit(lib, kit, lite = false) {
  const base = lib.flatten(kit.base, lite);
  const out = { tris: [...base.tris], edges: [...base.edges], studs: [...base.studs], snaps: [...base.snaps], bom: [{ ldraw: kit.base, nameVi: kit.baseVi, color: 'self', qty: 1, m: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] }] };
  for (const sp of kit.parts) {
    const sub = lib.flatten(sp.ldraw, lite);
    const m = solveKitPart(lib.flatten(kit.base).snaps, lib.flatten(sp.ldraw).snaps, sp.match);
    const col = c => (c === 16 || c === 24) ? (sp.color === 'self' ? 16 : sp.color) : c;
    for (const t of sub.tris) out.tris.push({ ...t, p: t.p.map((v, i) => v + m[i % 3]), c: col(t.c) });
    for (const e of sub.edges) out.edges.push(e.map((v, i) => v + m[i % 3]));
    for (const s of sub.studs) out.studs.push({ ...s, m: [s.m[0] + m[0], s.m[1] + m[1], s.m[2] + m[2], ...s.m.slice(3)], c: col(s.c) });
    out.bom.push({ ldraw: sp.ldraw, nameVi: sp.nameVi, color: sp.color, qty: 1, m });
  }
  return out;
}
