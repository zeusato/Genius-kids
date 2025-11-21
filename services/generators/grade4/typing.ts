import { Question, QuestionType } from '../../../types';
import { typingPracticeGrade4 } from '../../../src/data/typingPracticeGrade4';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateTypingGrade4 = (): Omit<Question, 'id' | 'topicId'> => {
    const text = typingPracticeGrade4[randomInt(0, typingPracticeGrade4.length - 1)];

    return {
        type: QuestionType.Typing,
        questionText: `Hãy gõ chính xác đoạn văn sau:`,
        correctAnswer: text,
        explanation: `Bạn cần gõ chính xác: "${text}"`
    };
};
