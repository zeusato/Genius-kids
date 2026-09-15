import type { Seat } from './model';
export const ROWS = [[0, 1, 2, 3, 4], [10, 9, 8, 7, 6]];
export const QUAN_PITS = [5, 11];
export const isQuan = (pit: number) => pit === 5 || pit === 11;
export const nextPit = (pit: number, direction: number) => (pit + direction + 12) % 12;
export const ownerOf = (pit: number): Seat | null => pit >= 0 && pit <= 4 ? 0 : pit >= 6 && pit <= 10 ? 1 : null;
export const directionFor = (pit: number, side: 'left' | 'right'): 1 | -1 => (pit < 5) === (side === 'right') ? 1 : -1;
export const point = (pit: number): [number, number, number] => {
  if (pit === 5) return [6.45, .34, 0];
  if (pit === 11) return [-6.45, .34, 0];
  return [(pit < 5 ? pit - 2 : 8 - pit) * 2.05, .34, pit < 5 ? 1.15 : -1.15];
};
export const pitName = (pit: number) => isQuan(pit) ? `Ô quan ${pit === 5 ? 'phải' : 'trái'}` : `Ô ${ROWS[ownerOf(pit)!].indexOf(pit) + 1}`;
