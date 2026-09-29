// Pháo hoa: muối kim loại → màu (theo màu thử ngọn lửa; thuốc pháo thật dùng các muối này).
// Sr đỏ, Ca cam, Na vàng, Ba xanh lá, Cu xanh lam, Sr + Cu tím, Mg/Al/Ti trắng bạc, than + sắt vàng kim.

export interface Salt { z: number; symbol: string; name: string; color: string; colorName: string; compound: string }

export const SALTS: Salt[] = [
    { z: 38, symbol: 'Sr', name: 'Strontium', color: '#ff2a2a', colorName: 'đỏ', compound: 'strontium carbonate' },
    { z: 20, symbol: 'Ca', name: 'Calcium', color: '#ff7a1a', colorName: 'cam', compound: 'calcium chloride' },
    { z: 11, symbol: 'Na', name: 'Natri', color: '#ffc21a', colorName: 'vàng', compound: 'natri nitrate' },
    { z: 56, symbol: 'Ba', name: 'Barium', color: '#5dff4a', colorName: 'xanh lá', compound: 'barium chloride' },
    { z: 29, symbol: 'Cu', name: 'Đồng', color: '#2f7bff', colorName: 'xanh lam', compound: 'đồng chloride' },
    { z: 12, symbol: 'Mg', name: 'Magnesium', color: '#f4f6ff', colorName: 'trắng bạc', compound: 'bột magnesium' },
    { z: 26, symbol: 'Fe', name: 'Sắt', color: '#ffb347', colorName: 'vàng kim lấp lánh', compound: 'mạt sắt + than' },
    { z: 3, symbol: 'Li', name: 'Lithium', color: '#ff2f6d', colorName: 'đỏ hồng', compound: 'lithium carbonate' },
];

export type ShellShape = 'peony' | 'chrysanthemum' | 'willow' | 'heart' | 'star' | 'ring';

export const SHAPES: { id: ShellShape; label: string; icon: string }[] = [
    { id: 'peony', label: 'Cầu', icon: '🔴' }, { id: 'chrysanthemum', label: 'Hoa cúc', icon: '🌼' }, { id: 'willow', label: 'Cây liễu', icon: '🌿' },
    { id: 'heart', label: 'Trái tim', icon: '❤️' }, { id: 'star', label: 'Ngôi sao', icon: '⭐' }, { id: 'ring', label: 'Vòng tròn', icon: '⭕' },
];

export interface Challenge { id: string; title: string; hint: string; test: (shots: { zs: number[]; shape: ShellShape }[]) => boolean }

const hasColor = (zs: number[], z: number) => zs.includes(z);

export const CHALLENGES: Challenge[] = [
    { id: 'flag', title: '🇻🇳 Cờ đỏ sao vàng', hint: 'Bắn một quả đỏ và một quả ngôi sao màu vàng.',
        test: (s) => s.some(x => hasColor(x.zs, 38) || hasColor(x.zs, 3)) && s.some(x => x.shape === 'star' && hasColor(x.zs, 11)) },
    { id: 'rainbow', title: '🌈 Cầu vồng', hint: 'Bắn đủ đỏ, cam, vàng, xanh lá, xanh lam và tím.',
        test: (s) => { const all = new Set(s.flatMap(x => x.zs)); const purple = s.some(x => hasColor(x.zs, 38) && hasColor(x.zs, 29)); return [38, 20, 11, 56, 29].every(z => all.has(z)) && purple; } },
    { id: 'purple', title: '💜 Màu tím', hint: 'Không có muối nào cho màu tím đậm — thử trộn hai màu nhé!',
        test: (s) => s.some(x => hasColor(x.zs, 38) && hasColor(x.zs, 29)) },
    { id: 'silver', title: '✨ Pháo bạc', hint: 'Kim loại nào cháy sáng trắng chói?', test: (s) => s.some(x => hasColor(x.zs, 12)) },
];

export function mixColor(zs: number[]): string[] {
    const c = zs.map(z => SALTS.find(s => s.z === z)?.color).filter((x): x is string => !!x);
    if (zs.includes(38) && zs.includes(29)) c.push('#b04dff');   // đỏ + xanh lam cho màu tím
    return c.length ? c : ['#ffe7b0'];
}
