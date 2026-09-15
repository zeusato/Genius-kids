import type { Match, Move, Position, Side } from './model';
import { other, sideOf } from './model';

let seed = 0x6374756f;
const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
const ZOBRIST = Array.from({ length: 90 }, () => Array.from({ length: 15 }, random));
const TURN_HASH = random();
export const positionKey = (p: Pick<Position, 'board' | 'active'>) => `${p.active}:${Array.from(p.board).join(',')}`;
export function initialBoard(): Int8Array {
  const board = new Int8Array(90), back = [5, 4, 3, 2, 1, 2, 3, 4, 5];
  for (let x = 0; x < 9; x++) { board[x] = back[x]; board[81 + x] = -back[x]; }
  board[19] = board[25] = 6; board[64] = board[70] = -6;
  for (let x = 0; x < 9; x += 2) { board[27 + x] = 7; board[54 + x] = -7; }
  return board;
}
export function createPosition(board: ArrayLike<number> = initialBoard(), active: Side = 0): Position {
  const p: Position = { board: Int8Array.from(board), active, kings: [-1, -1], hash: active ? TURN_HASH : 0, history: [], positions: [] };
  p.board.forEach((piece, square) => { if (piece) p.hash ^= ZOBRIST[square][piece + 7]; if (Math.abs(piece) === 1) p.kings[sideOf(piece)] = square; });
  p.positions.push(positionKey(p)); return p;
}
export function fromMatch(match: Match): Position {
  const p = createPosition(match.board, match.active);
  p.history = match.history.map(move => ({ ...move })); p.positions = [...match.positions]; return p;
}
export interface Undo { move: Move; captured: number; piece: number; hash: number; active: Side; historyLength: number; positionsLength: number }
export function make(p: Position, move: Move): Undo {
  const { from, to } = move, piece = p.board[from], captured = p.board[to];
  const undo = { move, piece, captured, hash: p.hash, active: p.active, historyLength: p.history.length, positionsLength: p.positions.length };
  p.hash ^= ZOBRIST[from][piece + 7] ^ ZOBRIST[to][piece + 7] ^ TURN_HASH;
  if (captured) p.hash ^= ZOBRIST[to][captured + 7];
  p.board[to] = piece; p.board[from] = 0;
  if (Math.abs(piece) === 1) p.kings[sideOf(piece)] = to;
  p.active = other(p.active); return undo;
}
export function unmake(p: Position, undo: Undo): void {
  p.board[undo.move.from] = undo.piece; p.board[undo.move.to] = undo.captured;
  if (Math.abs(undo.piece) === 1) p.kings[sideOf(undo.piece)] = undo.move.from;
  p.active = undo.active; p.hash = undo.hash;
  p.history.length = undo.historyLength; p.positions.length = undo.positionsLength;
}
