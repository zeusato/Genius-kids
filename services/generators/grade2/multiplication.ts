// Lớp 2 — Phép nhân (g2_multiplication). GDPT 2018: bảng nhân 2 và 5; bảng 3, 4 là "Nâng cao" (Lớp 3).
// Giữ mẫu nhập "a × ? = c" (MathRacing lọc ManualInput có "× ?").
import { tpl, fromTemplates, single, choices, input, rint, pickOne, chance, shuffle } from '../kit';
import { around, tableNeighbors } from '../wrongs';
import type { Template } from '../../study/types';

const THINGS: [string, string, string][] = [['đĩa', 'cái bánh', '🍪'], ['hộp', 'cái bút', '✏️'], ['bình', 'bông hoa', '🌸'], ['túi', 'quả cam', '🍊'], ['chuồng', 'con thỏ', '🐰']];

function mulTemplates(skill: 'g2.mul_table' | 'g2.mul_table34', tables: number[]): ReturnType<typeof tpl>[] {
    return [
        tpl(skill, 1, () => {
            const a = pickOne(tables), b = rint(1, 10);
            return single({ q: `Tính: ${a} × ${b} = ?`, speech: `${a} nhân ${b} bằng bao nhiêu?`, correct: a * b, wrong: [...tableNeighbors(a, b), a + b], min: 0, max: 100,
                explanation: `${a} × ${b} = ${a * b} (cộng ${b} lần số ${a}: ${Array(Math.min(b, 6)).fill(a).join(' + ')}${b > 6 ? ' + …' : ''}).`, hint: `Đếm thêm ${a}: ${a}, ${2 * a}, ${3 * a}, …` });
        }, { weight: 2 }),
        tpl(skill, 2, () => {
            const a = pickOne(tables), b = rint(2, 10), [c, it, e] = pickOne(THINGS);
            if (chance(0.5)) return input({ q: `${a} × ? = ${a * b}`, speech: `${a} nhân mấy bằng ${a * b}?`, correct: b, explanation: `Vì ${a} × ${b} = ${a * b} nên số cần điền là ${b}.`, hint: `Nhẩm bảng nhân ${a}.` });
            return single({ q: `Mỗi ${c} có ${a} ${it}. Hỏi ${b} ${c} có tất cả bao nhiêu ${it}?`, speech: `Mỗi ${c} có ${a} ${it}. Hỏi ${b} ${c} có tất cả bao nhiêu ${it}?`,
                visual: b * a <= 30 ? { fn: 'groupsSVG', args: [Array.from({ length: b }, () => ({ emoji: e, n: a, label: '' }))] } : undefined,
                correct: a * b, wrong: [a + b, ...tableNeighbors(a, b)], min: 0, max: 100,
                explanation: `${a} ${it} được lấy ${b} lần: ${a} × ${b} = ${a * b} (${it}).`, steps: [`Số ${it} có tất cả: ${a} × ${b} = ${a * b} (${it})`, `Đáp số: ${a * b} ${it}`] });
        }),
    ];
}

export const templates: Template[] = [
    tpl('g2.mul_meaning', 1, () => {
        const a = pickOne([2, 5, 3, 4]), b = rint(2, 5);
        const sum = Array(b).fill(a).join(' + ');
        return choices({ q: `Viết tổng ${sum} thành phép nhân.`, speech: `Viết tổng ${sum.replace(/\+/g, 'cộng')} thành phép nhân.`,
            options: shuffle([...new Set([`${a} × ${b}`, `${b} × ${a + 1}`, `${a} + ${b}`, `${a} × ${b + 1}`])]), correct: `${a} × ${b}`,
            explanation: `Số ${a} được lấy ${b} lần, ta viết ${a} × ${b}.` });
    }),
    tpl('g2.mul_meaning', 2, () => {
        const a = pickOne([2, 5]), b = rint(2, 10), k = rint(0, 2), parts = [a, b, a * b], names = ['Thừa số', 'Thừa số', 'Tích'];
        return choices({ q: `Trong phép nhân ${a} × ${b} = ${a * b}, số ${parts[k]} được gọi là gì?`, speech: `Trong phép nhân ${a} nhân ${b} bằng ${a * b}, số ${parts[k]} gọi là gì?`,
            options: ['Thừa số', 'Tích', 'Thương', 'Số hạng'], shuffle: true, correct: names[k], explanation: `${a} và ${b} là các thừa số, ${a * b} là tích.` });
    }),
    ...mulTemplates('g2.mul_table', [2, 5]),
    ...mulTemplates('g2.mul_table34', [3, 4]),
];

export const generateG2Multiplication = fromTemplates(templates);
