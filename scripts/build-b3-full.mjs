import { applyContentReviewV4 } from './english-content-review-v4.mjs';
import { applyReviewedOrder } from './english-reviewed-order.mjs';
import { applyTheoryReview } from './english-theory-review.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyReviewedAnnotations } from './english-reviewed-annotations.mjs';
import { applyExercisePrompts } from './english-exercise-prompts.mjs';
import { applyCurriculumReview } from './english-curriculum-review.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'src', 'data', 'english');

const punctDot = { text: '.', pos: 'punct', role: 'punct' };
const punctQ = { text: '?', pos: 'punct', role: 'punct' };
const punctComma = { text: ',', pos: 'punct', role: 'punct' };
const punctExcl = { text: '!', pos: 'punct', role: 'punct' };

function tok(text, pos, role, lemma, feature) {
  const t = { text, pos, role };
  if (lemma !== undefined) t.lemma = lemma;
  if (feature !== undefined) t.feature = feature;
  return t;
}

function reconstructEn(tokens) {
  return tokens.reduce((acc, t, idx) => {
    if (idx === 0) return t.text;
    if (['.', ',', '?', '!', ':', ';'].includes(t.text)) return acc + t.text;
    return acc + ' ' + t.text;
  }, '');
}

// =========================================================================
// 1. VOCABULARY B3 (>= 105 words)
// =========================================================================
const vocabList = [
  // Động từ bất quy tắc (40)
  { en: 'go', vi: 'đi', pos: 'verb', ipa: '/ɡoʊ/', forms: { thirdSg: 'goes', past: 'went', ing: 'going', irregular: true }, image: '🚶', tags: ['action', 'irregular'], exampleEn: 'She went to school yesterday.', exampleVi: 'Hôm qua cô ấy đã đi học.' },
  { en: 'eat', vi: 'ăn', pos: 'verb', ipa: '/iːt/', forms: { thirdSg: 'eats', past: 'ate', ing: 'eating', irregular: true }, image: '🍽️', tags: ['action', 'irregular'], exampleEn: 'We ate pizza last night.', exampleVi: 'Tối qua chúng tôi đã ăn bánh pizza.' },
  { en: 'drink', vi: 'uống', pos: 'verb', ipa: '/drɪŋk/', forms: { thirdSg: 'drinks', past: 'drank', ing: 'drinking', irregular: true }, image: '🥤', tags: ['action', 'irregular'], exampleEn: 'He drank orange juice.', exampleVi: 'Cậu ấy đã uống nước cam.' },
  { en: 'see', vi: 'nhìn thấy', pos: 'verb', ipa: '/siː/', forms: { thirdSg: 'sees', past: 'saw', ing: 'seeing', irregular: true }, image: '👀', tags: ['action', 'irregular'], exampleEn: 'I saw a big elephant.', exampleVi: 'Tôi đã nhìn thấy một con voi to.' },
  { en: 'have', vi: 'có, ăn (bữa)', pos: 'verb', ipa: '/hæv/', forms: { thirdSg: 'has', past: 'had', ing: 'having', irregular: true }, image: '🤝', tags: ['action', 'irregular'], exampleEn: 'They had lunch at noon.', exampleVi: 'Họ đã ăn trưa vào buổi trưa.' },
  { en: 'do', vi: 'làm', pos: 'verb', ipa: '/duː/', forms: { thirdSg: 'does', past: 'did', ing: 'doing', irregular: true }, image: '✍️', tags: ['action', 'irregular'], exampleEn: 'She did her homework.', exampleVi: 'Cô ấy đã làm bài tập về nhà.' },
  { en: 'make', vi: 'làm, chế tạo', pos: 'verb', ipa: '/meɪk/', forms: { thirdSg: 'makes', past: 'made', ing: 'making', irregular: true }, image: '🔨', tags: ['action', 'irregular'], exampleEn: 'Mother made a delicious cake.', exampleVi: 'Mẹ đã làm một chiếc bánh ngon.' },
  { en: 'take', vi: 'cầm, dẫn đi, chụp ảnh', pos: 'verb', ipa: '/teɪk/', forms: { thirdSg: 'takes', past: 'took', ing: 'taking', irregular: true }, image: '📸', tags: ['action', 'irregular'], exampleEn: 'He took many photos.', exampleVi: 'Cậu ấy đã chụp nhiều bức ảnh.' },
  { en: 'buy', vi: 'mua', pos: 'verb', ipa: '/baɪ/', forms: { thirdSg: 'buys', past: 'bought', ing: 'buying', irregular: true }, image: '🛒', tags: ['action', 'irregular'], exampleEn: 'I bought a new storybook.', exampleVi: 'Tôi đã mua một cuốn truyện mới.' },
  { en: 'write', vi: 'viết', pos: 'verb', ipa: '/raɪt/', forms: { thirdSg: 'writes', past: 'wrote', ing: 'writing', irregular: true }, image: '✍️', tags: ['action', 'irregular'], exampleEn: 'She wrote a letter to her friend.', exampleVi: 'Cô ấy đã viết một bức thư cho bạn.' },
  { en: 'read', vi: 'đọc', pos: 'verb', ipa: '/riːd/', forms: { thirdSg: 'reads', past: 'read', ing: 'reading', irregular: true }, image: '📖', tags: ['action', 'irregular'], exampleEn: 'He read a comic yesterday.', exampleVi: 'Hôm qua cậu ấy đã đọc một cuốn truyện tranh.' },
  { en: 'run', vi: 'chạy', pos: 'verb', ipa: '/rʌn/', forms: { thirdSg: 'runs', past: 'ran', ing: 'running', irregular: true }, image: '🏃', tags: ['action', 'irregular'], exampleEn: 'The boy ran very fast.', exampleVi: 'Cậu bé đã chạy rất nhanh.' },
  { en: 'swim', vi: 'bơi', pos: 'verb', ipa: '/swɪm/', forms: { thirdSg: 'swims', past: 'swam', ing: 'swimming', irregular: true }, image: '🏊', tags: ['action', 'irregular'], exampleEn: 'We swam in the sea.', exampleVi: 'Chúng tôi đã bơi ở biển.' },
  { en: 'fly', vi: 'bay', pos: 'verb', ipa: '/flaɪ/', forms: { thirdSg: 'flies', past: 'flew', ing: 'flying', irregular: true }, image: '🪁', tags: ['action', 'irregular'], exampleEn: 'The birds flew away.', exampleVi: 'Những chú chim đã bay đi.' },
  { en: 'sing', vi: 'hát', pos: 'verb', ipa: '/sɪŋ/', forms: { thirdSg: 'sings', past: 'sang', ing: 'singing', irregular: true }, image: '🎤', tags: ['action', 'irregular'], exampleEn: 'The choir sang a beautiful song.', exampleVi: 'Dàn hợp xướng đã hát một bài ca tuyệt đẹp.' },
  { en: 'sleep', vi: 'ngủ', pos: 'verb', ipa: '/sliːp/', forms: { thirdSg: 'sleeps', past: 'slept', ing: 'sleeping', irregular: true }, image: '😴', tags: ['action', 'irregular'], exampleEn: 'The cat slept all afternoon.', exampleVi: 'Con mèo đã ngủ suốt buổi chiều.' },
  { en: 'sit', vi: 'ngồi', pos: 'verb', ipa: '/sɪt/', forms: { thirdSg: 'sits', past: 'sat', ing: 'sitting', irregular: true }, image: '🪑', tags: ['action', 'irregular'], exampleEn: 'They sat on the bench.', exampleVi: 'Họ đã ngồi trên ghế dài.' },
  { en: 'stand', vi: 'đứng', pos: 'verb', ipa: '/stænd/', forms: { thirdSg: 'stands', past: 'stood', ing: 'standing', irregular: true }, image: '🧍', tags: ['action', 'irregular'], exampleEn: 'He stood by the window.', exampleVi: 'Cậu ấy đã đứng bên cửa sổ.' },
  { en: 'give', vi: 'cho, tặng', pos: 'verb', ipa: '/ɡɪv/', forms: { thirdSg: 'gives', past: 'gave', ing: 'giving', irregular: true }, image: '🎁', tags: ['action', 'irregular'], exampleEn: 'She gave me a lovely present.', exampleVi: 'Cô ấy đã tặng tôi một món quà đáng yêu.' },
  { en: 'get', vi: 'nhận được, thức dậy', pos: 'verb', ipa: '/ɡet/', forms: { thirdSg: 'gets', past: 'got', ing: 'getting', irregular: true }, image: '⏰', tags: ['action', 'irregular'], exampleEn: 'I got up early yesterday.', exampleVi: 'Hôm qua tôi đã thức dậy sớm.' },
  { en: 'come', vi: 'đến', pos: 'verb', ipa: '/kʌm/', forms: { thirdSg: 'comes', past: 'came', ing: 'coming', irregular: true }, image: '🚪', tags: ['action', 'irregular'], exampleEn: 'Tom came to my house.', exampleVi: 'Tom đã đến nhà tôi.' },
  { en: 'draw', vi: 'vẽ tranh', pos: 'verb', ipa: '/drɔː/', forms: { thirdSg: 'draws', past: 'drew', ing: 'drawing', irregular: true }, image: '✏️', tags: ['action', 'irregular'], exampleEn: 'She drew a lovely cat.', exampleVi: 'Cô ấy đã vẽ một chú mèo đáng yêu.' },
  { en: 'leave', vi: 'rời khỏi', pos: 'verb', ipa: '/liːv/', forms: { thirdSg: 'leaves', past: 'left', ing: 'leaving', irregular: true }, image: '🚶', tags: ['action', 'irregular'], exampleEn: 'They left home at seven.', exampleVi: 'Họ đã rời khỏi nhà lúc bảy giờ.' },
  { en: 'meet', vi: 'gặp gỡ', pos: 'verb', ipa: '/miːt/', forms: { thirdSg: 'meets', past: 'met', ing: 'meeting', irregular: true }, image: '🤝', tags: ['action', 'irregular'], exampleEn: 'I met my friends at the park.', exampleVi: 'Tôi đã gặp các bạn của mình ở công viên.' },
  { en: 'ride', vi: 'cưỡi, đạp xe', pos: 'verb', ipa: '/raɪd/', forms: { thirdSg: 'rides', past: 'rode', ing: 'riding', irregular: true }, image: '🚴', tags: ['action', 'irregular'], exampleEn: 'He rode his bicycle to school.', exampleVi: 'Cậu ấy đã đi xe đạp tới trường.' },
  { en: 'drive', vi: 'lái xe ô tô', pos: 'verb', ipa: '/draɪv/', forms: { thirdSg: 'drives', past: 'drove', ing: 'driving', irregular: true }, image: '🚗', tags: ['action', 'irregular'], exampleEn: 'Dad drove us to the beach.', exampleVi: 'Bố đã lái xe đưa chúng tôi ra bãi biển.' },
  { en: 'win', vi: 'chiến thắng', pos: 'verb', ipa: '/wɪn/', forms: { thirdSg: 'wins', past: 'won', ing: 'winning', irregular: true }, image: '🏆', tags: ['action', 'irregular'], exampleEn: 'Our team won the match.', exampleVi: 'Đội chúng tôi đã chiến thắng trận đấu.' },
  { en: 'find', vi: 'tìm thấy', pos: 'verb', ipa: '/faɪnd/', forms: { thirdSg: 'finds', past: 'found', ing: 'finding', irregular: true }, image: '🔍', tags: ['action', 'irregular'], exampleEn: 'She found her lost pen.', exampleVi: 'Cô ấy đã tìm thấy chiếc bút bị mất.' },
  { en: 'catch', vi: 'bắt, chụp được', pos: 'verb', ipa: '/kætʃ/', forms: { thirdSg: 'catches', past: 'caught', ing: 'catching', irregular: true }, image: '🧤', tags: ['action', 'irregular'], exampleEn: 'The goalkeeper caught the ball.', exampleVi: 'Thủ môn đã bắt được bóng.' },
  { en: 'teach', vi: 'dạy dỗ', pos: 'verb', ipa: '/tiːtʃ/', forms: { thirdSg: 'teaches', past: 'taught', ing: 'teaching', irregular: true }, image: '🧑‍🏫', tags: ['action', 'irregular'], exampleEn: 'Ms. Hoa taught us English.', exampleVi: 'Cô Hoa đã dạy chúng tôi môn tiếng Anh.' },
  { en: 'bring', vi: 'mang đến', pos: 'verb', ipa: '/brɪŋ/', forms: { thirdSg: 'brings', past: 'brought', ing: 'bringing', irregular: true }, image: '🎒', tags: ['action', 'irregular'], exampleEn: 'He brought an umbrella.', exampleVi: 'Cậu ấy đã mang theo một chiếc ô.' },
  { en: 'think', vi: 'suy nghĩ', pos: 'verb', ipa: '/θɪŋk/', forms: { thirdSg: 'thinks', past: 'thought', ing: 'thinking', irregular: true }, image: '💭', tags: ['action', 'irregular'], exampleEn: 'I thought about the question.', exampleVi: 'Tôi đã suy nghĩ về câu hỏi.' },
  { en: 'know', vi: 'biết', pos: 'verb', ipa: '/noʊ/', forms: { thirdSg: 'knows', past: 'knew', ing: 'knowing', irregular: true }, image: '💡', tags: ['action', 'irregular'], exampleEn: 'He knew the correct answer.', exampleVi: 'Cậu ấy đã biết câu trả lời đúng.' },
  { en: 'tell', vi: 'kể, bảo', pos: 'verb', ipa: '/tel/', forms: { thirdSg: 'tells', past: 'told', ing: 'telling', irregular: true }, image: '🗣️', tags: ['action', 'irregular'], exampleEn: 'Grandma told us a fairy tale.', exampleVi: 'Bà đã kể cho chúng tôi nghe một câu chuyện cổ tích.' },
  { en: 'say', vi: 'nói', pos: 'verb', ipa: '/seɪ/', forms: { thirdSg: 'says', past: 'said', ing: 'saying', irregular: true }, image: '💬', tags: ['action', 'irregular'], exampleEn: 'He said hello to everyone.', exampleVi: 'Cậu ấy đã nói lời chào với mọi người.' },
  { en: 'wear', vi: 'mặc, đội', pos: 'verb', ipa: '/wer/', forms: { thirdSg: 'wears', past: 'wore', ing: 'wearing', irregular: true }, image: '👕', tags: ['action', 'irregular'], exampleEn: 'She wore a yellow dress.', exampleVi: 'Cô ấy đã mặc một chiếc váy màu vàng.' },
  { en: 'cut', vi: 'cắt', pos: 'verb', ipa: '/kʌt/', forms: { thirdSg: 'cuts', past: 'cut', ing: 'cutting', irregular: true }, image: '✂️', tags: ['action', 'irregular'], exampleEn: 'He cut the paper into two pieces.', exampleVi: 'Cậu ấy đã cắt tờ giấy thành hai mảnh.' },
  { en: 'put', vi: 'đặt, để', pos: 'verb', ipa: '/pʊt/', forms: { thirdSg: 'puts', past: 'put', ing: 'putting', irregular: true }, image: '📦', tags: ['action', 'irregular'], exampleEn: 'She put the book on the desk.', exampleVi: 'Cô ấy đã để cuốn sách lên bàn học.' },
  { en: 'hear', vi: 'nghe thấy', pos: 'verb', ipa: '/hɪr/', forms: { thirdSg: 'hears', past: 'heard', ing: 'hearing', irregular: true }, image: '👂', tags: ['action', 'irregular'], exampleEn: 'We heard a strange sound.', exampleVi: 'Chúng tôi đã nghe thấy một âm thanh lạ.' },
  { en: 'begin', vi: 'bắt đầu', pos: 'verb', ipa: '/bɪˈɡɪn/', forms: { thirdSg: 'begins', past: 'began', ing: 'beginning', irregular: true }, image: '🏁', tags: ['action', 'irregular'], exampleEn: 'The concert began at eight.', exampleVi: 'Buổi hòa nhạc đã bắt đầu lúc tám giờ.' },

  // Động từ có quy tắc (30)
  { en: 'play', vi: 'chơi', pos: 'verb', ipa: '/pleɪ/', forms: { thirdSg: 'plays', past: 'played', ing: 'playing', irregular: false }, image: '⚽', tags: ['action', 'regular'], exampleEn: 'They played football yesterday.', exampleVi: 'Họ đã chơi bóng đá hôm qua.' },
  { en: 'watch', vi: 'xem', pos: 'verb', ipa: '/wɑːtʃ/', forms: { thirdSg: 'watches', past: 'watched', ing: 'watching', irregular: false }, image: '📺', tags: ['action', 'regular'], exampleEn: 'I watched TV last night.', exampleVi: 'Tôi đã xem tivi tối qua.' },
  { en: 'clean', vi: 'dọn dẹp, lau chùi', pos: 'verb', ipa: '/kliːn/', forms: { thirdSg: 'cleans', past: 'cleaned', ing: 'cleaning', irregular: false }, image: '🧹', tags: ['action', 'regular'], exampleEn: 'He cleaned his room.', exampleVi: 'Cậu ấy đã dọn phòng của mình.' },
  { en: 'wash', vi: 'rửa, giặt', pos: 'verb', ipa: '/wɑːʃ/', forms: { thirdSg: 'washes', past: 'washed', ing: 'washing', irregular: false }, image: '🧼', tags: ['action', 'regular'], exampleEn: 'She washed the dishes.', exampleVi: 'Cô ấy đã rửa bát đĩa.' },
  { en: 'cook', vi: 'nấu nướng', pos: 'verb', ipa: '/kʊk/', forms: { thirdSg: 'cooks', past: 'cooked', ing: 'cooking', irregular: false }, image: '🍳', tags: ['action', 'regular'], exampleEn: 'Father cooked dinner.', exampleVi: 'Bố đã nấu bữa tối.' },
  { en: 'study', vi: 'học tập', pos: 'verb', ipa: '/ˈstʌd.i/', forms: { thirdSg: 'studies', past: 'studied', ing: 'studying', irregular: false }, image: '📚', tags: ['action', 'regular'], exampleEn: 'Nam studied hard for the exam.', exampleVi: 'Nam đã học bài chăm chỉ cho kỳ thi.' },
  { en: 'visit', vi: 'thăm, viếng', pos: 'verb', ipa: '/ˈvɪz.ɪt/', forms: { thirdSg: 'visits', past: 'visited', ing: 'visiting', irregular: false }, image: '🏡', tags: ['action', 'regular'], exampleEn: 'We visited grandparents last Sunday.', exampleVi: 'Chúng tôi đã thăm ông bà Chủ nhật trước.' },
  { en: 'walk', vi: 'đi bộ', pos: 'verb', ipa: '/wɔːk/', forms: { thirdSg: 'walks', past: 'walked', ing: 'walking', irregular: false }, image: '🚶', tags: ['action', 'regular'], exampleEn: 'She walked to school.', exampleVi: 'Cô ấy đã đi bộ tới trường.' },
  { en: 'open', vi: 'mở', pos: 'verb', ipa: '/ˈoʊ.pən/', forms: { thirdSg: 'opens', past: 'opened', ing: 'opening', irregular: false }, image: '🚪', tags: ['action', 'regular'], exampleEn: 'He opened the door.', exampleVi: 'Cậu ấy đã mở cửa.' },
  { en: 'close', vi: 'đóng lại', pos: 'verb', ipa: '/kloʊz/', forms: { thirdSg: 'closes', past: 'closed', ing: 'closing', irregular: false }, image: '📕', tags: ['action', 'regular'], exampleEn: 'She closed the window.', exampleVi: 'Cô ấy đã đóng cửa sổ.' },
  { en: 'help', vi: 'giúp đỡ', pos: 'verb', ipa: '/help/', forms: { thirdSg: 'helps', past: 'helped', ing: 'helping', irregular: false }, image: '🤝', tags: ['action', 'regular'], exampleEn: 'He helped his mother.', exampleVi: 'Cậu ấy đã giúp đỡ mẹ mình.' },
  { en: 'paint', vi: 'vẽ tranh màu, sơn', pos: 'verb', ipa: '/peɪnt/', forms: { thirdSg: 'paints', past: 'painted', ing: 'painting', irregular: false }, image: '🎨', tags: ['action', 'regular'], exampleEn: 'Lan painted a flower.', exampleVi: 'Lan đã vẽ một bông hoa.' },
  { en: 'listen', vi: 'lắng nghe', pos: 'verb', ipa: '/ˈlɪs.ən/', forms: { thirdSg: 'listens', past: 'listened', ing: 'listening', irregular: false }, image: '🎧', tags: ['action', 'regular'], exampleEn: 'We listened to music.', exampleVi: 'Chúng tôi đã nghe nhạc.' },
  { en: 'skip', vi: 'nhảy dây', pos: 'verb', ipa: '/skɪp/', forms: { thirdSg: 'skips', past: 'skipped', ing: 'skipping', irregular: false }, image: '🪢', tags: ['action', 'regular'], exampleEn: 'The girls skipped in the yard.', exampleVi: 'Các cô bé đã nhảy dây trong sân.' },
  { en: 'stop', vi: 'dừng lại', pos: 'verb', ipa: '/stɑːp/', forms: { thirdSg: 'stops', past: 'stopped', ing: 'stopping', irregular: false }, image: '🛑', tags: ['action', 'regular'], exampleEn: 'The bus stopped here.', exampleVi: 'Xe buýt đã dừng lại ở đây.' },
  { en: 'clap', vi: 'vỗ tay', pos: 'verb', ipa: '/klæp/', forms: { thirdSg: 'claps', past: 'clapped', ing: 'clapping', irregular: false }, image: '👏', tags: ['action', 'regular'], exampleEn: 'The audience clapped happily.', exampleVi: 'Khán giả đã vỗ tay vui vẻ.' },
  { en: 'hop', vi: 'nhảy lò cò', pos: 'verb', ipa: '/hɑːp/', forms: { thirdSg: 'hops', past: 'hopped', ing: 'hopping', irregular: false }, image: '🦘', tags: ['action', 'regular'], exampleEn: 'The rabbit hopped away.', exampleVi: 'Chú thỏ đã nhảy lò cò đi mất.' },
  { en: 'wait', vi: 'chờ đợi', pos: 'verb', ipa: '/weɪt/', forms: { thirdSg: 'waits', past: 'waited', ing: 'waiting', irregular: false }, image: '⏳', tags: ['action', 'regular'], exampleEn: 'I waited for an hour.', exampleVi: 'Tôi đã chờ đợi suốt một tiếng đồng hồ.' },
  { en: 'plant', vi: 'trồng cây', pos: 'verb', ipa: '/plænt/', forms: { thirdSg: 'plants', past: 'planted', ing: 'planting', irregular: false }, image: '🌱', tags: ['action', 'regular'], exampleEn: 'They planted trees.', exampleVi: 'Họ đã trồng cây.' },
  { en: 'water', vi: 'tưới nước', pos: 'verb', ipa: '/ˈwɑː.t̬ɚ/', forms: { thirdSg: 'waters', past: 'watered', ing: 'watering', irregular: false }, image: '🚿', tags: ['action', 'regular'], exampleEn: 'Grandpa watered the roses.', exampleVi: 'Ông đã tưới những bông hoa hồng.' },
  { en: 'smile', vi: 'mỉm cười', pos: 'verb', ipa: '/smaɪl/', forms: { thirdSg: 'smiles', past: 'smiled', ing: 'smiling', irregular: false }, image: '😊', tags: ['action', 'regular'], exampleEn: 'The baby smiled at me.', exampleVi: 'Em bé đã mỉm cười với tôi.' },
  { en: 'live', vi: 'sống, cư trú', pos: 'verb', ipa: '/lɪv/', forms: { thirdSg: 'lives', past: 'lived', ing: 'living', irregular: false }, image: '🏡', tags: ['action', 'regular'], exampleEn: 'They lived in Hue.', exampleVi: 'Họ đã từng sống ở Huế.' },
  { en: 'dance', vi: 'khiêu vũ, nhảy múa', pos: 'verb', ipa: '/dæns/', forms: { thirdSg: 'dances', past: 'danced', ing: 'dancing', irregular: false }, image: '💃', tags: ['action', 'regular'], exampleEn: 'She danced gracefully.', exampleVi: 'Cô ấy đã nhảy múa rất uyển chuyển.' },
  { en: 'carry', vi: 'mang, xách, vác', pos: 'verb', ipa: '/ˈker.i/', forms: { thirdSg: 'carries', past: 'carried', ing: 'carrying', irregular: false }, image: '🎒', tags: ['action', 'regular'], exampleEn: 'He carried the heavy box.', exampleVi: 'Cậu ấy đã bê chiếc hộp nặng.' },
  { en: 'brush', vi: 'chải, đánh (răng)', pos: 'verb', ipa: '/brʌʃ/', forms: { thirdSg: 'brushes', past: 'brushed', ing: 'brushing', irregular: false }, image: '🪥', tags: ['action', 'regular'], exampleEn: 'I brushed my teeth.', exampleVi: 'Tôi đã đánh răng.' },
  { en: 'start', vi: 'bắt đầu', pos: 'verb', ipa: '/stɑːrt/', forms: { thirdSg: 'starts', past: 'started', ing: 'starting', irregular: false }, image: '🏁', tags: ['action', 'regular'], exampleEn: 'The movie started at seven.', exampleVi: 'Bộ phim đã bắt đầu lúc bảy giờ.' },
  { en: 'finish', vi: 'hoàn thành, kết thúc', pos: 'verb', ipa: '/ˈfɪn.ɪʃ/', forms: { thirdSg: 'finishes', past: 'finished', ing: 'finishing', irregular: false }, image: '🏁', tags: ['action', 'regular'], exampleEn: 'She finished her work.', exampleVi: 'Cô ấy đã hoàn thành công việc của mình.' },
  { en: 'climb', vi: 'leo trèo', pos: 'verb', ipa: '/klaɪm/', forms: { thirdSg: 'climbs', past: 'climbed', ing: 'climbing', irregular: false }, image: '🧗', tags: ['action', 'regular'], exampleEn: 'The monkey climbed the tree.', exampleVi: 'Con khỉ đã trèo lên cây.' },
  { en: 'look', vi: 'nhìn ngắm', pos: 'verb', ipa: '/lʊk/', forms: { thirdSg: 'looks', past: 'looked', ing: 'looking', irregular: false }, image: '👀', tags: ['action', 'regular'], exampleEn: 'He looked at the picture.', exampleVi: 'Cậu ấy đã nhìn vào bức tranh.' },
  { en: 'kick', vi: 'đá', pos: 'verb', ipa: '/kɪk/', forms: { thirdSg: 'kicks', past: 'kicked', ing: 'kicking', irregular: false }, image: '🦵', tags: ['action', 'regular'], exampleEn: 'He kicked the ball into the net.', exampleVi: 'Cậu ấy đã đá bóng vào lưới.' },

  // Mốc thời gian quá khứ (12)
  { en: 'yesterday', vi: 'hôm qua', pos: 'adverb', ipa: '/ˈjes.tɚ.deɪ/', image: '📅', tags: ['time', 'past'], exampleEn: 'I went to school yesterday.', exampleVi: 'Hôm qua tôi đã đi học.' },
  { en: 'last night', vi: 'tối qua', pos: 'adverb', ipa: '/ˌlæst ˈnaɪt/', image: '🌙', tags: ['time', 'past'], exampleEn: 'They watched a movie last night.', exampleVi: 'Họ đã xem phim tối qua.' },
  { en: 'last week', vi: 'tuần trước', pos: 'adverb', ipa: '/ˌlæst ˈwiːk/', image: '📆', tags: ['time', 'past'], exampleEn: 'We visited grandparents last week.', exampleVi: 'Chúng tôi đã thăm ông bà tuần trước.' },
  { en: 'last month', vi: 'tháng trước', pos: 'adverb', ipa: '/ˌlæst ˈmʌnθ/', image: '🗓️', tags: ['time', 'past'], exampleEn: 'He bought a new bicycle last month.', exampleVi: 'Cậu ấy đã mua một chiếc xe đạp mới tháng trước.' },
  { en: 'last year', vi: 'năm ngoái', pos: 'adverb', ipa: '/ˌlæst ˈjɪr/', image: '🎆', tags: ['time', 'past'], exampleEn: 'They traveled to Da Nang last year.', exampleVi: 'Họ đã đi du lịch Đà Nẵng năm ngoái.' },
  { en: 'last Sunday', vi: 'Chủ nhật trước', pos: 'adverb', ipa: '/ˌlæst ˈsʌn.deɪ/', image: '☀️', tags: ['time', 'past'], exampleEn: 'We played soccer last Sunday.', exampleVi: 'Chúng tôi đã chơi bóng đá Chủ nhật trước.' },
  { en: 'ago', vi: 'cách đây, trước đây', pos: 'adverb', ipa: '/əˈɡoʊ/', image: '⏳', tags: ['time', 'past'], exampleEn: 'He left two hours ago.', exampleVi: 'Cậu ấy đã rời đi cách đây hai tiếng.' },
  { en: 'two days ago', vi: 'hai ngày trước', pos: 'adverb', ipa: '/ˌtuː deɪz əˈɡoʊ/', image: '⏱️', tags: ['time', 'past'], exampleEn: 'I saw him two days ago.', exampleVi: 'Tôi đã nhìn thấy cậu ấy hai ngày trước.' },
  { en: 'three days ago', vi: 'ba ngày trước', pos: 'adverb', ipa: '/ˌθriː deɪz əˈɡoʊ/', image: '⏱️', tags: ['time', 'past'], exampleEn: 'She arrived three days ago.', exampleVi: 'Cô ấy đã đến nơi ba ngày trước.' },
  { en: 'an hour ago', vi: 'một giờ trước', pos: 'adverb', ipa: '/ən ˈaʊ.ɚ əˈɡoʊ/', image: '⌛', tags: ['time', 'past'], exampleEn: 'The bell rang an hour ago.', exampleVi: 'Chuông đã reo cách đây một giờ.' },
  { en: 'last summer', vi: 'mùa hè năm ngoái', pos: 'adverb', ipa: '/ˌlæst ˈsʌm.ɚ/', image: '🏖️', tags: ['time', 'past'], exampleEn: 'We went to the beach last summer.', exampleVi: 'Chúng tôi đã đi biển vào mùa hè năm ngoái.' },
  { en: 'then', vi: 'khi đó, sau đó', pos: 'adverb', ipa: '/ðen/', image: '🔜', tags: ['time', 'past'], exampleEn: 'We were young then.', exampleVi: 'Khi đó chúng tôi còn trẻ.' },

  // Danh từ địa điểm, sự kiện, đồ vật liên quan (24)
  { en: 'zoo', vi: 'vườn bách thú', pos: 'noun', ipa: '/zuː/', forms: { plural: 'zoos' }, image: '🦁', tags: ['place'], exampleEn: 'We went to the zoo yesterday.', exampleVi: 'Hôm qua chúng tôi đã đi vườn bách thú.' },
  { en: 'museum', vi: 'bảo tàng', pos: 'noun', ipa: '/mjuːˈziː.əm/', forms: { plural: 'museums' }, image: '🏛️', tags: ['place'], exampleEn: 'They visited the history museum.', exampleVi: 'Họ đã thăm bảo tàng lịch sử.' },
  { en: 'cinema', vi: 'rạp chiếu phim', pos: 'noun', ipa: '/ˈsɪn.ə.mə/', forms: { plural: 'cinemas' }, image: '🎬', tags: ['place'], exampleEn: 'We went to the cinema last night.', exampleVi: 'Chúng tôi đã đi rạp chiếu phim tối qua.' },
  { en: 'beach', vi: 'bãi biển', pos: 'noun', ipa: '/biːtʃ/', forms: { plural: 'beaches' }, image: '🏖️', tags: ['place'], exampleEn: 'They had fun at the beach.', exampleVi: 'Họ đã vui chơi tại bãi biển.' },
  { en: 'picnic', vi: 'buổi dã ngoại', pos: 'noun', ipa: '/ˈpɪk.nɪk/', forms: { plural: 'picnics' }, image: '🧺', tags: ['activity'], exampleEn: 'We had a picnic in the park.', exampleVi: 'Chúng tôi đã có một buổi dã ngoại trong công viên.' },
  { en: 'party', vi: 'bữa tiệc', pos: 'noun', ipa: '/ˈpɑːr.t̬i/', forms: { plural: 'parties' }, image: '🎉', tags: ['activity'], exampleEn: 'She went to a birthday party.', exampleVi: 'Cô ấy đã đi dự một bữa tiệc sinh nhật.' },
  { en: 'holiday', vi: 'kỳ nghỉ, ngày lễ', pos: 'noun', ipa: '/ˈhɑː.lə.deɪ/', forms: { plural: 'holidays' }, image: '🌴', tags: ['time'], exampleEn: 'We had a wonderful holiday.', exampleVi: 'Chúng tôi đã có một kỳ nghỉ tuyệt vời.' },
  { en: 'trip', vi: 'chuyến đi', pos: 'noun', ipa: '/trɪp/', forms: { plural: 'trips' }, image: '🧳', tags: ['activity'], exampleEn: 'He enjoyed the school trip.', exampleVi: 'Cậu ấy đã rất thích chuyến dã ngoại của trường.' },
  { en: 'present', vi: 'món quà', pos: 'noun', ipa: '/ˈprez.ənt/', forms: { plural: 'presents' }, image: '🎁', tags: ['object'], exampleEn: 'I received a nice present.', exampleVi: 'Tôi đã nhận được một món quà đẹp.' },
  { en: 'letter', vi: 'bức thư', pos: 'noun', ipa: '/ˈlet̬.ɚ/', forms: { plural: 'letters' }, image: '✉️', tags: ['object'], exampleEn: 'She wrote a letter to her aunt.', exampleVi: 'Cô ấy đã viết một bức thư cho dì.' },
  { en: 'storybook', vi: 'sách truyện', pos: 'noun', ipa: '/ˈstɔːr.i.bʊk/', forms: { plural: 'storybooks' }, image: '📕', tags: ['object'], exampleEn: 'He read a great storybook.', exampleVi: 'Cậu ấy đã đọc một cuốn truyện tuyệt hay.' },
  { en: 'movie', vi: 'bộ phim', pos: 'noun', ipa: '/ˈmuː.vi/', forms: { plural: 'movies' }, image: '🎥', tags: ['object'], exampleEn: 'We watched a funny movie.', exampleVi: 'Chúng tôi đã xem một bộ phim hài hước.' },
  { en: 'game', vi: 'trận đấu, trò chơi', pos: 'noun', ipa: '/ɡeɪm/', forms: { plural: 'games' }, image: '🎮', tags: ['activity'], exampleEn: 'They played a fun game.', exampleVi: 'Họ đã chơi một trò chơi vui nhộn.' },
  { en: 'song', vi: 'bài hát', pos: 'noun', ipa: '/sɔːŋ/', forms: { plural: 'songs' }, image: '🎵', tags: ['object'], exampleEn: 'We sang an English song.', exampleVi: 'Chúng tôi đã hát một bài hát tiếng Anh.' },
  { en: 'cake', vi: 'bánh ngọt', pos: 'noun', ipa: '/keɪk/', forms: { plural: 'cakes' }, image: '🎂', tags: ['food'], exampleEn: 'Mother baked a chocolate cake.', exampleVi: 'Mẹ đã nướng một chiếc bánh sô-cô-la.' },
  { en: 'pizza', vi: 'bánh pi-da', pos: 'noun', ipa: '/ˈpiːt.sə/', forms: { plural: 'pizzas' }, image: '🍕', tags: ['food'], exampleEn: 'We ate pizza for dinner.', exampleVi: 'Chúng tôi đã ăn bánh pizza cho bữa tối.' },
  {"en":"noodle","vi":"sợi mì (thường dùng số nhiều: noodles)","pos":"noun","ipa":"/ˈnuː.dəl/","forms":{"plural":"noodles"},"image":"🍜","tags":["food"],"exampleEn":"He ate noodles for breakfast yesterday.","exampleVi":"Hôm qua cậu ấy ăn mì vào bữa sáng."},
  { en: 'ice cream', vi: 'kem', pos: 'noun', ipa: '/ˌaɪs ˈkriːm/', image: '🍦', tags: ['food'], exampleEn: 'She bought an ice cream.', exampleVi: 'Cô ấy đã mua một que kem.' },
  { en: 'hospital', vi: 'bệnh viện', pos: 'noun', ipa: '/ˈhɑː.spɪ.t̬əl/', forms: { plural: 'hospitals' }, image: '🏥', tags: ['place'], exampleEn: 'He was in the hospital yesterday.', exampleVi: 'Hôm qua cậu ấy đã ở bệnh viện.' },
  { en: 'countryside', vi: 'miền quê, nông thôn', pos: 'noun', ipa: '/ˈkʌn.tri.saɪd/', image: '🌾', tags: ['place'], exampleEn: 'They lived in the countryside.', exampleVi: 'Họ đã từng sống ở vùng nông thôn.' },
  { en: 'sea', vi: 'biển', pos: 'noun', ipa: '/siː/', forms: { plural: 'seas' }, image: '🌊', tags: ['nature'], exampleEn: 'We swam in the sea.', exampleVi: 'Chúng tôi đã bơi ở biển.' },
  { en: 'lion', vi: 'sư tử', pos: 'noun', ipa: '/ˈlaɪ.ən/', forms: { plural: 'lions' }, image: '🦁', tags: ['animal'], exampleEn: 'We saw a big lion at the zoo.', exampleVi: 'Chúng tôi đã thấy một chú sư tử lớn ở vườn thú.' },
  { en: 'tiger', vi: 'con hổ', pos: 'noun', ipa: '/ˈtaɪ.ɡɚ/', forms: { plural: 'tigers' }, image: '🐯', tags: ['animal'], exampleEn: 'The tiger ran fast.', exampleVi: 'Con hổ đã chạy rất nhanh.' },
  { en: 'elephant', vi: 'con voi', pos: 'noun', ipa: '/ˈel.ə.fənt/', forms: { plural: 'elephants' }, image: '🐘', tags: ['animal'], exampleEn: 'We saw an elephant yesterday.', exampleVi: 'Hôm qua chúng tôi đã nhìn thấy một con voi.' }
];

