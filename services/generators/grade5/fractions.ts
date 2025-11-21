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

const formatDecimal = (num: number, maxDecimals: number = 2): string => {
    const str = num.toFixed(maxDecimals);
    const trimmed = parseFloat(str).toString();
    return trimmed.replace('.', ',');
};

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const simplifyFraction = (num: number, den: number): [number, number] => {
    const divisor = gcd(num, den);
    return [num / divisor, den / divisor];
};

export const generateG5Fractions = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Compare fractions (25%)
    if (type < 0.25) {
        const den = randomInt(4, 20);
        const num1 = randomInt(1, den - 1);
        const num2 = randomInt(1, den - 1);
        const operators = ['>', '<', '='];
        const correctOp = num1 > num2 ? '>' : num1 < num2 ? '<' : '=';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh: ${num1}/${den} ... ${num2}/${den}`,
            correctAnswer: correctOp,
            options: shuffleArray(operators),
            explanation: `${num1}/${den} ${correctOp} ${num2}/${den}`
        };
    }

    // 2. Add/subtract fractions (25%)
    else if (type < 0.5) {
        const den = randomInt(4, 12);
        const num1 = randomInt(1, den - 2);
        const num2 = randomInt(1, den - num1);
        const isAdd = Math.random() > 0.5;
        const resultNum = isAdd ? num1 + num2 : num1 + num2;
        const resultDen = den;
        const [simNum, simDen] = simplifyFraction(isAdd ? num1 + num2 : num2, den);

        return {
            type: QuestionType.SingleChoice,
            questionText: isAdd ? `${num1}/${den} + ${num2}/${den} = ?` : `${num1 + num2}/${den} - ${num1}/${den} = ?`,
            correctAnswer: simDen === 1 ? simNum.toString() : `${simNum}/${simDen}`,
            options: shuffleArray([
                simDen === 1 ? simNum.toString() : `${simNum}/${simDen}`,
                `${resultNum}/${resultDen}`,
                `${resultNum}/${resultDen * 2}`,
                `${resultNum + 1}/${resultDen}`
            ]),
            explanation: isAdd
                ? `${num1}/${den} + ${num2}/${den} = ${num1 + num2}/${den} = ${simDen === 1 ? simNum : `${simNum}/${simDen}`}`
                : `${num1 + num2}/${den} - ${num1}/${den} = ${num2}/${den} = ${simDen === 1 ? simNum : `${simNum}/${simDen}`}`
        };
    }

    // 3. Multiply/divide fractions (25%)
    else if (type < 0.75) {
        const num1 = randomInt(1, 5);
        const den1 = randomInt(2, 8);
        const num2 = randomInt(2, 6);
        const isMultiply = Math.random() > 0.5;

        if (isMultiply) {
            const resultNum = num1 * num2;
            const resultDen = den1;
            const [simNum, simDen] = simplifyFraction(resultNum, resultDen);

            return {
                type: QuestionType.SingleChoice,
                questionText: `${num1}/${den1} × ${num2} = ?`,
                correctAnswer: simDen === 1 ? simNum.toString() : `${simNum}/${simDen}`,
                options: shuffleArray([
                    simDen === 1 ? simNum.toString() : `${simNum}/${simDen}`,
                    `${resultNum}/${resultDen}`,
                    `${num1 * num2}/${den1 * num2}`,
                    `${num1}/${den1 * num2}`
                ]),
                explanation: `${num1}/${den1} × ${num2} = ${resultNum}/${resultDen} = ${simDen === 1 ? simNum : `${simNum}/${simDen}`}`
            };
        } else {
            const resultNum = num1;
            const resultDen = den1 * num2;
            const [simNum, simDen] = simplifyFraction(resultNum, resultDen);

            return {
                type: QuestionType.SingleChoice,
                questionText: `${num1}/${den1} : ${num2} = ?`,
                correctAnswer: `${simNum}/${simDen}`,
                options: shuffleArray([
                    `${simNum}/${simDen}`,
                    `${resultNum}/${resultDen}`,
                    `${num1 * num2}/${den1}`,
                    `${num1}/${den1}`
                ]),
                explanation: `${num1}/${den1} : ${num2} = ${num1}/${den1 * num2} = ${simNum}/${simDen}`
            };
        }
    }

    // 4. Convert fraction to decimal (25%) - only use denominators 2, 4, 5, 8, 10, 20
    else {
        const validDens = [2, 4, 5, 8, 10, 20];
        const den = validDens[randomInt(0, 5)];
        const num = randomInt(1, den - 1);
        const decimal = num / den;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Chuyển ${num}/${den} thành số thập phân?`,
            correctAnswer: formatDecimal(decimal, 4),
            options: shuffleArray([
                formatDecimal(decimal, 4),
                formatDecimal(decimal + 0.1, 4),
                formatDecimal(decimal - 0.1, 4),
                formatDecimal(num / 10, 4)
            ]),
            explanation: `${num}/${den} = ${num} : ${den} = ${formatDecimal(decimal, 4)}`
        };
    }
};
