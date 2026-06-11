import React, { useMemo, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { PlanetData } from '../../data/solarData';
import { SOLAR_QUIZ, BADGE_STAR_REWARD } from '../../data/solarQuizData';
import { useStudent, useStudentActions } from '../../contexts/StudentContext';

interface SolarQuizProps {
    planet: PlanetData;
    onClose: () => void;
}

// Vòng lặp học của Professor Astro Cat: đọc fact → trả lời 3 câu → nhận huy hiệu.
// KHÔNG phạt khi sai: đáp án sai bị mờ đi và bé thử lại đến khi đúng.
export const SolarQuiz: React.FC<SolarQuizProps> = ({ planet, onClose }) => {
    const questions = SOLAR_QUIZ[planet.id] ?? [];
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();

    const [questionIndex, setQuestionIndex] = useState(0);
    const [wrongPicks, setWrongPicks] = useState<number[]>([]);
    const [correctPicked, setCorrectPicked] = useState(false);
    const [finished, setFinished] = useState(false);

    const alreadyOwned = useMemo(
        () => !!currentStudent?.solarBadges?.includes(planet.id),
        // chốt trạng thái lúc mở quiz — sau khi trao huy hiệu vẫn hiển thị màn "mới nhận"
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const question = questions[questionIndex];

    const handlePick = (index: number) => {
        if (correctPicked || finished) return;
        if (index === question.correctIndex) {
            setCorrectPicked(true);
            setTimeout(() => {
                if (questionIndex + 1 < questions.length) {
                    setQuestionIndex(questionIndex + 1);
                    setWrongPicks([]);
                    setCorrectPicked(false);
                } else {
                    if (!alreadyOwned && currentStudent) {
                        updateStudent({
                            ...currentStudent,
                            stars: currentStudent.stars + BADGE_STAR_REWARD,
                            solarBadges: [...(currentStudent.solarBadges ?? []), planet.id]
                        });
                    }
                    setFinished(true);
                }
            }, 800);
        } else {
            setWrongPicks(prev => (prev.includes(index) ? prev : [...prev, index]));
        }
    };

    const badgeGradient = `radial-gradient(circle at 30% 30%, ${planet.gradientColors[0]}, ${planet.gradientColors[1]}, ${planet.gradientColors[2] || planet.gradientColors[1]})`;

    if (questions.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-800 border border-white/15 rounded-3xl p-6 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                    <X size={18} />
                </button>

                {!finished ? (
                    <>
                        {/* Tiến độ 3 chấm */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🎯</span>
                            <span className="text-white font-bold">Thử thách {planet.name}</span>
                            <div className="flex gap-1.5 ml-auto">
                                {questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full ${i < questionIndex || (i === questionIndex && correctPicked)
                                            ? 'bg-green-400'
                                            : i === questionIndex
                                                ? 'bg-yellow-400'
                                                : 'bg-white/20'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <p className="text-white text-lg font-semibold mb-5 leading-snug">
                            {question.question}
                        </p>

                        <div className="space-y-2.5">
                            {question.options.map((option, i) => {
                                const isWrong = wrongPicks.includes(i);
                                const isCorrect = correctPicked && i === question.correctIndex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handlePick(i)}
                                        disabled={isWrong || correctPicked}
                                        className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all
                                            ${isCorrect
                                                ? 'bg-green-500/30 border-green-400 text-green-100 scale-[1.02]'
                                                : isWrong
                                                    ? 'bg-red-500/10 border-red-400/40 text-white/40 line-through'
                                                    : 'bg-white/5 border-white/15 text-white hover:bg-white/15 active:scale-[0.98]'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Phản hồi tích cực, không phạt */}
                        <div className="h-8 mt-4 text-center">
                            {correctPicked && (
                                <span className="text-green-300 font-bold animate-in zoom-in duration-300 inline-flex items-center gap-1">
                                    <Sparkles size={16} /> Chính xác! Giỏi quá!
                                </span>
                            )}
                            {!correctPicked && wrongPicks.length > 0 && (
                                <span className="text-yellow-300 font-semibold">Chưa đúng — thử lại nhé! 💪</span>
                            )}
                        </div>
                    </>
                ) : (
                    /* Màn nhận huy hiệu */
                    <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                        <div
                            className="w-24 h-24 mx-auto rounded-full shadow-[0_0_40px_rgba(250,204,21,0.45)] ring-4 ring-yellow-300/60 mb-4"
                            style={{ background: badgeGradient }}
                        />
                        <h3 className="text-2xl font-black text-white mb-1">
                            {alreadyOwned ? 'Giỏi quá! 🎉' : 'Huy hiệu mới! 🎉'}
                        </h3>
                        {alreadyOwned ? (
                            <p className="text-slate-300 text-sm mb-5">
                                Bé đã có huy hiệu {planet.name} rồi — trả lời đúng hết vẫn siêu đỉnh!
                            </p>
                        ) : (
                            <p className="text-slate-300 text-sm mb-5">
                                Bé nhận được huy hiệu <span className="font-bold text-white">{planet.name}</span>
                                {' '}và <span className="font-bold text-yellow-300">+{BADGE_STAR_REWARD} ⭐</span>!
                            </p>
                        )}
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg transition-all"
                        >
                            Tuyệt vời!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
