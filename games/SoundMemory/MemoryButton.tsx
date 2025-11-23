import React from 'react';

interface MemoryButtonProps {
    id: number;
    color: string;
    isActive: boolean;
    isDisabled: boolean;
    onClick: () => void;
    isHardMode: boolean;
}

export const MemoryButton: React.FC<MemoryButtonProps> = ({
    color,
    isActive,
    isDisabled,
    onClick,
    isHardMode
}) => {
    // Hard mode: Silver/Gray buttons, only color when active
    const baseColor = isHardMode
        ? (isActive ? 'bg-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.8)]' : 'bg-blue-700')
        : (isActive ? `${color} brightness-125 shadow-[0_0_30px_rgba(255,255,255,0.6)] scale-105` : color);

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`
                relative w-full aspect-square rounded-2xl transition-all duration-200
                ${baseColor}
                ${isDisabled ? 'cursor-default' : 'cursor-pointer hover:brightness-110 active:scale-95'}
                border-4 border-black/10
                flex items-center justify-center
            `}
        >
            {/* Inner glow/reflection for plastic look */}
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

            {/* Active indicator ring */}
            {isActive && (
                <div className="absolute -inset-2 rounded-3xl border-4 border-white/50 animate-pulse pointer-events-none" />
            )}
        </button>
    );
};
