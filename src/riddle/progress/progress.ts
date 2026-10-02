import type { AchievementProgress, AlbumImage, StudentProfile } from '../../../types';
import { checkAchievements, initializeStats, updateStats } from '../../../services/achievementService';
import { gachaImage } from '../../../services/albumService';
import type { GateId, Riddle } from '../content/types';
import { GATES, GATE_STONES } from '../content/gates';
import { gateStones, langOf, localDay } from '../engine/planner';
import type { RoundState } from '../engine/round';
import { REWARDS, legacyCategory, legacyDifficulty, roundStars } from '../engine/rewards';
import { MAX_RECENT, MAX_REVIEW, readProgress, type RiddleProgress, type RiddleSettings } from './model';

export type RiddleAction =
    | { type: 'round'; round: RoundState }
    | { type: 'settings'; settings: Partial<RiddleSettings> }
    | { type: 'asked'; count: number }
    /** Đố hình: tối đa 3 sao mỗi lượt, chống ghi trùng theo id. */
    | { type: 'bonus'; id: string; stars: number };

export interface RiddleDeps { pool: Riddle[]; legacyIds?: string[] | null; now?: Date }

export interface RiddleOutcome {
    accepted: boolean;
    changed: boolean;
    profile: StudentProfile;
    earned: number;
    firstTime: string[];
    gatesOpened: GateId[];
    image: AlbumImage | null;
    isNew: boolean;
    dailyBonus: number;
    unlocked: AchievementProgress[];
}

/** Nhập tiến độ bản cũ (sphinx_profile_<id>.answeredRiddleIds) vào mô hình mới. */
export function importLegacy(progress: RiddleProgress, ids: string[], pool: Riddle[], now: Date): RiddleProgress {
    const known = new Set(pool.map(r => r.id));
    const p = structuredClone(progress);
    for (const id of new Set(ids)) {
        if (typeof id !== 'string') continue;
        if (known.has(id)) { if (!p.solved[id]) p.solved[id] = { at: now.toISOString(), seals: 3, mode: 'type', legacy: true }; }
        else if (!p.legacySolved.includes(id)) p.legacySolved.push(id);
    }
    // Cổng đã đủ đá từ tiến độ cũ được mở luôn, không phát thưởng hàng loạt.
    for (const g of GATES) if (!p.gates[g.id] && gateStones(p, g.id, pool) >= GATE_STONES) p.gates[g.id] = { opened: now.toISOString() };
    return p;
}

export function currentProgress(profile: StudentProfile, deps: Pick<RiddleDeps, 'pool' | 'legacyIds' | 'now'>): RiddleProgress {
    const p = readProgress(profile.riddle, profile.grade);
    return !profile.riddle && deps.legacyIds?.length ? importLegacy(p, deps.legacyIds, deps.pool, deps.now ?? new Date()) : p;
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000).toISOString();

