import { Question, QuestionType } from '../../../types';
import { baseTenSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const wrongNums = (ans: number, count = 3): string[] => {
    const set = new Set<number>();
    while (set.size < count) { const v = ans + randomInt(-30, 30); if (v >= 0 && v <= 1000 && v !== ans) set.add(v); }
    return Array.from(set).map(String);
};

/**
 * Lớp 2 — Số đến 1000: cấu tạo (trăm-chục-đơn vị), giá trị vị trí, so sánh,
 * thứ tự, số liền trước/liền sau. (Chuẩn GDPT 2018 lớp 2.)
 */
export const generateG2Numbers1000 = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();
    const value = randomInt(101, 999);
    const h = Math.floor(value / 100), t = Math.floor((value % 100) / 10), u = value % 10;

    // 1. Giá trị vị trí qua hình khối trăm-chục-đơn vị (20%)
    if (r < 0.2) {
        return {
            type: QuestionType.SingleChoice,
            questionText: `Hình vẽ thể hiện số nào?`,
            visualSvg: baseTenSVG(value),
            correctAnswer: String(value),
            options: shuffleArray([String(value), ...wrongNums(value)]),
            explanation: `${h} khối trăm, ${t} thanh chục và ${u} ô đơn vị là số ${value}.`,
        };
    }

    // 2. Cấu tạo số từ trăm/chục/đơn vị (20%)
    if (r < 0.4) {
        return {
            type: QuestionType.SingleChoice,
            questionText: `Số gồm ${h} trăm, ${t} chục và ${u} đơn vị là số nào?`,
            correctAnswer: String(value),
            options: shuffleArray([String(value), String(h * 100 + u * 10 + t), String(u * 100 + t * 10 + h), String(value + 10)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)),
            explanation: `${h} trăm = ${h * 100}, ${t} chục = ${t * 10}, ${u} đơn vị = ${u}. Tổng = ${value}.`,
        };
    }

    // 3. Phân tích thành tổng (15%)
    if (r < 0.55) {
        return {
            type: QuestionType.ManualInput,
            questionText: `${value} = ${h * 100} + ${t * 10} + ?`,
            correctAnswer: String(u),
            explanation: `${value} = ${h * 100} + ${t * 10} + ${u}.`,
        };
    }

    // 4. So sánh hai số (20%)
    if (r < 0.75) {
        const a = randomInt(101, 999), b = randomInt(101, 999);
        const ans = a > b ? '>' : a < b ? '<' : '=';
        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh hai số: ${a} ... ${b}`,
            correctAnswer: ans,
            options: ['>', '<', '='],
            explanation: `${a} ${ans} ${b}.`,
        };
    }

    // 5. Số liền trước / liền sau (15%)
    if (r < 0.9) {
        const after = Math.random() > 0.5;
        const ans = after ? value + 1 : value - 1;
        return {
            type: QuestionType.ManualInput,
            questionText: `Số liền ${after ? 'sau' : 'trước'} của ${value} là số nào?`,
            correctAnswer: String(ans),
            explanation: `Số liền ${after ? 'sau' : 'trước'} hơn ${value} là ${value} ${after ? '+' : '-'} 1 = ${ans}.`,
        };
    }

    // 6. Sắp xếp thứ tự tăng dần (10%)
    const nums = shuffleArray([randomInt(100, 399), randomInt(400, 699), randomInt(700, 999)]);
    const sorted = [...nums].sort((x, y) => x - y);
    const mk = (arr: number[]) => arr.join(', ');
    const distractors = shuffleArray([mk([...nums].sort((x, y) => y - x)), mk(nums), mk([sorted[1], sorted[0], sorted[2]])]).filter(o => o !== mk(sorted));
    return {
        type: QuestionType.SingleChoice,
        questionText: `Sắp xếp các số từ bé đến lớn: ${mk(nums)}`,
        correctAnswer: mk(sorted),
        options: shuffleArray([mk(sorted), ...distractors.slice(0, 3)]),
        explanation: `Thứ tự tăng dần: ${mk(sorted)}.`,
    };
};
