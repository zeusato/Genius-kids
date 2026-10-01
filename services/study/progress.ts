// ============================================================================
//  Tiến độ Ôn Luyện (thuần, không React) — docs/study-wow-plan.md GĐ3.
//  Lưu ở StudentProfile.study. Mọi hàm nhận `now` để test được.
// ============================================================================
import type { Grade, Question, StudyMode } from '../../types';
import type { Level, ReviewItem, SkillDef, SkillState, StudyProgress, Term } from './types';
import { SKILLS, SKILL_MAP } from './catalog';
import { compactQuestion } from './compact';
import { questionKey } from './session';

export const DAY = 86_400_000;
export const REVIEW_STEPS_DAYS = [1, 3, 7, 14];
export const MAX_REVIEW = 80;
export const KEEP_DAYS = 60;
const ALPHA = 0.25;

export const localDay = (d: Date | string | number): string => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const emptyProgress = (): StudyProgress => ({ version: 1, skills: {}, review: [], days: {}, streak: { count: 0, last: '' }, prefs: {} });

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const isLevel = (x: unknown): x is Level => x === 1 || x === 2 || x === 3;

/** Làm sạch dữ liệu đọc từ localStorage (bỏ kỹ năng lạ, kẹp số, giới hạn kích thước). */
export function readStudyProgress(raw: unknown): StudyProgress {
    const p = emptyProgress();
    if (!raw || typeof raw !== 'object' || (raw as StudyProgress).version !== 1) return p;
    const r = raw as StudyProgress;
    for (const [id, s] of Object.entries(r.skills || {})) {
        if (!SKILL_MAP.has(id) || !s || typeof s !== 'object') continue;
        const a = Math.max(0, Math.floor(Number(s.a) || 0)), c = Math.max(0, Math.min(a, Math.floor(Number(s.c) || 0)));
        p.skills[id] = { a, c, m: clamp01(Number(s.m) || 0), lvl: isLevel(s.lvl) ? s.lvl : 1, last: typeof s.last === 'string' ? s.last : '' };
    }
    if (Array.isArray(r.review)) p.review = r.review
        .filter(it => it && typeof it.key === 'string' && SKILL_MAP.has(it.skillId) && it.q && typeof it.q.questionText === 'string' && typeof it.due === 'string')
        .map(it => ({ key: it.key, skillId: it.skillId, q: it.q, step: ([0, 1, 2, 3].includes(it.step) ? it.step : 0) as ReviewItem['step'], due: it.due }))
        .slice(0, MAX_REVIEW);
    for (const [d, v] of Object.entries(r.days || {})) if (/^\d{4}-\d\d-\d\d$/.test(d) && v) p.days[d] = { n: Math.max(0, Number(v.n) || 0), c: Math.max(0, Number(v.c) || 0) };
    if (r.streak && typeof r.streak.last === 'string') p.streak = { count: Math.max(0, Math.floor(Number(r.streak.count) || 0)), last: r.streak.last };
    if (typeof r.dailyDone === 'string') p.dailyDone = r.dailyDone;
    if (r.prefs && typeof r.prefs === 'object') p.prefs = { tts: typeof r.prefs.tts === 'boolean' ? r.prefs.tts : undefined, showAdvanced: !!r.prefs.showAdvanced };
    return p;
}

// ---------------------------------------------------------------------------
//  Trạng thái
// ---------------------------------------------------------------------------
export type SkillStatus = 'none' | 'learning' | 'good' | 'mastered';
export function skillStatus(s?: SkillState): SkillStatus {
    if (!s || s.a === 0) return 'none';
    if (s.m >= 0.8 && s.a >= 6) return 'mastered';
    if (s.m < 0.5) return 'learning';
    return 'good';
}
export const STATUS_LABEL: Record<SkillStatus, string> = { none: 'Chưa học', learning: 'Đang học', good: 'Khá', mastered: 'Thành thạo' };

/** % thành thạo của topic = trung bình m của các kỹ năng KHÔNG nâng cao (chưa học tính 0). */
export function topicMastery(p: StudyProgress, skills: SkillDef[]): number {
    const basic = skills.filter(s => !s.advanced);
    const list = basic.length ? basic : skills;
    if (!list.length) return 0;
    return list.reduce((sum, s) => sum + (p.skills[s.id]?.m ?? 0), 0) / list.length;
}
export const levelFor = (p: StudyProgress, skillId: string): Level | undefined => p.skills[skillId]?.lvl;

// ---------------------------------------------------------------------------
//  Ghi nhận một phiên
// ---------------------------------------------------------------------------
export interface AnswerRecord {
    q: Question;
    /** đúng ngay lần đầu */ firstTry: boolean;
    /** đúng (kể cả sau khi thử lại) */ correct: boolean;
}
export interface SessionOutcome { progress: StudyProgress; masteredNow: string[]; reviewCleared: number; firstTryCorrect: number }

