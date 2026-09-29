// Thí nghiệm kinh điển: 11 mẫu dùng lại, tham số theo từng nguyên tố. Chỉ để XEM — không hướng dẫn cách làm.
// Số liệu: màu lửa/phóng điện theo các bảng hóa học phổ thông (CRC, RSC); nhiệt độ theo elementsData.ts.

export type ExperimentId = 'water' | 'flame' | 'discharge' | 'voice' | 'heat' | 'magnet' | 'burn' | 'float' | 'uv' | 'geiger' | 'collide';

export const EXPERIMENT_INFO: Record<ExperimentId, { label: string; icon: string; safety?: string }> = {
    water: { label: 'Thả vào nước', icon: '💦', safety: 'Chỉ nhà khoa học mới làm, có kính và găng bảo hộ.' },
    flame: { label: 'Màu ngọn lửa', icon: '🔥', safety: 'Lửa rất nóng — chỉ làm cùng thầy cô.' },
    discharge: { label: 'Bật điện', icon: '⚡' },
    voice: { label: 'Giọng nói lạ', icon: '🎤', safety: 'Đừng bao giờ hít khí từ bóng bay — có thể ngất xỉu!' },
    heat: { label: 'Nóng · lạnh', icon: '🌡️' },
    magnet: { label: 'Nam châm', icon: '🧲' },
    burn: { label: 'Đốt cháy', icon: '🕯️', safety: 'Không nhìn thẳng vào ngọn lửa magnesium.' },
    float: { label: 'Nổi hay chìm', icon: '⚖️' },
    uv: { label: 'Đèn cực tím', icon: '🔦' },
    geiger: { label: 'Máy đếm phóng xạ', icon: '📟', safety: 'Chất phóng xạ nguy hiểm — chỉ nhà khoa học được chạm vào.' },
    collide: { label: 'Máy gia tốc', icon: '🌀' },
};

/** Màu ngọn lửa khi đốt muối của nguyên tố. */
export const FLAME_COLOR: Record<number, { color: string; name: string }> = {
    3: { color: '#e3173e', name: 'đỏ thẫm' }, 11: { color: '#ffb000', name: 'vàng' }, 19: { color: '#c8a2ff', name: 'tím nhạt' },
    37: { color: '#d6457a', name: 'đỏ tím' }, 55: { color: '#6a7bff', name: 'xanh tím' }, 20: { color: '#ff6a2b', name: 'đỏ cam' },
    38: { color: '#ff1a1a', name: 'đỏ tươi' }, 56: { color: '#9ae66e', name: 'xanh lá' }, 29: { color: '#2ed3b7', name: 'xanh lam lục' },
    5: { color: '#7cff4f', name: 'xanh lá sáng' },
};

/** Màu ánh sáng khi phóng điện qua khí. */
export const DISCHARGE_COLOR: Record<number, { color: string; name: string }> = {
    1: { color: '#e06bb5', name: 'hồng tím' }, 2: { color: '#ffb08a', name: 'hồng cam' }, 7: { color: '#c77dff', name: 'tím hồng' },
    8: { color: '#d9c8ff', name: 'tím nhạt' }, 10: { color: '#ff4e1a', name: 'đỏ cam' }, 18: { color: '#b57cff', name: 'tím' },
    36: { color: '#ede7f6', name: 'trắng ngà' }, 54: { color: '#6fa8ff', name: 'xanh lam' }, 80: { color: '#8fb4ff', name: 'xanh lam nhạt' },
};

export interface ExperimentSpec { id: ExperimentId; say: string; params?: Record<string, number | string> }

const E = (id: ExperimentId, say: string, params?: ExperimentSpec['params']): ExperimentSpec => ({ id, say, params });

