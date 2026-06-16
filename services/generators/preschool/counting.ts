import { Question, QuestionType } from '../../../types';
import { countingSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const EMOJI = ['🍎', '⭐', '🐶', '🌸', '🚗', '🍓', '🦋', '🎈', '🐟', '🍰'];
const numOpts = (ans: number, max: number): string[] => {
    const set = new Set<number>([ans]);
    while (set.size < Math.min(4, max)) { const v = randomInt(1, max); if (v !== ans) set.add(v); }
    return shuffleArray(Array.from(set)).map(String);
};

/**
 * Mầm non — Đếm số lượng ≤ 10 (trực quan) và so sánh nhiều/ít.
 */
export const generatePreschoolCounting = (): Omit<Question, 'id' | 'topicId'> => {
    const emoji = pick(EMOJI);
    const r = Math.random();

    // 1. Đếm số lượng (70%)
    if (r < 0.7) {
        const n = randomInt(1, 10);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đếm xem có mấy hình?`,
            visualSvg: countingSVG(emoji, n),
            correctAnswer: String(n),
            options: numOpts(n, 10),
            explanation: `Có tất cả ${n} hình.`,
        };
    }

    // 2. Chọn số lớn nhất / bé nhất trong 4 số (30%)
    const nums = new Set<number>();
    while (nums.size < 4) nums.add(randomInt(1, 10));
    const arr = Array.from(nums);
    const askBiggest = Math.random() > 0.5;
    const ans = askBiggest ? Math.max(...arr) : Math.min(...arr);
    return {
        type: QuestionType.SingleChoice,
        questionText: `Số nào ${askBiggest ? 'lớn nhất' : 'bé nhất'}?`,
        correctAnswer: String(ans),
        options: shuffleArray(arr.map(String)),
        explanation: `${ans} là số ${askBiggest ? 'lớn nhất' : 'bé nhất'}.`,
    };
};
