import React, { useState } from 'react';
import { TestResult, QuestionType } from '@/types';
import { Star, Brain, CheckCircle, XCircle } from 'lucide-react';
import { isCorrect as gradeCorrect } from '@/services/study/grading';

interface ResultScreenProps {
    result: TestResult;
    onHome: () => void;
}

const Button = ({ onClick, children, variant = 'primary', className = '' }: any) => {
    const baseStyle = 'px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center';
    const variants = {
        primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg hover:shadow-xl',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    };
    return <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => {
    return <div className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 ${className}`}>{children}</div>;
};

export function ResultScreen({ result, onHome }: ResultScreenProps) {
    const [showReview, setShowReview] = useState(false);
    const percentage = Math.round((result.score / result.totalQuestions) * 100);

    const getMessage = () => {
        if (percentage === 100) return { text: "Xuất sắc! Bé là thiên tài!", color: "text-yellow-500" };
        if (percentage >= 80) return { text: "Làm tốt lắm! Cố gắng thêm chút nữa nhé!", color: "text-green-500" };
        if (percentage >= 50) return { text: "Khá tốt, nhưng cần ôn luyện thêm nhé.", color: "text-brand-500" };
        return { text: "Đừng buồn, hãy luyện tập thêm nhé!", color: "text-slate-500" };
    };

    const msg = getMessage();

    const renderAnswer = (ans: string | string[] | undefined) => {
        if (!ans) return "Chưa trả lời";
        if (Array.isArray(ans)) return ans.join(", ");
        return ans;
    };

    return (
        <div className="min-h-screen p-4 flex flex-col items-center py-10">
            <div className="text-center mb-10 animate-in slide-in-from-bottom duration-500">
                <div className="inline-block p-6 rounded-full bg-white shadow-xl mb-6 relative">
                    {percentage === 100 ? <Star size={80} className="text-yellow-400 fill-yellow-400 animate-spin-slow" /> : <Brain size={80} className="text-brand-500" />}
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white font-bold px-3 py-1 rounded-full">
                        {percentage}%
                    </div>
                </div>
                <h1 className={`text-4xl font-black mb-2 ${msg.color}`}>{msg.text}</h1>
                <p className="text-xl text-slate-600 mb-4">
                    Đúng {result.score}/{result.totalQuestions} câu trong {Math.floor(result.durationSeconds / 60)}:{String(result.durationSeconds % 60).padStart(2, '0')} phút.
                </p>

                {result.starsEarned > 0 && (
                    <div className="flex items-center justify-center gap-2 text-yellow-500 bg-yellow-50 px-6 py-3 rounded-full animate-bounce">
                        <span className="text-xl font-bold">Nhận được:</span>
                        <div className="flex">
                            {[...Array(result.starsEarned)].map((_, i) => (
                                <Star key={i} size={24} fill="currentColor" />
                            ))}
                        </div>
                        <span className="text-xl font-bold">+{result.starsEarned} sao</span>
                    </div>
                )}
            </div>

            <div className="flex gap-4 mb-8">
                <Button variant="secondary" onClick={() => setShowReview(!showReview)}>
                    {showReview ? 'Ẩn bài làm' : 'Xem lại bài làm'}
                </Button>
                <Button onClick={onHome}>Về trang chủ</Button>
            </div>

            {showReview && (
                <div className="w-full max-w-3xl space-y-4 animate-in fade-in">
                    {result.questions.map((q, idx) => {
                        const isCorrect = gradeCorrect(q, q.userAnswer);

                        return (
                            <Card key={q.id} className={`border-l-8 ${isCorrect ? 'border-l-green-400' : 'border-l-red-400'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                        {isCorrect ? <CheckCircle /> : <XCircle />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg mb-2">
                                            Câu {idx + 1}: {q.questionText}
                                            {q.type === QuestionType.ManualInput && <span className="ml-2 text-xs text-slate-400 font-normal">(Tự nhập)</span>}
                                            {q.type === QuestionType.MultipleSelect && <span className="ml-2 text-xs text-slate-400 font-normal">(Chọn nhiều)</span>}
                                            {q.type === QuestionType.Typing && <span className="ml-2 text-xs text-slate-400 font-normal">(Gõ phím)</span>}
                                        </h4>

                                        {q.visualSvg && (
                                            <div
                                                className="mb-4 max-w-[200px] p-2 bg-slate-50 rounded border border-slate-200 overflow-x-auto"
                                                dangerouslySetInnerHTML={{ __html: q.visualSvg }}
                                            />
                                        )}

                                        <div className="grid grid-cols-1 gap-4 text-sm mb-3">
                                            {q.type === QuestionType.Typing ? (
                                                <div className={`p-3 rounded-lg border font-mono ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                    <div className="mb-1 text-xs text-slate-500">Bé gõ:</div>
                                                    <div className={isCorrect ? 'text-green-700' : 'text-red-700'}>{q.userAnswer as string}</div>
                                                    {!isCorrect && (
                                                        <>
                                                            <div className="mb-1 mt-2 text-xs text-slate-500">Văn bản đúng:</div>
                                                            <div className="text-slate-700">{q.correctAnswer}</div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`p-2 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        Bé chọn: <span className="font-bold">{renderAnswer(q.userAnswer)}</span>
                                                    </div>
                                                    {!isCorrect && (
                                                        <div className="p-2 rounded-lg bg-green-100 text-green-800">
                                                            Đáp án đúng: <span className="font-bold">
                                                                {q.type === QuestionType.MultipleSelect ? q.correctAnswers?.join(", ") : q.correctAnswer}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            💡 <span className="font-bold">Giải thích:</span> <span className="whitespace-pre-line">{(q.explanation || '').replace(/\\n/g, '\n')}</span>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
