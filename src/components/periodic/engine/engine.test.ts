import { describe, expect, it } from 'vitest';
import { ELEMENTS, byZ, bySymbol, gridPos, parseElementParam } from './elements';
import { stateAt, fracTemp, tempAtFrac, countStates } from './states';
import { isDiscovered, isMendeleevGap, fracYear, yearAtFrac } from './history';
import { lookFor, DEFAULT_CTX, LENSES, formatHalfLife, dominantOrigin } from './lenses';
import { nucleusPack, protonMask, nucleonCounts } from './atom';
import { identify, BUILDER_GOALS, goalMet } from './builder';
import { searchElements } from './search';
import { compareLines } from './compare';
import { ignitionTimes } from './intro';
import { CATEGORY_COLORS } from '../../../data/elementsData';
import { CHALLENGES, mixColor } from '../../../data/periodic/fireworks';
import { CLUES } from '../../../data/periodic/clues';

const sym = (z: number) => byZ(z)!.symbol;

describe('dữ liệu', () => {
    it('118 nguyên tố, ký hiệu duy nhất', () => {
        expect(ELEMENTS).toHaveLength(118);
        expect(new Set(ELEMENTS.map(e => e.symbol)).size).toBe(118);
        ELEMENTS.forEach((e, i) => expect(e.atomicNumber).toBe(i + 1));
    });
    it('tổng electron các lớp = Z', () => {
        for (const e of ELEMENTS) expect(e.electronShells.reduce((a, b) => a + b, 0)).toBe(e.atomicNumber);
    });
    it('đồng vị hợp lệ, không dùng công thức làm tròn khối lượng', () => {
        for (const e of ELEMENTS) { expect(e.isotope.A).toBeGreaterThanOrEqual(e.atomicNumber); expect(e.isotope.A).toBeLessThanOrEqual(300); }
        expect(byZ(29)!.isotope.A).toBe(63);   // Cu-63 (không phải Cu-64)
        expect(byZ(35)!.isotope.A).toBe(79);
        expect(byZ(79)!.isotope.A).toBe(197);
        expect(byZ(92)!.isotope.stable).toBe(false);
        expect(byZ(83)!.isotope.stable).toBe(true);
    });
    it('mỗi nguyên tố có câu cho bé, công dụng, mẫu vật, nguồn gốc cộng ≈ 1', () => {
        for (const e of ELEMENTS) {
            expect(e.kid.length).toBeGreaterThan(10);
            expect(e.uses.length).toBeGreaterThan(0);
            expect(e.specimen.kind).toBeTruthy();
            const s = Object.values(e.origin).reduce((a, b) => a + (b ?? 0), 0);
            expect(Math.abs(s - 1)).toBeLessThan(0.021);
        }
    });
    it('nguyên tố không có đồng vị bền (trừ Th, U) do con người tạo ra', () => {
        for (const e of ELEMENTS) if (!e.isotope.stable && e.atomicNumber !== 90 && e.atomicNumber !== 92) expect(e.origin.human_made).toBe(1);
    });
    it('neo nguồn gốc vũ trụ', () => {
        const d = (z: number) => dominantOrigin(byZ(z)!);
        expect(d(1)).toBe('big_bang'); expect(d(5)).toBe('cosmic_ray'); expect(d(8)).toBe('massive_stars');
        expect(d(26)).toBe('white_dwarfs'); expect(d(56)).toBe('low_mass_stars'); expect(d(82)).toBe('low_mass_stars');
        expect(d(79)).toBe('neutron_stars'); expect(d(92)).toBe('neutron_stars');
    });
    it('tên SGK: IUPAC, 13 tên Việt', () => {
        expect(byZ(1)!.sgkName).toBe('Hydrogen'); expect(byZ(8)!.sgkName).toBe('Oxygen');
        expect(byZ(11)!.sgkName).toBe('Natri'); expect(byZ(19)!.sgkName).toBe('Kali'); expect(byZ(26)!.sgkName).toBe('Sắt');
        expect(byZ(13)!.sgkName).toBe('Nhôm'); expect(byZ(55)!.sgkName).toBe('Caesium');
        expect(byZ(1)!.oldName).toBe('Hiđro');
    });
    it('dùng lại đủ 118 infographic', () => {
        const paths = ELEMENTS.map(e => e.infographicPath);
        expect(paths.every(p => /^element\/.+\.(jpeg|png)$/.test(p))).toBe(true);
        expect(new Set(paths).size).toBe(118);
    });
    it('vị trí lưới khớp bảng', () => {
        expect(gridPos(byZ(1)!)).toEqual({ row: 1, col: 1 });
        expect(gridPos(byZ(57)!)).toEqual({ row: 9, col: 3 });
        expect(gridPos(byZ(103)!)).toEqual({ row: 10, col: 17 });
        expect(parseElementParam('Au')!.atomicNumber).toBe(79);
        expect(parseElementParam('26')!.symbol).toBe('Fe');
        expect(bySymbol('og')!.atomicNumber).toBe(118);
    });
});

