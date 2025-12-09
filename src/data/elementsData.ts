// Periodic Table Elements Data
// 118 nguyên tố hóa học với thông tin chi tiết

export type ElementCategory =
    | 'alkali-metal'      // Kim loại kiềm
    | 'alkaline-earth'    // Kim loại kiềm thổ
    | 'transition-metal'  // Kim loại chuyển tiếp
    | 'post-transition'   // Kim loại sau chuyển tiếp
    | 'metalloid'         // Á kim
    | 'nonmetal'          // Phi kim
    | 'halogen'           // Halogen
    | 'noble-gas'         // Khí hiếm
    | 'lanthanide'        // Lanthanide
    | 'actinide'          // Actinide
    | 'unknown';          // Chưa xác định

export interface ElementData {
    atomicNumber: number;
    symbol: string;
    name: string;
    nameEn: string;
    atomicMass: number;
    category: ElementCategory;
    period: number;
    group: number;
    electronConfig: string;
    electronShells: number[];
    color: string;
    glowColor: string;
    description: string;
    facts: string[];
    discoveryYear?: number;
    meltingPoint?: number;
    boilingPoint?: number;
    density?: number;
    state: 'solid' | 'liquid' | 'gas' | 'unknown';
    infographicPath: string; // Relative path to infographic image in Supabase Storage
}

// Category colors for neon effect
export const CATEGORY_COLORS: Record<ElementCategory, { color: string; glow: string }> = {
    'alkali-metal': { color: '#FF6B6B', glow: '#FF6B6B80' },
    'alkaline-earth': { color: '#FFA94D', glow: '#FFA94D80' },
    'transition-metal': { color: '#FFD43B', glow: '#FFD43B80' },
    'post-transition': { color: '#69DB7C', glow: '#69DB7C80' },
    'metalloid': { color: '#38D9A9', glow: '#38D9A980' },
    'nonmetal': { color: '#4DABF7', glow: '#4DABF780' },
    'halogen': { color: '#748FFC', glow: '#748FFC80' },
    'noble-gas': { color: '#DA77F2', glow: '#DA77F280' },
    'lanthanide': { color: '#F783AC', glow: '#F783AC80' },
    'actinide': { color: '#E599F7', glow: '#E599F780' },
    'unknown': { color: '#868E96', glow: '#868E9680' },
};

