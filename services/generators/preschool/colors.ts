import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};

const COLORS: Array<[string, string]> = [
    ['Đỏ', '#ef4444'], ['Xanh dương', '#3b82f6'], ['Xanh lá', '#22c55e'], ['Vàng', '#eab308'],
    ['Tím', '#a855f7'], ['Cam', '#f97316'], ['Hồng', '#ec4899'], ['Nâu', '#92400e'],
];

const swatch = (hex: string): string =>
    `<svg width="160" height="160" viewBox="0 0 160 160" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="max-width:160px;width:100%;height:auto;display:block;margin:0 auto">`
    + `<rect x="14" y="14" width="132" height="132" rx="20" fill="${hex}" stroke="#0f172a" stroke-width="3"/></svg>`;

/**
 * Mầm non — Nhận biết màu sắc cơ bản.
 */
export const generatePreschoolColors = (): Omit<Question, 'id' | 'topicId'> => {
    const idx = randomInt(0, COLORS.length - 1);
    const [name, hex] = COLORS[idx];
    // 4 lựa chọn gồm màu đúng + 3 màu khác.
    const others = shuffleArray(COLORS.filter(c => c[0] !== name)).slice(0, 3).map(c => c[0]);
    return {
        type: QuestionType.SingleChoice,
        questionText: `Đây là màu gì?`,
        visualSvg: swatch(hex),
        correctAnswer: name,
        options: shuffleArray([name, ...others]),
        explanation: `Đây là màu ${name.toLowerCase()}.`,
    };
};
