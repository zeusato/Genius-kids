// ============================================================================
//  DiceRoll — xúc xắc mặt CHẤM BI (pips). Animation lăn do PARENT điều khiển
//  (prop `rolling`) thay vì tự đặt mốc 1500ms ghép tay với parent như bản cũ.
// ============================================================================

import React, { useEffect, useState } from 'react';

interface DiceRollProps {
    onRoll: () => void;
    value: number | null;
    rolling: boolean;
    disabled: boolean;
}

// Ô sáng (3×3) cho từng mặt xúc xắc.
const PIPS: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
};

const DiceFace: React.FC<{ value: number }> = ({ value }) => {
    const on = new Set(PIPS[value] ?? []);
    return (
        <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full p-1.5 md:p-2">
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                    {on.has(i) && <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-slate-800" />}
                </div>
            ))}
        </div>
    );
};

export const DiceRoll: React.FC<DiceRollProps> = ({ onRoll, value, rolling, disabled }) => {
    const [face, setFace] = useState(value ?? 1);

    // Nhấp nháy mặt khi đang lăn (chỉ trực quan).
    useEffect(() => {
        if (!rolling) {
            if (value != null) setFace(value);
            return;
        }
        const iv = window.setInterval(() => setFace(Math.floor(Math.random() * 6) + 1), 90);
        return () => window.clearInterval(iv);
    }, [rolling, value]);

    const handleClick = () => {
        if (disabled || rolling) return;
        onRoll();
    };

    return (
        <div className="flex flex-col items-center gap-1.5 md:gap-3">
            <div
                onClick={handleClick}
                className={`w-12 h-12 md:w-20 md:h-20 bg-white rounded-xl md:rounded-2xl shadow-xl border-2 md:border-4 border-slate-800 transition-transform duration-300 ${rolling ? 'animate-spin' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
            >
                <DiceFace value={face} />
            </div>

            <button
                onClick={handleClick}
                disabled={disabled || rolling}
                className={`px-2 py-1 md:px-5 md:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs md:text-base rounded-lg md:rounded-xl shadow-md transition-all ${disabled || rolling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
                {rolling ? 'Đang gieo...' : 'Gieo xúc xắc'}
            </button>
        </div>
    );
};
