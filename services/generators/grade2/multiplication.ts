import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

const wrongs = (ans: number, a: number, b: number): string[] => {
    const set = new Set<number>();
    const cands = [ans + a, ans - a, ans + b, ans - b, ans + 1, ans - 1, a + b, ans + a + b];
    for (const c of shuffleArray(cands)) { if (c > 0 && c !== ans) set.add(c); if (set.size >= 3) break; }
    while (set.size < 3) { const c = ans + randomInt(-5, 5); if (c > 0 && c !== ans) set.add(c); }
    return Array.from(set).slice(0, 3).map(String);
};

/**
 * Lớp 2 — Phép nhân: ý nghĩa phép nhân (tổng các số hạng bằng nhau) + bảng nhân 2,3,4,5.
 * (Theo chuẩn GDPT 2018: lớp 2 học bảng nhân 2,3,4,5.)
 */
export const generateG2Multiplication = (): Omit<Question, 'id' | 'topicId'> => {
    const table = pick([2, 3, 4, 5]);
    const b = randomInt(1, 10);
    const ans = table * b;
    const r = Math.random();

    // 1. Chuyển tổng các số hạng bằng nhau thành phép nhân (25%)
    if (r < 0.25) {
        const sum = Array(b).fill(table).join(' + ');
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tổng ${sum} viết thành phép nhân nào?`,
            correctAnswer: `${table} × ${b}`,
            options: shuffleArray([`${table} × ${b}`, `${b} × ${table + 1}`, `${table} + ${b}`, `${table} × ${b + 1}`]),
            explanation: `${table} được lấy ${b} lần nên ${sum} = ${table} × ${b} = ${ans}.`,
        };
    }

    // 2. Tìm thừa số còn thiếu (20%)
    if (r < 0.45) {
        return {
            type: QuestionType.ManualInput,
            questionText: `${table} × ? = ${ans}`,
            correctAnswer: String(b),
            explanation: `Vì ${table} × ${b} = ${ans} nên số cần tìm là ${b}.`,
        };
    }

    // 3. Bài toán lời văn (20%)
    if (r < 0.65) {
        const items = pick([['rổ', 'quả cam'], ['hộp', 'cái bút'], ['đĩa', 'cái bánh'], ['túi', 'viên kẹo']]);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Mỗi ${items[0]} có ${table} ${items[1]}. Hỏi ${b} ${items[0]} có tất cả bao nhiêu ${items[1]}?`,
            correctAnswer: String(ans),
            options: shuffleArray([String(ans), ...wrongs(ans, table, b)]),
            explanation: `Lấy ${table} × ${b} = ${ans} (${items[1]}).`,
        };
    }

    // 4. Phép nhân trực tiếp (35%)
    return {
        type: QuestionType.SingleChoice,
        questionText: `${table} × ${b} = ?`,
        correctAnswer: String(ans),
        options: shuffleArray([String(ans), ...wrongs(ans, table, b)]),
        explanation: `${table} × ${b} = ${ans}.`,
    };
};
