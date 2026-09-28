// Nội dung "kể chuyện" quanh mô hình 3D tế bào: nguồn mẫu vật, kích thước thật (cho thước đo),
// lời dẫn khi lặn vào, thí nghiệm. Tách khỏi cellData.ts (dữ liệu bào quan) cho gọn.

export type CellId = 'animal' | 'plant' | 'bacteria';

export interface CellStory {
    id: CellId;
    specimen: string;      // tên mẫu trên phòng thí nghiệm
    source: string;        // lấy từ đâu (gần gũi với bé)
    sizeLabel: string;     // kích thước thật
    umPerUnit: number;     // 1 đơn vị scene = bao nhiêu µm (thước đo, độ phóng đại)
    tissue: string;        // mô nhìn thấy lúc mới soi
    arrive: string;        // lời dẫn khi lặn tới nơi (đọc to)
    compare: string;       // so sánh kích thước dễ hình dung
    accent: string;        // màu nhận diện
    glow: string;
}

export const CELL_STORIES: Record<CellId, CellStory> = {
    animal: {
        id: 'animal',
        specimen: 'Tế bào động vật',
        source: 'Có trong cơ thể người và mọi con vật',
        sizeLabel: '≈ 20 µm',
        umPerUnit: 10 / 2.45,
        tissue: 'Một lớp mô gồm rất nhiều tế bào xếp sát nhau',
        arrive: 'Chào mừng em vào bên trong tế bào động vật! Tế bào được bọc bằng lớp màng mềm dẻo. Hãy chạm vào từng bộ phận để làm quen nhé.',
        compare: 'Khoảng 50 tế bào xếp hàng mới dài bằng 1 milimét.',
        accent: '#38bdf8',
        glow: '#a855f7'
    },
    plant: {
        id: 'plant',
        specimen: 'Tế bào lá cây',
        source: 'Lấy từ một chiếc lá xanh',
        sizeLabel: '≈ 50 µm',
        umPerUnit: 25 / 3.0,
        tissue: 'Các tế bào lá xếp như những viên gạch, lấm tấm hạt xanh',
        arrive: 'Đây là tế bào lá cây! Bên ngoài có bức tường cứng, ở giữa là không bào chứa đầy nước, còn những hạt xanh là lục lạp đang trôi vòng quanh.',
        compare: 'Tế bào lá to gấp đôi tế bào động vật, nhưng vẫn nhỏ hơn bề ngang sợi tóc.',
        accent: '#4ade80',
        glow: '#22c55e'
    },
    bacteria: {
        id: 'bacteria',
        specimen: 'Vi khuẩn',
        source: 'Tìm thấy trong một giọt nước',
        sizeLabel: '≈ 2 µm',
        umPerUnit: 1 / 2.5,
        tissue: 'Hàng trăm vi khuẩn bé xíu đang bơi trong giọt nước',
        arrive: 'Đây là một con vi khuẩn! Nó nhỏ hơn tế bào của em khoảng mười lần và không có nhân. Nhìn cái roi xoắn đang quay tít kìa!',
        compare: 'Khoảng 500 con vi khuẩn xếp hàng mới dài bằng 1 milimét.',
        accent: '#fbbf24',
        glow: '#f59e0b'
    }
};

// Kính hiển vi quang học phóng đại hữu ích tối đa ~×1.500–2.000; lớn hơn phải dùng kính điện tử
export const LIGHT_MICROSCOPE_LIMIT = 2000;
