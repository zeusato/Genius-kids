// Lớp 1 — Các số đến 10 (g1_numbers_10): đếm, so sánh, số lớn nhất/bé nhất, mấy và mấy.
import { tpl, fromTemplates, single, compare, rint, pickOne, sample } from '../kit';
import { around } from '../wrongs';
import { THINGS, word } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g1.count10', 1, () => {
        const t = pickOne(THINGS), n = rint(5, 10);
        return single({ q: `Có mấy ${t.name}?`, speech: `Đếm xem có mấy ${t.name}?`, visual: { fn: 'countingSVG', args: [t.e, n] },
            correct: n, wrong: around(n, { min: 1, max: 12 }), min: 1, max: 12,
            explanation: `Đếm lần lượt từng ${t.name}: có ${word(n)} ${t.name}.`, hint: 'Đếm theo từng hàng, đánh dấu hình đã đếm.' });
    }),
    tpl('g1.count10', 1, () => {
        const n = rint(0, 10), k = pickOne(['liền sau', 'liền trước'] as const);
        const ans = k === 'liền sau' ? n + 1 : n - 1;
        if (ans < 0 || ans > 10) return single({ q: `Số ${word(n)} viết là số nào?`, speech: `Số ${word(n)} viết là số nào?`, correct: n, wrong: around(n, { min: 0, max: 10 }), explanation: `Số ${word(n)} viết là ${n}.` });
        return single({ q: `Số ${k} số ${n} là số nào?`, speech: `Số ${k} số ${word(n)} là số nào?`, correct: ans, wrong: around(ans, { min: 0, max: 10 }), min: 0, max: 10,
            explanation: `Số ${k} ${n} là ${ans} (${k === 'liền sau' ? 'thêm' : 'bớt'} 1).` });
    }),
    tpl('g1.compare10', 1, () => {
        const a = rint(0, 10), b = rint(0, 10);
        return compare({ q: `Điền dấu thích hợp: ${a} ... ${b}`, speech: `So sánh ${a} và ${b}.`, left: a, right: b,
            explanation: a === b ? `Hai số bằng nhau nên điền dấu =: ${a} = ${b}.` : `${Math.max(a, b)} lớn hơn ${Math.min(a, b)} nên ${a} ${a > b ? '>' : '<'} ${b}.`, hint: 'Số nào đếm sau thì lớn hơn.' });
    }),
    tpl('g1.compare10', 2, () => {
        const nums = sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4), big = pickOne([true, false]);
        const ans = big ? Math.max(...nums) : Math.min(...nums);
        return single({ q: `Số nào ${big ? 'lớn nhất' : 'bé nhất'}: ${nums.join(', ')}?`, speech: `Trong các số ${nums.join(', ')}, số nào ${big ? 'lớn nhất' : 'bé nhất'}?`,
            correct: ans, wrong: nums.filter(x => x !== ans), closed: true, explanation: `So sánh lần lượt: ${ans} là số ${big ? 'lớn nhất' : 'bé nhất'}.` });
    }, { noRankCheck: true }),
    tpl('g1.split10', 1, () => {
        const n = rint(3, 10), a = rint(1, n - 1);
        return single({ q: `${n} gồm ${a} và mấy?`, speech: `${word(n)} gồm ${word(a)} và mấy?`,
            visual: { fn: 'countingSVG', args: ['🔵', n, { perRow: 5 }] },
            correct: n - a, wrong: around(n - a, { min: 0, max: 10 }), min: 0, max: 10,
            explanation: `${n} gồm ${a} và ${n - a} (vì ${a} + ${n - a} = ${n}).`, hint: `Đếm thêm từ ${a} cho đến ${n}.` });
    }),
    tpl('g1.split10', 2, () => {
        const t = pickOne(THINGS.filter(x => /quả|bông|cái|chiếc/.test(x.name))), n = rint(4, 10), a = rint(1, n - 1);
        return single({ q: `Có ${n} ${t.name} chia vào hai đĩa. Đĩa thứ nhất có ${a} ${t.name}. Đĩa thứ hai có mấy ${t.name}?`,
            speech: `Có ${word(n)} ${t.name} chia vào hai đĩa. Đĩa thứ nhất có ${word(a)}. Đĩa thứ hai có mấy ${t.name}?`,
            correct: n - a, wrong: around(n - a, { min: 0, max: 10 }), min: 0, max: 10,
            explanation: `${n} gồm ${a} và ${n - a}, nên đĩa thứ hai có ${n - a} ${t.name}.` });
    }),
];

export const generateNumbers10 = fromTemplates(templates);
