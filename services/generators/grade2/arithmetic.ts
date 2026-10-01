// Lớp 2 — Thành phần phép tính & bài toán (g2_arithmetic_advanced):
// tên thành phần, tìm số hạng / số bị trừ / số trừ, điền dấu, bài toán nhiều hơn – ít hơn.
import { tpl, fromTemplates, single, compare, choices, input, rint, pickOne, chance, shuffle } from '../kit';
import { around } from '../wrongs';
import { KIDS } from './common';
import type { Template } from '../../study/types';

const THINGS = ['viên bi', 'quyển vở', 'bông hoa', 'cái kẹo', 'quả cam', 'con tem', 'cái bút'];

export const templates: Template[] = [
    tpl('g2.terms', 1, () => {
        const add = chance(0.5), a = rint(10, 60), b = pickOne(Array.from({ length: 35 }, (_, i) => i + 5).filter(x => x !== a && x !== 2 * a && 2 * x !== a));
        if (add) {
            const k = rint(0, 2), parts = [String(a), String(b), String(a + b)], names = ['Số hạng', 'Số hạng', 'Tổng'];
            return choices({ q: `Trong phép cộng ${a} + ${b} = ${a + b}, số ${parts[k]} được gọi là gì?`, speech: `Trong phép cộng ${a} cộng ${b} bằng ${a + b}, số ${parts[k]} được gọi là gì?`,
                options: ['Số hạng', 'Tổng', 'Hiệu', 'Số trừ'], shuffle: true, correct: names[k], explanation: `${a} và ${b} là các số hạng, ${a + b} là tổng.` });
        }
        const s = a + b, k = rint(0, 2), parts = [s, b, a], names = ['Số bị trừ', 'Số trừ', 'Hiệu'];
        return choices({ q: `Trong phép trừ ${s} - ${b} = ${a}, số ${parts[k]} được gọi là gì?`, speech: `Trong phép trừ ${s} trừ ${b} bằng ${a}, số ${parts[k]} được gọi là gì?`,
            options: ['Số bị trừ', 'Số trừ', 'Hiệu', 'Tổng'], shuffle: true, correct: names[k], explanation: `${s} là số bị trừ, ${b} là số trừ, ${a} là hiệu.` });
    }),
    tpl('g2.missing', 2, () => {
        const a = rint(15, 70), b = rint(8, 29), kind = rint(0, 2);
        if (kind === 0) return input({ q: `Tìm số hạng: ? + ${b} = ${a + b}`, speech: `Số nào cộng ${b} bằng ${a + b}?`, correct: a,
            explanation: `Muốn tìm số hạng, lấy tổng trừ đi số hạng kia: ${a + b} - ${b} = ${a}.`, hint: 'Muốn tìm số hạng, lấy tổng trừ đi số hạng kia.' });
        if (kind === 1) return input({ q: `Tìm số bị trừ: ? - ${b} = ${a}`, speech: `Số nào trừ ${b} bằng ${a}?`, correct: a + b,
            explanation: `Muốn tìm số bị trừ, lấy hiệu cộng với số trừ: ${a} + ${b} = ${a + b}.`, hint: 'Muốn tìm số bị trừ, lấy hiệu cộng với số trừ.' });
        return input({ q: `Tìm số trừ: ${a + b} - ? = ${a}`, speech: `${a + b} trừ số nào bằng ${a}?`, correct: b,
            explanation: `Muốn tìm số trừ, lấy số bị trừ trừ đi hiệu: ${a + b} - ${a} = ${b}.`, hint: 'Muốn tìm số trừ, lấy số bị trừ trừ đi hiệu.' });
    }),
    tpl('g2.compare_expr', 2, () => {
        const a = rint(10, 60), b = rint(5, 39), sub = chance(0.5);
        const expr = sub ? `${a + b} - ${b}` : `${a} + ${b}`, val = sub ? a : a + b, target = val + pickOne([-10, -1, 0, 0, 1, 10]);
        return compare({ q: `Điền dấu >, <, =: ${expr} ... ${target}`, speech: `So sánh ${expr.replace('+', 'cộng').replace('-', 'trừ')} với ${target}.`, left: val, right: target,
            explanation: `${expr} = ${val}, mà ${val} ${val > target ? '>' : val < target ? '<' : '='} ${target}.`, hint: 'Tính giá trị phép tính trước rồi mới so sánh.' });
    }),
    tpl('g2.word_more_less', 2, () => {
        const [k1, k2] = shuffle(KIDS), t = pickOne(THINGS), a = rint(20, 60), d = rint(3, 17), more = chance(0.5);
        const ans = more ? a + d : a - d;
        return single({ q: `${k1} có ${a} ${t}. ${k2} có ${more ? 'nhiều' : 'ít'} hơn ${k1} ${d} ${t}. Hỏi ${k2} có bao nhiêu ${t}?`,
            speech: `${k1} có ${a} ${t}. ${k2} có ${more ? 'nhiều' : 'ít'} hơn ${k1} ${d} ${t}. Hỏi ${k2} có bao nhiêu ${t}?`,
            correct: ans, wrong: [more ? a - d : a + d, ...around(ans, { min: 0, max: 100 })], min: 0, max: 100,
            explanation: `${more ? 'Nhiều hơn thì cộng' : 'Ít hơn thì trừ'}: ${a} ${more ? '+' : '-'} ${d} = ${ans} (${t}).`,
            steps: [`Số ${t} của ${k2}: ${a} ${more ? '+' : '-'} ${d} = ${ans} (${t})`, `Đáp số: ${ans} ${t}`], hint: `${k2} có ${more ? 'nhiều' : 'ít'} hơn, vậy kết quả phải ${more ? 'lớn' : 'bé'} hơn ${a}.` });
    }),
    tpl('g2.word_more_less', 3, () => {
        const [k1, k2] = shuffle(KIDS), t = pickOne(THINGS), a = rint(20, 60), b = rint(5, a - 5);
        return single({ q: `${k1} có ${a} ${t}, ${k2} có ${b} ${t}. Hỏi ${k1} có nhiều hơn ${k2} bao nhiêu ${t}?`,
            speech: `${k1} có ${a} ${t}, ${k2} có ${b} ${t}. Hỏi ${k1} có nhiều hơn ${k2} bao nhiêu ${t}?`,
            correct: a - b, wrong: [a + b, ...around(a - b, { min: 0, max: 100 })], min: 0, max: 100,
            explanation: `Muốn biết nhiều hơn bao nhiêu, lấy số lớn trừ số bé: ${a} - ${b} = ${a - b} (${t}).`, hint: 'So sánh hơn kém: lấy số lớn trừ số bé.' });
    }),
];

export const generateG2Arithmetic = fromTemplates(templates);
