
export interface OrganelleDetail {
    summary: string;
    structure: string;
    function: string;
    location: string;
    analogy: string;
}

export interface Organelle {
    id: string;
    name: string;
    nameEn: string;
    details: OrganelleDetail;
    funFact: string;
    color: string;
    iconPath?: string; // Optional custom SVG path
}

export interface CellType {
    id: 'animal' | 'plant' | 'bacteria';
    name: string;
    nameEn?: string;
    description: string;
    organelles: Organelle[];
    features: string[];
}

export const CELL_DATA: CellType[] = [
    {
        id: 'animal',
        name: 'Tế Bào Động Vật',
        description: 'Đơn vị cơ bản cấu tạo nên cơ thể động vật và con người.',
        features: ['Màng mềm dẻo', 'Nhiều ty thể', 'Không có lục lạp'],
        organelles: [
            {
                id: 'nucleus',
                name: 'Nhân Tế Bào',
                nameEn: 'Nucleus',
                color: '#A855F7', // Purple
                details: {
                    summary: 'Trung tâm điều khiển của tế bào, chứa thông tin di truyền.',
                    structure: 'Hình cầu, được bao bọc bởi lớp màng nhân kép có các lỗ nhỏ.',
                    function: 'Lưu trữ DNA và điều phối mọi hoạt động của tế bào như sinh trưởng, trao đổi chất.',
                    location: 'Thường nằm ở trung tâm tế bào.',
                    analogy: 'Giống như "Bộ não" hoặc "Thư viện trung tâm" của thành phố.'
                },
                funFact: 'Nhân chứa khoảng 2 mét DNA được cuộn chặt lại siêu nhỏ!'
            },
            {
                id: 'er',
                name: 'Lưới Nội Chất',
                nameEn: 'Endoplasmic Reticulum',
                color: '#F472B6', // Pink
                details: {
                    summary: 'Hệ thống giao thông nội bộ của tế bào.',
                    structure: 'Mạng lưới các túi dẹt và ống thông với nhau. Có 2 loại: Hạt (gắn Ribosome) và Trơn.',
                    function: 'Tổng hợp Protein (loại Hạt) và Lipid/Khử độc (loại Trơn), vận chuyển các chất.',
                    location: 'Bao quanh nhân tế bào.',
                    analogy: 'Giống như "Băng chuyền sản xuất" và "Hệ thống đường cao tốc".'
                },
                funFact: 'Lưới nội chất hạt trông "sần sùi" là do hàng ngàn hạt Ribosome bám trên bề mặt.'
            },
            {
                id: 'golgi',
                name: 'Bộ Máy Golgi',
                nameEn: 'Golgi Apparatus',
                color: '#FB923C', // Orange
                details: {
                    summary: 'Nơi đóng gói và phân phối sản phẩm của tế bào.',
                    structure: 'Chồng túi màng dẹt xếp lớp lên nhau (giống chồng bánh kếp).',
                    function: 'Sửa đổi, đóng gói protein và lipid vào các túi tiết để gửi đi nơi khác.',
                    location: 'Gần lưới nội chất.',
                    analogy: 'Giống như "Bưu điện" hoặc "Trung tâm đóng gói hàng hóa".'
                },
                funFact: 'Bộ máy Golgi được đặt theo tên của nhà bác học Camillo Golgi, người phát hiện ra nó năm 1898.'
            },
            {
                id: 'mitochondria',
                name: 'Ty Thể',
                nameEn: 'Mitochondria',
                color: '#EF4444', // Red
                details: {
                    summary: 'Nhà máy sản xuất năng lượng cho tế bào hoạt động.',
                    structure: 'Hình hạt đậu, có 2 lớp màng. Màng trong gấp nếp tạo thành các mào.',
                    function: 'Thực hiện hô hấp tế bào, chuyển hóa đường thành năng lượng (ATP).',
                    location: 'Trôi nổi tự do trong tế bào chất.',
                    analogy: 'Giống như "Nhà máy điện" cung cấp điện cho cả thành phố.'
                },
                funFact: 'Ty thể có DNA riêng và có thể tự nhân đôi độc lập với tế bào!'
            },
            {
                id: 'lysosome',
                name: 'Tiêu Thể',
                nameEn: 'Lysosome',
                color: '#60A5FA', // Blue
                details: {
                    summary: 'Nhà máy xử lý rác thải của tế bào.',
                    structure: 'Túi cầu nhỏ chứa các enzyme tiêu hóa mạnh.',
                    function: 'Phân hủy các chất thải, thức ăn thừa và cả các bào quan già cỗi.',
                    location: 'Rải rác trong tế bào chất.',
                    analogy: 'Giống như "Xe rác" hoặc "Nhà máy tái chế".'
                },
                funFact: 'Nếu tiêu thể bị vỡ, các enzyme bên trong có thể tiêu hủy luôn cả tế bào (tự sát)!'
            },
            {
                id: 'centrosome',
                name: 'Trung Thể',
                nameEn: 'Centrosome',
                color: '#FDE047', // Yellow
                details: {
                    summary: 'Trung tâm tổ chức ống vi thể, quan trọng khi tế bào phân chia.',
                    structure: 'Gồm 2 trung tử xếp vuông góc với nhau.',
                    function: 'Tham gia vào quá trình phân chia tế bào (nguyên phân), tạo thoi vô sắc.',
                    location: 'Gần nhân tế bào.',
                    analogy: 'Giống như "Người điều phối" giao thông.'
                },
                funFact: 'Tế bào thần kinh của người trưởng thành không có trung thể nên không thể phân chia.'
            },
            {
                id: 'cytoplasms', // Tế bào chất
                name: 'Tế Bào Chất',
                nameEn: 'Cytoplasm',
                color: '#CBD5E1', // Slate
                details: {
                    summary: 'Môi trường dạng keo lấp đầy không gian bên trong tế bào.',
                    structure: 'Dạng dịch keo (cytosol) chứa nước, muối khoáng và các phân tử hữu cơ.',
                    function: 'Nơi diễn ra hầu hết các phản ứng hóa học và giữ các bào quan ở đúng vị trí.',
                    location: 'Toàn bộ không gian bên trong màng tế bào (trừ nhân).',
                    analogy: 'Giống như "Bầu không khí" hoặc "Hệ thống đường xá" nơi mọi thứ diễn ra.'
                },
                funFact: 'Tế bào chất luôn chuyển động không ngừng (chuyển động dòng chất nguyên sinh).'
            }
        ]
    },
    {
        id: 'plant',
        name: 'Tế Bào Thực Vật',
        description: 'Đơn vị cấu tạo nên cây cối, có khả năng quang hợp.',
        features: ['Có thành tế bào cứng', 'Có lục lạp', 'Không bào lớn'],
        organelles: [
            {
                id: 'chloroplast',
                name: 'Lục Lạp',
                nameEn: 'Chloroplast',
                color: '#22C55E', // Green
                details: {
                    summary: 'Bào quan đặc biệt chỉ có ở thực vật, giúp cây quang hợp.',
                    structure: 'Hình bầu dục, chứa chất diệp lục màu xanh lá cây.',
                    function: 'Hấp thụ ánh sáng mặt trời để tổng hợp chất hữu cơ (đường) từ nước và khí CO2.',
                    location: 'Nằm trong tế bào chất, thường tập trung ở bề mặt lá.',
                    analogy: 'Giống như "Tấm pin năng lượng mặt trời" kết hợp "Nhà bếp".'
                },
                funFact: 'Nhờ có lục lạp mà cây xanh làm sạch không khí và tạo ra oxy cho chúng ta thở.'
            },
            {
                id: 'cell_wall',
                name: 'Thành Tế Bào',
                nameEn: 'Cell Wall',
                color: '#166534', // Dark Green
                details: {
                    summary: 'Lớp vỏ cứng bao bên ngoài màng tế bào thực vật.',
                    structure: 'Cấu tạo chủ yếu từ cellulose sợi bền chắc.',
                    function: 'Bảo vệ tế bào, tạo khung xương cứng cáp giúp cây đứng thẳng.',
                    location: 'Lớp ngoài cùng của tế bào thực vật.',
                    analogy: 'Giống như "Bức tường thành" hoặc "Bộ khung xương".'
                },
                funFact: 'Thành tế bào là lý do tại sao gỗ lại cứng và rau quả lại giòn.'
            },
            {
                id: 'vacuole',
                name: 'Không Bào Lớn',
                nameEn: 'Large Vacuole',
                color: '#0EA5E9', // Sky Blue
                details: {
                    summary: 'Túi chứa nước khổng lồ chiếm phần lớn thể tích tế bào.',
                    structure: 'Một túi màng lớn chứa đầy dịch bào (nước và chất tan).',
                    function: 'Dự trữ nước, chất dinh dưỡng và duy trì áp suất giúp tế bào căng phồng.',
                    location: 'Trung tâm tế bào thực vật, đẩy nhân và các bào quan ra sát màng.',
                    analogy: 'Giống như "Kho chứa nước" hoặc "Két sắt" của tế bào.'
                },
                funFact: 'Khi bạn quên tưới cây, không bào mất nước và teo lại làm cây bị héo.'
            },
            {
                id: 'nucleus',
                name: 'Nhân Tế Bào',
                nameEn: 'Nucleus',
                color: '#A855F7', // Purple
                details: {
                    summary: 'Trung tâm điều khiển của tế bào thực vật.',
                    structure: 'Hình cầu, bị đẩy sát màng do không bào lớn chiếm chỗ.',
                    function: 'Chứa DNA, điều khiển mọi hoạt động sống của tế bào.',
                    location: 'Nằm sát màng tế bào, thường ở góc.',
                    analogy: 'Giống như "Bộ não" của tế bào.'
                },
                funFact: 'Trong tế bào thực vật, nhân thường bị đẩy sang một bên vì không bào quá to!'
            },
            {
                id: 'mitochondria',
                name: 'Ty Thể',
                nameEn: 'Mitochondria',
                color: '#EF4444', // Red
                details: {
                    summary: 'Nhà máy năng lượng, giúp tế bào hô hấp.',
                    structure: 'Hình hạt đậu với màng trong gấp nếp.',
                    function: 'Chuyển hóa đường thành ATP - năng lượng cho tế bào.',
                    location: 'Rải rác trong tế bào chất.',
                    analogy: 'Giống như "Nhà máy điện" cho thành phố.'
                },
                funFact: 'Tế bào thực vật vẫn cần ty thể để hô hấp vào ban đêm khi không có ánh sáng!'
            },
            {
                id: 'er',
                name: 'Lưới Nội Chất',
                nameEn: 'Endoplasmic Reticulum',
                color: '#F472B6', // Pink
                details: {
                    summary: 'Mạng lưới vận chuyển và sản xuất của tế bào.',
                    structure: 'Hệ thống màng nối liền với nhân và bộ máy Golgi.',
                    function: 'Tổng hợp protein và lipid, vận chuyển vật chất.',
                    location: 'Bao quanh nhân, lan rộng trong tế bào chất.',
                    analogy: 'Giống như "Băng chuyền sản xuất" trong nhà máy.'
                },
                funFact: 'Lưới nội chất "hạt" có những chấm nhỏ là Ribosome - nơi sản xuất protein.'
            },
            {
                id: 'golgi',
                name: 'Bộ Máy Golgi',
                nameEn: 'Golgi Apparatus',
                color: '#FB923C', // Orange
                details: {
                    summary: 'Nơi đóng gói và phân phối sản phẩm.',
                    structure: 'Các túi dẹt xếp chồng lên nhau.',
                    function: 'Chế biến, đóng gói và gửi protein đến nơi cần.',
                    location: 'Gần nhân và lưới nội chất.',
                    analogy: 'Giống như "Bưu điện" hoặc "Trung tâm phân phối hàng".'
                },
                funFact: 'Bộ máy Golgi đặc biệt quan trọng trong việc tạo thành tế bào mới!'
            }
        ]
    },
    {
        id: 'bacteria',
        name: 'Vi Khuẩn',
        nameEn: 'Bacteria',
        description: 'Sinh vật đơn bào nhỏ bé và đơn giản nhất.',
        features: ['Không có nhân hoàn chỉnh', 'Có roi bơi', 'Vỏ nhầy'],
        organelles: [
            {
                id: 'nucleoid',
                name: 'Vùng Nhân',
                nameEn: 'Nucleoid',
                color: '#F59E0B', // Amber
                details: {
                    summary: 'Khu vực chứa vật chất di truyền của vi khuẩn (do chưa có màng nhân).',
                    structure: 'Một phân tử DNA vòng trần, xoắn lại.',
                    function: 'Chứa thông tin di truyền điều khiển mọi hoạt động sống.',
                    location: 'Nằm lơ lửng trong tế bào chất.',
                    analogy: 'Giống như "Cuộn dây chỉ rối" nằm giữa phòng.'
                },
                funFact: 'DNA của vi khuẩn không được bảo vệ trong "két sắt" (nhân) như động vật.'
            },
            {
                id: 'flagellum',
                name: 'Roi (Tiên Mao)',
                nameEn: 'Flagellum',
                color: '#EAB308', // Yellow
                details: {
                    summary: 'Cơ quan giúp vi khuẩn di chuyển.',
                    structure: 'Sợi dài, mảnh như cái đuôi, có thể xoay tròn.',
                    function: 'Xoay như chân vịt tàu thủy để đẩy vi khuẩn bơi về phía trước.',
                    location: 'Gắn ở đuôi hoặc xung quanh tế bào.',
                    analogy: 'Giống như "Động cơ chân vịt" của tàu ngầm.'
                },
                funFact: 'Một số vi khuẩn có thể bơi cực nhanh nhờ quay roi này với tốc độ hàng trăm vòng mỗi giây!'
            },
            {
                id: 'pili',
                name: 'Lông (Pili)',
                nameEn: 'Pili/Fimbriae',
                color: '#D97706', // Orange-brown
                details: {
                    summary: 'Những sợi lông ngắn mọc xung quanh thân vi khuẩn.',
                    structure: 'Các sợi protein ngắn, thẳng, mảnh hơn roi.',
                    function: 'Giúp vi khuẩn bám vào bề mặt hoặc trao đổi vật chất với vi khuẩn khác.',
                    location: 'Mọc rải rác hoặc phủ khắp bề mặt tế bào.',
                    analogy: 'Giống như "Móng vuốt" hoặc "Tay bám" của vi khuẩn.'
                },
                funFact: 'Một số vi khuẩn dùng pili để "bắt tay" và trao đổi DNA với nhau!'
            },
            {
                id: 'cytoplasm_bac',
                name: 'Tế Bào Chất',
                nameEn: 'Cytoplasm',
                color: '#FBBF24', // Yellow
                details: {
                    summary: 'Chất keo lỏng chứa đầy bên trong tế bào.',
                    structure: 'Dịch keo chứa nước, enzyme, ribosome và các chất dinh dưỡng.',
                    function: 'Môi trường diễn ra các phản ứng hóa học và trao đổi chất.',
                    location: 'Toàn bộ không gian bên trong màng tế bào.',
                    analogy: 'Giống như "Nước biển" chứa đầy bên trong tàu ngầm.'
                },
                funFact: 'Tế bào chất của vi khuẩn chứa hàng nghìn ribosome để sản xuất protein!'
            },
            {
                id: 'ribosome',
                name: 'Ribosome',
                nameEn: 'Ribosome',
                color: '#A3E635', // Lime green
                details: {
                    summary: 'Các hạt nhỏ li ti chịu trách nhiệm sản xuất protein.',
                    structure: 'Hạt tròn nhỏ cấu tạo từ RNA và protein.',
                    function: 'Đọc mã di truyền và lắp ráp các amino acid thành protein.',
                    location: 'Rải rác khắp tế bào chất.',
                    analogy: 'Giống như "Nhà máy lắp ráp" sản xuất linh kiện cho thành phố.'
                },
                funFact: 'Ribosome của vi khuẩn nhỏ hơn của động vật, đó là lý do thuốc kháng sinh có thể tấn công chúng mà không hại ta!'
            },
            {
                id: 'capsule',
                name: 'Vỏ Nhầy',
                nameEn: 'Capsule',
                color: '#FB923C', // Orange light
                details: {
                    summary: 'Lớp bảo vệ dày, nhầy bao bọc bên ngoài cùng.',
                    structure: 'Lớp polysaccharide hoặc protein nhầy, dính.',
                    function: 'Bảo vệ vi khuẩn khỏi bạch cầu, giữ ẩm, giúp bám vào bề mặt.',
                    location: 'Lớp ngoài cùng, bao quanh thành tế bào.',
                    analogy: 'Giống như "Áo giáp thần kỳ" hoặc "Lớp keo bảo vệ".'
                },
                funFact: 'Vỏ nhầy giúp vi khuẩn "vô hình" trước hệ miễn dịch của chúng ta!'
            },
            {
                id: 'cell_wall_bac',
                name: 'Thành Tế Bào',
                nameEn: 'Cell Wall',
                color: '#92400E', // Brown
                details: {
                    summary: 'Lớp vỏ cứng bảo vệ bên trong vi khuẩn.',
                    structure: 'Cấu tạo từ peptidoglycan - loại đường đặc biệt kết hợp protein.',
                    function: 'Giữ hình dạng tế bào, chịu áp suất, bảo vệ khỏi vỡ.',
                    location: 'Nằm giữa màng sinh chất và vỏ nhầy.',
                    analogy: 'Giống như "Bộ xương ngoài" hoặc "Khung thép" của tòa nhà.'
                },
                funFact: 'Thuốc kháng sinh penicillin tấn công thành tế bào vi khuẩn, khiến chúng "nổ tung"!'
            },
            {
                id: 'plasma_membrane',
                name: 'Màng Sinh Chất',
                nameEn: 'Plasma Membrane',
                color: '#CA8A04', // Dark yellow
                details: {
                    summary: 'Lớp màng mỏng bao bọc tế bào chất.',
                    structure: 'Lớp phospholipid kép với protein xuyên màng.',
                    function: 'Kiểm soát vật chất ra vào, nơi diễn ra hô hấp và quang hợp (ở một số loài).',
                    location: 'Nằm ngay dưới thành tế bào.',
                    analogy: 'Giống như "Cổng bảo vệ" kiểm tra ai được vào ra.'
                },
                funFact: 'Màng sinh chất vi khuẩn không có cholesterol như động vật!'
            }
        ]
    }
];
