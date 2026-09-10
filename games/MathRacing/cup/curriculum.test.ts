import { describe, expect, it, vi } from 'vitest';
import { questionsFor, rng } from './questions';
import { normalizeConfig } from './model';
import { createSession, validSession } from './engine';
import { legacyQuestionsFor } from './legacyQuestions';
import { generatorRandom, withGeneratorRandom } from '../../../services/generators/random';
import { generateG2AddSubCarry } from '../../../services/generators/grade2/addSubCarry';
import { generateG5DecimalOps } from '../../../services/generators/grade5/decimalOps';
import { answerKey, expressionValue } from './questionValues';

describe('Shared curriculum integration', () => {
    it('actually calls the study generators and preserves their answer, using a reproducible source seed', () => {
        for (const [grade, difficulty] of [[2, 'medium'], [5, 'hard']] as const) {
            const qs = questionsFor(normalizeConfig({ difficulty }, grade), 625, 10);
            for (const q of qs.filter(q => q.source!.topic === (grade === 2 ? 'g2_add_sub_carry' : 'g5_decimal_ops'))) {
                const raw = withGeneratorRandom(rng(q.source!.seed), grade === 2 ? generateG2AddSubCarry : generateG5DecimalOps);
                expect(q.answer).toBe(raw.correctAnswer); expect(q.text).toBe(raw.questionText);
            }
        }
    });
    it('separates actual skills in all 15 grade/difficulty combinations, not only labels', () => {
        for (let seed = 1; seed <= 30; seed++) {
            const get = (grade: number, difficulty: 'easy' | 'medium' | 'hard') => questionsFor(normalizeConfig({ difficulty }, grade), seed, 10);
            for (const difficulty of ['easy', 'medium'] as const) for (const q of get(2, difficulty)) {
                const [a, b] = q.text.match(/\d+/g)!.map(Number);
                const carry = q.text.includes('+') ? a % 10 + b % 10 >= 10 : a % 10 < b % 10;
                expect(carry).toBe(difficulty === 'medium');
            }
            expect(get(2, 'hard').every(q => q.kind === 'missing')).toBe(true);
            expect(new Set(get(2, 'hard').map(q => q.source!.topic)).size).toBe(3);
            expect(get(1, 'hard').some(q => q.text.includes('tròn chục'))).toBe(true);
            expect(get(1, 'hard').some(q => q.kind === 'missing')).toBe(true);
            expect(get(3, 'easy').every(q => Number(q.text.match(/^\d+/)![0]) < 100)).toBe(true);
            expect(get(3, 'medium').every(q => Number(q.text.match(/^[\d ]+/)![0].replaceAll(' ', '')) >= 100)).toBe(true);
            const g3hard = get(3, 'hard'); expect(g3hard.some(q => q.kind === 'missing')).toBe(true); expect(g3hard.some(q => q.text.includes('chu vi'))).toBe(true); expect(g3hard.some(q => (q.text.match(/\+/g) || []).length === 2)).toBe(true);
            const g4medium = get(4, 'medium'); expect(g4medium.some(q => /\d\/\d [+-] \d\/\d/.test(q.text))).toBe(true);
            const g4hard = get(4, 'hard'); expect(g4hard.some(q => q.text.includes('('))).toBe(true); expect(g4hard.some(q => /\d\/\d × \d\/\d/.test(q.text))).toBe(true); expect(g4hard.some(q => q.text.includes('Tìm số còn lại'))).toBe(true);
            expect(get(5, 'easy').some(q => /\d,\d+ [+-]/.test(q.text))).toBe(true);
            expect(get(5, 'medium').some(q => q.text.includes('phần trăm'))).toBe(true);
            const g5hard = get(5, 'hard'); expect(g5hard.some(q => /\d,\d+ [×:] \d,\d+/.test(q.text))).toBe(true); expect(g5hard.some(q => q.text.includes('giá sau khi giảm'))).toBe(true);
        }
    });
    it('varies newly generated runs and never replaces global randomness', () => {
        const spy = vi.spyOn(Math, 'random'), ref = Math.random;
        try {
            const c = normalizeConfig({ difficulty: 'hard' }, 5);
            const a = questionsFor(c, 812, 10), b = questionsFor(c, 813, 10);
            expect(a).not.toEqual(b); expect(questionsFor(c, 812, 10)).toEqual(a); expect(spy).not.toHaveBeenCalled(); expect(Math.random).toBe(ref);
            expect(() => withGeneratorRandom(() => .1, () => { throw new Error('generation'); })).toThrow('generation');
            generatorRandom(); expect(spy).toHaveBeenCalledTimes(1);
            withGeneratorRandom(() => .2, () => { expect(generatorRandom()).toBe(.2); withGeneratorRandom(() => .8, () => expect(generatorRandom()).toBe(.8)); expect(generatorRandom()).toBe(.2); });
        } finally { spy.mockRestore(); }
    });
    it('retains old saved questions and exact review questions after the content upgrade', () => {
        const old = createSession(normalizeConfig({ difficulty: 'hard' }, 5), 64, 'old', 'p', 1);
        expect(old.questionVersion).toBeUndefined(); expect(validSession(old)).toBe(true); expect(old.questions).toEqual(legacyQuestionsFor(old.config, old.seed, 4));
        const review = createSession(normalizeConfig({ ...old.config, mode: 'practice', review: [1, 3] }, 5), old.seed, 'review', 'p', 1);
        expect(review.questions).toEqual([old.questions[1], old.questions[3]]); expect(validSession(review)).toBe(true);
        const next = createSession(old.config, old.seed, 'new', 'p'); expect(next.questionVersion).toBe(2); expect(next.questions).not.toEqual(old.questions); expect(validSession(next)).toBe(true);
        expect(validSession({ ...next, questionVersion: 99 })).toBe(false);
    });
    it('understands equivalent fractions and unambiguous decimal/thousands formatting', () => {
        expect(answerKey('1/2')).toBe(answerKey('2/4')); expect(answerKey('1,25')).toBe(answerKey('5/4'));
        expect(expressionValue('1/2 ÷ 3/4')).toBeCloseTo(2 / 3); expect(expressionValue('(1 250 - 250) × 3')).toBe(3000);
        expect(expressionValue('2,5 × 1,2')).toBe(3); expect(expressionValue('1 : 0')).toBeNull(); expect(expressionValue('alert(1)')).toBeNull();
    });
});
