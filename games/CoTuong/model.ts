export type Side = 0 | 1;
export type Level = 'easy' | 'medium' | 'hard';
export type EndReason = 'checkmate' | 'stalemate' | 'perpetual-check' | 'repetition' | 'resign' | 'agreement';
export const RULES_VERSION = 'gk-xiangqi-v1' as const;
export interface Player { id: string; name: string; avatar: string; kind: 'human' | 'bot'; level: Level }
export interface Move { from: number; to: number }
export interface PlyRecord extends Move { side: Side; gaveCheck: boolean }
export interface Match {
  version: 1; rulesVersion: typeof RULES_VERSION; id: string; owner: string; ownerSide: Side;
  players: [Player, Player]; board: number[]; active: Side;
  phase: 'play' | 'over'; winner: Side | null; reason: EndReason | null;
  revision: number; ply: number; elapsed: number; endedAt: string | null;
  history: PlyRecord[]; positions: string[];
}
export interface GameRecord {
  version: 1; rulesVersion: typeof RULES_VERSION; id: string; ownerSide: Side;
  hostResult: 'win' | 'draw' | 'loss'; players: [Player, Player]; winner: Side | null;
  reason: EndReason; plies: number; endedAt: string; durationSeconds: number;
}
export interface Position { board: Int8Array; active: Side; kings: [number, number]; hash: number; history: PlyRecord[]; positions: string[] }
export interface Result { winner: Side | null; reason: EndReason }
export const NAMES = ['', 'Tướng', 'Sĩ', 'Tượng', 'Mã', 'Xe', 'Pháo', 'Tốt'];
export const GLYPHS = ['', '帥', '仕', '相', '傌', '俥', '炮', '兵', '', '將', '士', '象', '馬', '車', '砲', '卒'];
export const LEVEL_NAMES: Record<Level, string> = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };
export const REASONS: Record<EndReason, string> = { checkmate: 'Chiếu bí', stalemate: 'Hết nước đi', 'perpetual-check': 'Chiếu dai một phía', repetition: 'Lặp thế cờ', resign: 'Nhận thua', agreement: 'Đồng ý hòa' };
export const other = (side: Side): Side => side === 0 ? 1 : 0;
export const sideOf = (piece: number): Side => piece > 0 ? 0 : 1;
export const glyph = (piece: number) => GLYPHS[Math.abs(piece) + (piece < 0 ? 8 : 0)];
export const coordinate = (square: number) => `${'abcdefghi'[square % 9]}${Math.floor(square / 9)}`;
export const sameMove = (a: Move, b: Move) => a.from === b.from && a.to === b.to;
