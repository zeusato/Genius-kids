// Lớp 2 — Cộng, trừ có nhớ trong phạm vi 100 (g2_add_sub_carry); tính có hai dấu phép tính.
// Giữ mẫu "Tính: a + b = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, input, rint, chance } from '../kit';
import { around, carryError } from '../wrongs';
import { columnSteps, withCarry, say } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g2.addsub100_c', 1, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = op === '+' ? withCarry('+', [11, 89], [2, 9]) : withCarry('-', [21, 99], [2, 9]), r = op === '+' ? a + b : a - b;
        return single({ q: `${a} ${op} ${b} = ?`, speech: say(a, op, b), correct: r, wrong: [...carryError(a, b, op), ...around(r, { min: 0, max: 100 })], min: 0, max: 100,
            explanation: op === '+' ? `${a % 10} + ${b} = ${a % 10 + b}, viết ${(a % 10 + b) % 10} nhớ 1 sang hàng chục: ${a} + ${b} = ${r}.` : `${a % 10} không trừ được ${b}, mượn 1 chục: ${a % 10 + 10} - ${b} = ${a % 10 + 10 - b}; hàng chục còn ${Math.floor(a / 10) - 1}. Vậy ${a} - ${b} = ${r}.`,
            hint: op === '+' ? 'Hàng đơn vị cộng được từ 10 trở lên thì nhớ 1 sang hàng chục.' : 'Hàng đơn vị không trừ được thì mượn 1 chục.' });
    }),
    tpl('g2.addsub100_c', 2, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = op === '+' ? withCarry('+', [11, 79], [11, 69]) : withCarry('-', [31, 99], [11, 69]), r = op === '+' ? a + b : a - b;
        return single({ q: `${a} ${op} ${b} = ?`, speech: say(a, op, b), correct: r, wrong: [...carryError(a, b, op), ...around(r, { min: 0, max: 100 })], min: 0, max: 100,
            explanation: `Đặt tính thẳng cột, tính từ hàng đơn vị, nhớ (mượn) 1 khi cần: ${a} ${op} ${b} = ${r}.`, steps: columnSteps(a, b, op), hint: 'Đừng quên số nhớ ở hàng chục.' });
    }, { weight: 2 }),
    tpl('g2.addsub100_c', 3, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = op === '+' ? withCarry('+', [11, 79], [11, 69]) : withCarry('-', [31, 99], [11, 69]), r = op === '+' ? a + b : a - b;
        return input({ q: `Đặt tính rồi tính: ${a} ${op} ${b}`, speech: `Đặt tính rồi tính ${a} ${op === '+' ? 'cộng' : 'trừ'} ${b}.`, visual: { fn: 'columnArithSVG', args: [a, b, op] }, correct: r,
            explanation: `${a} ${op} ${b} = ${r} (có ${op === '+' ? 'nhớ' : 'mượn'} ở hàng đơn vị).`, steps: columnSteps(a, b, op), hint: 'Viết các chữ số cùng hàng thẳng cột.' });
    }),
    tpl('g2.chain', 2, () => {
        let x = 0, y = 0, z = 0, o1 = '+', o2 = '-', s1 = 0, r = 0;
        do {
            o1 = chance(0.5) ? '+' : '-'; o2 = chance(0.5) ? '+' : '-';
            x = rint(20, 80); y = rint(5, 40); z = rint(5, 40);
            s1 = o1 === '+' ? x + y : x - y; r = o2 === '+' ? s1 + z : s1 - z;
        } while (s1 < 0 || s1 > 100 || r < 0 || r > 100);
        return single({ q: `Tính: ${x} ${o1} ${y} ${o2} ${z} = ?`, speech: `${x} ${o1 === '+' ? 'cộng' : 'trừ'} ${y} ${o2 === '+' ? 'cộng' : 'trừ'} ${z} bằng bao nhiêu?`,
            correct: r, wrong: [s1, ...around(r, { min: 0, max: 100, step: chance(0.5) ? 1 : 10 })], min: 0, max: 100,
            explanation: `Tính từ trái sang phải: ${x} ${o1} ${y} = ${s1}; ${s1} ${o2} ${z} = ${r}.`, steps: [`${x} ${o1} ${y} = ${s1}`, `${s1} ${o2} ${z} = ${r}`], hint: 'Tính lần lượt từ trái sang phải.' });
    }),
];

export const generateG2AddSubCarry = fromTemplates(templates);
