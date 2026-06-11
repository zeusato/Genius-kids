// Dữ liệu hành tinh theo NASA (NSSDC Planetary Fact Sheet + science.nasa.gov, cập nhật 6/2026)
// Số liệu vật lý (physical) dùng cho mô phỏng 3D; chuỗi hiển thị giữ thân thiện với trẻ em.

// Thông số vật lý thật từ NASA — nguồn cho công thức tỷ lệ trong scale.ts
export interface PlanetPhysical {
    au: number;                 // Bán trục lớn (AU)
    diameterKm: number;         // Đường kính xích đạo (km, NSSDC)
    periodYears: number;        // Chu kỳ quỹ đạo (năm Trái Đất)
    rotationHours: number;      // Chu kỳ tự quay (giờ); ÂM = quay ngược (Sao Kim, Sao Thiên Vương)
    axialTiltDeg: number;       // Độ nghiêng trục
    eccentricity: number;       // Độ dẹt quỹ đạo
}

// Số mặt trăng thay đổi liên tục — luôn kèm mốc thời gian NASA công bố
export interface MoonCount {
    count: number;
    asOf: string; // ví dụ '3/2026'
}

export interface PlanetData {
    id: string;
    name: string;
    color: string;
    size: number; // Relative size (view 2D fallback)
    orbitDistance: number; // Relative distance from sun (view 2D fallback)
    orbitSpeed: number; // Seconds for one revolution (view 2D fallback)
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
    physical?: PlanetPhysical;
    moons?: MoonCount;
}

// Sun is separate - it doesn't orbit, it's the center
export const SUN_DATA: PlanetData = {
    id: 'sun',
    name: 'Mặt Trời',
    color: '#FDB813',
    size: 109, // Relative to Earth
    orbitDistance: 0,
    orbitSpeed: 0,
    description: 'Ngôi sao ở trung tâm Hệ Mặt Trời. Nó chiếm 99,8% khối lượng của toàn bộ hệ thống và cung cấp năng lượng cho sự sống trên Trái Đất.',
    facts: [
        'Ánh sáng từ Mặt Trời mất 8 phút để đến Trái Đất.',
        'Nhiệt độ bề mặt khoảng 5.500°C, nhưng lõi lên tới 15 triệu °C.',
        'Mặt Trời sẽ phình to thành Sao Đỏ khổng lồ trong 5 tỷ năm nữa.',
        'Có thể chứa khoảng 1,3 triệu Trái Đất bên trong!'
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
        'Ceres là thiên thể lớn nhất, chiếm khoảng 1/4 tổng khối lượng vành đai.',
        'Tổng khối lượng vành đai chỉ bằng khoảng 3% khối lượng Mặt Trăng.',
        'Khoảng cách giữa các tiểu hành tinh thực tế rất xa, không giống phim ảnh.'
    ],
    temperature: '-73°C đến -108°C',
    distanceFromSun: '329-478 triệu km',
    diameter: 'Ceres: 939 km',
    gravity: 'Ceres: 0.28 m/s²',
    gradientColors: ['#D4A373', '#8B7355', '#5D4037']
};

// Vệ tinh (mặt trăng) quay quanh hành tinh — chấm nhỏ trong scene, chạm xem thẻ info.
export interface MoonData {
    id: string;
    name: string;
    nameEn: string;
    parentId: string;       // hành tinh chủ (khớp SOLAR_SYSTEM_DATA.id)
    parentName: string;
    diameter: string;
    description: string;
    facts: string[];
    funFact: string;
    color: string;
    gradientColors: string[];
    // tham số dựng 3D — tương đối theo bán kính hành tinh chủ
    relOrbit: number;       // bán kính quỹ đạo = relOrbit × bán kính hành tinh
    size: number;           // bán kính vệ tinh (scene units)
    periodSec: number;      // chu kỳ quay quanh hành tinh (giây, ở tốc độ 1x)
    tilt: number;           // độ nghiêng mặt phẳng quỹ đạo
}

