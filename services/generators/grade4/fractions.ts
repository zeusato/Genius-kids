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

    // 1. Identify fraction from picture - 15%
    if (type < 0.15) {
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

    // 2. Compare fractions (same denominator) - 15%
    else if (type < 0.3) {
        const denom = randomInt(3, 10);
        const numer1 = randomInt(1, denom - 1);
        const numer2 = randomInt(1, denom - 1);

        // Ensure they are not equal for comparison questions usually, but equal is fine too
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

    // 3. Write fraction from description - 15%
    else if (type < 0.45) {
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

    // 4. Addition/Subtraction (Same Denominator) - 20%
    else if (type < 0.65) {
        const denom = randomInt(3, 12);
        const isAddition = Math.random() > 0.5;
        let n1, n2, ansNumer;
        let opSymbol = '';

        if (isAddition) {
            // Ensure sum numerator doesn't exceed denominator significantly (optional, but keeps it simple)
            // Let's allow improper fractions result? Or keep it <= 1?
            // Let's keep it simple: sum can be anything, but let's try to keep n1, n2 reasonable.
            n1 = randomInt(1, denom - 1);
            n2 = randomInt(1, denom - 1);
            ansNumer = n1 + n2;
            opSymbol = '+';
        } else {
            // Subtraction: Ensure n1 >= n2 for non-negative result
            n1 = randomInt(2, denom);
            n2 = randomInt(1, n1); // n2 <= n1
            ansNumer = n1 - n2;
            opSymbol = '-';
        }

        const correctAnswer = `${ansNumer}/${denom}`;

        // Generate distractors
        const options = new Set<string>();
        options.add(correctAnswer);

        // Distractor 1: Wrong operation
        const wrongOpNumer = isAddition ? Math.abs(n1 - n2) : n1 + n2;
        options.add(`${wrongOpNumer}/${denom}`);

        // Distractor 2: Add/Sub denominators too (common mistake)
        const wrongDenom = isAddition ? denom * 2 : (denom === denom ? 0 : 0); // 0 denom is bad, let's avoid
        if (isAddition) options.add(`${ansNumer}/${denom * 2}`);
        else options.add(`${ansNumer}/${denom}`); // If sub, denom stays same usually, maybe random error

        // Random distractors
        while (options.size < 4) {
            const rNumer = Math.max(0, ansNumer + randomInt(-2, 2));
            const rDenom = denom; // Keep denom same usually
            if (rDenom !== 0) options.add(`${rNumer}/${rDenom}`);
            else options.add(`${rNumer}/1`);
        }

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${n1}/${denom} ${opSymbol} ${n2}/${denom} = ?`,
            correctAnswer: correctAnswer,
            options: shuffleArray(Array.from(options)),
            explanation: `Giữ nguyên mẫu số ${denom}, ${isAddition ? 'cộng' : 'trừ'} tử số: ${n1} ${opSymbol} ${n2} = ${ansNumer}.`
        };
    }

    // 5. Simplify Fractions - 15%
    else if (type < 0.8) {
        // Generate a simplified fraction first
        const simpleNumer = randomInt(1, 5);
        const simpleDenom = randomInt(simpleNumer + 1, 10); // Proper fraction

        // Ensure they are coprime (simplified)
        // Simple check for common small factors
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const div = gcd(simpleNumer, simpleDenom);
        const baseNumer = simpleNumer / div;
        const baseDenom = simpleDenom / div;

        // Multiply by k
        const k = randomInt(2, 5);
        const targetNumer = baseNumer * k;
        const targetDenom = baseDenom * k;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Rút gọn phân số: ${targetNumer}/${targetDenom}`,
            correctAnswer: `${baseNumer}/${baseDenom}`,
            options: shuffleArray([
                `${baseNumer}/${baseDenom}`,
                `${targetNumer}/${targetDenom}`, // Not simplified
                `${baseNumer}/${baseDenom + 1}`,
                `${baseNumer + 1}/${baseDenom}`
            ]),
            explanation: `Chia cả tử và mẫu cho ${k}: ${targetNumer}:${k} = ${baseNumer}, ${targetDenom}:${k} = ${baseDenom}.`
        };
    }

    // 6. Equivalent Fractions - 20%
    else {
        const baseNumer = randomInt(1, 5);
        const baseDenom = randomInt(baseNumer + 1, 9);
        const k = randomInt(2, 4);

        const eqNumer = baseNumer * k;
        const eqDenom = baseDenom * k;

        // Question: Find equivalent fraction OR Fill in the blank
        // Let's do "Phân số nào bằng..."

        return {
            type: QuestionType.SingleChoice,
            questionText: `Phân số nào bằng phân số ${baseNumer}/${baseDenom}?`,
            correctAnswer: `${eqNumer}/${eqDenom}`,
            options: shuffleArray([
                `${eqNumer}/${eqDenom}`,
                `${baseNumer + 1}/${baseDenom + 1}`, // Add 1 to both
                `${baseNumer * k}/${baseDenom}`,     // Only multiply numer
                `${baseNumer}/${baseDenom * k}`      // Only multiply denom
            ]),
            explanation: `Nhân cả tử và mẫu của ${baseNumer}/${baseDenom} với ${k} ta được ${eqNumer}/${eqDenom}.`
        };
    }
};
