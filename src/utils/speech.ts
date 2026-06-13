// Tiện ích Text-to-Speech dùng chung cho toàn app.
//
// Thứ tự ưu tiên khi đọc (theo yêu cầu):
//   1. TTS của thiết bị — Web Speech API, giọng hệ điều hành (vi-VN / en-US).
//   2. Google Translate TTS — service online (dev qua proxy /api/tts).
//   3. MP3 built-in — audio tạo sẵn (chỉ vi-VN): khớp theo slug nội dung HOẶC opts.audioId.
//      (Bước 3 chạy được cả khi offline → dùng làm lưới an toàn cuối cùng.)

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
let keepAliveTimer: number | null = null;

// Chrome tự ngắt Web Speech sau ~15s với câu dài → pause()+resume() định kỳ để duy trì.
function startKeepAlive(): void {
    stopKeepAlive();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    keepAliveTimer = window.setInterval(() => {
        const ss = window.speechSynthesis;
        if (!ss || !ss.speaking) { stopKeepAlive(); return; }
        ss.pause();
        ss.resume();
    }, 9000);
}

function stopKeepAlive(): void {
    if (keepAliveTimer != null) {
        window.clearInterval(keepAliveTimer);
        keepAliveTimer = null;
    }
}

/**
 * Cắt văn bản dài thành các đoạn ngắn (<= maxLen) theo ranh giới câu → từ.
 * Tránh lỗi Chrome "nuốt" utterance quá dài (vd câu trả lời dài trong Tell Me Why).
 * Không dùng lookbehind regex để tương thích Safari cũ.
 */
