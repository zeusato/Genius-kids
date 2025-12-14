import { EvolutionNode } from './types';

export const fungi: EvolutionNode = {
    id: 'fungi_simple',
    label: 'Vương Quốc Nấm',
    englishLabel: 'Fungi Kingdom',
    type: 'kingdom',
    description: 'Những "người tái chế" vĩ đại của tự nhiên. Không phải thực vật, không phải động vật, Nấm hấp thụ dinh dưỡng bằng cách phân hủy vật chất hữu cơ.',
    era: 'Proterozoic (1.5 tỷ năm trước)',
    color: '#d97706', // Amber-600
    traits: ['Thành tế bào Chitin', 'Dị dưỡng hoại sinh', 'Sinh sản bằng bào tử'],
    drillable: true,
    children: [
        {
            id: 'chytrids',
            label: 'Nấm roi (Chytrids)',
            englishLabel: 'Chytrids',
            type: 'branch',
            color: '#b45309', // Amber-700
            description: 'Nhóm nấm cổ xưa nhất, sống chủ yếu dưới nước. Đặc biệt vì bào tử của chúng có roi bơi được.',
            era: 'Tiền Cambri',
            traits: ['Bào tử có roi bơi', 'Sống dưới nước', 'Ký sinh hoặc hoại sinh'],
            children: [
                {
                    id: 'chytrid_example',
                    label: 'Chytrid điển hình',
                    englishLabel: 'Chytrid Example',
                    type: 'class',
                    color: '#92400e', // Amber-800
                    description: 'Thủ phạm gây ra sự suy giảm số lượng lưỡng cư (ếch nhái) trên toàn cầu.',
                    era: 'Cổ đại',
                    traits: ['Gây bệnh cho da ếch', 'Kích thước hiển vi']
                }
            ]
        },
        {
            id: 'molds_simple',
            label: 'Nấm mốc',
            englishLabel: 'Molds',
            type: 'branch',
            color: '#c2410c', // Orange-700
            description: 'Những kẻ "xâm chiếm" nhanh chóng. Chúng tạo ra mạng lưới sợi nấm chằng chịt, thường gặp trên thực phẩm để lâu.',
            era: 'Cổ sinh',
            traits: ['Hệ sợi nấm phát triển mạnh', 'Sinh sản vô tính nhanh', 'Ưa ẩm'],
            children: [
                {
                    id: 'zygomycetes_simple',
                    label: 'Mốc bánh mì (Nấm tiếp hợp)',
                    englishLabel: 'Zygomycetes',
                    type: 'class',
                    color: '#9a3412', // Orange-800
                    description: 'Loại mốc đen hoặc trắng xốp thường thấy trên bánh mì cũ.',
                    era: 'Hiện đại',
                    traits: ['Bào tử tiếp hợp', 'Phân hủy tinh bột'],
                    children: [
                        {
                            id: 'bread_mold_example',
                            label: 'Mốc bánh mì',
                            englishLabel: 'Bread Mold',
                            type: 'family',
                            color: '#7c2d12', // Orange-900
                            description: 'Rhizopus stolonifer - Kẻ thù của tiệm bánh.',
                            era: 'Hiện đại',
                            traits: ['Mọc rất nhanh', 'Bào tử màu đen'],
                            children: [
                                {
                                    id: 'rhizopus_example',
                                    label: 'Mốc đen Rhizopus',
                                    englishLabel: 'Rhizopus',
                                    type: 'species',
                                    color: '#431407', // Orange-950
                                    description: 'Có thể được dùng để lên men tempeh hoặc sản xuất axit hữu cơ.',
                                    era: 'Hiện đại',
                                    traits: ['Ứng dụng công nghiệp', 'Phân hủy mạnh']
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'ascomycota_simple',
                    label: 'Nấm túi (Ascomycota)',
                    englishLabel: 'Ascomycetes',
                    type: 'class',
                    color: '#9a3412', // Orange-800
                    description: 'Nhóm nấm lớn nhất, sinh bào tử trong các túi nhỏ gọi là "ascus". Bao gồm cả nấm cục đắt tiền.',
                    era: 'Hiện đại',
                    traits: ['Bào tử túi', 'Đa dạng nhất', 'Nhiều loài ăn được'],
                    children: [
                        {
                            id: 'penicillium_example',
                            label: 'Penicillium (Mốc xanh)',
                            englishLabel: 'Penicillium',
                            type: 'genus',
                            color: '#7c2d12',
                            description: 'Người hùng y học: Nơi chiết xuất ra thuốc kháng sinh Penicillin đầu tiên.',
                            era: 'Hiện đại',
                            traits: ['Kháng khuẩn', 'Làm phô mai xanh'],
                            children: [
                                {
                                    id: 'blue_mold_example',
                                    label: 'Mốc xanh',
                                    englishLabel: 'Blue Mold',
                                    type: 'species',
                                    color: '#431407',
                                    description: 'Alexander Fleming đã tình cờ phát hiện ra kháng sinh từ loại nấm này.',
                                    era: 'Hiện đại',
                                    traits: ['Màu xanh đặc trưng', 'Vị đắng nhẹ']
                                }
                            ]
                        },
                        {
                            id: 'morels_truffles_example',
                            label: 'Nấm Morel & Nấm Cục',
                            englishLabel: 'Morels & Truffles',
                            type: 'genus',
                            color: '#7c2d12',
                            description: 'Những viên kim cương đen của ẩm thực. Sống cộng sinh dưới rễ cây.',
                            era: 'Hiện đại',
                            traits: ['Cực kỳ đắt đỏ', 'Hương vị tuyệt hảo', 'Sống dưới đất'],
                            children: [
                                {
                                    id: 'truffle_example',
                                    label: 'Nấm cục (Truffle)',
                                    englishLabel: 'Truffle',
                                    type: 'species',
                                    color: '#431407',
                                    description: 'Phải dùng chó hoặc lợn để đánh hơi và tìm kiếm.',
                                    era: 'Hiện đại',
                                    traits: ['Vua của các loại nấm', 'Giá trị kinh tế cao']
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'mushrooms_simple',
            label: 'Nấm Lớn (Nấm Đảm)',
            englishLabel: 'Mushrooms (Basidiomycota)',
            type: 'branch',
            color: '#a16207', // Yellow-800 (Darker Yellow/Brown)
            description: 'Những cây dù của rừng thẳm. Có mũ nấm, chân nấm và phiến nấm chứa bào tử.',
            era: 'Cổ sinh',
            traits: ['Mũ nấm rõ rệt', 'Sinh sản hữu tính', 'Phân hủy gỗ'],
            children: [
                {
                    id: 'basidiomycota_simple',
                    label: 'Nấm Đảm',
                    englishLabel: 'Basidiomycetes',
                    type: 'class',
                    color: '#854d0e', // Yellow-900
                    description: 'Nhóm nấm quen thuộc nhất trong bữa ăn hàng ngày.',
                    era: 'Hiện đại',
                    traits: ['Bào tử đảm', 'Thể quả lớn'],
                    children: [
                        {
                            id: 'button_mushroom_example',
                            label: 'Nấm mỡ',
                            englishLabel: 'Button Mushroom',
                            type: 'genus',
                            color: '#713f12',
                            description: 'Loại nấm được trồng phổ biến nhất thế giới.',
                            era: 'Hiện đại',
                            traits: ['Dễ trồng', 'Thơm ngon'],
                            children: [
                                {
                                    id: 'agaricus_example',
                                    label: 'Nấm Agaricus',
                                    englishLabel: 'Agaricus',
                                    type: 'species',
                                    color: '#451a03',
                                    description: 'Nấm mỡ trắng, nấm nâu đều thuộc chi này.',
                                    era: 'Hiện đại',
                                    traits: ['Mũ tròn', 'Phiến nâu']
                                }
                            ]
                        },
                        {
                            id: 'bracket_mushroom_example',
                            label: 'Nấm Tai Gỗ',
                            englishLabel: 'Bracket Fungi',
                            type: 'genus',
                            color: '#713f12',
                            description: 'Mọc như những chiếc kệ bám trên thân cây gỗ mục. Rất dai và cứng.',
                            era: 'Hiện đại',
                            traits: ['Dai như gỗ', 'Sống lâu năm'],
                            children: [
                                {
                                    id: 'polypore_example',
                                    label: 'Nấm Vân Chi (Polypore)',
                                    englishLabel: 'Polypore',
                                    type: 'species',
                                    color: '#451a03',
                                    description: 'Dùng làm thuốc, có vân màu đẹp mắt như đuôi gà tây.',
                                    era: 'Hiện đại',
                                    traits: ['Dược liệu', 'Phân hủy gỗ mạnh']
                                }
                            ]
                        },
                        {
                            id: 'puffball_example',
                            label: 'Nấm Bụp Bóng',
                            englishLabel: 'Puffball',
                            type: 'genus',
                            color: '#713f12',
                            description: 'Tròn như quả bóng, khi già chạm vào sẽ "phun" ra đám mây bào tử như khói.',
                            era: 'Hiện đại',
                            traits: ['Kín, không mũ', 'Phát tán nhờ gió'],
                            children: [
                                {
                                    id: 'puffball_detail_example',
                                    label: 'Nấm Bụp Khổng Lồ',
                                    englishLabel: 'Giant Puffball',
                                    type: 'species',
                                    color: '#451a03',
                                    description: 'Có thể to bằng quả bóng đá, bên trong trắng tinh ăn được khi còn non.',
                                    era: 'Hiện đại',
                                    traits: ['Kích thước lớn', 'Ăn được khi non']
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'yeasts_simple',
            label: 'Nấm Men',
            englishLabel: 'Yeasts',
            type: 'branch',
            color: '#ca8a04', // Yellow-700
            description: 'Nấm đơn bào quan trọng nhất với loài người. Không có sợi nấm.',
            era: 'Cổ đại',
            traits: ['Đơn bào', 'Lên men đường', 'Sinh sản nảy chồi'],
            children: [
                {
                    id: 'baker_yeast_example',
                    label: 'Men bánh mì',
                    englishLabel: "Baker's Yeast",
                    type: 'species',
                    color: '#a16207', // Yellow-800
                    description: 'Saccharomyces cerevisiae - Thợ làm bánh và nấu bia tài ba.',
                    era: 'Hiện đại',
                    traits: ['Làm nở bánh', 'Lên men rượu bia', 'Mô hình nghiên cứu Gen']
                }
            ]
        }
    ]
};
