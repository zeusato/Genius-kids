import { describe, expect, it } from 'vitest';
import { GARDEN_ACTIVITIES, activityFinished, advanceActivity, closestTarget, initialActivityState, pointInTarget, type ActivityAction } from './gardenActivities';

const play = (letter: string, actions: ActivityAction[]) => actions.reduce((state, action) => advanceActivity(GARDEN_ACTIVITIES[letter], state, action), initialActivityState());

describe('garden activities', () => {
    it('covers every D–Z letter and only completes after a full activity', () => {
        expect(Object.keys(GARDEN_ACTIVITIES).join('')).toBe('defghijklmnopqrstuvwxyz');
        for (const activity of Object.values(GARDEN_ACTIVITIES)) expect(activityFinished(activity, initialActivityState())).toBe(false);
    });

    it('selection, an empty drop, a wrong target and the same food twice cannot complete feeding', () => {
        expect(play('f', [{ type: 'select', item: 0 }]).done).toEqual([]);
        expect(play('f', [{ type: 'drop', target: 0 }]).done).toEqual([]);
        expect(play('f', [{ type: 'drop', target: 1, item: 0 }]).done).toEqual([]);
        const state = play('f', [{ type: 'drop', target: 0, item: 0 }, { type: 'drop', target: 0, item: 0 }]);
        expect(state.done).toEqual([0]);
        expect(activityFinished(GARDEN_ACTIVITIES.f, state)).toBe(false);
        expect(activityFinished(GARDEN_ACTIVITIES.f, play('f', [0, 1, 2].map(item => ({ type: 'drop', target: 0, item }))))).toBe(true);
    });

    it('can reuse the water source after watering the first plant but not water the same plant twice', () => {
        const actions: ActivityAction[] = [0, 0, 1, 2].flatMap(target => [{ type: 'select', item: 0 }, { type: 'drop', target }]);
        expect(play('e', actions).done).toEqual([0, 1, 2]);
        expect(play('o', actions).done).toEqual([0, 1, 2]);
    });

    it('requires the matching decoration and lets the child correct a wrong placement', () => {
        const wrong = play('h', [{ type: 'select', item: 1 }, { type: 'drop', target: 0 }]);
        expect(wrong).toMatchObject({ selected: 1, done: [], feedback: 'retry' });
        expect(advanceActivity(GARDEN_ACTIVITIES.h, wrong, { type: 'drop', target: 1 }).done).toEqual([1]);
    });

    it.each(['k', 'l', 't', 'x'])('%s follows the sequence without resetting earlier successes on a mistake', letter => {
        const activity = GARDEN_ACTIVITIES[letter], order = activity.order!;
        const first = advanceActivity(activity, initialActivityState(), { type: 'hit', item: order[0] });
        const wrong = advanceActivity(activity, first, { type: 'hit', item: order[2] });
        expect(wrong.done).toEqual([order[0]]);
        expect(wrong.feedback).toBe('retry');
        const finished = order.slice(1).reduce((state, item) => advanceActivity(activity, state, { type: 'hit', item }), wrong);
        expect(activityFinished(activity, finished)).toBe(true);
    });

    it.each(['j', 'v', 'w', 'y'])('%s only advances at alternating slider endpoints', letter => {
        const state = play(letter, [30, 70, 100, 100, 99, 100, 40].map(value => ({ type: 'axis', value })));
        expect(state.done).toEqual([0]);
        const steps = letter === 'y' ? [100, 0, 100, 0, 100, 0] : [100, 0, 100];
        const nearly = play(letter, steps.slice(0, -1).map(value => ({ type: 'axis', value })));
        expect(activityFinished(GARDEN_ACTIVITIES[letter], nearly)).toBe(false);
        const complete = play(letter, steps.map(value => ({ type: 'axis', value })));
        expect(activityFinished(GARDEN_ACTIVITIES[letter], complete)).toBe(true);
        expect(advanceActivity(GARDEN_ACTIVITIES[letter], complete, { type: 'axis', value: 45 })).toBe(complete);
    });

    it('requires the umbrella to visit each flower in order', () => {
        const state = play('u', [85, 15, 15, 85, 50].map(value => ({ type: 'axis', value })));
        expect(state.done).toEqual([0, 1]);
        expect(activityFinished(GARDEN_ACTIVITIES.u, advanceActivity(GARDEN_ACTIVITIES.u, state, { type: 'axis', value: 85 }))).toBe(true);
    });

    it('ignores invalid actions and checks drops by proximity', () => {
        expect(play('f', [{ type: 'select', item: -1 }, { type: 'drop', target: 0, item: 3 }, { type: 'hit', item: 1.5 }]).done).toEqual([]);
        expect(play('v', [{ type: 'axis', value: NaN }])).toEqual(initialActivityState());
        expect(pointInTarget(58, 54, [60, 55], 10)).toBe(true);
        expect(pointInTarget(10, 54, [60, 55], 10)).toBe(false);
        expect(closestTarget(66, 58, [[55, 59], [66, 58], [77, 60]], 13)).toBe(1);
        expect(closestTarget(10, 54, [[55, 59], [66, 58], [77, 60]], 13)).toBe(-1);
    });
});
