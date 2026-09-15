import type { GameRecord, Match } from './model';
import { recordOf, validateMatch } from './engine';
export interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
const key = (owner: string, suffix: string) => `co-tuong:standalone:${owner}:${suffix}`;
const storage = (): Store => window.localStorage;
export function saveDraft(match: Match, store?: Store): boolean { try { (store ?? storage()).setItem(key(match.owner, 'draft-v1'), JSON.stringify(match)); return true; } catch { return false; } }
export function loadDraft(owner: string, store?: Store): { match: Match | null; error: boolean } {
  try { const raw = (store ?? storage()).getItem(key(owner, 'draft-v1')); if (!raw) return { match: null, error: false }; const m: unknown = JSON.parse(raw); return validateMatch(m, owner) ? { match: m, error: false } : { match: null, error: true }; } catch { return { match: null, error: true }; }
}
export function persistResult(match: Match, store?: Store): boolean {
  try {
    if (match.phase !== 'over' || !validateMatch(match, match.owner)) return false;
    const target = store ?? storage(), raw = target.getItem(key(match.owner, 'results-v1')), records: GameRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(records)) return false;
    if (records.some(record => record.id === match.id)) return true;
    target.setItem(key(match.owner, 'results-v1'), JSON.stringify([...records, recordOf(match)])); return true;
  } catch { return false; }
}
export function recordsFor(owner: string, store?: Store): GameRecord[] { try { const list = JSON.parse((store ?? storage()).getItem(key(owner, 'results-v1')) || '[]'); return Array.isArray(list) ? list.filter(r => r && r.rulesVersion === 'gk-xiangqi-v1' && ['win', 'draw', 'loss'].includes(r.hostResult)) : []; } catch { return []; } }
export function clearCoTuongData(owner: string, store?: Store) { for (const suffix of ['draft-v1', 'prefs', 'party', 'results-v1']) try { (store ?? storage()).removeItem(key(owner, suffix)); } catch { /* Read-only storage should not crash the app. */ } }
export interface Prefs { vietnamese: boolean; flat: boolean; view: 'straight' | 'tilted'; sound: boolean; reduced: boolean; light: boolean; handoff: boolean }
export function loadPrefs(owner: string): Prefs {
  const defaults: Prefs = { vietnamese: false, flat: false, view: 'tilted', sound: true, reduced: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches, light: false, handoff: false };
  try { const parsed = JSON.parse(storage().getItem(key(owner, 'prefs')) || '{}'); for (const name of Object.keys(defaults) as (keyof Prefs)[]) if (name === 'view' ? ['straight', 'tilted'].includes(parsed[name]) : typeof parsed[name] === 'boolean') Object.assign(defaults, { [name]: parsed[name] }); } catch { /* Use defaults. */ } return defaults;
}
export function savePrefs(owner: string, prefs: Prefs) { try { storage().setItem(key(owner, 'prefs'), JSON.stringify(prefs)); } catch { /* Preferences are optional. */ } }
