import type { NoteEvent, Step } from './model';
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
