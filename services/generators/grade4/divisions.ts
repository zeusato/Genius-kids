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

// Using generateWrongAnswersWithSameUnits from mathEngine

export const generateDivision = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Basic division (no remainder) - 30%
    if (type < 0.3) {
        const typeD = randomInt(0, 1);
        if (typeD === 0) {
            // Large / 1 digit
            const quotient = randomInt(1000, 99999);
            const divisor = randomInt(2, 9);
            const dividend = quotient * divisor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${formatNumber(dividend)} : ${divisor} = ?`,
                correctAnswer: formatNumber(quotient),
                options: shuffleArray([formatNumber(quotient), ...generateWrongAnswersWithSameUnits(quotient, 3, 1000).map(n => formatNumber(n))]),
                explanation: `Chia từng chữ số của ${formatNumber(dividend)} cho ${divisor} từ trái sang phải.`
            };
        } else {
            // Medium / 2 digits
            const quotient = randomInt(100, 9999);
            const divisor = randomInt(11, 99);
            const dividend = quotient * divisor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${formatNumber(dividend)} : ${divisor} = ?`,
                correctAnswer: formatNumber(quotient),
                options: shuffleArray([formatNumber(quotient), ...generateWrongAnswersWithSameUnits(quotient, 3, 500).map(n => formatNumber(n))]),
                explanation: `Chia ${formatNumber(dividend)} cho ${divisor} theo từng bước, tìm thương từng chữ số.`
            };
        }
    }

    // 2. Division with remainder - 25%
    else if (type < 0.55) {
        const quotient = randomInt(100, 9999);
        const divisor = randomInt(2, 99);
        const remainder = randomInt(1, divisor - 1);
        const dividend = quotient * divisor + remainder;

        const qType = randomInt(0, 1);
        if (qType === 0) {
            // Find quotient
            return {
                type: QuestionType.SingleChoice,
                questionText: `Khi chia ${formatNumber(dividend)} cho ${divisor}, thương là bao nhiêu?`,
                correctAnswer: formatNumber(quotient),
                options: shuffleArray([formatNumber(quotient), ...generateWrongAnswersWithSameUnits(quotient, 3, 100).map(n => formatNumber(n))]),
                explanation: `${formatNumber(dividend)} : ${divisor} = ${formatNumber(quotient)} (dư ${remainder})`
            };
        } else {
            // Find remainder
            return {
                type: QuestionType.SingleChoice,
                questionText: `Khi chia ${formatNumber(dividend)} cho ${divisor}, số dư là bao nhiêu?`,
                correctAnswer: remainder.toString(),
                options: shuffleArray([remainder.toString(), (remainder + 1).toString(), (remainder - 1).toString(), (divisor - 1).toString()]),
                explanation: `${formatNumber(dividend)} : ${divisor} = ${formatNumber(quotient)} (dư ${remainder})`
            };
        }
    }

    // 3. Find missing number - 20%
    else if (type < 0.75) {
        const findType = randomInt(0, 1);
        if (findType === 0) {
            // Find dividend: x : b = q
            const quotient = randomInt(100, 9999);
            const divisor = randomInt(2, 99);
            const dividend = quotient * divisor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tìm x biết: x : ${divisor} = ${formatNumber(quotient)}`,
                correctAnswer: formatNumber(dividend),
                options: shuffleArray([formatNumber(dividend), ...generateWrongAnswersWithSameUnits(dividend, 3, 5000).map(n => formatNumber(n))]),
                explanation: `x = ${formatNumber(quotient)} × ${divisor} = ${formatNumber(dividend)}`
            };
        } else {
            // Find divisor: a : x = q
            const quotient = randomInt(10, 999);
            const divisor = randomInt(2, 99);
            const dividend = quotient * divisor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tìm x biết: ${formatNumber(dividend)} : x = ${formatNumber(quotient)}`,
                correctAnswer: divisor.toString(),
                options: shuffleArray([divisor.toString(), ...generateWrongAnswersWithSameUnits(divisor, 3, 20).map(n => formatNumber(n))]),
                explanation: `x = ${formatNumber(dividend)} : ${formatNumber(quotient)} = ${divisor}`
            };
        }
    }

    // 4. Word problems - 25%
    else {
        const scenarios = [
            { total: 'học sinh', group: 'nhóm' },
            { total: 'quyển sách', group: 'túi' },
            { total: 'viên kẹo', group: 'em' },
            { total: 'kg gạo', group: 'túi' }
        ];
        const sc = scenarios[randomInt(0, scenarios.length - 1)];
        const perGroup = randomInt(2, 50);
        const maxTotal = 9999;
        const maxGroups = Math.floor(maxTotal / perGroup);
        const groups = randomInt(10, maxGroups);
        const total = groups * perGroup;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Chia ${formatNumber(total)} ${sc.total} đều cho ${perGroup} ${sc.group}. Hỏi mỗi ${sc.group} được bao nhiêu ${sc.total}?`,
            correctAnswer: formatNumber(groups),
            options: shuffleArray([formatNumber(groups), ...generateWrongAnswersWithSameUnits(groups, 3, 10).map(n => formatNumber(n))]),
            explanation: `Mỗi ${sc.group} được: ${formatNumber(total)} : ${perGroup} = ${formatNumber(groups)} ${sc.total}`
        };
    }
};

