// Lớp 1 — Phép cộng trong phạm vi 10 (g1_addition_10).
// Giữ dạng chữ "Tính: a + b = ?" vì MathRacing lọc câu theo mẫu này.
import { tpl, fromTemplates, single, compare, input, rint, pickOne, chance } from '../kit';
import { around, opError } from '../wrongs';
import { THINGS, word } from './common';
import type { Template } from '../../study/types';

const pair = (minSum: number, maxSum: number) => { const s = rint(minSum, maxSum), a = rint(0, s); return [a, s - a]; };

export const templates: Template[] = [
    tpl('g1.add10', 1, () => {
        const t = pickOne(THINGS), sum = rint(2, 10), x = rint(1, sum - 1), y = sum - x;
        return single({ q: `Tính: ${x} + ${y} = ?`, speech: `Có ${word(x)} ${t.name}, thêm ${word(y)} ${t.name}. ${word(x)} cộng ${word(y)} bằng mấy?`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t.e, n: x, label: String(x) }, { emoji: t.e, n: y, label: String(y) }]] },
            correct: x + y, wrong: [...around(x + y, { min: 0, max: 10 }), ...opError(x, y, '+')], min: 0, max: 10,
            explanation: `${word(x)} thêm ${word(y)} là ${word(x + y)}: ${x} + ${y} = ${x + y}.`, hint: `Đếm tiếp từ ${x} thêm ${y} nữa.` });
    }, { weight: 2 }),
    tpl('g1.add10', 2, () => {
        const [a, b] = pair(5, 10);
        return single({ q: `Tính: ${a} + ${b} = ?`, speech: `${a} cộng ${b} bằng mấy?`,
            correct: a + b, wrong: [...around(a + b, { min: 0, max: 10 }), ...opError(a, b, '+')], min: 0, max: 10,
            explanation: `Đếm thêm ${b} từ ${a}: ${a} + ${b} = ${a + b}.`, hint: 'Đếm thêm từ số lớn hơn sẽ nhanh hơn.' });
    }, { weight: 2 }),
    tpl('g1.add10_missing', 2, () => {
        const [a, b] = pair(3, 10), front = chance(0.5);
        const q = front ? `□ + ${b} = ${a + b}` : `${a} + □ = ${a + b}`;
        const ans = front ? a : b;
        return chance(0.5)
            ? single({ q: `Số nào điền vào ô trống: ${q}`, speech: `Số nào điền vào ô trống: ${q.replace('□', 'ô trống').replace('+', 'cộng').replace('=', 'bằng')}`,
                correct: ans, wrong: [...around(ans, { min: 0, max: 10 }), a + b], min: 0, max: 10,
                explanation: `Vì ${a} + ${b} = ${a + b} nên số cần điền là ${ans}.`, hint: `Đếm thêm từ ${front ? b : a} cho tới ${a + b}.` })
            : input({ q: `Điền số vào ô trống: ${q}`, speech: `Điền số vào ô trống: ${q.replace('□', 'ô trống').replace('+', 'cộng').replace('=', 'bằng')}`,
                correct: ans, explanation: `Vì ${a} + ${b} = ${a + b} nên số cần điền là ${ans}.`, hint: `Đếm thêm từ ${front ? b : a} cho tới ${a + b}.` });
    }),
    tpl('g1.add10_compare', 2, () => {
        const [a, b] = pair(2, 10), c = rint(0, 10);
        return compare({ q: `Điền dấu thích hợp: ${a} + ${b} ... ${c}`, speech: `So sánh ${a} cộng ${b} với ${c}.`, left: a + b, right: c,
            explanation: `${a} + ${b} = ${a + b}, mà ${a + b} ${a + b > c ? '>' : a + b < c ? '<' : '='} ${c}.`, hint: 'Tính tổng trước rồi mới so sánh.' });
    }),
    tpl('g1.add10_compare', 3, () => {
        const [a, b] = pair(2, 10), [c, d] = pair(2, 10);
        return compare({ q: `Điền dấu thích hợp: ${a} + ${b} ... ${c} + ${d}`, speech: `So sánh ${a} cộng ${b} với ${c} cộng ${d}.`, left: a + b, right: c + d,
            explanation: `${a} + ${b} = ${a + b}; ${c} + ${d} = ${c + d}; nên ${a + b} ${a + b > c + d ? '>' : a + b < c + d ? '<' : '='} ${c + d}.`, hint: 'Tính từng vế rồi so sánh hai kết quả.' });
    }),
];

export const generateAddition10 = fromTemplates(templates);
