export type Seat = 0 | 1;
export type Level = 'easy' | 'medium' | 'hard';
export interface Player { id: string; name: string; avatar: string; kind: 'human' | 'bot'; level: Level }
export interface Bank { dân: number; quan: number }
export interface Position { board: number[]; quan: boolean[]; banks: Bank[] }
export type EndReason = 'empty' | 'shortage' | 'repetition';
export interface Match extends Position {
  version: 1; rulesVersion: 'family-v1'; id: string; owner: string; players: Player[];
  active: Seat; first: Seat; phase: 'play' | 'over'; winner: Seat | null;
  reason: EndReason | null; revision: number; turn: number; elapsed: number;
  history: string[]; collected: number[];
}
export interface Action { pit: number; direction: 1 | -1 }
export type EventKind = 'pickup' | 'drop' | 'capture' | 'refill' | 'sweep' | 'end';
export interface TurnEvent {
  kind: EventKind; from: number; to: number; dân: number; quan: number;
  held: number; seat: Seat; position: Position;
}
export interface TurnResult { state: Match; events: TurnEvent[] }
export interface GameRecord {
  version: 1; rulesVersion: 'family-v1'; hostResult: 'win' | 'loss' | 'draw';
  players: Player[]; scores: number[]; banks: Bank[]; collected: number[];
  unclaimed: number; reason: EndReason; turns: number;
}
export const LEVEL_NAMES = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };
export const END_NAMES: Record<EndReason, string> = {
  empty: 'Hết quan, toàn dân kéo về', shortage: 'Không đủ 5 dân để rải lại', repetition: 'Thế cờ lặp lại',
};
export const TEAM_COLORS = ['#287d79', '#c26d41'];