const finalVocab = vocabList.map((item, idx) => ({
  id: `B3-v-${String(idx + 1).padStart(4, '0')}`,
  level: 'B3',
  topic: 'past-simple',
  ...item,
  source: 'seed'
}));

fs.writeFileSync(path.join(DATA_DIR, 'B3.vocab.json'), JSON.stringify(applyContentReviewV4('B3.vocab.json', finalVocab), null, 2), 'utf-8');
console.log(`✅ Generated B3.vocab.json with ${finalVocab.length} words (target ≥ 100).`);

// =========================================================================
// 2. SENTENCES GENERATOR B3 (200 sentences)
// =========================================================================
const sentences = [];
let sIdx = 1;

function addSentence(grammarPoint, en, vi, difficulty, tags, tokens, roleSpans, exerciseTypes, blankDef, orderAlternatives) {
  const reconstructed = reconstructEn(tokens);
  if (reconstructed !== en) {
    throw new Error(`Reconstruction mismatch:\nen: "${en}"\nreconstructed: "${reconstructed}"`);
  }

  const id = `B3-s-${String(sIdx++).padStart(4, '0')}`;
  const blank = {
    tokenIndex: blankDef.idx,
    answer: blankDef.ans,
    hint: blankDef.hint,
    promptVi: blankDef.promptVi
  };
  if (blankDef.alt) blank.alt = blankDef.alt;

  const item = {
    id,
    level: 'B3',
    topic: 'past-simple',
    grammarPoint,
    en,
    vi,
    tokens,
    blanks: [blank],
    difficulty,
    tags,
    source: 'seed',
    roleSpans,
    exerciseTypes
  };

  if (orderAlternatives && orderAlternatives.length > 0) {
    const origMultiset = tokens.map(t => t.text.toLowerCase()).sort();
    for (const alt of orderAlternatives) {
      const altTokens = alt.split(/(\s+|(?=[.,?!])|(?<=[.,?!]))/).filter(s => s.trim().length > 0);
      const altMultiset = altTokens.map(t => t.toLowerCase()).sort();
      if (JSON.stringify(origMultiset) !== JSON.stringify(altMultiset)) {
        throw new Error(`orderAlternative multiset mismatch in sentence ${id}: "${alt}" vs original "${en}"`);
      }
    }
    item.orderAlternatives = orderAlternatives;
  }

  sentences.push(applyExercisePrompts(applyReviewedAnnotations(applyCurriculumReview(item))));
}

