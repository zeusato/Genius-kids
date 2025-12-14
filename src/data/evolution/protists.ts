import { EvolutionNode } from './types';

export const protists: EvolutionNode = {
    id: 'protists_simple',
    label: 'Nguyên Sinh Vật',
    englishLabel: 'Protists',
    type: 'kingdom',
    description: 'Vương quốc của những sinh vật nhân thực đầu tiên, đa dạng tuyệt vời từ vi sinh vật đơn bào đến tảo khổng lồ. Chúng là tổ tiên của Nấm, Thực vật và Động vật.',
    era: 'Proterozoic (2.5 tỷ năm trước)',
    color: '#7e22ce', // Purple-700
    traits: ['Nhân thực (Eukaryote)', 'Chủ yếu đơn bào', 'Dinh dưỡng đa dạng'],
    drillable: true,
    children: [
        {
            id: 'protozoa_simple',
            label: 'Nguyên sinh động vật',
            englishLabel: 'Animal-like Protists (Protozoa)',
            type: 'branch',
            color: '#6b21a8', // Purple-800
            description: 'Những "thợ săn" tí hon trong thế giới vi mô. Chúng di chuyển tích cực để tìm kiếm thức ăn giống như động vật.',
            era: 'Proterozoic',
            traits: ['Dị dưỡng', 'Di chuyển tích cực', 'Không có thành tế bào'],
            children: [
                {
                    id: 'amoebas',
                    label: 'Trùng amip',
                    englishLabel: 'Amoebas',
                    type: 'class',
                    color: '#581c87', // Purple-900
                    description: 'Bậc thầy biến hình! Chúng di chuyển và bắt mồi bằng cách vươn ra các "chân giả" (pseudopods).',
                    era: '1 tỷ năm trước',
                    traits: ['Chân giả', 'Biến hình liên tục', 'Thực bào'],
                    children: [
                        {
                            id: 'amoeba_example',
                            label: 'Amip (ví dụ)',
                            englishLabel: 'Amoeba proteus',
                            type: 'species',
                            color: '#3b0764', // Purple-950
                            description: 'Một đại diện điển hình, thường sống trong nước ngọt và bùn ao.',
                            era: 'Hiện đại',
                            traits: ['Kích thước lớn (so với vi khuẩn)', 'Trong suốt']
                        }
                    ]
                },
                {
                    id: 'ciliates',
                    label: 'Trùng lông bơi',
                    englishLabel: 'Ciliates',
                    type: 'class',
                    color: '#581c87',
                    description: 'Những tay bơi lội cự phách, phủ đầy lông nhỏ rung động nhịp nhàng để di chuyển và lùa thức ăn.',
                    era: '800 triệu năm trước',
                    traits: ['Lông bơi (Cilia)', '2 nhân tế bào', 'Không bào co bóp'],
                    children: [
                        {
                            id: 'paramecium_example',
                            label: 'Trùng giày',
                            englishLabel: 'Paramecium',
                            type: 'species',
                            color: '#3b0764',
                            description: 'Có hình dạng giống chiếc giày, bơi rất nhanh và lôi cuốn.',
                            era: 'Hiện đại',
                            traits: ['Hình đế giày', 'Rất phổ biến']
                        }
                    ]
                },
                {
                    id: 'flagellates',
                    label: 'Trùng roi',
                    englishLabel: 'Flagellates',
                    type: 'class',
                    color: '#581c87',
                    description: 'Sử dụng một hoặc nhiều "chiếc roi" dài để bơi xoắn trong nước.',
                    era: '1.5 tỷ năm trước',
                    traits: ['Roi bơi (Flagella)', 'Vừa tự dưỡng vừa dị dưỡng'],
                    children: [
                        {
                            id: 'euglena_example',
                            label: 'Trùng roi xanh',
                            englishLabel: 'Euglena',
                            type: 'species',
                            color: '#3b0764',
                            description: 'Sinh vật kỳ thú: Có lục lạp để quang hợp như cây, nhưng bơi được như thú.',
                            era: 'Hiện đại',
                            traits: ['Điểm mắt đỏ', 'Cảm quang']
                        }
                    ]
                },
                {
                    id: 'sporozoans',
                    label: 'Ký sinh bào tử',
                    englishLabel: 'Sporozoans',
                    type: 'class',
                    color: '#581c87',
                    description: 'Những kẻ "di cư" nguy hiểm, sống ký sinh trong cơ thể vật chủ và sinh sản bằng bào tử.',
                    era: 'Tiến hóa muộn hơn',
                    traits: ['Ký sinh bắt buộc', 'Không bộ phận di chuyển', 'Vòng đời phức tạp'],
                    children: [
                        {
                            id: 'plasmodium_example',
                            label: 'Ký sinh trùng sốt rét',
                            englishLabel: 'Plasmodium',
                            type: 'species',
                            color: '#3b0764',
                            description: 'Thủ phạm gây bệnh sốt rét, truyền qua muỗi Anophen.',
                            era: 'Hiện đại',
                            traits: ['Gây bệnh nguy hiểm', 'Phá hủy hồng cầu']
                        }
                    ]
                }
            ]
        },
        {
            id: 'algae_simple',
            label: 'Tảo',
            englishLabel: 'Algae',
            type: 'branch',
            color: '#0f766e', // Teal-700
            description: 'Những "nhà máy oxy" của đại dương. Chúng quang hợp giống thực vật nhưng cấu trúc đơn giản hơn.',
            era: 'Proterozoic',
            traits: ['Quang hợp', 'Sống dưới nước', 'Không có rễ/thân/lá thật'],
            children: [
                {
                    id: 'green_algae',
                    label: 'Tảo xanh',
                    englishLabel: 'Green algae',
                    type: 'class',
                    color: '#115e59', // Teal-800
                    description: 'Họ hàng gần nhất của thực vật trên cạn. Có màu xanh lục tươi.',
                    era: '1.2 tỷ năm trước',
                    traits: ['Diệp lục a & b', 'Thành tế bào Cellulose', 'Dự trữ tinh bột'],
                    children: [
                        {
                            id: 'chlamydomonas_example',
                            label: 'Tảo đơn bào',
                            englishLabel: 'Chlamydomonas',
                            type: 'species',
                            color: '#134e4a', // Teal-900
                            description: 'Tảo lục bơi bằng 2 roi, thường gặp trong vũng nước đọng.',
                            era: 'Hiện đại',
                            traits: ['Đơn bào', '2 roi bơi']
                        }
                    ]
                },
                {
                    id: 'brown_algae',
                    label: 'Tảo nâu',
                    englishLabel: 'Brown algae',
                    type: 'class',
                    color: '#854d0e', // Yellow-800
                    description: 'Những gã khổng lồ dưới biển, tạo nên những "rừng tảo" hùng vĩ.',
                    era: 'Jurassic',
                    traits: ['Đa bào phức tạp', 'Sắc tố nâu (Fucoxanthin)', 'Kích thước lớn'],
                    children: [
                        {
                            id: 'kelp_example',
                            label: 'Rong biển Kelp',
                            englishLabel: 'Kelp',
                            type: 'species',
                            color: '#713f12', // Yellow-900
                            description: 'Có thể mọc dài tới 60 mét, tạo môi trường sống cho rái cá biển.',
                            era: 'Hiện đại',
                            traits: ['Siêu lớn', 'Tăng trưởng cực nhanh']
                        }
                    ]
                },
                {
                    id: 'red_algae',
                    label: 'Tảo đỏ',
                    englishLabel: 'Red algae',
                    type: 'class',
                    color: '#be185d', // Pink-700
                    description: 'Sống ở những vùng nước sâu nơi ánh sáng xanh dương xuyên tới được.',
                    era: '1.2 tỷ năm trước',
                    traits: ['Sắc tố đỏ (Phycoerythrin)', 'Không có roi bơi', 'Làm thạch (Agar)'],
                    children: [
                        {
                            id: 'red_algae_example',
                            label: 'Rong đỏ',
                            englishLabel: 'Rhodophyta',
                            type: 'species',
                            color: '#9d174d', // Pink-800
                            description: 'Dùng làm thực phẩm (Nori cuốn sushi) và công nghiệp.',
                            era: 'Hiện đại',
                            traits: ['Ăn được', 'Tạo rạn san hô']
                        }
                    ]
                },
                {
                    id: 'diatoms',
                    label: 'Tảo cát',
                    englishLabel: 'Diatoms',
                    type: 'class',
                    color: '#b45309', // Amber-700
                    description: 'Những viên ngọc quý của biển cả với lớp vỏ thủy tinh tinh xảo.',
                    era: 'Jurassic',
                    traits: ['Vỏ Silic (Thủy tinh)', 'Đối xứng hoàn hảo', 'Phù du sinh vật'],
                    children: [
                        {
                            id: 'diatom_example',
                            label: 'Tảo cát',
                            englishLabel: 'Diatom',
                            type: 'species',
                            color: '#92400e', // Amber-800
                            description: 'Tạo ra 20% lượng oxy trên Trái Đất.',
                            era: 'Hiện đại',
                            traits: ['Sản xuất Oxy cực lớn', 'Dùng lọc nước']
                        }
                    ]
                }
            ]
        },
        {
            id: 'funguslike_protists',
            label: 'Nguyên sinh giống nấm',
            englishLabel: 'Fungus-like Protists',
            type: 'branch',
            color: '#c2410c', // Orange-700
            description: 'Trông giống nấm mốc nhưng thực ra là nguyên sinh vật. Chúng thường phân hủy xác bã hữu cơ.',
            era: 'Proterozoic',
            traits: ['Sinh sản bằng bào tử', 'Dị dưỡng hoại sinh', 'Thành tế bào khác nấm thật'],
            children: [
                {
                    id: 'slime_molds',
                    label: 'Nấm nhầy',
                    englishLabel: 'Slime molds',
                    type: 'class',
                    color: '#9a3412', // Orange-800
                    description: 'Sinh vật kỳ quặc có thể "bò" tập thể để tìm thức ăn.',
                    era: 'Cổ đại',
                    traits: ['Hợp bào khổng lồ', 'Di chuyển được', 'Màu sắc sặc sỡ'],
                    children: [
                        {
                            id: 'physarum_example',
                            label: 'Nấm nhầy Physarum',
                            englishLabel: 'Physarum polycephalum',
                            type: 'species',
                            color: '#7c2d12', // Orange-900
                            description: 'Có khả năng giải mê cung để tìm thức ăn dù không có não!',
                            era: 'Hiện đại',
                            traits: ['Thông minh không não', 'Màu vàng tươi']
                        }
                    ]
                },
                {
                    id: 'water_molds',
                    label: 'Nấm nước',
                    englishLabel: 'Water molds (Oomycetes)',
                    type: 'class',
                    color: '#9a3412',
                    description: 'Kẻ thù của cá và cây trồng. Sống trong nước hoặc đất ẩm.',
                    era: 'Cổ đại',
                    traits: ['Sợi nấm', 'Thành Cellulose (Nấm thật là Chitin)', 'Ký sinh thực vật'],
                    children: [
                        {
                            id: 'phytophthora_example',
                            label: 'Nấm mốc sương',
                            englishLabel: 'Phytophthora',
                            type: 'species',
                            color: '#7c2d12',
                            description: 'Thủ phạm gây ra Nạn đói khoai tây Ireland lịch sử.',
                            era: 'Hiện đại',
                            traits: ['Gây bệnh cây trồng', 'Lây lan nhanh']
                        }
                    ]
                }
            ]
        }
    ]
};
