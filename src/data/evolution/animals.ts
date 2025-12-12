import { EvolutionNode } from './types';

export const animalia: EvolutionNode = {
    id: 'animalia',
    label: 'Động Vật',
    englishLabel: 'Animals',
    type: 'kingdom',
    description: 'Sinh vật đa bào dị dưỡng, phát triển hệ thần kinh và khả năng vận động.',
    era: 'Precambrian',
    color: '#f43f5e', // Rose
    traits: ['Đa bào', 'Dị dưỡng', 'Hệ thần kinh'],
    drillable: true,
    children: [
        {
            id: 'invertebrates',
            label: 'Không Xương Sống',
            englishLabel: 'Invertebrates',
            type: 'phylum',
            description: 'Nhóm động vật không có cột sống, chiếm 97% tổng số loài động vật.',
            era: 'Ediacaran',
            color: '#fb7185', // Rose-400
            traits: ['Không xương sống', 'Đa dạng hình thái'],
            children: [
                {
                    id: 'porifera',
                    label: 'Bọt Biển',
                    englishLabel: 'Sponges',
                    type: 'class',
                    description: 'Động vật đa bào nguyên thủy nhất. Cơ thể rỗng, có nhiều lỗ nhỏ để lọc nước.',
                    era: 'Ediacaran',
                    color: '#fda4af',
                    traits: ['Không mô thật', 'Hệ thống kênh nước'],
                    children: [
                        {
                            id: 'calcarea',
                            label: 'Bọt Biển Đá Vôi',
                            englishLabel: 'Calcarea',
                            type: 'order',
                            description: 'Bộ xương bằng canxi cacbonat (đá vôi). Thường nhỏ và sống ở vùng biển nông.',
                            era: 'Cambrian',
                            color: '#f43f5e',
                            traits: ['Gai đá vôi', 'Biển nông'],
                            children: [
                                {
                                    id: 'asconoid',
                                    label: 'Kiểu Ống Đơn',
                                    englishLabel: 'Asconoid',
                                    type: 'family',
                                    description: 'Cấu trúc đơn giản nhất, hình ống, nước đi thẳng vào khoang chính.',
                                    era: 'Cambrian',
                                    color: '#fb7185',
                                    traits: ['Dạng ống', 'Đơn giản']
                                },
                                {
                                    id: 'syconoid_calc',
                                    label: 'Kiểu Gấp Nếp',
                                    englishLabel: 'Syconoid',
                                    type: 'family',
                                    description: 'Vách cơ thể gấp nếp tạo thành các ống tia, tăng diện tích lọc.',
                                    era: 'Cambrian',
                                    color: '#f43f5e',
                                    traits: ['Vách gấp nếp', 'Hiệu quả hơn']
                                },
                                {
                                    id: 'leuconoid_calc',
                                    label: 'Kiểu Nhiều Buồng',
                                    englishLabel: 'Leuconoid',
                                    type: 'family',
                                    description: 'Phức tạp nhất, gồm nhiều buồng rung liên kết. Kích thước có thể rất lớn.',
                                    era: 'Cambrian',
                                    color: '#e11d48',
                                    traits: ['Nhiều buồng', 'Phức tạp']
                                }
                            ]
                        },
                        {
                            id: 'demospongiae',
                            label: 'Bọt Biển Thường',
                            englishLabel: 'Demospongiae',
                            type: 'order',
                            description: 'Chiếm 90% số loài bọt biển. Bộ xương bằng spongin hoặc silic.',
                            era: 'Cambrian',
                            color: '#fb7185',
                            traits: ['Spongin', 'Đa dạng'],
                            children: [
                                {
                                    id: 'leuconoid_demo',
                                    label: 'Kiểu Nhiều Buồng',
                                    englishLabel: 'Leuconoid',
                                    type: 'family',
                                    description: 'Cấu trúc phức tạp giúp cơ thể đạt kích thước lớn.',
                                    era: 'Cambrian',
                                    color: '#e11d48',
                                    traits: ['Nhiều buồng']
                                }
                            ]
                        },
                        {
                            id: 'hexactinellida',
                            label: 'Bọt Biển Thủy Tinh',
                            englishLabel: 'Hexactinellida',
                            type: 'order',
                            description: 'Bộ xương bằng silic trong suốt như thủy tinh. Sống ở biển sâu.',
                            era: 'Cambrian',
                            color: '#f43f5e',
                            traits: ['Gai silic 6 tia', 'Biển sâu'],
                            children: [
                                {
                                    id: 'syconoid_hex',
                                    label: 'Kiểu Gấp Nếp',
                                    englishLabel: 'Syconoid',
                                    type: 'family',
                                    description: 'Cấu trúc trung gian.',
                                    era: 'Cambrian',
                                    color: '#be123c',
                                    traits: ['Vách gấp nếp']
                                },
                                {
                                    id: 'leuconoid_hex',
                                    label: 'Kiểu Nhiều Buồng',
                                    englishLabel: 'Leuconoid',
                                    type: 'family',
                                    description: 'Cấu trúc phức tạp phổ biến.',
                                    era: 'Cambrian',
                                    color: '#9f1239',
                                    traits: ['Nhiều buồng']
                                }
                            ]
                        },
                        {
                            id: 'homoscleromorpha',
                            label: 'Bọt Biển Homoscleromorpha',
                            englishLabel: 'Homoscleromorpha',
                            type: 'order',
                            description: 'Nhóm nhỏ, trước đây xếp vào Demospongiae. Có màng đáy thật.',
                            era: 'Cambrian',
                            color: '#fb7185',
                            traits: ['Màng đáy', 'Hiếm gặp'],
                            children: [
                                {
                                    id: 'leuconoid_homo',
                                    label: 'Kiểu Nhiều Buồng',
                                    englishLabel: 'Leuconoid',
                                    type: 'family',
                                    description: 'Cấu trúc phức tạp đặc trưng.',
                                    era: 'Cambrian',
                                    color: '#e11d48',
                                    traits: ['Nhiều buồng']
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'cnidaria',
                    label: 'Ruột Khoang',
                    englishLabel: 'Cnidarians',
                    type: 'class',
                    description: 'Động vật đối xứng tỏa tròn, có tế bào gai chuyên biệt để săn mồi và tự vệ.',
                    era: 'Ediacaran',
                    color: '#f472b6',
                    traits: ['Đối xứng tỏa tròn', 'Cnidocyte (Gai)'],
                    children: [
                        {
                            id: 'hydrozoa',
                            label: 'Thủy Tức',
                            englishLabel: 'Hydrozoa',
                            type: 'order',
                            description: 'Thường sống thành tập đoàn (như Sứa Bồ Đào Nha). Một số sống đơn độc nước ngọt (Hydra).',
                            era: 'Cambrian',
                            color: '#f472b6',
                            traits: ['Dạng polyp/medusa', 'Tập đoàn']
                        },
                        {
                            id: 'scyphozoa',
                            label: 'Sứa Thực Sự',
                            englishLabel: 'Scyphozoa',
                            type: 'order',
                            description: 'Giai đoạn sứa (medusa) chiếm ưu thế. Di chuyển bằng cách co bóp dù.',
                            era: 'Cambrian',
                            color: '#db2777',
                            traits: ['Dạng sứa lớn', 'Trôi nổi']
                        },
                        {
                            id: 'anthozoa',
                            label: 'San Hô & Hải Quỳ',
                            englishLabel: 'Anthozoa',
                            type: 'order',
                            description: 'Chỉ có dạng polyp, sống cố định. San hô tạo rạn đá vôi.',
                            era: 'Cambrian',
                            color: '#be185d',
                            traits: ['Chỉ có Polyp', 'Tạo rạn']
                        },
                        {
                            id: 'cubozoa',
                            label: 'Sứa Hộp',
                            englishLabel: 'Cubozoa',
                            type: 'order',
                            description: 'Sứa có dù hình hộp, nọc độc rất mạnh. Bơi giỏi và có mắt phức tạp.',
                            era: 'Carboniferous',
                            color: '#9d174d',
                            traits: ['Dù hình hộp', 'Độc tính cao']
                        }
                    ]
                },
                {
                    id: 'worms_simple',
                    label: 'Các Loài Giun',
                    englishLabel: 'Worms',
                    type: 'class',
                    description: 'Nhóm động vật không xương sống có cơ thể dài, mềm. Gồm 3 ngành chính.',
                    era: 'Cambrian',
                    color: '#e879f9',
                    traits: ['Cơ thể mềm', 'Đối xứng hai bên', 'Không chân'],
                    children: [
                        {
                            id: 'flatworms',
                            label: 'Giun Dẹp',
                            englishLabel: 'Flatworms',
                            type: 'order',
                            description: 'Cơ thể dẹt theo hướng lưng bụng. Chưa có hậu môn và hệ tuần hoàn.',
                            era: 'Ediacaran',
                            color: '#f0abfc',
                            traits: ['Dẹt', 'Ruột túi'],
                            children: [
                                {
                                    id: 'planarians',
                                    label: 'Sán Lông',
                                    englishLabel: 'Planarians',
                                    type: 'family',
                                    description: 'Sống tự do, có khả năng tái sinh mạnh mẽ.',
                                    era: 'Cambrian',
                                    color: '#f5d0fe',
                                    traits: ['Tái sinh', 'Tự do']
                                },
                                {
                                    id: 'tapeworms',
                                    label: 'Sán Dây',
                                    englishLabel: 'Tapeworms',
                                    type: 'family',
                                    description: 'Ký sinh trong ruột động vật. Cơ thể gồm nhiều đốt.',
                                    era: 'Permian',
                                    color: '#e879f9',
                                    traits: ['Ký sinh', 'Nhiều đốt']
                                },
                                {
                                    id: 'flukes',
                                    label: 'Sán Lá',
                                    englishLabel: 'Flukes',
                                    type: 'family',
                                    description: 'Hình lá, ký sinh trong gan hoặc máu.',
                                    era: 'Devonian',
                                    color: '#d946ef',
                                    traits: ['Ký sinh', 'Hình lá']
                                }
                            ]
                        },
                        {
                            id: 'roundworms',
                            label: 'Giun Tròn',
                            englishLabel: 'Roundworms',
                            type: 'order',
                            description: 'Cơ thể hình ống, tiết diện tròn. Có ống tiêu hóa hoàn chỉnh.',
                            era: 'Cambrian',
                            color: '#d946ef',
                            traits: ['Hình ống', 'Tiêu hóa hoàn chỉnh'],
                            children: [
                                {
                                    id: 'pinworms',
                                    label: 'Giun Kim',
                                    englishLabel: 'Pinworms',
                                    type: 'family',
                                    description: 'Ký sinh phổ biến ở ruột người, đặc biệt là trẻ em.',
                                    era: 'Unknown',
                                    color: '#e879f9',
                                    traits: ['Ký sinh ruột']
                                },
                                {
                                    id: 'hookworms',
                                    label: 'Giun Móc',
                                    englishLabel: 'Hookworms',
                                    type: 'family',
                                    description: 'Ký sinh hút máu, xâm nhập qua da.',
                                    era: 'Unknown',
                                    color: '#c026d3',
                                    traits: ['Hút máu', 'Móc bám']
                                }
                            ]
                        },
                        {
                            id: 'segmented_worms',
                            label: 'Giun Đốt',
                            englishLabel: 'Segmented Worms',
                            type: 'order',
                            description: 'Cơ thể phân đốt thực sự. Có hệ tuần hoàn kín.',
                            era: 'Cambrian',
                            color: '#c026d3',
                            traits: ['Phân đốt', 'Tuần hoàn kín'],
                            children: [
                                {
                                    id: 'earthworms',
                                    label: 'Giun Đất',
                                    englishLabel: 'Earthworms',
                                    type: 'family',
                                    description: 'Sống trong đất, cải tạo đất tơi xốp.',
                                    era: 'Triassic',
                                    color: '#e879f9',
                                    traits: ['Có ích', 'Sống đất']
                                },
                                {
                                    id: 'leeches',
                                    label: 'Đỉa',
                                    englishLabel: 'Leeches',
                                    type: 'family',
                                    description: 'Sống dưới nước, hút máu hoặc ăn thịt.',
                                    era: 'Jurassic',
                                    color: '#d946ef',
                                    traits: ['Hút máu', 'Giác bám']
                                },
                                {
                                    id: 'polychaetes',
                                    label: 'Giun Nhiều Tơ',
                                    englishLabel: 'Polychaetes',
                                    type: 'family',
                                    description: 'Sống ở biển, màu sắc sặc sỡ, di chuyển hoạt bát.',
                                    era: 'Cambrian',
                                    color: '#a21caf',
                                    traits: ['Sống biển', 'Nhiều tơ']
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'mollusca',
                    label: 'Thân Mềm',
                    englishLabel: 'Mollusks',
                    type: 'class',
                    description: 'Động vật không xương sống có cơ thể mềm, thường được bảo vệ bởi vỏ đá vôi.',
                    era: 'Cambrian',
                    color: '#d946ef',
                    traits: ['Cơ thể mềm', 'Vỏ đá vôi', 'Chân cơ'],
                    children: [
                        {
                            id: 'gastropods',
                            label: 'Chân Bụng',
                            englishLabel: 'Gastropods',
                            type: 'order',
                            description: 'Nhóm lớn nhất (Ốc sên, Ốc biển). Di chuyển bằng chân bụng bò sát mặt đất.',
                            era: 'Cambrian',
                            color: '#f0abfc',
                            traits: ['Vỏ xoắn', 'Chân bụng'],
                            children: [
                                {
                                    id: 'snails',
                                    label: 'Ốc',
                                    englishLabel: 'Snails',
                                    type: 'family',
                                    description: 'Có vỏ xoắn ốc bảo vệ cơ thể.',
                                    era: 'Cambrian',
                                    color: '#f5d0fe',
                                    traits: ['Có vỏ']
                                },
                                {
                                    id: 'slugs',
                                    label: 'Sên Trần',
                                    englishLabel: 'Slugs',
                                    type: 'family',
                                    description: 'Vỏ tiêu biến hoặc rất nhỏ. Cơ thể tiết nhiều chất nhầy.',
                                    era: 'Carboniferous',
                                    color: '#e879f9',
                                    traits: ['Không vỏ', 'Nhầy']
                                }
                            ]
                        },
                        {
                            id: 'bivalves',
                            label: 'Hai Mảnh Vỏ',
                            englishLabel: 'Bivalves',
                            type: 'order',
                            description: 'Ngao, Sò, Trai, Hến. Vỏ gồm 2 mảnh khép lại.',
                            era: 'Cambrian',
                            color: '#d946ef',
                            traits: ['2 mảnh vỏ', 'Lọc thức ăn'],
                            children: [
                                {
                                    id: 'clams_oysters',
                                    label: 'Trai & Hàu',
                                    englishLabel: 'Clams & Oysters',
                                    type: 'family',
                                    description: 'Sống cố định hoặc vùi mình trong cát.',
                                    era: 'Cambrian',
                                    color: '#c026d3',
                                    traits: ['Cố định', 'Tạo ngọc']
                                }
                            ]
                        },
                        {
                            id: 'cephalopods',
                            label: 'Chân Đầu',
                            englishLabel: 'Cephalopods',
                            type: 'order',
                            description: 'Nhóm thông minh nhất (Bạch tuộc, Mực). Chân biến đổi thành xúc tu quanh đầu.',
                            era: 'Cambrian',
                            color: '#c026d3',
                            traits: ['Thông minh', 'Xúc tu', 'Phun mực'],
                            children: [
                                {
                                    id: 'octopuses',
                                    label: 'Bạch Tuộc',
                                    englishLabel: 'Octopuses',
                                    type: 'family',
                                    description: 'Không có vỏ, 8 xúc tu, trí tuệ rất cao.',
                                    era: 'Jurassic',
                                    color: '#a21caf',
                                    traits: ['8 xúc tu', 'Ngụy trang']
                                },
                                {
                                    id: 'squids',
                                    label: 'Mực',
                                    englishLabel: 'Squids',
                                    type: 'family',
                                    description: 'Bơi nhanh, vỏ tiêu biến thành mai mực bên trong.',
                                    era: 'Jurassic',
                                    color: '#86198f',
                                    traits: ['10 xúc tu', 'Phản lực']
                                },
                                {
                                    id: 'nautilus',
                                    label: 'Ốc Anh Vũ',
                                    englishLabel: 'Nautilus',
                                    type: 'family',
                                    description: 'Hóa thạch sống, vẫn giữ vỏ ngoài cuộn tròn.',
                                    era: 'Cambrian',
                                    color: '#701a75',
                                    traits: ['Vỏ ngoài', 'Sống sâu']
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'arthropoda',
                    label: 'Chân Khớp',
                    englishLabel: 'Arthropods',
                    type: 'class',
                    description: 'Ngành động vật lớn nhất. Cơ thể phân đốt, có bộ xương ngoài bằng chitin và các chi phân đốt.',
                    era: 'Cambrian',
                    color: '#c026d3',
                    traits: ['Bộ xương ngoài', 'Chân khớp', 'Lột xác'],
                    milestone: {
                        label: 'Lên Cạn',
                        year: '450 triệu năm trước'
                    },
                    children: [
                        {
                            id: 'insects',
                            label: 'Côn Trùng',
                            englishLabel: 'Insects',
                            type: 'order',
                            description: 'Nhóm động vật đa dạng nhất hành tinh. Cơ thể chia 3 phần (đầu, ngực, bụng), có 6 chân.',
                            era: 'Devonian',
                            color: '#e879f9',
                            traits: ['6 chân', 'Có cánh'],
                            children: [
                                {
                                    id: 'butterflies_beetles_bees',
                                    label: 'Bướm / Bọ / Ong',
                                    englishLabel: 'Butterflies / Beetles / Bees',
                                    type: 'family',
                                    description: 'Đại diện tiêu biểu cho sự đa dạng của côn trùng.',
                                    era: 'Carboniferous',
                                    color: '#f0abfc',
                                    traits: ['Biến thái', 'Thụ phấn']
                                }
                            ]
                        },
                        {
                            id: 'arachnids',
                            label: 'Hình Nhện',
                            englishLabel: 'Arachnids',
                            type: 'order',
                            description: 'Nhện, Bọ cạp, Ve. Có 8 chân, không có râu và cánh.',
                            era: 'Silurian',
                            color: '#d946ef',
                            traits: ['8 chân', 'Phổi sách'],
                            children: [
                                {
                                    id: 'spiders_scorpions_ticks',
                                    label: 'Nhện / Bọ cạp / Ve',
                                    englishLabel: 'Spiders / Scorpions / Ticks',
                                    type: 'family',
                                    description: 'Săn mồi hoặc ký sinh. Thường có nọc độc.',
                                    era: 'Devonian',
                                    color: '#e879f9',
                                    traits: ['Tơ nhện', 'Nọc độc']
                                }
                            ]
                        },
                        {
                            id: 'crustaceans',
                            label: 'Giáp Xác',
                            englishLabel: 'Crustaceans',
                            type: 'order',
                            description: 'Tôm, Cua. Chủ yếu sống dưới nước, hô hấp bằng mang.',
                            era: 'Cambrian',
                            color: '#c026d3',
                            traits: ['2 đôi râu', 'Vỏ kitin-canxi'],
                            children: [
                                {
                                    id: 'crabs_shrimps_lobsters',
                                    label: 'Cua / Tôm',
                                    englishLabel: 'Crabs / Shrimps',
                                    type: 'family',
                                    description: 'Nguồn thức ăn quan trọng. Có 10 chân (thập chân).',
                                    era: 'Jurassic',
                                    color: '#d946ef',
                                    traits: ['10 chân', 'Càng lớn']
                                }
                            ]
                        },
                        {
                            id: 'myriapods',
                            label: 'Nhiều Chân',
                            englishLabel: 'Myriapods',
                            type: 'order',
                            description: 'Rết, Cuốn chiếu. Cơ thể dài, có rất nhiều đôi chân.',
                            era: 'Silurian',
                            color: '#a21caf',
                            traits: ['Nhiều chân', 'Thở bằng khí quản'],
                            children: [
                                {
                                    id: 'centipedes_millipedes',
                                    label: 'Rết / Cuốn Chiếu',
                                    englishLabel: 'Centipedes / Millipedes',
                                    type: 'family',
                                    description: 'Rết ăn thịt có độc, Cuốn chiếu ăn thực vật.',
                                    era: 'Silurian',
                                    color: '#c026d3',
                                    traits: ['Nhiều đốt', 'Sống nơi ẩm']
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'echinodermata',
                    label: 'Da Gai',
                    englishLabel: 'Echinoderms',
                    type: 'class',
                    description: 'Động vật biển có hệ thống ống nước độc đáo. Ấu trùng đối xứng hai bên, trưởng thành đối xứng tỏa tròn.',
                    era: 'Cambrian',
                    color: '#a21caf',
                    traits: ['Hệ thống ống nước', 'Đối xứng tỏa tròn'],
                    children: [
                        {
                            id: 'sea_stars',
                            label: 'Sao Biển',
                            englishLabel: 'Sea Stars',
                            type: 'order',
                            description: 'Hình sao, thường có 5 cánh. Ăn thịt (san hô, thân mềm).',
                            era: 'Ordovician',
                            color: '#c026d3',
                            traits: ['Hình sao', 'Tái sinh cánh'],
                            children: [
                                {
                                    id: 'sea_star_example',
                                    label: 'Sao Biển',
                                    englishLabel: 'Sea Star',
                                    type: 'family',
                                    description: 'Di chuyển bằng chân ống.',
                                    era: 'Ordovician',
                                    color: '#d946ef',
                                    traits: ['Chân ống']
                                }
                            ]
                        },
                        {
                            id: 'sea_urchins',
                            label: 'Nhím Biển',
                            englishLabel: 'Sea Urchins',
                            type: 'order',
                            description: 'Hình cầu, vỏ cứng có nhiều gai nhọn bảo vệ.',
                            era: 'Ordovician',
                            color: '#a21caf',
                            traits: ['Gai nhọn', 'Khớp Aristote'],
                            children: [
                                {
                                    id: 'sea_urchin_example',
                                    label: 'Cầu Gai',
                                    englishLabel: 'Sea Urchin',
                                    type: 'family',
                                    description: 'Ăn tảo. Một số loài có gai độc.',
                                    era: 'Ordovician',
                                    color: '#c026d3',
                                    traits: ['Ăn tảo']
                                }
                            ]
                        },
                        {
                            id: 'sea_cucumbers',
                            label: 'Hải Sâm',
                            englishLabel: 'Sea Cucumbers',
                            type: 'order',
                            description: 'Cơ thể hình dưa chuột, vỏ tiêu biến. Sống ở đáy biển.',
                            era: 'Ordovician',
                            color: '#86198f',
                            traits: ['Thân mềm', 'Tự vệ bằng ruột'],
                            children: [
                                {
                                    id: 'sea_cucumber_example',
                                    label: 'Dưa Chuột Biển',
                                    englishLabel: 'Sea Cucumber',
                                    type: 'family',
                                    description: 'Lọc bùn đáy biển.',
                                    era: 'Ordovician',
                                    color: '#a21caf',
                                    traits: ['Lọc bùn']
                                }
                            ]
                        },
                        {
                            id: 'brittle_stars',
                            label: 'Sao Giòn',
                            englishLabel: 'Brittle Stars',
                            type: 'order',
                            description: 'Giống sao biển nhưng cánh mảnh và linh hoạt hơn.',
                            era: 'Ordovician',
                            color: '#701a75',
                            traits: ['Cánh mảnh', 'Di chuyển nhanh'],
                            children: [
                                {
                                    id: 'brittle_star_example',
                                    label: 'Sao Đuôi Rắn',
                                    englishLabel: 'Brittle Star',
                                    type: 'family',
                                    description: 'Dễ gãy cánh để trốn thoát.',
                                    era: 'Ordovician',
                                    color: '#86198f',
                                    traits: ['Tự cắt cánh']
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'vertebrates',
            label: 'Có Xương Sống',
            englishLabel: 'Vertebrates',
            type: 'phylum',
            description: 'Động vật có cột sống và hộp sọ, hệ thần kinh phát triển cao.',
            era: 'Cambrian',
            color: '#e11d48', // Rose-600
            traits: ['Cột sống', 'Hộp sọ'],
            children: [
                {
                    id: 'fish_simple',
                    label: 'Cá',
                    englishLabel: 'Fish',
                    type: 'class',
                    description: 'Động vật biến nhiệt, sống dưới nước, hô hấp bằng mang.',
                    era: 'Cambrian',
                    color: '#be123c',
                    traits: ['Vây', 'Mang', 'Biến nhiệt'],
                    children: [
                        {
                            id: 'jawless_fish',
                            label: 'Cá Không Hàm',
                            englishLabel: 'Jawless Fish',
                            type: 'order',
                            description: 'Nhóm cá nguyên thủy nhất, miệng tròn không có hàm.',
                            era: 'Cambrian',
                            color: '#9f1239',
                            traits: ['Không hàm', 'Miệng tròn']
                        },
                        {
                            id: 'cartilaginous_fish',
                            label: 'Cá Sụn',
                            englishLabel: 'Cartilaginous Fish',
                            type: 'order',
                            description: 'Cá mập, cá đuối. Bộ xương hoàn toàn bằng sụn.',
                            era: 'Devonian',
                            color: '#881337',
                            traits: ['Xương sụn', 'Da nhám']
                        },
                        {
                            id: 'bony_fish',
                            label: 'Cá Xương',
                            englishLabel: 'Bony Fish',
                            type: 'order',
                            description: 'Nhóm cá đa dạng nhất. Có bộ xương cứng bằng canxi.',
                            era: 'Silurian',
                            color: '#701a2e',
                            traits: ['Xương cứng', 'Bóng bơi'],
                            children: [
                                {
                                    id: 'ray_finned_fish',
                                    label: 'Cá Vây Tia',
                                    englishLabel: 'Ray-finned Fish',
                                    type: 'family',
                                    description: 'Đa số các loài cá hiện nay. Vây được hỗ trợ bởi các tia xương.',
                                    era: 'Devonian',
                                    color: '#e11d48',
                                    traits: ['Vây tia']
                                },
                                {
                                    id: 'lobe_finned_fish',
                                    label: 'Cá Vây Thùy',
                                    englishLabel: 'Lobe-finned Fish',
                                    type: 'family',
                                    description: 'Tổ tiên của động vật bốn chân. Vây có xương và cơ bắp.',
                                    era: 'Devonian',
                                    color: '#9f1239',
                                    traits: ['Vây thùy', 'Phổi (nguyên thủy)']
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'amphibians',
                    label: 'Lưỡng Cư',
                    englishLabel: 'Amphibians',
                    type: 'class',
                    description: 'Động vật bốn chân đầu tiên, chuyển tiếp giữa nước và cạn.',
                    era: 'Devonian',
                    color: '#9f1239',
                    traits: ['Sống hai môi trường', 'Da trần ẩm ướt'],
                    milestone: {
                        label: 'Chinh Phục Đất Liền',
                        year: '370 triệu năm trước'
                    },
                    children: [
                        {
                            id: 'frogs_toads',
                            label: 'Ếch & Cóc',
                            englishLabel: 'Frogs & Toads',
                            type: 'order',
                            description: 'Nhóm lưỡng cư không đuôi, chân sau phát triển để nhảy.',
                            era: 'Triassic',
                            color: '#be123c',
                            traits: ['Không đuôi', 'Nhảy']
                        },
                        {
                            id: 'salamanders_newts',
                            label: 'Kỳ Giông & Sa Giông',
                            englishLabel: 'Salamanders & Newts',
                            type: 'order',
                            description: 'Lưỡng cư có đuôi và hình dáng giống thằn lằn.',
                            era: 'Jurassic',
                            color: '#9f1239',
                            traits: ['Có đuôi', 'Tái sinh chi']
                        },
                        {
                            id: 'caecilians',
                            label: 'Lưỡng Cư Không Chân',
                            englishLabel: 'Caecilians',
                            type: 'order',
                            description: 'Sống dưới đất, hình dáng giống giun hoặc rắn.',
                            era: 'Jurassic',
                            color: '#881337',
                            traits: ['Không chân', 'Mắt tiêu giảm']
                        }
                    ]
                },
                {
                    id: 'reptiles',
                    label: 'Bò Sát',
                    englishLabel: 'Reptiles',
                    type: 'class',
                    description: 'Động vật có màng ối, da khô vảy sừng, thích nghi hoàn toàn với đời sống trên cạn.',
                    era: 'Carboniferous',
                    color: '#881337',
                    traits: ['Màng ối', 'Da vảy', 'Biến nhiệt'],
                    milestone: {
                        label: 'Trứng Có Vỏ',
                        year: '310 triệu năm trước'
                    },
                    children: [
                        {
                            id: 'turtles',
                            label: 'Rùa',
                            englishLabel: 'Turtles',
                            type: 'order',
                            description: 'Có mai cứng bảo vệ cơ thể. Sống trên cạn hoặc dưới nước.',
                            era: 'Triassic',
                            color: '#9f1239',
                            traits: ['Mai cứng', 'Không răng']
                        },
                        {
                            id: 'lizards_snakes',
                            label: 'Thằn Lằn & Rắn',
                            englishLabel: 'Lizards & Snakes',
                            type: 'order',
                            description: 'Nhóm bò sát đa dạng nhất. Rắn không chân, thằn lằn có 4 chân.',
                            era: 'Jurassic',
                            color: '#be123c',
                            traits: ['Hàm linh hoạt', 'Lột xác']
                        },
                        {
                            id: 'crocodilians',
                            label: 'Cá Sấu',
                            englishLabel: 'Crocodilians',
                            type: 'order',
                            description: 'Bò sát lớn sống bán thủy sinh. Họ hàng gần nhất của chim.',
                            era: 'Cretaceous',
                            color: '#701a2e',
                            traits: ['Tim 4 ngăn', 'Săn mồi']
                        },
                        {
                            id: 'tuatara',
                            label: 'Tuatara',
                            englishLabel: 'Tuatara',
                            type: 'order',
                            description: 'Hóa thạch sống, chỉ còn tìm thấy ở New Zealand.',
                            era: 'Triassic',
                            color: '#500724',
                            traits: ['Mắt thứ 3', 'Sống lâu']
                        }
                    ]
                },
                {
                    id: 'birds',
                    label: 'Chim',
                    englishLabel: 'Birds',
                    type: 'class',
                    description: 'Hậu duệ trực tiếp của khủng long. Có lông vũ, hằng nhiệt và bay đập cánh.',
                    era: 'Jurassic',
                    color: '#4c0519',
                    traits: ['Lông vũ', 'Hằng nhiệt', 'Xương rỗng'],
                    milestone: {
                        label: 'Chinh Phục Bầu Trời',
                        year: '150 triệu năm trước'
                    },
                    children: [
                        {
                            id: 'flightless_birds',
                            label: 'Chim Không Bay',
                            englishLabel: 'Flightless Birds',
                            type: 'order',
                            description: 'Đà điểu, Kiwi, Cánh cụt. Thích nghi chạy hoặc bơi.',
                            era: 'Cretaceous',
                            color: '#881337',
                            traits: ['Cánh tiêu giảm', 'Chân khỏe']
                        },
                        {
                            id: 'water_birds',
                            label: 'Chim Nước',
                            englishLabel: 'Water Birds',
                            type: 'order',
                            description: 'Vịt, Ngan, Thiên nga. Chân có màng bơi, lông không thấm nước.',
                            era: 'Cretaceous',
                            color: '#0ea5e9',
                            traits: ['Chân màng', 'Lông không thấm nước']
                        },
                        {
                            id: 'shorebirds',
                            label: 'Chim Biển & Lội',
                            englishLabel: 'Shorebirds',
                            type: 'order',
                            description: 'Hải âu, Cò, Sếu. Chân dài hoặc cánh dài, sống gần nước.',
                            era: 'Paleogene',
                            color: '#38bdf8',
                            traits: ['Mỏ dài', 'Di cư xa']
                        },
                        {
                            id: 'birds_of_prey',
                            label: 'Chim Săn Mồi',
                            englishLabel: 'Birds of Prey',
                            type: 'order',
                            description: 'Đại bàng, Ưng, Kền kền. Móng vuốt sắc nhọn, thị lực cực tốt.',
                            era: 'Paleogene',
                            color: '#be123c',
                            traits: ['Mỏ quặp', 'Móng vuốt']
                        },
                        {
                            id: 'owls',
                            label: 'Cú',
                            englishLabel: 'Owls',
                            type: 'order',
                            description: 'Săn mồi ban đêm. Bay không tiếng động, thính giác siêu nhạy.',
                            era: 'Paleogene',
                            color: '#701a2e',
                            traits: ['Săn đêm', 'Quay đầu 270°']
                        },
                        {
                            id: 'woodpeckers',
                            label: 'Gõ Kiến',
                            englishLabel: 'Woodpeckers',
                            type: 'order',
                            description: 'Mỏ cứng như đục, lưỡi dài dính, chân bám thân cây.',
                            era: 'Paleogene',
                            color: '#9f1239',
                            traits: ['Mỏ cứng', 'Leo trèo']
                        },
                        {
                            id: 'parrots',
                            label: 'Vẹt',
                            englishLabel: 'Parrots',
                            type: 'order',
                            description: 'Thông minh nhất loài chim. Mỏ khoằm, chân linh hoạt, biết bắt chước.',
                            era: 'Paleogene',
                            color: '#22c55e',
                            traits: ['Thông minh', 'Mỏ khỏe']
                        },
                        {
                            id: 'songbirds',
                            label: 'Chim Hót',
                            englishLabel: 'Songbirds',
                            type: 'order',
                            description: 'Nhóm đông nhất (Sẻ, Họa mi...). Có cơ quan phát âm phát triển.',
                            era: 'Paleogene',
                            color: '#fb7185',
                            traits: ['Hót hay', 'Đa dạng']
                        }
                    ]
                },
                {
                    id: 'mammals',
                    label: 'Thú (Có Vú)',
                    englishLabel: 'Mammals',
                    type: 'class',
                    description: 'Động vật hằng nhiệt, nuôi con bằng sữa, có lông mao. Hệ thần kinh phát triển cao nhất.',
                    era: 'Triassic',
                    color: '#f43f5e',
                    traits: ['Lông mao', 'Tuyến sữa', 'Não bộ phát triển'],
                    milestone: {
                        label: 'Kỷ Nguyên Của Thú',
                        year: '66 triệu năm trước'
                    },
                    children: [
                        {
                            id: 'monotremes',
                            label: 'Thú Đẻ Trứng',
                            englishLabel: 'Monotremes',
                            type: 'order',
                            description: 'Nhóm thú nguyên thủy nhất (Thú mỏ vịt, Thú lông nhím). Đẻ trứng nhưng nuôi con bằng sữa.',
                            era: 'Cretaceous',
                            color: '#9f1239',
                            traits: ['Đẻ trứng', 'Có huyệt']
                        },
                        {
                            id: 'marsupials',
                            label: 'Thú Có Túi',
                            englishLabel: 'Marsupials',
                            type: 'order',
                            description: 'Chuột túi, Koala. Con non sinh ra chưa phát triển hoàn thiện, lớn lên trong túi mẹ.',
                            era: 'Cretaceous',
                            color: '#be123c',
                            traits: ['Có túi', 'Con non yếu']
                        },
                        {
                            id: 'placental_mammals',
                            label: 'Thú Nhau Thai',
                            englishLabel: 'Placental Mammals',
                            type: 'order',
                            description: 'Nhóm phát triển nhất. Con non phát triển hoàn thiện trong tử cung nhờ nhau thai.',
                            era: 'Cretaceous',
                            color: '#e11d48',
                            traits: ['Nhau thai', 'Phát triển hoàn thiện'],
                            children: [
                                {
                                    id: 'primates',
                                    label: 'Linh Trưởng',
                                    englishLabel: 'Primates',
                                    type: 'family',
                                    description: 'Khỉ, Vượn, Người. Não bộ lớn, tay cầm nắm linh hoạt, mắt hướng về phía trước.',
                                    era: 'Paleogene',
                                    color: '#fb7185',
                                    traits: ['Thông minh', 'Đối ngón cái']
                                },
                                {
                                    id: 'rodents',
                                    label: 'Gặm Nhấm',
                                    englishLabel: 'Rodents',
                                    type: 'family',
                                    description: 'Chuột, Sóc, Nhím. Răng cửa phát triển liên tục để gặm.',
                                    era: 'Paleogene',
                                    color: '#f43f5e',
                                    traits: ['Răng cửa lớn', 'Sinh sản nhanh']
                                },
                                {
                                    id: 'bats',
                                    label: 'Dơi',
                                    englishLabel: 'Bats',
                                    type: 'family',
                                    description: 'Thú duy nhất biết bay thực sự. Định vị bằng siêu âm.',
                                    era: 'Paleogene',
                                    color: '#e11d48',
                                    traits: ['Biết bay', 'Siêu âm']
                                },
                                {
                                    id: 'carnivores',
                                    label: 'Thú Ăn Thịt',
                                    englishLabel: 'Carnivores',
                                    type: 'family',
                                    description: 'Chó, Mèo, Gấu, Hổ. Răng nanh và vuốt sắc nhọn để săn mồi.',
                                    era: 'Paleogene',
                                    color: '#be123c',
                                    traits: ['Răng nanh', 'Săn mồi']
                                },
                                {
                                    id: 'hoofed_mammals',
                                    label: 'Thú Móng Guốc',
                                    englishLabel: 'Hoofed Mammals',
                                    type: 'family',
                                    description: 'Ngựa, Bò, Hươu. Chân có móng guốc, thường ăn thực vật.',
                                    era: 'Paleogene',
                                    color: '#9f1239',
                                    traits: ['Móng guốc', 'Ăn cỏ']
                                },
                                {
                                    id: 'whales_dolphins',
                                    label: 'Cá Voi & Heo',
                                    englishLabel: 'Whales & Dolphins',
                                    type: 'family',
                                    description: 'Thú trở lại sống dưới nước. Chi trước biến thành vây, cơ thể hình thoi.',
                                    era: 'Paleogene',
                                    color: '#881337',
                                    traits: ['Sống dưới nước', 'Lỗ thở']
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
