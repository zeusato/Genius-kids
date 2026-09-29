// Tiện ích Text-to-Speech dùng chung cho toàn app.
//
// Thứ tự ưu tiên khi đọc:
//   1. TTS của thiết bị — Web Speech API, giọng hệ điều hành (vi-VN / en-US).
//   2. MP3 built-in — audio tạo sẵn (chỉ vi-VN): khớp theo slug nội dung HOẶC opts.audioId.
//      Đáng tin cậy & chạy offline → ưu tiên hơn Google trên production (GitHub Pages là
//      hosting tĩnh, không có server proxy nên gọi thẳng Google TTS hay bị chặn 403).
//   3. Google Translate TTS — service online, chỉ dùng cho nội dung KHÔNG có MP3 (vd câu
//      trả lời động trong Tell Me Why). Dev: qua proxy /api/tts. Prod: qua VITE_TTS_PROXY
//      nếu được cấu hình, nếu không gọi thẳng Google (best-effort, có thể bị 403).

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
// ---------------------------------------------------------------- chọn giọng
// Người dùng chọn giọng riêng cho tiếng Việt và tiếng Anh (lưu theo máy). Giá trị đặc biệt 'google' = bỏ qua
// giọng máy, luôn dùng giọng online — để hai thứ tiếng nghe cùng một "người" khi máy chỉ có một thứ tiếng.
export const GOOGLE_VOICE = 'google';
const prefKey = (prefix: string) => `tts_voice_${prefix}`;

// Giọng mặc định theo trang (khi người dùng chưa tự chọn) — vd Bảng tuần hoàn mặc định giọng online nữ cho cả
// Việt và Anh để khớp file tên nguyên tố tải sẵn. Trang đặt khi mount, xóa khi rời trang.
const scopedDefault: Record<string, string | undefined> = {};
export function setScopedDefaultVoice(lang: SpeechLang, voiceURI: string | null): void {
    scopedDefault[lang.slice(0, 2).toLowerCase()] = voiceURI ?? undefined;
}

export function getScopedDefaultVoice(lang: SpeechLang): string | null {
    return scopedDefault[lang.slice(0, 2).toLowerCase()] ?? null;
}

export function getPreferredVoice(lang: SpeechLang): string | null {
    try { return localStorage.getItem(prefKey(lang.slice(0, 2).toLowerCase())); } catch { return null; }
}
export function setPreferredVoice(lang: SpeechLang, voiceURI: string | null): void {
    try {
        const k = prefKey(lang.slice(0, 2).toLowerCase());
        if (voiceURI) localStorage.setItem(k, voiceURI); else localStorage.removeItem(k);
    } catch { /* chế độ riêng tư — bỏ qua */ }
}

/** Giọng máy của một thứ tiếng, giọng tự nhiên (Natural/Online/Google) và đúng vùng (en-US) xếp trước. */
export function listVoices(lang: SpeechLang): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const prefix = lang.slice(0, 2).toLowerCase();
    const score = (v: SpeechSynthesisVoice) => (/natural|online|neural/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0)
        + (v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase() ? 1 : 0);
    return window.speechSynthesis.getVoices()
        .filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(prefix))
        .sort((x, y) => score(y) - score(x));
}

export function getVoice(lang: SpeechLang = 'vi-VN'): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const pref = getPreferredVoice(lang) ?? scopedDefault[lang.slice(0, 2).toLowerCase()] ?? null;
    if (pref === GOOGLE_VOICE) return null;          // → nhánh MP3/Google online
    const list = listVoices(lang);
    return (pref && list.find(v => v.voiceURI === pref)) || list[0] || null;
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

/** Có thể thử đọc bằng giọng hệ thống hoặc audio (MP3 / TTS online).
 * Không yêu cầu danh sách giọng đã tải; lỗi mạng được báo qua onError khi phát.
 */
