// Lớp 4 — Phép nhân (g4_multiplication): nhân với số có một, hai chữ số; nhân với 10, 100, 1000;
// tính chất giao hoán, kết hợp, nhân một số với một tổng / hiệu.
// Giữ mẫu "Tính nhanh: a × b = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, input, rint, pickOne, chance } from '../kit';
import { generateWrongAnswersWithSameUnits as sameUnits } from '../distractors';
import { fmt } from '../../study/value';
import { mulSteps } from '../grade3/common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g4.mul', 1, () => {
        const a = rint(1000, 99999), b = rint(2, 9);
        return single({ q: `${fmt(a)} × ${b} = ?`, correct: a * b, wrong: sameUnits(a * b, 4, 1000), step: 10, min: 0,
            explanation: `Nhân lần lượt từ hàng đơn vị, nhớ sang hàng bên trái: ${fmt(a)} × ${b} = ${fmt(a * b)}.`, steps: mulSteps(a, b) });
    }),
    tpl('g4.mul', 2, () => {
        const a = rint(100, 999), b = rint(11, 99), p1 = a * (b % 10), p2 = a * Math.floor(b / 10);
        return single({ q: `${fmt(a)} × ${b} = ?`, correct: a * b, wrong: [p1 + p2, p1 + p2 * 100, ...sameUnits(a * b, 3, 1000)], step: 10, min: 0,
            explanation: `${fmt(a)} × ${b % 10} = ${fmt(p1)}; ${fmt(a)} × ${Math.floor(b / 10)} chục = ${fmt(p2 * 10)}; cộng lại ${fmt(a * b)}.`,
            steps: [`Tích riêng thứ nhất: ${fmt(a)} × ${b % 10} = ${fmt(p1)}`, `Tích riêng thứ hai: ${fmt(a)} × ${Math.floor(b / 10)} = ${fmt(p2)} (viết lùi sang trái một cột)`, `Cộng: ${fmt(p1)} + ${fmt(p2 * 10)} = ${fmt(a * b)}`],
            hint: 'Tích riêng thứ hai viết lùi sang trái một cột.' });
    }),
    tpl('g4.mul', 3, () => {
        const n = rint(12, 48), per = rint(15, 60);
        return single({ q: `Mỗi hộp có ${per} cái bút. Hỏi ${n} hộp như thế có bao nhiêu cái bút?`, correct: n * per, wrong: [n + per, ...sameUnits(n * per, 3, 100)], step: 10, min: 0,
            explanation: `${per} × ${n} = ${fmt(n * per)} (cái bút).`, steps: [`Số bút: ${per} × ${n} = ${fmt(n * per)} (cái)`, `Đáp số: ${fmt(n * per)} cái bút`] });
    }),
    tpl('g4.mul10', 1, () => {
        const a = rint(12, 9999), k = pickOne([10, 100, 1000]);
        return single({ q: `${fmt(a)} × ${fmt(k)} = ?`, correct: a * k, wrong: [a * k * 10, a * k / 10, a + k], min: 0,
            explanation: `Nhân với ${fmt(k)}: viết thêm ${String(k).length - 1} chữ số 0 vào bên phải: ${fmt(a * k)}.`, hint: `Nhân với ${fmt(k)} thì thêm ${String(k).length - 1} chữ số 0.` });
    }),
    tpl('g4.mul10', 2, () => {
        const a = rint(12, 99), b = rint(2, 9) * pickOne([10, 100]);
        return single({ q: `Tính nhanh: ${a} × ${b} = ?`, correct: a * b, wrong: [a * b * 10, a * b / 10, a * (b / 10) + 10], min: 0,
            explanation: `${a} × ${b} = ${a} × ${b / (b % 100 === 0 ? 100 : 10)} × ${b % 100 === 0 ? 100 : 10} = ${a * b / (b % 100 === 0 ? 100 : 10)} × ${b % 100 === 0 ? 100 : 10} = ${fmt(a * b)}.`, hint: 'Nhân với số tròn chục: nhân phần khác 0 rồi thêm chữ số 0.' });
    }),
    tpl('g4.properties_mul', 2, () => {
        const pair = pickOne([[25, 4], [50, 2], [125, 8], [20, 5], [250, 4]]), x = rint(12, 99);
        return single({ q: `Tính nhanh: ${pair[0]} × ${x} × ${pair[1]} = ?`, correct: pair[0] * pair[1] * x, wrong: [pair[0] * x + pair[1], ...sameUnits(pair[0] * pair[1] * x, 3, 100)], min: 0,
            explanation: `Đổi chỗ, nhóm: (${pair[0]} × ${pair[1]}) × ${x} = ${pair[0] * pair[1]} × ${x} = ${fmt(pair[0] * pair[1] * x)}.`, hint: `${pair[0]} × ${pair[1]} = ${pair[0] * pair[1]}.` });
    }),
    tpl('g4.properties_mul', 3, () => {
        const a = rint(12, 99), b = rint(11, 60), c = rint(11, 60), plus = chance(0.5);
        const [x, y] = plus ? [b, c] : [Math.max(b, c) + 10, Math.min(b, c)];
        const r = plus ? a * (x + y) : a * (x - y);
        if (chance(0.4)) return input({ q: `Tính bằng cách thuận tiện: ${a} × ${x} ${plus ? '+' : '-'} ${a} × ${y}`, correct: r, explanation: `${a} × ${x} ${plus ? '+' : '-'} ${a} × ${y} = ${a} × (${x} ${plus ? '+' : '-'} ${y}) = ${a} × ${plus ? x + y : x - y} = ${fmt(r)}.`, hint: 'Nhân một số với một tổng (hiệu).' });
        // SGK: đưa a × x ± a × y về a × (x ± y) cho dễ tính, không làm ngược lại
        return single({ q: `Tính nhanh: ${a} × ${x} ${plus ? '+' : '-'} ${a} × ${y} = ?`, correct: r, wrong: [a * x + (plus ? y : -y), plus ? a * x - a * y : a * x + a * y, ...sameUnits(r, 2, 100)], min: 0,
            explanation: `Nhân một số với một ${plus ? 'tổng' : 'hiệu'}: ${a} × ${x} ${plus ? '+' : '-'} ${a} × ${y} = ${a} × (${x} ${plus ? '+' : '-'} ${y}) = ${a} × ${plus ? x + y : x - y} = ${fmt(r)}.`, hint: `Cả hai tích đều có thừa số ${a}.` });
    }),
];

export const generateMultiplication = fromTemplates(templates);
