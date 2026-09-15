import type { Level, Match, Move, Position, Side } from './model';
import { sideOf, sameMove } from './model';
import { fromMatch, unmake } from './position';
import { inCheck, legalMoves } from './movegen';
import { advance, adjudicatePosition } from './rules';
export const LIMITS = { easy: { timeMs: 60, maxDepth: 3, maxNodes: 10000 }, medium: { timeMs: 350, maxDepth: 6, maxNodes: 80000 }, hard: { timeMs: 1200, maxDepth: 12, maxNodes: 300000 } };
export const VALUES = [0, 0, 200, 200, 400, 900, 450, 100];
const MATE = 100000, ABORT = Symbol('search-budget');
export interface SearchOptions { timeMs?: number; maxNodes?: number; maxDepth?: number; seed?: number; useTT?: boolean; now?: () => number; quiescence?: boolean }
export interface SearchResult { move: Move | null; score: number; completedDepth: number; nodes: number; elapsedMs: number; stoppedBy: 'time' | 'nodes' | 'depth' }
/** Deliberately stores moves only: no history-dependent draw scores are reused. */
export class MoveTable {
  private keys = new Int32Array(65536); private moves = new Uint16Array(65536);
  get(hash: number): Move | undefined { const i = hash & 65535, packed = this.moves[i]; return packed && this.keys[i] === hash ? { from: (packed - 1) % 90, to: Math.floor((packed - 1) / 90) } : undefined; }
  set(hash: number, move: Move) { const i = hash & 65535; this.keys[i] = hash; this.moves[i] = move.from + move.to * 90 + 1; }
}
export function evaluate(p: Position, simple = false): number {
  let score = 0;
  for (let square = 0; square < 90; square++) {
    const piece = p.board[square]; if (!piece) continue;
    const type = Math.abs(piece), side = sideOf(piece), file = square % 9, rank = side === 0 ? Math.floor(square / 9) : 9 - Math.floor(square / 9);
    let value = VALUES[type];
    if (!simple) {
      const center = 4 - Math.abs(4 - file);
      if (type === 7) value += rank >= 5 ? 95 + center * 10 + (rank < 9 ? rank * 3 : 0) : rank * 4;
      if (type === 4) value += center * 9 + Math.min(rank, 6) * 5;
      if (type === 5 || type === 6) value += center * 3 + rank * 2;
      if (type === 1) value += file === 4 ? 15 : -8;
    }
    score += side === p.active ? value : -value;
  }
  return score;
}
export function chooseMove(match: Match | Position, level: Level, options: SearchOptions = {}, table = new MoveTable()): SearchResult {
  const source = 'phase' in match ? fromMatch(match) : { ...match, board: match.board.slice(), kings: [...match.kings] as [number, number], history: match.history.map(m => ({ ...m })), positions: [...match.positions] };
  const p = source, limits = { ...LIMITS[level], ...options }, now = options.now ?? (() => performance.now()), start = now(), deadline = start + limits.timeMs;
  let nodes = 0, stoppedBy: SearchResult['stoppedBy'] = 'depth', completedDepth = 0;
  const history = new Int32Array(8100), killers: (Move | undefined)[] = [];
  const checkBudget = () => { if (nodes >= limits.maxNodes) { stoppedBy = 'nodes'; throw ABORT; } if (now() >= deadline) { stoppedBy = 'time'; throw ABORT; } };
  const order = (moves: Move[], ply: number) => {
    const tt = options.useTT === false ? undefined : table.get(p.hash);
    const priority = (move: Move) => tt && sameMove(tt, move) ? 1e8 : p.board[move.to] ? 100000 + VALUES[Math.abs(p.board[move.to])] * 10 - VALUES[Math.abs(p.board[move.from])] : killers[ply] && sameMove(killers[ply]!, move) ? 90000 : history[move.from * 90 + move.to];
    return moves.map(move => ({ move, priority: priority(move) })).sort((a, b) => b.priority - a.priority).map(entry => entry.move);
  };
  const terminalScore = (moves: Move[], ply: number) => { const result = adjudicatePosition(p, moves); return !result ? null : result.winner === null ? 0 : result.winner === p.active ? MATE - ply : -MATE + ply; };
  function search(depth: number, alpha: number, beta: number, ply: number, qply = 0): number {
    checkBudget(); nodes++;
    const moves = legalMoves(p); checkBudget(); const terminal = terminalScore(moves, ply); if (terminal !== null) return terminal;
    const checked = inCheck(p), quiescent = depth <= 0;
    if (ply >= 64 || (quiescent && qply >= 8)) { if (checked) { stoppedBy = 'depth'; throw ABORT; } return evaluate(p, level === 'easy'); }
    let best = -Infinity;
    if (quiescent) {
      if (options.quiescence === false) return evaluate(p, level === 'easy');
      if (!checked) { best = evaluate(p, level === 'easy'); if (best >= beta) return best; alpha = Math.max(alpha, best); }
    }
    const candidates = order(quiescent && !checked ? moves.filter(m => p.board[m.to]) : moves, ply);
    let bestMove: Move | undefined;
    for (const move of candidates) {
      checkBudget(); const quiet = !p.board[move.to], undo = advance(p, move); let value: number;
      try { value = -search(depth - 1, -beta, -alpha, ply + 1, quiescent ? qply + 1 : 0); } finally { unmake(p, undo); }
      if (value > best) { best = value; bestMove = move; } alpha = Math.max(alpha, value);
      if (alpha >= beta) { if (quiet && !quiescent) { killers[ply] = move; history[move.from * 90 + move.to] += depth * depth; } break; }
    }
    if (bestMove && options.useTT !== false) table.set(p.hash, bestMove);
    return best;
  }
  const rootMoves = legalMoves(p), terminal = terminalScore(rootMoves, 0);
  if (terminal !== null) return { move: null, score: terminal, completedDepth, nodes, elapsedMs: now() - start, stoppedBy };
  let best = order(rootMoves, 0)[0], bestScore = 0, ranked: { move: Move; value: number }[] = [];
  for (let depth = 1; depth <= limits.maxDepth; depth++) {
    try {
      const results: typeof ranked = []; let alpha = -Infinity;
      for (const move of order(rootMoves, 0)) {
        checkBudget(); const undo = advance(p, move); let value: number;
        try { value = -search(depth - 1, -Infinity, level === 'easy' ? Infinity : -alpha, 1); } finally { unmake(p, undo); }
        results.push({ move, value }); alpha = Math.max(alpha, value);
      }
      results.sort((a, b) => b.value - a.value); ranked = results; best = results[0].move; bestScore = results[0].value; completedDepth = depth;
      if (options.useTT !== false) table.set(p.hash, best);
      if (Math.abs(bestScore) > MATE - 64) break;
    } catch (error) { if (error !== ABORT) throw error; break; }
  }
  if (level === 'easy' && ranked.length && Math.abs(bestScore) < MATE - 64) {
    const candidates = ranked.filter(r => r.value >= bestScore - 30 && r.value > -MATE + 64);
    let seed = (options.seed ?? 20260915) >>> 0; seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    if (candidates.length) best = candidates[(seed >>> 0) % candidates.length].move;
  }
  return { move: best, score: bestScore, completedDepth, nodes, elapsedMs: now() - start, stoppedBy };
}
