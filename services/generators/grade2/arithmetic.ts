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

const generateWrongAnswers = (correct: number, count: number, range: number = 5): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val >= 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(String);
};

export const generateG2Arithmetic = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Fill in the blank / Missing number (a + ? = b) - 25%
    if (type < 0.25) {
        const isAdd = Math.random() > 0.5;
        if (isAdd) {
            const a = randomInt(1, 15);
            const b = randomInt(a + 1, 20); // Sum <= 20
            const missing = b - a;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Điền số thích hợp vào chỗ chấm: ${a} + ... = ${b}`,
                correctAnswer: missing.toString(),
                options: shuffleArray([missing.toString(), ...generateWrongAnswers(missing, 3)]),
                explanation: `Muốn tìm số hạng chưa biết, ta lấy tổng trừ đi số hạng đã biết: ${b} - ${a} = ${missing}.`
            };
        } else {
            const a = randomInt(5, 20);
            const b = randomInt(1, a);
            const missing = a - b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Điền số thích hợp vào chỗ chấm: ${a} - ... = ${b}`,
                correctAnswer: missing.toString(),
                options: shuffleArray([missing.toString(), ...generateWrongAnswers(missing, 3)]),
                explanation: `Muốn tìm số trừ, ta lấy số bị trừ trừ đi hiệu: ${a} - ${b} = ${missing}.`
            };
        }
    }

    // 2. Compare expressions (a + b ... c + d) - 25%
    else if (type < 0.5) {
        const val1 = randomInt(5, 20);
        const val2 = randomInt(5, 20); // Can be same or diff

        // Generate expression 1 for val1
        const a1 = randomInt(1, val1 - 1);
        const b1 = val1 - a1;
        const expr1 = `${a1} + ${b1}`;

        // Generate expression 2 for val2 (could be minus)
        const isAdd2 = Math.random() > 0.5;
        let expr2 = '';
        if (isAdd2) {
            const a2 = randomInt(1, val2 - 1);
            const b2 = val2 - a2;
            expr2 = `${a2} + ${b2}`;
        } else {
            const a2 = randomInt(val2 + 1, 25);
            const b2 = a2 - val2;
            expr2 = `${a2} - ${b2}`;
        }

        let ans = '=';
        if (val1 > val2) ans = '>';
        if (val1 < val2) ans = '<';

        return {
            type: QuestionType.SingleChoice,
            questionText: `Điền dấu thích hợp (> , < , =) vào chỗ chấm: ${expr1} ... ${expr2}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `Tính giá trị hai vế:\n${expr1} = ${val1}\n${expr2} = ${val2}\nVậy ${val1} ${ans} ${val2}.`
        };
    }

    // 3. Word Problems (More/Less) - 25%
    else if (type < 0.75) {
        const isMore = Math.random() > 0.5;
        const names = ['Lan', 'Mai', 'Hùng', 'Nam', 'Bình'];
        const name1 = names[randomInt(0, names.length - 1)];
        const items = ['cái kẹo', 'bông hoa', 'viên bi', 'quyển vở'];
        const item = items[randomInt(0, items.length - 1)];

        const val1 = randomInt(5, 15);
        const diff = randomInt(2, val1 - 1);

        if (isMore) {
            const val2 = val1 + diff;
            return {
                type: QuestionType.SingleChoice,
                questionText: `${name1} có ${val1} ${item}. Minh có nhiều hơn ${name1} ${diff} ${item}. Hỏi Minh có bao nhiêu ${item}?`,
                correctAnswer: val2.toString(),
                options: shuffleArray([val2.toString(), ...generateWrongAnswers(val2, 3)]),
                explanation: `Số ${item} của Minh là: ${val1} + ${diff} = ${val2} (${item}).`
            };
        } else {
            const val2 = val1 - diff;
            return {
                type: QuestionType.SingleChoice,
                questionText: `${name1} có ${val1} ${item}. Minh có ít hơn ${name1} ${diff} ${item}. Hỏi Minh có bao nhiêu ${item}?`,
                correctAnswer: val2.toString(),
                options: shuffleArray([val2.toString(), ...generateWrongAnswers(val2, 3)]),
                explanation: `Số ${item} của Minh là: ${val1} - ${diff} = ${val2} (${item}).`
            };
        }
    }

    // 4. Mental Math Pairs (Sum to 10, 20, etc) - 25%
    else {
        const target = Math.random() > 0.5 ? 10 : 20;
        const a = randomInt(1, target - 1);
        const b = target - a;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Số nào cộng với ${a} để được ${target}?`,
            correctAnswer: b.toString(),
            options: shuffleArray([b.toString(), ...generateWrongAnswers(b, 3)]),
            explanation: `${a} + ${b} = ${target}.`
        };
    }
};
