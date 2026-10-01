// Lớp 5 — Biểu thức có dấu ngoặc (g5_parentheses), số lớn và số thập phân. Dấu chia viết ":".
import { tpl, fromTemplates, single, compare, input, rint, chance } from '../kit';
import { generateWrongAnswersWithSameUnits as sameUnits } from '../distractors';
import { fmt } from '../../study/value';
import { dec, fix, fd } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g5.expr', 2, () => {
        const kind = rint(0, 2);
        if (kind === 0) { const a = rint(1000, 9000), b = rint(100, 900), c = rint(2, 9), r = (a + b) * c; return single({ q: `(${fmt(a)} + ${fmt(b)}) × ${c} = ?`, correct: r, wrong: [a + b * c, a * c + b, ...sameUnits(r, 2, 1000)], min: 0, explanation: `Trong ngoặc trước: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}; ${fmt(a + b)} × ${c} = ${fmt(r)}.`, steps: [`${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`, `${fmt(a + b)} × ${c} = ${fmt(r)}`] }); }
        if (kind === 1) { const c = rint(2, 9), q = rint(200, 2000), b = rint(100, 1000), a = q * c + b, r = (a - b) / c; return single({ q: `(${fmt(a)} - ${fmt(b)}) : ${c} = ?`, correct: r, wrong: [r + 10, r - 10, r * c, r + 100], min: 0, explanation: `${fmt(a)} - ${fmt(b)} = ${fmt(a - b)}; ${fmt(a - b)} : ${c} = ${fmt(r)}.`, steps: [`${fmt(a)} - ${fmt(b)} = ${fmt(a - b)}`, `${fmt(a - b)} : ${c} = ${fmt(r)}`] }); }
        const a = dec(1, 20, 1), b = dec(1, 20, 1), c = rint(2, 9), r = fix((a + b) * c);
        return single({ q: `(${fd(a)} + ${fd(b)}) × ${c} = ?`, correct: r, wrong: [fix(a + b * c), fix(r * 10), fix(r + 0.1 * c)], step: 0.1, min: 0, explanation: `${fd(a)} + ${fd(b)} = ${fd(fix(a + b))}; ${fd(fix(a + b))} × ${c} = ${fd(r)}.` });
    }, { decimal: true, weight: 2 }),
    tpl('g5.expr', 3, () => {
        if (chance(0.5)) {
            const a = rint(100, 900), b = rint(10, 99), c = rint(2, 9), total = (a + b) * c;
            return input({ q: `Tìm số thích hợp: (? + ${b}) × ${c} = ${fmt(total)}`, correct: a, explanation: `? + ${b} = ${fmt(total)} : ${c} = ${a + b}; ? = ${a + b} - ${b} = ${a}.`, steps: [`? + ${b} = ${fmt(total)} : ${c} = ${a + b}`, `? = ${a + b} - ${b} = ${a}`], hint: 'Tìm giá trị trong ngoặc trước.' });
        }
        const a = rint(10, 99), b = rint(10, 99), c = rint(2, 9);
        return compare({ q: `Điền dấu >, <, =: ${a} × ${c} + ${b} × ${c} ... (${a} + ${b}) × ${c}`, left: a * c + b * c, right: (a + b) * c,
            explanation: `Nhân một tổng với một số: (${a} + ${b}) × ${c} = ${a} × ${c} + ${b} × ${c}, nên điền dấu =.`, hint: 'Nhớ tính chất nhân một tổng với một số.' });
    }),
];

export const generateG5Parentheses = fromTemplates(templates);
