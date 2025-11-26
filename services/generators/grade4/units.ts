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
            // Chuyển từ đơn vị NHỎ sang LỚN: CHIA cho factor
            // Ví dụ: 100mm = 10cm (100 / 10)
            const val = randomInt(1, 50) * conv.factor; // Đảm bảo chia hết
            const result = val / conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.from} = ... ${conv.to}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswersWithSameUnits(result, 3, Math.floor(Math.max(5, result / 2))).map(n => formatNumber(n))]),
                explanation: `${formatNumber(conv.factor)} ${conv.from} = 1 ${conv.to}. Vậy ${formatNumber(val)} ${conv.from} = ${formatNumber(result)} ${conv.to}.`
            };
        } else {
            // Chuyển từ đơn vị LỚN sang NHỎ: NHÂN với factor
            // Ví dụ: 10cm = 100mm (10 * 10)
            const val = randomInt(1, 500);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.to} = ... ${conv.from}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswersWithSameUnits(result, 3, conv.factor * 5).map(n => formatNumber(n))]),
                explanation: `1 ${conv.to} = ${formatNumber(conv.factor)} ${conv.from}. Vậy ${formatNumber(val)} ${conv.to} = ${formatNumber(result)} ${conv.from}.`
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
            // Chuyển từ đơn vị NHỎ sang LỚN: CHIA cho factor
            // Ví dụ: 5000g = 5kg (5000 / 1000)
            const val = randomInt(1, 50) * conv.factor; // Đảm bảo chia hết
            const result = val / conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.from} = ... ${conv.to}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswersWithSameUnits(result, 3, 10).map(n => formatNumber(n))]),
                explanation: `${formatNumber(conv.factor)} ${conv.from} = 1 ${conv.to}. Vậy ${formatNumber(val)} ${conv.from} = ${formatNumber(result)} ${conv.to}.`
            };
        } else {
            // Chuyển từ đơn vị LỚN sang NHỎ: NHÂN với factor
            // Ví dụ: 5kg = 5000g (5 * 1000)
            const val = randomInt(1, 50);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.to} = ... ${conv.from}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswersWithSameUnits(result, 3, 500).map(n => formatNumber(n))]),
                explanation: `1 ${conv.to} = ${formatNumber(conv.factor)} ${conv.from}. Vậy ${formatNumber(val)} ${conv.to} = ${formatNumber(result)} ${conv.from}.`
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
            // Chuyển từ đơn vị NHỎ sang LỚN: CHIA cho factor
            // Ví dụ: 180 giây = 3 phút (180 / 60)
            const val = randomInt(1, 10) * conv.factor; // Đảm bảo chia hết
            const result = val / conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${val} ${conv.from} = ... ${conv.to}`,
                correctAnswer: result.toString(),
                options: shuffleArray([result.toString(), ...generateWrongAnswersWithSameUnits(result, 3, 3).map(n => formatNumber(n))]),
                explanation: `${conv.factor} ${conv.from} = 1 ${conv.to}. Vậy ${val} ${conv.from} = ${result} ${conv.to}.`
            };
        } else {
            // Chuyển từ đơn vị LỚN sang NHỎ: NHÂN với factor
            // Ví dụ: 3 phút = 180 giây (3 * 60)
            const val = randomInt(1, 10);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${val} ${conv.to} = ... ${conv.from}`,
                correctAnswer: result.toString(),
                options: shuffleArray([result.toString(), ...generateWrongAnswersWithSameUnits(result, 3, 30).map(n => formatNumber(n))]),
                explanation: `1 ${conv.to} = ${conv.factor} ${conv.from}. Vậy ${val} ${conv.to} = ${result} ${conv.from}.`
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
            // Chuyển từ đơn vị NHỎ sang LỚN: CHIA cho factor
            // Ví dụ: 500cm² = 5dm² (500 / 100)
            const val = randomInt(1, 50) * conv.factor; // Đảm bảo chia hết
            const result = val / conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.from} = ... ${conv.to}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswersWithSameUnits(result, 3, 10).map(n => formatNumber(n))]),
                explanation: `${formatNumber(conv.factor)} ${conv.from} = 1 ${conv.to}. Vậy ${formatNumber(val)} ${conv.from} = ${formatNumber(result)} ${conv.to}.`
            };
        } else {
            // Chuyển từ đơn vị LỚN sang NHỎ: NHÂN với factor
            // Ví dụ: 5dm² = 500cm² (5 * 100)
            const val = randomInt(1, 50);
            const result = val * conv.factor;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${formatNumber(val)} ${conv.to} = ... ${conv.from}`,
                correctAnswer: formatNumber(result),
                options: shuffleArray([formatNumber(result), ...generateWrongAnswersWithSameUnits(result, 3, 100).map(n => formatNumber(n))]),
                explanation: `1 ${conv.to} = ${formatNumber(conv.factor)} ${conv.from}. Vậy ${formatNumber(val)} ${conv.to} = ${formatNumber(result)} ${conv.from}.`
            };
        }
    }
};

