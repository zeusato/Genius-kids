import React from 'react';
import CarImage from './Car.png';

interface RacingCarProps {
    lane: number; // 0, 1, 2
}

export const RacingCar: React.FC<RacingCarProps> = ({ lane }) => {
    // Lane positions: 0 -> 16.66%, 1 -> 50%, 2 -> 83.33%
    // We use left percentage to position the car center in the lane
    const getLeftPosition = (laneIndex: number) => {
        switch (laneIndex) {
            case 0: return '16.66%';
            case 1: return '50%';
            case 2: return '83.33%';
            default: return '50%';
        }
    };

    return (
        <div
            className="absolute bottom-4 transition-all duration-200 ease-out z-30"
            style={{
                left: getLeftPosition(lane),
                transform: 'translateX(-50%)', // Center the car on the point
                width: '100px', // Slightly larger for image
                height: '100px'
            }}
        >
            {/* Car Body */}
            <div className="relative w-full h-full animate-bounce-slight">
                <img
                    src={CarImage}
                    alt="Player Car"
                    className="w-full h-full object-contain drop-shadow-2xl filter brightness-110"
                />

                {/* Exhaust Fumes Effect */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full flex justify-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-[ping_1s_linear_infinite]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-[ping_1s_linear_infinite_0.5s]"></div>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slight {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                .animate-bounce-slight {
                    animation: bounce-slight 0.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
