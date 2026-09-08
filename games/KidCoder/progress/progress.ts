import type { StudentProfile } from '../../../types';
import type { Mission, ProgramNode } from '../engine/model';
import { validateProgram } from '../engine/model';
import { evaluate } from '../engine/runtime';
import { checkAchievements, initializeStats, updateStats } from '../../../services/achievementService';

export interface MissionProgress { badges: string[]; bestBlocks: number; bestActions: number; program: ProgramNode[]; completedAt: string }
export interface KidCoderProgress { version: 2; missions: Record<string, MissionProgress> }
const ALL = ['forward', 'left', 'right', 'scan', 'activate', 'push', 'repeat', 'if'] as const;
const VALID_ID = /^(earth|moon|mars|ice|station)-0[1-8]$/;
export function readProgress(input: unknown): KidCoderProgress {
    const out: KidCoderProgress = { version: 2, missions: {} };
    if (!input || typeof input !== 'object' || !('version' in input) || input.version !== 2 || !('missions' in input) || !input.missions || typeof input.missions !== 'object') return out;
    for (const [id, raw] of Object.entries(input.missions)) {
        if (!VALID_ID.test(id) || !raw || typeof raw !== 'object' || !Array.isArray(raw.badges) || !raw.badges.includes('complete')) continue;
        out.missions[id] = { badges: ['complete', 'explorer', 'coder'].filter(b => raw.badges.includes(b)),
            bestBlocks: Number.isFinite(raw.bestBlocks) ? Math.max(1, raw.bestBlocks) : 48,
            bestActions: Number.isFinite(raw.bestActions) ? Math.max(0, raw.bestActions) : 256,
            program: validateProgram(raw.program, [...ALL]) ? [] : raw.program,
            completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : '' };
    }
    return out;
}
export function completeMission(profile: StudentProfile, mission: Mission, program: ProgramNode[], seconds: number) {
    const judged = evaluate(mission, program);
    if (!judged.success || mission.practice || !VALID_ID.test(mission.id)) return { profile, earned: 0, unlocked: [], changed: false, accepted: false };
    const progress = readProgress(profile.kidCoder), old = progress.missions[mission.id];
    const badges = [...new Set([...(old?.badges || []), ...judged.badges])];
    const earned = badges.length - (old?.badges.length || 0);
    if (old && earned === 0 && judged.blocks >= old.bestBlocks && judged.actions >= old.bestActions) return { profile, earned: 0, unlocked: [], changed: false, accepted: true };
    const completedAt = old?.completedAt || new Date().toISOString();
    progress.missions[mission.id] = { badges, bestBlocks: Math.min(old?.bestBlocks ?? Infinity, judged.blocks), bestActions: Math.min(old?.bestActions ?? Infinity, judged.actions),
        program: old && old.bestBlocks <= judged.blocks ? old.program : structuredClone(program), completedAt };
    const resultId = `kidcoder-v2:${profile.id}:${mission.id}`;
    const duration = Math.max(0, Math.min(86400, Math.round(Number.isFinite(seconds) ? seconds : 0)));
    const previousEntry = profile.gameHistory.find(g => g.id === resultId);
    const starAwards = previousEntry?.starAwards || (old ? [{ date: completedAt, amount: old.badges.length }] : []);
    const entry = { id: resultId, date: completedAt, gameType: 'kidcoder', difficulty: `v2:${mission.id}`, score: 100, maxScore: 100, durationSeconds: duration, starsEarned: badges.length,
        starAwards: [...starAwards, ...(earned ? [{ date: new Date().toISOString(), amount: earned }] : [])] };
    const previousStats = structuredClone(profile.stats || initializeStats(profile));
    const stats = old ? { ...previousStats, totalStarsEarned: previousStats.totalStarsEarned + earned } : updateStats(previousStats, { type: 'GAME_COMPLETE', gameResult: { ...entry, starsEarned: earned } });
    const updated: StudentProfile = { ...profile, kidCoder: progress, stars: profile.stars + earned, stats,
        gameHistory: [...profile.gameHistory.filter(g => g.id !== resultId), entry] };
    const achievements = checkAchievements(updated);
    updated.achievements = achievements.updatedAchievements; updated.stars += achievements.rewards;
    return { profile: updated, earned, unlocked: achievements.unlocked, changed: true, accepted: true };
}

/** Publish one durable snapshot; failed writes never advance the in-memory reward ledger. */
export function persistMission(profiles: StudentProfile[], studentId: string, mission: Mission, program: ProgramNode[], seconds: number, write: (profiles: StudentProfile[]) => void) {
    const profile=profiles.find(p=>p.id===studentId);
    const failed={ok:false,earned:0,profiles,unlocked:[]};
    if(!profile)return failed;
    const result=completeMission(profile,mission,program,seconds);
    if(!result.accepted)return failed;
    if(!result.changed)return {ok:true,earned:0,profiles,unlocked:[]};
    const next=profiles.map(p=>p.id===studentId?result.profile:p);
    try {write(next);} catch {return failed;}
    return {ok:true,earned:result.earned,profiles:next,unlocked:result.unlocked};
}

export function readDraft(studentId: string, mission: Mission): ProgramNode[] | null {
    try {
        const data = JSON.parse(localStorage.getItem(`kidcoder-drafts:${studentId}`) || '{}');
        const draft = data[`${mission.id}:${mission.seed ?? 'campaign'}`];
        return draft && draft.version === 2 && !validateProgram(draft.program, mission.allowed, true) ? draft.program : null;
    } catch { return null; }
}
export function saveDraft(studentId: string, mission: Mission, program: ProgramNode[]): boolean {
    try {
        if (validateProgram(program, mission.allowed, true)) return false;
        let data: Record<string, unknown> = {};
        try { const raw = JSON.parse(localStorage.getItem(`kidcoder-drafts:${studentId}`) || '{}'); if (raw && typeof raw === 'object' && !Array.isArray(raw)) data = raw; } catch { /* Recover only this game's malformed draft. */ }
        const id = `${mission.id}:${mission.seed ?? 'campaign'}`;
        delete data[id]; data[id] = { version: 2, program };
        data = Object.fromEntries(Object.entries(data).slice(-8));
        localStorage.setItem(`kidcoder-drafts:${studentId}`, JSON.stringify(data)); return true;
    } catch { return false; }
}
