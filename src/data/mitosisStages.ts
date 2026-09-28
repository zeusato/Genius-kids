// Các bước phân chia tế bào (nguyên phân) cho thí nghiệm "Phân chia tế bào" — lời lẽ cho bé tiểu học,
// tên kỳ theo SGK (kỳ đầu/giữa/sau/cuối). Mốc t chia dòng thời gian 0..1 của mô phỏng.

export interface MitosisStage {
    from: number;
    title: string;
    phase: string;
    text: string;
}

export const MITOSIS_STAGES: MitosisStage[] = [
    { from: 0, phase: 'Chuẩn bị', title: 'Tế bào lớn lên, ADN nhân đôi', text: 'Trước khi chia, tế bào lớn thêm một chút và sao chép toàn bộ ADN — để mỗi tế bào con đều có đủ "sách hướng dẫn".' },
    { from: 0.14, phase: 'Kỳ đầu', title: 'ADN cuộn lại thành nhiễm sắc thể', text: 'Sợi ADN dài cuộn chặt thành những chiếc "chữ X" gọi là nhiễm sắc thể. Màng nhân tan ra, hai trung thể đi về hai phía.' },
    { from: 0.3, phase: 'Kỳ giữa', title: 'Nhiễm sắc thể xếp hàng ở giữa', text: 'Thoi phân bào (những sợi mảnh từ hai trung thể) móc vào từng nhiễm sắc thể và kéo chúng xếp thẳng hàng giữa tế bào.' },
    { from: 0.48, phase: 'Kỳ sau', title: 'Kéo đều về hai phía', text: 'Mỗi chữ X tách đôi. Một nửa bị kéo về bên trái, nửa kia về bên phải — chia đều tuyệt đối!' },
    { from: 0.64, phase: 'Kỳ cuối', title: 'Hai nhân mới, tế bào thắt lại', text: 'Ở mỗi đầu, màng nhân mới bọc lấy bộ nhiễm sắc thể. Màng tế bào thắt lại ở giữa như sợi dây buộc quả bóng.' },
    { from: 0.84, phase: 'Hoàn thành', title: '1 tế bào → 2 tế bào con giống hệt nhau', text: 'Hai tế bào con ra đời, mỗi tế bào có đủ bộ ADN. Cơ thể em lớn lên nhờ hàng tỉ lần phân chia như thế!' }
];

export function stageAt(t: number): number {
    let i = 0;
    for (let k = 0; k < MITOSIS_STAGES.length; k++) if (t >= MITOSIS_STAGES[k].from) i = k;
    return i;
}

// Thời lượng tự chạy trọn vẹn (giây) — đủ chậm để đọc/nghe từng bước
export const MITOSIS_DURATION = 30;
