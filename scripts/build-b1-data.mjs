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
// VOCABULARY B1 (>= 105 words)
// Tập trung động từ sinh hoạt hàng ngày, ngày trong tuần, buổi, thói quen
// -------------------------------------------------------------
const vocabList = [
  // Động từ sinh hoạt cơ bản (40)
  { en: 'play', vi: 'chơi', pos: 'verb', ipa: '/pleɪ/', forms: { thirdSg: 'plays', past: 'played', ing: 'playing', irregular: false }, image: '🎮', tags: ['action', 'hobby'], exampleEn: 'She plays badminton.', exampleVi: 'Cô ấy chơi cầu lông.' },
  { en: 'read', vi: 'đọc', pos: 'verb', ipa: '/riːd/', forms: { thirdSg: 'reads', past: 'read', ing: 'reading', irregular: true }, image: '📖', tags: ['action', 'study'], exampleEn: 'He reads books every day.', exampleVi: 'Cậu ấy đọc sách mỗi ngày.' },
  { en: 'write', vi: 'viết', pos: 'verb', ipa: '/raɪt/', forms: { thirdSg: 'writes', past: 'wrote', ing: 'writing', irregular: true }, image: '✍️', tags: ['action', 'study'], exampleEn: 'I write a letter to my friend.', exampleVi: 'Tôi viết một bức thư cho bạn tôi.' },
  { en: 'eat', vi: 'ăn', pos: 'verb', ipa: '/iːt/', forms: { thirdSg: 'eats', past: 'ate', ing: 'eating', irregular: true }, image: '🍽️', tags: ['action', 'daily'], exampleEn: 'They eat breakfast at seven.', exampleVi: 'Họ ăn sáng lúc bảy giờ.' },
  { en: 'drink', vi: 'uống', pos: 'verb', ipa: '/drɪŋk/', forms: { thirdSg: 'drinks', past: 'drank', ing: 'drinking', irregular: true }, image: '🥛', tags: ['action', 'daily'], exampleEn: 'She drinks warm milk.', exampleVi: 'Cô ấy uống sữa ấm.' },
  { en: 'sleep', vi: 'ngủ', pos: 'verb', ipa: '/sliːp/', forms: { thirdSg: 'sleeps', past: 'slept', ing: 'sleeping', irregular: true }, image: '😴', tags: ['action', 'daily'], exampleEn: 'The cat sleeps on the sofa.', exampleVi: 'Con mèo ngủ trên ghế sofa.' },
  { en: 'wake', vi: 'thức giấc', pos: 'verb', ipa: '/weɪk/', forms: { thirdSg: 'wakes', past: 'woke', ing: 'waking', irregular: true }, image: '⏰', tags: ['action', 'daily'], exampleEn: 'He wakes up early.', exampleVi: 'Cậu ấy thức dậy sớm.' },
  { en: 'wash', vi: 'rửa, giặt', pos: 'verb', ipa: '/wɑːʃ/', forms: { thirdSg: 'washes', past: 'washed', ing: 'washing', irregular: false }, image: '🧼', tags: ['action', 'daily'], exampleEn: 'She washes her hands.', exampleVi: 'Cô ấy rửa tay.' },
  { en: 'brush', vi: 'chải, đánh (răng)', pos: 'verb', ipa: '/brʌʃ/', forms: { thirdSg: 'brushes', past: 'brushed', ing: 'brushing', irregular: false }, image: '🪥', tags: ['action', 'daily'], exampleEn: 'I brush my teeth every morning.', exampleVi: 'Tôi đánh răng mỗi sáng.' },
  { en: 'cook', vi: 'nấu ăn', pos: 'verb', ipa: '/kʊk/', forms: { thirdSg: 'cooks', past: 'cooked', ing: 'cooking', irregular: false }, image: '🍳', tags: ['action', 'daily'], exampleEn: 'My mother cooks dinner.', exampleVi: 'Mẹ tôi nấu bữa tối.' },
  { en: 'study', vi: 'học tập, nghiên cứu', pos: 'verb', ipa: '/ˈstʌd.i/', forms: { thirdSg: 'studies', past: 'studied', ing: 'studying', irregular: false }, image: '📚', tags: ['action', 'school'], exampleEn: 'Nam studies English on Monday.', exampleVi: 'Nam học tiếng Anh vào thứ Hai.' },
  { en: 'learn', vi: 'học hỏi', pos: 'verb', ipa: '/lɜːrn/', forms: { thirdSg: 'learns', past: 'learned', ing: 'learning', irregular: false }, image: '💡', tags: ['action', 'school'], exampleEn: 'We learn new words.', exampleVi: 'Chúng tôi học những từ mới.' },
  { en: 'watch', vi: 'xem, theo dõi', pos: 'verb', ipa: '/wɑːtʃ/', forms: { thirdSg: 'watches', past: 'watched', ing: 'watching', irregular: false }, image: '📺', tags: ['action', 'daily'], exampleEn: 'He watches television in the evening.', exampleVi: 'Cậu ấy xem tivi vào buổi tối.' },
  { en: 'listen', vi: 'lắng nghe', pos: 'verb', ipa: '/ˈlɪs.ən/', forms: { thirdSg: 'listens', past: 'listened', ing: 'listening', irregular: false }, image: '🎧', tags: ['action'], exampleEn: 'She listens to music.', exampleVi: 'Cô ấy nghe nhạc.' },
  { en: 'speak', vi: 'nói (ngôn ngữ)', pos: 'verb', ipa: '/spiːk/', forms: { thirdSg: 'speaks', past: 'spoke', ing: 'speaking', irregular: true }, image: '🗣️', tags: ['action'], exampleEn: 'They speak English well.', exampleVi: 'Họ nói tiếng Anh giỏi.' },
  { en: 'sing', vi: 'hát', pos: 'verb', ipa: '/sɪŋ/', forms: { thirdSg: 'sings', past: 'sang', ing: 'singing', irregular: true }, image: '🎤', tags: ['action', 'hobby'], exampleEn: 'The bird sings in the tree.', exampleVi: 'Chú chim hót trên cây.' },
  { en: 'dance', vi: 'nhảy múa', pos: 'verb', ipa: '/dæns/', forms: { thirdSg: 'dances', past: 'danced', ing: 'dancing', irregular: false }, image: '💃', tags: ['action', 'hobby'], exampleEn: 'Lan dances very well.', exampleVi: 'Lan nhảy múa rất đẹp.' },
  { en: 'swim', vi: 'bơi lội', pos: 'verb', ipa: '/swɪm/', forms: { thirdSg: 'swims', past: 'swam', ing: 'swimming', irregular: true }, image: '🏊', tags: ['action', 'sport'], exampleEn: 'He swims on Saturday.', exampleVi: 'Cậu ấy đi bơi vào thứ Bảy.' },
  { en: 'run', vi: 'chạy', pos: 'verb', ipa: '/rʌn/', forms: { thirdSg: 'runs', past: 'ran', ing: 'running', irregular: true }, image: '🏃', tags: ['action', 'sport'], exampleEn: 'The dog runs fast.', exampleVi: 'Chú chó chạy nhanh.' },
  { en: 'walk', vi: 'đi bộ', pos: 'verb', ipa: '/wɔːk/', forms: { thirdSg: 'walks', past: 'walked', ing: 'walking', irregular: false }, image: '🚶', tags: ['action'], exampleEn: 'We walk to school.', exampleVi: 'Chúng tôi đi bộ đến trường.' },
  { en: 'jump', vi: 'nhảy lên', pos: 'verb', ipa: '/dʒʌmp/', forms: { thirdSg: 'jumps', past: 'jumped', ing: 'jumping', irregular: false }, image: '🦘', tags: ['action'], exampleEn: 'The rabbit jumps high.', exampleVi: 'Con thỏ nhảy cao.' },
  { en: 'help', vi: 'giúp đỡ', pos: 'verb', ipa: '/help/', forms: { thirdSg: 'helps', past: 'helped', ing: 'helping', irregular: false }, image: '🤝', tags: ['action'], exampleEn: 'She helps her mother.', exampleVi: 'Cô bé giúp đỡ mẹ mình.' },
  { en: 'clean', vi: 'lau dọn, làm sạch', pos: 'verb', ipa: '/kliːn/', forms: { thirdSg: 'cleans', past: 'cleaned', ing: 'cleaning', irregular: false }, image: '🧹', tags: ['action', 'daily'], exampleEn: 'He cleans his room.', exampleVi: 'Cậu ấy dọn dẹp phòng của mình.' },
  { en: 'open', vi: 'mở ra', pos: 'verb', ipa: '/ˈoʊ.pən/', forms: { thirdSg: 'opens', past: 'opened', ing: 'opening', irregular: false }, image: '🚪', tags: ['action'], exampleEn: 'The teacher opens the door.', exampleVi: 'Thầy giáo mở cửa.' },
  { en: 'close', vi: 'đóng lại', pos: 'verb', ipa: '/kloʊz/', forms: { thirdSg: 'closes', past: 'closed', ing: 'closing', irregular: false }, image: '📕', tags: ['action'], exampleEn: 'Students close their books.', exampleVi: 'Học sinh đóng sách lại.' },
  { en: 'like', vi: 'thích', pos: 'verb', ipa: '/laɪk/', forms: { thirdSg: 'likes', past: 'liked', ing: 'liking', irregular: false }, image: '👍', tags: ['feeling'], exampleEn: 'I like apples.', exampleVi: 'Tôi thích táo.' },
  { en: 'love', vi: 'yêu mến', pos: 'verb', ipa: '/lʌv/', forms: { thirdSg: 'loves', past: 'loved', ing: 'loving', irregular: false }, image: '❤️', tags: ['feeling'], exampleEn: 'She loves her cat.', exampleVi: 'Cô ấy yêu chú mèo của mình.' },
  { en: 'hate', vi: 'ghét', pos: 'verb', ipa: '/heɪt/', forms: { thirdSg: 'hates', past: 'hated', ing: 'hating', irregular: false }, image: '👎', tags: ['feeling'], exampleEn: 'He hates spiders.', exampleVi: 'Cậu ấy ghét nhện.' },
  { en: 'want', vi: 'muốn', pos: 'verb', ipa: '/wɑːnt/', forms: { thirdSg: 'wants', past: 'wanted', ing: 'wanting', irregular: false }, image: '🙋', tags: ['feeling'], exampleEn: 'We want some water.', exampleVi: 'Chúng tôi muốn một chút nước.' },
  { en: 'need', vi: 'cần', pos: 'verb', ipa: '/niːd/', forms: { thirdSg: 'needs', past: 'needed', ing: 'needing', irregular: false }, image: '❗', tags: ['feeling'], exampleEn: 'He needs a new pencil.', exampleVi: 'Cậu ấy cần một chiếc bút chì mới.' },
  { en: 'know', vi: 'biết, hiểu', pos: 'verb', ipa: '/noʊ/', forms: { thirdSg: 'knows', past: 'knew', ing: 'knowing', irregular: true }, image: '🧠', tags: ['feeling'], exampleEn: 'They know the answer.', exampleVi: 'Họ biết câu trả lời.' },
  { en: 'live', vi: 'sống, cư trú', pos: 'verb', ipa: '/lɪv/', forms: { thirdSg: 'lives', past: 'lived', ing: 'living', irregular: false }, image: '🏡', tags: ['action'], exampleEn: 'She lives in Hanoi.', exampleVi: 'Cô ấy sống ở Hà Nội.' },
  { en: 'work', vi: 'làm việc', pos: 'verb', ipa: '/wɜːrk/', forms: { thirdSg: 'works', past: 'worked', ing: 'working', irregular: false }, image: '💼', tags: ['action'], exampleEn: 'My father works in a hospital.', exampleVi: 'Bố tôi làm việc ở bệnh viện.' },
  { en: 'teach', vi: 'dạy học', pos: 'verb', ipa: '/tiːtʃ/', forms: { thirdSg: 'teaches', past: 'taught', ing: 'teaching', irregular: true }, image: '🧑‍🏫', tags: ['action', 'school'], exampleEn: 'She teaches English.', exampleVi: 'Cô ấy dạy tiếng Anh.' },
  { en: 'fly', vi: 'bay', pos: 'verb', ipa: '/flaɪ/', forms: { thirdSg: 'flies', past: 'flew', ing: 'flying', irregular: true }, image: '🪁', tags: ['action'], exampleEn: 'The bird flies high.', exampleVi: 'Chú chim bay cao.' },
  { en: 'catch', vi: 'bắt, chụp', pos: 'verb', ipa: '/kætʃ/', forms: { thirdSg: 'catches', past: 'caught', ing: 'catching', irregular: true }, image: '🧤', tags: ['action'], exampleEn: 'The cat catches a mouse.', exampleVi: 'Con mèo bắt một con chuột.' },
  { en: 'ride', vi: 'cưỡi, đạp (xe)', pos: 'verb', ipa: '/raɪd/', forms: { thirdSg: 'rides', past: 'rode', ing: 'riding', irregular: true }, image: '🚴', tags: ['action', 'transport'], exampleEn: 'He rides his bike to school.', exampleVi: 'Cậu ấy đạp xe đến trường.' },
  { en: 'drive', vi: 'lái xe ô tô', pos: 'verb', ipa: '/draɪv/', forms: { thirdSg: 'drives', past: 'drove', ing: 'driving', irregular: true }, image: '🚗', tags: ['action', 'transport'], exampleEn: 'My uncle drives a car.', exampleVi: 'Chú tôi lái xe ô tô.' },
  { en: 'buy', vi: 'mua', pos: 'verb', ipa: '/baɪ/', forms: { thirdSg: 'buys', past: 'bought', ing: 'buying', irregular: true }, image: '🛒', tags: ['action'], exampleEn: 'She buys apples at the market.', exampleVi: 'Cô ấy mua táo ở chợ.' },
  { en: 'see', vi: 'nhìn thấy', pos: 'verb', ipa: '/siː/', forms: { thirdSg: 'sees', past: 'saw', ing: 'seeing', irregular: true }, image: '👀', tags: ['action'], exampleEn: 'I see a yellow bird.', exampleVi: 'Tôi nhìn thấy một chú chim vàng.' },

  // Trạng từ tần suất (6)
  { en: 'always', vi: 'luôn luôn (100%)', pos: 'adverb', ipa: '/ˈɔːl.weɪz/', image: '💯', tags: ['frequency'], exampleEn: 'He always gets up early.', exampleVi: 'Cậu ấy luôn luôn thức dậy sớm.' },
  { en: 'usually', vi: 'thường xuyên (~80%)', pos: 'adverb', ipa: '/ˈjuː.ʒu.ə.li/', image: '🔄', tags: ['frequency'], exampleEn: 'She usually walks to school.', exampleVi: 'Cô ấy thường xuyên đi bộ đến trường.' },
  { en: 'often', vi: 'thường (~60%)', pos: 'adverb', ipa: '/ˈɔːf.ən/', image: '🔁', tags: ['frequency'], exampleEn: 'They often play soccer.', exampleVi: 'Họ thường chơi bóng đá.' },
  { en: 'sometimes', vi: 'thỉnh thoảng (~40%)', pos: 'adverb', ipa: '/ˈsʌm.taɪmz/', image: '🎲', tags: ['frequency'], exampleEn: 'I sometimes read comics.', exampleVi: 'Thỉnh thoảng tôi đọc truyện tranh.' },
  { en: 'rarely', vi: 'hiếm khi (~10%)', pos: 'adverb', ipa: '/ˈrer.li/', image: '⏳', tags: ['frequency'], exampleEn: 'He rarely eats candy.', exampleVi: 'Cậu ấy hiếm khi ăn kẹo.' },
  { en: 'never', vi: 'không bao giờ (0%)', pos: 'adverb', ipa: '/ˈnev.ər/', image: '🚫', tags: ['frequency'], exampleEn: 'She never drinks coffee.', exampleVi: 'Cô ấy không bao giờ uống cà phê.' },

  // Ngày trong tuần (7)
  { en: 'Monday', vi: 'thứ Hai', pos: 'noun', ipa: '/ˈmʌn.deɪ/', forms: { plural: 'Mondays' }, image: '📅', tags: ['time', 'day'], exampleEn: 'We have English on Monday.', exampleVi: 'Chúng tôi có môn tiếng Anh vào thứ Hai.' },
  { en: 'Tuesday', vi: 'thứ Ba', pos: 'noun', ipa: '/ˈtuːz.deɪ/', forms: { plural: 'Tuesdays' }, image: '📅', tags: ['time', 'day'], exampleEn: 'She plays piano on Tuesday.', exampleVi: 'Cô ấy chơi đàn dương cầm vào thứ Ba.' },
  { en: 'Wednesday', vi: 'thứ Tư', pos: 'noun', ipa: '/ˈwenz.deɪ/', forms: { plural: 'Wednesdays' }, image: '📅', tags: ['time', 'day'], exampleEn: 'He visits his grandparents on Wednesday.', exampleVi: 'Cậu ấy thăm ông bà vào thứ Tư.' },
  { en: 'Thursday', vi: 'thứ Năm', pos: 'noun', ipa: '/ˈθɜːrz.deɪ/', forms: { plural: 'Thursdays' }, image: '📅', tags: ['time', 'day'], exampleEn: 'They swim on Thursday.', exampleVi: 'Họ đi bơi vào thứ Năm.' },
  { en: 'Friday', vi: 'thứ Sáu', pos: 'noun', ipa: '/ˈfraɪ.deɪ/', forms: { plural: 'Fridays' }, image: '📅', tags: ['time', 'day'], exampleEn: 'I clean my room on Friday.', exampleVi: 'Tôi dọn phòng vào thứ Sáu.' },
  { en: 'Saturday', vi: 'thứ Bảy', pos: 'noun', ipa: '/ˈsæt̬.ɚ.deɪ/', forms: { plural: 'Saturdays' }, image: '🏖️', tags: ['time', 'day'], exampleEn: 'We play games on Saturday.', exampleVi: 'Chúng tôi chơi trò chơi vào thứ Bảy.' },
  { en: 'Sunday', vi: 'Chủ nhật', pos: 'noun', ipa: '/ˈsʌn.deɪ/', forms: { plural: 'Sundays' }, image: '☀️', tags: ['time', 'day'], exampleEn: 'They go to the park on Sunday.', exampleVi: 'Họ đi công viên vào Chủ nhật.' },

  // Buổi trong ngày & Từ chỉ thời gian (10)
  { en: 'morning', vi: 'buổi sáng', pos: 'noun', ipa: '/ˈmɔːr.nɪŋ/', forms: { plural: 'mornings' }, image: '🌅', tags: ['time'], exampleEn: 'He jogs in the morning.', exampleVi: 'Cậu ấy chạy bộ vào buổi sáng.' },
  { en: 'afternoon', vi: 'buổi chiều', pos: 'noun', ipa: '/ˌæf.tɚˈnuːn/', forms: { plural: 'afternoons' }, image: '☀️', tags: ['time'], exampleEn: 'She does homework in the afternoon.', exampleVi: 'Cô ấy làm bài tập về nhà vào buổi chiều.' },
  { en: 'evening', vi: 'buổi tối', pos: 'noun', ipa: '/ˈiːv.nɪŋ/', forms: { plural: 'evenings' }, image: '🌆', tags: ['time'], exampleEn: 'We watch TV in the evening.', exampleVi: 'Chúng tôi xem tivi vào buổi tối.' },
  { en: 'night', vi: 'ban đêm', pos: 'noun', ipa: '/naɪt/', forms: { plural: 'nights' }, image: '🌙', tags: ['time'], exampleEn: 'They sleep at night.', exampleVi: 'Họ ngủ vào ban đêm.' },
  { en: 'breakfast', vi: 'bữa ăn sáng', pos: 'noun', ipa: '/ˈbrek.fəst/', forms: { plural: 'breakfasts' }, image: '🥞', tags: ['food', 'daily'], exampleEn: 'I eat bread for breakfast.', exampleVi: 'Tôi ăn bánh mì cho bữa sáng.' },
  { en: 'lunch', vi: 'bữa ăn trưa', pos: 'noun', ipa: '/lʌntʃ/', forms: { plural: 'lunches' }, image: '🍱', tags: ['food', 'daily'], exampleEn: 'She has rice for lunch.', exampleVi: 'Cô ấy ăn cơm cho bữa trưa.' },
  { en: 'dinner', vi: 'bữa ăn tối', pos: 'noun', ipa: '/ˈdɪn.ər/', forms: { plural: 'dinners' }, image: '🍲', tags: ['food', 'daily'], exampleEn: 'We eat dinner together.', exampleVi: 'Chúng tôi ăn tối cùng nhau.' },
  { en: 'weekend', vi: 'cuối tuần', pos: 'noun', ipa: '/ˈwiːk.end/', forms: { plural: 'weekends' }, image: '🎉', tags: ['time'], exampleEn: 'He relaxes at the weekend.', exampleVi: 'Cậu ấy thư giãn vào cuối tuần.' },
  { en: 'every day', vi: 'mỗi ngày', pos: 'adverb', ipa: '/ˌev.ri ˈdeɪ/', image: '📆', tags: ['time'], exampleEn: 'I brush my teeth every day.', exampleVi: 'Tôi đánh răng mỗi ngày.' },
  { en: 'early', vi: 'sớm', pos: 'adverb', ipa: '/ˈɜːr.li/', image: '⏰', tags: ['time'], exampleEn: 'She gets up early.', exampleVi: 'Cô ấy thức dậy sớm.' },

  // Danh từ môn học, đồ ăn, đồ uống, hoạt động (25)
  { en: 'homework', vi: 'bài tập về nhà', pos: 'noun', ipa: '/ˈhoʊm.wɜːrk/', image: '📝', tags: ['school'], exampleEn: 'He does his homework.', exampleVi: 'Cậu ấy làm bài tập về nhà.' },
  { en: 'music', vi: 'âm nhạc', pos: 'noun', ipa: '/ˈmjuː.zɪk/', image: '🎵', tags: ['hobby'], exampleEn: 'She likes pop music.', exampleVi: 'Cô ấy thích nhạc pop.' },
  { en: 'soccer', vi: 'môn bóng đá', pos: 'noun', ipa: '/ˈsɑː.kɚ/', image: '⚽', tags: ['sport'], exampleEn: 'They play soccer after school.', exampleVi: 'Họ chơi bóng đá sau giờ học.' },
  { en: 'tennis', vi: 'môn quần vợt', pos: 'noun', ipa: '/ˈten.ɪs/', image: '🎾', tags: ['sport'], exampleEn: 'Nam plays tennis with his father.', exampleVi: 'Nam chơi quần vợt với bố cậu ấy.' },
  { en: 'badminton', vi: 'môn cầu lông', pos: 'noun', ipa: '/ˈbæd.mɪn.tən/', image: '🏸', tags: ['sport'], exampleEn: 'We play badminton in the park.', exampleVi: 'Chúng tôi chơi cầu lông trong công viên.' },
  { en: 'chess', vi: 'cờ vua', pos: 'noun', ipa: '/tʃes/', image: '♟️', tags: ['game'], exampleEn: 'He plays chess with Tom.', exampleVi: 'Cậu ấy chơi cờ vua với Tom.' },
  { en: 'guitar', vi: 'đàn ghi-ta', pos: 'noun', ipa: '/ɡɪˈtɑːr/', forms: { plural: 'guitars' }, image: '🎸', tags: ['music'], exampleEn: 'She plays the guitar.', exampleVi: 'Cô ấy chơi đàn ghi-ta.' },
  { en: 'piano', vi: 'đàn dương cầm', pos: 'noun', ipa: '/piˈæn.oʊ/', forms: { plural: 'pianos' }, image: '🎹', tags: ['music'], exampleEn: 'Lan plays the piano well.', exampleVi: 'Lan chơi đàn piano giỏi.' },
  { en: 'math', vi: 'môn toán', pos: 'noun', ipa: '/mæθ/', image: '📐', tags: ['school'], exampleEn: 'I like math.', exampleVi: 'Tôi thích môn toán.' },
  { en: 'English', vi: 'tiếng Anh', pos: 'noun', ipa: '/ˈɪŋ.ɡlɪʃ/', image: '🇬🇧', tags: ['school'], exampleEn: 'They learn English every day.', exampleVi: 'Họ học tiếng Anh mỗi ngày.' },
  { en: 'science', vi: 'môn khoa học', pos: 'noun', ipa: '/ˈsaɪ.əns/', image: '🔬', tags: ['school'], exampleEn: 'He loves science.', exampleVi: 'Cậu ấy yêu thích môn khoa học.' },
  { en: 'art', vi: 'môn mỹ thuật', pos: 'noun', ipa: '/ɑːrt/', image: '🎨', tags: ['school'], exampleEn: 'She likes art.', exampleVi: 'Cô ấy thích mỹ thuật.' },
  { en: 'bread', vi: 'bánh mì', pos: 'noun', ipa: '/bred/', image: '🍞', tags: ['food'], exampleEn: 'We eat bread for breakfast.', exampleVi: 'Chúng tôi ăn bánh mì cho bữa sáng.' },
  { en: 'rice', vi: 'cơm, gạo', pos: 'noun', ipa: '/raɪs/', image: '🍚', tags: ['food'], exampleEn: 'Vietnamese people eat rice.', exampleVi: 'Người Việt Nam ăn cơm.' },
  { en: 'meat', vi: 'thịt', pos: 'noun', ipa: '/miːt/', image: '🥩', tags: ['food'], exampleEn: 'The tiger eats meat.', exampleVi: 'Con hổ ăn thịt.' },
  { en: 'fish', vi: 'cá', pos: 'noun', ipa: '/fɪʃ/', forms: { plural: 'fish' }, image: '🐟', tags: ['food'], exampleEn: 'Cats love fish.', exampleVi: 'Mèo thích cá.' },
  {"en":"vegetable","vi":"loại rau hoặc củ","pos":"noun","ipa":"/ˈvedʒ.tə.bəl/","forms":{"plural":"vegetables"},"image":"🥦","tags":["food"],"exampleEn":"He eats fresh vegetables every day.","exampleVi":"Cậu ấy ăn rau củ tươi mỗi ngày."},
  { en: 'fruit', vi: 'trái cây', pos: 'noun', ipa: '/fruːt/', image: '🍎', tags: ['food'], exampleEn: 'I eat fruit every day.', exampleVi: 'Tôi ăn trái cây mỗi ngày.' },
  { en: 'water', vi: 'nước uống', pos: 'noun', ipa: '/ˈwɑː.t̬ɚ/', image: '💧', tags: ['drink'], exampleEn: 'She drinks a lot of water.', exampleVi: 'Cô ấy uống nhiều nước.' },
  { en: 'milk', vi: 'sữa tươi', pos: 'noun', ipa: '/mɪlk/', image: '🥛', tags: ['drink'], exampleEn: 'Babies drink milk.', exampleVi: 'Em bé uống sữa.' },
  { en: 'juice', vi: 'nước ép trái cây', pos: 'noun', ipa: '/dʒuːs/', image: '🧃', tags: ['drink'], exampleEn: 'He likes orange juice.', exampleVi: 'Cậu ấy thích nước cam ép.' },
  { en: 'tea', vi: 'trà', pos: 'noun', ipa: '/tiː/', image: '🍵', tags: ['drink'], exampleEn: 'My grandfather drinks green tea.', exampleVi: 'Ông tôi uống trà xanh.' },
  { en: 'coffee', vi: 'cà phê', pos: 'noun', ipa: '/ˈkɑː.fi/', image: '☕', tags: ['drink'], exampleEn: 'My father drinks black coffee.', exampleVi: 'Bố tôi uống cà phê đen.' },
  { en: 'bicycle', vi: 'xe đạp', pos: 'noun', ipa: '/ˈbaɪ.sə.kəl/', forms: { plural: 'bicycles' }, image: '🚲', tags: ['transport'], exampleEn: 'He rides his bicycle.', exampleVi: 'Cậu ấy đi xe đạp.' },
  { en: 'bus', vi: 'xe buýt', pos: 'noun', ipa: '/bʌs/', forms: { plural: 'buses' }, image: '🚌', tags: ['transport'], exampleEn: 'We take the school bus.', exampleVi: 'Chúng tôi đi xe buýt trường học.' },
  { en: 'start', vi: 'bắt đầu', pos: 'verb', ipa: '/stɑːrt/', forms: { thirdSg: 'starts', past: 'started', ing: 'starting', irregular: false }, image: '🏁', tags: ['action'], exampleEn: 'Class starts at eight.', exampleVi: 'Lớp học bắt đầu lúc tám giờ.' },
  { en: 'finish', vi: 'kết thúc, hoàn thành', pos: 'verb', ipa: '/ˈfɪn.ɪʃ/', forms: { thirdSg: 'finishes', past: 'finished', ing: 'finishing', irregular: false }, image: '🏁', tags: ['action'], exampleEn: 'He finishes work at five.', exampleVi: 'Cậu ấy kết thúc công việc lúc năm giờ.' },
  { en: 'arrive', vi: 'đến nơi', pos: 'verb', ipa: '/əˈraɪv/', forms: { thirdSg: 'arrives', past: 'arrived', ing: 'arriving', irregular: false }, image: '🛬', tags: ['action'], exampleEn: 'The train arrives on time.', exampleVi: 'Chuyến tàu đến đúng giờ.' },
  { en: 'leave', vi: 'rời khỏi, đi', pos: 'verb', ipa: '/liːv/', forms: { thirdSg: 'leaves', past: 'left', ing: 'leaving', irregular: true }, image: '🚶', tags: ['action'], exampleEn: 'They leave home at seven.', exampleVi: 'Họ rời nhà lúc bảy giờ.' },
  { en: 'visit', vi: 'thăm, viếng', pos: 'verb', ipa: '/ˈvɪz.ɪt/', forms: { thirdSg: 'visits', past: 'visited', ing: 'visiting', irregular: false }, image: '🏡', tags: ['action'], exampleEn: 'We visit grandparents on Sunday.', exampleVi: 'Chúng tôi thăm ông bà vào Chủ nhật.' },
  { en: 'meet', vi: 'gặp gỡ', pos: 'verb', ipa: '/miːt/', forms: { thirdSg: 'meets', past: 'met', ing: 'meeting', irregular: true }, image: '🤝', tags: ['action'], exampleEn: 'I meet my friends at school.', exampleVi: 'Tôi gặp bạn bè ở trường.' },
  { en: 'travel', vi: 'du lịch, đi lại', pos: 'verb', ipa: '/ˈtræv.əl/', forms: { thirdSg: 'travels', past: 'traveled', ing: 'traveling', irregular: false }, image: '✈️', tags: ['action'], exampleEn: 'They travel by train.', exampleVi: 'Họ đi du lịch bằng tàu hỏa.' },
  { en: 'stay', vi: 'ở lại, lưu trú', pos: 'verb', ipa: '/steɪ/', forms: { thirdSg: 'stays', past: 'stayed', ing: 'staying', irregular: false }, image: '🏠', tags: ['action'], exampleEn: 'He stays at home on rainy days.', exampleVi: 'Cậu ấy ở nhà vào những ngày mưa.' },
  { en: 'wear', vi: 'mặc, đội', pos: 'verb', ipa: '/wer/', forms: { thirdSg: 'wears', past: 'wore', ing: 'wearing', irregular: true }, image: '👕', tags: ['action', 'clothes'], exampleEn: 'She wears a uniform to school.', exampleVi: 'Cô ấy mặc đồng phục đến trường.' },
  { en: 'doctor', vi: 'bác sĩ', pos: 'noun', ipa: '/ˈdɑːk.tɚ/', forms: { plural: 'doctors' }, image: '👨‍⚕️', tags: ['job'], exampleEn: 'My father is a doctor.', exampleVi: 'Bố tôi là bác sĩ.' },
  { en: 'nurse', vi: 'y tá', pos: 'noun', ipa: '/nɜːrs/', forms: { plural: 'nurses' }, image: '👩‍⚕️', tags: ['job'], exampleEn: 'Her aunt is a nurse.', exampleVi: 'Dì của cô ấy là y tá.' },
  { en: 'farmer', vi: 'nông dân', pos: 'noun', ipa: '/ˈfɑːr.mɚ/', forms: { plural: 'farmers' }, image: '👨‍🌾', tags: ['job'], exampleEn: 'The farmer works in the field.', exampleVi: 'Bác nông dân làm việc trên cánh đồng.' },
  { en: 'driver', vi: 'tài xế', pos: 'noun', ipa: '/ˈdraɪ.vɚ/', forms: { plural: 'drivers' }, image: '👨‍✈️', tags: ['job'], exampleEn: 'He is a bus driver.', exampleVi: 'Chú ấy là một tài xế xe buýt.' },
  { en: 'student', vi: 'học sinh', pos: 'noun', ipa: '/ˈstuː.dənt/', forms: { plural: 'students' }, image: '🧑‍🎓', tags: ['job', 'school'], exampleEn: 'We are good students.', exampleVi: 'Chúng tôi là những học sinh ngoan.' },
  { en: 'school', vi: 'ngôi trường', pos: 'noun', ipa: '/skuːl/', forms: { plural: 'schools' }, image: '🏫', tags: ['place', 'school'], exampleEn: 'Our school is big.', exampleVi: 'Trường của chúng tôi rất to.' },
  { en: 'hospital', vi: 'bệnh viện', pos: 'noun', ipa: '/ˈhɑː.spɪ.t̬əl/', forms: { plural: 'hospitals' }, image: '🏥', tags: ['place'], exampleEn: 'She works in a hospital.', exampleVi: 'Cô ấy làm việc ở bệnh viện.' },
  { en: 'park', vi: 'công viên', pos: 'noun', ipa: '/pɑːrk/', forms: { plural: 'parks' }, image: '🌳', tags: ['place'], exampleEn: 'Children play in the park.', exampleVi: 'Trẻ em chơi trong công viên.' },
  { en: 'market', vi: 'chợ', pos: 'noun', ipa: '/ˈmɑːr.kɪt/', forms: { plural: 'markets' }, image: '🏪', tags: ['place'], exampleEn: 'Mother buys fruit at the market.', exampleVi: 'Mẹ mua trái cây ở chợ.' },
  { en: 'library', vi: 'thư viện', pos: 'noun', ipa: '/ˈlaɪ.brer.i/', forms: { plural: 'libraries' }, image: '📚', tags: ['place'], exampleEn: 'Students read books in the library.', exampleVi: 'Học sinh đọc sách trong thư viện.' },
  { en: 'sunny', vi: 'nắng, có nắng', pos: 'adjective', ipa: '/ˈsʌn.i/', image: '☀️', tags: ['weather'], exampleEn: 'It is sunny today.', exampleVi: 'Hôm nay trời nắng.' },
  { en: 'rainy', vi: 'mưa, có mưa', pos: 'adjective', ipa: '/ˈreɪ.ni/', image: '🌧️', tags: ['weather'], exampleEn: 'It is cold on rainy days.', exampleVi: 'Trời lạnh vào những ngày mưa.' },
  { en: 'cloudy', vi: 'nhiều mây', pos: 'adjective', ipa: '/ˈklaʊ.di/', image: '☁️', tags: ['weather'], exampleEn: 'The sky is cloudy.', exampleVi: 'Bầu trời nhiều mây.' },
  { en: 'windy', vi: 'nhiều gió', pos: 'adjective', ipa: '/ˈwɪn.di/', image: '💨', tags: ['weather'], exampleEn: 'It is windy in the afternoon.', exampleVi: 'Trời nhiều gió vào buổi chiều.' }
];

const finalVocab = vocabList.map((item, idx) => ({
  id: `B1-v-${String(idx + 1).padStart(4, '0')}`,
  level: 'B1',
  topic: 'present-simple',
  ...item,
  source: 'seed'
}));

fs.writeFileSync(path.join(DATA_DIR, 'B1.vocab.json'), JSON.stringify(applyContentReviewV4('B1.vocab.json', finalVocab), null, 2), 'utf-8');
console.log(`✅ Generated B1.vocab.json with ${finalVocab.length} words (target ≥ 100).`);
