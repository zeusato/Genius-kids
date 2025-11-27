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

// Evaluate expression with parentheses: (a op1 b) op2 c
const evaluateExpression = (a: number, op1: string, b: number, op2: string, c: number): number | null => {
    let innerResult: number | null = null;

    // Calculate inner expression first
    switch (op1) {
        case '+': innerResult = a + b; break;
        case '-': innerResult = a - b; break;
        case '×': innerResult = a * b; break;
        case '÷':
            if (b === 0 || a % b !== 0) return null;
            innerResult = a / b;
            break;
        default: return null;
    }

    if (innerResult === null || innerResult < 0) return null;

    // Calculate final result
    let finalResult: number | null = null;
    switch (op2) {
        case '+': finalResult = innerResult + c; break;
        case '-':
            finalResult = innerResult - c;
            if (finalResult < 0) return null;
            break;
        case '×': finalResult = innerResult * c; break;
        case '÷':
            if (c === 0 || innerResult % c !== 0) return null;
            finalResult = innerResult / c;
            break;
        default: return null;
    }

    return finalResult !== null && finalResult >= 0 ? finalResult : null;
};

// Generate a valid expression with guaranteed integer result
const generateValidExpression = (useMultDiv: boolean, minNum: number, maxNum: number): {
    a: number, op1: string, b: number, op2: string, c: number, result: number
} | null => {
    const addSubOps = ['+', '-'];
    const allOps = ['+', '-', '×', '÷'];

    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const ops = useMultDiv ? allOps : addSubOps;

        const a = randomInt(minNum, maxNum);
        const b = randomInt(minNum, Math.min(maxNum, a)); // b <= a to avoid negative in subtraction
        const c = randomInt(minNum, maxNum);

        const op1 = ops[randomInt(0, ops.length - 1)];
        const op2 = ops[randomInt(0, ops.length - 1)];

        const result = evaluateExpression(a, op1, b, op2, c);

        if (result !== null && result >= 0 && result < 10000) {
            return { a, op1, b, op2, c, result };
        }
    }

    return null;
};

// Find missing number in expression
const findMissingNumber = (
    result: number,
    op1: string,
    known1: number,
    op2: string,
    known2: number,
    position: 'a' | 'b' | 'c'
): number | null => {
    // Try all possible values
    for (let val = 1; val <= 999; val++) {
        let testResult: number | null = null;

        if (position === 'a') {
            testResult = evaluateExpression(val, op1, known1, op2, known2);
        } else if (position === 'b') {
            testResult = evaluateExpression(known1, op1, val, op2, known2);
        } else { // position === 'c'
            const innerResult = evaluateExpression(known1, op1, known2, '+', 0);
            if (innerResult === null) continue;

            if (op2 === '+' && innerResult + val === result) return val;
            if (op2 === '-' && innerResult - val === result) return val;
            if (op2 === '×' && innerResult * val === result) return val;
            if (op2 === '÷' && val !== 0 && innerResult % val === 0 && innerResult / val === result) return val;
        }

        if (testResult === result) return val;
    }

    return null;
};

