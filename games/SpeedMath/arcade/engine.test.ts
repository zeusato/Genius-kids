import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeBoard } from './content';
import { boardOf, createSession, duration, normalize, recordOf, reduce, validSession } from './engine';
import { completeArcade, persistArcade, readDraft, saveDraft } from './progress';
import type { Action, Config, Session } from './model';
import type { StudentProfile } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
const config: Config = { grade: 2, difficulty: 'medium', pace: 'challenge', topic: 'math', mode: 'cup', theme: 'station' };
const student: StudentProfile = { id: 'test-player', name: 'Test', age: 8, grade: 2, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 0, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [], achievements: [] };
function game(c: Partial<Config> = {}) { let s = createSession({ ...config, ...c }, 42, 'session-1', student.id); return { get s() { return s; }, send(a: Action, ms = 100) { s = reduce(s, { ...a, now: s.clockAt + ms, sessionId: s.id }); return s; } }; }
function finish(success = true, c: Partial<Config> = {}) {
    const g = game(c);
    g.send({ type: 'start' });
    for (let i = 0; i < 6000 && g.s.phase !== 'finished'; i++) {
        const s = g.s, b = boardOf(s);
        if (s.phase === 'between')
            g.send({ type: 'start' });
        else if (s.phase === 'review' || s.phase === 'boardDone')
            g.send({ type: 'next' });
        else if (!success)
            g.send({ type: 'tick' }, 1000);
        else if (b.kind === 'choice' || b.kind === 'typing')
            g.send({ type: 'answer', boardId: b.id, value: b.answer[0] });
        else if (b.kind === 'match') {
            const id = b.answer.find(v => !s.matched.includes(v))!;
            g.send({ type: 'select', boardId: b.id, value: id });
            g.send({ type: 'match', boardId: b.id, value: id });
        }
        else {
            b.answer.forEach(value => g.send({ type: 'place', boardId: b.id, value }));
            g.send({ type: 'check', boardId: b.id });
        }
    }
    expect(g.s.phase).toBe('finished');
    expect(validSession(g.s)).toBe(true);
    return g.s;
}
describe('timed arcade', () => {
    it('can persist a round driven by fractional browser timestamps', () => {
        const g = game({ mode: 'choice' });
        g.send({ type: 'start' }, 0.1234567);
        while (g.s.phase !== 'finished') g.send({ type: 'tick' }, 17.1234567);
        expect(g.s.rounds[0].elapsedMs).toBe(duration(g.s.config));
        expect(validSession(g.s)).toBe(true);
        expect(completeArcade(student, g.s).ok).toBe(true);
    });
    it('accepts answers immediately, including while reading; ignores stale board/session events', () => {
        const g = game();
        g.send({ type: 'start' }, 0);
        const b = boardOf(g.s);
        g.send({ type: 'listen', value: true }, 0);
        g.send({ type: 'answer', boardId: b.id, value: b.answer[0] }, 0);
        expect(g.s.rounds[0].solved).toBe(1);
        expect(g.s.listening).toBe(false);
        expect(g.s.remainingMs).toBe(45000);
        g.send({ type: 'answer', boardId: b.id, value: b.answer[0] }, 0);
        expect(g.s.rounds[0].solved).toBe(1);
        expect(reduce(g.s, { type: 'pause', sessionId: 'stale', now: 10 })).toBe(g.s);
    });
    it('uses one active timer and freezes time on pause, speech and answer explanations', () => {
        const g = game();
        g.send({ type: 'start' });
        g.send({ type: 'tick' }, 1000);
        g.send({ type: 'pause' }, 0);
        g.send({ type: 'tick' }, 20000);
        expect(g.s.remainingMs).toBe(44000);
        g.send({ type: 'resume' }, 0);
        g.send({ type: 'listen', value: true }, 0);
        g.send({ type: 'tick' }, 5000);
        expect(g.s.remainingMs).toBe(44000);
        g.send({ type: 'listen', value: false }, 0);
        const b = boardOf(g.s);
        g.send({ type: 'answer', boardId: b.id, value: b.options.find(o => o.id !== b.answer[0])!.id }, 0);
        g.send({ type: 'tick' }, 5000);
        expect(g.s.phase).toBe('review');
        expect(g.s.remainingMs).toBe(44000);
        g.send({ type: 'next' }, 0);
        g.send({ type: 'tick' }, 1000);
        expect(g.s.remainingMs).toBe(43000);
    });
    it('does not award a click arriving after the clock expires, and pauses suspended tabs', () => {
        const g = game({ mode: 'choice' });
        g.send({ type: 'start' });
        for (let i = 0; i < 44; i++)
            g.send({ type: 'tick' }, 1000);
        const b = boardOf(g.s);
        g.send({ type: 'answer', boardId: b.id, value: b.answer[0] }, 1000);
        expect(g.s.phase).toBe('finished');
        expect(g.s.rounds[0].points).toBe(0);
        const h = game();
        h.send({ type: 'start' });
        h.send({ type: 'tick' }, 30000);
        expect(h.s.paused).toBe(true);
        expect(h.s.remainingMs).toBe(45000);
    });
    it('retains successful pairs and rejects repeated wrong pair submissions', () => {
        const g = game({ mode: 'match' });
        g.send({ type: 'start' });
        const b = boardOf(g.s), [a, z] = b.answer;
        g.send({ type: 'select', boardId: b.id, value: a });
        g.send({ type: 'match', boardId: b.id, value: a });
        expect(g.s.matched).toEqual([a]);
        g.send({ type: 'pause' });
        g.send({ type: 'resume' }, 9000);
        expect(g.s.matched).toEqual([a]);
        g.send({ type: 'select', boardId: b.id, value: z });
        const wrong = b.answer.find(v => v !== z && v !== a)!;
        g.send({ type: 'match', boardId: b.id, value: wrong });
        const attempts = g.s.rounds[0].attempts;
        g.send({ type: 'match', boardId: b.id, value: wrong });
        expect(g.s.rounds[0].attempts).toBe(attempts);
        const points = g.s.rounds[0].points;
        g.send({ type: 'match', boardId: b.id, value: z });
        expect(g.s.rounds[0].points).toBe(points);
        expect(g.s.matched).toContain(z);
    });
    it('supports ordering, removing and undoing cards; incomplete/double checks cannot score', () => {
        const g = game({ mode: 'order' });
        g.send({ type: 'start' });
        const b = boardOf(g.s);
        g.send({ type: 'place', boardId: b.id, value: b.answer[0] });
        g.send({ type: 'place', boardId: b.id, value: b.answer[0] });
        expect(g.s.order).toHaveLength(1);
        g.send({ type: 'check', boardId: b.id });
        expect(g.s.rounds[0].attempts).toBe(0);
        g.send({ type: 'undo', boardId: b.id });
        expect(g.s.order).toHaveLength(0);
        b.answer.forEach(value => g.send({ type: 'place', boardId: b.id, value }));
        g.send({ type: 'remove', boardId: b.id, index: 0 });
        expect(g.s.order).toEqual(b.answer.slice(1));
        while (g.s.order.length)
            g.send({ type: 'undo', boardId: b.id });
        b.answer.forEach(value => g.send({ type: 'place', boardId: b.id, value }));
        g.send({ type: 'check', boardId: b.id });
        g.send({ type: 'check', boardId: b.id });
        expect(g.s.rounds[0].attempts).toBe(1);
        expect(g.s.phase).toBe('boardDone');
    });
    it('stores typing drafts and accepts canonical Vietnamese without stripping accents', () => {
        const g = game({ mode: 'typing' });
        g.send({ type: 'start' });
        const b = boardOf(g.s);
        g.send({ type: 'input', boardId: b.id, value: 'đang gõ' });
        g.send({ type: 'pause' });
        g.send({ type: 'resume' }, 8000);
        expect(g.s.input).toBe('đang gõ');
        g.send({ type: 'answer', boardId: b.id, value: `  ${b.answer[0].toUpperCase().normalize('NFD')} ` });
        expect(g.s.rounds[0].solved).toBe(1);
        expect(g.s.input).toBe('');
        expect(normalize('má')).not.toBe(normalize('ma'));
    });
    it('awards only completed balanced cups, caps scores, and awards no stars for idle/practice', () => {
        const s = finish();
        expect(s.rounds.every(r => r.points === 200)).toBe(true);
        expect(recordOf(s).medal).toBe('gold');
        expect(recordOf(finish(false)).medal).toBeNull();
        expect(recordOf(finish(true, { mode: 'typing' })).medal).toBeNull();
        const unbalanced = structuredClone(s);
        unbalanced.rounds[1].points = 29;
        expect(recordOf(unbalanced).medal).toBeNull();
    });
});
describe('content integrity', () => {
    it('builds deterministic unique answer sets and unambiguous order/matching targets across grades', () => {
        for (let grade = 1; grade <= 5; grade++)
            for (const topic of ['mixed', 'math', 'observe', 'words', 'knowledge'] as const)
                for (const kind of ['choice', 'match', 'order', 'typing'] as const)
                    for (let i = 0; i < 60; i++) {
                        const c = { ...config, grade, topic, difficulty: 'hard' as const }, b = makeBoard(c, 51, 0, i, kind);
                        expect(makeBoard(c, 51, 0, i, kind)).toEqual(b);
                        expect(new Set(b.options.map(o => o.text)).size).toBe(b.options.length);
                        if (kind !== 'typing')
                            expect(b.answer.every(id => b.options.some(o => o.id === id))).toBe(true);
                        if (kind === 'match') {
                            expect(b.left!.length).toBe(grade >= 3 ? 4 : 3);
                            expect(b.left!.map(o => o.id).sort()).toEqual(b.options.map(o => o.id).sort());
                        }
                        if (kind === 'order')
                            expect(b.options.map(o => o.id)).not.toEqual(b.answer);
                    }
    });
    it('always gives two explicit object groups, including empty groups', () => {
        const boards = Array.from({ length: 200 }, (_, seed) => makeBoard({ ...config, topic: 'observe' }, seed, 0, 0, 'choice'));
        expect(boards.some(b => b.visual?.kind === 'groups' && (b.visual.left === 0 || b.visual.right === 0))).toBe(true);
        for (const b of boards) {
            if (b.visual?.kind !== 'groups')
                throw Error('Expected group board');
            expect(Number(b.options.find(o => o.id === b.answer[0])!.text)).toBe(b.visual.left + b.visual.right);
        }
    });
});
describe('completion and recovery', () => {
    it('does not consume an achievement reward when saving fails', () => {
        const profile: StudentProfile = { ...student, stats: initializeStats(student), achievements: [{ id: 'speed_math_king', currentValue: 4, unlockedTiers: [], unlockedAt: '2026-09-09' }] };
        profile.stats!.gameWins['speed-math'] = 4;
        const before = structuredClone(profile), session = finish();
        expect(persistArcade([profile], profile.id, session, () => { throw Error('quota'); }).ok).toBe(false);
        expect(profile).toEqual(before);
        const retried = persistArcade([profile], profile.id, session, () => {});
        expect(retried.bonusStars).toBeGreaterThanOrEqual(5);
        expect(retried.profiles[0].achievements?.find(a => a.id === 'speed_math_king')?.unlockedTiers).toContain('bronze');
    });
    it('keeps legacy wins when earning the next SpeedMath achievement', () => {
        const profile = { ...student, stats: initializeStats(student) };
        profile.stats.gameWins.speed = 2;
        profile.stats.gameWins['speed-math'] = 2;
        const session = finish();
        const result = completeArcade(profile, session);
        const achievement = result.profile.achievements?.find(a => a.id === 'speed_math_king');
        expect(achievement?.currentValue).toBe(5);
        expect(achievement?.unlockedTiers).toContain('bronze');
        expect(completeArcade(result.profile, session).profile.stars).toBe(result.profile.stars);
    });
    afterEach(() => vi.unstubAllGlobals());
    it('records a finished session exactly once; rolls back failed persistence and rejects another owner', () => {
        const s = finish(), write = vi.fn();
        const first = persistArcade([student], student.id, s, write);
        expect(first.ok).toBe(true);
        expect(first.earned).toBe(3);
        expect(write).toHaveBeenCalledTimes(1);
        const second = persistArcade(first.profiles, student.id, s, write);
        expect(second.ok).toBe(true);
        expect(write).toHaveBeenCalledTimes(1);
        expect(second.profiles[0].gameHistory).toHaveLength(1);
        expect(completeArcade({ ...student, id: 'another-player' }, s).ok).toBe(false);
        const failed = persistArcade([student], student.id, s, () => { throw Error('quota'); });
        expect(failed.ok).toBe(false);
        expect(failed.profiles[0]).toBe(student);
        expect(student.gameHistory).toHaveLength(0);
        expect(first.profiles[0].stats!.gameWins['speed-math']).toBe(1);
        expect(first.profiles[0].stats!.gameHighScores['speed-math']).toBeUndefined();
    });
    it('roundtrips paused drafts and rejects malformed or inconsistent saves without crashing', () => {
        const values = new Map<string, string>();
        vi.stubGlobal('localStorage', { getItem: (k: string) => values.get(k) || null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) });
        const g = game({ mode: 'order' });
        g.send({ type: 'start' });
        const b = boardOf(g.s);
        g.send({ type: 'place', boardId: b.id, value: b.answer[0] });
        expect(saveDraft(g.s)).toBe(true);
        const restored = readDraft(student.id);
        expect(restored.corrupt).toBe(false);
        expect(restored.session?.paused).toBe(true);
        expect(restored.session?.order).toEqual(g.s.order);
        expect(validSession({ ...g.s, remainingMs: 0 })).toBe(false);
        expect(validSession({ ...g.s, order: ['unknown'] })).toBe(false);
        expect(validSession({ ...g.s, round: 99 })).toBe(false);
        values.set(`speed-draft-v1:${student.id}`, '{bad json');
        expect(readDraft(student.id).corrupt).toBe(true);
        vi.stubGlobal('localStorage', { setItem: () => { throw Error('quota'); }, getItem: () => { throw Error('denied'); } });
        expect(saveDraft(g.s)).toBe(false);
        expect(readDraft(student.id).corrupt).toBe(true);
    });
});
