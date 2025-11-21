import { Question, QuestionType } from '../../../types';
import { typingPracticeGrade2 } from '../../../src/data/typingPracticeGrade2';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateTypingGrade2 = (): Omit<Question, 'id' | 'topicId'> => {
    const text = typingPracticeGrade2[randomInt(0, typingPracticeGrade2.length - 1)];

    return {
        type: QuestionType.Typing,
        questionText: `Hãy gõ chính xác đoạn văn sau:`,
        correctAnswer: text,
        explanation: `Bạn cần gõ chính xác: "${text}"`
    };
};
