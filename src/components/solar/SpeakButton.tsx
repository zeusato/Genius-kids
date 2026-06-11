import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { PlanetData } from '../../data/solarData';
import { hasVietnameseVoice, onVoicesChanged, speakVietnamese, cancelSpeech } from './speech';

// Đọc to mô tả + sự thật thú vị bằng giọng tiếng Việt. Máy không có giọng vi-VN → nút tự ẩn.
export const SpeakButton: React.FC<{ planet: PlanetData }> = ({ planet }) => {
    const [available, setAvailable] = useState(hasVietnameseVoice());
    const [speaking, setSpeaking] = useState(false);
    const speakingRef = useRef(false);

    useEffect(() => {
        setAvailable(hasVietnameseVoice());
        return onVoicesChanged(() => setAvailable(hasVietnameseVoice()));
    }, []);

    // Đổi thiên thể hoặc rời modal → ngừng đọc
    useEffect(() => {
        return () => { if (speakingRef.current) cancelSpeech(); };
    }, [planet.id]);

    if (!available) return null;

    const toggle = () => {
        if (speaking) {
            cancelSpeech();
            speakingRef.current = false;
            setSpeaking(false);
            return;
        }
        const text = `${planet.name}. ${planet.description} Sự thật thú vị: ${planet.facts.join('. ')}`;
        const done = () => { speakingRef.current = false; setSpeaking(false); };
        if (speakVietnamese(text, { onEnd: done, onError: done })) {
            speakingRef.current = true;
            setSpeaking(true);
        }
    };

    return (
        <button
            onClick={toggle}
            title={speaking ? 'Dừng đọc' : 'Đọc cho bé nghe'}
            className={`p-2.5 rounded-xl border transition-all shrink-0 ${speaking
                ? 'bg-green-500/25 border-green-400/60 text-green-200 animate-pulse'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
        >
            {speaking ? <Square size={18} /> : <Volume2 size={18} />}
        </button>
    );
};
