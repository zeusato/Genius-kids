import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateG4Patterns = (): Omit<Question, 'id' | 'topicId'> => {
    const start = randomInt(1, 50);
    const diff = randomInt(2, 15);
    const seq = [start, start + diff, start + diff * 2, start + diff * 3, start + diff * 4];

    const hiddenIndex = randomInt(0, 4);
    const correctAnswer = seq[hiddenIndex];

    const displaySeq = seq.map((val, idx) => idx === hiddenIndex ? '...' : val);

    return {
        type: QuestionType.ManualInput,
        questionText: `Điền số còn thiếu vào dãy số: ${displaySeq.join(', ')}`,
        correctAnswer: correctAnswer.toString(),
        explanation: `Dãy số tăng dần với khoảng cách là ${diff}.`
    };
};
