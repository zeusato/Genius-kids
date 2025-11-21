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

const generateWrongAnswers = (correct: number, count: number, range: number = 100): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val >= 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(n => formatNumber(n));
};

export const generateG3Arithmetic = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Add/subtract without carry (20%)
    if (type < 0.2) {
        const isAdd = Math.random() > 0.5;
        if (isAdd) {
            const a = randomInt(100, 4000);
            const b = randomInt(100, 5000 - a);
            const answer = a + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `${formatNumber(a)} + ${formatNumber(b)} = ?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 200)]),
                explanation: `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(answer)}`
            };
        } else {
            const answer = randomInt(100, 5000);
            const b = randomInt(100, answer);
            const a = answer + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `${formatNumber(a)} - ${formatNumber(b)} = ?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 200)]),
                explanation: `${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(answer)}`
            };
        }
    }

    // 2. Add/subtract with carry (25%)
    else if (type < 0.45) {
        const isAdd = Math.random() > 0.5;
        if (isAdd) {
            const a = randomInt(567, 4567);
            const b = randomInt(345, 3456);
            const answer = a + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `${formatNumber(a)} + ${formatNumber(b)} = ?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 300)]),
                explanation: `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(answer)}`
            };
        } else {
            const answer = randomInt(500, 5000);
            const b = randomInt(300, answer - 100);
            const a = answer + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `${formatNumber(a)} - ${formatNumber(b)} = ?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 300)]),
                explanation: `${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(answer)}`
            };
        }
    }

    // 3. Add/subtract multiple numbers (15%)
    else if (type < 0.6) {
        const nums = [randomInt(100, 1000), randomInt(100, 1000), randomInt(100, 1000)];
        const answer = nums.reduce((a, b) => a + b, 0);
        return {
            type: QuestionType.SingleChoice,
            questionText: `${nums.map(formatNumber).join(' + ')} = ?`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 400)]),
            explanation: `${nums.map(formatNumber).join(' + ')} = ${formatNumber(answer)}`
        };
    }

    // 4. Quick calculation (15%)
    else if (type < 0.75) {
        const a = randomInt(10, 90) * 10;
        const b = randomInt(1, 9);
        const c = 100 - b;
        const answer = a + 100;
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatNumber(a)} + ${b} + ${c} = ? (Tính nhanh)`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 50)]),
            explanation: `${b} + ${c} = 100, nên ${formatNumber(a)} + 100 = ${formatNumber(answer)}`
        };
    }

    // 5. Fill missing numbers (10%)
    else if (type < 0.85) {
        const a = randomInt(100, 3000);
        const b = randomInt(100, 2000);
        const answer = a + b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `${formatNumber(a)} + ... = ${formatNumber(answer)}`,
            correctAnswer: formatNumber(b),
            options: shuffleArray([formatNumber(b), ...generateWrongAnswers(b, 3, 200)]),
            explanation: `${formatNumber(answer)} - ${formatNumber(a)} = ${formatNumber(b)}`
        };
    }

    // 6. Word problems (15%)
    else {
        const scenarios = [
            { context: 'Cửa hàng có', unit: 'quyển vở', action1: 'nhập thêm', action2: 'bán ra' },
            { context: 'Trường có', unit: 'học sinh', action1: 'chuyển đến', action2: 'chuyển đi' },
            { context: 'Vườn có', unit: 'cây', action1: 'trồng thêm', action2: 'chặt bỏ' }
        ];
        const sc = scenarios[randomInt(0, 2)];
        const initial = randomInt(1000, 5000);
        const add = randomInt(200, 1000);
        const sub = randomInt(100, add - 50);
        const answer = initial + add - sub;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${sc.context} ${formatNumber(initial)} ${sc.unit}. ${sc.action1} ${formatNumber(add)} ${sc.unit}, ${sc.action2} ${formatNumber(sub)} ${sc.unit}. Hỏi còn lại bao nhiêu ${sc.unit}?`,
            correctAnswer: formatNumber(answer),
            options: shuffleArray([formatNumber(answer), ...generateWrongAnswers(answer, 3, 500)]),
            explanation: `${formatNumber(initial)} + ${formatNumber(add)} - ${formatNumber(sub)} = ${formatNumber(answer)}`
        };
    }
};
