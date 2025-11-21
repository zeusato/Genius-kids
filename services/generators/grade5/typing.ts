import { Question, QuestionType } from '../../../types';
import { typingPracticeGrade5 } from '../../../src/data/typingPracticeGrade5';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateTypingGrade5 = (): Omit<Question, 'id' | 'topicId'> => {
    const text = typingPracticeGrade5[randomInt(0, typingPracticeGrade5.length - 1)];

    return {
        type: QuestionType.Typing,
        questionText: `Hãy gõ chính xác đoạn văn sau:`,
        correctAnswer: text,
        explanation: `Bạn cần gõ chính xác: "${text}"`
    };
};
