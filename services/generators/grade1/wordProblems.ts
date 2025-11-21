import { Question, QuestionType } from '../../../types';
import { createOptionsWithAnswer } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const generateWordProblems = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();
    const items = ['quả táo', 'viên bi', 'cái kẹo', 'bông hoa', 'quyển sách'];
    const item = items[randomInt(0, items.length - 1)];

    if (type < 0.25) {
        // Add
        const a = randomInt(1, 8);
        const b = randomInt(1, 8);
        const total = a + b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Bạn có ${a} ${item}, được cho thêm ${b} ${item}. Hỏi có tất cả bao nhiêu ${item}?`,
            correctAnswer: total.toString(),
            options: createOptionsWithAnswer(total.toString(), [total, total + 1, total - 1, a, b].map(String)),
            explanation: `Tất cả: ${a} + ${b} = ${total} ${item}`
        };
    } else if (type < 0.5) {
        // Subtract
        const total = randomInt(5, 15);
        const given = randomInt(1, total - 1);
        const remain = total - given;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${total} ${item}, cho bạn ${given} ${item}. Hỏi còn lại bao nhiêu ${item}?`,
            correctAnswer: remain.toString(),
            options: createOptionsWithAnswer(remain.toString(), [remain, remain + 1, remain - 1, given, total].map(String)),
            explanation: `Còn lại: ${total} - ${given} = ${remain} ${item}`
        };
    } else if (type < 0.75) {
        // Total
        const a = randomInt(2, 8);
        const b = randomInt(2, 8);
        const total = a + b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Hộp thứ nhất có ${a} ${item}, hộp thứ hai có ${b} ${item}. Hỏi có tất cả bao nhiêu ${item}?`,
            correctAnswer: total.toString(),
            options: createOptionsWithAnswer(total.toString(), [total, total + 1, total - 1, a, b].map(String)),
            explanation: `Tất cả: ${a} + ${b} = ${total} ${item}`
        };
    } else {
        // Remain
        const total = randomInt(10, 20);
        const used = randomInt(3, total - 2);
        const remain = total - used;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${total} ${item}, đã dùng ${used} ${item}. Hỏi còn lại bao nhiêu ${item}?`,
            correctAnswer: remain.toString(),
            options: createOptionsWithAnswer(remain.toString(), [remain, remain + 1, remain - 1, used, total].map(String)),
            explanation: `Còn lại: ${total} - ${used} = ${remain} ${item}`
        };
    }
};
