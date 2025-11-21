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

const createSubtractionSVG = (total: number, subtract: number) => {
    const remain = total - subtract;
    return `
    <svg width="400" height="150" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="30" text-anchor="middle" font-size="24" font-weight="bold">${total} - ${subtract}</text>
      ${Array.from({ length: total }, (_, i) => {
        const isRemoved = i >= remain;
        return `<circle cx="${50 + i * 30}" cy="80" r="12" fill="${isRemoved ? '#ccc' : '#4ECDC4'}" stroke="#333" stroke-width="2"/>
                ${isRemoved ? `<line x1="${40 + i * 30}" y1="70" x2="${60 + i * 30}" y2="90" stroke="#FF6B6B" stroke-width="3"/>` : ''}`;
    }).join('')}
    </svg>
  `;
};

export const generateSubtraction10 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    if (type < 0.3) {
        // Visual subtraction
        const total = randomInt(5, 10);
        const sub = randomInt(1, total - 1);
        const result = total - sub;
        const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== result.toString());
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính hiệu:`,
            visualSvg: createSubtractionSVG(total, sub),
            correctAnswer: result.toString(),
            options: shuffleArray([result.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
            explanation: `${total} - ${sub} = ${result}`
        };
    } else if (type < 0.5) {
        // Basic subtraction
        const total = randomInt(1, 10);
        const sub = randomInt(0, total);
        const result = total - sub;
        const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== result.toString());
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${total} - ${sub} = ?`,
            correctAnswer: result.toString(),
            options: shuffleArray([result.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
            explanation: `${total} - ${sub} = ${result}`
        };
    } else if (type < 0.7) {
        // Fill missing: 10 - □ = 6
        const total = randomInt(5, 10);
        const result = randomInt(0, total - 1);
        const sub = total - result;
        const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== sub.toString());
        return {
            type: QuestionType.SingleChoice,
            questionText: `Điền số còn thiếu: ${total} - □ = ${result}`,
            correctAnswer: sub.toString(),
            options: shuffleArray([sub.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
            explanation: `${total} - ${sub} = ${result}`
        };
    } else {
        // Word problem
        const total = randomInt(5, 10);
        const given = randomInt(1, total - 1);
        const remain = total - given;
        const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== remain.toString());
        return {
            type: QuestionType.SingleChoice,
            questionText: `Bạn có ${total} cái kẹo, cho bạn ${given} cái. Hỏi còn lại bao nhiêu cái?`,
            correctAnswer: remain.toString(),
            options: shuffleArray([remain.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
            explanation: `Còn lại: ${total} - ${given} = ${remain} cái kẹo`
        };
    }
};
