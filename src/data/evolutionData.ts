import { EvolutionNode } from './evolution/types';
import { bacteria, archaea } from './evolution/prokaryotes';

// Re-export type for consumers
export type { EvolutionNode, EvolutionMilestone, GalleryItem } from './evolution/types';

// Cây phát sinh chủng loại 2 lãnh giới: nhân thực mọc ra từ cổ khuẩn Asgard (xem docs/evolution-tree-wow/data-spec.md).
const luca: EvolutionNode = {
    id: "luca",
    label: "Tổ tiên chung cuối cùng (LUCA)",
    englishLabel: "LUCA",
    type: "domain",
    description: "Last Universal Common Ancestor - Tổ tiên chung của tất cả sinh vật hiện nay. Một nghiên cứu năm 2024 ước tính LUCA sống khoảng 4,2 tỷ năm trước.",
    era: "Archean",
    color: "#0891b2",
    traits: ["DNA/RNA", "Màng tế bào", "Tổng hợp protein"],
    milestone: {
        label: "Sự Sống Đầu Tiên",
        year: "khoảng 4 tỷ năm trước"
    },
    infographicUrl: "evolution/LUCA.jpeg",
    children: [bacteria, archaea]
};

export const EVOLUTION_TREE_DATA: EvolutionNode = {
    id: "life_origin",
    label: "Nguồn Gốc Sự Sống",
    englishLabel: "Origin of Life",
    type: "root",
    description: "Khởi đầu của mọi sự sống trên Trái Đất. Từ những hợp chất hữu cơ đơn giản trong \"nồi súp nguyên thủy\".",
    era: "Hadean / Archean",
    color: "#0ea5e9",
    traits: ["Hóa học tiền sinh học"],
    infographicUrl: "evolution/Origin of life.jpeg",
    children: [luca]
};
