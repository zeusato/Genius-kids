// Chỉ lưu tại thiết bị; prefix này KHÔNG nằm trong account snapshot.
// rotateBeforePlace: số lần ↻ cộng dồn của các lần lắp (chia cho placed = trung bình); nearTap: kéo một ngón < 24 px rồi thành xoay (định chạm mà lỡ xoay → chỉnh TAP_SLOP)
export type Metric = 'placed' | 'quick' | 'invalid' | 'undoSoon' | 'selectionMs' | 'rotate' | 'rotateBeforePlace' | 'trayCancel' | 'nearTap';
export const metricsKey = (owner: string) => 'bricks-local-metrics:' + owner;
export type Days = Record<string, Record<string, number>>;
export function pruneMetrics(days: Days, now = new Date()): Days {
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 29); cutoff.setHours(0, 0, 0, 0);
  return Object.fromEntries(Object.entries(days).filter(([day]) => new Date(day + 'T00:00:00').getTime() >= cutoff.getTime()));
}
export function readMetrics(owner: string): Days {
  try { return pruneMetrics(JSON.parse(localStorage.getItem(metricsKey(owner)) || '{}')); } catch { return {}; }
}
export function recordMetric(owner: string | undefined, event: Metric, value = 1, reason?: string) {
  if (!owner) return;
  try { const days = readMetrics(owner), now = new Date();
    const day = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const row = days[day] ||= {}; const key = event === 'invalid' ? event + ':' + (reason || 'unknown') : event;
    row[key] = (row[key] || 0) + value; localStorage.setItem(metricsKey(owner), JSON.stringify(days));
  } catch { /* Số liệu phụ không ngăn bé lắp hoặc lưu. */ }
}
