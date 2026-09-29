export interface Sample {
    modelVersion: 1;
    isIllustrative: true;
    id: string;
    name: string;
    resistance: number | null;
    core: boolean;
    assumptions: string;
    valueKind: 'illustrative';
    sourceIds: string[];
}
const rows: [
    string,
    string,
    number | null,
    string
][] = [['copperCore', 'Lõi đồng', .05, 'Lõi trần sạch, kẹp đúng lõi.'], ['aluminiumStrip', 'Thanh nhôm', .08, 'Thanh sạch, hai kẹp tiếp xúc tốt.'], ['steelSpoon', 'Thìa inox', .5, 'Kẹp phần kim loại không phủ.'], ['brassKey', 'Chìa khóa', .15, 'Đồng thau không sơn.'], ['paperClip', 'Kẹp giấy', .3, 'Kẹp thép không bọc nhựa.'], ['kitchenFoil', 'Giấy nhôm', .1, 'Miếng nhôm liền, không rách.'], ['metalCoin', 'Đồng xu', .2, 'Kim loại không phủ sơn.'], ['plasticRuler', 'Thước nhựa', null, 'Khô, không có dải kim loại.'], ['rubberEraser', 'Tẩy cao su', null, 'Tẩy sạch, khô. Không phải đồ bảo hộ.'], ['dryWood', 'Đũa gỗ khô', null, 'Gỗ khô, không sơn dẫn điện.'], ['glassCup', 'Thành cốc', null, 'Kẹp thành thủy tinh khô, không kẹp nước.'], ['dryPaper', 'Giấy khô', null, 'Giấy sạch, khô, không phủ kim loại.'], ['graphiteRod', 'Ruột bút chì', 220, 'Lõi graphite dài 3 cm, lộ hai đầu.'], ['saltWater', 'Nước muối', 1000, 'Hai điện cực cùng độ ngập và khoảng cách. Dòng trong dung dịch do ion.'], ['tapWater', 'Nước máy', 100000, 'Mẫu có ion và hình học điện cực cố định. Đèn tắt không có nghĩa an toàn.'], ['plasticJacket', 'Vỏ dây đồng', null, 'Hai kẹp chỉ chạm vỏ nhựa nguyên của dây đồng.']];
export const SAMPLES: Sample[] = rows.map(([id, name, resistance, assumptions], i) => ({ id, modelVersion:1,isIllustrative:true, name, resistance, assumptions, core: i < 12, valueKind: 'illustrative', sourceIds: ['SCI-RSC', 'SCI-USGS'] }));
export const HAZARDS = [
    { id: 'wetHands', name: 'Tay còn ướt', sign: 'Bạn định chạm phích khi tay ướt.', safe: 'Dừng lại, tránh chạm, nhờ người lớn.', wrong: 'Lau sơ vào áo rồi tự rút ngay.' },
    { id: 'exposedWire', name: 'Dây bong vỏ', sign: 'Dây bị bong vỏ, lộ lõi kim loại.', safe: 'Tránh xa và báo người lớn.', wrong: 'Chạm thử xem có điện không.' },
    { id: 'foreignObject', name: 'Que cạnh ổ điện', sign: 'Bạn định đưa que vào ổ điện.', safe: 'Nhắc bạn dừng và gọi người lớn.', wrong: 'Thử bằng que nhựa là được.' },
    { id: 'wetAppliance', name: 'Thiết bị trong nước', sign: 'Thiết bị điện rơi vào nước.', safe: 'Không chạm nước hay thiết bị, gọi người lớn.', wrong: 'Nhanh tay vớt thiết bị lên.' },
    { id: 'damagedOutlet', name: 'Ổ điện bị nứt', sign: 'Ổ cắm có vết nứt và dấu hỏng.', safe: 'Không sử dụng, báo người lớn.', wrong: 'Giữ chặt ổ bằng tay khi cắm.' },
    { id: 'kite', name: 'Diều mắc dây điện', sign: 'Diều mắc trên đường dây ngoài nhà.', safe: 'Đứng xa, báo người lớn; không tự lấy.', wrong: 'Dùng cây dài gỡ diều xuống.' }
];
export const POWER_OBJECTS = [['Đèn pin · thấy 2 viên pin', 'battery'], ['Điều khiển TV · có ngăn pin', 'battery'], ['Đồng hồ · có pin tròn', 'battery'], ['Ấm đun · có phích cắm', 'mains'], ['Tủ lạnh · có dây cắm', 'mains'], ['Quạt đứng · có phích cắm', 'mains'], ['Quyển sách', 'none'], ['Quả bóng đá', 'none'], ['Chiếc thìa', 'none']] as const;
export interface Appliance {
    id: string;
    name: string;
    powerW: number;
    hours: number;
    standbyW?: number;
    standbyHours?: number;
    essential?: boolean;
    floor: number;
}
export const APPLIANCES: Appliance[] = [
    ...Array.from({ length: 5 }, (_, i) => ({ id: `lamp${i}`, name: i === 0 ? 'Đèn học' : `Đèn phòng ${i}`, powerW: 60, hours: 4, essential: i === 0, floor: i % 3 })),
    { id: 'fan', name: 'Quạt', powerW: 50, hours: 6, floor: 2 }, { id: 'tv', name: 'TV', powerW: 80, hours: 3, standbyW: 1, standbyHours: 21, floor: 1 }, { id: 'fridge', name: 'Tủ lạnh', powerW: 100, hours: 8, standbyW: 2, standbyHours: 16, essential: true, floor: 0 }, { id: 'riceCooker', name: 'Nồi cơm', powerW: 700, hours: .5, standbyW: 30, standbyHours: 2, floor: 0 }, { id: 'kettle', name: 'Ấm đun', powerW: 1500, hours: .1, floor: 0 }, { id: 'airConditioner', name: 'Điều hòa', powerW: 900, hours: 4, floor: 2 }, { id: 'waterHeater', name: 'Bình nóng lạnh', powerW: 2000, hours: .5, floor: 2 }, { id: 'phoneCharger', name: 'Sạc điện thoại', powerW: 10, hours: 2, standbyW: .1, standbyHours: 22, floor: 1 }
];
export const dailyEnergy = (ledCount = 0) => APPLIANCES.reduce((sum, a) => sum + ((a.id.startsWith('lamp') && Number(a.id.slice(4)) < ledCount ? 9 : a.powerW) * a.hours + (a.standbyW ?? 0) * (a.standbyHours ?? 0)) / 1000, 0);
/** Integrates the refrigerator boundary exactly, independent of render frequency. */
export function earthHourEnergy(from: number, to: number, off: string[] = []) { let energy = 0; const base = Array.from({ length: 5 }, (_, i) => `lamp${i}`).reduce((s, id) => s + (off.includes(id) ? 0 : 60), 0) + (off.includes('tv') ? 0 : 80) + (off.includes('fan') ? 0 : 50); let t = from; while (t < to) {
    const cycle = t % 3600, run = cycle < 1200, next = Math.min(to, t + (run ? 1200 - cycle : 3600 - cycle));
    const fridge = off.includes('fridge') ? 0 : run ? 100 : 2;
    energy += (base + fridge) * (next - t) / 3600000;
    t = next;
} return energy; }
