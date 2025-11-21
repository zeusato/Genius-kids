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

// Format decimal with proper Vietnamese notation
const formatDecimal = (num: number, maxDecimals: number = 4): string => {
    const str = num.toFixed(maxDecimals);
    const trimmed = parseFloat(str).toString();
    return trimmed.replace('.', ',');
};

// SVG for decimal visualization (grid)
const createDecimalGridSVG = (value: number): string => {
    const whole = Math.floor(value);
    const decimal = value - whole;
    const tenths = Math.floor(decimal * 10);

    return `
    <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <text x="150" y="20" text-anchor="middle" font-size="16" font-weight="bold">${formatDecimal(value)}</text>
      ${[...Array(10)].map((_, i) => `
        <rect x="${30 + i * 24}" y="40" width="22" height="80" 
              fill="${i < tenths ? '#60a5fa' : '#e5e7eb'}" 
              stroke="#0f172a" stroke-width="2"/>
      `).join('')}
      <text x="150" y="140" text-anchor="middle" font-size="14">${tenths}/10 = ${formatDecimal(decimal, 1)}</text>
    </svg>
  `;
};

export const generateG5Numbers = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Read/write large numbers (20%)
    if (type < 0.2) {
        const num = randomInt(1000000, 99999999);
        const millions = Math.floor(num / 1000000);
        const thousands = Math.floor((num % 1000000) / 1000);
        const ones = num % 1000;

        let wordForm = `${millions} triệu`;
        if (thousands > 0) wordForm += ` ${formatNumber(thousands)} nghìn`;
        if (ones > 0) wordForm += ` ${formatNumber(ones)}`;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Viết số: ${wordForm}`,
            correctAnswer: formatNumber(num),
            options: shuffleArray([
                formatNumber(num),
                formatNumber(num + 1000),
                formatNumber(num - 1000),
                formatNumber(num + 10000)
            ]),
            explanation: `${wordForm} = ${formatNumber(num)}`
        };
    }

    // 2. Compare large numbers (15%)
    else if (type < 0.35) {
        const num1 = randomInt(100000, 9999999);
        const num2 = randomInt(100000, 9999999);
        const operators = ['>', '<', '='];
        const correctOp = num1 > num2 ? '>' : num1 < num2 ? '<' : '=';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh: ${formatNumber(num1)} ... ${formatNumber(num2)}`,
            correctAnswer: correctOp,
            options: shuffleArray(operators),
            explanation: `${formatNumber(num1)} ${correctOp} ${formatNumber(num2)}`
        };
    }

    // 3. Expanded form (15%)
    else if (type < 0.5) {
        const num = randomInt(10000, 999999);
        const digits = num.toString().split('').map(Number);
        const place = Math.pow(10, digits.length - 1);

        const expanded = digits.map((d, i) => {
            const placeValue = Math.pow(10, digits.length - 1 - i);
            return d > 0 ? `${formatNumber(d * placeValue)}` : null;
        }).filter(Boolean).join(' + ');

        return {
            type: QuestionType.SingleChoice,
            questionText: `Viết số ${formatNumber(num)} dưới dạng tổng?`,
            correctAnswer: expanded,
            options: shuffleArray([
                expanded,
                digits.map((d, i) => d).join(' + '),
                formatNumber(num),
                `${Math.floor(num / 1000)} + ${num % 1000}`
            ]),
            explanation: `${formatNumber(num)} = ${expanded}`
        };
    }

    // 4. Decimal - read/write (25%)
    else if (type < 0.75) {
        const whole = randomInt(0, 99);
        const decimal = randomInt(1, 99);
        const value = parseFloat(`${whole}.${decimal < 10 ? '0' + decimal : decimal}`);

        const wordForm = `${whole} phẩy ${decimal < 10 ? 'không ' + decimal : decimal}`;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Viết số: ${wordForm}`,
            correctAnswer: formatDecimal(value, 2),
            options: shuffleArray([
                formatDecimal(value, 2),
                formatDecimal(value + 0.1, 2),
                formatDecimal(value - 0.1, 2),
                formatDecimal(value + 1, 2)
            ]),
            explanation: `${wordForm} = ${formatDecimal(value, 2)}`
        };
    }

    // 5. Decimal structure with visualization (25%)
    else {
        const tenths = randomInt(1, 9);
        const value = tenths / 10;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Phần tô màu biểu diễn số thập phân nào?`,
            visualSvg: createDecimalGridSVG(value),
            correctAnswer: formatDecimal(value, 1),
            options: shuffleArray([
                formatDecimal(value, 1),
                formatDecimal(value + 0.1, 1),
                formatDecimal(value - 0.1, 1),
                formatDecimal(1 - value, 1)
            ]),
            explanation: `${tenths} phần trên 10 = ${tenths}/10 = ${formatDecimal(value, 1)}`
        };
    }
};
