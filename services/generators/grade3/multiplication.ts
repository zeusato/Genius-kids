import { Question, QuestionType } from '../../../types';
import { formatNumber } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const generateWrongAnswers = (correct: number, count: number, range: number = 10): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val > 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(String);
};

export const generateG3Multiplication = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Times tables 2-9 (25%)
    if (type < 0.25) {
        const a = randomInt(2, 9);
        const b = randomInt(2, 9);
        const answer = a * b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `${a} × ${b} = ?`,
            correctAnswer: answer.toString(),
            options: shuffleArray([answer.toString(), ...generateWrongAnswers(answer, 3, 10)]),
            explanation: `${a} × ${b} = ${answer}`
        };
    }

    // 2. 2-3 digit × 1 digit (30%)
    else if (type < 0.55) {
        const a = randomInt(12, 999);
        const b = randomInt(2, 9);
        const answer = a * b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatNumber(a)} × ${b} = ?`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, Math.min(100, answer / 5))]),
            explanation: `${formatNumber(a)} × ${b} = ${formatNumber(answer)}`
        };
    }

    // 3. Round number multiplication (15%)
    else if (type < 0.7) {
        const a = randomInt(10, 90) * 10;
        const b = randomInt(2, 9);
        const answer = a * b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatNumber(a)} × ${b} = ?`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 100)]),
            explanation: `${formatNumber(a)} × ${b} = ${formatNumber(answer)}`
        };
    }

    // 4. Quick multiply (5×n, 50×n, 25×n) (15%)
    else if (type < 0.85) {
        const multipliers = [5, 50, 25];
        const mult = multipliers[randomInt(0, 2)];
        const n = randomInt(2, 20);
        const answer = mult * n;
        return {
            type: QuestionType.SingleChoice,
            questionText: `${mult} × ${n} = ? (Tính nhanh)`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, mult)]),
            explanation: `${mult} × ${n} = ${formatNumber(answer)}`
        };
    }

    // 5. Word problems (15%)
    else {
        const scenarios = [
            { item: 'hộp', unit: 'cái kẹo', context: 'Có' },
            { item: 'túi', unit: 'viên bi', context: 'Có' },
            { item: 'thùng', unit: 'chai nước', context: 'Có' }
        ];
        const sc = scenarios[randomInt(0, 2)];
        const boxes = randomInt(5, 50);
        const perBox = randomInt(6, 12);
        const answer = boxes * perBox;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${sc.context} ${boxes} ${sc.item}, mỗi ${sc.item} có ${perBox} ${sc.unit}. Hỏi cả thảy có bao nhiêu ${sc.unit}?`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 50)]),
            explanation: `${boxes} × ${perBox} = ${formatNumber(answer)} ${sc.unit}`
        };
    }
};
