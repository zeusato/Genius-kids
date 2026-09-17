export const SIZE = 15;
export const RULES_VERSION = 'gk-caro-v1' as const;
export type Side = 0 | 1;
export type Level = 'easy' | 'medium' | 'hard';
export type Player = { name: string; avatar: string; kind: 'human' | 'bot' };
export interface Match {
  version: 1; rulesVersion: typeof RULES_VERSION; id: string; owner: string; ownerSide: Side;
  players: [Player, Player]; mode: 'human' | 'bot'; level: Level;
  board: number[]; moves: number[]; activeSide: Side; phase: 'play' | 'over';
  winner: Side | null; winningLines: number[][]; endReason: 'five' | 'full' | 'resign' | 'agreement' | null;
  revision: number; elapsed: number; endedAt: string | null; undoEnabled: boolean; undos: number;
}
export interface CaroRecord {
  version: 1; rulesVersion: typeof RULES_VERSION; mode: Match['mode']; level: Level;
  ownerSide: Side; players: [Player, Player]; winner: Side | null; reason: Match['endReason'];
  undos: number; moves?: number[];
}
export const opposite = (side: Side): Side => side === 0 ? 1 : 0;
export const mark = (side: Side) => side === 0 ? 'X' : 'O';
export const LEVEL_NAMES: Record<Level, string> = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };
export const clock = (ms: number) => `${Math.floor(ms / 60000)}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}`;