export const MOON_DATA: MoonData[] = [
    {
        id: 'moon', name: 'Mặt Trăng', nameEn: 'Moon', parentId: 'earth', parentName: 'Trái Đất',
        diameter: '3.475 km',
        description: 'Vệ tinh tự nhiên duy nhất của Trái Đất, người bạn đồng hành ta thấy mỗi đêm.',
        facts: [
            'Mặt Trăng luôn quay cùng một mặt về phía Trái Đất.',
            'Cách Trái Đất 384.400 km — lọt vừa khoảng 30 Trái Đất xếp hàng.',
            'Là nơi duy nhất ngoài Trái Đất con người từng đặt chân (Apollo, 1969).'
        ],
        funFact: 'Dấu chân các nhà du hành trên Mặt Trăng sẽ còn nguyên hàng triệu năm vì ở đó không có gió!',
        color: '#BDBDBD', gradientColors: ['#EEEEEE', '#9E9E9E', '#616161'],
        relOrbit: 2.6, size: 0.16, periodSec: 9, tilt: 0.18
    },
    {
        id: 'io', name: 'Io', nameEn: 'Io', parentId: 'jupiter', parentName: 'Sao Mộc',
        diameter: '3.643 km',
        description: 'Vệ tinh núi lửa dữ dội nhất Hệ Mặt Trời, vàng cam như một chiếc pizza.',
        facts: [
            'Có hàng trăm núi lửa đang hoạt động, phun cao hàng chục km.',
            'Màu vàng cam là do lưu huỳnh phủ khắp bề mặt.',
            'Bị lực hấp dẫn khổng lồ của Sao Mộc "nhào nặn" liên tục.'
        ],
        funFact: 'Io là thế giới núi lửa hoạt động mạnh nhất mà con người từng biết!',
        color: '#FBC02D', gradientColors: ['#FFF59D', '#FBC02D', '#E65100'],
        relOrbit: 1.5, size: 0.12, periodSec: 4, tilt: 0.05
    },
    {
        id: 'europa', name: 'Europa', nameEn: 'Europa', parentId: 'jupiter', parentName: 'Sao Mộc',
        diameter: '3.122 km',
        description: 'Vệ tinh băng giá với đại dương nước lỏng ẩn dưới lớp vỏ băng nứt nẻ.',
        facts: [
            'Bên dưới lớp băng có thể là đại dương nhiều nước gấp đôi mọi đại dương Trái Đất.',
            'Bề mặt băng phẳng, chằng chịt vết nứt màu nâu đỏ.',
            'Tàu Europa Clipper của NASA đang trên đường tới (đến nơi năm 2030).'
        ],
        funFact: 'Các nhà khoa học hy vọng đại dương ngầm của Europa có thể có sự sống!',
        color: '#E8E0D0', gradientColors: ['#FFFDE7', '#E0E0D1', '#B0A99F'],
        relOrbit: 1.95, size: 0.11, periodSec: 6, tilt: 0.08
    },
    {
        id: 'ganymede', name: 'Ganymede', nameEn: 'Ganymede', parentId: 'jupiter', parentName: 'Sao Mộc',
        diameter: '5.268 km',
        description: 'Vệ tinh LỚN NHẤT Hệ Mặt Trời — còn to hơn cả hành tinh Sao Thủy!',
        facts: [
            'Lớn hơn cả Sao Thủy, là mặt trăng to nhất trong hệ.',
            'Là mặt trăng duy nhất có từ trường riêng.',
            'Cũng giấu một đại dương nước mặn bên dưới lớp băng.'
        ],
        funFact: 'Nếu Ganymede quay quanh Mặt Trời thay vì Sao Mộc, nó hẳn đã được gọi là một hành tinh!',
        color: '#9E8C7A', gradientColors: ['#C5B9A5', '#8D7B6A', '#5D4F42'],
        relOrbit: 2.45, size: 0.17, periodSec: 9, tilt: 0.06
    },
    {
        id: 'callisto', name: 'Callisto', nameEn: 'Callisto', parentId: 'jupiter', parentName: 'Sao Mộc',
        diameter: '4.821 km',
        description: 'Vệ tinh nhiều hố thiên thạch nhất, bề mặt cổ xưa gần như không đổi suốt 4 tỷ năm.',
        facts: [
            'Là thiên thể có nhiều hố va chạm nhất Hệ Mặt Trời.',
            'Bề mặt gần như không thay đổi trong khoảng 4 tỷ năm.',
            'Là một trong 4 mặt trăng Galileo phát hiện năm 1610.'
        ],
        funFact: 'Bốn mặt trăng lớn của Sao Mộc được tìm ra bằng một kính thiên văn tí hon năm 1610!',
        color: '#6E635A', gradientColors: ['#9E938A', '#6E635A', '#42392F'],
        relOrbit: 3.0, size: 0.15, periodSec: 13, tilt: 0.1
    },
    {
        id: 'titan', name: 'Titan', nameEn: 'Titan', parentId: 'saturn', parentName: 'Sao Thổ',
        diameter: '5.150 km',
        description: 'Vệ tinh lớn nhất của Sao Thổ, thế giới duy nhất khác có sông, hồ và mưa.',
        facts: [
            'Là mặt trăng duy nhất có khí quyển dày (màu cam mù mịt).',
            'Có sông, hồ và mưa — nhưng bằng khí mê-tan lỏng, không phải nước!',
            'Tàu bay Dragonfly của NASA sẽ tới khám phá (phóng năm 2028).'
        ],
        funFact: 'Titan là nơi duy nhất ngoài Trái Đất có chất lỏng chảy trên bề mặt!',
        color: '#E8A23D', gradientColors: ['#FFD699', '#E8A23D', '#A8651A'],
        relOrbit: 2.9, size: 0.18, periodSec: 11, tilt: 0.12
    }
];

