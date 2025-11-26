import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, Clock, Trophy, Play, RotateCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { soundManager } from '../../utils/sound';
import { SpeedDifficulty, SpeedQuestion, generateSpeedQuestion } from './speedMathEngine';
import { MusicControls } from '@/src/components/MusicControls';
import { useMusicControls } from '@/src/contexts/MusicContext';
import { MusicTrack } from '@/services/musicConfig';

interface SpeedMathGameProps {
    difficulty: string; // 'easy' | 'medium' | 'hard'
    onBack: () => void;
    onComplete: (score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => void;
}

export const SpeedMathGame: React.FC<SpeedMathGameProps> = ({ difficulty, onBack, onComplete }) => {
    const { playTrack, resumeRouteMusic } = useMusicControls();

    // Play Speed Math music on mount
    useEffect(() => {
        playTrack(MusicTrack.SPEED_MATH);
        return () => resumeRouteMusic();
    }, []);
    // Game State
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover'>('intro');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [questionCount, setQuestionCount] = useState(0);
    const [question, setQuestion] = useState<SpeedQuestion | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [gameOverReason, setGameOverReason] = useState<'lives' | 'timeout' | 'completed'>('lives');
    const [completionMedal, setCompletionMedal] = useState<'gold' | 'silver' | 'bronze' | null>(null);

    // Typing State
    const [typingInput, setTypingInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Timer Ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- GAME LOOP ---

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setLives(3);
        setQuestionCount(0);
        setCompletionMedal(null);
        nextQuestion();
    };

    const nextQuestion = () => {
        // Check limit (20 questions)
        if (questionCount >= 20) {
            endGame('completed');
            return;
        }

        const q = generateSpeedQuestion(difficulty as SpeedDifficulty);
        setQuestion(q);
        setQuestionCount(c => c + 1);
        setTimeLeft(q.timeLimit);
        setTotalTime(q.timeLimit);
        setTypingInput('');

        // Auto focus input if typing
        if (q.type === 'typing') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }

        // Start Timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
    };

    const handleTimeout = () => {
        clearInterval(timerRef.current!);
        soundManager.playWrong();
        handleLifeLost('timeout');
    };

    const handleLifeLost = (reason: 'lives' | 'timeout' = 'lives') => {
        if (lives > 1) {
            setLives(l => l - 1);
            nextQuestion();
        } else {
            setLives(0);
            endGame(reason);
        }
    };

    const endGame = (reason: 'lives' | 'timeout' | 'completed') => {
        setGameOverReason(reason);
        setGameState('gameover');
        if (timerRef.current) clearInterval(timerRef.current);

        // Calculate medal based on lives remaining (only if completed)
        let medal: 'gold' | 'silver' | 'bronze' | null = null;
        if (reason === 'completed') {
            if (lives === 3) medal = 'gold';
            else if (lives === 2) medal = 'silver';
            else if (lives === 1) medal = 'bronze';
        }
        setCompletionMedal(medal);

        soundManager.playComplete();
        // DON'T call onComplete here - will be called when user clicks Exit button
    };

    const handleAnswer = (ans: string) => {
        if (!question) return;

        if (ans.toLowerCase() === question.correctAnswer.toLowerCase()) {
            // Correct
            soundManager.playCorrect();
            setScore(s => s + 10); // +10 points
            nextQuestion();
        } else {
            // Wrong
            soundManager.playWrong();
            handleLifeLost('lives');
        }
    };

    // Typing handler
    const handleTypingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAnswer(typingInput);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // --- RENDERERS ---

    const renderVisual = () => {
        if (!question) return null;

        if (question.type === 'color' && question.color) {
            return (
                <div
                    className="w-32 h-32 rounded-2xl shadow-lg mx-auto mb-6 border-4 border-white"
                    style={{ backgroundColor: question.color }}
                />
            );
        }

        if ((question.type === 'shape' || question.type === 'clock') && question.visual) {
            return (
                <div
                    className="w-48 h-48 mx-auto mb-6"
                    dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 120 120" width="100%" height="100%">${question.visual}</svg>` }}
                />
            );
        }

        return null;
    };

