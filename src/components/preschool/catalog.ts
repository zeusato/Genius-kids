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
            { id: 'learn', title: 'Học bảng chữ cái', desc: 'Khám phá A–Z, tập tô từng nét và sưu tầm sticker cùng Cáo.', art: 'letters', label: 'LÀM QUEN' },
            { id: 'pick', title: 'Nghe và chọn chữ', desc: 'Soát đúng vé chữ để đưa các bạn nhỏ lên tàu.', art: 'listen', label: 'GA ÂM THANH' },
            { id: 'match', title: 'Ghép chữ hoa – thường', desc: 'Giao thư chữ hoa đến đúng ngôi nhà chữ thường.', art: 'pairs', label: 'BƯU ĐIỆN' },
            { id: 'word', title: 'Tìm từ theo chữ cái', desc: 'Tìm đồ vật đúng chữ đầu và đặt vào giỏ của Cáo.', art: 'word', label: 'GIỎ KHÁM PHÁ' },
        ],
    },
    {
        id: 'counting', title: 'Đếm Số', shortTitle: 'Đếm số', headline: 'Chuyến phiêu lưu trên Đảo số',
        description: 'Đếm những đồ vật quanh mình, ghép thêm một chút và khám phá điều kỳ diệu của các con số.',
        note: 'Số từ 1 đến 10 · Cộng và so sánh', imageAlt: 'Bạn thỏ bên các khối số và bàn tính đồ chơi bằng gỗ',
        activities: [
            { id: 'learn', title: 'Học đếm 1 đến 10', desc: 'Mười hòn đảo, mười khám phá. Đếm, tập tô và nhận sticker.', art: 'numbers', label: 'ĐẢO KHÁM PHÁ' },
            { id: 'count', title: 'Đếm đồ vật', desc: 'Thu hoạch từng món vào giỏ rồi tìm số lượng.', art: 'count', label: 'VƯỜN THU HOẠCH' },
            { id: 'pick', title: 'Nghe và chọn số', desc: 'Nghe tên số để giúp chiếc thuyền ra khơi.', art: 'listen', label: 'BẾN THUYỀN' },
            { id: 'add', title: 'Học phép cộng', desc: 'Gộp hai khay bánh, đếm xem có tất cả bao nhiêu.', art: 'add', label: 'TIỆM BÁNH' },
            { id: 'compare', title: 'So sánh', desc: 'Nhiều/ít, lớn/nhỏ, dài/ngắn, cao/thấp, to/nhỏ và bằng nhau.', art: 'compare', label: 'SÂN CHƠI' },
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
