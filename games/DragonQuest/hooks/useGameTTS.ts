// ============================================================================
//  TTS cho DragonQuest: bọc tiện ích đọc dùng chung (src/utils/speech.ts) + tự
//  GIẢM/KHÔI PHỤC nhạc nền (ducking) khi đọc, và tự đọc thoại/câu hỏi theo phase.
// ============================================================================

import { useEffect, useRef } from 'react';
import { speak, speakSequence, cancelSpeech, type SpeechLang } from '@/src/utils/speech';
import { musicManager } from '@/services/musicManager';
import { DUCK_VOLUME, MUSIC_VOLUME } from '../engine/constants';
import { questionToSpeech } from '../engine/dialogue';
import type { GameState, Phase } from '../engine/types';

// --- Ducking nhạc nền (trạng thái module, chỉ 1 ván chạy mỗi lúc) ---
let ducked = false;
function duck(): void {
    if (ducked) return;
    // Chỉ đụng tới nếu nhạc đang bật, để không "bật" nhạc người dùng đã tắt.
    if (musicManager.getMusicState().musicEnabled) {
        musicManager.setVolume(DUCK_VOLUME);
        ducked = true;
    }
}
function unduck(): void {
    if (!ducked) return;
    musicManager.setVolume(MUSIC_VOLUME);
    ducked = false;
}

/** Đọc một câu (tiếng Việt) kèm ducking. speak() tự huỷ câu trước đó. */
export function voiceSpeak(text: string, opts: { onEnd?: () => void } = {}): void {
    if (!text) { opts.onEnd?.(); return; }
    duck();
    const done = () => { unduck(); opts.onEnd?.(); };
    speak(text, { lang: 'vi-VN', onEnd: done, onError: done });
}

/** Đọc tuần tự nhiều phần (vd thoại + câu hỏi) kèm ducking. */
export function voiceSequence(
    parts: { text: string; lang?: SpeechLang }[],
    opts: { onEnd?: () => void } = {},
): void {
    duck();
    speakSequence(parts, { onEnd: () => { unduck(); opts.onEnd?.(); } });
}

/** Dừng đọc + khôi phục nhạc nền ngay. */
export function voiceCancel(): void {
    cancelSpeech();
    unduck();
}

const isEventPhase = (p: Phase): boolean => p === 'combat' || p === 'buff' || p === 'boss';

/**
 * Tự đọc khi vào ô sự kiện:
 *  - Vào phase mới (combat/buff/boss): đọc THOẠI rồi tới CÂU HỎI.
 *  - Cùng phase boss nhưng câu hỏi đổi (câu tiếp theo): chỉ đọc lại CÂU HỎI.
 * Không tự huỷ khi rời sang 'playing' để câu feedback (do modal phát) đọc trọn.
 * Huỷ + khôi phục nhạc khi unmount.
 */
export function useGameTTS(state: GameState): void {
    const lastPhase = useRef<Phase | null>(null);

    useEffect(() => {
        const { phase, dialogue, question } = state;
        if (!isEventPhase(phase)) {
            lastPhase.current = phase;
            return;
        }
        const entering = lastPhase.current !== phase;
        lastPhase.current = phase;

        const qText = question ? questionToSpeech(question) : '';
        const text = entering
            ? [dialogue, qText].filter(Boolean).join('. ')
            : qText;
        voiceSpeak(text);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.phase, state.question?.id]);

    useEffect(() => () => voiceCancel(), []);
}
