import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionType } from '@/types';
import { soundManager } from '@/utils/sound';
import { Clock, X, CheckSquare, Type, Keyboard } from 'lucide-react';

interface TestRunnerProps {
    questions: Question[];
    durationMinutes: number;
    onFinish: (answers: Record<string, string | string[]>, timeSpent: number) => void;
    onExit: () => void;
}

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false }: any) => {
    const baseStyle = 'px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
    const variants = {
        primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg hover:shadow-xl',
        ghost: 'bg-transparent hover:bg-gray-100'
    };
    return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => {
    return <div className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 ${className}`}>{children}</div>;
};

export function TestRunner({ questions, durationMinutes, onFinish, onExit }: TestRunnerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

    // State for Typing Game
    const [typingInput, setTypingInput] = useState('');
    const typingInputRef = useRef<HTMLInputElement>(null);
    const [showTelexGuide, setShowTelexGuide] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timer);
                    onFinish(answers, durationMinutes * 60);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [answers, durationMinutes, onFinish]);

    // Reset typing input when question changes
    useEffect(() => {
        if (questions[currentIndex].type === QuestionType.Typing) {
            // Check if already answered
            const existingAns = answers[questions[currentIndex].id];
            setTypingInput(typeof existingAns === 'string' ? existingAns : '');
            // Auto focus
            setTimeout(() => typingInputRef.current?.focus(), 100);
        }
    }, [currentIndex, questions, answers]);

    const handleAnswer = (val: string) => {
        const currentQ = questions[currentIndex];
        soundManager.playClick();

        if (currentQ.type === QuestionType.MultipleSelect) {
            setAnswers(prev => {
                const currentSelection = (prev[currentQ.id] as string[]) || [];
                if (currentSelection.includes(val)) {
                    return { ...prev, [currentQ.id]: currentSelection.filter(v => v !== val) };
                } else {
                    return { ...prev, [currentQ.id]: [...currentSelection, val] };
                }
            });
        } else {
            setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: e.target.value }));
    };

    const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTypingInput(val);
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: val }));
    };

    const handleNext = () => {
        const currentQ = questions[currentIndex];
        const userAnswer = answers[currentQ.id];
        let isCorrect = false;

        if (currentQ.type === QuestionType.MultipleSelect) {
            const ua = Array.isArray(userAnswer) ? [...userAnswer].sort().toString() : "";
            const ca = currentQ.correctAnswers ? [...currentQ.correctAnswers].sort().toString() : "";
            isCorrect = ua === ca;
        } else if (currentQ.type === QuestionType.ManualInput) {
            isCorrect = (userAnswer as string || "").toString().trim().toLowerCase() === (currentQ.correctAnswer || "").toString().trim().toLowerCase();
        } else if (currentQ.type === QuestionType.Typing) {
            isCorrect = userAnswer === currentQ.correctAnswer;
        } else {
            isCorrect = userAnswer === currentQ.correctAnswer;
        }

        if (isCorrect) {
            soundManager.playCorrect();
        } else {
            soundManager.playWrong();
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleSubmit = () => {
        onFinish(answers, (durationMinutes * 60) - timeLeft);
    };

    const currentQ = questions[currentIndex];
    const currentAns = answers[currentQ.id];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const isAnswered = () => {
        if (currentQ.type === QuestionType.MultipleSelect) {
            return Array.isArray(currentAns) && currentAns.length > 0;
        }
        if (currentQ.type === QuestionType.Typing) {
            return typingInput === currentQ.correctAnswer;
        }
        return !!currentAns && currentAns.toString().trim().length > 0;
    };

    const renderTypingVisual = () => {
        const target = currentQ.correctAnswer || '';
        return (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowTelexGuide(!showTelexGuide)}
                        className="px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <Keyboard size={16} />
                        {showTelexGuide ? 'Ẩn hướng dẫn Telex' : 'Hướng dẫn gõ Telex'}
                    </button>
                </div>

                {showTelexGuide && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <Keyboard size={18} />
                            Hướng dẫn gõ dấu Telex
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {[
                                { char: 'â', method: 'aa', example: 'caan → cân' },
                                { char: 'ă', method: 'aw', example: 'awn → ăn' },
                                { char: 'ê', method: 'ee', example: 'een → ên' },
                                { char: 'ô', method: 'oo', example: 'oon → ôn' },
                                { char: 'ơ', method: 'ow', example: 'ow → ơ' },
                                { char: 'ư', method: 'uw', example: 'uw → ư' },
                                { char: 'đ', method: 'dd', example: 'ddi → đi' },
                                { char: 'á', method: 'as', example: 'as → á' },
                                { char: 'à', method: 'af', example: 'af → à' },
                                { char: 'ả', method: 'ar', example: 'ar → ả' },
                                { char: 'ã', method: 'ax', example: 'ax → ã' },
                                { char: 'ạ', method: 'aj', example: 'aj → ạ' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-2 rounded border border-blue-200">
                                    <div className="font-bold text-lg text-blue-600">{item.char} = {item.method}</div>
                                    <div className="text-xs text-slate-500 mt-1">{item.example}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-6 bg-white rounded-xl border-2 border-brand-100 shadow-inner text-2xl md:text-3xl leading-relaxed font-mono" onClick={() => typingInputRef.current?.focus()}>
                    {target.split('').map((char, idx) => {
                        let colorClass = 'text-slate-400';
                        if (idx < typingInput.length) {
                            if (typingInput[idx] === char) {
                                colorClass = 'text-green-500';
                            } else {
                                colorClass = 'text-red-500 bg-red-50';
                            }
                        }
                        return (
                            <span key={idx} className={`${colorClass} transition-colors duration-100 relative`}>
                                {char}
                                {idx === typingInput.length && (
                                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800 animate-pulse"></span>
                                )}
                            </span>
                        );
                    })}
                    {typingInput.length >= target.length && <span className="ml-1 inline-block w-2 h-6 bg-transparent"></span>}
                </div>

                <div className="relative">
                    <input
                        ref={typingInputRef}
                        type="text"
                        className="w-full opacity-0 absolute inset-0 h-full cursor-text"
                        value={typingInput}
                        onChange={handleTypingChange}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && typingInput === target) {
                                handleNext();
                            }
                        }}
                    />
                    <div className="mt-4 text-center text-slate-400 text-sm">
                        <Keyboard className="inline-block mr-1" size={16} />
                        Hãy gõ chính xác đoạn văn trên. Chữ đỏ là gõ sai, hãy xóa và gõ lại!
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-50 flex flex-col items-center p-4">
            <div className="w-full max-w-3xl mb-6 flex justify-between items-center">
                <Button variant="ghost" onClick={onExit} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                    <X size={24} className="mr-1" /> Thoát
                </Button>

                <div className="flex items-center gap-2 text-xl font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow-sm">
                    <Clock className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-brand-500'} />
                    <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
                </div>

                <div className="text-slate-500 font-bold min-w-[80px] text-right">
                    Câu {currentIndex + 1} / {questions.length}
                </div>
            </div>

            <div className="w-full max-w-3xl mb-8">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <Card className="w-full max-w-3xl flex-1 flex flex-col min-h-[400px]">
                <div className="flex-1">
                    <div className="mb-4">
                        {currentQ.type === QuestionType.MultipleSelect && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-bold mb-2">
                                <CheckSquare size={14} className="mr-1" /> Chọn nhiều đáp án
                            </span>
                        )}
                        {currentQ.type === QuestionType.ManualInput && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-2">
                                <Type size={14} className="mr-1" /> Tự nhập đáp án
                            </span>
                        )}
                        {currentQ.type === QuestionType.Typing && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold mb-2">
                                <Keyboard size={14} className="mr-1" /> Tập gõ phím
                            </span>
                        )}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed mb-8">
                        {currentQ.questionText}
                    </h2>

                    {currentQ.visualSvg && (
                        <div
                            className="mb-8 flex justify-center p-4 bg-white rounded-xl border-2 border-slate-100 overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: currentQ.visualSvg }}
                        />
                    )}

                    {currentQ.type === QuestionType.Typing ? (
                        renderTypingVisual()
                    ) : currentQ.type === QuestionType.ManualInput ? (
                        <div className="mt-8">
                            <input
                                type="text"
                                value={(currentAns as string) || ''}
                                onChange={handleInputChange}
                                placeholder="Nhập câu trả lời của bé..."
                                className="w-full text-2xl p-4 border-b-4 border-brand-200 focus:border-brand-500 focus:outline-none bg-gray-50 rounded-t-lg transition-colors"
                                autoFocus
                            />
                            <p className="text-slate-500 mt-2 text-sm">* Nhập số hoặc chữ cái tương ứng</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQ.options?.map((opt, idx) => {
                                const isSelected = currentQ.type === QuestionType.MultipleSelect
                                    ? (currentAns as string[])?.includes(opt)
                                    : currentAns === opt;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(opt)}
                                        className={`p-6 text-xl font-bold rounded-xl border-2 text-left transition-all flex items-center ${isSelected
                                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                                            : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 text-slate-700'
                                            }`}
                                    >
                                        <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mr-3 ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-300 opacity-50'}`}>
                                            {currentQ.type === QuestionType.MultipleSelect
                                                ? (isSelected ? <CheckSquare size={16} /> : <span className="w-4 h-4 block" />)
                                                : String.fromCharCode(65 + idx)
                                            }
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={currentIndex === questions.length - 1 ? handleSubmit : handleNext}
                        disabled={!isAnswered()}
                    >
                        {currentIndex === questions.length - 1 ? 'Nộp bài' : 'Câu tiếp theo'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
