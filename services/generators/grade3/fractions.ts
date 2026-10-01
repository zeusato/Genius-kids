// Lớp 3 — Một phần mấy (g3_fractions): nhận biết 1/2 … 1/9; tìm một phần mấy của một số.
// Phân số a/b (a > 1) là "Nâng cao" (Lớp 4).
import { tpl, fromTemplates, single, choices, rint, pickOne, chance, shuffle, sample } from '../kit';
import { KIDS } from './common';
import type { Template } from '../../study/types';

const frac = (a: number, b: number) => `${a}/${b}`;
const val = (f: string) => { const [p, q] = f.split("/").map(Number); return Math.round(p / q * 1e9); };

export const templates: Template[] = [
    tpl('g3.unit_fraction', 1, () => {
        const n = rint(2, 9), bar = chance(0.5);
        const opts = shuffle([frac(1, n), ...sample([2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== n), 3).map(x => frac(1, x))]);
        return choices({ q: 'Đã tô màu một phần mấy của hình?', visual: { fn: bar ? 'fractionBarSVG' : 'fractionPieSVG', args: [1, n] }, options: opts, correct: frac(1, n),
            explanation: `Hình được chia thành ${n} phần bằng nhau, tô màu 1 phần: đã tô 1/${n} hình.`, hint: 'Đếm xem hình được chia thành mấy phần bằng nhau.' });
    }),
    tpl('g3.fraction_of', 2, () => {
        const n = rint(2, 9), q = rint(2, 10), total = n * q, unit = pickOne(['cái kẹo', 'quả cam', 'viên bi', 'quyển vở']);
        return single({ q: `1/${n} của ${total} ${unit} là bao nhiêu ${unit}?`, correct: q, wrong: [total - q, q + 1, q - 1, q + n], min: 1,
            explanation: `Muốn tìm 1/${n} của một số, ta chia số đó cho ${n}: ${total} : ${n} = ${q} (${unit}).`, hint: `Chia ${total} thành ${n} phần bằng nhau.` });
    }, { weight: 2 }),
    tpl('g3.fraction_of', 3, () => {
        const n = rint(2, 6), q = rint(3, 12), total = n * q, kid = pickOne(KIDS);
        return single({ q: `${kid} có ${total} nhãn vở, ${kid} cho bạn 1/${n} số nhãn vở đó. Hỏi ${kid} còn lại bao nhiêu nhãn vở?`, correct: total - q, wrong: [q, total - n, total - q + 1, total - q - 1], min: 0,
            explanation: `Số nhãn vở đã cho: ${total} : ${n} = ${q}. Còn lại: ${total} - ${q} = ${total - q} (nhãn vở).`, steps: [`Đã cho bạn: ${total} : ${n} = ${q} (nhãn vở)`, `Còn lại: ${total} - ${q} = ${total - q} (nhãn vở)`, `Đáp số: ${total - q} nhãn vở`], hint: 'Tìm số nhãn vở đã cho trước.' });
    }),
    tpl('g3.fraction_ab', 2, () => {
        const b = rint(3, 8), a = rint(2, b - 1), bar = chance(0.5);
        const cands = [frac(b - a, b), frac(a + 1, b), frac(a - 1, b), frac(a, b + 1), frac(a, b - 1), frac(b, b + a)].filter(x => { const [p, q] = x.split('/').map(Number); return p > 0 && p < q && p / q !== a / b; });
        const uniq = cands.filter((x, i) => cands.findIndex(y => val(y) === val(x)) === i);
        const opts = shuffle([frac(a, b), ...sample(uniq, 3)]);
        return choices({ q: 'Phần tô màu biểu thị phân số nào?', visual: { fn: bar ? 'fractionBarSVG' : 'fractionPieSVG', args: [a, b] }, options: [...new Set(opts)], correct: frac(a, b),
            explanation: `Hình chia thành ${b} phần bằng nhau, tô ${a} phần: ${a}/${b}.` });
    }, { noRankCheck: true }), // đọc phân số từ hình: hạng giá trị không phải mẹo đoán
];

export const generateG3Fractions = fromTemplates(templates);
