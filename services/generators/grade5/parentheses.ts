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

// Generate a valid expression with guaranteed integer result (3-4 digit numbers)
const generateValidExpression = (minNum: number, maxNum: number): {
    a: number, op1: string, b: number, op2: string, c: number, result: number
} | null => {
    const allOps = ['+', '-', '×', '÷'];

    const maxAttempts = 200;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const a = randomInt(minNum, maxNum);
        const b = randomInt(minNum, Math.min(maxNum, a)); // b <= a to avoid negative in subtraction
        const c = randomInt(minNum, maxNum);

        const op1 = allOps[randomInt(0, allOps.length - 1)];
        const op2 = allOps[randomInt(0, allOps.length - 1)];

        const result = evaluateExpression(a, op1, b, op2, c);

        // Keep result reasonable (not too large)
        if (result !== null && result >= 0 && result < 1000000) {
            return { a, op1, b, op2, c, result };
        }
    }

    return null;
};

// Calculate inner result for explanation
const calcInner = (a: number, op: string, b: number): number => {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case '÷': return a / b;
        default: return 0;
    }
};

// GCD helper for fraction simplification
const gcd = (a: number, b: number): number => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
};

// Simplify fraction
const simplifyFraction = (num: number, den: number): { num: number, den: number } => {
    const divisor = gcd(num, den);
    return { num: num / divisor, den: den / divisor };
};

// Format fraction to string
const formatFraction = (num: number, den: number): string => {
    if (den === 1) return num.toString();
    return `${num}/${den}`;
};

// Evaluate fraction expression: (a/b op1 c/d) op2 e/f
const evaluateFractionExpression = (
    num1: number, den1: number,
    op1: string,
    num2: number, den2: number,
    op2: string,
    num3: number, den3: number
): { num: number, den: number } | null => {
    // Calculate inner result first: (a/b op1 c/d)
    let innerNum: number, innerDen: number;

    switch (op1) {
        case '+':
            innerNum = num1 * den2 + num2 * den1;
            innerDen = den1 * den2;
            break;
        case '-':
            innerNum = num1 * den2 - num2 * den1;
            innerDen = den1 * den2;
            if (innerNum < 0) return null; // Avoid negative
            break;
        case '×':
            innerNum = num1 * num2;
            innerDen = den1 * den2;
            break;
        case '÷':
            if (num2 === 0) return null;
            innerNum = num1 * den2;
            innerDen = den1 * num2;
            break;
        default:
            return null;
    }

    if (innerNum < 0 || innerDen <= 0) return null;

    // Simplify inner result
    const innerSimplified = simplifyFraction(innerNum, innerDen);
    innerNum = innerSimplified.num;
    innerDen = innerSimplified.den;

    // Calculate final result: inner op2 e/f
    let finalNum: number, finalDen: number;

    switch (op2) {
        case '+':
            finalNum = innerNum * den3 + num3 * innerDen;
            finalDen = innerDen * den3;
            break;
        case '-':
            finalNum = innerNum * den3 - num3 * innerDen;
            finalDen = innerDen * den3;
            if (finalNum < 0) return null; // Avoid negative
            break;
        case '×':
            finalNum = innerNum * num3;
            finalDen = innerDen * den3;
            break;
        case '÷':
            if (num3 === 0) return null;
            finalNum = innerNum * den3;
            finalDen = innerDen * num3;
            break;
        default:
            return null;
    }

    if (finalNum < 0 || finalDen <= 0) return null;

    return simplifyFraction(finalNum, finalDen);
};

