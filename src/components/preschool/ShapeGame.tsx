import React, { useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { speak } from '@/src/utils/speech';
import { ShapeIcon } from './ShapeIcon';
import { SHAPES_DATA, SHAPE_COLORS, type ShapeId, type ShapeItem } from '@/src/data/shapesData';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';

interface ShapeGameProps {
    rounds?: number;     // mặc định 10
    gameType: string;
    onBack: () => void;
}

type Variant = 'pick' | 'findAll';
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Cell { key: string; shape: ShapeId; }
interface RoundData {
    variant: Variant;
    target: ShapeItem;
    options: ShapeId[];   // pick
    cells: Cell[];        // findAll
}

const makeRound = (): RoundData => {
    const variant = pickOne<Variant>(['pick', 'pick', 'findAll']); // pick nhiều hơn cho dễ
    const target = pickOne(SHAPES_DATA);
    const others = shuffle(SHAPES_DATA.filter(s => s.id !== target.id));
    const options = shuffle([target.id, ...others.slice(0, 3).map(s => s.id)]);

    // findAll: lưới 6 ô, 2-3 ô là target, còn lại khác.
    const targetCount = 2 + Math.floor(Math.random() * 2); // 2..3
    const cells: Cell[] = [];
    for (let i = 0; i < targetCount; i++) cells.push({ key: 't' + i, shape: target.id });
    const fillers = shuffle(SHAPES_DATA.filter(s => s.id !== target.id));
    for (let i = 0; i < 6 - targetCount; i++) cells.push({ key: 'f' + i, shape: fillers[i % fillers.length].id });
    return { variant, target, options, cells: shuffle(cells) };
};

export const ShapeGame: React.FC<ShapeGameProps> = ({ rounds = 10, gameType, onBack }) => {
    const award = usePreschoolReward(gameType);
    const [order, setOrder] = useState<RoundData[]>(() => Array.from({ length: rounds }, makeRound));
    const [idx, setIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [firstTry, setFirstTry] = useState(true);
    const [wrong, setWrong] = useState<string[]>([]);
    const [solvedKey, setSolvedKey] = useState<string | null>(null);
    const [selected, setSelected] = useState<string[]>([]); // findAll
    const [done, setDone] = useState(false);
    const [stars, setStars] = useState(0);

    const r = order[idx];
    const nameOf = (id: ShapeId) => SHAPES_DATA.find(s => s.id === id)!.viName;

    const instruction = r.variant === 'pick'
        ? `Hãy chọn ${r.target.viName}!`
        : `Hãy chọn tất cả ${r.target.viName}!`;

    const advance = (gained: boolean) => {
        const ns = score + (gained ? 1 : 0);
        setScore(ns);
        soundManager.playCorrect();
        setTimeout(() => {
            if (idx + 1 >= rounds) { const e = award(ns, rounds); setStars(e); setDone(true); }
            else { setIdx(i => i + 1); setFirstTry(true); setWrong([]); setSolvedKey(null); setSelected([]); }
        }, 950);
    };

    const reset = () => {
        setOrder(Array.from({ length: rounds }, makeRound));
        setIdx(0); setScore(0); setFirstTry(true); setWrong([]); setSolvedKey(null); setSelected([]); setDone(false); setStars(0);
    };

    // pick: chạm 1 hình
    const pickShape = (shape: ShapeId, key: string) => {
        if (solvedKey) return;
        if (shape === r.target.id) { setSolvedKey(key); speak(r.target.viName, { lang: 'vi-VN' }); advance(firstTry); }
        else {
            soundManager.playWrong(); setFirstTry(false); setWrong(w => [...w, key]);
            speak(`Đây là ${nameOf(shape)}. Thử lại nhé!`, { lang: 'vi-VN' });
        }
    };

    // findAll: chọn nhiều, đọc tên khi chạm, "Xong" để kiểm tra
    const toggleCell = (key: string, shape: ShapeId) => {
        if (solvedKey === 'done') return;
        soundManager.playClick();
        speak(nameOf(shape), { lang: 'vi-VN' });
        setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
    };
    const checkFindAll = () => {
        if (solvedKey === 'done') return;
        const correctKeys = r.cells.filter(c => c.shape === r.target.id).map(c => c.key).sort().join(',');
        const chosenKeys = [...selected].sort().join(',');
        if (correctKeys === chosenKeys) { setSolvedKey('done'); advance(firstTry); }
        else { soundManager.playWrong(); setFirstTry(false); speak('Chưa đúng, hãy chọn lại nhé!', { lang: 'vi-VN' }); }
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-full">
                {order.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-fuchsia-500' : i < idx ? 'w-2 bg-green-400' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">🔷 {instruction}</p>
                <SpeakButton text={instruction} lang="vi-VN" autoPlay autoPlayKey={idx} size={26} />
            </div>

            {r.variant === 'pick' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
                    {r.options.map((id, i) => {
                        const key = id + i;
                        const isRight = solvedKey === key;
                        const isWrong = wrong.includes(key);
                        return (
                            <button
                                key={key}
                                onClick={() => pickShape(id, key)}
                                className={`aspect-square rounded-3xl bg-white shadow-lg p-4 ring-4 transition-all active:scale-95 ${isRight ? 'ring-green-400 scale-105' : isWrong ? 'ring-red-300 opacity-60' : 'ring-transparent hover:ring-fuchsia-200'}`}
                            >
                                <ShapeIcon shape={id} fill={SHAPE_COLORS[id]} />
                            </button>
                        );
                    })}
                </div>
            )}

            {r.variant === 'findAll' && (
                <>
                    <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
                        {r.cells.map(c => {
                            const sel = selected.includes(c.key);
                            return (
                                <button
                                    key={c.key}
                                    onClick={() => toggleCell(c.key, c.shape)}
                                    className={`aspect-square rounded-3xl bg-white shadow-lg p-4 ring-4 transition-all active:scale-95 ${sel ? 'ring-fuchsia-500 scale-105' : 'ring-transparent hover:ring-fuchsia-200'}`}
                                >
                                    <ShapeIcon shape={c.shape} fill={SHAPE_COLORS[c.shape]} />
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={checkFindAll}
                        disabled={selected.length === 0 || solvedKey === 'done'}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white text-lg font-extrabold shadow-lg active:scale-95 disabled:opacity-40"
                    >
                        ✓ Xong
                    </button>
                </>
            )}

            <RewardBurst show={done} stars={stars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
