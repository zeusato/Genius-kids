import { Question, QuestionType } from '../../../types';
import { parallelogramSVG, rhombusSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const opts = (ans: number, cands: number[], unit: string): string[] => {
    const set = new Set<number>([ans]);
    for (const c of shuffleArray(cands)) { if (c > 0 && c !== ans) set.add(c); if (set.size >= 4) break; }
    while (set.size < 4) { const c = ans + randomInt(-8, 8); if (c > 0) set.add(c); }
    return shuffleArray(Array.from(set).slice(0, 4)).map(v => `${v}${unit}`);
};

/**
 * Lớp 4 — Diện tích hình bình hành (đáy × chiều cao) và hình thoi (tích 2
 * đường chéo : 2). (Chuẩn GDPT 2018 lớp 4.)
 */
export const generateG4ParaRhombus = (): Omit<Question, 'id' | 'topicId'> => {
    const r = Math.random();

    // 1. Diện tích hình bình hành (40%)
    if (r < 0.4) {
        const base = randomInt(4, 16), height = randomInt(3, 12);
        const area = base * height;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình bình hành có độ dài đáy ${base}cm và chiều cao ${height}cm.`,
            visualSvg: parallelogramSVG(base, height),
            correctAnswer: `${area}cm²`,
            options: opts(area, [(base + height) * 2, base + height, area * 2, base * height + base], 'cm²'),
            explanation: `Diện tích hình bình hành = đáy × chiều cao = ${base} × ${height} = ${area} (cm²).`,
        };
    }

    // 2. Diện tích hình thoi (40%)
    if (r < 0.8) {
        const d1 = randomInt(3, 14);
        let d2 = randomInt(4, 16);
        if ((d1 * d2) % 2 !== 0) d2++; // tích chẵn để diện tích nguyên
        const area = (d1 * d2) / 2;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình thoi có hai đường chéo ${d1}cm và ${d2}cm.`,
            visualSvg: rhombusSVG(d1, d2),
            correctAnswer: `${area}cm²`,
            options: opts(area, [d1 * d2, area * 2, (d1 + d2) * 2, d1 + d2], 'cm²'),
            explanation: `Diện tích hình thoi = (đường chéo 1 × đường chéo 2) : 2 = (${d1} × ${d2}) : 2 = ${area} (cm²).`,
        };
    }

    // 3. Tìm chiều cao hình bình hành khi biết diện tích (20%)
    const base = randomInt(4, 12), height = randomInt(3, 10);
    const area = base * height;
    return {
        type: QuestionType.SingleChoice,
        questionText: `Hình bình hành có diện tích ${area}cm² và độ dài đáy ${base}cm. Tính chiều cao.`,
        visualSvg: parallelogramSVG(base, height),
        correctAnswer: `${height}cm`,
        options: opts(height, [area - base, base, height + 2, area], 'cm'),
        explanation: `Chiều cao = diện tích : đáy = ${area} : ${base} = ${height} (cm).`,
    };
};
