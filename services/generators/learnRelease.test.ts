import { expect, it } from 'vitest';
import { templates as division } from './grade3/division';
import { templates as decimals } from './grade5/decimalOps';
import { templates as words } from './grade5/wordProblems';
import { withGeneratorRandom } from './random';
import { mathLint } from '../study/lessons/lint';
import { parseValue } from '../study/value';

const seeded = (run: () => void) => {
    let seed = 20261004;
    withGeneratorRandom(() => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296), run);
};

it('chia thập phân M1 luôn có số bị chia thập phân và thương chính xác', () => seeded(() => {
    const template = decimals.find(t => t.skillId === 'g5.dec_div' && t.level === 1)!;
    for (let i = 0; i < 500; i++) {
        const q = template.make(), [a, b] = q.questionText.split(' : ');
        expect(a).toContain(',');
        expect(parseValue(a)! / Number(b.split(' = ')[0])).toBeCloseTo(parseValue(q.correctAnswer!)!, 10);
    }
}));

it('chia Lớp 3 có nhánh riêng cho chữ số 0 ở giữa thương', () => seeded(() => {
    let hasZeroBranch = false;
    for (const template of division.filter(t => t.skillId === 'g3.div_1digit' && t.level === 2)) {
        const questions = Array.from({ length: 50 }, () => template.make());
        if (questions.every(q => /^\d0\d$/.test(q.correctAnswer!))) {
            hasZeroBranch = true;
            for (const q of questions) {
                const [a, b] = q.questionText.match(/\d+/g)!.map(Number);
                expect(a / b).toBe(Number(q.correctAnswer));
                expect(a).toBeGreaterThanOrEqual(100);
                expect(a).toBeLessThanOrEqual(999);
            }
        }
    }
    expect(hasZeroBranch).toBe(true);
}));

it('làm chung: quy đồng, rút gọn rồi tìm thời gian; số học luôn đúng', () => seeded(() => {
    const template = words.find(t => t.skillId === 'g5.work_together')!;
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    for (let i = 0; i < 200; i++) {
        const q = template.make();
        for (const text of [q.explanation, ...q.steps!]) expect(mathLint(text!)).toEqual([]);
        const rate = q.explanation!.match(/1 : \((\d+)\/(\d+)\)/)!;
        expect(rate).not.toBeNull();
        expect(gcd(Number(rate[1]), Number(rate[2]))).toBe(1);
        expect(Number(rate[2]) / Number(rate[1])).toBe(parseValue(q.correctAnswer!)!);
    }
}));
