// Tham số URL của Xưởng Ánh Sáng (chụp ảnh / đo hiệu năng):
//   ?tier=low|high  ép tier   ?fx=0  tắt hậu kỳ   ?renderer=svg  bàn phẳng   ?debug=perf  số draw call/fps
const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);

export type QualityTier = 'high' | 'low';
export const FORCED_TIER: QualityTier | null = params.get('tier') === 'low' ? 'low' : params.get('tier') === 'high' ? 'high' : null;
export const FX_DISABLED = params.get('fx') === '0';
export const DEBUG_PERF = params.get('debug') === 'perf';
