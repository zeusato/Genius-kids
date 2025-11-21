import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const generateOperations20 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    if (type < 0.33) {
        // Addition within 20
        const a = randomInt(5, 15);
        const b = randomInt(1, 20 - a);
        const sum = a + b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${a} + ${b} = ?`,
            correctAnswer: sum.toString(),
            options: shuffleArray([sum, sum + 1, sum - 1, sum + 2].map(String)),
            explanation: `${a} + ${b} = ${sum}`
        };
    } else if (type < 0.66) {
        // Subtraction within 20
        const a = randomInt(11, 20);
        const b = randomInt(1, a - 1);
        const diff = a - b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${a} - ${b} = ?`,
            correctAnswer: diff.toString(),
            options: shuffleArray([diff, diff + 1, diff - 1, diff + 2].map(String)),
            explanation: `${a} - ${b} = ${diff}`
        };
    } else {
        // Word problem
        const isAdd = Math.random() > 0.5;
        if (isAdd) {
            const a = randomInt(5, 10);
            const b = randomInt(5, 10);
            const total = a + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Bạn có ${a} viên bi, được cho thêm ${b} viên. Hỏi có tất cả bao nhiêu viên bi?`,
                correctAnswer: total.toString(),
                options: shuffleArray([total, total + 1, total - 1, a + b + 2].map(String)),
                explanation: `Tất cả: ${a} + ${b} = ${total} viên bi`
            };
        } else {
            const total = randomInt(12, 20);
            const used = randomInt(5, total - 2);
            const remain = total - used;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Có ${total} cái kẹo, ăn mất ${used} cái. Hỏi còn lại bao nhiêu cái?`,
                correctAnswer: remain.toString(),
                options: shuffleArray([remain, remain + 1, remain - 1, remain + 2].map(String)),
                explanation: `Còn lại: ${total} - ${used} = ${remain} cái kẹo`
            };
        }
    }
};
