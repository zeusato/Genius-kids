import { Question, QuestionType } from '../../../types';
import { moneySVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const dong = (n: number) => `${n.toLocaleString('vi-VN')} đồng`;

const wrongMoney = (ans: number, stepBase: number): string[] => {
    const set = new Set<number>();
    const step = Math.max(1000, stepBase);
    while (set.size < 3) { const v = ans + randomInt(-3, 3) * step; if (v > 0 && v !== ans) set.add(v); }
    return Array.from(set).map(dong);
};

/**
 * Lớp 2 — Tiền Việt Nam: nhận biết & cộng mệnh giá, tiền thối, đổi tiền, mua bán.
 * (Chuẩn GDPT 2018: làm quen tiền Việt Nam.)
 */
export const generateG2Money = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();

    // 1. Đếm tổng số tiền từ các tờ tiền (30%)
    if (r < 0.3) {
        const notes = Array.from({ length: randomInt(2, 4) }, () => pick([1000, 2000, 5000, 10000]));
        const total = notes.reduce((s, n) => s + n, 0);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Bạn Na có các tờ tiền dưới đây. Hỏi bạn Na có tất cả bao nhiêu tiền?`,
            visualSvg: moneySVG(total),
            correctAnswer: dong(total),
            options: shuffleArray([dong(total), ...wrongMoney(total, 1000)]),
            explanation: `Cộng giá trị các tờ tiền lại được ${dong(total)}.`,
        };
    }

    // 2. Tiền thối lại (25%)
    if (r < 0.55) {
        const price = randomInt(2, 18) * 1000;
        const paid = (Math.floor(price / 10000) + 1) * 10000;
        const change = paid - price;
        const item = pick(['quyển vở', 'cái bút', 'hộp sữa', 'ổ bánh mì', 'cây kẹo mút']);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Mua một ${item} giá ${dong(price)}, đưa tờ ${dong(paid)}. Người bán thối lại bao nhiêu?`,
            correctAnswer: dong(change),
            options: shuffleArray([dong(change), ...wrongMoney(change, 1000)]),
            explanation: `Tiền thối = ${dong(paid)} − ${dong(price)} = ${dong(change)}.`,
        };
    }

    // 3. Đổi tiền (20%)
    if (r < 0.75) {
        const big = pick([10000, 20000, 50000]);
        const small = pick([1000, 2000, 5000].filter(s => big % s === 0));
        const count = big / small;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Một tờ ${dong(big)} đổi được mấy tờ ${dong(small)}?`,
            correctAnswer: `${count} tờ`,
            options: shuffleArray([`${count} tờ`, `${count + 1} tờ`, `${Math.max(1, count - 1)} tờ`, `${count + 2} tờ`].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)),
            explanation: `${big.toLocaleString('vi-VN')} : ${small.toLocaleString('vi-VN')} = ${count} (tờ).`,
        };
    }

    // 4. Đủ tiền mua không / còn dư (25%)
    const have = randomInt(2, 5) * 10000;
    const price = randomInt(1, have / 1000 - 1) * 1000;
    const left = have - price;
    const item = pick(['hộp bút màu', 'quyển truyện', 'chai nước', 'gói bánh']);
    return {
        type: QuestionType.SingleChoice,
        questionText: `Em có ${dong(have)}, mua một ${item} giá ${dong(price)}. Em còn lại bao nhiêu tiền?`,
        correctAnswer: dong(left),
        options: shuffleArray([dong(left), ...wrongMoney(left, 1000)]),
        explanation: `Còn lại = ${dong(have)} − ${dong(price)} = ${dong(left)}.`,
    };
};
