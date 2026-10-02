import type { Riddle } from '../content/types';
import { answerKey, levenshtein, parseNumber, sameKey } from './normalize';

/**
 * correct  – đúng nguyên cụm (hoặc một cách gọi trong accept).
 * spelling – đúng nhưng thiếu/sai dấu hoặc gõ nhầm 1 chữ: vẫn tính đúng, nhắc cách viết.
 * marks    – gõ không dấu mà trùng cả đáp án lẫn một đáp án nhiễu ("dua": dứa hay dừa?): nhờ gõ có dấu, không tính lần sai.
 * close    – gần đúng (nằm trong close): nhắc nghĩ thêm, không tính là lần sai.
 * wrong    – sai.
 * KHÔNG BAO GIỜ khớp chuỗi con: "ày" không phải "giày".
 */
export type Verdict = 'correct' | 'spelling' | 'marks' | 'close' | 'wrong';

const matches = (input: string, list: string[], strip: boolean) => {
    const k = answerKey(input, { strip });
    return list.some(v => sameKey(k, answerKey(v, { strip }), strip));
};

export function judge(riddle: Riddle, input: string): Verdict {
    if (!input.trim()) return 'wrong';
    if (riddle.kind === 'math') {
        const n = parseNumber(input);
        if (n !== null && n === parseNumber(riddle.answer)) return 'correct';
        return riddle.accept.some(a => answerKey(a) === answerKey(input)) ? 'correct' : 'wrong';
    }
    const variants = [riddle.answer, ...riddle.accept];
    const decoys = riddle.choices.map(c => c.text);
    if (matches(input, variants, false)) return 'correct';
    if (matches(input, decoys, false)) return 'wrong';
    if (matches(input, variants, true)) {
        if (riddle.lang === 'en') return 'correct';
        return matches(input, decoys, true) ? 'marks' : 'spelling';
    }
    if (matches(input, riddle.close || [], true)) return 'close';
    // Gõ nhầm một chữ ở đáp án đủ dài (không áp dụng cho đố chữ: ở đó từng chữ là đáp án).
    const loose = answerKey(input, { strip: true });
    if (riddle.kind !== 'wordplay' && loose.length >= 5 && !matches(input, decoys, true)
        && variants.some(v => { const k = answerKey(v, { strip: true }); return k.length >= 5 && levenshtein(k, loose) === 1; })) return 'spelling';
    return 'wrong';
}

export const isRight = (v: Verdict) => v === 'correct' || v === 'spelling';
