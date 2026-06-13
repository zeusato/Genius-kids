// Quản lý kho từ cho game Bảng chữ cái: gộp kho tĩnh + kho mở rộng (cache localStorage),
// và mở rộng thêm bằng Gemini nếu người dùng đã cài API key.

import { BASE_WORD_BANK, type WordEntry } from '@/src/data/wordBankData';

export type WordBank = Record<string, WordEntry[]>;

const STORAGE_KEY = 'preschool_wordbank_v1';
const EXPANDED_FLAG = 'preschool_wordbank_expanded_at';

const getApiKey = (): string => {
    try { return localStorage.getItem('mathgenius_gemini_key') || ''; } catch { return ''; }
};

export const hasGeminiKey = (): boolean => !!getApiKey();

const loadCache = (): WordBank => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; }
};

const mergeBank = (a: WordBank, b: WordBank): WordBank => {
    const out: WordBank = {};
    const letters = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const L of letters) {
        const seen = new Set<string>();
        const list: WordEntry[] = [];
        for (const e of [...(a[L] || []), ...(b[L] || [])]) {
            const w = (e?.word || '').toLowerCase().trim();
            if (w && !seen.has(w)) { seen.add(w); list.push({ word: w, emoji: e.emoji || '🔤' }); }
        }
        if (list.length) out[L] = list;
    }
    return out;
};

/** Kho từ hiện dùng = kho tĩnh + kho đã cache từ Gemini. */
export const getWordBank = (): WordBank => mergeBank(BASE_WORD_BANK, loadCache());

let inFlight = false;

/**
 * Mở rộng kho từ bằng Gemini (chạy ngầm trong ván đầu). Chỉ chạy 1 lần nếu có API key.
 * Kết quả lưu vào localStorage để dùng cho các lần sau. Trả về kho đã gộp hoặc null.
 */
export const expandWordBankWithGemini = async (): Promise<WordBank | null> => {
    const apiKey = getApiKey();
    if (!apiKey || inFlight) return null;
    try { if (localStorage.getItem(EXPANDED_FLAG)) return null; } catch { return null; }
    inFlight = true;
    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const prompt = `Tạo kho từ vựng tiếng Anh ĐƠN GIẢN cho trẻ mầm non học bảng chữ cái.
Trả về một JSON object: key là chữ cái thường từ "a" đến "z"; value là mảng 8-10 object dạng {"word": "<từ tiếng Anh viết thường, MỘT từ, dễ, quen thuộc với trẻ nhỏ>", "emoji": "<một emoji minh hoạ phù hợp>"}.
Chỉ dùng danh từ cụ thể dễ hình dung (con vật, đồ vật, trái cây, phương tiện...). KHÔNG dùng từ trừu tượng.
Mỗi từ PHẢI bắt đầu bằng đúng chữ cái của key. CHỈ trả JSON thuần, không giải thích, không bọc markdown.`;
        const body = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, response_mime_type: 'application/json' },
        };
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;
        const cleaned = String(text).replace(/```json|```/gi, '').trim();
        const parsed = JSON.parse(cleaned) as WordBank;

        const cleanBank: WordBank = {};
        for (const L of Object.keys(parsed)) {
            const letter = L.toLowerCase().slice(0, 1);
            if (!/[a-z]/.test(letter)) continue;
            const arr = Array.isArray(parsed[L]) ? parsed[L] : [];
            const list = arr
                .filter(e => e && typeof e.word === 'string' && e.word.trim().toLowerCase().startsWith(letter))
                .map(e => ({ word: e.word.trim().toLowerCase(), emoji: (e.emoji || '🔤').trim() }));
            if (list.length) cleanBank[letter] = list;
        }
        if (Object.keys(cleanBank).length === 0) return null;

        const mergedCache = mergeBank(loadCache(), cleanBank);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCache));
        localStorage.setItem(EXPANDED_FLAG, new Date().toISOString());
        return mergeBank(BASE_WORD_BANK, mergedCache);
    } catch {
        return null;
    } finally {
        inFlight = false;
    }
};
