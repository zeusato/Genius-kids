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

const createSubtractionSVG = (total: number, subtract: number) => {
    const remain = total - subtract;
    return `
    <svg width="400" height="150" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="30" text-anchor="middle" font-size="24" font-weight="bold">${total} - ${subtract}</text>
      ${Array.from({ length: total }, (_, i) => {
        const isRemoved = i >= remain;
        return `<circle cx="${50 + i * 30}" cy="80" r="12" fill="${isRemoved ? '#ccc' : '#4ECDC4'}" stroke="#333" stroke-width="2"/>
                ${isRemoved ? `<line x1="${40 + i * 30}" y1="70" x2="${60 + i * 30}" y2="90" stroke="#FF6B6B" stroke-width="3"/>` : ''}`;
    }).join('')}
    </svg>
  `;
};

export const generateSubtraction10 = (): Omit<Question, 'id' | 'topicId'> => {
    const questionTypeRand = Math.random();

    if (questionTypeRand < 0.2) {
        // SelectWrong: Find the wrong subtraction result
        const target = randomInt(3, 8);
        const correctExpressions: string[] = [];
        const usedPairs = new Set<string>();

        // Generate 3 correct expressions
        let attempts = 0;
        while (correctExpressions.length < 3 && attempts < 20) {
            attempts++;
            const minuend = randomInt(target, 10);
            const subtrahend = minuend - target;
            const key = `${minuend}-${subtrahend}`;
            if (!usedPairs.has(key) && subtrahend >= 0) {
                usedPairs.add(key);
                correctExpressions.push(`${minuend} - ${subtrahend}`);
            }
        }

        // Generate 1 wrong expression
        let wrongExpression = '';
        attempts = 0;
        while (!wrongExpression && attempts < 20) {
            attempts++;
            const minuend = randomInt(1, 10);
            const subtrahend = randomInt(0, minuend);
            if (minuend - subtrahend !== target) {
                wrongExpression = `${minuend} - ${subtrahend}`;
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
        // MultipleSelect: Find all subtractions equal to target
        const target = randomInt(3, 7);
        const correctOps = new Set<string>();
        const wrongOps = new Set<string>();

        // Generate 2 correct answers
        let attempts = 0;
        while (correctOps.size < 2 && attempts < 20) {
            attempts++;
            const minuend = randomInt(target, 10);
            const subtrahend = minuend - target;
            if (subtrahend >= 0) {
                correctOps.add(`${minuend} - ${subtrahend}`);
            }
        }

        // Generate 2 wrong answers
        attempts = 0;
        while (wrongOps.size < 2 && attempts < 30) {
            attempts++;
            const minuend = randomInt(1, 10);
            const subtrahend = randomInt(0, minuend);
            const expr = `${minuend} - ${subtrahend}`;
            if (minuend - subtrahend !== target && !correctOps.has(expr)) {
                wrongOps.add(expr);
            }
        }

        return {
            type: QuestionType.MultipleSelect,
            questionText: `Chọn TẤT CẢ phép tính có kết quả bằng ${target}:`,
            correctAnswers: Array.from(correctOps),
            options: shuffleArray([...Array.from(correctOps), ...Array.from(wrongOps)]),
            explanation: `Các phép tính đúng là những phép có hiệu bằng ${target}.`
        };
    } else {
        // SingleChoice - existing variations
        const type = Math.random();

        if (type < 0.3) {
            // Visual subtraction
            const total = randomInt(5, 10);
            const sub = randomInt(1, total - 1);
            const result = total - sub;
            const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== result.toString());
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính hiệu:`,
                visualSvg: createSubtractionSVG(total, sub),
                correctAnswer: result.toString(),
                options: shuffleArray([result.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
                explanation: `${total} - ${sub} = ${result}`
            };
        } else if (type < 0.5) {
            // Basic subtraction
            const total = randomInt(1, 10);
            const sub = randomInt(0, total);
            const result = total - sub;
            const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== result.toString());
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính: ${total} - ${sub} = ?`,
                correctAnswer: result.toString(),
                options: shuffleArray([result.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
                explanation: `${total} - ${sub} = ${result}`
            };
        } else if (type < 0.7) {
            // Fill missing: 10 - □ = 6
            const total = randomInt(5, 10);
            const result = randomInt(0, total - 1);
            const sub = total - result;
            const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== sub.toString());
            return {
                type: QuestionType.SingleChoice,
                questionText: `Điền số còn thiếu: ${total} - □ = ${result}`,
                correctAnswer: sub.toString(),
                options: shuffleArray([sub.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
                explanation: `${total} - ${sub} = ${result}`
            };
        } else {
            // Word problem
            const total = randomInt(5, 10);
            const given = randomInt(1, total - 1);
            const remain = total - given;
            const wrongOptions = Array.from({ length: 11 }, (_, i) => i.toString()).filter(x => x !== remain.toString());
            return {
                type: QuestionType.SingleChoice,
                questionText: `Bạn có ${total} cái kẹo, cho bạn ${given} cái. Hỏi còn lại bao nhiêu cái?`,
                correctAnswer: remain.toString(),
                options: shuffleArray([remain.toString(), ...shuffleArray(wrongOptions).slice(0, 3)]),
                explanation: `Còn lại: ${total} - ${given} = ${remain} cái kẹo`
            };
        }
    }
};
