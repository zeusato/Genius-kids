// File cho người lớn (plan mục 11.3): LDraw .ldr (có 0 STEP), BrickLink XML, Rebrickable CSV.
import { ORIENTS } from '../engine/orient';
import type { Catalog, V3 } from '../engine/types';
import type { World } from '../engine/world';
import type { BomRow } from './bom';
import type { Step } from './steps';

const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : Math.round(v * 1000) / 1000);

/** Các dòng `1` của một mảnh: bộ ghép bung thành từng mảnh thật với ma trận con. */
function pieceLines(cat: Catalog, p: { part: string; color: string; pos: V3; o: number }): string[] {
  const src = cat.parts[p.part], R = ORIENTS[p.o], code = cat.palette.find(c => c.key === p.color)?.ldraw ?? 16;
  return src.bom.map(b => {
    const m = b.m ?? [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
    // vị trí con: R·t_con + pos ; hướng con: R·M_con
    const t = [0, 1, 2].map(r => R[r * 3] * m[0] + R[r * 3 + 1] * m[1] + R[r * 3 + 2] * m[2] + p.pos[r]);
    const M = m.slice(3), RM: number[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) RM.push(R[r * 3] * M[c] + R[r * 3 + 1] * M[3 + c] + R[r * 3 + 2] * M[6 + c]);
    return ['1', b.color === 'self' ? code : b.color, ...t.map(n), ...RM.map(n), b.ldraw + '.dat'].join(' ');
  });
}

/** LDraw: toạ độ engine chính là toạ độ LDraw → ghi thẳng. */
export function toLdraw(world: World, name: string, steps?: Step[]): string {
  const lines = [`0 ${name}`, `0 Name: ${name.replace(/[^\w\- ]+/g, '_') || 'model'}.ldr`, '0 Author: Xưởng Lắp Ghép — Genius Kids', '0 !LDRAW_ORG Unofficial_Model', ''];
  const line = (id: number) => lines.push(...pieceLines(world.catalog, world.pieces.get(id)!));
  if (steps?.length) steps.forEach((s, i) => { for (const id of s.pieces) line(id); if (i < steps.length - 1) lines.push('0 STEP'); });
  else for (const id of world.pieces.keys()) line(id);
  return lines.join('\r\n') + '\r\n';
}

export interface LdrawReadResult { added: number; unknown: string[]; rejected: number }

/**
 * Đọc lại `.ldr` do `toLdraw` ghi (plan mục 14 GĐ0b: round-trip; mục 19: giao diện nhập file để sau).
 * Mỗi dòng `1` ứng với mảnh có `bom[0]` trùng tên file; bộ ghép đọc thêm các dòng con liền sau và phải khớp đúng.
 * Mảnh lạ, hướng không vuông góc, hoặc dòng con lệch → báo `unknown`, không đoán. Va chạm/ra ngoài vùng xây → `rejected`.
 */
export function fromLdraw(world: World, text: string): LdrawReadResult {
  const cat = world.catalog, byCode = new Map(cat.palette.map(c => [c.ldraw, c.key]));
  const byFile = new Map(Object.entries(cat.parts).map(([key, p]) => [p.bom[0].ldraw.toLowerCase(), key]));
  const lines = text.split(/\r?\n/).map(l => l.trim().split(/\s+/)).filter(f => f[0] === '1' && f.length >= 15)
    .map(f => ({ color: Number(f[1]), v: f.slice(2, 14).map(Number), file: f.slice(14).join(' ').replace(/\.dat$/i, '').toLowerCase() }));
  const near = (a: number[], b: number[]) => a.every((x, i) => Math.abs(x - b[i]) < 1e-3);
  const result: LdrawReadResult = { added: 0, unknown: [], rejected: 0 };
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i], key = byFile.get(L.file);
    const bom = key ? cat.parts[key].bom : [];
    // R = RM · M0ᵀ ; pos = t − R·t0  (M0, t0: ma trận của mảnh con đầu trong bộ)
    const m0 = bom[0]?.m ?? [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], M0 = m0.slice(3), RM = L.v.slice(3);
    const R: number[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R.push(RM[r * 3] * M0[c * 3] + RM[r * 3 + 1] * M0[c * 3 + 1] + RM[r * 3 + 2] * M0[c * 3 + 2]);
    const o = key ? ORIENTS.findIndex(m => near(m, R)) : -1;
    const color = byCode.get(L.color);
    if (!key || o < 0 || !color) { result.unknown.push(L.file); continue; }
    const pos = [0, 1, 2].map(r => Math.round((L.v[r] - (R[r * 3] * m0[0] + R[r * 3 + 1] * m0[1] + R[r * 3 + 2] * m0[2])) * 1000) / 1000) as [number, number, number];
    // các mảnh con còn lại của bộ phải nằm ngay sau, đúng vị trí/hướng/màu như toLdraw ghi
    const expected = pieceLines(cat, { part: key, color, pos, o }).map(l => l.split(' '));
    const kitOk = expected.slice(1).every((e, k) => { const n = lines[i + 1 + k]; return n && n.file === e[14].replace(/\.dat$/, '').toLowerCase() && n.color === Number(e[1]) && near(n.v, e.slice(2, 14).map(Number)); });
    if (!kitOk) { result.unknown.push(L.file); continue; }
    i += expected.length - 1;
    const check = world.check(key, pos, o);
    if (check.reason === 'collide' || check.reason === 'outside') { result.rejected++; continue; }
    world.add(key, color, pos, o); result.added++;
  }
  return result;
}

const esc = (s: string) => s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!));
/**
 * BrickLink "Wanted List" XML. Chưa có khoá Rebrickable nên mã mảnh/màu là mã Rebrickable (thường trùng BrickLink
 * với mảnh phổ biến, màu thì KHÁC) → ghi chú rõ ở đầu file; phụ huynh nên dùng CSV Rebrickable nếu có thể.
 */
export function toBricklinkXml(rows: BomRow[], mapping?: Record<string, { part: string; color: number }>): string {
  const items = rows.map(r => {
    const m = mapping?.[`${r.ldraw}|${r.ldrawColor}`];
    if (!m) throw new Error('Chưa có đối chiếu mã BrickLink cho toàn bộ mảnh và màu.');
    return `  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>${esc(m.part)}</ITEMID><COLOR>${m.color}</COLOR><MINQTY>${r.qty}</MINQTY></ITEM>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<INVENTORY>\n${items.join('\n')}\n</INVENTORY>\n`;
}

/** Rebrickable "Part,Color,Quantity" (mã màu Rebrickable). */
export function toRebrickableCsv(rows: BomRow[]): string {
  if (rows.some(r => !r.rb || r.rbColor === null)) throw new Error('Chưa có đủ mã Rebrickable cho mô hình này.');
  return 'Part,Color,Quantity\n' + rows.map(r => `${r.rb},${r.rbColor},${r.qty}`).join('\n') + '\n';
}
