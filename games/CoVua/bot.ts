// Cờ Vua — alpha-beta, iterative deepening, quiescence và PST trong Worker.
// TT chỉ sắp thứ tự nước. Mọi nhánh search hoàn nguyên trong finally.

import {
  P, N, B, R, Q, K, typeOf, colorOf, fileOf, rankOf,
} from './board';
import {
  Pos, matchToPos, genPseudo, genLegal, makeMove, unmakeMove,
  isAttacked, inCheck, posKey, adjudicate,
} from './engine';
import type { Match, Move, Level } from './model';

const VAL = [0, 100, 320, 330, 500, 900, 0];   // theo type 1..6 (Vua không tính vật chất)
const MATE = 30000, INF = 1e9;

// Piece-square tables (centipawn), viết từ a1 (index 0 = a1) tới h8.
const PST_P = [0,0,0,0,0,0,0,0, 5,10,10,-20,-20,10,10,5, 5,-5,-10,0,0,-10,-5,5, 0,0,0,20,20,0,0,0, 5,5,10,25,25,10,5,5, 10,10,20,30,30,20,10,10, 50,50,50,50,50,50,50,50, 0,0,0,0,0,0,0,0];
const PST_N = [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,5,5,0,-20,-40, -30,5,10,15,15,10,5,-30, -30,0,15,20,20,15,0,-30, -30,5,15,20,20,15,5,-30, -30,0,10,15,15,10,0,-30, -40,-20,0,0,0,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50];
const PST_B = [-20,-10,-10,-10,-10,-10,-10,-20, -10,5,0,0,0,0,5,-10, -10,10,10,10,10,10,10,-10, -10,0,10,10,10,10,0,-10, -10,5,5,10,10,5,5,-10, -10,0,5,10,10,5,0,-10, -10,0,0,0,0,0,0,-10, -20,-10,-10,-10,-10,-10,-10,-20];
const PST_R = [0,0,0,5,5,0,0,0, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 5,10,10,10,10,10,10,5, 0,0,0,0,0,0,0,0];
const PST_Q = [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,5,0,0,0,0,-10, -10,5,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, -5,0,5,5,5,5,0,-5, -10,0,5,5,5,5,0,-10, -10,0,0,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20];
const PST_K = [20,30,10,0,0,10,30,20, 20,20,0,0,0,0,20,20, -10,-20,-20,-20,-20,-20,-20,-10, -20,-30,-30,-40,-40,-30,-30,-20, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30];
const PST = [null, PST_P, PST_N, PST_B, PST_R, PST_Q, PST_K];

export function evaluate(pos: Pos): number {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const pc = pos.b[sq]; if (pc === 0) continue;
    const t = typeOf(pc), white = pc < 9;
    const v = VAL[t] + PST[t]![white ? sq : sq ^ 56];
    score += white ? v : -v;
  }
  return pos.turn === 0 ? score : -score;
}

