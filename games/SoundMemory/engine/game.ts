import { Phrase, phraseFor, SOUND_MISSIONS } from '../content/missions';
import type { TimingQuality } from '../audio/AudioSession';
export interface Hit { at: number; note: number }
export interface Outcome { accuracy: number; assisted: boolean; visual: boolean; slow: boolean; first: boolean; kind: Phrase['kind']; quality: TimingQuality }
export interface SoundSession {
    version: 2; id: string; missionId: string; campaign: boolean; seed: number;
    index: number; phase: 'ready' | 'demo' | 'input' | 'feedback' | 'complete'; paused: boolean;
    entered: number[]; outcomes: Outcome[]; failed: boolean; attempts: number; phraseAttempts: number;
    replays: number; slow: boolean; guided: boolean; visual: boolean; quality: TimingQuality; seconds: number;
}
export function newSession(missionId: string, seed: number, campaign = true, id: string = crypto.randomUUID()): SoundSession {
    return { version: 2, id, missionId, seed: seed >>> 0, campaign, index: 0, phase: 'ready', paused: false, entered: [], outcomes: [], failed: false, attempts: 0, phraseAttempts: 0, replays: 0, slow: false, guided: false, visual: false, quality: 'estimated', seconds: 0 };
}
export const missionOf = (s: SoundSession) => SOUND_MISSIONS.find(m => m.id === s.missionId)!;
export const phraseOf = (s: SoundSession) => phraseFor(missionOf(s), s.index, s.seed);
export function judgeRhythm(p: Phrase, taps: Hit[], beatSeconds: number) {
    const targets = p.beats.map(at => at * beatSeconds), matched = new Set<number>();
    const gaps = targets.slice(1).map((t, i) => t - targets[i]);
    const window = Math.min(.18, ...(gaps.length ? gaps.map(g => g * .45) : [.18]));
    let extra = 0;
    for (const hit of taps) {
        let best = -1, distance = Infinity;
        targets.forEach((t, i) => { const d = Math.abs(t - hit.at); if (!matched.has(i) && hit.note === p.notes[i] && d <= window + 1e-9 && d < distance) { best = i; distance = d; } });
        if (best < 0) extra++; else matched.add(best);
    }
    return { hits: matched.size, missed: targets.length - matched.size, extra, accuracy: matched.size / (targets.length + extra), window };
}
export type Action = { type: 'pause' | 'resume' | 'next' | 'input' | 'replay' } | { type: 'demo'; guided: boolean; slow: boolean; visual: boolean; quality: TimingQuality } | { type: 'note'; note: number } | { type: 'rhythm'; accuracy: number } | { type: 'tick'; seconds: number };
function finish(s: SoundSession, accuracy: number) {
    const assisted = s.guided || s.visual || (phraseOf(s).kind === 'rhythm' && s.quality !== 'output-clock');
    const pass = accuracy >= .7;
    return { ...s, attempts: s.attempts + 1, phraseAttempts: s.phraseAttempts + 1, phase: 'feedback' as const, failed: !pass, outcomes: pass ? [...s.outcomes, { accuracy, assisted, visual: s.visual, slow: s.slow, first: s.phraseAttempts === 0, kind: phraseOf(s).kind, quality: s.quality }] : s.outcomes };
}
export function reduceSound(s: SoundSession, a: Action): SoundSession {
    if (a.type === 'pause') return s.phase === 'complete' ? s : { ...s, paused: true };
    if (a.type === 'resume') return { ...s, paused: false, phase: s.phase === 'feedback' || s.phase === 'complete' ? s.phase : 'ready', entered: [] };
    if (s.paused || s.phase === 'complete') return s;
    if (a.type === 'tick') return { ...s, seconds: Math.min(86400, s.seconds + Math.max(0, Math.min(2, a.seconds))) };
    if (a.type === 'demo' && s.outcomes.length === s.index) return { ...s, phase: 'demo', entered: [], failed: false, slow: a.slow, guided: a.guided, visual: a.visual, quality: a.quality };
    if (a.type === 'input' && s.phase === 'demo') return { ...s, phase: 'input' };
    if (a.type === 'replay' && s.outcomes.length === s.index) return { ...s, replays: s.replays + 1, entered: [], phase: 'ready' };
    if (a.type === 'note' && s.phase === 'input') {
        const p = phraseOf(s); if (p.kind === 'rhythm' && !s.guided) return s;
        if (!Number.isInteger(a.note) || a.note < 0 || a.note >= (p.kind === 'rhythm' ? 2 : missionOf(s).pads)) return s;
        if (a.note !== p.notes[s.entered.length]) return finish(s, 0);
        const next = { ...s, entered: [...s.entered, a.note] };
        return next.entered.length === p.notes.length ? finish(next, 1) : next;
    }
    if (a.type === 'rhythm' && s.phase === 'input' && phraseOf(s).kind === 'rhythm' && !s.guided && Number.isFinite(a.accuracy) && a.accuracy >= 0 && a.accuracy <= 1) return finish(s, a.accuracy);
    if (a.type === 'next' && s.phase === 'feedback' && !s.failed) return s.index === 2 ? { ...s, phase: 'complete' } : { ...s, phase: 'ready', index: s.index + 1, entered: [], phraseAttempts: 0, failed: false };
    return s;
}
export function soundResult(s: SoundSession) {
    const assisted = s.outcomes.some(o => o.assisted), accuracy = s.outcomes.reduce((n, o) => n + o.accuracy, 0) / 3;
    const stars = assisted ? 1 : s.outcomes.every(o => o.kind === 'rhythm' ? o.accuracy >= .9 : o.first) ? 3 : 2;
    return { stars, score: Math.round(accuracy * 1000), record: { version: 2 as const, missionId: s.missionId, assisted, visual: s.outcomes.some(o => o.visual), attempts: s.attempts, replays: s.replays, slow: s.outcomes.some(o => o.slow), accuracy, outcomes: s.outcomes } };
}
export type SoundRecord = ReturnType<typeof soundResult>['record'];
export function validSession(value: unknown): value is SoundSession {
    if (!value || typeof value !== 'object') return false;
    const s = value as SoundSession, m = SOUND_MISSIONS.find(m => m.id === s.missionId);
    const int = (n: unknown, max = 100000) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
    if (!m || s.version !== 2 || typeof s.id !== 'string' || !s.id || s.id.length > 100 || !int(s.seed, 4294967295) || !int(s.index, 2) || !['ready', 'demo', 'input', 'feedback', 'complete'].includes(s.phase)) return false;
    if (!['campaign', 'paused', 'failed', 'slow', 'guided', 'visual'].every(k => typeof s[k as keyof SoundSession] === 'boolean') || !['output-clock', 'estimated'].includes(s.quality)) return false;
    if (![s.attempts, s.phraseAttempts, s.replays].every(n => int(n)) || s.phraseAttempts > s.attempts || !Number.isFinite(s.seconds) || s.seconds < 0 || s.seconds > 86400) return false;
    if (!Array.isArray(s.entered) || s.entered.length > 8 || !s.entered.every(n => int(n, 4)) || !Array.isArray(s.outcomes)) return false;
    const expected = s.phase === 'complete' ? 3 : s.index + (s.phase === 'feedback' && !s.failed ? 1 : 0);
    if (s.outcomes.length !== expected || s.attempts < expected || (s.phase === 'complete' && (s.index !== 2 || s.failed))) return false;
    return s.outcomes.every((o, i) => o && o.kind === m.phrases[i].kind && Number.isFinite(o.accuracy) && o.accuracy >= .7 && o.accuracy <= 1 && ['assisted', 'visual', 'slow', 'first'].every(k => typeof o[k as keyof Outcome] === 'boolean') && ['output-clock', 'estimated'].includes(o.quality) && (!o.visual || o.assisted) && (o.kind !== 'rhythm' || o.quality === 'output-clock' || o.assisted));
}
