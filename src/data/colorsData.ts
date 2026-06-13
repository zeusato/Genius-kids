// Dữ liệu màu sắc cơ bản (Tiếng Anh – Tiếng Việt) cho mục Mầm non.
// Mã hex tham chiếu bảng màu Tailwind để đồng bộ giao diện.

export interface ColorItem {
    id: string;     // 'red'
    hex: string;    // '#ef4444'
    enName: string; // 'red'
    viName: string; // 'đỏ' (đọc to: "màu đỏ")
    light?: boolean; // nền sáng → cần chữ tối
}

export const COLORS_DATA: ColorItem[] = [
    { id: 'red', hex: '#ef4444', enName: 'red', viName: 'đỏ' },
    { id: 'orange', hex: '#f97316', enName: 'orange', viName: 'cam' },
    { id: 'yellow', hex: '#facc15', enName: 'yellow', viName: 'vàng', light: true },
    { id: 'green', hex: '#22c55e', enName: 'green', viName: 'xanh lá' },
    { id: 'blue', hex: '#3b82f6', enName: 'blue', viName: 'xanh dương' },
    { id: 'purple', hex: '#a855f7', enName: 'purple', viName: 'tím' },
    { id: 'pink', hex: '#ec4899', enName: 'pink', viName: 'hồng' },
    { id: 'brown', hex: '#92400e', enName: 'brown', viName: 'nâu' },
    { id: 'black', hex: '#1f2937', enName: 'black', viName: 'đen' },
    { id: 'white', hex: '#f8fafc', enName: 'white', viName: 'trắng', light: true },
    { id: 'gray', hex: '#9ca3af', enName: 'gray', viName: 'xám', light: true },
];
