// ============================================================================
//  Confetti — ăn mừng khi thắng. Không thêm thư viện: CSS keyframe + DOM nhẹ.
//  Tôn trọng reduced-motion (không hiển thị nếu người dùng tắt animation).
// ============================================================================

import React, { useMemo } from 'react';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#eab308'];

export const Confetti: React.FC<{ count?: number }> = ({ count = 60 }) => {
    const reduce = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const pieces = useMemo(() =>
        Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.6,
            duration: 2.2 + Math.random() * 1.8,
            color: COLORS[i % COLORS.length],
            size: 6 + Math.random() * 8,
            rotate: Math.random() * 360,
        })), [count]);

    if (reduce) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
            <style>{`
                @keyframes dq-confetti-fall {
                    0% { transform: translateY(-12vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0.9; }
                }
            `}</style>
            {pieces.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.left}%`,
                        top: 0,
                        width: p.size,
                        height: p.size * 0.6,
                        backgroundColor: p.color,
                        transform: `rotate(${p.rotate}deg)`,
                        borderRadius: 2,
                        animation: `dq-confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
                    }}
                />
            ))}
        </div>
    );
};
