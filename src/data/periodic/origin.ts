// Nguồn gốc vũ trụ (tổng hợp hạt nhân) của từng nguyên tố — tỉ lệ GẦN ĐÚNG đọc theo biểu đồ của
// J. A. Johnson, "Populating the periodic table: Nucleosynthesis of the elements", Science 363 (2019) 474.
// Nguyên tố nặng hơn sắt: tách s-process (sao nhỏ già đi) / r-process (sao neutron va nhau) theo tỉ lệ s/r
// của Hệ Mặt Trời (Bisterzo và cs. 2014). Chỉ chép số liệu (sự kiện khoa học), không chép hình biểu đồ.
// Nguyên tố không có đồng vị bền/sống lâu (Tc, Pm, Z ≥ 84 trừ Th, U) → con người tạo ra.

export type OriginId = 'big_bang' | 'cosmic_ray' | 'low_mass_stars' | 'massive_stars' | 'white_dwarfs' | 'neutron_stars' | 'human_made';

export const ORIGIN_IDS: OriginId[] = ['big_bang', 'massive_stars', 'low_mass_stars', 'white_dwarfs', 'neutron_stars', 'cosmic_ray', 'human_made'];

export const ORIGIN_INFO: Record<OriginId, { label: string; icon: string; color: string; say: string }> = {
    big_bang: { label: 'Vụ Nổ Lớn', icon: '💥', color: '#fde68a', say: '13,8 tỷ năm trước, Vụ Nổ Lớn tạo ra hydrogen và helium.' },
    massive_stars: { label: 'Sao lớn nổ tung', icon: '💫', color: '#f472b6', say: 'Những ngôi sao khổng lồ nổ tung thành siêu tân tinh, rắc oxygen, silicon, calcium khắp vũ trụ.' },
    low_mass_stars: { label: 'Sao nhỏ già đi', icon: '🔴', color: '#fb923c', say: 'Các ngôi sao nhỏ như Mặt Trời, khi già đi, nấu ra carbon, nitơ và chì.' },
    white_dwarfs: { label: 'Sao lùn trắng nổ', icon: '⚪', color: '#67e8f9', say: 'Sao lùn trắng bùng nổ tạo ra phần lớn sắt trong vũ trụ.' },
    neutron_stars: { label: 'Sao neutron va nhau', icon: '🌟', color: '#facc15', say: 'Hai sao neutron va vào nhau, tạo ra vàng, platinum và uranium!' },
    cosmic_ray: { label: 'Tia vũ trụ', icon: '☄️', color: '#a5b4fc', say: 'Tia vũ trụ đập vỡ nguyên tử lớn thành lithium, beryllium và boron.' },
    human_made: { label: 'Con người tạo ra', icon: '🧪', color: '#94a3b8', say: 'Phần còn lại do con người tạo ra trong phòng thí nghiệm.' },
};

type O = Partial<Record<'bb' | 'cr' | 'ls' | 'ms' | 'wd' | 'ns' | 'hm', number>>;

