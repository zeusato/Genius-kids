// Lớp 4 — Phép chia (g4_division): chia cho số có một, hai chữ số; chia cho 10, 100, 1000.
import { tpl, fromTemplates, single, choices, rint, pickOne, chance, shuffle } from '../kit';
import { remainderError } from '../wrongs';
import { generateWrongAnswersWithSameUnits as sameUnits } from '../distractors';
import { fmt } from '../../study/value';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g4.div', 1, () => {
        const b = rint(2, 9), q = rint(1000, 99999);
        return single({ q: `${fmt(b * q)} : ${b} = ?`, correct: q, wrong: [Math.floor(q / 10), q * 10, ...sameUnits(q, 2, 1000)], step: 10, min: 0,
            explanation: `Chia lần lượt từ trái sang phải: ${fmt(b * q)} : ${b} = ${fmt(q)} (thử lại: ${fmt(q)} × ${b} = ${fmt(b * q)}).`, hint: 'Thử lại bằng phép nhân.' });
    }),
    tpl('g4.div', 2, () => {
        const b = rint(12, 99), q = rint(12, 999);
        return single({ q: `${fmt(b * q)} : ${b} = ?`, correct: q, wrong: [q + 10, q - 10, q + 1, Math.floor(q / 10) || q + 2], min: 0,
            explanation: `Ước lượng thương từng bước rồi thử lại: ${fmt(q)} × ${b} = ${fmt(b * q)}, nên ${fmt(b * q)} : ${b} = ${fmt(q)}.`, hint: 'Làm tròn số chia để ước lượng thương.' });
    }),
    tpl('g4.div', 3, () => {
        const b = rint(12, 40), q = rint(15, 300), r = rint(1, b - 1), total = b * q + r;
        if (chance(0.5)) {
            const right = `${q} dư ${r}`;
            const opts = shuffle([right, ...remainderError(q, r, b).slice(0, 3).map(([x, y]) => `${x} dư ${y}`)]);
            return choices({ q: `${fmt(total)} : ${b} = ?`, options: [...new Set(opts)], correct: right, explanation: `${q} × ${b} = ${fmt(q * b)}; ${fmt(total)} - ${fmt(q * b)} = ${r} (bé hơn ${b}). Vậy được ${q} dư ${r}.`, hint: 'Số dư phải bé hơn số chia.' });
        }
        return single({ q: `Có ${fmt(total)} quyển vở chia đều cho ${b} lớp. Hỏi còn thừa bao nhiêu quyển vở?`,
            correct: r, wrong: [q, b - r, r + 1, b].filter(x => x !== r), min: 0,
            explanation: `${fmt(total)} : ${b} = ${q} (dư ${r}). Mỗi lớp được ${q} quyển, còn thừa ${r} quyển.` });
    }, { noRankCheck: true }),
    tpl('g4.div10', 1, () => {
        const k = pickOne([10, 100, 1000]), q = rint(2, 9999), n = q * k;
        return single({ q: `${fmt(n)} : ${fmt(k)} = ?`, correct: q, wrong: [q * 10, Math.floor(q / 10) || q + 1, q + k], min: 0,
            explanation: `Chia số tròn ${k === 10 ? 'chục' : k === 100 ? 'trăm' : 'nghìn'} cho ${fmt(k)}: bỏ ${String(k).length - 1} chữ số 0 ở tận cùng: ${fmt(q)}.` });
    }),
    tpl('g4.div10', 2, () => {
        const b = rint(2, 9) * 10, q = rint(12, 999);
        return single({ q: `${fmt(b * q)} : ${b} = ?`, correct: q, wrong: [q * 10, Math.floor(q / 10) || q + 2, q + 10, q - 10], min: 0,
            explanation: `Cùng bỏ một chữ số 0 ở số bị chia và số chia: ${fmt(b * q / 10)} : ${b / 10} = ${fmt(q)}.`, hint: 'Cùng xoá một chữ số 0 ở tận cùng của số bị chia và số chia.' });
    }),
];

export const generateDivision = fromTemplates(templates);
