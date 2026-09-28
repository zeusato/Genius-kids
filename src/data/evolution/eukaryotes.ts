// Tái cấu trúc 28/09/2026 (GĐ0) theo docs/evolution-tree-wow/target-tree.txt + data-spec.md.
// Sửa trực tiếp file này; engine/engine.test.ts kiểm cấu trúc khớp target-tree.txt (sửa cây thì sửa cả dàn ý).
import { EvolutionNode } from './types';
import { amoebozoa } from './protists';
import { animalia } from './animals';
import { archaeplastida } from './plants';
import { flagellates } from './protists';
import { fungi } from './fungi';
import { sar } from './protists';

export const eukarya: EvolutionNode = {
    id: "eukarya",
    label: "Sinh vật nhân thực",
    englishLabel: "Eukarya (Eukaryotes)",
    type: "domain",
    description: "Sinh vật có tế bào chứa nhân và các bào quan có màng bao bọc. Theo nghiên cứu mới, tổ tiên của sinh vật nhân thực là một cổ khuẩn nhóm Asgard đã \"nuốt\" một vi khuẩn, về sau vi khuẩn ấy thành ty thể.",
    era: "Proterozoic",
    color: "#8b5cf6",
    traits: ["Nhân thực", "Bào quan phức tạp"],
    milestone: {
        label: "Xuất Hiện Nhân",
        year: "khoảng 1,6–2 tỷ năm trước"
    },
    infographicUrl: "evolution/Eukarya.jpeg",
    children: [
        {
            id: "amorphea",
            label: "Nhánh Amip – Nấm – Động vật",
            englishLabel: "Amorphea",
            type: "clade",
            description: "Nhánh sinh vật nhân thực gồm amip, nấm nhầy, nấm và động vật. Nghiên cứu ADN cho thấy chúng có chung một tổ tiên.",
            era: "Nguyên Sinh",
            color: "#c4b5fd",
            traits: ["Nhân thực", "Họ hàng xa của nhau"],
            children: [
                amoebozoa,
                {
                    id: "opisthokonta",
                    label: "Nhánh Nấm & Động vật",
                    englishLabel: "Opisthokonta",
                    type: "clade",
                    description: "Nấm gần với động vật hơn là với thực vật. Tế bào bơi của chúng, như tinh trùng hay bào tử nấm roi, bơi bằng một roi ở phía sau.",
                    era: "Nguyên Sinh",
                    color: "#fda4af",
                    traits: ["Roi đơn phía sau", "Dị dưỡng"],
                    children: [
                        fungi,
                        animalia
                    ]
                }
            ]
        },
        archaeplastida,
        sar,
        flagellates
    ]
};