export function applyRiddle(profile: StudentProfile, action: RiddleAction, deps: RiddleDeps): RiddleOutcome {
    const now = deps.now ?? new Date();
    const base: RiddleOutcome = { accepted: false, changed: false, profile, earned: 0, firstTime: [], gatesOpened: [], image: null, isNew: false, dailyBonus: 0, unlocked: [] };
    const progress = currentProgress(profile, deps);

    if (action.type === 'settings') {
        progress.settings = { ...progress.settings, ...action.settings };
        return { ...base, accepted: true, changed: true, profile: { ...profile, riddle: progress } };
    }
    if (action.type === 'asked') {
        progress.asked += Math.max(0, Math.min(50, Math.floor(action.count)));
        return { ...base, accepted: true, changed: true, profile: { ...profile, riddle: progress } };
    }

    if (action.type === 'bonus') {
        if (progress.recentRounds.includes(action.id)) return { ...base, accepted: true };
        const stars = Math.max(0, Math.min(3, Math.floor(action.stars)));
        progress.recentRounds = [...progress.recentRounds, action.id].slice(-MAX_RECENT);
        const stats = structuredClone(profile.stats || initializeStats(profile));
        stats.totalStarsEarned = (stats.totalStarsEarned || 0) + stars;
        return { ...base, accepted: true, changed: true, earned: stars, profile: { ...profile, stars: profile.stars + stars, stats, riddle: progress } };
    }

    const round = action.round;
    if (round.owner !== profile.id || round.phase !== 'summary') return base;
    if (progress.recentRounds.includes(round.id)) return { ...base, accepted: true };
    const byId = new Map(deps.pool.map(r => [r.id, r]));
    let stats = structuredClone(profile.stats || initializeStats(profile));
    let firstSeals = 0;
    const firstTime: string[] = [];
    const touched = new Set<GateId>();

    for (const it of round.items) {
        const r = byId.get(it.id);
        if (!r || !it.done) continue;
        touched.add(r.gate);
        const prev = progress.solved[it.id];
        const lang = langOf(r.gate);
        if (!it.revealed) {
            if (!prev || prev.seals === 0) {
                progress.solved[it.id] = { at: now.toISOString(), seals: it.seals, mode: it.mode };
                firstSeals += it.seals; firstTime.push(it.id);
                stats = updateStats(stats, { type: 'SOLVE_RIDDLE', category: legacyCategory(r), difficulty: legacyDifficulty(r.level) });
            } else if (it.seals > prev.seals) progress.solved[it.id] = { ...prev, seals: it.seals };
        } else if (!prev) progress.solved[it.id] = { at: now.toISOString(), seals: 0, mode: it.mode };
        // Ôn lại: câu phải xem đáp án hoặc cần nhiều trợ giúp quay lại sau 1 → 3 → 7 ngày.
        const inReview = progress.review.find(x => x.id === it.id);
        if (it.revealed || it.seals === 1) {
            const misses = (inReview?.misses ?? 0) + 1;
            const due = addDays(now, REWARDS.reviewDays[Math.min(misses, REWARDS.reviewDays.length) - 1]);
            progress.review = [...progress.review.filter(x => x.id !== it.id), { id: it.id, due, misses }].slice(-MAX_REVIEW);
        } else if (inReview) progress.review = progress.review.filter(x => x.id !== it.id);
        const delta = it.revealed ? -REWARDS.ratingDown : it.seals === 3 ? REWARDS.ratingUp : 0;
        progress.rating[lang] = Math.min(3, Math.max(1, Math.round((progress.rating[lang] + delta) * 100) / 100));
    }

    let earned = roundStars(firstSeals);
    let dailyBonus = 0;
    if (round.kind === 'daily') {
        const day = localDay(now), id = round.items[0]?.id;
        const solved = !!round.items[0] && !round.items[0].revealed && round.items[0].done;
        const already = progress.daily?.date === day && progress.daily.done;
        if (id) progress.daily = { date: day, id, done: already || solved };
        if (solved && !already) dailyBonus = REWARDS.dailyBonus;
    }
    earned += dailyBonus;

    let updated: StudentProfile = { ...profile, stars: profile.stars + earned, ownedImageIds: [...profile.ownedImageIds] };
    const gatesOpened: GateId[] = [];
    let image: AlbumImage | null = null, isNew = false;
    for (const g of touched) {
        if (progress.gates[g] || gateStones(progress, g, deps.pool) < GATE_STONES) continue;
        progress.gates[g] = { opened: now.toISOString() };
        gatesOpened.push(g);
        const roll = gachaImage(updated.ownedImageIds);
        if (!roll) continue;
        if (!image) { image = roll.image; isNew = roll.isNew; }
        if (roll.isNew) {
            updated.ownedImageIds.push(roll.image.id);
            stats = updateStats(stats, { type: 'GAIN_CARD', isLegendary: roll.image.rarity === 'legendary', isNew: true, totalCards: updated.ownedImageIds.length });
        } else { updated.stars += REWARDS.duplicateCardStars; earned += REWARDS.duplicateCardStars; }
    }
    stats.totalStarsEarned = (stats.totalStarsEarned || 0) + earned;
    progress.recentRounds = [...progress.recentRounds, round.id].slice(-MAX_RECENT);
    updated = { ...updated, riddle: progress, stats };
    const ach = checkAchievements(updated);
    updated.achievements = ach.updatedAchievements;
    updated.stars += ach.rewards;
    return { accepted: true, changed: true, profile: updated, earned, firstTime, gatesOpened, image, isNew, dailyBonus, unlocked: ach.unlocked };
}


export function persistRiddle(profiles: StudentProfile[], owner: string, action: RiddleAction, write: (p: StudentProfile[]) => void, deps: RiddleDeps) {
    const p = profiles.find(x => x.id === owner);
    const fail = { ok: false, profiles, outcome: null as RiddleOutcome | null };
    if (!p) return fail;
    const outcome = applyRiddle(p, action, deps);
    if (!outcome.accepted) return fail;
    if (!outcome.changed) return { ok: true, profiles, outcome };
    const next = profiles.map(x => (x.id === owner ? outcome.profile : x));
    try { write(next); } catch { return fail; }
    return { ok: true, profiles: next, outcome };
}
