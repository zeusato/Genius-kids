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

const createAdditionSVG = (a: number, b: number) => {
    const group1End = 50 + a * 30;
    const plusX = group1End + 15;
    const group2Start = plusX + 30;

    return `
  <svg width="400" height="150" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
    <text x="200" y="30" text-anchor="middle" font-size="24" font-weight="bold">${a} + ${b}</text>
    ${Array.from({ length: a }, (_, i) => `<circle cx="${50 + i * 30}" cy="80" r="12" fill="#4ECDC4" stroke="#333" stroke-width="2"/>`).join('')}
    <text x="${plusX}" y="85" text-anchor="middle" font-size="24" font-weight="bold">+</text>
    ${Array.from({ length: b }, (_, i) => `<circle cx="${group2Start + i * 30}" cy="80" r="12" fill="#FF6B6B" stroke="#333" stroke-width="2"/>`).join('')}
  </svg>
`;
};

export const generateAddition10 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    if (type < 0.3) {
        // Visual addition
        const a = randomInt(1, 5);
        const b = randomInt(1, 5);
        const sum = a + b;
        const wrongOptions = Array.from({ length: 10 }, (_, i) => (i + 1).toString()).filter(x => x !== sum.toString());
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính tổng:`,
            visualSvg: createAdditionSVG(a, b),
            correctAnswer: sum.toString(),
            options: shuffleArray([sum.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
            explanation: `${a} + ${b} = ${sum}`
        };
    } else if (type < 0.5) {
        // Basic addition
        const a = randomInt(0, 10);
        const b = randomInt(0, 10 - a);
        const sum = a + b;
        const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== sum.toString());
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${a} + ${b} = ?`,
            correctAnswer: sum.toString(),
            options: shuffleArray([sum.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
            explanation: `${a} + ${b} = ${sum}`
        };
    } else if (type < 0.7) {
        // Fill missing: □ + 3 = 8
        const sum = randomInt(3, 10);
        const known = randomInt(1, sum - 1);
        const missing = sum - known;
        const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== missing.toString());
        return {
            type: QuestionType.SingleChoice,
            questionText: `Điền số còn thiếu: □ + ${known} = ${sum}`,
            correctAnswer: missing.toString(),
            options: shuffleArray([missing.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
            explanation: `${missing} + ${known} = ${sum}`
        };
    } else {
        // Compare sums
        const a1 = randomInt(1, 5);
        const b1 = randomInt(1, 5);
        const sum1 = a1 + b1;
        const a2 = randomInt(1, 5);
        const b2 = randomInt(1, 5);
        const sum2 = a2 + b2;
        let ans = '=';
        if (sum1 > sum2) ans = '>';
        if (sum1 < sum2) ans = '<';
        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh: ${a1} + ${b1} ... ${a2} + ${b2}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `${a1} + ${b1} = ${sum1}, ${a2} + ${b2} = ${sum2}. Vậy ${sum1} ${ans} ${sum2}`
        };
    }
};
