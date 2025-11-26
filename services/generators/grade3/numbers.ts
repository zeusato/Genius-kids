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

export const generateG3Numbers = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Write/Read numbers (15%)
    if (type < 0.15) {
        const num = randomInt(1000, 9999);
        const numWords = [
            'một nghìn', 'hai nghìn', 'ba nghìn', 'bốn nghìn', 'năm nghìn',
            'sáu nghìn', 'bảy nghìn', 'tám nghìn', 'chín nghìn'
        ];
        const thousands = Math.floor(num / 1000);
        const hundreds = Math.floor((num % 1000) / 100);
        const tens = Math.floor((num % 100) / 10);
        const ones = num % 10;

        let wordForm = numWords[thousands - 1];
        if (hundreds > 0) wordForm += ` ${hundreds === 1 ? 'một' : hundreds === 2 ? 'hai' : hundreds === 3 ? 'ba' : hundreds === 4 ? 'bốn' : hundreds === 5 ? 'năm' : hundreds === 6 ? 'sáu' : hundreds === 7 ? 'bảy' : hundreds === 8 ? 'tám' : 'chín'} trăm`;
        if (tens > 0 || ones > 0) {
            if (tens === 0) wordForm += ' lẻ';
            else if (tens === 1) wordForm += ' mười';
            else wordForm += ` ${tens === 2 ? 'hai' : tens === 3 ? 'ba' : tens === 4 ? 'bốn' : tens === 5 ? 'năm' : tens === 6 ? 'sáu' : tens === 7 ? 'bảy' : tens === 8 ? 'tám' : 'chín'} mươi`;
        }
        if (ones > 0) {
            if (ones === 1 && tens > 1) wordForm += ' mốt';
            else if (ones === 5 && tens > 0) wordForm += ' lăm';
            else wordForm += ` ${ones === 1 ? 'một' : ones === 2 ? 'hai' : ones === 3 ? 'ba' : ones === 4 ? 'bốn' : ones === 5 ? 'năm' : ones === 6 ? 'sáu' : ones === 7 ? 'bảy' : ones === 8 ? 'tám' : 'chín'}`;
        }

        return {
            type: QuestionType.SingleChoice,
            questionText: `Viết số: ${wordForm}`,
            correctAnswer: formatNumber(num),
            options: shuffleArray([formatNumber(num), ...generateWrongAnswersWithSameUnits(num, 3, 500).map(n => formatNumber(n))]),
            explanation: `${wordForm} = ${formatNumber(num)}`
        };
    }

    // 2. Compare numbers (20%)
    else if (type < 0.35) {
        const num1 = randomInt(1000, 9999);
        const num2 = randomInt(1000, 9999);
        const operators = ['>', '<', '='];
        const correctOp = num1 > num2 ? '>' : num1 < num2 ? '<' : '=';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh: ${formatNumber(num1)} ... ${formatNumber(num2)}`,
            correctAnswer: correctOp,
            options: shuffleArray(operators),
            explanation: `${formatNumber(num1)} ${correctOp} ${formatNumber(num2)}`
        };
    }

    // 3. Find previous/next number (15%)
    else if (type < 0.5) {
        const num = randomInt(1001, 9998);
        const isPrev = Math.random() > 0.5;
        const answer = isPrev ? num - 1 : num + 1;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Số ${isPrev ? 'liền trước' : 'liền sau'} của ${formatNumber(num)} là?`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), formatNumber(answer + 1), formatNumber(answer - 1), formatNumber(answer + 2)]),
            explanation: `Số ${isPrev ? 'liền trước' : 'liền sau'} ${formatNumber(num)} là ${formatNumber(answer)}`
        };
    }

    // 4. Round hundreds/thousands (20%)
    else if (type < 0.7) {
        const num = randomInt(1050, 9950);
        const roundToThousand = Math.random() > 0.5;
        let answer: number;

        if (roundToThousand) {
            answer = Math.round(num / 1000) * 1000;
        } else {
            answer = Math.round(num / 100) * 100;
        }

        return {
            type: QuestionType.SingleChoice,
            questionText: `Làm tròn ${formatNumber(num)} đến ${roundToThousand ? 'hàng nghìn' : 'hàng trăm'}?`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswersWithSameUnits(answer, 3, roundToThousand ? 1000 : 100).map(n => formatNumber(n))]),
            explanation: `${formatNumber(num)} làm tròn đến ${roundToThousand ? 'hàng nghìn' : 'hàng trăm'} = ${formatNumber(answer)}`
        };
    }

    // 5. Number patterns (15%)
    else if (type < 0.85) {
        const start = randomInt(1000, 5000);
        const step = [100, 200, 500, 1000][randomInt(0, 3)];
        const sequence = [start, start + step, start + 2 * step];
        const answer = start + 3 * step;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tìm số tiếp theo: ${sequence.map(formatNumber).join(', ')}, ...`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswersWithSameUnits(answer, 3, step).map(n => formatNumber(n))]),
            explanation: `Quy luật: mỗi số cách nhau ${formatNumber(step)}. Số tiếp theo: ${formatNumber(answer)}`
        };
    }

    // 6. Number composition (15%)
    else {
        const num = randomInt(1000, 9999);
        const thousands = Math.floor(num / 1000);
        const hundreds = Math.floor((num % 1000) / 100);
        const tens = Math.floor((num % 100) / 10);
        const ones = num % 10;

        const questionTypes = [
            { q: `Trong số ${formatNumber(num)}, chữ số hàng nghìn là?`, a: thousands.toString() },
            { q: `Trong số ${formatNumber(num)}, chữ số hàng trăm là?`, a: hundreds.toString() },
            { q: `Trong số ${formatNumber(num)}, chữ số hàng chục là?`, a: tens.toString() },
            { q: `Trong số ${formatNumber(num)}, chữ số hàng đơn vị là?`, a: ones.toString() }
        ];

        const chosen = questionTypes[randomInt(0, 3)];
        const wrongOpts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            .filter(n => n.toString() !== chosen.a)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(String);

        return {
            type: QuestionType.SingleChoice,
            questionText: chosen.q,
            correctAnswer: chosen.a,
            options: shuffleArray([chosen.a, ...wrongOpts]),
            explanation: `${formatNumber(num)} = ${thousands} nghìn + ${hundreds} trăm + ${tens} chục + ${ones} đơn vị`
        };
    }
};
