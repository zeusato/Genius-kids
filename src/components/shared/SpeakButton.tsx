import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speak, speakSequence, cancelSpeech, voicesReady, onSpeechAvailabilityChanged, type SpeechLang } from '@/src/utils/speech';

interface SpeakButtonProps {
    /** Đọc một đoạn text đơn. */
    text?: string;
    /** Ngôn ngữ cho `text` (mặc định vi-VN). */
    lang?: SpeechLang;
    /** Đọc lần lượt nhiều phần, vd [{text:'A', lang:'en-US'}, {text:'chữ A', lang:'vi-VN'}]. */
    parts?: { text: string; lang?: SpeechLang }[];
    /** File audio tạo sẵn fallback (chỉ tiếng Việt). */
    audioId?: string;
    /** Tự đọc khi hiển thị / khi `autoPlayKey` đổi. */
    autoPlay?: boolean;
    /** Khóa để autoPlay đọc lại khi nội dung đổi (vd index thẻ / số câu). */
    autoPlayKey?: string | number;
    rate?: number;
    pitch?: number;
    /** Khoảng nghỉ giữa các phần khi đọc chuỗi (ms). */
    gapMs?: number;
    size?: number;
    className?: string;
    title?: string;
}

/**
 * Nút loa dùng chung: đọc to text bằng giọng trình duyệt (vi-VN / en-US),
 * hỗ trợ đọc chuỗi nhiều phần (Anh → Việt) cho các mục mầm non.
 * AutoPlay sẽ CHỜ giọng tải xong rồi mới đọc (Chrome/Android tải giọng bất đồng bộ).
 */
export const SpeakButton: React.FC<SpeakButtonProps> = ({
    text,
    lang = 'vi-VN',
    parts,
    audioId,
    autoPlay = false,
    autoPlayKey,
    rate,
    pitch,
    gapMs,
    size = 22,
    className = '',
    title,
}) => {
    const [speaking, setSpeaking] = useState(false);
    const speakingRef = useRef(false);
    const mountedRef = useRef(true);

    // Đánh dấu unmount để tránh setState trên component đã bị huỷ.
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const start = () => {
        const done = () => {
            if (!mountedRef.current) return;
            speakingRef.current = false;
            setSpeaking(false);
        };
        if (parts && parts.length > 0) {
            speakSequence(parts, { rate, pitch, gapMs, onEnd: done });
            speakingRef.current = true;
            if (mountedRef.current) setSpeaking(true);
            return;
        }
        if (text) {
            if (speak(text, { lang, audioId, rate, pitch, onEnd: done, onError: done })) {
                speakingRef.current = true;
                if (mountedRef.current) setSpeaking(true);
            }
        }
    };

    const stop = () => {
        cancelSpeech();
        speakingRef.current = false;
        if (mountedRef.current) setSpeaking(false);
    };

    const toggle = () => (speaking ? stop() : start());

    // Tự đọc khi nội dung đổi.
    // - Đã có giọng → đọc ngay (ưu tiên giọng thiết bị, chất lượng tốt nhất).
    // - Giọng đang tải bất đồng bộ (Chrome/Android) → đợi 'voiceschanged' rồi đọc.
    // - Sau 1.2s vẫn không có giọng nào (vd máy không hỗ trợ TTS) → vẫn đọc; startChain
    //   tự fallback sang MP3/Google. Tránh kẹt autoPlay vĩnh viễn trên máy không có giọng.
    useEffect(() => {
        if (!autoPlay) return;
        let fired = false;
        let timer = 0;
        let off = () => { };
        const fire = () => {
            if (fired) return;
            fired = true;
            window.clearTimeout(timer);
            off();
            start();
        };
        const tryStart = () => {
            if (!fired && voicesReady()) fire();
        };
        off = onSpeechAvailabilityChanged(tryStart);
        timer = window.setTimeout(fire, 600); // lưới an toàn
        tryStart();
        return () => {
            fired = true; // ngăn fire/tryStart chạy sau cleanup
            window.clearTimeout(timer);
            off();
            if (speakingRef.current) {
                cancelSpeech();
                speakingRef.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlayKey]);

    return (
        <button
            type="button"
            onClick={toggle}
            title={title ?? (speaking ? 'Dừng đọc' : 'Nghe đọc')}
            aria-label={title ?? 'Nghe đọc'}
            className={`inline-flex items-center justify-center rounded-full transition-all shrink-0 ${speaking
                ? 'bg-green-500 text-white animate-pulse shadow-lg'
                : 'bg-white text-brand-600 shadow-md hover:scale-110'
                } ${className}`}
            style={{ width: size + 20, height: size + 20 }}
        >
            {speaking ? <Square size={size} /> : <Volume2 size={size} />}
        </button>
    );
};
