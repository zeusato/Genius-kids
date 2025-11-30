export interface PlanetData {
    id: string;
    name: string;
    color: string;
    size: number; // Relative size
    orbitDistance: number; // Relative distance from sun
    orbitSpeed: number; // Seconds for one revolution
    description: string;
    facts: string[];
    temperature: string;
    distanceFromSun: string;
    diameter: string;
    gravity: string;
    gradientColors: string[]; // For CSS gradient generation
    ring?: {
        color: string;
        size: number;
    };
}

// Sun is separate - it doesn't orbit, it's the center
export const SUN_DATA: PlanetData = {
    id: 'sun',
    name: 'Mặt Trời',
    color: '#FDB813',
    size: 109, // Relative to Earth
    orbitDistance: 0,
    orbitSpeed: 0,
    description: 'Ngôi sao ở trung tâm Hệ Mặt Trời. Nó chiếm 99,86% khối lượng của toàn bộ hệ thống và cung cấp năng lượng cho sự sống trên Trái Đất.',
    facts: [
        'Ánh sáng từ Mặt Trời mất 8 phút để đến Trái Đất.',
        'Nhiệt độ bề mặt khoảng 5.500°C, nhưng lõi lên tới 15 triệu °C.',
        'Mặt Trời sẽ phình to thành Sao Đỏ khổng lồ trong 5 tỷ năm nữa.'
    ],
    temperature: '5.500°C (Bề mặt)',
    distanceFromSun: '0 km',
    diameter: '1.4 triệu km',
    gravity: '274 m/s²',
    gradientColors: ['#FFF176', '#FF9800', '#E65100']
};

export const ASTEROID_BELT_DATA: PlanetData = {
    id: 'asteroid-belt',
    name: 'Vành Đai Tiểu Hành Tinh',
    color: '#8B7355',
    size: 0,
    orbitDistance: 320, // Between Mars and Jupiter
    orbitSpeed: 0,
    description: 'Vành đai tiểu hành tinh là vùng không gian giữa Sao Hỏa và Sao Mộc chứa hàng triệu mảnh đá và kim loại nhỏ quay quanh Mặt Trời.',
    facts: [
        'Có hơn 1 triệu tiểu hành tinh trong vành đai này.',
        'Ceres là thiên thể lớn nhất, chiếm 1/3 tổng khối lượng vành đai.',
        'Tổng khối lượng vành đai chỉ bằng 4% khối lượng Mặt Trăng.',
        'Khoảng cách giữa các tiểu hành tinh thực tế rất xa, không giống phim ảnh.'
    ],
    temperature: '-73°C đến -108°C',
    distanceFromSun: '329-478 triệu km',
    diameter: 'Ceres: 939 km',
    gravity: 'Ceres: 0.28 m/s²',
    gradientColors: ['#D4A373', '#8B7355', '#5D4037']
};

