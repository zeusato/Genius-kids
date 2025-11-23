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

const generateWrongAnswers = (correct: number, count: number, range: number = 5000): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val >= 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(n => formatNumber(n));
};

export const generateAddSub = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Basic addition/subtraction - 30%
    if (type < 0.3) {
        const isAdd = Math.random() > 0.5;
        if (isAdd) {
            const a = randomInt(10000, 900000);
            const b = randomInt(10000, 999999 - a);
            const ans = a + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${formatNumber(a)} + ${formatNumber(b)} = ?`,
                correctAnswer: formatNumber(ans),
                options: shuffleArray([formatNumber(ans), ...generateWrongAnswers(ans, 3)]),
                explanation: `Đặt tính theo cột dọc và cộng từ phải sang trái, nhớ sang hàng bên trái khi cần.`
            };
        } else {
            const a = randomInt(100000, 9999999);
            const b = randomInt(10000, a - 1000);
            const ans = a - b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${formatNumber(a)} - ${formatNumber(b)} = ?`,
                correctAnswer: formatNumber(ans),
                options: shuffleArray([formatNumber(ans), ...generateWrongAnswers(ans, 3)]),
                explanation: `Đặt tính theo cột dọc và trừ từ phải sang trái, mượn từ hàng bên trái khi cần.`
            };
        }
    }

    // 2. Find x - 30%
    else if (type < 0.6) {
        const xType = randomInt(0, 2);

        if (xType === 0) {
            // x + a = b
            const a = randomInt(10000, 500000);
            const b = randomInt(a + 1000, 999999);
            const x = b - a;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tìm x biết: x + ${formatNumber(a)} = ${formatNumber(b)}`,
                correctAnswer: formatNumber(x),
                options: shuffleArray([formatNumber(x), ...generateWrongAnswers(x, 3)]),
                explanation: `x = ${formatNumber(b)} - ${formatNumber(a)} = ${formatNumber(x)}`
            };
        } else if (xType === 1) {
            // x - a = b
            const b = randomInt(10000, 500000);
            const a = randomInt(10000, 500000);
            const x = b + a;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tìm x biết: x - ${formatNumber(a)} = ${formatNumber(b)}`,
                correctAnswer: formatNumber(x),
                options: shuffleArray([formatNumber(x), ...generateWrongAnswers(x, 3)]),
                explanation: `x = ${formatNumber(b)} + ${formatNumber(a)} = ${formatNumber(x)}`
            };
        } else {
            // a - x = b
            const a = randomInt(100000, 999999);
            const b = randomInt(10000, a - 1000);
            const x = a - b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tìm x biết: ${formatNumber(a)} - x = ${formatNumber(b)}`,
                correctAnswer: formatNumber(x),
                options: shuffleArray([formatNumber(x), ...generateWrongAnswers(x, 3)]),
                explanation: `x = ${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(x)}`
            };
        }
    }

    // 3. Compare expressions - 20%
    else if (type < 0.8) {
        const a1 = randomInt(10000, 500000);
        const b1 = randomInt(10000, 500000);
        const val1 = a1 + b1;

        const a2 = randomInt(10000, 500000);
        const b2 = randomInt(10000, 500000);
        const val2 = a2 + b2;

        let ans = '=';
        if (val1 > val2) ans = '>';
        if (val1 < val2) ans = '<';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh (điền >, <, =): ${formatNumber(a1)} + ${formatNumber(b1)} ... ${formatNumber(a2)} + ${formatNumber(b2)}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `${formatNumber(a1)} + ${formatNumber(b1)} = ${formatNumber(val1)}\n${formatNumber(a2)} + ${formatNumber(b2)} = ${formatNumber(val2)}\nVậy ${formatNumber(val1)} ${ans} ${formatNumber(val2)}`
        };
    }

    // 4. Word problems - 20%
    else {
        const isAdd = Math.random() > 0.5;
        const items = ['quyển sách', 'cái bút', 'kg gạo', 'lít nước', 'cây bút chì'];
        const item = items[randomInt(0, items.length - 1)];

        if (isAdd) {
            const a = randomInt(1000, 50000);
            const b = randomInt(1000, 50000);
            const total = a + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Cửa hàng có ${formatNumber(a)} ${item}. Nhập thêm ${formatNumber(b)} ${item}. Hỏi cửa hàng có tất cả bao nhiêu ${item}?`,
                correctAnswer: formatNumber(total),
                options: shuffleArray([formatNumber(total), ...generateWrongAnswers(total, 3, 5000)]),
                explanation: `Tổng số ${item} = ${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(total)}`
            };
        } else {
            const total = randomInt(10000, 100000);
            const sold = randomInt(1000, total - 1000);
            const remain = total - sold;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Kho có ${formatNumber(total)} ${item}. Đã bán ${formatNumber(sold)} ${item}. Hỏi còn lại bao nhiêu ${item}?`,
                correctAnswer: formatNumber(remain),
                options: shuffleArray([formatNumber(remain), ...generateWrongAnswers(remain, 3, 5000)]),
                explanation: `Số ${item} còn lại = ${formatNumber(total)} - ${formatNumber(sold)} = ${formatNumber(remain)}`
            };
        }
    }
};
