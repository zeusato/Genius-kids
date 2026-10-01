// Lớp 3 — Phép nhân (g3_multiplication): bảng nhân 3, 4, 6, 7, 8, 9; nhân số có 2, 3 chữ số với số có 1 chữ số
// (nhớ không quá một lượt); gấp một số lên nhiều lần. Nhân với số có 2 chữ số là "Nâng cao".
// Giữ mẫu "a × b = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, input, rint, pickOne, chance, sample } from '../kit';
import { around, tableNeighbors, placeError } from '../wrongs';
import { fmt } from '../../study/value';
import { KIDS, TABLES, mulOperand, mulSteps } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g3.mul_tables', 1, () => {
        const a = pickOne(TABLES), b = rint(1, 10);
        return single({ q: `${a} × ${b} = ?`, correct: a * b, wrong: tableNeighbors(a, b), min: 0, max: 100,
            explanation: `Bảng nhân ${a}: ${a} × ${b} = ${a * b}.`, hint: b > 1 ? `${a} × ${b} = ${a} × ${b - 1} + ${a} = ${a * (b - 1)} + ${a}.` : `Số nào nhân với 1 cũng bằng chính nó.` });
    }, { weight: 2 }),
    tpl('g3.mul_tables', 2, () => {
        const a = pickOne(TABLES), b = rint(2, 10);
        return chance(0.5)
            ? input({ q: `${a} × ? = ${a * b}`, correct: b, explanation: `Vì ${a} × ${b} = ${a * b} nên số cần điền là ${b}.`, hint: `Nhẩm bảng nhân ${a}.` })
            : single({ q: `Mỗi hộp có ${a} cái bánh. Hỏi ${b} hộp có bao nhiêu cái bánh?`, correct: a * b, wrong: [...tableNeighbors(a, b), a + b], min: 0, max: 100,
                explanation: `${a} được lấy ${b} lần: ${a} × ${b} = ${a * b} (cái bánh).` });
    }),
    tpl('g3.mul_1digit', 1, () => {
        const b = rint(2, 6), a = mulOperand(2, b);
        return single({ q: `${a} × ${b} = ?`, correct: a * b, wrong: [...placeError(a * b).slice(2, 4), a * b + b, a * b - b, ...around(a * b, { min: 0 })], min: 0,
            explanation: `Nhân từ hàng đơn vị: ${a} × ${b} = ${a * b}.`, steps: mulSteps(a, b), hint: 'Nhân từ phải sang trái, nhớ sang hàng tiếp theo.' });
    }, { weight: 2 }),
    tpl('g3.mul_1digit', 2, () => {
        const b = rint(2, 5), a = mulOperand(3, b);
        return single({ q: `${a} × ${b} = ?`, correct: a * b, wrong: [a * b + 10, a * b - 10, a * b + 100, ...around(a * b, { min: 0, step: 10 })], min: 0,
            explanation: `Nhân lần lượt từng hàng từ phải sang trái: ${a} × ${b} = ${a * b}.`, steps: mulSteps(a, b), hint: 'Đặt tính rồi nhân từ hàng đơn vị.' });
    }),
    tpl('g3.mul_1digit', 3, () => {
        const b = rint(3, 8), a = mulOperand(chance(0.5) ? 2 : 3, b), k = pickOne(KIDS);
        if (chance(0.5)) return input({ q: `Đặt tính rồi tính: ${a} × ${b}`, visual: { fn: 'columnArithSVG', args: [a, b, '×'] }, correct: a * b, explanation: `Đặt tính rồi nhân từ phải sang trái: ${a} × ${b} = ${a * b}.`, steps: mulSteps(a, b) });
        return single({ q: `Mỗi thùng có ${a} quyển sách. ${k} chuyển ${b} thùng như thế lên thư viện. Hỏi ${k} chuyển bao nhiêu quyển sách?`,
            correct: a * b, wrong: [a + b, a * b + 10, a * b - 10, a * (b - 1)], min: 0,
            explanation: `${a} quyển được lấy ${b} lần: ${a} × ${b} = ${fmt(a * b)} (quyển sách).`, steps: [`Số sách: ${a} × ${b} = ${fmt(a * b)} (quyển)`, `Đáp số: ${fmt(a * b)} quyển sách`] });
    }),
    tpl('g3.times_more', 2, () => {
        const a = rint(2, 12), k = rint(2, 9);
        return single({ q: `Gấp ${a} lên ${k} lần được bao nhiêu?`, correct: a * k, wrong: [a + k, a * (k + 1), a * (k - 1), a * k + 1], min: 0,
            explanation: `Muốn gấp một số lên nhiều lần, ta lấy số đó nhân với số lần: ${a} × ${k} = ${a * k}.`, hint: 'Gấp lên nhiều lần thì làm phép nhân.' });
    }),
    tpl('g3.times_more', 3, () => {
        const [k1, k2] = sample(KIDS, 2), a = rint(3, 15), k = rint(2, 6);
        return single({ q: `${k1} có ${a} nhãn vở. Số nhãn vở của ${k2} gấp ${k} lần số nhãn vở của ${k1}. Hỏi ${k2} có bao nhiêu nhãn vở?`,
            correct: a * k, wrong: [a + k, a * k + a, a * k - a, a * k + k], min: 0,
            explanation: `Gấp ${k} lần thì nhân với ${k}: ${a} × ${k} = ${a * k} (nhãn vở).`, steps: [`Số nhãn vở của ${k2}: ${a} × ${k} = ${a * k} (nhãn vở)`, `Đáp số: ${a * k} nhãn vở`], hint: '"Gấp lên mấy lần" là phép nhân, khác với "nhiều hơn mấy".' });
    }),
    tpl('g3.mul_2digit', 2, () => {
        const a = rint(12, 50), b = rint(11, 25);
        return single({ q: `${a} × ${b} = ?`, correct: a * b, wrong: [a * b + 10, a * b - 10, a * (b % 10) + a, a * b + 100], min: 0,
            explanation: `Nhân lần lượt với chữ số hàng đơn vị và hàng chục rồi cộng: ${a} × ${b % 10} = ${a * (b % 10)}; ${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}; tổng ${a * b}.` });
    }),
];

export const generateG3Multiplication = fromTemplates(templates);
