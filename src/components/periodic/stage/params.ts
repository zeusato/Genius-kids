// Tham số URL của Bảng tuần hoàn (chụp ảnh / đo hiệu năng):
//   ?tier=low|high  ép tier   ?debug=perf  bảng draw call/fps   ?fx=0  tắt hậu kỳ   ?intro=0  bỏ mở màn
//   ?el=Au | ?el=79  mở sẵn nguyên tố   ?lens=state&t=30 | ?lens=history&year=1869   ?view=legacy  modal cũ
const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);

export type QualityTier = 'high' | 'low';
export const FORCED_TIER: QualityTier | null = params.get('tier') === 'low' ? 'low' : params.get('tier') === 'high' ? 'high' : null;
export const DEBUG_PERF = params.get('debug') === 'perf';
export const FX_DISABLED = params.get('fx') === '0';
export const INTRO_DISABLED = params.get('intro') === '0';
export const START_ELEMENT = params.get('el');
export const START_LENS = params.get('lens');
export const START_TEMP = params.has('t') ? Number(params.get('t')) : null;
export const START_YEAR = params.has('year') ? Number(params.get('year')) : null;
export const LEGACY_VIEW = params.get('view') === 'legacy';

export function supportsWebGL2(): boolean {
    try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
