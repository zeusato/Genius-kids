// Lớp 5 — Tỉ số & phần trăm (g5_ratios): tỉ số; tỉ số phần trăm; tỉ lệ bản đồ; tổng – tỉ, hiệu – tỉ.
// Lãi suất, tăng rồi giảm % là "Nâng cao". Mọi đáp án là giá trị CHÍNH XÁC (không làm tròn ngầm).
// Giữ mẫu "… là bao nhiêu phần trăm của …" (số nguyên) và "… giá sau khi giảm …" (MathRacing).
import { tpl, fromTemplates, single, choices, input, rint, pickOne, chance, shuffle } from '../kit';
import { gcd } from '../fractions';
import { fmt, fmtMoney } from '../../study/value';
import { KIDS } from './common';
import type { Template } from '../../study/types';

const pct = (x: number) => `${fmt(x)}%`;

export const templates: Template[] = [
    tpl('g5.ratio', 1, () => {
        const a = rint(1, 12), b = pickOne([2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(x => x !== a));
        return input({ q: `Tỉ số của ${a} và ${b} là: ? (viết dạng a : b hoặc a/b)`, correct: `${a}/${b}`, accept: [`${a} : ${b}`, `${a}:${b}`, `${a / gcd(a, b)}/${b / gcd(a, b)}`, `${a / gcd(a, b)} : ${b / gcd(a, b)}`], answerKind: 'text',
            explanation: `Tỉ số của ${a} và ${b} là ${a} : ${b} hay ${a}/${b}${gcd(a, b) > 1 ? ` (= ${a / gcd(a, b)}/${b / gcd(a, b)})` : ''}.`, hint: 'Số đứng trước viết trước.' });
    }),
    tpl('g5.ratio', 2, () => {
        const boys = rint(8, 20), girls = rint(8, 20), g = gcd(boys, girls), [k1] = [pickOne(['Lớp 5A', 'Lớp 5B', 'Đội văn nghệ'])];
        const right = `${girls / g}/${boys / g}`;
        return choices({ q: `${k1} có ${boys} bạn nam và ${girls} bạn nữ. Tỉ số của số bạn nữ và số bạn nam là:`, options: shuffle([...new Set([right, `${boys / g}/${girls / g}`, `${girls}/${boys + girls}`, `${boys}/${boys + girls}`])]), correct: right,
            explanation: `Tỉ số = số bạn nữ : số bạn nam = ${girls} : ${boys} = ${right}.` });
    }, { noRankCheck: true }), // nhiễu là tỉ số đảo ngược / sai phần: lỗi theo nghĩa
    tpl('g5.percent', 1, () => {
        const b = pickOne([20, 25, 40, 50, 80, 100, 200]), p = pickOne([5, 10, 20, 25, 40, 50, 75]), a = b * p / 100;
        if (!Number.isInteger(a)) return single({ q: `50% của 80 là:`, correct: 40, wrong: [50, 30, 400, 160], explanation: '80 × 50 : 100 = 40.' });
        return single({ q: `${a} là bao nhiêu phần trăm của ${b}?`, correct: p, wrong: [p * 2 <= 100 ? p * 2 : p / 5, b - a, p + 5, 100 - p], format: pct, min: 0,
            explanation: `${a} : ${b} = ${fmt(a / b)}; ${fmt(a / b)} × 100 = ${p}. Vậy ${a} là ${p}% của ${b}.`, hint: 'Lấy số thứ nhất chia số thứ hai rồi nhân với 100.' });
    }),
    tpl('g5.percent', 2, () => {
        const b = rint(4, 40) * 10, p = pickOne([10, 20, 25, 30, 40, 50, 60, 75]), r = b * p / 100;
        if (!Number.isInteger(r)) return single({ q: `Tìm 20% của 150.`, correct: 30, wrong: [20, 15, 300, 130], explanation: '150 × 20 : 100 = 30.' });
        return single({ q: `Tìm ${p}% của ${b}.`, correct: r, wrong: [b - r, r * 10, b / p, r + 10].filter(x => Number.isInteger(x)), min: 0,
            explanation: `${b} × ${p} : 100 = ${r}.`, hint: 'Muốn tìm p% của một số, lấy số đó nhân với p rồi chia cho 100.' });
    }),
    tpl('g5.percent', 3, () => {
        const price = rint(5, 50) * 10000, p = pickOne([10, 20, 25, 30, 40, 50]), off = price * p / 100;
        return single({ q: `Một món hàng giá ${fmt(price)} đồng, giảm ${p}%. Hỏi giá sau khi giảm là bao nhiêu?`, correct: price - off, wrong: [off, price - p * 1000, price + off, price - off / 2], step: 1000, format: fmtMoney, min: 0,
            explanation: `Số tiền giảm: ${fmt(price)} × ${p} : 100 = ${fmt(off)} (đồng). Giá sau khi giảm: ${fmt(price)} - ${fmt(off)} = ${fmt(price - off)} (đồng).`,
            steps: [`Số tiền được giảm: ${fmt(price)} × ${p} : 100 = ${fmt(off)} (đồng)`, `Giá sau khi giảm: ${fmt(price)} - ${fmt(off)} = ${fmt(price - off)} (đồng)`], hint: 'Tìm số tiền được giảm trước.' });
    }),
    tpl('g5.map_scale', 2, () => {
        const scale = pickOne([1000, 10000, 100000, 500000, 1000000]), cm = rint(2, 15), real = cm * scale;
        const realKm = real / 100000, realM = real / 100;
        const useKm = realKm >= 1;
        return single({ q: `Trên bản đồ tỉ lệ 1 : ${fmt(scale)}, quãng đường dài ${cm} cm. Độ dài thật của quãng đường là:`, correct: useKm ? realKm : realM, wrong: useKm ? [realKm * 10, realKm / 10, cm * 10] : [realM * 10, realM / 10, cm * 100], format: x => `${fmt(x)} ${useKm ? 'km' : 'm'}`, min: 0,
            explanation: `Độ dài thật: ${cm} × ${fmt(scale)} = ${fmt(real)} (cm) = ${fmt(useKm ? realKm : realM)} ${useKm ? 'km' : 'm'}.`, steps: [`${cm} × ${fmt(scale)} = ${fmt(real)} (cm)`, `Đổi: ${fmt(real)} cm = ${fmt(useKm ? realKm : realM)} ${useKm ? 'km' : 'm'}`], hint: 'Nhân độ dài trên bản đồ với số tỉ lệ, rồi đổi đơn vị.' });
    }),
    tpl('g5.map_scale', 3, () => {
        const scale = pickOne([1000, 2000, 5000]), m = rint(2, 8) * scale / 100, cm = m * 100 / scale;
        return single({ q: `Một mảnh vườn dài ${fmt(m)} m. Trên bản đồ tỉ lệ 1 : ${fmt(scale)}, chiều dài mảnh vườn là bao nhiêu xăng-ti-mét?`, correct: cm, wrong: [cm * 10, cm / 10, m / 10], format: x => `${fmt(x)} cm`, min: 0,
            explanation: `${fmt(m)} m = ${fmt(m * 100)} cm; ${fmt(m * 100)} : ${fmt(scale)} = ${fmt(cm)} (cm).` });
    }),
    tpl('g5.sum_diff_ratio', 3, () => {
        const p = rint(1, 4), q = rint(p + 1, 7), unit = rint(3, 25), small = p * unit, big = q * unit, kind = chance(0.5);
        const [a, b] = shuffle(KIDS).slice(0, 2);
        if (kind) return single({ q: `${a} và ${b} có tất cả ${small + big} viên bi. Số bi của ${a} bằng ${p}/${q} số bi của ${b}. Hỏi ${a} có bao nhiêu viên bi?`, correct: small, wrong: [big, (small + big) / 2 % 1 ? small + unit : (small + big) / 2, small + unit, unit], min: 0,
            explanation: `Tổng số phần bằng nhau: ${p} + ${q} = ${p + q}. Mỗi phần: ${small + big} : ${p + q} = ${unit}. Số bi của ${a}: ${unit} × ${p} = ${small} (viên).`,
            steps: [`Tổng số phần: ${p} + ${q} = ${p + q}`, `Giá trị một phần: ${small + big} : ${p + q} = ${unit}`, `Số bi của ${a}: ${unit} × ${p} = ${small}`], hint: 'Vẽ sơ đồ: số bi của bạn này ứng với mấy phần?' });
        return single({ q: `Hiệu của hai số là ${big - small}. Tỉ số của hai số là ${p}/${q}. Tìm số lớn.`, correct: big, wrong: [small, big - small, unit * (q + p), big + unit], min: 0,
            explanation: `Hiệu số phần: ${q} - ${p} = ${q - p}. Một phần: ${big - small} : ${q - p} = ${unit}. Số lớn: ${unit} × ${q} = ${big}.`, steps: [`Hiệu số phần: ${q} - ${p} = ${q - p}`, `Một phần: ${big - small} : ${q - p} = ${unit}`, `Số lớn: ${unit} × ${q} = ${big}`] });
    }),
    tpl('g5.interest', 3, () => {
        const money = rint(2, 20) * 1000000, rate = pickOne([5, 6, 7, 8]), interest = money * rate / 100;
        if (chance(0.5)) return single({ q: `Bác An gửi tiết kiệm ${fmt(money)} đồng với lãi suất ${rate}% một năm. Sau 1 năm bác An nhận được cả tiền gửi và tiền lãi là bao nhiêu?`, correct: money + interest, wrong: [interest, money + interest * 2, money - interest, money + interest / 2], step: 10000, format: fmtMoney, min: 0,
            explanation: `Tiền lãi: ${fmt(money)} × ${rate} : 100 = ${fmt(interest)} (đồng). Tổng: ${fmt(money + interest)} (đồng).` });
        const price = rint(10, 50) * 10000, p = pickOne([10, 20]), up = price + price * p / 100, down = up - up * p / 100;
        return single({ q: `Một món hàng giá ${fmt(price)} đồng, được tăng giá ${p}%, sau đó lại giảm ${p}% so với giá mới. Giá cuối cùng là bao nhiêu?`, correct: down, wrong: [price, up, price - price * p / 100], step: 1000, format: fmtMoney, min: 0,
            explanation: `Sau khi tăng: ${fmt(up)} đồng. Giảm ${p}% của ${fmt(up)} là ${fmt(up * p / 100)} đồng. Giá cuối: ${fmt(down)} đồng — thấp hơn giá ban đầu!` });
    }),
];

export const generateG5Ratios = fromTemplates(templates);
