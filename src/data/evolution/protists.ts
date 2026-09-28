// Tái cấu trúc 28/09/2026 (GĐ0) theo docs/evolution-tree-wow/target-tree.txt + data-spec.md.
// Sửa trực tiếp file này; engine/engine.test.ts kiểm cấu trúc khớp target-tree.txt (sửa cây thì sửa cả dàn ý).
import { EvolutionNode } from './types';

export const amoebozoa: EvolutionNode = {
    id: "amoebozoa",
    label: "Amip & nấm nhầy",
    englishLabel: "Amoebozoa",
    type: "clade",
    description: "Nguyên sinh vật di chuyển bằng chân giả, gồm các loài amip và nấm nhầy.",
    era: "Nguyên Sinh",
    color: "#c084fc",
    traits: ["Chân giả", "Không có vỏ cứng"],
    children: [
        {
            id: "amoebas",
            label: "Trùng amip",
            englishLabel: "Amoebas",
            type: "class",
            description: "Bậc thầy biến hình! Chúng di chuyển và bắt mồi bằng cách vươn ra các \"chân giả\" (pseudopods).",
            era: "1 tỷ năm trước",
            color: "#581c87",
            traits: ["Chân giả", "Biến hình liên tục", "Thực bào"],
            infographicUrl: "evolution/Amoebas.jpeg",
            children: [
                {
                    id: "amoeba_example",
                    label: "Amip (ví dụ)",
                    englishLabel: "Amoeba proteus",
                    type: "species",
                    description: "Một đại diện điển hình, thường sống trong nước ngọt và bùn ao.",
                    era: "Hiện đại",
                    color: "#3b0764",
                    traits: ["Kích thước lớn (so với vi khuẩn)", "Trong suốt"],
                    infographicUrl: "evolution/Amoeba proteus.jpeg"
                }
            ]
        },
        {
            id: "slime_molds",
            label: "Nấm nhầy",
            englishLabel: "Slime molds",
            type: "class",
            description: "Sinh vật kỳ quặc có thể \"bò\" tập thể để tìm thức ăn.",
            era: "Cổ đại",
            color: "#9a3412",
            traits: ["Hợp bào khổng lồ", "Di chuyển được", "Màu sắc sặc sỡ"],
            infographicUrl: "evolution/Slime molds.jpeg",
            children: [
                {
                    id: "physarum_example",
                    label: "Nấm nhầy Physarum",
                    englishLabel: "Physarum polycephalum",
                    type: "species",
                    description: "Có khả năng giải mê cung để tìm thức ăn dù không có não!",
                    era: "Hiện đại",
                    color: "#7c2d12",
                    traits: ["Thông minh không não", "Màu vàng tươi"],
                    infographicUrl: "evolution/Physarum polycephalum.jpeg"
                }
            ]
        }
    ]
};