export const generateG4Parentheses = (): Omit<Question, 'id' | 'topicId'> => {
    // 60% only +/-, 40% with */÷
    const useMultDiv = Math.random() > 0.6;
    const minNum = 10;
    const maxNum = 999;

    const exerciseType = Math.random();

    // 1. Calculate result (30%)
    if (exerciseType < 0.3) {
        const expr = generateValidExpression(useMultDiv, minNum, maxNum);
        if (!expr) return generateG4Parentheses(); // Retry if generation failed

        const { a, op1, b, op2, c, result } = expr;
        const wrongAnswers = generateWrongAnswersWithSameUnits(result, 3, 100);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: (${formatNumber(a)} ${op1} ${formatNumber(b)}) ${op2} ${formatNumber(c)} = ?`,
            correctAnswer: formatNumber(result),
            options: shuffleArray([formatNumber(result), ...wrongAnswers.map(n => formatNumber(n))]),
            explanation: `Thực hiện phép tính trong ngoặc trước:\n(${formatNumber(a)} ${op1} ${formatNumber(b)}) = ${formatNumber(op1 === '+' ? a + b : op1 === '-' ? a - b : op1 === '×' ? a * b : a / b)}\nSau đó: ${formatNumber(op1 === '+' ? a + b : op1 === '-' ? a - b : op1 === '×' ? a * b : a / b)} ${op2} ${formatNumber(c)} = ${formatNumber(result)}`
        };
    }

    // 2. Find missing number (30%)
    else if (exerciseType < 0.6) {
        const expr = generateValidExpression(useMultDiv, minNum, maxNum);
        if (!expr) return generateG4Parentheses();

        const { a, op1, b, op2, c, result } = expr;

        // Randomly choose which number to hide
        const positions: Array<'a' | 'b' | 'c'> = ['a', 'b', 'c'];
        const hidePosition = positions[randomInt(0, 2)];

        let questionText = '';
        let missingValue = 0;

        if (hidePosition === 'a') {
            questionText = `Tìm số còn thiếu: (? ${op1} ${formatNumber(b)}) ${op2} ${formatNumber(c)} = ${formatNumber(result)}`;
            missingValue = a;
        } else if (hidePosition === 'b') {
            questionText = `Tìm số còn thiếu: (${formatNumber(a)} ${op1} ?) ${op2} ${formatNumber(c)} = ${formatNumber(result)}`;
            missingValue = b;
        } else {
            questionText = `Tìm số còn thiếu: (${formatNumber(a)} ${op1} ${formatNumber(b)}) ${op2} ? = ${formatNumber(result)}`;
            missingValue = c;
        }

        const wrongAnswers = generateWrongAnswersWithSameUnits(missingValue, 3, 100);

        return {
            type: QuestionType.SingleChoice,
            questionText,
            correctAnswer: formatNumber(missingValue),
            options: shuffleArray([formatNumber(missingValue), ...wrongAnswers.map(n => formatNumber(n))]),
            explanation: `Số còn thiếu là ${formatNumber(missingValue)}\nKiểm tra: (${formatNumber(a)} ${op1} ${formatNumber(b)}) ${op2} ${formatNumber(c)} = ${formatNumber(result)}`
        };
    }

    // 3. Find missing operator (20%)
    else if (exerciseType < 0.8) {
        const a = randomInt(minNum, maxNum);
        const b = randomInt(minNum, a);
        const c = randomInt(minNum, maxNum);

        const ops = useMultDiv ? ['+', '-', '×', '÷'] : ['+', '-'];
        const correctOp1 = ops[randomInt(0, ops.length - 1)];

        const result = evaluateExpression(a, correctOp1, b, '+', c);
        if (result === null) return generateG4Parentheses();

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tìm dấu phép tính còn thiếu: (${formatNumber(a)} ? ${formatNumber(b)}) + ${formatNumber(c)} = ${formatNumber(result)}`,
            correctAnswer: correctOp1,
            options: useMultDiv ? shuffleArray(['+', '-', '×', '÷']) : shuffleArray(['+', '-', '×']),
            explanation: `Dấu cần tìm là "${correctOp1}"\nKiểm tra: (${formatNumber(a)} ${correctOp1} ${formatNumber(b)}) + ${formatNumber(c)} = ${formatNumber(result)}`
        };
    }

    // 4. Compare two expressions (20%)
    else {
        const expr1 = generateValidExpression(useMultDiv, minNum, maxNum);
        const expr2 = generateValidExpression(useMultDiv, minNum, maxNum);

        if (!expr1 || !expr2) return generateG4Parentheses();

        const val1 = expr1.result;
        const val2 = expr2.result;

        let ans = '=';
        if (val1 > val2) ans = '>';
        if (val1 < val2) ans = '<';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh (điền >, <, =):\n(${formatNumber(expr1.a)} ${expr1.op1} ${formatNumber(expr1.b)}) ${expr1.op2} ${formatNumber(expr1.c)} ... (${formatNumber(expr2.a)} ${expr2.op1} ${formatNumber(expr2.b)}) ${expr2.op2} ${formatNumber(expr2.c)}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `(${formatNumber(expr1.a)} ${expr1.op1} ${formatNumber(expr1.b)}) ${expr1.op2} ${formatNumber(expr1.c)} = ${formatNumber(val1)}\n(${formatNumber(expr2.a)} ${expr2.op1} ${formatNumber(expr2.b)}) ${expr2.op2} ${formatNumber(expr2.c)} = ${formatNumber(val2)}\nVậy ${formatNumber(val1)} ${ans} ${formatNumber(val2)}`
        };
    }
};
