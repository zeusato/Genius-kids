import type { Match, CaroRecord } from './model';
import { validateMatch } from './engine';
const key = (owner: string, suffix: string) => `caro:${owner}:${suffix}`;
export function loadDraft(owner: string): { match: Match | null; error: boolean } {
  try { const raw = localStorage.getItem(key(owner, 'draft-v1')); if (!raw) return { match: null, error: false };
    const value: unknown = JSON.parse(raw); return validateMatch(value, owner) ? { match: value, error: false } : { match: null, error: true };
  } catch { return { match: null, error: true }; }
}
export function saveDraft(s: Match): boolean { try { localStorage.setItem(key(s.owner, 'draft-v1'), JSON.stringify(s)); return true; } catch { return false; } }
export interface Prefs { mode: Match['mode']; level: Match['level']; ownerSide: Match['ownerSide']; guest: string; avatar: string; undoEnabled: boolean; sound: boolean }
export const DEFAULT_PREFS: Prefs = { mode: 'bot', level: 'easy', ownerSide: 0, guest: 'Bạn của em', avatar: '🐰', undoEnabled: false, sound: true };
export function loadPrefs(owner: string): Prefs {
  try { const p = JSON.parse(localStorage.getItem(key(owner, 'prefs')) || 'null');
    if (p && ['human', 'bot'].includes(p.mode) && ['easy', 'medium', 'hard'].includes(p.level) && [0, 1].includes(p.ownerSide) && typeof p.guest === 'string' && p.guest.length <= 40 && ['🐰', '🐻', '🐱', '🦊'].includes(p.avatar) && typeof p.undoEnabled === 'boolean' && typeof p.sound === 'boolean') return p;
  } catch { /* Defaults remain playable. */ } return { ...DEFAULT_PREFS };
}
export function savePrefs(owner: string, prefs: Prefs) { try { localStorage.setItem(key(owner, 'prefs'), JSON.stringify(prefs)); } catch { /* Nonessential preferences. */ } }
export function clearCaroData(owner: string) { for (const suffix of ['draft-v1', 'prefs']) try { localStorage.removeItem(key(owner, suffix)); } catch { /* Other profile cleanup can continue. */ } }
export function recordOf(s: Match): CaroRecord { return { version: 1, rulesVersion: s.rulesVersion, mode: s.mode, level: s.level, ownerSide: s.ownerSide, players: s.players.map(p => ({ ...p })) as Match['players'], winner: s.winner, reason: s.endReason, undos: s.undos, moves: [...s.moves] }; }
