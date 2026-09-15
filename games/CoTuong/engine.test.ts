import { describe, expect, it } from 'vitest';
import { createPosition, fromMatch, make, positionKey, unmake } from './position';
import { inCheck, legalMoves, perft } from './movegen';
import { applyMove, finishMatch, newMatch, recordOf, validateMatch } from './engine';
import { advance, adjudicatePosition, repetition } from './rules';
import type { Side } from './model';
import perftFixture from './fixtures/perft.json';
const host = { id: 'test-host', name: 'Người chơi' };
function sparse(pieces: Record<number, number>, side: Side = 0) { const board = new Int8Array(90); Object.entries(pieces).forEach(([square, piece]) => { board[Number(square)] = piece; }); return createPosition(board, side); }
describe('Xiangqi move generation', () => {
  it.each(perftFixture.depthCounts)('initial perft depth %i = %i', (depth, nodes) => expect(perft(createPosition(), depth)).toBe(nodes));
  it('matches the independently published starting FEN', () => {
    const codes: Record<string, number> = { r: 5, n: 4, b: 3, a: 2, k: 1, c: 6, p: 7 };
    const board = perftFixture.fen.split(' ')[0].split('/').reverse().flatMap(row => [...row].flatMap(c => /[1-9]/.test(c) ? Array(Number(c)).fill(0) : [codes[c.toLowerCase()] * (c === c.toUpperCase() ? 1 : -1)]));
    expect(Array.from(createPosition().board)).toEqual(board);
  });
  it('blocks the horse leg and elephant eye', () => {
    const p = sparse({ 4: 1, 85: -1, 40: 7, 0: 4, 1: 7, 2: 3, 12: 7 });
    expect(legalMoves(p, 0).some(m => m.to === 11)).toBe(false);
    expect(legalMoves(p, 2).some(m => m.to === 22)).toBe(false);
  });
  it('cannon needs exactly one screen to capture', () => {
    const p = sparse({ 4: 1, 85: -1, 40: 7, 9: 6, 12: 7, 17: -5 });
    expect(legalMoves(p, 9)).toContainEqual({ from: 9, to: 17 });
    p.board[12] = 0; expect(legalMoves(p, 9)).not.toContainEqual({ from: 9, to: 17 });
    p.board[12] = 7; p.board[14] = -7; expect(legalMoves(p, 9)).not.toContainEqual({ from: 9, to: 17 });
  });
  it('prevents flying generals, river crossing elephants and backwards pawns', () => {
    const p = sparse({ 4: 1, 85: -1, 40: 5, 38: 3, 45: 7, 27: 7 });
    expect(legalMoves(p, 40).some(m => m.to === 39)).toBe(false);
    expect(legalMoves(p, 38).some(m => m.to >= 45)).toBe(false);
    expect(legalMoves(p, 45)).toContainEqual({ from: 45, to: 46 });
    expect(legalMoves(p, 27).some(m => m.to === 28 || m.to === 18)).toBe(false);
  });
  it('restores all state after 10,000 legal make/unmake operations', () => {
    let p = createPosition(), count = 0;
    while (count < 10000) { const moves = legalMoves(p); if (!moves.length) { p = createPosition(); continue; }
      for (const move of moves) { const before = JSON.stringify(p), undo = make(p, move); expect(inCheck(p, undo.active)).toBe(false); unmake(p, undo); expect(JSON.stringify(p)).toBe(before); count++; }
      make(p, moves[count % moves.length]);
    }
  });
  it('stalemate is a loss, not a draw', () => {
    const p = sparse({ 4: 1, 85: -1, 12: -5, 14: -5, 22: -7 });
    expect(inCheck(p)).toBe(false); expect(adjudicatePosition(p)).toEqual({ winner: 1, reason: 'stalemate' });
  });
  it('adjudicates a real rook checkmate without capturing the general', () => {
    const p = sparse({ 4: 1, 85: -1, 40: 7, 72: 5, 77: 5 });
    expect(legalMoves(p)).toContainEqual({ from: 72, to: 81 });
    advance(p, { from: 72, to: 81 });
    expect(adjudicatePosition(p)).toEqual({ winner: 0, reason: 'checkmate' });
    expect(p.board[85]).toBe(-1);
  });
});
describe('match history and results', () => {
  it('replays a saved game and rejects tampered checks, positions and ownership', () => {
    let m = newMatch(host, 1, 'bot', 'easy', 'save');
    for (let i = 0; i < 24 && m.phase === 'play'; i++) { const moves = legalMoves(fromMatch(m)); m = applyMove(m, moves[(i * 7) % moves.length]); }
    expect(validateMatch(m, host.id)).toBe(true);
    expect(validateMatch(m, 'different')).toBe(false);
    const bad = structuredClone(m); bad.history[0].gaveCheck = !bad.history[0].gaveCheck; expect(validateMatch(bad, host.id)).toBe(false);
    const badKey = structuredClone(m); badKey.positions[0] = 'bad'; expect(validateMatch(badKey, host.id)).toBe(false);
  });
  it.each([0, 1] as Side[])('records owner side %i independently of red', side => {
    const m = newMatch(host, side, 'human', 'easy');
    expect(recordOf(finishMatch(m, 'resign', side)).hostResult).toBe('loss');
    expect(recordOf(finishMatch(m, 'resign', side === 0 ? 1 : 0)).hostResult).toBe('win');
    expect(recordOf(finishMatch(m, 'agreement')).hostResult).toBe('draw');
    expect(validateMatch(finishMatch(m, 'resign', side), host.id)).toBe(true);
  });
  it('counts the initial position in a real reversible repetition', () => {
    let m = newMatch(host, 0, 'human', 'easy');
    const cycle = [{ from: 1, to: 18 }, { from: 82, to: 63 }, { from: 18, to: 1 }, { from: 63, to: 82 }];
    for (const move of cycle) m = applyMove(m, move);
    expect(m.phase).toBe('play');
    for (const move of cycle) m = applyMove(m, move);
    expect(m.reason).toBe('repetition'); expect(m.winner).toBeNull(); expect(validateMatch(m, host.id)).toBe(true);
    expect(applyMove(m, cycle[0])).toBe(m);
  });
  it('adjudicates perpetual check for one side, both sides, or neither', () => {
    const p = createPosition(), key = positionKey(p);
    p.positions = [key, 'b', key, 'b', key];
    p.history = Array.from({ length: 4 }, (_, i) => ({ from: 0, to: 1, side: i % 2 as Side, gaveCheck: i % 2 === 0 }));
    expect(repetition(p)).toEqual({ winner: 1, reason: 'perpetual-check' });
    p.history.forEach(m => { m.gaveCheck = true; }); expect(repetition(p)?.winner).toBeNull();
    p.history.forEach(m => { m.gaveCheck = false; }); expect(repetition(p)?.winner).toBeNull();
  });
  it.each([false, true])('uses actual legal check cycles, mirrored=%s', mirrored => {
    const original = sparse({ 5: 1, 85: -1, 67: 5 }, 1);
    const p = mirrored ? createPosition(Array.from(original.board).reverse().map(n => -n), 0) : original;
    const base = [{ from: 85, to: 84 }, { from: 67, to: 66 }, { from: 84, to: 85 }, { from: 66, to: 67 }];
    const cycle = mirrored ? base.map(m => ({ from: 89 - m.from, to: 89 - m.to })) : base;
    for (let i = 0; i < 8; i++) {
      expect(legalMoves(p)).toContainEqual(cycle[i % 4]); advance(p, cycle[i % 4]);
      if (i < 7) expect(adjudicatePosition(p)).toBeNull();
    }
    expect(adjudicatePosition(p)).toEqual({ winner: mirrored ? 0 : 1, reason: 'perpetual-check' });
  });
});