export function canSpeak(lang: SpeechLang = 'vi-VN', _audioId?: string): boolean {
    return hasVoice(lang) || typeof Audio !== 'undefined';
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

// Hiệu ứng giọng (Bảng tuần hoàn: hít helium / xenon). Giọng máy dùng pitch; nhánh audio (MP3/Google)
// không có pitch nên đổi playbackRate và tắt preservesPitch — giọng cao/trầm như thật.
let audioFxRate: number | null = null;
// token của lượt đọc đang diễn ra (speak/speakSequence); -1 = rảnh. cancelSpeech tăng playToken nên tự vô hiệu.
let activeToken = -1;
function applyAudioFx(a: HTMLAudioElement): void {
    if (audioFxRate === null) return;
    (a as any).preservesPitch = false; (a as any).mozPreservesPitch = false; (a as any).webkitPreservesPitch = false;
    a.playbackRate = audioFxRate;
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
    applyAudioFx(audio);
    currentAudio = audio;
    // 'error' và rejection của play() có thể CÙNG kích hoạt → chỉ xử lý kết thúc đúng MỘT lần.
    let settled = false;
    const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (token !== playToken) return;
        currentAudio = null;
        if (ok) opts.onEnd?.(); else opts.onError?.();
    };
    audio.onended = () => done(true);
    audio.onerror = () => done(false);
    audio.play().catch(() => done(false));
    return true;
}

