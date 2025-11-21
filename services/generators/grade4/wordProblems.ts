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

const generateWrongAnswers = (correct: number, count: number, range: number = 100): string[] => {
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

export const generateWordProblems = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Two-step addition/subtraction - 25%
    if (type < 0.25) {
        const initial = randomInt(1000, 10000);
        const add = randomInt(500, 5000);
        const sub = randomInt(200, add - 100);
        const result = initial + add - sub;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Cửa hàng có ${formatNumber(initial)} quyển vở. Sáng nhập thêm ${formatNumber(add)} quyển, chiều bán ra ${formatNumber(sub)} quyển. Hỏi cửa hàng còn lại bao nhiêu quyển vở?`,
            correctAnswer: formatNumber(result),
            options: shuffleArray([formatNumber(result), ...generateWrongAnswers(result, 3, 500)]),
            explanation: `Bước 1: Sau khi nhập thêm: ${formatNumber(initial)} + ${formatNumber(add)} = ${formatNumber(initial + add)}\nBước 2: Sau khi bán: ${formatNumber(initial + add)} - ${formatNumber(sub)} = ${formatNumber(result)}`
        };
    }

    // 2. Multiplication + Addition - 25%
    else if (type < 0.5) {
        const boxes = randomInt(10, 50);
        const perBox = randomInt(12, 48);
        const extra = randomInt(5, 20);
        const total = boxes * perBox + extra;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${formatNumber(boxes)} thùng, mỗi thùng ${perBox} chai nước. Ngoài ra còn ${extra} chai lẻ. Hỏi cả thảy có bao nhiêu chai nước?`,
            correctAnswer: formatNumber(total),
            options: shuffleArray([formatNumber(total), ...generateWrongAnswers(total, 3, 50)]),
            explanation: `Bước 1: Số chai trong thùng: ${formatNumber(boxes)} × ${perBox} = ${formatNumber(boxes * perBox)}\nBước 2: Tổng cộng: ${formatNumber(boxes * perBox)} + ${extra} = ${formatNumber(total)}`
        };
    }

    // 3. Division + Subtraction - 25%
    else if (type < 0.75) {
        const total = randomInt(500, 5000);
        const groups = randomInt(5, 20);
        const perGroup = Math.floor(total / groups);
        const used = perGroup * groups;
        const remain = total - used;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${formatNumber(total)} viên kẹo chia đều cho ${groups} bạn. Hỏi còn thừa bao nhiêu viên kẹo?`,
            correctAnswer: remain.toString(),
            options: shuffleArray([remain.toString(), formatNumber(perGroup), groups.toString(), (remain + 1).toString()]),
            explanation: `Bước 1: Mỗi bạn được: ${formatNumber(total)} : ${groups} = ${formatNumber(perGroup)} (dư ${remain})\nVậy còn thừa ${remain} viên.`
        };
    }

    // 4. Multi-step with different operations - 25%
    else {
        const money = randomInt(50000, 500000);
        const buy1 = randomInt(10000, money / 3);
        const buy2 = randomInt(10000, money / 3);
        const change = money - buy1 - buy2;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Mẹ có ${formatNumber(money)} đồng. Mẹ mua sách hết ${formatNumber(buy1)} đồng, mua vở hết ${formatNumber(buy2)} đồng. Hỏi mẹ còn lại bao nhiêu tiền?`,
            correctAnswer: formatNumber(change),
            options: shuffleArray([formatNumber(change), ...generateWrongAnswers(change, 3, 5000)]),
            explanation: `Bước 1: Tổng tiền mua: ${formatNumber(buy1)} + ${formatNumber(buy2)} = ${formatNumber(buy1 + buy2)}\nBước 2: Tiền còn lại: ${formatNumber(money)} - ${formatNumber(buy1 + buy2)} = ${formatNumber(change)}`
        };
    }
};