export const EXPERIMENTS: Record<number, ExperimentSpec[]> = {
    1: [E('discharge', 'Hydrogen phát ánh sáng hồng tím.'), E('burn', 'Châm lửa vào bóng hydrogen: “bụp”! Hydrogen cháy với oxygen tạo ra nước.', { style: 'pop' })],
    2: [E('voice', 'Helium nhẹ nên âm thanh đi nhanh hơn, giọng nói nghe the thé như chuột!', { fx: 'helium' }), E('discharge', 'Helium phát ánh sáng hồng cam.')],
    3: [E('water', 'Lithium nổi và sủi bọt nhẹ nhàng, chạy chầm chậm trên mặt nước.', { power: 1 }), E('flame', 'Lửa lithium màu đỏ thẫm.'), E('float', 'Lithium nhẹ đến mức nổi trên dầu.', { liquid: 'oil' })],
    7: [E('heat', 'Nitơ lỏng lạnh −196 °C: bông hoa nhúng vào trở nên giòn, gõ là vỡ vụn!', { mode: 'freeze' }), E('discharge', 'Nitơ phát ánh sáng tím hồng.')],
    8: [E('heat', 'Oxygen hóa lỏng ở −183 °C và có màu xanh nhạt rất đẹp.', { mode: 'liquefy' }), E('magnet', 'Oxygen lỏng bị nam châm hút, dính giữa hai cực!', { liquid: 1 }), E('discharge', 'Oxygen phát ánh sáng tím nhạt.')],
    10: [E('discharge', 'Neon phát ánh sáng đỏ cam — màu của biển hiệu đèn neon.')],
    11: [E('water', 'Natri chạy vòng vòng trên mặt nước, sủi bọt xèo xèo, có khi bốc lửa vàng!', { power: 2 }), E('flame', 'Lửa natri màu vàng — giống đèn đường ban đêm.')],
    12: [E('burn', 'Magnesium cháy sáng trắng chói lóa, sáng tới mức không được nhìn thẳng.', { style: 'white' })],
    15: [E('burn', 'Quẹt que diêm vào vỏ hộp: phosphorus đỏ bén lửa ngay.', { style: 'match' })],
    16: [E('burn', 'Lưu huỳnh cháy với ngọn lửa xanh lam, bốc mùi hắc.', { style: 'blue' })],
    18: [E('discharge', 'Argon phát ánh sáng tím.')],
    19: [E('water', 'Kali vừa chạm nước đã bốc cháy với ngọn lửa tím!', { power: 3 }), E('flame', 'Lửa kali màu tím nhạt.')],
    20: [E('water', 'Calcium chìm xuống và sủi bọt đều đều — hiền hơn kim loại kiềm nhiều.', { power: 0.5, sink: 1 }), E('flame', 'Lửa calcium màu đỏ cam.')],
    26: [E('magnet', 'Sắt bị nam châm hút mạnh.'), E('burn', 'Bùi nhùi sắt cháy tóe tia lửa như pháo hoa nhỏ.', { style: 'sparks' }), E('float', 'Sắt chìm trong nước nhưng lại NỔI trên thủy ngân!', { liquid: 'mercury' })],
    27: [E('magnet', 'Cobalt bị nam châm hút.')],
    28: [E('magnet', 'Nickel bị nam châm hút — đồng xu có nickel cũng vậy.')],
    29: [E('flame', 'Lửa đồng màu xanh lam lục.'), E('magnet', 'Đồng KHÔNG bị nam châm hút.', { none: 1 })],
    31: [E('heat', 'Gallium chảy lỏng ở 29,8 °C — nóng hơn phòng một chút, cầm trong tay là chảy!', { mode: 'hand' })],
    35: [E('heat', 'Bromine là chất lỏng, bốc hơi màu nâu đỏ ngay ở nhiệt độ phòng.', { mode: 'vapor' })],
    36: [E('discharge', 'Krypton phát ánh sáng trắng ngà.')],
    37: [E('water', 'Rubidium gặp nước là nổ lách tách dữ dội!', { power: 4 })],
    38: [E('flame', 'Lửa strontium đỏ tươi — màu đỏ của pháo hoa.')],
    53: [E('heat', 'Hơ nóng iodine: tinh thể tím đen bay thẳng thành hơi tím, không cần chảy lỏng (thăng hoa).', { mode: 'sublime' })],
    54: [E('voice', 'Xenon nặng nên giọng nói trầm ồm như người khổng lồ.', { fx: 'xenon' }), E('discharge', 'Xenon phát ánh sáng xanh lam.')],
    55: [E('water', 'Caesium gặp nước là nổ tung — kim loại kiềm càng xuống dưới càng dữ!', { power: 5 })],
    56: [E('flame', 'Lửa barium màu xanh lá.')],
    60: [E('magnet', 'Nam châm neodymium mạnh đến mức hút cả chùm kẹp giấy từ xa.', { strong: 1 })],
    64: [E('magnet', 'Gadolinium chỉ bị nam châm hút khi lạnh hơn khoảng 20 °C.')],
    63: [E('uv', 'Dưới đèn cực tím, tờ tiền euro hiện lên những vệt sáng nhờ europium.', { glow: '#ff5a5a' })],
    74: [E('heat', 'Dây tóc tungsten nóng tới hơn 2.500 °C, rực sáng mà không chảy.', { mode: 'filament' })],
    79: [E('float', 'Vàng nặng đến mức chìm cả trong thủy ngân!', { liquid: 'mercury' }), E('magnet', 'Vàng KHÔNG bị nam châm hút.', { none: 1 })],
    80: [E('heat', 'Thủy ngân đông đặc ở −39 °C, sôi ở 357 °C.', { mode: 'freeze-metal' }), E('discharge', 'Hơi thủy ngân phát ánh sáng xanh lam nhạt.')],
    82: [E('float', 'Chì nặng, chìm trong nước nhưng nổi trên thủy ngân.', { liquid: 'mercury' })],
    88: [E('uv', 'Radium tự phát sáng trong bóng tối — xưa người ta sơn lên kim đồng hồ.', { glow: '#9dffb0', self: 1 }), E('geiger', 'Máy đếm kêu lách tách rất nhanh.', { rate: 9 })],
    89: [E('uv', 'Actinium tự phát ánh sáng xanh nhạt.', { glow: '#9cc8ff', self: 1 }), E('geiger', 'Máy đếm kêu lách tách dồn dập.', { rate: 10 })],
    92: [E('uv', 'Thủy tinh có uranium phát sáng xanh lục dưới đèn cực tím.', { glow: '#7dff5a' }), E('geiger', 'Máy đếm kêu lách tách chậm rãi.', { rate: 3 })],
};

