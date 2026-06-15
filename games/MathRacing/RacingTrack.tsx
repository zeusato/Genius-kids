import React from 'react';
import { ROAD_LEFT, ROAD_RIGHT, DIVIDER_LEFT } from './lanes';

interface RacingTrackProps {
    children?: React.ReactNode;
}

// Đường đua LÀN THẲNG + chiều sâu nhẹ: bầu trời/chân trời ở trên, mặt nhựa thẳng
// ở giữa với vạch lề + vạch phân làn nét đứt CHẠY (tạo cảm giác tốc độ). Các làn
// thẳng đứng nên xe & đáp án (dùng chung lanes.ts) luôn nằm đúng trên mặt đường.
export const RacingTrack: React.FC<RacingTrackProps> = ({ children }) => {
    const HORIZON = 22; // % chiều cao: ranh giới trời / mặt đất

    return (
        <div className="relative w-full h-full overflow-hidden bg-sky-300">
            {/* ===== Bầu trời ===== */}
            <div
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-sky-500 via-sky-400 to-sky-200"
                style={{ height: `${HORIZON + 4}%` }}
            >
                {/* Mặt trời */}
                <div className="absolute top-5 right-10 w-14 h-14 rounded-full bg-yellow-300 shadow-[0_0_55px_16px_rgba(253,224,71,0.65)] motion-safe:animate-pulse" />
                {/* Mây */}
                <div className="cloud absolute top-6 left-8 w-24 h-7 motion-safe:animate-[drift_22s_ease-in-out_infinite]" />
                <div className="cloud absolute top-12 left-1/2 w-32 h-9 opacity-80 motion-safe:animate-[drift_30s_ease-in-out_infinite]" />
                <div className="cloud absolute top-4 right-1/4 w-20 h-6 opacity-70 motion-safe:animate-[drift_26s_ease-in-out_infinite_reverse]" />
            </div>

            {/* ===== Cỏ hai bên ===== */}
            <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-emerald-500 to-emerald-700"
                style={{ top: `${HORIZON}%` }}
            />

            {/* ===== Mặt đường (thẳng, giữa) ===== */}
            <div
                className="absolute bottom-0"
                style={{ top: `${HORIZON}%`, left: `${ROAD_LEFT}%`, right: `${100 - ROAD_RIGHT}%` }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-600 shadow-[inset_0_26px_38px_-20px_rgba(0,0,0,0.7)]" />
                {/* Vạch lề trắng */}
                <div className="absolute inset-y-0 left-0 w-1.5 bg-white/85" />
                <div className="absolute inset-y-0 right-0 w-1.5 bg-white/85" />
            </div>

            {/* ===== Vạch phân làn nét đứt (chạy theo tốc độ qua --road-dur) ===== */}
            <div className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ top: `${HORIZON}%` }}>
                {DIVIDER_LEFT.map((l, i) => (
                    <div key={i} className="lane-dash absolute inset-y-0 w-2 -translate-x-1/2" style={{ left: l }} />
                ))}
            </div>

            {/* ===== Lớp game (xe, đáp án, hiệu ứng) ===== */}
            <div className="absolute inset-0 z-20 pointer-events-none">{children}</div>

            <style>{`
                .cloud { background: rgba(255,255,255,0.9); border-radius: 9999px; filter: blur(1px); }
                @keyframes drift { 0%{transform:translateX(-12px)} 50%{transform:translateX(18px)} 100%{transform:translateX(-12px)} }
                .lane-dash {
                    background-image: repeating-linear-gradient(to bottom, rgba(253,224,21,0.95) 0 22px, transparent 22px 54px);
                    animation: road-scroll var(--road-dur, 0.45s) linear infinite;
                }
                @keyframes road-scroll { from { background-position-y: 0; } to { background-position-y: 54px; } }
                @media (prefers-reduced-motion: reduce) { .lane-dash { animation: none; } }
            `}</style>
        </div>
    );
};
