import { SIZE, RULES_VERSION, opposite, type Match, type Side } from './model';
export const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;
export const inside = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
/** Exact five. Only an opponent's mark blocks an end; the board edge does not. */
export function winningLines(board: ArrayLike<number>, cell: number, side: Side): number[][] {
  if (board[cell] !== side + 1) return [];
  const r = Math.floor(cell / SIZE), c = cell % SIZE, result: number[][] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const line = [cell]; let blocked = 0;
    for (const sign of [-1, 1]) {
      let nr = r + dr * sign, nc = c + dc * sign;
      while (inside(nr, nc) && board[nr * SIZE + nc] === side + 1) {
        if (sign < 0) line.unshift(nr * SIZE + nc); else line.push(nr * SIZE + nc);
        nr += dr * sign; nc += dc * sign;
      }
      if (inside(nr, nc) && board[nr * SIZE + nc] === opposite(side) + 1) blocked++;
    }
    if (line.length === 5 && blocked < 2) result.push(line);
  }
  return result;
}
export function newMatch(config: Pick<Match, 'owner' | 'ownerSide' | 'players' | 'mode' | 'level' | 'undoEnabled'>, id: string = crypto.randomUUID()): Match {
  return { ...config, id, version: 1, rulesVersion: RULES_VERSION, board: Array(SIZE * SIZE).fill(0), moves: [],
    activeSide: 0, phase: 'play', winner: null, winningLines: [], endReason: null, revision: 0, elapsed: 0, endedAt: null, undos: 0 };
}
export function place(s: Match, cell: number, endedAt = new Date().toISOString()): Match {
  if (s.phase !== 'play' || !Number.isInteger(cell) || cell < 0 || cell >= SIZE * SIZE || s.board[cell] !== 0) return s;
  const board = [...s.board]; board[cell] = s.activeSide + 1;
  const lines = winningLines(board, cell, s.activeSide), moves = [...s.moves, cell], full = moves.length === SIZE * SIZE;
  return { ...s, board, moves, activeSide: opposite(s.activeSide), revision: s.revision + 1,
    phase: lines.length || full ? 'over' : 'play', winner: lines.length ? s.activeSide : null,
    winningLines: lines, endReason: lines.length ? 'five' : full ? 'full' : null, endedAt: lines.length || full ? endedAt : null };
}
export function finish(s: Match, reason: 'resign' | 'agreement', side: Side = s.activeSide): Match {
  if (s.phase !== 'play' || reason === 'agreement' && s.mode !== 'human') return s;
  return { ...s, revision: s.revision + 1, phase: 'over', winner: reason === 'resign' ? opposite(side) : null,
    winningLines: [], endReason: reason, endedAt: new Date().toISOString() };
}
export function replayBoard(moves: number[], count = moves.length): number[] {
  const board = Array(SIZE * SIZE).fill(0);
  moves.slice(0, count).forEach((cell, i) => { board[cell] = i % 2 + 1; }); return board;
}
export function undo(s: Match): Match {
  if (!s.undoEnabled || s.phase !== 'play' || !s.moves.length) return s;
  let length = s.moves.length - 1;
  if (s.mode === 'bot') { while (length >= 0 && length % 2 !== s.ownerSide) length--; if (length < 0) return s; }
  const moves = s.moves.slice(0, length);
  return { ...s, moves, board: replayBoard(moves), activeSide: length % 2 as Side,
    revision: s.revision + 1, undos: s.undos + 1, winner: null, winningLines: [], endReason: null, endedAt: null };
}
export function validateMatch(value: unknown, owner?: string): value is Match {
  if (!value || typeof value !== 'object') return false;
  const s = value as Match;
  if (s.version !== 1 || s.rulesVersion !== RULES_VERSION || typeof s.id !== 'string' || !s.id || s.id.length > 120 || typeof s.owner !== 'string' || !s.owner || owner !== undefined && s.owner !== owner) return false;
  if (![0, 1].includes(s.ownerSide) || !['human', 'bot'].includes(s.mode) || !['easy', 'medium', 'hard'].includes(s.level) || typeof s.undoEnabled !== 'boolean' || !Number.isSafeInteger(s.undos) || s.undos < 0) return false;
  if (!Array.isArray(s.players) || s.players.length !== 2 || s.players.some(p => !p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 40 || typeof p.avatar !== 'string' || p.avatar.length > 40 || !['human', 'bot'].includes(p.kind))) return false;
  if (s.players[s.ownerSide].kind !== 'human' || s.players[opposite(s.ownerSide)].kind !== (s.mode === 'bot' ? 'bot' : 'human')) return false;
  if (!Array.isArray(s.moves) || s.moves.length > SIZE * SIZE || !Array.isArray(s.board) || s.board.length !== SIZE * SIZE || !Number.isSafeInteger(s.revision) || s.revision < s.moves.length || !Number.isFinite(s.elapsed) || s.elapsed < 0 || !['play', 'over'].includes(s.phase)) return false;
  let rebuilt = newMatch(s, s.id);
  for (const cell of s.moves) { const next = place(rebuilt, cell, '2000-01-01T00:00:00.000Z'); if (next === rebuilt) return false; rebuilt = next; }
  if (s.board.some((v, i) => v !== rebuilt.board[i]) || s.activeSide !== rebuilt.activeSide || !Array.isArray(s.winningLines) || JSON.stringify(s.winningLines) !== JSON.stringify(rebuilt.winningLines)) return false;
  if (s.phase === 'play') return rebuilt.phase === 'play' && s.winner === null && s.endReason === null && s.endedAt === null;
  if (typeof s.endedAt !== 'string' || !Number.isFinite(Date.parse(s.endedAt))) return false;
  if (rebuilt.phase === 'over') return s.endReason === rebuilt.endReason && s.winner === rebuilt.winner;
  return s.endReason === 'resign' && (s.winner === 0 || s.winner === 1) || s.endReason === 'agreement' && s.mode === 'human' && s.winner === null;
}
