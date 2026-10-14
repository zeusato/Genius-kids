import { applySession, readStudyProgress } from '../../../services/study/progress';
import { mathQuestion } from '../engine/mathQuestion';
import type { StudentProfile } from '../../../types';
import { processGameReward } from '../../../services/rewardService';
import type { CompletionDetail, ColoringProgress } from '../model';
export const localDay = () => new Date().toLocaleDateString('en-CA');
export function persistColoring(profiles: StudentProfile[], owner: string, id: string, write: (p: StudentProfile[]) => void, detail?: CompletionDetail) {
    const index = profiles.findIndex(p => p.id === owner), fail = { ok: false, profiles, earned: 0 };
    if (index < 0 || !id || id.length > 120)
        return fail;
    const old = profiles[index], progress: ColoringProgress = old.coloring || { version: 1, completed: [], badges: [] }, paintingComplete = detail?.paintingComplete !== false, first = paintingComplete && !progress.completed.includes(id), day = localDay(), bonus = paintingComplete && !!detail?.daily && progress.daily !== day;
    const completed = first ? [...progress.completed, id] : progress.completed, badges = [...progress.badges], add = (test: boolean, badge: string) => { if (test && !badges.includes(badge))
        badges.push(badge); };
    for (const [n, b] of [[1, 'Bức tranh đầu tiên'], [5, 'Hộp màu nhỏ'], [20, 'Họa sĩ chăm chỉ'], [40, 'Triển lãm sắc màu']] as const)
        add(completed.length >= n, b);
    if (detail) {
        add(detail.colors >= 12, 'Họa sĩ cầu vồng');
        add(detail.patterns >= 5, 'Nhà hoa văn');
        add(detail.regions >= 100, 'Kiên nhẫn');
        add(!!detail.bookPages?.length && detail.bookPages.every(p => completed.includes(p)), 'Nhà sưu tầm');
        add(detail.mode === 'number' && detail.total > 0 && detail.correct === detail.total, 'Tô theo số không sai');
    }
    const recordId = `coloring:${id}:${detail?.mode}`, newGame = !!detail && detail.mode !== 'free' && detail.total > 0 && !(old.gameHistory || []).some(r => r.id === recordId);
    const earned = (first ? (detail?.tier === 'hard' ? 3 : detail?.tier === 'medium' ? 2 : 1) : 0) + (bonus ? 1 : 0), medals = { ...progress.medals }, accuracy = detail && detail.total ? detail.correct / detail.total : 0;
    if (detail && detail.mode !== 'free' && detail.total) {
        const medal = accuracy >= .9 ? 'gold' : accuracy >= .6 ? 'silver' : 'bronze', rank = { bronze: 1, silver: 2, gold: 3 };
        if (rank[medal] > (rank[medals[detail.mode]!] || 0))
            medals[detail.mode] = medal;
    }
    if (!newGame && !earned && badges.length === progress.badges.length && JSON.stringify(medals) === JSON.stringify(progress.medals || {}))
        return { ...fail, ok: true };
    const reward = earned ? processGameReward({ ...old, ownedImageIds: old.ownedImageIds || [] }, 'bronze', earned) : { updatedProfile: old, reward: { image: null } };
    const updated: StudentProfile = { ...reward.updatedProfile, coloring: { version: 1, completed, badges, last: id, daily: bonus ? day : progress.daily, medals } };
    if (newGame && detail)
        updated.gameHistory = [...(old.gameHistory || []), { id: recordId, date: new Date().toISOString(), gameType: 'coloring-' + detail.mode, score: detail.correct, maxScore: detail.total, durationSeconds: 0, starsEarned: earned, difficulty: detail.tier }];
    if (newGame && detail?.mode === 'math' && detail.math?.length)
        updated.study = applySession(readStudyProgress(old.study), detail.math.map(r => ({ q: mathQuestion(r.answer, old.grade, r.region), firstTry: r.firstTry, correct: true })), 'practice').progress;
    const next = profiles.map((p, i) => i === index ? updated : p);
    try {
        write(next);
        return { ok: true, profiles: next, earned, imageName: reward.reward.image?.name };
    }
    catch {
        return fail;
    }
}
