// Tiện ích Text-to-Speech dùng chung cho toàn app.
// Ưu tiên 1: giọng hệ điều hành theo ngôn ngữ yêu cầu (Web Speech API) — hỗ trợ vi-VN + en-US.
// Fallback (chỉ tiếng Việt): audio tạo sẵn bằng Google Translate TTS cho máy không cài tiếng Việt
//            (scripts/generate-solar-audio.mjs sinh ra public/audio/vi/<audioId>.mp3).
//            Phát file same-origin nên không bị chặn và được service worker precache (chạy offline).

export type SpeechLang = 'vi-VN' | 'en-US';

let playToken = 0; // tăng lên để vô hiệu hóa audio đang phát khi cancel/đọc mới
let currentAudio: HTMLAudioElement | null = null;

/** Tìm giọng phù hợp ngôn ngữ (vi-VN / en-US). Trả về null nếu thiết bị không có. */
export function getVoice(lang: SpeechLang = 'vi-VN'): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const prefix = lang.slice(0, 2).toLowerCase(); // 'vi' | 'en'
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(prefix)) ?? null;
}

/** Giọng tiếng Việt (giữ tên cũ cho code Hệ Mặt Trời). */
export function getVietnameseVoice(): SpeechSynthesisVoice | null {
    return getVoice('vi-VN');
}

export function hasVoice(lang: SpeechLang = 'vi-VN'): boolean {
    return !!getVoice(lang);
}

export function hasVietnameseVoice(): boolean {
    return hasVoice('vi-VN');
}

/** Có cách nào đọc được không: giọng hệ thống HOẶC có audio tạo sẵn (chỉ tiếng Việt). */
export function canSpeak(lang: SpeechLang = 'vi-VN', audioId?: string): boolean {
    return hasVoice(lang) || (lang === 'vi-VN' && !!audioId);
}

export function canSpeakVietnamese(audioId?: string): boolean {
    return canSpeak('vi-VN', audioId);
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
    audio.play().catch(() => {
        if (token === playToken) { currentAudio = null; opts.onError?.(); }
    });
    return true;
}

export interface SpeakOptions {
    lang?: SpeechLang;       // mặc định vi-VN
    audioId?: string;        // file audio tạo sẵn (chỉ vi) dùng khi máy không có giọng
    rate?: number;           // tốc độ đọc (mặc định 0.95 — chậm rãi cho trẻ)
    pitch?: number;          // cao độ (mặc định 1.05 — giọng tươi vui)
    onEnd?: () => void;
    onError?: () => void;
}

/** Đọc một đoạn text bằng ngôn ngữ chỉ định. Trả về true nếu đã bắt đầu đọc. */
export function speak(text: string, opts: SpeakOptions = {}): boolean {
    cancelSpeech(); // dừng mọi thứ đang đọc

    const lang = opts.lang ?? 'vi-VN';
    const voice = getVoice(lang);
    if (!voice) {
        // Không có giọng hệ thống: chỉ tiếng Việt mới có audio tạo sẵn để fallback.
        if (lang === 'vi-VN' && opts.audioId) return playPregeneratedAudio(opts.audioId, opts);
        opts.onError?.();
        return false;
    }

    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = opts.rate ?? 0.8;   // chậm rãi, phù hợp trẻ nhỏ
    u.pitch = opts.pitch ?? 1.05;
    if (opts.onEnd) u.onend = opts.onEnd;
    if (opts.onError) u.onerror = opts.onError;
    window.speechSynthesis.speak(u);
    return true;
}

/** Danh sách giọng đã tải xong chưa (Chrome/Android tải bất đồng bộ). */
export function voicesReady(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.getVoices().length > 0;
}

/** Wrapper tương thích ngược cho code cũ (Hệ Mặt Trời) — giữ tốc độ đọc cũ 0.95. */
export function speakVietnamese(
    text: string,
    opts: { audioId?: string; onEnd?: () => void; onError?: () => void } = {}
): boolean {
    return speak(text, { lang: 'vi-VN', rate: 0.95, ...opts });
}

/**
 * Đọc lần lượt nhiều phần (vd: tiếng Anh rồi tiếng Việt) — dùng cho mục mầm non.
 * Nếu một phần không đọc được (thiếu giọng) thì bỏ qua phần đó để chuỗi không bị kẹt.
 */
export function speakSequence(
    parts: { text: string; lang?: SpeechLang }[],
    opts: { gapMs?: number; rate?: number; pitch?: number; onEnd?: () => void } = {}
): void {
    cancelSpeech();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { opts.onEnd?.(); return; }

    const token = playToken; // nếu có cancel/đọc mới giữa chừng thì dừng chuỗi
    const gap = opts.gapMs ?? 450;       // khoảng nghỉ giữa các phần (tách chữ với từ minh họa)
    const rate = opts.rate ?? 0.8;       // chậm rãi cho trẻ
    const pitch = opts.pitch ?? 1.05;
    let i = 0;

    const playNext = () => {
        if (token !== playToken) return;          // đã bị hủy
        if (i >= parts.length) { opts.onEnd?.(); return; }
        const p = parts[i++];
        const voice = getVoice(p.lang ?? 'vi-VN');
        if (!voice) { playNext(); return; }       // thiếu giọng → bỏ qua phần này, đọc phần kế
        const u = new SpeechSynthesisUtterance(p.text);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = rate;
        u.pitch = pitch;
        const advance = () => { if (token === playToken) window.setTimeout(playNext, gap); };
        u.onend = advance;
        u.onerror = advance;
        window.speechSynthesis.speak(u);
    };

    // Chờ một nhịp sau cancel để tránh lỗi Chrome "nuốt" câu đầu tiên.
    window.setTimeout(playNext, 120);
}
