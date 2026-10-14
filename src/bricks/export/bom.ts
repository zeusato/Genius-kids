// Danh sách mảnh thật để mua/tìm (plan mục 11.1): bung mảnh dạng bộ, gom theo (mã mảnh, màu), cảnh báo tổ hợp không có thật.
import type { Catalog } from '../engine/types';
import type { World } from '../engine/world';

export interface BomRow {
  /** khoá mảnh trong app (để vẽ hình) — với mảnh phụ của bộ thì null */
  part: string | null;
  ldraw: string; rb: string | null; nameVi: string; nameEn: string; group: string;
  /** khoá màu trong bảng màu, hoặc null nếu là màu cố định */
  color: string | null; fixed: number | null;
  colorVi: string; colorEn: string; hex: string; ldrawColor: number; rbColor: number | null;
  qty: number;
  /** tổ hợp mảnh–màu không có trong dữ liệu bộ thật (Rebrickable) */
  rare: boolean;
  suggest?: string;
}

const FIXED_VI: Record<number, string> = { 0: 'Đen', 15: 'Trắng', 47: 'Trong suốt', 71: 'Xám nhạt', 72: 'Xám đậm', 4: 'Đỏ', 14: 'Vàng', 1: 'Xanh dương', 2: 'Xanh lá', 70: 'Nâu', 25: 'Cam', 19: 'Màu cát' };
const GROUP_ORDER = ['brick', 'plate', 'tile', 'slope', 'curve', 'round', 'arch', 'window', 'vehicle', 'nature', 'side', 'decor'];

function hexDist(a: string, b: string) {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

export function buildBom(world: World): BomRow[] {
  const cat: Catalog = world.catalog;
  const pal = new Map(cat.palette.map(c => [c.key, c]));
  const rows = new Map<string, BomRow>();
  for (const p of world.pieces.values()) {
    const src = cat.parts[p.part];
    if (!src) continue;
    for (const b of src.bom) {
      const isMain = b.ldraw === src.ldraw || b === src.bom[0];
      const self = b.color === 'self';
      const c = self ? pal.get(p.color) : undefined;
      const fixed = self ? null : (b.color as number);
      const fc = fixed !== null ? cat.fixedColors[String(fixed)] : undefined;
      const key = b.ldraw + '|' + (self ? 'c:' + p.color : 'f:' + fixed);
      let row = rows.get(key);
      if (!row) {
        const avail = isMain && self ? src.colors : null;
        const rare = !!avail && !avail.includes(p.color);
        let suggest: string | undefined;
        if (rare && c) {
          const best = cat.palette.filter(x => avail!.includes(x.key) && x.kind === c.kind).sort((x, y) => hexDist(x.hex, c.hex) - hexDist(y.hex, c.hex))[0];
          suggest = best?.nameVi;
        }
        row = {
          part: isMain ? p.part : null, ldraw: b.ldraw, rb: isMain ? src.rb : null,
          nameVi: b.nameVi || (isMain ? src.name : (b.name || b.ldraw)), nameEn: b.name || b.ldraw, group: src.group,
          color: self ? p.color : null, fixed,
          colorVi: c?.nameVi ?? FIXED_VI[fixed ?? -1] ?? fc?.name?.replace(/_/g, ' ') ?? '', colorEn: c?.nameEn ?? fc?.name?.replace(/_/g, ' ') ?? '',
          hex: c?.hex ?? fc?.hex ?? '#888888', ldrawColor: c?.ldraw ?? fixed ?? 16, rbColor: c?.rb ?? cat.palette.find(x => x.ldraw === fixed)?.rb ?? null,
          qty: 0, rare, suggest,
        };
        rows.set(key, row);
      }
      row.qty += b.qty;
    }
  }
  return [...rows.values()].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.nameVi.localeCompare(b.nameVi, 'vi', { numeric: true }) || a.colorVi.localeCompare(b.colorVi, 'vi'));
}

/** Kích thước thật (cm) của mô hình: 1 LDU = 0,4 mm. */
export function realSize(world: World): { w: number; d: number; h: number } | null {
  if (!world.pieces.size) return null;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of world.pieces.values()) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p.bbox[i]); hi[i] = Math.max(hi[i], p.bbox[i + 3]); }
  const cm = (v: number) => Math.round(v * 0.04 * 10) / 10;
  return { w: cm(hi[0] - lo[0]), d: cm(hi[2] - lo[2]), h: cm(hi[1] - lo[1]) };
}
