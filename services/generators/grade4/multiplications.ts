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

const generateWrongAnswers = (correct: number, count: number, range: number = 10000): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val > 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(n => formatNumber(n));
};

export const generateMultiplication = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Basic multiplication - 30%
    if (type < 0.3) {
        const typeM = randomInt(0, 1);
        if (typeM === 0) {
            // Large × 1 digit
            const a = randomInt(10000, 999999);
            const b = randomInt(2, 9);
            const ans = a * b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${formatNumber(a)} × ${b} = ?`,
                correctAnswer: formatNumber(ans),
                options: shuffleArray([formatNumber(ans), ...generateWrongAnswers(ans, 3)]),
                explanation: `Nhân từng chữ số của ${formatNumber(a)} với ${b} từ phải sang trái, nhớ sang hàng bên trái.`
            };
        } else {
            // Medium × 2 digits
            const a = randomInt(100, 9999);
            const b = randomInt(11, 99);
            const ans = a * b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${formatNumber(a)} × ${b} = ?`,
                correctAnswer: formatNumber(ans),
                options: shuffleArray([formatNumber(ans), ...generateWrongAnswers(ans, 3)]),
                explanation: `Nhân ${formatNumber(a)} với từng chữ số của ${b}, sau đó cộng các kết quả theo đúng hàng.`
            };
        }
    }

    // 2. Fast multiplication tricks - 25%
    else if (type < 0.55) {
        const tricks = [
            { a: 25, b: 4, hint: '25 × 4 = 100' },
            { a: 125, b: 8, hint: '125 × 8 = 1000' },
            { a: 50, b: randomInt(2, 20), hint: '50 × N = N × 100 / 2' }
        ];
        const trick = tricks[randomInt(0, tricks.length - 1)];
        const factor = randomInt(1, 10);
        const a = trick.a * factor;
        const b = trick.b;
        const ans = a * b;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính nhanh: ${formatNumber(a)} × ${b} = ?`,
            correctAnswer: formatNumber(ans),
            options: shuffleArray([formatNumber(ans), ...generateWrongAnswers(ans, 3)]),
            explanation: `Dùng mẹo: ${trick.hint}. Ta có ${formatNumber(a)} × ${b} = ${formatNumber(ans)}.`
        };
    }

    // 3. Find missing factor - 20%
    else if (type < 0.75) {
        const x = randomInt(100, 9999);
        const b = randomInt(2, 99);
        const product = x * b;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tìm x biết: x × ${b} = ${formatNumber(product)}`,
            correctAnswer: formatNumber(x),
            options: shuffleArray([formatNumber(x), ...generateWrongAnswers(x, 3, 1000)]),
            explanation: `x = ${formatNumber(product)} : ${b} = ${formatNumber(x)}`
        };
    }

    // 4. Word problems - 25%
    else {
        const scenarios = [
            { unit: 'hộp', item: 'cái kẹo' },
            { unit: 'thùng', item: 'chai nước' },
            { unit: 'túi', item: 'viên bi' },
            { unit: 'lô', item: 'quyển vở' }
        ];
        const sc = scenarios[randomInt(0, scenarios.length - 1)];
        const boxes = randomInt(10, 500);
        const perBox = randomInt(12, 99);
        const total = boxes * perBox;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${formatNumber(boxes)} ${sc.unit}, mỗi ${sc.unit} có ${perBox} ${sc.item}. Hỏi cả thảy có bao nhiêu ${sc.item}?`,
            correctAnswer: formatNumber(total),
            options: shuffleArray([formatNumber(total), ...generateWrongAnswers(total, 3, 500)]),
            explanation: `Tổng số ${sc.item} = ${formatNumber(boxes)} × ${perBox} = ${formatNumber(total)}`
        };
    }
};
