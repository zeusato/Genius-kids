import React, { useEffect, useRef, useState } from 'react';
import CarImage from './Car.png';
import { laneLeft } from './lanes';

interface RacingCarProps {
    lane: number; // 0, 1, 2
}

export const RacingCar: React.FC<RacingCarProps> = ({ lane }) => {
    // Nghiêng xe nhẹ theo hướng đổi làn cho sống động, rồi tự thẳng lại.
    const [tilt, setTilt] = useState(0);
    const prevLane = useRef(lane);
    useEffect(() => {
        const dir = lane - prevLane.current;
        prevLane.current = lane;
        if (dir === 0) return;
        setTilt(dir > 0 ? 10 : -10);
        const t = setTimeout(() => setTilt(0), 180);
        return () => clearTimeout(t);
    }, [lane]);

    return (
        <div
            className="absolute bottom-4 z-30 transition-[left,transform] duration-200 ease-out"
            style={{
                left: laneLeft(lane),
                transform: `translateX(-50%) rotate(${tilt}deg)`,
                width: '96px',
                height: '96px',
            }}
        >
            <div className="relative w-full h-full motion-safe:animate-bounce-slight">
                {/* Vệt tốc độ hai bên */}
                <div className="absolute top-1/2 -left-3 w-6 h-1 rounded-full bg-white/50 blur-[1px] motion-safe:animate-[speed-line_0.3s_linear_infinite]" />
                <div className="absolute top-1/3 -right-3 w-5 h-1 rounded-full bg-white/40 blur-[1px] motion-safe:animate-[speed-line_0.35s_linear_infinite]" />

                <img
                    src={CarImage}
                    alt="Xe của bạn"
                    className="w-full h-full object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)] filter brightness-110"
                />

                {/* Khói xả */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-gray-300/80 rounded-full motion-safe:animate-[ping_1s_linear_infinite]" />
                    <div className="w-2 h-2 bg-gray-300/70 rounded-full motion-safe:animate-[ping_1s_linear_infinite_0.5s]" />
                </div>
            </div>

            <style>{`
                @keyframes bounce-slight { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
                .animate-bounce-slight { animation: bounce-slight 0.5s ease-in-out infinite; }
                @keyframes speed-line { 0%{opacity:0;transform:translateX(0)} 50%{opacity:1} 100%{opacity:0;transform:translateX(-10px)} }
            `}</style>
        </div>
    );
};