describe('thể theo nhiệt độ', () => {
    const at = (c: number, s: string) => ELEMENTS.filter(e => stateAt(e, c) === s).map(e => e.symbol).sort();
    it('25 °C: 11 khí, 2 lỏng', () => {
        expect(at(25, 'gas')).toEqual(['Ar', 'Cl', 'F', 'H', 'He', 'Kr', 'N', 'Ne', 'O', 'Rn', 'Xe']);
        expect(at(25, 'liquid')).toEqual(['Br', 'Hg']);
    });
    it('30 °C: Ga, Cs lỏng', () => { expect(at(30, 'liquid')).toEqual(expect.arrayContaining(['Ga', 'Cs', 'Br', 'Hg'])); });
    it('3.000 °C chỉ còn C, Ta, W, Re, Os là rắn', () => { expect(at(3000, 'solid')).toEqual(['C', 'Os', 'Re', 'Ta', 'W']); });
    it('thăng hoa C, As', () => {
        expect(stateAt(byZ(6)!, 3700)).toBe('gas'); expect(stateAt(byZ(33)!, 700)).toBe('gas'); expect(stateAt(byZ(33)!, 600)).toBe('solid');
    });
    it('thang nhiệt độ đảo ngược được', () => {
        for (const c of [-273, -100, 0, 25, 1000, 5500]) expect(tempAtFrac(fracTemp(c))).toBeCloseTo(c, 3);
        const n = countStates(ELEMENTS, 25); expect(n.solid + n.liquid + n.gas + n.unknown).toBe(118);
    });
});

describe('lịch sử', () => {
    it('63 nguyên tố biết tới 1869; ba ô Mendeleev', () => {
        expect(ELEMENTS.filter(e => isDiscovered(e, 1869)).length).toBe(63);
        expect([21, 31, 32].every(z => isMendeleevGap(byZ(z)!, 1870))).toBe(true);
        expect(isMendeleevGap(byZ(31)!, 1880)).toBe(false);
        expect(yearAtFrac(fracYear(1869))).toBe(1869);
    });
});

