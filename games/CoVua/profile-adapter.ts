import type { StudentProfile, GameResult } from '../../types';
import { initializeStats } from '../../services/achievementService';
import { validateMatch } from './engine';
import { recordOf } from './persistence';
import type { Match } from './model';
export function persistResult(profiles: StudentProfile[], owner: string, s: Match, write: (p: StudentProfile[]) => void) {
  const fail = { ok: false, profiles };
  if (!validateMatch(s, owner) || s.phase !== 'over') return fail;
  const profile = profiles.find(p => p.id === owner);
  if (!profile) return fail;
  if (profile.gameHistory.some(g => g.id === s.id)) return { ok: true, profiles };
  const record = recordOf(s);
  const stats = structuredClone(profile.stats || initializeStats(profile));
  stats.totalGamesPlayed++;
  if (record.hostResult === 'win') stats.gameWins['co-vua'] = (stats.gameWins['co-vua'] || 0) + 1;
  const entry: GameResult = {
    id: s.id, gameType: 'co-vua', date: s.endedAt!,
    score: record.hostResult === 'win' ? 1 : record.hostResult === 'draw' ? 0.5 : 0,
    maxScore: 1, starsEarned: 0, durationSeconds: Math.round(s.elapsed / 1000),
    difficulty: s.players[s.ownerSide ^ 1].kind === 'bot' ? s.players[s.ownerSide ^ 1].level : undefined,
  };
  const updated = { ...profile, stats, gameHistory: [...profile.gameHistory, entry] };
  const next = profiles.map(p => p.id === owner ? updated : p);
  try { write(next); return { ok: true, profiles: next }; } catch { return fail; }
}

