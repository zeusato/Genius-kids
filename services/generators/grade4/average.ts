import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const numOpts = (ans: number): string[] => {
    const set = new Set<number>([ans]);
    while (set.size < 4) { const v = ans + randomInt(-5, 5); if (v > 0 && v !== ans) set.add(v); }
    return shuffleArray(Array.from(set)).map(String);
};

/**
 * Lớp 4 — Trung bình cộng (tìm TBC; tìm số còn thiếu khi biết TBC).
 * (Chuẩn GDPT 2018 lớp 4: bài toán trung bình cộng.)
 */
export const generateG4Average = (): Omit<Question, 'id' | 'topicId'> => {
    const count = pick([2, 3, 4]);
    const avg = randomInt(5, 40);
    // Tạo các số có trung bình cộng đúng = avg.
    const nums: number[] = [];
    let remaining = avg * count;
    for (let i = 0; i < count - 1; i++) {
        const maxV = Math.min(remaining - (count - 1 - i), avg * 2);
        const v = randomInt(1, Math.max(1, maxV));
        nums.push(v); remaining -= v;
    }
    nums.push(remaining);
    const r = Math.random();

    // 1. Tìm trung bình cộng (60%)
    if (r < 0.6) {
        const ctx = pick([['Trung bình cộng của các số', ''], ['Tổ có ' + count + ' bạn, số điểm 10 lần lượt là', ' điểm. Trung bình mỗi bạn được mấy điểm 10?']]);
        const isWord = ctx[1] !== '';
        return {
            type: QuestionType.SingleChoice,
            questionText: isWord
                ? `${ctx[0]} ${nums.join(', ')}${ctx[1]}`
                : `Trung bình cộng của các số ${nums.join(', ')} là bao nhiêu?`,
            correctAnswer: String(avg),
            options: numOpts(avg),
            explanation: `Trung bình cộng = (${nums.join(' + ')}) : ${count} = ${avg * count} : ${count} = ${avg}.`,
        };
    }

    // 2. Tìm số còn thiếu khi biết TBC (40%)
    const hidden = nums[nums.length - 1];
    const known = nums.slice(0, -1);
    return {
        type: QuestionType.SingleChoice,
        questionText: `Trung bình cộng của ${count} số là ${avg}. Biết ${count - 1} số là ${known.join(', ')}. Tìm số còn lại.`,
        correctAnswer: String(hidden),
        options: numOpts(hidden),
        explanation: `Tổng ${count} số = ${avg} × ${count} = ${avg * count}. Số còn lại = ${avg * count} − (${known.join(' + ')}) = ${hidden}.`,
    };
};
