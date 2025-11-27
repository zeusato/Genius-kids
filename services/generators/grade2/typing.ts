import { Question, QuestionType } from '../../../types';
import { typingPracticeGrade2 } from '../../../src/data/typingPracticeGrade2';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Normalize Vietnamese text to NFC form (composed characters)
// This ensures diacritics are in the correct position for Vietnamese IME
const normalizeVietnamese = (text: string): string => {
    return text.normalize('NFC');
};

export const generateTypingGrade2 = (): Omit<Question, 'id' | 'topicId'> => {
    const rawText = typingPracticeGrade2[randomInt(0, typingPracticeGrade2.length - 1)];
    const text = normalizeVietnamese(rawText);

    return {
        type: QuestionType.Typing,
        questionText: `Hãy gõ chính xác đoạn văn sau:`,
        correctAnswer: text,
        explanation: `Bạn cần gõ chính xác: "${text}"`
    };
};
