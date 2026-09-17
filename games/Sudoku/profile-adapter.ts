import type { AlbumImage, StudentProfile, GameResult, AchievementProgress } from '../../types';
import { checkAchievements, initializeStats, updateStats } from '../../services/achievementService';
import { processGameReward } from '../../services/rewardService';
import { isSolved, validDraft, type SudokuDraft } from './persistence';
export function persistSudoku(profiles: StudentProfile[], owner: string, s: SudokuDraft, write: (profiles: StudentProfile[]) => void, random = Math.random) {
  const fail = { ok: false, profiles, earned: 0, image: null as AlbumImage | null, isNew: false, unlocked: [] as AchievementProgress[] };
  if (!validDraft(s, owner) || !isSolved(s)) return fail;
  const profile = profiles.find(p => p.id === owner); if (!profile) return fail;
  const previous = profile.gameHistory.find(g => g.id === s.id);
  if (previous) return { ...fail, ok: true, earned: previous.starsEarned };
  const thresholds = { easy: [300, 480], medium: [600, 900], hard: [900, 1200] }[s.difficulty];
  const rating = s.timer < thresholds[0] ? 3 : s.timer < thresholds[1] ? 2 : 1;
  const earned = { easy: [0, 1, 2, 3], medium: [0, 2, 3, 5], hard: [0, 4, 6, 10] }[s.difficulty][rating];
  const image = rating === 3 && random() < { easy: .2, medium: .3, hard: .5 }[s.difficulty] ? processGameReward(profile, 'gold', 0).reward.image : null;
  const isNew = !!image && !profile.ownedImageIds.includes(image.id);
  const result: GameResult = { id: s.id, date: s.updatedAt, gameType: 'sudoku', difficulty: s.difficulty, score: Math.max(0, 810 - s.timer), maxScore: 810, starsEarned: earned, durationSeconds: s.timer };
  const stats = updateStats(structuredClone(profile.stats || initializeStats(profile)), { type: 'GAME_COMPLETE', gameResult: result });
  const updated = { ...profile, achievements: structuredClone(profile.achievements || []), gameHistory: [...profile.gameHistory, result], stars: profile.stars + earned, ownedImageIds: [...profile.ownedImageIds], stats };
  if (image) {
    if (isNew) { updated.ownedImageIds.push(image.id); updated.stats = updateStats(stats, { type: 'GAIN_CARD', isLegendary: image.rarity === 'legendary', isNew: true, totalCards: updated.ownedImageIds.length }); }
    else updated.stars += 10;
  }
  const achievements = checkAchievements(updated); updated.achievements = achievements.updatedAchievements; updated.stars += achievements.rewards;
  const next = profiles.map(p => p.id === owner ? updated : p);
  try { write(next); return { ok: true, profiles: next, earned, image, isNew, unlocked: achievements.unlocked }; } catch { return fail; }
}
