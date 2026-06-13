import React, { useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { speak } from '@/src/utils/speech';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';

interface CompareGameProps {
    rounds?: number;     // mặc định 12
    gameType: string;
    onBack: () => void;
}

type CmpType = 'number' | 'count' | 'length' | 'height' | 'size';
type Dir = 'more' | 'less';

const OBJECTS = ['🍎', '🐟', '⭐', '🌸', '🚗', '🐥', '🦋', '🍓'];
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899'];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface RoundData {
    type: CmpType;
    dir: Dir;
    valA: number;
    valB: number;
    emoji: string;
    color: string;
}

const makeRound = (): RoundData => {
    const type = pick<CmpType>(['number', 'count', 'length', 'height', 'size']);
    const dir = pick<Dir>(['more', 'less']);
    const ranges: Record<CmpType, [number, number]> = {
        number: [1, 10], count: [1, 8], length: [3, 10], height: [3, 10], size: [1, 5],
    };
    const [lo, hi] = ranges[type];
    let valA = randInt(lo, hi);
    let valB = randInt(lo, hi);
    while (valB === valA) valB = randInt(lo, hi);
    return { type, dir, valA, valB, emoji: pick(OBJECTS), color: pick(COLORS) };
};

const instructionFor = (r: RoundData): string => {
    const more = r.dir === 'more';
    switch (r.type) {
        case 'number': return more ? 'Hãy chọn số lớn hơn!' : 'Hãy chọn số nhỏ hơn!';
        case 'count': return more ? 'Bên nào có nhiều hơn? Hãy chọn!' : 'Bên nào có ít hơn? Hãy chọn!';
        case 'length': return more ? 'Hãy chọn vật dài hơn!' : 'Hãy chọn vật ngắn hơn!';
        case 'height': return more ? 'Hãy chọn vật cao hơn!' : 'Hãy chọn vật thấp hơn!';
        case 'size': return more ? 'Hãy chọn vật to hơn!' : 'Hãy chọn vật nhỏ hơn!';
    }
};

/** Render một "phía" theo loại so sánh. */
const SideVisual: React.FC<{ r: RoundData; val: number }> = ({ r, val }) => {
    if (r.type === 'number') {
        return <span className="text-7xl font-extrabold" style={{ color: r.color }}>{val}</span>;
    }
    if (r.type === 'count') {
        return (
            <div className="flex flex-wrap items-center justify-center gap-1 max-w-[10rem]">
                {Array.from({ length: val }).map((_, i) => <span key={i} className="text-3xl">{r.emoji}</span>)}
            </div>
        );
    }
    if (r.type === 'length') {
        return <div className="rounded-full" style={{ backgroundColor: r.color, width: `${val * 22}px`, height: '26px' }} />;
    }
    if (r.type === 'height') {
        return <div className="rounded-xl self-end" style={{ backgroundColor: r.color, height: `${val * 20}px`, width: '46px' }} />;
    }
    // size
    return <span style={{ fontSize: `${val * 0.9 + 1.2}rem`, lineHeight: 1 }}>{r.emoji}</span>;
};

/** Học so sánh: lớn/nhỏ, nhiều/ít, dài/ngắn, cao/thấp, to/nhỏ — nhiều dạng. */
export const CompareGame: React.FC<CompareGameProps> = ({ rounds = 12, gameType, onBack }) => {
    const award = usePreschoolReward(gameType);
    const [order, setOrder] = useState<RoundData[]>(() => Array.from({ length: rounds }, makeRound));
    const [idx, setIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [firstTry, setFirstTry] = useState(true);
    const [chosen, setChosen] = useState<'A' | 'B' | null>(null);
    const [wrongSide, setWrongSide] = useState<'A' | 'B' | null>(null);
    const [done, setDone] = useState(false);
    const [stars, setStars] = useState(0);

    const r = order[idx];
    const correctSide: 'A' | 'B' = (() => {
        const aWins = r.dir === 'more' ? r.valA > r.valB : r.valA < r.valB;
        return aWins ? 'A' : 'B';
    })();

    const reset = () => {
        setOrder(Array.from({ length: rounds }, makeRound));
        setIdx(0); setScore(0); setFirstTry(true); setChosen(null); setWrongSide(null); setDone(false); setStars(0);
    };

    const choose = (side: 'A' | 'B') => {
        if (chosen) return;
        if (side === correctSide) {
            soundManager.playCorrect();
            setChosen(side);
            const ns = score + (firstTry ? 1 : 0);
            setScore(ns);
            setTimeout(() => {
                if (idx + 1 >= rounds) { const e = award(ns, rounds); setStars(e); setDone(true); }
                else { setIdx(i => i + 1); setFirstTry(true); setChosen(null); setWrongSide(null); }
            }, 950);
        } else {
            soundManager.playWrong();
            setFirstTry(false);
            setWrongSide(side);
            speak('Chưa đúng, thử lại nhé!', { lang: 'vi-VN' });
            setTimeout(() => setWrongSide(null), 700);
        }
    };

    const instruction = instructionFor(r);
    const sideCls = (side: 'A' | 'B') =>
        `flex-1 min-h-[12rem] rounded-3xl bg-white shadow-lg flex items-center justify-center p-4 ring-4 transition-all active:scale-95 ${chosen === side ? 'ring-green-400 scale-105' : wrongSide === side ? 'ring-red-300' : 'ring-transparent hover:ring-brand-200'}`;

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-full">
                {order.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-teal-500' : i < idx ? 'w-2 bg-green-400' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">⚖️ {instruction}</p>
                <SpeakButton text={instruction} lang="vi-VN" autoPlay autoPlayKey={idx} size={26} />
            </div>

            <div className="flex items-stretch gap-4 w-full max-w-2xl">
                <button onClick={() => choose('A')} className={sideCls('A')}>
                    <SideVisual r={r} val={r.valA} />
                </button>
                <button onClick={() => choose('B')} className={sideCls('B')}>
                    <SideVisual r={r} val={r.valB} />
                </button>
            </div>

            <RewardBurst show={done} stars={stars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
