// ============================================================================
//  Gemini client dùng chung — TỰ ĐỘNG chọn model mới nhất (KHÔNG chỉ đích danh
//  một phiên bản cụ thể) để khi Google cập nhật model thì tính năng không hỏng.
//
//  Cơ chế:
//   1) Hỏi endpoint ListModels của Gemini để lấy danh sách model thực có với
//      API key đó, rồi chọn model "flash" ỔN ĐỊNH, phiên bản CAO NHẤT
//      (ưu tiên alias family-latest `gemini-flash-latest` nếu tồn tại). Kết quả
//      được cache (bộ nhớ + localStorage, TTL 24h) để khỏi gọi lại mỗi lần.
//   2) generateContent đi qua `geminiGenerateContent()`: nếu model trả 404
//      (bị gỡ/đổi tên), tự khám phá lại + thử lần lượt các ứng viên dự phòng,
//      và CACHE model nào chạy được → tự chữa lành, không cần sửa code.
//
//  Lưu ý: đây là API Google Gemini (không phải Anthropic/Claude).
// ============================================================================

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const listUrl = (key: string) => `${BASE}/models?key=${key}&pageSize=1000`;
const genUrl = (model: string, key: string) => `${BASE}/models/${model}:generateContent?key=${key}`;

const CACHE_KEY = 'mathgenius_gemini_model';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ

// Alias "family-latest" của Google luôn trỏ tới flash mới nhất (không đích danh version).
const FAMILY_LATEST = 'gemini-flash-latest';
// Ứng viên dự phòng cuối cùng (model đang chạy tốt hiện tại) — chỉ dùng khi mọi cách trên thất bại.
const SAFE_FALLBACK = 'gemini-2.5-flash';

let memoModel: string | null = null;

const stripPrefix = (name: string) => name.replace(/^models\//, '');

const readCache = (): { model: string; ts: number } | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
};
const writeCache = (model: string) => {
    memoModel = model;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ model, ts: Date.now() })); } catch { /* ignore */ }
};

/** Điểm phiên bản: "gemini-2.5-flash" → 205; càng cao càng mới. (export để test) */
export const versionScore = (name: string): number => {
    const m = name.match(/gemini-(\d+)\.(\d+)/);
    return m ? parseInt(m[1], 10) * 100 + parseInt(m[2], 10) : 0;
};

/** Chọn model tốt nhất từ danh sách ListModels: flash ổn định, version cao nhất. (export để test) */
export const pickBest = (models: any[]): string | null => {
    const gen = (models || [])
        .filter(m => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => stripPrefix(m.name || ''))
        .filter(Boolean);
    if (gen.length === 0) return null;

    // 1) Alias family-latest nếu API có (Google tự bảo trì = mới nhất).
    if (gen.includes(FAMILY_LATEST)) return FAMILY_LATEST;

    // 2) Flash "thuần" (không hậu tố preview/exp/lite/ngày tháng), version cao nhất.
    const stableFlash = gen.filter(n => /^gemini-\d+(?:\.\d+)?-flash$/.test(n));
    if (stableFlash.length) return stableFlash.sort((a, b) => versionScore(b) - versionScore(a))[0];

    // 3) Bất kỳ flash nào không phải preview/exp.
    const anyFlash = gen.filter(n => n.includes('flash') && !/preview|exp/i.test(n));
    if (anyFlash.length) return anyFlash.sort((a, b) => versionScore(b) - versionScore(a))[0];

    // 4) Bất kỳ model gemini hỗ trợ generateContent.
    const anyGemini = gen.filter(n => n.startsWith('gemini')).sort((a, b) => versionScore(b) - versionScore(a));
    return anyGemini[0] || null;
};

/** Trả về id model nên dùng (có cache). force=true để bỏ cache, khám phá lại. */
export const resolveGeminiModel = async (apiKey: string, force = false): Promise<string> => {
    if (!force) {
        if (memoModel) return memoModel;
        const cached = readCache();
        if (cached && Date.now() - cached.ts < CACHE_TTL) { memoModel = cached.model; return cached.model; }
    }
    try {
        const res = await fetch(listUrl(apiKey));
        if (res.ok) {
            const data = await res.json();
            const best = pickBest(data?.models);
            if (best) { writeCache(best); return best; }
        }
    } catch { /* offline / bị chặn → dùng dự phòng */ }
    // Không khám phá được: ưu tiên cache cũ, rồi tới alias family-latest.
    return readCache()?.model || FAMILY_LATEST;
};

/**
 * Gọi generateContent với model tự chọn. Trả về `Response` (caller tự xử lý
 * .ok / .json() như cũ). Tự chữa lành nếu model 404: khám phá lại + thử các
 * ứng viên dự phòng, cache model nào hoạt động.
 */
export const geminiGenerateContent = async (apiKey: string, body: unknown): Promise<Response> => {
    if (!apiKey) throw new Error('Vui lòng cung cấp API Key để sử dụng AI.');

    const primary = await resolveGeminiModel(apiKey);
    const candidates = [primary, FAMILY_LATEST, SAFE_FALLBACK];
    const tried = new Set<string>();
    const post = (model: string) => fetch(genUrl(model, apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    let lastRes: Response | null = null;
    for (let i = 0; i < candidates.length; i++) {
        const model = candidates[i];
        if (!model || tried.has(model)) continue;
        tried.add(model);

        const res = await post(model);
        if (res.status !== 404) {
            // Thành công hoặc lỗi khác (key/mạng/quota) → cache model chạy được, trả về.
            if (res.ok && model !== memoModel) writeCache(model);
            return res;
        }
        lastRes = res;
        // 404 ở model chính → thử khám phá lại 1 lần và chèn kết quả vào hàng đợi.
        if (i === 0) {
            const fresh = await resolveGeminiModel(apiKey, true);
            if (fresh && !tried.has(fresh)) candidates.splice(i + 1, 0, fresh);
        }
    }
    // Tất cả đều 404 → trả response cuối để caller báo lỗi như bình thường.
    return lastRes as Response;
};
