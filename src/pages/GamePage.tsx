import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { GamesMenu } from '@/games/GamesMenu';
import { processGameReward } from '@/services/rewardService';
import { GameResult } from '@/types';

export function GamePage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent, setGachaResult } = useStudentActions();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleGameComplete = (gameId: string, score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => {
        const { updatedProfile, reward } = processGameReward(currentStudent, medal);

        // Create game result entry
        const gameResult: GameResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            gameType: gameId,
            score,
            maxScore,
            starsEarned: reward.stars,
            durationSeconds: 0 // Games don't track time
        };

        // Add to gameHistory
        const profileWithHistory = {
            ...updatedProfile,
            gameHistory: [...updatedProfile.gameHistory, gameResult]
        };

        if (reward.image) {
            const isNew = !currentStudent.ownedImageIds.includes(reward.image.id);
            setGachaResult({ image: reward.image as any, isNew });
        }

        updateStudent(profileWithHistory);
    };

    const handleBack = () => {
        navigate('/mode');
    };

    return <GamesMenu onBack={handleBack} onGameComplete={handleGameComplete} />;
}