// Thiên thể phụ hiển thị bằng thẻ info nhẹ (không texture/Canvas riêng): vệ tinh, hành tinh lùn, sao chổi
export interface InfoBody {
    id: string;
    name: string;
    kindLabel: string;      // "Hành tinh lùn", "Sao chổi"...
    diameter: string;
    description: string;
    facts: string[];
    funFact: string;
    color: string;
    gradientColors: string[];
}

// Sao Diêm Vương — hành tinh lùn ở Vành đai Kuiper, quỹ đạo elip dẹt ngoài Sao Hải Vương
export const PLUTO_INFO: InfoBody = {
    id: 'pluto', name: 'Sao Diêm Vương', kindLabel: 'Hành tinh lùn',
    diameter: '2.377 km (nhỏ hơn Mặt Trăng)',
    description: 'Hành tinh lùn lạnh giá ở rìa Hệ Mặt Trời, từng được coi là hành tinh thứ chín.',
    facts: [
        'Năm 2006 được xếp lại thành "hành tinh lùn" — một bài học hay về cách khoa học luôn cập nhật.',
        'Một năm ở đây dài tới 248 năm Trái Đất; quỹ đạo dẹt nên có lúc còn gần Mặt Trời hơn Sao Hải Vương.',
        'Có 5 mặt trăng; lớn nhất là Charon, to gần bằng nửa Sao Diêm Vương.'
    ],
    funFact: 'Tàu New Horizons (2015) chụp được một "trái tim" băng khổng lồ trên bề mặt Sao Diêm Vương!',
    color: '#C9B29B', gradientColors: ['#E6D5C3', '#C9B29B', '#8C7A66']
};

