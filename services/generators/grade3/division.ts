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

const generateWrongAnswers = (correct: number, count: number, range: number = 10): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val > 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(String);
};

export const generateG3Division = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. 2-3 digit ÷ 1 digit (no remainder) (35%)
    if (type < 0.35) {
        const divisor = randomInt(2, 9);
        const quotient = randomInt(5, 99);
        const dividend = divisor * quotient;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatNumber(dividend)} : ${divisor} = ?`,
            correctAnswer: quotient.toString(),
            options: shuffleArray([quotient.toString(), ...generateWrongAnswers(quotient, 3, 10)]),
            explanation: `${formatNumber(dividend)} : ${divisor} = ${quotient}`
        };
    }

    // 2. Division with remainder (30%)
    else if (type < 0.65) {
        const divisor = randomInt(2, 9);
        const quotient = randomInt(5, 50);
        const remainder = randomInt(1, divisor - 1);
        const dividend = divisor * quotient + remainder;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatNumber(dividend)} : ${divisor} = ? (dư ?)`,
            correctAnswer: `${quotient} dư ${remainder}`,
            options: shuffleArray([
                `${quotient} dư ${remainder}`,
                `${quotient + 1} dư ${remainder}`,
                `${quotient} dư ${remainder + 1}`,
                `${quotient - 1} dư ${remainder}`
            ]),
            explanation: `${formatNumber(dividend)} : ${divisor} = ${quotient} dư ${remainder}`
        };
    }

    // 3. Round number division (15%)
    else if (type < 0.8) {
        const divisor = randomInt(2, 9);
        const quotient = randomInt(10, 90) * 10;
        const dividend = divisor * quotient;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatNumber(dividend)} : ${divisor} = ?`,
            correctAnswer: formatNumber(quotient),
            options: shuffleArray([formatNumber(quotient), ...generateWrongAnswers(quotient, 3, 50)]),
            explanation: `${formatNumber(dividend)} : ${divisor} = ${formatNumber(quotient)}`
        };
    }

    // 4. Word problems (20%)
    else {
        const scenarios = [
            { total: 'viên kẹo', group: 'bạn', action: 'chia đều' },
            { total: 'quyển vở', group: 'học sinh', action: 'phát đều' },
            { total: 'cái bánh', group: 'người', action: 'chia đều' }
        ];
        const sc = scenarios[randomInt(0, 2)];
        const divisor = randomInt(3, 9);
        const quotient = randomInt(10, 50);
        const dividend = divisor * quotient;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${formatNumber(dividend)} ${sc.total} ${sc.action} cho ${divisor} ${sc.group}. Hỏi mỗi ${sc.group} được bao nhiêu ${sc.total}?`,
            correctAnswer: quotient.toString(),
            options: shuffleArray([quotient.toString(), ...generateWrongAnswers(quotient, 3, 10)]),
            explanation: `${formatNumber(dividend)} : ${divisor} = ${quotient}`
        };
    }
};