const levelsOf = (skillId: string): Level[] => SKILL_MAP.get(skillId)?.levels ?? [1];
const capReview = (items: ReviewItem[]) => (items.length <= MAX_REVIEW ? items : [...items].sort((a, b) => a.due.localeCompare(b.due)).slice(0, MAX_REVIEW));

export function applySession(prev: StudyProgress, records: AnswerRecord[], mode: StudyMode, now: Date = new Date()): SessionOutcome {
    const p: StudyProgress = { ...prev, skills: { ...prev.skills }, review: [...prev.review], days: { ...prev.days }, streak: { ...prev.streak }, prefs: { ...prev.prefs } };
    const nowIso = now.toISOString(), today = localDay(now);
    const before = new Set(Object.entries(p.skills).filter(([, s]) => skillStatus(s) === 'mastered').map(([id]) => id));
    const streakBySkill = new Map<string, number>();
    let reviewCleared = 0, firstTryCorrect = 0;

    for (const r of records) {
        const skillId = r.q.skillId;
        const score = r.firstTry ? 1 : r.correct ? 0.5 : 0;
        if (r.firstTry) firstTryCorrect++;
        if (skillId && SKILL_MAP.has(skillId)) {
            const s0: SkillState = p.skills[skillId] ?? { a: 0, c: 0, m: 0, lvl: levelsOf(skillId)[0], last: '' };
            const s: SkillState = { ...s0, a: s0.a + 1, c: s0.c + (score === 1 ? 1 : 0), m: clamp01(s0.m + ALPHA * (score - s0.m)), last: nowIso };
            // mức gợi ý: 2 câu đúng ngay liên tiếp → lên 1 mức; sai → xuống 1 mức
            const lv = levelsOf(skillId), run = score === 1 ? (streakBySkill.get(skillId) ?? 0) + 1 : 0;
            streakBySkill.set(skillId, run >= 2 ? 0 : run);
            const cur = lv.includes(s.lvl) ? s.lvl : lv[0];
            if (score === 0) s.lvl = lv[Math.max(0, lv.indexOf(cur) - 1)];
            else if (run >= 2) s.lvl = lv[Math.min(lv.length - 1, lv.indexOf(cur) + 1)];
            else s.lvl = cur;
            p.skills[skillId] = s;
        }
        // ôn câu sai
        if (!skillId || !SKILL_MAP.has(skillId)) continue;
        const key = questionKey(r.q);
        const idx = p.review.findIndex(it => it.key === key);
        if (mode === 'review' && idx >= 0) {
            const it = p.review[idx];
            if (r.firstTry) {
                const step = it.step + 1;
                if (step > 3) { p.review.splice(idx, 1); reviewCleared++; }
                else p.review[idx] = { ...it, step: step as ReviewItem['step'], due: new Date(now.getTime() + REVIEW_STEPS_DAYS[step] * DAY).toISOString() };
            } else p.review[idx] = { ...it, step: 0, due: new Date(now.getTime() + DAY).toISOString() };
        } else if (score === 0) {
            const item: ReviewItem = { key, skillId, q: compactQuestion(r.q), step: 0, due: new Date(now.getTime() + DAY).toISOString() };
            if (idx >= 0) p.review[idx] = item; else p.review.push(item);
        }
    }
    p.review = capReview(p.review);

    // nhật kí ngày
    const d = p.days[today] ?? { n: 0, c: 0 };
    p.days[today] = { n: d.n + records.length, c: d.c + records.filter(r => r.correct).length };
    const keys = Object.keys(p.days).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete p.days[k];

    // chuỗi ngày & "Ôn hôm nay"
    if (mode === 'daily' && records.length > 0 && p.dailyDone !== today) {
        const yesterday = localDay(now.getTime() - DAY);
        p.streak = { count: p.streak.last === yesterday ? p.streak.count + 1 : p.streak.last === today ? p.streak.count : 1, last: today };
        p.dailyDone = today;
    }
    const masteredNow = Object.entries(p.skills).filter(([id, s]) => skillStatus(s) === 'mastered' && !before.has(id)).map(([id]) => id);
    return { progress: p, masteredNow, reviewCleared, firstTryCorrect };
}

/** Chuỗi ngày còn hiệu lực (đã ôn hôm nay hoặc hôm qua). */
export function liveStreak(p: StudyProgress, now: Date = new Date()): number {
    const t = localDay(now), y = localDay(now.getTime() - DAY);
    return p.streak.last === t || p.streak.last === y ? p.streak.count : 0;
}

export const dueReviews = (p: StudyProgress, now: Date = new Date()): ReviewItem[] =>
    p.review.filter(it => it.due <= now.toISOString()).sort((a, b) => a.due.localeCompare(b.due));

// ---------------------------------------------------------------------------
//  Lập kế hoạch phiên
// ---------------------------------------------------------------------------
/** Học kì theo tháng: 9–1 → HK1, 2–5 → HK2, 6–8 → null (ôn cả năm). */
export function currentTerm(now: Date = new Date()): Term | null {
    const m = now.getMonth() + 1;
    if (m >= 9 || m === 1) return 1;
    if (m >= 2 && m <= 5) return 2;
    return null;
}
export const dailyCount = (grade: Grade): number => (grade === 0 ? 6 : grade === 1 ? 8 : 10);

