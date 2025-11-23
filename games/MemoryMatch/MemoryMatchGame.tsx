import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Clock, Target } from 'lucide-react';
import { Card } from './Card';
import {
    MemoryCard,
    Difficulty,
    generateMemoryCards,
    checkMatch,
    getMedal
} from '../memoryMatchEngine';
import { soundManager } from '../../utils/sound';

interface MemoryMatchGameProps {
    difficulty: Difficulty;
    onExit: () => void;
    onComplete: (score: number, time: number, moves: number) => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
    difficulty,
    onExit,
    onComplete
}) => {
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedCards, setFlippedCards] = useState<string[]>([]);
    const [matchedCount, setMatchedCount] = useState(0);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);

    // Initialize game
    useEffect(() => {
        setCards(generateMemoryCards(difficulty));
    }, [difficulty]);

    // Timer
    useEffect(() => {
        if (gameComplete) return;

        const timer = setInterval(() => {
            setTime(t => t + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [gameComplete]);

    // Check for game completion
    useEffect(() => {
        const totalPairs = difficulty / 2;
        if (matchedCount === totalPairs && !gameComplete) {
            setGameComplete(true);
            soundManager.playComplete();
        }
    }, [matchedCount, difficulty, gameComplete]);

    const handleCardClick = (cardId: string) => {
        if (isChecking || flippedCards.length >= 2) return;

        const card = cards.find(c => c.id === cardId);
        if (!card || card.isMatched) return;

        // Flip card
        setCards(prevCards =>
            prevCards.map(c =>
                c.id === cardId ? { ...c, isFlipped: true } : c
            )
        );

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        soundManager.playClick();

        // Check for match when 2 cards are flipped
        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            setIsChecking(true);

            const card1 = cards.find(c => c.id === newFlipped[0])!;
            const card2 = cards.find(c => c.id === newFlipped[1])!;

            if (checkMatch(card1, card2)) {
                // Match found!
                soundManager.playCorrect();
                setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map(c =>
                            c.id === card1.id || c.id === card2.id
                                ? { ...c, isMatched: true }
                                : c
                        )
                    );
                    setMatchedCount(m => m + 1);
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 600);
            } else {
                // No match
                soundManager.playWrong();
                setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map(c =>
                            c.id === card1.id || c.id === card2.id
                                ? { ...c, isFlipped: false }
                                : c
                        )
                    );
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 1200);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const totalPairs = difficulty / 2;
    const medal = getMedal(moves, totalPairs, time);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-lg">
                    <button
                        onClick={onExit}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-semibold text-slate-700"
                    >
                        <ArrowLeft size={20} />
                        <span className="hidden sm:inline">Thoát</span>
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={24} />
                            <span className="font-bold text-lg">{matchedCount}/{totalPairs}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Target className="text-blue-500" size={24} />
                            <span className="font-bold text-lg">{moves}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="text-green-500" size={24} />
                            <span className="font-bold text-lg">{formatTime(time)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Grid - Smaller cards with more columns */}
            <div className="max-w-6xl mx-auto">
                <div className={`grid gap-3 ${difficulty === Difficulty.Easy ? 'grid-cols-4 sm:grid-cols-6' :
                    difficulty === Difficulty.Medium ? 'grid-cols-5 sm:grid-cols-7' :
                        'grid-cols-6 sm:grid-cols-8'
                    }`}>
                    {cards.map(card => (
                        <Card
                            key={card.id}
                            card={card}
                            onClick={() => handleCardClick(card.id)}
                            isDisabled={isChecking}
                        />
                    ))}
                </div>
            </div>

            {/* Game Complete Modal */}
            {gameComplete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-500">
                        <div className="text-center">
                            <div className="text-6xl mb-4 animate-bounce">
                                {medal.type === 'gold' && '🥇'}
                                {medal.type === 'silver' && '🥈'}
                                {medal.type === 'bronze' && '🥉'}
                                {medal.type === 'none' && '⭐'}
                            </div>

                            <h2 className="text-3xl font-bold text-slate-800 mb-2">
                                {medal.message}
                            </h2>

                            <div className="space-y-3 my-6">
                                <div className="flex justify-between text-lg">
                                    <span className="text-slate-600">Số nước:</span>
                                    <span className="font-bold text-slate-800">{moves}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span className="text-slate-600">Thời gian:</span>
                                    <span className="font-bold text-slate-800">{formatTime(time)}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span className="text-slate-600">Cặp ghép:</span>
                                    <span className="font-bold text-slate-800">{totalPairs}/{totalPairs}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onComplete(1000 - moves * 10, time, moves)}
                                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
                            >
                                Hoàn thành
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
