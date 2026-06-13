import React, { useEffect, useRef, useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { speak } from '@/src/utils/speech';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';
import { getWordBank, expandWordBankWithGemini, type WordBank } from '@/services/wordBankService';

interface WordStartGameProps {
    rounds?: number;     // mặc định 10
    gameType: string;
    onBack: () => void;
}

type Mode = 'allStart' | 'oneStart' | 'oneNotStart';
interface Card { word: string; emoji: string; letter: string; }
interface RoundData { mode: Mode; letter: string; cards: Card[]; correct: string[]; }

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const flatten = (bank: WordBank): Card[] =>
    Object.entries(bank).flatMap(([letter, arr]) => arr.map(e => ({ word: e.word, emoji: e.emoji, letter })));

const makeRound = (bank: WordBank): RoundData => {
    const flat = flatten(bank);
    const byMin = (min: number) => Object.keys(bank).filter(L => bank[L].length >= min);
    let mode = pick<Mode>(['allStart', 'oneStart', 'oneNotStart']);
    // chọn chữ cái đủ số từ cho mode
    let pool = mode === 'oneNotStart' ? byMin(3) : mode === 'allStart' ? byMin(2) : byMin(1);
    if (pool.length === 0) { mode = 'oneStart'; pool = byMin(1); }
    const letter = pick(pool);
    const targetWords = shuffle(bank[letter].map(e => ({ word: e.word, emoji: e.emoji, letter })));
    const others = shuffle(flat.filter(w => w.letter !== letter));

    if (mode === 'oneStart') {
        const t = targetWords[0];
        return { mode, letter, cards: shuffle([t, ...others.slice(0, 3)]), correct: [t.word] };
    }
    if (mode === 'oneNotStart') {
        const t3 = targetWords.slice(0, 3);
        const odd = others[0];
        return { mode, letter, cards: shuffle([...t3, odd]), correct: [odd.word] };
    }
    // allStart
    const k = Math.min(3, targetWords.length);
    const tk = targetWords.slice(0, k);
    const distract = others.slice(0, 6 - k);
    return { mode, letter, cards: shuffle([...tk, ...distract]), correct: tk.map(w => w.word) };
};

export const WordStartGame: React.FC<WordStartGameProps> = ({ rounds = 10, gameType, onBack }) => {
    const award = usePreschoolReward(gameType);
    const bankRef = useRef<WordBank>(getWordBank());
    const [order, setOrder] = useState<RoundData[]>(() => Array.from({ length: rounds }, () => makeRound(bankRef.current)));
    const [idx, setIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [firstTry, setFirstTry] = useState(true);
    const [selected, setSelected] = useState<string[]>([]);
    const [wrong, setWrong] = useState<string[]>([]);
    const [locked, setLocked] = useState(false);
    const [done, setDone] = useState(false);
    const [stars, setStars] = useState(0);

    // Mở rộng kho từ bằng Gemini NGAY TRONG ván đầu (chạy ngầm, không chặn chơi).
    // Kết quả lưu localStorage để dùng cho các lần chơi sau.
    useEffect(() => {
        expandWordBankWithGemini().then(merged => { if (merged) bankRef.current = merged; }).catch(() => { });
    }, []);

    const r = order[idx];
    const multi = r.mode === 'allStart';
    const LETTER = r.letter.toUpperCase();
    const instruction = r.mode === 'allStart'
        ? `Hãy chọn tất cả từ bắt đầu bằng chữ ${LETTER}!`
        : r.mode === 'oneStart'
            ? `Hãy chọn từ bắt đầu bằng chữ ${LETTER}!`
            : `Hãy chọn từ KHÔNG bắt đầu bằng chữ ${LETTER}!`;

    const readInstruction = r.mode === 'allStart'
        ? 'Hãy chọn tất cả từ bắt đầu bằng chữ'
        : r.mode === 'oneStart'
            ? 'Hãy chọn từ bắt đầu bằng chữ'
            : 'Hãy chọn từ KHÔNG bắt đầu bằng chữ';

    const advance = (gained: boolean) => {
        const ns = score + (gained ? 1 : 0);
        setScore(ns);
        soundManager.playCorrect();
        setLocked(true);
        setTimeout(() => {
            if (idx + 1 >= rounds) { const e = award(ns, rounds); setStars(e); setDone(true); }
            else { setIdx(i => i + 1); setFirstTry(true); setSelected([]); setWrong([]); setLocked(false); }
        }, 950);
    };

    const reset = () => {
        setOrder(Array.from({ length: rounds }, () => makeRound(bankRef.current)));
        setIdx(0); setScore(0); setFirstTry(true); setSelected([]); setWrong([]); setLocked(false); setDone(false); setStars(0);
    };

    const tapCard = (card: Card) => {
        if (locked) return;
        speak(card.word, { lang: 'en-US' }); // luôn đọc từ khi bấm
        if (multi) {
            setSelected(s => s.includes(card.word) ? s.filter(w => w !== card.word) : [...s, card.word]);
            return;
        }
        // single: bấm = trả lời
        if (r.correct.includes(card.word)) advance(firstTry);
        else { soundManager.playWrong(); setFirstTry(false); setWrong(w => [...w, card.word]); }
    };

    const confirmMulti = () => {
        if (locked) return;
        const ok = [...selected].sort().join(',') === [...r.correct].sort().join(',');
        if (ok) advance(firstTry);
        else { soundManager.playWrong(); setFirstTry(false); speak('Chưa đúng, hãy chọn lại nhé!', { lang: 'vi-VN' }); }
    };

    const cardCls = (card: Card) => {
        const sel = selected.includes(card.word);
        const isWrong = wrong.includes(card.word);
        const isRightSolved = locked && r.correct.includes(card.word);
        return `rounded-3xl bg-white shadow-lg p-4 flex flex-col items-center justify-center gap-1 ring-4 transition-all active:scale-95 ${isRightSolved ? 'ring-green-400 scale-105' : isWrong ? 'ring-red-300 opacity-60' : sel ? 'ring-pink-500 scale-105' : 'ring-transparent hover:ring-pink-200'}`;
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-full">
                {order.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-pink-500' : i < idx ? 'w-2 bg-green-400' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">🔤 {instruction}</p>
                <SpeakButton
                    parts={[{ text: readInstruction, lang: 'vi-VN' }, { text: LETTER, lang: 'en-US' }]}
                    autoPlay autoPlayKey={idx} size={26}
                />
            </div>

            <div className={`grid gap-4 w-full max-w-2xl ${r.cards.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {r.cards.map(card => (
                    <button key={card.word} onClick={() => tapCard(card)} className={cardCls(card)}>
                        <span className="text-5xl">{card.emoji}</span>
                        <span className="text-lg font-extrabold text-slate-700 lowercase">{card.word}</span>
                    </button>
                ))}
            </div>

            {multi && !locked && (
                <button
                    onClick={confirmMulti}
                    disabled={selected.length === 0}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-lg font-extrabold shadow-lg active:scale-95 disabled:opacity-40"
                >
                    ✓ Xong
                </button>
            )}

            <RewardBurst show={done} stars={stars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
