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

export const generateUniqueWrongAnswers = (correct: number, count: number = 3, decimals: number = 2): number[] => {
    const wrongs = new Set<number>();
    const power = Math.pow(10, decimals);
    const correctInteger = Math.round(correct * power); // Convert to integer (e.g., 12.34 -> 1234)
    const lastDigit = correctInteger % 10; // The last digit we want to preserve

    let attempts = 0;
    const maxAttempts = count * 50;

    while (wrongs.size < count && attempts < maxAttempts) {
        attempts++;

        // Generate a random offset that preserves the last digit
        // Offset must be a multiple of 10 (in the scaled integer domain)
        // e.g. if we add 10 to 1234, we get 1244 (last digit 4 preserved)
        // In decimal domain, this means adding multiples of 10 / power
        // e.g. for 2 decimals, adding 0.1, 0.2, 1.0, etc.

        const offsetInt = randomInt(1, 50) * 10; // Multiple of 10
        const isNegative = Math.random() > 0.5;
        const finalOffsetInt = isNegative ? -offsetInt : offsetInt;

        const wrongInt = correctInteger + finalOffsetInt;
        const wrongVal = wrongInt / power;

        if (wrongVal > 0 && wrongVal !== correct) {
            wrongs.add(wrongVal);
        }
    }

    // Fallback: just random small offsets if we can't find enough
    while (wrongs.size < count) {
        const offset = randomInt(1, 20) / power; // Just change the last digit or close to it
        const isNegative = Math.random() > 0.5;
        const val = Math.max(0, correct + (isNegative ? -offset : offset));
        if (val !== correct) {
            wrongs.add(roundToDecimals(val, decimals));
        }
    }

    return Array.from(wrongs);
};

export const generateG5DecimalOps = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Add decimals (15%)
    if (type < 0.15) {
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

    // 2. Subtract decimals (15%)
    else if (type < 0.3) {
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

    // 3. Multiply decimals (15%)
    else if (type < 0.45) {
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
    else if (type < 0.6) {
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

    // 5. Multiply Decimal x Decimal (20%)
    else if (type < 0.8) {
        // a has 1 decimal, b has 1 decimal -> result has 2 decimals
        const a = roundToDecimals(randomInt(1, 20) + randomInt(1, 9) / 10, 1);
        const b = roundToDecimals(randomInt(1, 10) + randomInt(1, 9) / 10, 1);
        const answer = roundToDecimals(a * b, 2);

        const wrongAnswers = generateUniqueWrongAnswers(answer, 3, 2);
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatDecimal(a, 1)} × ${formatDecimal(b, 1)} = ?`,
            correctAnswer: formatDecimal(answer, 2),
            options: shuffleArray([
                formatDecimal(answer, 2),
                ...wrongAnswers.map(w => formatDecimal(w, 2))
            ]),
            explanation: `${formatDecimal(a, 1)} × ${formatDecimal(b, 1)} = ${formatDecimal(answer, 2)}`
        };
    }

    // 6. Divide Decimal / Decimal (20%)
    else {
        // Quotient has 1 decimal, Divisor has 1 decimal -> Dividend has 2 decimals
        const quotient = roundToDecimals(randomInt(1, 20) + randomInt(1, 9) / 10, 1);
        const divisor = roundToDecimals(randomInt(1, 9) + randomInt(1, 9) / 10, 1);
        const dividend = roundToDecimals(quotient * divisor, 2);

        // Recalculate exact dividend to avoid floating point issues, but roundToDecimals handles it well usually.
        // Let's ensure dividend is displayed correctly.

        const wrongAnswers = generateUniqueWrongAnswers(quotient, 3, 1);
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatDecimal(dividend, 2)} : ${formatDecimal(divisor, 1)} = ?`,
            correctAnswer: formatDecimal(quotient, 1),
            options: shuffleArray([
                formatDecimal(quotient, 1),
                ...wrongAnswers.map(w => formatDecimal(w, 1))
            ]),
            explanation: `${formatDecimal(dividend, 2)} : ${formatDecimal(divisor, 1)} = ${formatDecimal(quotient, 1)}`
        };
    }
};
