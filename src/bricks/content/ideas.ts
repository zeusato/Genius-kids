// "Ý tưởng hôm nay" (plan mục 12): 40 chủ đề gợi ý, mỗi ngày 3 cái (cố định theo ngày).
export interface Idea { id: string; name: string; icon: string }
export const IDEAS: Idea[] = [
  ['rua', 'Con rùa', '🐢'], ['nha-cua-so', 'Ngôi nhà có cửa sổ', '🏠'], ['ten-lua', 'Tên lửa', '🚀'], ['xe-kem', 'Xe bán kem', '🍦'],
  ['vit', 'Chú vịt vàng', '🦆'], ['thap', 'Tháp cao chót vót', '🗼'], ['cau', 'Cây cầu', '🌉'], ['robot', 'Rô-bốt', '🤖'],
  ['thuyen', 'Con thuyền', '⛵'], ['khung-long', 'Khủng long', '🦖'], ['lau-dai', 'Lâu đài nhỏ', '🏰'], ['cay', 'Cái cây', '🌳'],
  ['xe-cuu-hoa', 'Xe cứu hoả', '🚒'], ['may-bay', 'Máy bay', '✈️'], ['meo', 'Chú mèo', '🐱'], ['ca', 'Con cá', '🐟'],
  ['ban-ghe', 'Bàn ghế', '🪑'], ['vuon-hoa', 'Vườn hoa', '🌷'], ['tau-hoa', 'Tàu hoả', '🚂'], ['cho', 'Chú chó', '🐶'],
  ['nam', 'Cây nấm', '🍄'], ['den-giao-thong', 'Đèn giao thông', '🚦'], ['banh-sinh-nhat', 'Bánh sinh nhật', '🎂'], ['xe-dua', 'Xe đua', '🏎️'],
  ['ngoi-sao', 'Ngôi sao', '⭐'], ['trai-tim', 'Trái tim', '❤️'], ['chim-canh-cut', 'Chim cánh cụt', '🐧'], ['nha-cay', 'Nhà trên cây', '🌲'],
  ['tau-ngam', 'Tàu ngầm', '🛳️'], ['cua', 'Con cua', '🦀'], ['xich-du', 'Xích đu', '🎠'], ['truong-hoc', 'Trường học', '🏫'],
  ['cau-truot', 'Cầu trượt', '🛝'], ['ong', 'Chú ong', '🐝'], ['ech', 'Con ếch', '🐸'], ['rong', 'Con rồng', '🐉'],
  ['ga', 'Con gà', '🐔'], ['bong-den', 'Bóng đèn', '💡'], ['dong-ho', 'Đồng hồ', '⏰'], ['qua-tao', 'Quả táo', '🍎'],
].map(([id, name, icon]) => ({ id, name, icon }));

/** n ý tưởng cố định trong một ngày (để bé quay lại vẫn thấy giống nhau). */
export function ideasOfDay(date: Date, n = 3): Idea[] {
  let seed = date.getFullYear() * 1000 + Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const pool = IDEAS.slice(), out: Idea[] = [];
  while (out.length < n && pool.length) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; out.push(pool.splice(seed % pool.length, 1)[0]); }
  return out;
}
