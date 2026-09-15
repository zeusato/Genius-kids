// Cờ Vua — hằng số bàn cờ và mã hóa quân.
// Ô 0..63, sq = rank*8 + file. rank 0 = hàng 1 (nhà Trắng), file 0 = cột a.
// Quân: 0 = trống; Trắng 1..6 = P N B R Q K; Đen 9..14 = p n b r q k (type + 8).

export type Piece = number;
export const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
export const BR = R + 8; // Xe đen (12) — dùng khi kiểm tra nhập thành

export const typeOf = (pc: number) => pc & 7;              // 1..6 cho cả hai màu
export const colorOf = (pc: number) => (pc >= 9 ? 1 : 0);  // chỉ hợp lệ khi pc !== 0
export const isOwn = (pc: number, side: number) => pc !== 0 && colorOf(pc) === side;
export const makePiece = (type: number, side: number) => (side === 0 ? type : type + 8);

export const fileOf = (sq: number) => sq & 7;
export const rankOf = (sq: number) => sq >> 3;
export const sqOf = (f: number, r: number) => r * 8 + f;
export const onBoard = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;
export const squareColor = (sq: number) => (fileOf(sq) + rankOf(sq)) & 1;

// Quyền nhập thành (bitmask).
export const WK = 1, WQ = 2, BK = 4, BQ = 8;
export const CASTLE_ALL = WK | WQ | BK | BQ;

// Hướng đi (df, dr).
export const KNIGHT_D: [number, number][] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
export const KING_D: [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
export const BISHOP_D: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
export const ROOK_D: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Ô nhà của Vua và Xe (dùng cho nhập thành và cập nhật quyền).
export const WHITE_KING_HOME = 4, BLACK_KING_HOME = 60;

const FILE_CH = 'abcdefgh';
export const sqToAlg = (sq: number) => FILE_CH[fileOf(sq)] + (rankOf(sq) + 1);
export const algToSq = (s: string) => sqOf(FILE_CH.indexOf(s[0]), Number(s[1]) - 1);
