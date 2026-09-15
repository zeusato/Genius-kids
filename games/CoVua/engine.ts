// Cờ Vua — engine luật: sinh nước, make/unmake, phát hiện chiếu/bí/hòa, perft.
// Pos là biểu diễn khả biến để duyệt nhanh (perft + bot). Match là lớp bất biến cho UI.

import {
  P, N, B, R, Q, K, BR, typeOf, colorOf, isOwn, makePiece,
  fileOf, rankOf, sqOf, onBoard, squareColor,
  WK, WQ, BK, BQ, CASTLE_ALL,
  KNIGHT_D, KING_D, BISHOP_D, ROOK_D, sqToAlg,
} from './board';
import type { Match, Move, Player, Side, EndReason } from './model';
import { parseFen, serializeFen } from './fen';
import { RULES_VERSION, sameMove } from './model';

export interface Pos {
  b: Int8Array;          // 64 ô
  turn: number;          // 0 Trắng, 1 Đen
  castle: number;        // bitmask
  ep: number;            // ô bắt tốt qua đường, -1 nếu không
  half: number;          // đồng hồ 50 nước
  full: number;          // số nước đầy đủ
  king: [number, number];// ô Vua từng bên
}

interface Undo {
  piece: number; cap: number; capSq: number;
  castle: number; ep: number; half: number; full: number;
  king0: number; king1: number;
  rook: [number, number] | null;   // [ô gốc, ô hiện tại] của Xe khi nhập thành
}

export function clonePos(p: Pos): Pos {
  return { b: Int8Array.from(p.b), turn: p.turn, castle: p.castle, ep: p.ep, half: p.half, full: p.full, king: [p.king[0], p.king[1]] };
}

// ---- Tấn công & chiếu ----

export function isAttacked(b: Int8Array, sq: number, by: number): boolean {
  const f = fileOf(sq), r = rankOf(sq);
  // Tốt: quân Tốt của `by` tấn công `sq` khi nó ở hàng phía sau `sq` theo hướng tiến của nó.
  const pr = by === 0 ? r - 1 : r + 1;
  const pawn = by === 0 ? P : P + 8;
  if (onBoard(f - 1, pr) && b[sqOf(f - 1, pr)] === pawn) return true;
  if (onBoard(f + 1, pr) && b[sqOf(f + 1, pr)] === pawn) return true;
  // Mã
  for (const [df, dr] of KNIGHT_D) {
    const nf = f + df, nr = r + dr;
    if (onBoard(nf, nr)) { const pc = b[sqOf(nf, nr)]; if (pc !== 0 && colorOf(pc) === by && typeOf(pc) === N) return true; }
  }
  // Vua
  for (const [df, dr] of KING_D) {
    const nf = f + df, nr = r + dr;
    if (onBoard(nf, nr)) { const pc = b[sqOf(nf, nr)]; if (pc !== 0 && colorOf(pc) === by && typeOf(pc) === K) return true; }
  }
  // Tượng / Hậu (chéo)
  for (const [df, dr] of BISHOP_D) {
    let nf = f + df, nr = r + dr;
    while (onBoard(nf, nr)) {
      const pc = b[sqOf(nf, nr)];
      if (pc !== 0) { if (colorOf(pc) === by && (typeOf(pc) === B || typeOf(pc) === Q)) return true; break; }
      nf += df; nr += dr;
    }
  }
  // Xe / Hậu (dọc-ngang)
  for (const [df, dr] of ROOK_D) {
    let nf = f + df, nr = r + dr;
    while (onBoard(nf, nr)) {
      const pc = b[sqOf(nf, nr)];
      if (pc !== 0) { if (colorOf(pc) === by && (typeOf(pc) === R || typeOf(pc) === Q)) return true; break; }
      nf += df; nr += dr;
    }
  }
  return false;
}

export const inCheck = (pos: Pos, side: number) => isAttacked(pos.b, pos.king[side], side ^ 1);

// ---- Sinh nước giả hợp lệ ----

function pushPawn(moves: Move[], from: number, to: number, promo: boolean) {
  if (promo) { for (const p of ['q', 'r', 'b', 'n'] as const) moves.push({ from, to, promote: p }); }
  else moves.push({ from, to });
}

