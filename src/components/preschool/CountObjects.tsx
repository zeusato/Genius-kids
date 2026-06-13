import React, { useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { speak } from '@/src/utils/speech';
import { TokenVisual } from './TokenVisual';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';
import type { PreschoolToken } from './types';

export interface CountItem { value: number; emoji: string; enName: string; viName: string; }

interface CountObjectsProps {
    items: CountItem[];     // chỉ dùng value >= 1
    rounds?: number;        // mặc định 6
    gameType: string;
    onBack: () => void;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Số đếm tiếng Việt để đọc to khi bé chạm từng vật.
const VI_NUM = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];

/** Đếm đồ vật: hiện N vật (chạm để đếm to), rồi chọn số đúng. */
export const CountObjects: React.FC<CountObjectsProps> = ({ items, rounds = 6, gameType, onBack }) => {
    const award = usePreschoolReward(gameType);
    const pool = items.filter(i => i.value >= 1);
    const totalRounds = Math.min(rounds, pool.length);

    const build = () => shuffle(pool).slice(0, totalRounds);

    const [order, setOrder] = useState<CountItem[]>(build);
    const [roundIdx, setRoundIdx] = useState(0);
    const [counted, setCounted] = useState<number[]>([]); // index các vật đã chạm
    const [firstTry, setFirstTry] = useState(true);
    const [score, setScore] = useState(0);
    const [wrongVals, setWrongVals] = useState<number[]>([]);
    const [correct, setCorrect] = useState(false);
    const [done, setDone] = useState(false);
    const [earnedStars, setEarnedStars] = useState(0);

    const target = order[roundIdx];

    // 4 lựa chọn số: đáp án đúng + 3 số khác
    const buildOptions = (t: CountItem): number[] => {
        const others = shuffle(pool.map(p => p.value).filter(v => v !== t.value)).slice(0, 3);
        return shuffle([t.value, ...others]);
    };
    const [options, setOptions] = useState<number[]>(() => buildOptions(order[0]));

    const reset = () => {
        const o = build();
        setOrder(o); setRoundIdx(0); setCounted([]); setFirstTry(true);
        setScore(0); setWrongVals([]); setCorrect(false); setDone(false); setEarnedStars(0);
        setOptions(buildOptions(o[0]));
    };

    const tapObject = (i: number) => {
        if (counted.includes(i)) return;
        const next = [...counted, i];
        setCounted(next);
        soundManager.playNote(440 + next.length * 70, 0.25);
        // đọc to số đang đếm bằng tiếng Việt: một, hai, ba...
        speak(VI_NUM[next.length] ?? String(next.length), { lang: 'vi-VN' });
    };

    const pickNumber = (val: number) => {
        if (correct) return;
        if (val === target.value) {
            soundManager.playCorrect();
            setCorrect(true);
            const ns = score + (firstTry ? 1 : 0);
            setScore(ns);
            setTimeout(() => {
                if (roundIdx + 1 >= totalRounds) {
                    const stars = award(ns, totalRounds);
                    setEarnedStars(stars); setDone(true);
                } else {
                    const ni = roundIdx + 1;
                    setRoundIdx(ni); setCounted([]); setFirstTry(true);
                    setWrongVals([]); setCorrect(false); setOptions(buildOptions(order[ni]));
                }
            }, 900);
        } else {
            soundManager.playWrong();
            setFirstTry(false);
            setWrongVals(v => v.includes(val) ? v : [...v, val]);
            speak('Chưa đúng, đếm lại nhé!', { lang: 'vi-VN' });
        }
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-1.5">
                {order.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === roundIdx ? 'w-6 bg-teal-500' : i < roundIdx ? 'w-2 bg-green-400' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">🔢 Có mấy đồ vật? Hãy đếm rồi chọn số đúng!</p>
                <SpeakButton text="Có mấy đồ vật? Hãy đếm rồi chọn số đúng nhé!" lang="vi-VN" autoPlay autoPlayKey={roundIdx} size={26} />
            </div>

            {/* Vật để đếm */}
            <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-xl min-h-[8rem] flex flex-wrap items-center justify-center gap-3">
                {Array.from({ length: target.value }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => tapObject(i)}
                        className={`text-5xl transition-all active:scale-90 ${counted.includes(i) ? 'opacity-40 scale-90' : 'hover:scale-110'}`}
                    >
                        {target.emoji}
                    </button>
                ))}
            </div>

            {/* Chọn số */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-md">
                {options.map(val => {
                    const tok: PreschoolToken = { id: 'n' + val, kind: 'text', big: String(val), enText: '', viText: '' };
                    const isWrong = wrongVals.includes(val);
                    const isRight = correct && val === target.value;
                    return (
                        <button
                            key={val}
                            onClick={() => pickNumber(val)}
                            className={`aspect-square rounded-2xl bg-white shadow-md transition-all active:scale-95 ring-4 ${isRight ? 'ring-green-400 scale-105' : isWrong ? 'ring-red-300 opacity-60' : 'ring-transparent hover:ring-teal-200'}`}
                        >
                            <TokenVisual token={tok} size="md" />
                        </button>
                    );
                })}
            </div>

            <RewardBurst show={done} stars={earnedStars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
