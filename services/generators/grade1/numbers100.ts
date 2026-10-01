// Lớp 1 — Các số đến 100 (g1_numbers_100): đọc, viết, chục – đơn vị, so sánh, liền trước/sau.
// Giữ mẫu "Điền số tròn chục còn thiếu:" vì MathRacing lọc câu theo mẫu này.
import { tpl, fromTemplates, single, compare, choices, input, rint, sample, shuffle, chance } from '../kit';
import { around, swapDigits, placeError } from '../wrongs';
import { word, cap } from './common';
import type { Template } from '../../study/types';

const cd = (c: number, d: number) => `${c} chục ${d} đơn vị`;

export const templates: Template[] = [
    tpl('g1.numbers100', 1, () => {
        const t = rint(2, 9), u = rint(0, 9), n = t * 10 + u;
        return single({ q: 'Có tất cả bao nhiêu que tính?', speech: `Có ${word(t)} bó, mỗi bó một chục que tính, và ${word(u)} que rời. Có tất cả bao nhiêu que tính?`,
            visual: { fn: 'tensOnesSVG', args: [t, u] }, correct: n, wrong: [...swapDigits(n), ...around(n, { min: 10, max: 99, step: rint(0, 1) ? 1 : 10 })], min: 10, max: 99,
            explanation: `${t} chục và ${u} đơn vị là ${n}.`, hint: 'Mỗi bó là một chục; đếm số bó trước rồi đếm que rời.' });
    }),
    tpl('g1.numbers100', 1, () => {
        const t = rint(2, 9), u = rint(1, 9), n = t * 10 + u;
        const opts = [...new Set([cd(t, u), cd(u, t), cd(t, (u + 1) % 10), cd(t - 1, u)])];
        return choices({ q: `Số ${n} gồm mấy chục và mấy đơn vị?`, speech: `Số ${word(n)} gồm mấy chục và mấy đơn vị?`, options: shuffle(opts), correct: cd(t, u),
            explanation: `Chữ số ${t} ở hàng chục, chữ số ${u} ở hàng đơn vị: ${n} gồm ${t} chục và ${u} đơn vị.` });
    }),
    tpl('g1.numbers100', 2, () => {
        const n = rint(21, 99);
        return chance(0.5)
            ? input({ q: `Viết số: ${word(n)}`, speech: `Viết số ${word(n)}.`, correct: n, explanation: `${cap(word(n))} viết là ${n}.` })
            : single({ q: `Số gồm ${Math.floor(n / 10)} chục và ${n % 10} đơn vị là số nào?`, speech: `Số gồm ${word(Math.floor(n / 10))} chục và ${word(n % 10)} đơn vị là số nào?`,
                correct: n, wrong: [...swapDigits(n), ...placeError(n), ...around(n, { min: 10, max: 99 })], min: 10, max: 99,
                explanation: `${Math.floor(n / 10)} chục và ${n % 10} đơn vị là ${n}.` });
    }),
    // MathRacing kiểm mẫu "Điền số tròn chục còn thiếu: a, __, b" (đúng 3 số, thiếu số giữa).
    tpl('g1.numbers100', 2, () => {
        const mid = rint(2, 9) * 10;
        return single({ q: `Điền số tròn chục còn thiếu: ${mid - 10}, __, ${mid + 10}`, speech: `Điền số tròn chục còn thiếu vào ô trống: ${mid - 10}, ô trống, ${mid + 10}`,
            correct: mid, wrong: [mid + 5, mid - 5, ...around(mid, { step: 10, min: 10, max: 100 })], min: 10, max: 100,
            explanation: `Các số tròn chục hơn kém nhau 10: ${mid - 10}, ${mid}, ${mid + 10}.` });
    }),
    tpl('g1.numbers100', 2, () => {
        const step = chance(0.5) ? 10 : 1, start = step === 10 ? rint(1, 6) * 10 : rint(20, 95), k = rint(1, 3), seq = [0, 1, 2, 3].map(i => start + i * step);
        if (seq[3] > 100) return single({ q: `Điền số tròn chục còn thiếu: 40, __, 60`, speech: 'Điền số tròn chục còn thiếu: 40, ô trống, 60', correct: 50, wrong: [45, 55, 60, 70], explanation: 'Các số tròn chục hơn kém nhau 10: 40, 50, 60.' });
        return single({ q: `Điền số còn thiếu vào dãy số: ${seq.map((x, i) => (i === k ? '__' : x)).join(', ')}`, speech: `Điền số còn thiếu vào dãy số: ${seq.map((x, i) => (i === k ? 'ô trống' : x)).join(', ')}`,
            correct: seq[k], wrong: around(seq[k], { step, min: 10, max: 100 }), min: 10, max: 100,
            explanation: `Các số trong dãy tăng thêm ${step}: ${seq.join(', ')}.` });
    }),
    tpl('g1.compare100', 1, () => {
        const a = rint(10, 99), b = chance(0.4) ? Math.floor(a / 10) * 10 + rint(0, 9) : rint(10, 99);
        return compare({ q: `Điền dấu thích hợp: ${a} ... ${b}`, speech: `So sánh ${a} và ${b}.`, left: a, right: b,
            explanation: a === b ? `Hai số bằng nhau nên điền dấu =: ${a} = ${b}.` : Math.floor(a / 10) !== Math.floor(b / 10) ? `So sánh hàng chục: ${Math.floor(a / 10)} chục ${a > b ? '>' : '<'} ${Math.floor(b / 10)} chục, nên ${a} ${a > b ? '>' : '<'} ${b}.` : `Cùng ${Math.floor(a / 10)} chục, so sánh hàng đơn vị: ${a % 10} ${a > b ? '>' : '<'} ${b % 10}, nên ${a} ${a > b ? '>' : '<'} ${b}.`,
            hint: 'So sánh chữ số hàng chục trước.' });
    }),
    tpl('g1.compare100', 2, () => {
        const nums = sample(Array.from({ length: 90 }, (_, i) => i + 10), 4), big = chance(0.5);
        const ans = big ? Math.max(...nums) : Math.min(...nums);
        return single({ q: `Số nào ${big ? 'lớn nhất' : 'bé nhất'}: ${nums.join(', ')}?`, speech: `Trong các số ${nums.join(', ')}, số nào ${big ? 'lớn nhất' : 'bé nhất'}?`,
            correct: ans, wrong: nums.filter(x => x !== ans), closed: true, explanation: `So sánh hàng chục rồi hàng đơn vị: ${ans} là số ${big ? 'lớn nhất' : 'bé nhất'}.` });
    }, { noRankCheck: true }),
    tpl('g1.neighbors100', 1, () => {
        const n = rint(11, 98), after = chance(0.5), ans = after ? n + 1 : n - 1;
        return single({ q: `Số liền ${after ? 'sau' : 'trước'} của ${n} là số nào?`, speech: `Số liền ${after ? 'sau' : 'trước'} của ${word(n)} là số nào?`,
            correct: ans, wrong: [after ? n - 1 : n + 1, n + (after ? 10 : -10), ...around(ans, { min: 10, max: 100 })], min: 10, max: 100,
            explanation: `Số liền ${after ? 'sau' : 'trước'} hơn kém ${n} đúng 1 đơn vị: ${ans}.` });
    }),
];

export const generateNumbers100 = fromTemplates(templates);
