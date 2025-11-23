import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Volume2, Trophy, Target } from 'lucide-react';
import { MemoryButton } from './MemoryButton';
import {
    Difficulty,
    DIFFICULTY_CONFIG,
    BUTTON_COLORS,
    generateSequence,
    playNote
} from './soundEngine';
import { soundManager } from '../../utils/sound';

interface SoundMemoryGameProps {
    difficulty: Difficulty;
    onExit: () => void;
    onComplete: (score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => void;
}

type GameState = 'idle' | 'ready' | 'demo' | 'input' | 'success' | 'fail' | 'complete';

export const SoundMemoryGame: React.FC<SoundMemoryGameProps> = ({
    difficulty,
    onExit,
    onComplete
}) => {
    const config = DIFFICULTY_CONFIG[difficulty];

    const [gameState, setGameState] = useState<GameState>('idle');
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [activeButton, setActiveButton] = useState<number | null>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0); // Track correct answers
    const [score, setScore] = useState(0);
    const [completionMedal, setCompletionMedal] = useState<'gold' | 'silver' | 'bronze' | null>(null);
    const [message, setMessage] = useState('Sẵn sàng thử thách trí nhớ?');

    const sequenceRef = useRef<number[]>([]);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => clearAllTimeouts();
    }, []);

    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach(t => clearTimeout(t));
        timeoutsRef.current = [];
    };

    const prepareQuestion = () => {
        if (questionCount >= config.totalQuestions) {
            setGameState('complete');
            soundManager.playComplete();
            return;
        }

        // If coming from idle (first question), increment count
        if (gameState === 'idle') {
            setQuestionCount(1);
        } else {
            setQuestionCount(prev => prev + 1);
        }

        setGameState('ready');
        setMessage('Bấm nút để nghe giai điệu');
        setUserSequence([]);

        // Generate sequence length based on progress
        // Easy: 3-5, Medium: 4-6, Hard: 5-10
        const currentQ = gameState === 'idle' ? 1 : questionCount + 1;
        const progress = currentQ / config.totalQuestions;
        const lenRange = config.sequenceLength.max - config.sequenceLength.min;
        const length = config.sequenceLength.min + Math.floor(progress * lenRange);

        const newSequence = generateSequence(length, config.gridSize);
        setSequence(newSequence);
        sequenceRef.current = newSequence;
    };

    const startSequence = () => {
        setGameState('demo');
        setMessage('Lắng nghe nhé...');
        playSequence(sequence);
    };

    const playSequence = (seq: number[]) => {
        let delay = 500;
        const noteDuration = 600; // ms
        const gap = 200; // ms

        seq.forEach((btnIndex, i) => {
            const t1 = setTimeout(() => {
                setActiveButton(btnIndex);
                playNote(btnIndex);
            }, delay);

            const t2 = setTimeout(() => {
                setActiveButton(null);
            }, delay + noteDuration);

            timeoutsRef.current.push(t1, t2);
            delay += noteDuration + gap;
        });

        const tEnd = setTimeout(() => {
            setGameState('input');
            setMessage('Đến lượt bạn!');
        }, delay);
        timeoutsRef.current.push(tEnd);
    };

    const handleButtonClick = (index: number) => {
        if (gameState !== 'input') return;

        // Play note immediately
        playNote(index);
        setActiveButton(index);
        setTimeout(() => setActiveButton(null), 300);

        const newUserSequence = [...userSequence, index];
        setUserSequence(newUserSequence);

        // Check correctness
        const currentIndex = newUserSequence.length - 1;

        if (newUserSequence[currentIndex] !== sequence[currentIndex]) {
            // WRONG
            handleWrong();
        } else {
            // CORRECT so far
            if (newUserSequence.length === sequence.length) {
                // Completed sequence
                handleSuccess();
            }
        }
    };

    const handleSuccess = () => {
        // Calculate new values immediately
        const newScore = score + 100;
        const newCorrectCount = correctCount + 1;

        setScore(newScore);
        setCorrectCount(newCorrectCount);
        setGameState('success');
        setMessage('Chính xác! 🎉');
        soundManager.playCorrect();

        const t = setTimeout(() => {
            // Check if this was the last question using actual values
            if (questionCount >= config.totalQuestions) {
                // GAME COMPLETE!
                const percentage = (newCorrectCount / config.totalQuestions) * 100;
                let medal: 'bronze' | 'silver' | 'gold' | null = null;

                if (percentage === 100) medal = 'gold';
                else if (percentage >= 80) medal = 'silver';
                else if (percentage >= 50) medal = 'bronze';

                setCompletionMedal(medal);
                setGameState('complete');
                console.log('🎯 GAME COMPLETED - State:', 'complete', 'Medal:', medal, 'Score:', newScore);
                soundManager.playComplete();

                // DON'T call onComplete here! It causes parent to unmount component
                // Modal wouldn't have time to render
                // Instead, we'll call it when user clicks Thoát
            } else {
                // More questions to go
                prepareQuestion();
            }
        }, 1500);
        timeoutsRef.current.push(t);
    };

    const handleWrong = () => {
        setGameState('fail');
        setMessage('Sai rồi! Mất lượt 😢');
        soundManager.playWrong();

        // Move to next question after delay
        const t = setTimeout(() => {
            prepareQuestion();
        }, 2000);
        timeoutsRef.current.push(t);
    };

    const getGridCols = () => {
        if (config.gridSize === 4) return 'grid-cols-2 max-w-xs';
        if (config.gridSize === 6) return 'grid-cols-3 max-w-md';
        return 'grid-cols-3 max-w-xs'; // 3x3 for hard
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
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
                            <Target className="text-blue-500" size={24} />
                            <span className="font-bold text-lg text-slate-700">
                                Câu {questionCount > 0 ? questionCount : 1}/{config.totalQuestions}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={24} />
                            <span className="font-bold text-lg text-slate-700">{score}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center">
                {/* Message Area */}
                <div className="h-16 mb-8 flex items-center justify-center">
                    <div className={`text-2xl font-bold transition-all duration-300 ${gameState === 'success' ? 'text-green-600 scale-110' :
                        gameState === 'fail' ? 'text-red-500 scale-110' :
                            'text-slate-700'
                        }`}>
                        {message}
                    </div>
                </div>

                {/* Game Grid */}
                <div className={`grid gap-4 w-full ${getGridCols()}`}>
                    {Array.from({ length: config.gridSize }).map((_, i) => (
                        <MemoryButton
                            key={i}
                            id={i}
                            color={BUTTON_COLORS[i]}
                            isActive={activeButton === i}
                            isDisabled={gameState !== 'input'}
                            onClick={() => handleButtonClick(i)}
                            isHardMode={config.sameColor}
                        />
                    ))}
                </div>

                {/* Controls */}
                {gameState === 'idle' && (
                    <button
                        onClick={prepareQuestion}
                        className="mt-12 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                    >
                        <Play fill="currentColor" />
                        Bắt đầu
                    </button>
                )}

                {gameState === 'ready' && (
                    <button
                        onClick={startSequence}
                        className="mt-12 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 animate-bounce"
                    >
                        <Volume2 />
                        Nghe Giai Điệu
                    </button>
                )}

                {gameState === 'complete' && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-500 text-center">
                            <div className="text-6xl mb-4 animate-bounce">🏆</div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Hoàn thành!</h2>
                            <p className="text-slate-600 mb-4">Bạn đã hoàn thành xuất sắc phần chơi.</p>

                            {/* Stars Earned */}
                            {completionMedal && (
                                <div className="flex items-center justify-center gap-2 my-4 bg-yellow-50 px-6 py-3 rounded-full">
                                    <span className="text-lg font-semibold text-slate-700">Nhận được:</span>
                                    <div className="flex">
                                        {[...Array(completionMedal === 'gold' ? 3 : completionMedal === 'silver' ? 2 : 1)].map((_, i) => (
                                            <span key={i} className="text-2xl">⭐</span>
                                        ))}
                                    </div>
                                    <span className="text-lg font-bold text-yellow-600">
                                        +{completionMedal === 'gold' ? 3 : completionMedal === 'silver' ? 2 : 1} sao
                                    </span>
                                </div>
                            )}

                            <div className="text-4xl font-bold text-yellow-500 mb-8">
                                {score} điểm
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        // Call onComplete to notify parent, THEN exit
                                        const maxScore = config.totalQuestions * 100;
                                        onComplete(score, maxScore, completionMedal);
                                        onExit();
                                    }}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Thoát
                                </button>
                                <button
                                    onClick={() => {
                                        setGameState('idle');
                                        setQuestionCount(0);
                                        setCorrectCount(0);
                                        setScore(0);
                                        setCompletionMedal(null);
                                        setMessage('Sẵn sàng thử thách trí nhớ?');
                                    }}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={20} />
                                    Chơi lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
