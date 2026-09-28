// Lớp phủ "Nhóm theo SGK" (data-spec mục G): các nhóm quen thuộc trong sách giáo khoa nhưng KHÔNG
// phải một nhánh trọn vẹn trên cây phát sinh — tô hào quang quanh các cây con thành viên.
// description/infographicUrl chép từ node cũ đã rời khỏi cây (scripts/evo-restructure/removed-nodes.json).

export interface TextbookPart { label: string; color: string; members: string[] }
export interface TextbookGroup {
    id: string;
    label: string;
    color: string;
    kind: 'system' | 'group';
    members?: string[];
    parts?: TextbookPart[];
    description: string;
    why: string;
    infographicUrl?: string;
}

const ARCHAEA_SGK = ['euryarchaeota', 'crenarchaeota_simple', 'thaumarchaeota', 'lokiarchaeota_simple'];
const PROTISTS = ['amoebozoa', 'sar', 'flagellates', 'red_algae', 'green_algae', 'algae_plants_bridge'];

export const TEXTBOOK_GROUPS: TextbookGroup[] = [
    {
        id: 'domains3', label: '3 lãnh giới (SGK)', color: '#fde68a', kind: 'system',
        parts: [
            { label: 'Vi khuẩn', color: '#38bdf8', members: ['bacteria'] },
            { label: 'Cổ khuẩn', color: '#cbd5e1', members: ARCHAEA_SGK },
            { label: 'Nhân thực', color: '#c084fc', members: ['eukarya'] },
        ],
        description: 'Cách chia sự sống thành ba lãnh giới lớn: Vi khuẩn, Cổ khuẩn và Nhân thực.',
        why: 'Nghiên cứu mới cho thấy nhân thực mọc ra từ bên trong cổ khuẩn, nên "cổ khuẩn" theo SGK không còn là một nhánh trọn vẹn.',
    },
    {
        id: 'kingdoms5', label: '5 giới (KHTN 6)', color: '#fde68a', kind: 'system',
        parts: [
            { label: 'Khởi sinh', color: '#38bdf8', members: ['bacteria', ...ARCHAEA_SGK] },
            { label: 'Nguyên sinh', color: '#c084fc', members: PROTISTS },
            { label: 'Nấm', color: '#fbbf24', members: ['fungi_simple'] },
            { label: 'Thực vật', color: '#4ade80', members: ['land_plants'] },
            { label: 'Động vật', color: '#fb7185', members: ['animalia'] },
        ],
        description: 'Năm giới sinh vật trong sách Khoa học tự nhiên 6: Khởi sinh, Nguyên sinh, Nấm, Thực vật, Động vật.',
        why: 'Chia theo cách sống cho dễ học. "Khởi sinh" và "Nguyên sinh" gồm nhiều nhánh xa nhau.',
    },
    {
        id: 'invertebrates', label: 'Động vật không xương sống', color: '#fda4af', kind: 'group',
        members: ['porifera', 'cnidaria', 'protostomes', 'echinodermata'],
        description: 'Nhóm động vật không có cột sống, chiếm 97% tổng số loài động vật.',
        why: 'Gồm mọi động vật trừ nhánh có xương sống. Sao biển còn gần chúng ta hơn gần sứa.',
        infographicUrl: 'evolution/Invertebrates.jpeg',
    },
    {
        id: 'fish', label: 'Cá', color: '#fb7185', kind: 'group',
        members: ['jawless_fish', 'cartilaginous_fish', 'ray_finned_fish', 'coelacanths', 'lungfish'],
        description: 'Động vật biến nhiệt, sống dưới nước, hô hấp bằng mang.',
        why: 'Động vật bốn chân mọc ra từ bên trong nhóm cá, nên "cá" không phải một nhánh trọn vẹn.',
        infographicUrl: 'evolution/Fish.jpeg',
    },
    {
        id: 'reptiles_sgk', label: 'Bò sát (SGK)', color: '#f87171', kind: 'group',
        members: ['testudines', 'lepidosauria', 'crocodilians', 'ornithischia', 'sauropods', 'trex'],
        description: 'Động vật biến nhiệt, da khô có vảy: rùa, thằn lằn, rắn, cá sấu và khủng long.',
        why: 'Chim là hậu duệ của khủng long, nên nhóm bò sát không có chim sẽ thiếu một phần.',
        infographicUrl: 'evolution/Reptiles.jpeg',
    },
    {
        id: 'protists', label: 'Nguyên sinh vật', color: '#c084fc', kind: 'group',
        members: PROTISTS,
        description: 'Những sinh vật nhân thực đa dạng từ vi sinh vật đơn bào đến tảo khổng lồ. Một số là họ hàng gần của nấm, cây hoặc động vật.',
        why: 'Tên gọi chung cho sinh vật nhân thực không phải nấm, thực vật hay động vật. Chúng nằm rải rác khắp cây.',
        infographicUrl: 'evolution/Protists.jpeg',
    },
    {
        id: 'protozoa', label: 'Nguyên sinh động vật', color: '#a78bfa', kind: 'group',
        members: ['amoebas', 'ciliates', 'sporozoans', 'flagellates'],
        description: 'Những "thợ săn" tí hon trong thế giới vi mô. Chúng di chuyển tích cực để tìm kiếm thức ăn giống như động vật.',
        why: 'Gộp theo cách sống (săn mồi, di chuyển). Amip gần nấm hơn gần trùng giày.',
        infographicUrl: 'evolution/Animal-like Protists (Protozoa).jpeg',
    },
    {
        id: 'algae', label: 'Tảo', color: '#2dd4bf', kind: 'group',
        members: ['red_algae', 'green_algae', 'algae_plants_bridge', 'brown_algae', 'diatoms'],
        description: 'Những "nhà máy oxy" của đại dương. Chúng quang hợp giống thực vật nhưng cấu trúc đơn giản hơn.',
        why: 'Tảo bẹ và tảo cát ở nhánh SAR, xa tảo lục và cây xanh.',
        infographicUrl: 'evolution/Algae.jpeg',
    },
    {
        id: 'funguslike', label: 'Nguyên sinh giống nấm', color: '#fb923c', kind: 'group',
        members: ['slime_molds', 'water_molds'],
        description: 'Trông giống nấm mốc nhưng thực ra là nguyên sinh vật. Chúng thường phân hủy xác bã hữu cơ.',
        why: 'Nấm nhầy thuộc nhánh amip, nấm nước thuộc nhánh tảo nâu.',
        infographicUrl: 'evolution/Fungus-like Protists.jpeg',
    },
    {
        id: 'worms', label: 'Giun', color: '#e879f9', kind: 'group',
        members: ['flatworms', 'roundworms', 'segmented_worms'],
        description: 'Nhóm động vật không xương sống có cơ thể dài, mềm. Gồm 3 ngành chính.',
        why: 'Giun tròn gần côn trùng hơn gần giun đất.',
        infographicUrl: 'evolution/Worms.jpeg',
    },
    {
        id: 'molds', label: 'Nấm mốc', color: '#fb923c', kind: 'group',
        members: ['zygomycetes_simple', 'penicillium_example'],
        description: 'Những kẻ "xâm chiếm" nhanh chóng. Chúng tạo ra mạng lưới sợi nấm chằng chịt, thường gặp trên thực phẩm để lâu.',
        why: '"Mốc" là một kiểu sống, có ở nhiều nhánh nấm.',
        infographicUrl: 'evolution/Molds.jpeg',
    },
    {
        id: 'yeasts', label: 'Nấm men', color: '#facc15', kind: 'group',
        members: ['baker_yeast_example'],
        description: 'Nấm đơn bào quan trọng nhất với loài người. Không có sợi nấm.',
        why: 'Nấm men đơn bào xuất hiện ở cả nấm túi lẫn nấm đảm.',
        infographicUrl: 'evolution/Yeasts.jpeg',
    },
    {
        id: 'mushrooms', label: 'Nấm lớn', color: '#fbbf24', kind: 'group',
        members: ['basidiomycota_simple', 'morels_truffles_example'],
        description: 'Những cây dù của rừng thẳm. Có mũ nấm, chân nấm và phiến nấm chứa bào tử.',
        why: 'Nấm cục và nấm bụng dê là nấm túi, không cùng nhánh với nấm mỡ.',
        infographicUrl: 'evolution/Mushrooms (Basidiomycota).jpeg',
    },
    {
        id: 'hoofed', label: 'Thú móng guốc (SGK)', color: '#fda4af', kind: 'group',
        members: ['odd_toed', 'cows_deer', 'pigs', 'hippos'],
        description: 'Ngựa, bò, hươu, lợn… đi bằng móng guốc.',
        why: 'Cá voi mọc ra từ bên trong nhóm guốc chẵn.',
        infographicUrl: 'evolution/Hoofed Mammals.jpeg',
    },
    {
        id: 'radial', label: 'Đối xứng tỏa tròn', color: '#f9a8d4', kind: 'group',
        members: ['cnidaria', 'echinodermata'],
        description: 'Cơ thể có tính đối xứng tỏa tròn, thường có hai lớp mầm (diploblastic).',
        why: 'Sao biển tỏa tròn khi lớn, nhưng ấu trùng của nó đối xứng hai bên như chúng ta.',
        infographicUrl: 'evolution/Radiata.jpeg',
    },
];

/** Cộng sinh nội bào (data-spec H) — vẽ thành cung sáng từ vi khuẩn tới nhánh nhân thực. */
export interface Symbiosis { id: 'mito' | 'chloro'; from: string; to: string; ma: number; label: string; text: string }
export const SYMBIOSES: Symbiosis[] = [
    { id: 'mito', from: 'alpha_proteobacteria', to: 'eukarya', ma: 1800, label: 'Ty thể', text: 'Một vi khuẩn bị "nuốt" nhưng ở lại sống chung và trở thành ty thể, nhà máy năng lượng trong mọi tế bào có nhân.' },
    { id: 'chloro', from: 'cyanobacteria', to: 'archaeplastida', ma: 1600, label: 'Lục lạp', text: 'Một vi khuẩn lam bị nuốt rồi trở thành lục lạp, nhờ vậy cây xanh quang hợp được.' },
];
