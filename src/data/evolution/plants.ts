// Tái cấu trúc 28/09/2026 (GĐ0) theo docs/evolution-tree-wow/target-tree.txt + data-spec.md.
// Sửa trực tiếp file này; engine/engine.test.ts kiểm cấu trúc khớp target-tree.txt (sửa cây thì sửa cả dàn ý).
import { EvolutionNode } from './types';

export const archaeplastida: EvolutionNode = {
    id: "archaeplastida",
    label: "Nhánh thực vật & tảo đỏ",
    englishLabel: "Archaeplastida",
    type: "clade",
    description: "Tổ tiên của nhánh này đã \"nuốt\" một vi khuẩn lam và biến nó thành lục lạp. Gồm tảo đỏ, tảo lục và thực vật.",
    era: "Nguyên Sinh",
    color: "#86efac",
    traits: ["Lục lạp gốc vi khuẩn lam", "Quang hợp"],
    children: [
        {
            id: "red_algae",
            label: "Tảo đỏ",
            englishLabel: "Red algae",
            type: "class",
            description: "Sống ở những vùng nước sâu nơi ánh sáng xanh dương xuyên tới được.",
            era: "1.2 tỷ năm trước",
            color: "#be185d",
            traits: ["Sắc tố đỏ (Phycoerythrin)", "Không có roi bơi", "Làm thạch (Agar)"],
            infographicUrl: "evolution/red algae.jpeg",
            children: [
                {
                    id: "red_algae_example",
                    label: "Rong đỏ",
                    englishLabel: "Rhodophyta",
                    type: "species",
                    description: "Dùng làm thực phẩm (Nori cuốn sushi) và công nghiệp.",
                    era: "Hiện đại",
                    color: "#9d174d",
                    traits: ["Ăn được", "Tạo rạn san hô"],
                    infographicUrl: "evolution/Rhodophyta.jpeg"
                }
            ]
        },
        {
            id: "viridiplantae",
            label: "Thực vật xanh",
            englishLabel: "Green plants (Viridiplantae)",
            type: "clade",
            description: "Tảo lục và thực vật trên cạn đều có diệp lục a và b và dự trữ tinh bột.",
            era: "Nguyên Sinh",
            color: "#4ade80",
            traits: ["Diệp lục a & b", "Dự trữ tinh bột"],
            children: [
                {
                    id: "green_algae",
                    label: "Tảo xanh",
                    englishLabel: "Green algae",
                    type: "class",
                    description: "Tảo lục, họ hàng của thực vật trên cạn. Có màu xanh lục tươi.",
                    era: "1.2 tỷ năm trước",
                    color: "#115e59",
                    traits: ["Diệp lục a & b", "Thành tế bào Cellulose", "Dự trữ tinh bột"],
                    infographicUrl: "evolution/green algae.jpeg",
                    children: [
                        {
                            id: "chlamydomonas_example",
                            label: "Tảo đơn bào",
                            englishLabel: "Chlamydomonas",
                            type: "species",
                            description: "Tảo lục bơi bằng 2 roi, thường gặp trong vũng nước đọng.",
                            era: "Hiện đại",
                            color: "#134e4a",
                            traits: ["Đơn bào", "2 roi bơi"]
                        }
                    ]
                },
                {
                    id: "plantae_simple",
                    label: "Thực Vật",
                    englishLabel: "Plants",
                    type: "kingdom",
                    description: "Vương quốc xanh bao phủ Trái Đất. Chúng không chỉ cung cấp oxy mà còn là nguồn thức ăn cơ bản cho hầu hết sự sống trên cạn.",
                    era: "Paleozoic (470 triệu năm trước)",
                    color: "#15803d",
                    traits: ["Đa bào nhân thực", "Quang hợp tự dưỡng", "Vách tế bào Cellulose"],
                    infographicUrl: "evolution/Plants.jpeg",
                    drillable: true,
                    children: [
                        {
                            id: "algae_plants_bridge",
                            label: "Tảo Charophytes",
                            englishLabel: "Green algae (Charophytes)",
                            type: "branch",
                            description: "Nhóm tảo lục nước ngọt được coi là họ hàng gần nhất còn sống của thực vật trên cạn.",
                            era: "Precambrian",
                            color: "#115e59",
                            traits: ["Sống nước ngọt", "Cấu trúc gen giống cây", "Tiền thân của cây"],
                            infographicUrl: "evolution/Green algae (Charophytes).jpeg",
                            children: [
                                {
                                    id: "green_algae_plants",
                                    label: "Tảo xanh (Gần thực vật)",
                                    englishLabel: "Green algae (Simple)",
                                    type: "class",
                                    description: "Bước chuyển mình quan trọng từ đại dương lên vùng ven bờ. Thực vật trên cạn mọc ra từ bên trong nhóm tảo này.",
                                    era: "500+ triệu năm trước",
                                    color: "#134e4a",
                                    traits: ["Chưa có rễ lá", "Quang hợp mạnh"],
                                    infographicUrl: "evolution/Green algae (Simple).jpeg",
                                    grade: true
                                }
                            ]
                        },
                        {
                            id: "land_plants",
                            label: "Thực vật trên cạn",
                            englishLabel: "Embryophytes (Land Plants)",
                            type: "branch",
                            description: "Cuộc xâm lăng vĩ đại của sự sống lên mặt đất khô cằn. Chúng phát triển lớp sáp bảo vệ và nuôi phôi thai.",
                            era: "Ordovician (470 triệu năm trước)",
                            color: "#166534",
                            traits: ["Sống trên cạn", "Có phôi đa bào", "Lớp cutin chống mất nước"],
                            infographicUrl: "evolution/Embryophytes.jpeg",
                            children: [
                                {
                                    id: "mosses",
                                    label: "Rêu (Thực vật không mạch)",
                                    englishLabel: "Bryophytes (Mosses)",
                                    type: "phylum",
                                    description: "Những người tiên phong nhỏ bé. Chưa có mạch dẫn nước nên phải sống bám sát đất ẩm ướt.",
                                    era: "Ordovician",
                                    color: "#365314",
                                    traits: ["Không có mạch dẫn", "Không rễ thật", "Thụ tinh cần nước"],
                                    infographicUrl: "evolution/Bryophytes.jpeg"
                                },
                                {
                                    id: "vascular_plants",
                                    label: "Thực vật có mạch",
                                    englishLabel: "Vascular plants",
                                    type: "clade",
                                    description: "Thực vật có mạch dẫn nước và chất dinh dưỡng, nhờ đó có rễ, thân, lá thật và mọc cao được.",
                                    era: "Silur",
                                    color: "#22c55e",
                                    traits: ["Mạch dẫn", "Rễ, thân, lá thật"],
                                    children: [
                                        {
                                            id: "ferns",
                                            label: "Dương xỉ",
                                            englishLabel: "Pteridophytes (Ferns)",
                                            type: "phylum",
                                            description: "Phát minh ra \"hệ thống ống nước\" (mạch dẫn) giúp cây mọc cao đón nắng. Thống trị Trái Đất thời cổ đại (Kỷ Carbon).",
                                            era: "Devonian (360 triệu năm trước)",
                                            color: "#065f46",
                                            traits: ["Có mạch dẫn (Xylem/Phloem)", "Sinh sản bằng bào tử", "Lá chét cuộn tròn"],
                                            infographicUrl: "evolution/Pteridophytes.jpeg"
                                        },
                                        {
                                            id: "seed_plants",
                                            label: "Thực vật có hạt",
                                            englishLabel: "Seed plants",
                                            type: "clade",
                                            description: "Thực vật sinh sản bằng hạt, một \"hộp cơm\" bọc cây con. Gồm hạt trần (thông) và hạt kín (cây có hoa).",
                                            era: "Than Đá",
                                            color: "#16a34a",
                                            traits: ["Hạt", "Hạt phấn"],
                                            children: [
                                                {
                                                    id: "gymnosperms",
                                                    label: "Hạt trần",
                                                    englishLabel: "Gymnosperms",
                                                    type: "phylum",
                                                    description: "Kỷ nguyên của Hạt! Hạt giúp phôi sống sót qua mùa khô lạnh. \"Trần\" vì hạt nằm lộ trên nón thông, không được quả bao bọc.",
                                                    era: "Carboniferous (300 triệu năm trước)",
                                                    color: "#064e3b",
                                                    traits: ["Hạt trần (không quả)", "Thụ phấn nhờ gió", "Lá kim chịu hạn"],
                                                    infographicUrl: "evolution/Gymnosperms.jpeg",
                                                    children: [
                                                        {
                                                            id: "conifers",
                                                            label: "Thông & họ hàng",
                                                            englishLabel: "Conifers",
                                                            type: "class",
                                                            description: "Nhóm thực vật hạt trần phổ biến nhất, xanh quanh năm, chịu được khí hậu lạnh.",
                                                            era: "Triassic",
                                                            color: "#022c22",
                                                            traits: ["Nón đực & nón cái", "Gỗ mềm", "Nhựa thơm"],
                                                            infographicUrl: "evolution/Conifers.jpeg",
                                                            children: [
                                                                {
                                                                    id: "pine_spruce_fir_examples",
                                                                    label: "Thông / Tùng / Vân sam",
                                                                    englishLabel: "Pine, Spruce, Fir",
                                                                    type: "species",
                                                                    description: "Các loài cây lá kim điển hình, tạo nên những cánh rừng Taiga bạt ngàn.",
                                                                    era: "Hiện đại",
                                                                    color: "#052e16",
                                                                    traits: ["Lá kim", "Hình tháp"],
                                                                    infographicUrl: "evolution/Pine, Spruce, Fir.jpeg"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    id: "angiosperms",
                                                    label: "Hạt kín (Thực vật có hoa)",
                                                    englishLabel: "Angiosperms",
                                                    type: "phylum",
                                                    description: "Nhóm thực vật thành công nhất hiện nay. Hoa thu hút côn trùng thụ phấn, quả bảo vệ và phát tán hạt.",
                                                    era: "Cretaceous (140 triệu năm trước)",
                                                    color: "#14532d",
                                                    traits: ["Có Hoa sặc sỡ", "Có Quả che hạt", "Thụ phấn kép"],
                                                    infographicUrl: "evolution/Angiosperms.jpeg",
                                                    children: [
                                                        {
                                                            id: "flowering_plants_monocots",
                                                            label: "Cây một lá mầm",
                                                            englishLabel: "Monocots",
                                                            type: "class",
                                                            description: "Nhóm cây mà hạt mầm chỉ có 1 chiếc lá đầu tiên. Gân lá thường song song.",
                                                            era: "Cretaceous",
                                                            color: "#022c22",
                                                            traits: ["1 lá mầm", "Rễ chùm", "Hoa mẫu 3"],
                                                            infographicUrl: "evolution/Monocots.jpeg",
                                                            gallery: {
                                                                title: "Ví dụ quen thuộc",
                                                                items: [
                                                                    {
                                                                        label: "Lúa / Ngô / Lúa mì",
                                                                        englishLabel: "Cereals (Rice, Corn, Wheat)",
                                                                        description: "Nguồn lương thực chính của nhân loại (Ngũ cốc).",
                                                                        infographicUrl: "evolution/cereals (rice, corn, wheat).jpeg"
                                                                    },
                                                                    {
                                                                        label: "Lan / Loa kèn",
                                                                        englishLabel: "Orchids & Lilies",
                                                                        description: "Các loài hoa đẹp, cấu trúc phức tạp, thường thụ phấn nhờ côn trùng chuyên biệt.",
                                                                        infographicUrl: "evolution/Orchids & Lilies.jpeg"
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        {
                                                            id: "flowering_plants_dicots",
                                                            label: "Cây hai lá mầm",
                                                            englishLabel: "Eudicots",
                                                            type: "class",
                                                            description: "Nhóm cây mà hạt mầm có 2 chiếc lá. Gân lá thường hình mạng lưới.",
                                                            era: "Cretaceous",
                                                            color: "#022c22",
                                                            traits: ["2 lá mầm", "Rễ cọc", "Hoa mẫu 4 hoặc 5"],
                                                            infographicUrl: "evolution/Dicots (Eudicots).jpeg",
                                                            gallery: {
                                                                title: "Ví dụ quen thuộc",
                                                                items: [
                                                                    {
                                                                        label: "Đậu / Hoa hồng / Hướng dương",
                                                                        englishLabel: "Beans, Roses, Sunflowers",
                                                                        description: "Rất đa dạng, từ cây bụi gai góc đến hoa hướng dương rực rỡ.",
                                                                        infographicUrl: "evolution/Beans, Roses, Sunflowers.jpeg"
                                                                    },
                                                                    {
                                                                        label: "Táo / Xoài / Cam",
                                                                        englishLabel: "Fruit Trees",
                                                                        description: "Các loại cây ăn quả thân gỗ lâu năm.",
                                                                        infographicUrl: "evolution/Fruit Trees.jpeg"
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
