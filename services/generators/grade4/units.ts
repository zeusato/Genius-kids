// Lớp 4 — Đơn vị đo (g4_units): yến, tạ, tấn; dm², m², mm²; giây, thế kỉ.
import { tpl, fromTemplates, single, input, rint, pickOne, chance } from '../kit';
import { fmt } from '../../study/value';
import type { Template } from '../../study/types';

const MASS: [string, string, number][] = [['yến', 'kg', 10], ['tạ', 'kg', 100], ['tấn', 'kg', 1000], ['tạ', 'yến', 10], ['tấn', 'tạ', 10]];
const AREA: [string, string, number][] = [['dm²', 'cm²', 100], ['m²', 'dm²', 100], ['cm²', 'mm²', 100], ['m²', 'cm²', 10000]];
const TIME: [string, string, number][] = [['phút', 'giây', 60], ['giờ', 'phút', 60], ['thế kỉ', 'năm', 100]];
const centuryRoman = (c: number) => { let s = '', n = c; for (const [v, r] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']] as const) while (n >= v) { s += r; n -= v; } return s; };

function conv(skill: string, table: [string, string, number][]) {
    return [
        tpl(skill, 1, () => {
            const [big, small, f] = pickOne(table), n = rint(2, 9);
            return chance(0.5)
                ? single({ q: `${n} ${big} = ? ${small}`, correct: n * f, wrong: [n * f * 10, n * f / 10 >= 1 && f > 10 ? n * f / 10 : n * f + f, n + f, n * (f === 60 ? 100 : 60)], format: x => `${fmt(x)} ${small}`, min: 1, step: f,
                    explanation: `1 ${big} = ${fmt(f)} ${small}, nên ${n} ${big} = ${n} × ${fmt(f)} = ${fmt(n * f)} ${small}.`, hint: `Nhớ: 1 ${big} = ${fmt(f)} ${small}.` })
                : input({ q: `Điền số: ${fmt(n * f)} ${small} = ? ${big}`, correct: n, explanation: `${fmt(f)} ${small} = 1 ${big}, nên ${fmt(n * f)} ${small} = ${n} ${big}.` });
        }),
        tpl(skill, 2, () => {
            const [big, small, f] = pickOne(table), a = rint(1, 9), b = rint(1, f - 1);
            return single({ q: `${a} ${big} ${b} ${small} = ? ${small}`, correct: a * f + b, wrong: [a + b, a * 10 + b, a * f, a * f + b * 10], format: x => `${fmt(x)} ${small}`, min: 1,
                explanation: `${a} ${big} = ${fmt(a * f)} ${small}; ${fmt(a * f)} + ${b} = ${fmt(a * f + b)} (${small}).`, hint: `Đổi ${a} ${big} ra ${small} trước.` });
        }),
    ];
}

export const templates: Template[] = [
    ...conv('g4.mass', MASS),
    ...conv('g4.area_units', AREA),
    ...conv('g4.time_units', TIME),
    tpl('g4.time_units', 2, () => {
        const y = rint(1001, 2025), c = Math.ceil(y / 100);
        return single({ q: `Năm ${y} thuộc thế kỉ nào?`, correct: c, wrong: [c - 1, c + 1, Math.floor(y / 100)].filter(x => x !== c && x > 0), format: x => `Thế kỉ ${centuryRoman(x)}`, closed: true,
            explanation: `Thế kỉ ${centuryRoman(c)} gồm các năm từ ${(c - 1) * 100 + 1} đến ${c * 100}, nên năm ${y} thuộc thế kỉ ${centuryRoman(c)}.`, hint: 'Thế kỉ thứ n kéo dài từ năm (n − 1) × 100 + 1 đến năm n × 100.' });
    }, { noRankCheck: true }),
];

export const generateUnits = fromTemplates(templates);
