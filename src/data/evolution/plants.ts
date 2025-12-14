import { EvolutionNode } from './types';

export const plantae: EvolutionNode = {
    id: 'plantae_simple',
    label: 'Thực Vật',
    englishLabel: 'Plants',
    type: 'kingdom',
    description: 'Vương quốc xanh bao phủ Trái Đất. Chúng không chỉ cung cấp oxy mà còn là nguồn thức ăn cơ bản cho hầu hết sự sống trên cạn.',
    era: 'Paleozoic (470 triệu năm trước)',
    color: '#15803d', // Green-700
    traits: ['Đa bào nhân thực', 'Quang hợp tự dưỡng', 'Vách tế bào Cellulose'],
    infographicUrl: 'evolution/Plants.jpeg',
    drillable: true,
    children: [
        {
            id: 'algae_plants_bridge',
            label: 'Tảo Charophytes',
            englishLabel: 'Green algae (Charophytes)',
            type: 'branch',
            color: '#115e59', // Teal-800
            description: 'Nhóm tảo lục nước ngọt được coi là họ hàng gần nhất còn sống của thực vật trên cạn.',
            era: 'Precambrian',
            traits: ['Sống nước ngọt', 'Cấu trúc gen giống cây', 'Tiền thân của cây'],
            infographicUrl: 'evolution/Green algae (Charophytes).jpeg',
            children: [
                {
                    id: 'green_algae_plants',
                    label: 'Tảo xanh (Gần thực vật)',
                    englishLabel: 'Green algae (Simple)',
                    type: 'class',
                    color: '#134e4a', // Teal-900
                    description: 'Bước chuyển mình quan trọng từ đại dương lên vùng ven bờ.',
                    era: '500+ triệu năm trước',
                    traits: ['Chưa có rễ lá', 'Quang hợp mạnh'],
                    infographicUrl: 'evolution/Green algae (Simple).jpeg',
                    children: []
                }
            ]
        },
        {
            id: 'land_plants',
            label: 'Thực vật trên cạn',
            englishLabel: 'Embryophytes (Land Plants)',
            type: 'branch',
            color: '#166534', // Green-800
            description: 'Cuộc xâm lăng vĩ đại của sự sống lên mặt đất khô cằn. Chúng phát triển lớp sáp bảo vệ và nuôi phôi thai.',
            era: 'Ordovician (470 triệu năm trước)',
            traits: ['Sống trên cạn', 'Có phôi đa bào', 'Lớp cutin chống mất nước'],
            infographicUrl: 'evolution/Embryophytes.jpeg',
            children: [
                {
                    id: 'mosses',
                    label: 'Rêu (Thực vật không mạch)',
                    englishLabel: 'Bryophytes (Mosses)',
                    type: 'phylum',
                    color: '#365314', // Lime-900
                    description: 'Những người tiên phong nhỏ bé. Chưa có mạch dẫn nước nên phải sống bám sát đất ẩm ướt.',
                    era: 'Ordovician',
                    traits: ['Không có mạch dẫn', 'Không rễ thật', 'Thụ tinh cần nước'],
                    infographicUrl: 'evolution/Bryophytes.jpeg',
                    children: []
                },
                {
                    id: 'ferns',
                    label: 'Dương xỉ',
                    englishLabel: 'Pteridophytes (Ferns)',
                    type: 'phylum',
                    color: '#065f46', // Emerald-800
                    description: 'Phát minh ra "hệ thống ống nước" (mạch dẫn) giúp cây mọc cao đón nắng. Thống trị Trái Đất thời cổ đại (Kỷ Carbon).',
                    era: 'Devonian (360 triệu năm trước)',
                    traits: ['Có mạch dẫn (Xylem/Phloem)', 'Sinh sản bằng bào tử', 'Lá chét cuộn tròn'],
                    infographicUrl: 'evolution/Pteridophytes.jpeg',
                    children: []
                },
                {
                    id: 'gymnosperms',
                    label: 'Hạt trần',
                    englishLabel: 'Gymnosperms',
                    type: 'phylum',
                    color: '#064e3b', // Emerald-900
                    description: 'Kỷ nguyên của Hạt! Hạt giúp phôi sống sót qua mùa khô lạnh. "Trần" vì hạt nằm lộ trên nón thông, không được quả bao bọc.',
                    era: 'Carboniferous (300 triệu năm trước)',
                    traits: ['Hạt trần (không quả)', 'Thụ phấn nhờ gió', 'Lá kim chịu hạn'],
                    infographicUrl: 'evolution/Gymnosperms.jpeg',
                    children: [
                        {
                            id: 'conifers',
                            label: 'Thông & họ hàng',
                            englishLabel: 'Conifers',
                            type: 'class',
                            color: '#022c22', // Green-950
                            description: 'Nhóm thực vật hạt trần phổ biến nhất, xanh quanh năm, chịu được khí hậu lạnh.',
                            era: 'Triassic',
                            traits: ['Nón đực & nón cái', 'Gỗ mềm', 'Nhựa thơm'],
                            infographicUrl: 'evolution/Conifers.jpeg',
                            children: [
                                {
                                    id: 'pine_spruce_fir_examples',
                                    label: 'Thông / Tùng / Vân sam',
                                    englishLabel: 'Pine, Spruce, Fir',
                                    type: 'species',
                                    color: '#052e16',
                                    description: 'Các loài cây lá kim điển hình, tạo nên những cánh rừng Taiga bạt ngàn.',
                                    era: 'Hiện đại',
                                    traits: ['Lá kim', 'Hình tháp'],
                                    infographicUrl: 'evolution/Pine, Spruce, Fir.jpeg'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'angiosperms',
                    label: 'Hạt kín (Thực vật có hoa)',
                    englishLabel: 'Angiosperms',
                    type: 'phylum',
                    color: '#14532d', // Green-900
                    description: 'Nhóm thực vật thành công nhất hiện nay. Hoa thu hút côn trùng thụ phấn, quả bảo vệ và phát tán hạt.',
                    era: 'Cretaceous (140 triệu năm trước)',
                    traits: ['Có Hoa sặc sỡ', 'Có Quả che hạt', 'Thụ phấn kép'],
                    infographicUrl: 'evolution/Angiosperms.jpeg',
                    children: [
                        {
                            id: 'flowering_plants_monocots',
                            label: 'Cây một lá mầm',
                            englishLabel: 'Monocots',
                            type: 'class',
                            color: '#022c22', // Green-950
                            description: 'Nhóm cây mà hạt mầm chỉ có 1 chiếc lá đầu tiên. Gân lá thường song song.',
                            era: 'Cretaceous',
                            traits: ['1 lá mầm', 'Rễ chùm', 'Hoa mẫu 3'],
                            infographicUrl: 'evolution/Monocots.jpeg',
                            children: [
                                {
                                    id: 'rice_corn_wheat_examples',
                                    label: 'Lúa / Ngô / Lúa mì',
                                    englishLabel: 'Cereals (Rice, Corn, Wheat)',
                                    type: 'species',
                                    color: '#052e16',
                                    description: 'Nguồn lương thực chính của nhân loại (Ngũ cốc).',
                                    era: 'Hiện đại',
                                    traits: ['Rễ chùm', 'Thân thảo'],
                                    infographicUrl: 'evolution/cereals (rice, corn, wheat).jpeg'
                                },
                                {
                                    id: 'orchids_lilies_examples',
                                    label: 'Lan / Loa kèn',
                                    englishLabel: 'Orchids & Lilies',
                                    type: 'species',
                                    color: '#052e16',
                                    description: 'Các loài hoa đẹp, cấu trúc phức tạp, thường thụ phấn nhờ côn trùng chuyên biệt.',
                                    era: 'Hiện đại',
                                    traits: ['Hoa đẹp', 'Giả hành'],
                                    infographicUrl: 'evolution/Orchids & Lilies.jpeg'
                                }
                            ]
                        },
                        {
                            id: 'flowering_plants_dicots',
                            label: 'Cây hai lá mầm',
                            englishLabel: 'Dicots (Eudicots)',
                            type: 'class',
                            color: '#022c22', // Green-950
                            description: 'Nhóm cây mà hạt mầm có 2 chiếc lá. Gân lá thường hình mạng lưới.',
                            era: 'Cretaceous',
                            traits: ['2 lá mầm', 'Rễ cọc', 'Hoa mẫu 4 hoặc 5'],
                            infographicUrl: 'evolution/Dicots (Eudicots).jpeg',
                            children: [
                                {
                                    id: 'beans_roses_sunflowers_examples',
                                    label: 'Đậu / Hoa hồng / Hướng dương',
                                    englishLabel: 'Beans, Roses, Sunflowers',
                                    type: 'species',
                                    color: '#052e16',
                                    description: 'Rất đa dạng, từ cây bụi gai góc đến hoa hướng dương rực rỡ.',
                                    era: 'Hiện đại',
                                    traits: ['Gân lá mạng', 'Thân gỗ hoặc thảo'],
                                    infographicUrl: 'evolution/Beans, Roses, Sunflowers.jpeg'
                                },
                                {
                                    id: 'apple_mango_orange_examples',
                                    label: 'Táo / Xoài / Cam',
                                    englishLabel: 'Fruit Trees',
                                    type: 'species',
                                    color: '#052e16',
                                    description: 'Các loại cây ăn quả thân gỗ lâu năm.',
                                    era: 'Hiện đại',
                                    traits: ['Thân gỗ', 'Qủa mọng/hạch'],
                                    infographicUrl: 'evolution/Fruit Trees.jpeg'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
