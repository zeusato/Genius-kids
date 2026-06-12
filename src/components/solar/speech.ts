// Helper đọc tiếng Việt dùng chung cho SpeakButton và Tour.
// Ưu tiên 1: giọng vi-VN của hệ điều hành (Web Speech API).
// Fallback:  audio tạo sẵn bằng Google Translate TTS cho máy không cài tiếng Việt
//            (scripts/generate-solar-audio.mjs sinh ra public/audio/vi/<audioId>.mp3).
//            Phát file same-origin nên không bị chặn — browser hiện đại CHẶN gọi
//            translate_tts trực tiếp từ web (ORB chặn <audio> cross-origin, fetch
//            không có CORS) — và được service worker precache nên chạy cả offline.

let playToken = 0; // tăng lên để vô hiệu hóa audio đang phát khi cancel/đọc mới
let currentAudio: HTMLAudioElement | null = null;

export function getVietnameseVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('vi')) ?? null;
}

export function hasVietnameseVoice(): boolean {
    return !!getVietnameseVoice();
}

// Có cách nào đọc được không: giọng hệ thống HOẶC có audio tạo sẵn cho nội dung này
export function canSpeakVietnamese(audioId?: string): boolean {
    return hasVietnameseVoice() || !!audioId;
}

// Danh sách giọng tải bất đồng bộ trên Chrome/Android — đăng ký lắng nghe để cập nhật UI.
export function onSpeechAvailabilityChanged(cb: () => void): () => void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => { };
    window.speechSynthesis.addEventListener('voiceschanged', cb);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', cb);
}

export function cancelSpeech(): void {
    playToken++;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function playPregeneratedAudio(
    audioId: string,
    opts: { onEnd?: () => void; onError?: () => void }
): boolean {
    if (typeof Audio === 'undefined') return false;
    const token = ++playToken;
    const base = (import.meta as any).env?.BASE_URL || '/';
    const audio = new Audio(`${base}audio/vi/${audioId}.mp3`);
    currentAudio = audio;
    audio.onended = () => {
        if (token === playToken) { currentAudio = null; opts.onEnd?.(); }
    };
    audio.onerror = () => {
        if (token === playToken) { currentAudio = null; opts.onError?.(); }
    };
    // play() có thể bị autoplay policy chặn nếu không xuất phát từ thao tác người
    // dùng (vd: tour tự đọc khi bay tới nơi) -> báo onError, nút "Nghe lại" vẫn chạy
    audio.play().catch(() => {
        if (token === playToken) { currentAudio = null; opts.onError?.(); }
    });
    return true;
}

// Đọc một đoạn text. Trả về true nếu đã bắt đầu đọc.
// audioId: tên file audio tạo sẵn (không kèm .mp3) dùng khi máy không có giọng vi-VN.
export function speakVietnamese(
    text: string,
    opts: { audioId?: string; onEnd?: () => void; onError?: () => void } = {}
): boolean {
    cancelSpeech(); // dừng mọi thứ đang đọc (cả giọng hệ thống lẫn audio tạo sẵn)

    const voice = getVietnameseVoice();
    if (!voice) {
        if (opts.audioId) return playPregeneratedAudio(opts.audioId, opts);
        return false;
    }

    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.95;
    u.pitch = 1.05;
    if (opts.onEnd) u.onend = opts.onEnd;
    if (opts.onError) u.onerror = opts.onError;
    window.speechSynthesis.speak(u);
    return true;
}
