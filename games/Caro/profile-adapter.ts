import type { StudentProfile, GameResult } from '../../types';
import { initializeStats } from '../../services/achievementService';
import type { Match } from './model';
import { validateMatch } from './engine';
import { recordOf } from './persistence';
export function persistResult(profiles: StudentProfile[], owner: string, s: Match, write: (profiles: StudentProfile[]) => void) {
  const fail = { ok: false, profiles };
  if (!validateMatch(s, owner) || s.phase !== 'over') return fail;
  const profile = profiles.find(p => p.id === owner); if (!profile) return fail;
  if (profile.gameHistory.some(g => g.id === s.id)) return { ok: true, profiles };
  const score = s.winner === null ? 0.5 : s.winner === s.ownerSide ? 1 : 0;
  const stats = structuredClone(profile.stats || initializeStats(profile)); stats.totalGamesPlayed++;
  if (score === 1) stats.gameWins.caro = (stats.gameWins.caro || 0) + 1;
  const entry: GameResult = { id: s.id, gameType: 'caro', date: s.endedAt!, score, maxScore: 1, starsEarned: 0, durationSeconds: Math.round(s.elapsed / 1000), difficulty: s.mode === 'bot' ? s.level : undefined, caro: recordOf(s) };
  let recent = 0;
  const history = [...profile.gameHistory, entry].reverse().map(g => {
    if (!g.caro?.moves || ++recent <= 50) return g;
    const { moves: _moves, ...record } = g.caro; return { ...g, caro: record };
  }).reverse();
  const next = profiles.map(p => p.id === owner ? { ...p, stats, gameHistory: history } : p);
  try { write(next); return { ok: true, profiles: next }; } catch { return fail; }
}
