import { describe, it, expect } from 'vitest';
import { parseFen, serializeFen } from './fen';
import { perft, genLegal, genPseudo, terminalPos, insufficientMaterial, applyMove, newMatch, matchToPos } from './engine';
import { START_FEN, algToSq } from './board';
import type { Player } from './model';

// Giá trị perft chuẩn — lệch số nghĩa là lỗi sinh nước.
describe('perft — thế khai cuộc', () => {
  const pos = () => parseFen(START_FEN);
  it('depth 1 = 20', () => expect(perft(pos(), 1)).toBe(20));
  it('depth 2 = 400', () => expect(perft(pos(), 2)).toBe(400));
  it('depth 3 = 8.902', () => expect(perft(pos(), 3)).toBe(8902));
  it('depth 4 = 197.281', () => expect(perft(pos(), 4)).toBe(197281));
});

describe('perft — Kiwipete (nhập thành, EP, chiếu)', () => {
  const fen = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
  it('depth 1 = 48', () => expect(perft(parseFen(fen), 1)).toBe(48));
  it('depth 2 = 2.039', () => expect(perft(parseFen(fen), 2)).toBe(2039));
  it('depth 3 = 97.862', () => expect(perft(parseFen(fen), 3)).toBe(97862));
  it('depth 4 = 4.085.603', () => expect(perft(parseFen(fen), 4)).toBe(4085603), 20000);
});

describe('perft — thế 3 (tốt qua đường, chiếu ngang)', () => {
  const fen = '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1';
  it('depth 1 = 14', () => expect(perft(parseFen(fen), 1)).toBe(14));
  it('depth 2 = 191', () => expect(perft(parseFen(fen), 2)).toBe(191));
  it('depth 3 = 2.812', () => expect(perft(parseFen(fen), 3)).toBe(2812));
  it('depth 4 = 43.238', () => expect(perft(parseFen(fen), 4)).toBe(43238));
});

describe('perft — thế 4 & 5 (phong cấp, quân ghim)', () => {
  const fen4 = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1';
  it('thế 4 depth 3 = 9.467', () => expect(perft(parseFen(fen4), 3)).toBe(9467));
  const fen5 = 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8';
  it('thế 5 depth 3 = 62.379', () => expect(perft(parseFen(fen5), 3)).toBe(62379));
});

describe('FEN round-trip', () => {
  it('khớp lại chuỗi gốc', () => {
    for (const fen of [START_FEN, 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1'])
      expect(serializeFen(parseFen(fen))).toBe(fen);
  });
});

describe('nước đặc biệt', () => {
  it('nhập thành hai bên có mặt trong nước hợp lệ', () => {
    const legal = genLegal(parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'));
    const strs = legal.map(m => m.from + '-' + m.to);
    expect(strs).toContain('4-6');   // O-O
    expect(strs).toContain('4-2');   // O-O-O
  });
  it('không nhập thành khi Vua đi qua ô bị chiếu', () => {
    // Xe đen f8 khống chế f1 → cấm O-O của Trắng.
    const legal = genLegal(parseFen('r4rk1/8/8/8/8/8/8/R3K2R w KQ - 0 1'));
    expect(legal.some(m => m.from === 4 && m.to === 6)).toBe(false);
  });
  it('phong cấp sinh đủ 4 lựa chọn', () => {
    const legal = genLegal(parseFen('8/P7/8/8/8/8/8/k6K w - - 0 1'));
    const promos = legal.filter(m => m.from === algToSq('a7') && m.to === algToSq('a8'));
    expect(promos.map(m => m.promote).sort()).toEqual(['b', 'n', 'q', 'r']);
  });
  it('bắt tốt qua đường xuất hiện đúng lúc', () => {
    const pos = parseFen('8/8/8/pP6/8/8/8/k6K w - a6 0 1');
    expect(genPseudo(pos).some(m => m.to === algToSq('a6'))).toBe(true);
  });
});

describe('kết thúc ván', () => {
  it('chiếu bí (fool\'s mate)', () => {
    const t = terminalPos(parseFen('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'));
    expect(t).toEqual({ over: true, mate: true });
  });
  it('hết nước = hòa (stalemate)', () => {
    const t = terminalPos(parseFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'));
    expect(t).toEqual({ over: true, mate: false });
  });
  it('thiếu quân: KK và KN là hòa, KQ thì không', () => {
    expect(insufficientMaterial(parseFen('8/8/4k3/8/8/3K4/8/8 w - - 0 1').b)).toBe(true);
    expect(insufficientMaterial(parseFen('8/8/4k3/8/8/3K1N2/8/8 w - - 0 1').b)).toBe(true);
    expect(insufficientMaterial(parseFen('8/8/4k3/8/8/3K1Q2/8/8 w - - 0 1').b)).toBe(false);
  });
});

describe('applyMove & Match', () => {
  const players: [Player, Player] = [
    { id: 'w', name: 'Trắng', avatar: 'a', kind: 'human', level: 'easy' },
    { id: 'b', name: 'Đen', avatar: 'b', kind: 'bot', level: 'hard' },
  ];
  it('nước 1.e4 cập nhật ô EP và lượt', () => {
    const m0 = newMatch('w', players, 'game1', 0);
    const { match } = applyMove(m0, { from: algToSq('e2'), to: algToSq('e4') });
    expect(match.active).toBe(1);
    expect(match.epSquare).toBe(algToSq('e3'));
    expect(match.turn).toBe(1);
    expect(matchToPos(match).b[algToSq('e4')]).toBe(1); // Tốt trắng
  });
  it('chiếu bí kết thúc ván với người đi thắng', () => {
    // Scholar's mate: sau Qxf7#.
    const m = newMatch('w', players, 'g', 0);
    const seq = ['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7'];
    let cur = m;
    for (const s of seq) cur = applyMove(cur, { from: algToSq(s.slice(0, 2)), to: algToSq(s.slice(2, 4)) }).match;
    expect(cur.phase).toBe('over');
    expect(cur.reason).toBe('checkmate');
    expect(cur.winner).toBe(0);
  });
});
