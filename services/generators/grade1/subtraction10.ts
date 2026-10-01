// Lớp 1 — Phép trừ trong phạm vi 10 (g1_subtraction_10); tính có hai dấu; viết phép tính theo tranh.
// Giữ dạng chữ "Tính: a - b = ?" vì MathRacing lọc câu theo mẫu này.
import { tpl, fromTemplates, single, choices, input, rint, pickOne, chance, shuffle } from '../kit';
import { around, opError } from '../wrongs';
import { THINGS, word, cap } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g1.sub10', 1, () => {
        const t = pickOne(THINGS), a = rint(2, 10), b = rint(1, a - 1);
        return single({ q: `Tính: ${a} - ${b} = ?`, speech: `Có ${word(a)} ${t.name}, bớt đi ${word(b)} ${t.name}. ${word(a)} trừ ${word(b)} bằng mấy?`,
            visual: { fn: 'crossedSVG', args: [t.e, a, b] },
            correct: a - b, wrong: [...around(a - b, { min: 0, max: 10 }), ...opError(a, b, '-')], min: 0, max: 10,
            explanation: `${cap(word(a))} bớt ${word(b)} còn ${word(a - b)}: ${a} - ${b} = ${a - b}.`, hint: 'Đếm những hình chưa bị gạch.' });
    }, { weight: 2 }),
    tpl('g1.sub10', 2, () => {
        const a = rint(4, 10), b = rint(1, a);
        return single({ q: `Tính: ${a} - ${b} = ?`, speech: `${a} trừ ${b} bằng mấy?`,
            correct: a - b, wrong: [...around(a - b, { min: 0, max: 10 }), a + b], min: 0, max: 10,
            explanation: `${a} - ${b} = ${a - b} (vì ${a - b} + ${b} = ${a}).`, hint: `Đếm lùi ${b} bước từ ${a}.` });
    }, { weight: 2 }),
    tpl('g1.sub10_missing', 2, () => {
        const a = rint(3, 10), b = rint(1, a - 1), front = chance(0.4);
        const q = front ? `□ - ${b} = ${a - b}` : `${a} - □ = ${a - b}`;
        const ans = front ? a : b;
        const say = `Số nào điền vào ô trống: ${q.replace('□', 'ô trống').replace('-', 'trừ').replace('=', 'bằng')}`;
        return chance(0.5)
            ? single({ q: `Số nào điền vào ô trống: ${q}`, speech: say, correct: ans, wrong: around(ans, { min: 0, max: 10 }), min: 0, max: 10,
                explanation: front ? `Vì ${a - b} + ${b} = ${a} nên số cần điền là ${a}.` : `Vì ${a} - ${b} = ${a - b} nên số cần điền là ${b}.` })
            : input({ q: `Điền số vào ô trống: ${q}`, speech: say, correct: ans,
                explanation: front ? `Vì ${a - b} + ${b} = ${a} nên số cần điền là ${a}.` : `Vì ${a} - ${b} = ${a - b} nên số cần điền là ${b}.` });
    }),
    tpl('g1.chain10', 2, () => {
        const a = rint(1, 7), b = rint(1, 10 - a), c = rint(1, a + b - 1);
        return single({ q: `Tính: ${a} + ${b} - ${c} = ?`, speech: `${a} cộng ${b} trừ ${c} bằng mấy?`,
            correct: a + b - c, wrong: [...around(a + b - c, { min: 0, max: 10 }), a + b + c, a + b], min: 0, max: 10,
            explanation: `Tính lần lượt từ trái sang phải: ${a} + ${b} = ${a + b}; ${a + b} - ${c} = ${a + b - c}.`,
            steps: [`${a} + ${b} = ${a + b}`, `${a + b} - ${c} = ${a + b - c}`], hint: 'Tính từ trái sang phải.' });
    }),
    tpl('g1.chain10', 3, () => {
        const a = rint(5, 10), b = rint(1, a - 2), c = rint(1, a - b - 1);
        return single({ q: `Tính: ${a} - ${b} - ${c} = ?`, speech: `${a} trừ ${b} trừ ${c} bằng mấy?`,
            correct: a - b - c, wrong: [...around(a - b - c, { min: 0, max: 10 }), a - b, a - b + c], min: 0, max: 10,
            explanation: `${a} - ${b} = ${a - b}; ${a - b} - ${c} = ${a - b - c}.`, steps: [`${a} - ${b} = ${a - b}`, `${a - b} - ${c} = ${a - b - c}`], hint: 'Tính từ trái sang phải.' });
    }, { noRankCheck: true }), // miền 0–10 hẹp
    tpl('g1.write_eq', 2, () => {
        const t = pickOne(THINGS), a = rint(1, 6), b = rint(1, 10 - a);
        const right = `${a} + ${b} = ${a + b}`;
        const opts = shuffle([right, `${a + b} - ${b} = ${a}`, `${a + b} - ${a} = ${b}`, `${a} + ${b} = ${a + b + 1}`]);
        return choices({ q: 'Phép tính nào phù hợp với tranh?', speech: `Có ${word(a)} ${t.name}, thêm ${word(b)} ${t.name}. Phép tính nào phù hợp với tranh?`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t.e, n: a, label: 'Có' }, { emoji: t.e, n: b, label: 'Thêm' }]] },
            options: [...new Set(opts)], correct: right, explanation: `Có ${a}, thêm ${b}: ta làm phép cộng ${right}.` });
    }),
    tpl('g1.write_eq', 3, () => {
        const t = pickOne(THINGS), a = rint(3, 10), b = rint(1, a - 1);
        const right = `${a} - ${b} = ${a - b}`;
        const opts = [...new Set(shuffle([right, `${a} + ${b} = ${a + b}`, `${a - b} + ${b} = ${a}`, `${a} - ${b} = ${a - b + 1}`]))];
        return choices({ q: 'Phép tính nào cho biết còn lại bao nhiêu?', speech: `Có ${word(a)} ${t.name}, bớt đi ${word(b)}. Phép tính nào cho biết còn lại bao nhiêu?`,
            visual: { fn: 'crossedSVG', args: [t.e, a, b] }, options: opts, correct: right,
            explanation: `Có ${a}, bớt đi ${b}, còn lại: ${right}.` });
    }),
];

export const generateSubtraction10 = fromTemplates(templates);
