// Cờ Vua — đọc/ghi FEN. Dùng cho khởi tạo, kiểm thử (Kiwipete...), fixture và debug.

import { P, N, B, R, Q, K, typeOf, colorOf, fileOf, rankOf, sqOf, WK, WQ, BK, BQ, START_FEN, sqToAlg, algToSq } from './board';
import type { Pos } from './engine';

const CHAR_TO_PIECE: Record<string, number> = {
  P, N, B, R, Q, K, p: P + 8, n: N + 8, b: B + 8, r: R + 8, q: Q + 8, k: K + 8,
};
const PIECE_TO_CHAR = ['', 'P', 'N', 'B', 'R', 'Q', 'K'];

export function parseFen(fen?: string): Pos {
  const f = (fen ?? START_FEN).trim();
  const [placement, turn, castle, ep, half = '0', full = '1'] = f.split(/\s+/);
  if (!/^[wb]$/.test(turn) || !/^(?:-|K?Q?k?q?)$/.test(castle) || !/^(?:-|[a-h][36])$/.test(ep) || !/^\d+$/.test(half) || !/^\d+$/.test(full) || !Number.isSafeInteger(+half) || !Number.isSafeInteger(+full) || +full < 1) throw new Error('FEN không hợp lệ');
  const b = new Int8Array(64);
  let wk = -1, bk = -1;
  const ranks = placement.split('/');            // rank 8 trước, rank 1 sau
  if (ranks.length !== 8 || ranks.some(row => !/^[prnbqkPRNBQK1-8]+$/.test(row) || [...row].reduce((n, c) => n + (/[1-8]/.test(c) ? +c : 1), 0) !== 8)) throw new Error('Bàn FEN không hợp lệ');
  for (let i = 0; i < 8; i++) {
    const rank = 7 - i;                           // i=0 -> rank 7 (hàng 8)
    let file = 0;
    for (const ch of ranks[i]) {
      if (ch >= '1' && ch <= '8') { file += Number(ch); continue; }
      const pc = CHAR_TO_PIECE[ch];
      const sq = sqOf(file, rank);
      b[sq] = pc;
      if (pc === K) wk = sq; else if (pc === K + 8) bk = sq;
      file++;
    }
  }
  let cmask = 0;
  if (castle && castle !== '-') {
    if (castle.includes('K')) cmask |= WK;
    if (castle.includes('Q')) cmask |= WQ;
    if (castle.includes('k')) cmask |= BK;
    if (castle.includes('q')) cmask |= BQ;
  }
  return {
    b, turn: turn === 'b' ? 1 : 0, castle: cmask,
    ep: ep && ep !== '-' ? algToSq(ep) : -1,
    half: Number(half), full: Number(full), king: [wk, bk],
  };
}

export function serializeFen(pos: Pos): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '', empty = 0;
    for (let file = 0; file < 8; file++) {
      const pc = pos.b[sqOf(file, rank)];
      if (pc === 0) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      const ch = PIECE_TO_CHAR[typeOf(pc)];
      row += colorOf(pc) === 0 ? ch : ch.toLowerCase();
    }
    if (empty) row += empty;
    rows.push(row);
  }
  let castle = '';
  if (pos.castle & WK) castle += 'K';
  if (pos.castle & WQ) castle += 'Q';
  if (pos.castle & BK) castle += 'k';
  if (pos.castle & BQ) castle += 'q';
  return [
    rows.join('/'),
    pos.turn === 0 ? 'w' : 'b',
    castle || '-',
    pos.ep === -1 ? '-' : sqToAlg(pos.ep),
    pos.half, pos.full,
  ].join(' ');
}
