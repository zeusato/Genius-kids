export type Level = 'easy' | 'medium' | 'hard';
export interface Player { id: string; name: string; color: number; kind: 'human' | 'bot'; level: Level; avatar: string }
export interface Match {
  version: 1; rulesVersion: 1; id: string; owner: string; players: Player[];
  pieces: number[]; locked: boolean[]; finished: number[]; captures: number[];
  active: number; dice: number | null; phase: 'roll' | 'choose' | 'over'; winner: number | null;
  revision: number; turn: number; started: string; elapsed: number;
}
export interface Move { piece: number; from: number; to: number; capture: number | null; kind: 'deploy' | 'walk' | 'home' }
export interface Record { version: 1; hostWon: boolean; winner: string; players: { name: string; kind: Player['kind']; level: Level; finished: number; captures: number }[]; turns: number; rulesVersion: 1 }
export const TEAMS = [
  { name: 'Đỏ', color: '#d95848', light: '#f9ded2', symbol: 'Mặt trời' },
  { name: 'Xanh dương', color: '#3586b9', light: '#dceef5', symbol: 'Giọt nước' },
  { name: 'Xanh lá', color: '#43895d', light: '#deedd7', symbol: 'Chiếc lá' },
  { name: 'Vàng', color: '#d6a231', light: '#f9edbc', symbol: 'Ngôi sao' },
];
export const BOT_NAMES = ['Nắng', 'Mây', 'Lá', 'Sao'];
export const LEVEL_NAMES: { [K in Level]: string } = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };
