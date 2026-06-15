import React from 'react';

interface BeltProps {
    x1: number;
    y1: number;
    r1: number;
    x2: number;
    y2: number;
    r2: number;
    /** Độ lớn tốc độ (>0 thì chạy). */
    speed: number;
    /** Chiều quay có dấu của puli nguồn (1/-1/0) — quyết định CHIỀU chạy của đai. */
    dir?: number;
    /** Đai chéo (figure-8) thì vẽ bắt chéo. */
    crossed?: boolean;
    onClick?: () => void;
}

const Belt: React.FC<BeltProps> = ({ x1, y1, r1, x2, y2, r2, speed, dir = 0, crossed = false, onClick }) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return null;

    const perp = Math.PI / 2;
    const t1x = x1 + r1 * Math.cos(angle + perp);
    const t1y = y1 + r1 * Math.sin(angle + perp);
    const t2x = x2 + r2 * Math.cos(angle + perp);
    const t2y = y2 + r2 * Math.sin(angle + perp);
    const b1x = x1 + r1 * Math.cos(angle - perp);
    const b1y = y1 + r1 * Math.sin(angle - perp);
    const b2x = x2 + r2 * Math.cos(angle - perp);
    const b2y = y2 + r2 * Math.sin(angle - perp);

    // Đai thẳng: nối top-top / bottom-bottom; đai chéo: bắt chéo top1-bottom2.
    const d = crossed
        ? `M ${t1x} ${t1y} L ${b2x} ${b2y} A ${r2} ${r2} 0 1 0 ${t2x} ${t2y} L ${b1x} ${b1y} A ${r1} ${r1} 0 1 0 ${t1x} ${t1y} Z`
        : `M ${t1x} ${t1y} L ${t2x} ${t2y} A ${r2} ${r2} 0 1 0 ${b2x} ${b2y} L ${b1x} ${b1y} A ${r1} ${r1} 0 1 0 ${t1x} ${t1y} Z`;

    const moving = speed > 0 && dir !== 0;
    const dur = Math.max(0.3, 1.2 / Math.max(speed, 0.05));

    return (
        <g
            className={`belt-group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={{ pointerEvents: onClick ? 'auto' : 'none' }}
        >
            <path d={d} fill="none" stroke="#27272a" strokeWidth={10} />
            <path d={d} fill="none" stroke="#52525b" strokeWidth={7} />
            <path d={d} fill="none" stroke="#71717a" strokeWidth={4} />
            <path d={d} fill="none" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="6 4">
                {moving && (
                    <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to={dir > 0 ? '-20' : '20'}
                        dur={`${dur}s`}
                        repeatCount="indefinite"
                    />
                )}
            </path>
            {onClick && (
                <path d={d} fill="none" stroke="transparent" strokeWidth={20} className="hover:stroke-red-500/40 transition-colors" />
            )}
        </g>
    );
};

export default Belt;