export const LIMITS = { easy: { depth: 2, timeMs: 80, maxNodes: 5000 }, medium: { depth: 5, timeMs: 400, maxNodes: 60000 }, hard: { depth: 9, timeMs: 1200, maxNodes: 240000 } };
export interface SearchOptions { deadline?: number; seed?: number; maxNodes?: number; maxDepth?: number }
export interface SearchResult { move: Move | null; depth: number; nodes: number; reason: string; elapsedMs: number; score: number; stopped: boolean }
const STOP = Symbol('search-budget');
interface SearchContext { deadline: number; nodes: number; maxNodes: number; positions: string[]; table: Map<string, Move> }
function tick(ctx: SearchContext) {
  if (++ctx.nodes > ctx.maxNodes || performance.now() >= ctx.deadline) throw STOP;
}
function ordered(pos: Pos, moves: Move[], preferred?: Move) {
  const score = (m: Move) => (preferred && m.from === preferred.from && m.to === preferred.to && m.promote === preferred.promote ? 100000 : 0) +
    (m.promote ? 9000 : 0) + (pos.b[m.to] ? 10 * VAL[typeOf(pos.b[m.to])] - VAL[typeOf(pos.b[m.from])] : 0);
  return moves.sort((a,b) => score(b) - score(a));
}
/** Exported for deterministic cancellation/regression tests. Always restores pos and history. */
export function searchPosition(pos: Pos, depth: number, alpha: number, beta: number, ply: number, ctx: SearchContext, qply = 0): number {
  tick(ctx);
  const moves = genLegal(pos), end = adjudicate(pos, ctx.positions, moves);
  if (end.reason) return end.reason === 'checkmate' ? -MATE + ply : 0;
  if (ply >= 64 || (depth <= 0 && qply >= 8)) return evaluate(pos);
  const checked = inCheck(pos, pos.turn), quiescent = depth <= 0;
  if (quiescent && !checked) {
    const stand = evaluate(pos); if (stand >= beta) return stand; alpha = Math.max(alpha, stand);
  }
  const key = posKey(pos), candidates = quiescent && !checked ? moves.filter(m => pos.b[m.to] || m.promote || (typeOf(pos.b[m.from]) === P && m.to === pos.ep)) : moves;
  let best: Move | undefined;
  for (const move of ordered(pos, candidates, ctx.table.get(key))) {
    const undo = makeMove(pos, move); ctx.positions.push(posKey(pos));
    let score: number;
    try { score = -searchPosition(pos, depth-1, -beta, -alpha, ply+1, ctx, quiescent ? qply+1 : 0); }
    finally { ctx.positions.pop(); unmakeMove(pos, move, undo); }
    if (score > alpha) { alpha = score; best = move; }
    if (alpha >= beta) break;
  }
  // Only reuse move ordering; scores depend on repetition history and halfmove clock.
  if (best && !quiescent) { if (ctx.table.size >= 30000) ctx.table.clear(); ctx.table.set(key, best); }
  return alpha;
}
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function chooseMove(match: Match, level: Level, options: SearchOptions = {}): SearchResult {
  const started = performance.now(), pos = matchToPos(match), roots = genLegal(pos), limits = LIMITS[level];
  const ctx: SearchContext = { deadline: started + Math.max(0, options.deadline ?? limits.timeMs), nodes: 0, maxNodes: options.maxNodes ?? limits.maxNodes, positions: [...match.positions], table: new Map() };
  let best: Move | null = roots[0] ?? null; let completed = 0, score = 0, stopped = false;
  if (match.phase === 'over' || adjudicate(pos, ctx.positions, roots).reason) best = null;
  if (best) {
    const random = rng(options.seed ?? match.revision + 7391);
    for (let depth = 1; depth <= (options.maxDepth ?? limits.depth); depth++) {
      let local: Move = best, alpha = -INF;
      try {
        for (const move of ordered(pos, roots.slice(), best)) {
          tick(ctx); const undo = makeMove(pos, move); ctx.positions.push(posKey(pos)); let value: number;
          try { value = -searchPosition(pos, depth-1, -INF, -alpha, 1, ctx); }
          finally { ctx.positions.pop(); unmakeMove(pos, move, undo); }
          if (level === 'easy' && Math.abs(value) < 29000) value += (random() - .5) * 65;
          if (value > alpha) { alpha = value; local = move; }
        }
      } catch (error) { if (error !== STOP) throw error; stopped = true; break; }
      best = local; score = alpha; completed = depth;
      if (Math.abs(score) >= MATE-64) break;
    }
  }
  return { move: best, depth: completed, score, nodes: ctx.nodes, stopped, elapsedMs: performance.now()-started,
    reason: best ? best.promote ? 'Phong cấp' : match.board[best.to] ? 'Bắt quân' : score >= MATE-64 ? 'Chiếu bí' : 'Phát triển thế cờ' : '' };
}
export function randomMove(match: Match, seed: number): Move | null {
  const moves = genLegal(matchToPos(match)); return moves.length ? moves[Math.floor(rng(seed)() * moves.length)] : null;
}
export function greedyMove(match: Match): Move | null {
  const pos = matchToPos(match), moves = genLegal(pos); let best = moves[0] ?? null, value = -INF;
  for (const m of moves) { const u = makeMove(pos,m); let v: number; try { v = -evaluate(pos); } finally { unmakeMove(pos,m,u); } if (v > value) { value=v; best=m; } }
  return best;
}
