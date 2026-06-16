import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

/** Rút gọn n/d → "x/y" (hoặc số nguyên nếu mẫu = 1). */
const frac = (n: number, d: number): string => {
    const g = gcd(Math.abs(n), Math.abs(d)) || 1;
    const nn = n / g, dd = d / g;
    return dd === 1 ? String(nn) : `${nn}/${dd}`;
};

/** Ghép đúng 4 đáp án gồm đáp án đúng + distractor (loại trùng, distractor đệm hợp lệ). */
const fourOpts = (correct: string, wrongs: string[]): string[] => {
    const set = new Set<string>([correct]);
    for (const w of wrongs) { if (set.size >= 4) break; if (w && w !== correct) set.add(w); }
    // Đệm bằng distractor suy từ đáp án đúng (vẫn là phân số/số hợp lệ).
    const m = correct.match(/^(\d+)\/(\d+)$/);
    let k = 1;
    while (set.size < 4 && k <= 20) {
        if (m) { const cand = `${parseInt(m[1], 10) + k}/${m[2]}`; if (cand !== correct) set.add(cand); }
        else { const cn = parseInt(correct, 10) || 1; set.add(String(cn + k)); }
        k++;
    }
    return shuffleArray(Array.from(set).slice(0, 4));
};

/**
 * Lớp 4 — Phép tính phân số khác mẫu (so sánh, cộng, trừ) và nhân phân số
 * (với số tự nhiên, với phân số). (Chuẩn GDPT 2018 lớp 4.)
 */
export const generateG4FractionOps = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();
    const dens = [2, 3, 4, 5, 6];

    // 1. So sánh hai phân số khác mẫu (25%)
    if (r < 0.25) {
        const b = pick(dens), d = pick(dens.filter(x => x !== b));
        const a = randomInt(1, b - 1), c = randomInt(1, d - 1);
        const ans = a * d > c * b ? '>' : a * d < c * b ? '<' : '=';
        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh hai phân số: ${a}/${b} ... ${c}/${d}`,
            correctAnswer: ans,
            options: ['>', '<', '='],
            explanation: `Quy đồng: ${a}/${b} = ${a * d}/${b * d}; ${c}/${d} = ${c * b}/${b * d}. So sánh tử số ${a * d} ${ans} ${c * b}.`,
        };
    }

    // 2. Cộng / trừ khác mẫu (35%)
    if (r < 0.6) {
        const isAdd = Math.random() > 0.5;
        const b = pick(dens), d = pick(dens.filter(x => x !== b));
        let a = randomInt(1, b - 1), c = randomInt(1, d - 1);
        // với phép trừ, đảm bảo kết quả không âm
        if (!isAdd && a * d < c * b) { [a, c] = [c, a];/*đổi*/ }
        const num = isAdd ? a * d + c * b : a * d - c * b;
        const den = b * d;
        const correct = frac(num, den);
        const wrongs = [
            frac(a + c, b + d),                 // cộng cả tử và mẫu (sai phổ biến)
            frac(isAdd ? a * d - c * b : a * d + c * b, den), // nhầm phép tính
            frac(num + 1, den),
            frac(Math.max(1, num - 1), den),
        ];
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${a}/${b} ${isAdd ? '+' : '-'} ${c}/${d} = ?`,
            correctAnswer: correct,
            options: fourOpts(correct, wrongs),
            explanation: `Quy đồng mẫu số ${den}: ${a}/${b} = ${a * d}/${den}, ${c}/${d} = ${c * b}/${den}. ${isAdd ? 'Cộng' : 'Trừ'} tử số: ${a * d} ${isAdd ? '+' : '-'} ${c * b} = ${num}. Kết quả ${correct}.`,
        };
    }

    // 3. Phân số nhân số tự nhiên (20%)
    if (r < 0.8) {
        const d = pick(dens), n = randomInt(1, d - 1), k = randomInt(2, 5);
        const correct = frac(n * k, d);
        const wrongs = [frac(n, d * k), frac(n + k, d), frac(n * k, d * k), `${n * k}/${d + k}`];
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính: ${n}/${d} × ${k} = ?`,
            correctAnswer: correct,
            options: fourOpts(correct, wrongs),
            explanation: `${n}/${d} × ${k} = ${n} × ${k} / ${d} = ${n * k}/${d} = ${correct}.`,
        };
    }

    // 4. Phân số nhân phân số (20%)
    const b = pick(dens), d = pick(dens), a = randomInt(1, b - 1), c = randomInt(1, d - 1);
    const correct = frac(a * c, b * d);
    const wrongs = [frac(a + c, b + d), frac(a * c, b + d), frac(a + c, b * d), frac(a * d, b * c)];
    return {
        type: QuestionType.SingleChoice,
        questionText: `Tính: ${a}/${b} × ${c}/${d} = ?`,
        correctAnswer: correct,
        options: fourOpts(correct, wrongs),
        explanation: `Nhân tử với tử, mẫu với mẫu: (${a} × ${c})/(${b} × ${d}) = ${a * c}/${b * d} = ${correct}.`,
    };
};
