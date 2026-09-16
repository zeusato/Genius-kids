export type PreschoolTopic = 'alphabet' | 'counting' | 'colors';
export type ActivityArt = 'letters' | 'listen' | 'pairs' | 'word' | 'numbers' | 'count' | 'add' | 'compare' | 'palette' | 'paint' | 'shapes';
export interface ActivityDef { id: string; title: string; desc: string; art: ActivityArt; label: string }
export interface TopicDef {
    id: PreschoolTopic; title: string; shortTitle: string; headline: string; description: string;
    note: string; imageAlt: string; activities: ActivityDef[];
}
export const PRESCHOOL_TOPICS: TopicDef[] = [
    {
        id: 'alphabet', title: 'Bảng Chữ Cái', shortTitle: 'Chữ cái', headline: 'Chào những người bạn A–Z!',
        description: 'Nhìn chữ, nghe âm, tìm một người bạn mới. Cùng bé làm quen bảng chữ cái tiếng Anh.',
        note: '26 chữ cái · Nghe tiếng Anh và tiếng Việt', imageAlt: 'Bạn cáo bên những khối chữ cái bằng gỗ trong khu vườn',
        activities: [
            { id: 'learn', title: 'Học bảng chữ cái', desc: 'Lật thẻ A–Z và nghe cách đọc từng chữ.', art: 'letters', label: 'LÀM QUEN' },
            { id: 'pick', title: 'Nghe và chọn chữ', desc: 'Lắng nghe, rồi chạm vào chữ vừa được đọc.', art: 'listen', label: 'LẮNG NGHE' },
            { id: 'match', title: 'Ghép chữ hoa – thường', desc: 'Tìm bạn cho chữ A, chữ a và những chữ khác.', art: 'pairs', label: 'GHÉP ĐÔI' },
            { id: 'word', title: 'Tìm từ theo chữ cái', desc: 'Chọn từ bắt đầu bằng chữ cái bé đã biết.', art: 'word', label: 'KHÁM PHÁ' },
        ],
    },
    {
        id: 'counting', title: 'Đếm Số', shortTitle: 'Đếm số', headline: 'Một, hai, ba… cùng đếm nhé!',
        description: 'Đếm những đồ vật quanh mình, ghép thêm một chút và khám phá điều kỳ diệu của các con số.',
        note: 'Số từ 1 đến 10 · Cộng và so sánh', imageAlt: 'Bạn thỏ bên các khối số và bàn tính đồ chơi bằng gỗ',
        activities: [
            { id: 'learn', title: 'Học đếm 1 đến 10', desc: 'Nhìn số, đếm vật và nghe đọc Anh – Việt.', art: 'numbers', label: 'LÀM QUEN' },
            { id: 'count', title: 'Đếm đồ vật', desc: 'Có bao nhiêu bạn nhỏ? Đếm rồi chọn số nhé.', art: 'count', label: 'TẬP ĐẾM' },
            { id: 'pick', title: 'Nghe và chọn số', desc: 'Lắng nghe, rồi tìm đúng con số vừa được đọc.', art: 'listen', label: 'LẮNG NGHE' },
            { id: 'add', title: 'Học phép cộng', desc: 'Gộp hai nhóm đồ vật, tập cộng trong phạm vi 10.', art: 'add', label: 'THỬ SỨC' },
            { id: 'compare', title: 'So sánh', desc: 'Tìm bên nhiều hơn, ít hơn, dài hơn hoặc ngắn hơn.', art: 'compare', label: 'QUAN SÁT' },
        ],
    },
    {
        id: 'colors', title: 'Màu Sắc & Hình Dạng', shortTitle: 'Màu & hình', headline: 'Một thế giới đầy sắc màu!',
        description: 'Chạm một màu, nhận ra một hình. Cùng bé tô điểm thế giới bằng những khám phá nhỏ xinh.',
        note: 'Nhận biết màu sắc · Làm quen hình dạng', imageAlt: 'Bạn gấu bên cầu vồng gỗ, bảng màu và những khối hình đồ chơi',
        activities: [
            { id: 'learn', title: 'Học màu sắc', desc: 'Chạm ô màu và nghe tên màu bằng Anh – Việt.', art: 'palette', label: 'LÀM QUEN' },
            { id: 'pick', title: 'Nghe và chọn màu', desc: 'Lắng nghe tên màu, rồi chạm ô màu tương ứng.', art: 'listen', label: 'LẮNG NGHE' },
            { id: 'color', title: 'Tô màu theo yêu cầu', desc: 'Nghe hướng dẫn và chọn màu để tô hình.', art: 'paint', label: 'SÁNG TẠO' },
            { id: 'shapes', title: 'Học hình dạng', desc: 'Tìm hình tròn, hình vuông, hình tam giác…', art: 'shapes', label: 'QUAN SÁT' },
        ],
    },
];
export const topicFor = (id: PreschoolTopic) => PRESCHOOL_TOPICS.find(topic => topic.id === id)!;
export const activityFor = (topic: PreschoolTopic, id: string | null) => topicFor(topic).activities.find(activity => activity.id === id) ?? null;
export const preschoolArt = (topic: PreschoolTopic, small = false) => `${import.meta.env.BASE_URL}hub/art/preschool-${topic}${small ? '-sm' : ''}.webp`;
