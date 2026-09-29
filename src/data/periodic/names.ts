// Tên nguyên tố theo chương trình GDPT 2018 (Chương trình môn KHTN, TT 32/2018/TT-BGDĐT, mục VIII.1):
// thuật ngữ hóa học theo IUPAC, riêng 13 nguyên tố giữ tên tiếng Việt (vàng, bạc, đồng, chì, sắt, nhôm,
// kẽm, lưu huỳnh, thiếc, nitơ, natri, kali, thủy ngân). Tên cũ (Hiđro, Oxi, Cacbon…) giữ làm tên phụ
// và từ khóa tìm kiếm — `name` trong elementsData.ts chính là tên cũ.

/** 13 nguyên tố giữ tên Việt theo SGK. */
export const VIET_NAMES: Record<number, string> = {
    7: 'Nitơ', 11: 'Natri', 13: 'Nhôm', 16: 'Lưu huỳnh', 19: 'Kali', 26: 'Sắt', 29: 'Đồng', 30: 'Kẽm',
    47: 'Bạc', 50: 'Thiếc', 79: 'Vàng', 80: 'Thủy ngân', 82: 'Chì',
};

/** Tên IUPAC khác cách viết tiếng Anh Mỹ trong dữ liệu gốc. */
export const IUPAC_SPELLING: Record<number, string> = { 13: 'Aluminium', 55: 'Caesium' };

/** Tên gọi dân gian / cách viết khác, dùng cho tìm kiếm (đã có sẵn: tên SGK, tên cũ, tên tiếng Anh). */
export const EXTRA_ALIASES: Record<number, string[]> = {
    1: ['hidro', 'hydro'], 6: ['than', 'kim cuong', 'cac bon'], 7: ['ni to'], 8: ['o xi', 'oxy', 'dưỡng khí'],
    11: ['muoi an'], 15: ['phot pho', 'photpho'], 17: ['clo'], 20: ['can xi', 'canxi'], 53: ['i ot', 'muối i-ốt', 'iot'],
    74: ['wolfram', 'von fram'], 80: ['mercury'], 92: ['uranium'], 94: ['plutonium'],
};
