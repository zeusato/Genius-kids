import React from 'react';
import { laneLeft } from './lanes';

export type ItemType = 'question' | 'answer' | 'obstacle';

interface FallingItemProps {
    lane: number; // 0, 1, 2
    yPosition: number; // 0..100 (% từ trên xuống)
    content: string;
    type: ItemType;
    /** Mờ đi khi KHÔNG thuộc câu hỏi hiện tại (giúp trẻ tập trung đúng nhóm). */
    dimmed?: boolean;
}

export const FallingItem: React.FC<FallingItemProps> = ({ lane, yPosition, content, type, dimmed = false }) => {
    // Chiều sâu nhẹ: xa (trên) nhỏ hơn, gần (dưới) to dần — KHÔNG quá nhỏ để khỏi "trôi".
    const scale = 0.74 + (yPosition / 100) * 0.26;
    // Hiện dần khi vừa xuất hiện từ chân trời.
    const opacityIn = Math.max(0, Math.min(1, yPosition / 12));
    const opacity = (dimmed ? 0.45 : 1) * opacityIn;

    const tile =
        type === 'answer'
            ? 'bg-gradient-to-b from-white to-slate-100 text-slate-800 border-white'
            : type === 'obstacle'
                ? 'bg-gradient-to-b from-red-500 to-red-700 text-white border-red-300'
                : 'bg-gradient-to-b from-blue-500 to-blue-700 text-white border-blue-300';

    return (
        <div
            className="absolute z-20 will-change-transform"
            style={{
                left: laneLeft(lane),
                top: `${yPosition}%`,
                transform: `translateX(-50%) scale(${scale})`,
                opacity,
                filter: dimmed ? 'grayscale(0.5)' : undefined,
            }}
        >
            <div
                className={`px-5 py-2 rounded-2xl border-2 font-black text-3xl text-center min-w-[86px] tracking-wide
                    shadow-[0_5px_0_rgba(0,0,0,0.22),0_8px_14px_rgba(0,0,0,0.3)] ${tile}`}
            >
                {content}
            </div>
        </div>
    );
};