function genCastle(pos: Pos, moves: Move[]) {
  const side = pos.turn, enemy = side ^ 1, b = pos.b;
  if (pos.king[side] !== (side === 0 ? 4 : 60)) return;
  if (isAttacked(b, pos.king[side], enemy)) return;           // không nhập thành khi đang bị chiếu
  if (side === 0) {
    if ((pos.castle & WK) && b[5] === 0 && b[6] === 0 && b[7] === R && !isAttacked(b, 5, enemy) && !isAttacked(b, 6, enemy)) moves.push({ from: 4, to: 6 });
    if ((pos.castle & WQ) && b[3] === 0 && b[2] === 0 && b[1] === 0 && b[0] === R && !isAttacked(b, 3, enemy) && !isAttacked(b, 2, enemy)) moves.push({ from: 4, to: 2 });
  } else {
    if ((pos.castle & BK) && b[61] === 0 && b[62] === 0 && b[63] === BR && !isAttacked(b, 61, enemy) && !isAttacked(b, 62, enemy)) moves.push({ from: 60, to: 62 });
    if ((pos.castle & BQ) && b[59] === 0 && b[58] === 0 && b[57] === 0 && b[56] === BR && !isAttacked(b, 59, enemy) && !isAttacked(b, 58, enemy)) moves.push({ from: 60, to: 58 });
  }
}

export function genPseudo(pos: Pos): Move[] {
  const { b, turn } = pos, moves: Move[] = [];
  const dir = turn === 0 ? 1 : -1, startRank = turn === 0 ? 1 : 6, promoRank = turn === 0 ? 7 : 0;
  for (let sq = 0; sq < 64; sq++) {
    const pc = b[sq];
    if (pc === 0 || colorOf(pc) !== turn) continue;
    const t = typeOf(pc), f = fileOf(sq), r = rankOf(sq);
    if (t === P) {
      const nr = r + dir;
      if (onBoard(f, nr) && b[sqOf(f, nr)] === 0) {
        pushPawn(moves, sq, sqOf(f, nr), nr === promoRank);
        if (r === startRank && b[sqOf(f, r + 2 * dir)] === 0) moves.push({ from: sq, to: sqOf(f, r + 2 * dir) });
      }
      for (const df of [-1, 1]) {
        const nf = f + df;
        if (!onBoard(nf, nr)) continue;
        const to = sqOf(nf, nr), cap = b[to];
        if (cap !== 0 && colorOf(cap) !== turn) pushPawn(moves, sq, to, nr === promoRank);
        else if (cap === 0 && to === pos.ep && b[to - dir * 8] === makePiece(P, turn ^ 1)) moves.push({ from: sq, to });
      }
    } else if (t === N) {
      for (const [df, dr] of KNIGHT_D) { const nf = f + df, nr = r + dr; if (onBoard(nf, nr)) { const to = sqOf(nf, nr); if (!isOwn(b[to], turn)) moves.push({ from: sq, to }); } }
    } else if (t === K) {
      for (const [df, dr] of KING_D) { const nf = f + df, nr = r + dr; if (onBoard(nf, nr)) { const to = sqOf(nf, nr); if (!isOwn(b[to], turn)) moves.push({ from: sq, to }); } }
      genCastle(pos, moves);
    } else {
      const dirs = t === B ? BISHOP_D : t === R ? ROOK_D : [...BISHOP_D, ...ROOK_D];
      for (const [df, dr] of dirs) {
        let nf = f + df, nr = r + dr;
        while (onBoard(nf, nr)) {
          const to = sqOf(nf, nr), cap = b[to];
          if (cap === 0) moves.push({ from: sq, to });
          else { if (colorOf(cap) !== turn) moves.push({ from: sq, to }); break; }
          nf += df; nr += dr;
        }
      }
    }
  }
  return moves;
}

// ---- make / unmake ----

