import { Question, QuestionType } from '../../../types';
import { fractionBarSVG, fractionPieSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

/**
 * Lớp 3 — Phân số "một phần mấy": nhận biết 1/2…1/9, nhận phân số từ hình,
 * tìm một phần mấy của một số, so sánh phân số đơn vị. (Chuẩn GDPT 2018 lớp 3.)
 */
export const generateG3Fractions = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();

    // 1. Nhận biết phân số đơn vị từ hình (30%)
    if (r < 0.3) {
        const d = randomInt(2, 8);
        const useBar = Math.random() > 0.5;
        const wrongDen = shuffleArray([2, 3, 4, 5, 6, 8].filter(x => x !== d)).slice(0, 3);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Phần tô màu là một phần mấy của hình?`,
            visualSvg: useBar ? fractionBarSVG(1, d) : fractionPieSVG(1, d),
            correctAnswer: `1/${d}`,
            options: shuffleArray([`1/${d}`, ...wrongDen.map(x => `1/${x}`)]),
            explanation: `Hình chia ${d} phần bằng nhau, tô 1 phần nên là 1/${d}.`,
        };
    }

    // 2. Nhận biết phân số a/b từ hình (25%)
    if (r < 0.55) {
        const d = randomInt(3, 8);
        const n = randomInt(1, d - 1);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Phần tô màu biểu thị phân số nào?`,
            visualSvg: fractionBarSVG(n, d),
            correctAnswer: `${n}/${d}`,
            options: shuffleArray([`${n}/${d}`, `${d - n}/${d}`, `${n}/${d + 1}`, `${n + 1}/${d}`].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)),
            explanation: `Có ${n} phần được tô trong ${d} phần bằng nhau, nên là ${n}/${d}.`,
        };
    }

    // 3. Tìm một phần mấy của một số (30%)
    if (r < 0.85) {
        const n = randomInt(2, 6);
        const q = randomInt(2, 8);
        const total = n * q; // chia hết
        const ans = total / n;
        const items = pick(['quả cam', 'viên bi', 'cái kẹo', 'bông hoa']);
        return {
            type: QuestionType.SingleChoice,
            questionText: `1/${n} của ${total} ${items} là bao nhiêu ${items}?`,
            correctAnswer: String(ans),
            options: shuffleArray([ans, ans + 1, Math.max(1, ans - 1), total - ans].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4).map(String)),
            explanation: `1/${n} của ${total} là ${total} : ${n} = ${ans}.`,
        };
    }

    // 4. So sánh hai phân số đơn vị (15%)
    const a = randomInt(2, 9), b = randomInt(2, 9);
    const left = `1/${a}`, right = `1/${b}`;
    const ans = a < b ? '>' : a > b ? '<' : '=';
    return {
        type: QuestionType.SingleChoice,
        questionText: `So sánh: ${left} ... ${right}`,
        correctAnswer: ans,
        options: ['>', '<', '='],
        explanation: `Cùng tử số 1, mẫu càng lớn thì phân số càng bé, nên ${left} ${ans} ${right}.`,
    };
};
