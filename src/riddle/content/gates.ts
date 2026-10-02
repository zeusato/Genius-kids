import type { GateId } from './types';

export interface GateMeta {
    id: GateId;
    title: string;
    blurb: string;
    /** Màu đá cổng và màu nhấn (đọc tốt trên nền kem). */
    stone: string;
    accent: string;
    glyph: string;
    /** Lớp tối thiểu được đưa vào hành trình (vẫn mở để chơi riêng). */
    minGrade: number;
}

/** Thứ tự cổng trên hành trình. */
export const GATES: GateMeta[] = [
    { id: 'animals', title: 'Cổng Muông Thú', blurb: 'Con vật, chim chóc, côn trùng', stone: '#e8c998', accent: '#a0602a', glyph: '🐾', minGrade: 1 },
    { id: 'plants', title: 'Vườn Cây Trái', blurb: 'Cây, hoa, quả, món bánh', stone: '#cfdcae', accent: '#4d7a32', glyph: '🌿', minGrade: 1 },
    { id: 'objects', title: 'Nhà Đồ Vật', blurb: 'Đồ dùng, đồ chơi, xe cộ', stone: '#e6cdb8', accent: '#9a5a3b', glyph: '🏺', minGrade: 1 },
    { id: 'nature', title: 'Trời Đất', blurb: 'Nắng mưa, trăng sao, cơ thể', stone: '#c6dbe0', accent: '#2f6f86', glyph: '☀️', minGrade: 1 },
    { id: 'words', title: 'Lâu Đài Chữ', blurb: 'Đố chữ, thêm bớt dấu', stone: '#e3d2ea', accent: '#77508c', glyph: '🔤', minGrade: 2 },
    { id: 'tricks', title: 'Mê Cung Mẹo', blurb: 'Đố mẹo, toán vui', stone: '#f0d9a6', accent: '#94650f', glyph: '🧩', minGrade: 1 },
    { id: 'world', title: 'Cổng Bốn Phương', blurb: 'Câu đố tiếng Anh', stone: '#cfe0d0', accent: '#2f7656', glyph: '🌏', minGrade: 1 },
    { id: 'vietnam', title: 'Cổng Đất Việt', blurb: 'Địa danh, sử Việt, phong tục', stone: '#ecc3a8', accent: '#a5432b', glyph: '🥁', minGrade: 3 },
];
export const GATE_MAP = new Map(GATES.map(g => [g.id, g]));
/** Số câu (giải lần đầu) để thắp đủ đá và mở một cổng. */
export const GATE_STONES = 10;
