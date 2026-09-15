import { describe, it, expect } from 'vitest';
import { chooseMove, greedyMove, randomMove, evaluate } from './bot';
import { matchFromFen, applyMove, matchToPos, legalMoves } from './engine';
import { algToSq } from './board';
import type { Player } from './model';

const players: [Player, Player] = [
  { id: 'w', name: 'Trắng', avatar: 'a', kind: 'human', level: 'hard' },
  { id: 'b', name: 'Đen', avatar: 'b', kind: 'bot', level: 'hard' },
];
const fen = (f: string) => matchFromFen('w', players, 'test', f);

describe('bot — chiến thuật', () => {
  it('tìm ra chiếu bí một nước (mate in 1)', () => {
    const m = fen('6k1/5ppp/8/8/8/8/8/R6K w - - 0 1');   // Ra8#
    const { move } = chooseMove(m, 'hard', { deadline: 400 });
    expect(move).toBeTruthy();
    const after = applyMove(m, move!).match;
    expect(after.reason).toBe('checkmate');
    expect(after.winner).toBe(0);
  });

  it('bắt Hậu không được bảo vệ', () => {
    const m = fen('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1');   // Rxd5
    const { move } = chooseMove(m, 'hard', { deadline: 400 });
    expect(move!.to).toBe(algToSq('d5'));
  });

  it('thoát chiếu bằng nước hợp lệ', () => {
    const m = fen('4k3/8/8/8/7b/8/5P2/4K3 b - - 0 1');   // Đen đi; sau đó Trắng phải hợp lệ
    const bm = chooseMove(m, 'medium', { deadline: 200 }).move!;
    const next = applyMove(m, bm).match;                 // giờ tới Trắng
    const reply = chooseMove(next, 'hard', { deadline: 300 }).move;
    if (reply) expect(legalMoves(next).some(x => x.from === reply.from && x.to === reply.to)).toBe(true);
  });

  it('không tự bỏ Hậu khi bị dọa (giữ vật chất)', () => {
    // Hậu trắng d1 bị Xe đen d8 dọa qua cột d mở; bot Khó nên di chuyển/che chứ không để mất không.
    const m = fen('3r2k1/8/8/8/8/8/6PP/3Q2K1 w - - 0 1');
    const before = evaluate(matchToPos(m));
    const { move } = chooseMove(m, 'hard', { deadline: 400 });
    const after = applyMove(m, move!).match;
    // Sau nước của Trắng tới lượt Đen; nếu Đen ăn được Hậu miễn phí, greedy sẽ làm.
    const blackGrab = greedyMove(after);
    const grabbed = blackGrab && after.board[blackGrab.to] === 5; // 5 = Hậu trắng
    expect(grabbed).toBeFalsy();
  });
});

describe('bot — mức độ trả nước hợp lệ nhanh', () => {
  const start = matchFromFen('w', players, 't', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  for (const lvl of ['easy', 'medium', 'hard'] as const) {
    it(lvl, () => {
      const { move } = chooseMove(start, lvl, { deadline: 250 });
      expect(move).toBeTruthy();
      expect(legalMoves(start).some(x => x.from === move!.from && x.to === move!.to)).toBe(true);
    });
  }
  it('baseline random/greedy hợp lệ', () => {
    expect(legalMoves(start).some(x => { const r = randomMove(start, 123)!; return x.from === r.from && x.to === r.to; })).toBe(true);
    expect(legalMoves(start).some(x => { const g = greedyMove(start)!; return x.from === g.from && x.to === g.to; })).toBe(true);
  });
});