describe('kính lọc', () => {
    it('kính Nhóm giữ đúng màu hiện tại', () => {
        for (const e of ELEMENTS) {
            const l = lookFor(e, 'group', DEFAULT_CTX);
            expect(l.color).toBe(CATEGORY_COLORS[e.category].color); expect(l.glow).toBe(CATEGORY_COLORS[e.category].glow); expect(l.dim).toBe(false);
        }
    });
    it('mọi kính trả về look cho mọi ô', () => {
        for (const L of LENSES) for (const e of ELEMENTS) expect(lookFor(e, L.id, DEFAULT_CTX).color).toMatch(/^#|rgba/);
    });
    it('kính quanh em — cơ thể', () => {
        expect(lookFor(byZ(8)!, 'around', DEFAULT_CTX).sub).toBe('65%');
        expect(lookFor(byZ(79)!, 'around', DEFAULT_CTX).dim).toBe(true);
    });
    it('chu kỳ bán rã dễ hiểu', () => {
        expect(formatHalfLife(byZ(92)!.isotope.halfLifeSec)).toMatch(/tỷ năm/);
        expect(formatHalfLife(byZ(118)!.isotope.halfLifeSec)).toBe('chưa tới 1 giây');
    });
});

describe('nguyên tử', () => {
    it('hạt nhân tất định, đủ hạt, không chồng nhau', () => {
        const { protons, neutrons, A } = nucleonCounts(79);
        expect([protons, neutrons]).toEqual([79, 118]);
        const a = nucleusPack(79, A), b = nucleusPack(79, A);
        expect(a).toBe(b); expect(a.length).toBe(A * 3);
        let min = Infinity;
        for (let i = 0; i < A; i++) for (let j = i + 1; j < A; j++) {
            const d = Math.hypot(a[i * 3] - a[j * 3], a[i * 3 + 1] - a[j * 3 + 1], a[i * 3 + 2] - a[j * 3 + 2]); if (d < min) min = d;
        }
        expect(min).toBeGreaterThan(1.85);
        expect(protonMask(79, A).reduce((s, x) => s + x, 0)).toBe(79);
    });
    it('Xưởng nguyên tử', () => {
        expect(identify(1, 0, 1)).toMatchObject({ z: 1, charge: 0, stable: true });
        expect(identify(6, 6, 6)).toMatchObject({ A: 12, stable: true });
        expect(identify(6, 8, 6)).toMatchObject({ A: 14, stable: false });
        expect(identify(11, 12, 10)).toMatchObject({ charge: 1 });
        expect(goalMet(BUILDER_GOALS.find(g => g.id === 'Na+')!, 11, 12, 10)).toBe(true);
    });
});

describe('tìm kiếm', () => {
    const top = (q: string) => searchElements(ELEMENTS, q)[0]?.symbol;
    it('không dấu, tên cũ, tên SGK, tiếng Anh', () => {
        expect(top('hidro')).toBe('H'); expect(top('natri')).toBe('Na'); expect(top('sodium')).toBe('Na');
        expect(top('sat')).toBe('Fe'); expect(top('vang')).toBe('Au'); expect(top('26')).toBe('Fe'); expect(top('oxi')).toBe('O');
        expect(top('Og')).toBe('Og'); expect(top('muoi i ot')).toBe('I');
    });
});

describe('nội dung khác', () => {
    it('so sánh vui', () => {
        expect(compareLines(byZ(79)!)[0]).toMatch(/19,3 g/);
        expect(compareLines(byZ(3)!)[0]).toMatch(/nổi/);
        expect(compareLines(byZ(2)!)[0]).toMatch(/Nhẹ hơn không khí/);
    });
    it('mở màn: mọi ô đều sáng đúng một lần trước 19 s', () => {
        const t = ignitionTimes(ELEMENTS);
        expect(t.size).toBe(118);
        for (const v of t.values()) expect(v).toBeLessThan(19);
        expect(t.get(1)!).toBeLessThan(t.get(79)!);
    });
    it('pháo hoa: cờ đỏ sao vàng', () => {
        const flag = CHALLENGES.find(c => c.id === 'flag')!;
        expect(flag.test([{ zs: [38], shape: 'peony' }, { zs: [11], shape: 'star' }])).toBe(true);
        expect(flag.test([{ zs: [11], shape: 'peony' }])).toBe(false);
        expect(mixColor([38, 29])).toContain('#b04dff');
    });
    it('gợi ý Truy tìm trỏ tới nguyên tố có thật và không trùng', () => {
        expect(new Set(CLUES.map(c => c.z)).size).toBe(CLUES.length);
        expect(CLUES.filter(c => c.easy).length).toBeGreaterThanOrEqual(8);
        CLUES.forEach(c => expect(byZ(c.z)).toBeTruthy());
    });
    it('thí nghiệm: nhóm 1 có thả vào nước, siêu nặng có máy gia tốc', () => {
        [3, 11, 19, 37, 55].forEach(z => expect(byZ(z)!.experiments.some(x => x.id === 'water')).toBe(true));
        expect(byZ(118)!.experiments[0].id).toBe('collide');
        expect(sym(2)).toBe('He');
        expect(byZ(2)!.experiments.some(x => x.id === 'voice')).toBe(true);
    });
});

describe('bếp phân tử', () => {
    it('nhận ra phân tử theo số nguyên tử', async () => {
        const { matchRecipe, RECIPES } = await import('./molecules');
        expect(matchRecipe({ H: 2, O: 1 })?.id).toBe('h2o');
        expect(matchRecipe({ C: 1, O: 2 })?.id).toBe('co2');
        expect(matchRecipe({ Na: 1, Cl: 1 })?.id).toBe('nacl');
        expect(matchRecipe({ H: 3 })).toBeNull();
        expect(new Set(RECIPES.map(r => JSON.stringify(r.counts))).size).toBe(RECIPES.length);
        for (const r of RECIPES) for (const [i, j] of r.bonds) { expect(r.atoms[i]).toBeTruthy(); expect(r.atoms[j]).toBeTruthy(); }
    });
});

describe('đọc to: tách tên tiếng Anh', () => {
    it('tên IUPAC đọc bằng giọng en-US, phần còn lại vi-VN; 13 tên Việt giữ vi-VN', async () => {
        const { toSpeechParts } = await import('./speech');
        expect(toSpeechParts('Hydrogen. Hydrogen nhẹ nhất vũ trụ, nước có hydrogen.')).toEqual([
            { text: 'Hydrogen, Hydrogen', lang: 'en-US' }, { text: 'nhẹ nhất vũ trụ, nước có', lang: 'vi-VN' }, { text: 'hydrogen', lang: 'en-US' },
        ]);
        expect(toSpeechParts('Sắt là kim loại. Vàng óng ánh.')).toEqual([{ text: 'Sắt là kim loại. Vàng óng ánh.', lang: 'vi-VN' }]);
        const p = toSpeechParts('Vụ Nổ Lớn tạo ra hydrogen và helium.');
        expect(p.map(x => x.lang)).toEqual(['vi-VN', 'en-US', 'vi-VN', 'en-US']);
        expect(toSpeechParts('oxygen, silicon, calcium').filter(x => x.lang === 'en-US').length).toBe(1);   // gộp tên liền nhau
        expect(toSpeechParts('Caesium giúp làm đồng hồ')[0]).toEqual({ text: 'Caesium', lang: 'en-US' });
        expect(toSpeechParts('Neonatal').length).toBe(1);   // không bắt giữa từ
    });
});