// Helper: To Be past (was / were / wasn't / weren't)
function addWasWere(sTokens, beText, beFeat, compTokens, vi, diff, tags, blankIsBe, promptVi, hint) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of sTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const beIdx = curIdx++;
  tokens.push(tok(beText, 'verb', 'verb', 'be', beFeat));

  const compIndices = [];
  for (const ct of compTokens) {
    tokens.push(ct);
    compIndices.push(curIdx++);
  }
  tokens.push(punctDot);

  const roleSpans = [
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    { clauseId: 'c1', role: 'verb', tokenIndices: [beIdx] },
    { clauseId: 'c1', role: 'complement', tokenIndices: compIndices }
  ];

  const blankDef = blankIsBe
    ? { idx: beIdx, ans: beText, promptVi, hint }
    : { idx: compIndices[0], ans: compTokens[0].text, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('was-were', en, vi, diff, ['was-were', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// Helper: Regular & Irregular affirmative: S + V(past) + (O) + (A)
function addPastAff(sTokens, vText, vLemma, restTokens, vi, diff, gp, tags, promptVi, hint) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of sTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const vIdx = curIdx++;
  tokens.push(tok(vText, 'verb', 'verb', vLemma, 'past'));

  const restSpans = [];
  if (restTokens && restTokens.length > 0) {
    for (const rt of restTokens) {
      const rIdx = curIdx++;
      tokens.push(rt);
      if (rt.role === 'object') restSpans.push({ clauseId: 'c1', role: 'object', tokenIndices: [rIdx] });
      else if (rt.role === 'adverbial') restSpans.push({ clauseId: 'c1', role: 'adverbial', tokenIndices: [rIdx] });
    }
  }
  tokens.push(punctDot);

  const roleSpans = [
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    { clauseId: 'c1', role: 'verb', tokenIndices: [vIdx] },
    ...restSpans
  ];

  const blankDef = { idx: vIdx, ans: vText, promptVi, hint };
  const en = reconstructEn(tokens);
  addSentence(gp, en, vi, diff, [gp, ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// Helper: Past Negative: S + didn't + V(base) + (O) + (A)
function addPastNeg(sTokens, vBaseText, vLemma, restTokens, vi, diff, tags, blankIsAux, promptVi, hint) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of sTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const auxIdx = curIdx++;
  tokens.push(tok("didn't", 'verb', 'verb', 'do', 'aux-past-neg'));

  const vIdx = curIdx++;
  tokens.push(tok(vBaseText, 'verb', 'verb', vLemma, 'base'));

  const restSpans = [];
  if (restTokens && restTokens.length > 0) {
    for (const rt of restTokens) {
      const rIdx = curIdx++;
      tokens.push(rt);
      if (rt.role === 'object') restSpans.push({ clauseId: 'c1', role: 'object', tokenIndices: [rIdx] });
      else if (rt.role === 'adverbial') restSpans.push({ clauseId: 'c1', role: 'adverbial', tokenIndices: [rIdx] });
    }
  }
  tokens.push(punctDot);

  const roleSpans = [
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    { clauseId: 'c1', role: 'verb', tokenIndices: [auxIdx, vIdx] },
    ...restSpans
  ];

  const blankDef = blankIsAux
    ? { idx: auxIdx, ans: "didn't", promptVi, hint }
    : { idx: vIdx, ans: vBaseText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('did-support-negative', en, vi, diff, ['negative', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// Helper: Past Question: Did + S + V(base) + (O) + (A)?
function addPastQ(sTokens, vBaseText, vLemma, restTokens, vi, diff, tags, blankIsDid, promptVi, hint, orderAlternatives) {
  const tokens = [];
  let curIdx = 0;

  const didIdx = curIdx++;
  tokens.push(tok('Did', 'verb', 'verb', 'do', 'aux-past'));

  const sIndices = [];
  for (const st of sTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const vIdx = curIdx++;
  tokens.push(tok(vBaseText, 'verb', 'verb', vLemma, 'base'));

  const restSpans = [];
  if (restTokens && restTokens.length > 0) {
    for (const rt of restTokens) {
      const rIdx = curIdx++;
      tokens.push(rt);
      if (rt.role === 'object') restSpans.push({ clauseId: 'c1', role: 'object', tokenIndices: [rIdx] });
      else if (rt.role === 'adverbial') restSpans.push({ clauseId: 'c1', role: 'adverbial', tokenIndices: [rIdx] });
    }
  }
  tokens.push(punctQ);

  const roleSpans = [
    { clauseId: 'c1', role: 'verb', tokenIndices: [didIdx, vIdx] },
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    ...restSpans
  ];

  const blankDef = blankIsDid
    ? { idx: didIdx, ans: 'Did', promptVi, hint }
    : { idx: vIdx, ans: vBaseText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('did-question', en, vi, diff, ['question', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef, orderAlternatives);
}

// -------------------------------------------------------------------------
// NHÓM 1: WAS / WERE (40 câu: B3-s-0001 -> B3-s-0040)
// -------------------------------------------------------------------------
addWasWere([tok('I','pronoun','subject')], 'was', 'aux-past', [tok('happy','adjective','complement'), tok('yesterday','adverb','adverbial')], 'Hôm qua tôi đã rất vui.', 1, ['emotion'], true, 'Chủ ngữ I đi với to be quá khứ was.', 'I + was');
addWasWere([tok('He','pronoun','subject')], 'was', 'aux-past', [tok('at','preposition','prep'), tok('home','noun','prep-object','home','uncountable'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua cậu ấy đã ở nhà.', 1, ['place'], true, 'Chủ ngữ He đi với to be quá khứ was.', 'He + was');
addWasWere([tok('She','pronoun','subject')], 'was', 'aux-past', [tok('tired','adjective','complement')], 'Cô ấy đã bị mệt.', 1, ['feeling'], true, 'Chủ ngữ She đi với to be quá khứ was.', 'She + was');
addWasWere([tok('The','article','det'), tok('weather','noun','subject','weather','uncountable')], 'was', 'aux-past', [tok('sunny','adjective','complement'), tok('yesterday','adverb','adverbial')], 'Hôm qua thời tiết đã có nắng.', 1, ['weather'], true, 'Danh từ số ít The weather đi với was.', 'weather + was');
addWasWere([tok('Nam','noun','subject','Nam','sg')], 'was', 'aux-past', [tok('at','preposition','prep'), tok('school','noun','prep-object','school','sg')], 'Nam đã ở trường.', 1, ['place'], true, 'Nam (số ít) đi với to be quá khứ was.', 'Nam + was');
addWasWere([tok('The','article','det'), tok('cat','noun','subject','cat','sg')], 'was', 'aux-past', [tok('under','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg')], 'Con mèo đã ở dưới gầm bàn.', 1, ['animal'], true, 'Con mèo (số ít) đi với was.', 'cat + was');
addWasWere([tok('My','determiner','det'), tok('mother','noun','subject','mother','sg')], 'was', 'aux-past', [tok('in','preposition','prep'), tok('the','article','det'), tok('kitchen','noun','prep-object','kitchen','sg')], 'Mẹ tôi đã ở trong bếp.', 1, ['family'], true, 'My mother đi với to be quá khứ was.', 'mother + was');
addWasWere([tok('It','pronoun','subject')], 'was', 'aux-past', [tok('cold','adjective','complement'), tok('last','adverb','adverbial'), tok('week','noun','adverbial','week','sg')], 'Tuần trước trời đã lạnh.', 1, ['weather'], true, 'Chủ ngữ It đi với was.', 'It + was');
addWasWere([tok('The','article','det'), tok('baby','noun','subject','baby','sg')], 'was', 'aux-past', [tok('asleep','adjective','complement')], 'Em bé đã ngủ say.', 1, ['family'], true, 'The baby đi với was.', 'baby + was');
addWasWere([tok('I','pronoun','subject')], 'was', 'aux-past', [tok('ten','numeral','complement'), tok('years','noun','complement','year','pl'), tok('old','adjective','complement'), tok('last','adverb','adverbial'), tok('year','noun','adverbial','year','sg')], 'Năm ngoái tôi mười tuổi.', 2, ['age'], true, 'Chủ ngữ I đi với to be quá khứ was.', 'I + was');

addWasWere([tok('We','pronoun','subject')], 'were', 'aux-past', [tok('at','preposition','prep'), tok('the','article','det'), tok('zoo','noun','prep-object','zoo','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua chúng tôi đã ở sở thú.', 1, ['place'], true, 'Chủ ngữ We đi với were.', 'We + were');
addWasWere([tok('They','pronoun','subject')], 'were', 'aux-past', [tok('in','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg')], 'Họ đã ở trong công viên.', 1, ['place'], true, 'Chủ ngữ They đi với were.', 'They + were');
addWasWere([tok('You','pronoun','subject')], 'were', 'aux-past', [tok('late','adjective','complement'), tok('yesterday','adverb','adverbial')], 'Hôm qua bạn đã bị muộn.', 1, ['daily'], true, 'Chủ ngữ You đi với were.', 'You + were');
addWasWere([tok('The','article','det'), tok('children','noun','subject','child','pl')], 'were', 'aux-past', [tok('excited','adjective','complement')], 'Lũ trẻ đã rất hào hứng.', 1, ['emotion'], true, 'The children (số nhiều) đi với were.', 'children + were');
addWasWere([tok('The','article','det'), tok('books','noun','subject','book','pl')], 'were', 'aux-past', [tok('on','preposition','prep'), tok('the','article','det'), tok('shelf','noun','prep-object','shelf','sg')], 'Những cuốn sách đã ở trên giá.', 1, ['study'], true, 'Danh từ số nhiều The books đi với were.', 'books + were');
addWasWere([tok('My','determiner','det'), tok('friends','noun','subject','friend','pl')], 'were', 'aux-past', [tok('happy','adjective','complement')], 'Các bạn tôi đã rất vui vẻ.', 1, ['family'], true, 'My friends (số nhiều) đi với were.', 'friends + were');
addWasWere([tok('We','pronoun','subject')], 'were', 'aux-past', [tok('at','preposition','prep'), tok('the','article','det'), tok('cinema','noun','prep-object','cinema','sg'), tok('last','adverb','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg')], 'Chủ nhật trước chúng tôi đã ở rạp chiếu phim.', 2, ['place'], true, 'Chủ ngữ We đi với were.', 'We + were');
addWasWere([tok('The','article','det'), tok('dogs','noun','subject','dog','pl')], 'were', 'aux-past', [tok('in','preposition','prep'), tok('the','article','det'), tok('garden','noun','prep-object','garden','sg')], 'Những chú chó đã ở trong vườn.', 1, ['animal'], true, 'The dogs (số nhiều) đi với were.', 'dogs + were');
addWasWere([tok('They','pronoun','subject')], 'were', 'aux-past', [tok('busy','adjective','complement'), tok('yesterday','adverb','adverbial')], 'Hôm qua họ đã rất bận.', 1, ['daily'], true, 'Chủ ngữ They đi với were.', 'They + were');
addWasWere([tok('Tom','noun','subject','Tom','sg'), tok('and','conjunction','conj'), tok('Lan','noun','subject','Lan','sg')], 'were', 'aux-past', [tok('at','preposition','prep'), tok('the','article','det'), tok('party','noun','prep-object','party','sg')], 'Tom và Lan đã ở bữa tiệc.', 2, ['party'], true, 'Chủ ngữ hai người (Tom and Lan) đi với were.', 'Tom and Lan + were');

addWasWere([tok('He','pronoun','subject')], "wasn't", 'aux-past-neg', [tok('at','preposition','prep'), tok('school','noun','prep-object','school','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua cậu ấy đã không ở trường.', 1, ['place'], true, 'Dạng phủ định quá khứ của he là was not / wasn\'t.', "he wasn't");
addWasWere([tok('She','pronoun','subject')], "wasn't", 'aux-past-neg', [tok('tired','adjective','complement')], 'Cô ấy đã không mệt.', 1, ['feeling'], true, 'Dạng phủ định quá khứ của she là wasn\'t.', "she wasn't");
addWasWere([tok('I','pronoun','subject')], "wasn't", 'aux-past-neg', [tok('angry','adjective','complement')], 'Tôi đã không tức giận.', 1, ['feeling'], true, 'Dạng phủ định của I ở quá khứ là wasn\'t.', "I wasn't");
addWasWere([tok('The','article','det'), tok('dog','noun','subject','dog','sg')], "wasn't", 'aux-past-neg', [tok('hungry','adjective','complement')], 'Chú chó đã không bị đói.', 1, ['animal'], true, 'The dog (số ít) đi với wasn\'t.', "dog wasn't");
addWasWere([tok('The','article','det'), tok('lesson','noun','subject','lesson','sg')], "wasn't", 'aux-past-neg', [tok('difficult','adjective','complement')], 'Bài học đã không khó.', 2, ['school'], true, 'The lesson đi với wasn\'t.', "lesson wasn't");
addWasWere([tok('It','pronoun','subject')], "wasn't", 'aux-past-neg', [tok('rainy','adjective','complement'), tok('two','numeral','adverbial'), tok('days','noun','adverbial','day','pl'), tok('ago','adverb','adverbial')], 'Cách đây hai ngày trời đã không mưa.', 2, ['weather'], true, 'Chủ ngữ It đi với wasn\'t.', "It wasn't");
addWasWere([tok('My','determiner','det'), tok('brother','noun','subject','brother','sg')], "wasn't", 'aux-past-neg', [tok('at','preposition','prep'), tok('home','noun','prep-object','home','uncountable')], 'Anh trai tôi đã không ở nhà.', 1, ['family'], true, 'My brother đi với wasn\'t.', "brother wasn't");
addWasWere([tok('Nam','noun','subject','Nam','sg')], "wasn't", 'aux-past-neg', [tok('late','adjective','complement'), tok('yesterday','adverb','adverbial')], 'Hôm qua Nam đã không bị muộn.', 1, ['daily'], true, 'Nam đi với wasn\'t.', "Nam wasn't");
addWasWere([tok('The','article','det'), tok('food','noun','subject','food','uncountable')], "wasn't", 'aux-past-neg', [tok('delicious','adjective','complement')], 'Món ăn đã không ngon.', 2, ['food'], true, 'The food (danh từ không đếm được) đi với wasn\'t.', "food wasn't");
addWasWere([tok('The','article','det'), tok('room','noun','subject','room','sg')], "wasn't", 'aux-past-neg', [tok('clean','adjective','complement')], 'Căn phòng đã không sạch sẽ.', 2, ['home'], true, 'The room đi với wasn\'t.', "room wasn't");

addWasWere([tok('We','pronoun','subject')], "weren't", 'aux-past-neg', [tok('at','preposition','prep'), tok('the','article','det'), tok('beach','noun','prep-object','beach','sg')], 'Chúng tôi đã không ở bãi biển.', 1, ['place'], true, 'We đi với dạng phủ định weren\'t.', "we weren't");
addWasWere([tok('They','pronoun','subject')], "weren't", 'aux-past-neg', [tok('sad','adjective','complement')], 'Họ đã không buồn.', 1, ['feeling'], true, 'They đi với dạng phủ định weren\'t.', "they weren't");
addWasWere([tok('The','article','det'), tok('children','noun','subject','child','pl')], "weren't", 'aux-past-neg', [tok('noisy','adjective','complement')], 'Lũ trẻ đã không ồn ào.', 2, ['daily'], true, 'The children (số nhiều) đi với weren\'t.', "children weren't");
addWasWere([tok('You','pronoun','subject')], "weren't", 'aux-past-neg', [tok('at','preposition','prep'), tok('the','article','det'), tok('meeting','noun','prep-object','meeting','sg')], 'Bạn đã không có mặt ở buổi họp.', 2, ['school'], true, 'You đi với weren\'t.', "you weren't");
addWasWere([tok('The','article','det'), tok('shops','noun','subject','shop','pl')], "weren't", 'aux-past-neg', [tok('open','adjective','complement'), tok('yesterday','adverb','adverbial')], 'Hôm qua các cửa hàng đã không mở cửa.', 2, ['place'], true, 'The shops (số nhiều) đi với weren\'t.', "shops weren't");
addWasWere([tok('My','determiner','det'), tok('parents','noun','subject','parent','pl')], "weren't", 'aux-past-neg', [tok('tired','adjective','complement')], 'Bố mẹ tôi đã không mệt mỏi.', 2, ['family'], true, 'My parents (số nhiều) đi với weren\'t.', "parents weren't");
addWasWere([tok('The','article','det'), tok('students','noun','subject','student','pl')], "weren't", 'aux-past-neg', [tok('in','preposition','prep'), tok('class','noun','prep-object','class','sg')], 'Các học sinh đã không ở trong lớp.', 2, ['school'], true, 'The students đi với weren\'t.', "students weren't");
addWasWere([tok('These','determiner','det'), tok('apples','noun','subject','apple','pl')], "weren't", 'aux-past-neg', [tok('sweet','adjective','complement')], 'Những quả táo này đã không ngọt.', 2, ['food'], true, 'These apples (số nhiều) đi với weren\'t.', "apples weren't");
addWasWere([tok('We','pronoun','subject')], "weren't", 'aux-past-neg', [tok('ready','adjective','complement'), tok('then','adverb','adverbial')], 'Khi đó chúng tôi đã chưa sẵn sàng.', 2, ['daily'], true, 'We đi với weren\'t.', "we weren't");
addWasWere([tok('They','pronoun','subject')], "weren't", 'aux-past-neg', [tok('at','preposition','prep'), tok('the','article','det'), tok('hospital','noun','prep-object','hospital','sg')], 'Họ đã không ở bệnh viện.', 2, ['place'], true, 'They đi với weren\'t.', "they weren't");

// -------------------------------------------------------------------------
// NHÓM 2: REGULAR VERBS (-ED) (50 câu: B3-s-0041 -> B3-s-0090)
// -------------------------------------------------------------------------
addPastAff([tok('I','pronoun','subject')], 'watched', 'watch', [tok('TV','noun','object','tv','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua tôi đã xem tivi.', 1, 'regular-ed', ['tv'], 'Chia watch ở thì quá khứ đơn: watched.', 'watch → watched');
addPastAff([tok('He','pronoun','subject')], 'played', 'play', [tok('football','noun','object','football','uncountable'), tok('yesterday','adverb','adverbial')], 'Hôm qua cậu ấy đã chơi bóng đá.', 1, 'regular-ed', ['sport'], 'Chia play ở thì quá khứ đơn: played.', 'play → played');
addPastAff([tok('She','pronoun','subject')], 'cleaned', 'clean', [tok('her','determiner','det'), tok('bedroom','noun','object','bedroom','sg')], 'Cô ấy đã dọn dẹp phòng ngủ của mình.', 1, 'regular-ed', ['home'], 'Chia clean ở thì quá khứ đơn: cleaned.', 'clean → cleaned');
addPastAff([tok('We','pronoun','subject')], 'visited', 'visit', [tok('our','determiner','det'), tok('grandparents','noun','object','grandparent','pl'), tok('last','adverb','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg')], 'Chủ nhật trước chúng tôi đã thăm ông bà.', 2, 'regular-ed', ['family'], 'Chia visit ở thì quá khứ đơn: visited.', 'visit → visited');
addPastAff([tok('They','pronoun','subject')], 'washed', 'wash', [tok('the','article','det'), tok('dishes','noun','object','dish','pl'), tok('after','preposition','adverbial'), tok('dinner','noun','adverbial','dinner','uncountable')], 'Họ đã rửa bát đĩa sau bữa tối.', 2, 'regular-ed', ['daily'], 'Chia wash ở thì quá khứ đơn: washed.', 'wash → washed');
addPastAff([tok('Mother','noun','subject','mother','sg')], 'cooked', 'cook', [tok('delicious','adjective','modifier'), tok('soup','noun','object','soup','uncountable')], 'Mẹ đã nấu món súp rất ngon.', 1, 'regular-ed', ['food'], 'Chia cook ở thì quá khứ đơn: cooked.', 'cook → cooked');
addPastAff([tok('Nam','noun','subject','Nam','sg')], 'studied', 'study', [tok('English','noun','object','English','uncountable'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua Nam đã học tiếng Anh.', 2, 'regular-ed', ['school'], 'Study tận cùng phụ âm + y đổi thành -ied: studied.', 'study → studied');
addPastAff([tok('She','pronoun','subject')], 'walked', 'walk', [tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua cô ấy đã đi bộ tới trường.', 1, 'regular-ed', ['school'], 'Chia walk ở thì quá khứ đơn: walked.', 'walk → walked');
addPastAff([tok('The','article','det'), tok('teacher','noun','subject','teacher','sg')], 'opened', 'open', [tok('the','article','det'), tok('door','noun','object','door','sg')], 'Thầy giáo đã mở cửa.', 1, 'regular-ed', ['school'], 'Chia open ở thì quá khứ đơn: opened.', 'open → opened');
addPastAff([tok('He','pronoun','subject')], 'closed', 'close', [tok('the','article','det'), tok('window','noun','object','window','sg')], 'Cậu ấy đã đóng cửa sổ.', 1, 'regular-ed', ['home'], 'Close có sẵn e, chỉ cần thêm d: closed.', 'close → closed');

addPastAff([tok('I','pronoun','subject')], 'helped', 'help', [tok('my','determiner','det'), tok('father','noun','object','father','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua tôi đã giúp bố mình.', 1, 'regular-ed', ['family'], 'Chia help ở quá khứ đơn: helped.', 'help → helped');
addPastAff([tok('She','pronoun','subject')], 'painted', 'paint', [tok('a','article','det'), tok('beautiful','adjective','modifier'), tok('picture','noun','object','picture','sg')], 'Cô ấy đã vẽ một bức tranh đẹp.', 2, 'regular-ed', ['art'], 'Chia paint ở quá khứ đơn: painted.', 'paint → painted');
addPastAff([tok('We','pronoun','subject')], 'listened', 'listen', [tok('to','preposition','adverbial'), tok('music','noun','adverbial','music','uncountable'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua chúng tôi đã nghe nhạc.', 2, 'regular-ed', ['music'], 'Chia listen ở quá khứ đơn: listened.', 'listen → listened');
addPastAff([tok('The','article','det'), tok('girls','noun','subject','girl','pl')], 'skipped', 'skip', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('yard','noun','adverbial','yard','sg')], 'Các bé gái đã nhảy dây trong sân.', 2, 'regular-ed', ['sport'], 'Skip nhân đôi p rồi thêm -ed: skipped.', 'skip → skipped');
addPastAff([tok('The','article','det'), tok('bus','noun','subject','bus','sg')], 'stopped', 'stop', [tok('suddenly','adverb','adverbial')], 'Xe buýt đã dừng lại đột ngột.', 2, 'regular-ed', ['transport'], 'Stop nhân đôi p rồi thêm -ed: stopped.', 'stop → stopped');
addPastAff([tok('The','article','det'), tok('audience','noun','subject','audience','sg')], 'clapped', 'clap', [tok('happily','adverb','adverbial')], 'Khán giả đã vỗ tay vui sướng.', 2, 'regular-ed', ['action'], 'Clap nhân đôi p rồi thêm -ed: clapped.', 'clap → clapped');
addPastAff([tok('The','article','det'), tok('rabbit','noun','subject','rabbit','sg')], 'hopped', 'hop', [tok('into','preposition','adverbial'), tok('the','article','det'), tok('garden','noun','adverbial','garden','sg')], 'Chú thỏ đã nhảy lò cò vào trong vườn.', 2, 'regular-ed', ['animal'], 'Hop nhân đôi p rồi thêm -ed: hopped.', 'hop → hopped');
addPastAff([tok('They','pronoun','subject')], 'waited', 'wait', [tok('for','preposition','adverbial'), tok('the','article','det'), tok('train','noun','adverbial','train','sg')], 'Họ đã đợi tàu hỏa.', 2, 'regular-ed', ['transport'], 'Chia wait ở quá khứ: waited.', 'wait → waited');
addPastAff([tok('Students','noun','subject','student','pl')], 'planted', 'plant', [tok('trees','noun','object','tree','pl'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('schoolyard','noun','adverbial','schoolyard','sg')], 'Học sinh đã trồng cây trong sân trường.', 2, 'regular-ed', ['nature'], 'Chia plant ở quá khứ: planted.', 'plant → planted');
addPastAff([tok('Grandfather','noun','subject','grandfather','sg')], 'watered', 'water', [tok('the','article','det'), tok('flowers','noun','object','flower','pl'), tok('yesterday','adverb','adverbial')], 'Hôm qua ông đã tưới hoa.', 2, 'regular-ed', ['nature'], 'Chia water ở quá khứ: watered.', 'water → watered');

addPastAff([tok('The','article','det'), tok('baby','noun','subject','baby','sg')], 'smiled', 'smile', [tok('sweetly','adverb','adverbial')], 'Em bé đã mỉm cười ngọt ngào.', 2, 'regular-ed', ['family'], 'Smile thêm d: smiled.', 'smile → smiled');
addPastAff([tok('They','pronoun','subject')], 'lived', 'live', [tok('in','preposition','adverbial'), tok('Hanoi','noun','adverbial','Hanoi','sg'), tok('two','numeral','adverbial'), tok('years','noun','adverbial','year','pl'), tok('ago','adverb','adverbial')], 'Họ đã sống ở Hà Nội cách đây hai năm.', 2, 'regular-ed', ['place'], 'Live thêm d: lived.', 'live → lived');
addPastAff([tok('Lan','noun','subject','Lan','sg')], 'danced', 'dance', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('party','noun','adverbial','party','sg')], 'Lan đã khiêu vũ tại bữa tiệc.', 2, 'regular-ed', ['party'], 'Dance thêm d: danced.', 'dance → danced');
addPastAff([tok('He','pronoun','subject')], 'carried', 'carry', [tok('a','article','det'), tok('heavy','adjective','modifier'), tok('backpack','noun','object','backpack','sg')], 'Cậu ấy đã mang chiếc ba lô nặng.', 2, 'regular-ed', ['school'], 'Carry đổi y thành -ied: carried.', 'carry → carried');
addPastAff([tok('I','pronoun','subject')], 'brushed', 'brush', [tok('my','determiner','det'), tok('teeth','noun','object','tooth','pl'), tok('before','preposition','adverbial'), tok('bed','noun','adverbial','bed','uncountable')], 'Tôi đã đánh răng trước khi đi ngủ.', 2, 'regular-ed', ['daily'], 'Chia brush ở quá khứ: brushed.', 'brush → brushed');
addPastAff([tok('The','article','det'), tok('match','noun','subject','match','sg')], 'started', 'start', [tok('at','preposition','adverbial'), tok('three','numeral','adverbial'), tok('o\'clock','adverb','adverbial')], 'Trận đấu đã bắt đầu lúc ba giờ.', 2, 'regular-ed', ['sport'], 'Chia start ở quá khứ: started.', 'start → started');
addPastAff([tok('She','pronoun','subject')], 'finished', 'finish', [tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), tok('early','adverb','adverbial')], 'Cô ấy đã hoàn thành bài tập về nhà sớm.', 2, 'regular-ed', ['school'], 'Chia finish ở quá khứ: finished.', 'finish → finished');
addPastAff([tok('The','article','det'), tok('cat','noun','subject','cat','sg')], 'climbed', 'climb', [tok('the','article','det'), tok('tall','adjective','modifier'), tok('tree','noun','object','tree','sg')], 'Con mèo đã trèo lên cái cây cao.', 2, 'regular-ed', ['animal'], 'Chia climb ở quá khứ: climbed.', 'climb → climbed');
addPastAff([tok('Tom','noun','subject','Tom','sg')], 'looked', 'look', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('map','noun','adverbial','map','sg')], 'Tom đã nhìn vào bản đồ.', 1, 'regular-ed', ['study'], 'Chia look ở quá khứ: looked.', 'look → looked');
addPastAff([tok('He','pronoun','subject')], 'kicked', 'kick', [tok('the','article','det'), tok('ball','noun','object','ball','sg'), tok('hard','adverb','adverbial')], 'Cậu ấy đã đá bóng rất mạnh.', 2, 'regular-ed', ['sport'], 'Chia kick ở quá khứ: kicked.', 'kick → kicked');

addPastAff([tok('We','pronoun','subject')], 'played', 'play', [tok('badminton','noun','object','badminton','uncountable'), tok('last','adverb','adverbial'), tok('Saturday','noun','adverbial','Saturday','sg')], 'Thứ Bảy trước chúng tôi đã chơi cầu lông.', 2, 'regular-ed', ['sport'], 'Play thêm ed: played.', 'play → played');
addPastAff([tok('She','pronoun','subject')], 'cleaned', 'clean', [tok('the','article','det'), tok('kitchen','noun','object','kitchen','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua cô ấy đã lau dọn nhà bếp.', 1, 'regular-ed', ['home'], 'Clean thêm ed: cleaned.', 'clean → cleaned');
addPastAff([tok('They','pronoun','subject')], 'watched', 'watch', [tok('a','article','det'), tok('cartoon','noun','object','cartoon','sg'), tok('together','adverb','adverbial')], 'Họ đã cùng nhau xem phim hoạt hình.', 2, 'regular-ed', ['hobby'], 'Watch thêm ed: watched.', 'watch → watched');
addPastAff([tok('I','pronoun','subject')], 'washed', 'wash', [tok('my','determiner','det'), tok('hands','noun','object','hand','pl'), tok('carefully','adverb','adverbial')], 'Tôi đã rửa tay cẩn thận.', 2, 'regular-ed', ['daily'], 'Wash thêm ed: washed.', 'wash → washed');
addPastAff([tok('He','pronoun','subject')], 'cooked', 'cook', [tok('lunch','noun','object','lunch','uncountable'), tok('for','preposition','adverbial'), tok('us','pronoun','adverbial')], 'Cậu ấy đã nấu bữa trưa cho chúng tôi.', 2, 'regular-ed', ['food'], 'Cook thêm ed: cooked.', 'cook → cooked');
addPastAff([tok('Students','noun','subject','student','pl')], 'studied', 'study', [tok('math','noun','object','math','uncountable'), tok('yesterday','adverb','adverbial')], 'Hôm qua học sinh đã học toán.', 2, 'regular-ed', ['school'], 'Study đổi thành studied.', 'study → studied');
addPastAff([tok('We','pronoun','subject')], 'walked', 'walk', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('park','noun','adverbial','park','sg')], 'Chúng tôi đã đi dạo trong công viên.', 1, 'regular-ed', ['place'], 'Walk thêm ed: walked.', 'walk → walked');
addPastAff([tok('My','determiner','det'), tok('sister','noun','subject','sister','sg')], 'painted', 'paint', [tok('a','article','det'), tok('house','noun','object','house','sg')], 'Em gái tôi đã vẽ một ngôi nhà.', 1, 'regular-ed', ['art'], 'Paint thêm ed: painted.', 'paint → painted');
addPastAff([tok('They','pronoun','subject')], 'listened', 'listen', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('teacher','noun','adverbial','teacher','sg')], 'Họ đã lắng nghe cô giáo.', 2, 'regular-ed', ['school'], 'Listen thêm ed: listened.', 'listen → listened');
addPastAff([tok('He','pronoun','subject')], 'helped', 'help', [tok('an','article','det'), tok('old','adjective','modifier'), tok('man','noun','object','man','sg')], 'Cậu ấy đã giúp đỡ một cụ già.', 2, 'regular-ed', ['daily'], 'Help thêm ed: helped.', 'help → helped');

addPastAff([tok('The','article','det'), tok('bus','noun','subject','bus','sg')], 'stopped', 'stop', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('station','noun','adverbial','station','sg')], 'Xe buýt đã dừng lại ở nhà ga.', 2, 'regular-ed', ['transport'], 'Stop nhân đôi p thành stopped.', 'stop → stopped');
addPastAff([tok('Children','noun','subject','child','pl')], 'clapped', 'clap', [tok('their','determiner','det'), tok('hands','noun','object','hand','pl')], 'Trẻ em đã vỗ tay.', 2, 'regular-ed', ['action'], 'Clap nhân đôi p thành clapped.', 'clap → clapped');
addPastAff([tok('The','article','det'), tok('frog','noun','subject','frog','sg')], 'hopped', 'hop', [tok('into','preposition','adverbial'), tok('the','article','det'), tok('pond','noun','adverbial','pond','sg')], 'Con ếch đã nhảy tõm vào ao.', 2, 'regular-ed', ['animal'], 'Hop nhân đôi p thành hopped.', 'hop → hopped');
addPastAff([tok('We','pronoun','subject')], 'waited', 'wait', [tok('for','preposition','adverbial'), tok('the','article','det'), tok('bus','noun','adverbial','bus','sg')], 'Chúng tôi đã chờ xe buýt.', 1, 'regular-ed', ['transport'], 'Wait thêm ed: waited.', 'wait → waited');
addPastAff([tok('They','pronoun','subject')], 'visited', 'visit', [tok('the','article','det'), tok('museum','noun','object','museum','sg')], 'Họ đã tới thăm viện bảo tàng.', 2, 'regular-ed', ['place'], 'Visit thêm ed: visited.', 'visit → visited');
addPastAff([tok('She','pronoun','subject')], 'smiled', 'smile', [tok('at','preposition','adverbial'), tok('her','determiner','det'), tok('friends','noun','adverbial','friend','pl')], 'Cô ấy đã mỉm cười với bạn bè.', 2, 'regular-ed', ['feeling'], 'Smile thêm d thành smiled.', 'smile → smiled');
addPastAff([tok('They','pronoun','subject')], 'danced', 'dance', [tok('gracefully','adverb','adverbial'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua họ đã khiêu vũ uyển chuyển.', 2, 'regular-ed', ['art'], 'Dance thêm d thành danced.', 'dance → danced');
addPastAff([tok('He','pronoun','subject')], 'started', 'start', [tok('his','determiner','det'), tok('new','adjective','modifier'), tok('job','noun','object','job','sg'), tok('last','adverb','adverbial'), tok('week','noun','adverbial','week','sg')], 'Tuần trước cậu ấy đã bắt đầu công việc mới.', 2, 'regular-ed', ['job'], 'Start thêm ed: started.', 'start → started');
addPastAff([tok('She','pronoun','subject')], 'finished', 'finish', [tok('her','determiner','det'), tok('dinner','noun','object','dinner','uncountable')], 'Cô ấy đã ăn xong bữa tối.', 1, 'regular-ed', ['food'], 'Finish thêm ed: finished.', 'finish → finished');
addPastAff([tok('The','article','det'), tok('monkey','noun','subject','monkey','sg')], 'climbed', 'climb', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('top','noun','adverbial','top','sg')], 'Con khỉ đã trèo lên đến đỉnh.', 2, 'regular-ed', ['animal'], 'Climb thêm ed: climbed.', 'climb → climbed');

// -------------------------------------------------------------------------
// NHÓM 3: IRREGULAR VERBS (50 câu: B3-s-0091 -> B3-s-0140)
// -------------------------------------------------------------------------
addPastAff([tok('I','pronoun','subject')], 'went', 'go', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('zoo','noun','adverbial','zoo','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua tôi đã đi sở thú.', 1, 'irregular-past', ['place'], 'Dạng quá khứ bất quy tắc của go là went.', 'go → went');
addPastAff([tok('We','pronoun','subject')], 'ate', 'eat', [tok('noodles','noun','object','noodles','pl'), tok('for','preposition','adverbial'), tok('breakfast','noun','adverbial','breakfast','uncountable')], 'Chúng tôi đã ăn mì cho bữa sáng.', 1, 'irregular-past', ['food'], 'Dạng quá khứ của eat là ate.', 'eat → ate');
addPastAff([tok('He','pronoun','subject')], 'drank', 'drink', [tok('warm','adjective','modifier'), tok('milk','noun','object','milk','uncountable')], 'Cậu ấy đã uống sữa ấm.', 1, 'irregular-past', ['drink'], 'Dạng quá khứ của drink là drank.', 'drink → drank');
addPastAff([tok('She','pronoun','subject')], 'saw', 'see', [tok('a','article','det'), tok('lion','noun','object','lion','sg'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('zoo','noun','adverbial','zoo','sg')], 'Cô ấy đã nhìn thấy một con sư tử ở sở thú.', 1, 'irregular-past', ['animal'], 'Dạng quá khứ của see là saw.', 'see → saw');
addPastAff([tok('They','pronoun','subject')], 'had', 'have', [tok('a','article','det'), tok('picnic','noun','object','picnic','sg'), tok('last','adverb','adverbial'), tok('weekend','noun','adverbial','weekend','sg')], 'Cuối tuần trước họ đã có một buổi dã ngoại.', 2, 'irregular-past', ['activity'], 'Dạng quá khứ của have là had.', 'have → had');
addPastAff([tok('Lan','noun','subject','Lan','sg')], 'did', 'do', [tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), tok('yesterday','adverb','adverbial')], 'Hôm qua Lan đã làm bài tập về nhà.', 1, 'irregular-past', ['school'], 'Dạng quá khứ của do là did.', 'do → did');
addPastAff([tok('Mother','noun','subject','mother','sg')], 'made', 'make', [tok('a','article','det'), tok('birthday','noun','modifier','birthday','sg'), tok('cake','noun','object','cake','sg')], 'Mẹ đã làm một chiếc bánh sinh nhật.', 1, 'irregular-past', ['food'], 'Dạng quá khứ của make là made.', 'make → made');
addPastAff([tok('He','pronoun','subject')], 'took', 'take', [tok('many','determiner','det'), tok('photos','noun','object','photo','pl')], 'Cậu ấy đã chụp nhiều bức ảnh.', 1, 'irregular-past', ['hobby'], 'Dạng quá khứ của take là took.', 'take → took');
addPastAff([tok('I','pronoun','subject')], 'bought', 'buy', [tok('a','article','det'), tok('new','adjective','modifier'), tok('pen','noun','object','pen','sg')], 'Tôi đã mua một chiếc bút mới.', 1, 'irregular-past', ['study'], 'Dạng quá khứ của buy là bought.', 'buy → bought');
addPastAff([tok('She','pronoun','subject')], 'wrote', 'write', [tok('a','article','det'), tok('letter','noun','object','letter','sg'), tok('to','preposition','adverbial'), tok('her','determiner','det'), tok('friend','noun','adverbial','friend','sg')], 'Cô ấy đã viết một bức thư gửi cho bạn.', 2, 'irregular-past', ['study'], 'Dạng quá khứ của write là wrote.', 'write → wrote');

addPastAff([tok('Tom','noun','subject','Tom','sg')], 'read', 'read', [tok('an','article','det'), tok('interesting','adjective','modifier'), tok('book','noun','object','book','sg')], 'Tom đã đọc một cuốn sách thú vị.', 2, 'irregular-past', ['study'], 'Quá khứ của read viết giống nhưng đọc là /red/.', 'read → read');
addPastAff([tok('The','article','det'), tok('boy','noun','subject','boy','sg')], 'ran', 'run', [tok('fast','adverb','adverbial'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('race','noun','adverbial','race','sg')], 'Cậu bé đã chạy nhanh trong cuộc đua.', 2, 'irregular-past', ['sport'], 'Dạng quá khứ của run là ran.', 'run → ran');
addPastAff([tok('We','pronoun','subject')], 'swam', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('pool','noun','adverbial','pool','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua chúng tôi đã bơi ở hồ bơi.', 2, 'irregular-past', ['sport'], 'Dạng quá khứ của swim là swam.', 'swim → swam');
addPastAff([tok('The','article','det'), tok('birds','noun','subject','bird','pl')], 'flew', 'fly', [tok('high','adverb','adverbial'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('sky','noun','adverbial','sky','sg')], 'Những chú chim đã bay cao trên bầu trời.', 2, 'irregular-past', ['nature'], 'Dạng quá khứ của fly là flew.', 'fly → flew');
addPastAff([tok('The','article','det'), tok('children','noun','subject','child','pl')], 'sang', 'sing', [tok('a','article','det'), tok('happy','adjective','modifier'), tok('song','noun','object','song','sg')], 'Lũ trẻ đã hát một bài ca vui vẻ.', 2, 'irregular-past', ['music'], 'Dạng quá khứ của sing là sang.', 'sing → sang');
addPastAff([tok('The','article','det'), tok('dog','noun','subject','dog','sg')], 'slept', 'sleep', [tok('under','preposition','adverbial'), tok('the','article','det'), tok('tree','noun','adverbial','tree','sg')], 'Chú chó đã ngủ dưới gốc cây.', 1, 'irregular-past', ['animal'], 'Dạng quá khứ của sleep là slept.', 'sleep → slept');
addPastAff([tok('They','pronoun','subject')], 'sat', 'sit', [tok('on','preposition','adverbial'), tok('the','article','det'), tok('grass','noun','adverbial','grass','uncountable')], 'Họ đã ngồi trên bãi cỏ.', 1, 'irregular-past', ['place'], 'Dạng quá khứ của sit là sat.', 'sit → sat');
addPastAff([tok('He','pronoun','subject')], 'stood', 'stand', [tok('near','preposition','adverbial'), tok('the','article','det'), tok('gate','noun','adverbial','gate','sg')], 'Cậu ấy đã đứng gần cổng.', 2, 'irregular-past', ['action'], 'Dạng quá khứ của stand là stood.', 'stand → stood');
addPastAff([tok('She','pronoun','subject')], 'gave', 'give', [tok('me','pronoun','object'), tok('a','article','det'), tok('present','noun','object','present','sg')], 'Cô ấy đã tặng tôi một món quà.', 2, 'irregular-past', ['gift'], 'Dạng quá khứ của give là gave.', 'give → gave');
addPastAff([tok('I','pronoun','subject')], 'got', 'get', [tok('up','particle','particle'), tok('at','preposition','adverbial'), tok('six','numeral','adverbial'), tok('yesterday','adverb','adverbial')], 'Hôm qua tôi đã thức dậy lúc sáu giờ.', 2, 'irregular-past', ['daily'], 'Dạng quá khứ của get là got.', 'get → got');

addPastAff([tok('My','determiner','det'), tok('uncle','noun','subject','uncle','sg')], 'came', 'come', [tok('to','preposition','adverbial'), tok('visit','verb','adverbial','visit','base'), tok('us','pronoun','adverbial')], 'Chú tôi đã đến thăm chúng tôi.', 2, 'irregular-past', ['family'], 'Dạng quá khứ của come là came.', 'come → came');
addPastAff([tok('Lan','noun','subject','Lan','sg')], 'drew', 'draw', [tok('a','article','det'), tok('beautiful','adjective','modifier'), tok('flower','noun','object','flower','sg')], 'Lan đã vẽ một bông hoa đẹp.', 1, 'irregular-past', ['art'], 'Dạng quá khứ của draw là drew.', 'draw → drew');
addPastAff([tok('They','pronoun','subject')], 'left', 'leave', [tok('school','noun','object','school','sg'), tok('at','preposition','adverbial'), tok('four','numeral','adverbial')], 'Họ đã rời trường lúc bốn giờ.', 2, 'irregular-past', ['school'], 'Dạng quá khứ của leave là left.', 'leave → left');
addPastAff([tok('I','pronoun','subject')], 'met', 'meet', [tok('my','determiner','det'), tok('teacher','noun','object','teacher','sg'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('market','noun','adverbial','market','sg')], 'Tôi đã gặp cô giáo ở chợ.', 2, 'irregular-past', ['school'], 'Dạng quá khứ của meet là met.', 'meet → met');
addPastAff([tok('Nam','noun','subject','Nam','sg')], 'rode', 'ride', [tok('his','determiner','det'), tok('bicycle','noun','object','bicycle','sg'), tok('to','preposition','adverbial'), tok('the','article','det'), tok('park','noun','adverbial','park','sg')], 'Nam đã đạp xe đạp đến công viên.', 2, 'irregular-past', ['transport'], 'Dạng quá khứ của ride là rode.', 'ride → rode');
addPastAff([tok('Father','noun','subject','father','sg')], 'drove', 'drive', [tok('a','article','det'), tok('car','noun','object','car','sg'), tok('to','preposition','adverbial'), tok('work','noun','adverbial','work','uncountable')], 'Bố đã lái xe ô tô đi làm.', 2, 'irregular-past', ['transport'], 'Dạng quá khứ của drive là drove.', 'drive → drove');
addPastAff([tok('Our','determiner','det'), tok('school','noun','subject','school','sg')], 'won', 'win', [tok('the','article','det'), tok('first','adjective','modifier'), tok('prize','noun','object','prize','sg')], 'Trường chúng tôi đã giành giải nhất.', 3, 'irregular-past', ['school'], 'Dạng quá khứ của win là won.', 'win → won');
addPastAff([tok('She','pronoun','subject')], 'found', 'find', [tok('her','determiner','det'), tok('lost','adjective','modifier'), tok('key','noun','object','key','sg')], 'Cô ấy đã tìm thấy chìa khóa bị mất của mình.', 2, 'irregular-past', ['daily'], 'Dạng quá khứ của find là found.', 'find → found');
addPastAff([tok('The','article','det'), tok('cat','noun','subject','cat','sg')], 'caught', 'catch', [tok('a','article','det'), tok('mouse','noun','object','mouse','sg')], 'Con mèo đã bắt được một con chuột.', 2, 'irregular-past', ['animal'], 'Dạng quá khứ của catch là caught.', 'catch → caught');
addPastAff([tok('Mr.','noun','modifier','Mr.','sg'), tok('Brown','noun','subject','Brown','sg')], 'taught', 'teach', [tok('math','noun','object','math','uncountable'), tok('last','adverb','adverbial'), tok('year','noun','adverbial','year','sg')], 'Thầy Brown đã dạy toán năm ngoái.', 2, 'irregular-past', ['school'], 'Dạng quá khứ của teach là taught.', 'teach → taught');

addPastAff([tok('He','pronoun','subject')], 'brought', 'bring', [tok('an','article','det'), tok('apple','noun','object','apple','sg'), tok('for','preposition','adverbial'), tok('lunch','noun','adverbial','lunch','uncountable')], 'Cậu ấy đã mang một quả táo cho bữa trưa.', 2, 'irregular-past', ['food'], 'Dạng quá khứ của bring là brought.', 'bring → brought');
addPastAff([tok('I','pronoun','subject')], 'thought', 'think', [tok('about','preposition','adverbial'), tok('the','article','det'), tok('story','noun','adverbial','story','sg')], 'Tôi đã nghĩ về câu chuyện đó.', 2, 'irregular-past', ['study'], 'Dạng quá khứ của think là thought.', 'think → thought');
addPastAff([tok('She','pronoun','subject')], 'knew', 'know', [tok('the','article','det'), tok('answer','noun','object','answer','sg')], 'Cô ấy đã biết câu trả lời.', 2, 'irregular-past', ['school'], 'Dạng quá khứ của know là knew.', 'know → knew');
addPastAff([tok('Grandma','noun','subject','grandma','sg')], 'told', 'tell', [tok('a','article','det'), tok('funny','adjective','modifier'), tok('joke','noun','object','joke','sg')], 'Bà đã kể một câu chuyện cười vui vẻ.', 2, 'irregular-past', ['family'], 'Dạng quá khứ của tell là told.', 'tell → told');
addPastAff([tok('He','pronoun','subject')], 'said', 'say', [tok('goodbye','noun','object','goodbye','uncountable'), tok('to','preposition','adverbial'), tok('us','pronoun','adverbial')], 'Cậu ấy đã nói lời tạm biệt với chúng tôi.', 2, 'irregular-past', ['daily'], 'Dạng quá khứ của say là said.', 'say → said');
addPastAff([tok('She','pronoun','subject')], 'wore', 'wear', [tok('a','article','det'), tok('pink','adjective','modifier'), tok('hat','noun','object','hat','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua cô ấy đã đội một chiếc mũ màu hồng.', 2, 'irregular-past', ['clothes'], 'Dạng quá khứ của wear là wore.', 'wear → wore');
addPastAff([tok('He','pronoun','subject')], 'cut', 'cut', [tok('the','article','det'), tok('cake','noun','object','cake','sg'), tok('into','preposition','adverbial'), tok('pieces','noun','adverbial','piece','pl')], 'Cậu ấy đã cắt chiếc bánh thành nhiều miếng.', 2, 'irregular-past', ['food'], 'Cut giữ nguyên ở quá khứ: cut.', 'cut → cut');
addPastAff([tok('She','pronoun','subject')], 'put', 'put', [tok('her','determiner','det'), tok('bag','noun','object','bag','sg'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('chair','noun','adverbial','chair','sg')], 'Cô ấy đã đặt chiếc túi lên ghế.', 2, 'irregular-past', ['home'], 'Put giữ nguyên ở quá khứ: put.', 'put → put');
addPastAff([tok('We','pronoun','subject')], 'heard', 'hear', [tok('a','article','det'), tok('bird','noun','object','bird','sg'), tok('singing','verb','modifier','sing','ing')], 'Chúng tôi đã nghe thấy một chú chim đang hót.', 3, 'irregular-past', ['nature'], 'Dạng quá khứ của hear là heard.', 'hear → heard');
addPastAff([tok('The','article','det'), tok('film','noun','subject','film','sg')], 'began', 'begin', [tok('at','preposition','adverbial'), tok('seven','numeral','adverbial'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua bộ phim đã bắt đầu lúc bảy giờ.', 2, 'irregular-past', ['hobby'], 'Dạng quá khứ của begin là began.', 'begin → began');

addPastAff([tok('They','pronoun','subject')], 'went', 'go', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('beach','noun','adverbial','beach','sg'), tok('last','adverb','adverbial'), tok('summer','noun','adverbial','summer','sg')], 'Mùa hè năm ngoái họ đã đi biển.', 2, 'irregular-past', ['place'], 'Dạng quá khứ của go là went.', 'go → went');
addPastAff([tok('He','pronoun','subject')], 'ate', 'eat', [tok('pizza','noun','object','pizza','uncountable'), tok('with','preposition','adverbial'), tok('his','determiner','det'), tok('friends','noun','adverbial','friend','pl')], 'Cậu ấy đã ăn bánh pizza cùng các bạn.', 2, 'irregular-past', ['food'], 'Dạng quá khứ của eat là ate.', 'eat → ate');
addPastAff([tok('She','pronoun','subject')], 'drank', 'drink', [tok('a','article','det'), tok('glass','noun','object','glass','sg'), tok('of','preposition','object'), tok('apple','noun','modifier','apple','sg'), tok('juice','noun','prep-object','juice','uncountable')], 'Cô ấy đã uống một ly nước táo.', 3, 'irregular-past', ['drink'], 'Dạng quá khứ của drink là drank.', 'drink → drank');
addPastAff([tok('We','pronoun','subject')], 'saw', 'see', [tok('monkeys','noun','object','monkey','pl'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('zoo','noun','adverbial','zoo','sg')], 'Chúng tôi đã thấy những con khỉ ở sở thú.', 1, 'irregular-past', ['animal'], 'Dạng quá khứ của see là saw.', 'see → saw');
addPastAff([tok('They','pronoun','subject')], 'bought', 'buy', [tok('fresh','adjective','modifier'), tok('fruit','noun','object','fruit','uncountable'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('market','noun','adverbial','market','sg')], 'Họ đã mua hoa quả tươi ở chợ.', 2, 'irregular-past', ['food'], 'Dạng quá khứ của buy là bought.', 'buy → bought');
addPastAff([tok('I','pronoun','subject')], 'wrote', 'write', [tok('my','determiner','det'), tok('name','noun','object','name','sg'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('paper','noun','adverbial','paper','uncountable')], 'Tôi đã viết tên mình lên tờ giấy.', 2, 'irregular-past', ['study'], 'Dạng quá khứ của write là wrote.', 'write → wrote');
addPastAff([tok('She','pronoun','subject')], 'ran', 'run', [tok('to','preposition','adverbial'), tok('catch','verb','adverbial','catch','base'), tok('the','article','det'), tok('bus','noun','object','bus','sg')], 'Cô ấy đã chạy để bắt xe buýt.', 2, 'irregular-past', ['transport'], 'Dạng quá khứ của run là ran.', 'run → ran');
addPastAff([tok('The','article','det'), tok('cat','noun','subject','cat','sg')], 'slept', 'sleep', [tok('on','preposition','adverbial'), tok('the','article','det'), tok('sofa','noun','adverbial','sofa','sg'), tok('all','determiner','det'), tok('day','noun','adverbial','day','sg')], 'Con mèo đã ngủ trên ghế sô-pha cả ngày.', 2, 'irregular-past', ['animal'], 'Dạng quá khứ của sleep là slept.', 'sleep → slept');
addPastAff([tok('They','pronoun','subject')], 'gave', 'give', [tok('food','noun','object','food','uncountable'), tok('to','preposition','adverbial'), tok('the','article','det'), tok('birds','noun','adverbial','bird','pl')], 'Họ đã cho chim ăn.', 2, 'irregular-past', ['animal'], 'Dạng quá khứ của give là gave.', 'give → gave');
addPastAff([tok('I','pronoun','subject')], 'found', 'find', [tok('a','article','det'), tok('shiny','adjective','modifier'), tok('coin','noun','object','coin','sg'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('street','noun','adverbial','street','sg')], 'Tôi đã tìm thấy một đồng xu sáng loáng trên đường.', 3, 'irregular-past', ['daily'], 'Dạng quá khứ của find là found.', 'find → found');

// -------------------------------------------------------------------------
// NHÓM 4: DID-SUPPORT NEGATIVE (30 câu: B3-s-0141 -> B3-s-0170)
// S + didn't + V(base) + (O) + (A)
// -------------------------------------------------------------------------
addPastNeg([tok('She','pronoun','subject')], 'go', 'go', [tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua cô ấy đã không đi học.', 1, ['school'], true, 'Dùng didn\'t để phủ định thì quá khứ đơn.', 'didn\'t + V-base');
addPastNeg([tok('I','pronoun','subject')], 'watch', 'watch', [tok('television','noun','object','television','uncountable'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua tôi đã không xem truyền hình.', 1, ['hobby'], false, 'Sau didn\'t, động từ giữ nguyên thể base: watch.', 'watch');
addPastNeg([tok('He','pronoun','subject')], 'play', 'play', [tok('football','noun','object','football','uncountable'), tok('yesterday','adverb','adverbial')], 'Hôm qua cậu ấy đã không chơi bóng đá.', 1, ['sport'], true, 'Dùng didn\'t để phủ định quá khứ.', 'didn\'t');
addPastNeg([tok('They','pronoun','subject')], 'eat', 'eat', [tok('breakfast','noun','object','breakfast','uncountable'), tok('this','determiner','det'), tok('morning','noun','adverbial','morning','sg')], 'Sáng nay họ đã không ăn sáng.', 1, ['food'], false, 'Sau didn\'t, động từ về dạng base: eat.', 'eat');
addPastNeg([tok('We','pronoun','subject')], 'visit', 'visit', [tok('the','article','det'), tok('museum','noun','object','museum','sg'), tok('last','adverb','adverbial'), tok('week','noun','adverbial','week','sg')], 'Tuần trước chúng tôi đã không thăm bảo tàng.', 2, ['place'], true, 'Trợ động từ phủ định quá khứ: didn\'t.', 'didn\'t');
addPastNeg([tok('Nam','noun','subject','Nam','sg')], 'do', 'do', [tok('his','determiner','det'), tok('homework','noun','object','homework','uncountable')], 'Nam đã không làm bài tập về nhà.', 1, ['school'], false, 'Sau didn\'t dùng động từ nguyên thể do.', 'do');
addPastNeg([tok('She','pronoun','subject')], 'buy', 'buy', [tok('that','determiner','det'), tok('expensive','adjective','modifier'), tok('dress','noun','object','dress','sg')], 'Cô ấy đã không mua chiếc váy đắt tiền đó.', 2, ['clothes'], false, 'Sau didn\'t dùng dạng base: buy (không dùng bought).', 'buy');
addPastNeg([tok('They','pronoun','subject')], 'see', 'see', [tok('any','determiner','det'), tok('tigers','noun','object','tiger','pl'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('zoo','noun','adverbial','zoo','sg')], 'Họ đã không nhìn thấy con hổ nào ở sở thú.', 2, ['animal'], false, 'Sau didn\'t dùng dạng base: see (không dùng saw).', 'see');
addPastNeg([tok('I','pronoun','subject')], 'drink', 'drink', [tok('coffee','noun','object','coffee','uncountable'), tok('yesterday','adverb','adverbial')], 'Hôm qua tôi đã không uống cà phê.', 1, ['drink'], true, 'Trợ động từ phủ định quá khứ: didn\'t.', 'didn\'t');
addPastNeg([tok('He','pronoun','subject')], 'clean', 'clean', [tok('his','determiner','det'), tok('bicycle','noun','object','bicycle','sg')], 'Cậu ấy đã không lau xe đạp.', 1, ['transport'], false, 'Sau didn\'t động từ để nguyên: clean.', 'clean');

addPastNeg([tok('We','pronoun','subject')], 'have', 'have', [tok('a','article','det'), tok('test','noun','object','test','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua chúng tôi đã không có bài kiểm tra.', 2, ['school'], false, 'Sau didn\'t dùng have (không dùng had).', 'have');
addPastNeg([tok('She','pronoun','subject')], 'write', 'write', [tok('the','article','det'), tok('letter','noun','object','letter','sg')], 'Cô ấy đã không viết bức thư.', 2, ['study'], false, 'Sau didn\'t dùng write (không dùng wrote).', 'write');
addPastNeg([tok('Tom','noun','subject','Tom','sg')], 'come', 'come', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('party','noun','adverbial','party','sg'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua Tom đã không tới bữa tiệc.', 2, ['party'], false, 'Sau didn\'t dùng come (không dùng came).', 'come');
addPastNeg([tok('They','pronoun','subject')], 'swim', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('sea','noun','adverbial','sea','sg')], 'Họ đã không bơi ở biển.', 2, ['sport'], false, 'Sau didn\'t dùng swim (không dùng swam).', 'swim');
addPastNeg([tok('The','article','det'), tok('train','noun','subject','train','sg')], 'stop', 'stop', [tok('at','preposition','adverbial'), tok('this','determiner','det'), tok('station','noun','adverbial','station','sg')], 'Đoàn tàu đã không dừng lại ở ga này.', 2, ['transport'], true, 'Dùng didn\'t để phủ định quá khứ.', 'didn\'t');
addPastNeg([tok('I','pronoun','subject')], 'sleep', 'sleep', [tok('well','adverb','adverbial'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua tôi đã không ngủ ngon.', 2, ['daily'], false, 'Sau didn\'t dùng sleep (không dùng slept).', 'sleep');
addPastNeg([tok('She','pronoun','subject')], 'find', 'find', [tok('her','determiner','det'), tok('pencil','noun','object','pencil','sg')], 'Cô ấy đã không tìm thấy chiếc bút chì của mình.', 2, ['study'], false, 'Sau didn\'t dùng find (không dùng found).', 'find');
addPastNeg([tok('He','pronoun','subject')], 'wear', 'wear', [tok('a','article','det'), tok('jacket','noun','object','jacket','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua cậu ấy đã không mặc áo khoác.', 2, ['clothes'], false, 'Sau didn\'t dùng wear (không dùng wore).', 'wear');
addPastNeg([tok('We','pronoun','subject')], 'take', 'take', [tok('any','determiner','det'), tok('photos','noun','object','photo','pl')], 'Chúng tôi đã không chụp bức ảnh nào.', 2, ['hobby'], false, 'Sau didn\'t dùng take (không dùng took).', 'take');
addPastNeg([tok('The','article','det'), tok('dog','noun','subject','dog','sg')], 'bark', 'bark', [tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua chú chó đã không sủa.', 2, ['animal'], true, 'Trợ động từ phủ định quá khứ: didn\'t.', 'didn\'t');

addPastNeg([tok('They','pronoun','subject')], 'win', 'win', [tok('the','article','det'), tok('game','noun','object','game','sg')], 'Họ đã không thắng trận đấu.', 2, ['sport'], false, 'Sau didn\'t dùng win (không dùng won).', 'win');
addPastNeg([tok('I','pronoun','subject')], 'read', 'read', [tok('the','article','det'), tok('newspaper','noun','object','newspaper','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua tôi đã không đọc báo.', 2, ['daily'], true, 'Dùng didn\'t để phủ định quá khứ.', 'didn\'t');
addPastNeg([tok('Lan','noun','subject','Lan','sg')], 'sing', 'sing', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('concert','noun','adverbial','concert','sg')], 'Lan đã không hát tại buổi hòa nhạc.', 2, ['music'], false, 'Sau didn\'t dùng sing (không dùng sang).', 'sing');
addPastNeg([tok('Mother','noun','subject','mother','sg')], 'bake', 'bake', [tok('a','article','det'), tok('cake','noun','object','cake','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua mẹ đã không nướng bánh.', 2, ['food'], false, 'Sau didn\'t dùng bake.', 'bake');
addPastNeg([tok('He','pronoun','subject')], 'tell', 'tell', [tok('me','pronoun','object'), tok('the','article','det'), tok('truth','noun','object','truth','uncountable')], 'Cậu ấy đã không nói cho tôi sự thật.', 3, ['daily'], false, 'Sau didn\'t dùng tell (không dùng told).', 'tell');
addPastNeg([tok('We','pronoun','subject')], 'walk', 'walk', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('market','noun','adverbial','market','sg')], 'Chúng tôi đã không đi bộ ra chợ.', 2, ['daily'], true, 'Trợ động từ quá khứ phủ định: didn\'t.', 'didn\'t');
addPastNeg([tok('She','pronoun','subject')], 'listen', 'listen', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('radio','noun','adverbial','radio','sg')], 'Cô ấy đã không nghe đài.', 2, ['hobby'], false, 'Sau didn\'t dùng listen.', 'listen');
addPastNeg([tok('They','pronoun','subject')], 'plant', 'plant', [tok('flowers','noun','object','flower','pl'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('garden','noun','adverbial','garden','sg')], 'Họ đã không trồng hoa trong vườn.', 2, ['nature'], true, 'Dùng didn\'t để phủ định.', 'didn\'t');
addPastNeg([tok('Tom','noun','subject','Tom','sg')], 'ride', 'ride', [tok('his','determiner','det'), tok('bike','noun','object','bike','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua Tom đã không đi xe đạp.', 2, ['transport'], false, 'Sau didn\'t dùng ride (không dùng rode).', 'ride');
addPastNeg([tok('I','pronoun','subject')], 'hear', 'hear', [tok('the','article','det'), tok('bell','noun','object','bell','sg')], 'Tôi đã không nghe thấy tiếng chuông.', 2, ['daily'], false, 'Sau didn\'t dùng hear (không dùng heard).', 'hear');

// -------------------------------------------------------------------------
// NHÓM 5: DID-QUESTIONS (30 câu: B3-s-0171 -> B3-s-0200)
// Did + S + V(base) + (O) + (A)?
// -------------------------------------------------------------------------
addPastQ([tok('you','pronoun','subject')], 'go', 'go', [tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua bạn có đi học không?', 1, ['school'], true, 'Dùng trợ động từ Did để hỏi ở thì quá khứ đơn.', 'Did');
addPastQ([tok('he','pronoun','subject')], 'watch', 'watch', [tok('TV','noun','object','tv','sg'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua cậu ấy có xem tivi không?', 1, ['hobby'], false, 'Sau Did, động từ về dạng base: watch.', 'watch');
addPastQ([tok('she','pronoun','subject')], 'play', 'play', [tok('badminton','noun','object','badminton','uncountable'), tok('yesterday','adverb','adverbial')], 'Hôm qua cô ấy có chơi cầu lông không?', 1, ['sport'], true, 'Trợ động từ câu hỏi quá khứ: Did.', 'Did');
addPastQ([tok('they','pronoun','subject')], 'eat', 'eat', [tok('dinner','noun','object','dinner','uncountable'), tok('together','adverb','adverbial')], 'Họ có ăn tối cùng nhau không?', 1, ['food'], false, 'Sau Did, dùng động từ base: eat (không dùng ate).', 'eat');
addPastQ([tok('you','pronoun','subject')], 'see', 'see', [tok('the','article','det'), tok('elephants','noun','object','elephant','pl'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('zoo','noun','adverbial','zoo','sg')], 'Bạn có nhìn thấy những con voi ở sở thú không?', 2, ['animal'], false, 'Sau Did, dùng dạng base: see (không dùng saw).', 'see');
addPastQ([tok('Nam','noun','subject','Nam','sg')], 'do', 'do', [tok('his','determiner','det'), tok('homework','noun','object','homework','uncountable')], 'Nam có làm bài tập về nhà không?', 1, ['school'], true, 'Trợ động từ quá khứ: Did.', 'Did');
addPastQ([tok('she','pronoun','subject')], 'buy', 'buy', [tok('a','article','det'), tok('new','adjective','modifier'), tok('hat','noun','object','hat','sg')], 'Cô ấy có mua một chiếc mũ mới không?', 2, ['clothes'], false, 'Sau Did, động từ về base: buy.', 'buy');
addPastQ([tok('they','pronoun','subject')], 'visit','visit', [tok('their','determiner','det'), tok('grandparents','noun','object','grandparent','pl'), tok('last','adverb','adverbial'), tok('week','noun','adverbial','week','sg')], 'Tuần trước họ có về thăm ông bà không?', 2, ['family'], true, 'Trợ động từ câu hỏi quá khứ: Did.', 'Did');
addPastQ([tok('you','pronoun','subject')], 'drink','drink', [tok('orange','noun','modifier','orange','sg'), tok('juice','noun','object','juice','uncountable')], 'Bạn có uống nước cam không?', 1, ['drink'], false, 'Sau Did, dùng dạng base: drink.', 'drink');
addPastQ([tok('he','pronoun','subject')], 'clean', 'clean', [tok('his','determiner','det'), tok('room','noun','object','room','sg')], 'Cậu ấy có dọn dẹp phòng của mình không?', 1, ['home'], true, 'Trợ động từ câu hỏi quá khứ: Did.', 'Did');

addPastQ([tok('she','pronoun','subject')], 'write', 'write', [tok('a','article','det'), tok('letter','noun','object','letter','sg')], 'Cô ấy có viết một lá thư không?', 2, ['study'], false, 'Sau Did, động từ về base: write.', 'write');
addPastQ([tok('they','pronoun','subject')], 'swim', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('lake','noun','adverbial','lake','sg')], 'Họ có bơi ở hồ không?', 2, ['sport'], false, 'Sau Did, dùng dạng base: swim.', 'swim');
addPastQ([tok('you','pronoun','subject')], 'read', 'read', [tok('that','determiner','det'), tok('comic','noun','object','comic','sg')], 'Bạn có đọc cuốn truyện tranh đó không?', 1, ['study'], true, 'Trợ động từ câu hỏi quá khứ: Did.', 'Did');
addPastQ([tok('Tom','noun','subject','Tom','sg')], 'come', 'come', [tok('to','preposition','adverbial'), tok('class','noun','adverbial','class','sg'), tok('on','preposition','adverbial'), tok('time','noun','adverbial','time','uncountable')], 'Tom có đến lớp đúng giờ không?', 2, ['school'], false, 'Sau Did, dùng dạng base: come.', 'come');
addPastQ([tok('we','pronoun','subject')], 'have', 'have', [tok('fun','noun','object','fun','uncountable'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('party','noun','adverbial','party','sg')], 'Chúng ta có vui vẻ ở bữa tiệc không?', 2, ['party'], false, 'Sau Did, dùng dạng base: have.', 'have');
addPastQ([tok('she','pronoun','subject')], 'sing', 'sing', [tok('an','article','det'), tok('English','noun','modifier','English','uncountable'), tok('song','noun','object','song','sg')], 'Cô ấy có hát một bài hát tiếng Anh không?', 2, ['music'], false, 'Sau Did, dùng dạng base: sing.', 'sing');
addPastQ([tok('they','pronoun','subject')], 'take', 'take', [tok('the','article','det'), tok('bus','noun','object','bus','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua họ có đi xe buýt không?', 2, ['transport'], true, 'Trợ động từ câu hỏi quá khứ: Did.', 'Did');
addPastQ([tok('he','pronoun','subject')], 'go', 'go', [tok('to','preposition','prep'), tok('bed','noun','prep-object','bed','sg'), tok('early','adverb','adverbial'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg')], 'Tối qua cậu ấy có đi ngủ sớm không?', 2, ['daily'], false, 'Chia động từ go để hoàn thành câu nghi vấn ở thì quá khứ đơn.', 'go to bed: đi ngủ', ['Last night did he go to bed early?']);
addPastQ([tok('you','pronoun','subject')], 'find', 'find', [tok('your','determiner','det'), tok('ruler','noun','object','ruler','sg')], 'Bạn có tìm thấy thước kẻ của mình không?', 2, ['school'], false, 'Sau Did, dùng dạng base: find.', 'find');
addPastQ([tok('the','article','det'), tok('team','noun','subject','team','sg')], 'win', 'win', [tok('the','article','det'), tok('match','noun','object','match','sg')], 'Đội bóng có chiến thắng trận đấu không?', 2, ['sport'], true, 'Trợ động từ quá khứ: Did.', 'Did');

addPastQ([tok('she','pronoun','subject')], 'help', 'help', [tok('her','determiner','det'), tok('mother','noun','object','mother','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua cô ấy có giúp mẹ không?', 1, ['family'], false, 'Sau Did, động từ về base: help.', 'help');
addPastQ([tok('they','pronoun','subject')], 'walk', 'walk', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('park','noun','adverbial','park','sg')], 'Họ có đi dạo trong công viên không?', 1, ['place'], true, 'Trợ động từ câu hỏi quá khứ: Did.', 'Did');
addPastQ([tok('you','pronoun','subject')], 'listen', 'listen', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('story','noun','adverbial','story','sg')], 'Bạn có lắng nghe câu chuyện không?', 2, ['study'], false, 'Sau Did, dùng dạng base: listen.', 'listen');
addPastQ([tok('he','pronoun','subject')], 'ride', 'ride', [tok('his','determiner','det'), tok('bike','noun','object','bike','sg'), tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg')], 'Cậu ấy có đạp xe đạp tới trường không?', 2, ['transport'], false, 'Sau Did, dùng dạng base: ride.', 'ride');
addPastQ([tok('Lan','noun','subject','Lan','sg')], 'paint', 'paint', [tok('a','article','det'), tok('picture','noun','object','picture','sg')], 'Lan có vẽ một bức tranh không?', 2, ['art'], true, 'Trợ động từ quá khứ: Did.', 'Did');
addPastQ([tok('they','pronoun','subject')], 'cook', 'cook', [tok('dinner','noun','object','dinner','uncountable'), tok('at','preposition','adverbial'), tok('home','noun','adverbial','home','uncountable')], 'Họ có nấu bữa tối ở nhà không?', 2, ['food'], false, 'Sau Did, dùng cook.', 'cook');
addPastQ([tok('you','pronoun','subject')], 'hear', 'hear', [tok('that','determiner','det'), tok('strange','adjective','modifier'), tok('noise','noun','object','noise','sg')], 'Bạn có nghe thấy tiếng động lạ đó không?', 3, ['daily'], false, 'Sau Did, dùng hear (không dùng heard).', 'hear');
addPastQ([tok('the','article','det'), tok('bus','noun','subject','bus','sg')], 'arrive', 'arrive', [tok('on','preposition','adverbial'), tok('time','noun','adverbial','time','uncountable')], 'Xe buýt có đến đúng giờ không?', 2, ['transport'], true, 'Trợ động từ quá khứ: Did.', 'Did');
addPastQ([tok('she','pronoun','subject')], 'wear', 'wear', [tok('her','determiner','det'), tok('new','adjective','modifier'), tok('shoes','noun','object','shoe','pl')], 'Cô ấy có đi đôi giày mới không?', 2, ['clothes'], false, 'Sau Did, dùng wear.', 'wear');
addPastQ([tok('they','pronoun','subject')], 'finish', 'finish', [tok('the','article','det'), tok('project','noun','object','project','sg'), tok('yesterday','adverb','adverbial')], 'Hôm qua họ có hoàn thành dự án không?', 3, ['school'], true, 'Trợ động từ câu hỏi quá khứ: Did.', 'Did');

// Kiểm tra số lượng
console.log(`Generated ${sentences.length} sentences for B3.`);
if (sentences.length !== 200) {
  throw new Error(`Expected 200 sentences, but got ${sentences.length}`);
}

fs.writeFileSync(path.join(DATA_DIR, 'B3.sentences.json'), JSON.stringify(applyContentReviewV4('B3.sentences.json', sentences.map(applyReviewedOrder)), null, 2), 'utf-8');
console.log(`✅ Saved B3.sentences.json (${sentences.length} items)`);

// =========================================================================
// 3. THEORY B3 (Past Simple)
// =========================================================================
const theoryRaw = {
  id: 'theory-B3',
  level: 'B3',
  topic: 'past-simple',
  title: 'Thì Quá khứ đơn (Past Simple Tense)',
  summary: 'Thì Quá khứ đơn dùng để diễn tả một hành động, sự việc đã xảy ra và kết thúc hoàn toàn trong quá khứ, thường có thời gian xác định rõ ràng.',
  formulas: [
    {
      name: 'Động từ To Be trong quá khứ',
      pattern: 'Khẳng định: S + was / were | Phủ định: S + wasn\'t / weren\'t | Nghi vấn: Was / Were + S...?',
      examples: [
        'I was happy yesterday. (Hôm qua tôi đã rất vui.)',
        'They were at the zoo last Sunday. (Họ đã ở sở thú Chủ nhật trước.)',
        'She wasn\'t at home last night. (Tối qua cô ấy đã không ở nhà.)',
        'Were you tired? - Yes, I was. / No, I wasn\'t.'
      ]
    },
    {
      name: 'Động từ thường - Khẳng định (Affirmative)',
      pattern: 'S + V-ed (có quy tắc) HOẶC V2 (bất quy tắc)',
      examples: [
        'I watched TV yesterday. (Hôm qua tôi đã xem tivi.)',
        'She went to school two days ago. (Cô ấy đã đi học cách đây hai ngày.)'
      ]
    },
    {
      name: 'Động từ thường - Phủ định (Negative)',
      pattern: 'S + didn\'t + V(nguyên thể base)',
      examples: [
        'He didn\'t play football yesterday. (Hôm qua cậu ấy đã không chơi bóng đá.)',
        'They didn\'t buy that book. (Họ đã không mua cuốn sách đó.)'
      ]
    },
    {
      name: 'Động từ thường - Nghi vấn Yes/No (Yes/No Question)',
      pattern: 'Did + S + V(nguyên thể base)?',
      examples: [
        'Did you see the elephant? - Yes, I did. / No, I didn\'t.',
        'Did she do her homework? - Yes, she did. / No, she didn\'t.'
      ]
    }
  ],
  sections: [
    {
      title: '1. Cách dùng thì Quá khứ đơn',
      content: 'Thì Quá khứ đơn dùng để nói về những sự việc đã xảy ra và chấm dứt trong quá khứ.\nVí dụ: Hôm qua bạn đi chơi công viên, ăn kem, xem phim. Mọi hành động đó đã diễn ra ngày hôm qua và kết thúc rồi, ta dùng thì Quá khứ đơn.'
    },
    {
      title: '2. Động từ To Be trong quá khứ: WAS hay WERE?',
      content: '- "was": đi với chủ ngữ số ít "I, He, She, It, Danh từ số ít". Phủ định là "wasn\'t" (= was not).\n- "were": đi với chủ ngữ số nhiều "We, You, They, Danh từ số nhiều". Phủ định là "weren\'t" (= were not).'
    },
    {
      title: '3. Động từ có quy tắc (Regular Verbs - thêm -ed)',
      content: '- Thông thường: thêm "-ed" vào sau động từ nguyên thể (watch → watched, clean → cleaned, play → played).\n- Tận cùng là "e": chỉ cần thêm "-d" (dance → danced, live → lived, close → closed).\n- Tận cùng là 1 phụ âm + "y": đổi "y" thành "i" rồi thêm "-ed" (study → studied, carry → carried).\n- Động từ 1 âm tiết kết thúc dạng C-V-C: gấp đôi phụ âm cuối trước khi thêm "-ed" (stop → stopped, skip → skipped, clap → clapped).'
    },
    {
      title: '4. Động từ bất quy tắc (Irregular Verbs) cực kỳ thông dụng',
      content: 'Những động từ này không thêm -ed mà biến đổi sang một dạng hoàn toàn mới (cần học thuộc lòng):\n- go → went (đi)\n- eat → ate (ăn)\n- drink → drank (uống)\n- see → saw (thấy)\n- have → had (có)\n- do → did (làm)\n- make → made (chế tạo)\n- buy → bought (mua)\n- write → wrote (viết)\n- read → read (đọc - viết như cũ, phát âm là /red/)\n- swim → swam (bơi)\n- run → ran (chạy)'
    },
    {
      title: '5. Phủ định và Câu hỏi với DID: Thần chú "mượn Did thì trả về Base"',
      content: 'Trong câu phủ định và câu hỏi của động từ thường:\n- Ta mượn trợ động từ "didn\'t" hoặc "Did".\n- Vì "did" đã gánh thì quá khứ rồi, nên ĐỘNG TỪ CHÍNH PHẢI ĐƯA VỀ NGUYÊN THỂ (base)!\nVí dụ: "He didn\'t go to school" (KHÔNG nói "He didn\'t went").'
    },
    {
      title: '6. Các dấu hiệu nhận biết thời gian trong quá khứ',
      content: '- yesterday (hôm qua), yesterday morning (sáng hôm qua).\n- last night (tối qua), last week (tuần trước), last month (tháng trước), last year (năm ngoái), last Sunday (Chủ nhật trước).\n- ... ago (cách đây...): two days ago (hai ngày trước), an hour ago (một giờ trước).\n- in + năm trong quá khứ (ví dụ: in 2020).'
    }
  ],
  commonMistakes: [
    {
      wrong: 'She didn\'t went to school yesterday.',
      right: 'She didn\'t go to school yesterday.',
      why: 'Sau trợ động từ phủ định "didn\'t", động từ chính BẮT BUỘC phải ở dạng nguyên thể (base: go).'
    },
    {
      wrong: 'Did you watched TV last night?',
      right: 'Did you watch TV last night?',
      why: 'Trong câu hỏi bắt đầu bằng "Did", động từ chính phải giữ nguyên thể không chia -ed (watch).'
    },
    {
      wrong: 'We was at the park yesterday.',
      right: 'We were at the park yesterday.',
      why: 'Chủ ngữ "We" là số nhiều, phải dùng to be quá khứ là "were", không dùng "was".'
    },
    {
      wrong: 'He buyed a new bicycle.',
      right: 'He bought a new bicycle.',
      why: 'Động từ "buy" là động từ bất quy tắc, quá khứ là "bought", không thêm đuôi "-ed".'
    }
  ],
  tips: [
    'Luôn ghi nhớ: Khi đã có "Did" hoặc "Didn\'t" trợ giúp, động từ chính phía sau lập tức quay về nguyên thể (V-base)!',
    'Chủ ngữ số ít (I, he, she, it) đi với "was" (3 chữ cái). Chủ ngữ số nhiều (we, you, they) đi với "were" (4 chữ cái).',
    'Gặp các từ như "yesterday", "last...", "...ago", hãy nghĩ ngay đến thì Quá khứ đơn.'
  ],
  exampleIds: ['B3-s-0001', 'B3-s-0011', 'B3-s-0021', 'B3-s-0041', 'B3-s-0091', 'B3-s-0141', 'B3-s-0171']
};

// Chuẩn hoá theory về đúng schema TheoryPage (xem docs/english-content-fix-list-v3.md #02).
const SECTION_EXAMPLE_IDS = [
  ['B3-s-0041', 'B3-s-0091'],
  ['B3-s-0001', 'B3-s-0011', 'B3-s-0021'],
  ['B3-s-0041', 'B3-s-0055'],
  ['B3-s-0091', 'B3-s-0092', 'B3-s-0094'],
  ['B3-s-0141', 'B3-s-0171'],
  ['B3-s-0011'],
];
const theory = {
  id: theoryRaw.level,
  title: theoryRaw.title,
  level: theoryRaw.level,
  summary: theoryRaw.summary,
  formulas: theoryRaw.formulas.map((f) => ({ label: f.name, pattern: f.pattern, example: f.examples[0] })),
  sections: theoryRaw.sections.map((s, i) => ({ heading: s.title, body: s.content, exampleIds: SECTION_EXAMPLE_IDS[i] })),
  commonMistakes: theoryRaw.commonMistakes,
  tips: theoryRaw.tips,
};
fs.writeFileSync(path.join(DATA_DIR, 'B3.theory.json'), JSON.stringify(applyContentReviewV4('B3.theory.json', typeof applyTheoryReview === 'function' ? applyTheoryReview(theory) : theory), null, 2), 'utf-8');
console.log(`✅ Saved B3.theory.json`);
