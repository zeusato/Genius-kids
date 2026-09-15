// Cờ Vua — trạng thái độc lập, players cố định theo màu và ownerSide tách riêng.

export type Side = 0 | 1;                 // 0 = Trắng (đi trước), 1 = Đen
export type Level = 'easy' | 'medium' | 'hard';
export type PromoteTo = 'q' | 'r' | 'b' | 'n';
export const RULES_VERSION = 'gk-chess-v2' as const;
export const sameMove = (a: Move, b: Move) => a.from === b.from && a.to === b.to && a.promote === b.promote;

export interface Player { id: string; name: string; avatar: string; kind: 'human' | 'bot'; level: Level }

// from/to là ô 0..63. Nhập thành và bắt tốt qua đường suy ra từ thế cờ; chỉ phong cấp cần promote.
export interface Move { from: number; to: number; promote?: PromoteTo }

export type EndReason =
  | 'checkmate' | 'stalemate' | 'repetition' | 'fifty-move'
  | 'insufficient' | 'resign' | 'agreement';

export interface Match {
  version: 2;
  rulesVersion: typeof RULES_VERSION;
  id: string;
  owner: string;
  ownerSide: Side;
  initialFen: string;
  endedAt: string | null;
  players: [Player, Player];             // index theo Side
  board: number[];                       // 64 ô
  active: Side;                          // bên tới lượt
  first: Side;                           // luôn 0: Trắng là màu đi đầu ở ván chuẩn
  castling: number;                      // bitmask WK|WQ|BK|BQ
  epSquare: number | null;               // ô bắt tốt qua đường
  halfmove: number;                      // đồng hồ 50 nước (nửa nước)
  fullmove: number;                      // số nước đầy đủ
  phase: 'play' | 'over';
  winner: Side | null;
  reason: EndReason | null;
  inCheck: boolean;
  revision: number;
  turn: number;                          // số nửa nước đã đi (ply)
  elapsed: number;
  history: string[];                     // nước đã đi, ký hiệu tọa độ
  positions: string[];                   // khóa thế cờ để đếm lặp
}

export interface GameRecord {
  version: 1;
  rulesVersion: typeof RULES_VERSION;
  id: string;
  ownerSide: Side;
  endedAt: string;
  hostResult: 'win' | 'loss' | 'draw';
  players: Player[];
  winner: Side | null;
  reason: EndReason;
  turns: number;
}

export const LEVEL_NAMES: Record<Level, string> = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };
export const SIDE_NAMES = ['Trắng', 'Đen'];
export const END_NAMES: Record<EndReason, string> = {
  checkmate: 'Chiếu bí',
  stalemate: 'Hết nước — hòa',
  repetition: 'Lặp thế cờ ba lần — hòa',
  'fifty-move': 'Luật 50 nước — hòa',
  insufficient: 'Không đủ quân chiếu bí — hòa',
  resign: 'Xin thua',
  agreement: 'Thỏa thuận hòa',
};
// Tên quân thuần Việt (dùng cho thông báo, không phải nhãn trên quân).
export const PIECE_NAMES: Record<number, string> = { 1: 'Tốt', 2: 'Mã', 3: 'Tượng', 4: 'Xe', 5: 'Hậu', 6: 'Vua' };
