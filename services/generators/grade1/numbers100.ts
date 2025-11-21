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

export const generateNumbers100 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    if (type < 0.4) {
        // Compare round numbers
        const a = randomInt(1, 10) * 10;
        const b = randomInt(1, 10) * 10;
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
    } else if (type < 0.7) {
        // Fill sequence of tens
        const start = randomInt(2, 8) * 10;
        const missing = start + 10;
        const end = start + 20;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Điền số tròn chục còn thiếu: ${start}, __, ${end}`,
            correctAnswer: missing.toString(),
            options: shuffleArray([missing, missing + 10, missing - 10, missing + 5].map(String)),
            explanation: `Số còn thiếu là ${missing}`
        };
    } else {
        // Recognize tens
        const num = randomInt(2, 10) * 10;
        const tens = num / 10;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Số ${num} có mấy chục?`,
            correctAnswer: `${tens} chục`,
            options: shuffleArray([`${tens} chục`, `${tens - 1} chục`, `${tens + 1} chục`, `${num} chục`]),
            explanation: `${num} = ${tens} chục`
        };
    }
};