export const sar: EvolutionNode = {
    id: "sar",
    label: "Nhánh SAR",
    englishLabel: "SAR (Stramenopiles, Alveolata, Rhizaria)",
    type: "clade",
    description: "Một nhánh nhân thực rất đông, gồm tảo bẹ, tảo cát, nấm nước, trùng giày và ký sinh trùng sốt rét.",
    era: "Nguyên Sinh",
    color: "#c084fc",
    traits: ["Rất đa dạng", "Phần lớn sống dưới nước"],
    children: [
        {
            id: "stramenopiles",
            label: "Tảo nâu, tảo cát & nấm nước",
            englishLabel: "Stramenopiles",
            type: "clade",
            description: "Tế bào bơi của nhóm này có một roi phủ đầy lông nhỏ. Gồm tảo bẹ, tảo cát và nấm nước. Nấm nước không phải nấm thật!",
            era: "Nguyên Sinh",
            color: "#a78bfa",
            traits: ["Roi có lông", "Nhiều loài quang hợp"],
            children: [
                {
                    id: "brown_algae",
                    label: "Tảo nâu",
                    englishLabel: "Brown algae",
                    type: "class",
                    description: "Những gã khổng lồ dưới biển, tạo nên những \"rừng tảo\" hùng vĩ.",
                    era: "Jurassic",
                    color: "#854d0e",
                    traits: ["Đa bào phức tạp", "Sắc tố nâu (Fucoxanthin)", "Kích thước lớn"],
                    infographicUrl: "evolution/Brown algae.jpeg",
                    children: [
                        {
                            id: "kelp_example",
                            label: "Rong biển Kelp",
                            englishLabel: "Kelp",
                            type: "species",
                            description: "Có thể mọc dài tới 60 mét, tạo môi trường sống cho rái cá biển.",
                            era: "Hiện đại",
                            color: "#713f12",
                            traits: ["Siêu lớn", "Tăng trưởng cực nhanh"],
                            infographicUrl: "evolution/kelp.jpeg"
                        }
                    ]
                },
                {
                    id: "diatoms",
                    label: "Tảo cát",
                    englishLabel: "Diatoms",
                    type: "class",
                    description: "Những viên ngọc quý của biển cả với lớp vỏ thủy tinh tinh xảo.",
                    era: "Jurassic",
                    color: "#b45309",
                    traits: ["Vỏ Silic (Thủy tinh)", "Đối xứng hoàn hảo", "Phù du sinh vật"],
                    infographicUrl: "evolution/Diatoms.jpeg",
                    children: [
                        {
                            id: "diatom_example",
                            label: "Tảo cát",
                            englishLabel: "Diatom",
                            type: "species",
                            description: "Tạo ra 20% lượng oxy trên Trái Đất.",
                            era: "Hiện đại",
                            color: "#92400e",
                            traits: ["Sản xuất Oxy cực lớn", "Dùng lọc nước"],
                            infographicUrl: "evolution/Diatom.jpeg"
                        }
                    ]
                },
                {
                    id: "water_molds",
                    label: "Nấm nước",
                    englishLabel: "Water molds (Oomycetes)",
                    type: "class",
                    description: "Kẻ thù của cá và cây trồng. Sống trong nước hoặc đất ẩm.",
                    era: "Cổ đại",
                    color: "#9a3412",
                    traits: ["Sợi nấm", "Thành Cellulose (Nấm thật là Chitin)", "Ký sinh thực vật"],
                    infographicUrl: "evolution/Water molds (Oomycetes).jpeg",
                    children: [
                        {
                            id: "phytophthora_example",
                            label: "Nấm mốc sương",
                            englishLabel: "Phytophthora",
                            type: "species",
                            description: "Thủ phạm gây ra Nạn đói khoai tây Ireland lịch sử.",
                            era: "Hiện đại",
                            color: "#7c2d12",
                            traits: ["Gây bệnh cây trồng", "Lây lan nhanh"],
                            infographicUrl: "evolution/Phytophthora.jpeg"
                        }
                    ]
                }
            ]
        },
        {
            id: "alveolates",
            label: "Trùng giày & ký sinh trùng sốt rét",
            englishLabel: "Alveolata",
            type: "clade",
            description: "Tế bào có những túi nhỏ nằm ngay dưới màng. Gồm trùng giày và ký sinh trùng sốt rét.",
            era: "Nguyên Sinh",
            color: "#a78bfa",
            traits: ["Túi dưới màng", "Đơn bào"],
            children: [
                {
                    id: "ciliates",
                    label: "Trùng lông bơi",
                    englishLabel: "Ciliates",
                    type: "class",
                    description: "Những tay bơi lội cự phách, phủ đầy lông nhỏ rung động nhịp nhàng để di chuyển và lùa thức ăn.",
                    era: "800 triệu năm trước",
                    color: "#581c87",
                    traits: ["Lông bơi (Cilia)", "2 nhân tế bào", "Không bào co bóp"],
                    infographicUrl: "evolution/Ciliates.jpeg",
                    children: [
                        {
                            id: "paramecium_example",
                            label: "Trùng giày",
                            englishLabel: "Paramecium",
                            type: "species",
                            description: "Có hình dạng giống chiếc giày, bơi rất nhanh và lôi cuốn.",
                            era: "Hiện đại",
                            color: "#3b0764",
                            traits: ["Hình đế giày", "Rất phổ biến"],
                            infographicUrl: "evolution/Paramecium.jpeg"
                        }
                    ]
                },
                {
                    id: "sporozoans",
                    label: "Ký sinh bào tử",
                    englishLabel: "Sporozoans",
                    type: "class",
                    description: "Những kẻ \"di cư\" nguy hiểm, sống ký sinh trong cơ thể vật chủ và sinh sản bằng bào tử.",
                    era: "Tiến hóa muộn hơn",
                    color: "#581c87",
                    traits: ["Ký sinh bắt buộc", "Không bộ phận di chuyển", "Vòng đời phức tạp"],
                    infographicUrl: "evolution/Sporozoans.jpeg",
                    children: [
                        {
                            id: "plasmodium_example",
                            label: "Ký sinh trùng sốt rét",
                            englishLabel: "Plasmodium",
                            type: "species",
                            description: "Thủ phạm gây bệnh sốt rét, truyền qua muỗi Anophen.",
                            era: "Hiện đại",
                            color: "#3b0764",
                            traits: ["Gây bệnh nguy hiểm", "Phá hủy hồng cầu"],
                            infographicUrl: "evolution/Plasmodium.jpeg"
                        }
                    ]
                }
            ]
        }
    ]
};

export const flagellates: EvolutionNode = {
    id: "flagellates",
    label: "Trùng roi",
    englishLabel: "Flagellates",
    type: "class",
    description: "Sử dụng một hoặc nhiều \"chiếc roi\" dài để bơi xoắn trong nước.",
    era: "1.5 tỷ năm trước",
    color: "#581c87",
    traits: ["Roi bơi (Flagella)", "Vừa tự dưỡng vừa dị dưỡng"],
    infographicUrl: "evolution/Flagellates.jpeg",
    children: [
        {
            id: "euglena_example",
            label: "Trùng roi xanh",
            englishLabel: "Euglena",
            type: "species",
            description: "Sinh vật kỳ thú: Có lục lạp để quang hợp như cây, nhưng bơi được như thú.",
            era: "Hiện đại",
            color: "#3b0764",
            traits: ["Điểm mắt đỏ", "Cảm quang"],
            infographicUrl: "evolution/Euglena.jpeg"
        }
    ]
};
