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
const moneyOpts = (ans: number): string[] => {
    const set = new Set<number>([ans]);
    while (set.size < 4) { const v = ans + randomInt(-4, 4) * 1000; if (v > 0 && v !== ans) set.add(v); }
    return shuffleArray(Array.from(set)).map(dong);
};

/**
 * Lớp 3 — Tiền Việt Nam (mở rộng đến 100 000 đồng): đếm tiền, mua nhiều món
 * (nhân), tiền thối, bài toán hai bước. (Chuẩn GDPT 2018.)
 */
export const generateG3Money = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();

    // 1. Đếm tổng các tờ tiền (25%)
    if (r < 0.25) {
        const notes = Array.from({ length: randomInt(2, 4) }, () => pick([2000, 5000, 10000, 20000]));
        const total = notes.reduce((s, n) => s + n, 0);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tổng số tiền dưới đây là bao nhiêu?`,
            visualSvg: moneySVG(total),
            correctAnswer: dong(total),
            options: moneyOpts(total),
            explanation: `Cộng giá trị các tờ tiền được ${dong(total)}.`,
        };
    }

    // 2. Mua nhiều món cùng giá (nhân) (25%)
    if (r < 0.5) {
        const unit = pick([2000, 3000, 5000, 8000]);
        const qty = randomInt(2, 6);
        const total = unit * qty;
        const item = pick(['quyển vở', 'cây bút', 'hộp sữa', 'cái bánh']);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Mua ${qty} ${item}, mỗi ${item} giá ${dong(unit)}. Hỏi phải trả bao nhiêu tiền?`,
            correctAnswer: dong(total),
            options: moneyOpts(total),
            explanation: `Số tiền = ${dong(unit)} × ${qty} = ${dong(total)}.`,
        };
    }

    // 3. Tiền thối (25%)
    if (r < 0.75) {
        const price = randomInt(12, 48) * 1000;
        const paid = (Math.floor(price / 50000) + 1) * 50000;
        const change = paid - price;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Một món hàng giá ${dong(price)}, khách đưa tờ ${dong(paid)}. Cửa hàng thối lại bao nhiêu?`,
            correctAnswer: dong(change),
            options: moneyOpts(change),
            explanation: `Tiền thối = ${dong(paid)} − ${dong(price)} = ${dong(change)}.`,
        };
    }

    // 4. Bài toán hai bước (25%)
    const unit = pick([3000, 4000, 5000]);
    const qty = randomInt(2, 5);
    const cost = unit * qty;
    const paid = Math.ceil((cost + 5000) / 10000) * 10000;
    const change = paid - cost;
    const item = pick(['quyển truyện', 'cái kẹo', 'gói bánh']);
    return {
        type: QuestionType.SingleChoice,
        questionText: `Mua ${qty} ${item} mỗi cái ${dong(unit)}, đưa ${dong(paid)}. Được thối lại bao nhiêu?`,
        correctAnswer: dong(change),
        options: moneyOpts(change),
        explanation: `Tiền hàng = ${dong(unit)} × ${qty} = ${dong(cost)}. Thối lại = ${dong(paid)} − ${dong(cost)} = ${dong(change)}.`,
    };
};
