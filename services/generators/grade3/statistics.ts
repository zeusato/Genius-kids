import { Question, QuestionType } from '../../../types';
import { barChartSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const numOpts = (ans: number): string[] => {
    const set = new Set<number>([ans]);
    while (set.size < 4) { const v = ans + randomInt(-4, 4); if (v >= 0 && v !== ans) set.add(v); }
    return shuffleArray(Array.from(set)).map(String);
};

const SUBJECTS = [['Toán', 'Văn', 'Anh', 'Vẽ'], ['Lan', 'Bình', 'Hà', 'Nam'], ['Đỏ', 'Xanh', 'Vàng', 'Tím']];
const CONTEXT = ['điểm 10', 'bông hoa', 'lá cờ', 'ngôi sao'];

/**
 * Lớp 3 — Bảng số liệu / biểu đồ cột: đọc giá trị, nhiều/ít nhất, tổng, chênh lệch.
 * (Chuẩn GDPT 2018 lớp 3: làm quen bảng số liệu thống kê.)
 */
export const generateG3Statistics = (): Omit<Question, 'id' | 'topicId'> => {
    const labels = SUBJECTS[randomInt(0, SUBJECTS.length - 1)];
    const ctx = CONTEXT[randomInt(0, CONTEXT.length - 1)];
    const data = labels.map(label => ({ label, value: randomInt(2, 15) }));
    const svg = barChartSVG(data);
    const r = Math.random();

    const maxItem = data.reduce((m, d) => d.value > m.value ? d : m, data[0]);
    const minItem = data.reduce((m, d) => d.value < m.value ? d : m, data[0]);

    // 1. Đọc giá trị của một cột (30%)
    if (r < 0.3) {
        const target = data[randomInt(0, data.length - 1)];
        return {
            type: QuestionType.SingleChoice,
            questionText: `Dựa vào biểu đồ, "${target.label}" có bao nhiêu ${ctx}?`,
            visualSvg: svg,
            correctAnswer: String(target.value),
            options: numOpts(target.value),
            explanation: `Cột "${target.label}" cao tới mức ${target.value}.`,
        };
    }

    // 2. Nhiều nhất (20%)
    if (r < 0.5) {
        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ai/cái nào có NHIỀU ${ctx} nhất?`,
            visualSvg: svg,
            correctAnswer: maxItem.label,
            options: shuffleArray(labels),
            explanation: `"${maxItem.label}" có nhiều nhất với ${maxItem.value} ${ctx}.`,
        };
    }

    // 3. Ít nhất (20%)
    if (r < 0.7) {
        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ai/cái nào có ÍT ${ctx} nhất?`,
            visualSvg: svg,
            correctAnswer: minItem.label,
            options: shuffleArray(labels),
            explanation: `"${minItem.label}" có ít nhất với ${minItem.value} ${ctx}.`,
        };
    }

    // 4. Tổng (15%)
    if (r < 0.85) {
        const total = data.reduce((s, d) => s + d.value, 0);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tổng số ${ctx} của tất cả là bao nhiêu?`,
            visualSvg: svg,
            correctAnswer: String(total),
            options: numOpts(total),
            explanation: `Cộng tất cả: ${data.map(d => d.value).join(' + ')} = ${total}.`,
        };
    }

    // 5. Chênh lệch nhiều nhất – ít nhất (15%)
    const diff = maxItem.value - minItem.value;
    return {
        type: QuestionType.SingleChoice,
        questionText: `"${maxItem.label}" nhiều hơn "${minItem.label}" bao nhiêu ${ctx}?`,
        visualSvg: svg,
        correctAnswer: String(diff),
        options: numOpts(diff),
        explanation: `${maxItem.value} − ${minItem.value} = ${diff}.`,
    };
};
