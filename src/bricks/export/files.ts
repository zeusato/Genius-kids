// File cho người lớn (plan mục 11.3): LDraw .ldr (có 0 STEP), BrickLink XML, Rebrickable CSV.
import { ORIENTS } from '../engine/orient';
import type { World } from '../engine/world';
import type { BomRow } from './bom';
import type { Step } from './steps';

const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : Math.round(v * 1000) / 1000);

/** LDraw: toạ độ engine chính là toạ độ LDraw → ghi thẳng; bộ ghép bung thành từng mảnh với ma trận con. */
export function toLdraw(world: World, name: string, steps?: Step[]): string {
  const cat = world.catalog, pal = new Map(cat.palette.map(c => [c.key, c.ldraw]));
  const lines = [`0 ${name}`, `0 Name: ${name.replace(/[^\w\- ]+/g, '_') || 'model'}.ldr`, '0 Author: Xưởng Lắp Ghép — Genius Kids', '0 !LDRAW_ORG Unofficial_Model', ''];
  const line = (id: number) => {
    const p = world.pieces.get(id)!, src = cat.parts[p.part], R = ORIENTS[p.o];
    for (const b of src.bom) {
      const m = b.m ?? [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
      // vị trí con: R·t_con + pos ; hướng con: R·M_con
      const t = [0, 1, 2].map(r => R[r * 3] * m[0] + R[r * 3 + 1] * m[1] + R[r * 3 + 2] * m[2] + p.pos[r]);
      const M = m.slice(3), RM: number[] = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) RM.push(R[r * 3] * M[c] + R[r * 3 + 1] * M[3 + c] + R[r * 3 + 2] * M[6 + c]);
      const color = b.color === 'self' ? (pal.get(p.color) ?? 16) : b.color;
      lines.push(['1', color, ...t.map(n), ...RM.map(n), b.ldraw + '.dat'].join(' '));
    }
  };
  if (steps?.length) steps.forEach((s, i) => { for (const id of s.pieces) line(id); if (i < steps.length - 1) lines.push('0 STEP'); });
  else for (const id of world.pieces.keys()) line(id);
  return lines.join('\r\n') + '\r\n';
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
