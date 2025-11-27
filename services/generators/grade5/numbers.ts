import { Question, QuestionType } from '../../../types';
import { formatNumber } from '../utils';
import { generateUniqueWrongAnswers } from './decimalOps';

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
      ${[...Array(10)].map((_, i) => `
        <rect x="${30 + i * 24}" y="40" width="22" height="80" 
              fill="${i < tenths ? '#60a5fa' : '#e5e7eb'}" 
              stroke="#0f172a" stroke-width="2"/>
      `).join('')}
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

    // 2. Compare large numbers (10%)
    else if (type < 0.3) {
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

    // 3. Expanded form (10%)
    else if (type < 0.4) {
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

    // 4. Decimal place value expansion (20%)
    else if (type < 0.6) {
        // Tạo số thập phân 2 chữ số (VD: 23,45)
        const tens = randomInt(1, 9);
        const ones = randomInt(0, 9);
        const tenths = randomInt(0, 9);
        const hundredths = randomInt(1, 9); // Đảm bảo có chữ số hàng phần trăm

        const value = tens * 10 + ones + tenths * 0.1 + hundredths * 0.01;

        // Phân tích đúng
        const parts = [];
        if (tens > 0) parts.push(`${tens} × 10`);
        if (ones > 0) parts.push(`${ones} × 1`);
        if (tenths > 0) parts.push(`${tenths} × 0,1`);
        if (hundredths > 0) parts.push(`${hundredths} × 0,01`);

        const correctExpansion = parts.join(' + ');

        // Tạo đáp án sai
        // Sai 1: Nhầm hàng phần thập phân (4×1 thay vì 4×0,1)
        const wrong1Parts = [];
        if (tens > 0) wrong1Parts.push(`${tens} × 10`);
        if (ones > 0) wrong1Parts.push(`${ones} × 1`);
        if (tenths > 0) wrong1Parts.push(`${tenths} × 1`); // SAI: nhầm hàng
        if (hundredths > 0) wrong1Parts.push(`${hundredths} × 0,1`); // SAI: nhầm hàng
        const wrong1 = wrong1Parts.join(' + ');

        // Sai 2: Đổi chỗ giá trị
        const wrong2Parts = [];
        if (tens > 0) wrong2Parts.push(`${ones} × 10`); // SAI: đổi chỗ
        if (ones > 0) wrong2Parts.push(`${tens} × 1`); // SAI: đổi chỗ
        if (tenths > 0) wrong2Parts.push(`${tenths} × 0,1`);
        if (hundredths > 0) wrong2Parts.push(`${hundredths} × 0,01`);
        const wrong2 = wrong2Parts.join(' + ');

        // Sai 3: Thiếu một hạng tử
        const wrong3Parts = [];
        if (tens > 0) wrong3Parts.push(`${tens} × 10`);
        // Bỏ qua ones
        if (tenths > 0) wrong3Parts.push(`${tenths} × 0,1`);
        if (hundredths > 0) wrong3Parts.push(`${hundredths} × 0,01`);
        const wrong3 = wrong3Parts.join(' + ');

        return {
            type: QuestionType.SingleChoice,
            questionText: `Phân tích giá trị các chữ số trong số ${formatDecimal(value, 2)}?`,
            correctAnswer: correctExpansion,
            options: shuffleArray([
                correctExpansion,
                wrong1,
                wrong2,
                wrong3
            ]),
            explanation: `Số ${formatDecimal(value, 2)} có:\n- ${tens} ở hàng chục (${tens}×10)\n- ${ones} ở hàng đơn vị (${ones}×1)\n- ${tenths} ở hàng phần mười (${tenths}×0,1)\n- ${hundredths} ở hàng phần trăm (${hundredths}×0,01)`
        };
    }

    // 5. Decimal structure with visualization (20%)
    else if (type < 0.8) {
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

    // 6. Convert Fraction to Decimal (20%)
    else {
        // Only use denominators that result in terminating decimals: 2, 4, 5, 8, 10, 20, 25, 40, 50
        const validDens = [2, 4, 5, 8, 10, 20, 25, 40, 50];
        const den = validDens[randomInt(0, validDens.length - 1)];
        const num = randomInt(1, den - 1);

        const decimalVal = num / den;

        // Use helper to generate distractors with same unit digit logic if possible
        // But generateUniqueWrongAnswers takes a number and returns numbers.
        // We need to format them.
        const wrongAnswers = generateUniqueWrongAnswers(decimalVal, 3, 3);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Chuyển phân số ${num}/${den} thành số thập phân?`,
            correctAnswer: formatDecimal(decimalVal, 3),
            options: shuffleArray([
                formatDecimal(decimalVal, 3),
                ...wrongAnswers.map(w => formatDecimal(w, 3))
            ]),
            explanation: `${num}/${den} = ${num} : ${den} = ${formatDecimal(decimalVal, 3)}`
        };
    }
};
