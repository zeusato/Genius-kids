// Lớp 5 — Phân số (g5_fractions): phân số thập phân; hỗn số; cộng trừ khác mẫu; nhân, chia; so sánh.
// Kết quả luôn rút gọn; KHÔNG có hai lựa chọn tương đương (single lọc theo giá trị).
// Giữ mẫu "a/b + c/d = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, compare, input, rint, pickOne, chance } from '../kit';
import { fractionErrors } from '../wrongs';
import { fracText, fracNeighbors, gcd, lcm } from '../fractions';
import { fmt } from '../../study/value';
import type { Template } from '../../study/types';

const F = (a: number, b: number) => `${a}/${b}`;
const neigh = (s: string) => { const [n, d] = s.includes('/') ? s.split('/').map(Number) : [Number(s), 1]; return fracNeighbors(n, d); };
const coprime = (lo: number, hi: number): [number, number] => { for (;;) { const d = rint(lo, hi), n = rint(1, d - 1); if (gcd(n, d) === 1) return [n, d]; } };

export const templates: Template[] = [
    tpl('g5.decimal_fraction', 1, () => {
        const k = pickOne([10, 100, 1000]), n = rint(1, k - 1);
        if (chance(0.5)) return single({ q: `Viết phân số thập phân ${F(n, k)} dưới dạng số thập phân:`, correct: n / k, wrong: [n / (k * 10), (n * 10) / k, n / (k / 10)], format: x => fmt(x), min: 0,
            explanation: `Mẫu số ${fmt(k)} có ${String(k).length - 1} chữ số 0, nên phần thập phân có ${String(k).length - 1} chữ số: ${F(n, k)} = ${fmt(n / k)}.` });
        const [a, b] = pickOne([[1, 2], [1, 5], [3, 5], [1, 4], [3, 4], [7, 20], [9, 25], [3, 50]] as const), kk = (b === 2 || b === 5) ? 10 / b : b === 4 || b === 25 ? 100 / b : b === 20 || b === 50 ? 100 / b : 1;
        return single({ q: `Viết ${F(a, b)} thành phân số thập phân:`, correct: F(a * kk, b * kk), wrong: [F(a, b * 10), F(a * 10, b * 10), F(a * kk + 1, b * kk), F(a * kk, b * kk * 10)], closed: true,
            explanation: `Nhân cả tử và mẫu với ${kk} để mẫu số là ${b * kk}: ${F(a, b)} = ${F(a * kk, b * kk)}.` });
    }, { decimal: true, noRankCheck: true }),
    tpl('g5.mixed_number', 1, () => {
        const w = rint(1, 9), [n, d] = coprime(2, 9), total = w * d + n;
        if (chance(0.5)) return single({ q: `Chuyển hỗn số ${w} ${F(n, d)} thành phân số:`, correct: F(total, d), wrong: [F(w + n, d), F(w * n + d, d), F(total, d * w), F(w * d, n)], closed: true,
            explanation: `${w} ${F(n, d)} = ${F(w * d + n, d)} (lấy ${w} × ${d} + ${n} = ${total} làm tử số).`, hint: 'Phần nguyên nhân mẫu số rồi cộng tử số.' });
        return single({ q: `Phân số ${F(total, d)} viết thành hỗn số là:`, correct: `${w} ${F(n, d)}`, wrong: [`${w + 1} ${F(n, d)}`, `${n} ${F(w, d)}`, `${w} ${F(d - n, d)}`, `${Math.max(1, w - 1)} ${F(n, d)}`], closed: true,
            explanation: `${total} : ${d} = ${w} dư ${n}, nên ${F(total, d)} = ${w} ${F(n, d)}.` });
    }, { noRankCheck: true }),
    tpl('g5.mixed_number', 2, () => {
        const [n1, d] = coprime(3, 8), w1 = rint(1, 5), w2 = rint(1, 4);
        let n2 = rint(1, d - 1);
        for (let i = 0; i < 12 && (n1 + n2) % d === 0; i++) n2 = rint(1, d - 1); // kết quả không phải số tự nhiên
        const num = (w1 * d + n1) + (w2 * d + n2), right = fracText(num, d);
        return single({ q: `Tính: ${w1} ${F(n1, d)} + ${w2} ${F(n2, d)} = ?${num % d ? ' (viết kết quả dưới dạng phân số)' : ''}`, correct: right, wrong: [fracText(w1 + w2 + n1 + n2, d), fracText(num, d * 2), ...neigh(right)],
            explanation: `${w1} ${F(n1, d)} = ${F(w1 * d + n1, d)}; ${w2} ${F(n2, d)} = ${F(w2 * d + n2, d)}; cộng: ${F(num, d)}${F(num, d) !== right ? ` = ${right}` : ''}.`, hint: 'Chuyển hỗn số thành phân số trước.' });
    }),
    tpl('g5.frac_addsub', 1, () => {
        const plus = chance(0.5);
        for (;;) {
            const b = rint(2, 9), d = rint(2, 9), a = rint(1, b - 1), c = rint(1, d - 1), m = lcm(b, d);
            if (b === d || gcd(a, b) !== 1 || gcd(c, d) !== 1 || m === Math.max(b, d) && chance(0.5)) continue;
            const num = plus ? a * (m / b) + c * (m / d) : a * (m / b) - c * (m / d);
            if (num < 0) continue;
            const right = fracText(num, m);
            return single({ q: `${F(a, b)} ${plus ? '+' : '-'} ${F(c, d)} = ?`, correct: right, wrong: [...fractionErrors(a, b, c, d, plus ? '+' : '-').map(([x, y]) => fracText(x, y)), ...neigh(right)],
                explanation: `Quy đồng mẫu số ${m}: ${F(a * (m / b), m)} ${plus ? '+' : '-'} ${F(c * (m / d), m)} = ${F(num, m)}${F(num, m) !== right ? ` = ${right}` : ''}.`,
                steps: [`Quy đồng: ${F(a, b)} = ${F(a * (m / b), m)}; ${F(c, d)} = ${F(c * (m / d), m)}`, `${plus ? 'Cộng' : 'Trừ'} tử số: ${F(num, m)}`, ...(F(num, m) !== right ? [`Rút gọn: ${right}`] : [])], hint: 'Quy đồng mẫu số rồi mới cộng (trừ) tử số.' });
        }
    }, { weight: 2 }),
    tpl('g5.frac_addsub', 2, () => {
        const [a, b] = coprime(2, 9), [c, d] = coprime(2, 9), n = rint(1, 3), m = lcm(b, d);
        const num = n * m + a * (m / b) - c * (m / d);
        if (num < 0) return single({ q: `${n} + ${F(a, b)} = ?`, correct: fracText(n * b + a, b), wrong: neigh(fracText(n * b + a, b)), explanation: `${n} = ${F(n * b, b)}; ${F(n * b, b)} + ${F(a, b)} = ${F(n * b + a, b)}.` });
        const right = fracText(num, m);
        return single({ q: `${n} + ${F(a, b)} - ${F(c, d)} = ?`, correct: right, wrong: [fracText(n * m + a * (m / b) + c * (m / d), m), ...neigh(right)],
            explanation: `Viết ${n} = ${F(n * m, m)}, quy đồng mẫu số ${m}: ${F(n * m, m)} + ${F(a * (m / b), m)} - ${F(c * (m / d), m)} = ${F(num, m)}${F(num, m) !== right ? ` = ${right}` : ''}.` });
    }),
    tpl('g5.frac_muldiv', 1, () => {
        const [a, b] = coprime(2, 9), [c, d] = coprime(2, 9), mul = chance(0.5);
        const right = mul ? fracText(a * c, b * d) : fracText(a * d, b * c);
        return single({ q: `${F(a, b)} ${mul ? '×' : ':'} ${F(c, d)} = ?`, correct: right, wrong: [mul ? fracText(a * d, b * c) : fracText(a * c, b * d), fracText(a + c, b + d), ...neigh(right)],
            explanation: mul ? `Tử nhân tử, mẫu nhân mẫu: ${F(a * c, b * d)}${F(a * c, b * d) !== right ? ` = ${right}` : ''}.` : `Nhân với phân số đảo ngược: ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}${F(a * d, b * c) !== right ? ` = ${right}` : ''}.` });
    }),
    tpl('g5.frac_muldiv', 2, () => {
        const [a, b] = coprime(2, 9), n = rint(2, 9), mul = chance(0.5), right = mul ? fracText(a * n, b) : fracText(a, b * n);
        if (chance(0.3)) { const total = b * rint(2, 12); return input({ q: `Một tấm vải dài ${total} m, đã may áo hết ${F(a, b)} tấm vải. Hỏi đã dùng bao nhiêu mét vải?`, correct: total * a / b, explanation: `${total} × ${F(a, b)} = ${total * a / b} (m).` }); }
        return single({ q: `${F(a, b)} ${mul ? '×' : ':'} ${n} = ?`, correct: right, wrong: [mul ? fracText(a, b * n) : fracText(a * n, b), fracText(a * n, b * n), ...neigh(right)],
            explanation: mul ? `Nhân tử số với ${n}: ${F(a * n, b)}${F(a * n, b) !== right ? ` = ${right}` : ''}.` : `Chia cho ${n} là nhân mẫu số với ${n}: ${F(a, b * n)}${F(a, b * n) !== right ? ` = ${right}` : ''}.` });
    }),
    tpl('g5.frac_compare', 1, () => {
        const [a, b] = coprime(2, 12), [c, d] = coprime(2, 12);
        return compare({ q: `Điền dấu >, <, =: ${F(a, b)} ... ${F(c, d)}`, left: a / b, right: c / d,
            explanation: `Quy đồng mẫu số ${lcm(b, d)}: ${F(a * lcm(b, d) / b, lcm(b, d))} và ${F(c * lcm(b, d) / d, lcm(b, d))}; so sánh hai tử số.`, hint: 'Quy đồng mẫu số (hoặc tử số) rồi so sánh.' });
    }),
    tpl('g5.frac_compare', 2, () => {
        const b = rint(2, 9), bigger = chance(0.5), c = bigger ? b + rint(1, 3) : rint(1, b - 1);
        return compare({ q: `Điền dấu >, <, =: ${F(c, b)} ... 1`, left: c / b, right: 1, explanation: `Phân số có tử số ${c > b ? 'lớn hơn' : c < b ? 'bé hơn' : 'bằng'} mẫu số thì ${c > b ? 'lớn hơn 1' : c < b ? 'bé hơn 1' : 'bằng 1'}.` });
    }),
];

export const generateG5Fractions = fromTemplates(templates);
