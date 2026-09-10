import { describe, expect, it } from 'vitest';
import { LEVELS, MISSIONS, normalizeConfig, raceQuestionCount } from './model';
import { activeQuestion, chooseLane, createSession, recordOf, step, validSession } from './engine';
import { questionsFor } from './questions';

describe('Longer racing sessions', () => {
    for (let grade = 1; grade <= 5; grade++) for (const level of LEVELS) it(`fills 24 distinct questions for grade ${grade}/${level.id}`, () => {
        const config = normalizeConfig({ mission: 11, difficulty: level.id }, grade);
        for (let seed = 1; seed <= 20; seed++) {
            const questions = questionsFor(config, seed, 24);
            expect(questions).toHaveLength(24);
            expect(new Set(questions.map(q => q.text)).size).toBe(24);
            expect(questions.slice(0, 10)).toEqual(questionsFor(config, seed, 10));
        }
    });
    it('matches the garage count and completes the longest race with every answer recorded', () => {
        expect(MISSIONS.map(m => m.gates)).toEqual([12, 14, 16, 18, 16, 18, 20, 22, 20, 22, 24, 24]);
        for (const mode of ['campaign', 'quick', 'practice'] as const) {
            const config = normalizeConfig({ mode }, 2), s = createSession(config, 83, mode, 'p');
            expect(s.questions.length).toBe(raceQuestionCount(config));
            expect(s.questions.length).toBe(mode === 'quick' ? 18 : 12);
        }
        const s = createSession(normalizeConfig({ mission: 11, autoNitro: true }, 2), 83, 'long', 'p');
        s.phase = 'racing';
        for (let i = 0; i < 10000 && s.phase === 'racing'; i++) {
            const qi = activeQuestion(s);
            if (qi >= 0) chooseLane(s, s.questions[qi].options.indexOf(s.questions[qi].answer), qi);
            step(s, .1);
        }
        expect(s.phase).toBe('finished'); expect(s.answers).toHaveLength(24);
        expect(recordOf(s)).toMatchObject({ total: 24, correct: 24, accuracy: 100 });
        expect(s.nitros).toBeGreaterThan(2); expect(validSession(s)).toBe(true);
    });
    it('replays missed questions beyond the old ten-question limit', () => {
        const old = createSession(normalizeConfig({ mission: 11, difficulty: 'hard' }, 1), 36, 'long', 'p');
        const review = createSession(normalizeConfig({ ...old.config, mode: 'practice', review: [2, 11, 17, 23] }, 1), old.seed, 'review', 'p');
        expect(review.questions).toEqual([2, 11, 17, 23].map(i => old.questions[i]));
        expect(validSession(review)).toBe(true);
    });
    it('preserves short saved runs from both older question versions', () => {
        for (const questionVersion of [1, 2] as const) for (const mode of ['campaign', 'quick', 'practice'] as const) {
            const old = createSession(normalizeConfig({ mode }, 2), 36, 'old', 'p', questionVersion, 1);
            expect(old.lengthVersion).toBeUndefined(); expect(validSession(JSON.parse(JSON.stringify(old)))).toBe(true);
            expect(old.questions.length).toBe(mode === 'campaign' ? 4 : mode === 'quick' ? 8 : 6);
            const next = createSession(old.config, old.seed, 'new', 'p');
            expect(next.questions.length).toBeGreaterThan(old.questions.length);
            expect(validSession({ ...next, lengthVersion: 99 })).toBe(false);
        }
    });
});
