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

const formatDecimal = (num: number, maxDecimals: number = 2): string => {
    const str = num.toFixed(maxDecimals);
    const trimmed = parseFloat(str).toString();
    return trimmed.replace('.', ',');
};

export const generateG5Measurements = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Length conversion (30%)
    if (type < 0.3) {
        const conversions = [
            { from: 'km', to: 'm', factor: 1000 },
            { from: 'm', to: 'dm', factor: 10 },
            { from: 'm', to: 'cm', factor: 100 },
            { from: 'cm', to: 'mm', factor: 10 }
        ];
        const conv = conversions[randomInt(0, 3)];
        const value = randomInt(2, 50);
        const answer = value * conv.factor;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${value}${conv.from} = ? ${conv.to}`,
            correctAnswer: `${formatNumber(answer)}${conv.to}`,
            options: shuffleArray([
                `${formatNumber(answer)}${conv.to}`,
                `${formatNumber(answer + conv.factor)}${conv.to}`,
                `${formatNumber(answer / 10)}${conv.to}`,
                `${value}${conv.to}`
            ]),
            explanation: `1${conv.from} = ${formatNumber(conv.factor)}${conv.to}, nên ${value}${conv.from} = ${formatNumber(answer)}${conv.to}`
        };
    }

    // 2. Area conversion (25%)
    else if (type < 0.55) {
        const conversions = [
            { from: 'm²', to: 'dm²', factor: 100 },
            { from: 'dm²', to: 'cm²', factor: 100 },
            { from: 'cm²', to: 'mm²', factor: 100 }
        ];
        const conv = conversions[randomInt(0, 2)];
        const value = randomInt(2, 20);
        const answer = value * conv.factor;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${value}${conv.from} = ? ${conv.to}`,
            correctAnswer: `${formatNumber(answer)}${conv.to}`,
            options: shuffleArray([
                `${formatNumber(answer)}${conv.to}`,
                `${formatNumber(value * 10)}${conv.to}`,
                `${formatNumber(value * 1000)}${conv.to}`,
                `${value}${conv.to}`
            ]),
            explanation: `1${conv.from} = ${formatNumber(conv.factor)}${conv.to}, nên ${value}${conv.from} = ${formatNumber(answer)}${conv.to}`
        };
    }

    // 3. Volume conversion (20%)
    else if (type < 0.75) {
        const conversions = [
            { from: 'm³', to: 'dm³', factor: 1000 },
            { from: 'dm³', to: 'cm³', factor: 1000 },
            { from: 'dm³', to: 'lít', factor: 1 }
        ];
        const conv = conversions[randomInt(0, 2)];
        const value = randomInt(2, 10);
        const answer = value * conv.factor;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${value}${conv.from} = ? ${conv.to}`,
            correctAnswer: conv.factor === 1 ? `${answer}${conv.to}` : `${formatNumber(answer)}${conv.to}`,
            options: shuffleArray([
                conv.factor === 1 ? `${answer}${conv.to}` : `${formatNumber(answer)}${conv.to}`,
                `${formatNumber(value * 100)}${conv.to}`,
                `${formatNumber(value * 10)}${conv.to}`,
                `${value}${conv.to}`
            ]),
            explanation: `1${conv.from} = ${conv.factor === 1 ? conv.factor : formatNumber(conv.factor)}${conv.to}`
        };
    }

    // 4. Speed-distance-time (25%)
    else {
        const speed = randomInt(30, 80);
        const time = randomInt(2, 5);
        const distance = speed * time;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một xe chạy với vận tốc ${speed}km/h trong ${time} giờ. Hỏi xe đi được bao nhiêu km?`,
            correctAnswer: `${distance}km`,
            options: shuffleArray([
                `${distance}km`,
                `${speed + time}km`,
                `${speed * (time + 1)}km`,
                `${speed}km`
            ]),
            explanation: `Quãng đường = vận tốc × thời gian = ${speed} × ${time} = ${distance}km`
        };
    }
};
