// Tái cấu trúc 28/09/2026 (GĐ0) theo docs/evolution-tree-wow/target-tree.txt + data-spec.md.
// Sửa trực tiếp file này; engine/engine.test.ts kiểm cấu trúc khớp target-tree.txt (sửa cây thì sửa cả dàn ý).
import { EvolutionNode } from './types';

export const animalia: EvolutionNode = {
    id: "animalia",
    label: "Động Vật",
    englishLabel: "Animals",
    type: "kingdom",
    description: "Sinh vật đa bào dị dưỡng, phát triển hệ thần kinh và khả năng vận động.",
    era: "Precambrian",
    color: "#f43f5e",
    traits: ["Đa bào", "Dị dưỡng", "Hệ thần kinh"],
    infographicUrl: "evolution/Animals.jpeg",
    drillable: true,
    children: [
        {
            id: "porifera",
            label: "Không có mô thật (bọt biển)",
            englishLabel: "Sponges (no true tissues)",
            type: "class",
            description: "Động vật đa bào nguyên thủy nhất. Cơ thể rỗng, có nhiều lỗ nhỏ để lọc nước.",
            era: "Ediacaran",
            color: "#fb7185",
            traits: ["Không mô thật", "Hệ thống kênh nước"],
            infographicUrl: "evolution/No true tissues (Sponges).jpeg",
            children: [
                {
                    id: "calcarea",
                    label: "Bọt Biển Đá Vôi",
                    englishLabel: "Calcarea",
                    type: "order",
                    description: "Bộ xương bằng canxi cacbonat (đá vôi). Thường nhỏ và sống ở vùng biển nông.",
                    era: "Cambrian",
                    color: "#f43f5e",
                    traits: ["Gai đá vôi", "Biển nông"],
                    infographicUrl: "evolution/Calcarea.jpeg",
                    gallery: {
                        title: "Kiểu cấu trúc",
                        items: [
                            {
                                label: "Kiểu Ống Đơn",
                                englishLabel: "Asconoid",
                                description: "Cấu trúc đơn giản nhất, hình ống, nước đi thẳng vào khoang chính.",
                                infographicUrl: "evolution/Asconoid Calcarea.jpeg"
                            },
                            {
                                label: "Kiểu Gấp Nếp",
                                englishLabel: "Syconoid",
                                description: "Vách cơ thể gấp nếp tạo thành các ống tia, tăng diện tích lọc.",
                                infographicUrl: "evolution/Syconoid Calcarea.jpeg"
                            },
                            {
                                label: "Kiểu Nhiều Buồng",
                                englishLabel: "Leuconoid",
                                description: "Phức tạp nhất, gồm nhiều buồng rung liên kết. Kích thước có thể rất lớn.",
                                infographicUrl: "evolution/Leuconoid Calcarea.jpeg"
                            }
                        ]
                    }
                },
                {
                    id: "demospongiae",
                    label: "Bọt Biển Thường",
                    englishLabel: "Demospongiae",
                    type: "order",
                    description: "Chiếm 90% số loài bọt biển. Bộ xương bằng spongin hoặc silic.",
                    era: "Cambrian",
                    color: "#fb7185",
                    traits: ["Spongin", "Đa dạng"],
                    infographicUrl: "evolution/Demospongiae.jpeg",
                    gallery: {
                        title: "Kiểu cấu trúc",
                        items: [
                            {
                                label: "Kiểu Nhiều Buồng",
                                englishLabel: "Leuconoid",
                                description: "Cấu trúc phức tạp giúp cơ thể đạt kích thước lớn.",
                                infographicUrl: "evolution/Leuconoid Demospongiae.jpeg"
                            }
                        ]
                    }
                },
                {
                    id: "hexactinellida",
                    label: "Bọt Biển Thủy Tinh",
                    englishLabel: "Hexactinellida",
                    type: "order",
                    description: "Bộ xương bằng silic trong suốt như thủy tinh. Sống ở biển sâu.",
                    era: "Cambrian",
                    color: "#f43f5e",
                    traits: ["Gai silic 6 tia", "Biển sâu"],
                    infographicUrl: "evolution/Hexactinellida.jpeg",
                    gallery: {
                        title: "Kiểu cấu trúc",
                        items: [
                            {
                                label: "Kiểu Gấp Nếp",
                                englishLabel: "Syconoid",
                                description: "Cấu trúc trung gian.",
                                infographicUrl: "evolution/Syconoid Hexactinellida.jpeg"
                            },
                            {
                                label: "Kiểu Nhiều Buồng",
                                englishLabel: "Leuconoid",
                                description: "Cấu trúc phức tạp phổ biến.",
                                infographicUrl: "evolution/Leuconoid Hexactinellida.jpeg"
                            }
                        ]
                    }
                },
                {
                    id: "homoscleromorpha",
                    label: "Bọt Biển Homoscleromorpha",
                    englishLabel: "Homoscleromorpha",
                    type: "order",
                    description: "Nhóm nhỏ, trước đây xếp vào Demospongiae. Có màng đáy thật.",
                    era: "Cambrian",
                    color: "#fb7185",
                    traits: ["Màng đáy", "Hiếm gặp"],
                    infographicUrl: "evolution/Homoscleromorpha.jpeg",
                    gallery: {
                        title: "Kiểu cấu trúc",
                        items: [
                            {
                                label: "Kiểu Nhiều Buồng",
                                englishLabel: "Leuconoid",
                                description: "Cấu trúc phức tạp đặc trưng.",
                                infographicUrl: "evolution/Leuconoid Homoscleromorpha.jpeg"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: "eumetazoa",
            label: "Có mô thật",
            englishLabel: "Eumetazoa (true tissues)",
            type: "clade",
            description: "Động vật có các mô được tổ chức rõ ràng thành các lớp mầm.",
            era: "Ediacaran",
            color: "#f472b6",
            traits: ["Mô thật", "Tổ chức cơ thể"],
            infographicUrl: "evolution/Eumetazoa.jpeg",
            children: [
                {
                    id: "cnidaria",
                    label: "Ruột Khoang",
                    englishLabel: "Cnidarians",
                    type: "class",
                    description: "Động vật đối xứng tỏa tròn, có tế bào gai chuyên biệt để săn mồi và tự vệ.",
                    era: "Ediacaran",
                    color: "#f472b6",
                    traits: ["Đối xứng tỏa tròn", "Cnidocyte (Gai)"],
                    infographicUrl: "evolution/Cnidarians.jpeg",
                    children: [
                        {
                            id: "hydrozoa",
                            label: "Thủy Tức",
                            englishLabel: "Hydrozoa",
                            type: "order",
                            description: "Thường sống thành tập đoàn (như Sứa Bồ Đào Nha). Một số sống đơn độc nước ngọt (Hydra).",
                            era: "Cambrian",
                            color: "#f472b6",
                            traits: ["Dạng polyp/medusa", "Tập đoàn"],
                            infographicUrl: "evolution/Hydrozoa.jpeg"
                        },
                        {
                            id: "scyphozoa",
                            label: "Sứa Thực Sự",
                            englishLabel: "Scyphozoa",
                            type: "order",
                            description: "Giai đoạn sứa (medusa) chiếm ưu thế. Di chuyển bằng cách co bóp dù.",
                            era: "Cambrian",
                            color: "#db2777",
                            traits: ["Dạng sứa lớn", "Trôi nổi"],
                            infographicUrl: "evolution/Scyphozoa.jpeg"
                        },
                        {
                            id: "anthozoa",
                            label: "San Hô & Hải Quỳ",
                            englishLabel: "Anthozoa",
                            type: "order",
                            description: "Chỉ có dạng polyp, sống cố định. San hô tạo rạn đá vôi.",
                            era: "Cambrian",
                            color: "#be185d",
                            traits: ["Chỉ có Polyp", "Tạo rạn"],
                            infographicUrl: "evolution/Anthozoa.jpeg"
                        },
                        {
                            id: "cubozoa",
                            label: "Sứa Hộp",
                            englishLabel: "Cubozoa",
                            type: "order",
                            description: "Sứa có dù hình hộp, nọc độc rất mạnh. Bơi giỏi và có mắt phức tạp.",
                            era: "Carboniferous",
                            color: "#9d174d",
                            traits: ["Dù hình hộp", "Độc tính cao"],
                            infographicUrl: "evolution/Cubozoa.jpeg"
                        }
                    ]
                },
                {
                    id: "bilateria",
                    label: "Đối xứng hai bên",
                    englishLabel: "Bilateria (bilateral symmetry)",
                    type: "clade",
                    description: "Cơ thể đối xứng hai bên, thường có đầu và đuôi rõ rệt, ba lớp mầm (triploblastic).",
                    era: "Ediacaran",
                    color: "#e879f9",
                    traits: ["Đối xứng hai bên", "Ba lớp mầm"],
                    infographicUrl: "evolution/Bilateria (bilateral symmetry).jpeg",
                    children: [
                        {
                            id: "protostomes",
                            label: "Miệng nguyên sinh",
                            englishLabel: "Protostomes",
                            type: "clade",
                            description: "Trong phát triển phôi, miệng hình thành trước hậu môn.",
                            era: "Cambrian",
                            color: "#d946ef",
                            traits: ["Miệng trước", "Phát triển xác định"],
                            infographicUrl: "evolution/Protostomes.jpeg",
                            children: [
                                {
                                    id: "spiralia",
                                    label: "Giun dẹp, giun đốt & thân mềm",
                                    englishLabel: "Spiralia",
                                    type: "clade",
                                    description: "Nhánh động vật mà phôi phân chia theo kiểu xoắn ốc, gồm giun dẹp, giun đốt và thân mềm (ốc, trai, mực).",
                                    era: "Ediacara",
                                    color: "#fda4af",
                                    traits: ["Phôi phân cắt xoắn ốc", "Đối xứng hai bên"],
                                    children: [
                                        {
                                            id: "flatworms",
                                            label: "Giun Dẹp",
                                            englishLabel: "Flatworms",
                                            type: "order",
                                            description: "Cơ thể dẹt theo hướng lưng bụng. Chưa có hậu môn và hệ tuần hoàn.",
                                            era: "Ediacaran",
                                            color: "#f0abfc",
                                            traits: ["Dẹt", "Ruột túi"],
                                            infographicUrl: "evolution/Flatworms.jpeg",
                                            children: [
                                                {
                                                    id: "planarians",
                                                    label: "Sán Lông",
                                                    englishLabel: "Planarians",
                                                    type: "family",
                                                    description: "Sống tự do, có khả năng tái sinh mạnh mẽ.",
                                                    era: "Cambrian",
                                                    color: "#f5d0fe",
                                                    traits: ["Tái sinh", "Tự do"],
                                                    infographicUrl: "evolution/Planarians.jpeg"
                                                },
                                                {
                                                    id: "tapeworms",
                                                    label: "Sán Dây",
                                                    englishLabel: "Tapeworms",
                                                    type: "family",
                                                    description: "Ký sinh trong ruột động vật. Cơ thể gồm nhiều đốt.",
                                                    era: "Permian",
                                                    color: "#e879f9",
                                                    traits: ["Ký sinh", "Nhiều đốt"],
                                                    infographicUrl: "evolution/Tapeworms.jpeg"
                                                },
                                                {
                                                    id: "flukes",
                                                    label: "Sán Lá",
                                                    englishLabel: "Flukes",
                                                    type: "family",
                                                    description: "Hình lá, ký sinh trong gan hoặc máu.",
                                                    era: "Devonian",
                                                    color: "#d946ef",
                                                    traits: ["Ký sinh", "Hình lá"],
                                                    infographicUrl: "evolution/Flukes.jpeg"
                                                }
                                            ]
                                        },
                                        {
                                            id: "segmented_worms",
                                            label: "Giun Đốt",
                                            englishLabel: "Segmented Worms",
                                            type: "order",
                                            description: "Cơ thể phân đốt thực sự. Có hệ tuần hoàn kín.",
                                            era: "Cambrian",
                                            color: "#c026d3",
                                            traits: ["Phân đốt", "Tuần hoàn kín"],
                                            infographicUrl: "evolution/Segmented Worms.jpeg",
                                            children: [
                                                {
                                                    id: "earthworms",
                                                    label: "Giun Đất",
                                                    englishLabel: "Earthworms",
                                                    type: "family",
                                                    description: "Sống trong đất, cải tạo đất tơi xốp.",
                                                    era: "Triassic",
                                                    color: "#e879f9",
                                                    traits: ["Có ích", "Sống đất"],
                                                    infographicUrl: "evolution/Earthworms.jpeg"
                                                },
                                                {
                                                    id: "leeches",
                                                    label: "Đỉa",
                                                    englishLabel: "Leeches",
                                                    type: "family",
                                                    description: "Sống dưới nước, hút máu hoặc ăn thịt.",
                                                    era: "Jurassic",
                                                    color: "#d946ef",
                                                    traits: ["Hút máu", "Giác bám"],
                                                    infographicUrl: "evolution/Leeches.jpeg"
                                                },
                                                {
                                                    id: "polychaetes",
                                                    label: "Giun Nhiều Tơ",
                                                    englishLabel: "Polychaetes",
                                                    type: "family",
                                                    description: "Sống ở biển, màu sắc sặc sỡ, di chuyển hoạt bát. Giun đất và đỉa mọc ra từ bên trong nhóm giun nhiều tơ.",
                                                    era: "Cambrian",
                                                    color: "#a21caf",
                                                    traits: ["Sống biển", "Nhiều tơ"],
                                                    infographicUrl: "evolution/Polychaetes.jpeg",
                                                    grade: true
                                                }
                                            ]
                                        },
                                        {
                                            id: "mollusca",
                                            label: "Thân Mềm",
                                            englishLabel: "Mollusks",
                                            type: "class",
                                            description: "Động vật không xương sống có cơ thể mềm, thường được bảo vệ bởi vỏ đá vôi.",
                                            era: "Cambrian",
                                            color: "#d946ef",
                                            traits: ["Cơ thể mềm", "Vỏ đá vôi", "Chân cơ"],
                                            infographicUrl: "evolution/Mollusks.jpeg",
                                            children: [
                                                {
                                                    id: "gastropods",
                                                    label: "Chân Bụng",
                                                    englishLabel: "Gastropods",
                                                    type: "order",
                                                    description: "Nhóm lớn nhất (Ốc sên, Ốc biển). Di chuyển bằng chân bụng bò sát mặt đất.",
                                                    era: "Cambrian",
                                                    color: "#f0abfc",
                                                    traits: ["Vỏ xoắn", "Chân bụng"],
                                                    infographicUrl: "evolution/Gastropods.jpeg",
                                                    children: [
                                                        {
                                                            id: "snails",
                                                            label: "Ốc",
                                                            englishLabel: "Snails",
                                                            type: "family",
                                                            description: "Có vỏ xoắn ốc bảo vệ cơ thể.",
                                                            era: "Cambrian",
                                                            color: "#f5d0fe",
                                                            traits: ["Có vỏ"],
                                                            infographicUrl: "evolution/Snails.jpeg"
                                                        },
                                                        {
                                                            id: "slugs",
                                                            label: "Sên Trần",
                                                            englishLabel: "Slugs",
                                                            type: "family",
                                                            description: "Vỏ tiêu biến hoặc rất nhỏ. Cơ thể tiết nhiều chất nhầy. Sên trần tiến hóa từ ốc nhiều lần, mỗi lần mất vỏ theo một cách khác nhau.",
                                                            era: "Carboniferous",
                                                            color: "#e879f9",
                                                            traits: ["Không vỏ", "Nhầy"],
                                                            infographicUrl: "evolution/Slugs.jpeg",
                                                            grade: true
                                                        }
                                                    ]
                                                },
                                                {
                                                    id: "bivalves",
                                                    label: "Hai Mảnh Vỏ",
                                                    englishLabel: "Bivalves",
                                                    type: "order",
                                                    description: "Ngao, Sò, Trai, Hến. Vỏ gồm 2 mảnh khép lại.",
                                                    era: "Cambrian",
                                                    color: "#d946ef",
                                                    traits: ["2 mảnh vỏ", "Lọc thức ăn"],
                                                    infographicUrl: "evolution/Bivalves.jpeg",
                                                    children: [
                                                        {
                                                            id: "clams_oysters",
                                                            label: "Trai & Hàu",
                                                            englishLabel: "Clams & Oysters",
                                                            type: "family",
                                                            description: "Sống cố định hoặc vùi mình trong cát.",
                                                            era: "Cambrian",
                                                            color: "#c026d3",
                                                            traits: ["Cố định", "Tạo ngọc"],
                                                            infographicUrl: "evolution/Clams & Oysters.jpeg"
                                                        }
                                                    ]
                                                },
                                                {
                                                    id: "cephalopods",
                                                    label: "Chân Đầu",
                                                    englishLabel: "Cephalopods",
                                                    type: "order",
                                                    description: "Nhóm thông minh nhất (Bạch tuộc, Mực). Chân biến đổi thành xúc tu quanh đầu.",
                                                    era: "Cambrian",
                                                    color: "#c026d3",
                                                    traits: ["Thông minh", "Xúc tu", "Phun mực"],
                                                    infographicUrl: "evolution/Cephalopods.jpeg",
                                                    children: [
                                                        {
                                                            id: "octopuses",
                                                            label: "Bạch Tuộc",
                                                            englishLabel: "Octopuses",
                                                            type: "family",
                                                            description: "Không có vỏ, 8 xúc tu, trí tuệ rất cao.",
                                                            era: "Jurassic",
                                                            color: "#a21caf",
                                                            traits: ["8 xúc tu", "Ngụy trang"],
                                                            infographicUrl: "evolution/Octopuses.jpeg"
                                                        },
                                                        {
                                                            id: "squids",
                                                            label: "Mực",
                                                            englishLabel: "Squids",
                                                            type: "family",
                                                            description: "Bơi nhanh, vỏ tiêu biến thành mai mực bên trong.",
                                                            era: "Jurassic",
                                                            color: "#86198f",
                                                            traits: ["10 xúc tu", "Phản lực"],
                                                            infographicUrl: "evolution/Squids.jpeg"
                                                        },
                                                        {
                                                            id: "nautilus",
                                                            label: "Ốc Anh Vũ",
                                                            englishLabel: "Nautilus",
                                                            type: "family",
                                                            description: "Hóa thạch sống, vẫn giữ vỏ ngoài cuộn tròn.",
                                                            era: "Cambrian",
                                                            color: "#701a75",
                                                            traits: ["Vỏ ngoài", "Sống sâu"],
                                                            infographicUrl: "evolution/Nautilus.jpeg"
                                                        },
                                                        {
                                                            id: "ammonites",
                                                            label: "Cúc đá",
                                                            englishLabel: "Ammonites",
                                                            type: "order",
                                                            description: "Họ hàng có vỏ xoắn ốc của mực và bạch tuộc. Từng sống khắp đại dương rồi tuyệt chủng cùng khủng long 66 triệu năm trước.",
                                                            era: "Devon",
                                                            color: "#94a3b8",
                                                            traits: ["Vỏ xoắn có vách ngăn", "Hóa thạch rất phổ biến"]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    id: "ecdysozoa",
                                    label: "Nhánh lột xác",
                                    englishLabel: "Ecdysozoa",
                                    type: "clade",
                                    description: "Động vật lớn lên bằng cách lột lớp vỏ ngoài, gồm giun tròn và chân khớp (côn trùng, nhện, tôm cua).",
                                    era: "Ediacara",
                                    color: "#fda4af",
                                    traits: ["Lột xác", "Lớp vỏ ngoài"],
                                    children: [
                                        {
                                            id: "roundworms",
                                            label: "Giun Tròn",
                                            englishLabel: "Roundworms",
                                            type: "order",
                                            description: "Cơ thể hình ống, tiết diện tròn. Có ống tiêu hóa hoàn chỉnh.",
                                            era: "Cambrian",
                                            color: "#d946ef",
                                            traits: ["Hình ống", "Tiêu hóa hoàn chỉnh"],
                                            infographicUrl: "evolution/Roundworms.jpeg",
                                            children: [
                                                {
                                                    id: "pinworms",
                                                    label: "Giun Kim",
                                                    englishLabel: "Pinworms",
                                                    type: "family",
                                                    description: "Ký sinh phổ biến ở ruột người, đặc biệt là trẻ em.",
                                                    era: "Unknown",
                                                    color: "#e879f9",
                                                    traits: ["Ký sinh ruột"],
                                                    infographicUrl: "evolution/Pinworms.jpeg"
                                                },
                                                {
                                                    id: "hookworms",
                                                    label: "Giun Móc",
                                                    englishLabel: "Hookworms",
                                                    type: "family",
                                                    description: "Ký sinh hút máu, xâm nhập qua da.",
                                                    era: "Unknown",
                                                    color: "#c026d3",
                                                    traits: ["Hút máu", "Móc bám"],
                                                    infographicUrl: "evolution/Hookworms.jpeg"
                                                }
                                            ]
                                        },
                                        {
                                            id: "arthropoda",
                                            label: "Chân Khớp",
                                            englishLabel: "Arthropods",
                                            type: "class",
                                            description: "Ngành động vật lớn nhất. Cơ thể phân đốt, có bộ xương ngoài bằng chitin và các chi phân đốt.",
                                            era: "Cambrian",
                                            color: "#c026d3",
                                            traits: ["Bộ xương ngoài", "Chân khớp", "Lột xác"],
                                            milestone: {
                                                label: "Lên Cạn",
                                                year: "450 triệu năm trước"
                                            },
                                            infographicUrl: "evolution/Arthropods.jpeg",
                                            children: [
                                                {
                                                    id: "trilobites",
                                                    label: "Bọ ba thùy",
                                                    englishLabel: "Trilobites",
                                                    type: "class",
                                                    description: "Chân khớp biển có vỏ chia ba thùy dọc thân, sống hơn 250 triệu năm rồi biến mất trong đại tuyệt chủng cuối kỷ Permi.",
                                                    era: "Cambri",
                                                    color: "#94a3b8",
                                                    traits: ["Mắt kép bằng tinh thể đá vôi", "Cuộn tròn để tự vệ"]
                                                },
                                                {
                                                    id: "arachnids",
                                                    label: "Hình Nhện",
                                                    englishLabel: "Arachnids",
                                                    type: "order",
                                                    description: "Nhện, Bọ cạp, Ve. Có 8 chân, không có râu và cánh.",
                                                    era: "Silurian",
                                                    color: "#d946ef",
                                                    traits: ["8 chân", "Phổi sách"],
                                                    infographicUrl: "evolution/Arachnids.jpeg",
                                                    children: [
                                                        {
                                                            id: "spiders_scorpions_ticks",
                                                            label: "Nhện / Bọ cạp / Ve",
                                                            englishLabel: "Spiders / Scorpions / Ticks",
                                                            type: "family",
                                                            description: "Săn mồi hoặc ký sinh. Thường có nọc độc.",
                                                            era: "Devonian",
                                                            color: "#e879f9",
                                                            traits: ["Tơ nhện", "Nọc độc"],
                                                            infographicUrl: "evolution/Spiders, Scorpions, Ticks.jpeg"
                                                        }
                                                    ]
                                                },
                                                {
                                                    id: "myriapods",
                                                    label: "Nhiều Chân",
                                                    englishLabel: "Myriapods",
                                                    type: "order",
                                                    description: "Rết, Cuốn chiếu. Cơ thể dài, có rất nhiều đôi chân.",
                                                    era: "Silurian",
                                                    color: "#a21caf",
                                                    traits: ["Nhiều chân", "Thở bằng khí quản"],
                                                    infographicUrl: "evolution/Myriapods.jpeg",
                                                    children: [
                                                        {
                                                            id: "centipedes_millipedes",
                                                            label: "Rết / Cuốn Chiếu",
                                                            englishLabel: "Centipedes / Millipedes",
                                                            type: "family",
                                                            description: "Rết ăn thịt có độc, Cuốn chiếu ăn thực vật.",
                                                            era: "Silurian",
                                                            color: "#c026d3",
                                                            traits: ["Nhiều đốt", "Sống nơi ẩm"],
                                                            infographicUrl: "evolution/Centipedes, Millipedes.jpeg"
                                                        }
                                                    ]
                                                },
                                                {
                                                    id: "pancrustacea",
                                                    label: "Tôm cua & côn trùng",
                                                    englishLabel: "Pancrustacea",
                                                    type: "clade",
                                                    description: "Côn trùng là họ hàng gần nhất của giáp xác: tổ tiên của côn trùng là một loài giống giáp xác đã lên cạn.",
                                                    era: "Cambri",
                                                    color: "#f472b6",
                                                    traits: ["Chân khớp", "Mắt kép"],
                                                    children: [
                                                        {
                                                            id: "crustaceans",
                                                            label: "Giáp Xác",
                                                            englishLabel: "Crustaceans",
                                                            type: "order",
                                                            description: "Tôm, Cua. Chủ yếu sống dưới nước, hô hấp bằng mang. Côn trùng thật ra mọc ra từ bên trong nhóm giáp xác, nên \"giáp xác\" không phải một nhánh trọn vẹn.",
                                                            era: "Cambrian",
                                                            color: "#c026d3",
                                                            traits: ["2 đôi râu", "Vỏ kitin-canxi"],
                                                            infographicUrl: "evolution/Crustaceans.jpeg",
                                                            grade: true,
                                                            children: [
                                                                {
                                                                    id: "crabs_shrimps_lobsters",
                                                                    label: "Cua / Tôm",
                                                                    englishLabel: "Crabs / Shrimps",
                                                                    type: "family",
                                                                    description: "Nguồn thức ăn quan trọng. Có 10 chân (thập chân).",
                                                                    era: "Jurassic",
                                                                    color: "#d946ef",
                                                                    traits: ["10 chân", "Càng lớn"],
                                                                    infographicUrl: "evolution/Crabs, Shrimps.jpeg"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            id: "insects",
                                                            label: "Côn Trùng",
                                                            englishLabel: "Insects",
                                                            type: "order",
                                                            description: "Nhóm động vật đa dạng nhất hành tinh. Cơ thể chia 3 phần (đầu, ngực, bụng), có 6 chân.",
                                                            era: "Devonian",
                                                            color: "#e879f9",
                                                            traits: ["6 chân", "Có cánh"],
                                                            infographicUrl: "evolution/Insects.jpeg",
                                                            children: [
                                                                {
                                                                    id: "butterflies_beetles_bees",
                                                                    label: "Bướm / Bọ / Ong",
                                                                    englishLabel: "Butterflies / Beetles / Bees",
                                                                    type: "family",
                                                                    description: "Đại diện tiêu biểu cho sự đa dạng của côn trùng.",
                                                                    era: "Carboniferous",
                                                                    color: "#f0abfc",
                                                                    traits: ["Biến thái", "Thụ phấn"],
                                                                    infographicUrl: "evolution/Butterflies, Beetle, Bees.jpeg"
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
                        },
                        {
                            id: "deuterostomes",
                            label: "Miệng thứ sinh",
                            englishLabel: "Deuterostomes",
                            type: "clade",
                            description: "Trong phát triển phôi, hậu môn hình thành trước miệng. Phôi bào phát triển không xác định.",
                            era: "Cambrian",
                            color: "#86198f",
                            traits: ["Hậu môn trước", "Phát triển không xác định"],
                            infographicUrl: "evolution/Deuterostomes.jpeg",
                            children: [
                                {
                                    id: "echinodermata",
                                    label: "Da Gai",
                                    englishLabel: "Echinoderms",
                                    type: "class",
                                    description: "Động vật biển có hệ thống ống nước độc đáo. Ấu trùng đối xứng hai bên, trưởng thành đối xứng tỏa tròn.",
                                    era: "Cambrian",
                                    color: "#a21caf",
                                    traits: ["Hệ thống ống nước", "Đối xứng tỏa tròn"],
                                    infographicUrl: "evolution/Echinoderms.jpeg",
                                    children: [
                                        {
                                            id: "sea_stars",
                                            label: "Sao Biển",
                                            englishLabel: "Sea Stars",
                                            type: "order",
                                            description: "Hình sao, thường có 5 cánh. Ăn thịt (san hô, thân mềm). Di chuyển bằng chân ống.",
                                            era: "Ordovician",
                                            color: "#c026d3",
                                            traits: ["Hình sao", "Tái sinh cánh", "Chân ống"],
                                            infographicUrl: "evolution/Sea Stars.jpeg"
                                        },
                                        {
                                            id: "sea_urchins",
                                            label: "Nhím Biển (Cầu Gai)",
                                            englishLabel: "Sea Urchins",
                                            type: "order",
                                            description: "Hình cầu, vỏ cứng có nhiều gai nhọn bảo vệ. Ăn tảo. Một số loài có gai độc.",
                                            era: "Ordovician",
                                            color: "#a21caf",
                                            traits: ["Gai nhọn", "Khớp Aristote", "Ăn tảo"],
                                            infographicUrl: "evolution/Sea Urchins.jpeg"
                                        },
                                        {
                                            id: "sea_cucumbers",
                                            label: "Hải Sâm (Dưa Chuột Biển)",
                                            englishLabel: "Sea Cucumbers",
                                            type: "order",
                                            description: "Cơ thể hình dưa chuột, vỏ tiêu biến. Sống ở đáy biển. Lọc bùn.",
                                            era: "Ordovician",
                                            color: "#86198f",
                                            traits: ["Thân mềm", "Tự vệ bằng ruột", "Lọc bùn"],
                                            infographicUrl: "evolution/Sea Cucumbers.jpeg"
                                        },
                                        {
                                            id: "brittle_stars",
                                            label: "Sao Giòn (Sao Đuôi Rắn)",
                                            englishLabel: "Brittle Stars",
                                            type: "order",
                                            description: "Giống sao biển nhưng cánh mảnh và linh hoạt hơn. Dễ gãy cánh để trốn thoát.",
                                            era: "Ordovician",
                                            color: "#701a75",
                                            traits: ["Cánh mảnh", "Di chuyển nhanh", "Tự cắt cánh"],
                                            infographicUrl: "evolution/Brittle Stars.jpeg"
                                        }
                                    ]
                                },
                                {
                                    id: "vertebrates",
                                    label: "Có Xương Sống",
                                    englishLabel: "Vertebrates",
                                    type: "phylum",
                                    description: "Động vật có cột sống và hộp sọ, hệ thần kinh phát triển cao.",
                                    era: "Cambrian",
                                    color: "#e11d48",
                                    traits: ["Cột sống", "Hộp sọ"],
                                    infographicUrl: "evolution/Vertebrates.jpeg",
                                    children: [
                                        {
                                            id: "jawless_fish",
                                            label: "Cá Không Hàm",
                                            englishLabel: "Jawless Fish",
                                            type: "order",
                                            description: "Nhóm cá nguyên thủy nhất, miệng tròn không có hàm.",
                                            era: "Cambrian",
                                            color: "#9f1239",
                                            traits: ["Không hàm", "Miệng tròn"],
                                            infographicUrl: "evolution/Jawless Fish.jpeg"
                                        },
                                        {
                                            id: "gnathostomes",
                                            label: "Động vật có hàm",
                                            englishLabel: "Gnathostomes",
                                            type: "clade",
                                            description: "Động vật có xương sống có hàm: cá mập, cá xương và tất cả con cháu trên cạn, kể cả chúng ta.",
                                            era: "Ordovic",
                                            color: "#fb7185",
                                            traits: ["Hàm", "Vây đôi hoặc chi đôi"],
                                            children: [
                                                {
                                                    id: "cartilaginous_fish",
                                                    label: "Cá Sụn",
                                                    englishLabel: "Cartilaginous Fish",
                                                    type: "order",
                                                    description: "Cá mập, cá đuối. Bộ xương hoàn toàn bằng sụn.",
                                                    era: "Devonian",
                                                    color: "#881337",
                                                    traits: ["Xương sụn", "Da nhám"],
                                                    infographicUrl: "evolution/Cartilaginous Fish.jpeg"
                                                },
                                                {
                                                    id: "bony_fish",
                                                    label: "Cá xương & hậu duệ",
                                                    englishLabel: "Bony Fish",
                                                    type: "order",
                                                    description: "Nhóm cá đa dạng nhất. Có bộ xương cứng bằng canxi. Nhánh này gồm cả động vật bốn chân (có chúng ta) vì tổ tiên của chúng là cá vây thùy.",
                                                    era: "Silurian",
                                                    color: "#701a2e",
                                                    traits: ["Xương cứng", "Bóng bơi"],
                                                    infographicUrl: "evolution/Bony Fish.jpeg",
                                                    children: [
                                                        {
                                                            id: "ray_finned_fish",
                                                            label: "Cá Vây Tia",
                                                            englishLabel: "Ray-finned Fish",
                                                            type: "family",
                                                            description: "Đa số các loài cá hiện nay. Vây được hỗ trợ bởi các tia xương.",
                                                            era: "Devonian",
                                                            color: "#e11d48",
                                                            traits: ["Vây tia"],
                                                            infographicUrl: "evolution/Ray-finned Fish.jpeg"
                                                        },
                                                        {
                                                            id: "lobe_finned_fish",
                                                            label: "Cá vây thùy & hậu duệ",
                                                            englishLabel: "Lobe-finned Fish",
                                                            type: "clade",
                                                            description: "Tổ tiên của động vật bốn chân. Vây có xương và cơ bắp.",
                                                            era: "Devonian",
                                                            color: "#9f1239",
                                                            traits: ["Vây thùy", "Phổi (nguyên thủy)"],
                                                            infographicUrl: "evolution/Lobe-finned Fish.jpeg",
                                                            children: [
                                                                {
                                                                    id: "coelacanths",
                                                                    label: "Cá vây tay",
                                                                    englishLabel: "Coelacanths",
                                                                    type: "order",
                                                                    description: "Loài cá vây thùy cổ xưa, từng bị tưởng đã tuyệt chủng cho tới khi ngư dân bắt được một con còn sống năm 1938.",
                                                                    era: "Devon",
                                                                    color: "#fb7185",
                                                                    traits: ["Vây thùy", "\"Hóa thạch sống\""]
                                                                },
                                                                {
                                                                    id: "rhipidistia",
                                                                    label: "Cá phổi & động vật bốn chân",
                                                                    englishLabel: "Rhipidistia",
                                                                    type: "clade",
                                                                    description: "Cá phổi là họ hàng gần nhất còn sống của động vật bốn chân. Tổ tiên chung của chúng có vây thùy chắc khỏe và biết thở không khí.",
                                                                    era: "Devon",
                                                                    color: "#fb7185",
                                                                    traits: ["Vây thùy có xương", "Thở bằng phổi"],
                                                                    children: [
                                                                        {
                                                                            id: "lungfish",
                                                                            label: "Cá phổi",
                                                                            englishLabel: "Lungfish",
                                                                            type: "order",
                                                                            description: "Cá có phổi, thở được không khí và sống sót nhiều tháng trong bùn khô. Là loài cá gần với động vật bốn chân nhất.",
                                                                            era: "Devon",
                                                                            color: "#fb7185",
                                                                            traits: ["Thở bằng phổi", "Sống ở châu Phi, Nam Mỹ, Úc"]
                                                                        },
                                                                        {
                                                                            id: "tetrapods",
                                                                            label: "Động vật bốn chi",
                                                                            englishLabel: "Tetrapods",
                                                                            type: "clade",
                                                                            description: "Tất cả động vật có chân (hoặc tổ tiên có chân) đã chinh phục đất liền.",
                                                                            era: "Devonian (365 triệu năm trước)",
                                                                            color: "#9f1239",
                                                                            traits: ["4 chi", "Ngón chân"],
                                                                            infographicUrl: "evolution/Tetrapods.jpeg",
                                                                            children: [
                                                                                {
                                                                                    id: "amphibians",
                                                                                    label: "Lưỡng Cư",
                                                                                    englishLabel: "Amphibians",
                                                                                    type: "class",
                                                                                    description: "Những người tiên phong lên cạn nhưng vẫn lệ thuộc vào nước để sinh sản.",
                                                                                    era: "Devonian",
                                                                                    color: "#9f1239",
                                                                                    traits: ["Sống hai môi trường", "Da trần ẩm ướt"],
                                                                                    infographicUrl: "evolution/Amphibians.jpeg",
                                                                                    children: [
                                                                                        {
                                                                                            id: "frogs_toads",
                                                                                            label: "Ếch & Cóc",
                                                                                            englishLabel: "Frogs & Toads",
                                                                                            type: "order",
                                                                                            description: "Nhóm lưỡng cư không đuôi, chân sau phát triển để nhảy.",
                                                                                            era: "Triassic",
                                                                                            color: "#be123c",
                                                                                            traits: ["Không đuôi", "Nhảy"],
                                                                                            infographicUrl: "evolution/Frogs & Toads.jpeg"
                                                                                        },
                                                                                        {
                                                                                            id: "salamanders_newts",
                                                                                            label: "Kỳ Giông & Sa Giông",
                                                                                            englishLabel: "Salamanders & Newts",
                                                                                            type: "order",
                                                                                            description: "Lưỡng cư có đuôi và hình dáng giống thằn lằn.",
                                                                                            era: "Jurassic",
                                                                                            color: "#9f1239",
                                                                                            traits: ["Có đuôi", "Tái sinh chi"],
                                                                                            infographicUrl: "evolution/Salamanders & Newts.jpeg"
                                                                                        },
                                                                                        {
                                                                                            id: "caecilians",
                                                                                            label: "Lưỡng Cư Không Chân",
                                                                                            englishLabel: "Caecilians",
                                                                                            type: "order",
                                                                                            description: "Sống dưới đất, hình dáng giống giun hoặc rắn.",
                                                                                            era: "Jurassic",
                                                                                            color: "#881337",
                                                                                            traits: ["Không chân", "Mắt tiêu giảm"],
                                                                                            infographicUrl: "evolution/Caecilians.jpeg"
                                                                                        }
                                                                                    ]
                                                                                },
                                                                                {
                                                                                    id: "amniotes",
                                                                                    label: "Động vật màng ối",
                                                                                    englishLabel: "Amniotes",
                                                                                    type: "clade",
                                                                                    description: "Sự đổi mới vĩ đại: Trứng có vỏ hoặc màng ối giúp động vật sinh sản hoàn toàn trên cạn khô ráo.",
                                                                                    era: "Carboniferous (312 triệu năm trước)",
                                                                                    color: "#881337",
                                                                                    traits: ["Trứng có màng ối", "Da không thấm nước"],
                                                                                    infographicUrl: "evolution/Amniotes.jpeg",
                                                                                    children: [
                                                                                        {
                                                                                            id: "synapsids",
                                                                                            label: "Synapsids (Nhánh Thú)",
                                                                                            englishLabel: "Synapsids",
                                                                                            type: "clade",
                                                                                            description: "Nhánh dẫn đến động vật có vú ngày nay. Xương sọ có 1 hố thái dương.",
                                                                                            era: "Carboniferous",
                                                                                            color: "#f43f5e",
                                                                                            traits: ["1 hố thái dương", "Răng phân hóa"],
                                                                                            infographicUrl: "evolution/Synapsids.jpeg",
                                                                                            children: [
                                                                                                {
                                                                                                    id: "early_synapsids",
                                                                                                    label: "Synapsids cổ (nhóm tổ tiên)",
                                                                                                    englishLabel: "Early synapsids (pelycosaurs, simple)",
                                                                                                    type: "order",
                                                                                                    description: "Nhóm Synapsids sớm nhất, bao gồm Pelycosaurs (ví dụ Dimetrodon). Có màng da lớn trên lưng. Nhóm tổ tiên: thú về sau mọc ra từ những họ hàng của chúng.",
                                                                                                    era: "Carboniferous",
                                                                                                    color: "#fb7185",
                                                                                                    traits: ["Màng lưng", "Biến nhiệt"],
                                                                                                    infographicUrl: "evolution/Early synapsids.jpeg",
                                                                                                    grade: true
                                                                                                },
                                                                                                {
                                                                                                    id: "therapsids",
                                                                                                    label: "Therapsids (thú bò sát)",
                                                                                                    englishLabel: "Therapsids (mammal-like reptiles, simple)",
                                                                                                    type: "clade",
                                                                                                    description: "Tổ tiên trực tiếp của động vật có vú.",
                                                                                                    era: "Permian",
                                                                                                    color: "#f43f5e",
                                                                                                    traits: ["Chân dưới thân", "Răng chuyên hóa"],
                                                                                                    infographicUrl: "evolution/Therapsids.jpeg",
                                                                                                    children: [
                                                                                                        {
                                                                                                            id: "dicynodonts",
                                                                                                            label: "Dicynodonts (ăn cỏ, tuyệt chủng)",
                                                                                                            englishLabel: "Dicynodonts (extinct herbivores)",
                                                                                                            type: "order",
                                                                                                            description: "Nhóm thú bò sát ăn cỏ rất thành công trước thời đại khủng long. Có 2 răng nanh lớn.",
                                                                                                            era: "Permian",
                                                                                                            color: "#fb7185",
                                                                                                            traits: ["Ăn cỏ", "Mỏ sừng", "2 răng nanh"],
                                                                                                            infographicUrl: "evolution/Dicynodonts.jpeg"
                                                                                                        },
                                                                                                        {
                                                                                                            id: "cynodonts",
                                                                                                            label: "Cynodonts (nhánh dẫn tới thú có vú)",
                                                                                                            englishLabel: "Cynodonts (line toward mammals)",
                                                                                                            type: "clade",
                                                                                                            description: "Nhóm chuyển tiếp từ bò sát sang thú. Bắt đầu có lông mao và máu nóng.",
                                                                                                            era: "Triassic",
                                                                                                            color: "#e11d48",
                                                                                                            traits: ["Lông mao", "Máu nóng (sơ khai)"],
                                                                                                            infographicUrl: "evolution/Cynodonts.jpeg",
                                                                                                            children: [
                                                                                                                {
                                                                                                                    id: "mammals",
                                                                                                                    label: "Thú (Có Vú)",
                                                                                                                    englishLabel: "Mammals",
                                                                                                                    type: "class",
                                                                                                                    description: "Động vật hằng nhiệt, nuôi con bằng sữa, có lông mao. Hệ thần kinh phát triển cao nhất.",
                                                                                                                    era: "Triassic",
                                                                                                                    color: "#fb7185",
                                                                                                                    traits: ["Lông mao", "Tuyến sữa", "Não bộ phát triển"],
                                                                                                                    infographicUrl: "evolution/Mammals.jpeg",
                                                                                                                    children: [
                                                                                                                        {
                                                                                                                            id: "monotremes",
                                                                                                                            label: "Thú Đẻ Trứng",
                                                                                                                            englishLabel: "Monotremes",
                                                                                                                            type: "order",
                                                                                                                            description: "Nhóm thú nguyên thủy nhất (Thú mỏ vịt). Đẻ trứng nhưng nuôi con bằng sữa.",
                                                                                                                            era: "Cretaceous",
                                                                                                                            color: "#9f1239",
                                                                                                                            traits: ["Đẻ trứng", "Có huyệt"],
                                                                                                                            infographicUrl: "evolution/Monotremes.jpeg"
                                                                                                                        },
                                                                                                                        {
                                                                                                                            id: "marsupials",
                                                                                                                            label: "Thú Có Túi",
                                                                                                                            englishLabel: "Marsupials",
                                                                                                                            type: "order",
                                                                                                                            description: "Chuột túi, Koala. Con non lớn lên trong túi mẹ.",
                                                                                                                            era: "Cretaceous",
                                                                                                                            color: "#be123c",
                                                                                                                            traits: ["Có túi", "Con non yếu"],
                                                                                                                            infographicUrl: "evolution/Marsupials.jpeg"
                                                                                                                        },
                                                                                                                        {
                                                                                                                            id: "placental_mammals",
                                                                                                                            label: "Thú Nhau Thai",
                                                                                                                            englishLabel: "Placental Mammals",
                                                                                                                            type: "order",
                                                                                                                            description: "Nhóm phát triển nhất. Con non phát triển trong tử cung.",
                                                                                                                            era: "Cretaceous",
                                                                                                                            color: "#e11d48",
                                                                                                                            traits: ["Nhau thai", "Phát triển hoàn thiện"],
                                                                                                                            infographicUrl: "evolution/Placental Mammals.jpeg",
                                                                                                                            children: [
                                                                                                                                {
                                                                                                                                    id: "proboscidea",
                                                                                                                                    label: "Họ hàng nhà voi",
                                                                                                                                    englishLabel: "Proboscidea",
                                                                                                                                    type: "order",
                                                                                                                                    description: "Bộ Có vòi gồm voi châu Phi, voi châu Á và voi ma mút đã tuyệt chủng. Voi ma mút gần với voi châu Á hơn voi châu Phi.",
                                                                                                                                    era: "Neogen",
                                                                                                                                    color: "#fb7185",
                                                                                                                                    traits: ["Vòi dài", "Ngà"],
                                                                                                                                    children: [
                                                                                                                                        {
                                                                                                                                            id: "african_elephant",
                                                                                                                                            label: "Voi châu Phi",
                                                                                                                                            englishLabel: "African elephants",
                                                                                                                                            type: "genus",
                                                                                                                                            description: "Động vật trên cạn lớn nhất hiện nay, tai rất to. Cả voi đực và voi cái đều có ngà.",
                                                                                                                                            era: "Neogen",
                                                                                                                                            color: "#fb7185",
                                                                                                                                            traits: ["Tai lớn", "Cả hai giới đều có ngà"]
                                                                                                                                        },
                                                                                                                                        {
                                                                                                                                            id: "asian_elephant",
                                                                                                                                            label: "Voi châu Á",
                                                                                                                                            englishLabel: "Asian elephant",
                                                                                                                                            type: "species",
                                                                                                                                            description: "Voi sống ở châu Á, kể cả Tây Nguyên Việt Nam. Tai nhỏ hơn voi châu Phi, thường chỉ voi đực có ngà dài.",
                                                                                                                                            era: "Neogen",
                                                                                                                                            color: "#fb7185",
                                                                                                                                            traits: ["Tai nhỏ", "Họ hàng gần của voi ma mút"]
                                                                                                                                        },
                                                                                                                                        {
                                                                                                                                            id: "mammoth",
                                                                                                                                            label: "Voi ma mút",
                                                                                                                                            englishLabel: "Woolly mammoth",
                                                                                                                                            type: "species",
                                                                                                                                            description: "Voi lông dày sống trong Kỷ Băng hà. Những con cuối cùng sống trên đảo Wrangel và biến mất khoảng 4.000 năm trước, khi Kim tự tháp Ai Cập đã xây xong.",
                                                                                                                                            era: "Đệ Tứ",
                                                                                                                                            color: "#94a3b8",
                                                                                                                                            traits: ["Lông dày", "Ngà cong dài"]
                                                                                                                                        }
                                                                                                                                    ]
                                                                                                                                },
                                                                                                                                {
                                                                                                                                    id: "euarchontoglires",
                                                                                                                                    label: "Nhánh linh trưởng & gặm nhấm",
                                                                                                                                    englishLabel: "Euarchontoglires",
                                                                                                                                    type: "clade",
                                                                                                                                    description: "Một nhánh thú nhau thai gồm linh trưởng (khỉ, vượn, người), gặm nhấm (chuột, sóc) và thỏ.",
                                                                                                                                    era: "Phấn Trắng",
                                                                                                                                    color: "#fb7185",
                                                                                                                                    traits: ["Thú nhau thai", "Nhiều loài sống trên cây"],
                                                                                                                                    children: [
                                                                                                                                        {
                                                                                                                                            id: "primates",
                                                                                                                                            label: "Linh Trưởng",
                                                                                                                                            englishLabel: "Primates",
                                                                                                                                            type: "order",
                                                                                                                                            description: "Khỉ, Vượn, Người. Thông minh và khéo léo.",
                                                                                                                                            era: "Paleogene",
                                                                                                                                            color: "#fb7185",
                                                                                                                                            traits: ["Thông minh", "Đối ngón cái"],
                                                                                                                                            infographicUrl: "evolution/Primates.jpeg",
                                                                                                                                            children: [
                                                                                                                                                {
                                                                                                                                                    id: "lemurs",
                                                                                                                                                    label: "Vượn cáo & cu li",
                                                                                                                                                    englishLabel: "Lemurs & lorises",
                                                                                                                                                    type: "suborder",
                                                                                                                                                    description: "Linh trưởng mũi ướt như vượn cáo ở Madagascar và cu li ở Việt Nam.",
                                                                                                                                                    era: "Phấn Trắng",
                                                                                                                                                    color: "#fb7185",
                                                                                                                                                    traits: ["Mũi ướt", "Mắt to, nhiều loài sống về đêm"]
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    id: "simians",
                                                                                                                                                    label: "Khỉ & vượn người",
                                                                                                                                                    englishLabel: "Simians",
                                                                                                                                                    type: "clade",
                                                                                                                                                    description: "Linh trưởng có mặt phẳng và mắt nhìn thẳng về phía trước: khỉ châu Mỹ, khỉ châu Á – châu Phi và vượn người.",
                                                                                                                                                    era: "Paleogen",
                                                                                                                                                    color: "#fb7185",
                                                                                                                                                    traits: ["Mắt nhìn phía trước", "Não lớn"],
                                                                                                                                                    children: [
                                                                                                                                                        {
                                                                                                                                                            id: "new_world_monkeys",
                                                                                                                                                            label: "Khỉ châu Mỹ",
                                                                                                                                                            englishLabel: "New World monkeys",
                                                                                                                                                            type: "clade",
                                                                                                                                                            description: "Khỉ ở Trung và Nam Mỹ, mũi dẹt. Nhiều loài có đuôi cầm nắm được như bàn tay thứ năm.",
                                                                                                                                                            era: "Paleogen",
                                                                                                                                                            color: "#fb7185",
                                                                                                                                                            traits: ["Mũi dẹt", "Đuôi cầm nắm"]
                                                                                                                                                        },
                                                                                                                                                        {
                                                                                                                                                            id: "old_world_monkeys",
                                                                                                                                                            label: "Khỉ châu Á – châu Phi",
                                                                                                                                                            englishLabel: "Old World monkeys",
                                                                                                                                                            type: "family",
                                                                                                                                                            description: "Khỉ vàng, khỉ đầu chó, voọc… Lỗ mũi hướng xuống. Nhóm này gần với vượn người hơn khỉ châu Mỹ.",
                                                                                                                                                            era: "Paleogen",
                                                                                                                                                            color: "#fb7185",
                                                                                                                                                            traits: ["Lỗ mũi hướng xuống", "Đuôi không cầm nắm"]
                                                                                                                                                        },
                                                                                                                                                        {
                                                                                                                                                            id: "great_apes",
                                                                                                                                                            label: "Vượn người lớn",
                                                                                                                                                            englishLabel: "Great apes (Hominidae)",
                                                                                                                                                            type: "family",
                                                                                                                                                            description: "Đười ươi, khỉ đột, tinh tinh và con người: không có đuôi và rất thông minh.",
                                                                                                                                                            era: "Neogen",
                                                                                                                                                            color: "#fb7185",
                                                                                                                                                            traits: ["Không đuôi", "Rất thông minh"],
                                                                                                                                                            children: [
                                                                                                                                                                {
                                                                                                                                                                    id: "orangutans",
                                                                                                                                                                    label: "Đười ươi",
                                                                                                                                                                    englishLabel: "Orangutans",
                                                                                                                                                                    type: "genus",
                                                                                                                                                                    description: "Vượn người lông đỏ sống trên cây ở rừng Borneo và Sumatra.",
                                                                                                                                                                    era: "Neogen",
                                                                                                                                                                    color: "#fb7185",
                                                                                                                                                                    traits: ["Sống trên cây", "Tay rất dài"]
                                                                                                                                                                },
                                                                                                                                                                {
                                                                                                                                                                    id: "gorillas",
                                                                                                                                                                    label: "Khỉ đột",
                                                                                                                                                                    englishLabel: "Gorillas",
                                                                                                                                                                    type: "genus",
                                                                                                                                                                    description: "Loài linh trưởng lớn nhất, sống ở rừng châu Phi, chủ yếu ăn lá cây.",
                                                                                                                                                                    era: "Neogen",
                                                                                                                                                                    color: "#fb7185",
                                                                                                                                                                    traits: ["To khỏe nhất trong linh trưởng", "Ăn thực vật"]
                                                                                                                                                                },
                                                                                                                                                                {
                                                                                                                                                                    id: "hominini",
                                                                                                                                                                    label: "Tinh tinh & người",
                                                                                                                                                                    englishLabel: "Chimps & humans",
                                                                                                                                                                    type: "clade",
                                                                                                                                                                    description: "Người và tinh tinh (cả tinh tinh lùn bonobo) là họ hàng gần nhất của nhau, có chung tổ tiên sống khoảng 6–7 triệu năm trước.",
                                                                                                                                                                    era: "Neogen",
                                                                                                                                                                    color: "#fda4af",
                                                                                                                                                                    traits: ["Chung khoảng 98–99% ADN", "Sống theo nhóm"],
                                                                                                                                                                    children: [
                                                                                                                                                                        {
                                                                                                                                                                            id: "chimpanzees",
                                                                                                                                                                            label: "Tinh tinh",
                                                                                                                                                                            englishLabel: "Chimpanzees & bonobos",
                                                                                                                                                                            type: "genus",
                                                                                                                                                                            description: "Họ hàng gần nhất của con người. Biết dùng que để câu mối và dùng đá để đập hạt.",
                                                                                                                                                                            era: "Neogen",
                                                                                                                                                                            color: "#fb7185",
                                                                                                                                                                            traits: ["Dùng công cụ", "Sống theo đàn"]
                                                                                                                                                                        },
                                                                                                                                                                        {
                                                                                                                                                                            id: "humans",
                                                                                                                                                                            label: "Người",
                                                                                                                                                                            englishLabel: "Humans (Homo sapiens)",
                                                                                                                                                                            type: "species",
                                                                                                                                                                            description: "Loài vượn người đi thẳng bằng hai chân, có bộ não lớn và ngôn ngữ phức tạp. Chúng ta là một ngọn nhỏ mới mọc trên cây sự sống.",
                                                                                                                                                                            era: "Đệ Tứ",
                                                                                                                                                                            color: "#fde68a",
                                                                                                                                                                            traits: ["Đi bằng hai chân", "Ngôn ngữ và chữ viết"],
                                                                                                                                                                            youAreHere: true
                                                                                                                                                                        }
                                                                                                                                                                    ]
                                                                                                                                                                }
                                                                                                                                                            ]
                                                                                                                                                        }
                                                                                                                                                    ]
                                                                                                                                                }
                                                                                                                                            ]
                                                                                                                                        },
                                                                                                                                        {
                                                                                                                                            id: "rodents",
                                                                                                                                            label: "Gặm Nhấm",
                                                                                                                                            englishLabel: "Rodents",
                                                                                                                                            type: "family",
                                                                                                                                            description: "Chuột, Sóc.",
                                                                                                                                            era: "Paleogene",
                                                                                                                                            color: "#f43f5e",
                                                                                                                                            traits: ["Răng cửa lớn"],
                                                                                                                                            infographicUrl: "evolution/Rodents.jpeg"
                                                                                                                                        }
                                                                                                                                    ]
                                                                                                                                },
                                                                                                                                {
                                                                                                                                    id: "laurasiatheria",
                                                                                                                                    label: "Nhánh dơi, thú ăn thịt & móng guốc",
                                                                                                                                    englishLabel: "Laurasiatheria",
                                                                                                                                    type: "clade",
                                                                                                                                    description: "Nhánh thú nhau thai rất đa dạng: dơi, chó mèo, ngựa, bò, lợn và cả cá voi.",
                                                                                                                                    era: "Phấn Trắng",
                                                                                                                                    color: "#fb7185",
                                                                                                                                    traits: ["Thú nhau thai", "Rất đa dạng"],
                                                                                                                                    children: [
                                                                                                                                        {
                                                                                                                                            id: "bats",
                                                                                                                                            label: "Dơi",
                                                                                                                                            englishLabel: "Bats",
                                                                                                                                            type: "family",
                                                                                                                                            description: "Thú biết bay.",
                                                                                                                                            era: "Paleogene",
                                                                                                                                            color: "#e11d48",
                                                                                                                                            traits: ["Biết bay", "Siêu âm"],
                                                                                                                                            infographicUrl: "evolution/Bats.jpeg"
                                                                                                                                        },
                                                                                                                                        {
                                                                                                                                            id: "carnivores",
                                                                                                                                            label: "Thú Ăn Thịt",
                                                                                                                                            englishLabel: "Carnivores",
                                                                                                                                            type: "family",
                                                                                                                                            description: "Chó, Mèo, Gấu, Hổ.",
                                                                                                                                            era: "Paleogene",
                                                                                                                                            color: "#be123c",
                                                                                                                                            traits: ["Răng nanh", "Săn mồi"],
                                                                                                                                            infographicUrl: "evolution/Carnivores.jpeg"
                                                                                                                                        },
                                                                                                                                        {
                                                                                                                                            id: "odd_toed",
                                                                                                                                            label: "Ngựa, tê giác & heo vòi",
                                                                                                                                            englishLabel: "Odd-toed ungulates",
                                                                                                                                            type: "order",
                                                                                                                                            description: "Thú móng guốc lẻ: trục chân đi qua ngón giữa. Gồm ngựa, tê giác và heo vòi.",
                                                                                                                                            era: "Phấn Trắng",
                                                                                                                                            color: "#fb7185",
                                                                                                                                            traits: ["Số ngón lẻ", "Ăn cỏ"]
                                                                                                                                        },
                                                                                                                                        {
                                                                                                                                            id: "even_toed",
                                                                                                                                            label: "Guốc chẵn & cá voi",
                                                                                                                                            englishLabel: "Cetartiodactyla",
                                                                                                                                            type: "order",
                                                                                                                                            description: "Thú guốc chẵn (bò, hươu, lợn, hà mã) và cá voi. Họ hàng gần nhất của cá voi là hà mã.",
                                                                                                                                            era: "Paleogen",
                                                                                                                                            color: "#fb7185",
                                                                                                                                            traits: ["Ngón chân chẵn ở loài trên cạn", "Nhiều loài ăn cỏ"],
                                                                                                                                            children: [
                                                                                                                                                {
                                                                                                                                                    id: "cows_deer",
                                                                                                                                                    label: "Bò, dê & hươu",
                                                                                                                                                    englishLabel: "Ruminants",
                                                                                                                                                    type: "suborder",
                                                                                                                                                    description: "Thú nhai lại: dạ dày nhiều ngăn giúp tiêu hóa cỏ, ăn xong lại ợ lên nhai tiếp.",
                                                                                                                                                    era: "Paleogen",
                                                                                                                                                    color: "#fb7185",
                                                                                                                                                    traits: ["Nhai lại", "Dạ dày bốn ngăn"]
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    id: "pigs",
                                                                                                                                                    label: "Lợn",
                                                                                                                                                    englishLabel: "Pigs",
                                                                                                                                                    type: "family",
                                                                                                                                                    description: "Lợn nhà có tổ tiên là lợn rừng. Mõm rất thính, dùng để đào đất tìm thức ăn.",
                                                                                                                                                    era: "Paleogen",
                                                                                                                                                    color: "#fb7185",
                                                                                                                                                    traits: ["Mõm đào đất", "Ăn tạp"]
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    id: "hippos",
                                                                                                                                                    label: "Hà mã",
                                                                                                                                                    englishLabel: "Hippopotamuses",
                                                                                                                                                    type: "family",
                                                                                                                                                    description: "Sống ở sông hồ châu Phi, ngâm mình dưới nước cả ngày. Là họ hàng còn sống gần nhất của cá voi.",
                                                                                                                                                    era: "Paleogen",
                                                                                                                                                    color: "#fb7185",
                                                                                                                                                    traits: ["Sống nửa dưới nước", "Da tiết \"mồ hôi đỏ\" chống nắng"]
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    id: "whales_dolphins",
                                                                                                                                                    label: "Cá voi & cá heo",
                                                                                                                                                    englishLabel: "Whales & Dolphins",
                                                                                                                                                    type: "family",
                                                                                                                                                    description: "Thú trở lại sống dưới nước.",
                                                                                                                                                    era: "Paleogene",
                                                                                                                                                    color: "#881337",
                                                                                                                                                    traits: ["Sống dưới nước", "Lỗ thở"],
                                                                                                                                                    infographicUrl: "evolution/Whales & Dolphins.jpeg"
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
                                                                                        },
                                                                                        {
                                                                                            id: "sauropsids",
                                                                                            label: "Sauropsids (Nhánh Bò Sát)",
                                                                                            englishLabel: "Sauropsids",
                                                                                            type: "clade",
                                                                                            description: "Tổ tiên của tất cả các loài bò sát và chim hiện đại.",
                                                                                            era: "Carboniferous",
                                                                                            color: "#b91c1c",
                                                                                            traits: ["Mặt kìm", "Biến nhiệt (chủ yếu)"],
                                                                                            infographicUrl: "evolution/Sauropsids.jpeg",
                                                                                            children: [
                                                                                                {
                                                                                                    id: "reptiles_phylo",
                                                                                                    label: "Bò Sát",
                                                                                                    englishLabel: "Reptiles",
                                                                                                    type: "class",
                                                                                                    description: "Động vật biến nhiệt, da khô có vảy. Theo cây phát sinh, chim cũng thuộc nhánh bò sát, vì chim là hậu duệ của khủng long.",
                                                                                                    era: "Carboniferous",
                                                                                                    color: "#991b1b",
                                                                                                    traits: ["Da vảy", "Trứng vỏ dai"],
                                                                                                    infographicUrl: "evolution/Reptiles.jpeg",
                                                                                                    children: [
                                                                                                        {
                                                                                                            id: "testudines",
                                                                                                            label: "Rùa",
                                                                                                            englishLabel: "Testudines",
                                                                                                            type: "order",
                                                                                                            description: "Nhóm bò sát cổ xưa với chiếc mai đặc trưng bảo vệ cơ thể.",
                                                                                                            era: "Triassic",
                                                                                                            color: "#7f1d1d",
                                                                                                            traits: ["Mai cứng", "Không răng", "Sống lâu"],
                                                                                                            infographicUrl: "evolution/Testudines.jpeg",
                                                                                                            children: [
                                                                                                                {
                                                                                                                    id: "turtles",
                                                                                                                    label: "Các loài Rùa",
                                                                                                                    englishLabel: "Turtles",
                                                                                                                    type: "family",
                                                                                                                    description: "Bao gồm rùa cạn, rùa nước ngọt và rùa biển.",
                                                                                                                    era: "Triassic",
                                                                                                                    color: "#ef4444",
                                                                                                                    traits: ["Mai sừng", "Chậm chạp"],
                                                                                                                    infographicUrl: "evolution/Turtles.jpeg"
                                                                                                                }
                                                                                                            ]
                                                                                                        },
                                                                                                        {
                                                                                                            id: "lepidosauria",
                                                                                                            label: "Lepidosauria (Thằn lằn & Rắn)",
                                                                                                            englishLabel: "Lepidosauria",
                                                                                                            type: "superorder",
                                                                                                            description: "Nhóm bò sát lớn nhất hiện nay. Da có vảy chồng lên nhau và lột xác định kỳ.",
                                                                                                            era: "Triassic",
                                                                                                            color: "#dc2626",
                                                                                                            traits: ["Lột xác", "Hàm linh hoạt"],
                                                                                                            infographicUrl: "evolution/Lepidosauria.jpeg",
                                                                                                            children: [
                                                                                                                {
                                                                                                                    id: "tuatara",
                                                                                                                    label: "Tuatara",
                                                                                                                    englishLabel: "Tuatara",
                                                                                                                    type: "order",
                                                                                                                    description: "Hóa thạch sống duy nhất còn lại ở New Zealand. Có con mắt thứ 3.",
                                                                                                                    era: "Triassic",
                                                                                                                    color: "#7f1d1d",
                                                                                                                    traits: ["Mắt giữa", "Sống đêm"],
                                                                                                                    infographicUrl: "evolution/Tuatara.jpeg"
                                                                                                                },
                                                                                                                {
                                                                                                                    id: "lizards_snakes",
                                                                                                                    label: "Thằn Lằn & Rắn",
                                                                                                                    englishLabel: "Squamata",
                                                                                                                    type: "order",
                                                                                                                    description: "Rất đa dạng. Rắn đã mất chân trong quá trình tiến hóa để thích nghi chui rúc.",
                                                                                                                    era: "Jurassic",
                                                                                                                    color: "#ef4444",
                                                                                                                    traits: ["Lưỡi chẻ", "Khớp hàm lỏng"],
                                                                                                                    infographicUrl: "evolution/Squamata.jpeg"
                                                                                                                }
                                                                                                            ]
                                                                                                        },
                                                                                                        {
                                                                                                            id: "archosauria",
                                                                                                            label: "Archosauria (Thằn lằn chúa)",
                                                                                                            englishLabel: "Archosauria",
                                                                                                            type: "clade",
                                                                                                            description: "Nhóm bò sát \"thống trị\" bao gồm cá sấu, khủng long và chim.",
                                                                                                            era: "Triassic",
                                                                                                            color: "#b91c1c",
                                                                                                            traits: ["Tim 4 ngăn", "Răng trong huyệt"],
                                                                                                            infographicUrl: "evolution/Archosauria.jpeg",
                                                                                                            children: [
                                                                                                                {
                                                                                                                    id: "crocodilians",
                                                                                                                    label: "Cá Sấu",
                                                                                                                    englishLabel: "Crocodilians",
                                                                                                                    type: "order",
                                                                                                                    description: "Những kẻ săn mồi lưỡng cư hung dữ, ít thay đổi suốt hàng triệu năm.",
                                                                                                                    era: "Cretaceous",
                                                                                                                    color: "#7f1d1d",
                                                                                                                    traits: ["Da giáp", "Săn mồi"],
                                                                                                                    infographicUrl: "evolution/Crocodilians.jpeg"
                                                                                                                },
                                                                                                                {
                                                                                                                    id: "dinosaurs",
                                                                                                                    label: "Khủng Long",
                                                                                                                    englishLabel: "Dinosaurs",
                                                                                                                    type: "superorder",
                                                                                                                    description: "Nhóm động vật thống trị Trái Đất trong kỷ Jura và Phấn trắng.",
                                                                                                                    era: "Triassic",
                                                                                                                    color: "#f87171",
                                                                                                                    traits: ["Chân đứng thẳng", "Đa dạng kích thước"],
                                                                                                                    infographicUrl: "evolution/Dinosaurs.jpeg",
                                                                                                                    children: [
                                                                                                                        {
                                                                                                                            id: "ornithischia",
                                                                                                                            label: "Khủng long hông chim",
                                                                                                                            englishLabel: "Ornithischia",
                                                                                                                            type: "order",
                                                                                                                            description: "Khủng long ăn thực vật như Triceratops (Ba sừng) hay Stegosaurus (Kiếm).",
                                                                                                                            era: "Jurassic",
                                                                                                                            color: "#fca5a5",
                                                                                                                            traits: ["Ăn cỏ", "Hông giống chim"],
                                                                                                                            infographicUrl: "evolution/Ornithischia.jpeg"
                                                                                                                        },
                                                                                                                        {
                                                                                                                            id: "saurischia",
                                                                                                                            label: "Khủng long hông thằn lằn",
                                                                                                                            englishLabel: "Saurischia",
                                                                                                                            type: "order",
                                                                                                                            description: "Bao gồm những gã khổng lồ cổ dài và những kẻ săn mồi hung bạo.",
                                                                                                                            era: "Triassic",
                                                                                                                            color: "#f87171",
                                                                                                                            traits: ["Hông thằn lằn", "Cổ dài hoặc ăn thịt"],
                                                                                                                            infographicUrl: "evolution/Saurischia.jpeg",
                                                                                                                            children: [
                                                                                                                                {
                                                                                                                                    id: "sauropods",
                                                                                                                                    label: "Khủng long cổ dài",
                                                                                                                                    englishLabel: "Sauropods",
                                                                                                                                    type: "suborder",
                                                                                                                                    description: "Động vật trên cạn lớn nhất lịch sử. Cổ dài, đuôi dài, đi bằng 4 chân.",
                                                                                                                                    era: "Jurassic",
                                                                                                                                    color: "#fca5a5",
                                                                                                                                    traits: ["Khổng lồ", "Ăn thực vật"],
                                                                                                                                    infographicUrl: "evolution/Sauropods.jpeg"
                                                                                                                                },
                                                                                                                                {
                                                                                                                                    id: "theropods",
                                                                                                                                    label: "Khủng long chân thú (Theropods)",
                                                                                                                                    englishLabel: "Theropods",
                                                                                                                                    type: "suborder",
                                                                                                                                    description: "Nhóm khủng long ăn thịt đứng bằng 2 chân (T-Rex, Velociraptor). Một nhánh nhỏ đã tiến hóa thành Chim.",
                                                                                                                                    era: "Jurassic",
                                                                                                                                    color: "#ef4444",
                                                                                                                                    traits: ["Đi 2 chân", "Ăn thịt", "Lông vũ"],
                                                                                                                                    infographicUrl: "evolution/Theropods.jpeg",
                                                                                                                                    children: [
                                                                                                                                        {
                                                                                                                                            id: "trex",
                                                                                                                                            label: "Khủng long bạo chúa",
                                                                                                                                            englishLabel: "Tyrannosaurus rex",
                                                                                                                                            type: "species",
                                                                                                                                            description: "Khủng long ăn thịt khổng lồ sống cuối kỷ Phấn Trắng ở Bắc Mỹ, tuyệt chủng 66 triệu năm trước. Là họ hàng khá gần của chim.",
                                                                                                                                            era: "Phấn Trắng",
                                                                                                                                            color: "#94a3b8",
                                                                                                                                            traits: ["Hàm cắn cực mạnh", "Hai tay ngắn"]
                                                                                                                                        },
                                                                                                                                        {
                                                                                                                                            id: "birds",
                                                                                                                                            label: "Chim",
                                                                                                                                            englishLabel: "Birds (Avian Dinosaurs)",
                                                                                                                                            type: "class",
                                                                                                                                            description: "Loài khủng long duy nhất còn sống sót sau thảm họa thiên thạch.",
                                                                                                                                            era: "Jurassic",
                                                                                                                                            color: "#4c0519",
                                                                                                                                            traits: ["Lông vũ", "Hằng nhiệt", "Bay"],
                                                                                                                                            infographicUrl: "evolution/Birds.jpeg",
                                                                                                                                            children: [
                                                                                                                                                {
                                                                                                                                                    id: "flightless_birds",
                                                                                                                                                    label: "Đà điểu & họ hàng",
                                                                                                                                                    englishLabel: "Ratites & tinamous (Palaeognathae)",
                                                                                                                                                    type: "order",
                                                                                                                                                    description: "Đà điểu, đà điểu châu Úc, chim kiwi… Chim cánh cụt cũng không bay nhưng thuộc một nhánh khác.",
                                                                                                                                                    era: "Cretaceous",
                                                                                                                                                    color: "#881337",
                                                                                                                                                    traits: ["Chân khỏe"],
                                                                                                                                                    infographicUrl: "evolution/Flightless.jpeg"
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    id: "birds_of_prey",
                                                                                                                                                    label: "Chim Săn Mồi",
                                                                                                                                                    englishLabel: "Birds of Prey",
                                                                                                                                                    type: "order",
                                                                                                                                                    description: "Đại bàng, diều hâu. Cú và chim cắt cũng săn mồi giỏi nhưng thuộc những nhánh khác.",
                                                                                                                                                    era: "Paleogene",
                                                                                                                                                    color: "#be123c",
                                                                                                                                                    traits: ["Móng vuốt"],
                                                                                                                                                    infographicUrl: "evolution/Birds of Prey.jpeg"
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                    id: "songbirds",
                                                                                                                                                    label: "Chim Hót",
                                                                                                                                                    englishLabel: "Songbirds",
                                                                                                                                                    type: "order",
                                                                                                                                                    description: "Sẻ, Họa mi.",
                                                                                                                                                    era: "Paleogene",
                                                                                                                                                    color: "#fb7185",
                                                                                                                                                    traits: ["Hót hay"],
                                                                                                                                                    infographicUrl: "evolution/Songbirds.jpeg"
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
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
