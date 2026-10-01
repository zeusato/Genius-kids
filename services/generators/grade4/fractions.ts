// Lớp 4 — Phân số (g4_fractions): khái niệm; tính chất cơ bản, rút gọn; quy đồng (mẫu này chia hết cho mẫu kia); so sánh.
import { tpl, fromTemplates, single, compare, choices, rint, chance, shuffle, sample } from '../kit';
import { gcd, fracNeighbors } from '../fractions';
import type { Template } from '../../study/types';

const F = (a: number, b: number) => `${a}/${b}`;
const val = (f: string) => { const [p, q] = f.split('/').map(Number); return q ? p / q : p; };
/** Lọc các phân số khác giá trị với nhau và với `exclude`. */
const distinctFr = (xs: string[], exclude: string[]) => xs.filter((x, i) => !exclude.some(e => Math.abs(val(e) - val(x)) < 1e-9) && xs.findIndex(y => Math.abs(val(y) - val(x)) < 1e-9) === i);

export const templates: Template[] = [
    tpl('g4.fraction_concept', 1, () => {
        const b = rint(3, 10), a = rint(1, b - 1), kind = rint(0, 2);
        if (kind === 0) return single({ q: 'Phần tô màu biểu thị phân số nào?', visual: { fn: chance(0.5) ? 'fractionBarSVG' : 'fractionPieSVG', args: [a, b] },
            correct: F(a, b), wrong: [F(b - a, b), F(b, a), ...fracNeighbors(a, b)],
            explanation: `Hình chia thành ${b} phần bằng nhau, tô màu ${a} phần: phân số ${a}/${b} (tử số ${a}, mẫu số ${b}).` });
        if (kind === 1) { const num = chance(0.5); return choices({ q: `Phân số ${F(a, b)} có ${num ? 'tử số' : 'mẫu số'} là:`, options: shuffle([...new Set([String(a), String(b), String(a + b), String(b + 1)])]), correct: String(num ? a : b), explanation: num ? `Tử số là số viết trên gạch ngang: ${a}.` : `Mẫu số là số viết dưới gạch ngang: ${b}.` }); }
        return choices({ q: `Viết phân số: "${['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'][a - 1]} phần ${['', '', '', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'][b]}"`, options: shuffle([F(a, b), F(b, a), F(a, b + 1), F(a + 1, b)].filter((x, i, arr) => arr.indexOf(x) === i)), correct: F(a, b),
            explanation: `Tử số ${a} viết trên gạch ngang, mẫu số ${b} viết dưới: ${a}/${b}.` });
    }, { noRankCheck: true }), // đọc phân số / tử – mẫu: hạng giá trị không phải mẹo đoán
    tpl('g4.fraction_equiv', 1, () => {
        const b = rint(2, 9), a = rint(1, b - 1), k = rint(2, 5);
        const right = F(a * k, b * k);
        return single({ q: `Phân số nào bằng phân số ${F(a, b)}?`, correct: right, wrong: [F(a * k, b), F(a, b * k), F(a + k, b + k), F(a * k + 1, b * k), F(a * k - 1 || a * k + 2, b * k), F(a, b * k + 1), F(Math.max(1, a * k - 2), b * k + 1), F(a, b + k)],
            explanation: `Nhân cả tử số và mẫu số với ${k}: ${F(a, b)} = ${F(a * k, b * k)}.`, hint: 'Nhân (hoặc chia) cả tử và mẫu với cùng một số khác 0.' });
    }),
    tpl('g4.fraction_equiv', 2, () => {
        let a = 0, b = 0, k = 0;
        do { b = rint(2, 9); a = rint(1, b - 1); k = rint(2, 6); } while (gcd(a, b) !== 1);
        const n = a * k, d = b * k, right = F(a, b);
        return single({ q: `Rút gọn phân số ${F(n, d)} được phân số tối giản là:`, correct: right, wrong: [F(a, d), F(n, b), ...fracNeighbors(a, b)],
            explanation: `Chia cả tử và mẫu cho ${k} (ước chung lớn nhất): ${F(n, d)} = ${right}.`, hint: 'Chia cả tử và mẫu cho cùng một số đến khi không chia được nữa.' });
    }),
    tpl('g4.fraction_common', 2, () => {
        const b = rint(2, 6), k = rint(2, 4), d = b * k, a = rint(1, b - 1), c = rint(1, d - 1);
        const right = `${F(a * k, d)} và ${F(c, d)}`;
        return choices({ q: `Quy đồng mẫu số hai phân số ${F(a, b)} và ${F(c, d)} được:`, options: shuffle([right, `${F(a, d)} và ${F(c, d)}`, `${F(a * k, d)} và ${F(c * k, d * k)}`, `${F(a + k, d)} và ${F(c, d)}`].filter((x, i, arr) => arr.indexOf(x) === i)), correct: right,
            explanation: `${d} chia hết cho ${b} (${d} : ${b} = ${k}), nên lấy ${d} làm mẫu số chung: ${F(a, b)} = ${F(a * k, d)}; giữ nguyên ${F(c, d)}.`, hint: `Mẫu số ${d} chia hết cho ${b}.` });
    }),
    tpl('g4.fraction_compare', 1, () => {
        const sameDen = chance(0.5), b = rint(3, 12);
        if (sameDen) { const a = rint(1, b - 1), c = rint(1, b - 1); return compare({ q: `Điền dấu >, <, =: ${F(a, b)} ... ${F(c, b)}`, left: a / b, right: c / b, explanation: `Cùng mẫu số ${b}: phân số nào có tử số lớn hơn thì lớn hơn.` }); }
        const a = rint(1, 9), d = rint(2, 12), e = rint(2, 12);
        return compare({ q: `Điền dấu >, <, =: ${F(a, d)} ... ${F(a, e)}`, left: a / d, right: a / e, explanation: `Cùng tử số ${a}: phân số nào có mẫu số bé hơn thì lớn hơn.`, hint: 'Cùng tử số: mẫu bé hơn thì phân số lớn hơn.' });
    }),
    tpl('g4.fraction_compare', 2, () => {
        const b = rint(2, 6), k = rint(2, 3), d = b * k, a = rint(1, b - 1), c = rint(1, d - 1);
        return compare({ q: `Điền dấu >, <, =: ${F(a, b)} ... ${F(c, d)}`, left: a / b, right: c / d,
            explanation: `Quy đồng: ${F(a, b)} = ${F(a * k, d)}. So sánh ${F(a * k, d)} với ${F(c, d)}: ${a * k > c ? '>' : a * k < c ? '<' : '='}.`, hint: 'Quy đồng mẫu số rồi so sánh tử số.' });
    }),
];

export const generateFractions = fromTemplates(templates);
