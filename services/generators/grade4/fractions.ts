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

// Create SVG for fraction visualization
const createFractionSVG = (numerator: number, denominator: number) => {
    const partWidth = 250 / denominator;
    let parts = '';

    for (let i = 0; i < denominator; i++) {
        const x = 25 + i * partWidth;
        const fillColor = i < numerator ? '#3b82f6' : '#e5e7eb';
        parts += `<rect x="${x}" y="50" width="${partWidth - 2}" height="80" fill="${fillColor}" stroke="#0f172a" stroke-width="2" />`;
    }

    return `
    <svg width="300" height="180" viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
      ${parts}
    </svg>
  `;
};

export const generateFractions = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Identify fraction from picture - 40%
    if (type < 0.4) {
        const denominators = [2, 3, 4, 5, 6, 8];
        const denom = denominators[randomInt(0, denominators.length - 1)];
        const numer = randomInt(1, denom - 1);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Phần tô màu biểu thị phân số nào?`,
            visualSvg: createFractionSVG(numer, denom),
            correctAnswer: `${numer}/${denom}`,
            options: shuffleArray([
                `${numer}/${denom}`,
                `${denom - numer}/${denom}`,
                `${numer}/${denom + 1}`,
                `${numer + 1}/${denom}`
            ]),
            explanation: `Có ${numer} phần được tô màu trong tổng số ${denom} phần bằng nhau.`
        };
    }

    // 2. Compare fractions (same denominator) - 30%
    else if (type < 0.7) {
        const denom = randomInt(3, 10);
        const numer1 = randomInt(1, denom - 1);
        const numer2 = randomInt(1, denom - 1);

        let ans = '=';
        if (numer1 > numer2) ans = '>';
        if (numer1 < numer2) ans = '<';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh hai phân số: ${numer1}/${denom} ... ${numer2}/${denom}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `Hai phân số cùng mẫu, so sánh tử số: ${numer1} ${ans} ${numer2}.`
        };
    }

    // 3. Write fraction from description - 30%
    else {
        const total = randomInt(4, 10);
        const part = randomInt(1, total - 1);
        const items = ['quả táo', 'viên bi', 'bông hoa', 'quyển sách'];
        const item = items[randomInt(0, items.length - 1)];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${total} ${item}, lấy ${part} ${item}. Viết phân số chỉ số ${item} đã lấy?`,
            correctAnswer: `${part}/${total}`,
            options: shuffleArray([
                `${part}/${total}`,
                `${total - part}/${total}`,
                `${part}/${total - part}`,
                `${total}/${part}`
            ]),
            explanation: `Số ${item} lấy là ${part}, tổng số là ${total}, nên phân số là ${part}/${total}.`
        };
    }
};
