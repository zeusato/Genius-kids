// Tái cấu trúc 28/09/2026 (GĐ0) theo docs/evolution-tree-wow/target-tree.txt + data-spec.md.
// Sửa trực tiếp file này; engine/engine.test.ts kiểm cấu trúc khớp target-tree.txt (sửa cây thì sửa cả dàn ý).
import { EvolutionNode } from './types';

export const fungi: EvolutionNode = {
    id: "fungi_simple",
    label: "Vương Quốc Nấm",
    englishLabel: "Fungi Kingdom",
    type: "kingdom",
    description: "Những \"người tái chế\" vĩ đại của tự nhiên. Không phải thực vật, không phải động vật, Nấm hấp thụ dinh dưỡng bằng cách phân hủy vật chất hữu cơ.",
    era: "Proterozoic (1.5 tỷ năm trước)",
    color: "#d97706",
    traits: ["Thành tế bào Chitin", "Dị dưỡng hoại sinh", "Sinh sản bằng bào tử"],
    infographicUrl: "evolution/Fungi Kingdom.jpeg",
    drillable: true,
    children: [
        {
            id: "chytrids",
            label: "Nấm roi (Chytrids)",
            englishLabel: "Chytrids",
            type: "branch",
            description: "Nhóm nấm cổ xưa nhất, sống chủ yếu dưới nước. Đặc biệt vì bào tử của chúng có roi bơi được.",
            era: "Tiền Cambri",
            color: "#b45309",
            traits: ["Bào tử có roi bơi", "Sống dưới nước", "Ký sinh hoặc hoại sinh"],
            infographicUrl: "evolution/Chytrids.jpeg",
            children: [
                {
                    id: "chytrid_example",
                    label: "Chytrid điển hình",
                    englishLabel: "Chytrid Example",
                    type: "class",
                    description: "Thủ phạm gây ra sự suy giảm số lượng lưỡng cư (ếch nhái) trên toàn cầu.",
                    era: "Cổ đại",
                    color: "#92400e",
                    traits: ["Gây bệnh cho da ếch", "Kích thước hiển vi"],
                    infographicUrl: "evolution/Chytrid Example.jpeg"
                }
            ]
        },
        {
            id: "zygomycetes_simple",
            label: "Mốc bánh mì (Nấm tiếp hợp)",
            englishLabel: "Zygomycetes",
            type: "class",
            description: "Loại mốc đen hoặc trắng xốp thường thấy trên bánh mì cũ.",
            era: "Hiện đại",
            color: "#9a3412",
            traits: ["Bào tử tiếp hợp", "Phân hủy tinh bột"],
            infographicUrl: "evolution/Zygomycetes.jpeg",
            children: [
                {
                    id: "bread_mold_example",
                    label: "Mốc bánh mì",
                    englishLabel: "Bread Mold",
                    type: "family",
                    description: "Rhizopus stolonifer - Kẻ thù của tiệm bánh.",
                    era: "Hiện đại",
                    color: "#7c2d12",
                    traits: ["Mọc rất nhanh", "Bào tử màu đen"],
                    infographicUrl: "evolution/Bread Mold.jpeg",
                    children: [
                        {
                            id: "rhizopus_example",
                            label: "Mốc đen Rhizopus",
                            englishLabel: "Rhizopus",
                            type: "species",
                            description: "Có thể được dùng để lên men tempeh hoặc sản xuất axit hữu cơ.",
                            era: "Hiện đại",
                            color: "#431407",
                            traits: ["Ứng dụng công nghiệp", "Phân hủy mạnh"],
                            infographicUrl: "evolution/Rhizopus.jpeg"
                        }
                    ]
                }
            ]
        },
        {
            id: "dikarya",
            label: "Nấm túi & nấm đảm",
            englishLabel: "Dikarya",
            type: "clade",
            description: "Nhóm nấm gồm nấm túi (mốc xanh, men bánh mì, nấm cục) và nấm đảm (nấm mỡ, nấm linh chi). Một tế bào của chúng có thể mang hai nhân.",
            era: "Nguyên Sinh",
            color: "#fbbf24",
            traits: ["Hai nhân trong một tế bào", "Sợi nấm có vách ngăn"],
            children: [
                {
                    id: "ascomycota_simple",
                    label: "Nấm túi (Ascomycota)",
                    englishLabel: "Ascomycetes",
                    type: "class",
                    description: "Nhóm nấm lớn nhất, sinh bào tử trong các túi nhỏ gọi là \"ascus\". Bao gồm cả nấm cục đắt tiền.",
                    era: "Hiện đại",
                    color: "#9a3412",
                    traits: ["Bào tử túi", "Đa dạng nhất", "Nhiều loài ăn được"],
                    infographicUrl: "evolution/Ascomycetes.jpeg",
                    children: [
                        {
                            id: "penicillium_example",
                            label: "Penicillium (Mốc xanh)",
                            englishLabel: "Penicillium",
                            type: "genus",
                            description: "Người hùng y học: Nơi chiết xuất ra thuốc kháng sinh Penicillin đầu tiên.",
                            era: "Hiện đại",
                            color: "#7c2d12",
                            traits: ["Kháng khuẩn", "Làm phô mai xanh"],
                            infographicUrl: "evolution/Penicillium.jpeg",
                            children: [
                                {
                                    id: "blue_mold_example",
                                    label: "Mốc xanh",
                                    englishLabel: "Blue Mold",
                                    type: "species",
                                    description: "Alexander Fleming đã tình cờ phát hiện ra kháng sinh từ loại nấm này.",
                                    era: "Hiện đại",
                                    color: "#431407",
                                    traits: ["Màu xanh đặc trưng", "Vị đắng nhẹ"],
                                    infographicUrl: "evolution/Blue Mold.jpeg"
                                }
                            ]
                        },
                        {
                            id: "morels_truffles_example",
                            label: "Nấm Morel & Nấm Cục",
                            englishLabel: "Morels & Truffles",
                            type: "genus",
                            description: "Những viên kim cương đen của ẩm thực. Sống cộng sinh dưới rễ cây.",
                            era: "Hiện đại",
                            color: "#7c2d12",
                            traits: ["Cực kỳ đắt đỏ", "Hương vị tuyệt hảo", "Sống dưới đất"],
                            infographicUrl: "evolution/Morels & Truffles.jpeg",
                            children: [
                                {
                                    id: "truffle_example",
                                    label: "Nấm cục (Truffle)",
                                    englishLabel: "Truffle",
                                    type: "species",
                                    description: "Phải dùng chó hoặc lợn để đánh hơi và tìm kiếm.",
                                    era: "Hiện đại",
                                    color: "#431407",
                                    traits: ["Vua của các loại nấm", "Giá trị kinh tế cao"],
                                    infographicUrl: "evolution/Truffle.jpeg"
                                }
                            ]
                        },
                        {
                            id: "baker_yeast_example",
                            label: "Men bánh mì",
                            englishLabel: "Baker's Yeast",
                            type: "species",
                            description: "Saccharomyces cerevisiae - Thợ làm bánh và nấu bia tài ba.",
                            era: "Hiện đại",
                            color: "#a16207",
                            traits: ["Làm nở bánh", "Lên men rượu bia", "Mô hình nghiên cứu Gen"],
                            infographicUrl: "evolution/Baker's Yeast.jpeg"
                        }
                    ]
                },
                {
                    id: "basidiomycota_simple",
                    label: "Nấm Đảm",
                    englishLabel: "Basidiomycetes",
                    type: "class",
                    description: "Nhóm nấm quen thuộc nhất trong bữa ăn hàng ngày.",
                    era: "Hiện đại",
                    color: "#854d0e",
                    traits: ["Bào tử đảm", "Thể quả lớn"],
                    infographicUrl: "evolution/Basidiomycetes.jpeg",
                    children: [
                        {
                            id: "button_mushroom_example",
                            label: "Nấm mỡ",
                            englishLabel: "Button Mushroom",
                            type: "genus",
                            description: "Loại nấm được trồng phổ biến nhất thế giới.",
                            era: "Hiện đại",
                            color: "#713f12",
                            traits: ["Dễ trồng", "Thơm ngon"],
                            infographicUrl: "evolution/Button Mushroom.jpeg",
                            children: [
                                {
                                    id: "agaricus_example",
                                    label: "Nấm Agaricus",
                                    englishLabel: "Agaricus",
                                    type: "species",
                                    description: "Nấm mỡ trắng, nấm nâu đều thuộc chi này.",
                                    era: "Hiện đại",
                                    color: "#451a03",
                                    traits: ["Mũ tròn", "Phiến nâu"],
                                    infographicUrl: "evolution/Agaricus.jpeg"
                                }
                            ]
                        },
                        {
                            id: "bracket_mushroom_example",
                            label: "Nấm Tai Gỗ",
                            englishLabel: "Bracket Fungi",
                            type: "genus",
                            description: "Mọc như những chiếc kệ bám trên thân cây gỗ mục. Rất dai và cứng.",
                            era: "Hiện đại",
                            color: "#713f12",
                            traits: ["Dai như gỗ", "Sống lâu năm"],
                            infographicUrl: "evolution/Bracket Fungi.jpeg",
                            children: [
                                {
                                    id: "polypore_example",
                                    label: "Nấm Vân Chi (Polypore)",
                                    englishLabel: "Polypore",
                                    type: "species",
                                    description: "Dùng làm thuốc, có vân màu đẹp mắt như đuôi gà tây.",
                                    era: "Hiện đại",
                                    color: "#451a03",
                                    traits: ["Dược liệu", "Phân hủy gỗ mạnh"],
                                    infographicUrl: "evolution/Polypore.jpeg"
                                }
                            ]
                        },
                        {
                            id: "puffball_example",
                            label: "Nấm Bụp Bóng",
                            englishLabel: "Puffball",
                            type: "genus",
                            description: "Tròn như quả bóng, khi già chạm vào sẽ \"phun\" ra đám mây bào tử như khói.",
                            era: "Hiện đại",
                            color: "#713f12",
                            traits: ["Kín, không mũ", "Phát tán nhờ gió"],
                            infographicUrl: "evolution/Puffball.jpeg",
                            children: [
                                {
                                    id: "puffball_detail_example",
                                    label: "Nấm Bụp Khổng Lồ",
                                    englishLabel: "Giant Puffball",
                                    type: "species",
                                    description: "Có thể to bằng quả bóng đá, bên trong trắng tinh ăn được khi còn non.",
                                    era: "Hiện đại",
                                    color: "#451a03",
                                    traits: ["Kích thước lớn", "Ăn được khi non"],
                                    infographicUrl: "evolution/Giant Puffball.jpeg"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
