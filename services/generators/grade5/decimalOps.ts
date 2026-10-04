// Lớp 5 — Phép tính với số thập phân (g5_decimal_ops): cộng, trừ, nhân, chia; nhân/chia với 10, 100, 1000; 0,1; 0,01.
// Giữ mẫu "a,b + c,d = ?", "a,b × n = ?", "a,b : c,d = ?" (MathRacing lọc theo mẫu này). Tính chính xác bằng số nguyên.
import { tpl, fromTemplates, single, input, rint, pickOne, chance } from '../kit';
import { fmt } from '../../study/value';
import { dec, decStrict, fix, fd } from './common';
import type { Template } from '../../study/types';

const dWrong = (r: number, step: number) => [fix(r + step), fix(r - step), fix(r * 10), fix(r / 10), fix(r + step * 10)];

export const templates: Template[] = [
    tpl('g5.dec_addsub', 1, () => {
        const plus = chance(0.5), a = dec(1, 99, rint(1, 2)), b = dec(0.1, plus ? 99 : a - 0.01, rint(1, 2)), r = fix(plus ? a + b : a - b);
        return single({ q: `${fd(a)} ${plus ? '+' : '-'} ${fd(b)} = ?`, correct: r, wrong: dWrong(r, 0.1), step: 0.1, min: 0,
            explanation: `Viết các chữ số cùng hàng thẳng cột (dấu phẩy thẳng dấu phẩy), ${plus ? 'cộng' : 'trừ'} như số tự nhiên rồi đặt dấu phẩy: ${fd(a)} ${plus ? '+' : '-'} ${fd(b)} = ${fd(r)}.`,
            hint: 'Đặt dấu phẩy thẳng cột với dấu phẩy.' });
    }, { decimal: true, weight: 2 }),
    tpl('g5.dec_addsub', 2, () => {
        const a = dec(10, 500, 2), b = dec(1, 99, 1), c = dec(1, 50, 2), r = fix(a + b - c);
        if (r < 0) return single({ q: `${fd(a)} + ${fd(b)} = ?`, correct: fix(a + b), wrong: dWrong(fix(a + b), 0.1), step: 0.01, min: 0, explanation: `${fd(a)} + ${fd(b)} = ${fd(fix(a + b))}.` });
        return single({ q: `${fd(a)} + ${fd(b)} - ${fd(c)} = ?`, correct: r, wrong: [fix(a + b + c), fix(a - b - c) > 0 ? fix(a - b - c) : fix(r + 1), ...dWrong(r, 0.1)], step: 0.01, min: 0,
            explanation: `Tính từ trái sang phải: ${fd(a)} + ${fd(b)} = ${fd(fix(a + b))}; ${fd(fix(a + b))} - ${fd(c)} = ${fd(r)}.`, steps: [`${fd(a)} + ${fd(b)} = ${fd(fix(a + b))}`, `${fd(fix(a + b))} - ${fd(c)} = ${fd(r)}`] });
    }, { decimal: true }),
    tpl('g5.dec_mul', 1, () => {
        const a = decStrict(1, 99, 1), n = rint(2, 9), r = fix(a * n);
        return single({ q: `${fd(a)} × ${n} = ?`, correct: r, wrong: [fix(r * 10), fix(r / 10), fix(r + n), fix(r - 0.1)], step: 0.1, min: 0,
            explanation: `Nhân như số tự nhiên rồi đếm 1 chữ số ở phần thập phân để đặt dấu phẩy: ${fd(a)} × ${n} = ${fd(r)}.`, hint: 'Đếm số chữ số ở phần thập phân của thừa số.' });
    }, { decimal: true, weight: 2 }),
    tpl('g5.dec_mul', 2, () => {
        const a = decStrict(1, 20, 1), b = decStrict(0.1, 9.9, 1), r = fix(a * b, 2);
        const ia = Math.round(a * 10), ib = Math.round(b * 10);
        return single({ q: `${fd(a)} × ${fd(b)} = ?`, correct: r, wrong: [fix(r * 10, 2), fix(r / 10, 3), fix(r + 0.1, 2), fix(a * b * 100, 2)], step: 0.01, min: 0,
            explanation: `Nhân như số tự nhiên: ${fmt(ia)} × ${fmt(ib)} = ${fmt(ia * ib)}; hai thừa số có tất cả 2 chữ số ở phần thập phân, nên ${fd(a)} × ${fd(b)} = ${fd(r)}.`, hint: 'Đếm tổng số chữ số ở phần thập phân của cả hai thừa số.' });
    }, { decimal: true }),
    tpl('g5.dec_div', 1, () => {
        const n = rint(2, 9), tenth = pickOne([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => d * n % 10 !== 0));
        const q = (rint(1, 49) * 10 + tenth) / 10, a = fix(q * n);
        return single({ q: `${fd(a)} : ${n} = ?`, correct: q, wrong: [fix(q * 10), fix(q / 10), fix(q + 0.1), fix(q - 0.1)], step: 0.1, min: 0,
            explanation: `Chia như số tự nhiên, khi chia đến phần thập phân thì đặt dấu phẩy vào thương: ${fd(a)} : ${n} = ${fd(q)}.` });
    }, { decimal: true, weight: 2 }),
    tpl('g5.dec_div', 2, () => {
        const b = decStrict(0.2, 9.5, 1), q = rint(2, 60), a = fix(b * q);
        return single({ q: `${fd(a)} : ${fd(b)} = ?`, correct: q, wrong: [q * 10, fix(q / 10), q + 1, q - 1], min: 0,
            explanation: `Nhân cả số bị chia và số chia với 10 để số chia thành số tự nhiên: ${fd(fix(a * 10))} : ${Math.round(b * 10)} = ${q}.`, hint: 'Chuyển dấu phẩy sang phải ở cả hai số để số chia là số tự nhiên.' });
    }, { decimal: true }),
    tpl('g5.dec_shift', 1, () => {
        const a = dec(0.1, 99, rint(1, 3)), k = pickOne([10, 100, 1000]), mul = chance(0.5), r = fix(mul ? a * k : a / k);
        return single({ q: `${fd(a)} ${mul ? '×' : ':'} ${fmt(k)} = ?`, correct: r, wrong: [fix(mul ? a / k : a * k), fix(r * 10), fix(r / 10)], min: 0,
            explanation: `${mul ? 'Nhân' : 'Chia'} với ${fmt(k)}: chuyển dấu phẩy sang ${mul ? 'phải' : 'trái'} ${String(k).length - 1} chữ số: ${fd(r)}.`, hint: `${mul ? 'Nhân' : 'Chia'} với 10, 100, 1000 → dấu phẩy sang ${mul ? 'phải' : 'trái'} 1, 2, 3 chữ số.` });
    }, { decimal: true }),
    tpl('g5.dec_shift', 2, () => {
        const a = dec(1, 999, rint(0, 2)), k = pickOne([0.1, 0.01, 0.001]), r = fix(a * k);
        if (chance(0.4)) return input({ q: `Tính nhẩm: ${fd(a)} × ${fd(k)} = ?`, correct: r, answerKind: 'number', explanation: `Nhân với ${fd(k)}: chuyển dấu phẩy sang trái ${String(k).length - 2} chữ số: ${fd(r)}.` });
        return single({ q: `${fd(a)} × ${fd(k)} = ?`, correct: r, wrong: [fix(a / k), fix(r * 10), fix(r / 10)], min: 0,
            explanation: `Nhân với ${fd(k)} chính là chia cho ${fmt(Math.round(1 / k))}: chuyển dấu phẩy sang trái ${String(k).length - 2} chữ số: ${fd(r)}.`, hint: 'Nhân với 0,1 cũng như chia cho 10.' });
    }, { decimal: true }),
];

export const generateG5DecimalOps = fromTemplates(templates);
