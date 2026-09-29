import type { PartKind } from '../../components/electricity/engine/circuit';
export type ContentKind = 'lesson' | 'mission' | 'fault';
export interface StepSpec {
    id: string;
    text: string;
    predicate: string;
    audioKey: string;
    choice?: {
        options: string[];
        answer: number;
    };
    duration?: number;
}
export interface ContentSpec {
    modelVersion: 1;
    isIllustrative: true;
    id: string;
    revision: 1;
    release: 1 | 2;
    kind: ContentKind;
    title: string;
    intro: string;
    initialCircuitId: string;
    canonicalLayoutId: string;
    minimumTools: PartKind[];
    allowedParts: PartKind[];
    curriculumTags: string[];
    steps: StepSpec[];
    hintRules: [
        string,
        string,
        string
    ];
    takeaway: string;
    sourceIds: string[];
    build?: boolean;
    activity?: 'sorting' | 'safety' | 'conductors' | 'house' | 'journey';
    diagnosis?: string;
}
const tools: PartKind[] = ['battery', 'bulb', 'switch', 'button', 'bell', 'buzzer', 'motor', 'led', 'resistor', 'rheostat', 'ammeter', 'voltmeter', 'fuse', 'electromagnet', 'generator', 'lemon', 'potato', 'sample', 'spdt', 'junction'];
const step = (id: string, text: string, predicate: string, choice?: StepSpec['choice'], duration?: number): StepSpec => ({ id, text, predicate, audioKey: `electricity.${id}`, choice, duration });
function spec(kind: ContentKind, id: string, title: string, preset: string, steps: StepSpec[], takeaway: string, extra: Partial<ContentSpec> = {}): ContentSpec { return { id, modelVersion:1, isIllustrative:true, revision: 1, release: 1, kind, title, intro: steps[0].text, initialCircuitId: preset, canonicalLayoutId: `${preset}-14x8-v1`, minimumTools: ['battery', 'bulb'], allowedParts: tools, curriculumTags: ['KH5-core'], steps, hintRules: ['Lần theo đường đi từ nguồn, qua tải rồi về nguồn.', 'Chọn linh kiện hoặc dây để soi tiếp điểm; kiểm từng chỗ nối.', 'So sánh với mạch tham khảo, sau đó tự kiểm lại các trạng thái.'], takeaway, sourceIds: ['MODEL-DC', 'CUR-KH'], ...extra }; }
export const LESSONS: ContentSpec[] = [
    spec('lesson', 'L01-powerAround', 'Điện ở quanh mình', 'intro', [step('sort', 'Xếp chín đồ vật theo nguồn điện trong hình.', 'activity')], 'Nhìn pin hoặc phích cắm của đúng đồ vật đang có.', { activity: 'sorting' }),
    spec('lesson', 'L02-safeRoom', 'Căn phòng an toàn', 'intro', [step('safe', 'Tìm năm mối nguy và chọn cách bảo vệ mình.', 'activity')], 'Thấy điện bất thường: tránh chạm và gọi người lớn.', { activity: 'safety', sourceIds: ['SAFE-EVN'] }),
    spec('lesson', 'L03-firstLight', 'Ánh sáng đầu tiên', 'intro', [step('light', 'Nối hai dây để thắp sáng bóng đèn.', 'light')], 'Mạch khép kín đưa năng lượng từ pin tới bóng.'),
    spec('lesson', 'L04-openClosed', 'Đường đi khép kín', 'missingWire', [step('gap', 'Quan sát chỗ hở, chạm “Soi bên trong”.', 'inspect'), step('close', 'Nối dây còn thiếu để đèn sáng.', 'light'), step('cut', 'Chọn và cắt một dây để đèn tắt.', 'off'), step('rejoin', 'Nối lại đường vừa cắt.', 'light')], 'Một chỗ hở cũng đủ ngắt đường đi.'),
    spec('lesson', 'L05-switch', 'Một chạm bật đèn', 'single', [step('insert', 'Thêm cầu dao vào đường đi của dòng điện.', 'control-on'), step('switch-off', 'Mở cầu dao để tắt bóng.', 'control-off'), step('switch-on', 'Đóng cầu dao và thắp sáng lại.', 'control-on')], 'Công tắc đóng hoặc mở đường đi của dòng điện.'),
    spec('lesson', 'L06-twoContacts', 'Hai tiếp điểm bí mật', 'intro', [step('contacts', 'Soi bóng và chọn cả cọc A lẫn cọc B.', 'contacts'), step('contact-light', 'Nối bóng với pin để bóng sáng.', 'light'), step('reverse', 'Đảo viên pin: quan sát bóng và chiều dòng.', 'reversed-light')], 'Bóng sợi đốt có hai tiếp điểm, không có cực cộng trừ; pin thì có.'),
    spec('lesson', 'L07-conductors', 'Vật nào dẫn điện?', 'intro', [step('samples', 'Dự đoán, kẹp đo và phân loại đủ 12 mẫu cơ bản.', 'activity')], 'Thử vật liệu và điểm tiếp xúc, không chỉ nhìn tên đồ vật.', { activity: 'conductors', sourceIds: ['SCI-RSC', 'SCI-USGS'] }),
    spec('lesson', 'L08-schematic', 'Đọc bản thiết kế', 'intro', [step('draw-one', 'Lắp mạch pin – bóng và mở góc nhìn Sơ đồ.', 'schematic-light'), step('draw-switch', 'Thêm cầu dao có tác dụng và xem sơ đồ.', 'schematic-control'), step('draw-bell', 'Thay tải bằng chuông và điều khiển bằng nút nhấn.', 'schematic-bell')], 'Sơ đồ giữ nguyên cách nối, dù hình vẽ trông khác.', { curriculumTags: ['KHTN8-preview'] }),
    spec('lesson', 'L09-moreCells', 'Thêm pin, điều gì đổi?', 'single', [step('one-cell', 'Quan sát độ sáng với một viên pin.', 'one-cell'), step('two-cell', 'Thêm một viên cùng chiều vào hộp pin.', 'more-power'), step('opposed', 'Đảo một trong hai viên pin.', 'opposed'), step('why-opposed', 'Vì sao bóng tắt?', 'choice', { options: ['Hai nguồn chống nhau', 'Bóng sợi đốt có cực', 'Dây dài hơn'], answer: 0 })], 'Pin cùng chiều tăng điện áp; hai viên giống nhau ngược chiều có thể triệt tiêu.'),
    spec('lesson', 'L10-series', 'Cùng một đường đi', 'single', [step('baseline', 'Quan sát độ sáng của một bóng.', 'one-cell'), step('series', 'Thêm bóng thứ hai vào cùng một vòng.', 'series'), step('series-predict', 'Vặn lỏng bóng 1 thì chuyện gì xảy ra?', 'choice', { options: ['Cả hai bóng tắt', 'Chỉ một bóng tắt'], answer: 0 }), step('series-loose', 'Vặn lỏng bóng 1 để kiểm tra dự đoán.', 'series-loose'), step('series-tight', 'Siết lại bóng 1.', 'series')], 'Hai bóng nối tiếp cùng một đường; hở một bóng thì cả đường dừng.', { curriculumTags: ['KHTN9-preview'] }),
    spec('lesson', 'L11-parallel', 'Mỗi bóng một lối riêng', 'parallel', [step('parallel', 'Lần theo hai nhánh riêng từ bóng về pin.', 'parallel'), step('parallel-predict', 'Vặn lỏng bóng 1 thì bóng 2 thế nào?', 'choice', { options: ['Vẫn sáng, có thể sáng hơn một chút', 'Cũng tắt'], answer: 0 }), step('parallel-loose', 'Vặn lỏng bóng 1 và quan sát nhánh còn lại.', 'parallel-loose'), step('parallel-tight', 'Siết lại bóng để cả hai nhánh sáng.', 'parallel')], 'Nhánh còn kín vẫn sáng khi nhánh kia hở.', { curriculumTags: ['KHTN9-preview'] }),
    spec('lesson', 'L12-saveAtHome', 'Nhà sáng, ít tốn điện', 'single', [step('home', 'Giữ đèn học và tủ lạnh; tắt đồ thừa, thay năm đèn.', 'activity')], 'Tiết kiệm là vẫn đáp ứng nhu cầu mà dùng ít điện hơn.', { activity: 'house', release: 2, sourceIds: ['ENERGY-DOE'] }),
    spec('lesson', 'L13-powerJourney', 'Điện đến từ đâu?', 'single', [step('journey', 'Ghép hành trình điện và thử cấp điện ban đêm.', 'activity')], 'Điện đến từ nhiều nguồn; lượng tạo ra phải đáp ứng lượng đang dùng.', { activity: 'journey', release: 2, sourceIds: ['ENERGY-DOE'] })
];
export const MISSIONS: ContentSpec[] = [
    spec('mission', 'flashlight', 'Đèn pin bỏ túi', 'flashlight', [step('flash-on', 'Tạo đèn pin có cầu dao và thắp sáng.', 'control-on'), step('flash-off', 'Mở cầu dao: bóng phải tắt.', 'control-off'), step('flash-again', 'Đóng cầu dao: bóng sáng trở lại.', 'control-on')], 'Đèn pin có một đường kín được điều khiển.', { build: true }),
    spec('mission', 'doorbell', 'Có khách đến!', 'doorbell', [step('bell-on', 'Giữ nút nhấn để chuông gõ.', 'button-bell'), step('bell-off', 'Nhả nút và nghe chuông dừng.', 'bell-stopped', undefined, 0.52)], 'Nút nhấn chỉ đóng mạch trong lúc giữ.', { build: true, minimumTools: ['battery', 'button', 'bell'] }),
    spec('mission', 'lantern', 'Đèn lồng LED', 'lantern', [step('led-on', 'Lắp LED đỏ với điện trở 100 Ω và hai pin.', 'safe-led'), step('led-off', 'Mở cầu dao để tắt LED.', 'control-off'), step('led-again', 'Đóng cầu dao cho LED sáng lại.', 'safe-led')], 'Điện trở giúp giới hạn dòng qua LED.', { build: true, minimumTools: ['battery', 'led', 'resistor', 'switch'] }),
    spec('mission', 'smartRoom', 'Phòng thông minh', 'smartRoom', [step('room-11', 'Bật cả đèn lẫn quạt bằng hai cầu dao riêng.', 'independent-11'), step('room-10', 'Chỉ bật đèn.', 'independent-10'), step('room-01', 'Chỉ bật quạt.', 'independent-01'), step('room-00', 'Tắt cả hai.', 'independent-00')], 'Mỗi nhánh có thể được điều khiển độc lập.', { build: true }),
    spec('mission', 'candleFan', 'Quạt thổi nến ảo', 'candleFan', [step('wind', 'Cho quạt chạy liên tục hai giây.', 'motor', undefined, 2), step('wind-off', 'Mở công tắc để quạt dừng.', 'control-off')], 'Gió và nến ở đây là minh họa; không thử với lửa thật.', { release: 2, build: true }),
    spec('mission', 'batterySaver', 'Hai bóng, một pin', 'batterySaver', [step('efficient', 'Lắp hai bóng sáng đủ bằng một pin.', 'bright-parallel')], 'Mỗi nhánh kín có đường riêng tới nguồn.', { release: 2, build: true }),
    spec('mission', 'lemonLight', 'Ánh sáng từ trái cây', 'lemonLight', [step('lemon-one', 'Thử LED với một pin chanh.', 'one-lemon'), step('lemon-three', 'Thêm pin chanh nối tiếp để LED sáng rõ.', 'lemon-led'), step('lemon-bulb', 'Thử thay LED bằng bóng sợi đốt.', 'lemon-bulb')], 'Mẫu chanh cấp dòng nhỏ; LED và bóng thường cần công suất khác nhau.', { release: 2 }),
    spec('mission', 'tetLights', 'Dây đèn ngày Tết', 'tetLights', [step('tet-series', 'Quan sát ba bóng nối tiếp.', 'three-series'), step('tet-parallel', 'Chuyển cả ba bóng sang ba nhánh riêng.', 'three-parallel'), step('tet-loose', 'Vặn lỏng bóng 1: hai bóng kia vẫn sáng.', 'three-loose'), step('tet-tight', 'Siết lại bóng 1 để cả ba sáng.', 'three-parallel')], 'Thử nhánh độc lập bằng chính mạch vừa làm.', { release: 2 }),
    spec('mission', 'trafficLight', 'Ngã tư của bé', 'trafficLight', [step('traffic-red', 'Chỉ bật đèn đỏ.', 'traffic-red'), step('traffic-green', 'Chuyển sang chỉ đèn xanh.', 'traffic-green'), step('traffic-yellow', 'Chuyển sang chỉ đèn vàng.', 'traffic-yellow')], 'Mỗi LED cần một điện trở hạn dòng riêng.', { release: 2 }),
    spec('mission', 'doorAlarm', 'Cánh cửa báo khách', 'doorAlarm', [step('door-shut', 'Đóng cửa: đèn và chuông dừng.', 'door-off'), step('door-open', 'Mở cửa: đèn sáng và chuông gõ.', 'door-on'), step('door-shut2', 'Đóng cửa lần nữa.', 'door-off'), step('door-open2', 'Mở cửa để kiểm tra lần hai.', 'door-on')], 'Cửa chuyển động làm thay đổi tiếp điểm công tắc.', { release: 2 }),
    spec('mission', 'stairs', 'Đèn cầu thang', 'stairs', [step('stairs00', 'Đặt cả hai công tắc ở vị trí 1.', 'stairs-00'), step('stairs01', 'Đổi công tắc thứ hai sang vị trí 2.', 'stairs-01'), step('stairs11', 'Đổi công tắc thứ nhất sang vị trí 2.', 'stairs-11'), step('stairs10', 'Đổi công tắc thứ hai về vị trí 1.', 'stairs-10')], 'Đổi bất kỳ công tắc nào cũng đổi trạng thái đèn.', { release: 2 }),
    spec('mission', 'fuseRescue', 'Người gác cầu chì', 'fuseRescue', [step('fuse-normal', 'Quan sát mạch hoạt động bình thường.', 'fuse-normal'), step('fuse-fault', 'Bấm thử sự cố và quan sát cầu chì ngắt.', 'fuse-open'), step('fuse-repair', 'Bỏ dây lỗi rồi thay cầu chì mới.', 'fuse-repaired')], 'Cầu chì phải nằm trên đường chung để ngắt dòng lỗi.', { release: 2 })
];
const faultRows = [
    ['missingWire', 'Mất một sợi dây', 'Nối đường về nguồn', 'Theo dây thấy hai cọc chưa nối.'], ['looseBulb', 'Bóng chưa chạm đui', 'Siết bóng', 'Có khe hở ở đui bóng.'], ['openSwitch', 'Cầu dao đang mở', 'Đóng cầu dao', 'Lưỡi dao chưa chạm tiếp điểm.'], ['reversedLed', 'LED quay ngược', 'Đảo hai dây của LED', 'Anôt đang nối về cực âm.'], ['brokenFilament', 'Dây tóc đứt', 'Thay bóng mới', 'Dây tóc bên trong bị đứt.'], ['emptyBattery', 'Nguồn hết năng lượng', 'Thay pin mới', 'Điện áp nguồn đã cạn.'], ['hiddenWireBreak', 'Đứt lõi dưới vỏ', 'Thay dây lỗi', 'Lõi đồng không còn liền.'], ['brokenSwitch', 'Tiếp điểm hỏng', 'Thay cầu dao mới', 'Cầu dao đóng nhưng tiếp điểm bị đứt.'], ['shortedLoad', 'Đường bỏ qua bóng', 'Bỏ dây nối tắt', 'Một dây nối thẳng hai tiếp điểm bóng.'], ['blownFuse', 'Cầu chì đã ngắt', 'Thay cầu chì cùng loại', 'Dây cầu chì bị đứt; lỗi gốc đã được bỏ.'], ['insulatedClip', 'Kẹp nhầm vỏ nhựa', 'Chuyển kẹp sang lõi', 'Kẹp chưa chạm lõi đồng đã tuốt sẵn.'], ['opposedCells', 'Hai pin chống nhau', 'Đảo đúng một viên pin', 'Một viên đang ngược chiều với viên kia.']
] as const;
export const FAULTS: ContentSpec[] = faultRows.map(([id, title, repair, diagnosis], i) => spec('fault', id, title, id, [step(`${id}-inspect`, 'Soi hoặc đo đúng vị trí để tìm chứng cứ.', 'fault-observe'), step(`${id}-diagnose`, 'Chọn kết luận dựa trên điều vừa quan sát.', 'choice', { options: [diagnosis, 'Cứ thêm nhiều pin là được.', 'Bóng tắt nghĩa là mọi dây đều cách điện.'], answer: 0 }), step(`${id}-repair`, repair, 'fault-repaired'), ...(['openSwitch', 'brokenSwitch', 'missingWire'].includes(id) ? [step(`${id}-off`, 'Mở cầu dao để kiểm tra bóng tắt.', 'control-off'), step(`${id}-on`, 'Đóng lại để xác nhận đã sửa xong.', 'control-on')] : [])], diagnosis, { release: i < 4 ? 1 : 2, diagnosis }));
export const CONTENT = [...LESSONS, ...MISSIONS, ...FAULTS];
export const SOURCES = [{ id: 'MODEL-DC', name: 'Thông số mô hình DC giáo dục v1', url: 'https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits' }, { id: 'CUR-KH', name: 'Chương trình Khoa học — Bộ GDĐT', url: 'https://thphudinh.hcm.edu.vn/tin-tuc-su-kien/chuong-trinh-tong-the-va-chuong-trinh-chi-tiet-cac-mon-hoc-va-hoat-dong-giao-du/ctmb/21820/412126' }, { id: 'SAFE-EVN', name: 'EVN — An toàn điện cho trẻ', url: 'https://www.evn.com.vn/d6/news/Mot-so-khuyen-cao-ve-an-toan-dien-cho-tre-nho-66-142-29032.aspx' }, { id: 'SCI-RSC', name: 'RSC — Vật dẫn điện', url: 'https://edu.rsc.org/experiments/which-substances-conduct-electricity/1789.article' }, { id: 'SCI-USGS', name: 'USGS — Độ dẫn điện của nước', url: 'https://www.usgs.gov/water-science-school/science/conductivity-electrical-conductance-and-water' }, { id: 'ENERGY-DOE', name: 'DOE — Electricity 101', url: 'https://www.energy.gov/oe/electricity-101' }];
