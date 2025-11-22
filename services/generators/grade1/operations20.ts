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

export const generateOperations20 = (): Omit<Question, 'id' | 'topicId'> => {
    const questionTypeRand = Math.random();

    if (questionTypeRand < 0.2) {
        // SelectWrong
        const target = randomInt(10, 20);
        const correctExpressions: string[] = [];
        const usedPairs = new Set<string>();

        // Generate mix of addition and subtraction = target
        let attempts = 0;
        while (correctExpressions.length < 3 && attempts < 30) {
            attempts++;
            if (Math.random() > 0.5) {
                // Addition
                const a = randomInt(1, target - 1);
                const b = target - a;
                const key = `add-${Math.min(a, b)}-${Math.max(a, b)}`;
                if (!usedPairs.has(key) && a <= 20 && b <= 20) {
                    usedPairs.add(key);
                    correctExpressions.push(`${a} + ${b}`);
                }
            } else {
                // Subtraction
                const a = randomInt(target, 20);
                const b = a - target;
                const key = `sub-${a}-${b}`;
                if (!usedPairs.has(key) && b >= 0) {
                    usedPairs.add(key);
                    correctExpressions.push(`${a} - ${b}`);
                }
            }
        }

        // Generate 1 wrong expression
        let wrongExpression = '';
        attempts = 0;
        while (!wrongExpression && attempts < 20) {
            attempts++;
            const a = randomInt(1, 20);
            const b = randomInt(0, a);
            const op = Math.random() > 0.5 ? '+' : '-';
            const result = op === '+' ? a + b : a - b;
            if (result !== target && result >= 0 && result <= 30) {
                wrongExpression = `${a} ${op} ${b}`;
            }
        }

        return {
            type: QuestionType.SelectWrong,
            questionText: `Phép tính nào có kết quả KHÁC ${target}?`,
            correctAnswer: wrongExpression,
            options: shuffleArray([...correctExpressions, wrongExpression]),
            explanation: `Các phép tính đúng đều có kết quả bằng ${target}.`
        };
    } else if (questionTypeRand < 0.4) {
        // MultipleSelect
        const target = randomInt(10, 18);
        const correctOps = new Set<string>();
        const wrongOps = new Set<string>();

        let attempts = 0;
        while (correctOps.size < 2 && attempts < 20) {
            attempts++;
            if (Math.random() > 0.5) {
                const a = randomInt(0, target);
                const b = target - a;
                if (a <= 20 && b <= 20) {
                    correctOps.add(`${a} + ${b}`);
                }
            } else {
                const a = randomInt(target, 20);
                const b = a - target;
                if (b >= 0) {
                    correctOps.add(`${a} - ${b}`);
                }
            }
        }

        attempts = 0;
        while (wrongOps.size < 2 && attempts < 30) {
            attempts++;
            const a = randomInt(1, 20);
            const b = randomInt(0, 20);
            const op = Math.random() > 0.5 ? '+' : '-';
            const expr = `${a} ${op} ${b}`;
            const result = op === '+' ? a + b : a - b;
            if (result !== target && result >= 0 && !correctOps.has(expr)) {
                wrongOps.add(expr);
            }
        }

        return {
            type: QuestionType.MultipleSelect,
            questionText: `Chọn TẤT CẢ phép tính có kết quả bằng ${target}:`,
            correctAnswers: Array.from(correctOps),
            options: shuffleArray([...Array.from(correctOps), ...Array.from(wrongOps)]),
            explanation: `Các phép tính đúng đều có kết quả bằng ${target}.`
        };
    } else {
        // SingleChoice
        const type = Math.random();

        if (type < 0.33) {
            // Addition within 20
            const a = randomInt(5, 15);
            const b = randomInt(1, 20 - a);
            const sum = a + b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${a} + ${b} = ?`,
                correctAnswer: sum.toString(),
                options: shuffleArray([sum, sum + 1, sum - 1, sum + 2].map(String)),
                explanation: `${a} + ${b} = ${sum}`
            };
        } else if (type < 0.66) {
            // Subtraction within 20
            const a = randomInt(11, 20);
            const b = randomInt(1, a - 1);
            const diff = a - b;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${a} - ${b} = ?`,
                correctAnswer: diff.toString(),
                options: shuffleArray([diff, diff + 1, diff - 1, diff + 2].map(String)),
                explanation: `${a} - ${b} = ${diff}`
            };
        } else {
            // Word problem
            const isAdd = Math.random() > 0.5;
            if (isAdd) {
                const a = randomInt(5, 10);
                const b = randomInt(5, 10);
                const total = a + b;
                return {
                    type: QuestionType.SingleChoice,
                    questionText: `Bạn có ${a} viên bi, được cho thêm ${b} viên. Hỏi có tất cả bao nhiêu viên bi?`,
                    correctAnswer: total.toString(),
                    options: shuffleArray([total, total + 1, total - 1, a + b + 2].map(String)),
                    explanation: `Tất cả: ${a} + ${b} = ${total} viên bi`
                };
            } else {
                const total = randomInt(12, 20);
                const used = randomInt(5, total - 2);
                const remain = total - used;
                return {
                    type: QuestionType.SingleChoice,
                    questionText: `Có ${total} cái kẹo, ăn mất ${used} cái. Hỏi còn lại bao nhiêu cái?`,
                    correctAnswer: remain.toString(),
                    options: shuffleArray([remain, remain + 1, remain - 1, remain + 2].map(String)),
                    explanation: `Còn lại: ${total} - ${used} = ${remain} cái kẹo`
                };
            }
        }
    }
};
