import React from 'react';
import { PlanetData } from '../../data/solarData';

interface PlanetProps {
    data: PlanetData;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export const Planet: React.FC<PlanetProps> = ({ data, isSelected, onSelect }) => {
    // Generate gradient background
    const backgroundStyle = data.gradientColors.length > 1
        ? `radial-gradient(circle at 30% 30%, ${data.gradientColors[0]}, ${data.gradientColors[1]}, ${data.gradientColors[2] || data.gradientColors[1]})`
        : data.color;

    return (
        <div
            className={`absolute rounded-full cursor-pointer transition-transform duration-300 hover:scale-125 ${isSelected ? 'scale-150 ring-4 ring-white/50' : ''}`}
            style={{
                width: `${data.size}px`,
                height: `${data.size}px`,
                background: backgroundStyle,
                boxShadow: `inset -${data.size / 3}px -${data.size / 3}px ${data.size / 2}px rgba(0,0,0,0.7), 0 0 ${data.size / 2}px ${data.color}80`,
                top: '50%',
                left: '50%',
                marginTop: `-${data.size / 2}px`,
                marginLeft: `-${data.size / 2}px`,
                zIndex: 10
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(data.id);
            }}
        >
            {/* Ring for Saturn */}
            {data.ring && (
                <div
                    className="absolute rounded-full border-[6px] border-double opacity-80"
                    style={{
                        borderColor: data.ring.color,
                        width: `${data.size * data.ring.size}px`,
                        height: `${data.size * data.ring.size}px`,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotateX(70deg)',
                        boxShadow: `0 0 10px ${data.ring.color}`
                    }}
                />
            )}

            {/* Planet Name Label (only show on hover or if large enough) */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/80 whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {data.name}
            </div>
        </div>
    );
};