/**
 * Fallback TTS qua Google Translate — dùng khi thiết bị không có giọng phù hợp.
 *
 * Endpoint translate_tts chỉ nhận ~200 ký tự/lần → văn bản dài (vd câu trả lời
 * trong Tell Me Why) được CẮT thành nhiều đoạn và phát tuần tự bằng nhiều <audio>.
 *
 * Bất kỳ đoạn nào lỗi (offline/bị chặn) đều gọi onError; không báo đã đọc xong
 * khi nội dung mới chỉ phát được một phần.
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
    const env = (import.meta as any).env || {};
    const isDev = !!env.DEV;
    // Proxy tự host tuỳ chọn cho prod (vd Cloudflare Worker) — nhận cùng query string như /api/tts.
    const proxy: string | undefined = env.VITE_TTS_PROXY;
    const chunks = chunkText(text, 180);
    if (chunks.length === 0) { opts.onEnd?.(); return true; }

    let i = 0;
    const playNext = () => {
        if (capturedToken !== playToken) return; // đã huỷ
        if (i >= chunks.length) { currentAudio = null; opts.onEnd?.(); return; }
        const chunk = chunks[i++];
        const qs = `ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${tl}&client=tw-ob`;
        // Dev: qua Vite proxy (tránh 403). Prod: qua proxy tự host nếu có, nếu không gọi thẳng Google.
        const url = isDev
            ? `/api/tts?${qs}`
            : proxy
                ? `${proxy}?${qs}`
                : `https://translate.google.com/translate_tts?${qs}`;
        const audio = new Audio(url);
        applyAudioFx(audio);
        currentAudio = audio;
        // 'error' và rejection của play() có thể CÙNG kích hoạt → mỗi đoạn chỉ xử lý 1 lần.
        let settled = false;
        const onFail = () => {
            if (settled) return;
            settled = true;
            if (capturedToken !== playToken) return;
            currentAudio = null;
            opts.onError?.();
        };
        audio.onended = () => {
            if (settled) return;
            settled = true;
            if (capturedToken === playToken) playNext();
        };
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
    voiceFx?: 'helium' | 'xenon'; // giọng cao chí chóe / trầm ồm (thí nghiệm Bảng tuần hoàn)
    onEnd?: () => void;
    onError?: () => void;
}

/**
 * Đọc MỘT phần theo đúng thứ tự ưu tiên: thiết bị → MP3 built-in → Google.
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
    onDone: (success: boolean) => void,
): boolean {
    let settled = false;
    const finish = (success: boolean) => {
        if (settled || token !== playToken) return;
        settled = true;
        onDone(success);
    };

    // Slug MP3 built-in cho nội dung tiếng Việt (khớp nội dung hoặc audioId thủ công).
    const mp3Slug = (): string | null => {
        if (lang !== 'vi-VN') return null;
        const slug = getAudioSlug(text);
        if (PREGENERATED_VI_SLUGS.has(slug)) return slug;
        return audioId ?? null;
    };

    // Google TTS (online). Lỗi → finish (đã thử hết cách).
    const tryGoogle = (): boolean => {
        if (typeof Audio === 'undefined') { finish(false); return false; }
        return playGoogleTTS(text, lang, token, { onEnd: () => finish(true), onError: () => finish(false) });
    };

    // 1. TTS của thiết bị (Web Speech) — chất lượng tốt nhất, chạy offline.
    const voice = getVoice(lang);
    if (voice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const chunks = chunkText(text);
        if (chunks.length === 0) { finish(true); return true; }
        const lastDone = (success: boolean) => { stopKeepAlive(); finish(success); };
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
                if (idx === chunks.length - 1) u.onend = () => lastDone(true);
                u.onerror = () => lastDone(false);
                ss.speak(u);
            });
            if (chunks.length > 1) startKeepAlive(); // câu dài → giữ cho Chrome không tự ngắt
        }, 60);
        return true;
    }

    // 2. MP3 built-in (chỉ vi-VN) — đáng tin cậy & chạy offline; ưu tiên hơn Google trên prod.
    //    Nếu MP3 lỗi (thiếu file) → mới thử Google.
    const slug = mp3Slug();
    if (slug) {
        if (playPregeneratedAudio(slug, { onEnd: () => finish(true), onError: () => { tryGoogle(); } }, token)) return true;
        return tryGoogle();
    }

    // 3. Google TTS — chỉ dùng cho nội dung KHÔNG có MP3 (vd câu trả lời động).
    return tryGoogle();
}

/** Đọc một đoạn text bằng ngôn ngữ chỉ định. Trả về true nếu đã bắt đầu đọc. */
export function speak(text: string, opts: SpeakOptions = {}): boolean {
    cancelSpeech(); // dừng mọi thứ đang đọc — playToken đã tăng sau đây
    const token = playToken;
    const lang = opts.lang ?? 'vi-VN';
    activeToken = token;
    const onDone = (success: boolean) => { if (activeToken === token) activeToken = -1; if (success) opts.onEnd?.(); else opts.onError?.(); };
    audioFxRate = opts.voiceFx === 'helium' ? 1.6 : opts.voiceFx === 'xenon' ? 0.72 : null;
    const pitch = opts.voiceFx === 'helium' ? 2 : opts.voiceFx === 'xenon' ? 0.1 : (opts.pitch ?? 1.05);
    return startChain(text, lang, opts.audioId, opts.rate ?? 0.8, pitch, token, onDone);
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
    parts: { text: string; lang?: SpeechLang; src?: string }[],
    opts: { gapMs?: number; rate?: number; pitch?: number; onEnd?: () => void } = {}
): void {
    cancelSpeech();
    audioFxRate = null;

    const token = playToken; // capture sau cancelSpeech; dùng để kiểm tra huỷ giữa chừng
    activeToken = token;     // isSpeaking() = true suốt chuỗi, kể cả lúc chờ tải audio giữa các phần
    const gap = opts.gapMs ?? 200;       // khoảng nghỉ giữa các phần (ms)
    const rate = opts.rate ?? 0.8;       // chậm rãi cho trẻ
    const pitch = opts.pitch ?? 1.05;
    let i = 0;

    const playNext = () => {
        if (token !== playToken) return;          // đã bị huỷ bởi cancel/đọc mới
        if (i >= parts.length) { if (activeToken === token) activeToken = -1; opts.onEnd?.(); return; }
        const p = parts[i++];
        const lang = p.lang ?? 'vi-VN';
        const advance = () => { if (token === playToken) window.setTimeout(playNext, gap); };
        // Phần có file local (vd tên nguyên tố tải sẵn): phát file trước — nhanh, không cần mạng; lỗi thì đọc thường.
        if (p.src && typeof Audio !== 'undefined') {
            const audio = new Audio(p.src);
            currentAudio = audio;
            let settled = false;
            const end = (ok: boolean) => {
                if (settled || token !== playToken) return;
                settled = true; currentAudio = null;
                if (ok) advance(); else startChain(p.text, lang, undefined, rate, pitch, token, advance);
            };
            audio.onended = () => end(true);
            audio.onerror = () => end(false);
            audio.play().catch(() => end(false));
            return;
        }
        // Mỗi phần đi qua đúng chuỗi ưu tiên: thiết bị → MP3 built-in → Google.
        startChain(p.text, lang, undefined, rate, pitch, token, advance);
    };

    // Chờ một nhịp sau cancel để tránh lỗi Chrome "nuốt" câu đầu tiên.
    window.setTimeout(playNext, 120);
}

/** Có đang đọc không (giọng máy hoặc audio MP3/Google) — dùng để chờ đọc xong thật thay vì hẹn giờ đoán. */
export function isSpeaking(): boolean {
    if (activeToken !== -1 && activeToken === playToken) return true;   // chuỗi đọc chưa xong (có thể đang tải audio)
    if (currentAudio && !currentAudio.paused && !currentAudio.ended) return true;
    return typeof window !== 'undefined' && 'speechSynthesis' in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
}
