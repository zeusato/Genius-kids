import React, { useState, useRef, useEffect } from 'react';
import { SpeedQuestion } from '../../SpeedMath/speedMathEngine';
import dragonImg from '../assets/dragon.png';

interface BossModalProps {
    question: SpeedQuestion;
    dialogue: string;
    questionsRemaining: number;
    onAnswer: (isCorrect: boolean, isTimeout: boolean) => void;
}

export const BossModal: React.FC<BossModalProps> = ({
    question,
    dialogue,
    questionsRemaining,
    onAnswer
}) => {
    const [typingInput, setTypingInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(question.timeLimit); // Use question's timeLimit!
    const [totalTime] = useState(question.timeLimit);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const answeredRef = useRef(false);

    // Start timer
    useEffect(() => {
        answeredRef.current = false;
        setTimeLeft(question.timeLimit);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    if (!answeredRef.current) {
                        answeredRef.current = true;
                        handleTimeout();
                    }
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [question]); // Re-run when question changes

    const handleTimeout = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        onAnswer(false, true); // isCorrect: false, isTimeout: true
    };

    const handleAnswer = (answer: string) => {
        if (answeredRef.current) return;
        answeredRef.current = true;

        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        onAnswer(isCorrect, false);
    };

    const handleTypingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAnswer(typingInput);
    };

    const getTimerColor = () => {
        const ratio = timeLeft / totalTime;
        if (ratio > 0.6) return 'bg-green-500';
        if (ratio > 0.3) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const renderVisual = () => {
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
        if (question.type === 'typing') {
            return (
                <form onSubmit={handleTypingSubmit} className="w-full">
                    <input
                        ref={inputRef}
                        type="text"
                        value={typingInput}
                        onChange={e => setTypingInput(e.target.value)}
                        className="w-full text-center text-2xl p-4 rounded-xl border-4 border-orange-200 focus:border-orange-500 focus:outline-none mb-4"
                        placeholder="Gõ câu trả lời..."
                        autoFocus
                        disabled={answeredRef.current}
                    />
                    <button
                        type="submit"
                        disabled={answeredRef.current}
                        className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                        Gửi
                    </button>
                </form>
            );
        }

        // Multiple Choice
        return (
            <div className="grid grid-cols-2 gap-4 w-full">
                {question.options?.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={answeredRef.current}
                        className="bg-white hover:bg-orange-50 border-b-4 border-orange-200 hover:border-orange-500 text-slate-700 font-bold text-xl py-6 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-red-900 via-orange-800 to-red-900 rounded-3xl shadow-2xl p-2 max-w-2xl w-full animate-in zoom-in-95 duration-500" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                <div className="bg-white rounded-2xl p-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                    {/* Two Column Layout on Desktop */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Column: Question Content */}
                        <div className="flex-1 flex flex-col">
                            {/* Question Content */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 leading-tight">
                                    {question.content}
                                </h2>
                                {renderVisual()}
                            </div>

                            {/* Answer Input */}
                            <div className="mt-auto">
                                {renderInput()}
                            </div>
                        </div>

                        {/* Right Column: Boss Character, Dialogue, Timer */}
                        <div className="lg:w-80 flex-shrink-0 flex items-center">
                            <div className="text-center w-full">
                                {/* Dragon Boss */}
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src={dragonImg}
                                        alt="Dragon Boss"
                                        className="w-32 h-32 object-contain animate-pulse"
                                    />
                                </div>

                                {/* Dialogue */}
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 mb-4 border-2 border-red-300">
                                    <p className="text-lg font-bold text-red-900 italic">
                                        "{dialogue}"
                                    </p>
                                </div>

                                {/* Questions Remaining */}
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <span className="text-sm font-bold text-slate-600">Câu hỏi còn lại:</span>
                                    <span className="text-3xl font-black text-red-600">{questionsRemaining}</span>
                                </div>

                                {/* Timer Bar */}
                                <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full transition-all duration-100 ease-linear ${getTimerColor()}`}
                                        style={{ width: `${(timeLeft / totalTime) * 100}%` }}
                                    />
                                </div>

                                {/* Timer Display */}
                                <div className="text-2xl font-black text-slate-600">
                                    ⏱️ {Math.ceil(timeLeft)}s
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
