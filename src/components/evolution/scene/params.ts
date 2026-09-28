// Tham số URL cho cảnh Cây Tiến Hóa (như cell/scene3d/params):
//   ?tier=low|high  ép tier   ?debug=perf  bảng draw call/fps   ?intro=0  bỏ cảnh cây mọc
//   ?fx=0  tắt hậu kỳ   ?t=66  mở cỗ máy thời gian ở 66 triệu năm   ?mix=1  thang thời gian thật
//   ?view=legacy  giao diện DOM cũ
function readParams(): URLSearchParams {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
}
const params = readParams();

export type QualityTier = 'high' | 'low';
export const FORCED_TIER: QualityTier | null = params.get('tier') === 'low' ? 'low' : params.get('tier') === 'high' ? 'high' : null;
export const DEBUG_PERF = params.get('debug') === 'perf';
export const INTRO_DISABLED = params.get('intro') === '0';
export const FX_DISABLED = params.get('fx') === '0';
export const START_TIME: number | null = params.has('t') ? Math.max(0, Math.min(4540, Number(params.get('t')) || 0)) : null;
export const START_MIX = params.get('mix') === '1' ? 1 : 0;
export const LEGACY_VIEW = params.get('view') === 'legacy';

export function supportsWebGL2(): boolean {
    try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