const RAW: Record<number, O> = {
    1: { bb: 1 }, 2: { bb: 0.9, ls: 0.05, ms: 0.05 }, 3: { bb: 0.3, cr: 0.35, ls: 0.35 }, 4: { cr: 1 }, 5: { cr: 0.85, ms: 0.15 },
    6: { ls: 0.6, ms: 0.4 }, 7: { ls: 0.6, ms: 0.4 }, 8: { ms: 0.9, ls: 0.1 }, 9: { ls: 0.5, ms: 0.5 }, 10: { ms: 0.9, ls: 0.1 },
    11: { ms: 0.85, ls: 0.15 }, 12: { ms: 0.95, ls: 0.05 }, 13: { ms: 0.95, ls: 0.05 }, 14: { ms: 0.7, wd: 0.3 }, 15: { ms: 1 },
    16: { ms: 0.7, wd: 0.3 }, 17: { ms: 0.8, wd: 0.2 }, 18: { ms: 0.6, wd: 0.4 }, 19: { ms: 0.8, wd: 0.2 }, 20: { ms: 0.6, wd: 0.4 },
    21: { ms: 0.9, wd: 0.1 }, 22: { ms: 0.6, wd: 0.4 }, 23: { ms: 0.5, wd: 0.5 }, 24: { ms: 0.4, wd: 0.6 }, 25: { ms: 0.3, wd: 0.7 },
    26: { ms: 0.4, wd: 0.6 }, 27: { ms: 0.6, wd: 0.4 }, 28: { ms: 0.4, wd: 0.6 }, 29: { ms: 0.8, ls: 0.2 }, 30: { ms: 0.8, ls: 0.2 },
    31: { ms: 0.7, ls: 0.3 }, 32: { ms: 0.5, ls: 0.5 }, 33: { ms: 0.4, ls: 0.3, ns: 0.3 }, 34: { ms: 0.4, ls: 0.2, ns: 0.4 },
    35: { ms: 0.3, ls: 0.2, ns: 0.5 }, 36: { ms: 0.3, ls: 0.4, ns: 0.3 }, 37: { ls: 0.5, ns: 0.5 }, 38: { ls: 0.8, ms: 0.1, ns: 0.1 },
    39: { ls: 0.7, ns: 0.3 }, 40: { ls: 0.7, ns: 0.3 }, 41: { ls: 0.6, ns: 0.4 }, 42: { ls: 0.5, ns: 0.5 }, 43: { hm: 1 },
    44: { ls: 0.3, ns: 0.7 }, 45: { ls: 0.15, ns: 0.85 }, 46: { ls: 0.45, ns: 0.55 }, 47: { ls: 0.2, ns: 0.8 }, 48: { ls: 0.6, ns: 0.4 },
    49: { ls: 0.6, ns: 0.4 }, 50: { ls: 0.7, ns: 0.3 }, 51: { ls: 0.3, ns: 0.7 }, 52: { ls: 0.2, ns: 0.8 }, 53: { ls: 0.05, ns: 0.95 },
    54: { ls: 0.2, ns: 0.8 }, 55: { ls: 0.15, ns: 0.85 }, 56: { ls: 0.85, ns: 0.15 }, 57: { ls: 0.75, ns: 0.25 }, 58: { ls: 0.8, ns: 0.2 },
    59: { ls: 0.5, ns: 0.5 }, 60: { ls: 0.6, ns: 0.4 }, 61: { hm: 1 }, 62: { ls: 0.3, ns: 0.7 }, 63: { ls: 0.05, ns: 0.95 },
    64: { ls: 0.15, ns: 0.85 }, 65: { ls: 0.07, ns: 0.93 }, 66: { ls: 0.12, ns: 0.88 }, 67: { ls: 0.08, ns: 0.92 }, 68: { ls: 0.17, ns: 0.83 },
    69: { ls: 0.13, ns: 0.87 }, 70: { ls: 0.33, ns: 0.67 }, 71: { ls: 0.2, ns: 0.8 }, 72: { ls: 0.5, ns: 0.5 }, 73: { ls: 0.4, ns: 0.6 },
    74: { ls: 0.55, ns: 0.45 }, 75: { ls: 0.1, ns: 0.9 }, 76: { ls: 0.1, ns: 0.9 }, 77: { ls: 0.02, ns: 0.98 }, 78: { ls: 0.05, ns: 0.95 },
    79: { ls: 0.05, ns: 0.95 }, 80: { ls: 0.6, ns: 0.4 }, 81: { ls: 0.75, ns: 0.25 }, 82: { ls: 0.8, ns: 0.2 }, 83: { ls: 0.2, ns: 0.8 },
    90: { ns: 1 }, 92: { ns: 1 },
};

const KEY: Record<string, OriginId> = { bb: 'big_bang', cr: 'cosmic_ray', ls: 'low_mass_stars', ms: 'massive_stars', wd: 'white_dwarfs', ns: 'neutron_stars', hm: 'human_made' };

export function originOf(z: number): Partial<Record<OriginId, number>> {
    const raw = RAW[z] ?? { hm: 1 };
    const out: Partial<Record<OriginId, number>> = {};
    for (const [k, v] of Object.entries(raw)) out[KEY[k]] = v;
    return out;
}