export function makeMove(pos: Pos, m: Move): Undo {
  const b = pos.b, from = m.from, to = m.to, pc = b[from], t = typeOf(pc), side = pos.turn;
  const undo: Undo = { piece: pc, cap: b[to], capSq: to, castle: pos.castle, ep: pos.ep, half: pos.half, full: pos.full, king0: pos.king[0], king1: pos.king[1], rook: null };
  pos.ep = -1;
  // Bắt tốt qua đường: Tốt đi chéo tới ô trống.
  if (t === P && fileOf(from) !== fileOf(to) && undo.cap === 0) {
    const capSq = side === 0 ? to - 8 : to + 8;
    undo.cap = b[capSq]; undo.capSq = capSq; b[capSq] = 0;
  }
  pos.half = (t === P || undo.cap !== 0) ? 0 : pos.half + 1;
  b[to] = pc; b[from] = 0;
  // Phong cấp
  if (t === P && rankOf(to) === (side === 0 ? 7 : 0)) {
    const pt = m.promote === 'n' ? N : m.promote === 'b' ? B : m.promote === 'r' ? R : Q;
    b[to] = makePiece(pt, side);
  }
  // Tốt đi 2 ô → đặt ô bắt qua đường
  if (t === P && Math.abs(rankOf(to) - rankOf(from)) === 2) pos.ep = side === 0 ? from + 8 : from - 8;
  // Nhập thành → dời Xe
  if (t === K) {
    pos.king[side] = to;
    if (from === 4 && to === 6) { b[5] = b[7]; b[7] = 0; undo.rook = [7, 5]; }
    else if (from === 4 && to === 2) { b[3] = b[0]; b[0] = 0; undo.rook = [0, 3]; }
    else if (from === 60 && to === 62) { b[61] = b[63]; b[63] = 0; undo.rook = [63, 61]; }
    else if (from === 60 && to === 58) { b[59] = b[56]; b[56] = 0; undo.rook = [56, 59]; }
    pos.castle &= side === 0 ? ~(WK | WQ) : ~(BK | BQ);
  }
  // Vua/Xe rời ô nhà, hoặc Xe bị ăn trên ô nhà → mất quyền tương ứng
  if (from === 0 || to === 0) pos.castle &= ~WQ;
  if (from === 7 || to === 7) pos.castle &= ~WK;
  if (from === 56 || to === 56) pos.castle &= ~BQ;
  if (from === 63 || to === 63) pos.castle &= ~BK;
  pos.turn = side ^ 1;
  if (side === 1) pos.full++;
  return undo;
}

export function unmakeMove(pos: Pos, m: Move, u: Undo) {
  const b = pos.b, side = pos.turn ^ 1;
  pos.turn = side; pos.full = u.full;
  b[m.from] = u.piece; b[m.to] = 0;
  if (u.rook) { b[u.rook[0]] = b[u.rook[1]]; b[u.rook[1]] = 0; }
  if (u.cap !== 0) b[u.capSq] = u.cap;
  pos.king[0] = u.king0; pos.king[1] = u.king1;
  pos.castle = u.castle; pos.ep = u.ep; pos.half = u.half;
}

export function genLegal(pos: Pos): Move[] {
  const moves = genPseudo(pos), legal: Move[] = [], side = pos.turn;
  for (const m of moves) {
    if (typeOf(pos.b[m.to]) === K) continue;
    const u = makeMove(pos, m);
    if (!isAttacked(pos.b, pos.king[side], side ^ 1)) legal.push(m);
    unmakeMove(pos, m, u);
  }
  return legal;
}

export function perft(pos: Pos, depth: number): number {
  if (depth === 0) return 1;
  let n = 0; const side = pos.turn, moves = genPseudo(pos);
  for (const m of moves) {
    const u = makeMove(pos, m);
    if (!isAttacked(pos.b, pos.king[side], side ^ 1)) n += perft(pos, depth - 1);
    unmakeMove(pos, m, u);
  }
  return n;
}

// ---- Nhận biết kết thúc ----

export function terminalPos(pos: Pos): { over: boolean; mate: boolean } {
  if (genLegal(pos).length) return { over: false, mate: false };
  return { over: true, mate: inCheck(pos, pos.turn) };
}

export function insufficientMaterial(b: Int8Array): boolean {
  let wN = 0, wB = 0, bN = 0, bB = 0; const bishopSquares: number[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const pc = b[sq]; if (pc === 0) continue;
    const t = typeOf(pc);
    if (t === P || t === R || t === Q) return false;
    if (t === N) { colorOf(pc) === 0 ? wN++ : bN++; }
    if (t === B) { colorOf(pc) === 0 ? wB++ : bB++; bishopSquares.push(squareColor(sq)); }
  }
  const minors = wN + wB + bN + bB;
  if (minors <= 1) return true;                                  // KK, KN, KB
  if (wN === 0 && bN === 0 && bishopSquares.every(color => color === bishopSquares[0])) return true;
  return false;
}

export function posKey(pos: Pos): string {
  let ep = -1;
  if (pos.ep >= 0) {
    const side = pos.turn;
    for (const move of genPseudo(pos)) {
      if (move.to !== pos.ep || typeOf(pos.b[move.from]) !== P || fileOf(move.from) === fileOf(move.to)) continue;
      const undo = makeMove(pos, move);
      try { if (!inCheck(pos, side)) ep = move.to; } finally { unmakeMove(pos, move, undo); }
      if (ep >= 0) break;
    }
  }
  return pos.b.join(',') + '|' + pos.turn + '|' + pos.castle + '|' + ep;
}

