import React, { useEffect } from 'react';
import { speak } from '@/src/utils/speech';
import { soundManager } from '@/utils/sound';

interface RewardBurstProps {
    show: boolean;
    stars: number;
    title?: string;       // lời khen (tiếng Việt) — sẽ được đọc to
    onReplay?: () => void;
    onBack: () => void;
}

/** Màn chúc mừng cuối lượt: sao thưởng + lời khen đọc to + nút chơi lại / quay lại. */
export const RewardBurst: React.FC<RewardBurstProps> = ({ show, stars, title = 'Giỏi quá! Bé làm tốt lắm!', onReplay, onBack }) => {
    useEffect(() => {
        if (show) {
            soundManager.playComplete();
            speak(title, { lang: 'vi-VN' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in duration-300">
                <div className="text-7xl mb-2 animate-bounce">🎉</div>
                <h2 className="text-3xl font-extrabold text-brand-600 mb-3">{title}</h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className={`text-5xl transition-transform ${i < stars ? 'scale-110' : 'opacity-30 grayscale'}`}>⭐</span>
                    ))}
                </div>
                <p className="text-slate-500 font-medium mb-6">Bé nhận được <span className="font-bold text-yellow-600">{stars} sao</span>!</p>
                <div className="flex gap-3">
                    {onReplay && (
                        <button
                            onClick={onReplay}
                            className="flex-1 px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg active:scale-95 transition-all"
                        >
                            🔄 Chơi lại
                        </button>
                    )}
                    <button
                        onClick={onBack}
                        className="flex-1 px-5 py-3 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
};
