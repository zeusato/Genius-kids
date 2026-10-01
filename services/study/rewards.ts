// Phần thưởng Ôn Luyện (docs/study-wow-plan.md GĐ3.8). Thuần; StudyPage gọi rồi mới chạy gacha.
import type { StudyMode } from '../../types';
import { calculateTestStars } from '../rewardService';

export interface SessionRewardInput { mode: StudyMode; total: number; score: number; firstTryCorrect: number; masteredNow: number; reviewCleared: number }
export interface SessionReward { stars: number; allowGacha: boolean }

export function sessionReward(i: SessionRewardInput): SessionReward {
    if (i.total < 5) return { stars: 0, allowGacha: false };
    if (i.mode === 'test' || i.mode === 'matrix') return i.total >= 10 ? { stars: calculateTestStars(i.score, i.total), allowGacha: true } : { stars: 0, allowGacha: false };
    if (i.mode === 'review') return { stars: Math.floor(i.reviewCleared / 5), allowGacha: false };
    const base = Math.min(3, Math.floor(i.firstTryCorrect / 4)) + 2 * i.masteredNow;
    return i.mode === 'daily' ? { stars: base + 2, allowGacha: true } : { stars: base, allowGacha: false };
}
