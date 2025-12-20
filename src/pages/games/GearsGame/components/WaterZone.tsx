import React from 'react';

interface WaterZoneProps {
    x: number;
    y: number;
    width: number;
    height: number;
}

const WaterZone: React.FC<WaterZoneProps> = ({ x, y, width, height }) => {
    const waveId = `wave-${x}-${y}`;

    return (
        <g>
            {/* Water gradient definition */}
            <defs>
                <linearGradient id={`waterGrad-${waveId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
                </linearGradient>
                <pattern id={`waves-${waveId}`} patternUnits="userSpaceOnUse" width="40" height="20" patternTransform="scale(1)">
                    <path
                        d="M0 10 Q10 0, 20 10 T40 10"
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="2"
                    >
                        <animate
                            attributeName="d"
                            values="M0 10 Q10 0, 20 10 T40 10;M0 10 Q10 20, 20 10 T40 10;M0 10 Q10 0, 20 10 T40 10"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </path>
                </pattern>
            </defs>

            {/* Water body */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`url(#waterGrad-${waveId})`}
                rx="8"
                ry="8"
            />

            {/* Wave overlay */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`url(#waves-${waveId})`}
                rx="8"
                ry="8"
            />

            {/* Border */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="none"
                stroke="#0369a1"
                strokeWidth="2"
                rx="8"
                ry="8"
                strokeDasharray="4 2"
            />
        </g>
    );
};

export default WaterZone;
