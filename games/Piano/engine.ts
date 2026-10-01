import { isBlack, type KeyRange, type NoteEvent, type Song, type Step } from './model';
/** Preserve rests in both the demonstration and the visual practice sequence. */
export function stepsFromNotes(events: NoteEvent[]): Step[] {
    const steps: Step[] = [];
    for (const e of events) {
        if (e.midi === null) { if (steps.length) steps[steps.length - 1].gapBeats = (steps[steps.length - 1].gapBeats || 0) + e.beats; }
        else steps.push({ pitches: [e.midi], beats: e.beats });
    }
    return steps;
}
export function phrasesFor(steps: Step[], size = 8): Step[][] {
    const phrases: Step[][] = [];
    for (let i = 0; i < steps.length; i += size) phrases.push(steps.slice(i, i + size));
    return phrases;
}
/** Quarter-note beats per bar: 6/8 → 3, 3/8 → 1.5. */
export function barBeats(meter: string) {
    const [count, unit] = meter.split('/').map(Number);
    return count > 0 && unit > 0 ? count * 4 / unit : 4;
}
const PHRASE_TARGET = 8, PHRASE_MAX = 14, PHRASE_MIN = 3;
/**
 * Split a melody at bar lines so each phrase is 1, 2 or 4 whole bars, picking the size whose
 * average lands nearest eight notes. Notes of a pickup bar join the first phrase.
 */
export function songPhrases(song: Pick<Song, 'notes' | 'meter' | 'totalBeats'>, pickup = 0): Step[][] {
    const steps: Step[] = [], starts: number[] = [];
    for (const e of song.notes) {
        if (e.midi === null) { if (steps.length) steps[steps.length - 1].gapBeats = (steps[steps.length - 1].gapBeats || 0) + e.beats; }
        else { steps.push({ pitches: [e.midi], beats: e.beats }); starts.push(e.at); }
    }
    if (!steps.length) return [];
    const bar = barBeats(song.meter), barOf = (at: number) => Math.max(0, Math.floor((at - pickup) / bar + 1e-6));
    const bars = barOf(starts[starts.length - 1]) + 1;
    const sizes = [1, 2, 4].filter(b => b * bar >= 3);
    const size = sizes.reduce((best, b) => {
        const score = (n: number) => Math.abs(steps.length / Math.ceil(bars / n) - PHRASE_TARGET);
        return score(b) <= score(best) ? b : best;
    }, sizes[0]);
    const cut = (from: number, to: number, barsPer: number): Step[][] => {
        const groups = new Map<number, number[]>();
        for (let i = from; i < to; i++) { const g = Math.floor(barOf(starts[i]) / barsPer); groups.set(g, [...(groups.get(g) || []), i]); }
        return [...groups.values()].flatMap(ix => ix.length > PHRASE_MAX && barsPer > 1 ? cut(ix[0], ix[ix.length - 1] + 1, barsPer / 2) : [ix.map(i => steps[i])]);
    };
    const phrases = cut(0, steps.length, size);
    for (let i = phrases.length - 1; i > 0; i--) if (phrases[i].length < PHRASE_MIN) { phrases[i - 1] = [...phrases[i - 1], ...phrases[i]]; phrases.splice(i, 1); }
    if (phrases.length > 1 && phrases[0].length < PHRASE_MIN) { phrases[1] = [...phrases[0], ...phrases[1]]; phrases.shift(); }
    return phrases;
}
/** Beat at which each step starts, counting rests, from the start of the sequence. */
export function stepStarts(steps: Step[]) {
    let at = 0;
    return steps.map(step => { const start = at; at += step.beats + (step.gapBeats || 0); return start; });
}
/** Index of the step sounding at `beat`, or the last one already started. */
export function stepAtBeat(starts: number[], beat: number) {
    let index = 0;
    for (let i = 0; i < starts.length; i++) if (starts[i] <= beat + 1e-6) index = i;
    return index;
}
export function canAdvance(step: Step, pressed: ReadonlySet<number>, newlyPressed: number) {
    return step.pitches.includes(newlyPressed) && step.pitches.every(n => pressed.has(n));
}
export function eventsFromSteps(steps: Step[]) {
    let at = 0;
    const events: NoteEvent[] = [];
    steps.forEach(step => {
        step.pitches.forEach(midi => events.push({ midi, at, beats: step.beats }));
        at += step.beats + (step.gapBeats || 0);
    });
    return { events, beats: at };
}
/** Smallest white-key range holding every note, widened to at least `minWhite` white keys inside C4–C6. */
export function fitRange(midis: number[], minWhite = 8): KeyRange {
    let lo = Math.min(...midis), hi = Math.max(...midis);
    if (!Number.isFinite(lo)) return [60, 72];
    while (isBlack(lo)) lo--;
    while (isBlack(hi)) hi++;
    const whites = () => whiteKeys([lo, hi]).length;
    for (let grow = 0; whites() < minWhite && (lo > 60 || hi < 84); grow++) {
        if ((grow % 2 === 0 && hi < 84) || lo <= 60) { hi++; while (isBlack(hi)) hi++; }
        else { lo--; while (isBlack(lo)) lo--; }
    }
    return [Math.max(60, lo), Math.min(84, hi)];
}
export function whiteKeys([from, to]: KeyRange) {
    const keys: number[] = [];
    for (let midi = from; midi <= to; midi++) if (!isBlack(midi)) keys.push(midi);
    return keys;
}
