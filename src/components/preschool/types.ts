// Kiểu dữ liệu chung cho các mục Mầm non (chữ cái / số / màu).
import type { SpeechLang } from '@/src/utils/speech';

export type TokenKind = 'text' | 'color' | 'count';

/** Một "thẻ" hiển thị + đọc được, dùng chung cho flashcard và quiz. */
export interface PreschoolToken {
    id: string;
    kind: TokenKind;
    big?: string;       // chữ/số lớn (vd 'A', '3')
    sub?: string;       // dòng phụ nhỏ (vd chữ thường 'a')
    emoji?: string;     // emoji minh họa
    count?: number;     // số lượng emoji để render (kind 'count')
    hex?: string;       // màu nền (kind 'color')
    light?: boolean;    // nền sáng → dùng chữ tối
    enText: string;     // nội dung đọc tiếng Anh
    viText: string;     // nội dung đọc tiếng Việt
    label?: string;     // chú thích nhỏ dưới thẻ
    /** Tùy chọn: chuỗi đọc tùy biến (ưu tiên hơn enText/viText), vd tách chữ với từ minh họa. */
    speakParts?: { text: string; lang?: SpeechLang }[];
}

/** Chuỗi đọc cho một token: dùng speakParts nếu có, mặc định Anh → Việt. */
export function tokenSpeechParts(t: PreschoolToken): { text: string; lang: SpeechLang }[] {
    if (t.speakParts && t.speakParts.length > 0) {
        return t.speakParts.map(p => ({ text: p.text, lang: p.lang ?? 'vi-VN' }));
    }
    return [
        { text: t.enText, lang: 'en-US' },
        { text: t.viText, lang: 'vi-VN' },
    ];
}