export const COMET_INFO: InfoBody = {
    id: 'comet', name: 'Sao Chổi', kindLabel: 'Sao chổi',
    diameter: 'Nhân vài km',
    description: 'Quả cầu tuyết bẩn bằng băng và bụi, mọc đuôi phát sáng khi tới gần Mặt Trời.',
    facts: [
        'Đuôi sao chổi luôn hướng RA XA Mặt Trời, dù nó đang bay tới hay bay đi.',
        'Đuôi chỉ xuất hiện khi tới gần Mặt Trời, lúc băng tan thành hơi và bụi.',
        'Quỹ đạo rất dẹt, nên sao chổi lúc lao sát Mặt Trời, lúc bay ra tận rìa hệ.'
    ],
    funFact: 'Sao chổi Halley ghé thăm khoảng 76 năm một lần — lần tới là năm 2061, khi các bé đã lớn!',
    color: '#A7E8FF', gradientColors: ['#E0FBFF', '#A7E8FF', '#5FB8E0']
};

// Pluto dùng cùng công thức tỷ lệ với hành tinh
export const PLUTO_PHYSICAL: PlanetPhysical = {
    au: 39.5, diameterKm: 2377, periodYears: 248, rotationHours: -153.3, axialTiltDeg: 122, eccentricity: 0.244
};

