// Lớp 2 — Cộng, trừ không nhớ trong phạm vi 100 (g2_add_sub_no_carry).
// Giữ mẫu "Tính: a + b = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, input, rint, chance } from '../kit';
import { around, carryError, swapDigits } from '../wrongs';
import { columnSteps, noCarry, say } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g2.addsub100_nc', 1, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = noCarry(op, [20, 89], [11, 69]), r = op === '+' ? a + b : a - b;
        return single({ q: `${a} ${op} ${b} = ?`, speech: say(a, op, b), correct: r, wrong: [...carryError(a, b, op), ...swapDigits(r), ...around(r, { min: 0, max: 100 })], min: 0, max: 100,
            explanation: `Tính hàng đơn vị rồi hàng chục: ${a} ${op} ${b} = ${r}.`, steps: columnSteps(a, b, op), hint: 'Cộng (trừ) đơn vị với đơn vị, chục với chục.' });
    }, { weight: 2 }),
    tpl('g2.addsub100_nc', 2, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = noCarry(op, [20, 89], [11, 69]), r = op === '+' ? a + b : a - b;
        if (chance(0.5)) return input({ q: `Đặt tính rồi tính: ${a} ${op} ${b}`, speech: `Đặt tính rồi tính ${a} ${op === '+' ? 'cộng' : 'trừ'} ${b}.`, visual: { fn: 'columnArithSVG', args: [a, b, op] }, correct: r,
            explanation: `Viết các chữ số cùng hàng thẳng cột: ${a} ${op} ${b} = ${r}.`, steps: columnSteps(a, b, op), hint: 'Tính từ phải sang trái: hàng đơn vị trước.' });
        const front = chance(0.5);
        return input({ q: front ? `Điền số: ? ${op} ${b} = ${r}` : `Điền số: ${a} ${op} ? = ${r}`, speech: front ? `Số nào ${op === '+' ? 'cộng' : 'trừ'} ${b} bằng ${r}?` : `${a} ${op === '+' ? 'cộng' : 'trừ'} số nào bằng ${r}?`, correct: front ? a : b,
            explanation: front ? (op === '+' ? `${r} - ${b} = ${a}` : `${r} + ${b} = ${a}`) + `, nên số cần điền là ${a}.` : (op === '+' ? `${r} - ${a} = ${b}` : `${a} - ${r} = ${b}`) + `, nên số cần điền là ${b}.`,
            hint: op === '+' ? 'Muốn tìm số hạng, lấy tổng trừ số hạng kia.' : front ? 'Muốn tìm số bị trừ, lấy hiệu cộng số trừ.' : 'Muốn tìm số trừ, lấy số bị trừ trừ đi hiệu.' });
    }),
];

export const generateG2AddSubNoCarry = fromTemplates(templates);
