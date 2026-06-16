import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const SIGN: Record<number, string> = {
    2: 'có chữ số tận cùng là 0, 2, 4, 6, 8',
    5: 'có chữ số tận cùng là 0 hoặc 5',
    3: 'có tổng các chữ số chia hết cho 3',
    9: 'có tổng các chữ số chia hết cho 9',
};

/**
 * Lớp 4 — Dấu hiệu chia hết cho 2, 3, 5, 9. (Chuẩn GDPT 2018 lớp 4.)
 */
export const generateG4Divisibility = (): Omit<Question, 'id' | 'topicId'> => {
    const d = pick([2, 3, 5, 9]);
    const r = Math.random();

    // 1. Chọn TẤT CẢ số chia hết cho d (40%)
    if (r < 0.4) {
        const correct: number[] = [];
        const wrong: number[] = [];
        while (correct.length < 2) { const n = randomInt(1, 30) * d; if (!correct.includes(n)) correct.push(n); }
        while (wrong.length < 2) { const n = randomInt(10, 99); if (n % d !== 0 && !wrong.includes(n)) wrong.push(n); }
        const correctAnswers = correct.map(String);
        return {
            type: QuestionType.MultipleSelect,
            questionText: `Chọn TẤT CẢ các số chia hết cho ${d}:`,
            correctAnswers,
            options: shuffleArray([...correctAnswers, ...wrong.map(String)]),
            explanation: `Số chia hết cho ${d} là số ${SIGN[d]}.`,
        };
    }

    // 2. Đúng/Sai: X có chia hết cho d không (35%)
    if (r < 0.75) {
        const divisible = Math.random() > 0.5;
        const n = divisible ? randomInt(2, 30) * d : (() => { let x; do { x = randomInt(10, 99); } while (x % d === 0); return x; })();
        return {
            type: QuestionType.SingleChoice,
            questionText: `Số ${n} có chia hết cho ${d} không?`,
            correctAnswer: divisible ? 'Có' : 'Không',
            options: ['Có', 'Không'],
            explanation: `${n} ${n % d === 0 ? 'chia hết' : 'không chia hết'} cho ${d} (dấu hiệu: ${SIGN[d]}).`,
        };
    }

    // 3. Điền chữ số để chia hết (chỉ 2 hoặc 5) (25%)
    const dd = pick([2, 5]);
    const prefix = randomInt(1, 9) * 10; // số có 2 chữ số, hàng đơn vị trống
    const validDigits = dd === 5 ? [0, 5] : [0, 2, 4, 6, 8];
    const digit = pick(validDigits);
    return {
        type: QuestionType.ManualInput,
        questionText: `Điền chữ số thích hợp vào ô trống để số ${prefix / 10}* chia hết cho ${dd} (* là chữ số hàng đơn vị). Một đáp án đúng là?`,
        correctAnswer: String(digit),
        explanation: `Để chia hết cho ${dd}, chữ số tận cùng phải ${dd === 5 ? 'là 0 hoặc 5' : 'là số chẵn'}. Ví dụ: ${digit}.`,
    };
};
