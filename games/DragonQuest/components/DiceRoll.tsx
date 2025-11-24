import React, { useState, useEffect } from 'react';

interface DiceRollProps {
    onRoll: () => void;
    value: number | null;
    disabled: boolean;
}

export const DiceRoll: React.FC<DiceRollProps> = ({ onRoll, value, disabled }) => {
    const [isRolling, setIsRolling] = useState(false);
    const [displayValue, setDisplayValue] = useState<number | null>(null);
    const [animationFrame, setAnimationFrame] = useState(0);

    // Animation effect for rolling numbers
    useEffect(() => {
        if (isRolling) {
            const interval = setInterval(() => {
                setDisplayValue(Math.floor(Math.random() * 6) + 1);
                setAnimationFrame(prev => prev + 1);
            }, 100);

            return () => clearInterval(interval);
        } else if (value !== null) {
            setDisplayValue(value);
        }
    }, [isRolling, value]);

    const handleClick = () => {
        if (disabled || isRolling) return;

        setIsRolling(true);
        setAnimationFrame(0);

        setTimeout(() => {
            onRoll();
        }, 100);

        setTimeout(() => {
            setIsRolling(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center gap-2 md:gap-3">
            {/* Dice Display */}
            <div
                className={`
                    w-16 h-16 md:w-24 md:h-24
                    bg-white
                    rounded-xl md:rounded-2xl
                    shadow-xl md:shadow-2xl
                    flex items-center justify-center
                    border-2 md:border-4 border-slate-800
                    transition-all duration-300
                    ${isRolling ? 'animate-spin' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 md:hover:scale-110'}
                `}
                onClick={handleClick}
            >
                <div className="text-3xl md:text-6xl font-bold text-slate-800">
                    {displayValue || '?'}
                </div>
            </div>

            {/* Roll Button */}
            <button
                onClick={handleClick}
                disabled={disabled || isRolling}
                className={`
                    px-2 py-1 md:px-6 md:py-3
                    bg-gradient-to-r from-amber-500 to-orange-500
                    text-white font-bold text-xs md:text-lg
                    rounded-lg md:rounded-xl
                    shadow-md md:shadow-lg
                    transition-all duration-200
                    ${disabled || isRolling
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 hover:shadow-xl active:scale-95'
                    }
                `}
            >
                {isRolling ? 'Gieo...' : 'Gieo xúc xắc'}
            </button>
        </div>
    );
};
