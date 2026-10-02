import type { AnswerMode, GateId, Riddle, RiddleLevel } from '../content/types';
import { judge, type Verdict } from './judge';
import type { RoundKind } from './planner';

export interface RoundItem {
    id: string;
    mode: AnswerMode;
    /** Bé đã đổi sang kiểu dễ hơn (chọn đáp án) giữa chừng. */
    downgraded: boolean;
    hints: number;
    tries: number;
    wrong: string[];
    verdict: Verdict | null;
    revealed: boolean;
    done: boolean;
    seals: 0 | 1 | 2 | 3;
    input?: string;
}
export type RoundPhase = 'reading' | 'answering' | 'feedback' | 'summary';
export interface RoundState {
    version: 1;
    id: string;
    owner: string;
    kind: RoundKind;
    gate?: GateId;
    items: RoundItem[];
    index: number;
    phase: RoundPhase;
    startedAt: string;
    updatedAt: string;
}

export const MAX_HINTS = 3;

export function defaultMode(r: Pick<Riddle, 'level' | 'kind'>, pref?: AnswerMode): AnswerMode {
    const m = pref ?? (({ 1: 'choice', 2: 'tiles', 3: 'type' } as Record<RiddleLevel, AnswerMode>)[r.level]);
    return r.kind === 'math' && m === 'tiles' ? 'type' : m;
}

export function createRound(o: { id: string; owner: string; kind: RoundKind; gate?: GateId; riddles: Riddle[]; pref?: AnswerMode; now?: Date }): RoundState {
    const at = (o.now ?? new Date()).toISOString();
    return {
        version: 1, id: o.id, owner: o.owner, kind: o.kind, ...(o.gate ? { gate: o.gate } : {}), index: 0, phase: 'reading', startedAt: at, updatedAt: at,
        items: o.riddles.map(r => ({ id: r.id, mode: defaultMode(r, o.pref), downgraded: false, hints: 0, tries: 0, wrong: [], verdict: null, revealed: false, done: false, seals: 0 })),
    };
}

export function sealsFor(it: Pick<RoundItem, 'revealed' | 'tries' | 'hints' | 'downgraded'>): 0 | 1 | 2 | 3 {
    if (it.revealed) return 0;
    if (it.tries === 0 && it.hints === 0 && !it.downgraded) return 3;
    if (it.tries <= 1 && it.hints <= 1 && !it.downgraded) return 2;
    return 1;
}

export type RoundAction =
    | { type: 'ready' }
    | { type: 'hint' }
    | { type: 'submit'; riddle: Riddle; input: string }
    | { type: 'switch'; mode: AnswerMode }
    | { type: 'reveal' }
    | { type: 'next' }
    | { type: 'restore'; state: RoundState };

export function roundReducer(s: RoundState, a: RoundAction): RoundState {
    if (a.type === 'restore') return a.state;
    const it = s.items[s.index];
    if (!it) return s;
    const touch = (patch: Partial<RoundState>, item?: Partial<RoundItem>): RoundState => ({
        ...s, ...patch,
        items: item ? s.items.map((x, i) => (i === s.index ? { ...x, ...item } : x)) : s.items,
    });
    switch (a.type) {
        case 'ready':
            return s.phase === 'reading' ? touch({ phase: 'answering' }) : s;
        case 'hint':
            return s.phase === 'answering' && it.hints < MAX_HINTS ? touch({}, { hints: it.hints + 1 }) : s;
        case 'switch':
            if (s.phase !== 'answering' || a.mode === it.mode) return s;
            // Đổi sang kiểu khó hơn không bị tính; đổi sang chọn đáp án là nhận trợ giúp.
            return touch({}, { mode: a.mode, downgraded: it.downgraded || a.mode === 'choice' });
        case 'submit': {
            if (s.phase !== 'answering' || a.riddle.id !== it.id) return s;
            const verdict = judge(a.riddle, a.input);
            if (verdict === 'correct' || verdict === 'spelling') {
                const done = { ...it, verdict, done: true, input: a.input };
                return touch({ phase: 'feedback' }, { ...done, seals: sealsFor(done) });
            }
            if (verdict === 'close' || verdict === 'marks') return touch({}, { verdict, input: a.input });
            const tries = it.tries + 1;
            const wrong = it.mode === 'choice' && !it.wrong.includes(a.input) ? [...it.wrong, a.input] : it.wrong;
            // Sai lần thứ hai mà chưa xem gợi ý: tự mở gợi ý đầu.
            const hints = tries >= 2 && it.hints === 0 ? 1 : it.hints;
            return touch({}, { verdict, tries, wrong, hints, input: a.input });
        }
        case 'reveal':
            return s.phase === 'answering' ? touch({ phase: 'feedback' }, { revealed: true, done: true, seals: 0, verdict: null }) : s;
        case 'next':
            if (s.phase !== 'feedback') return s;
            return s.index + 1 >= s.items.length ? touch({ phase: 'summary' }) : touch({ index: s.index + 1, phase: 'reading' });
    }
}

export const roundSeals = (s: RoundState) => s.items.reduce((n, x) => n + x.seals, 0);

export function validRound(v: unknown): v is RoundState {
    if (!v || typeof v !== 'object') return false;
    const s = v as RoundState;
    return s.version === 1 && typeof s.id === 'string' && typeof s.owner === 'string' && Array.isArray(s.items) && s.items.length > 0 && s.items.length <= 8
        && Number.isInteger(s.index) && s.index >= 0 && s.index < s.items.length && ['reading', 'answering', 'feedback', 'summary'].includes(s.phase)
        && s.items.every(x => x && typeof x.id === 'string' && ['choice', 'tiles', 'type'].includes(x.mode) && [0, 1, 2, 3].includes(x.seals));
}