// So sánh kích thước với vật quen thuộc / với Trái Đất (cho trẻ dễ hình dung)
export const SIZE_COMPARE: Record<string, string> = {
    sun: 'Mặt Trời to đến mức chứa được hơn 1 triệu Trái Đất bên trong!',
    mercury: 'Sao Thủy chỉ nhỉnh hơn Mặt Trăng của chúng ta một chút thôi.',
    venus: 'Sao Kim gần bằng Trái Đất — như một người chị em song sinh.',
    earth: 'Trái Đất là "thước đo" để so sánh tất cả các hành tinh khác.',
    mars: 'Sao Hỏa chỉ bằng khoảng một nửa Trái Đất.',
    jupiter: 'Sao Mộc khổng lồ — chứa được hơn 1.300 Trái Đất bên trong!',
    saturn: 'Không tính vành đai, Sao Thổ vẫn chứa được khoảng 760 Trái Đất.',
    uranus: 'Sao Thiên Vương to bằng khoảng 4 Trái Đất xếp cạnh nhau.',
    neptune: 'Sao Hải Vương cũng cỡ 4 Trái Đất, chỉ hơi nhỏ hơn Sao Thiên Vương.',
    'asteroid-belt': 'Gộp tất cả tiểu hành tinh lại vẫn còn nhẹ hơn Mặt Trăng!'
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
            'Bề mặt đầy hố thiên thạch giống Mặt Trăng.',
            'Quỹ đạo của nó dẹt nhất trong 8 hành tinh — một đường elip thấy rõ!'
        ],
        temperature: '-173°C đến 427°C',
        distanceFromSun: '58 triệu km',
        diameter: '4,879 km',
        gravity: '3.7 m/s²',
        gradientColors: ['#E0E0E0', '#A5A5A5', '#757575'],
        physical: { au: 0.387, diameterKm: 4879, periodYears: 0.241, rotationHours: 1407.6, axialTiltDeg: 0.03, eccentricity: 0.206 },
        moons: { count: 0, asOf: '2026' }
    },
    {
        id: 'venus',
        name: 'Sao Kim',
        color: '#E8DCC3',
        size: 20,
        orbitDistance: 180,
        orbitSpeed: 12,
        description: 'Hành tinh nóng nhất hệ mặt trời do hiệu ứng nhà kính cực mạnh. Nó còn được gọi là "Sao Hôm" hoặc "Sao Mai".',
        facts: [
            'Sao Kim quay ngược chiều so với hầu hết các hành tinh khác.',
            'Một ngày ở đây dài hơn một năm (quay rất chậm).',
            'Nó sáng thứ 3 trên bầu trời, chỉ sau Mặt Trời và Mặt Trăng.',
            'Dưới ánh sáng thật, Sao Kim có màu trắng kem — lớp mây dày che kín bề mặt.'
        ],
        temperature: '464°C',
        distanceFromSun: '108 triệu km',
        diameter: '12,104 km',
        gravity: '8.87 m/s²',
        gradientColors: ['#FFF8E7', '#E8DCC3', '#C9A86A'],
        physical: { au: 0.723, diameterKm: 12104, periodYears: 0.615, rotationHours: -5832.5, axialTiltDeg: 177.4, eccentricity: 0.007 },
        moons: { count: 0, asOf: '2026' }
    },
    {
        id: 'earth',
        name: 'Trái Đất',
        color: '#4F83CC',
        size: 22,
        orbitDistance: 230,
        orbitSpeed: 20,
        description: 'Hành tinh duy nhất được biết đến là có sự sống. Bề mặt được bao phủ bởi 71% là nước.',
        facts: [
            'Trái Đất không hoàn toàn hình cầu, nó hơi phình ra ở xích đạo.',
            'Là hành tinh duy nhất có tên không đặt theo thần thoại Hy Lạp/La Mã.',
            'Có một vệ tinh tự nhiên là Mặt Trăng.',
            'Trục nghiêng 23,4° chính là lý do có bốn mùa!'
        ],
        temperature: '-88°C đến 58°C',
        distanceFromSun: '150 triệu km',
        diameter: '12,742 km',
        gravity: '9.8 m/s²',
        gradientColors: ['#81D4FA', '#29B6F6', '#01579B', '#4CAF50'],
        physical: { au: 1.0, diameterKm: 12756, periodYears: 1.0, rotationHours: 23.9, axialTiltDeg: 23.4, eccentricity: 0.017 },
        moons: { count: 1, asOf: '2026' }
    },
    {
        id: 'mars',
        name: 'Sao Hỏa',
        color: '#C1623F',
        size: 16,
        orbitDistance: 280,
        orbitSpeed: 38,
        description: 'Hành tinh Đỏ, nổi tiếng với các cơn bão bụi khổng lồ và ngọn núi lửa cao nhất hệ mặt trời (Olympus Mons).',
        facts: [
            'Màu đỏ là do oxit sắt (gỉ sắt) trên bề mặt.',
            'Có hai mặt trăng nhỏ là Phobos và Deimos.',
            'Các nhà khoa học đang tìm kiếm dấu hiệu sự sống cổ đại ở đây.',
            'Một ngày trên Sao Hỏa dài 24,6 giờ — gần giống Trái Đất!'
        ],
        temperature: '-153°C đến 20°C',
        distanceFromSun: '228 triệu km',
        diameter: '6,779 km',
        gravity: '3.71 m/s²',
        gradientColors: ['#FFCCBC', '#E57373', '#BF360C'],
        physical: { au: 1.524, diameterKm: 6792, periodYears: 1.881, rotationHours: 24.6, axialTiltDeg: 25.2, eccentricity: 0.094 },
        moons: { count: 2, asOf: '2026' }
    },
    {
        id: 'jupiter',
        name: 'Sao Mộc',
        color: '#D8C9A3',
        size: 50,
        orbitDistance: 420,
        orbitSpeed: 120,
        description: 'Hành tinh lớn nhất hệ mặt trời, một khối khí khổng lồ. Vết Đỏ Lớn là một cơn bão đã tồn tại hàng trăm năm.',
        facts: [
            'Sao Mộc có thể chứa hơn 1.300 Trái Đất bên trong nó.',
            'Nó có hơn 100 mặt trăng đã được công nhận (tính đến năm 2026) — và con số vẫn đang tăng!',
            'Quay nhanh nhất trong các hành tinh (1 ngày < 10 giờ).'
        ],
        temperature: '-145°C (đỉnh mây)',
        distanceFromSun: '778 triệu km',
        diameter: '139,820 km',
        gravity: '24.79 m/s²',
        gradientColors: ['#FFE0B2', '#D8C9A3', '#A8754F', '#5D4037'],
        physical: { au: 5.204, diameterKm: 142984, periodYears: 11.86, rotationHours: 9.9, axialTiltDeg: 3.1, eccentricity: 0.049 },
        moons: { count: 101, asOf: '3/2026' }
    },
    {
        id: 'saturn',
        name: 'Sao Thổ',
        color: '#DCC49A',
        size: 45,
        orbitDistance: 520,
        orbitSpeed: 200,
        description: 'Nổi tiếng với hệ thống vành đai lộng lẫy làm từ băng và đá. Là hành tinh nhẹ nhất, có thể nổi trên mặt nước.',
        facts: [
            'Vành đai rộng hàng trăm nghìn km nhưng mỏng đến kinh ngạc — phần chính chỉ dày khoảng 10 mét!',
            'Có 274 mặt trăng đã được xác nhận (tính đến 2025) — nhiều nhất hệ Mặt Trời!',
            'Gió trên Sao Thổ cực mạnh, lên tới 1.800 km/h.',
            'Có mặt trăng Titan với khí quyển dày đặc.'
        ],
        temperature: '-178°C',
        distanceFromSun: '1.4 tỷ km',
        diameter: '116,460 km',
        gravity: '10.44 m/s²',
        gradientColors: ['#FFF3D6', '#DCC49A', '#C9A86A'],
        ring: {
            color: 'rgba(220, 196, 154, 0.5)',
            size: 1.6
        },
        physical: { au: 9.573, diameterKm: 120536, periodYears: 29.46, rotationHours: 10.7, axialTiltDeg: 26.7, eccentricity: 0.052 },
        moons: { count: 274, asOf: '2025' }
    },
    {
        id: 'uranus',
        name: 'Sao Thiên Vương',
        color: '#ACD8D8',
        size: 30,
        orbitDistance: 620,
        orbitSpeed: 400,
        description: 'Hành tinh băng khổng lồ, có màu xanh ngọc nhạt nhờ khí Methane. Nó quay "nằm ngang" so với quỹ đạo.',
        facts: [
            'Là hành tinh có khí quyển lạnh nhất hệ mặt trời (-224°C).',
            'Quay nghiêng 98 độ, như đang lăn trên quỹ đạo.',
            'Được phát hiện bằng kính thiên văn vào năm 1781.',
            'Có 29 mặt trăng (tính đến 2025) — đặt tên theo nhân vật kịch Shakespeare!'
        ],
        temperature: '-224°C',
        distanceFromSun: '2.9 tỷ km',
        diameter: '50,724 km',
        gravity: '8.69 m/s²',
        gradientColors: ['#E0F7F7', '#ACD8D8', '#6FB5B5'],
        physical: { au: 19.165, diameterKm: 51118, periodYears: 84.0, rotationHours: -17.2, axialTiltDeg: 97.8, eccentricity: 0.047 },
        moons: { count: 29, asOf: '8/2025' }
    },
    {
        id: 'neptune',
        name: 'Sao Hải Vương',
        color: '#8FBDD3',
        size: 29,
        orbitDistance: 720,
        orbitSpeed: 600,
        description: 'Hành tinh xa nhất, đầy gió bão và băng giá. Màu xanh nhạt dịu, gần giống Sao Thiên Vương nhưng xanh hơn một chút.',
        facts: [
            'Một năm ở đây dài bằng 165 năm Trái Đất.',
            'Có những cơn gió nhanh nhất hệ mặt trời (2.100 km/h).',
            'Mặt trăng Triton của nó phun ra băng nitơ.',
            'Ảnh cũ của NASA làm Sao Hải Vương trông xanh đậm hơn thực tế — năm 2024 các nhà khoa học đã "chỉnh màu" lại!'
        ],
        temperature: '-214°C',
        distanceFromSun: '4.5 tỷ km',
        diameter: '49,244 km',
        gravity: '11.15 m/s²',
        gradientColors: ['#C6DEE9', '#8FBDD3', '#5B8DB0'],
        physical: { au: 30.181, diameterKm: 49528, periodYears: 164.8, rotationHours: 16.1, axialTiltDeg: 28.3, eccentricity: 0.010 },
        moons: { count: 16, asOf: '2026' }
    }
];
