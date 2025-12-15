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
    infographicUrl: 'evolution/Animals.jpeg',
    drillable: true,
    children: [
        {
            id: 'invertebrates',
            infographicUrl: 'evolution/Invertebrates.jpeg',
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
                    infographicUrl: 'evolution/No true tissues (Sponges).jpeg',
                    label: 'Không có mô thật (bọt biển)',
                    englishLabel: 'No true tisues (Sponges)',
                    type: 'class',
                    description: 'Động vật đa bào nguyên thủy nhất. Cơ thể rỗng, có nhiều lỗ nhỏ để lọc nước.',
                    era: 'Ediacaran',
                    color: '#fb7185',
                    traits: ['Không mô thật', 'Hệ thống kênh nước'],
                    children: [
                        {
                            id: 'calcarea',
                            infographicUrl: 'evolution/Calcarea.jpeg',
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
                                    infographicUrl: 'evolution/Asconoid Calcarea.jpeg',
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
                                    infographicUrl: 'evolution/Syconoid Calcarea.jpeg',
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
                                    infographicUrl: 'evolution/Leuconoid Calcarea.jpeg',
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
                            infographicUrl: 'evolution/Demospongiae.jpeg',
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
                                    infographicUrl: 'evolution/Leuconoid Demospongiae.jpeg',
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
                            infographicUrl: 'evolution/Hexactinellida.jpeg',
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
                                    infographicUrl: 'evolution/Syconoid Hexactinellida.jpeg',
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
                                    infographicUrl: 'evolution/Leuconoid Hexactinellida.jpeg',
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
                            infographicUrl: 'evolution/Homoscleromorpha.jpeg',
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
                                    infographicUrl: 'evolution/Leuconoid Homoscleromorpha.jpeg',
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
                    id: 'eumetazoa',
                    infographicUrl: 'evolution/Eumetazoa.jpeg',
                    label: 'Có mô thật',
                    englishLabel: 'Eumetazoa (true tissues)',
                    type: 'clade',
                    description: 'Động vật có các mô được tổ chức rõ ràng thành các lớp mầm.',
                    era: 'Ediacaran',
                    color: '#f472b6', // Pink-400
                    traits: ['Mô thật', 'Tổ chức cơ thể'],
                    children: [
                        {
                            id: 'radiata',
                            infographicUrl: 'evolution/Radiata.jpeg',
                            label: 'Đối xứng tỏa tròn',
                            englishLabel: 'Radiata (radial symmetry)',
                            type: 'clade',
                            description: 'Cơ thể có tính đối xứng tỏa tròn, thường có hai lớp mầm (diploblastic).',
                            era: 'Ediacaran',
                            color: '#f9a8d4', // Pink-300
                            traits: ['Đối xứng tỏa tròn', 'Hai lớp mầm'],
                            children: [
                                {
                                    id: 'cnidaria',
                                    infographicUrl: 'evolution/Cnidarians.jpeg',
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
                                            infographicUrl: 'evolution/Hydrozoa.jpeg',
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
                                            infographicUrl: 'evolution/Scyphozoa.jpeg',
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
                                            infographicUrl: 'evolution/Anthozoa.jpeg',
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
                                            infographicUrl: 'evolution/Cubozoa.jpeg',
                                            label: 'Sứa Hộp',
                                            englishLabel: 'Cubozoa',
                                            type: 'order',
                                            description: 'Sứa có dù hình hộp, nọc độc rất mạnh. Bơi giỏi và có mắt phức tạp.',
                                            era: 'Carboniferous',
                                            color: '#9d174d',
                                            traits: ['Dù hình hộp', 'Độc tính cao']
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'bilateria',
                            infographicUrl: 'evolution/Bilateria (bilateral symmetry).jpeg',
                            label: 'Đối xứng hai bên',
                            englishLabel: 'Bilateria (bilateral symmetry)',
                            type: 'clade',
                            description: 'Cơ thể đối xứng hai bên, thường có đầu và đuôi rõ rệt, ba lớp mầm (triploblastic).',
                            era: 'Ediacaran',
                            color: '#e879f9', // Fuchsia-400
                            traits: ['Đối xứng hai bên', 'Ba lớp mầm'],
                            children: [
                                {
                                    id: 'protostomes',
                                    infographicUrl: 'evolution/Protostomes.jpeg',
                                    label: 'Miệng nguyên sinh',
                                    englishLabel: 'Protostomes',
                                    type: 'clade',
                                    description: 'Trong phát triển phôi, miệng hình thành trước hậu môn.',
                                    era: 'Cambrian',
                                    color: '#d946ef', // Fuchsia-500
                                    traits: ['Miệng trước', 'Phát triển xác định'],
                                    children: [
                                        {
                                            id: 'worms_simple',
                                            infographicUrl: 'evolution/Worms.jpeg',
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
                                                    infographicUrl: 'evolution/Flatworms.jpeg',
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
                                                            infographicUrl: 'evolution/Planarians.jpeg',
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
                                                            infographicUrl: 'evolution/Tapeworms.jpeg',
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
                                                            infographicUrl: 'evolution/Flukes.jpeg',
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
                                                    infographicUrl: 'evolution/Roundworms.jpeg',
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
                                                            infographicUrl: 'evolution/Pinworms.jpeg',
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
                                                            infographicUrl: 'evolution/Hookworms.jpeg',
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
                                                    infographicUrl: 'evolution/Segmented Worms.jpeg',
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
                                                            infographicUrl: 'evolution/Earthworms.jpeg',
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
                                                            infographicUrl: 'evolution/Leeches.jpeg',
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
                                                            infographicUrl: 'evolution/Polychaetes.jpeg',
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
                                            infographicUrl: 'evolution/Mollusks.jpeg',
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
                                                    infographicUrl: 'evolution/Gastropods.jpeg',
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
                                                            infographicUrl: 'evolution/Snails.jpeg',
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
                                                            infographicUrl: 'evolution/Slugs.jpeg',
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
                                                    infographicUrl: 'evolution/Bivalves.jpeg',
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
                                                            infographicUrl: 'evolution/Clams & Oysters.jpeg',
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
                                                    infographicUrl: 'evolution/Cephalopods.jpeg',
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
                                                            infographicUrl: 'evolution/Octopuses.jpeg',
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
                                                            infographicUrl: 'evolution/Squids.jpeg',
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
                                                            infographicUrl: 'evolution/Nautilus.jpeg',
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
                                            infographicUrl: 'evolution/Arthropods.jpeg',
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
                                                    infographicUrl: 'evolution/Insects.jpeg',
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
                                                            infographicUrl: 'evolution/Butterflies, Beetle, Bees.jpeg',
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
                                                    infographicUrl: 'evolution/Arachnids.jpeg',
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
                                                            infographicUrl: 'evolution/Spiders, Scorpions, Ticks.jpeg',
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
                                                    infographicUrl: 'evolution/Crustaceans.jpeg',
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
                                                            infographicUrl: 'evolution/Crabs, Shrimps.jpeg',
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
                                                    infographicUrl: 'evolution/Myriapods.jpeg',
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
                                                            infographicUrl: 'evolution/Centipedes, Millipedes.jpeg',
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
                                        }
                                    ]
                                },
                                {
                                    id: 'deuterostomes',
                                    infographicUrl: 'evolution/Deuterostomes.jpeg',
                                    label: 'Miệng thứ sinh',
                                    englishLabel: 'Deuterostomes',
                                    type: 'clade',
                                    description: 'Trong phát triển phôi, hậu môn hình thành trước miệng. Phôi bào phát triển không xác định.',
                                    era: 'Cambrian',
                                    color: '#86198f', // Fuchsia-700
                                    traits: ['Hậu môn trước', 'Phát triển không xác định'],
                                    children: [
                                        {
                                            id: 'echinodermata',
                                            infographicUrl: 'evolution/Echinoderms.jpeg',
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
                                                    infographicUrl: 'evolution/Sea Stars.jpeg',
                                                    label: 'Sao Biển',
                                                    englishLabel: 'Sea Stars',
                                                    type: 'order',
                                                    description: 'Hình sao, thường có 5 cánh. Ăn thịt (san hô, thân mềm). Di chuyển bằng chân ống.',
                                                    era: 'Ordovician',
                                                    color: '#c026d3',
                                                    traits: ['Hình sao', 'Tái sinh cánh', 'Chân ống']
                                                },
                                                {
                                                    id: 'sea_urchins',
                                                    infographicUrl: 'evolution/Sea Urchins.jpeg',
                                                    label: 'Nhím Biển (Cầu Gai)',
                                                    englishLabel: 'Sea Urchins',
                                                    type: 'order',
                                                    description: 'Hình cầu, vỏ cứng có nhiều gai nhọn bảo vệ. Ăn tảo. Một số loài có gai độc.',
                                                    era: 'Ordovician',
                                                    color: '#a21caf',
                                                    traits: ['Gai nhọn', 'Khớp Aristote', 'Ăn tảo']
                                                },
                                                {
                                                    id: 'sea_cucumbers',
                                                    infographicUrl: 'evolution/Sea Cucumbers.jpeg',
                                                    label: 'Hải Sâm (Dưa Chuột Biển)',
                                                    englishLabel: 'Sea Cucumbers',
                                                    type: 'order',
                                                    description: 'Cơ thể hình dưa chuột, vỏ tiêu biến. Sống ở đáy biển. Lọc bùn.',
                                                    era: 'Ordovician',
                                                    color: '#86198f',
                                                    traits: ['Thân mềm', 'Tự vệ bằng ruột', 'Lọc bùn']
                                                },
                                                {
                                                    id: 'brittle_stars',
                                                    infographicUrl: 'evolution/Brittle Stars.jpeg',
                                                    label: 'Sao Giòn (Sao Đuôi Rắn)',
                                                    englishLabel: 'Brittle Stars',
                                                    type: 'order',
                                                    description: 'Giống sao biển nhưng cánh mảnh và linh hoạt hơn. Dễ gãy cánh để trốn thoát.',
                                                    era: 'Ordovician',
                                                    color: '#701a75',
                                                    traits: ['Cánh mảnh', 'Di chuyển nhanh', 'Tự cắt cánh']
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
            id: 'vertebrates',
            infographicUrl: 'evolution/Vertebrates.jpeg',
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
                    infographicUrl: 'evolution/Fish.jpeg',
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
                            infographicUrl: 'evolution/Jawless Fish.jpeg',
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
                            infographicUrl: 'evolution/Cartilaginous Fish.jpeg',
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
                            infographicUrl: 'evolution/Bony Fish.jpeg',
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
                                    infographicUrl: 'evolution/Ray-finned Fish.jpeg',
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
                                    infographicUrl: 'evolution/Lobe-finned Fish.jpeg',
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
                    id: 'tetrapods',
                    infographicUrl: 'evolution/Tetrapods.jpeg',
                    label: 'Động vật bốn chi',
                    englishLabel: 'Tetrapods',
                    type: 'clade',
                    description: 'Tất cả động vật có chân (hoặc tổ tiên có chân) đã chinh phục đất liền.',
                    era: 'Devonian (365 triệu năm trước)',
                    color: '#9f1239', // Rose-800
                    traits: ['4 chi', 'Ngón chân'],
                    children: [
                        {
                            id: 'amphibians',
                            infographicUrl: 'evolution/Amphibians.jpeg',
                            label: 'Lưỡng Cư',
                            englishLabel: 'Amphibians',
                            type: 'class',
                            description: 'Những người tiên phong lên cạn nhưng vẫn lệ thuộc vào nước để sinh sản.',
                            era: 'Devonian',
                            color: '#9f1239',
                            traits: ['Sống hai môi trường', 'Da trần ẩm ướt'],
                            children: [
                                {
                                    id: 'frogs_toads',
                                    infographicUrl: 'evolution/Frogs & Toads.jpeg',
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
                                    infographicUrl: 'evolution/Salamanders & Newts.jpeg',
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
                                    infographicUrl: 'evolution/Caecilians.jpeg',
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
                            id: 'amniotes',
                            infographicUrl: 'evolution/Amniotes.jpeg',
                            label: 'Động vật màng ối',
                            englishLabel: 'Amniotes',
                            type: 'clade',
                            description: 'Sự đổi mới vĩ đại: Trứng có vỏ hoặc màng ối giúp động vật sinh sản hoàn toàn trên cạn khô ráo.',
                            era: 'Carboniferous (312 triệu năm trước)',
                            color: '#881337', // Rose-900
                            traits: ['Trứng có màng ối', 'Da không thấm nước'],
                            children: [
                                {
                                    id: 'synapsids',
                                    infographicUrl: 'evolution/Synapsids.jpeg',
                                    label: 'Synapsids (Nhánh Thú)',
                                    englishLabel: 'Synapsids',
                                    type: 'clade',
                                    description: 'Nhánh dẫn đến động vật có vú ngày nay. Xương sọ có 1 hố thái dương.',
                                    era: 'Carboniferous',
                                    color: '#f43f5e', // Rose-500
                                    traits: ['1 hố thái dương', 'Răng phân hóa'],
                                    children: [
                                        {
                                            id: 'early_synapsids',
                                            infographicUrl: 'evolution/Early synapsids.jpeg',
                                            label: 'Synapsids cổ (nhóm tổ tiên)',
                                            englishLabel: 'Early synapsids (pelycosaurs, simple)',
                                            type: 'order',
                                            description: 'Nhóm Synapsids sớm nhất, bao gồm Pelycosaurs (ví dụ Dimetrodon). Có màng da lớn trên lưng.',
                                            era: 'Carboniferous',
                                            color: '#fb7185',
                                            traits: ['Màng lưng', 'Biến nhiệt']
                                        },
                                        {
                                            id: 'therapsids',
                                            infographicUrl: 'evolution/Therapsids.jpeg',
                                            label: 'Therapsids (thú bò sát)',
                                            englishLabel: 'Therapsids (mammal-like reptiles, simple)',
                                            type: 'clade',
                                            description: 'Tổ tiên trực tiếp của động vật có vú.',
                                            era: 'Permian',
                                            color: '#f43f5e',
                                            traits: ['Chân dưới thân', 'Răng chuyên hóa'],
                                            children: [
                                                {
                                                    id: 'dicynodonts',
                                                    infographicUrl: 'evolution/Dicynodonts.jpeg',
                                                    label: 'Dicynodonts (ăn cỏ, tuyệt chủng)',
                                                    englishLabel: 'Dicynodonts (extinct herbivores)',
                                                    type: 'order',
                                                    description: 'Nhóm thú bò sát ăn cỏ rất thành công trước thời đại khủng long. Có 2 răng nanh lớn.',
                                                    era: 'Permian',
                                                    color: '#fb7185',
                                                    traits: ['Ăn cỏ', 'Mỏ sừng', '2 răng nanh']
                                                },
                                                {
                                                    id: 'cynodonts',
                                                    infographicUrl: 'evolution/Cynodonts.jpeg',
                                                    label: 'Cynodonts (nhánh dẫn tới thú có vú)',
                                                    englishLabel: 'Cynodonts (line toward mammals)',
                                                    type: 'clade',
                                                    description: 'Nhóm chuyển tiếp từ bò sát sang thú. Bắt đầu có lông mao và máu nóng.',
                                                    era: 'Triassic',
                                                    color: '#e11d48',
                                                    traits: ['Lông mao', 'Máu nóng (sơ khai)'],
                                                    children: [
                                                        {
                                                            id: 'mammals',
                                                            infographicUrl: 'evolution/Mammals.jpeg',
                                                            label: 'Thú (Có Vú)',
                                                            englishLabel: 'Mammals',
                                                            type: 'class',
                                                            description: 'Động vật hằng nhiệt, nuôi con bằng sữa, có lông mao. Hệ thần kinh phát triển cao nhất.',
                                                            era: 'Triassic',
                                                            color: '#fb7185',
                                                            traits: ['Lông mao', 'Tuyến sữa', 'Não bộ phát triển'],
                                                            children: [
                                                                {
                                                                    id: 'monotremes',
                                                                    infographicUrl: 'evolution/Monotremes.jpeg',
                                                                    label: 'Thú Đẻ Trứng',
                                                                    englishLabel: 'Monotremes',
                                                                    type: 'order',
                                                                    description: 'Nhóm thú nguyên thủy nhất (Thú mỏ vịt). Đẻ trứng nhưng nuôi con bằng sữa.',
                                                                    era: 'Cretaceous',
                                                                    color: '#9f1239',
                                                                    traits: ['Đẻ trứng', 'Có huyệt']
                                                                },
                                                                {
                                                                    id: 'marsupials',
                                                                    infographicUrl: 'evolution/Marsupials.jpeg',
                                                                    label: 'Thú Có Túi',
                                                                    englishLabel: 'Marsupials',
                                                                    type: 'order',
                                                                    description: 'Chuột túi, Koala. Con non lớn lên trong túi mẹ.',
                                                                    era: 'Cretaceous',
                                                                    color: '#be123c',
                                                                    traits: ['Có túi', 'Con non yếu']
                                                                },
                                                                {
                                                                    id: 'placental_mammals',
                                                                    infographicUrl: 'evolution/Placental Mammals.jpeg',
                                                                    label: 'Thú Nhau Thai',
                                                                    englishLabel: 'Placental Mammals',
                                                                    type: 'order',
                                                                    description: 'Nhóm phát triển nhất. Con non phát triển trong tử cung.',
                                                                    era: 'Cretaceous',
                                                                    color: '#e11d48',
                                                                    traits: ['Nhau thai', 'Phát triển hoàn thiện'],
                                                                    children: [
                                                                        {
                                                                            id: 'primates',
                                                                            infographicUrl: 'evolution/Primates.jpeg',
                                                                            label: 'Linh Trưởng',
                                                                            englishLabel: 'Primates',
                                                                            type: 'family',
                                                                            description: 'Khỉ, Vượn, Người. Thông minh và khéo léo.',
                                                                            era: 'Paleogene',
                                                                            color: '#fb7185',
                                                                            traits: ['Thông minh', 'Đối ngón cái']
                                                                        },
                                                                        {
                                                                            id: 'rodents',
                                                                            infographicUrl: 'evolution/Rodents.jpeg',
                                                                            label: 'Gặm Nhấm',
                                                                            englishLabel: 'Rodents',
                                                                            type: 'family',
                                                                            description: 'Chuột, Sóc.',
                                                                            era: 'Paleogene',
                                                                            color: '#f43f5e',
                                                                            traits: ['Răng cửa lớn']
                                                                        },
                                                                        {
                                                                            id: 'bats',
                                                                            infographicUrl: 'evolution/Bats.jpeg',
                                                                            label: 'Dơi',
                                                                            englishLabel: 'Bats',
                                                                            type: 'family',
                                                                            description: 'Thú biết bay.',
                                                                            era: 'Paleogene',
                                                                            color: '#e11d48',
                                                                            traits: ['Biết bay', 'Siêu âm']
                                                                        },
                                                                        {
                                                                            id: 'carnivores',
                                                                            infographicUrl: 'evolution/Carnivores.jpeg',
                                                                            label: 'Thú Ăn Thịt',
                                                                            englishLabel: 'Carnivores',
                                                                            type: 'family',
                                                                            description: 'Chó, Mèo, Gấu, Hổ.',
                                                                            era: 'Paleogene',
                                                                            color: '#be123c',
                                                                            traits: ['Răng nanh', 'Săn mồi']
                                                                        },
                                                                        {
                                                                            id: 'hoofed_mammals',
                                                                            infographicUrl: 'evolution/Hoofed Mammals.jpeg',
                                                                            label: 'Thú Móng Guốc',
                                                                            englishLabel: 'Hoofed Mammals',
                                                                            type: 'family',
                                                                            description: 'Ngựa, Bò, Hươu.',
                                                                            era: 'Paleogene',
                                                                            color: '#9f1239',
                                                                            traits: ['Móng guốc', 'Ăn cỏ']
                                                                        },
                                                                        {
                                                                            id: 'whales_dolphins',
                                                                            infographicUrl: 'evolution/Whales & Dolphins.jpeg',
                                                                            label: 'Cá Voi & Heo',
                                                                            englishLabel: 'Whales & Dolphins',
                                                                            type: 'family',
                                                                            description: 'Thú trở lại sống dưới nước.',
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
                                        }
                                    ]
                                },
                                {
                                    id: 'sauropsids',
                                    infographicUrl: 'evolution/Sauropsids.jpeg',
                                    label: 'Sauropsids (Nhánh Bò Sát)',
                                    englishLabel: 'Sauropsids',
                                    type: 'clade',
                                    description: 'Tổ tiên của tất cả các loài bò sát và chim hiện đại.',
                                    era: 'Carboniferous',
                                    color: '#b91c1c', // Red-700
                                    traits: ['Mặt kìm', 'Biến nhiệt (chủ yếu)'],
                                    children: [
                                        {
                                            id: 'reptiles_phylo',
                                            infographicUrl: 'evolution/Reptiles.jpeg',
                                            label: 'Bò Sát',
                                            englishLabel: 'Reptiles',
                                            type: 'class',
                                            description: 'Động vật biến nhiệt, da khô có vảy.',
                                            era: 'Carboniferous',
                                            color: '#991b1b', // Red-800
                                            traits: ['Da vảy', 'Trứng vỏ dai'],
                                            children: [
                                                {
                                                    id: 'testudines',
                                                    infographicUrl: 'evolution/Testudines.jpeg',
                                                    label: 'Rùa',
                                                    englishLabel: 'Testudines',
                                                    type: 'order',
                                                    description: 'Nhóm bò sát cổ xưa với chiếc mai đặc trưng bảo vệ cơ thể.',
                                                    era: 'Triassic',
                                                    color: '#7f1d1d', // Red-900
                                                    traits: ['Mai cứng', 'Không răng', 'Sống lâu'],
                                                    children: [
                                                        {
                                                            id: 'turtles',
                                                            infographicUrl: 'evolution/Turtles.jpeg',
                                                            label: 'Các loài Rùa',
                                                            englishLabel: 'Turtles',
                                                            type: 'family',
                                                            description: 'Bao gồm rùa cạn, rùa nước ngọt và rùa biển.',
                                                            era: 'Triassic',
                                                            color: '#ef4444',
                                                            traits: ['Mai sừng', 'Chậm chạp']
                                                        }
                                                    ]
                                                },
                                                {
                                                    id: 'lepidosauria',
                                                    infographicUrl: 'evolution/Lepidosauria.jpeg',
                                                    label: 'Lepidosauria (Thằn lằn & Rắn)',
                                                    englishLabel: 'Lepidosauria',
                                                    type: 'superorder',
                                                    description: 'Nhóm bò sát lớn nhất hiện nay. Da có vảy chồng lên nhau và lột xác định kỳ.',
                                                    era: 'Triassic',
                                                    color: '#dc2626', // Red-600
                                                    traits: ['Lột xác', 'Hàm linh hoạt'],
                                                    children: [
                                                        {
                                                            id: 'tuatara',
                                                            infographicUrl: 'evolution/Tuatara.jpeg',
                                                            label: 'Tuatara',
                                                            englishLabel: 'Tuatara',
                                                            type: 'order',
                                                            description: 'Hóa thạch sống duy nhất còn lại ở New Zealand. Có con mắt thứ 3.',
                                                            era: 'Triassic',
                                                            color: '#7f1d1d',
                                                            traits: ['Mắt giữa', 'Sống đêm']
                                                        },
                                                        {
                                                            id: 'lizards_snakes',
                                                            infographicUrl: 'evolution/Squamata.jpeg',
                                                            label: 'Thằn Lằn & Rắn',
                                                            englishLabel: 'Squamata',
                                                            type: 'order',
                                                            description: 'Rất đa dạng. Rắn đã mất chân trong quá trình tiến hóa để thích nghi chui rúc.',
                                                            era: 'Jurassic',
                                                            color: '#ef4444',
                                                            traits: ['Lưỡi chẻ', 'Khớp hàm lỏng']
                                                        }
                                                    ]
                                                },
                                                {
                                                    id: 'archosauria',
                                                    infographicUrl: 'evolution/Archosauria.jpeg',
                                                    label: 'Archosauria (Thằn lằn chúa)',
                                                    englishLabel: 'Archosauria',
                                                    type: 'clade',
                                                    description: 'Nhóm bò sát "thống trị" bao gồm cá sấu, khủng long và chim.',
                                                    era: 'Triassic',
                                                    color: '#b91c1c',
                                                    traits: ['Tim 4 ngăn', 'Răng trong huyệt'],
                                                    children: [
                                                        {
                                                            id: 'crocodilians',
                                                            infographicUrl: 'evolution/Crocodilians.jpeg',
                                                            label: 'Cá Sấu',
                                                            englishLabel: 'Crocodilians',
                                                            type: 'order',
                                                            description: 'Những kẻ săn mồi lưỡng cư hung dữ, ít thay đổi suốt hàng triệu năm.',
                                                            era: 'Cretaceous',
                                                            color: '#7f1d1d',
                                                            traits: ['Da giáp', 'Săn mồi']
                                                        },
                                                        {
                                                            id: 'dinosaurs',
                                                            infographicUrl: 'evolution/Dinosaurs.jpeg',
                                                            label: 'Khủng Long',
                                                            englishLabel: 'Dinosaurs',
                                                            type: 'superorder',
                                                            description: 'Nhóm động vật thống trị Trái Đất trong kỷ Jura và Phấn trắng.',
                                                            era: 'Triassic',
                                                            color: '#f87171', // Red-400
                                                            traits: ['Chân đứng thẳng', 'Đa dạng kích thước'],
                                                            children: [
                                                                {
                                                                    id: 'ornithischia',
                                                                    infographicUrl: 'evolution/Ornithischia.jpeg',
                                                                    label: 'Khủng long hông chim',
                                                                    englishLabel: 'Ornithischia',
                                                                    type: 'order',
                                                                    description: 'Khủng long ăn thực vật như Triceratops (Ba sừng) hay Stegosaurus (Kiếm).',
                                                                    era: 'Jurassic',
                                                                    color: '#fca5a5',
                                                                    traits: ['Ăn cỏ', 'Hông giống chim']
                                                                },
                                                                {
                                                                    id: 'saurischia',
                                                                    infographicUrl: 'evolution/Saurischia.jpeg',
                                                                    label: 'Khủng long hông thằn lằn',
                                                                    englishLabel: 'Saurischia',
                                                                    type: 'order',
                                                                    description: 'Bao gồm những gã khổng lồ cổ dài và những kẻ săn mồi hung bạo.',
                                                                    era: 'Triassic',
                                                                    color: '#f87171',
                                                                    traits: ['Hông thằn lằn', 'Cổ dài hoặc ăn thịt'],
                                                                    children: [
                                                                        {
                                                                            id: 'sauropods',
                                                                            infographicUrl: 'evolution/Sauropods.jpeg',
                                                                            label: 'Khủng long cổ dài',
                                                                            englishLabel: 'Sauropods',
                                                                            type: 'suborder',
                                                                            description: 'Động vật trên cạn lớn nhất lịch sử. Cổ dài, đuôi dài, đi bằng 4 chân.',
                                                                            era: 'Jurassic',
                                                                            color: '#fca5a5',
                                                                            traits: ['Khổng lồ', 'Ăn thực vật']
                                                                        },
                                                                        {
                                                                            id: 'theropods',
                                                                            infographicUrl: 'evolution/Theropods.jpeg',
                                                                            label: 'Khủng long chân thú (Theropods)',
                                                                            englishLabel: 'Theropods',
                                                                            type: 'suborder',
                                                                            description: 'Nhóm khủng long ăn thịt đứng bằng 2 chân (T-Rex, Velociraptor). Một nhánh nhỏ đã tiến hóa thành Chim.',
                                                                            era: 'Jurassic',
                                                                            color: '#ef4444',
                                                                            traits: ['Đi 2 chân', 'Ăn thịt', 'Lông vũ'],
                                                                            children: [
                                                                                {
                                                                                    id: 'birds',
                                                                                    infographicUrl: 'evolution/Birds.jpeg',
                                                                                    label: 'Chim',
                                                                                    englishLabel: 'Birds (Avian Dinosaurs)',
                                                                                    type: 'class',
                                                                                    description: "Loài khủng long duy nhất còn sống sót sau thảm họa thiên thạch.",
                                                                                    era: 'Jurassic',
                                                                                    color: '#4c0519', // Rose-950
                                                                                    traits: ['Lông vũ', 'Hằng nhiệt', 'Bay'],
                                                                                    children: [
                                                                                        {
                                                                                            id: 'flightless_birds',
                                                                                            infographicUrl: 'evolution/Flightless.jpeg',
                                                                                            label: 'Chim Không Bay',
                                                                                            englishLabel: 'Flightless Birds',
                                                                                            type: 'order',
                                                                                            description: 'Đà điểu, Cánh cụt.',
                                                                                            era: 'Cretaceous',
                                                                                            color: '#881337',
                                                                                            traits: ['Chân khỏe']
                                                                                        },
                                                                                        {
                                                                                            id: 'birds_of_prey',
                                                                                            infographicUrl: 'evolution/Birds of Prey.jpeg',
                                                                                            label: 'Chim Săn Mồi',
                                                                                            englishLabel: 'Birds of Prey',
                                                                                            type: 'order',
                                                                                            description: 'Đại bàng, Ưng.',
                                                                                            era: 'Paleogene',
                                                                                            color: '#be123c',
                                                                                            traits: ['Móng vuốt']
                                                                                        },
                                                                                        {
                                                                                            id: 'songbirds',
                                                                                            infographicUrl: 'evolution/Songbirds.jpeg',
                                                                                            label: 'Chim Hót',
                                                                                            englishLabel: 'Songbirds',
                                                                                            type: 'order',
                                                                                            description: 'Sẻ, Họa mi.',
                                                                                            era: 'Paleogene',
                                                                                            color: '#fb7185',
                                                                                            traits: ['Hót hay']
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