function chunkText(text: string, maxLen = 180): string[] {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean ? [clean] : [];
    const chunks: string[] = [];
    let rest = clean;
    while (rest.length > maxLen) {
        const head = rest.slice(0, maxLen + 1);
        let cut = -1;
        for (const re of [/[.!?…]\s/g, /[,;:]\s/g, /\s/g]) {
            let m: RegExpExecArray | null, last = -1;
            re.lastIndex = 0;
            while ((m = re.exec(head))) last = m.index + 1;
            if (last > 0) { cut = last; break; }
        }
        if (cut <= 0) cut = maxLen; // không có điểm ngắt → cắt cứng
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
}

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
    stopKeepAlive();
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
 * Endpoint translate_tts chỉ nhận ~200 ký tự/lần → văn bản dài (vd câu trả lời
 * trong Tell Me Why) được CẮT thành nhiều đoạn và phát tuần tự bằng nhiều <audio>.
 *
 * Quy ước lỗi: nếu ĐOẠN ĐẦU lỗi (offline/bị chặn) → gọi onError để caller rơi
 * xuống MP3 built-in. Các đoạn sau lỗi thì bỏ qua đoạn đó và đọc tiếp.
 *
 * Nhận `capturedToken` từ caller (không tự tăng playToken) để hoạt động đúng
 * cả trong speak() đơn lẫn giữa chuỗi speakSequence().
 */
function playGoogleTTS(
    text: string,
    lang: SpeechLang,
    capturedToken: number,
    opts: { onEnd?: () => void; onError?: () => void }
): boolean {
    if (typeof Audio === 'undefined') return false;
    const tl = lang.split('-')[0]; // 'vi-VN' → 'vi', 'en-US' → 'en'
    const isDev = !!(import.meta as any).env?.DEV;
    const chunks = chunkText(text, 180);
    if (chunks.length === 0) { opts.onEnd?.(); return true; }

    let i = 0;
    const playNext = () => {
        if (capturedToken !== playToken) return; // đã huỷ
        if (i >= chunks.length) { currentAudio = null; opts.onEnd?.(); return; }
        const isFirst = i === 0;
        const chunk = chunks[i++];
        const qs = `ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${tl}&client=tw-ob`;
        // Dev: qua Vite proxy để tránh 403. Prod: gọi thẳng Google.
        const url = isDev ? `/api/tts?${qs}` : `https://translate.google.com/translate_tts?${qs}`;
        const audio = new Audio(url);
        currentAudio = audio;
        const onFail = () => {
            if (capturedToken !== playToken) return;
            currentAudio = null;
            if (isFirst) opts.onError?.(); // đoạn đầu hỏng → để caller dùng MP3
            else playNext();               // đoạn sau hỏng → đọc tiếp đoạn kế
        };
        audio.onended = () => { if (capturedToken === playToken) playNext(); };
        audio.onerror = onFail;
        audio.play().catch(onFail);
    };

    playNext();
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

/**
 * Đọc MỘT phần theo đúng thứ tự ưu tiên: thiết bị → Google → MP3 built-in.
 * `token` là playToken đã capture (caller tự gọi cancelSpeech trước). Không tự cancel.
 * `onDone` được gọi khi phần này đọc xong (hoặc đã thử hết cách) — chỉ khi token còn hiệu lực.
 * Trả về true nếu đã bắt đầu phát được bằng một cách nào đó.
 */
function startChain(
    text: string,
    lang: SpeechLang,
    audioId: string | undefined,
    rate: number,
    pitch: number,
    token: number,
    onDone: () => void,
): boolean {
    const finish = () => { if (token === playToken) onDone(); };

    // 3 (lưới an toàn cuối): MP3 built-in — khớp slug nội dung hoặc audioId thủ công (chỉ vi-VN).
    const tryMp3 = (): boolean => {
        if (lang === 'vi-VN') {
            const slug = getAudioSlug(text);
            if (PREGENERATED_VI_SLUGS.has(slug)) return playPregeneratedAudio(slug, { onEnd: finish, onError: finish }, token);
            if (audioId) return playPregeneratedAudio(audioId, { onEnd: finish, onError: finish }, token);
        }
        finish();
        return false;
    };

    // 1. TTS của thiết bị (Web Speech).
    const voice = getVoice(lang);
    if (voice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const chunks = chunkText(text);
        if (chunks.length === 0) { finish(); return true; }
        const lastDone = () => { stopKeepAlive(); finish(); };
        // Hoãn 1 nhịp sau cancel() để Chrome không "nuốt" utterance đầu tiên.
        window.setTimeout(() => {
            if (token !== playToken) return;
            const ss = window.speechSynthesis;
            chunks.forEach((chunk, idx) => {
                const u = new SpeechSynthesisUtterance(chunk);
                u.voice = voice;
                u.lang = voice.lang;
                u.rate = rate;
                u.pitch = pitch;
                if (idx === chunks.length - 1) { u.onend = lastDone; u.onerror = lastDone; }
                ss.speak(u);
            });
            if (chunks.length > 1) startKeepAlive(); // câu dài → giữ cho Chrome không tự ngắt
        }, 60);
        return true;
    }

    // 2. Google TTS; nếu lỗi (offline/bị chặn) → rơi xuống MP3 built-in.
    if (typeof Audio !== 'undefined') {
        return playGoogleTTS(text, lang, token, { onEnd: finish, onError: () => { tryMp3(); } });
    }

    // Không có Audio API → thử MP3 (gần như không xảy ra).
    return tryMp3();
}

/** Đọc một đoạn text bằng ngôn ngữ chỉ định. Trả về true nếu đã bắt đầu đọc. */
export function speak(text: string, opts: SpeakOptions = {}): boolean {
    cancelSpeech(); // dừng mọi thứ đang đọc — playToken đã tăng sau đây
    const token = playToken;
    const lang = opts.lang ?? 'vi-VN';
    const onDone = () => { opts.onEnd ? opts.onEnd() : opts.onError?.(); };
    return startChain(text, lang, opts.audioId, opts.rate ?? 0.8, opts.pitch ?? 1.05, token, onDone);
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
    const gap = opts.gapMs ?? 200;       // khoảng nghỉ giữa các phần (ms)
    const rate = opts.rate ?? 0.8;       // chậm rãi cho trẻ
    const pitch = opts.pitch ?? 1.05;
    let i = 0;

    const playNext = () => {
        if (token !== playToken) return;          // đã bị huỷ bởi cancel/đọc mới
        if (i >= parts.length) { opts.onEnd?.(); return; }
        const p = parts[i++];
        const lang = p.lang ?? 'vi-VN';
        const advance = () => { if (token === playToken) window.setTimeout(playNext, gap); };
        // Mỗi phần đi qua đúng chuỗi ưu tiên: thiết bị → Google → MP3 built-in.
        startChain(p.text, lang, undefined, rate, pitch, token, advance);
    };

    // Chờ một nhịp sau cancel để tránh lỗi Chrome "nuốt" câu đầu tiên.
    window.setTimeout(playNext, 120);
}
