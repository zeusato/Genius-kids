import { SIZE, opposite, type Side, type Level, type Match } from './model';
import { DIRECTIONS, inside, winningLines } from './engine';
export const LIMITS = { easy: { ms: 100, depth: 1, width: 6 }, medium: { ms: 350, depth: 3, width: 10 }, hard: { ms: 900, depth: 6, width: 12 } };
export interface SearchResult { cell: number; depth: number; nodes: number; elapsed: number }
const WIN = 10_000_000;
const now = () => performance.now();

export function winningMoves(board: number[], side: Side): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) if (!board[i]) {
    board[i] = side + 1; if (winningLines(board, i, side).length) moves.push(i); board[i] = 0;
  }
  return moves;
}
function candidates(board: number[]): number[] {
  const cells = new Set<number>();
  for (let i = 0; i < board.length; i++) if (board[i]) {
    const r = Math.floor(i / SIZE), c = i % SIZE;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const nr = r + dr, nc = c + dc;
      if (inside(nr, nc) && !board[nr * SIZE + nc]) cells.add(nr * SIZE + nc);
    }
  }
  return cells.size ? [...cells] : board.every(v => !v) ? [112] : board.flatMap((v, i) => v ? [] : [i]);
}
function shape(length: number, open: number) {
  if (length > 5 || !open) return 0;
  return ([0, 2, 35, 700, 15000, WIN][length] || 0) * (open === 2 ? 4 : 1);
}
function localScore(board: number[], cell: number, side: Side): number {
  const r = Math.floor(cell / SIZE), c = cell % SIZE; let score = 0;
  for (const [dr, dc] of DIRECTIONS) {
    let length = 1, open = 0, blocked = 0;
    for (const sign of [-1, 1]) {
      let nr = r + dr * sign, nc = c + dc * sign;
      while (inside(nr, nc) && board[nr * SIZE + nc] === side + 1) { length++; nr += dr * sign; nc += dc * sign; }
      if (inside(nr, nc)) { if (!board[nr * SIZE + nc]) open++; else blocked++; }
    }
    score += length === 5 && blocked < 2 ? WIN : shape(length, open);
  }
  return score;
}
function ordered(board: number[], side: Side): number[] {
  return candidates(board).map(cell => ({ cell, score: localScore(board, cell, side) + localScore(board, cell, opposite(side)) * 1.1 - (Math.abs(Math.floor(cell / SIZE) - 7) + Math.abs(cell % SIZE - 7)) * .05 }))
    .sort((a, b) => b.score - a.score || a.cell - b.cell).map(v => v.cell);
}
function evaluate(board: number[], side: Side): number {
  let score = 0;
  for (let i = 0; i < board.length; i++) if (board[i]) {
    const r = Math.floor(i / SIZE), c = i % SIZE, piece = board[i];
    for (const [dr, dc] of DIRECTIONS) {
      if (inside(r - dr, c - dc) && board[(r - dr) * SIZE + c - dc] === piece) continue;
      let length = 0, nr = r, nc = c;
      while (inside(nr, nc) && board[nr * SIZE + nc] === piece) { length++; nr += dr; nc += dc; }
      const open = Number(inside(r - dr, c - dc) && !board[(r - dr) * SIZE + c - dc]) + Number(inside(nr, nc) && !board[nr * SIZE + nc]);
      score += shape(length, open) * (piece === side + 1 ? 1 : -1);
    }
  }
  return score;
}
/** Bounded, tactical fallback; never performs recursive search on the UI thread. */
export function fallbackMove(state: Match): number {
  if (state.phase !== 'play') return -1;
  const board = [...state.board];
  return winningMoves(board, state.activeSide)[0] ?? winningMoves(board, opposite(state.activeSide))[0] ?? ordered(board, state.activeSide)[0] ?? -1;
}
export function search(state: Match, level: Level = state.level, seed = 1, budget?: number): SearchResult {
  const start = now(), limits = LIMITS[level], deadline = start + (budget ?? limits.ms), board = [...state.board];
  let nodes = 0, depthDone = 0;
  if (state.phase !== 'play') return { cell: -1, depth: 0, nodes: 0, elapsed: now() - start };
  const wins = winningMoves(board, state.activeSide), threats = winningMoves(board, opposite(state.activeSide));
  let root = wins.length ? wins : threats.length ? threats : ordered(board, state.activeSide);
  if (!root.length) return { cell: -1, depth: 0, nodes: 0, elapsed: now() - start };
  if (wins.length || threats.length === 1 || root.length === 1) return { cell: root[0], depth: 1, nodes: 1, elapsed: now() - start };
  let best = root[0];
  if (level === 'easy') {
    seed = Math.imul(seed ^ seed >>> 16, 0x45d9f3b); seed ^= seed >>> 16;
    best = root[(seed >>> 0) % Math.min(root.length, 4)];
    return { cell: best, depth: 1, nodes: 1, elapsed: now() - start };
  }
  const cache = new Map<string, number>(), timeout = Symbol('deadline');
  function visit(side: Side, depth: number, alpha: number, beta: number, ply: number): number {
    if (++nodes % 16 === 0 && now() >= deadline) throw timeout;
    if (!depth) return evaluate(board, side);
    const key = side + ':' + depth + ':' + board.join('');
    const saved = cache.get(key); if (saved !== undefined) return saved;
    const list = ordered(board, side).slice(0, limits.width);
    if (!list.length) return 0;
    let value = -Infinity, cutoff = false;
    const originalAlpha = alpha;
    for (const cell of list) {
      board[cell] = side + 1;
      let score: number;
      try { score = winningLines(board, cell, side).length ? WIN - ply : -visit(opposite(side), depth - 1, -beta, -alpha, ply + 1); }
      finally { board[cell] = 0; }
      value = Math.max(value, score); alpha = Math.max(alpha, score);
      if (alpha >= beta) { cutoff = true; break; }
    }
    // Only store exact scores, not alpha/beta bounds.
    if (!cutoff && value > originalAlpha && cache.size < 8000) cache.set(key, value);
    return value;
  }
  root = root.slice(0, limits.width);
  for (let depth = 1; depth <= limits.depth && now() < deadline; depth++) {
    let bestScore = -Infinity, next = best; const scores: { cell: number; score: number }[] = [];
    try {
      for (const cell of root) {
        if (now() >= deadline) throw timeout;
        board[cell] = state.activeSide + 1;
        let score: number;
        try { score = winningLines(board, cell, state.activeSide).length ? WIN : -visit(opposite(state.activeSide), depth - 1, -Infinity, -bestScore, 1); }
        finally { board[cell] = 0; }
        scores.push({ cell, score }); if (score > bestScore) { bestScore = score; next = cell; }
      }
      best = next; depthDone = depth; root = scores.sort((a, b) => b.score - a.score).map(v => v.cell);
      if (bestScore > WIN - 100) break;
    } catch (error) { if (error !== timeout) throw error; break; }
  }
  return { cell: best, depth: depthDone, nodes, elapsed: now() - start };
}
