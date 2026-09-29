// Nguyên tố "quanh em". Giá trị phổ biến trong sách giáo khoa / CRC Handbook:
//  - cơ thể người: % khối lượng (Wikipedia "Composition of the human body", theo Frieden/Emsley)
//  - không khí khô: % thể tích (NOAA/CRC); CO₂ ~0,04 % tính cho carbon
//  - vỏ Trái Đất: % khối lượng (CRC Handbook, "Abundance of elements in the Earth's crust")
//  - Mặt Trời: % khối lượng quang quyển (Asplund và cs. 2009)
// Giá trị < 0,01 % hiện là "vi lượng".

export type AroundId = 'body' | 'air' | 'crust' | 'sun';

export const AROUND_INFO: Record<AroundId, { label: string; icon: string; title: string; unit: string }> = {
    body: { label: 'Cơ thể', icon: '🧍', title: 'Cơ thể em được làm từ… (theo khối lượng)', unit: 'khối lượng' },
    air: { label: 'Không khí', icon: '💨', title: 'Không khí em thở gồm… (theo thể tích)', unit: 'thể tích' },
    crust: { label: 'Vỏ Trái Đất', icon: '🌍', title: 'Đất đá dưới chân em gồm… (theo khối lượng)', unit: 'khối lượng' },
    sun: { label: 'Mặt Trời', icon: '☀️', title: 'Mặt Trời được làm từ… (theo khối lượng)', unit: 'khối lượng' },
};

export const COMPOSITION: Record<AroundId, Record<number, number>> = {
    body: { 8: 65, 6: 18.5, 1: 9.5, 7: 3.2, 20: 1.5, 15: 1.0, 19: 0.4, 16: 0.3, 11: 0.2, 17: 0.2, 12: 0.1,
        26: 0.006, 9: 0.0037, 30: 0.0032, 29: 0.0001, 53: 0.00002, 34: 0.00002, 25: 0.00002, 42: 0.00001, 27: 0.000002, 24: 0.000003 },
    air: { 7: 78.08, 8: 20.95, 18: 0.93, 6: 0.04, 10: 0.0018, 2: 0.0005, 36: 0.0001, 1: 0.00005, 54: 0.000009 },
    crust: { 8: 46.1, 14: 28.2, 13: 8.23, 26: 5.63, 20: 4.15, 11: 2.36, 12: 2.33, 19: 2.09, 22: 0.565, 1: 0.14, 15: 0.105, 25: 0.095 },
    sun: { 1: 73.46, 2: 24.85, 8: 0.77, 6: 0.29, 26: 0.16, 10: 0.12, 7: 0.09, 14: 0.07, 12: 0.05, 16: 0.04 },
};