export const ELEMENTS_DATA: ElementData[] = [
    // ===== PERIOD 1 =====
    {
        atomicNumber: 1,
        symbol: 'H',
        name: 'Hiđro',
        nameEn: 'Hydrogen',
        atomicMass: 1.008,
        category: 'nonmetal',
        period: 1,
        group: 1,
        electronConfig: '1s¹',
        electronShells: [1],
        color: '#4DABF7',
        glowColor: '#4DABF780',
        description: 'Hiđro là nguyên tố nhẹ nhất và phổ biến nhất trong vũ trụ, chiếm khoảng 75% khối lượng vật chất thông thường. Nó là thành phần chính của các ngôi sao và khí khổng lồ.',
        facts: [
            'Hiđro là nguyên tố đầu tiên trong bảng tuần hoàn và nhẹ nhất trong tất cả các nguyên tố.',
            'Mặt Trời chuyển đổi khoảng 600 triệu tấn hiđro thành heli mỗi giây.',
            'Hiđro lỏng được sử dụng làm nhiên liệu tên lửa cho các tàu vũ trụ NASA.'
        ],
        discoveryYear: 1766,
        meltingPoint: -259.16,
        boilingPoint: -252.87,
        density: 0.00008988,
        state: 'gas', infographicPath: 'element/Hydrogen.jpeg'
    },
    {
        atomicNumber: 2,
        symbol: 'He',
        name: 'Heli',
        nameEn: 'Helium',
        atomicMass: 4.0026,
        category: 'noble-gas',
        period: 1,
        group: 18,
        electronConfig: '1s²',
        electronShells: [2],
        color: '#DA77F2',
        glowColor: '#DA77F280',
        description: 'Heli là khí hiếm nhẹ thứ hai, không màu, không mùi, không vị và không độc. Nó có điểm sôi thấp nhất trong tất cả các nguyên tố.',
        facts: [
            'Heli được phát hiện trên Mặt Trời trước khi tìm thấy trên Trái Đất (tên gọi từ thần Mặt Trời Helios).',
            'Heli là nguyên tố duy nhất không thể đông đặc ở áp suất thường, dù ở nhiệt độ 0 tuyệt đối.',
            'Bóng bay heli bay lên vì heli nhẹ hơn không khí khoảng 7 lần.'
        ],
        discoveryYear: 1868,
        meltingPoint: -272.2,
        boilingPoint: -268.93,
        density: 0.0001785,
        state: 'gas', infographicPath: 'element/Helium.jpeg'
    },

    // ===== PERIOD 2 =====
    {
        atomicNumber: 3,
        symbol: 'Li',
        name: 'Liti',
        nameEn: 'Lithium',
        atomicMass: 6.94,
        category: 'alkali-metal',
        period: 2,
        group: 1,
        electronConfig: '[He] 2s¹',
        electronShells: [2, 1],
        color: '#FF6B6B',
        glowColor: '#FF6B6B80',
        description: 'Liti là kim loại nhẹ nhất, mềm, màu trắng bạc. Nó phản ứng mạnh với nước và được sử dụng rộng rãi trong pin sạc.',
        facts: [
            'Liti nhẹ đến mức có thể nổi trên dầu và nước.',
            'Pin lithium-ion trong điện thoại và xe điện sử dụng liti làm thành phần chính.',
            'Liti được sử dụng trong điều trị rối loạn lưỡng cực từ những năm 1970.'
        ],
        discoveryYear: 1817,
        meltingPoint: 180.54,
        boilingPoint: 1342,
        density: 0.534,
        state: 'solid', infographicPath: 'element/Lithium.jpeg'
    },
    {
        atomicNumber: 4,
        symbol: 'Be',
        name: 'Berili',
        nameEn: 'Beryllium',
        atomicMass: 9.0122,
        category: 'alkaline-earth',
        period: 2,
        group: 2,
        electronConfig: '[He] 2s²',
        electronShells: [2, 2],
        color: '#FFA94D',
        glowColor: '#FFA94D80',
        description: 'Berili là kim loại kiềm thổ nhẹ, cứng, có màu xám thép. Nó được sử dụng trong hợp kim cho các ứng dụng hàng không vũ trụ.',
        facts: [
            'Berili cứng như thép nhưng nhẹ hơn 35%.',
            'Gương của Kính viễn vọng Không gian James Webb được làm từ berili mạ vàng.',
            'Berili và hợp chất của nó rất độc, có thể gây bệnh phổi nghiêm trọng.'
        ],
        discoveryYear: 1798,
        meltingPoint: 1287,
        boilingPoint: 2469,
        density: 1.85,
        state: 'solid', infographicPath: 'element/Beryllium.jpeg'
    },
    {
        atomicNumber: 5,
        symbol: 'B',
        name: 'Bo',
        nameEn: 'Boron',
        atomicMass: 10.81,
        category: 'metalloid',
        period: 2,
        group: 13,
        electronConfig: '[He] 2s² 2p¹',
        electronShells: [2, 3],
        color: '#38D9A9',
        glowColor: '#38D9A980',
        description: 'Bo là á kim có độ cứng cao, được sử dụng trong thủy tinh borosilicate (Pyrex) và các vật liệu siêu cứng.',
        facts: [
            'Bo là một trong những nguyên tố cứng nhất, chỉ sau carbon (kim cương).',
            'Axit boric từ bo được dùng làm thuốc nhỏ mắt và chất bảo quản.',
            'Bo được tạo ra trong các vụ nổ siêu tân tinh, không phải trong các ngôi sao thông thường.'
        ],
        discoveryYear: 1808,
        meltingPoint: 2076,
        boilingPoint: 3927,
        density: 2.34,
        state: 'solid', infographicPath: 'element/Boron.jpeg'
    },
    {
        atomicNumber: 6,
        symbol: 'C',
        name: 'Cacbon',
        nameEn: 'Carbon',
        atomicMass: 12.011,
        category: 'nonmetal',
        period: 2,
        group: 14,
        electronConfig: '[He] 2s² 2p²',
        electronShells: [2, 4],
        color: '#4DABF7',
        glowColor: '#4DABF780',
        description: 'Cacbon là nền tảng của sự sống và hóa học hữu cơ. Nó tồn tại ở nhiều dạng thù hình như kim cương, than chì, và graphene.',
        facts: [
            'Kim cương và than chì đều là cacbon nguyên chất, chỉ khác nhau về cấu trúc tinh thể.',
            'Cơ thể người chứa khoảng 18% cacbon theo khối lượng.',
            'Graphene (một lớp cacbon) mỏng hơn giấy 1 triệu lần nhưng cứng hơn thép 200 lần.'
        ],
        discoveryYear: -3750,
        meltingPoint: 3550,
        boilingPoint: 4027,
        density: 2.267,
        state: 'solid', infographicPath: 'element/Carbon.jpeg'
    },
    {
        atomicNumber: 7,
        symbol: 'N',
        name: 'Nitơ',
        nameEn: 'Nitrogen',
        atomicMass: 14.007,
        category: 'nonmetal',
        period: 2,
        group: 15,
        electronConfig: '[He] 2s² 2p³',
        electronShells: [2, 5],
        color: '#4DABF7',
        glowColor: '#4DABF780',
        description: 'Nitơ chiếm 78% khí quyển Trái Đất. Nó là thành phần thiết yếu của protein, DNA và nhiều phân tử sinh học.',
        facts: [
            'Mỗi hơi thở bạn hít vào chứa khoảng 78% nitơ.',
            'Nitơ lỏng có nhiệt độ -196°C, dùng để bảo quản tế bào và làm kem lạnh tức thì.',
            'Phân bón nitơ giúp cây trồng phát triển, nuôi sống hàng tỷ người.'
        ],
        discoveryYear: 1772,
        meltingPoint: -210.1,
        boilingPoint: -195.79,
        density: 0.0012506,
        state: 'gas', infographicPath: 'element/Nitrogen.jpeg'
    },
    {
        atomicNumber: 8,
        symbol: 'O',
        name: 'Oxi',
        nameEn: 'Oxygen',
        atomicMass: 15.999,
        category: 'nonmetal',
        period: 2,
        group: 16,
        electronConfig: '[He] 2s² 2p⁴',
        electronShells: [2, 6],
        color: '#4DABF7',
        glowColor: '#4DABF780',
        description: 'Oxi là nguyên tố thiết yếu cho sự sống, chiếm 21% khí quyển và 65% khối lượng cơ thể người (chủ yếu trong nước).',
        facts: [
            'Oxi lỏng có màu xanh nhạt và có từ tính.',
            'Ozon (O₃) trong tầng bình lưu bảo vệ Trái Đất khỏi tia UV có hại.',
            'Lửa cần oxi để cháy - không có oxi, không thể có ngọn lửa.'
        ],
        discoveryYear: 1774,
        meltingPoint: -218.79,
        boilingPoint: -182.96,
        density: 0.001429,
        state: 'gas', infographicPath: 'element/Oxygen.jpeg'
    },
    {
        atomicNumber: 9,
        symbol: 'F',
        name: 'Flo',
        nameEn: 'Fluorine',
        atomicMass: 18.998,
        category: 'halogen',
        period: 2,
        group: 17,
        electronConfig: '[He] 2s² 2p⁵',
        electronShells: [2, 7],
        color: '#748FFC',
        glowColor: '#748FFC80',
        description: 'Flo là nguyên tố có tính phản ứng mạnh nhất, có thể phản ứng với hầu hết mọi chất. Nó được thêm vào kem đánh răng để ngăn sâu răng.',
        facts: [
            'Flo phản ứng mạnh đến mức thậm chí có thể ăn mòn thủy tinh.',
            'Teflon (chống dính) được làm từ hợp chất flo.',
            'Fluoride trong nước uống và kem đánh răng giúp răng chắc khỏe hơn.'
        ],
        discoveryYear: 1886,
        meltingPoint: -219.67,
        boilingPoint: -188.11,
        density: 0.001696,
        state: 'gas', infographicPath: 'element/Fluorine.jpeg'
    },
    {
        atomicNumber: 10,
        symbol: 'Ne',
        name: 'Neon',
        nameEn: 'Neon',
        atomicMass: 20.180,
        category: 'noble-gas',
        period: 2,
        group: 18,
        electronConfig: '[He] 2s² 2p⁶',
        electronShells: [2, 8],
        color: '#DA77F2',
        glowColor: '#DA77F280',
        description: 'Neon là khí hiếm phát sáng màu đỏ cam rực rỡ khi có dòng điện đi qua. Đèn neon được phát minh năm 1910.',
        facts: [
            'Đèn "neon" màu khác thực ra dùng các khí khác nhau, chỉ màu đỏ cam là neon thật.',
            'Neon hiếm trên Trái Đất nhưng là nguyên tố phổ biến thứ 5 trong vũ trụ.',
            'Neon được dùng trong laser helium-neon cho máy quét mã vạch.'
        ],
        discoveryYear: 1898,
        meltingPoint: -248.59,
        boilingPoint: -246.08,
        density: 0.0008999,
        state: 'gas', infographicPath: 'element/Neon.jpeg'
    },

    // ===== PERIOD 3 =====
    {
        atomicNumber: 11,
        symbol: 'Na',
        name: 'Natri',
        nameEn: 'Sodium',
        atomicMass: 22.990,
        category: 'alkali-metal',
        period: 3,
        group: 1,
        electronConfig: '[Ne] 3s¹',
        electronShells: [2, 8, 1],
        color: '#FF6B6B',
        glowColor: '#FF6B6B80',
        description: 'Natri là kim loại kiềm mềm, màu trắng bạc, phản ứng mãnh liệt với nước tạo ngọn lửa vàng. Nó là thành phần của muối ăn (NaCl).',
        facts: [
            'Natri phản ứng với nước mạnh đến mức có thể nổ.',
            'Đèn đường màu vàng cam sử dụng hơi natri.',
            'Cơ thể người cần natri để dẫn truyền xung thần kinh và co cơ.'
        ],
        discoveryYear: 1807,
        meltingPoint: 97.794,
        boilingPoint: 882.94,
        density: 0.971,
        state: 'solid', infographicPath: 'element/Sodium.jpeg'
    },
    {
        atomicNumber: 12,
        symbol: 'Mg',
        name: 'Magie',
        nameEn: 'Magnesium',
        atomicMass: 24.305,
        category: 'alkaline-earth',
        period: 3,
        group: 2,
        electronConfig: '[Ne] 3s²',
        electronShells: [2, 8, 2],
        color: '#FFA94D',
        glowColor: '#FFA94D80',
        description: 'Magie là kim loại nhẹ, bền, được sử dụng trong hợp kim máy bay và ô tô. Nó cháy với ngọn lửa trắng chói.',
        facts: [
            'Pháo sáng và pháo hoa trắng sử dụng magie vì nó cháy rất sáng.',
            'Magie là khoáng chất thiết yếu cho hơn 300 phản ứng enzyme trong cơ thể.',
            'Nước biển chứa khoảng 0.13% magie.'
        ],
        discoveryYear: 1755,
        meltingPoint: 650,
        boilingPoint: 1090,
        density: 1.738,
        state: 'solid', infographicPath: 'element/Magnesium.jpeg'
    },
    {
        atomicNumber: 13,
        symbol: 'Al',
        name: 'Nhôm',
        nameEn: 'Aluminum',
        atomicMass: 26.982,
        category: 'post-transition',
        period: 3,
        group: 13,
        electronConfig: '[Ne] 3s² 3p¹',
        electronShells: [2, 8, 3],
        color: '#69DB7C',
        glowColor: '#69DB7C80',
        description: 'Nhôm là kim loại phổ biến nhất trong vỏ Trái Đất, nhẹ, bền, chống ăn mòn. Nó được dùng trong lon nước, máy bay, và nhiều ứng dụng khác.',
        facts: [
            'Từng có thời nhôm quý hơn vàng - Napoleon III dùng đĩa nhôm trong tiệc hoàng gia.',
            'Tháp Washington được đặt một khối nhôm ở đỉnh vào năm 1884.',
            'Nhôm tái chế tiết kiệm 95% năng lượng so với sản xuất từ quặng.'
        ],
        discoveryYear: 1825,
        meltingPoint: 660.32,
        boilingPoint: 2519,
        density: 2.70,
        state: 'solid', infographicPath: 'element/Aluminum.jpeg'
    },
    {
        atomicNumber: 14,
        symbol: 'Si',
        name: 'Silic',
        nameEn: 'Silicon',
        atomicMass: 28.085,
        category: 'metalloid',
        period: 3,
        group: 14,
        electronConfig: '[Ne] 3s² 3p²',
        electronShells: [2, 8, 4],
        color: '#38D9A9',
        glowColor: '#38D9A980',
        description: 'Silic là nền tảng của công nghệ bán dẫn và chip máy tính. Nó là nguyên tố phổ biến thứ hai trong vỏ Trái Đất sau oxi.',
        facts: [
            'Thung lũng Silicon ở California được đặt tên theo nguyên tố này.',
            'Cát biển chủ yếu là silic dioxide (SiO₂).',
            'Mỗi smartphone chứa hàng tỷ transistor làm từ silic.'
        ],
        discoveryYear: 1824,
        meltingPoint: 1414,
        boilingPoint: 3265,
        density: 2.3296,
        state: 'solid', infographicPath: 'element/Silicon.jpeg'
    },
    {
        atomicNumber: 15,
        symbol: 'P',
        name: 'Photpho',
        nameEn: 'Phosphorus',
        atomicMass: 30.974,
        category: 'nonmetal',
        period: 3,
        group: 15,
        electronConfig: '[Ne] 3s² 3p³',
        electronShells: [2, 8, 5],
        color: '#4DABF7',
        glowColor: '#4DABF780',
        description: 'Photpho có nhiều dạng thù hình: trắng (độc, phát sáng), đỏ (an toàn hơn), đen. Nó thiết yếu cho DNA, ATP và xương.',
        facts: [
            'Photpho trắng phát sáng trong bóng tối và tự bốc cháy trong không khí.',
            'Đầu que diêm chứa photpho đỏ.',
            'Phân lân (photphat) là loại phân bón quan trọng nhất cho nông nghiệp.'
        ],
        discoveryYear: 1669,
        meltingPoint: 44.15,
        boilingPoint: 280.5,
        density: 1.82,
        state: 'solid', infographicPath: 'element/Phosphorus.jpeg'
    },
    {
        atomicNumber: 16,
        symbol: 'S',
        name: 'Lưu huỳnh',
        nameEn: 'Sulfur',
        atomicMass: 32.06,
        category: 'nonmetal',
        period: 3,
        group: 16,
        electronConfig: '[Ne] 3s² 3p⁴',
        electronShells: [2, 8, 6],
        color: '#4DABF7',
        glowColor: '#4DABF780',
        description: 'Lưu huỳnh là nguyên tố màu vàng với mùi đặc trưng (trứng thối). Nó được sử dụng trong sản xuất axit sulfuric và lưu hóa cao su.',
        facts: [
            'Mùi "trứng thối" thực chất là khí hydrogen sulfide (H₂S).',
            'Núi lửa phun ra lưu huỳnh, tạo ra các cảnh quan vàng rực.',
            'Thuốc súng đen cổ điển chứa lưu huỳnh, than củi và kali nitrat.'
        ],
        discoveryYear: -2000,
        meltingPoint: 115.21,
        boilingPoint: 444.6,
        density: 2.067,
        state: 'solid', infographicPath: 'element/Sulfur.jpeg'
    },
    {
        atomicNumber: 17,
        symbol: 'Cl',
        name: 'Clo',
        nameEn: 'Chlorine',
        atomicMass: 35.45,
        category: 'halogen',
        period: 3,
        group: 17,
        electronConfig: '[Ne] 3s² 3p⁵',
        electronShells: [2, 8, 7],
        color: '#748FFC',
        glowColor: '#748FFC80',
        description: 'Clo là khí màu vàng lục có mùi hăng, được dùng để khử trùng nước uống và bể bơi. Nó là thành phần của muối ăn.',
        facts: [
            'Clo được sử dụng làm vũ khí hóa học trong Thế chiến I.',
            'Mùi "bể bơi" không phải do clo mà do chloramine (clo + mồ hôi/nước tiểu).',
            'Clo khử trùng nước đã cứu sống hàng triệu người khỏi bệnh tả và thương hàn.'
        ],
        discoveryYear: 1774,
        meltingPoint: -101.5,
        boilingPoint: -34.04,
        density: 0.003214,
        state: 'gas', infographicPath: 'element/Chlorine.jpeg'
    },
    {
        atomicNumber: 18,
        symbol: 'Ar',
        name: 'Argon',
        nameEn: 'Argon',
        atomicMass: 39.948,
        category: 'noble-gas',
        period: 3,
        group: 18,
        electronConfig: '[Ne] 3s² 3p⁶',
        electronShells: [2, 8, 8],
        color: '#DA77F2',
        glowColor: '#DA77F280',
        description: 'Argon là khí hiếm phổ biến nhất trong khí quyển (0.93%). Tên của nó có nghĩa là "lười biếng" vì nó gần như không phản ứng.',
        facts: [
            'Bóng đèn sợi đốt chứa argon để ngăn dây tóc bị oxy hóa.',
            'Argon được dùng trong hàn MIG/TIG để bảo vệ mối hàn.',
            'Các cửa sổ kính cách nhiệt thường chứa argon giữa hai lớp kính.'
        ],
        discoveryYear: 1894,
        meltingPoint: -189.34,
        boilingPoint: -185.85,
        density: 0.0017837,
        state: 'gas', infographicPath: 'element/Argon.jpeg'
    },

    // ===== PERIOD 4 (19-36) =====
    {
        atomicNumber: 19,
        symbol: 'K',
        name: 'Kali',
        nameEn: 'Potassium',
        atomicMass: 39.098,
        category: 'alkali-metal',
        period: 4,
        group: 1,
        electronConfig: '[Ar] 4s¹',
        electronShells: [2, 8, 8, 1],
        color: '#FF6B6B',
        glowColor: '#FF6B6B80',
        description: 'Kali là kim loại kiềm mềm, thiết yếu cho cơ thể sống. Nó phản ứng mãnh liệt với nước, tạo ngọn lửa tím.',
        facts: [
            'Chuối nổi tiếng giàu kali - nhưng bơ còn chứa nhiều hơn.',
            'Kali rất quan trọng cho nhịp tim đều đặn và chức năng cơ.',
            'Ký hiệu K đến từ tên Latin "Kalium".'
        ],
        discoveryYear: 1807,
        meltingPoint: 63.5,
        boilingPoint: 759,
        density: 0.862,
        state: 'solid', infographicPath: 'element/Potassium.jpeg'
    },
    {
        atomicNumber: 20,
        symbol: 'Ca',
        name: 'Canxi',
        nameEn: 'Calcium',
        atomicMass: 40.078,
        category: 'alkaline-earth',
        period: 4,
        group: 2,
        electronConfig: '[Ar] 4s²',
        electronShells: [2, 8, 8, 2],
        color: '#FFA94D',
        glowColor: '#FFA94D80',
        description: 'Canxi là khoáng chất phổ biến nhất trong cơ thể người, chiếm khoảng 2% trọng lượng cơ thể. Nó chủ yếu có trong xương và răng.',
        facts: [
            '99% canxi trong cơ thể nằm ở xương và răng.',
            'Đá vôi, đá phite cẩm thạch, và vỏ sò đều là canxi carbonat.',
            'Pháo hoa màu cam sử dụng hợp chất canxi.'
        ],
        discoveryYear: 1808,
        meltingPoint: 842,
        boilingPoint: 1484,
        density: 1.54,
        state: 'solid', infographicPath: 'element/Calcium.jpeg'
    },
    {
        atomicNumber: 21,
        symbol: 'Sc',
        name: 'Scandi',
        nameEn: 'Scandium',
        atomicMass: 44.956,
        category: 'transition-metal',
        period: 4,
        group: 3,
        electronConfig: '[Ar] 3d¹ 4s²',
        electronShells: [2, 8, 9, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Scandi là kim loại chuyển tiếp nhẹ, hiếm và đắt đỏ. Nó được dùng trong hợp kim nhôm cao cấp cho máy bay và xe đạp đua.',
        facts: [
            'Scandi được đặt tên theo Scandinavia, nơi nó được phát hiện trong quặng.',
            'Gậy bóng chày và khung xe đạp cao cấp dùng hợp kim scandi-nhôm.',
            'Đèn hơi thủy ngân cường độ cao (HMI) trong đèn sân vận động dùng scandi.'
        ],
        discoveryYear: 1879,
        meltingPoint: 1541,
        boilingPoint: 2836,
        density: 2.989,
        state: 'solid', infographicPath: 'element/Scandium.jpeg'
    },
    {
        atomicNumber: 22,
        symbol: 'Ti',
        name: 'Titan',
        nameEn: 'Titanium',
        atomicMass: 47.867,
        category: 'transition-metal',
        period: 4,
        group: 4,
        electronConfig: '[Ar] 3d² 4s²',
        electronShells: [2, 8, 10, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Titan là kim loại có tỷ lệ độ bền/trọng lượng cao nhất, chống ăn mòn tuyệt vời. Nó được dùng trong máy bay, tàu vũ trụ, và cấy ghép y tế.',
        facts: [
            'Titan cứng như thép nhưng nhẹ hơn 45%.',
            'Titan được đặt theo tên các vị thần Titan trong thần thoại Hy Lạp.',
            'Titan dioxide (TiO₂) làm kem chống nắng trắng và sơn trắng.'
        ],
        discoveryYear: 1791,
        meltingPoint: 1668,
        boilingPoint: 3287,
        density: 4.54,
        state: 'solid', infographicPath: 'element/Titanium.jpeg'
    },
    {
        atomicNumber: 23,
        symbol: 'V',
        name: 'Vanadi',
        nameEn: 'Vanadium',
        atomicMass: 50.942,
        category: 'transition-metal',
        period: 4,
        group: 5,
        electronConfig: '[Ar] 3d³ 4s²',
        electronShells: [2, 8, 11, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Vanadi là kim loại chuyển tiếp cứng, màu xám bạc. Nó được thêm vào thép để tăng độ bền và khả năng chịu nhiệt.',
        facts: [
            'Vanadi được đặt theo tên nữ thần sắc đẹp Vanadis (Freya) của Bắc Âu.',
            'Thép vanadi được dùng trong lò xo, bánh răng và dụng cụ cắt.',
            'Hợp chất vanadi có nhiều màu đẹp: xanh, xanh lá, vàng, tím.'
        ],
        discoveryYear: 1801,
        meltingPoint: 1910,
        boilingPoint: 3407,
        density: 6.11,
        state: 'solid', infographicPath: 'element/Vanadium.jpeg'
    },
    {
        atomicNumber: 24,
        symbol: 'Cr',
        name: 'Crom',
        nameEn: 'Chromium',
        atomicMass: 51.996,
        category: 'transition-metal',
        period: 4,
        group: 6,
        electronConfig: '[Ar] 3d⁵ 4s¹',
        electronShells: [2, 8, 13, 1],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Crom là kim loại sáng bóng, cứng, được dùng để mạ kim loại và trong thép không gỉ. Tên của nó có nghĩa là "màu sắc".',
        facts: [
            'Thép không gỉ (inox) chứa ít nhất 10.5% crom.',
            'Ngọc lục bảo có màu xanh là do có crom trong tinh thể.',
            'Mạ crom tạo lớp phủ sáng bóng như gương cho xe hơi và đồ nội thất.'
        ],
        discoveryYear: 1797,
        meltingPoint: 1907,
        boilingPoint: 2671,
        density: 7.15,
        state: 'solid', infographicPath: 'element/Chromium.jpeg'
    },
    {
        atomicNumber: 25,
        symbol: 'Mn',
        name: 'Mangan',
        nameEn: 'Manganese',
        atomicMass: 54.938,
        category: 'transition-metal',
        period: 4,
        group: 7,
        electronConfig: '[Ar] 3d⁵ 4s²',
        electronShells: [2, 8, 13, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Mangan là kim loại cứng, giòn, thiết yếu cho sản xuất thép. Nó cũng là vi chất dinh dưỡng cần thiết cho cơ thể.',
        facts: [
            '90% mangan khai thác được dùng trong sản xuất thép.',
            'Pin kiềm thông thường chứa mangan dioxide.',
            'Mangan giúp cơ thể chuyển hóa các chất dinh dưỡng và hình thành xương.'
        ],
        discoveryYear: 1774,
        meltingPoint: 1246,
        boilingPoint: 2061,
        density: 7.44,
        state: 'solid', infographicPath: 'element/Manganese.jpeg'
    },
    {
        atomicNumber: 26,
        symbol: 'Fe',
        name: 'Sắt',
        nameEn: 'Iron',
        atomicMass: 55.845,
        category: 'transition-metal',
        period: 4,
        group: 8,
        electronConfig: '[Ar] 3d⁶ 4s²',
        electronShells: [2, 8, 14, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Sắt là kim loại phổ biến nhất trên Trái Đất theo khối lượng. Nó là thành phần chính của lõi Trái Đất và máu người.',
        facts: [
            'Lõi Trái Đất chứa đủ sắt để tạo 3 hành tinh cỡ Sao Hỏa.',
            'Hemoglobin trong máu chứa sắt, khiến máu có màu đỏ.',
            'Sắt được tạo ra trong các ngôi sao khổng lồ và siêu tân tinh.'
        ],
        discoveryYear: -5000,
        meltingPoint: 1538,
        boilingPoint: 2862,
        density: 7.874,
        state: 'solid', infographicPath: 'element/Iron.jpeg'
    },
    {
        atomicNumber: 27,
        symbol: 'Co',
        name: 'Coban',
        nameEn: 'Cobalt',
        atomicMass: 58.933,
        category: 'transition-metal',
        period: 4,
        group: 9,
        electronConfig: '[Ar] 3d⁷ 4s²',
        electronShells: [2, 8, 15, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Coban là kim loại màu xám bạc với ánh xanh. Nó được dùng trong hợp kim chịu nhiệt, pin sạc, và tạo màu xanh cobalt.',
        facts: [
            'Màu xanh cobalt đã được dùng từ thời Ai Cập cổ đại.',
            'Coban là thành phần quan trọng của vitamin B12.',
            'Pin lithium-ion cho xe điện và điện thoại chứa coban.'
        ],
        discoveryYear: 1735,
        meltingPoint: 1495,
        boilingPoint: 2927,
        density: 8.86,
        state: 'solid', infographicPath: 'element/Cobalt.jpeg'
    },
    {
        atomicNumber: 28,
        symbol: 'Ni',
        name: 'Niken',
        nameEn: 'Nickel',
        atomicMass: 58.693,
        category: 'transition-metal',
        period: 4,
        group: 10,
        electronConfig: '[Ar] 3d⁸ 4s²',
        electronShells: [2, 8, 16, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Niken là kim loại sáng bóng, chống ăn mòn, được dùng trong đồng xu, thép không gỉ, và mạ điện.',
        facts: [
            'Đồng xu 5 cent Mỹ gọi là "nickel" dù chỉ chứa 25% niken.',
            'Niken từng được gọi là "đồng của quỷ" vì rất khó tinh luyện.',
            'Thiên thạch sắt thường chứa hợp kim sắt-niken.'
        ],
        discoveryYear: 1751,
        meltingPoint: 1455,
        boilingPoint: 2913,
        density: 8.912,
        state: 'solid', infographicPath: 'element/Nickel.jpeg'
    },
    {
        atomicNumber: 29,
        symbol: 'Cu',
        name: 'Đồng',
        nameEn: 'Copper',
        atomicMass: 63.546,
        category: 'transition-metal',
        period: 4,
        group: 11,
        electronConfig: '[Ar] 3d¹⁰ 4s¹',
        electronShells: [2, 8, 18, 1],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Đồng là kim loại màu đỏ cam, dẫn điện và dẫn nhiệt xuất sắc. Nó là một trong những kim loại đầu tiên được con người sử dụng.',
        facts: [
            'Tượng Nữ thần Tự do được bọc 80 tấn đồng.',
            'Đồng có tính kháng khuẩn tự nhiên - vi khuẩn khó sống trên bề mặt đồng.',
            'Dây điện trong nhà bạn hầu hết được làm từ đồng.'
        ],
        discoveryYear: -9000,
        meltingPoint: 1084.62,
        boilingPoint: 2562,
        density: 8.96,
        state: 'solid', infographicPath: 'element/Copper.png'
    },
    {
        atomicNumber: 30,
        symbol: 'Zn',
        name: 'Kẽm',
        nameEn: 'Zinc',
        atomicMass: 65.38,
        category: 'transition-metal',
        period: 4,
        group: 12,
        electronConfig: '[Ar] 3d¹⁰ 4s²',
        electronShells: [2, 8, 18, 2],
        color: '#FFD43B',
        glowColor: '#FFD43B80',
        description: 'Kẽm là kim loại màu xám xanh, được dùng phổ biến trong mạ kẽm (galvanize) chống gỉ và trong hợp kim đồng thau.',
        facts: [
            'Pin kẽm-carbon là loại pin thông thường nhất (pin AA, AAA).',
            'Kẽm rất quan trọng cho hệ miễn dịch và chữa lành vết thương.',
            'Kem chống nắng chứa kẽm oxide tạo lớp chắn vật lý chống UV.'
        ],
        discoveryYear: 1746,
        meltingPoint: 419.53,
        boilingPoint: 907,
        density: 7.134,
        state: 'solid', infographicPath: 'element/Zinc.png'
    },
    // ===== Elements 31-36 (Ga-Kr) =====
    {
        atomicNumber: 31, symbol: 'Ga', name: 'Gali', nameEn: 'Gallium',
        atomicMass: 69.723, category: 'post-transition', period: 4, group: 13,
        electronConfig: '[Ar] 3d¹⁰ 4s² 4p¹', electronShells: [2, 8, 18, 3],
        color: '#69DB7C', glowColor: '#69DB7C80',
        description: 'Gali là kim loại mềm với điểm nóng chảy thấp (29.76°C), có thể tan chảy trong tay.',
        facts: ['Gali tan chảy khi nắm trong tay vì điểm nóng chảy chỉ 29.76°C.', 'Chip LED và điện thoại di động sử dụng gali.', 'Gali không tồn tại tự do trong tự nhiên.'],
        discoveryYear: 1875, meltingPoint: 29.76, boilingPoint: 2204, density: 5.907, state: 'solid', infographicPath: 'element/Gallium.png'
    },
    {
        atomicNumber: 32, symbol: 'Ge', name: 'Gecmani', nameEn: 'Germanium',
        atomicMass: 72.630, category: 'metalloid', period: 4, group: 14,
        electronConfig: '[Ar] 3d¹⁰ 4s² 4p²', electronShells: [2, 8, 18, 4],
        color: '#38D9A9', glowColor: '#38D9A980',
        description: 'Gecmani là á kim quan trọng trong công nghệ bán dẫn. Transistor đầu tiên được làm từ germanium.',
        facts: ['Transistor đầu tiên (1947) được làm từ germanium.', 'Gecmani được đặt tên theo nước Đức.', 'Cáp quang và hệ thống hồng ngoại sử dụng germanium.'],
        discoveryYear: 1886, meltingPoint: 938.25, boilingPoint: 2833, density: 5.323, state: 'solid', infographicPath: 'element/Germanium.png'
    },
    {
        atomicNumber: 33, symbol: 'As', name: 'Asen', nameEn: 'Arsenic',
        atomicMass: 74.922, category: 'metalloid', period: 4, group: 15,
        electronConfig: '[Ar] 3d¹⁰ 4s² 4p³', electronShells: [2, 8, 18, 5],
        color: '#38D9A9', glowColor: '#38D9A980',
        description: 'Asen là á kim nổi tiếng vì độc tính. Trong lịch sử, nó được gọi là "vua của các chất độc".',
        facts: ['Asen từng được dùng làm thuốc độc vì không màu, không mùi, không vị.', 'Màu xanh Paris thời Victoria chứa asen độc.', 'Một lượng nhỏ asen được thêm vào hợp kim chì.'],
        discoveryYear: 1250, meltingPoint: 817, boilingPoint: 614, density: 5.776, state: 'solid', infographicPath: 'element/Arsenic.png'
    },
    {
        atomicNumber: 34, symbol: 'Se', name: 'Selen', nameEn: 'Selenium',
        atomicMass: 78.971, category: 'nonmetal', period: 4, group: 16,
        electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁴', electronShells: [2, 8, 18, 6],
        color: '#4DABF7', glowColor: '#4DABF780',
        description: 'Selen là phi kim có tính dẫn điện thay đổi theo ánh sáng. Nó là vi chất dinh dưỡng thiết yếu.',
        facts: ['Selen được đặt theo tên Mặt Trăng (Selene).', 'Tế bào quang điện đầu tiên sử dụng selen.', 'Dầu gội trị gàu thường chứa selenium sulfide.'],
        discoveryYear: 1817, meltingPoint: 221, boilingPoint: 685, density: 4.809, state: 'solid', infographicPath: 'element/Selenium.png'
    },
    {
        atomicNumber: 35, symbol: 'Br', name: 'Brom', nameEn: 'Bromine',
        atomicMass: 79.904, category: 'halogen', period: 4, group: 17,
        electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵', electronShells: [2, 8, 18, 7],
        color: '#748FFC', glowColor: '#748FFC80',
        description: 'Brom là halogen duy nhất tồn tại dạng lỏng ở nhiệt độ phòng. Nó có màu nâu đỏ và mùi hăng.',
        facts: ['Brom là một trong hai nguyên tố lỏng ở nhiệt độ phòng (cùng với thủy ngân).', 'Tên brom có nghĩa là "hôi thối" trong tiếng Hy Lạp.', 'Chất chống cháy thường chứa brom.'],
        discoveryYear: 1826, meltingPoint: -7.2, boilingPoint: 58.8, density: 3.122, state: 'liquid', infographicPath: 'element/Bromine.png'
    },
    {
        atomicNumber: 36, symbol: 'Kr', name: 'Kripton', nameEn: 'Krypton',
        atomicMass: 83.798, category: 'noble-gas', period: 4, group: 18,
        electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁶', electronShells: [2, 8, 18, 8],
        color: '#DA77F2', glowColor: '#DA77F280',
        description: 'Kripton là khí hiếm không màu, phát sáng trắng khi có điện. Tên của nó có nghĩa là "ẩn giấu".',
        facts: ['Superman yếu đuối trước Kryptonite, nhưng kripton thật hoàn toàn vô hại.', 'Đèn flash máy ảnh tốc độ cao sử dụng khí kripton.', 'Từ 1960-1983, mét được định nghĩa dựa trên bước sóng ánh sáng kripton.'],
        discoveryYear: 1898, meltingPoint: -157.36, boilingPoint: -153.22, density: 0.003733, state: 'gas', infographicPath: 'element/Krypton.png'
    },
    // ===== Period 5 (37-54) =====
    {
        atomicNumber: 37, symbol: 'Rb', name: 'Rubidi', nameEn: 'Rubidium',
        atomicMass: 85.468, category: 'alkali-metal', period: 5, group: 1,
        electronConfig: '[Kr] 5s¹', electronShells: [2, 8, 18, 8, 1],
        color: '#FF6B6B', glowColor: '#FF6B6B80',
        description: 'Rubidi là kim loại kiềm mềm nhất và phản ứng mạnh nhất. Đồng hồ nguyên tử rubidi cực kỳ chính xác.',
        facts: ['Rubidi được đặt tên theo màu đỏ đậm của vạch quang phổ.', 'Đồng hồ nguyên tử rubidi dùng trong GPS.', 'Rubidi bốc cháy ngay khi tiếp xúc không khí ẩm.'],
        discoveryYear: 1861, meltingPoint: 39.31, boilingPoint: 688, density: 1.532, state: 'solid', infographicPath: 'element/Rubidium.png'
    },
    {
        atomicNumber: 38, symbol: 'Sr', name: 'Stronti', nameEn: 'Strontium',
        atomicMass: 87.62, category: 'alkaline-earth', period: 5, group: 2,
        electronConfig: '[Kr] 5s²', electronShells: [2, 8, 18, 8, 2],
        color: '#FFA94D', glowColor: '#FFA94D80',
        description: 'Stronti là kim loại kiềm thổ mềm. Hợp chất của nó tạo màu đỏ tươi trong pháo hoa.',
        facts: ['Pháo hoa màu đỏ sáng sử dụng hợp chất stronti.', 'Strontium-90 là sản phẩm phóng xạ nguy hiểm.', 'Stronti được đặt tên theo làng Strontian ở Scotland.'],
        discoveryYear: 1790, meltingPoint: 777, boilingPoint: 1382, density: 2.64, state: 'solid', infographicPath: 'element/Strontium.png'
    },
    {
        atomicNumber: 39, symbol: 'Y', name: 'Ytri', nameEn: 'Yttrium',
        atomicMass: 88.906, category: 'transition-metal', period: 5, group: 3,
        electronConfig: '[Kr] 4d¹ 5s²', electronShells: [2, 8, 18, 9, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Ytri là kim loại chuyển tiếp màu bạc, được dùng trong LED trắng và laser YAG.',
        facts: ['Ytri được đặt tên theo làng Ytterby ở Thụy Điển.', 'TV màn hình CRT sử dụng ytri để tạo màu đỏ.', 'Laser YAG dùng trong phẫu thuật mắt.'],
        discoveryYear: 1794, meltingPoint: 1526, boilingPoint: 3345, density: 4.469, state: 'solid', infographicPath: 'element/Yttrium.png'
    },
    {
        atomicNumber: 40, symbol: 'Zr', name: 'Zirconi', nameEn: 'Zirconium',
        atomicMass: 91.224, category: 'transition-metal', period: 5, group: 4,
        electronConfig: '[Kr] 4d² 5s²', electronShells: [2, 8, 18, 10, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Zirconi là kim loại sáng bóng, chống ăn mòn, được dùng trong lò phản ứng hạt nhân.',
        facts: ['Cubic zirconia (CZ) là zirconi dioxide - kim cương nhân tạo phổ biến.', 'Vỏ thanh nhiên liệu hạt nhân làm từ hợp kim zirconi.', 'Răng sứ zirconia ngày càng phổ biến.'],
        discoveryYear: 1789, meltingPoint: 1855, boilingPoint: 4409, density: 6.506, state: 'solid', infographicPath: 'element/Zirconium.png'
    },
    {
        atomicNumber: 41, symbol: 'Nb', name: 'Niobi', nameEn: 'Niobium',
        atomicMass: 92.906, category: 'transition-metal', period: 5, group: 5,
        electronConfig: '[Kr] 4d⁴ 5s¹', electronShells: [2, 8, 18, 12, 1],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Niobi là kim loại mềm, dẻo, được dùng trong hợp kim siêu dẫn và thép đặc biệt.',
        facts: ['Niobi được đặt theo Niobe trong thần thoại Hy Lạp.', 'Nam châm MRI chứa hợp kim niobi-titan.', 'Brazil sản xuất khoảng 90% niobi thế giới.'],
        discoveryYear: 1801, meltingPoint: 2477, boilingPoint: 4744, density: 8.57, state: 'solid', infographicPath: 'element/Niobium.png'
    },
    {
        atomicNumber: 42, symbol: 'Mo', name: 'Molypden', nameEn: 'Molybdenum',
        atomicMass: 95.95, category: 'transition-metal', period: 5, group: 6,
        electronConfig: '[Kr] 4d⁵ 5s¹', electronShells: [2, 8, 18, 13, 1],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Molypden là kim loại có điểm nóng chảy rất cao, được dùng trong thép hợp kim.',
        facts: ['Molypden từng bị nhầm với chì.', 'Thép molypden được dùng trong vũ khí và xe bọc thép.', 'Molypden là vi chất quan trọng cho enzyme.'],
        discoveryYear: 1781, meltingPoint: 2623, boilingPoint: 4639, density: 10.22, state: 'solid', infographicPath: 'element/Molybdenum.png'
    },
    {
        atomicNumber: 43, symbol: 'Tc', name: 'Tecneti', nameEn: 'Technetium',
        atomicMass: 98, category: 'transition-metal', period: 5, group: 7,
        electronConfig: '[Kr] 4d⁵ 5s²', electronShells: [2, 8, 18, 13, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Tecneti là nguyên tố nhân tạo đầu tiên. Tất cả các đồng vị đều phóng xạ.',
        facts: ['Tecneti có nghĩa là "nhân tạo" trong tiếng Hy Lạp.', 'Tecneti-99m dùng phổ biến trong chẩn đoán y khoa.', 'Không có tecneti ổn định trong tự nhiên.'],
        discoveryYear: 1937, meltingPoint: 2157, boilingPoint: 4265, density: 11.5, state: 'solid', infographicPath: 'element/Technetium.png'
    },
    {
        atomicNumber: 44, symbol: 'Ru', name: 'Rutheni', nameEn: 'Ruthenium',
        atomicMass: 101.07, category: 'transition-metal', period: 5, group: 8,
        electronConfig: '[Kr] 4d⁷ 5s¹', electronShells: [2, 8, 18, 15, 1],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Rutheni là kim loại nhóm platin, cứng, chống ăn mòn.',
        facts: ['Rutheni được đặt tên theo Ruthenia (tên Latin của Nga).', 'Rutheni được thêm vào platin để tăng độ cứng.', 'Bút Parker "51" sử dụng ngòi bút rutheni.'],
        discoveryYear: 1844, meltingPoint: 2334, boilingPoint: 4150, density: 12.37, state: 'solid', infographicPath: 'element/Ruthenium.png'
    },
    {
        atomicNumber: 45, symbol: 'Rh', name: 'Rhodi', nameEn: 'Rhodium',
        atomicMass: 102.91, category: 'transition-metal', period: 5, group: 9,
        electronConfig: '[Kr] 4d⁸ 5s¹', electronShells: [2, 8, 18, 16, 1],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Rhodi là một trong những kim loại quý hiếm và đắt nhất thế giới.',
        facts: ['Rhodi có thể đắt hơn vàng 5-10 lần.', 'Bộ chuyển đổi xúc tác trong xe hơi chứa rhodi.', 'Rhodi được mạ lên đồ trang sức để tăng độ sáng.'],
        discoveryYear: 1803, meltingPoint: 1964, boilingPoint: 3695, density: 12.41, state: 'solid', infographicPath: 'element/Rhodium.png'
    },
    {
        atomicNumber: 46, symbol: 'Pd', name: 'Paladi', nameEn: 'Palladium',
        atomicMass: 106.42, category: 'transition-metal', period: 5, group: 10,
        electronConfig: '[Kr] 4d¹⁰', electronShells: [2, 8, 18, 18],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Paladi là kim loại nhóm platin, có thể hấp thụ hydro gấp 900 lần thể tích.',
        facts: ['Paladi hấp thụ hydro gấp 900 lần thể tích.', 'Paladi được đặt tên theo tiểu hành tinh Pallas.', 'Nhiều bộ chuyển đổi xúc tác dùng paladi.'],
        discoveryYear: 1803, meltingPoint: 1554.9, boilingPoint: 2963, density: 12.02, state: 'solid', infographicPath: 'element/Palladium.png'
    },
    {
        atomicNumber: 47, symbol: 'Ag', name: 'Bạc', nameEn: 'Silver',
        atomicMass: 107.87, category: 'transition-metal', period: 5, group: 11,
        electronConfig: '[Kr] 4d¹⁰ 5s¹', electronShells: [2, 8, 18, 18, 1],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Bạc là kim loại quý có độ dẫn điện và dẫn nhiệt cao nhất trong tất cả các kim loại.',
        facts: ['Bạc dẫn điện tốt nhất trong tất cả các kim loại.', 'Bạc có tính kháng khuẩn tự nhiên.', 'Phim ảnh truyền thống sử dụng bạc halide.'],
        discoveryYear: -5000, meltingPoint: 961.78, boilingPoint: 2162, density: 10.501, state: 'solid', infographicPath: 'element/Silver.png'
    },
    {
        atomicNumber: 48, symbol: 'Cd', name: 'Cadimi', nameEn: 'Cadmium',
        atomicMass: 112.41, category: 'transition-metal', period: 5, group: 12,
        electronConfig: '[Kr] 4d¹⁰ 5s²', electronShells: [2, 8, 18, 18, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Cadimi là kim loại mềm, màu bạc xanh, độc hại. Nó được dùng trong pin NiCd.',
        facts: ['Pin NiCd từng phổ biến trước pin lithium-ion.', 'Cadimi rất độc và gây bệnh Itai-itai ở Nhật Bản.', 'Màu vàng cadmium được Van Gogh sử dụng.'],
        discoveryYear: 1817, meltingPoint: 321.07, boilingPoint: 767, density: 8.69, state: 'solid', infographicPath: 'element/Cadmium.png'
    },
    {
        atomicNumber: 49, symbol: 'In', name: 'Indi', nameEn: 'Indium',
        atomicMass: 114.82, category: 'post-transition', period: 5, group: 13,
        electronConfig: '[Kr] 4d¹⁰ 5s² 5p¹', electronShells: [2, 8, 18, 18, 3],
        color: '#69DB7C', glowColor: '#69DB7C80',
        description: 'Indi là kim loại mềm, dẻo, được dùng trong màn hình cảm ứng và LCD.',
        facts: ['Indi được đặt tên theo màu chàm (indigo).', 'Màn hình cảm ứng sử dụng indi tin oxide (ITO).', 'Indi mềm có thể để lại vết trên giấy như bút chì.'],
        discoveryYear: 1863, meltingPoint: 156.6, boilingPoint: 2072, density: 7.31, state: 'solid', infographicPath: 'element/Indium.png'
    },
    {
        atomicNumber: 50, symbol: 'Sn', name: 'Thiếc', nameEn: 'Tin',
        atomicMass: 118.71, category: 'post-transition', period: 5, group: 14,
        electronConfig: '[Kr] 4d¹⁰ 5s² 5p²', electronShells: [2, 8, 18, 18, 4],
        color: '#69DB7C', glowColor: '#69DB7C80',
        description: 'Thiếc là kim loại mềm, màu bạc, được dùng từ thời đồ đồng trong hàn và đồ hộp.',
        facts: ['Lon đồ hộp được phủ thiếc để chống gỉ.', 'Hợp kim đồng-thiếc mở ra Thời đại Đồ Đồng.', 'Thiếc tạo "tiếng kêu thiếc" khi bẻ cong.'],
        discoveryYear: -3500, meltingPoint: 231.93, boilingPoint: 2602, density: 7.287, state: 'solid', infographicPath: 'element/Tin.png'
    },
    {
        atomicNumber: 51, symbol: 'Sb', name: 'Antimon', nameEn: 'Antimony',
        atomicMass: 121.76, category: 'metalloid', period: 5, group: 15,
        electronConfig: '[Kr] 4d¹⁰ 5s² 5p³', electronShells: [2, 8, 18, 18, 5],
        color: '#38D9A9', glowColor: '#38D9A980',
        description: 'Antimon là á kim màu bạc, giòn. Nó được dùng trong hợp kim chì và chất chống cháy.',
        facts: ['Phụ nữ Ai Cập cổ đại dùng antimon làm kẻ mắt.', 'Pin axit chì chứa hợp kim chì-antimon.', 'Ký hiệu Sb từ tên Latin Stibium.'],
        discoveryYear: -3000, meltingPoint: 630.63, boilingPoint: 1587, density: 6.685, state: 'solid', infographicPath: 'element/Antimony.png'
    },
    {
        atomicNumber: 52, symbol: 'Te', name: 'Telu', nameEn: 'Tellurium',
        atomicMass: 127.60, category: 'metalloid', period: 5, group: 16,
        electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁴', electronShells: [2, 8, 18, 18, 6],
        color: '#38D9A9', glowColor: '#38D9A980',
        description: 'Telu là á kim hiếm, được đặt tên theo Trái Đất (Tellus). Nó được dùng trong pin mặt trời.',
        facts: ['Telu hiếm hơn vàng trong vỏ Trái Đất.', 'Người tiếp xúc telu thường có hơi thở mùi tỏi.', 'Pin mặt trời cadmium telluride rất phổ biến.'],
        discoveryYear: 1782, meltingPoint: 449.51, boilingPoint: 988, density: 6.232, state: 'solid', infographicPath: 'element/Tellurium.png'
    },
    {
        atomicNumber: 53, symbol: 'I', name: 'Iot', nameEn: 'Iodine',
        atomicMass: 126.90, category: 'halogen', period: 5, group: 17,
        electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', electronShells: [2, 8, 18, 18, 7],
        color: '#748FFC', glowColor: '#748FFC80',
        description: 'Iot là halogen rắn, màu tím đen, bốc hơi thành khí tím. Nó thiết yếu cho tuyến giáp.',
        facts: ['Iot được thêm vào muối ăn để ngăn bệnh bướu cổ.', 'Dung dịch iot (thuốc đỏ) là chất khử trùng phổ biến.', 'Tên iot có nghĩa là "màu tím" trong tiếng Hy Lạp.'],
        discoveryYear: 1811, meltingPoint: 113.7, boilingPoint: 184.3, density: 4.93, state: 'solid', infographicPath: 'element/Iodine.png'
    },
    {
        atomicNumber: 54, symbol: 'Xe', name: 'Xenon', nameEn: 'Xenon',
        atomicMass: 131.29, category: 'noble-gas', period: 5, group: 18,
        electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁶', electronShells: [2, 8, 18, 18, 8],
        color: '#DA77F2', glowColor: '#DA77F280',
        description: 'Xenon là khí hiếm nặng, phát sáng xanh dương khi có điện. Nó được dùng trong đèn pha xe hơi.',
        facts: ['Xenon có nghĩa là "xa lạ" trong tiếng Hy Lạp.', 'Đèn pha HID (xenon) sáng hơn đèn halogen.', 'Xenon được dùng làm thuốc gây mê an toàn.'],
        discoveryYear: 1898, meltingPoint: -111.75, boilingPoint: -108.12, density: 0.005887, state: 'gas', infographicPath: 'element/Xenon.png'
    },
    // ===== Period 6 (55-86) =====
    {
        atomicNumber: 55, symbol: 'Cs', name: 'Xesi', nameEn: 'Cesium',
        atomicMass: 132.91, category: 'alkali-metal', period: 6, group: 1,
        electronConfig: '[Xe] 6s¹', electronShells: [2, 8, 18, 18, 8, 1],
        color: '#FF6B6B', glowColor: '#FF6B6B80',
        description: 'Xesi là kim loại kiềm mềm nhất, phản ứng mãnh liệt. Đồng hồ nguyên tử xesi định nghĩa giây.',
        facts: ['Giây được định nghĩa dựa trên dao động của nguyên tử xesi-133.', 'Xesi phản ứng mãnh liệt với nước, thậm chí với băng đá.', 'Xesi có điểm nóng chảy 28°C, gần tan trong tay.'],
        discoveryYear: 1860, meltingPoint: 28.44, boilingPoint: 671, density: 1.873, state: 'solid', infographicPath: 'element/Cesium.png'
    },
    {
        atomicNumber: 56, symbol: 'Ba', name: 'Bari', nameEn: 'Barium',
        atomicMass: 137.33, category: 'alkaline-earth', period: 6, group: 2,
        electronConfig: '[Xe] 6s²', electronShells: [2, 8, 18, 18, 8, 2],
        color: '#FFA94D', glowColor: '#FFA94D80',
        description: 'Bari là kim loại kiềm thổ mềm. Bari sulfat dùng trong chụp X-quang đường tiêu hóa.',
        facts: ['Tên bari có nghĩa là "nặng" trong tiếng Hy Lạp.', 'Bệnh nhân phải uống "bữa ăn bari" để chụp X-quang dạ dày.', 'Pháo hoa màu xanh lá sáng sử dụng hợp chất bari.'],
        discoveryYear: 1808, meltingPoint: 727, boilingPoint: 1845, density: 3.594, state: 'solid', infographicPath: 'element/Barium.png'
    },
    // Lanthanides (57-71)
    {
        atomicNumber: 57, symbol: 'La', name: 'Lantan', nameEn: 'Lanthanum',
        atomicMass: 138.91, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 5d¹ 6s²', electronShells: [2, 8, 18, 18, 9, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Lantan là nguyên tố đầu tiên của nhóm đất hiếm. Nó được dùng trong pin NiMH và thấu kính máy ảnh.',
        facts: ['Tên lantan có nghĩa là "ẩn giấu" vì khó tách biệt.', 'Pin NiMH trong xe hybrid chứa hợp kim lantan.', 'Thấu kính máy ảnh cao cấp sử dụng thủy tinh lantan.'],
        discoveryYear: 1839, meltingPoint: 920, boilingPoint: 3464, density: 6.145, state: 'solid', infographicPath: 'element/Lanthanum.png'
    },
    {
        atomicNumber: 58, symbol: 'Ce', name: 'Xeri', nameEn: 'Cerium',
        atomicMass: 140.12, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f¹ 5d¹ 6s²', electronShells: [2, 8, 18, 19, 9, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Xeri là nguyên tố đất hiếm phổ biến nhất, dùng trong bộ chuyển đổi xúc tác và đá lửa bật lửa.',
        facts: ['Xeri được đặt tên theo tiểu hành tinh Ceres.', 'Đá lửa bật lửa (ferrocerium) chứa xeri.', 'Xeri oxide được dùng để đánh bóng thủy tinh và gương.'],
        discoveryYear: 1803, meltingPoint: 799, boilingPoint: 3443, density: 6.77, state: 'solid', infographicPath: 'element/Cerium.png'
    },
    {
        atomicNumber: 59, symbol: 'Pr', name: 'Praseodymi', nameEn: 'Praseodymium',
        atomicMass: 140.91, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f³ 6s²', electronShells: [2, 8, 18, 21, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Praseodymi là nguyên tố đất hiếm màu vàng lục, dùng trong nam châm và kính thợ hàn.',
        facts: ['Tên có nghĩa là "sinh đôi xanh lá" trong tiếng Hy Lạp.', 'Nam châm neodymium-praseodymium là nam châm vĩnh cửu mạnh nhất.', 'Kính thợ hàn sử dụng praseodymi để lọc tia UV.'],
        discoveryYear: 1885, meltingPoint: 931, boilingPoint: 3520, density: 6.773, state: 'solid', infographicPath: 'element/Praseodymium.png'
    },
    {
        atomicNumber: 60, symbol: 'Nd', name: 'Neodymi', nameEn: 'Neodymium',
        atomicMass: 144.24, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f⁴ 6s²', electronShells: [2, 8, 18, 22, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Neodymi tạo ra nam châm vĩnh cửu mạnh nhất thế giới, có trong ổ cứng, tai nghe và động cơ điện.',
        facts: ['Nam châm neodymium mạnh có thể gây thương tích nếu bất cẩn.', 'Mỗi động cơ xe điện Tesla chứa 1-2 kg neodymium.', 'Laser neodymium được dùng trong phẫu thuật và công nghiệp.'],
        discoveryYear: 1885, meltingPoint: 1024, boilingPoint: 3074, density: 7.007, state: 'solid', infographicPath: 'element/Neodymium.jpeg'
    },
    {
        atomicNumber: 61, symbol: 'Pm', name: 'Prometi', nameEn: 'Promethium',
        atomicMass: 145, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f⁵ 6s²', electronShells: [2, 8, 18, 23, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Prometi là nguyên tố đất hiếm duy nhất không có đồng vị ổn định. Nó phóng xạ và hiếm.',
        facts: ['Prometi được đặt theo thần Prometheus đã mang lửa cho loài người.', 'Prometi từng dùng trong sơn phát sáng của kim đồng hồ.', 'Tất cả prometi đều phóng xạ, chỉ được tạo trong lò phản ứng.'],
        discoveryYear: 1945, meltingPoint: 1042, boilingPoint: 3000, density: 7.26, state: 'solid', infographicPath: 'element/Promethium.jpeg'
    },
    {
        atomicNumber: 62, symbol: 'Sm', name: 'Samari', nameEn: 'Samarium',
        atomicMass: 150.36, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f⁶ 6s²', electronShells: [2, 8, 18, 24, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Samari được dùng trong nam châm samaria-coban chịu nhiệt cao, dùng trong hàng không vũ trụ.',
        facts: ['Samari được đặt tên theo khoáng vật samarskite.', 'Nam châm samari-coban chịu được nhiệt độ cao hơn neodymium.', 'Samari-153 được dùng điều trị đau xương do ung thư.'],
        discoveryYear: 1879, meltingPoint: 1072, boilingPoint: 1900, density: 7.52, state: 'solid', infographicPath: 'element/Samarium.jpeg'
    },
    {
        atomicNumber: 63, symbol: 'Eu', name: 'Europi', nameEn: 'Europium',
        atomicMass: 151.96, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f⁷ 6s²', electronShells: [2, 8, 18, 25, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Europi là nguyên tố đất hiếm phản ứng mạnh nhất, dùng tạo màu đỏ trong TV và tiền giấy chống giả.',
        facts: ['Europi được đặt tên theo châu Âu.', 'Tiền Euro và USD có sợi phát sáng chứa europi.', 'TV CRT và LED sử dụng europi để tạo màu đỏ.'],
        discoveryYear: 1901, meltingPoint: 822, boilingPoint: 1529, density: 5.243, state: 'solid', infographicPath: 'element/Europium.jpeg'
    },
    {
        atomicNumber: 64, symbol: 'Gd', name: 'Gadolini', nameEn: 'Gadolinium',
        atomicMass: 157.25, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f⁷ 5d¹ 6s²', electronShells: [2, 8, 18, 25, 9, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Gadolini có từ tính mạnh, được dùng làm chất cản quang MRI và trong lò phản ứng hạt nhân.',
        facts: ['Gadolini được đặt theo nhà hóa học Johan Gadolin.', 'Chất cản quang MRI thường chứa gadolini.', 'Gadolini có khả năng hấp thụ neutron cao, dùng trong lò phản ứng.'],
        discoveryYear: 1880, meltingPoint: 1313, boilingPoint: 3273, density: 7.895, state: 'solid', infographicPath: 'element/Gadolinium.jpeg'
    },
    {
        atomicNumber: 65, symbol: 'Tb', name: 'Terbi', nameEn: 'Terbium',
        atomicMass: 158.93, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f⁹ 6s²', electronShells: [2, 8, 18, 27, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Terbi được dùng trong phosphor xanh lá cho đèn huỳnh quang và màn hình.',
        facts: ['Terbi được đặt tên theo làng Ytterby ở Thụy Điển.', 'Terbi tạo màu xanh lá trong đèn huỳnh quang compact.', 'Hợp kim terbi-sắt co giãn mạnh trong từ trường.'],
        discoveryYear: 1843, meltingPoint: 1356, boilingPoint: 3230, density: 8.229, state: 'solid', infographicPath: 'element/Terbium.jpeg'
    },
    {
        atomicNumber: 66, symbol: 'Dy', name: 'Dysprosi', nameEn: 'Dysprosium',
        atomicMass: 162.50, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f¹⁰ 6s²', electronShells: [2, 8, 18, 28, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Dysprosi được thêm vào nam châm neodymium để hoạt động ở nhiệt độ cao hơn.',
        facts: ['Tên có nghĩa là "khó tiếp cận" trong tiếng Hy Lạp.', 'Dysprosi giúp nam châm neodymium chịu nhiệt tốt hơn.', 'Đèn halogen kim loại-halide sử dụng dysprosi.'],
        discoveryYear: 1886, meltingPoint: 1412, boilingPoint: 2567, density: 8.55, state: 'solid', infographicPath: 'element/Dysprosium.jpeg'
    },
    {
        atomicNumber: 67, symbol: 'Ho', name: 'Holmi', nameEn: 'Holmium',
        atomicMass: 164.93, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f¹¹ 6s²', electronShells: [2, 8, 18, 29, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Holmi có từ tính mạnh nhất trong các nguyên tố tự nhiên, dùng trong nam châm và laser y tế.',
        facts: ['Holmi được đặt tên theo Stockholm (Holmia).', 'Holmi có mômen từ cao nhất trong các nguyên tố.', 'Laser holmi dùng trong phẫu thuật mắt và tán sỏi.'],
        discoveryYear: 1878, meltingPoint: 1474, boilingPoint: 2700, density: 8.795, state: 'solid', infographicPath: 'element/Holmium.jpeg'
    },
    {
        atomicNumber: 68, symbol: 'Er', name: 'Erbi', nameEn: 'Erbium',
        atomicMass: 167.26, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f¹² 6s²', electronShells: [2, 8, 18, 30, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Erbi được dùng trong bộ khuếch đại cáp quang và laser thẩm mỹ.',
        facts: ['Erbi được đặt tên theo làng Ytterby.', 'Bộ khuếch đại cáp quang internet dùng erbi.', 'Laser erbi dùng trong điều trị da liễu và nha khoa.'],
        discoveryYear: 1843, meltingPoint: 1529, boilingPoint: 2868, density: 9.066, state: 'solid', infographicPath: 'element/Erbium.jpeg'
    },
    {
        atomicNumber: 69, symbol: 'Tm', name: 'Tuli', nameEn: 'Thulium',
        atomicMass: 168.93, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f¹³ 6s²', electronShells: [2, 8, 18, 31, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Tuli là một trong những nguyên tố đất hiếm hiếm nhất, dùng trong thiết bị X-quang di động.',
        facts: ['Tuli được đặt theo Thule, tên cổ của Scandinavia.', 'Tuli-170 dùng trong thiết bị X-quang di động.', 'Tuli là nguyên tố đất hiếm ít phổ biến thứ hai.'],
        discoveryYear: 1879, meltingPoint: 1545, boilingPoint: 1950, density: 9.321, state: 'solid', infographicPath: 'element/Thulium.jpeg'
    },
    {
        atomicNumber: 70, symbol: 'Yb', name: 'Ytterbi', nameEn: 'Ytterbium',
        atomicMass: 173.05, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f¹⁴ 6s²', electronShells: [2, 8, 18, 32, 8, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Ytterbi được dùng trong thép không gỉ, laser và đồng hồ nguyên tử.',
        facts: ['Ytterbi là nguyên tố thứ tư được đặt tên theo làng Ytterby.', 'Đồng hồ nguyên tử ytterbi chính xác gấp 100 lần đồng hồ xesi.', 'Ytterbi được thêm vào thép không gỉ để tăng độ bền.'],
        discoveryYear: 1878, meltingPoint: 824, boilingPoint: 1196, density: 6.965, state: 'solid', infographicPath: 'element/Ytterbium.jpeg'
    },
    {
        atomicNumber: 71, symbol: 'Lu', name: 'Luteti', nameEn: 'Lutetium',
        atomicMass: 174.97, category: 'lanthanide', period: 6, group: 0,
        electronConfig: '[Xe] 4f¹⁴ 5d¹ 6s²', electronShells: [2, 8, 18, 32, 9, 2],
        color: '#F783AC', glowColor: '#F783AC80',
        description: 'Luteti là nguyên tố đất hiếm cuối cùng, đắt nhất và cứng nhất, dùng trong PET scan.',
        facts: ['Luteti được đặt theo Lutetia, tên Latin của Paris.', 'Luteti-177 được dùng điều trị ung thư tuyến tiền liệt.', 'Luteti được dùng trong máy quét PET.'],
        discoveryYear: 1907, meltingPoint: 1663, boilingPoint: 3402, density: 9.84, state: 'solid', infographicPath: 'element/Lutetium.jpeg'
    },
    // Continue Period 6 (72-86)
    {
        atomicNumber: 72, symbol: 'Hf', name: 'Hafni', nameEn: 'Hafnium',
        atomicMass: 178.49, category: 'transition-metal', period: 6, group: 4,
        electronConfig: '[Xe] 4f¹⁴ 5d² 6s²', electronShells: [2, 8, 18, 32, 10, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Hafni là kim loại chuyển tiếp chịu nhiệt cao, dùng trong thanh điều khiển lò hạt nhân và chip.',
        facts: ['Hafni được đặt tên theo Copenhagen (Hafnia).', 'Thanh điều khiển lò hạt nhân dùng hafni vì hấp thụ neutron tốt.', 'Chip Intel 45nm sử dụng hafni dioxide.'],
        discoveryYear: 1923, meltingPoint: 2233, boilingPoint: 4603, density: 13.31, state: 'solid', infographicPath: 'element/Hafnium.png'
    },
    {
        atomicNumber: 73, symbol: 'Ta', name: 'Tantali', nameEn: 'Tantalum',
        atomicMass: 180.95, category: 'transition-metal', period: 6, group: 5,
        electronConfig: '[Xe] 4f¹⁴ 5d³ 6s²', electronShells: [2, 8, 18, 32, 11, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Tantali là kim loại rất cứng, chống ăn mòn, dùng trong tụ điện và cấy ghép y tế.',
        facts: ['Tantali được đặt theo vua Tantalus trong thần thoại.', 'Điện thoại thông minh chứa tụ tantali.', 'Tantali không gây dị ứng, lý tưởng cho cấy ghép.'],
        discoveryYear: 1802, meltingPoint: 3017, boilingPoint: 5458, density: 16.654, state: 'solid', infographicPath: 'element/Tantalum.png'
    },
    {
        atomicNumber: 74, symbol: 'W', name: 'Vonfram', nameEn: 'Tungsten',
        atomicMass: 183.84, category: 'transition-metal', period: 6, group: 6,
        electronConfig: '[Xe] 4f¹⁴ 5d⁴ 6s²', electronShells: [2, 8, 18, 32, 12, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Vonfram (Wolfram) có điểm nóng chảy cao nhất (3422°C) trong tất cả kim loại.',
        facts: ['Dây tóc bóng đèn sợi đốt làm từ vonfram.', 'Ký hiệu W từ tên Wolfram trong tiếng Đức.', 'Mũi khoan cứng nhất dùng hợp kim vonfram carbide.'],
        discoveryYear: 1783, meltingPoint: 3422, boilingPoint: 5555, density: 19.25, state: 'solid', infographicPath: 'element/Tungsten.png'
    },
    {
        atomicNumber: 75, symbol: 'Re', name: 'Rheni', nameEn: 'Rhenium',
        atomicMass: 186.21, category: 'transition-metal', period: 6, group: 7,
        electronConfig: '[Xe] 4f¹⁴ 5d⁵ 6s²', electronShells: [2, 8, 18, 32, 13, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Rheni là một trong những nguyên tố hiếm nhất, dùng trong động cơ phản lực siêu nhiệt.',
        facts: ['Rheni được đặt tên theo sông Rhine.', 'Rheni là nguyên tố ổn định cuối cùng được phát hiện (1925).', 'Cánh tuabin động cơ phản lực dùng hợp kim rheni-niken.'],
        discoveryYear: 1925, meltingPoint: 3186, boilingPoint: 5596, density: 21.02, state: 'solid', infographicPath: 'element/Rhenium.png'
    },
    {
        atomicNumber: 76, symbol: 'Os', name: 'Osmi', nameEn: 'Osmium',
        atomicMass: 190.23, category: 'transition-metal', period: 6, group: 8,
        electronConfig: '[Xe] 4f¹⁴ 5d⁶ 6s²', electronShells: [2, 8, 18, 32, 14, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Osmi là nguyên tố đặc nhất trong tự nhiên (22.59 g/cm³), dùng trong đầu bút máy.',
        facts: ['Osmi đặc hơn mọi nguyên tố khác.', 'Tên osmi có nghĩa là "mùi" vì oxide của nó có mùi hăng.', 'Ngòi bút máy cao cấp sử dụng hợp kim osmi-iridi.'],
        discoveryYear: 1803, meltingPoint: 3033, boilingPoint: 5012, density: 22.59, state: 'solid', infographicPath: 'element/Osmium.png'
    },
    {
        atomicNumber: 77, symbol: 'Ir', name: 'Iridi', nameEn: 'Iridium',
        atomicMass: 192.22, category: 'transition-metal', period: 6, group: 9,
        electronConfig: '[Xe] 4f¹⁴ 5d⁷ 6s²', electronShells: [2, 8, 18, 32, 15, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Iridi là kim loại chống ăn mòn nhất, dùng trong bugi và bằng chứng tiểu hành tinh hủy diệt khủng long.',
        facts: ['Lớp iridi 66 triệu năm tuổi là bằng chứng tiểu hành tinh diệt khủng long.', 'Bugi iridi bền hơn bugi platin.', 'Kilogram nguyên bản được làm từ hợp kim platin-iridi.'],
        discoveryYear: 1803, meltingPoint: 2446, boilingPoint: 4428, density: 22.56, state: 'solid', infographicPath: 'element/Iridium.png'
    },
    {
        atomicNumber: 78, symbol: 'Pt', name: 'Platin', nameEn: 'Platinum',
        atomicMass: 195.08, category: 'transition-metal', period: 6, group: 10,
        electronConfig: '[Xe] 4f¹⁴ 5d⁹ 6s¹', electronShells: [2, 8, 18, 32, 17, 1],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Platin là kim loại quý đắt tiền, dùng trong trang sức, xúc tác và điều trị ung thư.',
        facts: ['Platin hiếm gấp 30 lần vàng.', 'Bộ chuyển đổi xúc tác ô tô chứa platin, paladi hoặc rhodi.', 'Cisplatin (hợp chất platin) là thuốc hóa trị liệu ung thư.'],
        discoveryYear: 1735, meltingPoint: 1768.3, boilingPoint: 3825, density: 21.45, state: 'solid', infographicPath: 'element/Platinum.png'
    },
    {
        atomicNumber: 79, symbol: 'Au', name: 'Vàng', nameEn: 'Gold',
        atomicMass: 196.97, category: 'transition-metal', period: 6, group: 11,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronShells: [2, 8, 18, 32, 18, 1],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Vàng là kim loại quý không bị oxy hóa, màu vàng đặc trưng, dùng trong trang sức và điện tử.',
        facts: ['Tất cả vàng trên Trái Đất đến từ va chạm sao neutron.', 'Vàng dẻo đến mức 1 gram có thể dát thành 1 m².', 'iPhone chứa khoảng 0.034 gram vàng.'],
        discoveryYear: -6000, meltingPoint: 1064.18, boilingPoint: 2856, density: 19.282, state: 'solid', infographicPath: 'element/Gold.png'
    },
    {
        atomicNumber: 80, symbol: 'Hg', name: 'Thủy ngân', nameEn: 'Mercury',
        atomicMass: 200.59, category: 'transition-metal', period: 6, group: 12,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronShells: [2, 8, 18, 32, 18, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Thủy ngân là kim loại duy nhất ở thể lỏng ở nhiệt độ phòng. Nó độc nhưng từng dùng rộng rãi.',
        facts: ['Thủy ngân là kim loại duy nhất lỏng ở nhiệt độ phòng.', 'Nhiệt kế thủy ngân đang bị loại bỏ vì độc hại.', 'Tên Mercury đặt theo thần Hermes vì nó "chạy" nhanh.'],
        discoveryYear: -1500, meltingPoint: -38.83, boilingPoint: 356.73, density: 13.534, state: 'liquid', infographicPath: 'element/Mercury.png'
    },
    {
        atomicNumber: 81, symbol: 'Tl', name: 'Tali', nameEn: 'Thallium',
        atomicMass: 204.38, category: 'post-transition', period: 6, group: 13,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', electronShells: [2, 8, 18, 32, 18, 3],
        color: '#69DB7C', glowColor: '#69DB7C80',
        description: 'Tali là kim loại mềm, độc, từng được dùng làm thuốc chuột và thuốc độc hoàn hảo.',
        facts: ['Tali từng được gọi là "thuốc độc hoàn hảo" vì không mùi vị.', 'Tali được đặt tên theo vạch xanh lá (thallos) trong quang phổ.', 'Tali-201 dùng trong chẩn đoán tim mạch.'],
        discoveryYear: 1861, meltingPoint: 304, boilingPoint: 1473, density: 11.85, state: 'solid', infographicPath: 'element/Thallium.png'
    },
    {
        atomicNumber: 82, symbol: 'Pb', name: 'Chì', nameEn: 'Lead',
        atomicMass: 207.2, category: 'post-transition', period: 6, group: 14,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', electronShells: [2, 8, 18, 32, 18, 4],
        color: '#69DB7C', glowColor: '#69DB7C80',
        description: 'Chì là kim loại nặng, mềm, độc, từng dùng rộng rãi nhưng nay bị hạn chế vì gây hại.',
        facts: ['Người La Mã dùng ống nước chì, có thể góp phần suy yếu đế chế.', 'Xăng pha chì bị cấm vì gây ngộ độc não.', 'Chì vẫn dùng trong tấm chắn X-quang và pin axit.'],
        discoveryYear: -7000, meltingPoint: 327.46, boilingPoint: 1749, density: 11.342, state: 'solid', infographicPath: 'element/Lead.png'
    },
    {
        atomicNumber: 83, symbol: 'Bi', name: 'Bitmut', nameEn: 'Bismuth',
        atomicMass: 208.98, category: 'post-transition', period: 6, group: 15,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', electronShells: [2, 8, 18, 32, 18, 5],
        color: '#69DB7C', glowColor: '#69DB7C80',
        description: 'Bitmut tạo tinh thể cầu vồng tuyệt đẹp và là nguyên tố nặng nhất không phóng xạ đáng kể.',
        facts: ['Tinh thể bitmut có màu cầu vồng do lớp oxide bề mặt.', 'Pepto-Bismol (thuốc dạ dày) chứa bismuth subsalicylate.', 'Bitmut nở ra khi đông đặc, giống nước.'],
        discoveryYear: 1753, meltingPoint: 271.5, boilingPoint: 1564, density: 9.807, state: 'solid', infographicPath: 'element/Bismuth.png'
    },
    {
        atomicNumber: 84, symbol: 'Po', name: 'Poloni', nameEn: 'Polonium',
        atomicMass: 209, category: 'metalloid', period: 6, group: 16,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', electronShells: [2, 8, 18, 32, 18, 6],
        color: '#38D9A9', glowColor: '#38D9A980',
        description: 'Poloni là nguyên tố phóng xạ cực độc do Marie Curie phát hiện, đặt tên theo quê hương Ba Lan.',
        facts: ['Marie Curie đặt tên poloni theo quê hương Ba Lan.', 'Poloni-210 được dùng đầu độc cựu điệp viên Litvinenko 2006.', 'Poloni phát ra nhiệt lượng lớn, từng nghiên cứu cho vệ tinh.'],
        discoveryYear: 1898, meltingPoint: 254, boilingPoint: 962, density: 9.32, state: 'solid', infographicPath: 'element/Polonium.png'
    },
    {
        atomicNumber: 85, symbol: 'At', name: 'Astatin', nameEn: 'Astatine',
        atomicMass: 210, category: 'halogen', period: 6, group: 17,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', electronShells: [2, 8, 18, 32, 18, 7],
        color: '#748FFC', glowColor: '#748FFC80',
        description: 'Astatin là nguyên tố tự nhiên hiếm nhất trên Trái Đất, tại một thời điểm chỉ có < 1 gram.',
        facts: ['Tên astatin có nghĩa là "không ổn định".', 'Chỉ có dưới 30 gram astatin trong toàn bộ vỏ Trái Đất.', 'Astatin-211 đang được nghiên cứu điều trị ung thư.'],
        discoveryYear: 1940, meltingPoint: 302, boilingPoint: 337, density: 7, state: 'solid', infographicPath: 'element/Astatine.png'
    },
    {
        atomicNumber: 86, symbol: 'Rn', name: 'Radon', nameEn: 'Radon',
        atomicMass: 222, category: 'noble-gas', period: 6, group: 18,
        electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', electronShells: [2, 8, 18, 32, 18, 8],
        color: '#DA77F2', glowColor: '#DA77F280',
        description: 'Radon là khí hiếm phóng xạ không màu, không mùi, nguyên nhân số 2 gây ung thư phổi sau hút thuốc.',
        facts: ['Radon là nguyên nhân ung thư phổi thứ hai sau hút thuốc.', 'Radon tích tụ trong tầng hầm nhà ở.', 'Radon từng dùng trong spa "chữa bệnh" thời xưa.'],
        discoveryYear: 1900, meltingPoint: -71, boilingPoint: -61.7, density: 0.00973, state: 'gas', infographicPath: 'element/Radon.png'
    },
    // ===== Period 7 (87-118) =====
    {
        atomicNumber: 87, symbol: 'Fr', name: 'Franxi', nameEn: 'Francium',
        atomicMass: 223, category: 'alkali-metal', period: 7, group: 1,
        electronConfig: '[Rn] 7s¹', electronShells: [2, 8, 18, 32, 18, 8, 1],
        color: '#FF6B6B', glowColor: '#FF6B6B80',
        description: 'Franxi là kim loại kiềm hiếm và phóng xạ nhất, chỉ tồn tại vài giây trước khi phân rã.',
        facts: ['Franxi được đặt tên theo nước Pháp.', 'Tại bất kỳ thời điểm nào chỉ có khoảng 30 gram franxi trên Trái Đất.', 'Franxi-223 có chu kỳ bán rã chỉ 22 phút.'],
        discoveryYear: 1939, meltingPoint: 27, boilingPoint: 677, density: 1.87, state: 'solid', infographicPath: 'element/Francium.png'
    },
    {
        atomicNumber: 88, symbol: 'Ra', name: 'Radi', nameEn: 'Radium',
        atomicMass: 226, category: 'alkaline-earth', period: 7, group: 2,
        electronConfig: '[Rn] 7s²', electronShells: [2, 8, 18, 32, 18, 8, 2],
        color: '#FFA94D', glowColor: '#FFA94D80',
        description: 'Radi là nguyên tố phóng xạ phát sáng xanh, do vợ chồng Curie phát hiện.',
        facts: ['Radi phát sáng xanh nhạt trong bóng tối.', 'Marie Curie chết vì phơi nhiễm radi.', 'Radi từng dùng trong sơn phát sáng đồng hồ, gây chết nhiều công nhân.'],
        discoveryYear: 1898, meltingPoint: 696, boilingPoint: 1737, density: 5.5, state: 'solid', infographicPath: 'element/Radium.png'
    },
    // Actinides (89-103)
    {
        atomicNumber: 89, symbol: 'Ac', name: 'Actini', nameEn: 'Actinium',
        atomicMass: 227, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 6d¹ 7s²', electronShells: [2, 8, 18, 32, 18, 9, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Actini là nguyên tố đầu tiên của nhóm actinide, phát sáng xanh do phóng xạ.',
        facts: ['Actini phát sáng xanh trong bóng tối.', 'Actini-225 đang được nghiên cứu điều trị ung thư.', 'Actini hiếm đến mức 1 tấn quặng uranium chỉ chứa 0.2 mg.'],
        discoveryYear: 1899, meltingPoint: 1050, boilingPoint: 3200, density: 10.07, state: 'solid', infographicPath: 'element/Actinium.jpeg'
    },
    {
        atomicNumber: 90, symbol: 'Th', name: 'Thori', nameEn: 'Thorium',
        atomicMass: 232.04, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 6d² 7s²', electronShells: [2, 8, 18, 32, 18, 10, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Thori là nguyên tố phóng xạ phổ biến, đang được nghiên cứu làm nhiên liệu hạt nhân thay thế uranium.',
        facts: ['Thori được đặt theo thần Thor của Bắc Âu.', 'Lò phản ứng thori an toàn hơn và ít chất thải hơn uranium.', 'Thori phổ biến hơn uranium 3-4 lần trong vỏ Trái Đất.'],
        discoveryYear: 1829, meltingPoint: 1750, boilingPoint: 4788, density: 11.72, state: 'solid', infographicPath: 'element/Thorium.jpeg'
    },
    {
        atomicNumber: 91, symbol: 'Pa', name: 'Protactini', nameEn: 'Protactinium',
        atomicMass: 231.04, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f² 6d¹ 7s²', electronShells: [2, 8, 18, 32, 20, 9, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Protactini là nguyên tố actinide hiếm, độc và phóng xạ cao.',
        facts: ['Tên có nghĩa là "cha của actini" vì phân rã thành actini.', 'Protactini là một trong những nguyên tố độc nhất.', 'Rất ít protactini tồn tại - khoảng 1-2 kg được tách ra từ trước đến nay.'],
        discoveryYear: 1913, meltingPoint: 1572, boilingPoint: 4000, density: 15.37, state: 'solid', infographicPath: 'element/Protactinium.jpeg'
    },
    {
        atomicNumber: 92, symbol: 'U', name: 'Urani', nameEn: 'Uranium',
        atomicMass: 238.03, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f³ 6d¹ 7s²', electronShells: [2, 8, 18, 32, 21, 9, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Urani là nhiên liệu chính cho lò phản ứng hạt nhân và bom nguyên tử.',
        facts: ['Uranium-235 là đồng vị dùng trong lò phản ứng và bom hạt nhân.', 'Urani được đặt tên theo hành tinh Uranus.', '1 kg uranium chứa năng lượng tương đương 3 triệu kg than.'],
        discoveryYear: 1789, meltingPoint: 1135, boilingPoint: 4131, density: 18.95, state: 'solid', infographicPath: 'element/Uranium.jpeg'
    },
    {
        atomicNumber: 93, symbol: 'Np', name: 'Neptuni', nameEn: 'Neptunium',
        atomicMass: 237, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f⁴ 6d¹ 7s²', electronShells: [2, 8, 18, 32, 22, 9, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Neptuni là nguyên tố siêu urani đầu tiên được tổng hợp, đặt tên theo sao Hải Vương.',
        facts: ['Neptuni được đặt tên theo sao Hải Vương (Neptune).', 'Neptuni là sản phẩm phụ trong lò phản ứng hạt nhân.', 'Neptuni-237 có chu kỳ bán rã 2.14 triệu năm.'],
        discoveryYear: 1940, meltingPoint: 644, boilingPoint: 3902, density: 20.25, state: 'solid', infographicPath: 'element/Neptunium.jpeg'
    },
    {
        atomicNumber: 94, symbol: 'Pu', name: 'Plutoni', nameEn: 'Plutonium',
        atomicMass: 244, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f⁶ 7s²', electronShells: [2, 8, 18, 32, 24, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Plutoni là nguyên tố dùng trong bom nguyên tử và lò phản ứng, cực kỳ độc.',
        facts: ['Bom nguyên tử thả xuống Nagasaki dùng plutoni.', 'Plutoni-238 cấp năng lượng cho tàu Voyager đã bay 40+ năm.', 'Plutoni tự nóng lên vì phóng xạ - 1 kg plutoni ấm khi cầm.'],
        discoveryYear: 1940, meltingPoint: 640, boilingPoint: 3228, density: 19.84, state: 'solid', infographicPath: 'element/Plutonium.jpeg'
    },
    {
        atomicNumber: 95, symbol: 'Am', name: 'Americi', nameEn: 'Americium',
        atomicMass: 243, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f⁷ 7s²', electronShells: [2, 8, 18, 32, 25, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Americi được dùng trong đầu báo khói gia đình, là nguyên tố nhân tạo phổ biến nhất.',
        facts: ['Hầu hết đầu báo khói chứa americi-241.', 'Americi được đặt tên theo châu Mỹ.', 'Americi được tạo ra trong Manhattan Project thời WWII.'],
        discoveryYear: 1944, meltingPoint: 1176, boilingPoint: 2011, density: 13.69, state: 'solid', infographicPath: 'element/Americium.jpeg'
    },
    {
        atomicNumber: 96, symbol: 'Cm', name: 'Curi', nameEn: 'Curium',
        atomicMass: 247, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f⁷ 6d¹ 7s²', electronShells: [2, 8, 18, 32, 25, 9, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Curi được đặt tên theo vợ chồng Marie và Pierre Curie, phát sáng đỏ trong bóng tối.',
        facts: ['Curi được đặt tên vinh danh vợ chồng Curie.', 'Curi phát sáng đỏ trong bóng tối do phóng xạ.', 'Curi-244 được dùng trong máy phân tích hạt alpha trên Sao Hỏa.'],
        discoveryYear: 1944, meltingPoint: 1345, boilingPoint: 3110, density: 13.51, state: 'solid', infographicPath: 'element/Curium.jpeg'
    },
    {
        atomicNumber: 97, symbol: 'Bk', name: 'Berkeli', nameEn: 'Berkelium',
        atomicMass: 247, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f⁹ 7s²', electronShells: [2, 8, 18, 32, 27, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Berkeli được đặt tên theo Berkeley, California, nơi nó được tạo ra.',
        facts: ['Berkeli được đặt tên theo thành phố Berkeley.', 'Chỉ vài gram berkeli được tạo ra từ trước đến nay.', 'Berkeli là bước đệm để tạo ra các nguyên tố nặng hơn.'],
        discoveryYear: 1949, meltingPoint: 986, boilingPoint: 2627, density: 14.79, state: 'solid', infographicPath: 'element/Berkelium.jpeg'
    },
    {
        atomicNumber: 98, symbol: 'Cf', name: 'Californi', nameEn: 'Californium',
        atomicMass: 251, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f¹⁰ 7s²', electronShells: [2, 8, 18, 32, 28, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Californi là nguyên tố actinide đắt nhất, phát neutron mạnh, dùng khởi động lò phản ứng.',
        facts: ['1 gram californi có giá khoảng 27 triệu USD.', 'Californi dùng để khởi động lò phản ứng hạt nhân.', 'Californi dùng phát hiện vàng và dầu mỏ qua quét neutron.'],
        discoveryYear: 1950, meltingPoint: 900, boilingPoint: 1470, density: 15.1, state: 'solid', infographicPath: 'element/Californium.jpeg'
    },
    {
        atomicNumber: 99, symbol: 'Es', name: 'Einsteini', nameEn: 'Einsteinium',
        atomicMass: 252, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f¹¹ 7s²', electronShells: [2, 8, 18, 32, 29, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Einsteini được phát hiện trong vụ thử bom nhiệt hạch đầu tiên, đặt tên theo Albert Einstein.',
        facts: ['Einsteini được phát hiện trong tàn tích bom nhiệt hạch 1952.', 'Einsteini được đặt tên vinh danh Albert Einstein.', 'Einsteini phát sáng xanh do phóng xạ mạnh.'],
        discoveryYear: 1952, meltingPoint: 860, boilingPoint: 996, density: 8.84, state: 'solid', infographicPath: 'element/Einsteinium.jpeg'
    },
    {
        atomicNumber: 100, symbol: 'Fm', name: 'Fermi', nameEn: 'Fermium',
        atomicMass: 257, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f¹² 7s²', electronShells: [2, 8, 18, 32, 30, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Fermi được đặt tên theo Enrico Fermi, nhà vật lý hạt nhân tiên phong.',
        facts: ['Fermi được đặt tên theo Enrico Fermi.', 'Fermi cũng được phát hiện trong tàn tích bom nhiệt hạch.', 'Fermium-257 có chu kỳ bán rã 100 ngày.'],
        discoveryYear: 1952, meltingPoint: 1527, boilingPoint: undefined, density: 9.7, state: 'solid', infographicPath: 'element/Fermium.jpeg'
    },
    {
        atomicNumber: 101, symbol: 'Md', name: 'Mendelevi', nameEn: 'Mendelevium',
        atomicMass: 258, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f¹³ 7s²', electronShells: [2, 8, 18, 32, 31, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Mendelevi được đặt tên theo Dmitri Mendeleev, cha đẻ của bảng tuần hoàn.',
        facts: ['Mendelevi được đặt tên vinh danh Dmitri Mendeleev.', 'Chỉ khoảng 17 nguyên tử mendelevi được tạo ra lần đầu.', 'Mendelevi là actinide cuối cùng có thể nghiên cứu hóa học.'],
        discoveryYear: 1955, meltingPoint: 827, boilingPoint: undefined, density: 10.3, state: 'solid', infographicPath: 'element/Mendelevium.jpeg'
    },
    {
        atomicNumber: 102, symbol: 'No', name: 'Nobeli', nameEn: 'Nobelium',
        atomicMass: 259, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f¹⁴ 7s²', electronShells: [2, 8, 18, 32, 32, 8, 2],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Nobeli được đặt tên theo Alfred Nobel, người sáng lập giải Nobel.',
        facts: ['Nobeli được đặt tên theo Alfred Nobel.', 'Nobeli-259 có chu kỳ bán rã 58 phút.', 'Nobeli là một trong những nguyên tố ít được biết đến nhất.'],
        discoveryYear: 1958, meltingPoint: 827, boilingPoint: undefined, density: 9.9, state: 'solid', infographicPath: 'element/Nobelium.jpeg'
    },
    {
        atomicNumber: 103, symbol: 'Lr', name: 'Lawrenci', nameEn: 'Lawrencium',
        atomicMass: 266, category: 'actinide', period: 7, group: 0,
        electronConfig: '[Rn] 5f¹⁴ 7s² 7p¹', electronShells: [2, 8, 18, 32, 32, 8, 3],
        color: '#E599F7', glowColor: '#E599F780',
        description: 'Lawrenci là actinide cuối cùng, đặt tên theo Ernest Lawrence, phát minh máy gia tốc.',
        facts: ['Lawrenci được đặt tên theo Ernest O. Lawrence.', 'Lawrenci là nguyên tố actinide cuối cùng.', 'Lawrenci-266 có chu kỳ bán rã 11 giờ.'],
        discoveryYear: 1961, meltingPoint: 1627, boilingPoint: undefined, density: 14.4, state: 'solid', infographicPath: 'element/Lawrencium.jpeg'
    },
    // Transactinides (104-118)
    {
        atomicNumber: 104, symbol: 'Rf', name: 'Rutherfordi', nameEn: 'Rutherfordium',
        atomicMass: 267, category: 'transition-metal', period: 7, group: 4,
        electronConfig: '[Rn] 5f¹⁴ 6d² 7s²', electronShells: [2, 8, 18, 32, 32, 10, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Rutherfordi được đặt tên theo Ernest Rutherford, cha đẻ của vật lý hạt nhân.',
        facts: ['Rutherfordi được đặt tên theo Ernest Rutherford.', 'Đồng vị bền nhất có chu kỳ bán rã 1.3 giờ.', 'Rutherfordi được tạo ra bằng cách bắn phá plutoni.'],
        discoveryYear: 1969, meltingPoint: 2100, boilingPoint: 5500, density: 23.2, state: 'solid', infographicPath: 'element/Rutherfordium.png'
    },
    {
        atomicNumber: 105, symbol: 'Db', name: 'Dubni', nameEn: 'Dubnium',
        atomicMass: 268, category: 'transition-metal', period: 7, group: 5,
        electronConfig: '[Rn] 5f¹⁴ 6d³ 7s²', electronShells: [2, 8, 18, 32, 32, 11, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Dubni được đặt tên theo thành phố Dubna, Nga, nơi đặt phòng thí nghiệm hạt nhân.',
        facts: ['Dubni được đặt tên theo Dubna, Nga.', 'Dubni từng gây tranh cãi giữa Mỹ và Liên Xô về quyền phát hiện.', 'Đồng vị bền nhất có chu kỳ bán rã 28 giờ.'],
        discoveryYear: 1970, meltingPoint: undefined, boilingPoint: undefined, density: 29.3, state: 'solid', infographicPath: 'element/Dubnium.png'
    },
    {
        atomicNumber: 106, symbol: 'Sg', name: 'Seaborgi', nameEn: 'Seaborgium',
        atomicMass: 269, category: 'transition-metal', period: 7, group: 6,
        electronConfig: '[Rn] 5f¹⁴ 6d⁴ 7s²', electronShells: [2, 8, 18, 32, 32, 12, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Seaborgi được đặt tên theo Glenn Seaborg, người phát hiện nhiều nguyên tố siêu urani.',
        facts: ['Seaborgi được đặt tên khi Glenn Seaborg còn sống.', 'Seaborg là người duy nhất có nguyên tố mang tên khi còn sống.', 'Đồng vị bền nhất có chu kỳ bán rã 14 phút.'],
        discoveryYear: 1974, meltingPoint: undefined, boilingPoint: undefined, density: 35, state: 'solid', infographicPath: 'element/Seaborgium.png'
    },
    {
        atomicNumber: 107, symbol: 'Bh', name: 'Bohri', nameEn: 'Bohrium',
        atomicMass: 270, category: 'transition-metal', period: 7, group: 7,
        electronConfig: '[Rn] 5f¹⁴ 6d⁵ 7s²', electronShells: [2, 8, 18, 32, 32, 13, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Bohri được đặt tên theo Niels Bohr, nhà vật lý lượng tử tiên phong.',
        facts: ['Bohri được đặt tên theo Niels Bohr.', 'Đồng vị bền nhất có chu kỳ bán rã 61 giây.', 'Bohri được tạo ra bằng cách bắn phá bismuth.'],
        discoveryYear: 1981, meltingPoint: undefined, boilingPoint: undefined, density: 37.1, state: 'solid', infographicPath: 'element/Bohrium.png'
    },
    {
        atomicNumber: 108, symbol: 'Hs', name: 'Hassi', nameEn: 'Hassium',
        atomicMass: 277, category: 'transition-metal', period: 7, group: 8,
        electronConfig: '[Rn] 5f¹⁴ 6d⁶ 7s²', electronShells: [2, 8, 18, 32, 32, 14, 2],
        color: '#FFD43B', glowColor: '#FFD43B80',
        description: 'Hassi được đặt tên theo bang Hesse, Đức, nơi đặt GSI Helmholtz.',
        facts: ['Hassi được đặt tên theo bang Hesse, Đức.', 'Đồng vị bền nhất có chu kỳ bán rã 10 giây.', 'Hassi được dự đoán có tính chất tương tự osmi.'],
        discoveryYear: 1984, meltingPoint: undefined, boilingPoint: undefined, density: 40.7, state: 'solid', infographicPath: 'element/Hassium.png'
    },
    {
        atomicNumber: 109, symbol: 'Mt', name: 'Meitneri', nameEn: 'Meitnerium',
        atomicMass: 278, category: 'unknown', period: 7, group: 9,
        electronConfig: '[Rn] 5f¹⁴ 6d⁷ 7s²', electronShells: [2, 8, 18, 32, 32, 15, 2],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Meitneri được đặt tên theo Lise Meitner, nhà vật lý đồng phát hiện phân hạch hạt nhân.',
        facts: ['Meitneri được đặt tên theo Lise Meitner.', 'Đồng vị bền nhất có chu kỳ bán rã 7.6 giây.', 'Meitner bị bỏ qua khi trao giải Nobel cho phân hạch hạt nhân.'],
        discoveryYear: 1982, meltingPoint: undefined, boilingPoint: undefined, density: 37.4, state: 'solid', infographicPath: 'element/Meitnerium.png'
    },
    {
        atomicNumber: 110, symbol: 'Ds', name: 'Darmstadti', nameEn: 'Darmstadtium',
        atomicMass: 281, category: 'unknown', period: 7, group: 10,
        electronConfig: '[Rn] 5f¹⁴ 6d⁸ 7s²', electronShells: [2, 8, 18, 32, 32, 16, 2],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Darmstadti được đặt tên theo thành phố Darmstadt, Đức.',
        facts: ['Darmstadti được đặt tên theo Darmstadt, Đức.', 'Đồng vị bền nhất có chu kỳ bán rã 14 giây.', 'Darmstadti được dự đoán có màu giống platin.'],
        discoveryYear: 1994, meltingPoint: undefined, boilingPoint: undefined, density: 34.8, state: 'solid', infographicPath: 'element/Darmstadtium.png'
    },
    {
        atomicNumber: 111, symbol: 'Rg', name: 'Roentgeni', nameEn: 'Roentgenium',
        atomicMass: 282, category: 'unknown', period: 7, group: 11,
        electronConfig: '[Rn] 5f¹⁴ 6d⁹ 7s²', electronShells: [2, 8, 18, 32, 32, 17, 2],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Roentgeni được đặt tên theo Wilhelm Röntgen, người phát hiện tia X.',
        facts: ['Roentgeni được đặt tên theo Wilhelm Röntgen.', 'Đồng vị bền nhất có chu kỳ bán rã 26 giây.', 'Roentgeni được dự đoán có màu vàng như vàng.'],
        discoveryYear: 1994, meltingPoint: undefined, boilingPoint: undefined, density: 28.7, state: 'solid', infographicPath: 'element/Roentgenium.png'
    },
    {
        atomicNumber: 112, symbol: 'Cn', name: 'Copernici', nameEn: 'Copernicium',
        atomicMass: 285, category: 'unknown', period: 7, group: 12,
        electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', electronShells: [2, 8, 18, 32, 32, 18, 2],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Copernici được đặt tên theo Nicolaus Copernicus, nhà thiên văn học.',
        facts: ['Copernici được đặt tên theo Copernicus.', 'Copernici có thể là chất khí ở nhiệt độ phòng.', 'Đồng vị bền nhất có chu kỳ bán rã 29 giây.'],
        discoveryYear: 1996, meltingPoint: undefined, boilingPoint: undefined, density: 23.7, state: 'unknown', infographicPath: 'element/Copernicium.png'
    },
    {
        atomicNumber: 113, symbol: 'Nh', name: 'Nihoni', nameEn: 'Nihonium',
        atomicMass: 286, category: 'unknown', period: 7, group: 13,
        electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', electronShells: [2, 8, 18, 32, 32, 18, 3],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Nihoni được đặt tên theo Nhật Bản (Nihon), nguyên tố đầu tiên phát hiện ở châu Á.',
        facts: ['Nihoni là nguyên tố đầu tiên được phát hiện ở châu Á.', 'Nihon có nghĩa là Nhật Bản trong tiếng Nhật.', 'Đồng vị bền nhất có chu kỳ bán rã 20 giây.'],
        discoveryYear: 2004, meltingPoint: undefined, boilingPoint: undefined, density: 16, state: 'solid', infographicPath: 'element/Nihonium.png'
    },
    {
        atomicNumber: 114, symbol: 'Fl', name: 'Flerovi', nameEn: 'Flerovium',
        atomicMass: 289, category: 'unknown', period: 7, group: 14,
        electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', electronShells: [2, 8, 18, 32, 32, 18, 4],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Flerovi được đặt tên theo Georgy Flyorov và phòng thí nghiệm Flerov.',
        facts: ['Flerovi được đặt tên theo Georgy Flyorov.', 'Flerovi có thể là chất khí hoặc lỏng ở nhiệt độ phòng.', 'Đồng vị bền nhất có chu kỳ bán rã 2.6 giây.'],
        discoveryYear: 1999, meltingPoint: undefined, boilingPoint: undefined, density: 14, state: 'unknown', infographicPath: 'element/Flerovium.png'
    },
    {
        atomicNumber: 115, symbol: 'Mc', name: 'Moscovi', nameEn: 'Moscovium',
        atomicMass: 290, category: 'unknown', period: 7, group: 15,
        electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', electronShells: [2, 8, 18, 32, 32, 18, 5],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Moscovi được đặt tên theo vùng Moscow, Nga.',
        facts: ['Moscovi được đặt tên theo vùng Moscow.', 'Đồng vị bền nhất có chu kỳ bán rã 0.65 giây.', 'Moscovi nổi tiếng trong thuyết âm mưu về UFO (không có cơ sở).'],
        discoveryYear: 2003, meltingPoint: undefined, boilingPoint: undefined, density: 13.5, state: 'solid', infographicPath: 'element/Moscovium.png'
    },
    {
        atomicNumber: 116, symbol: 'Lv', name: 'Livermori', nameEn: 'Livermorium',
        atomicMass: 293, category: 'unknown', period: 7, group: 16,
        electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', electronShells: [2, 8, 18, 32, 32, 18, 6],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Livermori được đặt tên theo phòng thí nghiệm Lawrence Livermore.',
        facts: ['Livermori được đặt tên theo Livermore National Lab.', 'Đồng vị bền nhất có chu kỳ bán rã 60 ms.', 'Livermori là nguyên tố nặng nhất trong nhóm 16.'],
        discoveryYear: 2000, meltingPoint: undefined, boilingPoint: undefined, density: 12.9, state: 'solid', infographicPath: 'element/Livermorium.png'
    },
    {
        atomicNumber: 117, symbol: 'Ts', name: 'Tennessine', nameEn: 'Tennessine',
        atomicMass: 294, category: 'unknown', period: 7, group: 17,
        electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', electronShells: [2, 8, 18, 32, 32, 18, 7],
        color: '#868E96', glowColor: '#868E9680',
        description: 'Tennessine được đặt tên theo bang Tennessee, Mỹ.',
        facts: ['Tennessine được đặt tên theo bang Tennessee.', 'Tennessine là halogen nặng nhất.', 'Đồng vị bền nhất có chu kỳ bán rã 51 ms.'],
        discoveryYear: 2010, meltingPoint: undefined, boilingPoint: undefined, density: 7.2, state: 'solid', infographicPath: 'element/Tennessine.png'
    },
    {
        atomicNumber: 118, symbol: 'Og', name: 'Oganesson', nameEn: 'Oganesson',
        atomicMass: 294, category: 'noble-gas', period: 7, group: 18,
        electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', electronShells: [2, 8, 18, 32, 32, 18, 8],
        color: '#DA77F2', glowColor: '#DA77F280',
        description: 'Oganesson là nguyên tố nặng nhất, đặt tên theo nhà vật lý Yuri Oganessian còn sống.',
        facts: ['Oganesson được đặt tên khi Yuri Oganessian còn sống.', 'Oganesson có thể là chất rắn, không phải khí như các khí hiếm khác.', 'Chỉ khoảng 5 nguyên tử oganesson từng được tạo ra.'],
        discoveryYear: 2006, meltingPoint: undefined, boilingPoint: undefined, density: 4.9, state: 'unknown', infographicPath: 'element/Oganesson.png'
    },
];

