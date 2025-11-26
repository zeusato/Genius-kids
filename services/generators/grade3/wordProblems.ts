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

export const generateG3WordProblems = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. One-step problems (30%)
    if (type < 0.3) {
        const operations = ['add', 'subtract', 'multiply', 'divide'];
        const op = operations[randomInt(0, 3)];

        if (op === 'add') {
            const a = randomInt(100, 500);
            const b = randomInt(100, 500);
            const answer = a + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Lan có ${formatNumber(a)} viên bi, Hoa có ${formatNumber(b)} viên bi. Hỏi cả hai bạn có tất cả bao nhiêu viên bi?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswersWithSameUnits(answer, 3, 100).map(n => formatNumber(n))]),
                explanation: `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(answer)} viên bi`
            };
        } else if (op === 'subtract') {
            const answer = randomInt(100, 500);
            const b = randomInt(50, answer - 50);
            const a = answer + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Cửa hàng có ${formatNumber(a)} quyển vở, đã bán ${formatNumber(b)} quyển. Hỏi còn lại bao nhiêu quyển vở?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswersWithSameUnits(answer, 3, 100).map(n => formatNumber(n))]),
                explanation: `${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(answer)} quyển vở`
            };
        } else if (op === 'multiply') {
            const a = randomInt(5, 50);
            const b = randomInt(3, 9);
            const answer = a * b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Có ${a} hộp, mỗi hộp có ${b} cái kẹo. Hỏi cả thảy có bao nhiêu cái kẹo?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswersWithSameUnits(answer, 3, 30).map(n => formatNumber(n))]),
                explanation: `${a} × ${b} = ${formatNumber(answer)} cái kẹo`
            };
        } else {
            const divisor = randomInt(3, 9);
            const quotient = randomInt(10, 50);
            const dividend = divisor * quotient;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Chia ${formatNumber(dividend)} viên kẹo đều cho ${divisor} bạn. Hỏi mỗi bạn được bao nhiêu viên?`,
                correctAnswer: quotient.toString(),
                options: shuffleArray([quotient.toString(), (quotient + 1).toString(), (quotient - 1).toString(), (quotient + 2).toString()]),
                explanation: `${formatNumber(dividend)} : ${divisor} = ${quotient} viên`
            };
        }
    }

    // 2. Two-step combined (40%)
    else if (type < 0.7) {
        const combos = ['add-multiply', 'multiply-subtract', 'subtract-divide'];
        const combo = combos[randomInt(0, 2)];

        if (combo === 'add-multiply') {
            const boxes = randomInt(5, 20);
            const perBox = randomInt(6, 12);
            const extra = randomInt(5, 20);
            const answer = boxes * perBox + extra;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Có ${boxes} hộp, mỗi hộp ${perBox} cái kẹo. Ngoài ra còn ${extra} cái lẻ. Hỏi cả thảy có bao nhiêu cái kẹo?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswersWithSameUnits(answer, 3, 50).map(n => formatNumber(n))]),
                explanation: `Bước 1: ${boxes} × ${perBox} = ${boxes * perBox}\\nBước 2: ${boxes * perBox} + ${extra} = ${formatNumber(answer)}`
            };
        } else if (combo === 'multiply-subtract') {
            const boxes = randomInt(10, 30);
            const perBox = randomInt(8, 15);
            const sold = randomInt(50, boxes * perBox - 50);
            const answer = boxes * perBox - sold;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Cửa hàng có ${boxes} thùng, mỗi thùng ${perBox} chai nước. Đã bán ${formatNumber(sold)} chai. Hỏi còn lại bao nhiêu chai?`,
                correctAnswer: formatNumber(answer),
                options: shuffleArray([formatNumber(answer), ...generateWrongAnswersWithSameUnits(answer, 3, 50).map(n => formatNumber(n))]),
                explanation: `Bước 1: ${boxes} × ${perBox} = ${boxes * perBox}\\nBước 2: ${boxes * perBox} - ${formatNumber(sold)} = ${formatNumber(answer)}`
            };
        } else {
            // Ensure divisible result
            const groups = randomInt(3, 7);
            const quotient = randomInt(20, 100);
            const remaining = groups * quotient;
            const used = randomInt(50, 200);
            const initial = remaining + used;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Có ${formatNumber(initial)} viên bi, đã cho bạn ${formatNumber(used)} viên. Số còn lại chia đều cho ${groups} bạn. Hỏi mỗi bạn được bao nhiêu viên?`,
                correctAnswer: quotient.toString(),
                options: shuffleArray([quotient.toString(), (quotient + 1).toString(), (quotient - 1).toString(), groups.toString()]),
                explanation: `Bước 1: ${formatNumber(initial)} - ${formatNumber(used)} = ${formatNumber(remaining)}\\nBước 2: ${formatNumber(remaining)} : ${groups} = ${quotient}`
            };
        }
    }

    // 3. Multiply/divide problems (20%)
    else if (type < 0.9) {
        const a = randomInt(5, 20);
        const b = randomInt(3, 8);
        const answer = a * b;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Một quyển vở giá ${formatNumber(a * 1000)} đồng. Hỏi ${b} quyển vở giá bao nhiêu?`,
            correctAnswer: formatNumber(answer * 1000),
            options: shuffleArray([formatNumber(answer * 1000), ...generateWrongAnswersWithSameUnits(answer * 1000, 3, 5000).map(n => formatNumber(n))]),
            explanation: `${formatNumber(a * 1000)} × ${b} = ${formatNumber(answer * 1000)} đồng`
        };
    }

    // 4. Sum-difference problems (10%)
    else {
        // Ensure integer results by making sum and diff both even or both odd
        const diff = randomInt(10, 40) * 2; // Even diff
        const smaller = randomInt(50, 200);
        const larger = smaller + diff;
        const sum = larger + smaller;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hai số có tổng là ${formatNumber(sum)}, hiệu là ${diff}. Số lớn là bao nhiêu?`,
            correctAnswer: formatNumber(larger),
            options: shuffleArray([formatNumber(larger), formatNumber(smaller), formatNumber(sum), formatNumber(diff)]),
            explanation: `Số lớn = (${formatNumber(sum)} + ${diff}) : 2 = ${formatNumber(larger)}`
        };
    }
};
