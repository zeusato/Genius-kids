// Cờ Vua — helper hiển thị dùng chung giữa Board3D và Board2D.
import { fileOf, rankOf } from './board';

// Màu bàn/quân tông gỗ ấm (cổ điển).
export const LIGHT_SQ = '#ecd2a4', DARK_SQ = '#b07a44', SEL = '#f6d365', DOT = '#3f7d55', CHECK = '#e0533a';
export const WHITE_MAT = '#f2e6cd', BLACK_MAT = '#4a3521', FRAME = '#6d4726';

// Ô 0..63 → tọa độ world [x, z]. flip đảo bàn cho người cầm Đen nhìn xuôi.
// Không lật: hàng 1 (Trắng) ở phía +Z (gần máy quay).
export function squareWorld(sq: number, flip: boolean): [number, number] {
  const f = fileOf(sq), r = rankOf(sq);
  const x = (flip ? 7 - f : f) - 3.5;
  const z = flip ? r - 3.5 : 3.5 - r;
  return [x, z];
}

// Cho Board2D (SVG): ô → cột/hàng pixel (0..7), gốc trên-trái.
export function squareGrid(sq: number, flip: boolean): [number, number] {
  const f = fileOf(sq), r = rankOf(sq);
  return [flip ? 7 - f : f, flip ? r : 7 - r];
}

export const isLightSquare = (sq: number) => ((fileOf(sq) + rankOf(sq)) & 1) === 1;
