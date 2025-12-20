import React from 'react';

interface BeltProps {
    x1: number;
    y1: number;
    r1: number;
    x2: number;
    y2: number;
    r2: number;
    speed: number;
    onClick?: () => void;
}

const Belt: React.FC<BeltProps> = ({ x1, y1, r1, x2, y2, r2, speed, onClick }) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return null;

    // Perpendicular angle for tangent points
    const perpAngle = Math.PI / 2;

    // Top tangent points
    const t1x = x1 + r1 * Math.cos(angle + perpAngle);
    const t1y = y1 + r1 * Math.sin(angle + perpAngle);
    const t2x = x2 + r2 * Math.cos(angle + perpAngle);
    const t2y = y2 + r2 * Math.sin(angle + perpAngle);

    // Bottom tangent points
    const b1x = x1 + r1 * Math.cos(angle - perpAngle);
    const b1y = y1 + r1 * Math.sin(angle - perpAngle);
    const b2x = x2 + r2 * Math.cos(angle - perpAngle);
    const b2y = y2 + r2 * Math.sin(angle - perpAngle);

    // Belt path wrapping around OUTER side of each gear:
    // - Start at top of gear1 (t1)
    // - Straight line to top of gear2 (t2)
    // - Arc around gear2's OUTER side (back, away from gear1) to bottom of gear2 (b2)
    //   This means going the LONG way around (large-arc=1, sweep=0 to go counterclockwise when viewed)
    // - Straight line to bottom of gear1 (b1)
    // - Arc around gear1's OUTER side (back, away from gear2) to top of gear1 (t1)
    //   This means going the LONG way around (large-arc=1, sweep=0)

    // sweep-flag: 0 = counterclockwise, 1 = clockwise
    // For gear2 (right side): we want to go from t2 around the RIGHT/OUTER edge to b2
    // For gear1 (left side): we want to go from b1 around the LEFT/OUTER edge to t1

    const d = `
        M ${t1x} ${t1y}
        L ${t2x} ${t2y}
        A ${r2} ${r2} 0 1 0 ${b2x} ${b2y}
        L ${b1x} ${b1y}
        A ${r1} ${r1} 0 1 0 ${t1x} ${t1y}
        Z
    `;

    return (
        <g
            className={`belt-group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={{ pointerEvents: onClick ? 'auto' : 'none' }}
        >
            {/* Belt shadow/depth */}
            <path d={d} fill="none" stroke="#27272a" strokeWidth="10" />
            {/* Belt body */}
            <path d={d} fill="none" stroke="#52525b" strokeWidth="7" />
            {/* Belt surface highlight */}
            <path d={d} fill="none" stroke="#71717a" strokeWidth="4" />
            {/* Animated dash for movement */}
            <path d={d} fill="none" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="6 4">
                {speed !== 0 && (
                    <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to={speed > 0 ? "-20" : "20"}
                        dur={`${Math.max(0.5, Math.abs(12 / speed))}s`}
                        repeatCount="indefinite"
                    />
                )}
            </path>

            {/* Hover highlight for clickable belts */}
            {onClick && (
                <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                    className="hover:stroke-red-500/40 transition-colors"
                />
            )}
        </g>
    );
};

export default Belt;
