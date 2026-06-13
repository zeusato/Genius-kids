import React, { useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { speak } from '@/src/utils/speech';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';

interface AdditionGameProps {
    rounds?: number;       // mặc định 12
    gameType: string;
    onBack: () => void;
}

type Variant = 'chooseSum' | 'build' | 'findGroup' | 'missing';

const OBJECTS = ['🍎', '🍓', '⭐', '🐟', '🌸', '🚗', '🍪', '🎈', '🐥', '🦋'];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface RoundData {
    variant: Variant;
    a: number;
    b: number;
    emoji: string;
    options: number[];      // cho chooseSum / missing / findGroup (số lượng từng giỏ)
}

const buildOptions = (correct: number, lo: number, hi: number, n = 4): number[] => {
    const set = new Set<number>([correct]);
    let guard = 0;
    while (set.size < n && guard++ < 50) {
        const v = randInt(lo, hi);
        if (v !== correct) set.add(v);
    }
    return shuffle([...set]);
};

const makeRound = (): RoundData => {
    const variant = pick<Variant>(['chooseSum', 'build', 'findGroup', 'missing']);
    const emoji = pick(OBJECTS);
    let a = randInt(1, 5);
    let b = randInt(1, 5);
    if (a + b > 10) b = 10 - a; // giữ tổng ≤ 10
    if (b < 1) b = 1;
    const sum = a + b;
    let options: number[] = [];
    if (variant === 'chooseSum' || variant === 'findGroup') options = buildOptions(sum, 1, 10);
    if (variant === 'missing') options = buildOptions(b, 0, Math.max(2, sum));
    return { variant, a, b, emoji, options };
};

/** Nhóm emoji nhỏ để minh hoạ số lượng. */
const ObjGroup: React.FC<{ n: number; emoji: string; size?: string }> = ({ n, emoji, size = 'text-3xl' }) => (
    <div className="flex flex-wrap items-center justify-center gap-1 max-w-[8rem]">
        {Array.from({ length: n }).map((_, i) => <span key={i} className={size}>{emoji}</span>)}
    </div>
);

/** Học cộng đơn giản (tổng ≤ 10) với nhiều dạng tương tác khác nhau. */
export const AdditionGame: React.FC<AdditionGameProps> = ({ rounds = 12, gameType, onBack }) => {
    const award = usePreschoolReward(gameType);
    const [order, setOrder] = useState<RoundData[]>(() => Array.from({ length: rounds }, makeRound));
    const [idx, setIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [firstTry, setFirstTry] = useState(true);
    const [wrong, setWrong] = useState<number[]>([]);
    const [solved, setSolved] = useState(false);
    const [basket, setBasket] = useState(0); // cho variant 'build'
    const [done, setDone] = useState(false);
    const [stars, setStars] = useState(0);

    const r = order[idx];
    const sum = r.a + r.b;

    const instruction = (() => {
        switch (r.variant) {
            case 'chooseSum': return `${r.a} cộng ${r.b} bằng mấy? Hãy chọn số đúng nhé!`;
            case 'findGroup': return `${r.a} cộng ${r.b} bằng mấy? Chạm vào giỏ có đúng số vật!`;
            case 'missing': return `${r.a} cộng mấy thì bằng ${sum}? Hãy chọn số đúng!`;
            case 'build': return `${r.a} cộng ${r.b} bằng mấy? Hãy lấy đủ số vật vào giỏ!`;
        }
    })();

    const next = (gained: boolean) => {
        const ns = score + (gained ? 1 : 0);
        setScore(ns);
        setSolved(true);
        soundManager.playCorrect();
        setTimeout(() => {
            if (idx + 1 >= rounds) {
                const earned = award(ns, rounds);
                setStars(earned); setDone(true);
            } else {
                setIdx(i => i + 1); setFirstTry(true); setWrong([]); setSolved(false); setBasket(0);
            }
        }, 950);
    };

    const reset = () => {
        setOrder(Array.from({ length: rounds }, makeRound));
        setIdx(0); setScore(0); setFirstTry(true); setWrong([]); setSolved(false); setBasket(0);
        setDone(false); setStars(0);
    };

    // Chọn 1 đáp án số (chooseSum / missing)
    const pickNumber = (val: number, correct: number) => {
        if (solved) return;
        if (val === correct) { next(firstTry); }
        else {
            soundManager.playWrong(); setFirstTry(false);
            setWrong(w => w.includes(val) ? w : [...w, val]);
            speak('Chưa đúng, thử lại nhé!', { lang: 'vi-VN' });
        }
    };

    // findGroup: các giỏ có số lượng = options; chạm giỏ đúng (= sum)
    // build: chạm để thêm/bớt quả vào giỏ
    const tapBuildAdd = () => {
        if (solved) return;
        const nb = basket + 1;
        setBasket(nb);
        soundManager.playNote(440 + nb * 60, 0.2);
    };
    const tapBuildRemove = () => { if (!solved && basket > 0) setBasket(b => b - 1); };

    const confirmBuild = () => {
        if (solved) return;
        if (basket === sum) {
            speak('Đúng rồi!', { lang: 'vi-VN' });
            next(firstTry);
        } else {
            soundManager.playWrong();
            setFirstTry(false);
            speak('Chưa đúng, hãy thử lại nhé!', { lang: 'vi-VN' });
        }
    };

    const numCls = (val: number, correct: number) =>
        `aspect-square rounded-2xl bg-white shadow-md flex items-center justify-center text-4xl font-extrabold text-brand-600 ring-4 transition-all active:scale-95 ${solved && val === correct ? 'ring-green-400 scale-105' : wrong.includes(val) ? 'ring-red-300 opacity-60' : 'ring-transparent hover:ring-brand-200'}`;

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-full">
                {order.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-teal-500' : i < idx ? 'w-2 bg-green-400' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">➕ {instruction}</p>
                <SpeakButton text={instruction} lang="vi-VN" autoPlay autoPlayKey={idx} size={26} />
            </div>

            {/* Phép tính trực quan */}
            {(r.variant === 'chooseSum' || r.variant === 'findGroup' || r.variant === 'build') && (
                <div className="bg-white rounded-3xl shadow-lg p-5 flex items-center justify-center gap-3 flex-wrap">
                    <ObjGroup n={r.a} emoji={r.emoji} />
                    <span className="text-4xl font-extrabold text-slate-400">+</span>
                    <ObjGroup n={r.b} emoji={r.emoji} />
                    <span className="text-4xl font-extrabold text-slate-400">=</span>
                    <span className="text-5xl font-extrabold text-teal-500">?</span>
                </div>
            )}
            {r.variant === 'missing' && (
                <div className="bg-white rounded-3xl shadow-lg p-5 flex items-center justify-center gap-3">
                    <span className="text-5xl font-extrabold text-brand-600">{r.a}</span>
                    <span className="text-4xl font-extrabold text-slate-400">+</span>
                    <span className="text-5xl font-extrabold text-teal-500">?</span>
                    <span className="text-4xl font-extrabold text-slate-400">=</span>
                    <span className="text-5xl font-extrabold text-brand-600">{sum}</span>
                </div>
            )}

            {/* Vùng tương tác */}
            {(r.variant === 'chooseSum' || r.variant === 'missing') && (
                <div className="grid grid-cols-4 gap-3 w-full max-w-md">
                    {r.options.map(val => {
                        const correct = r.variant === 'chooseSum' ? sum : r.b;
                        return <button key={val} onClick={() => pickNumber(val, correct)} className={numCls(val, correct)}>{val}</button>;
                    })}
                </div>
            )}

            {r.variant === 'findGroup' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
                    {r.options.map((cnt, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (solved) return;
                                if (cnt === sum) next(firstTry);
                                else { soundManager.playWrong(); setFirstTry(false); setWrong(w => [...w, i]); speak('Chưa đúng, đếm lại nhé!', { lang: 'vi-VN' }); }
                            }}
                            className={`rounded-2xl bg-white shadow-md p-3 min-h-[6rem] flex items-center justify-center ring-4 transition-all active:scale-95 ${solved && cnt === sum ? 'ring-green-400 scale-105' : wrong.includes(i) ? 'ring-red-300 opacity-60' : 'ring-transparent hover:ring-teal-200'}`}
                        >
                            <ObjGroup n={cnt} emoji={r.emoji} size="text-2xl" />
                        </button>
                    ))}
                </div>
            )}

            {r.variant === 'build' && (
                <div className="flex flex-col items-center gap-3">
                    <div className="bg-teal-50 border-2 border-dashed border-teal-300 rounded-3xl p-4 min-h-[6rem] w-72 flex flex-wrap items-center justify-center gap-1">
                        {Array.from({ length: basket }).map((_, i) => (
                            <button key={i} onClick={tapBuildRemove} className="text-3xl active:scale-90">{r.emoji}</button>
                        ))}
                        {basket === 0 && <span className="text-slate-400 font-semibold">Giỏ trống — chạm vật bên dưới để thêm</span>}
                    </div>
                    <p className="font-bold text-teal-600">Đã có: {basket} vật</p>
                    <div className="flex gap-4 items-center justify-center flex-wrap">
                        <button
                            onClick={tapBuildAdd}
                            disabled={solved}
                            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-lg font-extrabold shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            <span className="text-2xl">{r.emoji}</span> Thêm 1 vật
                        </button>
                        <button
                            onClick={confirmBuild}
                            disabled={solved || basket === 0}
                            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-lg font-extrabold shadow-lg active:scale-95 disabled:opacity-40"
                        >
                            ✓ Trả lời
                        </button>
                    </div>
                </div>
            )}

            <RewardBurst show={done} stars={stars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
