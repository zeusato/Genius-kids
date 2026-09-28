// Tham số URL cho scene tế bào — phục vụ chụp ảnh trước/sau và đo hiệu năng (như solar/sceneParams):
//   ?tier=low|high   ép tier chất lượng (tắt tự hạ tier của PerformanceMonitor)
//   ?debug=perf      hiện bảng draw call / tam giác / fps
//   ?intro=0         bỏ cảnh lặn vào mô
//   ?seed=123        cố định bố cục ngẫu nhiên (vị trí ty thể, ribôxôm...)
//   ?view=2d         dùng giao diện 2D cũ (đọc ở CellBiologyPage)

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

// Chẩn đoán hiệu năng: ?fx=0 tắt hậu kỳ, ?msaa=0 tắt khử răng cưa của composer
export const FX_DISABLED = params.get('fx') === '0';
export const COMPOSER_MSAA = params.get('msaa') === '0' ? 0 : 4;

// Seed bố cục: mặc định CỐ ĐỊNH (khác solar) — tế bào là mô hình học tập, bé quay lại vẫn thấy
// ty thể ở chỗ cũ; chỉ đổi khi truyền ?seed để thử bố cục khác.
export const LAYOUT_SEED = params.get('seed') ?? 'cell';

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
