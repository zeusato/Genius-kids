// Helper đọc tiếng Việt (Web Speech API) dùng chung cho SpeakButton và Tour.
// Máy không có giọng vi-VN → hasVietnameseVoice() = false (UI tự ẩn nút đọc).

export function getVietnameseVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('vi')) ?? null;
}

export function hasVietnameseVoice(): boolean {
    return !!getVietnameseVoice();
}

// Danh sách giọng tải bất đồng bộ trên Chrome/Android — đăng ký lắng nghe để cập nhật UI.
export function onVoicesChanged(cb: () => void): () => void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {};
    window.speechSynthesis.addEventListener('voiceschanged', cb);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', cb);
}

export function cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

// Đọc một đoạn text. Trả về true nếu đã bắt đầu đọc (có giọng vi-VN).
export function speakVietnamese(
    text: string,
    opts: { onEnd?: () => void; onError?: () => void } = {}
): boolean {
    const voice = getVietnameseVoice();
    if (!voice) return false;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.95;
    u.pitch = 1.05;
    if (opts.onEnd) u.onend = opts.onEnd;
    if (opts.onError) u.onerror = opts.onError;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
}
