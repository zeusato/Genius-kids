// Lớp 3 — Biểu thức số (g3_expressions) — MỚI: thứ tự thực hiện, dấu ngoặc; tìm thừa số, số bị chia, số chia.
import { tpl, fromTemplates, single, input, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import { TABLES } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    // Chỉ có cộng, trừ: tính từ trái sang phải.
    tpl('g3.expression', 1, () => {
        const plusFirst = chance(0.5);
        let a: number, b: number, c: number, s1: number, res: number;
        if (plusFirst) { a = rint(100, 500); b = rint(20, 300); c = rint(10, a + b - 1); s1 = a + b; res = s1 - c; }
        else { a = rint(200, 600); b = rint(20, a - 50); c = rint(10, 300); s1 = a - b; res = s1 + c; }
        const [o1, o2] = plusFirst ? ['+', '-'] : ['-', '+'];
        const naive = plusFirst ? a + b + c : Math.max(0, a - (b + c)); // nhầm dấu / nhầm thứ tự
        return single({ q: `Tính giá trị biểu thức: ${a} ${o1} ${b} ${o2} ${c}`, correct: res, wrong: [naive, s1, ...around(res, { step: 10, min: 0 })], min: 0,
            explanation: `Biểu thức chỉ có cộng, trừ: tính lần lượt từ trái sang phải. ${a} ${o1} ${b} = ${s1}; ${s1} ${o2} ${c} = ${res}.`,
            steps: [`${a} ${o1} ${b} = ${s1}`, `${s1} ${o2} ${c} = ${res}`], hint: 'Chỉ có cộng, trừ thì tính từ trái sang phải.' });
    }),
    // Có nhân và cộng/trừ: nhân trước.
    tpl('g3.expression', 2, () => {
        const b = pickOne(TABLES), c = rint(2, 9), plus = chance(0.5);
        const a = plus ? rint(10, 99) : rint(b * c + 5, b * c + 90);
        const res = plus ? a + b * c : a - b * c;
        const wrongOrder = plus ? (a + b) * c : (a - b) * c;
        return single({ q: `Tính giá trị biểu thức: ${a} ${plus ? '+' : '-'} ${b} × ${c}`, correct: res, wrong: [wrongOrder, ...around(res, { min: 0 })], min: 0,
            explanation: `Biểu thức có nhân và ${plus ? 'cộng' : 'trừ'}: nhân trước. ${b} × ${c} = ${b * c}; ${a} ${plus ? '+' : '-'} ${b * c} = ${res}.`,
            steps: [`${b} × ${c} = ${b * c}`, `${a} ${plus ? '+' : '-'} ${b * c} = ${res}`], hint: 'Làm phép nhân (chia) trước, cộng (trừ) sau.' });
    }, { weight: 2 }),
    // Có dấu ngoặc: trong ngoặc trước.
    tpl('g3.expression', 3, () => {
        const c = pickOne([2, 3, 4, 5]), plus = chance(0.5), a = rint(10, 40), b = plus ? rint(2, 30) : rint(2, a - 1);
        const inner = plus ? a + b : a - b, res = inner * c;
        const noParen = plus ? a + b * c : a - b * c;
        return single({ q: `Tính giá trị biểu thức: (${a} ${plus ? '+' : '-'} ${b}) × ${c}`, correct: res, wrong: [noParen >= 0 ? noParen : res + c, ...around(res, { min: 0 })], min: 0,
            explanation: `Biểu thức có ngoặc: tính trong ngoặc trước. ${a} ${plus ? '+' : '-'} ${b} = ${inner}; ${inner} × ${c} = ${res}.`,
            steps: [`${a} ${plus ? '+' : '-'} ${b} = ${inner}`, `${inner} × ${c} = ${res}`], hint: 'Có dấu ngoặc thì làm trong ngoặc trước.' });
    }),
    tpl('g3.missing', 2, () => {
        const b = pickOne(TABLES), q = rint(2, 10), kind = rint(0, 2);
        if (kind === 0) return input({ q: `Tìm thừa số: ? × ${b} = ${b * q}`, correct: q, explanation: `Muốn tìm thừa số, lấy tích chia cho thừa số kia: ${b * q} : ${b} = ${q}.`, hint: 'Lấy tích chia cho thừa số đã biết.' });
        if (kind === 1) return input({ q: `Tìm số bị chia: ? : ${b} = ${q}`, correct: b * q, explanation: `Muốn tìm số bị chia, lấy thương nhân với số chia: ${q} × ${b} = ${b * q}.`, hint: 'Lấy thương nhân với số chia.' });
        return input({ q: `Tìm số chia: ${b * q} : ? = ${q}`, correct: b, explanation: `Muốn tìm số chia, lấy số bị chia chia cho thương: ${b * q} : ${q} = ${b}.`, hint: 'Lấy số bị chia chia cho thương.' });
    }),
];

export const generateG3Expressions = fromTemplates(templates);
