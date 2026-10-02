import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelSpeech, speak, type SpeechLang } from '@/src/utils/speech';
import { musicManager } from '@/services/musicManager';

// Hạ nhạc nền khi Nhân Sư đọc, trả lại khi đọc xong (giống Rồng Thần).
let saved: number | null = null;
function duck() { if (saved === null && musicManager.getMusicState().musicEnabled) { saved = musicManager.getVolume(); musicManager.setVolume(saved * 0.25); } }
function unduck() { if (saved !== null) { musicManager.setVolume(saved); saved = null; } }

export interface VoiceLine { text: string; lang?: SpeechLang }

/**
 * Đọc từng dòng (Chrome cắt câu dài ~15 s), báo dòng đang đọc để tô sáng.
 * Mọi lỗi/thiếu giọng đều kết thúc êm qua onEnd để không kẹt ở bước "đang đọc".
 */
export function useVoice() {
    const [line, setLine] = useState(-1);
    const [speaking, setSpeaking] = useState(false);
    const token = useRef(0);
    const stop = useCallback(() => { token.current++; cancelSpeech(); unduck(); setLine(-1); setSpeaking(false); }, []);
    const say = useCallback((lines: VoiceLine[], onEnd?: () => void) => {
        const my = ++token.current;
        cancelSpeech();
        const list = lines.filter(l => l.text.trim());
        if (!list.length) { onEnd?.(); return; }
        duck(); setSpeaking(true);
        const step = (i: number) => {
            if (my !== token.current) return;
            if (i >= list.length) { unduck(); setLine(-1); setSpeaking(false); onEnd?.(); return; }
            setLine(i);
            let settled = false;
            const next = () => { if (settled) return; settled = true; window.setTimeout(() => step(i + 1), 160); };
            // Lưới an toàn: máy không phát được thì vẫn đi tiếp sau thời lượng ước tính.
            const guard = window.setTimeout(next, 1800 + list[i].text.length * 110);
            const ok = speak(list[i].text, { lang: list[i].lang ?? 'vi-VN', rate: 0.85, onEnd: () => { clearTimeout(guard); next(); }, onError: () => { clearTimeout(guard); next(); } });
            if (!ok) { clearTimeout(guard); window.setTimeout(next, 400); }
        };
        step(0);
    }, []);
    useEffect(() => stop, [stop]);
    return { say, stop, line, speaking };
}

let audio: AudioContext | null = null;
/** Âm báo ngắn tổng hợp (không tải file). Tắt theo nút âm thanh chung. */
export function chime(kind: 'tap' | 'right' | 'close' | 'stone' | 'gate') {
    try {
        if (!musicManager.getMusicState().soundEnabled) return;
        audio ||= new AudioContext();
        if (audio.state === 'suspended') void audio.resume().catch(() => {});
        const notes = { tap: [520], right: [587, 784, 988], close: [494, 587], stone: [880, 1175], gate: [392, 523, 659, 784, 1047] }[kind];
        notes.forEach((f, i) => {
            const a = audio!, o = a.createOscillator(), g = a.createGain(), t = a.currentTime + i * (kind === 'gate' ? 0.12 : 0.085);
            o.type = kind === 'tap' ? 'triangle' : 'sine';
            o.frequency.setValueAtTime(f, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(kind === 'tap' ? 0.02 : 0.04, t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
            o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.25);
            o.onended = () => { o.disconnect(); g.disconnect(); };
        });
    } catch { /* phản hồi hình ảnh vẫn đủ */ }
}
