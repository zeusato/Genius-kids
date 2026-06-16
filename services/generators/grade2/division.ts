import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

const wrongs = (ans: number): string[] => {
    const set = new Set<number>();
    for (const c of shuffleArray([ans + 1, ans - 1, ans + 2, ans - 2, ans + 3])) { if (c > 0 && c !== ans) set.add(c); if (set.size >= 3) break; }
    while (set.size < 3) { const c = ans + randomInt(1, 4); if (c !== ans) set.add(c); }
    return Array.from(set).slice(0, 3).map(String);
};

/**
 * Lớp 2 — Phép chia: bảng chia 2,3,4,5 + quan hệ với phép nhân + chia đều.
 */
export const generateG2Division = (): Omit<Question, 'id' | 'topicId'> => {
    const divisor = pick([2, 3, 4, 5]);
    const quotient = randomInt(1, 10);
    const dividend = divisor * quotient;
    const r = Math.random();

    // 1. Từ phép nhân suy ra phép chia (25%)
    if (r < 0.25) {
        return {
            type: QuestionType.SingleChoice,
            questionText: `Biết ${divisor} × ${quotient} = ${dividend}. Vậy ${dividend} : ${divisor} = ?`,
            correctAnswer: String(quotient),
            options: shuffleArray([String(quotient), ...wrongs(quotient)]),
            explanation: `Từ ${divisor} × ${quotient} = ${dividend} suy ra ${dividend} : ${divisor} = ${quotient}.`,
        };
    }

    // 2. Chia đều (lời văn) (25%)
    if (r < 0.5) {
        const items = pick([['cái kẹo', 'bạn'], ['quả táo', 'rổ'], ['cái bánh', 'đĩa'], ['bông hoa', 'lọ']]);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${dividend} ${items[0]} chia đều cho ${divisor} ${items[1]}. Mỗi ${items[1]} có mấy ${items[0]}?`,
            correctAnswer: String(quotient),
            options: shuffleArray([String(quotient), ...wrongs(quotient)]),
            explanation: `Lấy ${dividend} : ${divisor} = ${quotient} (${items[0]}).`,
        };
    }

    // 3. Tìm số bị chia/số chia còn thiếu (15%)
    if (r < 0.65) {
        return {
            type: QuestionType.ManualInput,
            questionText: `? : ${divisor} = ${quotient}`,
            correctAnswer: String(dividend),
            explanation: `Số bị chia = thương × số chia = ${quotient} × ${divisor} = ${dividend}.`,
        };
    }

    // 4. Phép chia trực tiếp (35%)
    return {
        type: QuestionType.SingleChoice,
        questionText: `${dividend} : ${divisor} = ?`,
        correctAnswer: String(quotient),
        options: shuffleArray([String(quotient), ...wrongs(quotient)]),
        explanation: `${dividend} : ${divisor} = ${quotient}.`,
    };
};
