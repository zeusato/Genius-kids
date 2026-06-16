// ============================================================================
//  GameHeader — thanh trên: Back · Máu · Buff · Điểm · Nhạc. Responsive: chip
//  gọn, cho phép xuống hàng trên màn hẹp, Back & nút nhạc luôn chạm tới.
// ============================================================================

import React from 'react';
import { ArrowLeft, Heart, Trophy } from 'lucide-react';
import { BuffType, PlayerBuffs } from '../engine/types';
import { getBuffIcon } from '../engine/buffs';
import { MusicControls } from '@/src/components/MusicControls';

interface GameHeaderProps {
    hp: number;
    maxHp: number;
    buffs: PlayerBuffs;
    score: number;
    onBack: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ hp, maxHp, buffs, score, onBack }) => {
    return (
        <div className="bg-white px-2 py-2 md:px-4 md:py-3 shadow-sm flex items-center justify-between gap-2">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 shrink-0">
                <ArrowLeft />
            </button>

            <div className="flex items-center gap-1.5 md:gap-3 flex-wrap justify-center min-w-0">
                {/* Máu: hiển thị trái tim */}
                <div className="flex items-center gap-1 bg-red-50 px-2 md:px-3 py-1.5 rounded-full border border-red-100">
                    {Array.from({ length: maxHp }).map((_, i) => (
                        <Heart key={i} size={16}
                            className={i < hp ? 'text-red-500 fill-red-500' : 'text-red-200'} />
                    ))}
                </div>

                {buffs.holySword > 0 && (
                    <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1.5 rounded-full border border-yellow-100">
                        <span className="text-base md:text-xl">{getBuffIcon(BuffType.HolySword)}</span>
                        <span className="font-bold text-yellow-700 text-sm">{buffs.holySword}</span>
                    </div>
                )}
                {buffs.flyingCloak && (
                    <div className="bg-blue-50 px-2 py-1.5 rounded-full border border-blue-100">
                        <span className="text-base md:text-xl">{getBuffIcon(BuffType.FlyingCloak)}</span>
                    </div>
                )}

                <div className="flex items-center gap-1 bg-purple-50 px-2 md:px-3 py-1.5 rounded-full border border-purple-100">
                    <Trophy className="text-purple-500" size={16} />
                    <span className="font-black text-purple-700 text-base md:text-xl">{score}</span>
                </div>
            </div>

            <div className="shrink-0">
                <MusicControls />
            </div>
        </div>
    );
};
