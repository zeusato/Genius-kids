import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { soundManager } from '@/utils/sound';
import { TokenVisual } from './TokenVisual';
import { tokenSpeechParts, type PreschoolToken } from './types';

interface FlashcardDeckProps {
    tokens: PreschoolToken[];
    /** Gradient nền card. */
    cardGradient?: string;
    onBack: () => void;
    /** Gọi khi bé xem hết bộ thẻ (để trao thưởng nhẹ). */
    onComplete?: () => void;
}

/** Chế độ Học: lật từng thẻ, tự đọc Anh → Việt, có nút nghe lại + dải chọn nhanh. */
export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ tokens, cardGradient = 'from-brand-50 to-white', onBack, onComplete }) => {
    const [index, setIndex] = useState(0);
    const token = tokens[index];
    const isLast = index === tokens.length - 1;

    const stripRef = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ left: false, right: false });

    const updateEdges = () => {
        const el = stripRef.current;
        if (!el) return;
        const left = el.scrollLeft > 4;
        const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
        setEdges(prev => (prev.left === left && prev.right === right) ? prev : { left, right });
    };

    const go = (delta: number) => {
        soundManager.playClick();
        setIndex(i => Math.min(tokens.length - 1, Math.max(0, i + delta)));
    };

    const scrollStrip = (dir: number) => {
        const el = stripRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
    };

    // Tính trạng thái 2 mép khi mount / đổi kích thước.
    useEffect(() => {
        updateEdges();
        const onResize = () => updateEdges();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cuộn ô đang chọn vào giữa khi đổi thẻ (qua mũi tên).
    useEffect(() => {
        const el = stripRef.current;
        if (!el) return;
        const active = el.querySelector(`[data-idx="${index}"]`) as HTMLElement | null;
        active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        const t = window.setTimeout(updateEdges, 350);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Tiến độ */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-full">
                {tokens.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand-500' : i < index ? 'w-2 bg-brand-300' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            {/* Thẻ */}
            <div className="flex items-center gap-3 sm:gap-6 w-full justify-center">
                <button
                    onClick={() => go(-1)}
                    disabled={index === 0}
                    className="shrink-0 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 disabled:opacity-30 active:scale-90 transition-all"
                    aria-label="Thẻ trước"
                >
                    <ChevronLeft size={32} />
                </button>

                <div className={`relative bg-gradient-to-br ${cardGradient} rounded-[2rem] shadow-2xl w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center p-4`}>
                    <div className="flex-1 w-full">
                        <TokenVisual token={token} size="lg" />
                    </div>
                    {token.label && (
                        <p className="text-lg font-bold text-slate-600 text-center">{token.label}</p>
                    )}
                </div>

                <button
                    onClick={() => go(1)}
                    disabled={isLast}
                    className="shrink-0 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 disabled:opacity-30 active:scale-90 transition-all"
                    aria-label="Thẻ sau"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Nghe đọc (tự đọc khi đổi thẻ) */}
            <SpeakButton parts={tokenSpeechParts(token)} autoPlay autoPlayKey={token.id} size={30} />

            {/* Dải chọn nhanh: toàn bộ chữ/số/màu, trượt ngang. Ẩn thanh cuộn, hiện gợi ý 2 mép. */}
            <div className="relative w-full max-w-3xl">
                {/* Gợi ý mép trái */}
                <div className={`pointer-events-none absolute left-0 top-0 bottom-2 w-12 z-10 bg-gradient-to-r from-black/5 to-transparent rounded-l-2xl transition-opacity ${edges.left ? 'opacity-100' : 'opacity-0'}`} />
                {edges.left && (
                    <button
                        onClick={() => scrollStrip(-1)}
                        aria-label="Cuộn trái"
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-600 active:scale-90 transition-all"
                    >
                        <ChevronLeft size={22} />
                    </button>
                )}

                <div ref={stripRef} onScroll={updateEdges} className="no-scrollbar overflow-x-auto px-2 py-1">
                    <div className="flex gap-2 w-max mx-auto">
                        {tokens.map((t, i) => (
                            <button
                                key={t.id}
                                data-idx={i}
                                onClick={() => { soundManager.playClick(); setIndex(i); }}
                                aria-label={t.big || t.label || t.id}
                                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 flex items-center justify-center font-extrabold shadow ring-4 transition-all ${i === index ? 'ring-brand-500 scale-110' : 'ring-black/5 hover:ring-brand-200'} ${t.kind === 'color' ? '' : 'bg-white text-brand-600'}`}
                                style={t.kind === 'color' ? { backgroundColor: t.hex } : undefined}
                            >
                                {t.kind !== 'color' && <span className="text-2xl sm:text-3xl">{t.big}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gợi ý mép phải */}
                <div className={`pointer-events-none absolute right-0 top-0 bottom-2 w-12 z-10 bg-gradient-to-l from-black/5 to-transparent rounded-r-2xl transition-opacity ${edges.right ? 'opacity-100' : 'opacity-0'}`} />
                {edges.right && (
                    <button
                        onClick={() => scrollStrip(1)}
                        aria-label="Cuộn phải"
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-600 active:scale-90 transition-all"
                    >
                        <ChevronRight size={22} />
                    </button>
                )}
            </div>

            {/* Hoàn thành */}
            {isLast && (
                <button
                    onClick={() => { onComplete?.(); onBack(); }}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-white text-lg bg-gradient-to-r from-fun-green to-green-500 shadow-lg active:scale-95 transition-all"
                >
                    <CheckCircle2 size={24} /> Bé đã xem hết!
                </button>
            )}
        </div>
    );
};
