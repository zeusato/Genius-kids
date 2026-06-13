import { useCallback } from 'react';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { processGameReward } from '@/services/rewardService';
import type { GameResult } from '@/types';

/**
 * Trao thưởng cho 1 lượt hoạt động mầm non — dùng đúng luồng sao/gacha/achievement
 * như các game khác (theo yêu cầu giữ nguyên hệ sao cho Mầm non).
 * Trả về số sao nhận được.
 */
export function usePreschoolReward(gameType: string) {
    const { currentStudent } = useStudent();
    const { addGameResult, setGachaResult } = useStudentActions();

    return useCallback((score: number, maxScore: number): number => {
        if (!currentStudent) return 0;
        const pct = maxScore > 0 ? score / maxScore : 0;
        const medal: 'gold' | 'silver' | 'bronze' | null =
            pct >= 0.9 ? 'gold' : pct >= 0.6 ? 'silver' : pct > 0 ? 'bronze' : null;

        const { reward } = processGameReward(currentStudent, medal);

        let gachaImage: any = undefined;
        if (reward.image) {
            const isNew = !currentStudent.ownedImageIds.includes(reward.image.id);
            gachaImage = reward.image;
            setGachaResult({ image: reward.image as any, isNew });
        }

        const result: GameResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            gameType,
            score,
            maxScore,
            starsEarned: reward.stars,
            durationSeconds: 0,
            difficulty: 'easy',
        };
        addGameResult(result, gachaImage);
        return reward.stars;
    }, [currentStudent, addGameResult, setGachaResult, gameType]);
}
