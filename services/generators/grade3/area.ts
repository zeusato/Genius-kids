import { Question, QuestionType } from '../../../types';
import { rectSVG, squareSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const opts = (ans: number, cands: number[], unit: string): string[] => {
    const set = new Set<number>([ans]);
    for (const c of shuffleArray(cands)) { if (c > 0 && c !== ans) set.add(c); if (set.size >= 4) break; }
    while (set.size < 4) { const c = ans + randomInt(-6, 6); if (c > 0) set.add(c); }
    return shuffleArray(Array.from(set).slice(0, 4)).map(v => `${v}${unit}`);
};

/**
 * Lớp 3 — Chu vi & Diện tích hình chữ nhật, hình vuông (đơn vị cm, cm²).
 * (Chuẩn GDPT 2018 lớp 3: diện tích, đơn vị cm²; chu vi/diện tích HCN, hình vuông.)
 */
export const generateG3Area = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();

    // 1. Diện tích hình chữ nhật (30%)
    if (r < 0.3) {
        const a = randomInt(3, 12), b = randomInt(2, 9);
        const area = a * b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình chữ nhật có chiều dài ${a}cm, chiều rộng ${b}cm.`,
            visualSvg: rectSVG(a, b),
            correctAnswer: `${area}cm²`,
            options: opts(area, [(a + b) * 2, a * b * 2, a + b, area + a], 'cm²'),
            explanation: `Diện tích = dài × rộng = ${a} × ${b} = ${area} (cm²).`,
        };
    }

    // 2. Diện tích hình vuông (25%)
    if (r < 0.55) {
        const a = randomInt(2, 12);
        const area = a * a;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình vuông có cạnh ${a}cm.`,
            visualSvg: squareSVG(a),
            correctAnswer: `${area}cm²`,
            options: opts(area, [a * 4, a * 2, area + a, a + a], 'cm²'),
            explanation: `Diện tích = cạnh × cạnh = ${a} × ${a} = ${area} (cm²).`,
        };
    }

    // 3. Chu vi hình chữ nhật (25%)
    if (r < 0.8) {
        const a = randomInt(3, 14), b = randomInt(2, 10);
        const p = (a + b) * 2;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính chu vi hình chữ nhật có chiều dài ${a}cm, chiều rộng ${b}cm.`,
            visualSvg: rectSVG(a, b),
            correctAnswer: `${p}cm`,
            options: opts(p, [a * b, a + b, p + 2, (a + b)], 'cm'),
            explanation: `Chu vi = (dài + rộng) × 2 = (${a} + ${b}) × 2 = ${p} (cm).`,
        };
    }

    // 4. Chu vi hình vuông (20%)
    const a = randomInt(2, 15);
    const p = a * 4;
    return {
        type: QuestionType.SingleChoice,
        questionText: `Tính chu vi hình vuông có cạnh ${a}cm.`,
        visualSvg: squareSVG(a),
        correctAnswer: `${p}cm`,
        options: opts(p, [a * a, a * 2, a * 3, p + 4], 'cm'),
        explanation: `Chu vi = cạnh × 4 = ${a} × 4 = ${p} (cm).`,
    };
};
