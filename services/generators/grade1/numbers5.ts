// Lớp 1 — Các số đến 5 (g1_numbers_5): đếm, đọc, viết; so sánh; thứ tự.
import { tpl, fromTemplates, single, compare, order, rint, pickOne, sample } from '../kit';
import { around } from '../wrongs';
import { THINGS, word } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g1.count5', 1, () => {
        const t = pickOne(THINGS), n = rint(1, 5);
        return single({
            q: `Có mấy ${t.name}?`, speech: `Đếm xem có mấy ${t.name}?`, visual: { fn: 'countingSVG', args: [t.e, n] },
            correct: n, wrong: around(n, { min: 0, max: 6 }), min: 0, max: 6,
            explanation: `Đếm lần lượt: có ${word(n)} ${t.name}, viết là ${n}.`, hint: 'Chỉ tay vào từng hình và đếm to.',
        });
    }),
    tpl('g1.count5', 1, () => {
        const n = rint(0, 5);
        return single({
            q: `Số "${word(n)}" viết là số nào?`, speech: `Số ${word(n)} viết là số nào?`,
            correct: n, wrong: sample([0, 1, 2, 3, 4, 5].filter(x => x !== n), 3),
            explanation: `Số ${word(n)} viết là ${n}.`,
        });
    }),
    tpl('g1.compare5', 1, () => {
        const a = rint(0, 5), b = pickOne([0, 1, 2, 3, 4, 5]);
        return compare({ q: `Điền dấu thích hợp: ${a} ... ${b}`, speech: `So sánh ${a} và ${b}. Chọn dấu lớn hơn, bé hơn hoặc bằng.`, left: a, right: b,
            explanation: a === b ? `Hai số bằng nhau nên điền dấu =: ${a} = ${b}.` : `${Math.max(a, b)} lớn hơn ${Math.min(a, b)}, nên ${a} ${a > b ? '>' : '<'} ${b}.`, hint: 'Đầu nhọn của dấu chỉ vào số bé hơn.' });
    }),
    tpl('g1.compare5', 2, () => {
        const [t1, t2] = sample(THINGS, 2), a = rint(1, 5), b = rint(1, 5);
        return compare({ q: `Đếm hai nhóm rồi điền dấu: ${a} ... ${b}`, speech: `Nhóm một có ${word(a)}, nhóm hai có ${word(b)}. Điền dấu lớn hơn, bé hơn hay bằng?`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t1.e, n: a }, { emoji: t2.e, n: b }]] }, left: a, right: b,
            explanation: a === b ? 'Hai nhóm bằng nhau nên điền dấu =.' : `Nhóm ${a > b ? 1 : 2} nhiều hơn, nên ${a} ${a > b ? '>' : '<'} ${b}.` });
    }),
    tpl('g1.order5', 1, () => {
        const n = rint(0, 4), after = pickOne([true, false]) || n === 0;
        const ans = after ? n + 1 : n - 1;
        return single({ q: `Số liền ${after ? 'sau' : 'trước'} số ${n} là số nào?`, speech: `Số liền ${after ? 'sau' : 'trước'} số ${word(n)} là số nào?`,
            correct: ans, wrong: around(ans, { min: 0, max: 6 }), min: 0, max: 6,
            explanation: `Đếm ${after ? 'tiến' : 'lùi'} một: ${n} → ${ans}.` });
    }),
    tpl('g1.order5', 2, () => {
        const start = rint(0, 1), seq = [0, 1, 2, 3, 4].map(i => i + start), k = rint(1, 3);
        const shown = seq.map((x, i) => (i === k ? '□' : String(x))).join(', ');
        return single({ q: `Điền số còn thiếu: ${shown}`, speech: `Điền số còn thiếu vào ô trống: ${shown.replace('□', 'ô trống')}`,
            correct: seq[k], wrong: around(seq[k], { min: 0, max: 6 }), min: 0, max: 6,
            explanation: `Các số tăng dần thêm 1: ${seq.join(', ')}.` });
    }),
    tpl('g1.order5', 2, () => {
        const items = sample([0, 1, 2, 3, 4, 5], 4).sort((x, y) => x - y), asc = pickOne([true, false]);
        const list = asc ? items : [...items].reverse();
        return order({ q: `Sắp xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`, speech: `Sắp xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`,
            items: list.map(String), explanation: `Thứ tự đúng: ${list.join(', ')}.` });
    }),
];

export const generateNumbers5 = fromTemplates(templates);
