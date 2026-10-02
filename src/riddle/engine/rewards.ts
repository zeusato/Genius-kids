import type { Riddle, RiddleLevel } from '../content/types';

/** Mọi con số phần thưởng ở một chỗ (docs/riddle-remake-plan.md mục 4.6). Không có phạt. */
export const REWARDS = {
    sealsPerStar: 3,
    maxRoundStars: 5,
    dailyBonus: 2,
    duplicateCardStars: 10,
    reviewDays: [1, 3, 7],
    ratingUp: 0.15,
    ratingDown: 0.2,
} as const;

export function roundStars(firstTimeSeals: number): number {
    return Math.min(REWARDS.maxRoundStars, Math.ceil(firstTimeSeals / REWARDS.sealsPerStar));
}

/** Đổi sang thông số thành tích cũ (riddles_solved_category / _difficulty). */
export const legacyCategory = (r: Pick<Riddle, 'lang'>) => (r.lang === 'en' ? 'en_riddle' : 'vn_riddle');
export const legacyDifficulty = (level: RiddleLevel) => (['easy', 'medium', 'hard'] as const)[level - 1];
