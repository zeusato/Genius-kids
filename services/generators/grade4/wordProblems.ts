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

export const generateWordProblems = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Two-step addition/subtraction - 20%
    if (type < 0.2) {
        const initial = randomInt(1000, 10000);
        const add = randomInt(500, 5000);
        const sub = randomInt(200, add - 100);
        const result = initial + add - sub;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Cửa hàng có ${formatNumber(initial)} quyển vở. Sáng nhập thêm ${formatNumber(add)} quyển, chiều bán ra ${formatNumber(sub)} quyển. Hỏi cửa hàng còn lại bao nhiêu quyển vở?`,
            correctAnswer: formatNumber(result),
            options: shuffleArray([formatNumber(result), ...generateWrongAnswersWithSameUnits(result, 3, 500).map(n => formatNumber(n))]),
            explanation: `Bước 1: Sau khi nhập thêm: ${formatNumber(initial)} + ${formatNumber(add)} = ${formatNumber(initial + add)}\nBước 2: Sau khi bán: ${formatNumber(initial + add)} - ${formatNumber(sub)} = ${formatNumber(result)}`
        };
    }

    // 2. Multiplication + Addition - 20%
    else if (type < 0.4) {
        const boxes = randomInt(10, 50);
        const perBox = randomInt(12, 48);
        const extra = randomInt(5, 20);
        const total = boxes * perBox + extra;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${formatNumber(boxes)} thùng, mỗi thùng ${perBox} chai nước. Ngoài ra còn ${extra} chai lẻ. Hỏi cả thảy có bao nhiêu chai nước?`,
            correctAnswer: formatNumber(total),
            options: shuffleArray([formatNumber(total), ...generateWrongAnswersWithSameUnits(total, 3, 50).map(n => formatNumber(n))]),
            explanation: `Bước 1: Số chai trong thùng: ${formatNumber(boxes)} × ${perBox} = ${formatNumber(boxes * perBox)}\nBước 2: Tổng cộng: ${formatNumber(boxes * perBox)} + ${extra} = ${formatNumber(total)}`
        };
    }

    // 3. Division + Subtraction - 20%
    else if (type < 0.6) {
        const total = randomInt(500, 5000);
        const groups = randomInt(5, 20);
        const perGroup = Math.floor(total / groups);
        const used = perGroup * groups;
        const remain = total - used;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${formatNumber(total)} viên kẹo chia đều cho ${groups} bạn. Hỏi còn thừa bao nhiêu viên kẹo?`,
            correctAnswer: remain.toString(),
            options: shuffleArray([remain.toString(), formatNumber(perGroup), groups.toString(), (remain + 1).toString()]),
            explanation: `Bước 1: Mỗi bạn được: ${formatNumber(total)} : ${groups} = ${formatNumber(perGroup)} (dư ${remain})\nVậy còn thừa ${remain} viên.`
        };
    }

    // 4. Multi-step with different operations - 20%
    else if (type < 0.8) {
        const money = randomInt(50000, 500000);
        const buy1 = randomInt(10000, money / 3);
        const buy2 = randomInt(10000, money / 3);
        const change = money - buy1 - buy2;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Mẹ có ${formatNumber(money)} đồng. Mẹ mua sách hết ${formatNumber(buy1)} đồng, mua vở hết ${formatNumber(buy2)} đồng. Hỏi mẹ còn lại bao nhiêu tiền?`,
            correctAnswer: formatNumber(change),
            options: shuffleArray([formatNumber(change), ...generateWrongAnswersWithSameUnits(change, 3, 5000).map(n => formatNumber(n))]),
            explanation: `Bước 1: Tổng tiền mua: ${formatNumber(buy1)} + ${formatNumber(buy2)} = ${formatNumber(buy1 + buy2)}\nBước 2: Tiền còn lại: ${formatNumber(money)} - ${formatNumber(buy1 + buy2)} = ${formatNumber(change)}`
        };
    }

    // 5. Sum and Difference - 20%
    else {
        // Generate two numbers first to ensure they are integers and positive
        const num1 = randomInt(50, 500); // Larger number
        const num2 = randomInt(10, num1 - 10); // Smaller number

        const sum = num1 + num2;
        const diff = num1 - num2;

        const correctStr = `${num1} và ${num2}`;

        // Distractors
        const options = new Set<string>();
        options.add(correctStr);

        // Distractor 1: Same sum, different numbers (e.g., num1+10, num2-10)
        options.add(`${num1 + 10} và ${num2 - 10}`);

        // Distractor 2: Wrong calculation (e.g., sum/2 and diff/2 ?)
        // Or just random numbers close to result
        options.add(`${num1 + 5} và ${num2 + 5}`); // Sum + 10
        options.add(`${num1 - 5} và ${num2 + 5}`); // Diff - 10

        // Ensure unique options
        while (options.size < 4) {
            const r1 = num1 + randomInt(-20, 20);
            const r2 = num2 + randomInt(-20, 20);
            if (r1 > r2 && r1 > 0 && r2 > 0) {
                options.add(`${r1} và ${r2}`);
            }
        }

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tổng của hai số là ${sum}. Hiệu của hai số là ${diff}. Tìm hai số đó?`,
            correctAnswer: correctStr,
            options: shuffleArray(Array.from(options)),
            explanation: `Số lớn = (Tổng + Hiệu) : 2 = (${sum} + ${diff}) : 2 = ${num1}\nSố bé = (Tổng - Hiệu) : 2 = (${sum} - ${diff}) : 2 = ${num2}`
        };
    }
};
