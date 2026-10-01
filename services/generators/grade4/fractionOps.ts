// Lớp 4 — Phép tính với phân số (g4_fraction_ops): cộng, trừ (cùng mẫu / mẫu này chia hết cho mẫu kia),
// nhân, chia, tìm phân số của một số. Cộng trừ khác mẫu tuỳ ý là "Nâng cao". Kết quả luôn RÚT GỌN, không âm.
// Giữ mẫu "a/b + c/d = ?" và "a/b × c/d = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, rint, pickOne, chance, shuffle } from '../kit';
import { fractionErrors } from '../wrongs';
import { fracText, lcm, fracNeighbors } from '../fractions';
import type { Template } from '../../study/types';

const F = (a: number, b: number) => `${a}/${b}`;
const val = (f: string) => { const [p, q] = f.split('/').map(Number); return q ? p / q : p; };
function opts(right: string, cands: string[]): string[] {
    const [n, d] = right.includes('/') ? right.split('/').map(Number) : [Number(right), 1];
    return [...cands, ...fracNeighbors(n, d)].filter(x => !/-/.test(x) && val(x) >= 0);
}

function addSub(sameOrDivisible: boolean, anyDen: boolean) {
    const plus = chance(0.5);
    for (;;) {
        let b = rint(2, 9), d: number;
        if (anyDen) d = rint(2, 9); else if (sameOrDivisible && chance(0.5)) d = b; else { const k = rint(2, 3); d = b * k; if (d > 18) continue; }
        const a = rint(1, b * 2), c = rint(1, d * 2), m = lcm(b, d);
        const num = plus ? a * (m / b) + c * (m / d) : a * (m / b) - c * (m / d);
        if (num < 0 || (anyDen && (b === d || m === Math.max(b, d)))) continue;
        const right = fracText(num, m);
        const wrongs = [...fractionErrors(a, b, c, d, plus ? '+' : '-').map(([x, y]) => fracText(x, y, false)), fracText(num, m * 2), F(num, m) === right ? fracText(num + 1, m) : F(num, m), fracText(num + m, m)];
        return { a, b, c, d, m, num, plus, right, wrongs };
    }
}

