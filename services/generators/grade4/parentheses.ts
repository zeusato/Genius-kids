// Lớp 4 — Biểu thức có dấu ngoặc (g4_parentheses). Dấu chia viết ":" theo SGK.
// Giữ mẫu "(a + b) × c = ?" (MathRacing lọc biểu thức có × hoặc :).
import { tpl, fromTemplates, single, compare, input, rint, chance, pickOne } from '../kit';
import { generateWrongAnswersWithSameUnits as sameUnits } from '../distractors';
import { fmt } from '../../study/value';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g4.expr', 2, () => {
        const kind = rint(0, 3);
        if (kind === 0) { const a = rint(20, 300), b = rint(10, 200), c = rint(2, 9), r = (a + b) * c; return single({ q: `(${a} + ${b}) × ${c} = ?`, correct: r, wrong: [a + b * c, a * c + b, ...sameUnits(r, 2, 100)], min: 0, explanation: `Trong ngoặc trước: ${a} + ${b} = ${a + b}; ${a + b} × ${c} = ${fmt(r)}.`, steps: [`${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${fmt(r)}`], hint: 'Làm trong ngoặc trước.' }); }
        if (kind === 1) { const c = rint(2, 9), q = rint(20, 200), b = rint(10, 150), a = q * c + b, r = (a - b) / c; return single({ q: `(${a} - ${b}) : ${c} = ?`, correct: r, wrong: [a - b / c > 0 && Number.isInteger(b / c) ? a - b / c : r + 10, r * c, r + 1, r - 1], min: 0, explanation: `${a} - ${b} = ${a - b}; ${a - b} : ${c} = ${r}.`, steps: [`${a} - ${b} = ${a - b}`, `${a - b} : ${c} = ${r}`] }); }
        if (kind === 2) { const b = rint(2, 9), c = rint(10, 99), a = rint(b * c + 10, b * c + 500), r = a - b * c; return single({ q: `${a} - ${b} × ${c} = ?`, correct: r, wrong: [(a - b) * c, a - b + c, ...sameUnits(Math.max(r, 11), 2, 100)], min: 0, explanation: `Nhân trước, trừ sau: ${b} × ${c} = ${b * c}; ${a} - ${b * c} = ${r}.`, steps: [`${b} × ${c} = ${b * c}`, `${a} - ${b * c} = ${r}`], hint: 'Không có ngoặc: nhân, chia trước; cộng, trừ sau.' }); }
        const a = rint(2, 9), b = rint(10, 99), c = rint(10, 99), r = a * (b + c);
        return single({ q: `${a} × (${b} + ${c}) = ?`, correct: r, wrong: [a * b + c, a + b + c, ...sameUnits(r, 2, 100)], min: 0, explanation: `${b} + ${c} = ${b + c}; ${a} × ${b + c} = ${fmt(r)}.`, steps: [`${b} + ${c} = ${b + c}`, `${a} × ${b + c} = ${fmt(r)}`] });
    }, { weight: 2 }),
    tpl('g4.expr', 3, () => {
        const kind = rint(0, 2);
        if (kind === 0) {
            const a = rint(10, 90), b = rint(10, 90), c = rint(2, 9), total = (a + b) * c;
            return input({ q: `Tìm số thích hợp: (? + ${b}) × ${c} = ${fmt(total)}`, correct: a, explanation: `? + ${b} = ${fmt(total)} : ${c} = ${a + b}; ? = ${a + b} - ${b} = ${a}.`, steps: [`? + ${b} = ${fmt(total)} : ${c} = ${a + b}`, `? = ${a + b} - ${b} = ${a}`], hint: 'Tìm giá trị trong ngoặc trước.' });
        }
        if (kind === 1) {
            const a = rint(20, 99), b = rint(2, 9), c = rint(10, 50);
            const other = pickOne([{ t: `${a} + ${c} × ${b}`, v: a + c * b }, { t: `${a} × ${b} + ${c} × ${b}`, v: a * b + c * b }, { t: `${a} × ${b} + ${c}`, v: a * b + c }]);
            const sum = { t: `(${a} + ${c}) × ${b}`, v: (a + c) * b }, [L, R] = chance(0.5) ? [other, sum] : [sum, other];
            const sign = L.v === R.v ? '=' : L.v > R.v ? '>' : '<';
            return compare({ q: `Điền dấu >, <, =: ${L.t} ... ${R.t}`, left: L.v, right: R.v,
                explanation: `${L.t} = ${fmt(L.v)}; ${R.t} = ${fmt(R.v)}. Vậy ${fmt(L.v)} ${sign} ${fmt(R.v)}.`, hint: 'Hai biểu thức trông giống nhau nhưng thứ tự tính khác nhau.' });
        }
        const price = rint(5, 25) * 1000, n1 = rint(2, 6), n2 = rint(2, 6), total = price * (n1 + n2);
        return single({ q: `Mỗi quyển truyện giá ${fmt(price)} đồng. Lan mua ${n1} quyển, Hoa mua ${n2} quyển. Hai bạn trả hết bao nhiêu tiền?`, correct: total, wrong: [price * n1, price * n2, total + price, total - price], step: 1000, format: x => `${fmt(x)} đồng`, min: 0,
            explanation: `${fmt(price)} × (${n1} + ${n2}) = ${fmt(price)} × ${n1 + n2} = ${fmt(total)} (đồng).`, steps: [`Số truyện cả hai mua: ${n1} + ${n2} = ${n1 + n2} (quyển)`, `Số tiền: ${fmt(price)} × ${n1 + n2} = ${fmt(total)} (đồng)`] });
    }),
];

export const generateG4Parentheses = fromTemplates(templates);
