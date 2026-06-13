import React, { useState } from 'react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { TokenVisual } from './TokenVisual';
import { RewardBurst } from './RewardBurst';
import { usePreschoolReward } from './usePreschoolReward';
import type { PreschoolToken } from './types';

export interface MatchPair {
    id: string;            // khóa chung cho cặp
    left: PreschoolToken;
    right: PreschoolToken;
}

interface MatchPairsProps {
    pairs: MatchPair[];
    pairCount?: number;        // số cặp mỗi lượt (mặc định 5)
    instructionVi?: string;
    gameType: string;
    onBack: () => void;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

interface Tile { key: string; pairId: string; token: PreschoolToken; matched: boolean; }

/** Trò ghép cặp (vd chữ hoa ↔ chữ thường). Chạm 2 thẻ cùng cặp để ghép. */
export const MatchPairs: React.FC<MatchPairsProps> = ({
    pairs, pairCount = 5, instructionVi = 'Hãy ghép hai thẻ giống nhau!', gameType, onBack,
}) => {
    const award = usePreschoolReward(gameType);
    const count = Math.min(pairCount, pairs.length);

    const build = (): Tile[] => {
        const chosen = shuffle(pairs).slice(0, count);
        const tiles: Tile[] = [];
        chosen.forEach(p => {
            tiles.push({ key: p.id + '-L', pairId: p.id, token: p.left, matched: false });
            tiles.push({ key: p.id + '-R', pairId: p.id, token: p.right, matched: false });
        });
        return shuffle(tiles);
    };

    const [tiles, setTiles] = useState<Tile[]>(build);
    const [selected, setSelected] = useState<string | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [matched, setMatched] = useState(0);
    const [done, setDone] = useState(false);
    const [earnedStars, setEarnedStars] = useState(0);

    const reset = () => {
        setTiles(build()); setSelected(null); setMistakes(0);
        setMatched(0); setDone(false); setEarnedStars(0);
    };

    const finish = (totalMistakes: number) => {
        const score = Math.max(0, count - totalMistakes);
        const stars = award(score, count);
        setEarnedStars(stars);
        setDone(true);
    };

    const handleTap = (tile: Tile) => {
        if (tile.matched || done) return;
        if (selected === tile.key) return;
        if (!selected) { soundManager.playClick(); setSelected(tile.key); return; }

        const first = tiles.find(t => t.key === selected)!;
        if (first.pairId === tile.pairId) {
            soundManager.playCorrect();
            setTiles(ts => ts.map(t => t.pairId === tile.pairId ? { ...t, matched: true } : t));
            setSelected(null);
            const nm = matched + 1;
            setMatched(nm);
            if (nm >= count) setTimeout(() => finish(mistakes), 500);
        } else {
            soundManager.playWrong();
            setMistakes(m => m + 1);
            setSelected(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-700">🧩 {instructionVi}</p>
                <SpeakButton text={instructionVi} lang="vi-VN" autoPlay autoPlayKey="match" size={26} />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 w-full max-w-2xl">
                {tiles.map(tile => (
                    <button
                        key={tile.key}
                        onClick={() => handleTap(tile)}
                        disabled={tile.matched}
                        className={`aspect-square rounded-2xl shadow-md p-1 transition-all active:scale-95 ring-4 ${tile.matched ? 'bg-green-50 ring-green-300 opacity-50' : selected === tile.key ? 'bg-white ring-brand-400 scale-105' : 'bg-white ring-transparent hover:ring-brand-200'}`}
                    >
                        <TokenVisual token={{ ...tile.token, label: undefined }} size="sm" />
                    </button>
                ))}
            </div>

            <RewardBurst show={done} stars={earnedStars} onReplay={reset} onBack={onBack} />
        </div>
    );
};
