// Tiến độ "Học bài" — lưu ở StudentProfile.learn (TÁCH khỏi study: readStudyProgress bỏ trường lạ).
// Mọi thay đổi đi qua persistLesson (một lần ghi, kiểm chủ hồ sơ), theo mẫu persistRiddle.
import type { AchievementProgress, StudentProfile } from '../../../types';
import { checkAchievements, initializeStats } from '../../achievementService';
import { SKILL_MAP } from '../catalog';
import { MAX_PAGES } from './pages';

export interface LessonState {
    /** phiên bản nội dung lúc xem */ v: number;
    /** bitmask chỉ số trang đã mở */ seen: number;
    /** trang đang đọc */ at: number;
    /** số câu Em thử đúng cao nhất */ best: number;
    /** 'YYYY-MM-DD' lần đầu đạt */ done?: string;
    /** đã nhận sao của bài */ star?: 1;
}
export interface LearnProgress { version: 1; lessons: Record<string, LessonState> }
export type LessonAction =
    | { kind: 'visit'; skillId: string; v: number; page: number; pages: number }
    | { kind: 'leave'; skillId: string; v: number; page: number }
    | { kind: 'try'; skillId: string; v: number; correct: number; total: number; tryIndex: number };

const int = (x: unknown, min: number, max: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(min, Math.min(max, Math.floor(x))) : min);
const FULL = 2 ** MAX_PAGES - 1;

export function readLearn(raw: unknown): LearnProgress {
    const p: LearnProgress = { version: 1, lessons: {} };
    if (!raw || typeof raw !== 'object' || (raw as LearnProgress).version !== 1) return p;
    for (const [id, s] of Object.entries((raw as LearnProgress).lessons || {})) {
        if (!SKILL_MAP.has(id) || !s || typeof s !== 'object') continue;
        const st: LessonState = { v: int(s.v, 0, 1e6), seen: int(s.seen, 0, FULL) & FULL, at: int(s.at, 0, MAX_PAGES - 1), best: int(s.best, 0, 3) };
        if (typeof s.done === 'string' && /^\d{4}-\d\d-\d\d$/.test(s.done)) st.done = s.done;
        if (s.star === 1) st.star = 1;
        p.lessons[id] = st;
    }
    return p;
}

const bit = (i: number) => 2 ** i;
const has = (mask: number, i: number) => Math.floor(mask / bit(i)) % 2 === 1;
export const seenCount = (s: LessonState | undefined, pages: number) => (s ? Array.from({ length: pages }, (_, i) => has(s.seen, i)).filter(Boolean).length : 0);
export const allSeenBefore = (s: LessonState | undefined, end: number) => !!s && Array.from({ length: end }, (_, i) => has(s.seen, i)).every(Boolean);
/** Trang chưa xem trước vị trí `end`. */
export const missingBefore = (s: LessonState | undefined, end: number) => Array.from({ length: end }, (_, i) => i).filter(i => !s || !has(s.seen, i));
export const passed = (correct: number, total: number) => total >= 1 && correct >= Math.ceil(total * 2 / 3);

export type LessonStatus = 'new' | 'reading' | 'done';
export const lessonStatus = (s: LessonState | undefined): LessonStatus => (s?.done ? 'done' : s && (s.seen > 0 || s.best > 0) ? 'reading' : 'new');

export interface LessonOutcome { accepted: boolean; changed: boolean; profile: StudentProfile; earned: 0 | 1; completedNow: boolean; unlocked: AchievementProgress[] }

export function applyLesson(profile: StudentProfile, a: LessonAction, today: string): LessonOutcome {
    const base: LessonOutcome = { accepted: false, changed: false, profile, earned: 0, completedNow: false, unlocked: [] };
    if (!SKILL_MAP.has(a.skillId) || !Number.isInteger(a.v)) return base;
    const learn = readLearn(profile.learn);
    const prev = learn.lessons[a.skillId];
    let s: LessonState = prev && prev.v === a.v ? { ...prev } : { v: a.v, seen: 0, at: 0, best: prev?.best ?? 0, ...(prev?.done ? { done: prev.done } : {}), ...(prev?.star ? { star: 1 as const } : {}) };
    let earned: 0 | 1 = 0, completedNow = false;

    if (a.kind === 'visit' || a.kind === 'leave') {
        if (!Number.isInteger(a.page) || a.page < 0 || a.page >= MAX_PAGES) return base;
        if (a.kind === 'visit' && !has(s.seen, a.page)) s.seen += bit(a.page);
        s.at = a.page;
    } else {
        if (!Number.isInteger(a.total) || a.total < 1 || a.total > 3 || !Number.isInteger(a.correct) || a.correct < 0 || a.correct > a.total) return base;
        s.best = Math.max(s.best, a.correct);
        if (passed(a.correct, a.total) && allSeenBefore(s, a.tryIndex)) {
            if (!s.done) { s.done = today; completedNow = true; }
            if (!s.star) { s.star = 1; earned = 1; }
        }
    }
    if (prev && JSON.stringify(prev) === JSON.stringify(s)) return { ...base, accepted: true };
    let next: StudentProfile = { ...profile, learn: { version: 1, lessons: { ...learn.lessons, [a.skillId]: s } } };
    let unlocked: AchievementProgress[] = [];
    if (earned) {
        const stats = { ...(next.stats ?? initializeStats(next)) };
        stats.totalStarsEarned = (stats.totalStarsEarned || 0) + earned;
        next = { ...next, stars: next.stars + earned, stats };
        const ach = checkAchievements(next);
        unlocked = ach.unlocked;
        next = { ...next, achievements: ach.updatedAchievements, stars: next.stars + ach.rewards };
    }
    return { accepted: true, changed: true, profile: next, earned, completedNow, unlocked };
}

export function persistLesson(profiles: StudentProfile[], owner: string, a: LessonAction, write: (p: StudentProfile[]) => void, today: string) {
    const fail = { ok: false, profiles, earned: 0 as const, completedNow: false, unlocked: [] as AchievementProgress[] };
    const p = profiles.find(x => x.id === owner);
    if (!p) return fail;
    const out = applyLesson(p, a, today);
    if (!out.accepted) return fail;
    if (!out.changed) return { ...fail, ok: true };
    const next = profiles.map(x => (x.id === owner ? out.profile : x));
    try { write(next); } catch { return fail; }
    return { ok: true, profiles: next, earned: out.earned, completedNow: out.completedNow, unlocked: out.unlocked };
}
