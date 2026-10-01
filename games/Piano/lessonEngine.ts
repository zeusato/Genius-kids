import { canAdvance } from './engine';
import { noteName, type Activity, type FindActivity, type KeyRange, type Lesson, type Step } from './model';
/** Wrong attempts before a hidden target lights up. */
export const HINT_AFTER = 2;
export const rangeOf = (lesson: Lesson, activity: Activity): KeyRange => activity.range || lesson.range;
export const inRange = ([from, to]: KeyRange, midi: number) => midi >= from && midi <= to;
export const needOf = (activity: FindActivity) => Math.min(activity.need ?? activity.targets.length, activity.targets.length);
export type FindResult = 'found' | 'again' | 'wrong';
export function judgeFind(activity: FindActivity, found: ReadonlySet<number>, midi: number): FindResult {
    if (!activity.targets.includes(midi)) return 'wrong';
    return found.has(midi) ? 'again' : 'found';
}
/** Keys of a pitch class (0 = Đô) visible in the range. */
export function keysOfClass(range: KeyRange, pitchClass: number) {
    const keys: number[] = [];
    for (let midi = range[0]; midi <= range[1]; midi++) if (midi % 12 === pitchClass) keys.push(midi);
    return keys;
}
export const earAnswer = ([first, second]: [number, number]): 'up' | 'down' => second > first ? 'up' : 'down';
/** Outcome of pressing a key against the current follow step. */
export type PressResult = 'advance' | 'hold' | 'partial' | 'wrong' | 'needs-real-key';
export function judgePress(step: Step, held: ReadonlySet<number>, midi: number, recovered: boolean): PressResult {
    // A note recovered from an IME keyup is too short to count as a hold or a chord.
    if (recovered) return step.pitches.length === 1 && !step.holdMs && step.pitches[0] === midi ? 'advance' : step.pitches.includes(midi) ? 'needs-real-key' : 'wrong';
    if (canAdvance(step, held, midi)) return step.holdMs ? 'hold' : 'advance';
    return step.pitches.includes(midi) ? 'partial' : 'wrong';
}
export const holdDone = (step: Step, heldMs: number) => heldMs >= (step.holdMs || 0);
export function stepLabel(step: Step, letters = false) { return step.pitches.map(n => noteName(n, letters)).join(' + '); }
/** Every key an activity may light or ask for; used to keep content inside its keyboard range. */
export function activityKeys(activity: Activity): number[] {
    switch (activity.type) {
        case 'follow': return activity.steps.flatMap(s => s.pitches);
        case 'find': return [...activity.targets, ...(activity.marks || [])];
        case 'quiz': return [];
        case 'ear': return activity.rounds.flat();
    }
}
