// Lớp 1 — Cộng, trừ không nhớ trong phạm vi 100 (g1_add_sub_100) — MỚI theo GDPT 2018.
import { tpl, fromTemplates, single, input, rint, chance } from '../kit';
import { around, carryError, placeError } from '../wrongs';
import type { Template } from '../../study/types';

/** a, b sao cho a ± b không nhớ / không mượn ở hàng đơn vị và kết quả trong 0..99. */
function noCarry(op: '+' | '-', twoDigitB: boolean): [number, number] {
    for (;;) {
        const a = rint(10, 99), b = twoDigitB ? rint(10, 89) : rint(1, 9);
        const ok = op === '+' ? a % 10 + b % 10 < 10 && a + b <= 99 : a % 10 >= b % 10 && a >= b;
        if (ok) return [a, b];
    }
}
const steps = (a: number, b: number, op: '+' | '-') => {
    const r = op === '+' ? a + b : a - b;
    return [`Hàng đơn vị: ${a % 10} ${op} ${b % 10} = ${op === '+' ? a % 10 + b % 10 : a % 10 - b % 10}`,
        `Hàng chục: ${Math.floor(a / 10)} ${op} ${Math.floor(b / 10)} = ${op === '+' ? Math.floor(a / 10) + Math.floor(b / 10) : Math.floor(a / 10) - Math.floor(b / 10)}`, `Kết quả: ${r}`];
};

export const templates: Template[] = [
    tpl('g1.addsub100', 1, () => {
        const op = chance(0.5) ? '+' : '-', a = rint(1, 9) * 10, b = rint(1, 9) * 10;
        const [x, y] = op === '+' ? (a + b <= 100 ? [a, b] : [Math.max(a, b) - Math.min(a, b), Math.min(a, b)]) : [Math.max(a, b), Math.min(a, b)];
        const r = op === '+' ? x + y : x - y;
        return single({ q: `Tính: ${x} ${op} ${y} = ?`, speech: `${x} ${op === '+' ? 'cộng' : 'trừ'} ${y} bằng mấy?`,
            correct: r, wrong: [...around(r, { step: 10, min: 0, max: 100 }), r + 1, r - 1], min: 0, max: 100,
            explanation: `${x / 10} chục ${op === '+' ? 'cộng' : 'trừ'} ${y / 10} chục là ${r / 10} chục: ${x} ${op} ${y} = ${r}.`, hint: 'Tính với số chục: 3 chục + 4 chục = 7 chục.' });
    }),
    tpl('g1.addsub100', 2, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = noCarry(op, false), r = op === '+' ? a + b : a - b;
        return single({ q: `Tính: ${a} ${op} ${b} = ?`, speech: `${a} ${op === '+' ? 'cộng' : 'trừ'} ${b} bằng mấy?`,
            correct: r, wrong: [...placeError(r).slice(1, 3), ...around(r, { min: 0, max: 99 })], min: 0, max: 99,
            explanation: `Giữ nguyên hàng chục, ${op === '+' ? 'cộng' : 'trừ'} hàng đơn vị: ${a % 10} ${op} ${b} = ${op === '+' ? a % 10 + b : a % 10 - b}. Vậy ${a} ${op} ${b} = ${r}.`,
            hint: 'Số có một chữ số chỉ cộng/trừ vào hàng đơn vị.' });
    }),
    tpl('g1.addsub100', 3, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = noCarry(op, true), r = op === '+' ? a + b : a - b;
        if (chance(0.3)) return input({ q: `Đặt tính rồi tính: ${a} ${op} ${b}`, speech: `Đặt tính rồi tính: ${a} ${op === '+' ? 'cộng' : 'trừ'} ${b}.`, correct: r,
            explanation: `Đặt tính thẳng cột, tính từ hàng đơn vị: ${a} ${op} ${b} = ${r}.`, steps: steps(a, b, op), hint: 'Viết các chữ số cùng hàng thẳng cột, tính từ phải sang trái.' });
        return single({ q: `Tính: ${a} ${op} ${b} = ?`, speech: `${a} ${op === '+' ? 'cộng' : 'trừ'} ${b} bằng mấy?`,
            correct: r, wrong: [...carryError(a, b, op), ...around(r, { min: 0, max: 99, step: chance(0.5) ? 1 : 10 })], min: 0, max: 99,
            explanation: `Đặt tính thẳng cột, tính từ hàng đơn vị: ${a} ${op} ${b} = ${r}.`, steps: steps(a, b, op), hint: 'Tính hàng đơn vị trước, rồi đến hàng chục.' });
    }),
];

export const generateG1AddSub100 = fromTemplates(templates);
