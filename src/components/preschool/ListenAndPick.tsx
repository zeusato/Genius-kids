import React, { useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { speak, type SpeechLang } from '@/src/utils/speech';
import { TokenVisual } from './TokenVisual';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';
import type { PreschoolToken } from './types';

interface ListenAndPickProps {
    tokens: PreschoolToken[];
    /** Câu lệnh tiếng Việt, vd "Hãy chọn chữ", "Hãy chọn số", "Hãy chọn màu". */
    instructionVi: string;
    optionCount?: number;   // mặc định 4
    rounds?: number;        // mặc định 8
    optionSize?: 'md' | 'sm';
    gameType: string;       // để trao thưởng
    onBack: () => void;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

interface Round { target: PreschoolToken; options: PreschoolToken[]; }

/** Quiz "nghe và chọn": đọc to yêu cầu (Việt + từ Anh/Việt), bé chạm đúng token. */
export const ListenAndPick: React.FC<ListenAndPickProps> = ({
    tokens, instructionVi, optionCount = 4, rounds = 8, optionSize = 'md', gameType, onBack,
}) => {
    const award = usePreschoolReward(gameType);
    const n = Math.min(optionCount, tokens.length);
    const totalRounds = Math.min(rounds, tokens.length);

    const buildRounds = (): Round[] => {
        const order = shuffle(tokens).slice(0, totalRounds);
        return order.map(target => {
            const distractors = shuffle(tokens.filter(t => t.id !== target.id)).slice(0, n - 1);
            return { target, options: shuffle([target, ...distractors]) };
        });
    };

    const [rds, setRds] = useState<Round[]>(buildRounds);
    const [roundIdx, setRoundIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [firstTry, setFirstTry] = useState(true);
    const [wrongIds, setWrongIds] = useState<string[]>([]);
    const [correctId, setCorrectId] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [earnedStars, setEarnedStars] = useState(0);

    const round = rds[roundIdx];

    const questionParts: { text: string; lang: SpeechLang }[] = [
        { text: instructionVi, lang: 'vi-VN' },
        { text: round.target.enText, lang: 'en-US' },
        { text: round.target.viText, lang: 'vi-VN' },
    ];

    const reset = () => {
        setRds(buildRounds());
        setRoundIdx(0); setScore(0); setFirstTry(true);
        setWrongIds([]); setCorrectId(null); setDone(false); setEarnedStars(0);
    };

    const handlePick = (opt: PreschoolToken) => {
        if (correctId) return; // đã đúng, chờ chuyển câu
        if (opt.id === round.target.id) {
            soundManager.playCorrect();
            setCorrectId(opt.id);
            const newScore = score + (firstTry ? 1 : 0);
            setScore(newScore);
            setTimeout(() => {
                if (roundIdx + 1 >= totalRounds) {
                    const stars = award(newScore, totalRounds);
                    setEarnedStars(stars);
                    setDone(true);
                } else {
                    setRoundIdx(i => i + 1);
                    setFirstTry(true); setWrongIds([]); setCorrectId(null);
                }
            }, 900);
        } else {
            soundManager.playWrong();
            setFirstTry(false);
            setWrongIds(ids => ids.includes(opt.id) ? ids : [...ids, opt.id]);
            speak('Thử lại nhé!', { lang: 'vi-VN' });
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-1.5">
                {rds.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === roundIdx ? 'w-6 bg-brand-500' : i < roundIdx ? 'w-2 bg-green-400' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            {/* Yêu cầu + nút nghe lại (tự đọc mỗi câu) */}
            <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">👂 {instructionVi}…</p>
                <SpeakButton parts={questionParts} autoPlay autoPlayKey={roundIdx} size={28} />
            </div>

            {/* Lựa chọn */}
            <div className={`grid gap-4 ${n <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} w-full max-w-2xl`}>
                {round.options.map(opt => {
                    const isWrong = wrongIds.includes(opt.id);
                    const isRight = correctId === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => handlePick(opt)}
                            className={`aspect-square rounded-3xl bg-white shadow-lg p-2 transition-all active:scale-95 ring-4 ${isRight ? 'ring-green-400 scale-105' : isWrong ? 'ring-red-300 opacity-60' : 'ring-transparent hover:ring-brand-200'}`}
                        >
                            <TokenVisual token={{ ...opt, label: undefined }} size={optionSize} />
                        </button>
                    );
                })}
            </div>

            <RewardBurst show={done} stars={earnedStars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
