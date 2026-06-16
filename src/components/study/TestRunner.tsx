import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionType, StudyMode } from '@/types';
import { soundManager } from '@/utils/sound';
import { cancelSpeech } from '@/src/utils/speech';
import { questionToSpeech } from '@/src/utils/questionSpeech';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { Clock, X, CheckSquare, Type, Keyboard, Check, ChevronLeft, AlertTriangle, CheckCircle2, XCircle, Dumbbell } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface TestRunnerProps {
    questions: Question[];
    durationMinutes: number;
    mode: StudyMode;
    ttsAutoRead: boolean;
    onFinish: (answers: Record<string, string | string[]>, timeSpent: number) => void;
    onExit: () => void;
}

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false }: any) => {
    const baseStyle = 'px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
    const variants: Record<string, string> = {
        primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg hover:shadow-xl',
        success: 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl',
        ghost: 'bg-transparent hover:bg-gray-100',
        outline: 'border-2 border-gray-300 hover:border-brand-400 text-slate-600',
    };
    return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => {
    return <div className={`bg-white p-5 md:p-6 rounded-2xl shadow-md border border-gray-100 ${className}`}>{children}</div>;
};

// Markdown components dùng chung cho nội dung câu hỏi (KaTeX + bảng).
const mdComponents: any = {
    p: 'span',
    table: ({ node, ...props }: any) => <div className="overflow-x-auto w-full my-4"><table className="w-full border-collapse border-2 border-slate-300 bg-white text-slate-700 shadow-sm text-base md:text-xl" {...props} /></div>,
    thead: ({ node, ...props }: any) => <thead className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-300" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-200" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="hover:bg-brand-50 transition-colors" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-3 py-2 border border-slate-300 text-center" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-3 py-2 border border-slate-300 text-center" {...props} />,
};

export function TestRunner({ questions, durationMinutes, mode, ttsAutoRead, onFinish, onExit }: TestRunnerProps) {
    const isPractice = mode === 'practice';
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
    const [typingInput, setTypingInput] = useState('');
    const typingInputRef = useRef<HTMLInputElement>(null);
    const [showTelexGuide, setShowTelexGuide] = useState(false);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set()); // Luyện tập: câu đã chấm
    const [showExit, setShowExit] = useState(false);
    const startedAt = useRef<number>(Date.now());

    const currentQ = questions[currentIndex];
    const currentAns = answers[currentQ.id];
    const isLast = currentIndex === questions.length - 1;
    const revealed = isPractice && revealedIds.has(currentQ.id);

    const elapsed = () => Math.round((Date.now() - startedAt.current) / 1000);

    // Đồng hồ — chỉ chế độ Kiểm tra.
    useEffect(() => {
        if (isPractice) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timer);
                    onFinish(answers, elapsed());
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [answers, isPractice, onFinish]);

    // Dừng đọc khi rời màn.
    useEffect(() => () => cancelSpeech(), []);

    // Reset ô gõ khi đổi câu Typing.
    useEffect(() => {
        if (currentQ.type === QuestionType.Typing) {
            const existing = answers[currentQ.id];
            setTypingInput(typeof existing === 'string' ? existing : '');
            setTimeout(() => typingInputRef.current?.focus(), 100);
        }
    }, [currentIndex, currentQ.id, currentQ.type]);

    const checkCorrect = (q: Question, ua: string | string[] | undefined): boolean => {
        if (q.type === QuestionType.MultipleSelect) {
            const a = Array.isArray(ua) ? [...ua].sort().toString() : '';
            const c = q.correctAnswers ? [...q.correctAnswers].sort().toString() : '';
            return a === c;
        }
        if (q.type === QuestionType.ManualInput) {
            return (ua as string || '').toString().trim().toLowerCase() === (q.correctAnswer || '').toString().trim().toLowerCase();
        }
        return ua === q.correctAnswer;
    };

    const handleAnswer = (val: string) => {
        if (revealed) return; // đã chấm (Luyện tập) thì khoá
        soundManager.playClick();
        if (currentQ.type === QuestionType.MultipleSelect) {
            setAnswers(prev => {
                const cur = (prev[currentQ.id] as string[]) || [];
                return cur.includes(val)
                    ? { ...prev, [currentQ.id]: cur.filter(v => v !== val) }
                    : { ...prev, [currentQ.id]: [...cur, val] };
            });
        } else {
            setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (revealed) return;
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: e.target.value }));
    };

    const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (revealed) return;
        const val = e.target.value;
        setTypingInput(val);
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: val }));
    };

    const isAnswered = (): boolean => {
        if (currentQ.type === QuestionType.MultipleSelect) return Array.isArray(currentAns) && currentAns.length > 0;
        if (currentQ.type === QuestionType.Typing) return typingInput.trim().length > 0;
        return !!currentAns && currentAns.toString().trim().length > 0;
    };

    // Luyện tập: chấm câu hiện tại (hiện đúng/sai + giải thích).
    const handleReveal = () => {
        const correct = checkCorrect(currentQ, currentQ.type === QuestionType.Typing ? typingInput : currentAns);
        correct ? soundManager.playCorrect() : soundManager.playWrong();
        setRevealedIds(prev => new Set(prev).add(currentQ.id));
    };

    // Kiểm tra: chuyển câu (chỉ phát âm thanh đúng/sai, không lộ đáp án).
    const handleNext = () => {
        if (!isPractice) {
            const correct = checkCorrect(currentQ, currentQ.type === QuestionType.Typing ? typingInput : currentAns);
            correct ? soundManager.playCorrect() : soundManager.playWrong();
        }
        if (!isLast) {
            cancelSpeech();
            setCurrentIndex(i => i + 1);
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        if (currentIndex === 0) return;
        cancelSpeech();
        setCurrentIndex(i => i - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = () => onFinish(answers, elapsed());

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const lowTime = !isPractice && timeLeft <= 30 && timeLeft > 0;
    const speakText = questionToSpeech(currentQ.questionText);

    const renderTypingVisual = () => {
        const target = currentQ.correctAnswer || '';
        return (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button onClick={() => setShowTelexGuide(!showTelexGuide)} className="px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                        <Keyboard size={16} /> {showTelexGuide ? 'Ẩn hướng dẫn Telex' : 'Hướng dẫn gõ Telex'}
                    </button>
                </div>
                {showTelexGuide && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2"><Keyboard size={18} /> Hướng dẫn gõ dấu Telex</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {[{ char: 'â', method: 'aa' }, { char: 'ă', method: 'aw' }, { char: 'ê', method: 'ee' }, { char: 'ô', method: 'oo' }, { char: 'ơ', method: 'ow' }, { char: 'ư', method: 'uw' }, { char: 'đ', method: 'dd' }, { char: 'á', method: 'as' }, { char: 'à', method: 'af' }, { char: 'ả', method: 'ar' }, { char: 'ã', method: 'ax' }, { char: 'ạ', method: 'aj' }].map((item, idx) => (
                                <div key={idx} className="bg-white p-2 rounded border border-blue-200"><div className="font-bold text-lg text-blue-600">{item.char} = {item.method}</div></div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="p-6 bg-white rounded-xl border-2 border-brand-100 shadow-inner text-2xl md:text-3xl leading-relaxed font-mono" onClick={() => typingInputRef.current?.focus()}>
                    {target.split('').map((char, idx) => {
                        let colorClass = 'text-slate-400';
                        if (idx < typingInput.length) colorClass = typingInput[idx] === char ? 'text-green-500' : 'text-red-500 bg-red-50';
                        return (
                            <span key={idx} className={`${colorClass} transition-colors duration-100 relative`}>
                                {char}
                                {idx === typingInput.length && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800 animate-pulse"></span>}
                            </span>
                        );
                    })}
                </div>
                <input ref={typingInputRef} type="text" className="w-full opacity-0 absolute inset-0 h-full cursor-text" value={typingInput} onChange={handleTypingChange} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" disabled={revealed}
                    onKeyDown={(e) => { if (e.key === 'Enter' && typingInput.trim().length > 0) (isPractice && !revealed ? handleReveal() : handleNext()); }} />
                <div className="text-center text-slate-400 text-sm"><Keyboard className="inline-block mr-1" size={16} /> Gõ chính xác đoạn văn. Chữ đỏ là gõ sai, hãy xoá và gõ lại!</div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-brand-50 flex flex-col items-center p-3 md:p-4">
            {/* Thanh trên */}
            <div className="w-full max-w-3xl mb-4 flex justify-between items-center gap-2">
                <Button variant="ghost" onClick={() => setShowExit(true)} className="text-red-500 hover:bg-red-50 hover:text-red-600 px-3 md:px-6">
                    <X size={22} className="md:mr-1" /> <span className="hidden md:inline">Thoát</span>
                </Button>
                {!isPractice ? (
                    <div className={`flex items-center gap-2 text-lg md:text-xl font-bold px-4 py-2 rounded-full shadow-sm ${lowTime ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-slate-700'}`}>
                        <Clock className={timeLeft < 60 ? 'text-red-500' : 'text-brand-500'} size={20} />
                        <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-base font-bold px-4 py-2 rounded-full shadow-sm bg-green-100 text-green-700">
                        <Dumbbell size={18} /> Luyện tập
                    </div>
                )}
                <div className="text-slate-500 font-bold min-w-[64px] text-right">Câu {currentIndex + 1}/{questions.length}</div>
            </div>

            <div className="w-full max-w-3xl mb-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {lowTime && (
                <div className="w-full max-w-3xl mb-3 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl font-bold animate-in fade-in">
                    <AlertTriangle size={18} /> Sắp hết giờ rồi, cố lên nào!
                </div>
            )}

            <Card className="w-full max-w-3xl flex-1 flex flex-col min-h-[400px]">
                <div className="flex-1">
                    {/* Badge loại câu + nút loa */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <div>
                            {currentQ.type === QuestionType.MultipleSelect && <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-bold"><CheckSquare size={14} className="mr-1" /> Chọn nhiều đáp án</span>}
                            {currentQ.type === QuestionType.ManualInput && <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold"><Type size={14} className="mr-1" /> Tự nhập đáp án</span>}
                            {currentQ.type === QuestionType.Typing && <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold"><Keyboard size={14} className="mr-1" /> Tập gõ phím</span>}
                        </div>
                        {ttsAutoRead && speakText && (
                            <SpeakButton text={speakText} lang="vi-VN" autoPlay autoPlayKey={currentIndex} size={24} />
                        )}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed mb-6">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={mdComponents}>{currentQ.questionText}</ReactMarkdown>
                    </h2>

                    {currentQ.visualSvg && (
                        <div className="mb-6 flex justify-center p-3 bg-white rounded-xl border-2 border-slate-100 overflow-x-auto" dangerouslySetInnerHTML={{ __html: currentQ.visualSvg }} />
                    )}

                    {currentQ.type === QuestionType.Typing ? renderTypingVisual()
                        : currentQ.type === QuestionType.ManualInput ? (
                            <div className="mt-4">
                                <input type="text" value={(currentAns as string) || ''} onChange={handleInputChange} disabled={revealed} placeholder="Nhập câu trả lời của bé..." className="w-full text-2xl p-4 border-b-4 border-brand-200 focus:border-brand-500 focus:outline-none bg-gray-50 rounded-t-lg transition-colors disabled:opacity-70" autoFocus />
                                <p className="text-slate-500 mt-2 text-sm">* Nhập đáp án (dạng số)</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {currentQ.options?.map((opt, idx) => {
                                    const isSelected = currentQ.type === QuestionType.MultipleSelect ? (currentAns as string[])?.includes(opt) : currentAns === opt;
                                    const isCorrectOpt = currentQ.type === QuestionType.MultipleSelect ? currentQ.correctAnswers?.includes(opt) : opt === currentQ.correctAnswer;
                                    let cls = 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 text-slate-700';
                                    if (revealed) {
                                        if (isCorrectOpt) cls = 'border-green-500 bg-green-50 text-green-800';
                                        else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-700';
                                        else cls = 'border-gray-200 text-slate-400';
                                    } else if (isSelected) cls = 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200';
                                    return (
                                        <button key={idx} onClick={() => handleAnswer(opt)} disabled={revealed} className={`p-4 md:p-6 text-lg md:text-xl font-bold rounded-xl border-2 text-left transition-all flex items-center ${cls}`}>
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mr-3 shrink-0 ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-300 opacity-60'} ${revealed && isCorrectOpt ? 'bg-green-500 border-green-500 text-white' : ''}`}>
                                                {revealed && isCorrectOpt ? <Check size={16} /> : currentQ.type === QuestionType.MultipleSelect ? (isSelected ? <CheckSquare size={16} /> : <span className="w-4 h-4 block" />) : String.fromCharCode(65 + idx)}
                                            </span>
                                            <div className="flex-1 text-left"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={mdComponents}>{opt}</ReactMarkdown></div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                    {/* Luyện tập: phản hồi + giải thích sau khi chấm */}
                    {revealed && (
                        <div className={`mt-5 p-4 rounded-xl border-2 ${checkCorrect(currentQ, currentQ.type === QuestionType.Typing ? typingInput : currentAns) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className={`flex items-center gap-2 font-black text-lg ${checkCorrect(currentQ, currentQ.type === QuestionType.Typing ? typingInput : currentAns) ? 'text-green-700' : 'text-red-700'}`}>
                                {checkCorrect(currentQ, currentQ.type === QuestionType.Typing ? typingInput : currentAns) ? <><CheckCircle2 size={22} /> Chính xác!</> : <><XCircle size={22} /> Chưa đúng</>}
                            </div>
                            {(currentQ.type === QuestionType.ManualInput || currentQ.type === QuestionType.Typing) && (
                                <p className="text-slate-700 mt-1">Đáp án: <span className="font-bold">{currentQ.correctAnswer}</span></p>
                            )}
                            {currentQ.explanation && <p className="text-slate-600 mt-2 leading-relaxed">{currentQ.explanation}</p>}
                        </div>
                    )}
                </div>

                {/* Thanh điều hướng */}
                <div className="mt-6 flex justify-between items-center gap-3">
                    <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="px-4">
                        <ChevronLeft size={20} className="md:mr-1" /> <span className="hidden md:inline">Câu trước</span>
                    </Button>

                    {isPractice && !revealed ? (
                        <Button variant="success" onClick={handleReveal} disabled={!isAnswered()}>
                            <Check size={20} className="mr-1" /> Kiểm tra
                        </Button>
                    ) : (
                        <Button
                            onClick={isLast ? handleSubmit : handleNext}
                            disabled={!isPractice && !isAnswered()}
                        >
                            {isLast ? (isPractice ? 'Hoàn thành' : 'Nộp bài') : 'Câu tiếp theo'}
                        </Button>
                    )}
                </div>
            </Card>

            {/* Xác nhận thoát */}
            {showExit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center animate-in zoom-in-95">
                        <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Thoát bài làm?</h3>
                        <p className="text-slate-500 mb-6">Tiến trình làm bài sẽ không được lưu lại.</p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 py-2" onClick={() => setShowExit(false)}>Ở lại</Button>
                            <Button variant="primary" className="flex-1 py-2 bg-red-500 hover:bg-red-600" onClick={() => { cancelSpeech(); onExit(); }}>Thoát</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
