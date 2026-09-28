import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { cancelSpeech, speak } from '@/src/utils/speech';

interface CellSpeakButtonProps {
    text: string;
    autoPlay?: boolean;     // tự đọc khi text đổi (bé Mầm non / lớp 1 chưa đọc được)
    className?: string;
    label?: string;
}

// Nút loa cho mục tế bào (giao diện tối). Đổi nội dung hoặc đóng thẻ → ngừng đọc.
export const CellSpeakButton: React.FC<CellSpeakButtonProps> = ({ text, autoPlay = false, className = '', label }) => {
    const [speaking, setSpeaking] = useState(false);
    const alive = useRef(true);

    const start = () => {
        const done = () => { if (alive.current) setSpeaking(false); };
        if (speak(text, { lang: 'vi-VN', rate: 0.9, onEnd: done, onError: done })) setSpeaking(true);
    };

    useEffect(() => {
        alive.current = true;
        let timer = 0;
        if (autoPlay) timer = window.setTimeout(start, 350); // chờ camera bay xong một nhịp
        return () => {
            alive.current = false;
            window.clearTimeout(timer);
            cancelSpeech();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, autoPlay]);

    return (
        <button
            type="button"
            onClick={() => {
                if (speaking) { cancelSpeech(); setSpeaking(false); } else start();
            }}
            title={speaking ? 'Dừng đọc' : 'Nghe đọc'}
            aria-label={speaking ? 'Dừng đọc' : (label ?? 'Nghe đọc')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border transition-all shrink-0 ${speaking
                ? 'bg-emerald-500/25 border-emerald-300/60 text-emerald-100 animate-pulse'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'} ${className}`}
        >
            {speaking ? <Square size={18} /> : <Volume2 size={18} />}
            {label && <span className="text-xs font-bold">{label}</span>}
        </button>
    );
};
