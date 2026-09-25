// Tham số URL cho scene Hệ Mặt Trời — phục vụ chụp ảnh trước/sau và đo hiệu năng:
//   ?seed=123        cố định mọi góc xuất phát ngẫu nhiên (hành tinh, vệ tinh, vành đai...)
//   ?tier=low|high   ép tier chất lượng (tắt tự hạ tier của PerformanceMonitor)
//   ?debug=perf      hiện bảng draw call / tam giác / fps
//   ?intro=0         bỏ cảnh bay mở màn

function readParams(): URLSearchParams {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
}

const params = readParams();

export type QualityTier = 'high' | 'low';

export const FORCED_TIER: QualityTier | null =
    params.get('tier') === 'low' ? 'low' : params.get('tier') === 'high' ? 'high' : null;

export const DEBUG_PERF = params.get('debug') === 'perf';

export const INTRO_DISABLED = params.get('intro') === '0';

// Seed cố định từ URL, không có thì random một lần mỗi lần tải trang — để PlanetMesh và
// vệt quỹ đạo (OrbitTrails) cùng đọc ra MỘT góc xuất phát cho cùng một hành tinh.
const seedParam = params.get('seed');
const SESSION_SEED = seedParam !== null && seedParam !== '' ? hashString(seedParam) : (Math.random() * 2 ** 32) >>> 0;

function hashString(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// mulberry32 — PRNG 32-bit nhỏ gọn, đủ cho bố cục hình ảnh
export function createRandom(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Bộ sinh số ngẫu nhiên riêng cho từng "chủ thể" (vd 'phase:earth', 'belt:0') — tất định theo seed
export function sceneRandom(key: string): () => number {
    return createRandom(SESSION_SEED ^ hashString(key));
}

// Góc xuất phát quỹ đạo của một thiên thể (radian) — cache để mọi nơi đọc cùng giá trị
const phaseCache = new Map<string, number>();
export function initialPhase(id: string): number {
    let p = phaseCache.get(id);
    if (p === undefined) {
        p = sceneRandom(`phase:${id}`)() * Math.PI * 2;
        phaseCache.set(id, p);
    }
    return p;
}

// Ghi đè góc xuất phát (dùng cho "📅 các hành tinh ở đâu vào ngày..." — vị trí thật theo ngày)
export function overridePhase(id: string, radians: number): void {
    phaseCache.set(id, radians);
}

// Độ sáng toàn hệ (0 = thực tế: mặt đêm tối đen, 1 = sáng rõ cho trẻ dễ nhìn). Object mutable
// dùng chung — shader đọc mỗi frame (EarthSurface, bầu trời), UI ghi qua setSceneBrightness.
// Nhớ theo máy (localStorage, lỗi thì dùng mặc định).
const BRIGHTNESS_KEY = 'solarBrightness';
export const DEFAULT_BRIGHTNESS = 0.6;

function loadBrightness(): number {
    try {
        const v = parseFloat(localStorage.getItem(BRIGHTNESS_KEY) ?? '');
        return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_BRIGHTNESS;
    } catch {
        return DEFAULT_BRIGHTNESS;
    }
}

export const sceneLighting = { brightness: typeof window === 'undefined' ? DEFAULT_BRIGHTNESS : loadBrightness() };

export function setSceneBrightness(v: number): void {
    sceneLighting.brightness = Math.min(1, Math.max(0, v));
    try { localStorage.setItem(BRIGHTNESS_KEY, String(sceneLighting.brightness)); } catch { /* chế độ riêng tư */ }
}

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
