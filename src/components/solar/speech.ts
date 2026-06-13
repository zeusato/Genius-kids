// Đã chuyển logic TTS sang tiện ích dùng chung: src/utils/speech.ts
// File này giữ lại để tương thích ngược cho các import cũ trong module Hệ Mặt Trời.
export {
    getVietnameseVoice,
    hasVietnameseVoice,
    canSpeakVietnamese,
    onSpeechAvailabilityChanged,
    cancelSpeech,
    speakVietnamese,
} from '@/src/utils/speech';