/** Kỹ năng luyện được (có template), không nâng cao, đúng lớp, theo thứ tự catalog. */
export function practicableSkills(grade: Grade, available: (id: string) => boolean, term: Term | null = null): SkillDef[] {
    return SKILLS.filter(s => s.grade === grade && !s.advanced && !s.legacy && available(s.id) && (term === null || s.term === term));
}

export interface DailyPlan { review: ReviewItem[]; picks: { skillId: string; level?: Level; count: number }[]; count: number }

export function dailyPlan(p: StudyProgress, grade: Grade, available: (id: string) => boolean, now: Date = new Date()): DailyPlan {
    const count = dailyCount(grade);
    const review = dueReviews(p, now).slice(0, Math.floor(count * 0.4));
    let left = count - review.length;
    const term = currentTerm(now);
    const pool = practicableSkills(grade, available, term);
    const all = pool.length ? pool : practicableSkills(grade, available);
    const started = all.filter(s => p.skills[s.id]?.a);
    const weak = started.filter(s => skillStatus(p.skills[s.id]) !== 'mastered')
        .sort((a, b) => (p.skills[a.id].m - p.skills[b.id].m) || p.skills[a.id].last.localeCompare(p.skills[b.id].last));
    const picks: DailyPlan['picks'] = [];
    const add = (s: SkillDef, n: number, level?: Level) => {
        if (n <= 0) return;
        const ex = picks.find(x => x.skillId === s.id);
        if (ex) ex.count += n; else picks.push({ skillId: s.id, count: n, level: level ?? p.skills[s.id]?.lvl });
        left -= n;
    };
    const weakSlots = Math.min(left, Math.round(count * 0.4));
    weak.slice(0, weakSlots).forEach((s, i, arr) => add(s, Math.floor(weakSlots / arr.length) + (i < weakSlots % arr.length ? 1 : 0)));
    const next = all.find(s => !p.skills[s.id]?.a);
    if (next) add(next, Math.min(left, Math.max(1, Math.round(count * 0.2))), SKILL_MAP.get(next.id)?.levels[0]);
    // phần còn lại: kỹ năng đã học (ưu tiên lâu chưa ôn), hồ sơ mới thì 3 kỹ năng đầu
    const rest = started.length ? [...started].sort((a, b) => p.skills[a.id].last.localeCompare(p.skills[b.id].last)) : all.slice(0, 3);
    for (let i = 0; left > 0 && rest.length; i++) add(rest[i % rest.length], 1);
    if (left > 0 && all.length) for (let i = 0; left > 0; i++) add(all[i % all.length], 1);
    return { review, picks, count };
}

export const MATRIX_RATIO: [number, number, number] = [5, 3, 2];

/** Đề kiểm tra theo ma trận: tỉ lệ M1:M2:M3, chia theo mạch tỉ lệ số kỹ năng, mỗi mạch ≥ 1 câu. */
export function matrixPlan(grade: Grade, term: Term | 'all', count: number, available: (id: string) => boolean, rnd: () => number = Math.random): { skillId: string; level: Level; count: number }[] {
    const skills = practicableSkills(grade, available, term === 'all' ? null : term);
    if (!skills.length) return [];
    const strands = [...new Set(skills.map(s => s.strand))];
    const per = new Map<string, number>(strands.map(st => [st, 1]));
    let remaining = count - strands.length;
    const weights = strands.map(st => skills.filter(s => s.strand === st).length);
    const totalW = weights.reduce((a, b) => a + b, 0);
    strands.forEach((st, i) => { const extra = Math.floor(Math.max(0, remaining) * weights[i] / totalW); per.set(st, per.get(st)! + extra); });
    remaining = count - [...per.values()].reduce((a, b) => a + b, 0);
    for (let i = 0; remaining > 0; i++, remaining--) { const st = strands[i % strands.length]; per.set(st, per.get(st)! + 1); }
    // slot kỹ năng xoay vòng trong mạch
    const slots: string[] = [];
    for (const st of strands) {
        const ss = skills.filter(s => s.strand === st);
        for (let k = 0; k < per.get(st)!; k++) slots.push(ss[k % ss.length].id);
    }
    // túi mức độ theo tỉ lệ 5:3:2
    const sum = MATRIX_RATIO.reduce((a, b) => a + b, 0);
    const n1 = Math.round(count * MATRIX_RATIO[0] / sum), n2 = Math.round(count * MATRIX_RATIO[1] / sum), n3 = Math.max(0, count - n1 - n2);
    const bag: Level[] = [...Array(n1).fill(1), ...Array(n2).fill(2), ...Array(n3).fill(3)];
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    return slots.slice(0, count).map((skillId, i) => ({ skillId, level: bag[i] ?? 1, count: 1 }));
}
