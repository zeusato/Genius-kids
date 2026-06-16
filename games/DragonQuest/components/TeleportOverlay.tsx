// ============================================================================
//  TeleportOverlay — overlay dịch chuyển (thay TeleportModal). Tự đọc thoại
//  (TTS có ducking), hiển thị lời thoại lên màn hình và tự gọi onComplete sau khi 
//  đọc xong (hoặc sau TELEPORT_MS). Cung cấp nút Tiếp tục để bỏ qua chờ đợi.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { TELEPORT_MS } from '../engine/constants';
import { TELEPORT_PROTECTED_DIALOGUES } from '../engine/dialogue';
import { voiceSpeak, voiceCancel } from '../hooks/useGameTTS';
import { VoiceButton } from './VoiceButton';

interface TeleportOverlayProps {
    distance: number;
    isBackward: boolean;
    hasProtection: boolean; // có Áo Choàng Bay
    dialogue: string;       // thoại tiến/lùi (do hook chọn seeded)
    onComplete: () => void;
}

const sample = (pool: readonly string[]) => pool[Math.floor(Math.random() * pool.length)];

export const TeleportOverlay: React.FC<TeleportOverlayProps> = ({
    distance, isBackward, hasProtection, dialogue, onComplete,
}) => {
    const isProtected = isBackward && hasProtection;
    const spoken = isProtected ? sample(TELEPORT_PROTECTED_DIALOGUES) : dialogue;

    const completedRef = useRef(false);

    const triggerComplete = () => {
        if (completedRef.current) return;
        completedRef.current = true;
        voiceCancel(); // Dừng đọc nếu người dùng bấm tiếp tục hoặc unmount
        onComplete();
    };

    useEffect(() => {
        let textTimer: number | null = null;

        // Đọc thoại bằng TTS. Khi đọc xong (hoặc lỗi), đợi thêm 1000ms rồi mới tự động kết thúc.
        voiceSpeak(spoken, {
            onEnd: () => {
                textTimer = window.setTimeout(triggerComplete, 1000);
            }
        });

        // Lưới bảo vệ (fallback) phòng trường hợp TTS không chạy hoặc quá lâu
        const fallbackTimer = window.setTimeout(triggerComplete, TELEPORT_MS);

        return () => {
            window.clearTimeout(fallbackTimer);
            if (textTimer !== null) {
                window.clearTimeout(textTimer);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-xl w-full text-center animate-in zoom-in-95 duration-300 relative">
                <div className="text-7xl md:text-9xl mb-5 animate-spin">🌀</div>

                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-4">
                    DỊCH CHUYỂN!
                </h2>

                {isProtected ? (
                    <>
                        <div className="text-5xl md:text-6xl mb-4 animate-bounce">🦸‍♂️</div>
                        <div className="bg-blue-50 rounded-2xl p-5 md:p-6 border-2 border-blue-300">
                            <p className="text-lg md:text-xl font-bold text-blue-800 mb-1">Áo Choàng Bay bảo vệ bạn!</p>
                            <p className="text-base md:text-lg text-blue-600">Miễn nhiễm dịch chuyển lùi ✨</p>
                        </div>
                    </>
                ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 md:p-6 border-2 border-blue-200">
                        <p className="text-3xl font-black mb-2">{isBackward ? '⬅️' : '➡️'}</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {isBackward ? 'Lùi' : 'Tiến'} {Math.abs(distance)} ô
                        </p>
                    </div>
                )}

                {/* Hộp thoại hiển thị nội dung thoại để học sinh dễ đọc */}
                <div className="mt-4 relative bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-left">
                    <p className="text-base md:text-lg font-bold italic text-slate-700 pr-10">
                        "{spoken}"
                    </p>
                    <VoiceButton text={spoken} size={18} className="absolute top-3 right-3" />
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-4">
                    <button
                        onClick={triggerComplete}
                        className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-base"
                    >
                        Tiếp tục
                    </button>

                    <div className="flex gap-2 justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
