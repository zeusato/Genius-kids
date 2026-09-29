// Người tìm ra và nơi tìm ra (các nguyên tố nổi bật). Năm lấy từ elementsData.ts (discoveryYear, âm = TCN).
// Định nghĩa năm: lần đầu được nhận ra/tách được như một nguyên tố; với dữ liệu hiện tại, số nguyên tố
// biết tới 1869 là 63 — khớp bảng của Mendeleev.

export const DISCOVERER: Record<number, { by: string; country: string }> = {
    1: { by: 'Henry Cavendish', country: 'Anh' }, 2: { by: 'Janssen & Lockyer (trong ánh sáng Mặt Trời)', country: 'Pháp · Anh' },
    7: { by: 'Daniel Rutherford', country: 'Scotland' }, 8: { by: 'Scheele & Priestley', country: 'Thụy Điển · Anh' },
    9: { by: 'Henri Moissan', country: 'Pháp' }, 10: { by: 'Ramsay & Travers', country: 'Anh' }, 11: { by: 'Humphry Davy', country: 'Anh' },
    12: { by: 'Joseph Black', country: 'Scotland' }, 13: { by: 'Hans Christian Ørsted', country: 'Đan Mạch' }, 14: { by: 'Jöns Jacob Berzelius', country: 'Thụy Điển' },
    15: { by: 'Hennig Brand', country: 'Đức' }, 17: { by: 'Carl Wilhelm Scheele', country: 'Thụy Điển' }, 18: { by: 'Rayleigh & Ramsay', country: 'Anh' },
    19: { by: 'Humphry Davy', country: 'Anh' }, 20: { by: 'Humphry Davy', country: 'Anh' }, 21: { by: 'Lars Fredrik Nilson', country: 'Thụy Điển' },
    22: { by: 'William Gregor', country: 'Anh' }, 27: { by: 'Georg Brandt', country: 'Thụy Điển' }, 28: { by: 'Axel Cronstedt', country: 'Thụy Điển' },
    31: { by: 'Lecoq de Boisbaudran', country: 'Pháp' }, 32: { by: 'Clemens Winkler', country: 'Đức' }, 36: { by: 'Ramsay & Travers', country: 'Anh' },
    37: { by: 'Bunsen & Kirchhoff', country: 'Đức' }, 38: { by: 'Adair Crawford', country: 'Scotland' }, 43: { by: 'Perrier & Segrè', country: 'Ý' },
    53: { by: 'Bernard Courtois', country: 'Pháp' }, 54: { by: 'Ramsay & Travers', country: 'Anh' }, 55: { by: 'Bunsen & Kirchhoff', country: 'Đức' },
    56: { by: 'Humphry Davy', country: 'Anh' }, 74: { by: 'Anh em Elhuyar', country: 'Tây Ban Nha' }, 78: { by: 'Antonio de Ulloa', country: 'Tây Ban Nha' },
    84: { by: 'Marie & Pierre Curie', country: 'Pháp' }, 86: { by: 'Friedrich Ernst Dorn', country: 'Đức' }, 87: { by: 'Marguerite Perey', country: 'Pháp' },
    88: { by: 'Marie & Pierre Curie', country: 'Pháp' }, 92: { by: 'Martin Klaproth', country: 'Đức' }, 93: { by: 'McMillan & Abelson', country: 'Mỹ' },
    94: { by: 'Glenn Seaborg', country: 'Mỹ' }, 113: { by: 'Viện RIKEN', country: 'Nhật Bản' }, 117: { by: 'Dubna, Oak Ridge, Livermore', country: 'Nga · Mỹ' },
    118: { by: 'Nhóm Yuri Oganessian', country: 'Nga · Mỹ' },
};

/** Ba ô Mendeleev để trống năm 1869 và đoán trước tính chất (eka-bo, eka-nhôm, eka-silic). */
export const MENDELEEV_GAPS: Record<number, string> = { 21: 'eka-bo', 31: 'eka-nhôm', 32: 'eka-silic' };

export const HISTORY_MARKS: { year: number; label: string }[] = [
    { year: -5000, label: '⚱️ Cổ đại' }, { year: 1669, label: '🕯️ 1669 Brand' }, { year: 1808, label: '⚡ 1808 Davy' },
    { year: 1869, label: '📜 1869 Mendeleev' }, { year: 1898, label: '👩‍🔬 1898 Curie' }, { year: 1940, label: '⚛️ 1940 nhân tạo' },
    { year: 2016, label: '🏁 2016' },
];

export const HISTORY_EVENTS: { year: number; say: string }[] = [
    { year: 1669, say: 'Năm 1669, Hennig Brand tìm ra phosphorus — người đầu tiên được ghi tên tìm ra một nguyên tố.' },
    { year: 1808, say: 'Humphry Davy dùng dòng điện tách ra natri, kali, calcium…' },
    { year: 1861, say: 'Nhờ soi ánh sáng qua lăng kính, người ta tìm ra caesium và rubidium.' },
    { year: 1869, say: 'Năm 1869, Mendeleev xếp 63 nguyên tố thành bảng và để trống vài ô cho nguyên tố chưa tìm ra!' },
    { year: 1886, say: 'Gallium, scandium, germanium lần lượt được tìm ra — đúng như Mendeleev đã đoán.' },
    { year: 1898, say: 'Marie Curie tìm ra polonium và radium.' },
    { year: 1937, say: 'Technetium — nguyên tố đầu tiên do con người tạo ra.' },
    { year: 2016, say: 'Năm 2016, bốn nguyên tố cuối cùng được đặt tên. Nihonium là nguyên tố đầu tiên tìm ra ở châu Á.' },
];
