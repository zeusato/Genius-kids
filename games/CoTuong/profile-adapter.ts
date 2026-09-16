import type { StudentProfile, GameResult } from '../../types';
import { initializeStats } from '../../services/achievementService';
import { validateMatch, recordOf } from './engine';
import type { Match } from './model';

export function persistResult(profiles: StudentProfile[], owner: string, match: Match, write: (profiles: StudentProfile[]) => void) {
  const fail = { ok: false, profiles };
  if (!validateMatch(match, owner) || match.phase !== 'over') return fail;
  const profile = profiles.find(p => p.id === owner);
  if (!profile) return fail;
  if (profile.gameHistory.some(game => game.id === match.id)) return { ok: true, profiles };
  const record = recordOf(match), stats = structuredClone(profile.stats || initializeStats(profile));
  stats.totalGamesPlayed++;
  if (record.hostResult === 'win') stats.gameWins['co-tuong'] = (stats.gameWins['co-tuong'] || 0) + 1;
  const entry: GameResult = {
    id: match.id, gameType: 'co-tuong', date: match.endedAt!,
    score: record.hostResult === 'win' ? 1 : record.hostResult === 'draw' ? .5 : 0,
    maxScore: 1, starsEarned: 0, durationSeconds: Math.round(match.elapsed / 1000),
    difficulty: match.players[match.ownerSide ^ 1].kind === 'bot' ? match.players[match.ownerSide ^ 1].level : undefined,
  };
  const updated = { ...profile, stats, gameHistory: [...profile.gameHistory, entry] };
  const next = profiles.map(p => p.id === owner ? updated : p);
  try { write(next); return { ok: true, profiles: next }; } catch { return fail; }
}
