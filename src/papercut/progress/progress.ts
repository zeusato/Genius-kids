// Thưởng của Xưởng Cắt Giấy (plan mục 8): mỗi khoá chỉ nhận một lần, thưởng hữu hạn.
// Khoá: 'first' (cất tác phẩm đầu), 'art:<id>' (mỗi tác phẩm mới, tối đa 20 sao), 'guide' (xuất hướng dẫn đầu),
// 'apart' (cắt rời thành nhiều mảnh, như dây người), 'six' (bông tuyết ≥ 6 lớp khi cắt).
import type { StudentProfile } from '../../../types';
import { processGameReward } from '../../../services/rewardService';
import type { PapercutProgress } from '../model';

export type PapercutEvent = { kind: 'save'; id: string; pieces: number; maxLayers: number } | { kind: 'guide' };

const BADGES: [key: string, name: string][] = [['first', 'Đôi tay khéo'], ['six', 'Bông tuyết đầu tiên'], ['apart', 'Dây người nắm tay'], ['guide', 'Người chia sẻ'], ['ten', 'Nghệ nhân cắt giấy']];
const MAX_ART_STARS = 20;

export function rewardKeys(progress: PapercutProgress, e: PapercutEvent): string[] {
  if (e.kind === 'guide') return ['guide'];
  const keys = ['first'];
  if (progress.claimed.filter(k => k.startsWith('art:')).length < MAX_ART_STARS) keys.push('art:' + e.id);
  if (e.maxLayers >= 6) keys.push('six');
  if (e.pieces > 1) keys.push('apart');
  if (progress.claimed.filter(k => k.startsWith('art:')).length + 1 >= 10) keys.push('ten');
  return keys;
}

export function persistPapercut(profiles: StudentProfile[], owner: string, e: PapercutEvent, write: (p: StudentProfile[]) => void) {
  const old = profiles.find(p => p.id === owner), fail = { ok: false, profiles, earned: 0, badges: [] as string[] };
  if (!old) return fail;
  const progress: PapercutProgress = old.papercut || { version: 1, claimed: [], badges: [] };
  const fresh = rewardKeys(progress, e).filter(k => !progress.claimed.includes(k));
  if (!fresh.length) return { ...fail, ok: true };
  const claimed = [...progress.claimed, ...fresh], badges = [...progress.badges], added: string[] = [];
  for (const [k, name] of BADGES) if (claimed.includes(k) && !badges.includes(name)) { badges.push(name); added.push(name); }
  const earned = fresh.length, updated = processGameReward(old, null, earned).updatedProfile;
  const next = profiles.map(p => (p.id === owner ? { ...updated, papercut: { version: 1 as const, claimed, badges } } : p));
  try { write(next); return { ok: true, profiles: next, earned, badges: added }; } catch { return fail; }
}
