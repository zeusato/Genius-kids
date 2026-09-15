import { describe, expect, it, vi } from 'vitest';
import { chooseMove, evaluate, MoveTable } from './bot';
import { BotController, type BotRequest, type WorkerPort } from './bot-controller';
import { newMatch } from './engine';
import { createPosition, fromMatch, unmake } from './position';
import type { Position } from './model';
import { legalMoves } from './movegen';
import { advance, adjudicatePosition } from './rules';
const owner = { id: 'test', name: 'Test' };
describe('search correctness and budgets', () => {
  it('finds an immediate win by mate or stalemate with two rooks', () => {
    const b = new Int8Array(90); b[4] = 1; b[85] = -1; b[40] = 7; b[75] = 5; b[77] = 5;
    const p = createPosition(b), before = JSON.stringify(p);
    const result = chooseMove(p, 'hard', { timeMs: Infinity, maxDepth: 2, maxNodes: 30000 });
    expect(result.move).not.toBeNull(); expect(JSON.stringify(p)).toBe(before);
    advance(p, result.move!); expect(adjudicatePosition(p)?.winner).toBe(0);
  });
  it('returns a legal move under an immediate timeout without mutating input', () => {
    const m = newMatch(owner, 0, 'bot', 'hard'), before = JSON.stringify(m);
    const result = chooseMove(m, 'hard', { timeMs: 0 });
    expect(result.completedDepth).toBe(0); expect(legalMoves(fromMatch(m))).toContainEqual(result.move); expect(JSON.stringify(m)).toBe(before);
  });
  it('node budget includes quiescence and results are repeatable', () => {
    const m = newMatch(owner, 0, 'bot', 'easy'), options = { timeMs: Infinity, maxNodes: 400, maxDepth: 4, seed: 23 };
    const a = chooseMove(m, 'easy', options), b = chooseMove(m, 'easy', options);
    expect(a.nodes).toBeLessThanOrEqual(400); expect(a.move).toEqual(b.move); expect(a.completedDepth).toBe(b.completedDepth);
  });
  it('ordering table does not change an exhaustive depth-2 score', () => {
    const m = newMatch(owner, 0, 'bot', 'medium'), options = { timeMs: Infinity, maxNodes: 100000, maxDepth: 2 };
    expect(chooseMove(m, 'medium', options).score).toBe(chooseMove(m, 'medium', { ...options, useTT: false }).score);
  });
  it('matches an independent full-width minimax oracle at depth 2', () => {
    function oracle(p: Position, depth: number, ply = 0): number {
      const moves = legalMoves(p), result = adjudicatePosition(p, moves);
      if (result) return result.winner === null ? 0 : result.winner === p.active ? 100000 - ply : -100000 + ply;
      if (!depth) return evaluate(p);
      let best = -Infinity;
      for (const move of moves) { const undo = advance(p, move); try { best = Math.max(best, -oracle(p, depth - 1, ply + 1)); } finally { unmake(p, undo); } }
      return best;
    }
    let p = createPosition();
    for (let i = 0; i < 8; i++) {
      const expected = oracle(p, 2), result = chooseMove(p, 'medium', { timeMs: Infinity, maxDepth: 2, maxNodes: 100000, quiescence: false });
      expect(result.completedDepth).toBe(2); expect(result.score).toBe(expected);
      const moves = legalMoves(p); advance(p, moves[(i * 11 + 7) % moves.length]);
    }
  });
  it('does not reuse a repetition score across different histories', () => {
    const p = createPosition(), key = p.positions[0], table = new MoveTable();
    p.positions = [key, 'b', key, 'b', key];
    p.history = Array.from({ length: 4 }, (_, i) => ({ from: 0, to: 1, side: i % 2 as 0 | 1, gaveCheck: i % 2 === 0 }));
    expect(chooseMove(p, 'hard', {}, table).score).toBe(-100000);
    p.history.forEach(m => { m.gaveCheck = false; }); expect(chooseMove(p, 'hard', {}, table).score).toBe(0);
  });
});
describe('worker controller', () => {
  function setup() {
    const m = newMatch(owner, 1, 'bot', 'easy'), moves = legalMoves(fromMatch(m)), callback = vi.fn(); let request!: BotRequest;
    const worker: WorkerPort = { onmessage: null, onerror: null, postMessage: r => { request = r; }, terminate: vi.fn() };
    const controller = new BotController(() => worker); controller.start(m, moves, callback);
    return { m, moves, callback, worker, controller, request };
  }
  it('ignores stale replies and accepts a matching move once', () => {
    vi.useFakeTimers(); const s = setup();
    s.worker.onmessage!({ data: { ...s.request, requestId: 'stale', move: s.moves[0] } } as unknown as MessageEvent); expect(s.callback).not.toHaveBeenCalled();
    const reply = { data: { ...s.request, move: s.moves[0] } } as unknown as MessageEvent;
    s.worker.onmessage!(reply); s.worker.onmessage!(reply); vi.runAllTimers(); expect(s.callback).toHaveBeenCalledTimes(1); s.controller.cancel(); vi.useRealTimers();
  });
  it('uses a prepared fallback on timeout and rejects a late reply', () => {
    vi.useFakeTimers(); const s = setup(); vi.advanceTimersByTime(2200);
    expect(s.callback).toHaveBeenCalledWith(s.moves[0], true, undefined);
    s.worker.onmessage!({ data: { ...s.request, move: s.moves[1] } } as unknown as MessageEvent); expect(s.callback).toHaveBeenCalledTimes(1); s.controller.cancel(); vi.useRealTimers();
  });
  it('cancels on pause and never accepts the previous worker result', () => {
    vi.useFakeTimers(); const s = setup(); s.controller.cancel();
    s.worker.onmessage!({ data: { ...s.request, move: s.moves[0] } } as unknown as MessageEvent); vi.runAllTimers(); expect(s.callback).not.toHaveBeenCalled(); vi.useRealTimers();
  });
  it('uses a fallback for an illegal matching reply', () => {
    vi.useFakeTimers(); const s = setup();
    s.worker.onmessage!({ data: { ...s.request, move: { from: 0, to: 89 } } } as unknown as MessageEvent);
    expect(s.callback).toHaveBeenCalledWith(s.moves[0], true, undefined); s.controller.cancel(); vi.useRealTimers();
  });
});