export const templates: Template[] = [
    tpl('g4.frac_addsub', 1, () => {
        const b = rint(3, 12), a = rint(1, b - 1), c = rint(1, b - 1), plus = chance(0.5) || a < c;
        const num = plus ? a + c : a - c, right = fracText(num, b);
        return single({ q: `${F(a, b)} ${plus ? '+' : '-'} ${F(c, b)} = ?`, wrong: opts(right, [F(plus ? a + c : a - c, b * 2), F(num, b * 2), fracText(num + 1, b), fracText(Math.abs(num - 1), b), F(a + c, b + b)]), correct: right,
            explanation: `Cùng mẫu số: ${plus ? 'cộng' : 'trừ'} hai tử số, giữ nguyên mẫu: ${F(a, b)} ${plus ? '+' : '-'} ${F(c, b)} = ${F(num, b)}${F(num, b) !== right ? ` = ${right}` : ''}.`, hint: 'Không cộng (trừ) hai mẫu số!' });
    }),
    tpl('g4.frac_addsub', 2, () => {
        const x = addSub(false, false);
        return single({ q: `${F(x.a, x.b)} ${x.plus ? '+' : '-'} ${F(x.c, x.d)} = ?`, wrong: opts(x.right, x.wrongs), correct: x.right,
            explanation: `Mẫu số chung là ${x.m}: ${F(x.a, x.b)} = ${F(x.a * (x.m / x.b), x.m)}; ${F(x.c, x.d)} = ${F(x.c * (x.m / x.d), x.m)}. Kết quả ${F(x.num, x.m)}${F(x.num, x.m) !== x.right ? ` = ${x.right}` : ''}.`,
            steps: [`Quy đồng mẫu số ${x.m}: ${F(x.a * (x.m / x.b), x.m)} và ${F(x.c * (x.m / x.d), x.m)}`, `${x.plus ? 'Cộng' : 'Trừ'} tử số: ${F(x.num, x.m)}`, ...(F(x.num, x.m) !== x.right ? [`Rút gọn: ${x.right}`] : [])], hint: 'Quy đồng mẫu số trước.' });
    }),
    tpl('g4.frac_mul', 1, () => {
        const a = rint(1, 9), b = rint(2, 9), n = rint(2, 9), right = fracText(a * n, b);
        return single({ q: `${F(a, b)} × ${n} = ?`, wrong: opts(right, [F(a, b * n), fracText(a + n, b), fracText(a * n, b * n), fracText(a * n + 1, b)]), correct: right,
            explanation: `Nhân tử số với ${n}, giữ nguyên mẫu: ${F(a * n, b)}${F(a * n, b) !== right ? ` = ${right}` : ''}.` });
    }),
    tpl('g4.frac_mul', 2, () => {
        const a = rint(1, 8), b = rint(2, 9), c = rint(1, 8), d = rint(2, 9), right = fracText(a * c, b * d);
        return single({ q: `${F(a, b)} × ${F(c, d)} = ?`, wrong: opts(right, [fracText(a * c, b + d), fracText(a + c, b * d), fracText(a * d, b * c), fracText(a * c + 1, b * d)]), correct: right,
            explanation: `Tử nhân tử, mẫu nhân mẫu: ${F(a * c, b * d)}${F(a * c, b * d) !== right ? ` = ${right}` : ''}.`, hint: 'Tử nhân tử, mẫu nhân mẫu, rồi rút gọn.' });
    }),
    tpl('g4.frac_div', 2, () => {
        const a = rint(1, 8), b = rint(2, 9), c = rint(1, 8), d = rint(2, 9), right = fracText(a * d, b * c);
        return single({ q: `${F(a, b)} : ${F(c, d)} = ?`, wrong: opts(right, [fracText(a * c, b * d), fracText(b * c, a * d), fracText(a * d + 1, b * c), fracText(a, b * c)]), correct: right,
            explanation: `Chia cho một phân số là nhân với phân số đảo ngược: ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}${F(a * d, b * c) !== right ? ` = ${right}` : ''}.`, hint: `Đảo ngược phân số thứ hai thành ${F(d, c)}.` });
    }),
    tpl('g4.fraction_of', 2, () => {
        const b = rint(2, 9), a = rint(1, b - 1), unit = rint(2, 20), total = b * unit;
        return single({ q: `Tìm ${F(a, b)} của ${total}.`, correct: a * unit, wrong: [unit, total - a * unit, a * unit + unit, a * unit - unit, total], min: 0,
            explanation: `${F(a, b)} của ${total} là ${total} × ${F(a, b)} = ${total} : ${b} × ${a} = ${a * unit}.`, hint: `Chia ${total} thành ${b} phần bằng nhau rồi lấy ${a} phần.` });
    }),
    tpl('g4.fraction_of', 3, () => {
        const b = pickOne([3, 4, 5, 6]), a = rint(1, b - 1), unit = rint(4, 30), total = b * unit, it = pickOne([['học sinh', 'lớp có', 'là học sinh giỏi'], ['quyển sách', 'thư viện có', 'là truyện tranh'], ['cây', 'vườn có', 'là cây cam']]);
        return single({ q: `Một ${it[1]} ${total} ${it[0]}, trong đó ${F(a, b)} số ${it[0]} ${it[2]}. Hỏi có bao nhiêu ${it[0]} ${it[2]}?`, correct: a * unit, wrong: [unit, total - a * unit, a * unit + unit, a * unit - unit, total], min: 0,
            explanation: `${total} × ${F(a, b)} = ${a * unit} (${it[0]}).`, steps: [`Số ${it[0]} ${it[2]}: ${total} × ${F(a, b)} = ${a * unit}`, `Đáp số: ${a * unit} ${it[0]}`] });
    }),
    tpl('g4.frac_addsub_any', 2, () => {
        const x = addSub(false, true);
        return single({ q: `${F(x.a, x.b)} ${x.plus ? '+' : '-'} ${F(x.c, x.d)} = ?`, wrong: opts(x.right, x.wrongs), correct: x.right,
            explanation: `Quy đồng với mẫu số chung nhỏ nhất ${x.m}: ${F(x.a * (x.m / x.b), x.m)} ${x.plus ? '+' : '-'} ${F(x.c * (x.m / x.d), x.m)} = ${F(x.num, x.m)}${F(x.num, x.m) !== x.right ? ` = ${x.right}` : ''}.` });
    }),
];

export const generateG4FractionOps = fromTemplates(templates);
