// Lớp 1 — Các số từ 11 đến 20 (g1_numbers_20): chục và đơn vị, đọc, so sánh.
import { tpl, fromTemplates, single, compare, choices, rint, shuffle } from '../kit';
import { around } from '../wrongs';
import { word } from './common';
import type { Template } from '../../study/types';

const cd = (c: number, d: number) => `${c} chục ${d} đơn vị`;

export const templates: Template[] = [
    tpl('g1.numbers20', 1, () => {
        const u = rint(0, 9), n = 10 + u;
        return single({ q: 'Có tất cả bao nhiêu que tính?', speech: 'Có một bó một chục que tính và một số que rời. Có tất cả bao nhiêu que tính?',
            visual: { fn: 'tensOnesSVG', args: [1, u] }, correct: n, wrong: around(n, { min: 10, max: 20 }), min: 10, max: 20,
            explanation: `1 bó là 1 chục (10 que) và ${u} que rời: ${n} que tính.` });
    }),
    tpl('g1.numbers20', 1, () => {
        const u = rint(1, 9), n = 10 + u;
        const opts = shuffle([cd(1, u), cd(1, (u + 1) % 10), cd(u === 1 ? 2 : 1, u === 1 ? 0 : u - 1), cd(0, u)]);
        return choices({ q: `Số ${n} gồm mấy chục và mấy đơn vị?`, speech: `Số ${word(n)} gồm mấy chục và mấy đơn vị?`,
            options: [...new Set(opts)], correct: cd(1, u), explanation: `${n} gồm 1 chục và ${u} đơn vị.` });
    }),
    tpl('g1.numbers20', 2, () => {
        const a = rint(10, 20), b = rint(10, 20);
        return compare({ q: `Điền dấu thích hợp: ${a} ... ${b}`, speech: `So sánh ${a} và ${b}.`, left: a, right: b,
            explanation: a === b ? `Hai số bằng nhau nên điền dấu =: ${a} = ${b}.` : a === 20 || b === 20 ? `20 có 2 chục nên lớn hơn ${Math.min(a, b)}: ${a} ${a > b ? '>' : '<'} ${b}.` : `Cùng có 1 chục; so sánh hàng đơn vị ${a % 10} và ${b % 10}: ${a} ${a > b ? '>' : '<'} ${b}.`, hint: 'So sánh số chục trước, rồi đến số đơn vị.' });
    }),
    tpl('g1.numbers20', 2, () => {
        const n = rint(11, 19), after = rint(0, 1) === 1, ans = after ? n + 1 : n - 1;
        return single({ q: `Số liền ${after ? 'sau' : 'trước'} của ${n} là số nào?`, speech: `Số liền ${after ? 'sau' : 'trước'} của ${word(n)} là số nào?`,
            correct: ans, wrong: around(ans, { min: 10, max: 20 }), min: 10, max: 20, explanation: `${after ? 'Thêm' : 'Bớt'} 1: ${n} ${after ? '+' : '-'} 1 = ${ans}.` });
    }),
];

export const generateNumbers20 = fromTemplates(templates);
