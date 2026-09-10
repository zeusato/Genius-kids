import type { Config, Question } from './model';
export function rng(seed: number) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function syllabus(grade: number, difficulty: Config['difficulty']) {
    const rows = [
        ['Cộng, trừ trong 10', 'Cộng, trừ trong 20', 'Tìm số còn thiếu trong 20'],
        ['Cộng, trừ trong 20', 'Cộng, trừ trong 100', 'Nhân, chia 2 · 5 · 10'],
        ['Cộng, trừ trong 100', 'Nhân, chia từ 2 đến 5', 'Nhân, chia từ 2 đến 10'],
        ['Nhân, chia từ 2 đến 10', 'Nhẩm với 10 và 100', 'Biểu thức hai bước'],
        ['Nhẩm với 10 và 100', 'Tìm thành phần phép tính', 'Biểu thức hai bước đến 1.000'],
    ];
    return rows[Math.max(0, Math.min(4, grade - 1))][['easy', 'medium', 'hard'].indexOf(difficulty)];
}
export function legacyQuestionsFor(config: Config, seed: number, count: number): Question[] {
    const random = rng(seed), int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
    const pick = <T,>(xs: T[]) => xs[int(0, xs.length - 1)];
    const level = ['easy', 'medium', 'hard'].indexOf(config.difficulty), grade = config.grade, result: Question[] = [];
    for (let id = 0; id < count; id++) {
        let q: Question, attempts = 0;
        do {
            let a: number, b: number, answer: number, text: string, explanation: string, op: string, extra = 0, kind = 'arithmetic';
            if (grade === 1 || (grade === 2 && level < 2) || (grade === 3 && level === 0)) {
                const max = grade === 1 ? level === 0 ? 10 : 20 : grade === 2 && level === 0 ? 20 : 100;
                op = random() < .5 ? '+' : '−';
                if (op === '+') { a = int(1, max - 1); b = int(1, max - a); answer = a + b; }
                else { a = int(2, max); b = int(1, a); answer = a - b; }
                explanation = `${a} ${op} ${b} = ${answer}`; text = `${a} ${op} ${b} = ?`;
                if (grade === 1 && level === 2) { text = `${a} ${op} ? = ${answer}`; answer = b; kind = 'missing'; }
            } else if (grade >= 4 && level === 2) {
                a = int(2, grade === 5 ? 30 : 12); b = int(2, grade === 5 ? 20 : 9); extra = int(2, 30); op = '×+'; answer = a * b + extra;
                text = `${a} × ${b} + ${extra} = ?`; explanation = `Nhân trước: ${a} × ${b} = ${a * b}. Rồi cộng ${extra}: ${answer}.`; kind = 'two-step';
            } else {
                const tens = (grade === 4 && level === 1) || (grade === 5 && level === 0);
                b = tens ? pick([10, 100]) : grade === 2 ? pick([2, 5, 10]) : int(2, grade === 3 && level === 1 ? 5 : 10);
                a = int(2, 10); op = random() < .5 ? '×' : '÷';
                if (op === '×') answer = a * b; else { answer = a; a *= b; }
                text = `${a} ${op} ${b} = ?`; explanation = `${a} ${op} ${b} = ${answer}`;
                if (grade === 5 && level === 1) { text = `? ${op} ${b} = ${answer}`; answer = a; kind = 'missing'; }
            }
            const values = new Set([answer]);
            while (values.size < 3) { const value = answer + pick([-10, -5, -2, -1, 1, 2, 5, 10]); if (value >= 0 && value <= 1000) values.add(value); }
            const options = [...values];
            for (let i = 2; i > 0; i--) { const j = int(0, i); [options[i], options[j]] = [options[j], options[i]]; }
            q = { id, a, b, op, extra, text, answer, explanation, options, kind };
        } while (q.text === result[id - 1]?.text && ++attempts < 30);
        result.push(q);
    }
    return result;
}
