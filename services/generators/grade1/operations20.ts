// Lớp 1 — Cộng, trừ trong phạm vi 20 (g1_operations_20).
// Lớp 1 học KHÔNG qua 10 (12 + 5, 17 - 4); phép qua 10 (7 + 8, 13 - 5) là "Nâng cao" (thuộc Lớp 2).
// Giữ mẫu "Tính: a + b = ?" vì MathRacing lọc câu theo mẫu này.
import { tpl, fromTemplates, single, rint, chance } from '../kit';
import { around, carryError } from '../wrongs';
import type { Template } from '../../study/types';

const say = (a: number, op: string, b: number) => `${a} ${op === '+' ? 'cộng' : 'trừ'} ${b} bằng mấy?`;

export const templates: Template[] = [
    tpl('g1.addsub20', 1, () => {
        if (chance(0.5)) { const a = rint(10, 18), b = rint(1, 9 - (a - 10)); return single({ q: `Tính: ${a} + ${b} = ?`, speech: say(a, '+', b), correct: a + b, wrong: [...carryError(a, b, '+'), ...around(a + b, { min: 10, max: 20 })], min: 0, max: 20, explanation: `Lấy ${a % 10} + ${b} = ${a % 10 + b}, giữ 1 chục: ${a} + ${b} = ${a + b}.`, hint: 'Cộng hàng đơn vị, giữ nguyên 1 chục.' }); }
        const a = rint(11, 19), b = rint(1, a - 10); return single({ q: `Tính: ${a} - ${b} = ?`, speech: say(a, '-', b), correct: a - b, wrong: [...around(a - b, { min: 10, max: 20 }), a + b - 10], min: 0, max: 20, explanation: `Lấy ${a % 10} - ${b} = ${a % 10 - b}, giữ 1 chục: ${a} - ${b} = ${a - b}.`, hint: 'Trừ ở hàng đơn vị, giữ nguyên 1 chục.' });
    }, { weight: 2 }),
    tpl('g1.addsub20', 2, () => {
        if (chance(0.5)) { const a = rint(11, 19), b = rint(11, a); return single({ q: `Tính: ${a} - ${b} = ?`, speech: say(a, '-', b), correct: a - b, wrong: [...around(a - b, { min: 0, max: 20 }), a - b + 10], min: 0, max: 20, explanation: `${a} - ${b} = ${a - b} (1 chục trừ 1 chục hết, còn ${a % 10} - ${b % 10}).` }); }
        const b = rint(1, 9), a = 10 + rint(0, 9 - b); return single({ q: `Tính: ${b} + ${a} = ?`, speech: say(b, '+', a), correct: a + b, wrong: [...around(a + b, { min: 10, max: 20 }), a + b - 10], min: 0, max: 20, explanation: `Đổi chỗ: ${a} + ${b} = ${a + b}.`, hint: 'Đổi chỗ hai số hạng, tổng không đổi.' });
    }),
    tpl('g1.carry20', 2, () => {
        if (chance(0.5)) { const a = rint(2, 9), b = rint(11 - a, 9); return single({ q: `Tính: ${a} + ${b} = ?`, speech: say(a, '+', b), correct: a + b, wrong: [...carryError(a, b, '+'), ...around(a + b, { min: 10, max: 20 })], min: 0, max: 20, explanation: `Tách ${b} = ${10 - a} + ${b - (10 - a)}: ${a} + ${10 - a} = 10; 10 + ${b - (10 - a)} = ${a + b}.`, steps: [`${a} + ${10 - a} = 10`, `10 + ${b - (10 - a)} = ${a + b}`], hint: `Gộp cho đủ 10 trước.` }); }
        const a = rint(11, 18), b = rint(a - 9, 9); return single({ q: `Tính: ${a} - ${b} = ?`, speech: say(a, '-', b), correct: a - b, wrong: [...carryError(a, b, '-'), ...around(a - b, { min: 0, max: 20 })], min: 0, max: 20, explanation: `Tách ${b} = ${a - 10} + ${b - (a - 10)}: ${a} - ${a - 10} = 10; 10 - ${b - (a - 10)} = ${a - b}.`, steps: [`${a} - ${a - 10} = 10`, `10 - ${b - (a - 10)} = ${a - b}`], hint: 'Trừ về 10 trước.' });
    }),
];

export const generateOperations20 = fromTemplates(templates);
