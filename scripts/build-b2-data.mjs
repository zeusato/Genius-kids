import { applyContentReviewV4 } from './english-content-review-v4.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
    if (t.pos === 'punct') return acc + t.text;
    return acc + ' ' + t.text;
  }, '');
}

// -------------------------------------------------------------
// VOCABULARY B2 (>= 105 words)
// -------------------------------------------------------------
const vocabList = [
  // Động từ hành động quan sát được (50)
  { en: 'run', vi: 'chạy', pos: 'verb', ipa: '/rʌn/', forms: { thirdSg: 'runs', past: 'ran', ing: 'running', irregular: true }, image: '🏃', tags: ['action', 'sport'], exampleEn: 'He is running in the park.', exampleVi: 'Cậu ấy đang chạy trong công viên.' },
  { en: 'swim', vi: 'bơi', pos: 'verb', ipa: '/swɪm/', forms: { thirdSg: 'swims', past: 'swam', ing: 'swimming', irregular: true }, image: '🏊', tags: ['action', 'sport'], exampleEn: 'She is swimming now.', exampleVi: 'Cô ấy đang bơi bây giờ.' },
  { en: 'sit', vi: 'ngồi', pos: 'verb', ipa: '/sɪt/', forms: { thirdSg: 'sits', past: 'sat', ing: 'sitting', irregular: true }, image: '🪑', tags: ['action'], exampleEn: 'The cat is sitting on the chair.', exampleVi: 'Con mèo đang ngồi trên ghế.' },
  { en: 'stand', vi: 'đứng', pos: 'verb', ipa: '/stænd/', forms: { thirdSg: 'stands', past: 'stood', ing: 'standing', irregular: true }, image: '🧍', tags: ['action'], exampleEn: 'He is standing near the door.', exampleVi: 'Cậu ấy đang đứng gần cửa.' },
  { en: 'skip', vi: 'nhảy dây', pos: 'verb', ipa: '/skɪp/', forms: { thirdSg: 'skips', past: 'skipped', ing: 'skipping', irregular: false }, image: '🪢', tags: ['action', 'sport'], exampleEn: 'The girls are skipping in the schoolyard.', exampleVi: 'Các bé gái đang nhảy dây trong sân trường.' },
  { en: 'stop', vi: 'dừng lại', pos: 'verb', ipa: '/stɑːp/', forms: { thirdSg: 'stops', past: 'stopped', ing: 'stopping', irregular: false }, image: '🛑', tags: ['action'], exampleEn: 'The bus is stopping.', exampleVi: 'Xe buýt đang dừng lại.' },
  { en: 'clap', vi: 'vỗ tay', pos: 'verb', ipa: '/klæp/', forms: { thirdSg: 'claps', past: 'clapped', ing: 'clapping', irregular: false }, image: '👏', tags: ['action'], exampleEn: 'The children are clapping their hands.', exampleVi: 'Lũ trẻ đang vỗ tay.' },
  { en: 'hop', vi: 'nhảy lò cò', pos: 'verb', ipa: '/hɑːp/', forms: { thirdSg: 'hops', past: 'hopped', ing: 'hopping', irregular: false }, image: '🦘', tags: ['action'], exampleEn: 'The rabbit is hopping.', exampleVi: 'Chú thỏ đang nhảy lò cò.' },
  { en: 'write', vi: 'viết', pos: 'verb', ipa: '/raɪt/', forms: { thirdSg: 'writes', past: 'wrote', ing: 'writing', irregular: true }, image: '✍️', tags: ['action', 'study'], exampleEn: 'She is writing a letter.', exampleVi: 'Cô ấy đang viết một lá thư.' },
  { en: 'dance', vi: 'khiêu vũ, nhảy', pos: 'verb', ipa: '/dæns/', forms: { thirdSg: 'dances', past: 'danced', ing: 'dancing', irregular: false }, image: '💃', tags: ['action', 'hobby'], exampleEn: 'Lan is dancing gracefully.', exampleVi: 'Lan đang nhảy múa uyển chuyển.' },
  { en: 'ride', vi: 'đạp xe, cưỡi', pos: 'verb', ipa: '/raɪd/', forms: { thirdSg: 'rides', past: 'rode', ing: 'riding', irregular: true }, image: '🚴', tags: ['action', 'transport'], exampleEn: 'He is riding his bike now.', exampleVi: 'Cậu ấy đang đạp xe đạp bây giờ.' },
  { en: 'drive', vi: 'lái xe ô tô', pos: 'verb', ipa: '/draɪv/', forms: { thirdSg: 'drives', past: 'drove', ing: 'driving', irregular: true }, image: '🚗', tags: ['action', 'transport'], exampleEn: 'My uncle is driving a car.', exampleVi: 'Chú tôi đang lái xe ô tô.' },
  { en: 'make', vi: 'làm, chế tạo', pos: 'verb', ipa: '/meɪk/', forms: { thirdSg: 'makes', past: 'made', ing: 'making', irregular: true }, image: '🔨', tags: ['action'], exampleEn: 'They are making a paper kite.', exampleVi: 'Họ đang làm một con diều giấy.' },
  { en: 'bake', vi: 'nướng bánh', pos: 'verb', ipa: '/beɪk/', forms: { thirdSg: 'bakes', past: 'baked', ing: 'baking', irregular: false }, image: '🧁', tags: ['action', 'food'], exampleEn: 'My mother is baking a cake.', exampleVi: 'Mẹ tôi đang nướng một chiếc bánh ngọt.' },
  { en: 'close', vi: 'đóng lại', pos: 'verb', ipa: '/kloʊz/', forms: { thirdSg: 'closes', past: 'closed', ing: 'closing', irregular: false }, image: '📕', tags: ['action'], exampleEn: 'He is closing the window.', exampleVi: 'Cậu ấy đang đóng cửa sổ lại.' },
  { en: 'take', vi: 'cầm, chụp (ảnh)', pos: 'verb', ipa: '/teɪk/', forms: { thirdSg: 'takes', past: 'took', ing: 'taking', irregular: true }, image: '📸', tags: ['action'], exampleEn: 'She is taking photos.', exampleVi: 'Cô ấy đang chụp ảnh.' },
  { en: 'smile', vi: 'mỉm cười', pos: 'verb', ipa: '/smaɪl/', forms: { thirdSg: 'smiles', past: 'smiled', ing: 'smiling', irregular: false }, image: '😊', tags: ['action'], exampleEn: 'The baby is smiling.', exampleVi: 'Em bé đang mỉm cười.' },
  { en: 'read', vi: 'đọc', pos: 'verb', ipa: '/riːd/', forms: { thirdSg: 'reads', past: 'read', ing: 'reading', irregular: true }, image: '📖', tags: ['action', 'study'], exampleEn: 'He is reading a storybook.', exampleVi: 'Cậu ấy đang đọc một cuốn truyện.' },
  { en: 'eat', vi: 'ăn', pos: 'verb', ipa: '/iːt/', forms: { thirdSg: 'eats', past: 'ate', ing: 'eating', irregular: true }, image: '🍽️', tags: ['action', 'daily'], exampleEn: 'They are eating lunch now.', exampleVi: 'Họ đang ăn trưa bây giờ.' },
  { en: 'drink', vi: 'uống', pos: 'verb', ipa: '/drɪŋk/', forms: { thirdSg: 'drinks', past: 'drank', ing: 'drinking', irregular: true }, image: '🥤', tags: ['action', 'daily'], exampleEn: 'She is drinking orange juice.', exampleVi: 'Cô ấy đang uống nước cam.' },
  { en: 'play', vi: 'chơi', pos: 'verb', ipa: '/pleɪ/', forms: { thirdSg: 'plays', past: 'played', ing: 'playing', irregular: false }, image: '⚽', tags: ['action', 'sport'], exampleEn: 'We are playing soccer.', exampleVi: 'Chúng tôi đang chơi bóng đá.' },
  { en: 'watch', vi: 'xem', pos: 'verb', ipa: '/wɑːtʃ/', forms: { thirdSg: 'watches', past: 'watched', ing: 'watching', irregular: false }, image: '📺', tags: ['action'], exampleEn: 'He is watching television.', exampleVi: 'Cậu ấy đang xem tivi.' },
  { en: 'listen', vi: 'nghe', pos: 'verb', ipa: '/ˈlɪs.ən/', forms: { thirdSg: 'listens', past: 'listened', ing: 'listening', irregular: false }, image: '🎧', tags: ['action'], exampleEn: 'She is listening to music.', exampleVi: 'Cô ấy đang nghe nhạc.' },
  { en: 'sing', vi: 'hát', pos: 'verb', ipa: '/sɪŋ/', forms: { thirdSg: 'sings', past: 'sang', ing: 'singing', irregular: true }, image: '🎤', tags: ['action', 'music'], exampleEn: 'The children are singing.', exampleVi: 'Lũ trẻ đang hát.' },
  { en: 'draw', vi: 'vẽ tranh (bút chì/sáp)', pos: 'verb', ipa: '/drɔː/', forms: { thirdSg: 'draws', past: 'drew', ing: 'drawing', irregular: true }, image: '✏️', tags: ['action', 'art'], exampleEn: 'Nam is drawing a cat.', exampleVi: 'Nam đang vẽ một con mèo.' },
  { en: 'paint', vi: 'sơn, vẽ màu', pos: 'verb', ipa: '/peɪnt/', forms: { thirdSg: 'paints', past: 'painted', ing: 'painting', irregular: false }, image: '🎨', tags: ['action', 'art'], exampleEn: 'She is painting a picture.', exampleVi: 'Cô ấy đang vẽ một bức tranh.' },
  { en: 'cook', vi: 'nấu nướng', pos: 'verb', ipa: '/kʊk/', forms: { thirdSg: 'cooks', past: 'cooked', ing: 'cooking', irregular: false }, image: '🍳', tags: ['action', 'daily'], exampleEn: 'My mother is cooking in the kitchen.', exampleVi: 'Mẹ tôi đang nấu ăn trong bếp.' },
  { en: 'clean', vi: 'dọn dẹp, lau chùi', pos: 'verb', ipa: '/kliːn/', forms: { thirdSg: 'cleans', past: 'cleaned', ing: 'cleaning', irregular: false }, image: '🧹', tags: ['action', 'daily'], exampleEn: 'He is cleaning his room.', exampleVi: 'Cậu ấy đang dọn dẹp phòng của mình.' },
  { en: 'wash', vi: 'giặt, rửa', pos: 'verb', ipa: '/wɑːʃ/', forms: { thirdSg: 'washes', past: 'washed', ing: 'washing', irregular: false }, image: '🧼', tags: ['action', 'daily'], exampleEn: 'She is washing the dishes.', exampleVi: 'Cô ấy đang rửa bát đĩa.' },
  { en: 'sleep', vi: 'ngủ', pos: 'verb', ipa: '/sliːp/', forms: { thirdSg: 'sleeps', past: 'slept', ing: 'sleeping', irregular: true }, image: '😴', tags: ['action', 'daily'], exampleEn: 'The baby is sleeping peacefully.', exampleVi: 'Em bé đang ngủ say sưa.' },
  { en: 'fly', vi: 'bay, thả (diều)', pos: 'verb', ipa: '/flaɪ/', forms: { thirdSg: 'flies', past: 'flew', ing: 'flying', irregular: true }, image: '🪁', tags: ['action'], exampleEn: 'They are flying a kite.', exampleVi: 'Họ đang thả diều.' },
  { en: 'climb', vi: 'leo trèo', pos: 'verb', ipa: '/klaɪm/', forms: { thirdSg: 'climbs', past: 'climbed', ing: 'climbing', irregular: false }, image: '🧗', tags: ['action'], exampleEn: 'The monkey is climbing the tree.', exampleVi: 'Con khỉ đang trèo cây.' },
  { en: 'wait', vi: 'chờ đợi', pos: 'verb', ipa: '/weɪt/', forms: { thirdSg: 'waits', past: 'waited', ing: 'waiting', irregular: false }, image: '⏳', tags: ['action'], exampleEn: 'We are waiting for the bus.', exampleVi: 'Chúng tôi đang chờ xe buýt.' },
  { en: 'talk', vi: 'nói chuyện', pos: 'verb', ipa: '/tɔːk/', forms: { thirdSg: 'talks', past: 'talked', ing: 'talking', irregular: false }, image: '💬', tags: ['action'], exampleEn: 'They are talking to the teacher.', exampleVi: 'Họ đang nói chuyện với cô giáo.' },
  { en: 'carry', vi: 'mang, vác, bế', pos: 'verb', ipa: '/ˈker.i/', forms: { thirdSg: 'carries', past: 'carried', ing: 'carrying', irregular: false }, image: '🎒', tags: ['action'], exampleEn: 'He is carrying a heavy backpack.', exampleVi: 'Cậu ấy đang mang một chiếc ba lô nặng.' },
  { en: 'study', vi: 'học bài', pos: 'verb', ipa: '/ˈstʌd.i/', forms: { thirdSg: 'studies', past: 'studied', ing: 'studying', irregular: false }, image: '📚', tags: ['action', 'school'], exampleEn: 'I am studying English right now.', exampleVi: 'Tôi đang học tiếng Anh ngay lúc này.' },
  { en: 'water', vi: 'tưới (cây)', pos: 'verb', ipa: '/ˈwɑː.t̬ɚ/', forms: { thirdSg: 'waters', past: 'watered', ing: 'watering', irregular: false }, image: '🚿', tags: ['action'], exampleEn: 'Grandfather is watering the plants.', exampleVi: 'Ông đang tưới cây.' },
  { en: 'kick', vi: 'đá (bóng)', pos: 'verb', ipa: '/kɪk/', forms: { thirdSg: 'kicks', past: 'kicked', ing: 'kicking', irregular: false }, image: '🦵', tags: ['action', 'sport'], exampleEn: 'He is kicking the ball.', exampleVi: 'Cậu ấy đang đá quả bóng.' },
  { en: 'catch', vi: 'bắt, chụp', pos: 'verb', ipa: '/kætʃ/', forms: { thirdSg: 'catches', past: 'caught', ing: 'catching', irregular: true }, image: '🧤', tags: ['action'], exampleEn: 'The dog is catching the ball.', exampleVi: 'Chú chó đang bắt quả bóng.' },
  { en: 'throw', vi: 'ném', pos: 'verb', ipa: '/θroʊ/', forms: { thirdSg: 'throws', past: 'threw', ing: 'throwing', irregular: true }, image: '⚾', tags: ['action'], exampleEn: 'She is throwing the ball.', exampleVi: 'Cô ấy đang ném quả bóng.' },
  { en: 'build', vi: 'xây dựng', pos: 'verb', ipa: '/bɪld/', forms: { thirdSg: 'builds', past: 'built', ing: 'building', irregular: true }, image: '🧱', tags: ['action'], exampleEn: 'They are building a sandcastle.', exampleVi: 'Họ đang xây lâu đài cát.' },
  { en: 'help', vi: 'giúp đỡ', pos: 'verb', ipa: '/help/', forms: { thirdSg: 'helps', past: 'helped', ing: 'helping', irregular: false }, image: '🤝', tags: ['action'], exampleEn: 'Lan is helping her mother.', exampleVi: 'Lan đang giúp đỡ mẹ mình.' },
  { en: 'brush', vi: 'chải, đánh (răng)', pos: 'verb', ipa: '/brʌʃ/', forms: { thirdSg: 'brushes', past: 'brushed', ing: 'brushing', irregular: false }, image: '🪥', tags: ['action', 'daily'], exampleEn: 'Tom is brushing his hair.', exampleVi: 'Tom đang chải tóc.' },
  { en: 'feed', vi: 'cho ăn', pos: 'verb', ipa: '/fiːd/', forms: { thirdSg: 'feeds', past: 'fed', ing: 'feeding', irregular: true }, image: '🥣', tags: ['action'], exampleEn: 'She is feeding the birds.', exampleVi: 'Cô ấy đang cho chim ăn.' },
  { en: 'plant', vi: 'trồng (cây)', pos: 'verb', ipa: '/plænt/', forms: { thirdSg: 'plants', past: 'planted', ing: 'planting', irregular: false }, image: '🌱', tags: ['action'], exampleEn: 'They are planting trees in the garden.', exampleVi: 'Họ đang trồng cây trong vườn.' },
  { en: 'look', vi: 'nhìn ngắm', pos: 'verb', ipa: '/lʊk/', forms: { thirdSg: 'looks', past: 'looked', ing: 'looking', irregular: false }, image: '👀', tags: ['action'], exampleEn: 'Look! The bird is flying.', exampleVi: 'Nhìn kìa! Chú chim đang bay.' },
  { en: 'hear', vi: 'nghe thấy', pos: 'verb', ipa: '/hɪr/', forms: { thirdSg: 'hears', past: 'heard', ing: 'hearing', irregular: true }, image: '👂', tags: ['action'], exampleEn: 'Can you hear the music?', exampleVi: 'Bạn có nghe thấy tiếng nhạc không?' },
  { en: 'wear', vi: 'mặc, đội, đeo', pos: 'verb', ipa: '/wer/', forms: { thirdSg: 'wears', past: 'wore', ing: 'wearing', irregular: true }, image: '👗', tags: ['action', 'clothes'], exampleEn: 'She is wearing a pink dress.', exampleVi: 'Cô ấy đang mặc một chiếc váy màu hồng.' },
  { en: 'mop', vi: 'lau (sàn nhà)', pos: 'verb', ipa: '/mɑːp/', forms: { thirdSg: 'mops', past: 'mopped', ing: 'mopping', irregular: false }, image: '🧹', tags: ['action', 'daily'], exampleEn: 'He is mopping the floor.', exampleVi: 'Cậu ấy đang lau sàn nhà.' },
  { en: 'open', vi: 'mở', pos: 'verb', ipa: '/ˈoʊ.pən/', forms: { thirdSg: 'opens', past: 'opened', ing: 'opening', irregular: false }, image: '🚪', tags: ['action'], exampleEn: 'The teacher is opening the door.', exampleVi: 'Thầy giáo đang mở cửa.' },

  // Từ chỉ thời gian & trạng thái tiếp diễn (8)
  { en: 'now', vi: 'bây giờ', pos: 'adverb', ipa: '/naʊ/', image: '⏱️', tags: ['time', 'continuous'], exampleEn: 'We are learning now.', exampleVi: 'Bây giờ chúng tôi đang học.' },
  { en: 'right now', vi: 'ngay bây giờ', pos: 'adverb', ipa: '/ˌraɪt ˈnaʊ/', image: '⚡', tags: ['time', 'continuous'], exampleEn: 'He is reading right now.', exampleVi: 'Cậu ấy đang đọc sách ngay bây giờ.' },
  { en: 'at the moment', vi: 'vào lúc này', pos: 'adverb', ipa: '/ət ðə ˈmoʊ.mənt/', image: '⏳', tags: ['time', 'continuous'], exampleEn: 'She is sleeping at the moment.', exampleVi: 'Vào lúc này cô ấy đang ngủ.' },
  { en: 'at present', vi: 'hiện tại', pos: 'adverb', ipa: '/ət ˈprez.ənt/', image: '📍', tags: ['time', 'continuous'], exampleEn: 'They are working at present.', exampleVi: 'Hiện tại họ đang làm việc.' },
  { en: 'today', vi: 'hôm nay', pos: 'adverb', ipa: '/təˈdeɪ/', image: '📅', tags: ['time'], exampleEn: 'I am wearing a new hat today.', exampleVi: 'Hôm nay tôi đang đội một chiếc mũ mới.' },
  { en: 'quietly', vi: 'một cách yên lặng', pos: 'adverb', ipa: '/ˈkwaɪ.ət.li/', image: '🤫', tags: ['manner'], exampleEn: 'The children are reading quietly.', exampleVi: 'Lũ trẻ đang đọc sách một cách yên lặng.' },
  { en: 'fast', vi: 'nhanh', pos: 'adverb', ipa: '/fæst/', image: '💨', tags: ['manner'], exampleEn: 'The car is running fast.', exampleVi: 'Chiếc xe đang chạy nhanh.' },
  { en: 'carefully', vi: 'cẩn thận', pos: 'adverb', ipa: '/ˈker.fəl.i/', image: '🔍', tags: ['manner'], exampleEn: 'She is writing carefully.', exampleVi: 'Cô ấy đang viết một cách cẩn thận.' },

  // Nơi chốn thực hiện hành động (16)
  { en: 'playground', vi: 'sân chơi', pos: 'noun', ipa: '/ˈpleɪ.ɡraʊnd/', forms: { plural: 'playgrounds' }, image: '🛝', tags: ['place'], exampleEn: 'They are playing in the playground.', exampleVi: 'Họ đang chơi ở sân chơi.' },
  { en: 'schoolyard', vi: 'sân trường', pos: 'noun', ipa: '/ˈskuːl.jɑːrd/', forms: { plural: 'schoolyards' }, image: '🏫', tags: ['place', 'school'], exampleEn: 'Students are running in the schoolyard.', exampleVi: 'Học sinh đang chạy trong sân trường.' },
  { en: 'park', vi: 'công viên', pos: 'noun', ipa: '/pɑːrk/', forms: { plural: 'parks' }, image: '🌳', tags: ['place'], exampleEn: 'We are walking in the park.', exampleVi: 'Chúng tôi đang đi dạo trong công viên.' },
  { en: 'beach', vi: 'bãi biển', pos: 'noun', ipa: '/biːtʃ/', forms: { plural: 'beaches' }, image: '🏖️', tags: ['place'], exampleEn: 'They are swimming at the beach.', exampleVi: 'Họ đang bơi ở bãi biển.' },
  { en: 'swimming pool', vi: 'hồ bơi', pos: 'noun', ipa: '/ˈswɪm.ɪŋ ˌpuːl/', forms: { plural: 'swimming pools' }, image: '🏊', tags: ['place', 'sport'], exampleEn: 'He is at the swimming pool.', exampleVi: 'Cậu ấy đang ở hồ bơi.' },
  { en: 'kitchen', vi: 'nhà bếp', pos: 'noun', ipa: '/ˈkɪtʃ.ən/', forms: { plural: 'kitchens' }, image: '🍳', tags: ['place', 'home'], exampleEn: 'Mother is cooking in the kitchen.', exampleVi: 'Mẹ đang nấu ăn trong bếp.' },
  { en: 'living room', vi: 'phòng khách', pos: 'noun', ipa: '/ˈlɪv.ɪŋ ˌruːm/', forms: { plural: 'living rooms' }, image: '🛋️', tags: ['place', 'home'], exampleEn: 'Father is sitting in the living room.', exampleVi: 'Bố đang ngồi trong phòng khách.' },
  { en: 'bedroom', vi: 'phòng ngủ', pos: 'noun', ipa: '/ˈbed.ruːm/', forms: { plural: 'bedrooms' }, image: '🛏️', tags: ['place', 'home'], exampleEn: 'The baby is sleeping in the bedroom.', exampleVi: 'Em bé đang ngủ trong phòng ngủ.' },
  { en: 'garden', vi: 'khu vườn', pos: 'noun', ipa: '/ˈɡɑːr.dən/', forms: { plural: 'gardens' }, image: '🏡', tags: ['place'], exampleEn: 'Grandfather is in the garden.', exampleVi: 'Ông đang ở trong vườn.' },
  { en: 'yard', vi: 'sân nhà', pos: 'noun', ipa: '/jɑːrd/', forms: { plural: 'yards' }, image: '🪴', tags: ['place'], exampleEn: 'The dog is running in the yard.', exampleVi: 'Chú chó đang chạy ngoài sân.' },
  { en: 'classroom', vi: 'phòng học', pos: 'noun', ipa: '/ˈklæs.ruːm/', forms: { plural: 'classrooms' }, image: '🏫', tags: ['place', 'school'], exampleEn: 'We are studying in the classroom.', exampleVi: 'Chúng tôi đang học trong lớp.' },
  { en: 'library', vi: 'thư viện', pos: 'noun', ipa: '/ˈlaɪ.brer.i/', forms: { plural: 'libraries' }, image: '📚', tags: ['place'], exampleEn: 'Students are reading in the library.', exampleVi: 'Học sinh đang đọc sách trong thư viện.' },
  { en: 'street', vi: 'đường phố', pos: 'noun', ipa: '/striːt/', forms: { plural: 'streets' }, image: '🛣️', tags: ['place'], exampleEn: 'Cars are running on the street.', exampleVi: 'Những chiếc ô tô đang chạy trên đường.' },
  { en: 'stadium', vi: 'sân vận động', pos: 'noun', ipa: '/ˈsteɪ.di.əm/', forms: { plural: 'stadiums' }, image: '🏟️', tags: ['place', 'sport'], exampleEn: 'They are playing in the stadium.', exampleVi: 'Họ đang chơi trong sân vận động.' },
  { en: 'lake', vi: 'hồ nước', pos: 'noun', ipa: '/leɪk/', forms: { plural: 'lakes' }, image: '🏞️', tags: ['place', 'nature'], exampleEn: 'Ducks are swimming in the lake.', exampleVi: 'Những chú vịt đang bơi trên hồ.' },
  { en: 'river', vi: 'dòng sông', pos: 'noun', ipa: '/ˈrɪv.ɚ/', forms: { plural: 'rivers' }, image: '🌊', tags: ['place', 'nature'], exampleEn: 'A boat is moving on the river.', exampleVi: 'Một chiếc thuyền đang di chuyển trên sông.' },

  // Danh từ tham gia hành động (32)
  { en: 'sandcastle', vi: 'lâu đài cát', pos: 'noun', ipa: '/ˈsændˌkæs.əl/', forms: { plural: 'sandcastles' }, image: '🏰', tags: ['toy'], exampleEn: 'We are building a sandcastle.', exampleVi: 'Chúng tôi đang xây một lâu đài cát.' },
  { en: 'picture', vi: 'bức tranh, ảnh', pos: 'noun', ipa: '/ˈpɪk.tʃɚ/', forms: { plural: 'pictures' }, image: '🖼️', tags: ['art'], exampleEn: 'She is painting a picture.', exampleVi: 'Cô ấy đang vẽ một bức tranh.' },
  { en: 'song', vi: 'bài hát', pos: 'noun', ipa: '/sɔːŋ/', forms: { plural: 'songs' }, image: '🎵', tags: ['music'], exampleEn: 'They are singing a happy song.', exampleVi: 'Họ đang hát một bài hát vui vẻ.' },
  { en: 'storybook', vi: 'sách truyện', pos: 'noun', ipa: '/ˈstɔːr.i.bʊk/', forms: { plural: 'storybooks' }, image: '📕', tags: ['study'], exampleEn: 'He is reading a storybook.', exampleVi: 'Cậu ấy đang đọc một cuốn sách truyện.' },
  { en: 'kite', vi: 'con diều', pos: 'noun', ipa: '/kaɪt/', forms: { plural: 'kites' }, image: '🪁', tags: ['toy'], exampleEn: 'The boy is flying a colorful kite.', exampleVi: 'Cậu bé đang thả một con diều nhiều màu sắc.' },
  { en: 'ball', vi: 'quả bóng', pos: 'noun', ipa: '/bɔːl/', forms: { plural: 'balls' }, image: '⚽', tags: ['toy', 'sport'], exampleEn: 'He is kicking the ball.', exampleVi: 'Cậu ấy đang đá quả bóng.' },
  { en: 'cake', vi: 'bánh ngọt', pos: 'noun', ipa: '/keɪk/', forms: { plural: 'cakes' }, image: '🎂', tags: ['food'], exampleEn: 'Mother is making a birthday cake.', exampleVi: 'Mẹ đang làm một chiếc bánh sinh nhật.' },
  { en: 'rope', vi: 'dây thừng, dây nhảy', pos: 'noun', ipa: '/roʊp/', forms: { plural: 'ropes' }, image: '🪢', tags: ['toy'], exampleEn: 'The girl is jumping rope.', exampleVi: 'Bé gái đang nhảy dây.' },
  { en: 'letter', vi: 'bức thư', pos: 'noun', ipa: '/ˈlet̬.ɚ/', forms: { plural: 'letters' }, image: '✉️', tags: ['study'], exampleEn: 'I am writing a letter.', exampleVi: 'Tôi đang viết một bức thư.' },
  {"en":"dish","vi":"cái đĩa","pos":"noun","ipa":"/dɪʃ/","forms":{"plural":"dishes"},"image":"🍽️","tags":["daily"],"exampleEn":"She is washing a dish.","exampleVi":"Cô ấy đang rửa một cái đĩa."},
  { en: 'comic', vi: 'truyện tranh', pos: 'noun', ipa: '/ˈkɑː.mɪk/', forms: { plural: 'comics' }, image: '💬', tags: ['book'], exampleEn: 'He is reading a comic book.', exampleVi: 'Cậu ấy đang đọc truyện tranh.' },
  { en: 'chess', vi: 'cờ vua', pos: 'noun', ipa: '/tʃes/', image: '♟️', tags: ['game'], exampleEn: 'They are playing chess now.', exampleVi: 'Họ đang chơi cờ vua bây giờ.' },
  { en: 'piano', vi: 'đàn dương cầm', pos: 'noun', ipa: '/piˈæn.oʊ/', forms: { plural: 'pianos' }, image: '🎹', tags: ['music'], exampleEn: 'She is playing the piano.', exampleVi: 'Cô ấy đang chơi đàn dương cầm.' },
  { en: 'guitar', vi: 'đàn ghi-ta', pos: 'noun', ipa: '/ɡɪˈtɑːr/', forms: { plural: 'guitars' }, image: '🎸', tags: ['music'], exampleEn: 'Nam is playing the guitar.', exampleVi: 'Nam đang chơi đàn ghi-ta.' },
  { en: 'television', vi: 'vô tuyến, tivi', pos: 'noun', ipa: '/ˈtel.ə.vɪʒ.ən/', forms: { plural: 'televisions' }, image: '📺', tags: ['object'], exampleEn: 'We are watching television.', exampleVi: 'Chúng tôi đang xem truyền hình.' },
  { en: 'radio', vi: 'đài radio', pos: 'noun', ipa: '/ˈreɪ.di.oʊ/', forms: { plural: 'radios' }, image: '📻', tags: ['object'], exampleEn: 'Grandfather is listening to the radio.', exampleVi: 'Ông đang nghe đài radio.' },
  { en: 'flower', vi: 'bông hoa', pos: 'noun', ipa: '/ˈflaʊ.ɚ/', forms: { plural: 'flowers' }, image: '🌸', tags: ['nature'], exampleEn: 'She is watering the flowers.', exampleVi: 'Cô ấy đang tưới hoa.' },
  { en: 'tree', vi: 'cây xanh', pos: 'noun', ipa: '/triː/', forms: { plural: 'trees' }, image: '🌳', tags: ['nature'], exampleEn: 'They are watering green trees.', exampleVi: 'Họ đang tưới những cây xanh.' },
  { en: 'lunch', vi: 'bữa trưa', pos: 'noun', ipa: '/lʌntʃ/', forms: { plural: 'lunches' }, image: '🍱', tags: ['food'], exampleEn: 'We are eating lunch together.', exampleVi: 'Chúng tôi đang cùng nhau ăn trưa.' },
  { en: 'breakfast', vi: 'bữa sáng', pos: 'noun', ipa: '/ˈbrek.fəst/', forms: { plural: 'breakfasts' }, image: '🥞', tags: ['food'], exampleEn: 'He is eating breakfast now.', exampleVi: 'Cậu ấy đang ăn sáng bây giờ.' },
  { en: 'dinner', vi: 'bữa tối', pos: 'noun', ipa: '/ˈdɪn.ər/', forms: { plural: 'dinners' }, image: '🍲', tags: ['food'], exampleEn: 'They are having dinner.', exampleVi: 'Họ đang ăn bữa tối.' },
  { en: 'apple', vi: 'quả táo', pos: 'noun', ipa: '/ˈæp.əl/', forms: { plural: 'apples' }, image: '🍎', tags: ['food'], exampleEn: 'She is peeling an apple.', exampleVi: 'Cô ấy đang gọt quả táo.' },
  { en: 'banana', vi: 'quả chuối', pos: 'noun', ipa: '/bəˈnæn.ə/', forms: { plural: 'bananas' }, image: '🍌', tags: ['food'], exampleEn: 'The monkey is eating a banana.', exampleVi: 'Con khỉ đang ăn một quả chuối.' },
  { en: 'sandwich', vi: 'bánh mì kẹp', pos: 'noun', ipa: '/ˈsæn.wɪtʃ/', forms: { plural: 'sandwiches' }, image: '🥪', tags: ['food'], exampleEn: 'He is eating a delicious sandwich.', exampleVi: 'Cậu ấy đang ăn một chiếc bánh mì kẹp thơm ngon.' },
  { en: 'milk', vi: 'sữa', pos: 'noun', ipa: '/mɪlk/', image: '🥛', tags: ['drink'], exampleEn: 'The kitten is drinking milk.', exampleVi: 'Mèo con đang uống sữa.' },
  { en: 'soup', vi: 'món canh, món súp', pos: 'noun', ipa: '/suːp/', image: '🍲', tags: ['food'], exampleEn: 'He is eating warm soup.', exampleVi: 'Cậu ấy đang ăn món súp ấm nóng.' },
  { en: 'juice', vi: 'nước hoa quả', pos: 'noun', ipa: '/dʒuːs/', image: '🧃', tags: ['drink'], exampleEn: 'We are drinking fruit juice.', exampleVi: 'Chúng tôi đang uống nước trái cây.' },
  { en: 'homework', vi: 'bài tập về nhà', pos: 'noun', ipa: '/ˈhoʊm.wɜːrk/', image: '📝', tags: ['school'], exampleEn: 'Lan is doing her homework.', exampleVi: 'Lan đang làm bài tập về nhà.' },
  { en: 'door', vi: 'cửa ra vào', pos: 'noun', ipa: '/dɔːr/', forms: { plural: 'doors' }, image: '🚪', tags: ['object'], exampleEn: 'He is opening the door.', exampleVi: 'Cậu ấy đang mở cửa.' },
  { en: 'window', vi: 'cửa sổ', pos: 'noun', ipa: '/ˈwɪn.doʊ/', forms: { plural: 'windows' }, image: '🪟', tags: ['object'], exampleEn: 'She is looking out the window.', exampleVi: 'Cô ấy đang nhìn ra ngoài cửa sổ.' },
  { en: 'car', vi: 'xe ô tô', pos: 'noun', ipa: '/kɑːr/', forms: { plural: 'cars' }, image: '🚗', tags: ['transport'], exampleEn: 'He is washing his car.', exampleVi: 'Cậu ấy đang rửa xe ô tô.' },
  { en: 'bicycle', vi: 'xe đạp', pos: 'noun', ipa: '/ˈbaɪ.sə.kəl/', forms: { plural: 'bicycles' }, image: '🚲', tags: ['transport'], exampleEn: 'She is riding her bicycle.', exampleVi: 'Cô ấy đang đạp xe đạp.' }
];

const finalVocab = vocabList.map((item, idx) => ({
  id: `B2-v-${String(idx + 1).padStart(4, '0')}`,
  level: 'B2',
  topic: 'present-continuous',
  ...item,
  source: 'seed'
}));

fs.writeFileSync(path.join(DATA_DIR, 'B2.vocab.json'), JSON.stringify(applyContentReviewV4('B2.vocab.json', finalVocab), null, 2), 'utf-8');
console.log(`✅ Generated B2.vocab.json with ${finalVocab.length} words (target ≥ 100).`);
