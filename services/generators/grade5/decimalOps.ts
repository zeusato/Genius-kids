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

const formatDecimal = (num: number, maxDecimals: number = 4): string => {
    const str = num.toFixed(maxDecimals);
    const trimmed = parseFloat(str).toString();
    return trimmed.replace('.', ',');
};

const roundToDecimals = (num: number, decimals: number): number => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const generateUniqueWrongAnswers = (correct: number, count: number = 3, decimals: number = 2): number[] => {
    const wrongs = new Set<number>();
    const offsets = [0.1, -0.1, 0.2, -0.2, 1, -1, 0.5, -0.5, 2, -2];

    for (const offset of offsets) {
        if (wrongs.size >= count) break;
        const val = roundToDecimals(correct + offset, decimals);
        if (val !== correct && val > 0) {
            wrongs.add(val);
        }
    }

    // Fallback: generate random if not enough
    while (wrongs.size < count) {
        const offset = (randomInt(-20, 20) / 10);
        const val = roundToDecimals(correct + offset, decimals);
        if (val !== correct && val > 0) {
            wrongs.add(val);
        }
    }

    return Array.from(wrongs);
};

export const generateG5DecimalOps = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Add decimals (30%)
    if (type < 0.3) {
        const a = roundToDecimals(randomInt(10, 999) + randomInt(0, 99) / 100, 2);
        const b = roundToDecimals(randomInt(10, 999) + randomInt(0, 99) / 100, 2);
        const answer = roundToDecimals(a + b, 2);

        const wrongAnswers = generateUniqueWrongAnswers(answer, 3, 2);
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatDecimal(a, 2)} + ${formatDecimal(b, 2)} = ?`,
            correctAnswer: formatDecimal(answer, 2),
            options: shuffleArray([
                formatDecimal(answer, 2),
                ...wrongAnswers.map(w => formatDecimal(w, 2))
            ]),
            explanation: `${formatDecimal(a, 2)} + ${formatDecimal(b, 2)} = ${formatDecimal(answer, 2)}`
        };
    }

    // 2. Subtract decimals (30%)
    else if (type < 0.6) {
        const answer = roundToDecimals(randomInt(10, 500) + randomInt(0, 99) / 100, 2);
        const b = roundToDecimals(randomInt(5, answer - 5) + randomInt(0, 99) / 100, 2);
        const a = roundToDecimals(answer + b, 2);

        const wrongAnswers = generateUniqueWrongAnswers(answer, 3, 2);
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatDecimal(a, 2)} - ${formatDecimal(b, 2)} = ?`,
            correctAnswer: formatDecimal(answer, 2),
            options: shuffleArray([
                formatDecimal(answer, 2),
                ...wrongAnswers.map(w => formatDecimal(w, 2))
            ]),
            explanation: `${formatDecimal(a, 2)} - ${formatDecimal(b, 2)} = ${formatDecimal(answer, 2)}`
        };
    }

    // 3. Multiply decimals (25%)
    else if (type < 0.85) {
        const a = roundToDecimals(randomInt(10, 99) + randomInt(0, 9) / 10, 1);
        const b = randomInt(2, 9);
        const answer = roundToDecimals(a * b, 2);

        const wrongAnswers = generateUniqueWrongAnswers(answer, 3, 2);
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatDecimal(a, 1)} × ${b} = ?`,
            correctAnswer: formatDecimal(answer, 2),
            options: shuffleArray([
                formatDecimal(answer, 2),
                ...wrongAnswers.map(w => formatDecimal(w, 2))
            ]),
            explanation: `${formatDecimal(a, 1)} × ${b} = ${formatDecimal(answer, 2)}`
        };
    }

    // 4. Divide decimals (15%)
    else {
        const divisor = randomInt(2, 8);
        const quotient = roundToDecimals(randomInt(5, 50) + randomInt(0, 9) / 10, 1);
        const dividend = roundToDecimals(quotient * divisor, 2);

        const wrongAnswers = generateUniqueWrongAnswers(quotient, 3, 1);
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatDecimal(dividend, 2)} : ${divisor} = ?`,
            correctAnswer: formatDecimal(quotient, 1),
            options: shuffleArray([
                formatDecimal(quotient, 1),
                ...wrongAnswers.map(w => formatDecimal(w, 1))
            ]),
            explanation: `${formatDecimal(dividend, 2)} : ${divisor} = ${formatDecimal(quotient, 1)}`
        };
    }
};
