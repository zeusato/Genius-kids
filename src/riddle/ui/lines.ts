import type { Riddle } from '../content/types';
import { clean } from '../engine/normalize';

// Lời thoại Nhân Sư: ấm áp, ngắn, không bao giờ chê trách.
export const LINES = {
    invite: ['Em nghĩ đó là gì nào?', 'Soi kỹ từng manh mối nhé!', 'Câu này hay lắm đấy!', 'Ta tin em đoán được!', 'Từ từ suy nghĩ, không vội đâu.'],
    right: ['Tuyệt vời! Em giỏi quá!', 'Chính xác! Cổng đá sáng thêm rồi!', 'Hay lắm! Em đã tìm ra!', 'Đúng rồi! Ta phục em đấy!'],
    wrong: ['Chưa phải đâu, thử nghĩ lại nhé!', 'Gần hơn rồi đấy, đọc lại manh mối xem!', 'Không sao, ta cùng nghĩ tiếp nào!'],
    hint: ['Ta mách nhỏ em một điều nhé…', 'Đây là gợi ý của ta!'],
    reveal: ['Không sao cả! Cùng soi manh mối nào.', 'Câu này khó thật. Xem vì sao nhé!'],
};

export const pick = (list: string[], seed: string) => {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return list[h % list.length];
};

/** Gợi ý thứ ba: hình dạng đáp án (tự sinh, không lộ đáp án). */
export function shapeHint(r: Riddle): string {
    if (r.kind === 'math') return `Đáp án là một số có ${r.answer.trim().length} chữ số.`;
    if (r.lang === 'en') {
        const w = r.answer.trim();
        const words = w.split(/\s+/);
        return words.length > 1
            ? `Đáp án gồm ${words.length} từ tiếng Anh, bắt đầu bằng chữ “${w[0].toUpperCase()}”.`
            : `Từ tiếng Anh có ${w.replace(/[^A-Za-z]/g, '').length} chữ cái, bắt đầu bằng chữ “${w[0].toUpperCase()}”.`;
    }
    const words = clean(r.answer).split(' ');
    const generic = new Set(['con', 'cái', 'chiếc']);
    const core = words[0] && generic.has(words[0]) && words.length > 1 ? words.slice(1) : words;
    return `Đáp án có ${core.length} tiếng${core.length > 1 ? '' : ''}, bắt đầu bằng chữ “${core[0][0].toUpperCase()}”.`;
}

export function hintList(r: Riddle, n: number): string[] {
    return [r.hints[0], r.hints[1], shapeHint(r)].slice(0, n);
}

/** Lời đọc câu đố: mỗi dòng thơ một lượt đọc. */
export const textLines = (r: Riddle) => r.text.split('\n').map(s => s.trim()).filter(Boolean);
