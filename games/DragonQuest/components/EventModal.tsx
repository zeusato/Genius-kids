// ============================================================================
//  EventModal — vỏ modal DÙNG CHUNG cho combat/buff/boss (gộp 3 modal cũ).
//  "Skin" (màu/nhân vật/khung) đổi theo `variant`. Tự lo: hiển thị feedback
//  đúng/sai (kèm âm thanh + TTS động viên) trước khi đóng, đếm giờ cho boss,
//  và nút nghe lại. Reducer chỉ nhận kết quả correct: boolean.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { SpeedQuestion } from '../../SpeedMath/speedMathEngine';
import { soundManager } from '../../../utils/sound';
import { FEEDBACK_MS } from '../engine/constants';
import { CORRECT_DIALOGUES, WRONG_DIALOGUES, questionToSpeech } from '../engine/dialogue';
import { QuestionPanel, type Accent } from './QuestionPanel';
import { VoiceButton } from './VoiceButton';
import { voiceSpeak } from '../hooks/useGameTTS';
import demonImg from '../assets/demon.png';
import fairyImg from '../assets/fairy.png';
import dragonImg from '../assets/dragon.png';

export type EventVariant = 'combat' | 'buff' | 'boss';

interface EventModalProps {
    variant: EventVariant;
    question: SpeedQuestion;
    dialogue: string;
    questionsRemaining?: number; // chỉ boss
    onAnswer: (correct: boolean) => void;
}

const SKIN: Record<EventVariant, {
    accent: Accent; img: string; imgClass: string;
    bubble: string; outer: string; inner: string;
}> = {
    combat: {
        accent: 'red', img: demonImg, imgClass: 'animate-bounce',
        bubble: 'bg-red-50 border-red-200 text-red-800',
        outer: 'bg-white', inner: '',
    },
    buff: {
        accent: 'green', img: fairyImg, imgClass: 'animate-bounce',
        bubble: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800',
        outer: 'bg-white', inner: '',
    },
    boss: {
        accent: 'orange', img: dragonImg, imgClass: 'animate-pulse',
        bubble: 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300 text-red-900',
        outer: 'bg-gradient-to-br from-red-900 via-orange-800 to-red-900 p-2',
        inner: 'bg-white rounded-2xl',
    },
};

const sample = (pool: readonly string[]) => pool[Math.floor(Math.random() * pool.length)];

export const EventModal: React.FC<EventModalProps> = ({ variant, question, dialogue, questionsRemaining, onAnswer }) => {
    const skin = SKIN[variant];
    const isBoss = variant === 'boss';

    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [timeLeft, setTimeLeft] = useState(question.timeLimit);
    const answeredRef = useRef(false);

    // Kết luận một câu trả lời: hiện feedback + âm thanh + TTS rồi báo lên sau FEEDBACK_MS.
    const resolve = (correct: boolean) => {
        if (answeredRef.current) return;
        answeredRef.current = true;
        setFeedback(correct ? 'correct' : 'wrong');
        if (correct) soundManager.playCorrect(); else soundManager.playWrong();
        voiceSpeak(sample(correct ? CORRECT_DIALOGUES : WRONG_DIALOGUES)); // ducking đảm bảo qua voiceSpeak
        window.setTimeout(() => onAnswer(correct), FEEDBACK_MS);
    };

    const handleAnswer = (answer: string) => {
        const correct = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        resolve(correct);
    };

    // Boss: đếm giờ theo timeLimit của từng câu; reset khi đổi câu.
    useEffect(() => {
        if (!isBoss) return;
        answeredRef.current = false;
        setFeedback(null);
        setTimeLeft(question.timeLimit);
        const iv = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    window.clearInterval(iv);
                    resolve(false); // hết giờ = sai
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
        return () => window.clearInterval(iv);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.id, isBoss]);

    const timerRatio = timeLeft / question.timeLimit;
    const timerColor = timerRatio > 0.6 ? 'bg-green-500' : timerRatio > 0.3 ? 'bg-yellow-500' : 'bg-red-500';
    const replayText = [dialogue, questionToSpeech(question)].filter(Boolean).join('. ');

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200">
            <div className={`rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-300 ${skin.outer}`}
                style={{ maxHeight: '100dvh' }}>
                <div className={`relative ${skin.inner} p-5 md:p-8 max-h-[100dvh] overflow-y-auto`}>
                    {/* Sparkle cho buff */}
                    {variant === 'buff' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                            <div className="absolute top-6 left-6 text-3xl animate-ping">✨</div>
                            <div className="absolute top-12 right-8 text-2xl animate-pulse">⭐</div>
                            <div className="absolute bottom-8 left-12 text-xl animate-bounce">💫</div>
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 relative z-10">
                        {/* Cột câu hỏi */}
                        <QuestionPanel
                            question={question}
                            accent={skin.accent}
                            disabled={feedback !== null}
                            onAnswer={handleAnswer}
                        />

                        {/* Cột nhân vật + thoại (+ timer cho boss) */}
                        <div className="lg:w-72 flex-shrink-0 flex lg:items-center order-first lg:order-last">
                            <div className="text-center w-full">
                                <div className="mb-3 flex justify-center">
                                    <img
                                        src={skin.img}
                                        alt={variant}
                                        className={`w-24 h-24 md:w-36 md:h-36 object-contain drop-shadow-2xl ${skin.imgClass}`}
                                    />
                                </div>
                                <div className={`relative rounded-2xl p-3 md:p-4 border-2 ${skin.bubble}`}>
                                    <p className="text-base md:text-lg font-bold italic pr-8">"{dialogue}"</p>
                                    <VoiceButton text={replayText} size={18} className="absolute -top-2 -right-2" />
                                </div>

                                {isBoss && (
                                    <>
                                        <div className="flex items-center justify-center gap-2 my-3">
                                            <span className="text-sm font-bold text-slate-600">Câu còn lại:</span>
                                            <span className="text-2xl md:text-3xl font-black text-red-600">{questionsRemaining}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
                                            <div className={`h-full transition-all duration-100 ease-linear ${timerColor}`}
                                                style={{ width: `${timerRatio * 100}%` }} />
                                        </div>
                                        <div className="text-xl md:text-2xl font-black text-slate-600 mt-2">⏱️ {Math.ceil(timeLeft)}s</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lớp feedback đúng/sai */}
                    {feedback && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                            <div className={`flex flex-col items-center gap-2 px-6 py-4 rounded-3xl shadow-2xl animate-in zoom-in duration-200 ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
                                } text-white`}>
                                {feedback === 'correct' ? <Check size={64} strokeWidth={3} /> : <X size={64} strokeWidth={3} />}
                                <span className="text-2xl font-black">{feedback === 'correct' ? 'Chính xác!' : 'Chưa đúng!'}</span>
                                {feedback === 'wrong' && (
                                    <span className="text-sm font-semibold opacity-90">Đáp án: {question.correctAnswer}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
