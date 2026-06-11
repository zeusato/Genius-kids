import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronRight, Volume2, RotateCcw } from 'lucide-react';
import { SOLAR_TOUR } from '../../data/solarTour';
import { hasVietnameseVoice, speakVietnamese, cancelSpeech } from './speech';

interface TourCardProps {
    index: number;            // chặng hiện tại (đã bay tới nơi)
    ready: boolean;           // true khi camera đã bay tới (mới đọc + hiện nút)
    onNext: () => void;
    onExit: () => void;
}

// Thẻ thuyết minh tour — hiện sau khi camera bay tới chặng. Tự đọc (nếu có giọng vi-VN),
// có "Nghe lại" và "Tiếp tục". Không tự chuyển chặng (tap-to-continue, hợp prefers-reduced-motion).
export const TourCard: React.FC<TourCardProps> = ({ index, ready, onNext, onExit }) => {
    const stop = SOLAR_TOUR[index];
    const total = SOLAR_TOUR.length;
    const isLast = index === total - 1;
    const [speaking, setSpeaking] = useState(false);
    const canSpeak = hasVietnameseVoice();

    const speak = () => {
        const done = () => setSpeaking(false);
        if (speakVietnamese(stop.narration, { onEnd: done, onError: done })) setSpeaking(true);
    };

    // Tự đọc khi vừa bay tới chặng mới
    const spokenFor = useRef<number | null>(null);
    useEffect(() => {
        if (ready && canSpeak && spokenFor.current !== index) {
            spokenFor.current = index;
            speak();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, index]);

    useEffect(() => () => cancelSpeech(), []);

    return (
        <div className="fixed inset-x-0 bottom-0 z-[120] flex justify-center px-3 pb-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl bg-gradient-to-br from-slate-900/95 to-indigo-950/95 backdrop-blur-md border border-white/15 rounded-3xl shadow-2xl p-4 sm:p-5 animate-in slide-in-from-bottom duration-500">
                {/* Hàng đầu: tiến độ + thoát */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚀</span>
                    <span className="text-white/90 font-bold text-sm">Du hành Hệ Mặt Trời</span>
                    <div className="flex gap-1 ml-2">
                        {SOLAR_TOUR.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-yellow-400' : i < index ? 'w-1.5 bg-green-400' : 'w-1.5 bg-white/20'}`} />
                        ))}
                    </div>
                    <button onClick={onExit} className="ml-auto p-1.5 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Lời thuyết minh */}
                <p className="text-white text-sm sm:text-base leading-relaxed mb-3 min-h-[3.5rem]">
                    {ready ? stop.narration : 'Đang bay tới...'}
                </p>

                {/* Nút điều khiển */}
                <div className="flex items-center gap-2">
                    {canSpeak && ready && (
                        <button
                            onClick={speak}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${speaking ? 'bg-green-500/25 border-green-400/50 text-green-200' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'}`}
                        >
                            <Volume2 size={16} /> Nghe lại
                        </button>
                    )}
                    <button
                        onClick={() => { cancelSpeech(); onNext(); }}
                        disabled={!ready}
                        className="ml-auto flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white shadow-lg disabled:opacity-50 transition-all"
                    >
                        {isLast ? (<><RotateCcw size={16} /> Kết thúc</>) : (<>Tiếp tục <ChevronRight size={16} /></>)}
                    </button>
                </div>
            </div>
        </div>
    );
};
