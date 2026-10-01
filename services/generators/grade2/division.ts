// Lớp 2 — Phép chia (g2_division). GDPT 2018: bảng chia 2 và 5; bảng 3, 4 và "tìm số bị chia" là "Nâng cao".
// Giữ mẫu nhập "? : b = q" (MathRacing lọc ManualInput có đáp án ≥ 18).
import { tpl, fromTemplates, single, choices, input, rint, pickOne, chance } from '../kit';

import type { Template } from '../../study/types';

const THINGS: [string, string][] = [['cái kẹo', 'bạn'], ['quả cam', 'đĩa'], ['quyển vở', 'bạn'], ['bông hoa', 'bình']];

function divTemplates(skill: 'g2.div_table' | 'g2.div_table34', tables: number[]) {
    return [
        tpl(skill, 1, () => {
            const b = pickOne(tables), q = rint(1, 10);
            return single({ q: `Tính: ${b * q} : ${b} = ?`, speech: `${b * q} chia ${b} bằng bao nhiêu?`, correct: q, wrong: [q + 1, q - 1, b * q - b, q + b], min: 0, max: 50,
                explanation: `Vì ${b} × ${q} = ${b * q} nên ${b * q} : ${b} = ${q}.`, hint: `Nhớ lại bảng nhân ${b}: ${b} nhân mấy bằng ${b * q}?` });
        }, { weight: 2 }),
        tpl(skill, 2, () => {
            const b = pickOne(tables), q = rint(2, 10), [it, who] = pickOne(THINGS);
            return single({ q: `Có ${b * q} ${it} chia đều cho ${b} ${who}. Hỏi mỗi ${who} được mấy ${it}?`, speech: `Có ${b * q} ${it} chia đều cho ${b} ${who}. Hỏi mỗi ${who} được mấy ${it}?`,
                correct: q, wrong: [b * q - b, q + 1, q - 1, b], min: 0, max: 50,
                explanation: `Chia đều thì làm phép chia: ${b * q} : ${b} = ${q} (${it}).`, steps: [`Số ${it} mỗi ${who}: ${b * q} : ${b} = ${q} (${it})`, `Đáp số: ${q} ${it}`] });
        }),
    ];
}

export const templates: Template[] = [
    tpl('g2.div_meaning', 1, () => {
        const b = pickOne([2, 5]), q = rint(2, 10), k = rint(0, 2), parts = [b * q, b, q], names = ['Số bị chia', 'Số chia', 'Thương'];
        return choices({ q: `Trong phép chia ${b * q} : ${b} = ${q}, số ${parts[k]} được gọi là gì?`, speech: `Trong phép chia ${b * q} chia ${b} bằng ${q}, số ${parts[k]} được gọi là gì?`,
            options: ['Số bị chia', 'Số chia', 'Thương', 'Tích'], shuffle: true, correct: names[k], explanation: `${b * q} là số bị chia, ${b} là số chia, ${q} là thương.` });
    }),
    tpl('g2.div_meaning', 2, () => {
        const b = pickOne([2, 5]), q = rint(2, 10);
        return single({ q: `Biết ${b} × ${q} = ${b * q}. Vậy ${b * q} : ${b} = ?`, speech: `Biết ${b} nhân ${q} bằng ${b * q}. Vậy ${b * q} chia ${b} bằng bao nhiêu?`,
            correct: q, wrong: [b, b * q, q + 1, q - 1], min: 0, max: 50, explanation: `Từ phép nhân ${b} × ${q} = ${b * q} ta có phép chia ${b * q} : ${b} = ${q}.` });
    }),
    ...divTemplates('g2.div_table', [2, 5]),
    ...divTemplates('g2.div_table34', [3, 4]),
    tpl('g2.div_table34', 2, () => {
        const b = pickOne([2, 3, 4, 5]), q = rint(chance(0.7) ? 5 : 2, 10);
        return input({ q: `? : ${b} = ${q}`, speech: `Số nào chia ${b} bằng ${q}?`, correct: b * q,
            explanation: `Muốn tìm số bị chia, lấy thương nhân với số chia: ${q} × ${b} = ${b * q}.`, hint: 'Lấy thương nhân với số chia.' });
    }),
];

export const generateG2Division = fromTemplates(templates);
