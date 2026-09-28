// Các mốc lớn của cỗ máy thời gian (data-spec mục I). ma = triệu năm trước.
export type FxId = 'lava' | 'spark' | 'oxygen-sky' | 'symbiosis-mito' | 'frost' | 'burst' | 'green-haze' | 'great-dying' | 'impact' | 'you-are-here';

export interface TimeEvent {
    id: string;
    ma: number;
    toMa?: number;      // sự kiện kéo dài (vd Trái Đất quả cầu tuyết 717–635)
    title: string;
    text: string;
    icon: string;
    fx?: FxId;
}

export const TIME_EVENTS: TimeEvent[] = [
    { id: 'earth', ma: 4540, title: 'Trái Đất ra đời', text: 'Trái Đất còn nóng rực, mưa sao băng liên tục.', icon: '🌋', fx: 'lava' },
    { id: 'luca', ma: 4200, title: 'Tổ tiên chung của mọi sự sống', text: 'Mọi sinh vật hôm nay đều bắt nguồn từ tổ tiên nhỏ xíu này.', icon: '✨', fx: 'spark' },
    { id: 'stromatolite', ma: 3480, title: 'Hóa thạch cổ nhất', text: 'Vi khuẩn xây những "gò đá" dưới biển, nay vẫn còn hóa thạch.', icon: '🪨' },
    { id: 'goe', ma: 2400, toMa: 2000, title: 'Ôxi xuất hiện', text: 'Vi khuẩn lam thải ôxi, không khí dần có ôxi như bây giờ.', icon: '💨', fx: 'oxygen-sky' },
    { id: 'eukaryote', ma: 1800, title: 'Tế bào có nhân ra đời', text: 'Một cổ khuẩn "nuốt" một vi khuẩn, và ty thể ra đời!', icon: '🦠', fx: 'symbiosis-mito' },
    { id: 'snowball', ma: 717, toMa: 635, title: 'Trái Đất quả cầu tuyết', text: 'Băng phủ gần kín Trái Đất suốt hàng chục triệu năm.', icon: '❄️', fx: 'frost' },
    { id: 'cambrian', ma: 538.8, title: 'Bùng nổ kỷ Cambri', text: 'Rất nhiều loài động vật mới xuất hiện gần như cùng lúc!', icon: '💥', fx: 'burst' },
    { id: 'land', ma: 470, title: 'Cây lên cạn', text: 'Những cây rêu đầu tiên phủ xanh mặt đất.', icon: '🌱', fx: 'green-haze' },
    { id: 'tetrapod', ma: 375, title: 'Cá bước lên bờ', text: 'Cá vây thùy như Tiktaalik chống vây bò lên bờ.', icon: '🐟' },
    { id: 'great_dying', ma: 251.9, title: 'Đại tuyệt chủng Permi', text: 'Phần lớn sinh vật biển biến mất, trong đó có bọ ba thùy.', icon: '☠️', fx: 'great-dying' },
    { id: 'dinos', ma: 233, title: 'Khủng long xuất hiện', text: 'Những con khủng long đầu tiên chạy bằng hai chân.', icon: '🦖' },
    { id: 'kpg', ma: 66, title: 'Thiên thạch!', text: 'Một thiên thạch lớn lao xuống. Khủng long (trừ chim) và cúc đá biến mất.', icon: '☄️', fx: 'impact' },
    { id: 'humans', ma: 0.3, title: 'Loài người xuất hiện', text: 'Đây là chúng ta, một ngọn rất mới trên cây sự sống.', icon: '🧒', fx: 'you-are-here' },
];
