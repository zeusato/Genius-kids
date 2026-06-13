import React from 'react';
import type { ShapeId } from '@/src/data/shapesData';

interface ShapeIconProps {
    shape: ShapeId;
    fill?: string;
    stroke?: string;
    className?: string;
}

/** Vẽ một hình học cơ bản trong viewBox 0 0 100 100. */
export const ShapeIcon: React.FC<ShapeIconProps> = ({ shape, fill = '#3b82f6', stroke = 'rgba(0,0,0,0.15)', className = 'w-full h-full' }) => {
    const sw = 3;
    const common = { fill, stroke, strokeWidth: sw, strokeLinejoin: 'round' as const };
    return (
        <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid meet">
            {shape === 'circle' && <circle cx="50" cy="50" r="42" {...common} />}
            {shape === 'oval' && <ellipse cx="50" cy="50" rx="44" ry="30" {...common} />}
            {shape === 'square' && <rect x="12" y="12" width="76" height="76" rx="6" {...common} />}
            {shape === 'rectangle' && <rect x="6" y="26" width="88" height="48" rx="6" {...common} />}
            {shape === 'triangle' && <polygon points="50,10 92,88 8,88" {...common} />}
            {shape === 'diamond' && <polygon points="50,8 90,50 50,92 10,50" {...common} />}
            {shape === 'star' && <polygon points="50,6 61,38 95,38 67,59 78,92 50,71 22,92 33,59 5,38 39,38" {...common} />}
            {shape === 'heart' && <path d="M50 88 C12 60 6 36 24 22 C38 11 50 22 50 34 C50 22 62 11 76 22 C94 36 88 60 50 88 Z" {...common} />}
        </svg>
    );
};
