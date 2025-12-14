import { EvolutionNode } from './types';

export const bacteria: EvolutionNode = {
    id: 'bacteria',
    label: 'Vi Khuẩn',
    englishLabel: 'Bacteria',
    type: 'domain',
    description: 'Những "kiến trúc sư" tí hon của sự sống. Chúng có mặt ở mọi nơi, từ đỉnh núi cao đến đáy vực sâu và cả trong cơ thể bạn.',
    era: 'Archean (3.8 tỷ năm trước)',
    color: '#0284c7', // Sky-600
    traits: ['Nhân sơ (Prokaryote)', 'Thành tế bào Peptidoglycan', 'Sinh sản phân đôi'],
    infographicUrl: 'evolution/bacteria.jpeg',
    drillable: true,
    children: [
        {
            id: 'proteobacteria',
            label: 'Proteobacteria',
            englishLabel: 'Proteobacteria (Phylum)',
            type: 'phylum',
            color: '#0369a1', // Sky-700
            description: 'Nhóm vi khuẩn lớn và đa dạng nhất, được đặt theo tên Proteus - vị thần biển có thể thay đổi hình dạng.',
            infographicUrl: 'evolution/Proteobacteria.jpeg',
            era: 'Cổ đại',
            traits: ['Gram âm', 'Đa dạng hình thái', 'Nhiều loài gây bệnh'],
            children: [
                {
                    id: 'alpha_proteobacteria',
                    label: 'Alpha Proteobacteria',
                    englishLabel: 'Alphaproteobacteria',
                    type: 'class',
                    color: '#0c4a6e', // Sky-900
                    description: 'Tổ tiên của ty thể trong tế bào của chúng ta. Nhiều loài cộng sinh với thực vật.',
                    era: 'Cổ đại',
                    traits: ['Cố định đạm', 'Cộng sinh thực vật'],
                    infographicUrl: 'evolution/Alpha Proteobacteria.jpeg',
                    children: [
                        {
                            id: 'rhizobiales',
                            label: 'Vi khuẩn nốt sần',
                            englishLabel: 'Rhizobiales',
                            type: 'order',
                            color: '#082f49', // Sky-950
                            description: 'Những người bạn tốt của cây đậu, giúp biến nitơ trong không khí thành phân bón tự nhiên.',
                            era: 'Hiện đại',
                            traits: ['Sống trong rễ cây', 'Cung cấp đạm cho đất'],
                            infographicUrl: 'evolution/Rhizobiales.jpeg',
                            children: [
                                {
                                    id: 'rhizobium_example',
                                    label: 'Rhizobium',
                                    englishLabel: 'Rhizobium',
                                    type: 'genus',
                                    color: '#0c4a6e',
                                    description: 'Vi khuẩn cộng sinh điển hình trong rễ cây họ Đậu.',
                                    era: 'Hiện đại',
                                    traits: ['Tạo nốt sần', 'Quan trọng cho nông nghiệp'],
                                    infographicUrl: 'evolution/Rhizobium.jpeg'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'gamma_proteobacteria',
                    label: 'Gamma Proteobacteria',
                    englishLabel: 'Gammaproteobacteria',
                    type: 'class',
                    color: '#0369a1',
                    description: 'Nhóm nổi tiếng chứa nhiều vi khuẩn gây bệnh và cả những loài quan trọng trong nghiên cứu.',
                    era: 'Cổ đại',
                    traits: ['Kỵ khí tùy tiện', 'Phân giải đường'],
                    infographicUrl: 'evolution/Gammaproteobacteria.jpeg',
                    children: [
                        {
                            id: 'enterobacterales',
                            label: 'Vi khuẩn đường ruột',
                            englishLabel: 'Enterobacterales',
                            type: 'order',
                            color: '#075985',
                            description: 'Sống thành quần thể đông đúc trong ruột động vật và con người.',
                            era: 'Hiện đại',
                            traits: ['Lên men glucose', 'Sống cộng sinh hoặc ký sinh'],
                            infographicUrl: 'evolution/Enterobacterales.jpeg',
                            children: [
                                {
                                    id: 'ecoli_example',
                                    label: 'Vi khuẩn E. coli',
                                    englishLabel: 'Escherichia coli',
                                    type: 'species',
                                    color: '#0c4a6e',
                                    description: 'Sinh vật mô hình nổi tiếng nhất. Sống trong ruột già, đa số vô hại nhưng một số gây bệnh.',
                                    era: 'Hiện đại',
                                    traits: ['Chỉ thị vệ sinh', 'Dễ nuôi cấy'],
                                    infographicUrl: 'evolution/Escherichia coli.jpeg'
                                },
                                {
                                    id: 'salmonella_example',
                                    label: 'Salmonella',
                                    englishLabel: 'Salmonella',
                                    type: 'species',
                                    color: '#0c4a6e',
                                    description: 'Thủ phạm quen mặt của các vụ ngộ độc thực phẩm.',
                                    era: 'Hiện đại',
                                    traits: ['Gây thương hàn', 'Lây qua thức ăn'],
                                    infographicUrl: 'evolution/Salmonella.jpeg'
                                }
                            ]
                        },
                        {
                            id: 'pseudomonadales',
                            label: 'Pseudomonadales',
                            englishLabel: 'Pseudomonadales',
                            type: 'order',
                            color: '#075985',
                            description: 'Những kẻ cơ hội, có thể sống được ở môi trường khắc nghiệt và kháng thuốc mạnh.',
                            era: 'Hiện đại',
                            traits: ['Hiếu khí tuyệt đối', 'Kháng kháng sinh mạnh'],
                            infographicUrl: 'evolution/Pseudomonadales.jpeg',
                            children: [
                                {
                                    id: 'pseudomonas_example',
                                    label: 'Pseudomonas',
                                    englishLabel: 'Pseudomonas aeruginosa',
                                    type: 'species',
                                    color: '#0c4a6e',
                                    description: 'Có thể phân hủy dầu mỏ, nhựa nhưng cũng gây nhiễm trùng nguy hiểm.',
                                    era: 'Hiện đại',
                                    traits: ['Sinh sắc tố xanh', 'Đa năng'],
                                    infographicUrl: 'evolution/Pseudomonas aeruginosa.jpeg'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'beta_proteobacteria',
                    label: 'Beta Proteobacteria',
                    englishLabel: 'Betaproteobacteria',
                    type: 'class',
                    color: '#0284c7',
                    description: 'Đóng vai trò quan trọng trong chu trình Nitơ của Trái Đất.',
                    era: 'Cổ đại',
                    traits: ['Oxy hóa Amoniac', 'Đa dạng chuyển hóa'],
                    infographicUrl: 'evolution/Betaproteobacteria.jpeg',
                    children: []
                },
                {
                    id: 'delta_epsilon_proteobacteria',
                    label: 'Delta/Epsilon',
                    englishLabel: 'Delta/Epsilon',
                    type: 'class',
                    color: '#0284c7',
                    description: 'Bao gồm các loài vi khuẩn săn mồi và vi khuẩn dạ dày.',
                    era: 'Cổ đại',
                    traits: ['Săn mồi (Bdellovibrio)', 'Chịu axit (Helicobacter)'],
                    infographicUrl: 'evolution/Delta-Epsilon.jpeg',
                    children: []
                }
            ]
        },
        {
            id: 'bacillota_firmicutes',
            label: 'Firmicutes (Bacillota)',
            englishLabel: 'Firmicutes',
            type: 'phylum',
            color: '#4f46e5', // Indigo-600
            description: 'Nhóm vi khuẩn Gram dương thành dày. Nhiều loài sinh bào tử bền vững để sống sót qua thời kỳ khó khăn.',
            era: 'Cổ đại',
            traits: ['Gram dương', 'Thành tế bào dày', 'Sinh nội bào tử'],
            infographicUrl: 'evolution/Firmicutes.jpeg',
            children: [
                {
                    id: 'bacilli',
                    label: 'Lớp Bacilli',
                    englishLabel: 'Bacilli',
                    type: 'class',
                    color: '#3730a3', // Indigo-800
                    description: 'Gồm cả vi khuẩn có lợi (lên men) và vi khuẩn gây bệnh (than).',
                    era: 'Hiện đại',
                    traits: ['Hiếu khí hoặc kỵ khí', 'Hình que hoặc cầu'],
                    infographicUrl: 'evolution/Bacilli.jpeg',
                    children: [
                        {
                            id: 'lactobacillales',
                            label: 'Vi khuẩn Lactic',
                            englishLabel: 'Lactobacillales',
                            type: 'order',
                            color: '#312e81', // Indigo-900
                            description: 'Những người bạn thân thiết. Chuyển đường thành axit lactic, làm sữa chua, dưa muối.',
                            era: 'Hiện đại',
                            traits: ['Lên men axit', 'Không sinh bào tử'],
                            infographicUrl: 'evolution/Lactobacillales.jpeg',
                            children: [
                                {
                                    id: 'lactobacillus_example',
                                    label: 'Lactobacillus',
                                    englishLabel: 'Lactobacillus',
                                    type: 'genus',
                                    color: '#1e1b4b',
                                    description: 'Có nhiều trong sữa chua, men tiêu hóa, giúp bảo vệ ruột.',
                                    era: 'Hiện đại',
                                    traits: ['Probiotic', 'Kháng khuẩn'],
                                    infographicUrl: 'evolution/Lactobacillus.jpeg'
                                }
                            ]
                        },
                        {
                            id: 'bacillales',
                            label: 'Bacillales',
                            englishLabel: 'Bacillales',
                            type: 'order',
                            color: '#312e81',
                            description: 'Các vi khuẩn hình que sinh bào tử, sống nhiều trong đất.',
                            era: 'Hiện đại',
                            traits: ['Sinh bào tử bền', 'Sản xuất enzyme'],
                            infographicUrl: 'evolution/Bacillales.jpeg',
                            children: [
                                {
                                    id: 'bacillus_example',
                                    label: 'Trực khuẩn Bacillus',
                                    englishLabel: 'Bacillus subtilis',
                                    type: 'genus',
                                    color: '#1e1b4b',
                                    description: 'Dùng sản xuất kháng sinh và men vi sinh.',
                                    era: 'Hiện đại',
                                    traits: ['Có ích cho đất', 'Sản xuất Natto'],
                                    infographicUrl: 'evolution/Bacillus subtilis.jpeg'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'clostridia',
                    label: 'Lớp Clostridia',
                    englishLabel: 'Clostridia',
                    type: 'class',
                    color: '#3730a3',
                    description: 'Kị khí tuyệt đối - Oxy là chất độc với chúng.',
                    era: 'Cổ đại',
                    traits: ['Kỵ khí bắt buộc', 'Sinh độc tố mạnh'],
                    infographicUrl: 'evolution/Clostridia.jpeg',
                    children: [
                        {
                            id: 'clostridiales',
                            label: 'Clostridiales',
                            englishLabel: 'Clostridiales',
                            type: 'order',
                            color: '#312e81',
                            description: 'Thường sống trong đất sâu hoặc ruột kín khí.',
                            era: 'Hiện đại',
                            traits: ['Lên men butyric', 'Phân hủy xác'],
                            infographicUrl: 'evolution/Clostridiales.jpeg',
                            children: [
                                {
                                    id: 'clostridium_example',
                                    label: 'Clostridium',
                                    englishLabel: 'Clostridium',
                                    type: 'genus',
                                    color: '#1e1b4b',
                                    description: 'Gây uốn ván, ngộ độc thịt nhưng cũng có loài cố định đạm.',
                                    era: 'Hiện đại',
                                    traits: ['Gây uốn ván', 'Tạo botox'],
                                    infographicUrl: 'evolution/Clostridium.jpeg'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'cyanobacteria',
            label: 'Vi khuẩn lam',
            englishLabel: 'Cyanobacteria',
            type: 'phylum',
            color: '#0891b2', // Cyan-600
            description: 'Những kiến trúc sư tạo ra bầu khí quyển Oxy cho Trái Đất hàng tỷ năm trước.',
            era: 'Archean (2.7 tỷ năm trước)',
            traits: ['Quang hợp thải Oxy', 'Sắc tố xanh lam', 'Cố định đạm'],
            infographicUrl: 'evolution/Cyanobacteria.jpeg',
            children: [
                {
                    id: 'cyanophyceae_simple',
                    label: 'Lớp Vi khuẩn lam',
                    englishLabel: 'Cyanophyceae',
                    type: 'class',
                    color: '#155e75', // Cyan-800
                    description: 'Còn gọi là tảo lam. Không phải tảo thật mà là vi khuẩn.',
                    era: 'Cổ đại',
                    traits: ['Sống cộng sinh (địa y)', 'Gây hiện tượng nở hoa'],
                    infographicUrl: 'evolution/Cyanophyceae.jpeg',
                    children: [
                        {
                            id: 'nostocales',
                            label: 'Nostocales (Dạng sợi)',
                            englishLabel: 'Nostocales',
                            type: 'order',
                            color: '#0e7490',
                            description: 'Có tế bào chuyên hóa đặc biệt để cố định đạm.',
                            era: 'Hiện đại',
                            traits: ['Dị tế bào (Heterocyst)', 'Dạng chuỗi hạt'],
                            infographicUrl: 'evolution/Nostocales.jpeg',
                            children: [
                                {
                                    id: 'anabaena_example',
                                    label: 'Anabaena',
                                    englishLabel: 'Anabaena',
                                    type: 'genus',
                                    color: '#164e63', // Cyan-950
                                    description: 'Thường sống cộng sinh trong bèo hoa dâu, giúp bèo thành phân xanh tuyệt vời.',
                                    era: 'Hiện đại',
                                    traits: ['Cộng sinh bèo dâu', 'Cung cấp đạm'],
                                    infographicUrl: 'evolution/Anabaena.jpeg'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'actinobacteria',
            label: 'Actinobacteria',
            englishLabel: 'Actinobacteria',
            type: 'phylum',
            color: '#db2777', // Pink-600
            description: 'Vi khuẩn Gram dương có hàm G+C cao. Tạo ra mùi thơm đặc trưng của đất sau mưa (Geosmin).',
            era: 'Cổ đại',
            traits: ['Dạng sợi phân nhánh', 'Giống nấm', 'Tạo kháng sinh'],
            infographicUrl: 'evolution/Actinobacteria.jpeg',
            children: [
                {
                    id: 'actinobacteria_class',
                    label: 'Lớp Actinobacteria',
                    englishLabel: 'Actinobacteria',
                    type: 'class',
                    color: '#9d174d', // Pink-800
                    description: 'Nguồn dược liệu vô tận của tự nhiên.',
                    era: 'Hiện đại',
                    traits: ['Phân giải chất khó tan', 'Sống trong đất'],
                    children: [
                        {
                            id: 'actinomycetales_simple',
                            label: 'Actinomycetales',
                            englishLabel: 'Actinomycetales',
                            type: 'order',
                            color: '#831843',
                            description: 'Nhóm xạ khuẩn quan trọng nhất.',
                            era: 'Hiện đại',
                            traits: ['Sinh bào tử trần', 'Tạo sợi khí sinh'],
                            infographicUrl: 'evolution/Actinomycetales.jpeg',
                            children: [
                                {
                                    id: 'streptomyces_example',
                                    label: 'Xạ khuẩn Streptomyces',
                                    englishLabel: 'Streptomyces',
                                    type: 'genus',
                                    color: '#500724', // Pink-950
                                    description: 'Ông tổ của ngành công nghiệp kháng sinh (Streptomycin, v.v.).',
                                    era: 'Hiện đại',
                                    traits: ['Sản xuất >50% kháng sinh', 'Mùi đất (Geosmin)'],
                                    infographicUrl: 'evolution/Streptomyces.jpeg'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'bacteroidota',
            label: 'Bacteroidota',
            englishLabel: 'Bacteroidota',
            type: 'phylum',
            color: '#d97706', // Amber-600
            description: 'Chuyên gia phân hủy các loại đường phức tạp từ thực vật.',
            era: 'Cổ đại',
            traits: ['Gram âm', 'Kỵ khí', 'Không sinh bào tử'],
            infographicUrl: 'evolution/Bacteroidota.jpeg',
            children: [
                {
                    id: 'bacteroidia',
                    label: 'Lớp Bacteroidia',
                    englishLabel: 'Bacteroidia',
                    type: 'class',
                    color: '#b45309', // Amber-700
                    description: 'Thành phần chính của hệ vi sinh vật đường ruột người.',
                    era: 'Hiện đại',
                    traits: ['Sống trong ruột', 'Giúp tiêu hóa xơ'],
                    infographicUrl: 'evolution/Bacteroidia.jpeg',
                    children: [
                        {
                            id: 'bacteroidales',
                            label: 'Bacteroidales',
                            englishLabel: 'Bacteroidales',
                            type: 'order',
                            color: '#92400e',
                            description: 'Chiếm tỷ trọng lớn nhất trong phân.',
                            era: 'Hiện đại',
                            traits: ['Lên men carbohydrate', 'Tương tác miễn dịch'],
                            infographicUrl: 'evolution/Bacteroidales.jpeg',
                            children: [
                                {
                                    id: 'bacteroides_example',
                                    label: 'Bacteroides',
                                    englishLabel: 'Bacteroides',
                                    type: 'genus',
                                    color: '#78350f',
                                    description: 'Giúp cơ thể huấn luyện hệ miễn dịch và chống lại vi khuẩn có hại.',
                                    era: 'Hiện đại',
                                    traits: ['Lợi khuẩn', 'Có thể gây bệnh cơ hội'],
                                    infographicUrl: 'evolution/Bacteroides.jpeg'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'spirochaetota',
            label: 'Vi khuẩn xoắn',
            englishLabel: 'Spirochaetota',
            type: 'phylum',
            color: '#be123c', // Rose-600
            description: 'Những vận động viên bơi lội với hình dáng lò xo độc đáo.',
            era: 'Cổ đại',
            traits: ['Hình xoắn ốc', 'Roi nội bào (Endoflagella)', 'Di chuyển kiểu nút chai'],
            infographicUrl: 'evolution/Spirochaetota.jpeg',
            children: [
                {
                    id: 'spirochaetia',
                    label: 'Lớp Spirochaetia',
                    englishLabel: 'Spirochaetia',
                    type: 'class',
                    color: '#9f1239', // Rose-800
                    description: 'Vừa có loài sống tự do, vừa có loài gây bệnh nguy hiểm.',
                    era: 'Hiện đại',
                    traits: ['Thành tế bào mỏng', 'Khó nhuộm Gram'],
                    infographicUrl: 'evolution/Spirochaetia.jpeg',
                    children: [
                        {
                            id: 'spirochaetales',
                            label: 'Spirochaetales',
                            englishLabel: 'Spirochaetales',
                            type: 'order',
                            color: '#881337',
                            description: 'Nhóm chứa các tác nhân gây bệnh giang mai và Lyme.',
                            era: 'Hiện đại',
                            traits: ['Gây bệnh mãn tính', 'Lẩn trốn miễn dịch'],
                            infographicUrl: 'evolution/Spirochaetales.jpeg',
                            children: [
                                {
                                    id: 'borrelia_example',
                                    label: 'Borrelia',
                                    englishLabel: 'Borrelia burgdorferi',
                                    type: 'genus',
                                    color: '#4c0519', // Rose-950
                                    description: 'Thủ phạm gây bệnh Lyme lây truyền qua vết cắn của ve.',
                                    era: 'Hiện đại',
                                    traits: ['Bệnh Lyme', 'Truyền qua ve'],
                                    infographicUrl: 'evolution/Borrelia burgdorferi.jpeg'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

export const archaea: EvolutionNode = {
    id: 'archaea',
    label: 'Cổ Khuẩn',
    englishLabel: 'Archaea',
    type: 'domain',
    description: 'Những sinh vật "bền bỉ" nhất hành tinh. Chúng sống ở những nơi không ai sống nổi: miệng núi lửa, hồ muối mặn chát, hay đáy đại dương tăm tối.',
    era: 'Archean (3.8 tỷ năm trước)',
    color: '#475569', // Slate-600
    traits: ['Màng lipid Ether (chịu nhiệt)', 'Không gây bệnh', 'Hóa tự dưỡng'],
    drillable: true,
    children: [
        {
            id: 'euryarchaeota',
            label: 'Euryarchaeota',
            englishLabel: 'Euryarchaeota',
            type: 'phylum',
            color: '#334155', // Slate-700
            description: 'Nhóm cổ khuẩn đa dạng nhất, bao gồm những loài sinh ra khí Metan và những loài yêu thích muối.',
            era: 'Cổ đại',
            traits: ['Sinh Metan', 'Ưa mặn', 'Đa dạng sinh thái'],
            children: [
                {
                    id: 'methanogens',
                    label: 'Cổ khuẩn sinh Metan',
                    englishLabel: 'Methanogens',
                    type: 'class',
                    color: '#15803d', // Green-700 (Methane connection)
                    description: 'Chúng tạo ra khí Metan (biogas) bằng cách phân giải chất hữu cơ trong điều kiện không có oxy.',
                    era: 'Cổ đại',
                    traits: ['Kỵ khí tuyệt đối', 'Tạo khí Metan', 'Sống trong ruột bò, đầm lầy'],
                    children: [
                        {
                            id: 'methanobacteriales',
                            label: 'Methanobacteriales',
                            englishLabel: 'Methanobacteriales',
                            type: 'order',
                            color: '#14532d',
                            description: 'Thường sống trong bùn thải và ruột động vật.',
                            era: 'Hiện đại',
                            traits: ['Hình que ngắn', 'Vách giả peptidoglycan'],
                            children: [
                                {
                                    id: 'methanobrevibacter_example',
                                    label: 'Methanobrevibacter',
                                    englishLabel: 'Methanobrevibacter smithii',
                                    type: 'species',
                                    color: '#052e16',
                                    description: 'Cư dân phổ biến trong ruột người, giúp tiêu hóa carbohydrate phức tạp.',
                                    era: 'Hiện đại',
                                    traits: ['Lợi khuẩn ruột', 'Sinh metan']
                                }
                            ]
                        },
                        {
                            id: 'methanosarcinales',
                            label: 'Methanosarcinales',
                            englishLabel: 'Methanosarcinales',
                            type: 'order',
                            color: '#14532d',
                            description: 'Có thể sử dụng nhiều loại thức ăn khác nhau để tạo metan.',
                            era: 'Hiện đại',
                            traits: ['Đa năng', 'Tế bào xếp gói'],
                            children: [
                                {
                                    id: 'methanosarcina_example',
                                    label: 'Methanosarcina',
                                    englishLabel: 'Methanosarcina',
                                    type: 'genus',
                                    color: '#052e16',
                                    description: 'Có thể sống ở cả môi trường nước ngọt và nước mặn.',
                                    era: 'Hiện đại',
                                    traits: ['Chịu mặn', 'Tạo khí sinh học']
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'extreme_halophiles',
                    label: 'Cổ khuẩn ưa mặn',
                    englishLabel: 'Extreme Halophiles',
                    type: 'class',
                    color: '#be185d', // Pink-700
                    description: 'Sống vui vẻ trong những hồ nước mặn đến mức làm chết cá. Chúng tạo nên màu hồng rực rỡ cho các ruộng muối.',
                    era: 'Hiện đại',
                    traits: ['Cần muối nồng độ cao', 'Quang hợp bằng Rhodopsin'],
                    children: [
                        {
                            id: 'halobacteriales',
                            label: 'Halobacteriales',
                            englishLabel: 'Halobacteriales',
                            type: 'order',
                            color: '#9d174d',
                            description: 'Có cơ chế bơm ion đặc biệt để không bị mất nước trong môi trường muối.',
                            era: 'Hiện đại',
                            traits: ['Bơm Kali vào tế bào', 'Hiếu khí'],
                            children: [
                                {
                                    id: 'halobacterium_example',
                                    label: 'Halobacterium',
                                    englishLabel: 'Halobacterium',
                                    type: 'genus',
                                    color: '#831843',
                                    description: 'Được tìm thấy trong các tinh thể muối cổ đại hàng triệu năm tuổi.',
                                    era: 'Cổ đại',
                                    traits: ['Màu hồng tím', 'Bất tử trong muối']
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'crenarchaeota_simple',
            label: 'Crenarchaeota',
            englishLabel: 'Crenarchaeota',
            type: 'phylum',
            color: '#9f1239', // Rose-800
            description: 'Những tín đồ của nhiệt độ cao. Được tìm thấy nhiều nhất ở các suối nước nóng Yellowstone.',
            era: 'Rất cổ đại',
            traits: ['Ưa nhiệt cực đại', 'Ưa axit', 'Màng tế bào đặc biệt'],
            children: [
                {
                    id: 'thermophiles_acidophiles',
                    label: 'Nhóm Ưa Nhiệt & Axit',
                    englishLabel: 'Thermoacidophiles',
                    type: 'class',
                    color: '#881337',
                    description: 'Sống trong môi trường như nồi lẩu chua cay: vừa nóng vừa axit.',
                    era: 'Cổ đại',
                    traits: ['Chịu nhiệt >80°C', 'pH thấp'],
                    children: [
                        {
                            id: 'sulfolobales',
                            label: 'Sulfolobales',
                            englishLabel: 'Sulfolobales',
                            type: 'order',
                            color: '#4c0519',
                            description: 'Sử dụng lưu huỳnh để tạo năng lượng, sống ở suối nước nóng có lưu huỳnh.',
                            era: 'Hiện đại',
                            traits: ['Oxy hóa lưu huỳnh', 'Lỗ châm (Pits)'],
                            children: [
                                {
                                    id: 'sulfolobus_example',
                                    label: 'Sulfolobus',
                                    englishLabel: 'Sulfolobus',
                                    type: 'genus',
                                    color: '#881337',
                                    description: 'Mô hình nghiên cứu quan trọng về sự sao chép DNA ở nhiệt độ cao.',
                                    era: 'Hiện đại',
                                    traits: ['Virus ký sinh độc lạ', 'Hình cầu']
                                }
                            ]
                        },
                        {
                            id: 'thermoproteales',
                            label: 'Thermoproteales',
                            englishLabel: 'Thermoproteales',
                            type: 'order',
                            color: '#4c0519',
                            description: 'Có hình dạng thay đổi linh hoạt, thường là hình que dài.',
                            era: 'Hiện đại',
                            traits: ['Kỵ khí', 'Khử lưu huỳnh'],
                            children: [
                                {
                                    id: 'thermoproteus_example',
                                    label: 'Thermoproteus',
                                    englishLabel: 'Thermoproteus',
                                    type: 'genus',
                                    color: '#881337',
                                    description: 'Sống ở các lỗ phun khí núi lửa dưới đáy biển.',
                                    era: 'Hiện đại',
                                    traits: ['Cực kỳ ưa nhiệt', 'Chạy bằng Hydro']
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'thaumarchaeota',
            label: 'Thaumarchaeota',
            englishLabel: 'Thaumarchaeota',
            type: 'phylum',
            color: '#0f766e', // Teal-700
            description: 'Nhóm cổ khuẩn "mát mẻ" hơn, sống đầy rẫy trong đại dương và đất, không cần môi trường cực đoan.',
            era: 'Trung sinh',
            traits: ['Oxy hóa Amoniac', 'Sống ôn hòa', 'Chu trình Nitơ'],
            children: [
                {
                    id: 'ammonia_oxidizing_archaea',
                    label: 'Nhóm Ăn Amoni',
                    englishLabel: 'Ammonia Oxidizers',
                    type: 'class',
                    color: '#115e59',
                    description: 'Đóng vai trò quan trọng trong việc làm sạch nước biển bằng cách tiêu thụ amoniac.',
                    era: 'Hiện đại',
                    traits: ['Hóa tự dưỡng', 'Tạo Nitrit'],
                    children: [
                        {
                            id: 'nitrosopumilales',
                            label: 'Nitrosopumilales',
                            englishLabel: 'Nitrosopumilales',
                            type: 'order',
                            color: '#134e4a',
                            description: 'Nhóm sinh vật phổ biến nhất trong các đại dương.',
                            era: 'Hiện đại',
                            traits: ['Có mặt khắp đại dương', 'Quan trọng toàn cầu'],
                            children: [
                                {
                                    id: 'nitrosopumilus_example',
                                    label: 'Nitrosopumilus',
                                    englishLabel: 'Nitrosopumilus maritimus',
                                    type: 'species',
                                    color: '#042f2e',
                                    description: 'Sát thủ diệt Amoniac của biển cả, nguồn thức ăn cơ sở cho sinh vật phù du.',
                                    era: 'Hiện đại',
                                    traits: ['Làm sạch biển', 'Kích thước nhỏ']
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'asgard_archaea_simple',
            label: 'Asgard Archaea',
            englishLabel: 'Asgard Archaea',
            type: 'phylum',
            color: '#581c87', // Purple-900 (Eukaryote Link)
            description: 'Nhóm cổ khuẩn bí ẩn được đặt tên theo các vị thần Bắc Âu (Thor, Loki, Odin). Chúng được cho là tổ tiên trực tiếp của sinh vật nhân thực (Eukaryotes).',
            era: 'Giao thời',
            traits: ['Gen giống Eukaryote', 'Cấu trúc tế bào phức tạp', 'Manh mối tiến hóa'],
            children: [
                {
                    id: 'lokiarchaeota_simple',
                    label: 'Lokiarchaeota',
                    englishLabel: 'Lokiarchaeota',
                    type: 'class',
                    color: '#3b0764',
                    description: 'Được tìm thấy gần "Lâu đài Loki" (một miệng phun thủy nhiệt). Chứa nhiều gen mà trước đây nghĩ chỉ con người mới có.',
                    era: 'Gần đây',
                    traits: ['Hệ khung xương tế bào', 'Tiền thân nhân thực'],
                    children: [
                        {
                            id: 'lokiarchaeum_example',
                            label: 'Lokiarchaeum',
                            englishLabel: 'Lokiarchaeum',
                            type: 'genus',
                            color: '#2e1065',
                            description: 'Bằng chứng sống động nhất cho thấy chúng ta tiến hóa từ Cổ khuẩn.',
                            era: 'Hiện đại',
                            traits: ['Mắt xích thiếu hụt', 'Chưa nuôi cấy được']
                        }
                    ]
                }
            ]
        }
    ]
};
