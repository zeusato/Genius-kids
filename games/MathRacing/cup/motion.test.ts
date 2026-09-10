import { describe, expect, it } from 'vitest';
import { createSession, chooseLane, activeQuestion, recordOf } from './engine';
import { normalizeConfig } from './model';
import { CAMERA_TRAIL, FIXED_STEP, RaceMotion, rivalOpacity } from './motion';
import { PerspectiveCamera, Vector3 } from 'three';
import { roadPosition } from './track';

const session = () => { const s = createSession(normalizeConfig({}), 31, 'motion', 'p'); s.phase = 'racing'; return s; };

describe('Racing presentation clock', () => {
    for (const fps of [30, 60, 90, 120, 144]) it(`renders continuous travel at ${fps} Hz without duplicate fixed-tick poses`, () => {
        const s = session(), motion = new RaceMotion(); motion.advance(s, 0);
        let before = 0;
        for (let i = 1; i <= fps; i++) {
            const pose = motion.advance(s, i * 1000 / fps).racers[0];
            expect(pose.distance).toBeCloseTo(28 * Math.max(0, i / fps - FIXED_STEP), 8);
            if (i > 3) expect(pose.distance - before).toBeCloseTo(28 / fps, 8);
            before = pose.distance;
        }
    });
    it('keeps a nearby rival stable in the camera during irregular frame delivery', () => {
        const s = session(), motion = new RaceMotion(), cam = new PerspectiveCamera(49, 1280 / 720, .1, 340);
        motion.advance(s, 0); let now = 0;
        const intervals = [5, 23, 9, 18, 11, 31];
        for (let i = 0; i < 60; i++) {
            now += intervals[i % intervals.length];
            const frame = motion.advance(s, now), d = frame.racers[0].distance;
            expect(d).toBeCloseTo(28 * Math.max(0, now / 1000 - FIXED_STEP), 8);
            cam.position.set(...roadPosition(d - CAMERA_TRAIL, 0, 10)); cam.lookAt(...roadPosition(d + 18, 0, .8)); cam.updateMatrixWorld();
            // A reference pose at the same continuous timestamp must project to
            // exactly the rendered point, especially in the near foreground.
            const expectedD = -4 + 28 * .983 * Math.max(0, now / 1000 - FIXED_STEP);
            const actual = new Vector3(...roadPosition(frame.racers[1].distance, -4, .05)).project(cam);
            const expected = new Vector3(...roadPosition(expectedD, -4, .05)).project(cam);
            expect(actual.distanceTo(expected)).toBeLessThan(1e-8);
        }
    });
    it('holds the displayed pose across pause, narration and resume; pauses after a stall', () => {
        const s = session(), motion = new RaceMotion(); motion.advance(s, 0); motion.advance(s, 27);
        const before = structuredClone(motion.frame), elapsed = s.elapsed;
        s.paused = true; motion.advance(s, 2000); expect(motion.frame.racers).toEqual(before.racers); expect(s.elapsed).toBe(elapsed);
        s.paused = false; motion.advance(s, 2020, true); expect(motion.frame.racers).toEqual(before.racers); expect(s.elapsed).toBe(elapsed);
        motion.advance(s, 2025); expect(motion.frame.racers).toEqual(before.racers);
        motion.advance(s, 2030); expect(motion.frame.racers[0].distance - before.racers[0].distance).toBeCloseTo(28 * .005, 8);
        const resumed = structuredClone(motion.frame); motion.advance(s, 4025);
        expect(s.paused).toBe(true); expect(motion.stalled).toBe(true); expect(motion.frame.racers).toEqual(resumed.racers);
        s.paused = false; motion.advance(s, 10000);
        expect(s.paused).toBe(false); expect(motion.frame.racers).toEqual(resumed.racers);
    });
    it('does not reuse poses or elapsed time when replacing a race', () => {
        const motion = new RaceMotion(), old = session(); motion.advance(old, 0); motion.advance(old, 100);
        const next = session(); next.id = 'next'; motion.advance(next, 5000);
        expect(next.elapsed).toBe(0); expect(motion.frame.racers[0].distance).toBe(0);
        motion.advance(null, 5010); expect(motion.frame.racers).toEqual([]);
    });
    it('preserves results, selected difficulty and timing through the new render loop', () => {
        const results = [30, 60, 144].map(fps => {
            const s = createSession(normalizeConfig({ difficulty: 'hard', pace: 'fast', autoNitro: true }, 2), 98, 'full', 'p');
            s.phase = 'racing'; const motion = new RaceMotion(); motion.advance(s, 0);
            for (let i = 1; i < fps * 300 && s.phase === 'racing'; i++) {
                const qi = activeQuestion(s); if (qi >= 0) chooseLane(s, s.questions[qi].options.indexOf(s.questions[qi].answer), qi);
                motion.advance(s, i * 1000 / fps);
            }
            expect(s.phase).toBe('finished'); expect(s.config).toMatchObject({ difficulty: 'hard', pace: 'fast' });
            return { record: recordOf(s), elapsed: s.elapsed };
        });
        expect(results[1]).toEqual(results[0]); expect(results[2]).toEqual(results[0]);
    });
    it('fades passing rivals continuously before the camera, including on re-entry', () => {
        expect(rivalOpacity(-12)).toBe(0); expect(rivalOpacity(-7)).toBe(0); expect(rivalOpacity(-1)).toBe(1); expect(rivalOpacity(10)).toBe(1);
        let prior = 0;
        for (let d = -7; d <= -1; d += .02) {
            const opacity = rivalOpacity(d); expect(opacity).toBeGreaterThanOrEqual(prior); expect(opacity - prior).toBeLessThan(.006); prior = opacity;
        }
        expect(rivalOpacity(220)).toBe(0); expect(rivalOpacity(221)).toBe(0);
    });
});
