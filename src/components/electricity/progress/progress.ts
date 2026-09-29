import type { StudentProfile } from '../../../../types';
import { CONTENT, ContentSpec } from '../../../data/electricity/content';
import { earnedTier, Run } from '../engine/evidence';
export interface ElectricityProgress {
    schema: 1;
    revision: number;
    completions: Record<string, {
        completedAt: string;
        contentVersion: number;
        best: 1 | 2 | 3;
        evidence: string[];
    }>;
    awards: Record<string, {
        stars: number;
        awardedAt: string;
        source: 'lesson' | 'mission' | 'fault' | 'badge';
    }>;
    badges: string[];
    counters: {
        fixedFaultIds: string[];
        sortedObjectIds: string[];
        drawnPresetIds: string[];
    };
    legacy?: {
        snapshotId: string;
        lessonIds: number[];
        challengeIds: string[];
        importedAt: string;
    };
    introDone?: boolean;
}
export const emptyProgress = (): ElectricityProgress => ({ schema: 1, revision: 0, completions: {}, awards: {}, badges: [], counters: { fixedFaultIds: [], sortedObjectIds: [], drawnPresetIds: [] } });
export interface ProgressIO {
    readProfiles: () => StudentProfile[];
    writeProfiles: (p: StudentProfile[]) => void;
    isOwner: () => boolean;
    onSaved: (p: StudentProfile[]) => void;
    lock?: <T>(fn: () => T) => Promise<T>;
}
export interface CompletionResult {
    ok: boolean;
    earned: number;
    pending?: boolean;
    message?: string;
}
const locked = <T,>(io: ProgressIO, fn: () => T): Promise<T> => io.lock ? io.lock(fn) : typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('genius-electricity-profiles', fn) : Promise.reject(new Error('Trình duyệt chưa hỗ trợ khóa lưu tiến độ.'));
export async function completeElectricity(owner: string, run: Run, io: ProgressIO): Promise<CompletionResult> {
    try {
        return await locked(io, () => {
            if (!io.isOwner() || run.ownerId !== owner || owner === 'guest')
                return { ok: false, earned: 0, message: 'Hồ sơ đã thay đổi.' };
            const spec = CONTENT.find(c => c.id === run.contentId);
            if (!spec)
                return { ok: false, earned: 0 };
            const tier = earnedTier(spec, run);
        if (!tier || run.step!==run.milestones.length || run.milestones.some((m, i) => m.id !== spec.steps[i]?.id) || run.done !== (run.milestones.length === spec.steps.length))
                return { ok: false, earned: 0 };
            const profiles = io.readProfiles(), index = profiles.findIndex(p => p.id === owner);
            if (index < 0)
                return { ok: false, earned: 0 };
            const profile = { ...profiles[index] }, progress: ElectricityProgress = structuredClone(profile.electricity ?? emptyProgress()), now = new Date().toISOString();
            let earned = 0;
            const award = (id: string, stars: number, source: 'lesson' | 'mission' | 'fault' | 'badge') => { if (progress.awards[id])
                return; progress.awards[id] = { stars, source, awardedAt: now }; earned += stars; };
            const completionKey = `${spec.kind}:${spec.id}`, old = progress.completions[completionKey];
            progress.completions[completionKey] = { completedAt: old?.completedAt ?? now, contentVersion: spec.revision, best: Math.max(old?.best ?? 0, tier) as 1 | 2 | 3, evidence: [...new Set([...(old?.evidence ?? []), ...run.milestones.map(m => m.id)])] };
            if (spec.kind === 'mission') {
                for (let i = 1; i <= tier; i++)
                    award(`electricity:mission:${spec.id}:tier:${i}`, 1, 'mission');
            }
            else
                award(`electricity:${spec.kind}:${spec.id}:complete`, 1, spec.kind);
            if (spec.id === 'L03-firstLight')
                progress.introDone = true;
            if (spec.kind === 'fault' && run.done)
                progress.counters.fixedFaultIds = [...new Set([...progress.counters.fixedFaultIds, spec.id])];
            if (spec.id === 'L07-conductors' && run.done)
                progress.counters.sortedObjectIds = [...(run.activity.tested as string[] ?? [])];
            if (spec.id === 'L08-schematic' && run.done)
                progress.counters.drawnPresetIds = ['single', 'switch', 'doorbell'];
            const badge = (id: string, yes: boolean) => { if (!yes)
                return; progress.badges = [...new Set([...progress.badges, id])]; award(`electricity:badge:${id}`, 10, 'badge'); };
            badge('firstLight', !!progress.completions['lesson:L03-firstLight']);
            badge('sorter', !!progress.completions['lesson:L07-conductors']);
            badge('designer', !!progress.completions['lesson:L08-schematic']);
            badge('detective', progress.counters.fixedFaultIds.length === 12);
            badge('inventor', CONTENT.filter(c => c.kind === 'mission').every(c => (progress.completions[`mission:${c.id}`]?.best ?? 0) >= 2));
            badge('energyKeeper', !!progress.completions['lesson:L12-saveAtHome']);
            badge('explorer', CONTENT.filter(c => c.kind === 'lesson').every(c => !!progress.completions[`lesson:${c.id}`]));
            progress.revision++;
            profile.electricity = progress;
            profile.electricityBadges = progress.badges;
            profile.stars += earned;
            profiles[index] = profile;
            io.writeProfiles(profiles);
            io.onSaved(profiles);
            return { ok: true, earned };
        });
    }
    catch {
        return { ok: false, earned: 0, pending: true, message: 'Chưa lưu được tiến độ. Giữ trang này và thử lại.' };
    }
}
export interface LegacyArchive {
    schema: 1;
    snapshotId: string;
    lessonIds: number[];
    challengeIds: string[];
    raw: Record<string, string | null>;
    claimedOwner?: string;
}
export function archiveLegacy(storage: Pick<Storage, 'getItem' | 'setItem'>): LegacyArchive {
    const existing = storage.getItem('electricity_legacy_archive_v1');
    if (existing) {
        try {
            const parsed=JSON.parse(existing);
            if(parsed?.schema!==1||typeof parsed.snapshotId!=='string'||!Array.isArray(parsed.lessonIds)||!Array.isArray(parsed.challengeIds)||!parsed.raw)throw new Error('Invalid legacy archive');
            return parsed;
        }
        catch { /* Preserve malformed archive under another key before replacement. */
            storage.setItem('electricity_legacy_archive_v1_corrupt', existing);
        }
    }
    const raw = { electricity_completed_lessons: storage.getItem('electricity_completed_lessons'), electricity_completed_challenges: storage.getItem('electricity_completed_challenges') };
    const parse = (v: string | null): unknown[] => { try {
        const a = JSON.parse(v ?? '[]');
        return Array.isArray(a) ? a : [];
    }
    catch {
        return [];
    } };
    const lessonIds = [...new Set(parse(raw.electricity_completed_lessons).filter((v): v is number => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 8))].sort();
    const challengeIds = [...new Set(parse(raw.electricity_completed_challenges).filter((v): v is string => typeof v === 'string' && /^(e[1-5]|m[1-6]|h[1-4])$/.test(v)))].sort();
    let hash = 2166136261;
    for (const char of JSON.stringify(raw))
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const archive: LegacyArchive = { schema: 1, snapshotId: `legacy-${(hash >>> 0).toString(16)}`, lessonIds, challengeIds, raw };
    storage.setItem('electricity_legacy_archive_v1', JSON.stringify(archive));
    if(storage.getItem('electricity_legacy_archive_v1')!==JSON.stringify(archive))throw new Error('Chưa xác nhận được bản sao tiến độ cũ.');
    return archive;
}
export async function claimLegacy(owner: string, archive: LegacyArchive, io: ProgressIO): Promise<CompletionResult> { try {
    return await locked(io, () => { if (!io.isOwner() || archive.claimedOwner)
        return { ok: false, earned: 0 }; const profiles = io.readProfiles(); if (profiles.some(p => p.electricity?.legacy?.snapshotId === archive.snapshotId))
        return { ok: false, earned: 0 }; const i = profiles.findIndex(p => p.id === owner); if (i < 0)
        return { ok: false, earned: 0 }; const electricity = structuredClone(profiles[i].electricity ?? emptyProgress()); electricity.legacy = { snapshotId: archive.snapshotId, lessonIds: archive.lessonIds, challengeIds: archive.challengeIds, importedAt: new Date().toISOString() }; electricity.revision++; profiles[i] = { ...profiles[i], electricity }; io.writeProfiles(profiles); io.onSaved(profiles); return { ok: true, earned: 0 }; });
}
catch {
    return { ok: false, earned: 0, pending: true };
} }
