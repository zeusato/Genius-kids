// Định dạng lưu mô hình (plan mục 10.1): 6 số mỗi mảnh theo thứ tự lắp, có từ điển mảnh/màu.
import type { V3 } from './types';
import { AREA, type World } from './world';

export interface BrickModel {
  v: 1;
  ownerId: string; id: string; name: string;
  created: number; updated: number; revision: number;
  parts: string[]; colors: string[];
  b: number[];                          // partIdx, colorIdx, x, y, z, o — theo thứ tự lắp
  view?: number[];
  stats: { count: number; size: V3 };   // núm, núm, tấm
  idea?: string;
}
export const LIMITS = { pieces: 4000, warnPieces: 3000, models: 200, name: 40 } as const;

/** Ghi trạng thái thế giới vào mô hình (giữ nguyên các trường khác). */
export function encodeWorld(world: World, base: Omit<BrickModel, 'parts' | 'colors' | 'b' | 'stats'>): BrickModel {
  const parts: string[] = [], colors: string[] = [], pi = new Map<string, number>(), ci = new Map<string, number>(), b: number[] = [];
  const idx = (m: Map<string, number>, list: string[], k: string) => { let i = m.get(k); if (i === undefined) { i = list.length; m.set(k, i); list.push(k); } return i; };
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of world.pieces.values()) {
    b.push(idx(pi, parts, p.part), idx(ci, colors, p.color), p.pos[0], p.pos[1], p.pos[2], p.o);
    for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p.bbox[i]); hi[i] = Math.max(hi[i], p.bbox[i + 3]); }
  }
  const n = world.pieces.size;
  const size: V3 = n ? [Math.round((hi[0] - lo[0]) / 20), Math.round((hi[2] - lo[2]) / 20), Math.round((hi[1] - lo[1]) / 8)] : [0, 0, 0];
  return { ...base, parts, colors, b, stats: { count: n, size } };
}

export interface DecodeResult { unknownParts: string[]; skipped: number }
/** Dựng lại thế giới từ mô hình. Mảnh lạ (bản app cũ hơn) bị bỏ qua và báo lại — dữ liệu gốc KHÔNG bị sửa. */
export function decodeInto(world: World, m: BrickModel): DecodeResult {
  validateModel(m);
  world.clear();
  const unknown = new Set<string>();
  let skipped = 0;
  for (let i = 0; i < m.b.length; i += 6) {
    const part = m.parts[m.b[i]], color = m.colors[m.b[i + 1]];
    if (!world.catalog.parts[part]) { unknown.add(part); skipped++; continue; }
    world.add(part, color, [m.b[i + 2], m.b[i + 3], m.b[i + 4]], m.b[i + 5]);
  }
  return { unknownParts: [...unknown], skipped };
}

export function validateModel(m: BrickModel) {
  const bad = (why: string) => { throw Error(`Mô hình không hợp lệ: ${why}. Dữ liệu gốc vẫn được giữ.`); };
  if (!m || m.v !== 1) bad('phiên bản');
  if (!Array.isArray(m.b) || m.b.length % 6 || m.b.length / 6 > LIMITS.pieces) bad('danh sách mảnh');
  if (![m.ownerId, m.id].every(v => typeof v === 'string' && v.length > 0 && v.length <= 160)) bad('định danh');
  if (![m.created, m.updated, m.revision].every(v => Number.isSafeInteger(v) && v >= 0)) bad('phiên lưu');
  if (!Array.isArray(m.parts) || !Array.isArray(m.colors) || [...m.parts, ...m.colors].some(v => typeof v !== 'string' || !v || v.length > 160)) bad('từ điển');
  if (typeof m.name !== 'string' || m.name.length > 200) bad('tên');
  for (let i = 0; i < m.b.length; i += 6) {
    const [p, c, x, y, z, o] = m.b.slice(i, i + 6);
    if (!Number.isInteger(p) || p < 0 || p >= m.parts.length || !Number.isInteger(c) || c < 0 || c >= m.colors.length) bad('chỉ số');
    if (!Number.isInteger(o) || o < 0 || o > 23) bad('hướng');
    if (![x, y, z].every(Number.isFinite) || Math.abs(x) > AREA.max + 400 || Math.abs(z) > AREA.max + 400 || y > 50 || y < -AREA.height - 400) bad('toạ độ');
  }
  return m;
}
