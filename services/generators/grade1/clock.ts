import { Question, QuestionType } from '../../../types';
import { clockSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};

/**
 * Lớp 1 — Xem đồng hồ giờ đúng. (Chuẩn GDPT 2018 lớp 1: xem giờ đúng.)
 */
export const generateG1Clock = (): Omit<Question, 'id' | 'topicId'> => {
    const hour = randomInt(1, 12);
    const r = Math.random();

    // 1. Đọc giờ đúng trên đồng hồ (60%)
    if (r < 0.6) {
        const wrong = shuffleArray(Array.from({ length: 12 }, (_, i) => i + 1).filter(h => h !== hour)).slice(0, 3);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đồng hồ chỉ mấy giờ?`,
            visualSvg: clockSVG(hour, 0),
            correctAnswer: `${hour} giờ`,
            options: shuffleArray([hour, ...wrong].map(h => `${h} giờ`)),
            explanation: `Kim ngắn chỉ số ${hour}, kim dài chỉ số 12 nên là ${hour} giờ đúng.`,
        };
    }

    // 2. Kim ngắn chỉ số mấy (20%)
    if (r < 0.8) {
        const wrong = shuffleArray(Array.from({ length: 12 }, (_, i) => i + 1).filter(h => h !== hour)).slice(0, 3);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đồng hồ đang chỉ ${hour} giờ đúng. Kim ngắn (kim giờ) chỉ vào số mấy?`,
            visualSvg: clockSVG(hour, 0),
            correctAnswer: String(hour),
            options: shuffleArray([hour, ...wrong].map(String)),
            explanation: `Lúc ${hour} giờ đúng, kim ngắn chỉ vào số ${hour}.`,
        };
    }

    // 3. Khi giờ đúng, kim dài chỉ số mấy (20%)
    return {
        type: QuestionType.SingleChoice,
        questionText: `Khi đồng hồ chỉ giờ đúng, kim dài (kim phút) chỉ vào số mấy?`,
        visualSvg: clockSVG(hour, 0),
        correctAnswer: '12',
        options: shuffleArray(['12', '6', '3', '9']),
        explanation: `Giờ đúng thì kim dài luôn chỉ vào số 12.`,
    };
};
