export type Stage = 'shaping' | 'preparing' | 'decorating' | 'firing' | 'reveal' | 'finished';
export type Tool = 'shape' | 'height' | 'open' | 'smooth' | 'view' | 'brush' | 'erase' | 'stamp' | 'band';
export type Glaze = 'gloss' | 'satin' | 'matte' | 'speckle' | 'wash' | 'crackle';
export type Stamp = 'flower' | 'leaf' | 'star' | 'heart' | 'sun' | 'moon' | 'fish' | 'dots' | 'diamond' | 'wave' | 'sprout' | 'snow';
export type Pattern = 'plain' | 'dots' | 'wave' | 'leaves' | 'diamonds' | 'scallops';
export interface ShapeDoc { height: number; radii: number[]; thickness: number; depth: number }
export interface PaintPoint { u: number; v: number; radius: number }
export interface PaintStroke { kind: 'brush' | 'erase' | 'stamp' | 'band'; color: string; size: number; opacity: number; stamp: Stamp; pattern: Pattern; points: PaintPoint[] }
export interface DecorationDoc { color: string; insideColor: string; coverage: number; strokes: PaintStroke[] }
export interface Scope { account: string; student: string }
export interface ArtworkDoc extends Scope {
  version: 1; id: string; revision: number; name: string; stage: Stage; shape: ShapeDoc;
  clay: string; glaze: Glaze; decoration: DecorationDoc; seed: number; materialVersion: 1;
  createdAt: string; updatedAt: string; parentId?: string; challenge?: string; lesson?: string;
  imported?: boolean; skills: string[];
}
export interface PotteryProgress { version: 1; claimed: string[]; badges: string[] }
export interface ArtworkSummary { id: string; name: string; stage: Stage; updatedAt: string; thumb?: Blob; revision: number }
export const clone = <T,>(value: T): T => structuredClone(value);
export const PALETTE = [
  ['#e9dfc8', 'Kem'], ['#f4eee2', 'Trắng sữa'], ['#d89a57', 'Mật ong'], ['#c56e4b', 'Đất nung'],
  ['#a7413d', 'Đỏ gạch'], ['#df8d98', 'Hồng đào'], ['#9a6aa5', 'Tím'], ['#e0bf61', 'Vàng'],
  ['#829c66', 'Xanh lá'], ['#456957', 'Xanh rừng'], ['#66a895', 'Xanh ngọc'], ['#9dc7c6', 'Xanh sương'],
  ['#447a9e', 'Xanh biển'], ['#304d78', 'Lam'], ['#785842', 'Nâu'], ['#343b3d', 'Than'],
] as const;
export const CLAYS = [{ id: 'terra', name: 'Đất nâu', wet: '#98634b', dry: '#c28c69' }, { id: 'cream', name: 'Đất kem', wet: '#aaa08a', dry: '#e5d4b8' }, { id: 'grey', name: 'Đất xám', wet: '#777b77', dry: '#b4b3aa' }];
export const GLAZES: { id: Glaze; name: string; roughness: number; coat: number }[] = [
  { id: 'gloss', name: 'Bóng', roughness: .23, coat: 1 }, { id: 'satin', name: 'Satin', roughness: .46, coat: .35 },
  { id: 'matte', name: 'Lì', roughness: .85, coat: 0 }, { id: 'speckle', name: 'Chấm hạt', roughness: .4, coat: .65 },
  { id: 'wash', name: 'Loang', roughness: .32, coat: .8 }, { id: 'crackle', name: 'Men rạn', roughness: .27, coat: .85 },
];
export const STAMPS: { id: Stamp; name: string }[] = [
  { id: 'flower', name: 'Hoa' }, { id: 'leaf', name: 'Lá' }, { id: 'star', name: 'Sao' }, { id: 'heart', name: 'Tim' },
  { id: 'sun', name: 'Mặt trời' }, { id: 'moon', name: 'Trăng' }, { id: 'fish', name: 'Cá' }, { id: 'dots', name: 'Chấm' },
  { id: 'diamond', name: 'Thoi' }, { id: 'wave', name: 'Sóng' }, { id: 'sprout', name: 'Mầm' }, { id: 'snow', name: 'Bông tuyết' },
];
export const PATTERNS: { id: Pattern; name: string }[] = [{ id: 'plain', name: 'Vòng trơn' }, { id: 'dots', name: 'Chấm bi' }, { id: 'wave', name: 'Sóng nước' }, { id: 'leaves', name: 'Lá nhỏ' }, { id: 'diamonds', name: 'Quả trám' }, { id: 'scallops', name: 'Vảy cá' }];
