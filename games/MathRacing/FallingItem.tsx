import React from 'react';

export type ItemType = 'question' | 'answer' | 'obstacle';

interface FallingItemProps {
    lane: number; // 0, 1, 2
    yPosition: number; // 0 to 100 (percentage from top)
    content: string;
    type: ItemType;
    isCorrect?: boolean; // For debug or visual hints if needed
}

export const FallingItem: React.FC<FallingItemProps> = ({ lane, yPosition, content, type }) => {
    // Lane positions (same as Car)
    const getLeftPosition = (laneIndex: number) => {
        switch (laneIndex) {
            case 0: return '16.66%';
            case 1: return '50%';
            case 2: return '83.33%';
            default: return '50%';
        }
    };

    // Scale calculation: 0.5 at top (0%), 1.0 at bottom (100%)
    // This simulates perspective depth
    const scale = 0.5 + (yPosition / 100) * 0.5;

    // Opacity: Fade in at top
    const opacity = Math.max(0, Math.min(1, yPosition / 10));

    // Color based on type
    const getBgColor = () => {
        switch (type) {
            case 'question': return 'bg-blue-600 border-blue-400';
            case 'answer': return 'bg-white border-slate-200 text-slate-800';
            case 'obstacle': return 'bg-red-600 border-red-800 text-white';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div
            className="absolute z-20 transition-transform duration-75 ease-linear will-change-transform"
            style={{
                left: getLeftPosition(lane),
                top: `${yPosition}%`,
                transform: `translateX(-50%) scale(${scale})`,
                opacity: opacity
            }}
        >
            <div className={`
                px-4 py-2 rounded-xl border-b-4 shadow-lg font-bold text-center min-w-[80px]
                ${getBgColor()}
                ${type === 'question' ? 'text-white text-xl' : 'text-2xl'}
            `}>
                {content}
            </div>
        </div>
    );
};
