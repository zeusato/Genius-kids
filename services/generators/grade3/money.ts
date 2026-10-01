// Lớp 3 — Tiền Việt Nam đến 100 000 đồng (g3_money): đếm tiền, mua bán, tiền trả lại, bài toán hai bước.
import { tpl, fromTemplates, single, rint, pickOne } from '../kit';
import { around } from '../wrongs';
import { fmtMoney } from '../../study/value';
import type { Template } from '../../study/types';

const NOTES = [1000, 2000, 5000, 10000, 20000, 50000];
const ITEMS: [string, number[]][] = [['quyển truyện', [12000, 15000, 18000, 25000]], ['hộp bút màu', [22000, 28000, 35000]], ['cái thước', [3000, 4000, 5000]], ['quả bóng', [30000, 45000, 60000]], ['cuốn vở', [6000, 7000, 8000]]];

export const templates: Template[] = [
    tpl('g3.money', 1, () => {
        const notes = Array.from({ length: rint(2, 4) }, () => pickOne(NOTES)).sort((a, b) => b - a), total = notes.reduce((s, x) => s + x, 0);
        return single({ q: 'Có tất cả bao nhiêu tiền?', visual: { fn: 'notesSVG', args: [notes] }, correct: total, wrong: around(total, { step: 1000, min: 1000 }), format: fmtMoney, min: 1000,
            explanation: `${notes.map(fmtMoney).join(' + ')} = ${fmtMoney(total)}.`, hint: 'Cộng lần lượt từ tờ có mệnh giá lớn nhất.' });
    }),
    tpl('g3.money', 2, () => {
        const [it, prices] = pickOne(ITEMS), price = pickOne(prices), pay = [10000, 20000, 50000, 100000].find(p => p > price)!;
        return single({ q: `Em mua một ${it} giá ${fmtMoney(price)} và đưa cho cô bán hàng ${fmtMoney(pay)}. Cô bán hàng trả lại em bao nhiêu tiền?`, correct: pay - price, wrong: [...around(pay - price, { step: 1000, min: 1000 }), pay + price], format: fmtMoney, min: 1000,
            explanation: `Tiền trả lại = tiền đưa - giá tiền: ${fmtMoney(pay)} - ${fmtMoney(price)} = ${fmtMoney(pay - price)}.` });
    }),
    tpl('g3.money', 3, () => {
        const [it, prices] = pickOne(ITEMS), price = pickOne(prices), n = price * 3 <= 90000 ? rint(2, 3) : 2, cost = price * n, // phạm vi 100 000
            pay = [20000, 50000, 100000].find(p => p >= cost + 1000) ?? 100000;
        if (cost >= pay) return single({ q: `Mua ${n} ${it}, mỗi ${it} giá ${fmtMoney(price)}. Hết bao nhiêu tiền?`, correct: cost, wrong: [price + n, cost + price, cost - 1000, cost + 1000], format: fmtMoney, min: 1000, explanation: `${fmtMoney(price)} × ${n} = ${fmtMoney(cost)}.` });
        return single({ q: `Mẹ mua ${n} ${it}, mỗi ${it} giá ${fmtMoney(price)}. Mẹ đưa cô bán hàng ${fmtMoney(pay)}. Cô bán hàng trả lại mẹ bao nhiêu tiền?`, correct: pay - cost, wrong: [pay - price, cost, pay - cost + 1000, pay - cost - 1000].filter(x => x > 0), format: fmtMoney, min: 1000,
            explanation: `Tiền mua hàng: ${fmtMoney(price)} × ${n} = ${fmtMoney(cost)}. Tiền trả lại: ${fmtMoney(pay)} - ${fmtMoney(cost)} = ${fmtMoney(pay - cost)}.`,
            steps: [`Số tiền mua ${n} ${it}: ${fmtMoney(price)} × ${n} = ${fmtMoney(cost)}`, `Tiền trả lại: ${fmtMoney(pay)} - ${fmtMoney(cost)} = ${fmtMoney(pay - cost)}`], hint: 'Tính số tiền phải trả trước.' });
    }),
];

export const generateG3Money = fromTemplates(templates);
