// ============================================================================
//  VoiceButton — nút "nghe lại" dùng CÙNG cơ chế ducking (voiceSpeak/voiceCancel)
//  thay vì gọi thẳng speech.ts. Quan trọng: nếu gọi speak() thô, nó huỷ câu auto
//  đang đọc khiến onEnd của câu đó không chạy → nhạc nền KẸT ở mức giảm. Đi qua
//  voiceSpeak bảo đảm luôn khôi phục âm lượng.
// ============================================================================

import React, { useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { voiceSpeak, voiceCancel } from '../hooks/useGameTTS';

interface VoiceButtonProps {
    text: string;
    size?: number;
    className?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ text, size = 20, className = '' }) => {
    const [speaking, setSpeaking] = useState(false);

    const toggle = () => {
        if (speaking) {
            voiceCancel();
            setSpeaking(false);
        } else {
            setSpeaking(true);
            voiceSpeak(text, { onEnd: () => setSpeaking(false) });
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            title={speaking ? 'Dừng đọc' : 'Nghe lại'}
            aria-label={speaking ? 'Dừng đọc' : 'Nghe lại'}
            className={`inline-flex items-center justify-center rounded-full transition-all shrink-0 ${speaking
                ? 'bg-green-500 text-white animate-pulse shadow-lg'
                : 'bg-white text-brand-600 shadow-md hover:scale-110'
                } ${className}`}
            style={{ width: size + 18, height: size + 18 }}
        >
            {speaking ? <Square size={size} /> : <Volume2 size={size} />}
        </button>
    );
};
