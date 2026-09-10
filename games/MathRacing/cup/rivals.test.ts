import { describe, expect, it } from 'vitest';
import { activeQuestion, answerNow, chooseLane, createSession, rankOf, readSeconds, step, validSession } from './engine';
import { APPROACH, LEVELS, PACES, normalizeConfig, type Difficulty } from './model';
import { rivalDecision, RIVAL_SKILLS } from './rivals';
import { RaceMotion } from './motion';

const fixture = (difficulty: Difficulty = 'medium') => {
    const s = createSession(normalizeConfig({ mode: 'quick', difficulty }, 2), 963, 'ai', 'p');
    s.phase = 'racing'; s.racers.forEach(r => { r.distance = APPROACH; }); return s;
};
describe('Rival decisions and competition', () => {
    it('caps accuracy by difficulty, varies reaction times and makes every rival fallible', () => {
        const question = fixture().questions[0], correctLane = question.options.indexOf(question.answer);
        const results = LEVELS.map(level => {
            let correct = 0, delay = 0;
            for (let index = 1; index <= 3; index++) {
                let hits = 0; const delays = new Set<number>();
                for (let seed = 1; seed <= 4000; seed++) {
                    const plan = rivalDecision(seed, level.id, question, index, 10);
                    hits += Number(plan.lane === correctLane); delay += plan.delay; delays.add(plan.delay);
                    expect(plan.lane).toBeGreaterThanOrEqual(0); expect(plan.lane).toBeLessThan(3);
                    expect(plan.delay).toBeGreaterThanOrEqual(1.1); expect(plan.delay).toBeLessThanOrEqual(9.15);
                }
                expect(hits / 4000).toBeGreaterThan(RIVAL_SKILLS[level.id].accuracy - .075);
                expect(hits / 4000).toBeLessThan(RIVAL_SKILLS[level.id].accuracy + .075);
                expect(hits).toBeLessThan(4000); expect(delays.size).toBeGreaterThan(100); correct += hits;
            }
            return { accuracy: correct / 12000, delay: delay / 12000 };
        });
        expect(results[0].accuracy).toBeLessThan(results[1].accuracy); expect(results[1].accuracy).toBeLessThan(results[2].accuracy);
        expect(results[0].delay).toBeGreaterThan(results[1].delay); expect(results[1].delay).toBeGreaterThan(results[2].delay);
    });
    for (const level of LEVELS) it(`${level.id}: accelerates to its selected lane before the player times out`, () => {
        const s = fixture(level.id), crossed = new Map<number, number>(), plans = new Map<number, number>();
        for (let frame = 0; frame < 1000 && crossed.size < 3; frame++) {
            step(s, 1 / 60);
            s.racers.slice(1).forEach((r, i) => {
                if (r.thought) plans.set(i + 1, r.thought.lane);
                if (r.answered && !crossed.has(i + 1)) {
                    crossed.set(i + 1, s.elapsed);
                    const correct = s.questions[0].options[plans.get(i + 1)!] === s.questions[0].answer;
                    expect(r.combo).toBe(correct ? 1 : 0); expect(r.energy).toBe(correct ? 25 : 0);
                    expect(r.answerRush).toBeUndefined(); expect(r.thought).toBeUndefined();
                }
            });
        }
        expect(crossed.size).toBe(3);
        for (const time of crossed.values()) expect(time).toBeLessThan(readSeconds(s, 0));
        expect(new Set(crossed.values()).size).toBeGreaterThan(1);
        expect(rankOf(s)).toBeGreaterThan(1); expect(validSession(s)).toBe(true);
    });
    it('lets a quick accurate player beat hard rivals without changing their plans', () => {
        const fast = fixture('hard'), slow = structuredClone(fast);
        step(fast, 1 / 60); step(slow, 1 / 60);
        const originalPlans = structuredClone(fast.racers.slice(1).map(r => r.thought));
        chooseLane(fast, fast.questions[0].options.indexOf(fast.questions[0].answer), 0); answerNow(fast, 0);
        for (let i = 0; i < 55; i++) { step(fast, 1 / 60); step(slow, 1 / 60); }
        expect(fast.answers).toHaveLength(1); expect(rankOf(fast)).toBe(1);
        expect(fast.racers.slice(1)).toEqual(slow.racers.slice(1));
        expect(fast.racers.slice(1).map(r => r.thought)).toEqual(originalPlans);
    });
    it('keeps accuracy independent of pace and allows more thinking for complex questions', () => {
        const s = fixture('hard'), question = s.questions[0];
        for (let seed = 1; seed <= 100; seed++) for (let index = 1; index <= 3; index++) {
            const plans = PACES.map(pace => rivalDecision(seed, 'hard', question, index, pace.seconds));
            expect(new Set(plans.map(p => p.lane)).size).toBe(1);
            expect(rivalDecision(seed, 'hard', question, index, 15).delay).toBeGreaterThan(plans[0].delay);
        }
    });
    it('preserves thoughts and rushing through save/pause/resume and rejects corrupt plans', () => {
        const s = fixture('hard');
        for (let i = 0; i < 300 && !s.racers.some(r => r.answerRush); i++) step(s, 1 / 60);
        expect(s.racers.some(r => r.answerRush)).toBe(true); expect(validSession(s)).toBe(true);
        s.paused = true; const saved = JSON.stringify(s); step(s, .2); expect(JSON.stringify(s)).toBe(saved);
        const resumed = JSON.parse(saved); expect(validSession(resumed)).toBe(true);
        resumed.paused = false; s.paused = false;
        for (let i = 0; i < 120; i++) { step(s, 1 / 60); step(resumed, 1 / 60); }
        expect(resumed).toEqual(s); expect(validSession(resumed)).toBe(true);
        const bad = JSON.parse(saved), index = bad.racers.findIndex((r: { answerRush?: unknown }) => r.answerRush);
        bad.racers[index].thought.delay = -1; expect(validSession(bad)).toBe(false);
    });
    it('leaves practice opponents idle and initializes opponents in old drafts', () => {
        const practice = createSession(normalizeConfig({ mode: 'practice' }, 2), 24, 'practice', 'p'); practice.phase = 'racing';
        const before = structuredClone(practice.racers.slice(1)); for (let i = 0; i < 60; i++) step(practice, .1);
        expect(practice.racers.slice(1)).toEqual(before); expect(validSession(practice)).toBe(true);
        const old = createSession(normalizeConfig({}, 2), 24, 'old', 'p', 2, 1); old.phase = 'racing';
        old.racers.forEach(r => { r.distance = APPROACH + 60; }); expect(validSession(old)).toBe(true);
        step(old, .1); expect(old.racers.slice(1).every(r => r.thought)).toBe(true); expect(validSession(old)).toBe(true);
    });
    it('finishes hard races deterministically at 30/60/144Hz with smooth rival rushes', () => {
        const outcomes = [30, 60, 144].map(hz => {
            const s = fixture('hard'), motion = new RaceMotion(); motion.advance(s, 0);
            let previous = s.racers.map(r => r.distance), minDelta = Infinity, maxDelta = 0;
            for (let frame = 1; frame < hz * 300 && s.phase === 'racing'; frame++) {
                const qi = activeQuestion(s); if (qi >= 0) chooseLane(s, s.questions[qi].options.indexOf(s.questions[qi].answer), qi);
                const poses = motion.advance(s, frame * 1000 / hz).racers;
                poses.forEach((pose, index) => { const delta = pose.distance - previous[index]; minDelta = Math.min(minDelta, delta); maxDelta = Math.max(maxDelta, delta); });
                previous = poses.map(p => p.distance);
            }
            expect(s.phase).toBe('finished'); expect(s.racers.slice(1).every(r => r.finishAt !== null)).toBe(true); expect(validSession(s)).toBe(true);
            expect(minDelta).toBeGreaterThanOrEqual(0); expect(maxDelta).toBeLessThan(9);
            return s.racers;
        });
        expect(outcomes[1]).toEqual(outcomes[0]); expect(outcomes[2]).toEqual(outcomes[0]);
    });
});
