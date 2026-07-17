// Dữ liệu địa tầng (cấu trúc bên trong) các thiên thể — cho phân hệ "Cắt hành tinh".
// Nguồn: NASA science.nasa.gov + NSSDC, viết lại thân thiện với trẻ em.
// LƯU Ý: radiusFrac của các lớp MỎNG (vỏ hành tinh đá, khí quyển) đã được
// phóng to có chủ ý để trẻ nhìn thấy được — tỷ lệ thật ghi trong `thickness`.

export interface PlanetLayer {
    id: string;
    name: string;          // ví dụ "Lõi trong"
    color: string;         // màu mặt cắt (hex)
    radiusFrac: number;    // mép NGOÀI của lớp, theo tỷ lệ bán kính hành tinh (0..1)
    thickness: string;     // độ dày / kích thước thật, ví dụ "~2.440 km"
    temperature: string;
    description: string;   // 1-2 câu, giọng kể cho trẻ
    funFact?: string;
}

export interface CutawayBody {
    id: string;            // khớp id trong solarData + tên file texture
    name: string;
    tagline: string;       // 1 câu "chốt hạ" về ruột thiên thể
    layers: PlanetLayer[]; // sắp xếp từ TRONG ra NGOÀI
}

export const CUTAWAY_BODIES: CutawayBody[] = [
    {
        id: 'sun',
        name: 'Mặt Trời',
        tagline: 'Một nhà máy năng lượng khổng lồ đang "nấu" hydro thành heli!',
        layers: [
            {
                id: 'core', name: 'Lõi', color: '#FFFDE7', radiusFrac: 0.25,
                thickness: '~175.000 km', temperature: '15 triệu °C',
                description: 'Nhà máy năng lượng của cả Hệ Mặt Trời! Ở đây các hạt hydro va đập và hợp nhất thành heli, giải phóng năng lượng khổng lồ.',
                funFact: 'Năng lượng sinh ra ở lõi hôm nay phải mất cả trăm nghìn năm mới "chen" được ra tới bề mặt!'
            },
            {
                id: 'radiative', name: 'Vùng bức xạ', color: '#FFC93D', radiusFrac: 0.7,
                thickness: '~315.000 km', temperature: '2 – 7 triệu °C',
                description: 'Năng lượng từ lõi đi qua vùng này dưới dạng ánh sáng, bị dội qua dội lại hàng nghìn tỷ lần như trong mê cung.'
            },
            {
                id: 'convective', name: 'Vùng đối lưu', color: '#FF8A3D', radiusFrac: 0.98,
                thickness: '~200.000 km', temperature: '2 triệu → 5.500°C',
                description: 'Khí nóng sôi sùng sục như nồi cháo khổng lồ: dòng nóng nổi lên bề mặt, dòng nguội hơn chìm xuống dưới.'
            },
            {
                id: 'photosphere', name: 'Quang quyển (bề mặt)', color: '#FDB813', radiusFrac: 1,
                thickness: '~500 km', temperature: '5.500°C',
                description: 'Lớp phát sáng mà ta nhìn thấy từ Trái Đất. Trên đó có các vết đen Mặt Trời — những vùng "nguội" hơn xung quanh.',
                funFact: 'Nhiều vết đen Mặt Trời còn to hơn cả Trái Đất của chúng ta!'
            }
        ]
    },
    {
        id: 'mercury',
        name: 'Sao Thủy',
        tagline: 'Hành tinh bé nhất nhưng giấu một quả cầu sắt khổng lồ bên trong!',
        layers: [
            {
                id: 'core', name: 'Lõi sắt khổng lồ', color: '#FFA726', radiusFrac: 0.8,
                thickness: 'bán kính ~2.000 km', temperature: '~1.600 – 2.000°C',
                description: 'Quả cầu sắt chiếm gần hết hành tinh! So với kích thước của mình, Sao Thủy có lõi lớn nhất Hệ Mặt Trời.',
                funFact: 'Nếu Sao Thủy là quả đào thì lõi của nó là cái hạt to gần bằng cả quả!'
            },
            {
                id: 'mantle', name: 'Lớp phủ đá', color: '#A1887F', radiusFrac: 0.95,
                thickness: '~400 km', temperature: '~1.000°C',
                description: 'Lớp đá mỏng bao quanh lõi. Vì lõi quá to nên "chăn đá" này của Sao Thủy mỏng hơn hẳn các hành tinh khác.'
            },
            {
                id: 'crust', name: 'Vỏ', color: '#6D4C41', radiusFrac: 1,
                thickness: '~35 km (đã phóng to để dễ nhìn)', temperature: '-180°C đến 430°C',
                description: 'Bề mặt đầy hố va chạm giống Mặt Trăng. Ban ngày nóng như lò nướng, ban đêm lạnh cóng vì không có khí quyển giữ ấm.'
            }
        ]
    },
    {
        id: 'venus',
        name: 'Sao Kim',
        tagline: 'Bên trong khá giống Trái Đất — nhưng bề mặt là "lò nướng" 460°C!',
        layers: [
            {
                id: 'core', name: 'Lõi sắt - niken', color: '#FFB74D', radiusFrac: 0.5,
                thickness: 'bán kính ~3.000 km', temperature: '~4.000 – 5.000°C',
                description: 'Quả cầu kim loại nóng rực, gần bằng lõi Trái Đất. Chưa tàu nào đo được tận nơi nên các nhà khoa học vẫn đang tìm hiểu thêm.'
            },
            {
                id: 'mantle', name: 'Lớp phủ đá nóng', color: '#F4511E', radiusFrac: 0.95,
                thickness: '~3.000 km', temperature: '~1.200 – 3.700°C',
                description: 'Đá nóng chảy dẻo quánh. Chính lớp này nuôi hàng chục nghìn ngọn núi lửa trên Sao Kim — nhiều núi lửa nhất Hệ Mặt Trời!'
            },
            {
                id: 'crust', name: 'Vỏ', color: '#8D6E63', radiusFrac: 1,
                thickness: '~20 – 50 km (đã phóng to)', temperature: '~460°C',
                description: 'Bề mặt nóng nhất trong các hành tinh, đủ nóng để nung chảy chì — vì khí quyển dày giữ nhiệt như một cái chăn bông khổng lồ.',
                funFact: 'Trên Sao Kim, một ngày còn dài hơn một năm — nó tự quay chậm ơi là chậm!'
            }
        ]
    },
    {
        id: 'earth',
        name: 'Trái Đất',
        tagline: 'Ngôi nhà của chúng ta là một "củ hành" 4 lớp nóng rực bên trong!',
        layers: [
            {
                id: 'inner-core', name: 'Lõi trong', color: '#FFF176', radiusFrac: 0.19,
                thickness: 'bán kính ~1.220 km', temperature: '~5.200°C',
                description: 'Quả cầu sắt-niken đặc cứng ở chính giữa Trái Đất.',
                funFact: 'Nóng ngang bề mặt Mặt Trời nhưng vẫn RẮN — vì bị cả hành tinh đè lên ép chặt khủng khiếp!'
            },
            {
                id: 'outer-core', name: 'Lõi ngoài', color: '#FFA726', radiusFrac: 0.55,
                thickness: '~2.260 km', temperature: '~4.000 – 5.000°C',
                description: 'Kim loại LỎNG chảy cuồn cuộn quanh lõi trong, tạo ra từ trường của Trái Đất.',
                funFact: 'Nhờ lớp này mà la bàn chỉ đúng hướng Bắc và Trái Đất có "lá chắn" chặn gió Mặt Trời!'
            },
            {
                id: 'mantle', name: 'Lớp phủ', color: '#E64A19', radiusFrac: 0.94,
                thickness: '~2.900 km — lớp dày nhất', temperature: '~1.000 – 3.700°C',
                description: 'Đá nóng dẻo như kẹo bơ, chảy rất rất chậm. Dung nham phun ra từ núi lửa chính là "hàng xách tay" từ lớp này.'
            },
            {
                id: 'crust', name: 'Vỏ Trái Đất', color: '#795548', radiusFrac: 1,
                thickness: '5 – 70 km (đã phóng to)', temperature: 'mát mẻ dễ chịu',
                description: 'Lớp đất đá mỏng nơi có núi, biển, rừng và tất cả chúng ta đang sống.',
                funFact: 'So với cả Trái Đất, lớp vỏ mỏng như... vỏ quả táo so với quả táo!'
            }
        ]
    },
    {
        id: 'mars',
        name: 'Sao Hỏa',
        tagline: 'Hành tinh đỏ có lõi lỏng mà tàu InSight đã "nghe" thấy bằng động đất!',
        layers: [
            {
                id: 'core', name: 'Lõi lỏng', color: '#FFB74D', radiusFrac: 0.5,
                thickness: 'bán kính ~1.830 km', temperature: '~1.500 – 2.000°C',
                description: 'Lõi sắt lỏng pha lưu huỳnh, nhẹ và "loãng" hơn lõi Trái Đất.',
                funFact: 'Tàu InSight của NASA đã lắng nghe các trận động đất Sao Hỏa để "chụp X-quang" được cái lõi này đấy!'
            },
            {
                id: 'mantle', name: 'Lớp phủ', color: '#D84315', radiusFrac: 0.94,
                thickness: '~1.500 km', temperature: '~1.500°C',
                description: 'Lớp đá từng rất năng động — đã từng nuôi ngọn núi lửa Olympus Mons cao gấp gần 3 lần đỉnh Everest, nay đã nguội dần.'
            },
            {
                id: 'crust', name: 'Vỏ đỏ', color: '#B25940', radiusFrac: 1,
                thickness: '~24 – 70 km (đã phóng to)', temperature: 'trung bình -63°C',
                description: 'Bụi đá chứa nhiều sắt bị "gỉ sét" nên có màu đỏ cam — vì thế Sao Hỏa được gọi là Hành Tinh Đỏ.'
            }
        ]
    },
    {
        id: 'jupiter',
        name: 'Sao Mộc',
        tagline: 'KHÔNG có mặt đất để đứng — càng xuống sâu, khí càng bị ép đặc lại!',
        layers: [
            {
                id: 'core', name: 'Lõi "mờ" bí ẩn', color: '#FFE082', radiusFrac: 0.15,
                thickness: 'chưa ai biết chắc!', temperature: 'có thể tới ~20.000°C',
                description: 'Các nhà khoa học tin rằng có một lõi đá-băng bị "hòa loãng" dần vào lớp bên trên. Tàu Juno của NASA vẫn đang điều tra.',
                funFact: 'Sao Mộc nặng gấp đôi tất cả các hành tinh khác cộng lại!'
            },
            {
                id: 'metallic', name: 'Hydro kim loại lỏng', color: '#5C6BC0', radiusFrac: 0.75,
                thickness: '~40.000 km', temperature: '~6.000 – 20.000°C',
                description: 'Bị ép mạnh đến mức khí hydro biến thành kim loại lỏng dẫn điện! Nhờ nó Sao Mộc có từ trường mạnh nhất trong các hành tinh.'
            },
            {
                id: 'molecular', name: 'Hydro lỏng', color: '#90CAF9', radiusFrac: 0.96,
                thickness: '~20.000 km', temperature: '~2.000°C',
                description: 'Một "đại dương" hydro lỏng khổng lồ, không có bờ và không có đáy rõ ràng — khí bên trên cứ đặc dần thành lỏng.'
            },
            {
                id: 'clouds', name: 'Khí quyển mây', color: '#D7A86E', radiusFrac: 1,
                thickness: '~1.000 km (đã phóng to)', temperature: '-145°C',
                description: 'Các dải mây màu nâu cam cuộn xoáy. Vết Đỏ Lớn là một cơn bão đã thổi hàng trăm năm, to hơn cả Trái Đất!'
            }
        ]
    },
    {
        id: 'saturn',
        name: 'Sao Thổ',
        tagline: 'Ruột gần giống Sao Mộc, nhưng "xốp" đến mức có thể nổi trên nước!',
        layers: [
            {
                id: 'core', name: 'Lõi đá', color: '#FFCC80', radiusFrac: 0.22,
                thickness: 'bán kính ~12.000 km', temperature: '~11.700°C',
                description: 'Lõi đá-băng nóng hơn cả bề mặt Mặt Trời, có thể cũng "loãng" và mờ dần như lõi Sao Mộc.'
            },
            {
                id: 'metallic', name: 'Hydro kim loại lỏng', color: '#7986CB', radiusFrac: 0.5,
                thickness: '~16.000 km', temperature: '~6.000°C',
                description: 'Lớp hydro bị ép thành kim loại lỏng, tạo ra từ trường cho Sao Thổ — giống người anh em Sao Mộc nhưng mỏng hơn.'
            },
            {
                id: 'molecular', name: 'Hydro lỏng', color: '#B3E5FC', radiusFrac: 0.95,
                thickness: '~26.000 km', temperature: '~1.000°C',
                description: 'Đại dương hydro và heli lỏng mênh mông. Sao Thổ nhẹ đến bất ngờ vì chủ yếu làm từ hai chất khí nhẹ nhất vũ trụ.',
                funFact: 'Nếu có một bể bơi đủ to, Sao Thổ sẽ NỔI lềnh bềnh trên mặt nước!'
            },
            {
                id: 'clouds', name: 'Khí quyển mây', color: '#DDC08A', radiusFrac: 1,
                thickness: '~1.000 km (đã phóng to)', temperature: '-178°C',
                description: 'Các dải mây vàng nhạt êm đềm hơn Sao Mộc. Gió ở đây thổi tới 1.800 km/h — nhanh gấp 5 lần siêu bão mạnh nhất Trái Đất.'
            }
        ]
    },
    {
        id: 'uranus',
        name: 'Sao Thiên Vương',
        tagline: 'Một "đại dương băng nóng" khổng lồ — nơi có thể có mưa kim cương!',
        layers: [
            {
                id: 'core', name: 'Lõi đá', color: '#BCAAA4', radiusFrac: 0.2,
                thickness: 'bán kính ~5.000 km', temperature: '~5.000°C',
                description: 'Lõi đá nhỏ, chỉ nặng bằng nửa Trái Đất — bé xíu so với cả hành tinh to đùng bên ngoài.'
            },
            {
                id: 'ice-mantle', name: '"Đại dương" băng nóng', color: '#4DD0E1', radiusFrac: 0.8,
                thickness: '~15.000 km', temperature: '~2.000 – 5.000°C',
                description: 'Nước, amoniac và mêtan đặc sánh như si-rô. Nóng rực nhưng các nhà thiên văn vẫn gọi là "băng" — cách gọi vui của giới khoa học!',
                funFact: 'Sâu trong lớp này, mêtan có thể bị ép thành... những hạt KIM CƯƠNG rơi như mưa!'
            },
            {
                id: 'atmosphere', name: 'Khí quyển mêtan', color: '#7FD4DB', radiusFrac: 1,
                thickness: '~5.000 km', temperature: 'tới -224°C — lạnh nhất Hệ Mặt Trời',
                description: 'Khí mêtan "nuốt" mất ánh sáng đỏ nên hành tinh có màu xanh ngọc dịu. Sao Thiên Vương còn nằm... lăn nghiêng khi bay quanh Mặt Trời!'
            }
        ]
    },
    {
        id: 'neptune',
        name: 'Sao Hải Vương',
        tagline: 'Hành tinh xa nhất, gió nhanh nhất — và cũng có thể mưa kim cương!',
        layers: [
            {
                id: 'core', name: 'Lõi đá', color: '#BCAAA4', radiusFrac: 0.25,
                thickness: 'bán kính ~6.000 km', temperature: '~5.100°C',
                description: 'Lõi đá-kim loại nặng cỡ Trái Đất, bị chôn dưới một đại dương băng sâu hàng chục nghìn cây số.'
            },
            {
                id: 'ice-mantle', name: 'Lớp băng nóng', color: '#26C6DA', radiusFrac: 0.85,
                thickness: '~17.000 km', temperature: '~2.000 – 5.000°C',
                description: 'Giống Sao Thiên Vương: nước, amoniac và mêtan đặc quánh, vừa nóng vừa bị ép chặt.',
                funFact: 'Ở đây kim cương cũng có thể rơi như mưa — hành tinh xa nhất lại giàu "đá quý" nhất!'
            },
            {
                id: 'atmosphere', name: 'Khí quyển xanh thẳm', color: '#6FA8DC', radiusFrac: 1,
                thickness: '~5.000 km', temperature: '-214°C',
                description: 'Màu xanh biếc đậm do khí mêtan. Gió ở đây gầm rú tới 2.100 km/h — nhanh nhất trong toàn bộ Hệ Mặt Trời!'
            }
        ]
    }
];

export function getCutawayBody(id: string): CutawayBody | undefined {
    return CUTAWAY_BODIES.find(b => b.id === id);
}
