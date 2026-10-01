// Lớp 2 — Phép cộng, phép trừ (qua 10) trong phạm vi 20 (g2_add_sub_20).
import { tpl, fromTemplates, single, input, rint, chance } from '../kit';
import { around, carryError } from '../wrongs';
import { say } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g2.addsub20', 1, () => {
        if (chance(0.5)) {
            const a = rint(2, 9), b = rint(11 - a, 9);
            return single({ q: `Tính: ${a} + ${b} = ?`, speech: say(a, '+', b), correct: a + b, wrong: [...carryError(a, b, '+'), a + b - 1], min: 0, max: 20,
                explanation: `Tách ${b} = ${10 - a} + ${a + b - 10}: ${a} + ${10 - a} = 10, 10 + ${a + b - 10} = ${a + b}.`, steps: [`${a} + ${10 - a} = 10`, `10 + ${a + b - 10} = ${a + b}`], hint: `Gộp ${a} với ${10 - a} cho tròn 10 trước.` });
        }
        const a = rint(11, 18), b = rint(a - 9, 9);
        return single({ q: `Tính: ${a} - ${b} = ?`, speech: say(a, '-', b), correct: a - b, wrong: [...carryError(a, b, '-'), a - b + 1], min: 0, max: 20,
            explanation: `Tách ${b} = ${a - 10} + ${b - (a - 10)}: ${a} - ${a - 10} = 10, 10 - ${b - (a - 10)} = ${a - b}.`, steps: [`${a} - ${a - 10} = 10`, `10 - ${b - (a - 10)} = ${a - b}`], hint: 'Trừ để còn 10 trước, rồi trừ tiếp.' });
    }, { weight: 2 }),
    tpl('g2.addsub20', 2, () => {
        const a = rint(2, 9), b = rint(11 - a, 9), s = a + b, kind = rint(0, 2);
        if (kind === 0) return input({ q: `Điền số: ${a} + ? = ${s}`, speech: `${a} cộng mấy bằng ${s}?`, correct: b, explanation: `${s} - ${a} = ${b}, nên ${a} + ${b} = ${s}.`, hint: 'Lấy tổng trừ đi số hạng đã biết.' });
        if (kind === 1) return input({ q: `Điền số: ${s} - ? = ${a}`, speech: `${s} trừ mấy bằng ${a}?`, correct: b, explanation: `${s} - ${b} = ${a} (vì ${a} + ${b} = ${s}).`, hint: 'Dùng phép cộng để kiểm tra.' });
        return single({ q: `Biết ${a} + ${b} = ${s}. Vậy ${s} - ${b} = ?`, speech: `Biết ${a} cộng ${b} bằng ${s}. Vậy ${s} trừ ${b} bằng bao nhiêu?`, correct: a, wrong: around(a, { min: 0, max: 20 }), min: 0, max: 20,
            explanation: `Lấy tổng trừ đi một số hạng thì được số hạng kia: ${s} - ${b} = ${a}.` });
    }),
];

export const generateG2AddSub20 = fromTemplates(templates);
