import { Question, QuestionType } from '../../../types';
import { formatNumber } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const formatDecimal = (num: number, maxDecimals: number = 2): string => {
    const str = num.toFixed(maxDecimals);
    const trimmed = parseFloat(str).toString();
    return trimmed.replace('.', ',');
};

// SVG for ratio visualization
const createRatioSVG = (count1: number, count2: number, label1: string, label2: string): string => {
    return `
    <svg width="350" height="150" viewBox="0 0 350 150" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="30" font-size="14" font-weight="bold">${label1}:</text>
      ${[...Array(count1)].map((_, i) => `
        <circle cx="${80 + i * 25}" cy="25" r="10" fill="#60a5fa" stroke="#0f172a" stroke-width="2"/>
      `).join('')}
      <text x="10" y="80" font-size="14" font-weight="bold">${label2}:</text>
      ${[...Array(count2)].map((_, i) => `
        <circle cx="${80 + i * 25}" cy="75" r="10" fill="#f59e0b" stroke="#0f172a" stroke-width="2"/>
      `).join('')}
      <text x="175" y="130" text-anchor="middle" font-size="16">Tỉ số: ${count1}:${count2}</text>
    </svg>
  `;
};

export const generateG5Ratios = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Ratio of two quantities (35%)
    if (type < 0.35) {
        const a = randomInt(2, 8);
        const b = randomInt(2, 8);
        const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
        const divisor = gcd(a, b);
        const simplified = `${a / divisor}:${b / divisor}`;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tỉ số của ${a} và ${b} là?`,
            visualSvg: createRatioSVG(a, b, 'Nhóm A', 'Nhóm B'),
            correctAnswer: simplified,
            options: shuffleArray([
                simplified,
                `${a}:${b}`,
                `${b}:${a}`,
                `${a + b}:${a}`
            ]),
            explanation: `Tỉ số ${a}:${b} = ${simplified}`
        };
    }

    // 2. Direct proportion (30%)
    else if (type < 0.65) {
        const x1 = randomInt(2, 5);
        const y1 = randomInt(10, 30);
        const x2 = randomInt(6, 10);
        const y2 = (y1 / x1) * x2;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Nếu ${x1} kg gạo giá ${formatNumber(y1 * 1000)} đồng, thì ${x2} kg gạo giá bao nhiêu?`,
            correctAnswer: formatNumber(y2 * 1000),
            options: shuffleArray([
                formatNumber(y2 * 1000),
                formatNumber((y2 + 10) * 1000),
                formatNumber((y2 - 10) * 1000),
                formatNumber(y1 * x2 * 1000)
            ]),
            explanation: `Giá 1 kg = ${formatNumber(y1 * 1000)} : ${x1} = ${formatNumber((y1 / x1) * 1000)} đồng\\n${x2} kg = ${formatNumber((y1 / x1) * 1000)} × ${x2} = ${formatNumber(y2 * 1000)} đồng`
        };
    }

    // 3. Percentage - discount (35%)
    else {
        const original = randomInt(100, 500) * 1000;
        const discounts = [10, 20, 25, 30, 50];
        const discount = discounts[randomInt(0, 4)];
        const finalPrice = original * (100 - discount) / 100;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một món hàng giá ${formatNumber(original)} đồng, giảm ${discount}%. Hỏi giá sau khi giảm là bao nhiêu?`,
            correctAnswer: formatNumber(finalPrice),
            options: shuffleArray([
                formatNumber(finalPrice),
                formatNumber(finalPrice + original * 0.1),
                formatNumber(original - discount * 1000),
                formatNumber(original * discount / 100)
            ]),
            explanation: `Giảm ${discount}% = ${formatNumber(original)} × ${discount}% = ${formatNumber(original * discount / 100)} đồng\\nGiá sau giảm = ${formatNumber(original)} - ${formatNumber(original * discount / 100)} = ${formatNumber(finalPrice)} đồng`
        };
    }
};
