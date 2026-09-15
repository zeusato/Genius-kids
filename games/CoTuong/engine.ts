import type { GameRecord, Level, Match, Move, Player, Side } from './model';
import { other, RULES_VERSION, sameMove } from './model';
import { createPosition, fromMatch } from './position';
import { legalMoves } from './movegen';
import { advance, adjudicatePosition } from './rules';
export function newMatch(owner: { id: string; name: string; avatar?: string }, ownerSide: Side, mode: 'bot' | 'human', level: Level, id: string = crypto.randomUUID()): Match {
  const host: Player = { ...owner, avatar: owner.avatar || '茶', kind: 'human', level };
  const guest: Player = { id: `${owner.id}:opponent`, name: mode === 'bot' ? 'Kỳ thủ vườn' : 'Bạn cùng chơi', avatar: mode === 'bot' ? '竹' : '友', kind: mode === 'bot' ? 'bot' : 'human', level };
  const p = createPosition();
  return { version: 1, rulesVersion: RULES_VERSION, id, owner: owner.id, ownerSide, players: ownerSide === 0 ? [host, guest] : [guest, host], board: Array.from(p.board), active: 0, phase: 'play', winner: null, reason: null, revision: 0, ply: 0, elapsed: 0, endedAt: null, history: [], positions: p.positions };
}
export function applyMove(match: Match, move: Move): Match {
  if (match.phase !== 'play') return match;
  const p = fromMatch(match); if (!legalMoves(p, move.from).some(candidate => sameMove(move, candidate))) return match;
  advance(p, move); const result = adjudicatePosition(p);
  return { ...match, board: Array.from(p.board), active: p.active, history: p.history, positions: p.positions, ply: match.ply + 1, revision: match.revision + 1, phase: result ? 'over' : 'play', winner: result?.winner ?? null, reason: result?.reason ?? null, endedAt: result ? new Date().toISOString() : null };
}
export function finishMatch(match: Match, action: 'resign' | 'agreement', side: Side = match.active): Match {
  if (match.phase === 'over' || (action === 'agreement' && match.players.some(p => p.kind === 'bot')) || (action === 'resign' && match.players[side].kind !== 'human')) return match;
  return { ...match, phase: 'over', winner: action === 'resign' ? other(side) : null, reason: action, endedAt: new Date().toISOString(), revision: match.revision + 1 };
}
export function recordOf(match: Match): GameRecord {
  if (!match.reason || !match.endedAt) throw new Error('Ván chưa kết thúc');
  return { version: 1, rulesVersion: RULES_VERSION, id: match.id, ownerSide: match.ownerSide, hostResult: match.winner === null ? 'draw' : match.winner === match.ownerSide ? 'win' : 'loss', players: match.players.map(p => ({ ...p })) as [Player, Player], winner: match.winner, reason: match.reason, plies: match.ply, endedAt: match.endedAt, durationSeconds: Math.round(match.elapsed / 1000) };
}
export function validateMatch(value: unknown, owner: string): value is Match {
  try {
    const m = value as Match;
    if (!m || m.version !== 1 || m.rulesVersion !== RULES_VERSION || m.owner !== owner || typeof m.id !== 'string' || !m.id || ![0, 1].includes(m.ownerSide) || ![0, 1].includes(m.active)) return false;
    if (!Array.isArray(m.players) || m.players.length !== 2 || m.players.some(p => !p || !['human', 'bot'].includes(p.kind) || !['easy', 'medium', 'hard'].includes(p.level) || ['id', 'name', 'avatar'].some(k => typeof p[k as keyof Player] !== 'string')) || m.players[m.ownerSide].id !== owner || m.players[m.ownerSide].kind !== 'human' || m.players[0].id === m.players[1].id) return false;
    if (!Array.isArray(m.board) || m.board.length !== 90 || m.board.some(n => !Number.isInteger(n) || n < -7 || n > 7) || m.board.filter(n => n === 1).length !== 1 || m.board.filter(n => n === -1).length !== 1) return false;
    if (!Number.isSafeInteger(m.ply) || m.ply < 0 || !Number.isSafeInteger(m.revision) || m.revision < m.ply || !Number.isFinite(m.elapsed) || m.elapsed < 0 || !Array.isArray(m.history) || m.history.length !== m.ply || !Array.isArray(m.positions) || m.positions.length !== m.ply + 1 || m.active !== m.ply % 2) return false;
    const p = createPosition(); let result = null;
    if (m.positions[0] !== p.positions[0]) return false;
    for (let i = 0; i < m.history.length; i++) {
      const move = m.history[i];
      if (result || !move || move.side !== p.active || !Number.isInteger(move.from) || !Number.isInteger(move.to) || move.from < 0 || move.from >= 90 || move.to < 0 || move.to >= 90 || !legalMoves(p, move.from).some(candidate => sameMove(candidate, move))) return false;
      advance(p, move); if (p.history[i].gaveCheck !== move.gaveCheck || p.positions[i + 1] !== m.positions[i + 1]) return false;
      result = adjudicatePosition(p);
    }
    if (m.board.some((piece, square) => piece !== p.board[square])) return false;
    if (m.phase === 'play') return !result && m.reason === null && m.winner === null && m.endedAt === null && m.revision === m.ply;
    if (m.phase !== 'over' || !m.reason || typeof m.endedAt !== 'string' || !Number.isFinite(Date.parse(m.endedAt))) return false;
    if (result) return m.reason === result.reason && m.winner === result.winner && m.revision === m.ply;
    if (m.revision !== m.ply + 1) return false;
    if (m.reason === 'agreement') return m.winner === null && m.players.every(p => p.kind === 'human');
    return m.reason === 'resign' && (m.winner === 0 || m.winner === 1) && m.players[other(m.winner)].kind === 'human';
  } catch { return false; }
}
