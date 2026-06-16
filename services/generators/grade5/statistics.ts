import { Question, QuestionType } from '../../../types';
import { barChartSVG, pieChartSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const numOpts = (ans: number): string[] => {
    const set = new Set<number>([ans]);
    while (set.size < 4) { const v = ans + randomInt(-5, 5); if (v >= 0 && v !== ans) set.add(v); }
    return shuffleArray(Array.from(set)).map(String);
};

const GROUPS = [['Lớp 5A', 'Lớp 5B', 'Lớp 5C'], ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4'], ['Cam', 'Táo', 'Xoài', 'Lê']];

/**
 * Lớp 5 — Thống kê: đọc biểu đồ cột & biểu đồ hình quạt, tính tổng, trung bình,
 * tỉ lệ phần trăm. (Chuẩn GDPT 2018 lớp 5.)
 */
export const generateG5Statistics = (): Omit<Question, 'id' | 'topicId'> => {
    const labels = pick(GROUPS);
    const r = Math.random();

    // --- Biểu đồ hình quạt (40%): dữ liệu cộng tròn 100% ---
    if (r < 0.4) {
        // 4 phần phần trăm cộng = 100
        const parts = [randomInt(10, 40), randomInt(10, 30), randomInt(10, 20)];
        parts.push(100 - parts.reduce((s, x) => s + x, 0));
        if (parts[3] <= 0) parts[3] = 5, parts[0] = 100 - parts[1] - parts[2] - parts[3];
        const items = ['Cam', 'Táo', 'Xoài', 'Lê'].map((label, i) => ({ label, value: parts[i] }));
        const svg = pieChartSVG(items);
        const maxItem = items.reduce((m, d) => d.value > m.value ? d : m, items[0]);
        if (Math.random() > 0.5) {
            return {
                type: QuestionType.SingleChoice,
                questionText: `Biểu đồ thể hiện tỉ lệ loại quả yêu thích. Loại nào được yêu thích nhất?`,
                visualSvg: svg,
                correctAnswer: maxItem.label,
                options: shuffleArray(items.map(i => i.label)),
                explanation: `"${maxItem.label}" chiếm tỉ lệ cao nhất (${maxItem.value}%).`,
            };
        }
        const total = 200; // chọn 200 để số lượng = 2 × phần trăm (luôn nguyên)
        const target = pick(items);
        const cnt = total * target.value / 100;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Có ${total} học sinh tham gia bình chọn. Theo biểu đồ, "${target.label}" chiếm ${target.value}%. Hỏi có bao nhiêu học sinh chọn "${target.label}"?`,
            visualSvg: svg,
            correctAnswer: String(cnt),
            options: numOpts(cnt),
            explanation: `${total} × ${target.value}% = ${total} × ${target.value} : 100 = ${cnt}.`,
        };
    }

    // --- Biểu đồ cột (60%) ---
    const data = labels.map(label => ({ label, value: randomInt(20, 90) }));
    const svg = barChartSVG(data);
    const total = data.reduce((s, d) => s + d.value, 0);
    const maxItem = data.reduce((m, d) => d.value > m.value ? d : m, data[0]);

    if (r < 0.7) {
        const t = pick(data);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Dựa vào biểu đồ, "${t.label}" có giá trị bao nhiêu?`,
            visualSvg: svg, correctAnswer: String(t.value), options: numOpts(t.value),
            explanation: `Cột "${t.label}" ứng với ${t.value}.`,
        };
    }
    if (r < 0.85) {
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tổng giá trị của tất cả các cột là bao nhiêu?`,
            visualSvg: svg, correctAnswer: String(total), options: numOpts(total),
            explanation: `${data.map(d => d.value).join(' + ')} = ${total}.`,
        };
    }
    const avg = Math.round(total / data.length);
    return {
        type: QuestionType.SingleChoice,
        questionText: `Trung bình cộng giá trị các cột là khoảng bao nhiêu?`,
        visualSvg: svg, correctAnswer: String(avg), options: numOpts(avg),
        explanation: `Trung bình = ${total} : ${data.length} ≈ ${avg}.`,
    };
};