// Generate fraction exercise
const generateFractionExercise = (): Omit<Question, 'id' | 'topicId'> => {
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate simple fractions (denominators 2-12, numerators smaller than denominator)
        const den1 = randomInt(2, 12);
        const num1 = randomInt(1, den1 - 1);

        const den2 = randomInt(2, 12);
        const num2 = randomInt(1, den2 - 1);

        const den3 = randomInt(2, 12);
        const num3 = randomInt(1, den3 - 1);

        const ops = ['+', '-', '×', '÷'];
        const op1 = ops[randomInt(0, ops.length - 1)];
        const op2 = ops[randomInt(0, ops.length - 1)];

        const result = evaluateFractionExpression(num1, den1, op1, num2, den2, op2, num3, den3);

        if (result && result.num > 0 && result.den > 0 && result.num <= 100 && result.den <= 100) {
            const frac1 = formatFraction(num1, den1);
            const frac2 = formatFraction(num2, den2);
            const frac3 = formatFraction(num3, den3);
            const fracResult = formatFraction(result.num, result.den);

            // Generate wrong answers
            const wrongAnswers: string[] = [];
            const wrongSet = new Set<string>();

            // Generate plausible wrong fractions
            for (let i = 0; i < 10 && wrongAnswers.length < 3; i++) {
                const wrongNum = result.num + randomInt(-3, 3);
                const wrongDen = result.den + randomInt(-2, 2);

                if (wrongNum > 0 && wrongDen > 0) {
                    const simplified = simplifyFraction(wrongNum, wrongDen);
                    const wrongStr = formatFraction(simplified.num, simplified.den);

                    if (wrongStr !== fracResult && !wrongSet.has(wrongStr)) {
                        wrongSet.add(wrongStr);
                        wrongAnswers.push(wrongStr);
                    }
                }
            }

            // Fill up with more random fractions if needed
            while (wrongAnswers.length < 3) {
                const wrongNum = randomInt(1, 20);
                const wrongDen = randomInt(2, 20);
                const simplified = simplifyFraction(wrongNum, wrongDen);
                const wrongStr = formatFraction(simplified.num, simplified.den);

                if (wrongStr !== fracResult && !wrongSet.has(wrongStr)) {
                    wrongSet.add(wrongStr);
                    wrongAnswers.push(wrongStr);
                }
            }

            // Calculate inner result for explanation
            let innerNum: number, innerDen: number;
            switch (op1) {
                case '+':
                    innerNum = num1 * den2 + num2 * den1;
                    innerDen = den1 * den2;
                    break;
                case '-':
                    innerNum = num1 * den2 - num2 * den1;
                    innerDen = den1 * den2;
                    break;
                case '×':
                    innerNum = num1 * num2;
                    innerDen = den1 * den2;
                    break;
                case '÷':
                    innerNum = num1 * den2;
                    innerDen = den1 * num2;
                    break;
                default:
                    innerNum = 0;
                    innerDen = 1;
            }
            const innerSimplified = simplifyFraction(innerNum, innerDen);
            const innerFrac = formatFraction(innerSimplified.num, innerSimplified.den);

            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính (kết quả ở dạng phân số tối giản): (${frac1} ${op1} ${frac2}) ${op2} ${frac3} = ?`,
                correctAnswer: fracResult,
                options: shuffleArray([fracResult, ...wrongAnswers]),
                explanation: `Thực hiện phép tính trong ngoặc trước:\n(${frac1} ${op1} ${frac2}) = ${innerFrac}\nSau đó: ${innerFrac} ${op2} ${frac3} = ${fracResult}`
            };
        }
    }

    // Fallback to integer exercise if fraction generation fails
    return generateG5Parentheses();
};

export const generateG5Parentheses = (): Omit<Question, 'id' | 'topicId'> => {
    // 10% fraction exercises, 90% integer exercises
    const useFractions = Math.random() < 0.1;

    if (useFractions) {
        return generateFractionExercise();
    }

    // Grade 5: all operations with 3-4 digit numbers
    const minNum = 100;
    const maxNum = 9999;

    const exerciseType = Math.random();

    // 1. Calculate result (30%)
    if (exerciseType < 0.3) {
        const expr = generateValidExpression(minNum, maxNum);
        if (!expr) return generateG5Parentheses(); // Retry if generation failed

        const { a, op1, b, op2, c, result } = expr;
        const wrongAnswers = generateWrongAnswersWithSameUnits(result, 3, result < 1000 ? 100 : 1000);

        const innerResult = calcInner(a, op1, b);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: (${formatNumber(a)} ${op1} ${formatNumber(b)}) ${op2} ${formatNumber(c)} = ?`,
            correctAnswer: formatNumber(result),
            options: shuffleArray([formatNumber(result), ...wrongAnswers.map(n => formatNumber(n))]),
            explanation: `Thực hiện phép tính trong ngoặc trước:\n(${formatNumber(a)} ${op1} ${formatNumber(b)}) = ${formatNumber(innerResult)}\nSau đó: ${formatNumber(innerResult)} ${op2} ${formatNumber(c)} = ${formatNumber(result)}`
        };
    }

    // 2. Find missing number (30%)
    else if (exerciseType < 0.6) {
        const expr = generateValidExpression(minNum, maxNum);
        if (!expr) return generateG5Parentheses();

        const { a, op1, b, op2, c, result } = expr;

        // Randomly choose which number to hide
        const positions: Array<'a' | 'b' | 'c'> = ['a', 'b', 'c'];
        const hidePosition = positions[randomInt(0, 2)];

        let questionText = '';
        let missingValue = 0;
        let explanation = '';

        const innerResult = calcInner(a, op1, b);

        if (hidePosition === 'a') {
            questionText = `Tìm số còn thiếu: (? ${op1} ${formatNumber(b)}) ${op2} ${formatNumber(c)} = ${formatNumber(result)}`;
            missingValue = a;
            explanation = `Số còn thiếu là ${formatNumber(missingValue)}\nKiểm tra: (${formatNumber(a)} ${op1} ${formatNumber(b)}) = ${formatNumber(innerResult)}, sau đó ${formatNumber(innerResult)} ${op2} ${formatNumber(c)} = ${formatNumber(result)}`;
        } else if (hidePosition === 'b') {
            questionText = `Tìm số còn thiếu: (${formatNumber(a)} ${op1} ?) ${op2} ${formatNumber(c)} = ${formatNumber(result)}`;
            missingValue = b;
            explanation = `Số còn thiếu là ${formatNumber(missingValue)}\nKiểm tra: (${formatNumber(a)} ${op1} ${formatNumber(b)}) = ${formatNumber(innerResult)}, sau đó ${formatNumber(innerResult)} ${op2} ${formatNumber(c)} = ${formatNumber(result)}`;
        } else {
            questionText = `Tìm số còn thiếu: (${formatNumber(a)} ${op1} ${formatNumber(b)}) ${op2} ? = ${formatNumber(result)}`;
            missingValue = c;
            explanation = `Tính trong ngoặc trước: (${formatNumber(a)} ${op1} ${formatNumber(b)}) = ${formatNumber(innerResult)}\nSố còn thiếu = ${formatNumber(result)} ${op2 === '+' ? '-' : op2 === '-' ? '+' : op2 === '×' ? '÷' : '×'} ${formatNumber(innerResult)} = ${formatNumber(missingValue)}`;
        }

        const wrongAnswers = generateWrongAnswersWithSameUnits(missingValue, 3, missingValue < 1000 ? 100 : 1000);

        return {
            type: QuestionType.SingleChoice,
            questionText,
            correctAnswer: formatNumber(missingValue),
            options: shuffleArray([formatNumber(missingValue), ...wrongAnswers.map(n => formatNumber(n))]),
            explanation
        };
    }

    // 3. Find missing operator (20%)
    else if (exerciseType < 0.8) {
        const a = randomInt(minNum, maxNum);
        const b = randomInt(minNum, a);
        const c = randomInt(minNum, maxNum);

        const allOps = ['+', '-', '×', '÷'];
        const correctOp1 = allOps[randomInt(0, allOps.length - 1)];

        const result = evaluateExpression(a, correctOp1, b, '+', c);
        if (result === null) return generateG5Parentheses();

        const innerResult = calcInner(a, correctOp1, b);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tìm dấu phép tính còn thiếu: (${formatNumber(a)} ? ${formatNumber(b)}) + ${formatNumber(c)} = ${formatNumber(result)}`,
            correctAnswer: correctOp1,
            options: shuffleArray(['+', '-', '×', '÷']),
            explanation: `Dấu cần tìm là "${correctOp1}"\nKiểm tra: (${formatNumber(a)} ${correctOp1} ${formatNumber(b)}) = ${formatNumber(innerResult)}, sau đó ${formatNumber(innerResult)} + ${formatNumber(c)} = ${formatNumber(result)}`
        };
    }

    // 4. Compare two expressions (20%)
    else {
        const expr1 = generateValidExpression(minNum, maxNum);
        const expr2 = generateValidExpression(minNum, maxNum);

        if (!expr1 || !expr2) return generateG5Parentheses();

        const val1 = expr1.result;
        const val2 = expr2.result;

        let ans = '=';
        if (val1 > val2) ans = '>';
        if (val1 < val2) ans = '<';

        const inner1 = calcInner(expr1.a, expr1.op1, expr1.b);
        const inner2 = calcInner(expr2.a, expr2.op1, expr2.b);

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh (điền >, <, =):\n(${formatNumber(expr1.a)} ${expr1.op1} ${formatNumber(expr1.b)}) ${expr1.op2} ${formatNumber(expr1.c)} ... (${formatNumber(expr2.a)} ${expr2.op1} ${formatNumber(expr2.b)}) ${expr2.op2} ${formatNumber(expr2.c)}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `Vế trái: (${formatNumber(expr1.a)} ${expr1.op1} ${formatNumber(expr1.b)}) ${expr1.op2} ${formatNumber(expr1.c)} = ${formatNumber(inner1)} ${expr1.op2} ${formatNumber(expr1.c)} = ${formatNumber(val1)}\nVế phải: (${formatNumber(expr2.a)} ${expr2.op1} ${formatNumber(expr2.b)}) ${expr2.op2} ${formatNumber(expr2.c)} = ${formatNumber(inner2)} ${expr2.op2} ${formatNumber(expr2.c)} = ${formatNumber(val2)}\nVậy ${formatNumber(val1)} ${ans} ${formatNumber(val2)}`
        };
    }
};
