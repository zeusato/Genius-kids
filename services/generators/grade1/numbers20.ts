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

export const generateNumbers20 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    if (type < 0.25) {
        // Compare two numbers
        const a = randomInt(11, 20);
        const b = randomInt(11, 20);
        let ans = '=';
        if (a > b) ans = '>';
        if (a < b) ans = '<';
        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh: ${a} ... ${b}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `${a} ${ans} ${b}`
        };
    } else if (type < 0.5) {
        // Find tens and ones
        const num = randomInt(11, 19);
        const tens = Math.floor(num / 10);
        const ones = num % 10;

        const correctAnswer = `${tens} chục ${ones} đơn vị`;
        const wrong1 = `${ones} chục ${tens} đơn vị`;
        const wrong2 = `${tens + 1} chục ${ones - 1 < 0 ? 0 : ones - 1} đơn vị`;
        const wrong3 = `${num} chục 0 đơn vị`;
        const wrong4 = `${tens} chục ${ones + 1} đơn vị`;

        const uniqueOptions = Array.from(new Set([correctAnswer, wrong1, wrong2, wrong3, wrong4]));

        return {
            type: QuestionType.SingleChoice,
            questionText: `Số ${num} có mấy chục mấy đơn vị?`,
            correctAnswer: correctAnswer,
            options: shuffleArray(uniqueOptions).slice(0, 4),
            explanation: `${num} = ${tens} chục ${ones} đơn vị`
        };
    } else if (type < 0.75) {
        // Number before/after
        const num = randomInt(12, 19);
        const isBefore = Math.random() > 0.5;
        const answer = isBefore ? num - 1 : num + 1;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Số ${isBefore ? 'liền trước' : 'liền sau'} của ${num} là gì?`,
            correctAnswer: answer.toString(),
            options: shuffleArray([answer, answer - 1, answer + 1, answer - 2].map(String)),
            explanation: `Số ${isBefore ? 'liền trước' : 'liền sau'} của ${num} là ${answer}`
        };
    } else {
        // Fill sequence
        const start = randomInt(11, 17);
        const missing = start + 1;
        const end = start + 2;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Điền số còn thiếu: ${start}, __, ${end}`,
            correctAnswer: missing.toString(),
            options: shuffleArray([missing, missing - 1, missing + 1, missing + 2].map(String)),
            explanation: `Số còn thiếu là ${missing}`
        };
    }
};
