import type { CellId } from './cellStory';

// Trò "Truy tìm bào quan": giọng đọc gợi ý, bé chạm ĐÚNG hình khối trên mô hình 3D (nhãn ẩn đi).
// Mỗi loại tế bào một bộ câu; mỗi lượt chơi rút ngẫu nhiên FIND_ROUNDS câu. Không phạt khi sai —
// bào quan bị chạm tự giới thiệu ("Tớ là...") rồi cho thử lại.
export interface FindPrompt {
    target: string;   // id bào quan cần tìm
    easy: string;     // gợi ý cho bé nhỏ (so sánh vui)
    hard: string;     // gợi ý theo chức năng (lớp 3 trở lên)
}

export const FIND_ROUNDS = 5;
export const CELL_BADGE_STARS = 10;

export const FIND_PROMPTS: Record<CellId, FindPrompt[]> = {
    animal: [
        { target: 'nucleus', easy: 'Tìm trung tâm điều khiển của tế bào!', hard: 'Bộ phận nào cất giữ ADN và ra lệnh cho cả tế bào?' },
        { target: 'mitochondria', easy: 'Tìm nhà máy điện của tế bào!', hard: 'Bộ phận nào biến đường thành năng lượng?' },
        { target: 'golgi', easy: 'Tìm bưu điện đóng gói hàng!', hard: 'Bộ phận nào đóng gói protein rồi gửi đi nơi khác?' },
        { target: 'lysosome', easy: 'Tìm đội dọn rác của tế bào!', hard: 'Bộ phận nào tiêu hóa chất thải và bào quan già cỗi?' },
        { target: 'er', easy: 'Tìm băng chuyền sản xuất quấn quanh nhân!', hard: 'Hệ thống túi dẹt và ống nào nối liền với nhân để vận chuyển chất?' },
        { target: 'centrosome', easy: 'Tìm người chỉ huy lúc tế bào phân chia!', hard: 'Bộ phận nào gồm 2 trung tử xếp vuông góc?' },
        { target: 'plasma_membrane', easy: 'Tìm cổng an ninh bọc quanh tế bào!', hard: 'Lớp nào kiểm soát chất ra vào tế bào?' }
        // ribôxôm, bộ khung tế bào: hình quá nhỏ/mảnh để ngón tay bé chạm trúng → không đưa vào trò chơi
    ],
    plant: [
        { target: 'chloroplast', easy: 'Tìm bếp nấu ăn bằng ánh nắng!', hard: 'Bộ phận nào quang hợp, tạo ra đường và khí ôxi?' },
        { target: 'vacuole', easy: 'Tìm kho chứa nước khổng lồ!', hard: 'Bộ phận nào chiếm phần lớn thể tích và giữ cho tế bào căng phồng?' },
        { target: 'cell_wall', easy: 'Tìm bức tường cứng bao ngoài cùng!', hard: 'Lớp nào làm bằng xenlulôzơ giúp cây đứng thẳng?' },
        { target: 'nucleus', easy: 'Tìm trung tâm điều khiển bị đẩy ra sát mép!', hard: 'Bộ phận nào chứa ADN của tế bào thực vật?' },
        { target: 'mitochondria', easy: 'Tìm nhà máy điện của cây!', hard: 'Bộ phận nào hô hấp tạo năng lượng, kể cả ban đêm?' },
        { target: 'golgi', easy: 'Tìm bưu điện đóng gói hàng!', hard: 'Bộ phận nào chế biến và đóng gói protein?' }
    ],
    bacteria: [
        { target: 'flagellum', easy: 'Tìm cái chân vịt giúp vi khuẩn bơi!', hard: 'Bộ phận nào xoay tròn để đẩy vi khuẩn đi?' },
        { target: 'nucleoid', easy: 'Tìm cuộn chỉ ADN không có vỏ bọc!', hard: 'Vùng nào chứa ADN vòng của vi khuẩn?' },
        { target: 'capsule', easy: 'Tìm chiếc áo khoác nhầy ngoài cùng!', hard: 'Lớp nào giúp vi khuẩn bám dính và trốn hệ miễn dịch?' },
        { target: 'pili', easy: 'Tìm những cánh tay bám bé xíu!', hard: 'Những sợi ngắn nào giúp vi khuẩn bám vào bề mặt?' },
        { target: 'plasmid', easy: 'Tìm chiếc nhẫn ADN tí hon!', hard: 'Vòng ADN nhỏ nào nằm riêng ngoài vùng nhân?' }
    ]
};
