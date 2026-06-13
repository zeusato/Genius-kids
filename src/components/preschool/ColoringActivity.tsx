import React, { useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { speakSequence, speak } from '@/src/utils/speech';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';

export interface ColorChoice { id: string; hex: string; enName: string; viName: string; light?: boolean; }

interface ColoringActivityProps {
    colors: ColorChoice[];
    rounds?: number;        // mặc định 5
    gameType: string;
    onBack: () => void;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Các hình đơn giản để tô (path trong viewBox 0 0 120 120).
const SHAPES: { id: string; viName: string; path: string; extra?: (fill: string) => React.ReactNode }[] = [
    { id: 'balloon', viName: 'quả bóng bay', path: 'M60 12 C30 12 22 48 38 74 C46 88 54 92 60 96 C66 92 74 88 82 74 C98 48 90 12 60 12 Z', extra: () => <line x1="60" y1="96" x2="60" y2="116" stroke="#94a3b8" strokeWidth="2" /> },
    { id: 'star', viName: 'ngôi sao', path: 'M60 8 L73 46 L114 46 L81 70 L94 110 L60 86 L26 110 L39 70 L6 46 L47 46 Z' },
    { id: 'heart', viName: 'trái tim', path: 'M60 104 C20 74 10 46 28 30 C42 18 58 26 60 40 C62 26 78 18 92 30 C110 46 100 74 60 104 Z' },
    { id: 'fish', viName: 'con cá', path: 'M20 60 C30 36 70 36 86 60 C70 84 30 84 20 60 Z M86 60 L112 44 L112 76 Z' },
];

/** Tô màu theo yêu cầu: nghe lệnh tiếng Việt rồi chọn đúng màu để tô hình. */
export const ColoringActivity: React.FC<ColoringActivityProps> = ({ colors, rounds = 5, gameType, onBack }) => {
    const award = usePreschoolReward(gameType);
    const totalRounds = Math.min(rounds, SHAPES.length * 2);

    const buildRound = () => {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const target = colors[Math.floor(Math.random() * colors.length)];
        const others = shuffle(colors.filter(c => c.id !== target.id)).slice(0, 5);
        const palette = shuffle([target, ...others]);
        return { shape, target, palette };
    };

    const [round, setRound] = useState(buildRound);
    const [roundIdx, setRoundIdx] = useState(0);
    const [fill, setFill] = useState('#e5e7eb');
    const [firstTry, setFirstTry] = useState(true);
    const [score, setScore] = useState(0);
    const [correct, setCorrect] = useState(false);
    const [done, setDone] = useState(false);
    const [earnedStars, setEarnedStars] = useState(0);

    const instruction = `Hãy tô ${round.shape.viName} màu ${round.target.viName}!`;

    const reset = () => {
        setRound(buildRound()); setRoundIdx(0); setFill('#e5e7eb');
        setFirstTry(true); setScore(0); setCorrect(false); setDone(false); setEarnedStars(0);
    };

    const pickColor = (c: ColorChoice) => {
        if (correct) return;
        setFill(c.hex);
        if (c.id === round.target.id) {
            soundManager.playCorrect();
            setCorrect(true);
            const ns = score + (firstTry ? 1 : 0);
            setScore(ns);
            speak('Đẹp quá!', { lang: 'vi-VN' });
            setTimeout(() => {
                if (roundIdx + 1 >= totalRounds) {
                    const stars = award(ns, totalRounds);
                    setEarnedStars(stars); setDone(true);
                } else {
                    setRoundIdx(i => i + 1);
                    setRound(buildRound());
                    setFill('#e5e7eb'); setFirstTry(true); setCorrect(false);
                }
            }, 1000);
        } else {
            soundManager.playWrong();
            setFirstTry(false);
            speakSequence([{ text: c.enName, lang: 'en-US' }, { text: `Đây là màu ${c.viName}. Thử lại nhé!`, lang: 'vi-VN' }]);
        }
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-1.5">
                {Array.from({ length: totalRounds }).map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === roundIdx ? 'w-6 bg-fuchsia-500' : i < roundIdx ? 'w-2 bg-green-400' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">🎨 {instruction}</p>
                <SpeakButton text={instruction} lang="vi-VN" autoPlay autoPlayKey={roundIdx} size={26} />
            </div>

            {/* Hình để tô */}
            <div className="bg-white rounded-3xl shadow-lg p-4">
                <svg viewBox="0 0 120 120" className="w-48 h-48 sm:w-56 sm:h-56">
                    <path d={round.shape.path} fill={fill} stroke="#475569" strokeWidth="2.5" strokeLinejoin="round" />
                    {round.shape.extra?.(fill)}
                </svg>
            </div>

            {/* Bảng màu */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full max-w-lg">
                {round.palette.map(c => (
                    <button
                        key={c.id}
                        onClick={() => pickColor(c)}
                        className={`aspect-square rounded-2xl shadow-md ring-4 transition-all active:scale-90 ${correct && c.id === round.target.id ? 'ring-green-400 scale-110' : 'ring-black/5 hover:scale-105'}`}
                        style={{ backgroundColor: c.hex }}
                        aria-label={c.viName}
                    />
                ))}
            </div>

            <RewardBurst show={done} stars={earnedStars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
