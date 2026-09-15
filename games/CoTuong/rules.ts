import type { Move, Position, Result, Side } from './model';
import { other } from './model';
import { inCheck, legalMoves } from './movegen';
import { make, positionKey } from './position';
export function advance(p: Position, move: Move) {
  const undo = make(p, move);
  p.history.push({ ...move, side: undo.active, gaveCheck: inCheck(p) });
  p.positions.push(positionKey(p)); return undo;
}
export function repetition(p: Position): Result | null {
  const current = p.positions[p.positions.length - 1], matches: number[] = [];
  for (let i = p.positions.length - 1; i >= 0 && matches.length < 3; i--) if (p.positions[i] === current) matches.push(i);
  if (matches.length < 3) return null;
  const perpetual = ([0, 1] as Side[]).map(side => {
    let moved = false;
    for (let i = matches[2]; i < matches[0]; i++) { const move = p.history[i]; if (move.side !== side) continue; moved = true; if (!move.gaveCheck) return false; }
    return moved;
  });
  return perpetual[0] !== perpetual[1] ? { winner: perpetual[0] ? 1 : 0, reason: 'perpetual-check' } : { winner: null, reason: 'repetition' };
}
export function adjudicatePosition(p: Position, moves = legalMoves(p)): Result | null {
  if (!moves.length) return { winner: other(p.active), reason: inCheck(p) ? 'checkmate' : 'stalemate' };
  return repetition(p);
}
