// Đọc câu tiếng Việt có lẫn tên nguyên tố IUPAC: tách thành các phần — tên tiếng Anh đọc bằng giọng en-US,
// phần còn lại bằng vi-VN — để "Hydrogen", "Oxygen" không bị giọng Việt đánh vần sai. Phần tách là TS thuần.
import { ELEMENTS } from './elements';
import { VIET_NAMES } from '../../../data/periodic/names';
import { speakSequence, isSpeaking, type SpeechLang } from '../../../utils/speech';
import NAME_AUDIO from '../../../data/periodic/nameAudio.json';

export interface SpeechPart { text: string; lang: SpeechLang; src?: string }

/** Slug file audio tên nguyên tố — khớp scripts/build-element-name-audio.mjs. */
export const nameSlug = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const EN_FILES = new Set<string>(NAME_AUDIO.en);
/** File MP3 tải sẵn (giọng online nữ) cho một tên tiếng Anh, nếu có. */
export function nameAudioSrc(name: string): string | undefined {
    const k = nameSlug(name);
    const base = (import.meta as any).env?.BASE_URL ?? '/';
    return EN_FILES.has(k) ? `${base}audio/en/elements/${k}.mp3` : undefined;
}

// Tên IUPAC + tên tiếng Anh Mỹ trong dữ liệu (Sodium, Aluminum, Cesium…), trừ 13 nguyên tố giữ tên Việt.
const EN_NAMES = [...new Set(ELEMENTS.flatMap(e => [e.sgkName, e.nameEn])
    .filter(n => !Object.values(VIET_NAMES).includes(n)))]
    .sort((a, b) => b.length - a.length);
// String.raw: trong template literal thường, "\p" mất dấu "\" → ranh giới từ vô hiệu ("Neonatal" bị cắt).
const EN_RE = new RegExp(String.raw`(?<![\p{L}])(` + EN_NAMES.join('|') + String.raw`)(?![\p{L}])`, 'giu');

export function toSpeechParts(text: string): SpeechPart[] {
    const parts: SpeechPart[] = [];
    let last = 0;
    for (const m of text.matchAll(EN_RE)) {
        const i = m.index ?? 0;
        const vi = text.slice(last, i).trim();
        if (/[\p{L}\p{N}]/u.test(vi)) parts.push({ text: vi, lang: 'vi-VN' });
        // mỗi tên một phần riêng để phát đúng file local của nó (không gộp "oxygen, silicon")
        const src = nameAudioSrc(m[0]);
        parts.push(src ? { text: m[0], lang: 'en-US', src } : { text: m[0], lang: 'en-US' });
        last = i + m[0].length;
    }
    const tail = text.slice(last).trim();
    if (/[\p{L}\p{N}]/u.test(tail)) parts.push({ text: tail, lang: 'vi-VN' });
    return parts;
}

/** Đọc câu lẫn tên tiếng Anh; onEnd gọi khi đọc xong phần cuối. */
export function speakMixed(text: string, opts: { rate?: number; onEnd?: () => void } = {}): void {
    speakSequence(toSpeechParts(text), { gapMs: 80, rate: opts.rate ?? 0.9, onEnd: opts.onEnd });
}

/**
 * Chờ đọc xong THẬT rồi mới gọi `done`: ưu tiên onEnd; phòng khi trình duyệt không báo onend (Chrome đôi khi
 * nuốt sự kiện), sau thời gian tối thiểu thì hỏi isSpeaking() mỗi 400 ms. Trả về hàm hủy.
 */
export function speakAndWait(text: string, done: () => void, opts: { rate?: number } = {}): () => void {
    let fired = false, timer = 0;
    const finish = () => { if (fired) return; fired = true; window.clearTimeout(timer); done(); };
    speakMixed(text, { rate: opts.rate, onEnd: finish });
    const t0 = performance.now(), minMs = 1500 + text.length * 45;
    let quiet = 0;   // cần 2 lần liên tiếp không nghe gì (khoảng nghỉ giữa các phần ~200 ms không tính)
    const poll = () => {
        if (fired) return;
        quiet = isSpeaking() ? 0 : quiet + 1;
        if (performance.now() - t0 > minMs && quiet >= 2) { finish(); return; }
        if (performance.now() - t0 > 90_000) { finish(); return; }
        timer = window.setTimeout(poll, 400);
    };
    timer = window.setTimeout(poll, 600);
    return () => { fired = true; window.clearTimeout(timer); };
}