// Mọi nguyên tố phóng xạ có mẫu vật: máy đếm; mọi nguyên tố siêu nặng: máy gia tốc.
export const COLLIDE_RECIPE: Record<number, [projectile: string, target: string]> = {
    104: ['Carbon-12', 'Californium-249'], 105: ['Nitơ-15', 'Californium-249'], 106: ['Chromium-54', 'Chì-208'],
    107: ['Chromium-54', 'Bismuth-209'], 108: ['Sắt-58', 'Chì-208'], 109: ['Sắt-58', 'Bismuth-209'], 110: ['Nickel-62', 'Chì-208'],
    111: ['Nickel-64', 'Bismuth-209'], 112: ['Kẽm-70', 'Chì-208'], 113: ['Kẽm-70', 'Bismuth-209'], 114: ['Calcium-48', 'Plutonium-244'],
    115: ['Calcium-48', 'Americium-243'], 116: ['Calcium-48', 'Curium-248'], 117: ['Calcium-48', 'Berkelium-249'], 118: ['Calcium-48', 'Californium-249'],
};

export function experimentsOf(z: number, radioactive: boolean): ExperimentSpec[] {
    const list = [...(EXPERIMENTS[z] ?? [])];
    if (z >= 99) list.push(E('collide', COLLIDE_RECIPE[z]
        ? `Bắn hạt nhân ${COLLIDE_RECIPE[z][0]} thật nhanh vào ${COLLIDE_RECIPE[z][1]}: đôi khi chúng dính vào nhau thành nguyên tố mới, rồi vỡ ra sau một chớp mắt.`
        : 'Các nhà khoa học bắn hạt nhân vào nhau trong máy gia tốc để tạo ra nguyên tố này.'));
    else if (radioactive && !list.some(e => e.id === 'geiger') && ![86].includes(z)) list.push(E('geiger', 'Máy đếm kêu lách tách: hạt nhân đang tự vỡ ra.', { rate: 5 }));
    return list;
}
