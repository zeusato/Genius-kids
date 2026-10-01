// Lớp 3 — Cộng, trừ, nhân, chia số lớn (g3_arithmetic): cộng trừ phạm vi 100 000 (nhớ không quá 2 lượt,
// không liên tiếp); nhân, chia số có nhiều chữ số với số có một chữ số.
// Giữ mẫu "a + b = ?" và "a + b + c = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, input, rint, chance } from '../kit';
import { around, carryError } from '../wrongs';
import { fmt } from '../../study/value';
import { columnSteps, mulOperand, mulSteps } from './common';
import type { Template } from '../../study/types';

/** Đếm lượt nhớ / mượn; true nếu ≤ 2 lượt và không liên tiếp. */
function carriesOk(a: number, b: number, op: '+' | '-'): boolean {
    const da = String(a).split('').reverse().map(Number), db = String(b).split('').reverse().map(Number);
    let c = 0, prev = false, n = 0;
    for (let i = 0; i < da.length; i++) {
        const x = da[i] - (op === '-' ? c : 0), y = db[i] ?? 0;
        const now = op === '+' ? x + y + c >= 10 : x < y;
        if (now && prev) return false;
        if (now) n++;
        c = now ? 1 : 0; prev = now;
    }
    return n <= 2;
}
function pair(op: '+' | '-', digits: number): [number, number] {
    for (;;) {
        const a = rint(10 ** (digits - 1), 10 ** digits - 1), b = rint(10 ** (digits - 2), op === '-' ? a - 1 : 10 ** digits - 1 - a);
        if (b > 0 && (op === '-' ? a > b : a + b < 100000) && carriesOk(a, b, op)) return [a, b];
    }
}

export const templates: Template[] = [
    tpl('g3.addsub100000', 1, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = pair(op, 4), r = op === '+' ? a + b : a - b;
        return single({ q: `${fmt(a)} ${op} ${fmt(b)} = ?`, correct: r, wrong: [...carryError(a, b, op), ...around(r, { min: 0, step: chance(0.5) ? 10 : 100 })], min: 0,
            explanation: `Đặt tính thẳng cột, tính từ hàng đơn vị: ${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}.`, steps: columnSteps(a, b, op), hint: 'Nhớ (mượn) 1 sang hàng bên trái khi cần.' });
    }, { weight: 2 }),
    tpl('g3.addsub100000', 2, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = pair(op, 5), r = op === '+' ? a + b : a - b;
        if (chance(0.4)) return input({ q: `Đặt tính rồi tính: ${fmt(a)} ${op} ${fmt(b)}`, visual: { fn: 'columnArithSVG', args: [a, b, op] }, correct: r, explanation: `Đặt tính thẳng cột: ${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}.`, steps: columnSteps(a, b, op) });
        return single({ q: `${fmt(a)} ${op} ${fmt(b)} = ?`, correct: r, wrong: [...carryError(a, b, op), ...around(r, { min: 0, step: chance(0.5) ? 10 : 1000 })], min: 0,
            explanation: `Tính từ hàng đơn vị sang trái: ${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}.`, steps: columnSteps(a, b, op) });
    }),
    tpl('g3.addsub100000', 3, () => {
        if (chance(0.5)) {
            const a = rint(100, 999), b = rint(100, 900), c = chance(0.6) ? 1000 - b : rint(100, 999);
            const r = a + b + c;
            return single({ q: `${fmt(a)} + ${fmt(b)} + ${fmt(c)} = ?`, correct: r, wrong: [a + b, r + 100, r - 100, r + 10], min: 0,
                explanation: b + c === 1000 ? `Tính nhanh: ${b} + ${c} = 1000; ${a} + 1000 = ${fmt(r)}.` : `Cộng lần lượt: ${a} + ${b} = ${a + b}; ${a + b} + ${c} = ${fmt(r)}.`, hint: 'Tìm hai số cộng lại được số tròn trăm, tròn nghìn.' });
        }
        const a = rint(2000, 8000), b = rint(200, 900), c = rint(100, 800);
        const r = a + b - c;
        return single({ q: `Thư viện có ${fmt(a)} quyển sách. Năm nay mua thêm ${fmt(b)} quyển và thanh lí ${fmt(c)} quyển cũ. Hỏi thư viện còn bao nhiêu quyển sách?`, correct: r, wrong: [a + b + c, a - b - c, a + b, r + 100], min: 0,
            explanation: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}; ${fmt(a + b)} - ${fmt(c)} = ${fmt(r)} (quyển).`, steps: [`Sau khi mua thêm: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)} (quyển)`, `Còn lại: ${fmt(a + b)} - ${fmt(c)} = ${fmt(r)} (quyển)`, `Đáp số: ${fmt(r)} quyển sách`] });
    }),
    tpl('g3.muldiv_big', 1, () => {
        const b = rint(2, 5), a = mulOperand(4, b, 2);
        return single({ q: `${fmt(a)} × ${b} = ?`, correct: a * b, wrong: [a * b + 10, a * b - 10, a * b + 1000, ...around(a * b, { min: 0, step: 100 })], min: 0,
            explanation: `Nhân lần lượt từ hàng đơn vị: ${fmt(a)} × ${b} = ${fmt(a * b)}.`, steps: mulSteps(a, b) });
    }),
    tpl('g3.muldiv_big', 2, () => {
        const b = rint(2, 9), q = rint(Math.ceil(1000 / b), Math.floor(99999 / b));
        return single({ q: `${fmt(b * q)} : ${b} = ?`, correct: q, wrong: [q + 10, q - 10, q + 100, Math.floor(q / 10)], min: 0,
            explanation: `Chia lần lượt từ hàng cao nhất: ${fmt(b * q)} : ${b} = ${fmt(q)} (thử lại: ${fmt(q)} × ${b} = ${fmt(b * q)}).`, hint: 'Thử lại bằng phép nhân.' });
    }),
];

export const generateG3Arithmetic = fromTemplates(templates);
