import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const m5 = () => randomInt(1, 11) * 5; // số phút bội của 5 (5..55)

/** Định dạng tổng phút → "h giờ m phút". */
const fmt = (total: number): string => {
    const h = Math.floor(total / 60), m = total % 60;
    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
};
const timeOpts = (totalMin: number): string[] => {
    const set = new Set<string>([fmt(totalMin)]);
    const deltas = [5, -5, 10, -10, 60, -60, 15];
    for (const d of shuffleArray(deltas)) { const v = totalMin + d; if (v > 0) set.add(fmt(v)); if (set.size >= 4) break; }
    return shuffleArray(Array.from(set).slice(0, 4));
};

/**
 * Lớp 5 — Phép tính với số đo thời gian: cộng, trừ, đổi đơn vị, nhân (giờ–phút).
 * (Chuẩn GDPT 2018 lớp 5.)
 */
export const generateG5TimeOps = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();

    // 1. Cộng giờ–phút (có nhớ sang giờ) (30%)
    if (r < 0.3) {
        const h1 = randomInt(1, 4), m1 = m5(), h2 = randomInt(1, 4), m2 = m5();
        const total = (h1 * 60 + m1) + (h2 * 60 + m2);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${fmt(h1 * 60 + m1)} + ${fmt(h2 * 60 + m2)} = ?`,
            correctAnswer: fmt(total),
            options: timeOpts(total),
            explanation: `${m1} + ${m2} = ${m1 + m2} phút${m1 + m2 >= 60 ? ` = ${Math.floor((m1 + m2) / 60)} giờ ${(m1 + m2) % 60} phút` : ''}; cộng giờ. Kết quả ${fmt(total)}.`,
        };
    }

    // 2. Trừ giờ–phút (có mượn) (30%)
    if (r < 0.6) {
        let a = randomInt(3, 6) * 60 + m5();
        let b = randomInt(1, 2) * 60 + m5();
        if (b > a) [a, b] = [b, a];
        const total = a - b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${fmt(a)} − ${fmt(b)} = ?`,
            correctAnswer: fmt(total),
            options: timeOpts(total),
            explanation: `Đổi ra phút rồi trừ: ${a} − ${b} = ${total} phút = ${fmt(total)}.`,
        };
    }

    // 3. Đổi giờ–phút sang phút (20%)
    if (r < 0.8) {
        const h = randomInt(1, 5), m = m5();
        const total = h * 60 + m;
        const set = new Set<number>([total]);
        while (set.size < 4) { const v = total + randomInt(-3, 3) * 10; if (v > 0 && v !== total) set.add(v); }
        return {
            type: QuestionType.SingleChoice,
            questionText: `${h} giờ ${m} phút = ? phút`,
            correctAnswer: `${total} phút`,
            options: shuffleArray(Array.from(set)).map(v => `${v} phút`),
            explanation: `${h} giờ = ${h * 60} phút; ${h * 60} + ${m} = ${total} phút.`,
        };
    }

    // 4. Nhân số đo thời gian (20%)
    const baseH = randomInt(1, 2), baseM = randomInt(1, 5) * 10;
    const k = randomInt(2, 4);
    const total = (baseH * 60 + baseM) * k;
    return {
        type: QuestionType.SingleChoice,
        questionText: `Tính: ${fmt(baseH * 60 + baseM)} × ${k} = ?`,
        correctAnswer: fmt(total),
        options: timeOpts(total),
        explanation: `(${baseH} giờ ${baseM} phút) × ${k} = ${total} phút = ${fmt(total)}.`,
    };
};
