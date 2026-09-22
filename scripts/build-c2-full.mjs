import { applyContentReviewV4 } from './english-content-review-v4.mjs';
/**
 * scripts/build-c2-full.mjs
 * Sinh toàn bộ dữ liệu chuẩn chỉnh cho Bậc C2 (prepositions-conjunctions):
 * - C2.vocab.json: 105 từ vựng (đầy đủ IPA General American, POS, Forms, Image/Emoji, Tags, Examples)
 * - C2.sentences.json: 200 câu (độ khó ~40% 1, ~35% 2, ~25% 3, token hóa 100%, clause roles, blanks giới từ & liên từ)
 * - C2.theory.json: Lý thuyết đầy đủ cấu trúc, formulas, sections, commonMistakes, tips, exampleIds trỏ đúng.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data/english');

// =========================================================================
// 1. TỪ VỰNG C2 (105 TỪ VỰNG KHÔNG TRÙNG LẶP)
// =========================================================================
const vocabList = [
  // 1. Giới từ nơi chốn (20 từ)
  { en: 'in', vi: 'ở trong', pos: 'preposition', ipa: '/ɪn/', image: '📦', tags: ['preposition', 'place'], exampleEn: 'The pen is in the pencil case.', exampleVi: 'Chiếc bút ở trong hộp bút.' },
  { en: 'on', vi: 'ở trên (tiếp xúc bề mặt)', pos: 'preposition', ipa: '/ɑːn/', image: '📖', tags: ['preposition', 'place'], exampleEn: 'The book is on the desk.', exampleVi: 'Cuốn sách ở trên bàn học.' },
  { en: 'at', vi: 'ở tại (địa điểm cụ thể)', pos: 'preposition', ipa: '/æt/', image: '📍', tags: ['preposition', 'place'], exampleEn: 'She is waiting at the bus stop.', exampleVi: 'Cô ấy đang đợi ở trạm xe buýt.' },
  { en: 'under', vi: 'ở dưới, phía dưới', pos: 'preposition', ipa: '/ˈʌn.dɚ/', image: '⬇️', tags: ['preposition', 'place'], exampleEn: 'The cat is sleeping under the bed.', exampleVi: 'Con mèo đang ngủ dưới gầm giường.' },
  { en: 'behind', vi: 'ở đằng sau, phía sau', pos: 'preposition', ipa: '/bɪˈhaɪnd/', image: '🔙', tags: ['preposition', 'place'], exampleEn: 'The bicycle is behind the house.', exampleVi: 'Chiếc xe đạp ở phía sau ngôi nhà.' },
  { en: 'next to', vi: 'ở bên cạnh', pos: 'preposition', ipa: '/ˈnekst tuː/', image: '👉', tags: ['preposition', 'place'], exampleEn: 'My chair is next to the window.', exampleVi: 'Ghế của tôi ở bên cạnh cửa sổ.' },
  { en: 'between', vi: 'ở giữa (hai đối tượng)', pos: 'preposition', ipa: '/bɪˈtwiːn/', image: '↔️', tags: ['preposition', 'place'], exampleEn: 'The lamp is between the bed and the table.', exampleVi: 'Cái đèn ở giữa giường và bàn.' },
  { en: 'in front of', vi: 'ở phía trước', pos: 'preposition', ipa: '/ɪn ˈfrʌnt əv/', image: '⏭️', tags: ['preposition', 'place'], exampleEn: 'A big car is in front of the gate.', exampleVi: 'Một chiếc ô tô lớn ở phía trước cổng.' },
  { en: 'near', vi: 'ở gần', pos: 'preposition', ipa: '/nɪr/', image: '🏡', tags: ['preposition', 'place'], exampleEn: 'Our school is near the park.', exampleVi: 'Trường học của chúng tôi ở gần công viên.' },
  { en: 'above', vi: 'ở phía trên (không chạm vào)', pos: 'preposition', ipa: '/əˈbʌv/', image: '⬆️', tags: ['preposition', 'place'], exampleEn: 'The clock is above the board.', exampleVi: 'Chiếc đồng hồ ở phía trên bảng.' },
  { en: 'below', vi: 'ở phía dưới (thấp hơn)', pos: 'preposition', ipa: '/bɪˈloʊ/', image: '⬇️', tags: ['preposition', 'place'], exampleEn: 'The mirror is below the shelf.', exampleVi: 'Chiếc gương ở phía dưới cái kệ.' },
  { en: 'opposite', vi: 'ở đối diện', pos: 'preposition', ipa: '/ˈɑː.pə.zɪt/', image: '🔄', tags: ['preposition', 'place'], exampleEn: 'The bookstore is opposite the bakery.', exampleVi: 'Hiệu sách ở đối diện tiệm bánh.' },
  { en: 'inside', vi: 'ở bên trong', pos: 'preposition', ipa: '/ɪnˈsaɪd/', image: '🏠', tags: ['preposition', 'place'], exampleEn: 'The puppies are inside the basket.', exampleVi: 'Những chú cún con đang ở bên trong chiếc giỏ.' },
  { en: 'outside', vi: 'ở bên ngoài', pos: 'preposition', ipa: '/ˌaʊtˈsaɪd/', image: '🌳', tags: ['preposition', 'place'], exampleEn: 'The children are playing outside the classroom.', exampleVi: 'Lũ trẻ đang chơi ở bên ngoài lớp học.' },
  { en: 'beside', vi: 'ngay bên cạnh', pos: 'preposition', ipa: '/bɪˈsaɪd/', image: '👥', tags: ['preposition', 'place'], exampleEn: 'She sat beside her mother.', exampleVi: 'Cô bé ngồi ngay cạnh mẹ.' },
  { en: 'among', vi: 'ở giữa (nhiều đối tượng)', pos: 'preposition', ipa: '/əˈmʌŋ/', image: '🌲', tags: ['preposition', 'place'], exampleEn: 'The small house is among tall trees.', exampleVi: 'Ngôi nhà nhỏ nằm giữa những cái cây cao.' },
  { en: 'around', vi: 'xung quanh', pos: 'preposition', ipa: '/əˈraʊnd/', image: '🔄', tags: ['preposition', 'place'], exampleEn: 'We walked around the lake.', exampleVi: 'Chúng tôi đi bộ xung quanh hồ.' },
  { en: 'against', vi: 'dựa vào, tựa vào', pos: 'preposition', ipa: '/əˈɡenst/', image: '🧱', tags: ['preposition', 'place'], exampleEn: 'The ladder is against the wall.', exampleVi: 'Chiếc thang đang tựa vào tường.' },
  { en: 'across', vi: 'băng qua, ở bên kia', pos: 'preposition', ipa: '/əˈkrɑːs/', image: '🌉', tags: ['preposition', 'place'], exampleEn: 'He walked across the street.', exampleVi: 'Cậu ấy đã đi bộ băng qua đường.' },
  { en: 'by', vi: 'ở bên cạnh, gần', pos: 'preposition', ipa: '/baɪ/', image: '🚪', tags: ['preposition', 'place'], exampleEn: 'The shoes are by the door.', exampleVi: 'Đôi giày ở bên cạnh cửa ra vào.' },

  // 2. Giới từ thời gian & chuyển động (15 từ)
  { en: 'before', vi: 'trước khi, trước', pos: 'preposition', ipa: '/bɪˈfɔːr/', image: '⏮️', tags: ['preposition', 'time'], exampleEn: 'Wash your hands before dinner.', exampleVi: 'Hãy rửa tay trước bữa tối.' },
  { en: 'after', vi: 'sau khi, sau', pos: 'preposition', ipa: '/ˈæf.tɚ/', image: '⏭️', tags: ['preposition', 'time'], exampleEn: 'We played games after school.', exampleVi: 'Chúng tôi chơi trò chơi sau giờ học.' },
  { en: 'during', vi: 'trong suốt (khoảng thời gian)', pos: 'preposition', ipa: '/ˈdʊr.ɪŋ/', image: '⏳', tags: ['preposition', 'time'], exampleEn: 'Do not talk during the exam.', exampleVi: 'Đừng nói chuyện trong suốt giờ kiểm tra.' },
  { en: 'until', vi: 'cho đến khi', pos: 'preposition', ipa: '/ənˈtɪl/', image: '⏱️', tags: ['preposition', 'time'], exampleEn: 'Wait here until five o\'clock.', exampleVi: 'Hãy đợi ở đây cho đến 5 giờ.' },
  { en: 'since', vi: 'từ khi, kể từ', pos: 'preposition', ipa: '/sɪns/', image: '📅', tags: ['preposition', 'time'], exampleEn: 'He has lived here since Monday.', exampleVi: 'Cậu ấy ở đây kể từ thứ Hai.' },
  { en: 'for', vi: 'trong khoảng (thời gian)', pos: 'preposition', ipa: '/fɔːr/', image: '⌛', tags: ['preposition', 'time'], exampleEn: 'We rested for two hours.', exampleVi: 'Chúng tôi đã nghỉ ngơi trong 2 giờ.' },
  { en: 'from', vi: 'từ (nơi chốn hoặc thời gian)', pos: 'preposition', ipa: '/frʌm/', image: '🛫', tags: ['preposition', 'direction'], exampleEn: 'I walked from the park to my house.', exampleVi: 'Tôi đi bộ từ công viên về nhà tôi.' },
  { en: 'to', vi: 'đến, tới', pos: 'preposition', ipa: '/tuː/', image: '🎯', tags: ['preposition', 'direction'], exampleEn: 'She goes to school by bicycle.', exampleVi: 'Cô ấy đi đến trường bằng xe đạp.' },
  { en: 'into', vi: 'vào bên trong', pos: 'preposition', ipa: '/ˈɪn.tuː/', image: '📥', tags: ['preposition', 'direction'], exampleEn: 'The frog jumped into the pond.', exampleVi: 'Con ếch nhảy vào trong ao.' },
  { en: 'out of', vi: 'ra khỏi', pos: 'preposition', ipa: '/ˌaʊt əv/', image: '📤', tags: ['preposition', 'direction'], exampleEn: 'The cat jumped out of the box.', exampleVi: 'Con mèo nhảy ra khỏi chiếc hộp.' },
  { en: 'through', vi: 'xuyên qua, qua', pos: 'preposition', ipa: '/θruː/', image: '🚇', tags: ['preposition', 'direction'], exampleEn: 'The train went through the tunnel.', exampleVi: 'Đoàn tàu đi qua đường hầm.' },
  { en: 'toward', vi: 'về phía, hướng tới', pos: 'preposition', ipa: '/tɔːrd/', image: '🧭', tags: ['preposition', 'direction'], exampleEn: 'They are running toward the finish line.', exampleVi: 'Họ đang chạy về phía vạch đích.' },
  { en: 'along', vi: 'dọc theo', pos: 'preposition', ipa: '/əˈlɑːŋ/', image: '🚶', tags: ['preposition', 'direction'], exampleEn: 'We walked along the quiet river.', exampleVi: 'Chúng tôi đi bộ dọc theo con sông yên bình.' },
  { en: 'past', vi: 'băng qua, đi qua', pos: 'preposition', ipa: '/pæst/', image: '⏩', tags: ['preposition', 'direction'], exampleEn: 'The bus drove past our school.', exampleVi: 'Chiếc xe buýt chạy qua trường học của chúng tôi.' },
  { en: 'up', vi: 'lên trên', pos: 'preposition', ipa: '/ʌp/', image: '🧗', tags: ['preposition', 'direction'], exampleEn: 'The monkey climbed up the tall tree.', exampleVi: 'Chú khỉ trèo lên cái cây cao.' },

  // 3. Liên từ cốt lõi (7 từ)
  { en: 'and', vi: 'và (nối bổ sung)', pos: 'conjunction', ipa: '/ænd/', image: '➕', tags: ['conjunction'], exampleEn: 'I like apples and oranges.', exampleVi: 'Tôi thích táo và cam.' },
  { en: 'but', vi: 'nhưng (nối tương phản)', pos: 'conjunction', ipa: '/bʌt/', image: '⚡', tags: ['conjunction'], exampleEn: 'He is small but he is strong.', exampleVi: 'Cậu ấy nhỏ con nhưng cậu ấy rất khỏe.' },
  { en: 'or', vi: 'hoặc, hay là (lựa chọn)', pos: 'conjunction', ipa: '/ɔːr/', image: '🔀', tags: ['conjunction'], exampleEn: 'Do you want tea or milk?', exampleVi: 'Bạn muốn trà hay sữa?' },
  { en: 'so', vi: 'vì vậy, cho nên (kết quả)', pos: 'conjunction', ipa: '/soʊ/', image: '👉', tags: ['conjunction'], exampleEn: 'It was raining, so we stayed home.', exampleVi: 'Trời mưa, vì vậy chúng tôi ở nhà.' },
  { en: 'because', vi: 'bởi vì (nguyên nhân)', pos: 'conjunction', ipa: '/bɪˈkɑːz/', image: '💡', tags: ['conjunction'], exampleEn: 'She is happy because she won.', exampleVi: 'Cô ấy vui vì cô ấy đã chiến thắng.' },
  { en: 'if', vi: 'nếu (điều kiện)', pos: 'conjunction', ipa: '/ɪf/', image: '❓', tags: ['conjunction'], exampleEn: 'Take an umbrella if it rains.', exampleVi: 'Hãy mang theo ô nếu trời mưa.' },
  { en: 'then', vi: 'sau đó, rồi thì', pos: 'adverb', ipa: '/ðen/', image: '➡️', tags: ['connector'], exampleEn: 'Wash your face, then eat breakfast.', exampleVi: 'Hãy rửa mặt, sau đó ăn sáng.' },

  // 4. Danh từ đồ vật trong nhà & vị trí (30 từ)
  { en: 'desk', vi: 'bàn học, bàn làm việc', pos: 'noun', ipa: '/desk/', forms: { plural: 'desks' }, image: '🪑', tags: ['furniture'], exampleEn: 'The notebook is on the desk.', exampleVi: 'Vở ghi ở trên bàn học.' },
  { en: 'chair', vi: 'chiếc ghế', pos: 'noun', ipa: '/tʃer/', forms: { plural: 'chairs' }, image: '🪑', tags: ['furniture'], exampleEn: 'He sat on the chair.', exampleVi: 'Cậu ấy ngồi trên ghế.' },
  { en: 'bed', vi: 'chiếc giường', pos: 'noun', ipa: '/bed/', forms: { plural: 'beds' }, image: '🛏️', tags: ['furniture'], exampleEn: 'My doll is on the bed.', exampleVi: 'Búp bê của tôi ở trên giường.' },
  { en: 'sofa', vi: 'ghế sô pha', pos: 'noun', ipa: '/ˈsoʊ.fə/', forms: { plural: 'sofas' }, image: '🛋️', tags: ['furniture'], exampleEn: 'The cat is sleeping on the sofa.', exampleVi: 'Con mèo đang ngủ trên ghế sô pha.' },
  { en: 'table', vi: 'cái bàn ăn', pos: 'noun', ipa: '/ˈteɪ.bəl/', forms: { plural: 'tables' }, image: '🍽️', tags: ['furniture'], exampleEn: 'Dinner is on the table.', exampleVi: 'Bữa tối đã dọn trên bàn.' },
  { en: 'shelf', vi: 'cái giá, cái kệ', pos: 'noun', ipa: '/ʃelf/', forms: { plural: 'shelves' }, image: '🧱', tags: ['furniture'], exampleEn: 'The books are on the shelf.', exampleVi: 'Những cuốn sách ở trên kệ.' },
  { en: 'drawer', vi: 'ngăn kéo', pos: 'noun', ipa: '/drɔːr/', forms: { plural: 'drawers' }, image: '🗄️', tags: ['furniture'], exampleEn: 'The keys are in the drawer.', exampleVi: 'Chìa khóa ở trong ngăn kéo.' },
  { en: 'closet', vi: 'tủ quần áo', pos: 'noun', ipa: '/ˈklɑː.zət/', forms: { plural: 'closets' }, image: '🚪', tags: ['furniture'], exampleEn: 'Hangers are in the closet.', exampleVi: 'Móc treo ở trong tủ áo.' },
  { en: 'carpet', vi: 'tấm thảm trải sàn', pos: 'noun', ipa: '/ˈkɑːr.pɪt/', forms: { plural: 'carpets' }, image: '🧶', tags: ['furniture'], exampleEn: 'The dog lies on the carpet.', exampleVi: 'Chú chó nằm trên thảm.' },
  { en: 'pillow', vi: 'cái gối', pos: 'noun', ipa: '/ˈpɪl.oʊ/', forms: { plural: 'pillows' }, image: '🛏️', tags: ['furniture'], exampleEn: 'The pillow is soft.', exampleVi: 'Chiếc gối rất êm.' },
  { en: 'blanket', vi: 'cái chăn', pos: 'noun', ipa: '/ˈblæŋ.kɪt/', forms: { plural: 'blankets' }, image: '🛌', tags: ['furniture'], exampleEn: 'The warm blanket is on the bed.', exampleVi: 'Chiếc chăn ấm ở trên giường.' },
  { en: 'lamp', vi: 'cây đèn bàn', pos: 'noun', ipa: '/læmp/', forms: { plural: 'lamps' }, image: '💡', tags: ['furniture'], exampleEn: 'Turn on the desk lamp.', exampleVi: 'Hãy bật đèn bàn lên.' },
  { en: 'mirror', vi: 'cái gương', pos: 'noun', ipa: '/ˈmɪr.ɚ/', forms: { plural: 'mirrors' }, image: '🪞', tags: ['furniture'], exampleEn: 'The mirror is on the wall.', exampleVi: 'Chiếc gương treo trên tường.' },
  { en: 'door', vi: 'cánh cửa ra vào', pos: 'noun', ipa: '/dɔːr/', forms: { plural: 'doors' }, image: '🚪', tags: ['house'], exampleEn: 'Please close the door.', exampleVi: 'Làm ơn đóng cửa lại.' },
  { en: 'window', vi: 'cửa sổ', pos: 'noun', ipa: '/ˈwɪn.doʊ/', forms: { plural: 'windows' }, image: '🪟', tags: ['house'], exampleEn: 'Look out the window.', exampleVi: 'Hãy nhìn ra ngoài cửa sổ.' },
  { en: 'wall', vi: 'bức tường', pos: 'noun', ipa: '/wɑːl/', forms: { plural: 'walls' }, image: '🧱', tags: ['house'], exampleEn: 'A picture is on the wall.', exampleVi: 'Bức tranh treo trên tường.' },
  { en: 'floor', vi: 'sàn nhà', pos: 'noun', ipa: '/flɔːr/', forms: { plural: 'floors' }, image: '🪵', tags: ['house'], exampleEn: 'Do not drop trash on the floor.', exampleVi: 'Đừng vứt rác ra sàn nhà.' },
  { en: 'ceiling', vi: 'trần nhà', pos: 'noun', ipa: '/ˈsiː.lɪŋ/', forms: { plural: 'ceilings' }, image: '🏠', tags: ['house'], exampleEn: 'The fan hangs from the ceiling.', exampleVi: 'Chiếc quạt treo trên trần nhà.' },
  { en: 'corner', vi: 'góc (phòng, đường)', pos: 'noun', ipa: '/ˈkɔːr.nɚ/', forms: { plural: 'corners' }, image: '📐', tags: ['place'], exampleEn: 'The box is in the corner.', exampleVi: 'Chiếc hộp ở trong góc phòng.' },
  { en: 'middle', vi: 'phần giữa, ở giữa', pos: 'noun', ipa: '/ˈmɪd.əl/', image: '🎯', tags: ['place'], exampleEn: 'Stand in the middle of the room.', exampleVi: 'Hãy đứng ở giữa phòng.' },
  { en: 'center', vi: 'trung tâm', pos: 'noun', ipa: '/ˈsen.tɚ/', forms: { plural: 'centers' }, image: '📍', tags: ['place'], exampleEn: 'The fountain is in the center of the park.', exampleVi: 'Đài phun nước ở trung tâm công viên.' },
  { en: 'left', vi: 'bên trái', pos: 'noun', ipa: '/left/', image: '⬅️', tags: ['direction'], exampleEn: 'Turn to the left.', exampleVi: 'Hãy rẽ sang bên trái.' },
  { en: 'right', vi: 'bên phải', pos: 'noun', ipa: '/raɪt/', image: '➡️', tags: ['direction'], exampleEn: 'The shop is on the right.', exampleVi: 'Cửa hàng ở bên phải.' },
  { en: 'kitchen', vi: 'nhà bếp', pos: 'noun', ipa: '/ˈkɪtʃ.ən/', forms: { plural: 'kitchens' }, image: '🍳', tags: ['room'], exampleEn: 'Mom is cooking in the kitchen.', exampleVi: 'Mẹ đang nấu ăn trong bếp.' },
  { en: 'bedroom', vi: 'phòng ngủ', pos: 'noun', ipa: '/ˈbed.ruːm/', forms: { plural: 'bedrooms' }, image: '🛏️', tags: ['room'], exampleEn: 'My brother is reading in the bedroom.', exampleVi: 'Anh tôi đang đọc sách trong phòng ngủ.' },
  { en: 'bathroom', vi: 'phòng tắm', pos: 'noun', ipa: '/ˈbæθ.ruːm/', forms: { plural: 'bathrooms' }, image: '🛁', tags: ['room'], exampleEn: 'Brush your teeth in the bathroom.', exampleVi: 'Hãy đánh răng trong phòng tắm.' },
  { en: 'garden', vi: 'khu vườn', pos: 'noun', ipa: '/ˈɡɑːr.dən/', forms: { plural: 'gardens' }, image: '🌻', tags: ['place'], exampleEn: 'Roses bloom in the garden.', exampleVi: 'Hoa hồng nở rộ trong vườn.' },
  { en: 'yard', vi: 'cái sân', pos: 'noun', ipa: '/jɑːrd/', forms: { plural: 'yards' }, image: '🏡', tags: ['place'], exampleEn: 'The dog is barking in the yard.', exampleVi: 'Chú chó đang sủa trong sân.' },
  { en: 'balcony', vi: 'ban công', pos: 'noun', ipa: '/ˈbæl.kə.ni/', forms: { plural: 'balconies' }, image: '🏢', tags: ['place'], exampleEn: 'Flower pots are on the balcony.', exampleVi: 'Những chậu hoa ở trên ban công.' },
  { en: 'gate', vi: 'cổng ra vào', pos: 'noun', ipa: '/ɡeɪt/', forms: { plural: 'gates' }, image: '⛩️', tags: ['place'], exampleEn: 'The postman is at the gate.', exampleVi: 'Người đưa thư đang ở cổng.' },

  // 5. Mốc thời gian (15 từ)
  { en: 'morning', vi: 'buổi sáng', pos: 'noun', ipa: '/ˈmɔːr.nɪŋ/', forms: { plural: 'mornings' }, image: '🌅', tags: ['time'], exampleEn: 'We have English in the morning.', exampleVi: 'Chúng tôi học tiếng Anh vào buổi sáng.' },
  { en: 'afternoon', vi: 'buổi chiều', pos: 'noun', ipa: '/ˌæf.tɚˈnuːn/', forms: { plural: 'afternoons' }, image: '☀️', tags: ['time'], exampleEn: 'I play soccer in the afternoon.', exampleVi: 'Tôi chơi bóng đá vào buổi chiều.' },
  { en: 'evening', vi: 'buổi tối', pos: 'noun', ipa: '/ˈiːv.nɪŋ/', forms: { plural: 'evenings' }, image: '🌆', tags: ['time'], exampleEn: 'We watch TV in the evening.', exampleVi: 'Chúng tôi xem TV vào buổi tối.' },
  { en: 'night', vi: 'đêm, ban đêm', pos: 'noun', ipa: '/naɪt/', forms: { plural: 'nights' }, image: '🌙', tags: ['time'], exampleEn: 'Stars shine brightly at night.', exampleVi: 'Những vì sao tỏa sáng lấp lánh vào ban đêm.' },
  { en: 'noon', vi: 'buổi trưa (12 giờ trưa)', pos: 'noun', ipa: '/nuːn/', image: '🕛', tags: ['time'], exampleEn: 'We have lunch at noon.', exampleVi: 'Chúng tôi ăn trưa vào buổi trưa.' },
  { en: 'midnight', vi: 'nửa đêm (12 giờ đêm)', pos: 'noun', ipa: '/ˈmɪd.naɪt/', image: '🌃', tags: ['time'], exampleEn: 'The town is quiet at midnight.', exampleVi: 'Thị trấn yên tĩnh lúc nửa đêm.' },
  { en: 'weekend', vi: 'cuối tuần', pos: 'noun', ipa: '/ˈwiːk.end/', forms: { plural: 'weekends' }, image: '🏖️', tags: ['time'], exampleEn: 'We visit grandparents on the weekend.', exampleVi: 'Chúng tôi thăm ông bà vào cuối tuần.' },
  { en: 'weekday', vi: 'ngày trong tuần (từ thứ 2 đến thứ 6)', pos: 'noun', ipa: '/ˈwiːk.deɪ/', forms: { plural: 'weekdays' }, image: '💼', tags: ['time'], exampleEn: 'Students go to school on weekdays.', exampleVi: 'Học sinh đi học vào các ngày trong tuần.' },
  { en: 'holiday', vi: 'kỳ nghỉ, ngày lễ', pos: 'noun', ipa: '/ˈhɑː.lə.deɪ/', forms: { plural: 'holidays' }, image: '🎉', tags: ['time'], exampleEn: 'We travel during the summer holiday.', exampleVi: 'Chúng tôi đi du lịch trong kỳ nghỉ hè.' },
  { en: 'month', vi: 'tháng', pos: 'noun', ipa: '/mʌnθ/', forms: { plural: 'months' }, image: '📅', tags: ['time'], exampleEn: 'My birthday is in this month.', exampleVi: 'Sinh nhật của tôi vào tháng này.' },
  { en: 'year', vi: 'năm', pos: 'noun', ipa: '/jɪr/', forms: { plural: 'years' }, image: '🗓️', tags: ['time'], exampleEn: 'We will enter grade five next year.', exampleVi: 'Chúng tôi sẽ lên lớp 5 vào năm sau.' },
  { en: 'spring', vi: 'mùa xuân', pos: 'noun', ipa: '/sprɪŋ/', forms: { plural: 'springs' }, image: '🌸', tags: ['season'], exampleEn: 'Flowers bloom in spring.', exampleVi: 'Hoa nở rộ vào mùa xuân.' },
  { en: 'summer', vi: 'mùa hè', pos: 'noun', ipa: '/ˈsʌm.ɚ/', forms: { plural: 'summers' }, image: '☀️', tags: ['season'], exampleEn: 'We swim in the summer.', exampleVi: 'Chúng tôi đi bơi vào mùa hè.' },
  { en: 'autumn', vi: 'mùa thu', pos: 'noun', ipa: '/ˈɑː.t̬əm/', forms: { plural: 'autumns' }, image: '🍁', tags: ['season'], exampleEn: 'Leaves turn yellow in autumn.', exampleVi: 'Lá chuyển vàng vào mùa thu.' },
  { en: 'winter', vi: 'mùa đông', pos: 'noun', ipa: '/ˈwɪn.t̬ɚ/', forms: { plural: 'winters' }, image: '❄️', tags: ['season'], exampleEn: 'It is very cold in winter.', exampleVi: 'Trời rất lạnh vào mùa đông.' },

  // 6. Động từ tương tác đi kèm giới từ (18 từ)
  { en: 'put', vi: 'đặt, để', pos: 'verb', ipa: '/pʊt/', forms: { thirdSg: 'puts', past: 'put', ing: 'putting', irregular: true }, image: '📥', tags: ['action'], exampleEn: 'Put the book on the table.', exampleVi: 'Hãy đặt cuốn sách lên bàn.' },
  { en: 'hang', vi: 'treo', pos: 'verb', ipa: '/hæŋ/', forms: { thirdSg: 'hangs', past: 'hung', ing: 'hanging', irregular: true }, image: '🖼️', tags: ['action'], exampleEn: 'Hang the clock on the wall.', exampleVi: 'Hãy treo đồng hồ lên tường.' },
  { en: 'stand', vi: 'đứng', pos: 'verb', ipa: '/stænd/', forms: { thirdSg: 'stands', past: 'stood', ing: 'standing', irregular: true }, image: '🧍', tags: ['action'], exampleEn: 'He stood in front of the class.', exampleVi: 'Cậu ấy đã đứng trước cả lớp.' },
  { en: 'sit', vi: 'ngồi', pos: 'verb', ipa: '/sɪt/', forms: { thirdSg: 'sits', past: 'sat', ing: 'sitting', irregular: true }, image: '🪑', tags: ['action'], exampleEn: 'Sit between your parents.', exampleVi: 'Hãy ngồi ở giữa bố mẹ của bạn.' },
  { en: 'lie', vi: 'nằm', pos: 'verb', ipa: '/laɪ/', forms: { thirdSg: 'lies', past: 'lay', ing: 'lying', irregular: true }, image: '🛌', tags: ['action'], exampleEn: 'The cat lies under the warm blanket.', exampleVi: 'Con mèo nằm dưới tấm chăn ấm.' },
  { en: 'hide', vi: 'trốn, giấu', pos: 'verb', ipa: '/haɪd/', forms: { thirdSg: 'hides', past: 'hid', ing: 'hiding', irregular: true }, image: '🙈', tags: ['action'], exampleEn: 'The boy hid behind the big door.', exampleVi: 'Cậu bé đã trốn phía sau cánh cửa lớn.' },
  { en: 'jump', vi: 'nhảy', pos: 'verb', ipa: '/dʒʌmp/', forms: { thirdSg: 'jumps', past: 'jumped', ing: 'jumping', irregular: false }, image: '🦘', tags: ['action'], exampleEn: 'The rabbit jumped over the log.', exampleVi: 'Chú thỏ nhảy qua khúc gỗ.' },
  { en: 'walk', vi: 'đi bộ', pos: 'verb', ipa: '/wɑːk/', forms: { thirdSg: 'walks', past: 'walked', ing: 'walking', irregular: false }, image: '🚶', tags: ['action'], exampleEn: 'We walked through the green park.', exampleVi: 'Chúng tôi đi bộ qua công viên xanh mát.' },
  { en: 'run', vi: 'chạy', pos: 'verb', ipa: '/rʌn/', forms: { thirdSg: 'runs', past: 'ran', ing: 'running', irregular: true }, image: '🏃', tags: ['action'], exampleEn: 'He ran into the classroom.', exampleVi: 'Cậu ấy chạy vào trong lớp học.' },
  { en: 'look', vi: 'nhìn (vào)', pos: 'verb', ipa: '/lʊk/', forms: { thirdSg: 'looks', past: 'looked', ing: 'looking', irregular: false }, image: '👀', tags: ['action'], exampleEn: 'Look at the colorful picture.', exampleVi: 'Hãy nhìn vào bức tranh rực rỡ.' },
  { en: 'listen', vi: 'lắng nghe', pos: 'verb', ipa: '/ˈlɪs.ən/', forms: { thirdSg: 'listens', past: 'listened', ing: 'listening', irregular: false }, image: '👂', tags: ['action'], exampleEn: 'Listen to the cheerful music.', exampleVi: 'Hãy lắng nghe bản nhạc vui tươi.' },
  { en: 'wait', vi: 'chờ đợi', pos: 'verb', ipa: '/weɪt/', forms: { thirdSg: 'waits', past: 'waited', ing: 'waiting', irregular: false }, image: '⏳', tags: ['action'], exampleEn: 'Wait for me at the bus stop.', exampleVi: 'Hãy đợi tôi ở trạm xe buýt.' },
  { en: 'stay', vi: 'ở lại', pos: 'verb', ipa: '/steɪ/', forms: { thirdSg: 'stays', past: 'stayed', ing: 'staying', irregular: false }, image: '🏠', tags: ['action'], exampleEn: 'Stay at home on rainy days.', exampleVi: 'Hãy ở nhà vào những ngày mưa.' },
  { en: 'arrive', vi: 'đến nơi', pos: 'verb', ipa: '/əˈraɪv/', forms: { thirdSg: 'arrives', past: 'arrived', ing: 'arriving', irregular: false }, image: '🛬', tags: ['action'], exampleEn: 'We arrived at the station on time.', exampleVi: 'Chúng tôi đã đến nhà ga đúng giờ.' },
  { en: 'leave', vi: 'rời đi, rời khỏi', pos: 'verb', ipa: '/liːv/', forms: { thirdSg: 'leaves', past: 'left', ing: 'leaving', irregular: true }, image: '🛫', tags: ['action'], exampleEn: 'The bus leaves at eight.', exampleVi: 'Xe buýt rời đi lúc 8 giờ.' },
  { en: 'return', vi: 'trở về, quay lại', pos: 'verb', ipa: '/rɪˈtɝːn/', forms: { thirdSg: 'returns', past: 'returned', ing: 'returning', irregular: false }, image: '🔙', tags: ['action'], exampleEn: 'Dad returned from work late.', exampleVi: 'Bố đã đi làm về muộn.' },
  { en: 'belong', vi: 'thuộc về', pos: 'verb', ipa: '/bɪˈlɑːŋ/', forms: { thirdSg: 'belongs', past: 'belonged', ing: 'belonging', irregular: false }, image: '🏷️', tags: ['relation'], exampleEn: 'This book belongs to my sister.', exampleVi: 'Cuốn sách này thuộc về em gái tôi.' },
  { en: 'cross', vi: 'băng qua', pos: 'verb', ipa: '/krɑːs/', forms: { thirdSg: 'crosses', past: 'crossed', ing: 'crossing', irregular: false }, image: '🚶', tags: ['action'], exampleEn: 'Look both ways before you cross the street.', exampleVi: 'Hãy nhìn hai phía trước khi bạn băng qua đường.' }
];

console.log(`Checking vocab duplicates... Total vocab: ${vocabList.length}`);
const seenEn = new Set();
for (const v of vocabList) {
  if (seenEn.has(v.en.toLowerCase())) {
    throw new Error(`Duplicate vocab detected: "${v.en}"`);
  }
  seenEn.add(v.en.toLowerCase());
}

const c2Vocab = vocabList.map((item, idx) => {
  const idNum = String(idx + 1).padStart(4, '0');
  return {
    id: `C2-v-${idNum}`,
    level: 'C2',
    topic: 'prepositions-conjunctions',
    en: item.en,
    vi: item.vi,
    pos: item.pos,
    ipa: item.ipa,
    ...(item.forms ? { forms: item.forms } : {}),
    image: item.image,
    tags: item.tags,
    exampleEn: item.exampleEn,
    exampleVi: item.exampleVi,
    source: 'seed'
  };
});

fs.writeFileSync(path.join(DATA_DIR, 'C2.vocab.json'), JSON.stringify(applyContentReviewV4('C2.vocab.json', c2Vocab), null, 2), 'utf-8');
console.log(`✅ Generated C2.vocab.json with ${c2Vocab.length} words (target ≥ 100).`);

// =========================================================================
// 2. TẠO 200 CÂU C2 (C2.sentences.json)
// =========================================================================
const sentences = [];
let currentSentenceId = 1;

function tok(text, pos, role, lemma, feature) {
  const t = { text, pos, role };
  if (lemma) t.lemma = lemma;
  if (feature) t.feature = feature;
  return t;
}

const punctDot = { text: '.', pos: 'punct', role: 'punct' };
const punctQ = { text: '?', pos: 'punct', role: 'punct' };
const punctComma = { text: ',', pos: 'punct', role: 'punct' };

function addSentence(grammarPoint, en, vi, difficulty, tags, tokens, roleSpans, blankConfig) {
  const reconstructed = tokens.map((t, i) => {
    if (i === 0) return t.text;
    if (t.pos === 'punct' && (t.text === '.' || t.text === '?' || t.text === '!' || t.text === ',')) return t.text;
    return ' ' + t.text;
  }).join('');

  if (reconstructed !== en) {
    throw new Error(`Reconstruction mismatch:\nen: "${en}"\nreconstructed: "${reconstructed}"`);
  }

  const idNum = String(currentSentenceId++).padStart(4, '0');
  const sentenceId = `C2-s-${idNum}`;

  const blanks = [{
    tokenIndex: blankConfig.idx,
    answer: blankConfig.ans,
    promptVi: blankConfig.promptVi,
    hint: blankConfig.hint
  }];

  sentences.push({
    id: sentenceId,
    level: 'C2',
    topic: 'prepositions-conjunctions',
    grammarPoint,
    en,
    vi,
    tokens,
    blanks,
    difficulty,
    tags,
    source: 'seed',
    roleSpans: roleSpans || [],
    exerciseTypes: ['pos', 'fill', 'order']
  });
}

// -------------------------------------------------------------------------
// Helper sinh câu Giới từ nơi chốn
// -------------------------------------------------------------------------
function addPrepPlace(en, vi, difficulty, tags, tokens, roleSpans, blankConfig) {
  addSentence('preposition-place', en, vi, difficulty, ['preposition', 'place', ...tags], tokens, roleSpans, blankConfig);
}

// Helper sinh câu Giới từ thời gian
function addPrepTime(en, vi, difficulty, tags, tokens, roleSpans, blankConfig) {
  addSentence('preposition-time', en, vi, difficulty, ['preposition', 'time', ...tags], tokens, roleSpans, blankConfig);
}

// Helper sinh câu Giới từ chuyển động/hướng
function addPrepDir(en, vi, difficulty, tags, tokens, roleSpans, blankConfig) {
  addSentence('preposition-direction', en, vi, difficulty, ['preposition', 'direction', ...tags], tokens, roleSpans, blankConfig);
}

// Helper sinh câu Liên từ
function addConj(gp, en, vi, difficulty, tags, tokens, roleSpans, blankConfig) {
  addSentence(gp, en, vi, difficulty, ['conjunction', ...tags], tokens, roleSpans, blankConfig);
}

// =========================================================================
// PHẦN 1: GIỚI TỪ NƠI CHỐN (70 CÂU)
// =========================================================================

// in (8 câu)
addPrepPlace('The cat is in the box.', 'Con mèo ở trong chiếc hộp.', 1, ['in'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('is','verb','verb','be','present-3sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('box','noun','prep-object','box','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in', promptVi:'Điền giới từ mang nghĩa ở trong.', hint:'in'});

addPrepPlace('Pencils are in the drawer.', 'Những chiếc bút chì ở trong ngăn kéo.', 1, ['in'],
  [tok('Pencils','noun','subject','pencil','pl'), tok('are','verb','verb','be','present-other'), tok('in','preposition','prep'), tok('the','article','det'), tok('drawer','noun','prep-object','drawer','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'in', promptVi:'Điền giới từ mang nghĩa ở trong.', hint:'in'});

addPrepPlace('They live in a small town.', 'Họ sống ở trong một thị trấn nhỏ.', 2, ['in'],
  [tok('They','pronoun','subject'), tok('live','verb','verb','live','present-other'), tok('in','preposition','prep'), tok('a','article','det'), tok('small','adjective','modifier'), tok('town','noun','prep-object','town','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'in', promptVi:'Điền giới từ mang nghĩa ở trong.', hint:'in'});

addPrepPlace('She put the apples in the basket.', 'Cô ấy đã để những quả táo vào trong giỏ.', 2, ['in'],
  [tok('She','pronoun','subject'), tok('put','verb','verb','put','past'), tok('the','article','det'), tok('apples','noun','object','apple','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('basket','noun','prep-object','basket','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'in', promptVi:'Điền giới từ mang nghĩa ở trong.', hint:'in'});

addPrepPlace('Goldfish are swimming in the aquarium.', 'Cá vàng đang bơi trong bể cá.', 2, ['in'],
  [tok('Goldfish','noun','subject','goldfish','pl'), tok('are','verb','verb','be','aux-present-other'), tok('swimming','verb','verb','swim','ing'), tok('in','preposition','prep'), tok('the','article','det'), tok('aquarium','noun','prep-object','aquarium','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepPlace('Mother is cooking dinner in the kitchen.', 'Mẹ đang nấu bữa tối trong bếp.', 2, ['in'],
  [tok('Mother','noun','subject','mother','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('cooking','verb','verb','cook','ing'), tok('dinner','noun','object','dinner','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('kitchen','noun','prep-object','kitchen','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepPlace('There are many interesting books in our library.', 'Có rất nhiều cuốn sách hay trong thư viện của chúng tôi.', 3, ['in'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('many','determiner','det'), tok('interesting','adjective','modifier'), tok('books','noun','subject','book','pl'), tok('in','preposition','prep'), tok('our','determiner','det'), tok('library','noun','prep-object','library','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:5, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepPlace('Fresh milk is in the refrigerator.', 'Sữa tươi ở trong tủ lạnh.', 2, ['in'],
  [tok('Fresh','adjective','modifier'), tok('milk','noun','subject','milk','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('refrigerator','noun','prep-object','refrigerator','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

// on (8 câu)
addPrepPlace('The book is on the table.', 'Cuốn sách ở trên bàn.', 1, ['on'],
  [tok('The','article','det'), tok('book','noun','subject','book','sg'), tok('is','verb','verb','be','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'on', promptVi:'Điền giới từ mang nghĩa ở trên bề mặt.', hint:'on'});

addPrepPlace('Apples are on the plate.', 'Những quả táo ở trên đĩa.', 1, ['on'],
  [tok('Apples','noun','subject','apple','pl'), tok('are','verb','verb','be','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('plate','noun','prep-object','plate','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepPlace('A painting hangs on the wall.', 'Một bức tranh treo trên tường.', 2, ['on'],
  [tok('A','article','det'), tok('painting','noun','subject','painting','sg'), tok('hangs','verb','verb','hang','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('wall','noun','prep-object','wall','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepPlace('The cat sleeps on the soft carpet.', 'Con mèo ngủ trên tấm thảm êm.', 2, ['on'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('sleeps','verb','verb','sleep','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('soft','adjective','modifier'), tok('carpet','noun','prep-object','carpet','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepPlace('He placed the laptop on his desk.', 'Cậu ấy đặt máy tính xách tay lên bàn làm việc của mình.', 2, ['on'],
  [tok('He','pronoun','subject'), tok('placed','verb','verb','place','past'), tok('the','article','det'), tok('laptop','noun','object','laptop','sg'), tok('on','preposition','prep'), tok('his','determiner','det'), tok('desk','noun','prep-object','desk','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepPlace('Flower pots stand on the balcony.', 'Những chậu hoa đứng ở trên ban công.', 2, ['on'],
  [tok('Flower','noun','modifier','flower','sg'), tok('pots','noun','subject','pot','pl'), tok('stand','verb','verb','stand','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('balcony','noun','prep-object','balcony','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepPlace('Do not step on the wet grass.', 'Đừng giẫm lên bãi cỏ ướt.', 2, ['on'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('not','particle','particle'), tok('step','verb','verb','step','base'), tok('on','preposition','prep'), tok('the','article','det'), tok('wet','adjective','modifier'), tok('grass','noun','prep-object','grass','uncountable'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepPlace('A colorful sticker is on the notebook cover.', 'Một miếng dán rực rỡ ở trên bìa cuốn vở.', 3, ['on'],
  [tok('A','article','det'), tok('colorful','adjective','modifier'), tok('sticker','noun','subject','sticker','sg'), tok('is','verb','verb','be','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('notebook','noun','modifier','notebook','sg'), tok('cover','noun','prep-object','cover','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'on', promptVi:'Điền on.', hint:'on'});

// at (7 câu)
addPrepPlace('She is waiting at the bus stop.', 'Cô ấy đang đứng đợi ở trạm xe buýt.', 1, ['at'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('waiting','verb','verb','wait','ing'), tok('at','preposition','prep'), tok('the','article','det'), tok('bus','noun','modifier','bus','sg'), tok('stop','noun','prep-object','stop','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'at', promptVi:'Điền giới từ at chỉ địa điểm cụ thể.', hint:'at'});

addPrepPlace('We arrived at the airport early.', 'Chúng tôi đã đến sân bay sớm.', 2, ['at'],
  [tok('We','pronoun','subject'), tok('arrived','verb','verb','arrive','past'), tok('at','preposition','prep'), tok('the','article','det'), tok('airport','noun','prep-object','airport','sg'), tok('early','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:2, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepPlace('The teacher is at the door.', 'Thầy giáo đang ở cửa ra vào.', 1, ['at'],
  [tok('The','article','det'), tok('teacher','noun','subject','teacher','sg'), tok('is','verb','verb','be','present-3sg'), tok('at','preposition','prep'), tok('the','article','det'), tok('door','noun','prep-object','door','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepPlace('Children are studying at school today.', 'Các em học sinh đang học ở trường hôm nay.', 2, ['at'],
  [tok('Children','noun','subject','child','pl'), tok('are','verb','verb','be','aux-present-other'), tok('studying','verb','verb','study','ing'), tok('at','preposition','prep'), tok('school','noun','prep-object','school','uncountable'), tok('today','noun','adverbial','today','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:3, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepPlace('He stayed at home all afternoon.', 'Cậu ấy đã ở nhà cả buổi chiều.', 2, ['at'],
  [tok('He','pronoun','subject'), tok('stayed','verb','verb','stay','past'), tok('at','preposition','prep'), tok('home','noun','prep-object','home','uncountable'), tok('all','determiner','det'), tok('afternoon','noun','adverbial','afternoon','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:2, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepPlace('They bought tickets at the counter.', 'Họ đã mua vé tại quầy.', 2, ['at'],
  [tok('They','pronoun','subject'), tok('bought','verb','verb','buy','past'), tok('tickets','noun','object','ticket','pl'), tok('at','preposition','prep'), tok('the','article','det'), tok('counter','noun','prep-object','counter','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepPlace('A friendly guard stood at the front gate.', 'Một bác bảo vệ thân thiện đã đứng ở cổng trước.', 3, ['at'],
  [tok('A','article','det'), tok('friendly','adjective','modifier'), tok('guard','noun','subject','guard','sg'), tok('stood','verb','verb','stand','past'), tok('at','preposition','prep'), tok('the','article','det'), tok('front','adjective','modifier'), tok('gate','noun','prep-object','gate','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'at', promptVi:'Điền at.', hint:'at'});

// under (7 câu)
addPrepPlace('The cat is under the table.', 'Con mèo ở dưới cái bàn.', 1, ['under'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('is','verb','verb','be','present-3sg'), tok('under','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'under', promptVi:'Điền giới từ mang nghĩa ở dưới.', hint:'under'});

addPrepPlace('Shoes are under the bed.', 'Những đôi giày ở dưới gầm giường.', 1, ['under'],
  [tok('Shoes','noun','subject','shoe','pl'), tok('are','verb','verb','be','present-other'), tok('under','preposition','prep'), tok('the','article','det'), tok('bed','noun','prep-object','bed','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'under', promptVi:'Điền under.', hint:'under'});

addPrepPlace('We sat under a shady tree.', 'Chúng tôi ngồi dưới một cái cây râm mát.', 2, ['under'],
  [tok('We','pronoun','subject'), tok('sat','verb','verb','sit','past'), tok('under','preposition','prep'), tok('a','article','det'), tok('shady','adjective','modifier'), tok('tree','noun','prep-object','tree','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'under', promptVi:'Điền under.', hint:'under'});

addPrepPlace('The puppy hid under the sofa.', 'Chú cún con đã trốn dưới ghế sô pha.', 2, ['under'],
  [tok('The','article','det'), tok('puppy','noun','subject','puppy','sg'), tok('hid','verb','verb','hide','past'), tok('under','preposition','prep'), tok('the','article','det'), tok('sofa','noun','prep-object','sofa','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'under', promptVi:'Điền under.', hint:'under'});

addPrepPlace('Boats passed under the big bridge.', 'Những con thuyền chạy qua dưới cây cầu lớn.', 2, ['under'],
  [tok('Boats','noun','subject','boat','pl'), tok('passed','verb','verb','pass','past'), tok('under','preposition','prep'), tok('the','article','det'), tok('big','adjective','modifier'), tok('bridge','noun','prep-object','bridge','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'under', promptVi:'Điền under.', hint:'under'});

addPrepPlace('He found his lost key under the rug.', 'Cậu ấy đã tìm thấy chiếc chìa khóa bị mất dưới tấm thảm.', 3, ['under'],
  [tok('He','pronoun','subject'), tok('found','verb','verb','find','past'), tok('his','determiner','det'), tok('lost','adjective','modifier'), tok('key','noun','object','key','sg'), tok('under','preposition','prep'), tok('the','article','det'), tok('rug','noun','prep-object','rug','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:5, ans:'under', promptVi:'Điền under.', hint:'under'});

addPrepPlace('Mushrooms grow under damp fallen leaves.', 'Nấm mọc dưới những tán lá khô ẩm ướt.', 3, ['under'],
  [tok('Mushrooms','noun','subject','mushroom','pl'), tok('grow','verb','verb','grow','present-other'), tok('under','preposition','prep'), tok('damp','adjective','modifier'), tok('fallen','adjective','modifier'), tok('leaves','noun','prep-object','leaf','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'under', promptVi:'Điền under.', hint:'under'});

// behind (7 câu)
addPrepPlace('The garden is behind our house.', 'Khu vườn ở phía sau ngôi nhà chúng tôi.', 1, ['behind'],
  [tok('The','article','det'), tok('garden','noun','subject','garden','sg'), tok('is','verb','verb','be','present-3sg'), tok('behind','preposition','prep'), tok('our','determiner','det'), tok('house','noun','prep-object','house','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'behind', promptVi:'Điền giới từ mang nghĩa ở phía sau.', hint:'behind'});

addPrepPlace('The bicycle is behind the door.', 'Chiếc xe đạp ở phía sau cánh cửa.', 1, ['behind'],
  [tok('The','article','det'), tok('bicycle','noun','subject','bicycle','sg'), tok('is','verb','verb','be','present-3sg'), tok('behind','preposition','prep'), tok('the','article','det'), tok('door','noun','prep-object','door','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'behind', promptVi:'Điền behind.', hint:'behind'});

addPrepPlace('He stood behind his older brother.', 'Cậu bé đã đứng phía sau anh trai mình.', 2, ['behind'],
  [tok('He','pronoun','subject'), tok('stood','verb','verb','stand','past'), tok('behind','preposition','prep'), tok('his','determiner','det'), tok('older','adjective','modifier'), tok('brother','noun','prep-object','brother','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'behind', promptVi:'Điền behind.', hint:'behind'});

addPrepPlace('The sun hid behind thick gray clouds.', 'Mặt trời ẩn sau những đám mây xám dày đặc.', 2, ['behind'],
  [tok('The','article','det'), tok('sun','noun','subject','sun','sg'), tok('hid','verb','verb','hide','past'), tok('behind','preposition','prep'), tok('thick','adjective','modifier'), tok('gray','adjective','modifier'), tok('clouds','noun','prep-object','cloud','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'behind', promptVi:'Điền behind.', hint:'behind'});

addPrepPlace('Our car was behind a yellow bus.', 'Chiếc xe hơi của chúng tôi ở phía sau chiếc xe buýt vàng.', 2, ['behind'],
  [tok('Our','determiner','det'), tok('car','noun','subject','car','sg'), tok('was','verb','verb','be','past'), tok('behind','preposition','prep'), tok('a','article','det'), tok('yellow','adjective','modifier'), tok('bus','noun','prep-object','bus','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'behind', promptVi:'Điền behind.', hint:'behind'});

addPrepPlace('Who is that tall boy behind you?', 'Cậu bé cao lớn đứng phía sau bạn là ai thế?', 3, ['behind'],
  [tok('Who','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('tall','adjective','modifier'), tok('boy','noun','subject','boy','sg'), tok('behind','preposition','prep'), tok('you','pronoun','prep-object'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:5, ans:'behind', promptVi:'Điền behind.', hint:'behind'});

addPrepPlace('The secret path lies behind the waterfall.', 'Con đường bí mật nằm ở phía sau thác nước.', 3, ['behind'],
  [tok('The','article','det'), tok('secret','adjective','modifier'), tok('path','noun','subject','path','sg'), tok('lies','verb','verb','lie','present-3sg'), tok('behind','preposition','prep'), tok('the','article','det'), tok('waterfall','noun','prep-object','waterfall','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'behind', promptVi:'Điền behind.', hint:'behind'});

// in front of (7 câu)
addPrepPlace('A tree is in front of the window.', 'Một cái cây ở phía trước cửa sổ.', 1, ['in front of'],
  [tok('A','article','det'), tok('tree','noun','subject','tree','sg'), tok('is','verb','verb','be','present-3sg'), tok('in front of','preposition','prep'), tok('the','article','det'), tok('window','noun','prep-object','window','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in front of', promptVi:'Điền cụm giới từ mang nghĩa ở phía trước.', hint:'in front of'});

addPrepPlace('She stood in front of the mirror.', 'Cô ấy đứng trước chiếc gương soi.', 2, ['in front of'],
  [tok('She','pronoun','subject'), tok('stood','verb','verb','stand','past'), tok('in front of','preposition','prep'), tok('the','article','det'), tok('mirror','noun','prep-object','mirror','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'in front of', promptVi:'Điền in front of.', hint:'in front of'});

addPrepPlace('The teacher stands in front of the class.', 'Thầy giáo đứng ở phía trước lớp học.', 2, ['in front of'],
  [tok('The','article','det'), tok('teacher','noun','subject','teacher','sg'), tok('stands','verb','verb','stand','present-3sg'), tok('in front of','preposition','prep'), tok('the','article','det'), tok('class','noun','prep-object','class','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in front of', promptVi:'Điền in front of.', hint:'in front of'});

addPrepPlace('Our dog waited in front of the gate.', 'Chú chó của chúng tôi đã đợi ở trước cổng.', 2, ['in front of'],
  [tok('Our','determiner','det'), tok('dog','noun','subject','dog','sg'), tok('waited','verb','verb','wait','past'), tok('in front of','preposition','prep'), tok('the','article','det'), tok('gate','noun','prep-object','gate','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in front of', promptVi:'Điền in front of.', hint:'in front of'});

addPrepPlace('Two police officers stood in front of the bank.', 'Hai viên cảnh sát đã đứng trước ngân hàng.', 3, ['in front of'],
  [tok('Two','numeral','det'), tok('police','noun','modifier','police','uncountable'), tok('officers','noun','subject','officer','pl'), tok('stood','verb','verb','stand','past'), tok('in front of','preposition','prep'), tok('the','article','det'), tok('bank','noun','prep-object','bank','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'in front of', promptVi:'Điền in front of.', hint:'in front of'});

addPrepPlace('Please do not park in front of my garage.', 'Làm ơn đừng đỗ xe ở phía trước nhà để xe của tôi.', 3, ['in front of'],
  [tok('Please','particle','particle'), tok('do','verb','verb','do','aux-present-other'), tok('not','particle','particle'), tok('park','verb','verb','park','base'), tok('in front of','preposition','prep'), tok('my','determiner','det'), tok('garage','noun','prep-object','garage','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1,2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'in front of', promptVi:'Điền in front of.', hint:'in front of'});

addPrepPlace('A colorful fountain dances in front of the building.', 'Một đài phun nước rực rỡ nhảy múa phía trước tòa nhà.', 3, ['in front of'],
  [tok('A','article','det'), tok('colorful','adjective','modifier'), tok('fountain','noun','subject','fountain','sg'), tok('dances','verb','verb','dance','present-3sg'), tok('in front of','preposition','prep'), tok('the','article','det'), tok('building','noun','prep-object','building','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'in front of', promptVi:'Điền in front of.', hint:'in front of'});

// next to & beside (7 câu)
addPrepPlace('My desk is next to the window.', 'Bàn học của tôi ở cạnh cửa sổ.', 1, ['next to'],
  [tok('My','determiner','det'), tok('desk','noun','subject','desk','sg'), tok('is','verb','verb','be','present-3sg'), tok('next to','preposition','prep'), tok('the','article','det'), tok('window','noun','prep-object','window','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'next to', promptVi:'Điền giới từ mang nghĩa ở bên cạnh.', hint:'next to'});

addPrepPlace('She sat next to her best friend.', 'Cô ấy ngồi cạnh bạn thân của mình.', 2, ['next to'],
  [tok('She','pronoun','subject'), tok('sat','verb','verb','sit','past'), tok('next to','preposition','prep'), tok('her','determiner','det'), tok('best','adjective','modifier'), tok('friend','noun','prep-object','friend','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'next to', promptVi:'Điền next to.', hint:'next to'});

addPrepPlace('The bakery is next to the post office.', 'Tiệm bánh ở cạnh bưu điện.', 2, ['next to'],
  [tok('The','article','det'), tok('bakery','noun','subject','bakery','sg'), tok('is','verb','verb','be','present-3sg'), tok('next to','preposition','prep'), tok('the','article','det'), tok('post','noun','modifier','post','sg'), tok('office','noun','prep-object','office','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'next to', promptVi:'Điền next to.', hint:'next to'});

addPrepPlace('He walked beside his grandfather in the morning.', 'Cậu bé đi bộ bên cạnh ông nội vào buổi sáng.', 2, ['beside'],
  [tok('He','pronoun','subject'), tok('walked','verb','verb','walk','past'), tok('beside','preposition','prep'), tok('his','determiner','det'), tok('grandfather','noun','prep-object','grandfather','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:2, ans:'beside', promptVi:'Điền beside.', hint:'beside'});

addPrepPlace('The small stool is beside the wardrobe.', 'Chiếc ghế đẩu nhỏ ở bên cạnh tủ áo.', 2, ['beside'],
  [tok('The','article','det'), tok('small','adjective','modifier'), tok('stool','noun','subject','stool','sg'), tok('is','verb','verb','be','present-3sg'), tok('beside','preposition','prep'), tok('the','article','det'), tok('wardrobe','noun','prep-object','wardrobe','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'beside', promptVi:'Điền beside.', hint:'beside'});

addPrepPlace('Who is sitting next to the class monitor?', 'Ai đang ngồi cạnh bạn lớp trưởng thế?', 3, ['next to'],
  [tok('Who','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('sitting','verb','verb','sit','ing'), tok('next to','preposition','prep'), tok('the','article','det'), tok('class','noun','modifier','class','sg'), tok('monitor','noun','prep-object','monitor','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'next to', promptVi:'Điền next to.', hint:'next to'});

addPrepPlace('The red pencil case is beside the open notebook.', 'Hộp bút màu đỏ ở bên cạnh cuốn vở đang mở.', 3, ['beside'],
  [tok('The','article','det'), tok('red','adjective','modifier'), tok('pencil','noun','modifier','pencil','sg'), tok('case','noun','subject','case','sg'), tok('is','verb','verb','be','present-3sg'), tok('beside','preposition','prep'), tok('the','article','det'), tok('open','adjective','modifier'), tok('notebook','noun','prep-object','notebook','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2,3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7,8]}],
  {idx:5, ans:'beside', promptVi:'Điền beside.', hint:'beside'});

// between (7 câu)
addPrepPlace('The lamp is between the bed and the table.', 'Cái đèn ở giữa chiếc giường và cái bàn.', 1, ['between'],
  [tok('The','article','det'), tok('lamp','noun','subject','lamp','sg'), tok('is','verb','verb','be','present-3sg'), tok('between','preposition','prep'), tok('the','article','det'), tok('bed','noun','prep-object','bed','sg'), tok('and','conjunction','conj'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6,7,8]}],
  {idx:3, ans:'between', promptVi:'Điền giới từ mang nghĩa ở giữa hai vật.', hint:'between'});

addPrepPlace('She sat between her father and mother.', 'Cô bé ngồi ở giữa bố và mẹ mình.', 2, ['between'],
  [tok('She','pronoun','subject'), tok('sat','verb','verb','sit','past'), tok('between','preposition','prep'), tok('her','determiner','det'), tok('father','noun','prep-object','father','sg'), tok('and','conjunction','conj'), tok('mother','noun','prep-object','mother','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5,6]}],
  {idx:2, ans:'between', promptVi:'Điền between.', hint:'between'});

addPrepPlace('The ball rolled between two chairs.', 'Quả bóng đã lăn vào giữa hai chiếc ghế.', 2, ['between'],
  [tok('The','article','det'), tok('ball','noun','subject','ball','sg'), tok('rolled','verb','verb','roll','past'), tok('between','preposition','prep'), tok('two','numeral','det'), tok('chairs','noun','prep-object','chair','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'between', promptVi:'Điền between.', hint:'between'});

addPrepPlace('Our school is between a bookstore and a pharmacy.', 'Trường của chúng tôi ở giữa hiệu sách và hiệu thuốc.', 2, ['between'],
  [tok('Our','determiner','det'), tok('school','noun','subject','school','sg'), tok('is','verb','verb','be','present-3sg'), tok('between','preposition','prep'), tok('a','article','det'), tok('bookstore','noun','prep-object','bookstore','sg'), tok('and','conjunction','conj'), tok('a','article','det'), tok('pharmacy','noun','prep-object','pharmacy','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6,7,8]}],
  {idx:3, ans:'between', promptVi:'Điền between.', hint:'between'});

addPrepPlace('Can you hold the ruler between your fingers?', 'Bạn có thể giữ chiếc thước kẻ giữa các ngón tay không?', 3, ['between'],
  [tok('Can','verb','verb','can','base'), tok('you','pronoun','subject'), tok('hold','verb','verb','hold','base'), tok('the','article','det'), tok('ruler','noun','object','ruler','sg'), tok('between','preposition','prep'), tok('your','determiner','det'), tok('fingers','noun','prep-object','finger','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:5, ans:'between', promptVi:'Điền between.', hint:'between'});

addPrepPlace('The peaceful valley lies between two green mountains.', 'Thung lũng yên bình nằm ở giữa hai ngọn núi xanh.', 3, ['between'],
  [tok('The','article','det'), tok('peaceful','adjective','modifier'), tok('valley','noun','subject','valley','sg'), tok('lies','verb','verb','lie','present-3sg'), tok('between','preposition','prep'), tok('two','numeral','det'), tok('green','adjective','modifier'), tok('mountains','noun','prep-object','mountain','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'between', promptVi:'Điền between.', hint:'between'});

addPrepPlace('Is there any difference between these two pictures?', 'Có sự khác biệt nào giữa hai bức tranh này không?', 3, ['between'],
  [tok('Is','verb','verb','be','present-3sg'), tok('there','pronoun','expletive'), tok('any','determiner','det'), tok('difference','noun','subject','difference','sg'), tok('between','preposition','prep'), tok('these','determiner','det'), tok('two','numeral','det'), tok('pictures','noun','prep-object','picture','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'between', promptVi:'Điền between.', hint:'between'});

// near & opposite & above & among & around (19 câu)
addPrepPlace('Our house is near the park.', 'Nhà của chúng tôi ở gần công viên.', 1, ['near'],
  [tok('Our','determiner','det'), tok('house','noun','subject','house','sg'), tok('is','verb','verb','be','present-3sg'), tok('near','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'near', promptVi:'Điền giới từ mang nghĩa ở gần.', hint:'near'});

addPrepPlace('He lives near his grandparents.', 'Cậu ấy sống ở gần ông bà mình.', 2, ['near'],
  [tok('He','pronoun','subject'), tok('lives','verb','verb','live','present-3sg'), tok('near','preposition','prep'), tok('his','determiner','det'), tok('grandparents','noun','prep-object','grandparent','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'near', promptVi:'Điền near.', hint:'near'});

addPrepPlace('The supermarket is near the train station.', 'Siêu thị ở gần ga xe lửa.', 2, ['near'],
  [tok('The','article','det'), tok('supermarket','noun','subject','supermarket','sg'), tok('is','verb','verb','be','present-3sg'), tok('near','preposition','prep'), tok('the','article','det'), tok('train','noun','modifier','train','sg'), tok('station','noun','prep-object','station','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'near', promptVi:'Điền near.', hint:'near'});

addPrepPlace('The bookstore is opposite the bakery.', 'Hiệu sách ở đối diện tiệm bánh.', 2, ['opposite'],
  [tok('The','article','det'), tok('bookstore','noun','subject','bookstore','sg'), tok('is','verb','verb','be','present-3sg'), tok('opposite','preposition','prep'), tok('the','article','det'), tok('bakery','noun','prep-object','bakery','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'opposite', promptVi:'Điền giới từ mang nghĩa đối diện.', hint:'opposite'});

addPrepPlace('She sat opposite me during lunchtime.', 'Cô ấy đã ngồi đối diện tôi trong giờ ăn trưa.', 2, ['opposite'],
  [tok('She','pronoun','subject'), tok('sat','verb','verb','sit','past'), tok('opposite','preposition','prep'), tok('me','pronoun','prep-object'), tok('during','preposition','prep'), tok('lunchtime','noun','prep-object','lunchtime','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:2, ans:'opposite', promptVi:'Điền opposite.', hint:'opposite'});

addPrepPlace('The clock is above the whiteboard.', 'Chiếc đồng hồ ở phía trên bảng trắng.', 1, ['above'],
  [tok('The','article','det'), tok('clock','noun','subject','clock','sg'), tok('is','verb','verb','be','present-3sg'), tok('above','preposition','prep'), tok('the','article','det'), tok('whiteboard','noun','prep-object','whiteboard','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'above', promptVi:'Điền giới từ mang nghĩa ở phía trên.', hint:'above'});

addPrepPlace('Bright stars shine above the quiet village.', 'Những vì sao sáng tỏa chiếu phía trên ngôi làng yên tĩnh.', 2, ['above'],
  [tok('Bright','adjective','modifier'), tok('stars','noun','subject','star','pl'), tok('shine','verb','verb','shine','present-other'), tok('above','preposition','prep'), tok('the','article','det'), tok('quiet','adjective','modifier'), tok('village','noun','prep-object','village','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'above', promptVi:'Điền above.', hint:'above'});

addPrepPlace('The small mirror hangs above the sink.', 'Chiếc gương nhỏ treo ở phía trên bồn rửa.', 2, ['above'],
  [tok('The','article','det'), tok('small','adjective','modifier'), tok('mirror','noun','subject','mirror','sg'), tok('hangs','verb','verb','hang','present-3sg'), tok('above','preposition','prep'), tok('the','article','det'), tok('sink','noun','prep-object','sink','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'above', promptVi:'Điền above.', hint:'above'});

addPrepPlace('The temperature dropped below freezing point.', 'Nhiệt độ đã hạ xuống phía dưới điểm đóng băng.', 3, ['below'],
  [tok('The','article','det'), tok('temperature','noun','subject','temperature','uncountable'), tok('dropped','verb','verb','drop','past'), tok('below','preposition','prep'), tok('freezing','adjective','modifier'), tok('point','noun','prep-object','point','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'below', promptVi:'Điền below.', hint:'below'});

addPrepPlace('The house stands among tall pine trees.', 'Ngôi nhà nằm giữa những cây thông cao vút.', 2, ['among'],
  [tok('The','article','det'), tok('house','noun','subject','house','sg'), tok('stands','verb','verb','stand','present-3sg'), tok('among','preposition','prep'), tok('tall','adjective','modifier'), tok('pine','noun','modifier','pine','sg'), tok('trees','noun','prep-object','tree','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'among', promptVi:'Điền giới từ among mang nghĩa ở giữa nhiều đối tượng.', hint:'among'});

addPrepPlace('She was happy among her friends.', 'Cô bé rất vui vẻ khi ở giữa bạn bè của mình.', 2, ['among'],
  [tok('She','pronoun','subject'), tok('was','verb','verb','be','past'), tok('happy','adjective','complement'), tok('among','preposition','prep'), tok('her','determiner','det'), tok('friends','noun','prep-object','friend','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'among', promptVi:'Điền among.', hint:'among'});

addPrepPlace('Children danced around the green tree.', 'Các bạn nhỏ nhảy múa xung quanh cái cây xanh.', 2, ['around'],
  [tok('Children','noun','subject','child','pl'), tok('danced','verb','verb','dance','past'), tok('around','preposition','prep'), tok('the','article','det'), tok('green','adjective','modifier'), tok('tree','noun','prep-object','tree','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'around', promptVi:'Điền around.', hint:'around'});

addPrepPlace('We walked around the peaceful lake.', 'Chúng tôi đã đi bộ dạo quanh hồ nước yên bình.', 2, ['around'],
  [tok('We','pronoun','subject'), tok('walked','verb','verb','walk','past'), tok('around','preposition','prep'), tok('the','article','det'), tok('peaceful','adjective','modifier'), tok('lake','noun','prep-object','lake','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'around', promptVi:'Điền around.', hint:'around'});

addPrepPlace('A wooden fence runs around the farm.', 'Một hàng rào gỗ bao quanh trang trại.', 3, ['around'],
  [tok('A','article','det'), tok('wooden','adjective','modifier'), tok('fence','noun','subject','fence','sg'), tok('runs','verb','verb','run','present-3sg'), tok('around','preposition','prep'), tok('the','article','det'), tok('farm','noun','prep-object','farm','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'around', promptVi:'Điền around.', hint:'around'});

addPrepPlace('The ladder is resting against the brick wall.', 'Chiếc thang đang tựa vào bức tường gạch.', 3, ['against'],
  [tok('The','article','det'), tok('ladder','noun','subject','ladder','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('resting','verb','verb','rest','ing'), tok('against','preposition','prep'), tok('the','article','det'), tok('brick','noun','modifier','brick','sg'), tok('wall','noun','prep-object','wall','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'against', promptVi:'Điền against.', hint:'against'});

addPrepPlace('Please stay inside the house during storms.', 'Xin hãy ở yên bên trong nhà trong những cơn bão.', 2, ['inside'],
  [tok('Please','particle','particle'), tok('stay','verb','verb','stay','base'), tok('inside','preposition','prep'), tok('the','article','det'), tok('house','noun','prep-object','house','sg'), tok('during','preposition','prep'), tok('storms','noun','prep-object','storm','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:2, ans:'inside', promptVi:'Điền inside.', hint:'inside'});

addPrepPlace('Cats like playing outside the garden.', 'Những chú mèo thích chơi ở bên ngoài khu vườn.', 2, ['outside'],
  [tok('Cats','noun','subject','cat','pl'), tok('like','verb','verb','like','present-other'), tok('playing','verb','object','play','ing'), tok('outside','preposition','prep'), tok('the','article','det'), tok('garden','noun','prep-object','garden','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'outside', promptVi:'Điền outside.', hint:'outside'});

addPrepPlace('The old slippers are by the front door.', 'Đôi dép lê cũ ở bên cạnh cửa ra vào.', 2, ['by'],
  [tok('The','article','det'), tok('old','adjective','modifier'), tok('slippers','noun','subject','slipper','pl'), tok('are','verb','verb','be','present-other'), tok('by','preposition','prep'), tok('the','article','det'), tok('front','adjective','modifier'), tok('door','noun','prep-object','door','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'by', promptVi:'Điền by.', hint:'by'});

addPrepPlace('A gentle breeze blew across the wide lake.', 'Một làn gió nhẹ thổi qua mặt hồ rộng lớn.', 3, ['across'],
  [tok('A','article','det'), tok('gentle','adjective','modifier'), tok('breeze','noun','subject','breeze','sg'), tok('blew','verb','verb','blow','past'), tok('across','preposition','prep'), tok('the','article','det'), tok('wide','adjective','modifier'), tok('lake','noun','prep-object','lake','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'across', promptVi:'Điền across.', hint:'across'});

// =========================================================================
// PHẦN 2: GIỚI TỪ THỜI GIAN (50 CÂU)
// =========================================================================

// in thời gian (tháng, năm, mùa, buổi) (14 câu)
addPrepTime('I wake up early in the morning.', 'Tôi thức dậy sớm vào buổi sáng.', 1, ['in'],
  [tok('I','pronoun','subject'), tok('wake','verb','verb','wake','present-other'), tok('up','particle','particle'), tok('early','adverb','adverbial'), tok('in','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'in', promptVi:'Điền giới từ in trước buổi trong ngày.', hint:'in'});

addPrepTime('We play soccer in the afternoon.', 'Chúng tôi chơi bóng đá vào buổi chiều.', 1, ['in'],
  [tok('We','pronoun','subject'), tok('play','verb','verb','play','present-other'), tok('soccer','noun','object','soccer','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('afternoon','noun','prep-object','afternoon','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('They watch movies in the evening.', 'Họ xem phim vào buổi tối.', 1, ['in'],
  [tok('They','pronoun','subject'), tok('watch','verb','verb','watch','present-other'), tok('movies','noun','object','movie','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('evening','noun','prep-object','evening','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('Her birthday is in April.', 'Sinh nhật của cô ấy vào tháng Tư.', 1, ['in'],
  [tok('Her','determiner','det'), tok('birthday','noun','subject','birthday','sg'), tok('is','verb','verb','be','present-3sg'), tok('in','preposition','prep'), tok('April','noun','prep-object','April','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'in', promptVi:'Điền giới từ in trước tên tháng.', hint:'in'});

addPrepTime('School starts in September.', 'Trường học bắt đầu vào tháng Chín.', 2, ['in'],
  [tok('School','noun','subject','school','uncountable'), tok('starts','verb','verb','start','present-3sg'), tok('in','preposition','prep'), tok('September','noun','prep-object','September','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}],
  {idx:2, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('Flowers bloom in spring.', 'Hoa nở rộ vào mùa xuân.', 2, ['in'],
  [tok('Flowers','noun','subject','flower','pl'), tok('bloom','verb','verb','bloom','present-other'), tok('in','preposition','prep'), tok('spring','noun','prep-object','spring','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}],
  {idx:2, ans:'in', promptVi:'Điền in trước mùa.', hint:'in'});

addPrepTime('We go swimming in summer.', 'Chúng tôi đi bơi vào mùa hè.', 2, ['in'],
  [tok('We','pronoun','subject'), tok('go','verb','verb','go','present-other'), tok('swimming','verb','verb','swim','ing'), tok('in','preposition','prep'), tok('summer','noun','prep-object','summer','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('Yellow leaves fall in autumn.', 'Những chiếc lá vàng rơi vào mùa thu.', 2, ['in'],
  [tok('Yellow','adjective','modifier'), tok('leaves','noun','subject','leaf','pl'), tok('fall','verb','verb','fall','present-other'), tok('in','preposition','prep'), tok('autumn','noun','prep-object','autumn','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('It snows heavily in winter.', 'Tuyết rơi dày đặc vào mùa đông.', 2, ['in'],
  [tok('It','pronoun','subject'), tok('snows','verb','verb','snow','present-3sg'), tok('heavily','adverb','adverbial'), tok('in','preposition','prep'), tok('winter','noun','prep-object','winter','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('My brother was born in 2015.', 'Em trai tôi sinh năm 2015.', 2, ['in'],
  [tok('My','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('was','verb','verb','be','past'), tok('born','verb','verb','bear','past'), tok('in','preposition','prep'), tok('2015','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:4, ans:'in', promptVi:'Điền in trước năm.', hint:'in'});

addPrepTime('They moved to this city in 2020.', 'Họ đã chuyển đến thành phố này vào năm 2020.', 2, ['in'],
  [tok('They','pronoun','subject'), tok('moved','verb','verb','move','past'), tok('to','preposition','prep'), tok('this','determiner','det'), tok('city','noun','prep-object','city','sg'), tok('in','preposition','prep'), tok('2020','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:5, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('The train will arrive in five minutes.', 'Đoàn tàu sẽ đến trong 5 phút nữa.', 3, ['in'],
  [tok('The','article','det'), tok('train','noun','subject','train','sg'), tok('will','verb','verb','will','aux-future'), tok('arrive','verb','verb','arrive','base'), tok('in','preposition','prep'), tok('five','numeral','det'), tok('minutes','noun','prep-object','minute','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'in', promptVi:'Điền in mang nghĩa trong bao lâu nữa.', hint:'in'});

addPrepTime('We will finish our project in two weeks.', 'Chúng tôi sẽ hoàn thành dự án trong 2 tuần nữa.', 3, ['in'],
  [tok('We','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('finish','verb','verb','finish','base'), tok('our','determiner','det'), tok('project','noun','object','project','sg'), tok('in','preposition','prep'), tok('two','numeral','det'), tok('weeks','noun','prep-object','week','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:5, ans:'in', promptVi:'Điền in.', hint:'in'});

addPrepTime('Birds sing sweetly in the early morning.', 'Chim hót líu lo vào lúc sáng sớm.', 3, ['in'],
  [tok('Birds','noun','subject','bird','pl'), tok('sing','verb','verb','sing','present-other'), tok('sweetly','adverb','adverbial'), tok('in','preposition','prep'), tok('the','article','det'), tok('early','adjective','modifier'), tok('morning','noun','prep-object','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'in', promptVi:'Điền in.', hint:'in'});

// on thời gian (thứ trong tuần, ngày cụ thể) (14 câu)
addPrepTime('I have piano lessons on Monday.', 'Tôi có tiết học piano vào thứ Hai.', 1, ['on'],
  [tok('I','pronoun','subject'), tok('have','verb','verb','have','present-other'), tok('piano','noun','modifier','piano','sg'), tok('lessons','noun','object','lesson','pl'), tok('on','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:4, ans:'on', promptVi:'Điền giới từ on trước thứ trong tuần.', hint:'on'});

addPrepTime('We do not go to school on Sunday.', 'Chúng tôi không đi học vào ngày Chủ nhật.', 1, ['on'],
  [tok('We','pronoun','subject'), tok('do','verb','verb','do','aux-present-other'), tok('not','particle','particle'), tok('go','verb','verb','go','base'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','uncountable'), tok('on','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6,7]}],
  {idx:6, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('They visit their grandparents on Saturday.', 'Họ đến thăm ông bà vào thứ Bảy.', 1, ['on'],
  [tok('They','pronoun','subject'), tok('visit','verb','verb','visit','present-other'), tok('their','determiner','det'), tok('grandparents','noun','object','grandparent','pl'), tok('on','preposition','prep'), tok('Saturday','noun','prep-object','Saturday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:4, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('Our sports day is on Friday.', 'Ngày hội thể thao của chúng tôi vào thứ Sáu.', 2, ['on'],
  [tok('Our','determiner','det'), tok('sports','noun','modifier','sport','pl'), tok('day','noun','subject','day','sg'), tok('is','verb','verb','be','present-3sg'), tok('on','preposition','prep'), tok('Friday','noun','prep-object','Friday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:4, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('He was born on October 10th.', 'Cậu ấy sinh vào ngày 10 tháng 10.', 2, ['on'],
  [tok('He','pronoun','subject'), tok('was','verb','verb','be','past'), tok('born','verb','verb','bear','past'), tok('on','preposition','prep'), tok('October','noun','modifier','October','sg'), tok('10th','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'on', promptVi:'Điền on trước ngày tháng cụ thể.', hint:'on'});

addPrepTime('We exchange gifts on Christmas Day.', 'Chúng tôi tặng quà nhau vào ngày Giáng sinh.', 2, ['on'],
  [tok('We','pronoun','subject'), tok('exchange','verb','verb','exchange','present-other'), tok('gifts','noun','object','gift','pl'), tok('on','preposition','prep'), tok('Christmas','noun','modifier','Christmas','sg'), tok('Day','noun','prep-object','day','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('What do you usually do on weekends?', 'Bạn thường làm gì vào các ngày cuối tuần?', 2, ['on'],
  [tok('What','pronoun','object'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('usually','adverb','adverbial'), tok('do','verb','verb','do','base'), tok('on','preposition','prep'), tok('weekends','noun','prep-object','weekend','pl'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:5, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('She went hiking on a warm sunny day.', 'Cô ấy đã đi dã ngoại vào một ngày nắng ấm.', 2, ['on'],
  [tok('She','pronoun','subject'), tok('went','verb','verb','go','past'), tok('hiking','noun','object','hiking','uncountable'), tok('on','preposition','prep'), tok('a','article','det'), tok('warm','adjective','modifier'), tok('sunny','adjective','modifier'), tok('day','noun','prep-object','day','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6,7]}],
  {idx:3, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('The store is closed on New Year Day.', 'Cửa hàng đóng cửa vào ngày Tết Dương lịch.', 2, ['on'],
  [tok('The','article','det'), tok('store','noun','subject','store','sg'), tok('is','verb','verb','be','present-3sg'), tok('closed','adjective','complement'), tok('on','preposition','prep'), tok('New','adjective','modifier'), tok('Year','noun','modifier','year','sg'), tok('Day','noun','prep-object','day','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:4, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('We ate popcorn on Saturday night.', 'Chúng tôi đã ăn bắp rang bơ vào tối thứ Bảy.', 2, ['on'],
  [tok('We','pronoun','subject'), tok('ate','verb','verb','eat','past'), tok('popcorn','noun','object','popcorn','uncountable'), tok('on','preposition','prep'), tok('Saturday','noun','modifier','Saturday','sg'), tok('night','noun','prep-object','night','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('The competition will happen on July 15th.', 'Cuộc thi sẽ diễn ra vào ngày 15 tháng 7.', 3, ['on'],
  [tok('The','article','det'), tok('competition','noun','subject','competition','sg'), tok('will','verb','verb','will','aux-future'), tok('happen','verb','verb','happen','base'), tok('on','preposition','prep'), tok('July','noun','modifier','July','sg'), tok('15th','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('Special guests will arrive on Monday morning.', 'Những vị khách đặc biệt sẽ đến vào sáng thứ Hai.', 3, ['on'],
  [tok('Special','adjective','modifier'), tok('guests','noun','subject','guest','pl'), tok('will','verb','verb','will','aux-future'), tok('arrive','verb','verb','arrive','base'), tok('on','preposition','prep'), tok('Monday','noun','modifier','Monday','sg'), tok('morning','noun','prep-object','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('I always tidy my bedroom on Friday afternoon.', 'Tôi luôn dọn dẹp phòng ngủ vào chiều thứ Sáu.', 3, ['on'],
  [tok('I','pronoun','subject'), tok('always','adverb','adverbial'), tok('tidy','verb','verb','tidy','present-other'), tok('my','determiner','det'), tok('bedroom','noun','object','bedroom','sg'), tok('on','preposition','prep'), tok('Friday','noun','modifier','Friday','sg'), tok('afternoon','noun','prep-object','afternoon','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:5, ans:'on', promptVi:'Điền on.', hint:'on'});

addPrepTime('Many tourists visit our city on national holidays.', 'Nhiều du khách đến thăm thành phố vào các ngày quốc lễ.', 3, ['on'],
  [tok('Many','determiner','det'), tok('tourists','noun','subject','tourist','pl'), tok('visit','verb','verb','visit','present-other'), tok('our','determiner','det'), tok('city','noun','object','city','sg'), tok('on','preposition','prep'), tok('national','adjective','modifier'), tok('holidays','noun','prep-object','holiday','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:5, ans:'on', promptVi:'Điền on.', hint:'on'});

// at thời gian (giờ giấc, at night, at noon) (12 câu)
addPrepTime('School starts at seven o\'clock.', 'Trường học bắt đầu lúc 7 giờ đúng.', 1, ['at'],
  [tok('School','noun','subject','school','uncountable'), tok('starts','verb','verb','start','present-3sg'), tok('at','preposition','prep'), tok('seven','numeral','modifier'), tok('o\'clock','adverb','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'at', promptVi:'Điền giới từ at trước giờ giấc.', hint:'at'});

addPrepTime('We eat lunch at noon.', 'Chúng tôi ăn trưa vào buổi trưa.', 1, ['at'],
  [tok('We','pronoun','subject'), tok('eat','verb','verb','eat','present-other'), tok('lunch','noun','object','lunch','uncountable'), tok('at','preposition','prep'), tok('noon','noun','prep-object','noon','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'at', promptVi:'Điền at trước noon.', hint:'at'});

addPrepTime('Stars shine brightly at night.', 'Những vì sao tỏa sáng rực rỡ vào ban đêm.', 1, ['at'],
  [tok('Stars','noun','subject','star','pl'), tok('shine','verb','verb','shine','present-other'), tok('brightly','adverb','adverbial'), tok('at','preposition','prep'), tok('night','noun','prep-object','night','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'at', promptVi:'Điền at trước night.', hint:'at'});

addPrepTime('I go to bed at nine thirty.', 'Tôi đi ngủ lúc 9 giờ 30.', 1, ['at'],
  [tok('I','pronoun','subject'), tok('go','verb','verb','go','present-other'), tok('to','preposition','prep'), tok('bed','noun','prep-object','bed','uncountable'), tok('at','preposition','prep'), tok('nine','numeral','modifier'), tok('thirty','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepTime('The bell rang at half past eight.', 'Chuông đã reo vào lúc 8 giờ rưỡi.', 2, ['at'],
  [tok('The','article','det'), tok('bell','noun','subject','bell','sg'), tok('rang','verb','verb','ring','past'), tok('at','preposition','prep'), tok('half','noun','modifier','half','uncountable'), tok('past','preposition','modifier'), tok('eight','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepTime('The town is very quiet at midnight.', 'Thị trấn rất yên tĩnh vào lúc nửa đêm.', 2, ['at'],
  [tok('The','article','det'), tok('town','noun','subject','town','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('quiet','adjective','complement'), tok('at','preposition','prep'), tok('midnight','noun','prep-object','midnight','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:5, ans:'at', promptVi:'Điền at trước midnight.', hint:'at'});

addPrepTime('The train leaves at six pm.', 'Đoàn tàu rời đi lúc 6 giờ tối.', 2, ['at'],
  [tok('The','article','det'), tok('train','noun','subject','train','sg'), tok('leaves','verb','verb','leave','present-3sg'), tok('at','preposition','prep'), tok('six','numeral','modifier'), tok('pm','noun','prep-object','pm','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepTime('He called me at lunchtime yesterday.', 'Cậu ấy đã gọi cho tôi vào giờ ăn trưa hôm qua.', 2, ['at'],
  [tok('He','pronoun','subject'), tok('called','verb','verb','call','past'), tok('me','pronoun','object'), tok('at','preposition','prep'), tok('lunchtime','noun','prep-object','lunchtime','uncountable'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:3, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepTime('We all gathered at sunset.', 'Tất cả chúng tôi đã tụ họp vào lúc hoàng hôn.', 2, ['at'],
  [tok('We','pronoun','subject'), tok('all','pronoun','modifier'), tok('gathered','verb','verb','gather','past'), tok('at','preposition','prep'), tok('sunset','noun','prep-object','sunset','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepTime('At the moment, they are singing together.', 'Vào thời điểm này, họ đang hát cùng nhau.', 2, ['at'],
  [tok('At','preposition','prep'), tok('the','article','det'), tok('moment','noun','prep-object','moment','sg'), punctComma, tok('they','pronoun','subject'), tok('are','verb','verb','be','aux-present-other'), tok('singing','verb','verb','sing','ing'), tok('together','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}, {clauseId:'c1', role:'verb', tokenIndices:[5,6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7]}],
  {idx:0, ans:'At', promptVi:'Điền At trong cụm At the moment.', hint:'At'});

addPrepTime('The exciting match will begin at 3 pm.', 'Trận đấu hào hứng sẽ bắt đầu lúc 3 giờ chiều.', 3, ['at'],
  [tok('The','article','det'), tok('exciting','adjective','modifier'), tok('match','noun','subject','match','sg'), tok('will','verb','verb','will','aux-future'), tok('begin','verb','verb','begin','base'), tok('at','preposition','prep'), tok('3','numeral','modifier'), tok('pm','noun','prep-object','pm','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:5, ans:'at', promptVi:'Điền at.', hint:'at'});

addPrepTime('Owls hunt small animals at night.', 'Cú mèo săn những con thú nhỏ vào ban đêm.', 3, ['at'],
  [tok('Owls','noun','subject','owl','pl'), tok('hunt','verb','verb','hunt','present-other'), tok('small','adjective','modifier'), tok('animals','noun','object','animal','pl'), tok('at','preposition','prep'), tok('night','noun','prep-object','night','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:4, ans:'at', promptVi:'Điền at.', hint:'at'});

// before, after, during, until (10 câu)
addPrepTime('Wash your hands before eating dinner.', 'Hãy rửa tay trước khi ăn tối.', 1, ['before'],
  [tok('Wash','verb','verb','wash','base'), tok('your','determiner','det'), tok('hands','noun','object','hand','pl'), tok('before','preposition','prep'), tok('eating','verb','prep-object','eat','ing'), tok('dinner','noun','object','dinner','uncountable'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'object', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'before', promptVi:'Điền giới từ before mang nghĩa trước khi.', hint:'before'});

addPrepTime('Brush your teeth before bedtime.', 'Hãy đánh răng trước giờ đi ngủ.', 1, ['before'],
  [tok('Brush','verb','verb','brush','base'), tok('your','determiner','det'), tok('teeth','noun','object','tooth','pl'), tok('before','preposition','prep'), tok('bedtime','noun','prep-object','bedtime','uncountable'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'object', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'before', promptVi:'Điền before.', hint:'before'});

addPrepTime('We play football after school.', 'Chúng tôi chơi bóng đá sau giờ học.', 1, ['after'],
  [tok('We','pronoun','subject'), tok('play','verb','verb','play','present-other'), tok('football','noun','object','football','uncountable'), tok('after','preposition','prep'), tok('school','noun','prep-object','school','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:3, ans:'after', promptVi:'Điền giới từ after mang nghĩa sau khi.', hint:'after'});

addPrepTime('She takes a warm bath after dinner.', 'Cô ấy tắm nước ấm sau bữa tối.', 2, ['after'],
  [tok('She','pronoun','subject'), tok('takes','verb','verb','take','present-3sg'), tok('a','article','det'), tok('warm','adjective','modifier'), tok('bath','noun','object','bath','sg'), tok('after','preposition','prep'), tok('dinner','noun','prep-object','dinner','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:5, ans:'after', promptVi:'Điền after.', hint:'after'});

addPrepTime('Do not talk during the exam.', 'Đừng nói chuyện trong suốt giờ kiểm tra.', 2, ['during'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('not','particle','particle'), tok('talk','verb','verb','talk','base'), tok('during','preposition','prep'), tok('the','article','det'), tok('exam','noun','prep-object','exam','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'during', promptVi:'Điền giới từ during mang nghĩa trong suốt.', hint:'during'});

addPrepTime('They traveled during the summer vacation.', 'Họ đã đi du lịch trong suốt kỳ nghỉ hè.', 2, ['during'],
  [tok('They','pronoun','subject'), tok('traveled','verb','verb','travel','past'), tok('during','preposition','prep'), tok('the','article','det'), tok('summer','noun','modifier','summer','uncountable'), tok('vacation','noun','prep-object','vacation','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'during', promptVi:'Điền during.', hint:'during'});

addPrepTime('Wait here until five o\'clock.', 'Hãy đợi ở đây cho đến 5 giờ.', 2, ['until'],
  [tok('Wait','verb','verb','wait','base'), tok('here','adverb','adverbial'), tok('until','preposition','prep'), tok('five','numeral','modifier'), tok('o\'clock','adverb','prep-object'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'until', promptVi:'Điền giới từ until mang nghĩa cho đến khi.', hint:'until'});

addPrepTime('The shop is open until nine tonight.', 'Cửa hàng mở cửa cho đến 9 giờ tối nay.', 2, ['until'],
  [tok('The','article','det'), tok('shop','noun','subject','shop','sg'), tok('is','verb','verb','be','present-3sg'), tok('open','adjective','complement'), tok('until','preposition','prep'), tok('nine','numeral','prep-object'), tok('tonight','noun','adverbial','tonight','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:4, ans:'until', promptVi:'Điền until.', hint:'until'});

addPrepTime('We stayed at the library until it closed.', 'Chúng tôi đã ở lại thư viện cho đến khi đóng cửa.', 3, ['until'],
  [tok('We','pronoun','subject'), tok('stayed','verb','verb','stay','past'), tok('at','preposition','prep'), tok('the','article','det'), tok('library','noun','prep-object','library','sg'), tok('until','preposition','prep'), tok('it','pronoun','subject'), tok('closed','verb','verb','close','past'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}],
  {idx:5, ans:'until', promptVi:'Điền until.', hint:'until'});

addPrepTime('The baby slept quietly during the flight.', 'Em bé đã ngủ ngoan suốt chuyến bay.', 3, ['during'],
  [tok('The','article','det'), tok('baby','noun','subject','baby','sg'), tok('slept','verb','verb','sleep','past'), tok('quietly','adverb','adverbial'), tok('during','preposition','prep'), tok('the','article','det'), tok('flight','noun','prep-object','flight','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'during', promptVi:'Điền during.', hint:'during'});

// =========================================================================
// PHẦN 3: GIỚI TỪ CHUYỂN ĐỘNG & HƯỚNG (25 CÂU)
// =========================================================================

// to, into, out of, from, through, toward, along, past (25 câu)
addPrepDir('I walk to school every morning.', 'Tôi đi bộ đến trường mỗi buổi sáng.', 1, ['to'],
  [tok('I','pronoun','subject'), tok('walk','verb','verb','walk','present-other'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','uncountable'), tok('every','determiner','det'), tok('morning','noun','adverbial','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:2, ans:'to', promptVi:'Điền giới từ to chỉ phương hướng đến.', hint:'to'});

addPrepDir('She goes to the market by bike.', 'Cô ấy đi đến chợ bằng xe đạp.', 1, ['to'],
  [tok('She','pronoun','subject'), tok('goes','verb','verb','go','present-3sg'), tok('to','preposition','prep'), tok('the','article','det'), tok('market','noun','prep-object','market','sg'), tok('by','preposition','prep'), tok('bike','noun','prep-object','bike','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:2, ans:'to', promptVi:'Điền to.', hint:'to'});

addPrepDir('We traveled from Hanoi to Danang.', 'Chúng tôi đã đi du lịch từ Hà Nội đến Đà Nẵng.', 1, ['from', 'to'],
  [tok('We','pronoun','subject'), tok('traveled','verb','verb','travel','past'), tok('from','preposition','prep'), tok('Hanoi','noun','prep-object','Hanoi','sg'), tok('to','preposition','prep'), tok('Danang','noun','prep-object','Danang','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:2, ans:'from', promptVi:'Điền giới từ from mang nghĩa từ đâu.', hint:'from'});

addPrepDir('The frog jumped into the pond.', 'Con ếch đã nhảy vào trong ao.', 1, ['into'],
  [tok('The','article','det'), tok('frog','noun','subject','frog','sg'), tok('jumped','verb','verb','jump','past'), tok('into','preposition','prep'), tok('the','article','det'), tok('pond','noun','prep-object','pond','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'into', promptVi:'Điền giới từ into mang nghĩa vào trong.', hint:'into'});

addPrepDir('He ran into the warm house.', 'Cậu bé đã chạy vào trong ngôi nhà ấm cúng.', 2, ['into'],
  [tok('He','pronoun','subject'), tok('ran','verb','verb','run','past'), tok('into','preposition','prep'), tok('the','article','det'), tok('warm','adjective','modifier'), tok('house','noun','prep-object','house','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'into', promptVi:'Điền into.', hint:'into'});

addPrepDir('She put her notebook into her backpack.', 'Cô ấy đã để cuốn vở vào trong ba lô của mình.', 2, ['into'],
  [tok('She','pronoun','subject'), tok('put','verb','verb','put','past'), tok('her','determiner','det'), tok('notebook','noun','object','notebook','sg'), tok('into','preposition','prep'), tok('her','determiner','det'), tok('backpack','noun','prep-object','backpack','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'into', promptVi:'Điền into.', hint:'into'});

addPrepDir('The rabbit hopped out of the hole.', 'Chú thỏ nhảy ra khỏi cái hố.', 2, ['out of'],
  [tok('The','article','det'), tok('rabbit','noun','subject','rabbit','sg'), tok('hopped','verb','verb','hop','past'), tok('out of','preposition','prep'), tok('the','article','det'), tok('hole','noun','prep-object','hole','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'out of', promptVi:'Điền out of mang nghĩa ra khỏi.', hint:'out of'});

addPrepDir('He took an apple out of his bag.', 'Cậu ấy lấy một quả táo ra khỏi túi của mình.', 2, ['out of'],
  [tok('He','pronoun','subject'), tok('took','verb','verb','take','past'), tok('an','article','det'), tok('apple','noun','object','apple','sg'), tok('out of','preposition','prep'), tok('his','determiner','det'), tok('bag','noun','prep-object','bag','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'out of', promptVi:'Điền out of.', hint:'out of'});

addPrepDir('The fast train went through the tunnel.', 'Đoàn tàu tốc hành đã chạy qua đường hầm.', 2, ['through'],
  [tok('The','article','det'), tok('fast','adjective','modifier'), tok('train','noun','subject','train','sg'), tok('went','verb','verb','go','past'), tok('through','preposition','prep'), tok('the','article','det'), tok('tunnel','noun','prep-object','tunnel','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'through', promptVi:'Điền giới từ through mang nghĩa xuyên qua.', hint:'through'});

addPrepDir('We walked through the green bamboo forest.', 'Chúng tôi đi bộ xuyên qua rừng trúc xanh mát.', 2, ['through'],
  [tok('We','pronoun','subject'), tok('walked','verb','verb','walk','past'), tok('through','preposition','prep'), tok('the','article','det'), tok('green','adjective','modifier'), tok('bamboo','noun','modifier','bamboo','uncountable'), tok('forest','noun','prep-object','forest','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5,6]}],
  {idx:2, ans:'through', promptVi:'Điền through.', hint:'through'});

addPrepDir('Light shines through the clean glass window.', 'Ánh sáng chiếu qua khung cửa sổ kính trong veo.', 3, ['through'],
  [tok('Light','noun','subject','light','uncountable'), tok('shines','verb','verb','shine','present-3sg'), tok('through','preposition','prep'), tok('the','article','det'), tok('clean','adjective','modifier'), tok('glass','noun','modifier','glass','uncountable'), tok('window','noun','prep-object','window','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5,6]}],
  {idx:2, ans:'through', promptVi:'Điền through.', hint:'through'});

addPrepDir('The children are running toward the playground.', 'Lũ trẻ đang chạy về phía sân chơi.', 2, ['toward'],
  [tok('The','article','det'), tok('children','noun','subject','child','pl'), tok('are','verb','verb','be','aux-present-other'), tok('running','verb','verb','run','ing'), tok('toward','preposition','prep'), tok('the','article','det'), tok('playground','noun','prep-object','playground','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'toward', promptVi:'Điền giới từ toward mang nghĩa về phía.', hint:'toward'});

addPrepDir('The ship sailed toward the distant island.', 'Con tàu giương buồm về phía hòn đảo xa xôi.', 3, ['toward'],
  [tok('The','article','det'), tok('ship','noun','subject','ship','sg'), tok('sailed','verb','verb','sail','past'), tok('toward','preposition','prep'), tok('the','article','det'), tok('distant','adjective','modifier'), tok('island','noun','prep-object','island','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'toward', promptVi:'Điền toward.', hint:'toward'});

addPrepDir('We walked along the quiet sandy beach.', 'Chúng tôi đi bộ dọc theo bãi biển cát yên bình.', 2, ['along'],
  [tok('We','pronoun','subject'), tok('walked','verb','verb','walk','past'), tok('along','preposition','prep'), tok('the','article','det'), tok('quiet','adjective','modifier'), tok('sandy','adjective','modifier'), tok('beach','noun','prep-object','beach','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5,6]}],
  {idx:2, ans:'along', promptVi:'Điền giới từ along mang nghĩa dọc theo.', hint:'along'});

addPrepDir('Tall streetlights stand along the road.', 'Những cột đèn đường cao đứng dọc theo con đường.', 2, ['along'],
  [tok('Tall','adjective','modifier'), tok('streetlights','noun','subject','streetlight','pl'), tok('stand','verb','verb','stand','present-other'), tok('along','preposition','prep'), tok('the','article','det'), tok('road','noun','prep-object','road','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:3, ans:'along', promptVi:'Điền along.', hint:'along'});

addPrepDir('The red bus drove past our school.', 'Chiếc xe buýt đỏ đã chạy ngang qua trường chúng tôi.', 2, ['past'],
  [tok('The','article','det'), tok('red','adjective','modifier'), tok('bus','noun','subject','bus','sg'), tok('drove','verb','verb','drive','past'), tok('past','preposition','prep'), tok('our','determiner','det'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:4, ans:'past', promptVi:'Điền past mang nghĩa đi qua.', hint:'past'});

addPrepDir('He walked past me without speaking.', 'Cậu ấy đi lướt qua tôi mà không nói lời nào.', 3, ['past'],
  [tok('He','pronoun','subject'), tok('walked','verb','verb','walk','past'), tok('past','preposition','prep'), tok('me','pronoun','prep-object'), tok('without','preposition','prep'), tok('speaking','verb','prep-object','speak','ing'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:2, ans:'past', promptVi:'Điền past.', hint:'past'});

addPrepDir('The cat climbed up the tall wooden fence.', 'Con mèo trèo lên hàng rào gỗ cao.', 1, ['up'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('climbed','verb','verb','climb','past'), tok('up','preposition','prep'), tok('the','article','det'), tok('tall','adjective','modifier'), tok('wooden','adjective','modifier'), tok('fence','noun','prep-object','fence','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6,7]}],
  {idx:3, ans:'up', promptVi:'Điền giới từ up mang nghĩa lên trên.', hint:'up'});

addPrepDir('We hiked up the steep hill.', 'Chúng tôi đã đi bộ leo lên ngọn đồi dốc.', 2, ['up'],
  [tok('We','pronoun','subject'), tok('hiked','verb','verb','hike','past'), tok('up','preposition','prep'), tok('the','article','det'), tok('steep','adjective','modifier'), tok('hill','noun','prep-object','hill','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4,5]}],
  {idx:2, ans:'up', promptVi:'Điền up.', hint:'up'});

addPrepDir('Water flows down the mountain.', 'Nước chảy xuôi xuống dưới núi.', 1, ['down'],
  [tok('Water','noun','subject','water','uncountable'), tok('flows','verb','verb','flow','present-3sg'), tok('down','preposition','prep'), tok('the','article','det'), tok('mountain','noun','prep-object','mountain','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:2, ans:'down', promptVi:'Điền down mang nghĩa xuống dưới.', hint:'down'});

addPrepDir('He carefully rolled down the green hill.', 'Cậu bé cẩn thận lăn xuống ngọn đồi xanh.', 2, ['down'],
  [tok('He','pronoun','subject'), tok('carefully','adverb','adverbial'), tok('rolled','verb','verb','roll','past'), tok('down','preposition','prep'), tok('the','article','det'), tok('green','adjective','modifier'), tok('hill','noun','prep-object','hill','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'down', promptVi:'Điền down.', hint:'down'});

addPrepDir('Look both ways before you walk across the street.', 'Hãy nhìn cả hai phía trước khi bạn đi qua đường.', 2, ['across'],
  [tok('Look','verb','verb','look','base'), tok('both','determiner','det'), tok('ways','noun','object','way','pl'), tok('before','preposition','prep'), tok('you','pronoun','subject'), tok('walk','verb','verb','walk','base'), tok('across','preposition','prep'), tok('the','article','det'), tok('street','noun','prep-object','street','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'object', tokenIndices:[1,2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'adverbial', tokenIndices:[6,7,8]}],
  {idx:6, ans:'across', promptVi:'Điền across.', hint:'across'});

addPrepDir('The bridge stretches across the wide blue river.', 'Cây cầu bắc ngang qua dòng sông xanh rộng lớn.', 3, ['across'],
  [tok('The','article','det'), tok('bridge','noun','subject','bridge','sg'), tok('stretches','verb','verb','stretch','present-3sg'), tok('across','preposition','prep'), tok('the','article','det'), tok('wide','adjective','modifier'), tok('blue','adjective','modifier'), tok('river','noun','prep-object','river','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6,7]}],
  {idx:3, ans:'across', promptVi:'Điền across.', hint:'across'});

addPrepDir('She flew from London to Paris yesterday.', 'Cô ấy đã bay từ Luân Đôn đến Paris hôm qua.', 2, ['from', 'to'],
  [tok('She','pronoun','subject'), tok('flew','verb','verb','fly','past'), tok('from','preposition','prep'), tok('London','noun','prep-object','London','sg'), tok('to','preposition','prep'), tok('Paris','noun','prep-object','Paris','sg'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:4, ans:'to', promptVi:'Điền to.', hint:'to'});

addPrepDir('A butterfly flew into our living room.', 'Một chú bướm đã bay vào trong phòng khách của chúng tôi.', 2, ['into'],
  [tok('A','article','det'), tok('butterfly','noun','subject','butterfly','sg'), tok('flew','verb','verb','fly','past'), tok('into','preposition','prep'), tok('our','determiner','det'), tok('living','noun','modifier','living','uncountable'), tok('room','noun','prep-object','room','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:3, ans:'into', promptVi:'Điền into.', hint:'into'});

// =========================================================================
// PHẦN 4: LIÊN TỪ (55 CÂU)
// =========================================================================

// and (11 câu)
addConj('conjunction-and', 'I like apples and oranges.', 'Tôi thích táo và cam.', 1, ['and'],
  [tok('I','pronoun','subject'), tok('like','verb','verb','like','present-other'), tok('apples','noun','object','apple','pl'), tok('and','conjunction','conj'), tok('oranges','noun','object','orange','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}],
  {idx:3, ans:'and', promptVi:'Điền liên từ mang nghĩa và.', hint:'and'});

addConj('conjunction-and', 'She has a cat and a dog.', 'Cô ấy có một con mèo và một con chó.', 1, ['and'],
  [tok('She','pronoun','subject'), tok('has','verb','verb','have','present-3sg'), tok('a','article','det'), tok('cat','noun','object','cat','sg'), tok('and','conjunction','conj'), tok('a','article','det'), tok('dog','noun','object','dog','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4,5,6]}],
  {idx:4, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'He woke up early and washed his face.', 'Cậu ấy thức dậy sớm và rửa mặt.', 2, ['and'],
  [tok('He','pronoun','subject'), tok('woke','verb','verb','wake','past'), tok('up','particle','particle'), tok('early','adverb','adverbial'), tok('and','conjunction','conj'), tok('washed','verb','verb','wash','past'), tok('his','determiner','det'), tok('face','noun','object','face','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'object', tokenIndices:[6,7]}],
  {idx:4, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'My brother is tall and handsome.', 'Anh trai tôi cao ráo và đẹp trai.', 1, ['and'],
  [tok('My','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('is','verb','verb','be','present-3sg'), tok('tall','adjective','complement'), tok('and','conjunction','conj'), tok('handsome','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3,4,5]}],
  {idx:4, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'They sing and dance happily together.', 'Họ hát và khiêu vũ vui vẻ cùng nhau.', 2, ['and'],
  [tok('They','pronoun','subject'), tok('sing','verb','verb','sing','present-other'), tok('and','conjunction','conj'), tok('dance','verb','verb','dance','present-other'), tok('happily','adverb','adverbial'), tok('together','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:2, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'We bought fresh milk and sweet bread.', 'Chúng tôi đã mua sữa tươi và bánh mì ngọt.', 2, ['and'],
  [tok('We','pronoun','subject'), tok('bought','verb','verb','buy','past'), tok('fresh','adjective','modifier'), tok('milk','noun','object','milk','uncountable'), tok('and','conjunction','conj'), tok('sweet','adjective','modifier'), tok('bread','noun','object','bread','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4,5,6]}],
  {idx:4, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'The weather was cold and windy yesterday.', 'Thời tiết hôm qua đã rất lạnh và nhiều gió.', 2, ['and'],
  [tok('The','article','det'), tok('weather','noun','subject','weather','uncountable'), tok('was','verb','verb','be','past'), tok('cold','adjective','complement'), tok('and','conjunction','conj'), tok('windy','adjective','complement'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3,4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:4, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'Open your book and turn to page ten.', 'Hãy mở sách ra và chuyển đến trang mười.', 2, ['and'],
  [tok('Open','verb','verb','open','base'), tok('your','determiner','det'), tok('book','noun','object','book','sg'), tok('and','conjunction','conj'), tok('turn','verb','verb','turn','base'), tok('to','preposition','prep'), tok('page','noun','modifier','page','sg'), tok('ten','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'object', tokenIndices:[1,2]}, {clauseId:'c2', role:'verb', tokenIndices:[4]}, {clauseId:'c2', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:3, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'She plays the piano and sings beautifully.', 'Cô ấy chơi đàn dương cầm và hát rất hay.', 2, ['and'],
  [tok('She','pronoun','subject'), tok('plays','verb','verb','play','present-3sg'), tok('the','article','det'), tok('piano','noun','object','piano','sg'), tok('and','conjunction','conj'), tok('sings','verb','verb','sing','present-3sg'), tok('beautifully','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'adverbial', tokenIndices:[6]}],
  {idx:4, ans:'and', promptVi:'Điền and.', hint:'and'});

addConj('conjunction-and', 'He packed his bag, and they left for school.', 'Cậu ấy đã đóng gói cặp sách, và họ lên đường đến trường.', 3, ['and'],
  [tok('He','pronoun','subject'), tok('packed','verb','verb','pack','past'), tok('his','determiner','det'), tok('bag','noun','object','bag','sg'), punctComma, tok('and','conjunction','conj'), tok('they','pronoun','subject'), tok('left','verb','verb','leave','past'), tok('for','preposition','prep'), tok('school','noun','prep-object','school','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}, {clauseId:'c2', role:'adverbial', tokenIndices:[8,9]}],
  {idx:5, ans:'and', promptVi:'Điền and nối hai mệnh đề.', hint:'and'});

addConj('conjunction-and', 'The sun rose brightly, and the birds began singing.', 'Mặt trời mọc rực rỡ, và đàn chim bắt đầu hót.', 3, ['and'],
  [tok('The','article','det'), tok('sun','noun','subject','sun','sg'), tok('rose','verb','verb','rise','past'), tok('brightly','adverb','adverbial'), punctComma, tok('and','conjunction','conj'), tok('the','article','det'), tok('birds','noun','subject','bird','pl'), tok('began','verb','verb','begin','past'), tok('singing','verb','object','sing','ing'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c2', role:'subject', tokenIndices:[6,7]}, {clauseId:'c2', role:'verb', tokenIndices:[8]}, {clauseId:'c2', role:'object', tokenIndices:[9]}],
  {idx:5, ans:'and', promptVi:'Điền and.', hint:'and'});

// but (11 câu)
addConj('conjunction-but', 'I like tea but she likes coffee.', 'Tôi thích trà nhưng cô ấy thích cà phê.', 1, ['but'],
  [tok('I','pronoun','subject'), tok('like','verb','verb','like','present-other'), tok('tea','noun','object','tea','uncountable'), tok('but','conjunction','conj'), tok('she','pronoun','subject'), tok('likes','verb','verb','like','present-3sg'), tok('coffee','noun','object','coffee','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'object', tokenIndices:[6]}],
  {idx:3, ans:'but', promptVi:'Điền liên từ mang nghĩa nhưng.', hint:'but'});

addConj('conjunction-but', 'He is small but he is strong.', 'Cậu ấy nhỏ con nhưng cậu ấy rất khỏe.', 1, ['but'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('small','adjective','complement'), tok('but','conjunction','conj'), tok('he','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('strong','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'complement', tokenIndices:[6]}],
  {idx:3, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'She ran fast but missed the bus.', 'Cô ấy đã chạy rất nhanh nhưng vẫn lỡ chuyến xe buýt.', 2, ['but'],
  [tok('She','pronoun','subject'), tok('ran','verb','verb','run','past'), tok('fast','adverb','adverbial'), tok('but','conjunction','conj'), tok('missed','verb','verb','miss','past'), tok('the','article','det'), tok('bus','noun','object','bus','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c2', role:'verb', tokenIndices:[4]}, {clauseId:'c2', role:'object', tokenIndices:[5,6]}],
  {idx:3, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'The question was difficult but he solved it.', 'Câu hỏi thì khó nhưng cậu ấy đã giải quyết được.', 2, ['but'],
  [tok('The','article','det'), tok('question','noun','subject','question','sg'), tok('was','verb','verb','be','past'), tok('difficult','adjective','complement'), tok('but','conjunction','conj'), tok('he','pronoun','subject'), tok('solved','verb','verb','solve','past'), tok('it','pronoun','object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c2', role:'subject', tokenIndices:[5]}, {clauseId:'c2', role:'verb', tokenIndices:[6]}, {clauseId:'c2', role:'object', tokenIndices:[7]}],
  {idx:4, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'I knocked on the door, but nobody answered.', 'Tôi đã gõ cửa, nhưng không có ai trả lời.', 2, ['but'],
  [tok('I','pronoun','subject'), tok('knocked','verb','verb','knock','past'), tok('on','preposition','prep'), tok('the','article','det'), tok('door','noun','prep-object','door','sg'), punctComma, tok('but','conjunction','conj'), tok('nobody','pronoun','subject'), tok('answered','verb','verb','answer','past'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}, {clauseId:'c2', role:'subject', tokenIndices:[7]}, {clauseId:'c2', role:'verb', tokenIndices:[8]}],
  {idx:6, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'The shirt is pretty but very expensive.', 'Chiếc áo này đẹp nhưng rất đắt.', 1, ['but'],
  [tok('The','article','det'), tok('shirt','noun','subject','shirt','sg'), tok('is','verb','verb','be','present-3sg'), tok('pretty','adjective','complement'), tok('but','conjunction','conj'), tok('very','adverb','modifier'), tok('expensive','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3,4,5,6]}],
  {idx:4, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'He wanted to play outside, but it rained.', 'Cậu ấy muốn chơi bên ngoài, nhưng trời lại mưa.', 2, ['but'],
  [tok('He','pronoun','subject'), tok('wanted','verb','verb','want','past'), tok('to','particle','particle'), tok('play','verb','object','play','base'), tok('outside','adverb','adverbial'), punctComma, tok('but','conjunction','conj'), tok('it','pronoun','subject'), tok('rained','verb','verb','rain','past'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c2', role:'subject', tokenIndices:[7]}, {clauseId:'c2', role:'verb', tokenIndices:[8]}],
  {idx:6, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'They studied hard, but they felt nervous.', 'Họ đã học chăm chỉ, nhưng họ vẫn thấy lo lắng.', 2, ['but'],
  [tok('They','pronoun','subject'), tok('studied','verb','verb','study','past'), tok('hard','adverb','adverbial'), punctComma, tok('but','conjunction','conj'), tok('they','pronoun','subject'), tok('felt','verb','verb','feel','past'), tok('nervous','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[5]}, {clauseId:'c2', role:'verb', tokenIndices:[6]}, {clauseId:'c2', role:'complement', tokenIndices:[7]}],
  {idx:4, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'I looked everywhere, but I could not find my pen.', 'Tôi đã tìm khắp nơi, nhưng tôi không thể tìm thấy bút.', 3, ['but'],
  [tok('I','pronoun','subject'), tok('looked','verb','verb','look','past'), tok('everywhere','adverb','adverbial'), punctComma, tok('but','conjunction','conj'), tok('I','pronoun','subject'), tok('could','verb','verb','can','base'), tok('not','particle','particle'), tok('find','verb','verb','find','base'), tok('my','determiner','det'), tok('pen','noun','object','pen','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[5]}, {clauseId:'c2', role:'verb', tokenIndices:[6,7,8]}, {clauseId:'c2', role:'object', tokenIndices:[9,10]}],
  {idx:4, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'The room was dark, but the children were not scared.', 'Căn phòng tối om, nhưng lũ trẻ không hề sợ hãi.', 3, ['but'],
  [tok('The','article','det'), tok('room','noun','subject','room','sg'), tok('was','verb','verb','be','past'), tok('dark','adjective','complement'), punctComma, tok('but','conjunction','conj'), tok('the','article','det'), tok('children','noun','subject','child','pl'), tok('were','verb','verb','be','past'), tok('not','particle','particle'), tok('scared','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c2', role:'subject', tokenIndices:[6,7]}, {clauseId:'c2', role:'verb', tokenIndices:[8,9]}, {clauseId:'c2', role:'complement', tokenIndices:[10]}],
  {idx:5, ans:'but', promptVi:'Điền but.', hint:'but'});

addConj('conjunction-but', 'He tried his best, but he came in second place.', 'Cậu ấy đã cố gắng hết sức, nhưng cậu ấy về đích thứ hai.', 3, ['but'],
  [tok('He','pronoun','subject'), tok('tried','verb','verb','try','past'), tok('his','determiner','det'), tok('best','noun','object','best','uncountable'), punctComma, tok('but','conjunction','conj'), tok('he','pronoun','subject'), tok('came','verb','verb','come','past'), tok('in','preposition','prep'), tok('second','adjective','modifier'), tok('place','noun','prep-object','place','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}, {clauseId:'c2', role:'adverbial', tokenIndices:[8,9,10]}],
  {idx:5, ans:'but', promptVi:'Điền but.', hint:'but'});

// or (11 câu)
addConj('conjunction-or', 'Do you want tea or milk?', 'Bạn muốn trà hay sữa?', 1, ['or'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('want','verb','verb','want','base'), tok('tea','noun','object','tea','uncountable'), tok('or','conjunction','conj'), tok('milk','noun','object','milk','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3,4,5]}],
  {idx:4, ans:'or', promptVi:'Điền liên từ or mang nghĩa hoặc, hay là.', hint:'or'});

addConj('conjunction-or', 'Is that a cat or a dog?', 'Kia là một con mèo hay một con chó?', 1, ['or'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), tok('a','article','det'), tok('cat','noun','complement','cat','sg'), tok('or','conjunction','conj'), tok('a','article','det'), tok('dog','noun','complement','dog','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2,3,4,5,6]}],
  {idx:4, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'You can take the bus or walk.', 'Bạn có thể đi xe buýt hoặc đi bộ.', 2, ['or'],
  [tok('You','pronoun','subject'), tok('can','verb','verb','can','base'), tok('take','verb','verb','take','base'), tok('the','article','det'), tok('bus','noun','object','bus','sg'), tok('or','conjunction','conj'), tok('walk','verb','verb','walk','base'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c2', role:'verb', tokenIndices:[6]}],
  {idx:5, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'Would you like an apple or an orange?', 'Bạn muốn một quả táo hay một quả cam?', 2, ['or'],
  [tok('Would','verb','verb','would','base'), tok('you','pronoun','subject'), tok('like','verb','verb','like','base'), tok('an','article','det'), tok('apple','noun','object','apple','sg'), tok('or','conjunction','conj'), tok('an','article','det'), tok('orange','noun','object','orange','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3,4,5,6,7]}],
  {idx:5, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'Hurry up, or you will be late.', 'Nhanh lên, nếu không bạn sẽ bị muộn đấy.', 2, ['or'],
  [tok('Hurry','verb','verb','hurry','base'), tok('up','particle','particle'), punctComma, tok('or','conjunction','conj'), tok('you','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('be','verb','verb','be','base'), tok('late','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,1]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5,6]}, {clauseId:'c2', role:'complement', tokenIndices:[7]}],
  {idx:3, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'Do we turn left or right here?', 'Chúng ta rẽ trái hay rẽ phải ở đây?', 2, ['or'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('we','pronoun','subject'), tok('turn','verb','verb','turn','base'), tok('left','noun','object','left','uncountable'), tok('or','conjunction','conj'), tok('right','noun','object','right','uncountable'), tok('here','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3,4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:4, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'Put on your coat, or you will catch a cold.', 'Mặc áo ấm vào, nếu không bạn sẽ bị cảm lạnh đấy.', 2, ['or'],
  [tok('Put','verb','verb','put','base'), tok('on','particle','particle'), tok('your','determiner','det'), tok('coat','noun','object','coat','sg'), punctComma, tok('or','conjunction','conj'), tok('you','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('catch','verb','verb','catch','base'), tok('a','article','det'), tok('cold','noun','object','cold','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7,8]}, {clauseId:'c2', role:'object', tokenIndices:[9,10]}],
  {idx:5, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'Will you come by car or on foot?', 'Bạn sẽ đến bằng ô tô hay đi bộ?', 2, ['or'],
  [tok('Will','verb','verb','will','aux-future'), tok('you','pronoun','subject'), tok('come','verb','verb','come','base'), tok('by','preposition','prep'), tok('car','noun','prep-object','car','sg'), tok('or','conjunction','conj'), tok('on','preposition','prep'), tok('foot','noun','prep-object','foot','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6,7]}],
  {idx:5, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'Eat your breakfast now, or the milk will get cold.', 'Hãy ăn sáng ngay đi, nếu không sữa sẽ bị nguội.', 3, ['or'],
  [tok('Eat','verb','verb','eat','base'), tok('your','determiner','det'), tok('breakfast','noun','object','breakfast','uncountable'), tok('now','adverb','adverbial'), punctComma, tok('or','conjunction','conj'), tok('the','article','det'), tok('milk','noun','subject','milk','uncountable'), tok('will','verb','verb','will','aux-future'), tok('get','verb','verb','get','base'), tok('cold','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'object', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c2', role:'subject', tokenIndices:[6,7]}, {clauseId:'c2', role:'verb', tokenIndices:[8,9]}, {clauseId:'c2', role:'complement', tokenIndices:[10]}],
  {idx:5, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'Do you prefer playing football or swimming in summer?', 'Bạn thích chơi đá bóng hay đi bơi hơn vào mùa hè?', 3, ['or'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('prefer','verb','verb','prefer','base'), tok('playing','verb','object','play','ing'), tok('football','noun','object','football','uncountable'), tok('or','conjunction','conj'), tok('swimming','verb','object','swim','ing'), tok('in','preposition','prep'), tok('summer','noun','prep-object','summer','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3,4,5,6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7,8]}],
  {idx:5, ans:'or', promptVi:'Điền or.', hint:'or'});

addConj('conjunction-or', 'You should finish your homework, or teacher will be angry.', 'Bạn nên làm xong bài tập, nếu không cô giáo sẽ giận đấy.', 3, ['or'],
  [tok('You','pronoun','subject'), tok('should','verb','verb','should','base'), tok('finish','verb','verb','finish','base'), tok('your','determiner','det'), tok('homework','noun','object','homework','uncountable'), punctComma, tok('or','conjunction','conj'), tok('teacher','noun','subject','teacher','sg'), tok('will','verb','verb','will','aux-future'), tok('be','verb','verb','be','base'), tok('angry','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c2', role:'subject', tokenIndices:[7]}, {clauseId:'c2', role:'verb', tokenIndices:[8,9]}, {clauseId:'c2', role:'complement', tokenIndices:[10]}],
  {idx:6, ans:'or', promptVi:'Điền or.', hint:'or'});

// so (11 câu)
addConj('conjunction-so', 'It was raining, so we stayed home.', 'Trời mưa, vì thế chúng tôi đã ở nhà.', 1, ['so'],
  [tok('It','pronoun','subject'), tok('was','verb','verb','be','aux-past'), tok('raining','verb','verb','rain','ing'), punctComma, tok('so','conjunction','conj'), tok('we','pronoun','subject'), tok('stayed','verb','verb','stay','past'), tok('home','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c2', role:'subject', tokenIndices:[5]}, {clauseId:'c2', role:'verb', tokenIndices:[6]}, {clauseId:'c2', role:'adverbial', tokenIndices:[7]}],
  {idx:4, ans:'so', promptVi:'Điền liên từ so mang nghĩa vì vậy, cho nên.', hint:'so'});

addConj('conjunction-so', 'I was hungry, so I ate an apple.', 'Tôi đói bụng, vì thế tôi đã ăn một quả táo.', 1, ['so'],
  [tok('I','pronoun','subject'), tok('was','verb','verb','be','past'), tok('hungry','adjective','complement'), punctComma, tok('so','conjunction','conj'), tok('I','pronoun','subject'), tok('ate','verb','verb','eat','past'), tok('an','article','det'), tok('apple','noun','object','apple','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[5]}, {clauseId:'c2', role:'verb', tokenIndices:[6]}, {clauseId:'c2', role:'object', tokenIndices:[7,8]}],
  {idx:4, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'He was tired, so he went to sleep early.', 'Cậu ấy bị mệt, vì thế cậu ấy đã đi ngủ sớm.', 2, ['so'],
  [tok('He','pronoun','subject'), tok('was','verb','verb','be','past'), tok('tired','adjective','complement'), punctComma, tok('so','conjunction','conj'), tok('he','pronoun','subject'), tok('went','verb','verb','go','past'), tok('to','preposition','prep'), tok('sleep','noun','prep-object','sleep','uncountable'), tok('early','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[5]}, {clauseId:'c2', role:'verb', tokenIndices:[6]}, {clauseId:'c2', role:'adverbial', tokenIndices:[7,8]}, {clauseId:'c2', role:'adverbial', tokenIndices:[9]}],
  {idx:4, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'The test was easy, so everybody passed.', 'Bài kiểm tra dễ, vì thế mọi người đều vượt qua.', 2, ['so'],
  [tok('The','article','det'), tok('test','noun','subject','test','sg'), tok('was','verb','verb','be','past'), tok('easy','adjective','complement'), punctComma, tok('so','conjunction','conj'), tok('everybody','pronoun','subject'), tok('passed','verb','verb','pass','past'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}],
  {idx:5, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'It was very hot, so we turned on the fan.', 'Trời rất nóng, vì thế chúng tôi đã bật quạt lên.', 2, ['so'],
  [tok('It','pronoun','subject'), tok('was','verb','verb','be','past'), tok('very','adverb','modifier'), tok('hot','adjective','complement'), punctComma, tok('so','conjunction','conj'), tok('we','pronoun','subject'), tok('turned','verb','verb','turn','past'), tok('on','particle','particle'), tok('the','article','det'), tok('fan','noun','object','fan','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7,8]}, {clauseId:'c2', role:'object', tokenIndices:[9,10]}],
  {idx:5, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'She lost her pencil, so she borrowed mine.', 'Cô ấy làm mất bút chì, vì thế cô ấy đã mượn bút của tôi.', 2, ['so'],
  [tok('She','pronoun','subject'), tok('lost','verb','verb','lose','past'), tok('her','determiner','det'), tok('pencil','noun','object','pencil','sg'), punctComma, tok('so','conjunction','conj'), tok('she','pronoun','subject'), tok('borrowed','verb','verb','borrow','past'), tok('mine','pronoun','object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}, {clauseId:'c2', role:'object', tokenIndices:[8]}],
  {idx:5, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'The bus broke down, so we walked home.', 'Xe buýt bị hỏng, vì thế chúng tôi đã đi bộ về nhà.', 2, ['so'],
  [tok('The','article','det'), tok('bus','noun','subject','bus','sg'), tok('broke','verb','verb','break','past'), tok('down','particle','particle'), punctComma, tok('so','conjunction','conj'), tok('we','pronoun','subject'), tok('walked','verb','verb','walk','past'), tok('home','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}, {clauseId:'c2', role:'adverbial', tokenIndices:[8]}],
  {idx:5, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'I practiced every day, so I won the match.', 'Tôi đã luyện tập mỗi ngày, vì thế tôi đã thắng trận đấu.', 2, ['so'],
  [tok('I','pronoun','subject'), tok('practiced','verb','verb','practice','past'), tok('every','determiner','det'), tok('day','noun','adverbial','day','sg'), punctComma, tok('so','conjunction','conj'), tok('I','pronoun','subject'), tok('won','verb','verb','win','past'), tok('the','article','det'), tok('match','noun','object','match','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}, {clauseId:'c2', role:'object', tokenIndices:[8,9]}],
  {idx:5, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'The milk was sour, so mother threw it away.', 'Sữa đã bị chua, vì thế mẹ đã bỏ nó đi.', 3, ['so'],
  [tok('The','article','det'), tok('milk','noun','subject','milk','uncountable'), tok('was','verb','verb','be','past'), tok('sour','adjective','complement'), punctComma, tok('so','conjunction','conj'), tok('mother','noun','subject','mother','sg'), tok('threw','verb','verb','throw','past'), tok('it','pronoun','object'), tok('away','particle','particle'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c2', role:'subject', tokenIndices:[6]}, {clauseId:'c2', role:'verb', tokenIndices:[7,9]}, {clauseId:'c2', role:'object', tokenIndices:[8]}],
  {idx:5, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'We had no school today, so we visited the zoo.', 'Hôm nay chúng tôi được nghỉ học, vì thế chúng tôi đã đi sở thú.', 3, ['so'],
  [tok('We','pronoun','subject'), tok('had','verb','verb','have','past'), tok('no','determiner','det'), tok('school','noun','object','school','uncountable'), tok('today','noun','adverbial','today','sg'), punctComma, tok('so','conjunction','conj'), tok('we','pronoun','subject'), tok('visited','verb','verb','visit','past'), tok('the','article','det'), tok('zoo','noun','object','zoo','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c2', role:'subject', tokenIndices:[7]}, {clauseId:'c2', role:'verb', tokenIndices:[8]}, {clauseId:'c2', role:'object', tokenIndices:[9,10]}],
  {idx:6, ans:'so', promptVi:'Điền so.', hint:'so'});

addConj('conjunction-so', 'The alarm did not ring, so he woke up very late.', 'Đồng hồ báo thức không kêu, vì thế cậu ấy đã dậy rất muộn.', 3, ['so'],
  [tok('The','article','det'), tok('alarm','noun','subject','alarm','sg'), tok('did','verb','verb','do','aux-past'), tok('not','particle','particle'), tok('ring','verb','verb','ring','base'), punctComma, tok('so','conjunction','conj'), tok('he','pronoun','subject'), tok('woke','verb','verb','wake','past'), tok('up','particle','particle'), tok('very','adverb','modifier'), tok('late','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3,4]}, {clauseId:'c2', role:'subject', tokenIndices:[7]}, {clauseId:'c2', role:'verb', tokenIndices:[8,9]}, {clauseId:'c2', role:'adverbial', tokenIndices:[10,11]}],
  {idx:6, ans:'so', promptVi:'Điền so.', hint:'so'});

// because (11 câu)
addConj('conjunction-because', 'She is smiling because she won the game.', 'Cô ấy đang mỉm cười bởi vì cô ấy đã thắng trò chơi.', 1, ['because'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('smiling','verb','verb','smile','ing'), tok('because','conjunction','conj'), tok('she','pronoun','subject'), tok('won','verb','verb','win','past'), tok('the','article','det'), tok('game','noun','object','game','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'object', tokenIndices:[6,7]}],
  {idx:3, ans:'because', promptVi:'Điền liên từ because chỉ nguyên nhân.', hint:'because'});

addConj('conjunction-because', 'I stayed home because I was sick.', 'Tôi ở nhà bởi vì tôi bị ốm.', 1, ['because'],
  [tok('I','pronoun','subject'), tok('stayed','verb','verb','stay','past'), tok('home','adverb','adverbial'), tok('because','conjunction','conj'), tok('I','pronoun','subject'), tok('was','verb','verb','be','past'), tok('sick','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'complement', tokenIndices:[6]}],
  {idx:3, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'He was late because he missed his train.', 'Cậu ấy đến muộn vì cậu ấy đã bị lỡ chuyến tàu.', 2, ['because'],
  [tok('He','pronoun','subject'), tok('was','verb','verb','be','past'), tok('late','adjective','complement'), tok('because','conjunction','conj'), tok('he','pronoun','subject'), tok('missed','verb','verb','miss','past'), tok('his','determiner','det'), tok('train','noun','object','train','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'object', tokenIndices:[6,7]}],
  {idx:3, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'The baby cried because she dropped her toy.', 'Em bé đã khóc vì em làm rơi món đồ chơi.', 2, ['because'],
  [tok('The','article','det'), tok('baby','noun','subject','baby','sg'), tok('cried','verb','verb','cry','past'), tok('because','conjunction','conj'), tok('she','pronoun','subject'), tok('dropped','verb','verb','drop','past'), tok('her','determiner','det'), tok('toy','noun','object','toy','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'object', tokenIndices:[6,7]}],
  {idx:3, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'We love summer because we can go swimming.', 'Chúng tôi yêu mùa hè bởi vì chúng tôi có thể đi bơi.', 2, ['because'],
  [tok('We','pronoun','subject'), tok('love','verb','verb','love','present-other'), tok('summer','noun','object','summer','uncountable'), tok('because','conjunction','conj'), tok('we','pronoun','subject'), tok('can','verb','verb','can','base'), tok('go','verb','verb','go','base'), tok('swimming','verb','verb','swim','ing'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5,6,7]}],
  {idx:3, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'The puppy is barking because a stranger is outside.', 'Chú cún sủa bởi vì có người lạ ở bên ngoài.', 2, ['because'],
  [tok('The','article','det'), tok('puppy','noun','subject','puppy','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('barking','verb','verb','bark','ing'), tok('because','conjunction','conj'), tok('a','article','det'), tok('stranger','noun','subject','stranger','sg'), tok('is','verb','verb','be','present-3sg'), tok('outside','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[5,6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}, {clauseId:'c2', role:'adverbial', tokenIndices:[8]}],
  {idx:4, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'They were happy because they got full marks.', 'Họ đã rất vui vì họ đạt điểm tuyệt đối.', 2, ['because'],
  [tok('They','pronoun','subject'), tok('were','verb','verb','be','past'), tok('happy','adjective','complement'), tok('because','conjunction','conj'), tok('they','pronoun','subject'), tok('got','verb','verb','get','past'), tok('full','adjective','modifier'), tok('marks','noun','object','mark','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'object', tokenIndices:[6,7]}],
  {idx:3, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'We canceled the trip because the weather was bad.', 'Chúng tôi đã hủy chuyến đi vì thời tiết xấu.', 2, ['because'],
  [tok('We','pronoun','subject'), tok('canceled','verb','verb','cancel','past'), tok('the','article','det'), tok('trip','noun','object','trip','sg'), tok('because','conjunction','conj'), tok('the','article','det'), tok('weather','noun','subject','weather','uncountable'), tok('was','verb','verb','be','past'), tok('bad','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c2', role:'subject', tokenIndices:[5,6]}, {clauseId:'c2', role:'verb', tokenIndices:[7]}, {clauseId:'c2', role:'complement', tokenIndices:[8]}],
  {idx:4, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'He wore a thick scarf because the wind was icy.', 'Cậu ấy quàng khăn dày vì gió lạnh buốt.', 3, ['because'],
  [tok('He','pronoun','subject'), tok('wore','verb','verb','wear','past'), tok('a','article','det'), tok('thick','adjective','modifier'), tok('scarf','noun','object','scarf','sg'), tok('because','conjunction','conj'), tok('the','article','det'), tok('wind','noun','subject','wind','uncountable'), tok('was','verb','verb','be','past'), tok('icy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}, {clauseId:'c2', role:'subject', tokenIndices:[6,7]}, {clauseId:'c2', role:'verb', tokenIndices:[8]}, {clauseId:'c2', role:'complement', tokenIndices:[9]}],
  {idx:5, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'She drank a lot of water because she felt thirsty.', 'Cô ấy đã uống nhiều nước vì thấy khát.', 3, ['because'],
  [tok('She','pronoun','subject'), tok('drank','verb','verb','drink','past'), tok('a','article','det'), tok('lot','noun','object','lot','sg'), tok('of','preposition','prep'), tok('water','noun','prep-object','water','uncountable'), tok('because','conjunction','conj'), tok('she','pronoun','subject'), tok('felt','verb','verb','feel','past'), tok('thirsty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4,5]}, {clauseId:'c2', role:'subject', tokenIndices:[7]}, {clauseId:'c2', role:'verb', tokenIndices:[8]}, {clauseId:'c2', role:'complement', tokenIndices:[9]}],
  {idx:6, ans:'because', promptVi:'Điền because.', hint:'because'});

addConj('conjunction-because', 'The plants died because nobody watered them.', 'Những cái cây đã chết vì không có ai tưới nước cho chúng.', 3, ['because'],
  [tok('The','article','det'), tok('plants','noun','subject','plant','pl'), tok('died','verb','verb','die','past'), tok('because','conjunction','conj'), tok('nobody','pronoun','subject'), tok('watered','verb','verb','water','past'), tok('them','pronoun','object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c2', role:'subject', tokenIndices:[4]}, {clauseId:'c2', role:'verb', tokenIndices:[5]}, {clauseId:'c2', role:'object', tokenIndices:[6]}],
  {idx:3, ans:'because', promptVi:'Điền because.', hint:'because'});

// Kiểm tra số lượng câu
console.log(`Generated ${sentences.length} sentences for C2.`);
if (sentences.length < 200) {
  throw new Error(`Expected at least 200 sentences, but got ${sentences.length}`);
}

fs.writeFileSync(path.join(DATA_DIR, 'C2.sentences.json'), JSON.stringify(applyContentReviewV4('C2.sentences.json', sentences), null, 2), 'utf-8');
console.log(`✅ Saved C2.sentences.json (${sentences.length} items)`);

// =========================================================================
// 3. TẠO C2.theory.json
// =========================================================================
const theory = {
  id: 'theory-C2',
  level: 'C2',
  topic: 'prepositions-conjunctions',
  title: 'Giới từ & Liên từ (Prepositions & Conjunctions)',
  summary: 'Giới từ xác định vị trí nơi chốn, mốc thời gian và hướng di chuyển. Liên từ kết nối các từ, cụm từ và mệnh đề lại với nhau một cách mạch lạc, tạo nên các câu văn phong phú.',
  formulas: [
    {
      name: 'Giới từ nơi chốn cốt lõi (Prepositions of Place)',
      pattern: 'S + be / V + in / on / at / under / behind / next to / between / in front of + Noun...',
      examples: [
        'The cat is under the table. (Con mèo ở dưới cái bàn.)',
        'She is waiting at the bus stop. (Cô ấy đang đợi ở trạm xe buýt.)',
        'A mirror hangs on the wall. (Một chiếc gương treo trên tường.)'
      ]
    },
    {
      name: 'Giới từ thời gian In - On - At (Tam giác thời gian)',
      pattern: 'AT + giờ / mốc cụ thể | ON + thứ / ngày cụ thể | IN + tháng / năm / mùa / buổi',
      examples: [
        'at 7 o\'clock, at noon, at night',
        'on Monday, on October 10th, on the weekend',
        'in the morning, in April, in summer, in 2024'
      ]
    },
    {
      name: 'Liên từ kết hợp (Coordinating Conjunctions: And, But, Or, So)',
      pattern: 'Mệnh đề 1 + , + and / but / or / so + Mệnh đề 2',
      examples: [
        'I like tea, but she likes coffee. (Tôi thích trà, nhưng cô ấy thích cà phê.)',
        'It was raining, so we stayed home. (Trời mưa, vì thế chúng tôi ở nhà.)',
        'Hurry up, or you will be late. (Nhanh lên, nếu không bạn sẽ muộn đấy.)'
      ]
    },
    {
      name: 'Liên từ chỉ nguyên nhân (Conjunction of Cause: Because)',
      pattern: 'Mệnh đề kết quả + because + Mệnh đề nguyên nhân',
      examples: [
        'She is smiling because she won the game. (Cô ấy cười vì cô ấy đã thắng.)',
        'I stayed home because I was sick. (Tôi ở nhà bởi vì tôi bị ốm.)'
      ]
    }
  ],
  sections: [
    {
      id: 'sec-prep-place',
      title: '1. Giới từ chỉ vị trí và nơi chốn (Prepositions of Place)',
      content: 'Giới từ nơi chốn cho biết đối tượng đang ở vị trí nào trong không gian:\n- in: ở trong không gian kín hoặc khu vực (in the room, in the box, in Hanoi).\n- on: ở trên bề mặt tiếp xúc (on the table, on the wall, on the floor).\n- at: ở tại một địa điểm hoặc tọa độ cụ thể (at school, at home, at the bus stop).\n- under: ở phía dưới, gầm (under the bed, under the tree).\n- behind: ở đằng sau (behind the door, behind the house).\n- in front of: ở đằng trước (in front of the class, in front of the TV).\n- next to / beside: ngay bên cạnh (next to the window, beside her mother).\n- between ... and ...: ở giữa hai người hoặc hai vật.',
      exampleIds: ['C2-s-0001', 'C2-s-0009', 'C2-s-0017', 'C2-s-0024', 'C2-s-0031', 'C2-s-0038']
    },
    {
      id: 'sec-prep-time',
      title: '2. Giới từ chỉ thời gian: In, On, At & Before, After, During, Until',
      content: 'Quy tắc tam giác thời gian giúp nhớ dễ dàng:\n- AT (đỉnh nhọn - hẹp nhất): dùng cho giờ giấc chính xác (at 6 pm) và các cụm từ cố định: at noon, at night, at midnight, at the moment.\n- ON (khoảng giữa): dùng cho thứ trong tuần (on Monday) và ngày tháng cụ thể (on July 15th, on Christmas Day).\n- IN (đáy rộng nhất): dùng cho buổi trong ngày (in the morning/afternoon/evening), tháng (in May), mùa (in spring) và năm (in 2025).\nNgoài ra còn có:\n- before: trước khi (before dinner).\n- after: sau khi (after school).\n- during: trong suốt một khoảng thời gian (during the summer).\n- until: cho tới tận khi nào (until 5 o\'clock).',
      exampleIds: ['C2-s-0071', 'C2-s-0085', 'C2-s-0099', 'C2-s-0111', 'C2-s-0113', 'C2-s-0115']
    },
    {
      id: 'sec-conjunctions',
      title: '3. Các liên từ cốt lõi (Conjunctions: And, But, Or, So, Because)',
      content: 'Liên từ dùng để nối từ, cụm từ hoặc hai mệnh đề lại với nhau:\n- AND (và): bổ sung thông tin tương đồng.\n- BUT (nhưng): thể hiện sự tương phản, trái ngược.\n- OR (hoặc, hay là): đưa ra sự lựa chọn hoặc cảnh báo điều kiện ("nếu không thì").\n- SO (vì vậy, cho nên): chỉ kết quả của mệnh đề đứng trước (Mệnh đề chỉ Nguyên nhân + , so + Mệnh đề chỉ Kết quả).\n- BECAUSE (bởi vì): chỉ nguyên nhân của hành động (Mệnh đề chỉ Kết quả + because + Mệnh đề chỉ Nguyên nhân).',
      exampleIds: ['C2-s-0146', 'C2-s-0157', 'C2-s-0168', 'C2-s-0179', 'C2-s-0190']
    }
  ],
  commonMistakes: [
    {
      wrong: 'I have English in Monday.',
      right: 'I have English on Monday.',
      why: 'Trước thứ trong tuần bắt buộc phải dùng giới từ "on", không dùng "in".'
    },
    {
      wrong: 'The cat is sleeping on the room.',
      right: 'The cat is sleeping in the room.',
      why: 'Bên trong một căn phòng là không gian 3 chiều khép kín, bắt buộc dùng "in", không dùng "on".'
    },
    {
      wrong: 'It was raining because we stayed home.',
      right: 'It was raining, so we stayed home. (hoặc: We stayed home because it was raining.)',
      why: '"So" chỉ kết quả của vế trước (trời mưa -> kết quả là ở nhà). "Because" giải thích nguyên nhân.'
    },
    {
      wrong: 'She walked school yesterday.',
      right: 'She walked to school yesterday.',
      why: 'Đi đến một địa điểm cần giới từ chỉ phương hướng "to" (walk to school).'
    }
  ],
  tips: [
    'Quy tắc Kim Tự Tháp In-On-At: AT nhỏ nhất (giờ) -> ON vừa (ngày/thứ) -> IN lớn nhất (buổi, tháng, mùa, năm).',
    'Nhớ phân biệt "between ... and ..." (ở giữa 2 đối tượng) và "among" (ở giữa nhiều đối tượng).',
    'Khi nối 2 mệnh đề độc lập bằng "and, but, or, so", hãy nhớ đặt dấu phẩy trước liên từ.',
    'Để phân biệt "so" và "because": đặt câu hỏi "Vì sao?", vế trả lời sẽ đi liền sau "because".'
  ]
};

fs.writeFileSync(path.join(DATA_DIR, 'C2.theory.json'), JSON.stringify(applyContentReviewV4('C2.theory.json', theory), null, 2), 'utf-8');
console.log('✅ Saved C2.theory.json');
