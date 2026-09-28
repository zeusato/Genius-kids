import React from 'react';

// Chuỗi xoắn kép ADN bằng SVG (thay DNAHelix — cái đó mở thêm một WebGL canvas thứ hai, dễ làm
// tablet yếu mất context). Hai sợi sin lệch pha + bậc thang base, "xoay" bằng SMIL.
export const DnaRibbon: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => {
    const rungs = Array.from({ length: 12 }, (_, i) => i);
    const strand = (phase: number) => {
        const pts: string[] = [];
        for (let i = 0; i <= 48; i++) {
            const y = 4 + i * 2.5;
            const x = 20 + Math.sin(i * 0.33 + phase) * 12;
            pts.push(`${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        return pts.join(' ');
    };
    const pairs = ['#f472b6', '#60a5fa', '#facc15', '#4ade80'];
    return (
        <svg viewBox="0 0 40 128" className={className} aria-hidden="true">
            {rungs.map((i) => {
                const y = 8 + i * 10;
                const k = (y - 4) / 2.5;
                return (
                    <line key={i} x1="20" x2="20" y1={y} y2={y} stroke={pairs[i % 4]} strokeWidth="2.2" strokeLinecap="round">
                        <animate attributeName="x1" values={`${20 + Math.sin(k * 0.33) * 12};${20 - Math.sin(k * 0.33) * 12};${20 + Math.sin(k * 0.33) * 12}`} dur="3s" repeatCount="indefinite" />
                        <animate attributeName="x2" values={`${20 - Math.sin(k * 0.33) * 12};${20 + Math.sin(k * 0.33) * 12};${20 - Math.sin(k * 0.33) * 12}`} dur="3s" repeatCount="indefinite" />
                    </line>
                );
            })}
            <path d={strand(0)} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round">
                <animate attributeName="d" values={`${strand(0)};${strand(Math.PI)};${strand(0)}`} dur="3s" repeatCount="indefinite" />
            </path>
            <path d={strand(Math.PI)} fill="none" stroke="#fde68a" strokeWidth="2.6" strokeLinecap="round">
                <animate attributeName="d" values={`${strand(Math.PI)};${strand(0)};${strand(Math.PI)}`} dur="3s" repeatCount="indefinite" />
            </path>
        </svg>
    );
};
