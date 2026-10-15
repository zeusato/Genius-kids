// Khay mảnh (plan mục 7.1): biểu tượng nhóm và nhóm con. Catalog chưa có cột "nhóm con" (pipeline cần tools/ldraw),
// nên nhóm con suy từ tên Việt / cờ in của mảnh. Mỗi mảnh vào nhóm con ĐẦU TIÊN khớp; không khớp → "Khác".
import type { CatalogPart } from '../engine/types';

export const GROUP_ICON: Record<string, string> = {
  recent: '🕘', brick: '🧱', plate: '▭', tile: '◻️', slope: '📐', curve: '🌙', round: '⚪',
  arch: '🌉', window: '🚪', vehicle: '🛞', nature: '🌷', side: '🔩', decor: '✨',
};

interface Rule { id: string; label: string; test: (name: string, p: CatalogPart) => boolean }
const w1 = (n: string) => /\s1×/.test(n);
const plain = (prefix: string) => (n: string) => new RegExp(`^${prefix} \\d+×\\d+$`).test(n);

const RULES: Record<string, Rule[]> = {
  brick: [
    { id: '1', label: '1 hàng', test: n => plain('Gạch')(n) && w1(n) },
    { id: '2', label: '2 hàng', test: plain('Gạch') },
    { id: 'tall', label: 'Cao', test: n => /×\d+(×\d|⅔)/.test(n) && !/núm cạnh|núm 2 cạnh/.test(n) },
    { id: 'special', label: 'Đặc biệt', test: () => true },
  ],
  plate: [
    { id: '1', label: '1 hàng', test: n => plain('Tấm')(n) && w1(n) },
    { id: '2', label: '2 hàng', test: n => plain('Tấm')(n) && /\s2×/.test(n) },
    { id: 'big', label: 'Lớn', test: plain('Tấm') },
    { id: 'wedge', label: 'Nêm & góc', test: n => /nêm|góc/.test(n) },
    { id: 'special', label: 'Đặc biệt', test: () => true },
  ],
  tile: [
    { id: 'print', label: 'Có hình in', test: (_, p) => !!p.print },
    { id: 'round', label: 'Tròn & cong', test: n => /tròn|cong|nửa|phần tư/.test(n) },
    { id: 'plain', label: 'Vuông', test: () => true },
  ],
  slope: [
    { id: 'inv', label: 'Ngược', test: n => /ngược/.test(n) },
    { id: 's45', label: '45°', test: n => /45°/.test(n) },
    { id: 'low', label: 'Thoải', test: n => /(33|30|18)°/.test(n) },
    { id: 'steep', label: 'Dốc đứng', test: n => /(65|75)°/.test(n) },
    { id: 'other', label: 'Khác', test: () => true },
  ],
  curve: [
    { id: 'inv', label: 'Cong ngược', test: n => /ngược|lõm/.test(n) },
    { id: 'smooth', label: 'Không núm', test: n => /không núm/.test(n) },
    { id: 'curve', label: 'Có núm', test: () => true },
  ],
  round: [
    { id: 'cone', label: 'Nón', test: n => /^Nón/.test(n) },
    { id: 'brick', label: 'Gạch tròn', test: n => /^Gạch/.test(n) },
    { id: 'plate', label: 'Tấm & đĩa', test: () => true },
  ],
};

/** Các nhóm con của một nhóm (rỗng nếu nhóm nhỏ, không cần chia). Chỉ trả nhóm con có ít nhất một mảnh. */
export function subgroupsOf(group: string, parts: string[], catalog: Record<string, CatalogPart>) {
  const rules = RULES[group]; if (!rules) return [];
  const of = (k: string) => rules.find(r => r.test(catalog[k].name, catalog[k]))!.id;
  return rules.map(r => ({ id: r.id, label: r.label, parts: parts.filter(k => of(k) === r.id) })).filter(s => s.parts.length);
}

/** Chế độ bé (plan mục 6.2, 7.7): ~30 mảnh trong đúng 6 nhóm Gạch, Tấm, Mái, Tròn, Cửa, Cây. */
export const PRESCHOOL_PARTS = new Set([
  '3001', '3002', '3003', '3004', '3005', '3009', '3010',          // gạch
  '3020', '3021', '3022', '3023b', '3024', '3031', '3034',         // tấm
  '3037', '3038', '3039', '3040b',                                 // mái 45°
  '6141', '3062b', '92947', '59900', '3942c',                      // tròn, nón
  'kit-window-1x2x2', 'kit-door-1x4x6', '87552',                   // cửa
  '24866', '3742', '2423', '4727',                                 // cây, hoa
]);

/** Tiền tố tên mảnh trùng tên nhóm — trong nhóm đó thẻ chỉ ghi phần còn lại (góp ý 15/10: đã chọn Gạch thì không cần lặp chữ "Gạch"). */
const PREFIX: Record<string, RegExp> = {
  brick: /^Gạch /, plate: /^Tấm /, tile: /^Tấm trơn /, slope: /^Mái dốc /, curve: /^(Gạch|Dốc) cong /, arch: /^Vòm /,
};
/** Nhãn ngắn của thẻ khi đang xem nhóm `group`. Tên đầy đủ vẫn dùng cho tooltip, giọng đọc, tìm kiếm, "Vừa dùng". */
export function shortName(name: string, group: string) {
  const re = PREFIX[group];
  if (!re || !re.test(name)) return name;
  const rest = name.replace(re, '');
  return rest.charAt(0).toLocaleUpperCase('vi') + rest.slice(1);
}
