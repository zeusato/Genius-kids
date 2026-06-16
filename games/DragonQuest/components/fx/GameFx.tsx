// ============================================================================
//  GameFx — lớp hiệu ứng MỘT-LẦN đọc từ state.fx (điểm bay, trúng đòn, nhận
//  buff). Lắng nghe fx.seq đổi để đẩy hiệu ứng tạm vào danh sách, tự gỡ sau
//  khi chạy xong. framer-motion lo vào/ra mượt; tôn trọng reduced-motion.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FxState, BuffType } from '../../engine/types';
import { getBuffIcon, getBuffName } from '../../engine/buffs';

interface ScoreFx { id: number; amount: number; }
interface BuffFx { id: number; buff: BuffType; }

export const GameFx: React.FC<{ fx: FxState }> = ({ fx }) => {
    const reduce = useReducedMotion();
    const [scores, setScores] = useState<ScoreFx[]>([]);
    const [buffs, setBuffs] = useState<BuffFx[]>([]);
    const [flash, setFlash] = useState(0); // seq trúng đòn gần nhất (0 = không)
    const idRef = useRef(0);

    useEffect(() => {
        if (fx.seq === 0) return;
        if (fx.score != null) {
            const id = ++idRef.current;
            setScores(s => [...s, { id, amount: fx.score! }]);
            window.setTimeout(() => setScores(s => s.filter(x => x.id !== id)), 1100);
        }
        if (fx.buff) {
            const id = ++idRef.current;
            setBuffs(b => [...b, { id, buff: fx.buff! }]);
            window.setTimeout(() => setBuffs(b => b.filter(x => x.id !== id)), 1600);
        }
        if (fx.damage) {
            setFlash(fx.seq);
            window.setTimeout(() => setFlash(f => (f === fx.seq ? 0 : f)), 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fx.seq]);

    return (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
            {/* Flash đỏ khi mất máu */}
            <AnimatePresence>
                {flash !== 0 && (
                    <motion.div
                        key={flash}
                        className="absolute inset-0 bg-red-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: reduce ? 0.2 : 0.35 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ boxShadow: 'inset 0 0 120px 40px rgba(220,38,38,0.8)' }}
                    />
                )}
            </AnimatePresence>

            {/* Điểm bay +N */}
            <AnimatePresence>
                {scores.map(s => (
                    <motion.div
                        key={s.id}
                        className="absolute text-4xl md:text-6xl font-black text-yellow-400 drop-shadow-[0_2px_0_rgba(120,53,15,0.9)]"
                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, y: reduce ? 0 : -90, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 1.4 }}
                        transition={{ duration: 1 }}
                    >
                        +{s.amount}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Nhận buff */}
            <AnimatePresence>
                {buffs.map(b => (
                    <motion.div
                        key={b.id}
                        className="absolute flex flex-col items-center gap-2"
                        initial={{ opacity: 0, scale: 0.3, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: reduce ? 0 : -30 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-6xl md:text-7xl drop-shadow-2xl animate-bounce">{getBuffIcon(b.buff)}</div>
                        <div className="bg-white/95 px-4 py-1.5 rounded-full shadow-lg border-2 border-yellow-300">
                            <span className="font-black text-amber-700">{getBuffName(b.buff)}!</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
