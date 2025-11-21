import { Question, QuestionType } from '../../../types';
import { typingPracticeGrade3 } from '../../../src/data/typingPracticeGrade3';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateTypingGrade3 = (): Omit<Question, 'id' | 'topicId'> => {
    const text = typingPracticeGrade3[randomInt(0, typingPracticeGrade3.length - 1)];

    return {
        type: QuestionType.Typing,
        questionText: `Hãy gõ chính xác đoạn văn sau:`,
        correctAnswer: text,
        explanation: `Bạn cần gõ chính xác: "${text}"`
    };
};