    const renderInput = () => {
        if (!question) return null;

        if (question.type === 'typing') {
            return (
                <form onSubmit={handleTypingSubmit} className="w-full max-w-md mx-auto">
                    <input
                        ref={inputRef}
                        type="text"
                        value={typingInput}
                        onChange={e => setTypingInput(e.target.value)}
                        className="w-full text-center text-2xl p-4 rounded-xl border-4 border-brand-200 focus:border-brand-500 focus:outline-none mb-4"
                        placeholder="Gõ câu trả lời..."
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors"
                    >
                        Gửi
                    </button>
                </form>
            );
        }

        // Multiple Choice
        return (
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                {question.options?.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        className="bg-white hover:bg-brand-50 border-b-4 border-slate-200 hover:border-brand-500 text-slate-700 font-bold text-xl py-6 rounded-2xl shadow-sm transition-all active:scale-95"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    };

    // --- SCREENS ---

    if (gameState === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={48} className="text-orange-600" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Đua Tốc Độ</h1>
                    <p className="text-slate-500 text-lg mb-8">Trả lời thật nhanh trước khi hết giờ!</p>

                    <div className="space-y-4 mb-8 text-left bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Heart className="text-red-500 fill-red-500" />
                            <span className="font-bold text-slate-700">3 Mạng</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="text-blue-500" />
                            <span className="font-bold text-slate-700">10-15 giây/câu</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-green-500" />
                            <span className="font-bold text-slate-700">20 Câu hỏi</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onBack} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                            Quay lại
                        </button>
                        <button onClick={startGame} className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-105">
                            <Play size={20} fill="currentColor" /> Bắt đầu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'gameover') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="mb-6">
                        {gameOverReason === 'completed' ? (
                            <Trophy size={80} className="text-yellow-400 mx-auto animate-bounce" />
                        ) : gameOverReason === 'timeout' ? (
                            <Clock size={80} className="text-orange-500 mx-auto" />
                        ) : (
                            <Heart size={80} className="text-red-500 mx-auto fill-red-500" />
                        )}
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 mb-2">
                        {gameOverReason === 'completed' ? 'Xuất sắc!' :
                            gameOverReason === 'timeout' ? 'Hết giờ!' : 'Hết mạng!'}
                    </h2>

                    <p className="text-slate-500 mb-4 text-lg">
                        {gameOverReason === 'completed' ? 'Bạn đã hoàn thành tất cả câu hỏi.' :
                            gameOverReason === 'timeout' ? 'Bạn đã để thời gian trôi qua quá nhiều.' : 'Bạn đã chọn sai quá 3 lần.'}
                    </p>

                    {/* Stars Earned - only show if completed with medal */}
                    {gameOverReason === 'completed' && completionMedal && (
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

                    <div className="bg-slate-50 rounded-xl p-4 mb-8">
                        <div className="text-sm text-slate-500 mb-1">Tổng điểm</div>
                        <div className="text-5xl font-black text-brand-600">
                            {score}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                // Call onComplete to notify parent, THEN go back
                                onComplete(score, 200, completionMedal);
                                onBack();
                            }}
                            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Thoát
                        </button>
                        <button onClick={startGame} className="flex-[2] py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
                            <RotateCcw size={20} /> Chơi lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing State
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex justify-between items-center">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft />
                </button>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                        <Heart className="text-red-500 fill-red-500" size={20} />
                        <span className="font-black text-red-700 text-xl">{lives}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                        <CheckCircle className="text-blue-500" size={20} />
                        <span className="font-black text-blue-700 text-xl">{questionCount}/20</span>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
                        <Trophy className="text-yellow-500" size={20} />
                        <span className="font-black text-yellow-700 text-xl">{score}</span>
                    </div>
                </div>
                <MusicControls />
            </div>

            {/* Timer Bar */}
            <div className="w-full h-2 bg-slate-200">
                <div
                    className={`h-full transition-all duration-100 ease-linear ${timeLeft / totalTime < 0.3 ? 'bg-red-500' :
                        timeLeft / totalTime < 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                    style={{ width: `${(timeLeft / totalTime) * 100}%` }}
                />
            </div>

            {/* Game Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
                {question && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-8 leading-tight">
                                {question.content}
                            </h2>
                            {renderVisual()}
                        </div>

                        {renderInput()}
                    </div>
                )}
            </div>
        </div>
    );
};
