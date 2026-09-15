import type { Move, Position, Side } from './model';
import { other, sideOf } from './model';
import { make, unmake } from './position';
const inside = (x: number, y: number) => x >= 0 && x < 9 && y >= 0 && y < 10;
const palace = (x: number, y: number, side: Side) => x >= 3 && x <= 5 && (side === 0 ? y >= 0 && y <= 2 : y >= 7 && y <= 9);
const ORTHOGONAL = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const HORSE = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]];

/** Geometric attacks, independent of the attacker's legal moves. */
export function isAttacked(p: Position, target: number, by: Side): boolean {
  if (target < 0) return true;
  const b = p.board, x = target % 9, y = Math.floor(target / 9), sign = by === 0 ? 1 : -1;
  for (const [dx, dy] of ORTHOGONAL) {
    let screen = false;
    for (let distance = 1, tx = x + dx, ty = y + dy; inside(tx, ty); distance++, tx += dx, ty += dy) {
      const piece = b[ty * 9 + tx]; if (!piece) continue;
      if (!screen) {
        if (piece === 5 * sign || (piece === sign && (dx === 0 || distance === 1))) return true;
        screen = true;
      } else { if (piece === 6 * sign) return true; break; }
    }
  }
  for (const [dx, dy] of HORSE) {
    const fx = x - dx, fy = y - dy; if (!inside(fx, fy) || b[fy * 9 + fx] !== 4 * sign) continue;
    const leg = Math.abs(dx) === 2 ? fy * 9 + fx + Math.sign(dx) : (fy + Math.sign(dy)) * 9 + fx;
    if (!b[leg]) return true;
  }
  const pawnY = y - sign;
  if (inside(x, pawnY) && b[pawnY * 9 + x] === 7 * sign) return true;
  if (by === 0 ? y >= 5 : y <= 4) for (const dx of [-1, 1]) if (inside(x + dx, y) && b[y * 9 + x + dx] === 7 * sign) return true;
  for (const [dx, dy] of DIAGONAL) {
    if (inside(x + dx, y + dy) && palace(x, y, by) && b[(y + dy) * 9 + x + dx] === 2 * sign) return true;
    if (inside(x + dx * 2, y + dy * 2) && (by === 0 ? y <= 4 : y >= 5) && !b[(y + dy) * 9 + x + dx] && b[(y + dy * 2) * 9 + x + dx * 2] === 3 * sign) return true;
  }
  return false;
}
export const inCheck = (p: Position, side: Side = p.active) => isAttacked(p, p.kings[side], other(side));
export function pseudoMoves(p: Position, onlyFrom?: number): Move[] {
  const moves: Move[] = [], b = p.board, side = p.active;
  for (let from = onlyFrom ?? 0; from < (onlyFrom === undefined ? 90 : onlyFrom + 1); from++) {
    const piece = b[from]; if (!piece || sideOf(piece) !== side) continue;
    const type = Math.abs(piece), x = from % 9, y = Math.floor(from / 9);
    const add = (tx: number, ty: number) => {
      if (!inside(tx, ty)) return;
      const to = ty * 9 + tx, victim = b[to];
      if ((!victim || sideOf(victim) !== side) && Math.abs(victim) !== 1) moves.push({ from, to });
    };
    if (type === 1 || type === 2) {
      for (const [dx, dy] of type === 1 ? ORTHOGONAL : DIAGONAL) if (palace(x + dx, y + dy, side)) add(x + dx, y + dy);
    } else if (type === 3) {
      for (const [dx, dy] of DIAGONAL) {
        const tx = x + dx * 2, ty = y + dy * 2;
        if (inside(tx, ty) && (side === 0 ? ty <= 4 : ty >= 5) && !b[(y + dy) * 9 + x + dx]) add(tx, ty);
      }
    } else if (type === 4) {
      for (const [dx, dy] of HORSE) {
        if (!inside(x + dx, y + dy)) continue;
        const leg = Math.abs(dx) === 2 ? from + Math.sign(dx) : from + Math.sign(dy) * 9;
        if (!b[leg]) add(x + dx, y + dy);
      }
    } else if (type === 5 || type === 6) {
      for (const [dx, dy] of ORTHOGONAL) {
        let screen = false;
        for (let tx = x + dx, ty = y + dy; inside(tx, ty); tx += dx, ty += dy) {
          const victim = b[ty * 9 + tx];
          if (type === 5) { add(tx, ty); if (victim) break; }
          else if (!screen) { if (victim) screen = true; else add(tx, ty); }
          else if (victim) { add(tx, ty); break; }
        }
      }
    } else if (type === 7) {
      add(x, y + (side === 0 ? 1 : -1));
      if (side === 0 ? y >= 5 : y <= 4) { add(x - 1, y); add(x + 1, y); }
    }
  }
  return moves;
}
export function legalMoves(p: Position, onlyFrom?: number): Move[] {
  const side = p.active, moves: Move[] = [];
  for (const move of pseudoMoves(p, onlyFrom)) { const undo = make(p, move); try { if (!inCheck(p, side)) moves.push(move); } finally { unmake(p, undo); } }
  return moves;
}
export function perft(p: Position, depth: number): number {
  if (!depth) return 1;
  const moves = legalMoves(p); if (depth === 1) return moves.length;
  let nodes = 0; for (const move of moves) { const undo = make(p, move); try { nodes += perft(p, depth - 1); } finally { unmake(p, undo); } } return nodes;
}
