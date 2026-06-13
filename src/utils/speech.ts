// Tiện ích Text-to-Speech dùng chung cho toàn app.
//
// Thứ tự ưu tiên khi đọc:
//   1. Audio tạo sẵn tự động bằng slug (chỉ vi-VN) — same-origin, chạy offline 100%.
//   2. Web Speech API — giọng hệ điều hành (vi-VN / en-US).
//   3. Audio tạo sẵn thủ công (chỉ vi-VN, qua opts.audioId).
//   4. Google Translate TTS — fallback online khi không có giọng hệ thống.

import pregeneratedSlugs from '@/src/data/pregeneratedSlugs.json';

export type SpeechLang = 'vi-VN' | 'en-US';

const PREGENERATED_VI_SLUGS = new Set(pregeneratedSlugs);

function getAudioSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, khoảng trắng, gạch ngang
        .trim()
        .replace(/\s+/g, '-');
}

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
    opts: { onEnd?: () => void; onError?: () => void },
    customToken?: number
): boolean {
    if (typeof Audio === 'undefined') return false;
    const token = customToken !== undefined ? customToken : ++playToken;
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

/**
 * Fallback TTS qua Google Translate — dùng khi thiết bị không có giọng phù hợp.
 *
 * Nhận `capturedToken` từ caller (không tự tăng playToken) để hoạt động đúng
 * cả trong speak() đơn lẫn giữa chuỗi speakSequence().
 *
 * Văn bản truyền đi được mã hoá UTF-8 qua encodeURIComponent — tiếng Việt có
 * dấu sẽ được encode đúng chuẩn (vd: "đại ca" → "%C4%91%E1%BA%A1i%20ca").
 */
function playGoogleTTS(
    text: string,
    lang: SpeechLang,
    capturedToken: number,
    opts: { onEnd?: () => void; onError?: () => void }
): boolean {
    if (typeof Audio === 'undefined') return false;
    const tl = lang.split('-')[0]; // 'vi-VN' → 'vi', 'en-US' → 'en'
    const qs = `ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob`;
    
    // Dev: qua Vite proxy để tránh 403.
    // Prod: gọi thẳng Google (do các câu tĩnh đã có pre-generate, fallback rất ít khi xảy ra).
    const url = (import.meta as any).env?.DEV
        ? `/api/tts?${qs}`
        : `https://translate.google.com/translate_tts?${qs}`;
        
    const audio = new Audio(url);
    currentAudio = audio;
    const cleanup = (cb?: () => void) => () => {
        if (capturedToken === playToken) { currentAudio = null; cb?.(); }
    };
    audio.onended = cleanup(opts.onEnd);
    audio.onerror = cleanup(opts.onError);
    audio.play().catch(cleanup(opts.onError));
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
    cancelSpeech(); // dừng mọi thứ đang đọc — playToken đã tăng sau đây
    const capturedToken = playToken;

    const lang = opts.lang ?? 'vi-VN';
    
    // 1. Ưu tiên phát file âm thanh tạo sẵn (chỉ vi-VN) để đảm bảo chất lượng cao nhất
    if (lang === 'vi-VN') {
        const slug = getAudioSlug(text);
        if (PREGENERATED_VI_SLUGS.has(slug)) {
            return playPregeneratedAudio(slug, opts, capturedToken);
        }
    }
    
    const voice = getVoice(lang);
    if (!voice) {
        // Fallback 1: audio tạo sẵn thủ công (chỉ vi-VN).
        if (lang === 'vi-VN' && opts.audioId) return playPregeneratedAudio(opts.audioId, opts, capturedToken);
        // Fallback 2: Google Translate TTS (mọi ngôn ngữ, cần kết nối mạng).
        return playGoogleTTS(text, lang, capturedToken, opts);
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
 * Nếu thiết bị không có giọng hệ thống cho một phần, tự động fallback sang
 * Google Translate TTS thay vì bỏ qua, giúp trẻ luôn nghe được đủ nội dung.
 */
export function speakSequence(
    parts: { text: string; lang?: SpeechLang }[],
    opts: { gapMs?: number; rate?: number; pitch?: number; onEnd?: () => void } = {}
): void {
    cancelSpeech();
    
    const token = playToken; // capture sau cancelSpeech; dùng để kiểm tra huỷ giữa chừng
    const gap = opts.gapMs ?? 450;       // khoảng nghỉ giữa các phần (ms)
    const rate = opts.rate ?? 0.8;       // chậm rãi cho trẻ
    const pitch = opts.pitch ?? 1.05;
    let i = 0;

    const playNext = () => {
        if (token !== playToken) return;          // đã bị huỷ bởi cancel/đọc mới
        if (i >= parts.length) { opts.onEnd?.(); return; }
        const p = parts[i++];
        const lang = p.lang ?? 'vi-VN';
        const advance = () => { if (token === playToken) window.setTimeout(playNext, gap); };

        // 1. Ưu tiên phát file âm thanh tạo sẵn (chỉ vi-VN) để đảm bảo chất lượng cao nhất
        if (lang === 'vi-VN') {
            const slug = getAudioSlug(p.text);
            if (PREGENERATED_VI_SLUGS.has(slug)) {
                const started = playPregeneratedAudio(slug, { onEnd: advance, onError: advance }, token);
                if (started) return;
            }
        }

        const voice = getVoice(lang);
        if (!voice) {
            // Thiếu giọng hệ thống → fallback Google Translate TTS.
            // Nếu phát không được (offline hoàn toàn) thì bỏ qua và đọc phần tiếp.
            const started = playGoogleTTS(p.text, lang, token, { onEnd: advance, onError: advance });
            if (!started) advance();
            return;
        }

        const u = new SpeechSynthesisUtterance(p.text);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = rate;
        u.pitch = pitch;
        u.onend = advance;
        u.onerror = advance;
        window.speechSynthesis.speak(u);
    };

    // Chờ một nhịp sau cancel để tránh lỗi Chrome "nuốt" câu đầu tiên.
    window.setTimeout(playNext, 120);
}
