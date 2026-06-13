// Dữ liệu hình dạng cơ bản (Tiếng Anh – Tiếng Việt) cho mục Mầm non.

export type ShapeId = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart' | 'oval' | 'diamond';

export interface ShapeItem {
    id: ShapeId;
    enName: string;
    viName: string; // đọc to, vd "hình tròn"
}

export const SHAPES_DATA: ShapeItem[] = [
    { id: 'circle', enName: 'circle', viName: 'hình tròn' },
    { id: 'square', enName: 'square', viName: 'hình vuông' },
    { id: 'triangle', enName: 'triangle', viName: 'hình tam giác' },
    { id: 'rectangle', enName: 'rectangle', viName: 'hình chữ nhật' },
    { id: 'star', enName: 'star', viName: 'hình ngôi sao' },
    { id: 'heart', enName: 'heart', viName: 'hình trái tim' },
    { id: 'oval', enName: 'oval', viName: 'hình bầu dục' },
    { id: 'diamond', enName: 'diamond', viName: 'hình thoi' },
];

// Màu vui mắt gán cho từng hình (chỉ để trang trí).
export const SHAPE_COLORS: Record<ShapeId, string> = {
    circle: '#ef4444',
    square: '#3b82f6',
    triangle: '#22c55e',
    rectangle: '#f97316',
    star: '#facc15',
    heart: '#ec4899',
    oval: '#a855f7',
    diamond: '#14b8a6',
};
