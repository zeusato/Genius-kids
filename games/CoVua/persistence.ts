// Cờ Vua — storage độc lập theo owner; kết quả idempotent và không phát sao.



import { validateMatch, validateParty } from './engine';
import type { GameRecord, Match } from './model';

const key = (owner: string, suffix: string) => `co-vua:${owner}:${suffix}`;

export function saveDraft(s: Match): boolean {
  try { localStorage.setItem(key(s.owner, 'draft-v1'), JSON.stringify(s)); return true; } catch { return false; }
}
export function loadDraft(owner: string): { match: Match | null; error: boolean } {
  try {
    const raw = localStorage.getItem(key(owner, 'draft-v1'));
    if (!raw) return { match: null, error: false };
    const s = JSON.parse(raw);
    return validateMatch(s, owner) ? { match: s, error: false } : { match: null, error: true };
  } catch { return { match: null, error: true }; }
}
export function saveParty(owner: string, p: Match['players']) {
  try { localStorage.setItem(key(owner, 'party'), JSON.stringify(p)); } catch { /* Play remains available. */ }
}
export function loadParty(owner: string): Match['players'] | null {
  try { const p = JSON.parse(localStorage.getItem(key(owner, 'party')) || 'null'); return validateParty(p) ? p : null; } catch { return null; }
}
export function clearCoVuaData(owner: string) {
  for (const suffix of ['draft-v1', 'party', 'prefs', 'results-v2']) try { localStorage.removeItem(key(owner, suffix)); } catch { /* Profile deletion may still continue. */ }
}

// Kết quả của chủ ván theo ownerSide, không suy ra từ màu Trắng.
export function recordOf(s: Match): GameRecord {
  return {
    version: 1, rulesVersion: s.rulesVersion, id: s.id, ownerSide: s.ownerSide, endedAt: s.endedAt!,
    hostResult: s.winner === null ? 'draw' : s.winner === s.ownerSide ? 'win' : 'loss',
    players: s.players.map(p => ({ ...p })),
    winner: s.winner, reason: s.reason!, turns: s.turn,
  };
}

export function persistStandaloneResult(s: Match): boolean {
  if (!validateMatch(s) || s.phase !== 'over') return false;
  try {
    const raw = localStorage.getItem(key(s.owner, 'results-v2'));
    const records: GameRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(records)) return false;
    if (!records.some(r => r.id === s.id)) localStorage.setItem(key(s.owner, 'results-v2'), JSON.stringify([...records, recordOf(s)].slice(-200)));
    return true;
  } catch { return false; }
}
