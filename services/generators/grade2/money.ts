// Lớp 2 — Tiền Việt Nam (g2_money). SGK Lớp 2: tờ 100, 200, 500, 1000 đồng.
// Tiền lớn hơn (đến 50 000 đồng) là "Nâng cao".
import { tpl, fromTemplates, single, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import { fmtMoney } from '../../study/value';
import type { Template } from '../../study/types';

const SMALL = [100, 200, 500, 1000];
const BIG = [1000, 2000, 5000, 10000, 20000, 50000];
const ITEMS = ['cái kẹo', 'quyển vở', 'cái bút chì', 'cục tẩy', 'cái bánh'];

export const templates: Template[] = [
    tpl('g2.money', 1, () => {
        const notes = Array.from({ length: rint(2, 4) }, () => pickOne(SMALL)).sort((a, b) => b - a), total = notes.reduce((s, x) => s + x, 0);
        return single({ q: 'Có tất cả bao nhiêu tiền?', speech: 'Cộng giá trị các tờ tiền. Có tất cả bao nhiêu tiền?', visual: { fn: 'notesSVG', args: [notes] },
            correct: total, wrong: around(total, { step: 100, min: 100, max: 4000 }), format: fmtMoney, min: 100, max: 4000,
            explanation: `${notes.map(fmtMoney).join(' + ')} = ${fmtMoney(total)}.`, hint: 'Cộng từ tờ có giá trị lớn nhất.' });
    }),
    tpl('g2.money', 1, () => {
        const pair = pickOne([[1000, 500], [1000, 200], [1000, 100], [500, 100], [200, 100]] as const), n = pair[0] / pair[1];
        return single({ q: `Tờ ${fmtMoney(pair[0])} đổi được mấy tờ ${fmtMoney(pair[1])}?`, speech: `Tờ ${pair[0]} đồng đổi được mấy tờ ${pair[1]} đồng?`, correct: n, wrong: around(n, { min: 1, max: 12 }), format: x => `${x} tờ`, min: 1, max: 12,
            explanation: `${fmtMoney(pair[0])} = ${Array(n).fill(fmtMoney(pair[1])).join(' + ')}, nên đổi được ${n} tờ.` });
    }),
    tpl('g2.money', 2, () => {
        const price = pickOne([200, 300, 400, 500, 600, 700, 800]), pay = 1000, item = pickOne(ITEMS);
        if (chance(0.5)) return single({ q: `Em mua một ${item} giá ${fmtMoney(price)} và đưa cô bán hàng tờ ${fmtMoney(pay)}. Cô bán hàng trả lại em bao nhiêu tiền?`, speech: `Em mua một ${item} giá ${price} đồng, đưa tờ ${pay} đồng. Cô bán hàng trả lại em bao nhiêu tiền?`,
            correct: pay - price, wrong: around(pay - price, { step: 100, min: 100, max: 900 }), format: fmtMoney, min: 100, max: 900,
            explanation: `Tiền trả lại = tiền đưa - giá: ${pay} - ${price} = ${pay - price} (đồng).` });
        const a = pickOne([100, 200, 300]), b = pickOne([200, 300, 500]);
        return single({ q: `Một ${item} giá ${fmtMoney(a)}, một ${pickOne(ITEMS.filter(x => x !== item))} giá ${fmtMoney(b)}. Mua cả hai thứ hết bao nhiêu tiền?`, speech: `Một thứ giá ${a} đồng, một thứ giá ${b} đồng. Mua cả hai hết bao nhiêu tiền?`,
            correct: a + b, wrong: around(a + b, { step: 100, min: 100, max: 1000 }), format: fmtMoney, min: 100, max: 1000, explanation: `${a} + ${b} = ${a + b} (đồng).` });
    }),
    tpl('g2.money_big', 2, () => {
        const notes = Array.from({ length: rint(2, 4) }, () => pickOne(BIG)).sort((a, b) => b - a), total = notes.reduce((s, x) => s + x, 0);
        return single({ q: 'Có tất cả bao nhiêu tiền?', speech: 'Cộng giá trị các tờ tiền. Có tất cả bao nhiêu tiền?', visual: { fn: 'notesSVG', args: [notes] },
            correct: total, wrong: around(total, { step: 1000, min: 1000, max: 200000 }), format: fmtMoney, min: 1000, max: 200000,
            explanation: `${notes.map(fmtMoney).join(' + ')} = ${fmtMoney(total)}.` });
    }),
];

export const generateG2Money = fromTemplates(templates);