// ---- Cầu nối Match (bất biến) ----

export function matchToPos(m: Match): Pos {
  const b = Int8Array.from(m.board);
  let wk = -1, bk = -1;
  for (let sq = 0; sq < 64; sq++) { if (b[sq] === K) wk = sq; else if (b[sq] === K + 8) bk = sq; }
  return { b, turn: m.active, castle: m.castling, ep: m.epSquare ?? -1, half: m.halfmove, full: m.fullmove, king: [wk, bk] };
}

export function legalMoves(m: Match): Move[] {
  if (m.phase === 'over') return [];
  return genLegal(matchToPos(m));
}

export const moveToStr = (m: Move) => sqToAlg(m.from) + sqToAlg(m.to) + (m.promote ?? '');

export function capturedPieces(match: Match): [number[], number[]] {
  const pos = parseFen(match.initialFen), result: [number[], number[]] = [[], []];
  for (const text of match.history) {
    const from = (text.charCodeAt(0)-97)+(Number(text[1])-1)*8, to = (text.charCodeAt(2)-97)+(Number(text[3])-1)*8;
    const side = pos.turn, undo = makeMove(pos, { from, to, promote: text[4] as Move['promote'] });
    if (undo.cap) result[side].push(undo.cap);
  }
  return result;
}

function countKey(positions: string[], key: string): number {
  let n = 0; for (const k of positions) if (k === key) n++; return n;
}

export function adjudicate(pos: Pos, positions: string[], moves = genLegal(pos)): { winner: Side | null; reason: EndReason | null } {
  if (!moves.length) return { winner: inCheck(pos, pos.turn) ? (pos.turn ^ 1) as Side : null, reason: inCheck(pos, pos.turn) ? 'checkmate' : 'stalemate' };
  if (countKey(positions, posKey(pos)) >= 3) return { winner: null, reason: 'repetition' };
  if (pos.half >= 100) return { winner: null, reason: 'fifty-move' };
  if (insufficientMaterial(pos.b)) return { winner: null, reason: 'insufficient' };
  return { winner: null, reason: null };
}

export interface ApplyResult { match: Match; move: Move }
export function applyMove(match: Match, move: Move): ApplyResult {
  if (match.phase !== 'play' || !legalMoves(match).some(m => sameMove(m, move))) return { match, move };
  const pos = matchToPos(match);
  makeMove(pos, move);
  const positions = [...match.positions, posKey(pos)], result = adjudicate(pos, positions);
  return { move, match: { ...match, board: Array.from(pos.b), active: pos.turn as Side,
    castling: pos.castle, epSquare: pos.ep < 0 ? null : pos.ep, halfmove: pos.half, fullmove: pos.full,
    history: [...match.history, moveToStr(move)], positions, revision: match.revision + 1, turn: match.turn + 1,
    inCheck: inCheck(pos, pos.turn), phase: result.reason ? 'over' : 'play', ...result,
    endedAt: result.reason ? new Date().toISOString() : null } };
}

export function finishMatch(match: Match, reason: 'resign' | 'agreement', side: Side = match.ownerSide): Match {
  if (match.phase !== 'play' || (reason === 'resign' && match.players[side]?.kind !== 'human') ||
    (reason === 'agreement' && match.players.some(p => p.kind !== 'human'))) return match;
  return { ...match, phase: 'over', reason, winner: reason === 'resign' ? (side ^ 1) as Side : null,
    revision: match.revision + 1, endedAt: new Date().toISOString() };
}

export function matchFromFen(owner: string, players: [Player, Player], id: string, fen: string, ownerSide: Side = 0): Match {
  const pos = parseFen(fen), positions = [posKey(pos)], result = adjudicate(pos, positions);
  return { version: 2, rulesVersion: RULES_VERSION, id, owner, ownerSide, first: 0,
    initialFen: serializeFen(pos), endedAt: result.reason ? new Date().toISOString() : null,
    players: players.map(p => ({ ...p })) as [Player, Player], board: Array.from(pos.b), active: pos.turn as Side,
    castling: pos.castle, epSquare: pos.ep < 0 ? null : pos.ep, halfmove: pos.half, fullmove: pos.full,
    phase: result.reason ? 'over' : 'play', ...result, inCheck: inCheck(pos, pos.turn),
    revision: 0, turn: 0, elapsed: 0, history: [], positions };
}
export function newMatch(owner: string, players: [Player, Player], id: string, ownerSide: Side = 0): Match {
  return matchFromFen(owner, players, id, serializeFen(parseFen()), ownerSide);
}

