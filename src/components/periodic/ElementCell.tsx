import React from 'react';
import { ElementData, CATEGORY_COLORS } from '@/src/data/elementsData';

interface ElementCellProps {
    element: ElementData;
    onClick: (element: ElementData) => void;
    size?: 'sm' | 'md' | 'lg';
}

export const ElementCell: React.FC<ElementCellProps> = ({ element, onClick, size = 'md' }) => {
    const categoryStyle = CATEGORY_COLORS[element.category];

    const sizeClasses = {
        sm: 'w-10 h-10 text-xs',
        md: 'w-14 h-14 sm:w-16 sm:h-16 text-sm',
        lg: 'w-20 h-20 text-base'
    };

    return (
        <button
            onClick={() => onClick(element)}
            className={`
                ${sizeClasses[size]}
                relative rounded-lg
                flex flex-col items-center justify-center
                transition-all duration-300
                hover:scale-110 hover:z-10
                focus:outline-none focus:ring-2 focus:ring-white/50
                group cursor-pointer
            `}
            style={{
                backgroundColor: `${categoryStyle.color}20`,
                border: `2px solid ${categoryStyle.color}`,
                boxShadow: `0 0 10px ${categoryStyle.glow}, inset 0 0 10px ${categoryStyle.glow}`,
            }}
            title={`${element.name} (${element.nameEn})`}
        >
            {/* Atomic Number */}
            <span
                className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-medium opacity-70"
                style={{ color: categoryStyle.color }}
            >
                {element.atomicNumber}
            </span>

            {/* Symbol */}
            <span
                className="font-bold text-base sm:text-lg leading-none"
                style={{
                    color: categoryStyle.color,
                    textShadow: `0 0 10px ${categoryStyle.glow}`
                }}
            >
                {element.symbol}
            </span>

            {/* Name (only show on larger sizes) */}
            {size !== 'sm' && (
                <span
                    className="text-[8px] sm:text-[10px] opacity-80 truncate w-full text-center px-1"
                    style={{ color: categoryStyle.color }}
                >
                    {element.name}
                </span>
            )}

            {/* Hover glow effect */}
            <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    boxShadow: `0 0 20px ${categoryStyle.color}, 0 0 40px ${categoryStyle.glow}`,
                }}
            />
        </button>
    );
};
