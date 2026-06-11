import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { PlanetData } from '../../data/solarData';

// Đọc to mô tả + sự thật thú vị bằng giọng tiếng Việt (Web Speech API) —
// mở khóa nhóm 5–7 tuổi chưa đọc thạo. Máy không có giọng vi-VN → nút tự ẩn.
function findVietnameseVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    return voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('vi')) ?? null;
}

export const SpeakButton: React.FC<{ planet: PlanetData }> = ({ planet }) => {
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [speaking, setSpeaking] = useState(false);
    const speakingRef = useRef(false);

    useEffect(() => {
        if (!('speechSynthesis' in window)) return;
        const update = () => setVoice(findVietnameseVoice());
        update();
        // Danh sách giọng tải bất đồng bộ trên Chrome/Android
        window.speechSynthesis.addEventListener('voiceschanged', update);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
    }, []);

    // Đổi thiên thể hoặc đóng modal → ngừng đọc
    useEffect(() => {
        return () => {
            if (speakingRef.current) window.speechSynthesis.cancel();
        };
    }, [planet.id]);

    if (!voice) return null;

    const toggle = () => {
        if (speaking) {
            window.speechSynthesis.cancel();
            speakingRef.current = false;
            setSpeaking(false);
            return;
        }
        const text = `${planet.name}. ${planet.description} Sự thật thú vị: ${planet.facts.join('. ')}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.onend = () => {
            speakingRef.current = false;
            setSpeaking(false);
        };
        utterance.onerror = () => {
            speakingRef.current = false;
            setSpeaking(false);
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        speakingRef.current = true;
        setSpeaking(true);
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