export const SOLAR_SYSTEM_DATA: PlanetData[] = [
    {
        id: 'mercury',
        name: 'Sao Thủy',
        color: '#A5A5A5',
        size: 12,
        orbitDistance: 140,
        orbitSpeed: 5,
        description: 'Hành tinh nhỏ nhất và gần Mặt Trời nhất. Sao Thủy không có khí quyển để giữ nhiệt, nên ban ngày rất nóng còn ban đêm rất lạnh.',
        facts: [
            'Một năm trên Sao Thủy chỉ dài 88 ngày Trái Đất.',
            'Nó nhỏ hơn cả mặt trăng Titan của Sao Thổ.',
            'Bề mặt đầy hố thiên thạch giống Mặt Trăng.'
        ],
        temperature: '-173°C đến 427°C',
        distanceFromSun: '58 triệu km',
        diameter: '4,880 km',
        gravity: '3.7 m/s²',
        gradientColors: ['#E0E0E0', '#A5A5A5', '#757575']
    },
    {
        id: 'venus',
        name: 'Sao Kim',
        color: '#E3BB76',
        size: 20,
        orbitDistance: 180,
        orbitSpeed: 12,
        description: 'Hành tinh nóng nhất hệ mặt trời do hiệu ứng nhà kính cực mạnh. Nó còn được gọi là "Sao Hôm" hoặc "Sao Mai".',
        facts: [
            'Sao Kim quay ngược chiều so với hầu hết các hành tinh khác.',
            'Một ngày ở đây dài hơn một năm (quay rất chậm).',
            'Nó sáng thứ 3 trên bầu trời, chỉ sau Mặt Trời và Mặt Trăng.'
        ],
        temperature: '462°C',
        distanceFromSun: '108 triệu km',
        diameter: '12,104 km',
        gravity: '8.87 m/s²',
        gradientColors: ['#FFF3E0', '#E3BB76', '#D84315']
    },
    {
        id: 'earth',
        name: 'Trái Đất',
        color: '#4F83CC',
        size: 22,
        orbitDistance: 230,
        orbitSpeed: 20,
        description: 'Hành tinh duy nhất được biết đến là có sự sống. Bề mặt được bao phủ bởi 70% là nước.',
        facts: [
            'Trái Đất không hoàn toàn hình cầu, nó hơi phình ra ở xích đạo.',
            'Là hành tinh duy nhất có tên không đặt theo thần thoại Hy Lạp/La Mã.',
            'Có một vệ tinh tự nhiên là Mặt Trăng.'
        ],
        temperature: '-88°C đến 58°C',
        distanceFromSun: '150 triệu km',
        diameter: '12,742 km',
        gravity: '9.8 m/s²',
        gradientColors: ['#81D4FA', '#29B6F6', '#01579B', '#4CAF50']
    },
    {
        id: 'mars',
        name: 'Sao Hỏa',
        color: '#E57373',
        size: 16,
        orbitDistance: 280,
        orbitSpeed: 38,
        description: 'Hành tinh Đỏ, nổi tiếng với các cơn bão bụi khổng lồ và ngọn núi lửa cao nhất hệ mặt trời (Olympus Mons).',
        facts: [
            'Màu đỏ là do oxit sắt (gỉ sắt) trên bề mặt.',
            'Có hai mặt trăng nhỏ là Phobos và Deimos.',
            'Các nhà khoa học đang tìm kiếm dấu hiệu sự sống cổ đại ở đây.'
        ],
        temperature: '-153°C đến 20°C',
        distanceFromSun: '228 triệu km',
        diameter: '6,779 km',
        gravity: '3.71 m/s²',
        gradientColors: ['#FFCCBC', '#FF7043', '#BF360C']
    },
    {
        id: 'jupiter',
        name: 'Sao Mộc',
        color: '#D4A373',
        size: 50,
        orbitDistance: 420,
        orbitSpeed: 120,
        description: 'Hành tinh lớn nhất hệ mặt trời, một khối khí khổng lồ. Vết Đỏ Lớn là một cơn bão đã tồn tại hàng trăm năm.',
        facts: [
            'Sao Mộc có thể chứa 1.300 Trái Đất bên trong nó.',
            'Nó có hơn 79 mặt trăng đã được xác nhận.',
            'Quay nhanh nhất trong các hành tinh (1 ngày < 10 giờ).'
        ],
        temperature: '-145°C',
        distanceFromSun: '778 triệu km',
        diameter: '139,820 km',
        gravity: '24.79 m/s²',
        gradientColors: ['#FFE0B2', '#D4A373', '#8D6E63', '#5D4037']
    },
    {
        id: 'saturn',
        name: 'Sao Thổ',
        color: '#FDD835',
        size: 45,
        orbitDistance: 520,
        orbitSpeed: 200,
        description: 'Nổi tiếng với hệ thống vành đai lộng lẫy làm từ băng và đá. Là hành tinh nhẹ nhất, có thể nổi trên mặt nước.',
        facts: [
            'Vành đai của nó rộng nhưng rất mỏng (chỉ dày khoảng 1km).',
            'Gió trên Sao Thổ cực mạnh, lên tới 1.800 km/h.',
            'Có mặt trăng Titan với khí quyển dày đặc.'
        ],
        temperature: '-178°C',
        distanceFromSun: '1.4 tỷ km',
        diameter: '116,460 km',
        gravity: '10.44 m/s²',
        gradientColors: ['#FFF9C4', '#FDD835', '#FBC02D'],
        ring: {
            color: 'rgba(253, 216, 53, 0.4)',
            size: 1.6
        }
    },
    {
        id: 'uranus',
        name: 'Sao Thiên Vương',
        color: '#4DD0E1',
        size: 30,
        orbitDistance: 620,
        orbitSpeed: 400,
        description: 'Hành tinh băng khổng lồ, có màu xanh ngọc tuyệt đẹp nhờ khí Methane. Nó quay "nằm ngang" so với quỹ đạo.',
        facts: [
            'Là hành tinh lạnh nhất hệ mặt trời (-224°C).',
            'Quay nghiêng 98 độ, như đang lăn trên quỹ đạo.',
            'Được phát hiện bằng kính thiên văn vào năm 1781.'
        ],
        temperature: '-224°C',
        distanceFromSun: '2.9 tỷ km',
        diameter: '50,724 km',
        gravity: '8.69 m/s²',
        gradientColors: ['#E0F7FA', '#4DD0E1', '#0097A7']
    },
    {
        id: 'neptune',
        name: 'Sao Hải Vương',
        color: '#304FFE',
        size: 29,
        orbitDistance: 720,
        orbitSpeed: 600,
        description: 'Hành tinh xa nhất, đầy gió bão và băng giá. Màu xanh thẫm bí ẩn của đại dương vũ trụ.',
        facts: [
            'Một năm ở đây dài bằng 165 năm Trái Đất.',
            'Có những cơn gió nhanh nhất hệ mặt trời (2.100 km/h).',
            'Mặt trăng Triton của nó phun ra băng nitơ.'
        ],
        temperature: '-214°C',
        distanceFromSun: '4.5 tỷ km',
        diameter: '49,244 km',
        gravity: '11.15 m/s²',
        gradientColors: ['#8C9EFF', '#304FFE', '#1A237E']
    }
];
