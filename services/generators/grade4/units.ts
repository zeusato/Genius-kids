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
    return Array.from(wrongs).map(n => formatNumber(n));
};

export const generateUnits = (): Omit<Question, 'id' | 'topicId'> => {
    const types = ['length', 'mass', 'time', 'area'];
    const selectedType = types[randomInt(0, 3)];

    // 1. Length (mm - cm - dm - m - km)
    if (selectedType === 'length') {
        const conversions = [
            { from: 'mm', to: 'cm', factor: 10 },
            { from: 'cm', to: 'dm', factor: 10 },
            { from: 'dm', to: 'm', factor: 10 },
            { from: 'm', to: 'km', factor: 1000 }
        ];
        const conv = conversions[randomInt(0, conversions.length - 1)];
        const isForward = Math.random() > 0.5;

        if (isForward) {
            const val = randomInt(1, 500);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.from} = ... ${conv.to}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswers(result, 3, conv.factor * 5)]),
                explanation: `1 ${conv.from} = ${formatNumber(conv.factor)} ${conv.to}. Vậy ${formatNumber(val)} ${conv.from} = ${formatNumber(result)} ${conv.to}.`
            };
        } else {
            const val = randomInt(1, 500);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(result)} ${conv.to} = ... ${conv.from}`,
                correctAnswer: formatNumber(val),
                options: shuffleArray([formatNumber(val), ...generateWrongAnswers(val, 3, 50)]),
                explanation: `${formatNumber(conv.factor)} ${conv.to} = 1 ${conv.from}. Vậy ${formatNumber(result)} ${conv.to} = ${formatNumber(val)} ${conv.from}.`
            };
        }
    }

    // 2. Mass (g - kg - tấn)
    else if (selectedType === 'mass') {
        const conversions = [
            { from: 'g', to: 'kg', factor: 1000 },
            { from: 'kg', to: 'tấn', factor: 1000 }
        ];
        const conv = conversions[randomInt(0, 1)];
        const isForward = Math.random() > 0.5;

        if (isForward) {
            const val = randomInt(1, 50);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.from} = ... ${conv.to}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswers(result, 3, 500)]),
                explanation: `1 ${conv.from} = ${formatNumber(conv.factor)} ${conv.to}.`
            };
        } else {
            const val = randomInt(1, 50);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(result)} ${conv.to} = ... ${conv.from}`,
                correctAnswer: formatNumber(val),
                options: shuffleArray([formatNumber(val), ...generateWrongAnswers(val, 3, 10)]),
                explanation: `${formatNumber(conv.factor)} ${conv.to} = 1 ${conv.from}.`
            };
        }
    }

    // 3. Time (giây - phút - giờ)
    else if (selectedType === 'time') {
        const conversions = [
            { from: 'giây', to: 'phút', factor: 60 },
            { from: 'phút', to: 'giờ', factor: 60 }
        ];
        const conv = conversions[randomInt(0, 1)];
        const isForward = Math.random() > 0.5;

        if (isForward) {
            const val = randomInt(1, 10);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${val} ${conv.from} = ... ${conv.to}`,
                correctAnswer: result.toString(),
                options: shuffleArray([result.toString(), ...generateWrongAnswers(result, 3, 30)]),
                explanation: `1 ${conv.from} = ${conv.factor} ${conv.to}.`
            };
        } else {
            const val = randomInt(1, 10);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${result} ${conv.to} = ... ${conv.from}`,
                correctAnswer: val.toString(),
                options: shuffleArray([val.toString(), ...generateWrongAnswers(val, 3, 3)]),
                explanation: `${conv.factor} ${conv.to} = 1 ${conv.from}.`
            };
        }
    }

    // 4. Area (cm² - dm² - m²)
    else {
        const conversions = [
            { from: 'cm²', to: 'dm²', factor: 100 },
            { from: 'dm²', to: 'm²', factor: 100 }
        ];
        const conv = conversions[randomInt(0, 1)];
        const isForward = Math.random() > 0.5;

        if (isForward) {
            const val = randomInt(1, 50);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.from} = ... ${conv.to}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswers(result, 3, 100)]),
                explanation: `1 ${conv.from} = ${formatNumber(conv.factor)} ${conv.to}.`
            };
        } else {
            const val = randomInt(1, 50);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(result)} ${conv.to} = ... ${conv.from}`,
                correctAnswer: formatNumber(val),
                options: shuffleArray([formatNumber(val), ...generateWrongAnswers(val, 3, 10)]),
                explanation: `${formatNumber(conv.factor)} ${conv.to} = 1 ${conv.from}.`
            };
        }
    }
};
