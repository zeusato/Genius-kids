import { Question, QuestionType } from '../../../types';
import { formatNumber } from '../utils';
import { generateWrongAnswersWithSameUnits } from '../../mathEngine';

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
    </svg>
  `;
};

export const generateG5Ratios = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Ratio of two quantities (15%)
    if (type < 0.15) {
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

    // 2. Direct proportion (20%)
    else if (type < 0.35) {
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

    // 3. Percentage - discount (15%)
    else if (type < 0.5) {
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
                ...generateWrongAnswersWithSameUnits(finalPrice, 3, 50000).map(n => formatNumber(n))
            ]),
            explanation: `Giảm ${discount}% = ${formatNumber(original)} × ${discount}% = ${formatNumber(original * discount / 100)} đồng\\nGiá sau giảm = ${formatNumber(original)} - ${formatNumber(original * discount / 100)} = ${formatNumber(finalPrice)} đồng`
        };
    }

    // 4. Percentage Increase/Decrease (Price Change - Reverse) (15%)
    else if (type < 0.65) {
        const original = randomInt(50, 200) * 1000;
        const percent = [10, 20, 25, 50][randomInt(0, 3)];
        const isIncrease = Math.random() > 0.5;

        const change = (original * percent) / 100;
        const newPrice = isIncrease ? original + change : original - change;
        const action = isIncrease ? 'tăng' : 'giảm';

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một chiếc áo giá ${formatNumber(original)} đồng. Nếu giá ${action} ${percent}% thì giá mới là bao nhiêu?`,
            correctAnswer: formatNumber(newPrice),
            options: shuffleArray([
                formatNumber(newPrice),
                ...generateWrongAnswersWithSameUnits(newPrice, 3, 20000).map(n => formatNumber(n))
            ]),
            explanation: `Số tiền ${action}: ${formatNumber(original)} × ${percent}% = ${formatNumber(change)} đồng\\nGiá mới: ${formatNumber(original)} ${isIncrease ? '+' : '-'} ${formatNumber(change)} = ${formatNumber(newPrice)} đồng`
        };
    }

    // 5. Percentage of Two Numbers (15%)
    else if (type < 0.8) {
        // Find A such that A/B is a nice percentage
        const B_options = [20, 25, 40, 50, 100, 200, 500];
        const B = B_options[randomInt(0, B_options.length - 1)];
        const percent = randomInt(1, 19) * 5; // 5%, 10%, ... 95%
        const A = (B * percent) / 100;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${A} là bao nhiêu phần trăm của ${B}?`,
            correctAnswer: `${percent}%`,
            options: shuffleArray([
                `${percent}%`,
                ...generateWrongAnswersWithSameUnits(percent, 3, 20).map(n => `${n}%`)
            ]),
            explanation: `${A} : ${B} = ${A / B} = ${percent}%`
        };
    }

    // 6. Simple Interest (15%)
    else if (type < 0.90) {
        const principal = randomInt(1, 10) * 1000000; // 1M to 10M
        const rate = randomInt(5, 10); // 5-10%
        const interest = (principal * rate) / 100;
        const total = principal + interest;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Bác An gửi tiết kiệm ${formatNumber(principal)} đồng với lãi suất ${rate}%/năm. Hỏi sau 1 năm, bác An nhận về cả gốc và lãi là bao nhiêu?`,
            correctAnswer: formatNumber(total),
            options: shuffleArray([
                formatNumber(total),
                ...generateWrongAnswersWithSameUnits(total, 3, 100000).map(n => formatNumber(n))
            ]),
            explanation: `Tiền lãi 1 năm: ${formatNumber(principal)} × ${rate}% = ${formatNumber(interest)} đồng\\nTổng tiền nhận về: ${formatNumber(principal)} + ${formatNumber(interest)} = ${formatNumber(total)} đồng`
        };
    }

    // 7. Sequential Percentage Changes (10%)
    else {
        const original = randomInt(100, 500) * 1000;
        const percent = 10; // Keep it simple: 10%

        // Increase then Decrease
        // Price P -> P * 1.1 -> (P * 1.1) * 0.9 = P * 0.99
        // Decrease = 1% of original

        const p1 = original + (original * percent / 100);
        const p2 = p1 - (p1 * percent / 100);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một món hàng giá ${formatNumber(original)} đồng. Giá tăng ${percent}%, sau đó lại giảm ${percent}% so với giá mới. Hỏi giá cuối cùng là bao nhiêu?`,
            correctAnswer: formatNumber(p2),
            options: shuffleArray([
                formatNumber(p2),
                formatNumber(original), // Trap: no change
                formatNumber(original - (original * percent / 100)), // Trap: just decrease
                formatNumber(original + (original * percent / 100))  // Trap: just increase
            ]),
            explanation: `Giá sau khi tăng ${percent}%: ${formatNumber(original)} + ${formatNumber(original * percent / 100)} = ${formatNumber(p1)} đồng\nGiá sau khi giảm ${percent}%: ${formatNumber(p1)} - ${formatNumber(p1 * percent / 100)} = ${formatNumber(p2)} đồng`
        };
    }
};
