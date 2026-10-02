import type { AnswerMode, GateId, RiddleLang } from '../content/types';

export interface SolvedEntry { at: string; seals: 0 | 1 | 2 | 3; mode: AnswerMode | 'family'; legacy?: true }
export interface ReviewEntry { id: string; due: string; misses: number }
export interface RiddleSettings { autoRead: boolean; input?: AnswerMode; showVi: boolean }

/** Lưu ở profile.riddle (docs/riddle-remake-plan.md mục 6.1). */
export interface RiddleProgress {
    version: 1;
    solved: Record<string, SolvedEntry>;
    /** Id cũ đã giải nhưng không còn trong kho v2: vẫn đếm cho thành tích. */
    legacySolved: string[];
    review: ReviewEntry[];
    rating: Record<RiddleLang, number>;
    daily: { date: string; id: string; done: boolean } | null;
    gates: Partial<Record<GateId, { opened: string }>>;
    recentRounds: string[];
    settings: RiddleSettings;
    /** Số câu bé đã đố người lớn (chế độ Bé làm Nhân Sư). */
    asked: number;
}

export const MAX_REVIEW = 60;
export const MAX_RECENT = 20;

export function startRating(grade: number): Record<RiddleLang, number> {
    const v = grade <= 2 ? 1 : grade <= 4 ? 1.8 : 2.3;
    return { vi: v, en: Math.max(1, v - 0.5) };
}

export function emptyProgress(grade: number): RiddleProgress {
    return { version: 1, solved: {}, legacySolved: [], review: [], rating: startRating(grade), daily: null, gates: {}, recentRounds: [], settings: { autoRead: true, showVi: false }, asked: 0 };
}

const iso = (v: unknown): v is string => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
const clampRating = (v: unknown, d: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(3, Math.max(1, v)) : d;

/** Đọc an toàn (dữ liệu hỏng/thiếu trường → giá trị mặc định). */
export function readProgress(value: unknown, grade: number): RiddleProgress {
    const base = emptyProgress(grade);
    if (!value || typeof value !== 'object' || (value as RiddleProgress).version !== 1) return base;
    const v = value as RiddleProgress;
    for (const [id, s] of Object.entries(v.solved || {})) {
        if (id.length > 20 || !s || !iso(s.at) || ![0, 1, 2, 3].includes(s.seals)) continue;
        base.solved[id] = { at: s.at, seals: s.seals, mode: s.mode, ...(s.legacy ? { legacy: true as const } : {}) };
    }
    base.legacySolved = Array.isArray(v.legacySolved) ? v.legacySolved.filter(x => typeof x === 'string' && x.length <= 20) : [];
    base.review = Array.isArray(v.review) ? v.review.filter(r => r && typeof r.id === 'string' && iso(r.due)).map(r => ({ id: r.id, due: r.due, misses: Math.max(0, Math.min(9, r.misses | 0)) })).slice(-MAX_REVIEW) : [];
    base.rating = { vi: clampRating(v.rating?.vi, base.rating.vi), en: clampRating(v.rating?.en, base.rating.en) };
    base.daily = v.daily && typeof v.daily.date === 'string' && typeof v.daily.id === 'string' ? { date: v.daily.date, id: v.daily.id, done: !!v.daily.done } : null;
    for (const [g, o] of Object.entries(v.gates || {})) if (o && iso(o.opened)) base.gates[g as GateId] = { opened: o.opened };
    base.recentRounds = Array.isArray(v.recentRounds) ? v.recentRounds.filter(x => typeof x === 'string').slice(-MAX_RECENT) : [];
    const st = v.settings || {} as RiddleSettings;
    base.settings = { autoRead: st.autoRead !== false, showVi: !!st.showVi, ...(st.input && ['choice', 'tiles', 'type'].includes(st.input) ? { input: st.input } : {}) };
    base.asked = typeof v.asked === 'number' && v.asked >= 0 ? Math.floor(v.asked) : 0;
    return base;
}