export function validateParty(value: unknown, ownerSide: Side = 0): value is [Player, Player] {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(p => p && typeof p === 'object' &&
    typeof p.id === 'string' && p.id.length > 0 && typeof p.name === 'string' && p.name.length > 0 && p.name.length <= 80 &&
    typeof p.avatar === 'string' && ['human', 'bot'].includes(p.kind) && ['easy', 'medium', 'hard'].includes(p.level))) return false;
  return value[ownerSide].kind === 'human' && value[0].id !== value[1].id;
}

function validPosition(pos: Pos): boolean {
  if (pos.b.filter(p => p === K).length !== 1 || pos.b.filter(p => p === K + 8).length !== 1) return false;
  if (Array.from(pos.b).some((p, sq) => ![0,1,2,3,4,5,6,9,10,11,12,13,14].includes(p) ||
    (typeOf(p) === P && (rankOf(sq) === 0 || rankOf(sq) === 7)))) return false;
  if ([0, 1].some(side => pos.b.filter(p => p && colorOf(p) === side).length > 16 || pos.b.filter(p => p === makePiece(P, side)).length > 8)) return false;
  if (inCheck(pos, pos.turn ^ 1)) return false;
  const homes = [[WK,4,7,0], [WQ,4,0,0], [BK,60,63,1], [BQ,60,56,1]];
  if (homes.some(([flag, king, rook, side]) => (pos.castle & flag) && (pos.b[king] !== makePiece(K,side) || pos.b[rook] !== makePiece(R,side)))) return false;
  if (pos.ep >= 0) {
    const dir = pos.turn === 0 ? 8 : -8;
    if (rankOf(pos.ep) !== (pos.turn === 0 ? 5 : 2) || pos.b[pos.ep] || pos.b[pos.ep-dir] !== makePiece(P,pos.turn^1) || pos.b[pos.ep+dir]) return false;
  }
  return true;
}

/** Treat persisted JSON as untrusted: replay every move and re-derive its outcome. */
export function validateMatch(value: unknown, owner?: string): value is Match {
  try {
    const m = value as Match;
    if (!m || m.version !== 2 || m.rulesVersion !== RULES_VERSION || typeof m.owner !== 'string' || !m.owner ||
      (owner !== undefined && m.owner !== owner) || typeof m.id !== 'string' || !m.id || ![0,1].includes(m.ownerSide) ||
      !validateParty(m.players, m.ownerSide) || typeof m.initialFen !== 'string' || m.initialFen.length > 120 ||
      !Array.isArray(m.history) || m.history.length > 2000 || !Array.isArray(m.positions) || m.positions.length !== m.history.length+1 ||
      !Number.isFinite(m.elapsed) || m.elapsed < 0 || !Number.isSafeInteger(m.revision) || !Array.isArray(m.board) || m.board.length !== 64) return false;
    const pos = parseFen(m.initialFen);
    if (!validPosition(pos)) return false;
    let replay = matchFromFen(m.owner, m.players, m.id, m.initialFen, m.ownerSide);
    for (const text of m.history) {
      if (typeof text !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(text)) return false;
      const move = legalMoves(replay).find(candidate => moveToStr(candidate) === text);
      if (!move) return false;
      replay = applyMove(replay, move).match;
    }
    if (m.reason === 'resign') {
      if (m.winner !== 0 && m.winner !== 1) return false;
      if (replay.phase !== 'play') return false;
      replay = finishMatch(replay, 'resign', (m.winner ^ 1) as Side);
    } else if (m.reason === 'agreement') {
      if (replay.phase !== 'play') return false;
      replay = finishMatch(replay, 'agreement');
    }
    const fields = ['board','active','first','castling','epSquare','halfmove','fullmove','phase','winner','reason','inCheck','revision','turn','positions'] as const;
    if (fields.some(field => JSON.stringify(m[field]) !== JSON.stringify(replay[field]))) return false;
    return m.phase === 'play' ? m.endedAt === null : typeof m.endedAt === 'string' && Number.isFinite(Date.parse(m.endedAt));
  } catch { return false; }
}
