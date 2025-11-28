import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { GamesMenu } from '@/games/GamesMenu';
import { processGameReward } from '@/services/rewardService';
import { GameResult } from '@/types';

export function GamePage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { addGameResult, setGachaResult } = useStudentActions();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleGameComplete = (gameId: string, score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => {
        const { reward } = processGameReward(currentStudent, medal);

        // Create game result entry
        const gameResult: GameResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            gameType: gameId,
            score,
            maxScore,
            starsEarned: reward.stars,
            durationSeconds: 0, // Games don't track time
            difficulty: 'easy' // Default or passed from game
        };

        let gachaImage: any = undefined;
        if (reward.image) {
            const isNew = !currentStudent.ownedImageIds.includes(reward.image.id);
            gachaImage = reward.image;
            setGachaResult({ image: reward.image as any, isNew });
        }

        addGameResult(gameResult, gachaImage);
    };

    const handleBack = () => {
        navigate('/mode');
    };

    return <GamesMenu onBack={handleBack} onGameComplete={handleGameComplete} />;
}
