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
            {/* Vùng chạm mở rộng ≥48px cho ngón tay trẻ em (hành tinh nhỏ như Sao Thủy chỉ 12px) */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    width: `${Math.max(data.size, 48)}px`,
                    height: `${Math.max(data.size, 48)}px`
                }}
            />
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

            {/* Planet Name Label — luôn hiển thị để trẻ học tên (label cũng là vùng chạm) */}
            <div
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] text-white/90 whitespace-nowrap font-semibold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(data.id);
                }}
            >
                {data.name}
            </div>
        </div>
    );
};
