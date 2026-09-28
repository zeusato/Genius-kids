
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
    iconPath?: string;
    emoji: string;   // biểu tượng trên nhãn 3D — cho bé chưa đọc được
    short: string;   // "so sánh vui" rút gọn hiện dưới tên (Nhà máy điện, Bưu điện...)
    kid: string;     // bào quan tự giới thiệu ("Tớ là...") — câu đọc to cho bé nhỏ
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
                id: 'plasma_membrane',
                name: 'Màng Tế Bào',
                nameEn: 'Cell Membrane',
                color: '#7DD3FC', // Sky
                emoji: '🛡️',
                short: 'Cổng an ninh',
                kid: 'Tớ là màng tế bào! Tớ mềm dẻo như bong bóng và canh cổng, chỉ cho chất có ích đi vào.',
                details: {
                    summary: 'Lớp vỏ mỏng, mềm dẻo bao bọc và bảo vệ toàn bộ tế bào.',
                    structure: 'Lớp phospholipid kép với các protein xuyên màng, mềm và linh hoạt.',
                    function: 'Kiểm soát chất nào được ra vào tế bào, giữ các bào quan bên trong.',
                    location: 'Lớp ngoài cùng của tế bào động vật.',
                    analogy: 'Giống như "Cổng an ninh" quyết định ai được vào, ai phải ra.'
                },
                funFact: 'Màng tế bào động vật mềm dẻo nên tế bào có thể đổi hình dạng — khác hẳn thành cứng của thực vật!'
            },
            {
                id: 'nucleus',
                name: 'Nhân Tế Bào',
                nameEn: 'Nucleus',
                color: '#A855F7', // Purple
                emoji: '🧠',
                short: 'Trung tâm điều khiển',
                kid: 'Tớ là nhân tế bào — trung tâm điều khiển! Trong tớ cất cuốn sách hướng dẫn ADN.',
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
                emoji: '🛣️',
                short: 'Băng chuyền sản xuất',
                kid: 'Tớ là lưới nội chất — băng chuyền của nhà máy. Các bạn ribôxôm ngồi trên tớ làm protein.',
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
                emoji: '📦',
                short: 'Bưu điện đóng gói',
                kid: 'Tớ là bộ máy Golgi — bưu điện của tế bào. Tớ đóng gói hàng rồi gửi đi khắp nơi.',
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
                emoji: '⚡',
                short: 'Nhà máy điện',
                kid: 'Tớ là ty thể — nhà máy điện! Tớ biến đường thành năng lượng cho tế bào chạy nhảy.',
                details: {
                    summary: 'Nhà máy sản xuất năng lượng cho tế bào hoạt động.',
                    structure: 'Hình hạt đậu, có 2 lớp màng. Màng trong gấp nếp tạo thành các mào.',
                    function: 'Thực hiện hô hấp tế bào, chuyển hóa đường thành năng lượng (ATP).',
                    location: 'Trôi nổi tự do trong tế bào chất.',
                    analogy: 'Giống như "Nhà máy điện" cung cấp điện cho cả thành phố.'
                },
                funFact: 'Một tế bào thật có hàng trăm đến hàng nghìn ty thể, và chúng có DNA riêng để tự nhân đôi!'
            },
            {
                id: 'ribosome',
                name: 'Ribôxôm',
                nameEn: 'Ribosome',
                color: '#C084FC', // Light purple
                emoji: '🔧',
                short: 'Thợ lắp ráp protein',
                kid: 'Tớ là ribôxôm, bé xíu thôi nhưng chăm lắm: tớ lắp ráp protein cả ngày!',
                details: {
                    summary: 'Những hạt nhỏ li ti chuyên sản xuất protein cho tế bào.',
                    structure: 'Hạt gồm 2 phần (tiểu đơn vị lớn + nhỏ) ghép lại, làm từ RNA và protein.',
                    function: 'Đọc mã di truyền và lắp ráp các amino acid thành chuỗi protein.',
                    location: 'Trôi tự do trong tế bào chất và bám trên lưới nội chất hạt.',
                    analogy: 'Giống như "Dây chuyền lắp ráp" trong nhà máy sản xuất.'
                },
                funFact: 'Một tế bào có hàng triệu ribôxôm — chính chúng làm lưới nội chất hạt trông sần sùi!'
            },
            {
                id: 'lysosome',
                name: 'Tiêu Thể',
                nameEn: 'Lysosome',
                color: '#60A5FA', // Blue
                emoji: '♻️',
                short: 'Đội dọn rác',
                kid: 'Tớ là tiêu thể — đội dọn rác. Rác và đồ cũ vào tớ là được tái chế ngay!',
                details: {
                    summary: 'Nhà máy xử lý rác thải của tế bào.',
                    structure: 'Túi cầu nhỏ chứa các enzyme tiêu hóa mạnh.',
                    function: 'Phân hủy các chất thải, thức ăn thừa và cả các bào quan già cỗi.',
                    location: 'Rải rác trong tế bào chất.',
                    analogy: 'Giống như "Xe rác" hoặc "Nhà máy tái chế".'
                },
                funFact: 'Tiêu thể có thể tái chế cả những bộ phận già cỗi của tế bào để dùng lại!'
            },
            {
                id: 'centrosome',
                name: 'Trung Thể',
                nameEn: 'Centrosome',
                color: '#FDE047', // Yellow
                emoji: '🧭',
                short: 'Người chỉ huy phân chia',
                kid: 'Tớ là trung thể. Khi tế bào chia đôi, tớ kéo ADN về hai phía cho thật đều.',
                details: {
                    summary: 'Trung tâm tổ chức ống vi thể, quan trọng khi tế bào phân chia.',
                    structure: 'Gồm 2 trung tử xếp vuông góc với nhau.',
                    function: 'Tham gia vào quá trình phân chia tế bào (nguyên phân), tạo thoi vô sắc.',
                    location: 'Gần nhân tế bào.',
                    analogy: 'Giống như "Người điều phối" giao thông.'
                },
                funFact: 'Trung thể giúp chia đều DNA cho 2 tế bào con khi tế bào phân chia.'
            },
            {
                id: 'cytoskeleton',
                name: 'Bộ Khung Tế Bào',
                nameEn: 'Cytoskeleton',
                color: '#67E8F9', // Cyan
                emoji: '🦴',
                short: 'Bộ khung & đường ray',
                kid: 'Tớ là bộ khung tế bào. Tớ vừa là bộ xương, vừa là đường ray cho xe chở hàng chạy.',
                details: {
                    summary: 'Mạng lưới sợi protein làm khung, giữ hình dạng cho tế bào.',
                    structure: 'Gồm vi ống (ống rỗng), vi sợi và sợi trung gian đan khắp tế bào chất.',
                    function: 'Giữ hình dạng, giúp tế bào di chuyển và làm "đường ray" để protein vận động chở túi hàng đi khắp tế bào.',
                    location: 'Khắp tế bào chất; các vi ống tỏa ra từ trung thể.',
                    analogy: 'Giống như "Khung nhà" kết hợp "Đường ray tàu hỏa".'
                },
                funFact: 'Protein vận động kinesin "đi bộ" trên vi ống: mỗi bước chỉ 8 nanômét nhưng bước khoảng 100 bước mỗi giây!'
            },
            {
                id: 'cytoplasm', // chuẩn hóa từ 'cytoplasms'
                name: 'Tế Bào Chất',
                nameEn: 'Cytoplasm',
                color: '#CBD5E1', // Slate
                emoji: '🌊',
                short: 'Biển thạch bên trong',
                kid: 'Tớ là tế bào chất — biển thạch mềm, nơi mọi bào quan bơi và làm việc.',
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
                id: 'cell_wall',
                name: 'Thành Tế Bào',
                nameEn: 'Cell Wall',
                color: '#166534', // Dark Green
                emoji: '🧱',
                short: 'Bức tường thành',
                kid: 'Tớ là thành tế bào — bức tường cứng cáp giúp cây đứng thẳng.',
                details: {
                    summary: 'Lớp vỏ cứng bao bên ngoài màng tế bào thực vật.',
                    structure: 'Cấu tạo chủ yếu từ cellulose sợi bền chắc.',
                    function: 'Bảo vệ tế bào, tạo khung xương cứng cáp giúp cây đứng thẳng.',
                    location: 'Lớp ngoài cùng của tế bào thực vật.',
                    analogy: 'Giống như "Bức tường thành" hoặc "Bộ khung xương".'
                },
                funFact: 'Thành tế bào là lý do tại sao gỗ lại cứng và rau quả lại giòn. Tờ giấy em viết cũng làm từ xenlulôzơ của thành tế bào đấy!'
            },
            {
                id: 'plasma_membrane',
                name: 'Màng Tế Bào',
                nameEn: 'Cell Membrane',
                color: '#4ADE80', // Green
                emoji: '🛡️',
                short: 'Cổng an ninh',
                kid: 'Tớ là màng tế bào, nằm ngay sau bức tường. Tớ canh cổng cho chất ra vào.',
                details: {
                    summary: 'Lớp màng mỏng nằm ngay bên trong thành tế bào cứng.',
                    structure: 'Lớp phospholipid kép mềm dẻo, lót sát mặt trong của thành.',
                    function: 'Kiểm soát chất ra vào tế bào. Thực vật có CẢ thành cứng VÀ màng mềm.',
                    location: 'Ngay bên trong thành tế bào.',
                    analogy: 'Giống như "Lớp lót mềm" bên trong một chiếc hộp cứng.'
                },
                funFact: 'Nhiều bạn nhầm thành và màng là một — thực ra thực vật có cả hai lớp riêng biệt!'
            },
            {
                id: 'vacuole',
                name: 'Không Bào Trung Tâm',
                nameEn: 'Central Vacuole',
                color: '#0EA5E9', // Sky Blue
                emoji: '💧',
                short: 'Kho chứa nước',
                kid: 'Tớ là không bào — kho nước khổng lồ. Tưới cây là tớ căng phồng lên!',
                details: {
                    summary: 'Túi chứa nước khổng lồ chiếm phần lớn thể tích tế bào.',
                    structure: 'Một túi màng lớn chứa đầy dịch bào (nước và chất tan).',
                    function: 'Dự trữ nước, chất dinh dưỡng và duy trì áp suất giúp tế bào căng phồng.',
                    location: 'Trung tâm tế bào thực vật, đẩy nhân và các bào quan ra sát màng.',
                    analogy: 'Giống như "Kho chứa nước" hoặc "Két sắt" của tế bào.'
                },
                funFact: 'Không bào chiếm tới 80-90% thể tích, đẩy mọi thứ ra rìa. Khi quên tưới cây, không bào mất nước làm cây héo.'
            },
            {
                id: 'nucleus',
                name: 'Nhân Tế Bào',
                nameEn: 'Nucleus',
                color: '#A855F7', // Purple
                emoji: '🧠',
                short: 'Trung tâm điều khiển',
                kid: 'Tớ là nhân tế bào. Không bào to quá nên tớ bị đẩy ra sát mép.',
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
                id: 'chloroplast',
                name: 'Lục Lạp',
                nameEn: 'Chloroplast',
                color: '#22C55E', // Green
                emoji: '☀️',
                short: 'Bếp năng lượng Mặt Trời',
                kid: 'Tớ là lục lạp! Tớ hứng nắng để nấu đường và thở ra khí ôxi cho các bạn.',
                details: {
                    summary: 'Bào quan đặc biệt chỉ có ở thực vật, giúp cây quang hợp.',
                    structure: 'Hình bầu dục, chứa chất diệp lục màu xanh lá cây xếp thành chồng đĩa (grana).',
                    function: 'Hấp thụ ánh sáng mặt trời để tổng hợp chất hữu cơ (đường) từ nước và khí CO2.',
                    location: 'Nằm trong tế bào chất, thường tập trung ở bề mặt lá.',
                    analogy: 'Giống như "Tấm pin năng lượng mặt trời" kết hợp "Nhà bếp".'
                },
                funFact: 'Một tế bào lá có hàng chục lục lạp — nhờ chúng mà cây xanh tạo ra oxy cho chúng ta thở!'
            },
            {
                id: 'mitochondria',
                name: 'Ty Thể',
                nameEn: 'Mitochondria',
                color: '#EF4444', // Red
                emoji: '⚡',
                short: 'Nhà máy điện',
                kid: 'Tớ là ty thể. Cây cũng cần tớ để có năng lượng, nhất là ban đêm.',
                details: {
                    summary: 'Nhà máy năng lượng, giúp tế bào hô hấp.',
                    structure: 'Hình hạt đậu với màng trong gấp nếp.',
                    function: 'Chuyển hóa đường thành ATP - năng lượng cho tế bào.',
                    location: 'Rải rác trong lớp tế bào chất sát màng.',
                    analogy: 'Giống như "Nhà máy điện" cho thành phố.'
                },
                funFact: 'Tế bào thực vật vẫn cần ty thể để hô hấp vào ban đêm khi không có ánh sáng!'
            },
            {
                id: 'er',
                name: 'Lưới Nội Chất',
                nameEn: 'Endoplasmic Reticulum',
                color: '#F472B6', // Pink
                emoji: '🛣️',
                short: 'Băng chuyền sản xuất',
                kid: 'Tớ là lưới nội chất — băng chuyền của nhà máy, nối liền với nhân tế bào.',
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
                emoji: '📦',
                short: 'Bưu điện đóng gói',
                kid: 'Tớ là bộ máy Golgi. Tớ đóng gói hàng và gửi vật liệu đi xây thành tế bào.',
                details: {
                    summary: 'Nơi đóng gói và phân phối sản phẩm.',
                    structure: 'Các túi dẹt xếp chồng lên nhau.',
                    function: 'Chế biến, đóng gói và gửi protein đến nơi cần.',
                    location: 'Gần nhân và lưới nội chất.',
                    analogy: 'Giống như "Bưu điện" hoặc "Trung tâm phân phối hàng".'
                },
                funFact: 'Bộ máy Golgi đặc biệt quan trọng trong việc tạo thành tế bào mới!'
            },
            {
                id: 'ribosome',
                name: 'Ribôxôm',
                nameEn: 'Ribosome',
                color: '#C084FC', // Light purple
                emoji: '🔧',
                short: 'Thợ lắp ráp protein',
                kid: 'Tớ là ribôxôm, thợ lắp ráp protein bé xíu của cây.',
                details: {
                    summary: 'Những hạt nhỏ li ti chuyên sản xuất protein.',
                    structure: 'Hạt gồm 2 tiểu đơn vị làm từ RNA và protein.',
                    function: 'Đọc mã di truyền và lắp ráp amino acid thành protein.',
                    location: 'Trôi tự do trong tế bào chất và bám trên lưới nội chất hạt.',
                    analogy: 'Giống như "Dây chuyền lắp ráp" trong nhà máy.'
                },
                funFact: 'Cây cối cũng cần rất nhiều ribôxôm để sản xuất protein cho mọi hoạt động sống!'
            },
            {
                id: 'cytoplasm',
                name: 'Tế Bào Chất',
                nameEn: 'Cytoplasm',
                color: '#CBD5E1', // Slate
                emoji: '🌊',
                short: 'Lớp thạch mỏng',
                kid: 'Tớ là tế bào chất, bị không bào ép thành lớp mỏng sát màng. Tớ chảy vòng quanh, chở lục lạp đi dạo!',
                details: {
                    summary: 'Lớp keo mỏng bị không bào lớn ép sát vào màng tế bào.',
                    structure: 'Dịch keo chứa nước, enzyme và các bào quan.',
                    function: 'Nơi diễn ra các phản ứng hóa học, giữ bào quan đúng vị trí.',
                    location: 'Lớp mỏng giữa màng tế bào và không bào trung tâm.',
                    analogy: 'Giống như "Lớp nhân mỏng" bao quanh viên kẹo lớn ở giữa.'
                },
                funFact: 'Vì không bào quá to, tế bào chất thực vật bị ép thành một lớp mỏng sát màng — và nó chảy vòng quanh như băng chuyền, mang lục lạp đi tìm ánh sáng!'
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
                id: 'capsule',
                name: 'Vỏ Nhầy',
                nameEn: 'Capsule',
                color: '#FB923C', // Orange light
                emoji: '🧥',
                short: 'Áo khoác nhầy',
                kid: 'Tớ là vỏ nhầy — chiếc áo khoác trơn giúp vi khuẩn bám dính và trốn kẻ thù.',
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
                emoji: '🧱',
                short: 'Khung thép',
                kid: 'Tớ là thành tế bào, giữ cho vi khuẩn khỏi bị vỡ.',
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
                emoji: '🛡️',
                short: 'Cổng bảo vệ',
                kid: 'Tớ là màng sinh chất, canh cổng cho chất ra vào vi khuẩn.',
                details: {
                    summary: 'Lớp màng mỏng bao bọc tế bào chất.',
                    structure: 'Lớp phospholipid kép với protein xuyên màng.',
                    function: 'Kiểm soát vật chất ra vào, nơi diễn ra hô hấp và quang hợp (ở một số loài).',
                    location: 'Nằm ngay dưới thành tế bào.',
                    analogy: 'Giống như "Cổng bảo vệ" kiểm tra ai được vào ra.'
                },
                funFact: 'Màng sinh chất vi khuẩn không có cholesterol như động vật!'
            },
            {
                id: 'nucleoid',
                name: 'Vùng Nhân',
                nameEn: 'Nucleoid',
                color: '#F59E0B', // Amber
                emoji: '🧶',
                short: 'Cuộn chỉ ADN',
                kid: 'Tớ là vùng nhân. ADN của vi khuẩn cuộn rối ở đây mà không có màng bọc.',
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
                id: 'plasmid',
                name: 'Plasmid',
                nameEn: 'Plasmid',
                color: '#FDE68A', // Pale gold
                emoji: '💍',
                short: 'Nhẫn ADN tí hon',
                kid: 'Tớ là plasmid — chiếc nhẫn ADN tí hon. Vi khuẩn còn tặng tớ cho bạn khác được!',
                details: {
                    summary: 'Những vòng ADN nhỏ, nằm riêng bên ngoài vùng nhân.',
                    structure: 'Phân tử ADN dạng vòng, nhỏ hơn nhiều so với ADN ở vùng nhân.',
                    function: 'Mang thêm vài "bí kíp" có ích, ví dụ giúp vi khuẩn chống lại thuốc kháng sinh.',
                    location: 'Trôi trong tế bào chất của vi khuẩn.',
                    analogy: 'Giống như "Tờ ghi chú bỏ túi" kẹp ngoài cuốn sách lớn.'
                },
                funFact: 'Các nhà khoa học gắn công thức làm insulin vào plasmid để "nhờ" vi khuẩn sản xuất thuốc chữa bệnh tiểu đường!'
            },
            {
                id: 'ribosome',
                name: 'Ribôxôm',
                nameEn: 'Ribosome',
                color: '#A3E635', // Lime green
                emoji: '🔧',
                short: 'Thợ lắp ráp protein',
                kid: 'Tớ là ribôxôm của vi khuẩn, nhỏ hơn ribôxôm trong cơ thể em đấy!',
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
                id: 'flagellum',
                name: 'Roi (Tiên Mao)',
                nameEn: 'Flagellum',
                color: '#EAB308', // Yellow
                emoji: '🌀',
                short: 'Chân vịt',
                kid: 'Tớ là roi — cái chân vịt xoay tít đẩy vi khuẩn bơi đi.',
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
                emoji: '🖐️',
                short: 'Tay bám',
                kid: 'Tớ là lông pili — những cánh tay bé xíu giúp vi khuẩn bám thật chặt.',
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
                emoji: '🌊',
                short: 'Biển thạch bên trong',
                kid: 'Tớ là tế bào chất, nơi vi khuẩn làm mọi việc.',
                details: {
                    summary: 'Chất keo lỏng chứa đầy bên trong tế bào.',
                    structure: 'Dịch keo chứa nước, enzyme, ribosome và các chất dinh dưỡng.',
                    function: 'Môi trường diễn ra các phản ứng hóa học và trao đổi chất.',
                    location: 'Toàn bộ không gian bên trong màng tế bào.',
                    analogy: 'Giống như "Nước biển" chứa đầy bên trong tàu ngầm.'
                },
                funFact: 'Tế bào chất của vi khuẩn chứa hàng nghìn ribosome để sản xuất protein!'
            }
        ]
    }
];
