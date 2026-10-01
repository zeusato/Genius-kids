// Lớp 1 — Bài toán có lời văn (g1_word_problems): thêm, bớt, gộp lại, còn lại (một bước).
import { tpl, fromTemplates, single, choices, rint, pickOne, chance, shuffle } from '../kit';
import { around } from '../wrongs';
import { THINGS, word } from './common';
import type { Template } from '../../study/types';

const KIDS = ['Lan', 'Minh', 'An', 'Hoa', 'Nam', 'Mai', 'Bình', 'Linh'];
const unit = (name: string) => name.split(' ').slice(1).join(' ') || name; // "quả táo" → "táo"

export const templates: Template[] = [
    tpl('g1.word10', 2, () => {
        const t = pickOne(THINGS), kid = pickOne(KIDS), add = chance(0.5);
        if (add) {
            const a = rint(1, 7), b = rint(1, 10 - a);
            return single({ q: `${kid} có ${a} ${t.name}, được cho thêm ${b} ${t.name}. Hỏi ${kid} có tất cả mấy ${t.name}?`,
                speech: `${kid} có ${word(a)} ${t.name}, được cho thêm ${word(b)} ${t.name}. Hỏi ${kid} có tất cả mấy ${t.name}?`,
                visual: { fn: 'groupsSVG', args: [[{ emoji: t.e, n: a, label: 'Có' }, { emoji: t.e, n: b, label: 'Thêm' }]] },
                correct: a + b, wrong: [...around(a + b, { min: 0, max: 10 }), Math.abs(a - b)], min: 0, max: 10,
                explanation: `Thêm vào thì làm phép cộng: ${a} + ${b} = ${a + b} (${unit(t.name)}).`, hint: '"Thêm", "tất cả" thường là phép cộng.' });
        }
        const a = rint(3, 10), b = rint(1, a - 1);
        return single({ q: `${kid} có ${a} ${t.name}, ${kid} cho bạn ${b} ${t.name}. Hỏi ${kid} còn lại mấy ${t.name}?`,
            speech: `${kid} có ${word(a)} ${t.name}, ${kid} cho bạn ${word(b)} ${t.name}. Hỏi ${kid} còn lại mấy ${t.name}?`,
            visual: { fn: 'crossedSVG', args: [t.e, a, b] }, correct: a - b, wrong: [...around(a - b, { min: 0, max: 10 }), a + b], min: 0, max: 10,
            explanation: `Cho đi thì bớt, làm phép trừ: ${a} - ${b} = ${a - b} (${unit(t.name)}).`, hint: '"Cho đi", "còn lại" thường là phép trừ.' });
    }, { weight: 2 }),
    tpl('g1.word10', 3, () => {
        const t = pickOne(THINGS), [k1, k2] = shuffle(KIDS).slice(0, 2), a = rint(1, 6), b = rint(1, 10 - a), add = chance(0.5);
        const right = add ? `${a} + ${b} = ${a + b}` : `${a + b} - ${b} = ${a}`;
        const q = add ? `${k1} có ${a} ${t.name}, ${k2} có ${b} ${t.name}. Cả hai bạn có mấy ${t.name}? Chọn phép tính đúng.`
            : `Có ${a + b} ${t.name}, ${k1} lấy đi ${b} ${t.name}. Còn lại mấy ${t.name}? Chọn phép tính đúng.`;
        const opts = [...new Set([right, add ? `${a + b} - ${b} = ${a}` : `${a + b} + ${b} = ${a + 2 * b}`, add ? `${a} + ${b} = ${a + b + 1}` : `${a + b} - ${b} = ${a + 1}`, add ? `${b} - ${Math.min(a, b)} = ${b - Math.min(a, b)}` : `${b} + ${a} = ${a + b}`])];
        return choices({ q, speech: q, options: shuffle(opts), correct: right, explanation: `${add ? 'Gộp hai nhóm: phép cộng' : 'Lấy đi: phép trừ'} — ${right}.` });
    }),
    tpl('g1.word100', 2, () => {
        const add = chance(0.5), cls = pickOne(['1A', '1B', '1C']);
        if (add) {
            const a = rint(1, 4) * 10 + rint(0, 4), b = rint(1, 4) * 10 + rint(0, 5);
            return single({ q: `Lớp ${cls} có ${a} bạn nam và ${b} bạn nữ. Hỏi lớp ${cls} có tất cả bao nhiêu bạn?`, speech: `Lớp ${cls} có ${a} bạn nam và ${b} bạn nữ. Hỏi lớp có tất cả bao nhiêu bạn?`,
                correct: a + b, wrong: [...around(a + b, { min: 10, max: 99, step: chance(0.5) ? 1 : 10 }), Math.abs(a - b)], min: 0, max: 99,
                explanation: `Gộp lại: ${a} + ${b} = ${a + b} (bạn).`, steps: [`Số bạn cả lớp = số bạn nam + số bạn nữ`, `${a} + ${b} = ${a + b}`] });
        }
        const a = rint(3, 9) * 10 + rint(5, 9), b = rint(1, 2) * 10 + rint(0, 5);
        return single({ q: `Cửa hàng có ${a} quả bóng, đã bán ${b} quả bóng. Hỏi cửa hàng còn lại bao nhiêu quả bóng?`, speech: `Cửa hàng có ${a} quả bóng, đã bán ${b} quả bóng. Hỏi còn lại bao nhiêu quả bóng?`,
            correct: a - b, wrong: [...around(a - b, { min: 0, max: 99, step: chance(0.5) ? 1 : 10 }), a + b > 99 ? a - b + 20 : a + b], min: 0, max: 99,
            explanation: `Đã bán thì bớt đi: ${a} - ${b} = ${a - b} (quả bóng).`, steps: [`Số bóng còn lại = số bóng có - số bóng đã bán`, `${a} - ${b} = ${a - b}`] });
    }),
    tpl('g1.word100', 3, () => {
        const add = chance(0.5), a = rint(2, 6) * 10 + rint(0, 4), b = rint(1, 3) * 10 + rint(0, 5);
        const q = add ? `Thùng thứ nhất có ${a} quyển sách, thùng thứ hai có ${b} quyển sách. Cả hai thùng có bao nhiêu quyển sách? Chọn phép tính đúng.`
            : `Vườn có ${a + b} cây cam, người ta đã hái hết quả ở ${b} cây. Hỏi còn bao nhiêu cây chưa hái? Chọn phép tính đúng.`;
        const right = add ? `${a} + ${b} = ${a + b}` : `${a + b} - ${b} = ${a}`;
        const opts = [...new Set([right, add ? `${Math.max(a, b)} - ${Math.min(a, b)} = ${Math.abs(a - b)}` : `${a + b} + ${b} = ${a + 2 * b}`, add ? `${a} + ${b} = ${a + b + 10}` : `${a + b} - ${b} = ${a + 10}`, add ? `${a} + ${b} = ${a + b - 1}` : `${a + b} - ${b} = ${a - 1}`])];
        return choices({ q, speech: q, options: shuffle(opts), correct: right, explanation: `${add ? 'Gộp cả hai thùng: phép cộng' : 'Bớt số cây đã hái: phép trừ'} — ${right}.` });
    }),
];

export const generateWordProblems = fromTemplates(templates);
