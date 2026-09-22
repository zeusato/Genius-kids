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
// 1. VOCABULARY B4 (>= 105 words)
// =========================================================================
const vocabList = [
  // Từ chỉ thời gian tương lai & trạng từ (15)
  { en: 'tomorrow', vi: 'ngày mai', pos: 'adverb', ipa: '/təˈmɑːr.oʊ/', image: '📅', tags: ['time', 'future'], exampleEn: 'They will come tomorrow.', exampleVi: 'Ngày mai họ sẽ đến.' },
  { en: 'tonight', vi: 'tối nay', pos: 'adverb', ipa: '/təˈnaɪt/', image: '🌙', tags: ['time', 'future'], exampleEn: 'I will watch a movie tonight.', exampleVi: 'Tối nay tôi sẽ xem một bộ phim.' },
  { en: 'soon', vi: 'sớm, chẳng bao lâu nữa', pos: 'adverb', ipa: '/suːn/', image: '⏳', tags: ['time', 'future'], exampleEn: 'We will meet soon.', exampleVi: 'Chúng ta sẽ sớm gặp lại.' },
  { en: 'next week', vi: 'tuần tới', pos: 'adverb', ipa: '/ˌnekst ˈwiːk/', image: '📆', tags: ['time', 'future'], exampleEn: 'He will travel next week.', exampleVi: 'Tuần tới cậu ấy sẽ đi du lịch.' },
  { en: 'next month', vi: 'tháng tới', pos: 'adverb', ipa: '/ˌnekst ˈmʌnθ/', image: '🗓️', tags: ['time', 'future'], exampleEn: 'We will move to a new house next month.', exampleVi: 'Tháng tới chúng tôi sẽ chuyển sang nhà mới.' },
  { en: 'next year', vi: 'năm tới', pos: 'adverb', ipa: '/ˌnekst ˈjɪr/', image: '🎆', tags: ['time', 'future'], exampleEn: 'She will be ten next year.', exampleVi: 'Năm tới cô ấy sẽ lên mười tuổi.' },
  { en: 'next Sunday', vi: 'Chủ nhật tới', pos: 'adverb', ipa: '/ˌnekst ˈsʌn.deɪ/', image: '☀️', tags: ['time', 'future'], exampleEn: 'They will visit the zoo next Sunday.', exampleVi: 'Chủ nhật tới họ sẽ đi thăm sở thú.' },
  { en: 'someday', vi: 'một ngày nào đó', pos: 'adverb', ipa: '/ˈsʌm.deɪ/', image: '🔮', tags: ['time', 'future'], exampleEn: 'I will fly a plane someday.', exampleVi: 'Một ngày nào đó tôi sẽ lái máy bay.' },
  { en: 'later', vi: 'sau này, lát nữa', pos: 'adverb', ipa: '/ˈleɪ.t̬ɚ/', image: '⏰', tags: ['time', 'future'], exampleEn: 'I will call you later.', exampleVi: 'Lát nữa tôi sẽ gọi cho bạn.' },
  { en: 'in the future', vi: 'trong tương lai', pos: 'adverb', ipa: '/ɪn ðə ˈfjuː.tʃɚ/', image: '🚀', tags: ['time', 'future'], exampleEn: 'Robots will help us in the future.', exampleVi: 'Người máy sẽ giúp chúng ta trong tương lai.' },
  { en: 'probably', vi: 'có lẽ, có thể', pos: 'adverb', ipa: '/ˈprɑː.bə.bli/', image: '🤔', tags: ['adverb'], exampleEn: 'It will probably rain.', exampleVi: 'Có lẽ trời sẽ mưa.' },
  { en: 'maybe', vi: 'có thể', pos: 'adverb', ipa: '/ˈmeɪ.bi/', image: '🎲', tags: ['adverb'], exampleEn: 'Maybe he will come.', exampleVi: 'Có thể cậu ấy sẽ đến.' },
  { en: 'together', vi: 'cùng nhau', pos: 'adverb', ipa: '/təˈɡeð.ɚ/', image: '🤝', tags: ['manner'], exampleEn: 'We will learn together.', exampleVi: 'Chúng ta sẽ học cùng nhau.' },
  { en: 'always', vi: 'luôn luôn', pos: 'adverb', ipa: '/ˈɔːl.weɪz/', image: '💯', tags: ['frequency', 'review'], exampleEn: 'He always helps me.', exampleVi: 'Cậu ấy luôn giúp đỡ tôi.' },
  { en: 'never', vi: 'không bao giờ', pos: 'adverb', ipa: '/ˈnev.ər/', image: '🚫', tags: ['frequency', 'review'], exampleEn: 'I will never give up.', exampleVi: 'Tôi sẽ không bao giờ bỏ cuộc.' },

  // Động từ kế hoạch, dự định & hành động tương lai (35)
  { en: 'travel', vi: 'du lịch', pos: 'verb', ipa: '/ˈtræv.əl/', forms: { thirdSg: 'travels', past: 'traveled', ing: 'traveling', irregular: false }, image: '✈️', tags: ['action', 'future'], exampleEn: 'They will travel to Da Nang.', exampleVi: 'Họ sẽ đi du lịch Đà Nẵng.' },
  { en: 'visit', vi: 'thăm, viếng', pos: 'verb', ipa: '/ˈvɪz.ɪt/', forms: { thirdSg: 'visits', past: 'visited', ing: 'visiting', irregular: false }, image: '🏡', tags: ['action', 'future'], exampleEn: 'We will visit our grandparents.', exampleVi: 'Chúng tôi sẽ thăm ông bà.' },
  { en: 'join', vi: 'tham gia', pos: 'verb', ipa: '/dʒɔɪn/', forms: { thirdSg: 'joins', past: 'joined', ing: 'joining', irregular: false }, image: '👥', tags: ['action'], exampleEn: 'He will join the football club.', exampleVi: 'Cậu ấy sẽ tham gia câu lạc bộ bóng đá.' },
  { en: 'learn', vi: 'học hỏi', pos: 'verb', ipa: '/lɜːrn/', forms: { thirdSg: 'learns', past: 'learned', ing: 'learning', irregular: false }, image: '💡', tags: ['action', 'school'], exampleEn: 'She will learn French.', exampleVi: 'Cô ấy sẽ học tiếng Pháp.' },
  { en: 'build', vi: 'xây dựng', pos: 'verb', ipa: '/bɪld/', forms: { thirdSg: 'builds', past: 'built', ing: 'building', irregular: true }, image: '🧱', tags: ['action'], exampleEn: 'They will build a treehouse.', exampleVi: 'Họ sẽ xây một ngôi nhà trên cây.' },
  { en: 'buy', vi: 'mua', pos: 'verb', ipa: '/baɪ/', forms: { thirdSg: 'buys', past: 'bought', ing: 'buying', irregular: true }, image: '🛒', tags: ['action'], exampleEn: 'I will buy a new bike.', exampleVi: 'Tôi sẽ mua một chiếc xe đạp mới.' },
  { en: 'become', vi: 'trở thành', pos: 'verb', ipa: '/bɪˈkʌm/', forms: { thirdSg: 'becomes', past: 'became', ing: 'becoming', irregular: true }, image: '🌟', tags: ['action', 'future'], exampleEn: 'He will become a doctor.', exampleVi: 'Cậu ấy sẽ trở thành một bác sĩ.' },
  { en: 'grow', vi: 'lớn lên, phát triển', pos: 'verb', ipa: '/ɡroʊ/', forms: { thirdSg: 'grows', past: 'grew', ing: 'growing', irregular: true }, image: '🌱', tags: ['action'], exampleEn: 'These trees will grow fast.', exampleVi: 'Những cái cây này sẽ lớn rất nhanh.' },
  { en: 'help', vi: 'giúp đỡ', pos: 'verb', ipa: '/help/', forms: { thirdSg: 'helps', past: 'helped', ing: 'helping', irregular: false }, image: '🤝', tags: ['action'], exampleEn: 'I will help you with your homework.', exampleVi: 'Tôi sẽ giúp bạn làm bài tập.' },
  { en: 'fly', vi: 'bay', pos: 'verb', ipa: '/flaɪ/', forms: { thirdSg: 'flies', past: 'flew', ing: 'flying', irregular: true }, image: '🪁', tags: ['action'], exampleEn: 'We will fly a kite tomorrow.', exampleVi: 'Ngày mai chúng tôi sẽ thả diều.' },
  { en: 'swim', vi: 'bơi', pos: 'verb', ipa: '/swɪm/', forms: { thirdSg: 'swims', past: 'swam', ing: 'swimming', irregular: true }, image: '🏊', tags: ['action', 'sport'], exampleEn: 'He will swim in the lake.', exampleVi: 'Cậu ấy sẽ bơi ở hồ.' },
  { en: 'cook', vi: 'nấu ăn', pos: 'verb', ipa: '/kʊk/', forms: { thirdSg: 'cooks', past: 'cooked', ing: 'cooking', irregular: false }, image: '🍳', tags: ['action'], exampleEn: 'My mother will cook a special dinner.', exampleVi: 'Mẹ tôi sẽ nấu một bữa tối đặc biệt.' },
  { en: 'bake', vi: 'nướng bánh', pos: 'verb', ipa: '/beɪk/', forms: { thirdSg: 'bakes', past: 'baked', ing: 'baking', irregular: false }, image: '🧁', tags: ['action'], exampleEn: 'We will bake cookies tomorrow.', exampleVi: 'Ngày mai chúng tôi sẽ nướng bánh quy.' },
  { en: 'clean', vi: 'dọn dẹp', pos: 'verb', ipa: '/kliːn/', forms: { thirdSg: 'cleans', past: 'cleaned', ing: 'cleaning', irregular: false }, image: '🧹', tags: ['action'], exampleEn: 'He will clean his desk.', exampleVi: 'Cậu ấy sẽ dọn dẹp bàn học của mình.' },
  { en: 'paint', vi: 'vẽ tranh màu, sơn', pos: 'verb', ipa: '/peɪnt/', forms: { thirdSg: 'paints', past: 'painted', ing: 'painting', irregular: false }, image: '🎨', tags: ['action'], exampleEn: 'She will paint the room.', exampleVi: 'Cô ấy sẽ sơn căn phòng.' },
  { en: 'sing', vi: 'hát', pos: 'verb', ipa: '/sɪŋ/', forms: { thirdSg: 'sings', past: 'sang', ing: 'singing', irregular: true }, image: '🎤', tags: ['action'], exampleEn: 'They will sing at the festival.', exampleVi: 'Họ sẽ hát tại lễ hội.' },
  { en: 'dance', vi: 'nhảy múa', pos: 'verb', ipa: '/dæns/', forms: { thirdSg: 'dances', past: 'danced', ing: 'dancing', irregular: false }, image: '💃', tags: ['action'], exampleEn: 'The children will dance happily.', exampleVi: 'Lũ trẻ sẽ nhảy múa vui vẻ.' },
  { en: 'write', vi: 'viết', pos: 'verb', ipa: '/raɪt/', forms: { thirdSg: 'writes', past: 'wrote', ing: 'writing', irregular: true }, image: '✍️', tags: ['action'], exampleEn: 'I will write a storybook.', exampleVi: 'Tôi sẽ viết một cuốn truyện.' },
  { en: 'read', vi: 'đọc', pos: 'verb', ipa: '/riːd/', forms: { thirdSg: 'reads', past: 'read', ing: 'reading', irregular: true }, image: '📖', tags: ['action'], exampleEn: 'He will read this book soon.', exampleVi: 'Cậu ấy sẽ sớm đọc cuốn sách này.' },
  { en: 'meet', vi: 'gặp gỡ', pos: 'verb', ipa: '/miːt/', forms: { thirdSg: 'meets', past: 'met', ing: 'meeting', irregular: true }, image: '🤝', tags: ['action'], exampleEn: 'We will meet at the cinema.', exampleVi: 'Chúng ta sẽ gặp nhau ở rạp chiếu phim.' },
  { en: 'stay', vi: 'ở lại', pos: 'verb', ipa: '/steɪ/', forms: { thirdSg: 'stays', past: 'stayed', ing: 'staying', irregular: false }, image: '🏠', tags: ['action'], exampleEn: 'They will stay at a hotel.', exampleVi: 'Họ sẽ ở tại một khách sạn.' },
  { en: 'arrive', vi: 'đến nơi', pos: 'verb', ipa: '/əˈraɪv/', forms: { thirdSg: 'arrives', past: 'arrived', ing: 'arriving', irregular: false }, image: '🛬', tags: ['action'], exampleEn: 'The plane will arrive on time.', exampleVi: 'Máy bay sẽ hạ cánh đúng giờ.' },
  { en: 'leave', vi: 'rời khỏi', pos: 'verb', ipa: '/liːv/', forms: { thirdSg: 'leaves', past: 'left', ing: 'leaving', irregular: true }, image: '🚶', tags: ['action'], exampleEn: 'We will leave early tomorrow.', exampleVi: 'Ngày mai chúng tôi sẽ rời đi sớm.' },
  { en: 'finish', vi: 'hoàn thành', pos: 'verb', ipa: '/ˈfɪn.ɪʃ/', forms: { thirdSg: 'finishes', past: 'finished', ing: 'finishing', irregular: false }, image: '🏁', tags: ['action'], exampleEn: 'She will finish her project.', exampleVi: 'Cô ấy sẽ hoàn thành dự án của mình.' },
  { en: 'start', vi: 'bắt đầu', pos: 'verb', ipa: '/stɑːrt/', forms: { thirdSg: 'starts', past: 'started', ing: 'starting', irregular: false }, image: '🏁', tags: ['action'], exampleEn: 'School will start in September.', exampleVi: 'Trường học sẽ bắt đầu vào tháng Chín.' },
  { en: 'win', vi: 'chiến thắng', pos: 'verb', ipa: '/wɪn/', forms: { thirdSg: 'wins', past: 'won', ing: 'winning', irregular: true }, image: '🏆', tags: ['action', 'sport'], exampleEn: 'Our team will win the game.', exampleVi: 'Đội của chúng tôi sẽ chiến thắng trận đấu.' },
  { en: 'see', vi: 'thấy, xem', pos: 'verb', ipa: '/siː/', forms: { thirdSg: 'sees', past: 'saw', ing: 'seeing', irregular: true }, image: '👀', tags: ['action'], exampleEn: 'We will see a movie tonight.', exampleVi: 'Tối nay chúng tôi sẽ xem phim.' },
  { en: 'eat', vi: 'ăn', pos: 'verb', ipa: '/iːt/', forms: { thirdSg: 'eats', past: 'ate', ing: 'eating', irregular: true }, image: '🍽️', tags: ['action'], exampleEn: 'We will eat pizza.', exampleVi: 'Chúng tôi sẽ ăn bánh pizza.' },
  { en: 'drink', vi: 'uống', pos: 'verb', ipa: '/drɪŋk/', forms: { thirdSg: 'drinks', past: 'drank', ing: 'drinking', irregular: true }, image: '🥤', tags: ['action'], exampleEn: 'She will drink fruit juice.', exampleVi: 'Cô ấy sẽ uống nước ép hoa quả.' },
  { en: 'take', vi: 'cầm, mang, dẫn đi', pos: 'verb', ipa: '/teɪk/', forms: { thirdSg: 'takes', past: 'took', ing: 'taking', irregular: true }, image: '📸', tags: ['action'], exampleEn: 'I will take an umbrella.', exampleVi: 'Tôi sẽ mang theo một chiếc ô.' },
  { en: 'bring', vi: 'mang tới', pos: 'verb', ipa: '/brɪŋ/', forms: { thirdSg: 'brings', past: 'brought', ing: 'bringing', irregular: true }, image: '🎒', tags: ['action'], exampleEn: 'He will bring some cookies.', exampleVi: 'Cậu ấy sẽ mang tới một ít bánh quy.' },
  { en: 'wear', vi: 'mặc, đội', pos: 'verb', ipa: '/wer/', forms: { thirdSg: 'wears', past: 'wore', ing: 'wearing', irregular: true }, image: '👗', tags: ['action'], exampleEn: 'She will wear a pretty dress.', exampleVi: 'Cô ấy sẽ mặc một chiếc váy xinh.' },
  { en: 'watch', vi: 'xem, theo dõi', pos: 'verb', ipa: '/wɑːtʃ/', forms: { thirdSg: 'watches', past: 'watched', ing: 'watching', irregular: false }, image: '📺', tags: ['action'], exampleEn: 'We will watch the match.', exampleVi: 'Chúng tôi sẽ xem trận đấu.' },
  { en: 'play', vi: 'chơi', pos: 'verb', ipa: '/pleɪ/', forms: { thirdSg: 'plays', past: 'played', ing: 'playing', irregular: false }, image: '⚽', tags: ['action'], exampleEn: 'They will play basketball.', exampleVi: 'Họ sẽ chơi bóng rổ.' },
  { en: 'open', vi: 'mở', pos: 'verb', ipa: '/ˈoʊ.pən/', forms: { thirdSg: 'opens', past: 'opened', ing: 'opening', irregular: false }, image: '🚪', tags: ['action'], exampleEn: 'They will open a new shop.', exampleVi: 'Họ sẽ mở một cửa hàng mới.' },

  // Danh từ địa điểm, nghề nghiệp & dự định (30)
  { en: 'robot', vi: 'người máy', pos: 'noun', ipa: '/ˈroʊ.bɑːt/', forms: { plural: 'robots' }, image: '🤖', tags: ['science'], exampleEn: 'A robot will clean the house.', exampleVi: 'Một người máy sẽ lau dọn nhà cửa.' },
  { en: 'future', vi: 'tương lai', pos: 'noun', ipa: '/ˈfjuː.tʃɚ/', image: '🔮', tags: ['time'], exampleEn: 'The future will be bright.', exampleVi: 'Tương lai sẽ tươi sáng.' },
  { en: 'plan', vi: 'kế hoạch', pos: 'noun', ipa: '/plæn/', forms: { plural: 'plans' }, image: '📋', tags: ['activity'], exampleEn: 'We have a great plan.', exampleVi: 'Chúng tôi có một kế hoạch tuyệt vời.' },
  { en: 'club', vi: 'câu lạc bộ', pos: 'noun', ipa: '/klʌb/', forms: { plural: 'clubs' }, image: '🏆', tags: ['group'], exampleEn: 'He will join the chess club.', exampleVi: 'Cậu ấy sẽ tham gia câu lạc bộ cờ vua.' },
  { en: 'festival', vi: 'lễ hội', pos: 'noun', ipa: '/ˈfes.tə.vəl/', forms: { plural: 'festivals' }, image: '🏮', tags: ['event'], exampleEn: 'The music festival will take place soon.', exampleVi: 'Lễ hội âm nhạc sẽ sớm diễn ra.' },
  { en: 'hotel', vi: 'khách sạn', pos: 'noun', ipa: '/hoʊˈtel/', forms: { plural: 'hotels' }, image: '🏨', tags: ['place'], exampleEn: 'We will stay at that hotel.', exampleVi: 'Chúng tôi sẽ ở tại khách sạn đó.' },
  { en: 'island', vi: 'hòn đảo', pos: 'noun', ipa: '/ˈaɪ.lənd/', forms: { plural: 'islands' }, image: '🏝️', tags: ['nature'], exampleEn: 'They will visit Phu Quoc island.', exampleVi: 'Họ sẽ đến thăm đảo Phú Quốc.' },
  { en: 'mountain', vi: 'ngọn núi', pos: 'noun', ipa: '/ˈmaʊn.tən/', forms: { plural: 'mountains' }, image: '⛰️', tags: ['nature'], exampleEn: 'We will climb the mountain.', exampleVi: 'Chúng tôi sẽ leo ngọn núi đó.' },
  { en: 'country', vi: 'đất nước', pos: 'noun', ipa: '/ˈkʌn.tri/', forms: { plural: 'countries' }, image: '🌏', tags: ['place'], exampleEn: 'She will travel to another country.', exampleVi: 'Cô ấy sẽ đi du lịch tới một đất nước khác.' },
  { en: 'astronaut', vi: 'phi hành gia', pos: 'noun', ipa: '/ˈæs.trə.nɑːt/', forms: { plural: 'astronauts' }, image: '👨‍🚀', tags: ['job'], exampleEn: 'He wants to become an astronaut.', exampleVi: 'Cậu ấy muốn trở thành một phi hành gia.' },
  { en: 'scientist', vi: 'nhà khoa học', pos: 'noun', ipa: '/ˈsaɪ.ən.tɪst/', forms: { plural: 'scientists' }, image: '🔬', tags: ['job'], exampleEn: 'She will be a scientist.', exampleVi: 'Cô ấy sẽ là một nhà khoa học.' },
  { en: 'pilot', vi: 'phi công', pos: 'noun', ipa: '/ˈpaɪ.lət/', forms: { plural: 'pilots' }, image: '👨‍✈️', tags: ['job'], exampleEn: 'Nam will become a pilot.', exampleVi: 'Nam sẽ trở thành một phi công.' },
  { en: 'artist', vi: 'họa sĩ', pos: 'noun', ipa: '/ˈɑːr.tɪst/', forms: { plural: 'artists' }, image: '👨‍🎨', tags: ['job'], exampleEn: 'Lan will be a talented artist.', exampleVi: 'Lan sẽ là một họa sĩ tài năng.' },
  { en: 'singer', vi: 'ca sĩ', pos: 'noun', ipa: '/ˈsɪŋ.ɚ/', forms: { plural: 'singers' }, image: '🧑‍🎤', tags: ['job'], exampleEn: 'She will be a famous singer.', exampleVi: 'Cô ấy sẽ là một ca sĩ nổi tiếng.' },
  { en: 'concert', vi: 'buổi hòa nhạc', pos: 'noun', ipa: '/ˈkɑːn.sɚt/', forms: { plural: 'concerts' }, image: '🎶', tags: ['music'], exampleEn: 'We will go to the concert tonight.', exampleVi: 'Tối nay chúng tôi sẽ đi xem hòa nhạc.' },
  { en: 'project', vi: 'dự án, bài tập lớn', pos: 'noun', ipa: '/ˈprɑː.dʒekt/', forms: { plural: 'projects' }, image: '📑', tags: ['school'], exampleEn: 'They will finish the science project.', exampleVi: 'Họ sẽ hoàn thành dự án khoa học.' },
  { en: 'exam', vi: 'kỳ thi', pos: 'noun', ipa: '/ɪɡˈzæm/', forms: { plural: 'exams' }, image: '📝', tags: ['school'], exampleEn: 'We will have an exam next week.', exampleVi: 'Chúng tôi sẽ có một kỳ thi vào tuần tới.' },
  { en: 'vacation', vi: 'kỳ nghỉ hè', pos: 'noun', ipa: '/veɪˈkeɪ.ʃən/', forms: { plural: 'vacations' }, image: '🏖️', tags: ['time'], exampleEn: 'Summer vacation will begin in June.', exampleVi: 'Kỳ nghỉ hè sẽ bắt đầu vào tháng Sáu.' },
  { en: 'season', vi: 'mùa trong năm', pos: 'noun', ipa: '/ˈsiː.zən/', forms: { plural: 'seasons' }, image: '🍂', tags: ['nature'], exampleEn: 'Spring is my favorite season.', exampleVi: 'Mùa xuân là mùa yêu thích của tôi.' },
  { en: 'weather', vi: 'thời tiết', pos: 'noun', ipa: '/ˈweð.ɚ/', image: '🌤️', tags: ['weather'], exampleEn: 'The weather will be nice tomorrow.', exampleVi: 'Thời tiết ngày mai sẽ đẹp.' },
  {"en":"rain","vi":"mưa (trời mưa)","pos":"verb","ipa":"/reɪn/","image":"🌧️","tags":["weather"],"exampleEn":"It will rain tomorrow.","exampleVi":"Ngày mai trời sẽ mưa.","forms":{"thirdSg":"rains","past":"rained","ing":"raining"}},
  { en: 'sunshine', vi: 'ánh nắng mặt trời', pos: 'noun', ipa: '/ˈsʌn.ʃaɪn/', image: '☀️', tags: ['weather'], exampleEn: 'There will be warm sunshine.', exampleVi: 'Sẽ có ánh nắng ấm áp.' },
  {"en":"snow","vi":"có tuyết rơi","pos":"verb","ipa":"/snoʊ/","image":"❄️","tags":["weather"],"exampleEn":"It will snow in winter.","exampleVi":"Trời sẽ có tuyết vào mùa đông.","forms":{"thirdSg":"snows","past":"snowed","ing":"snowing"}},
  { en: 'wind', vi: 'gió', pos: 'noun', ipa: '/wɪnd/', image: '💨', tags: ['weather'], exampleEn: 'The wind will blow gently.', exampleVi: 'Gió sẽ thổi nhẹ nhàng.' },
  { en: 'present', vi: 'món quà', pos: 'noun', ipa: '/ˈprez.ənt/', forms: { plural: 'presents' }, image: '🎁', tags: ['object'], exampleEn: 'I will give you a nice present.', exampleVi: 'Tôi sẽ tặng bạn một món quà xinh xắn.' },
  { en: 'ticket', vi: 'vé (tàu, xe, phim)', pos: 'noun', ipa: '/ˈtɪk.ɪt/', forms: { plural: 'tickets' }, image: '🎟️', tags: ['object'], exampleEn: 'He will buy two tickets.', exampleVi: 'Cậu ấy sẽ mua hai tấm vé.' },
  { en: 'cookie', vi: 'bánh quy', pos: 'noun', ipa: '/ˈkʊk.i/', forms: { plural: 'cookies' }, image: '🍪', tags: ['food'], exampleEn: 'We will eat delicious cookies.', exampleVi: 'Chúng tôi sẽ ăn những chiếc bánh quy thơm ngon.' },
  { en: 'backpack', vi: 'ba lô', pos: 'noun', ipa: '/ˈbæk.pæk/', forms: { plural: 'backpacks' }, image: '🎒', tags: ['school'], exampleEn: 'She will carry a blue backpack.', exampleVi: 'Cô ấy sẽ đeo một chiếc ba lô màu xanh.' },
  { en: 'museum', vi: 'viện bảo tàng', pos: 'noun', ipa: '/mjuːˈziː.əm/', forms: { plural: 'museums' }, image: '🏛️', tags: ['place'], exampleEn: 'We will visit the art museum.', exampleVi: 'Chúng tôi sẽ đi thăm bảo tàng mỹ thuật.' },
  { en: 'zoo', vi: 'vườn thú', pos: 'noun', ipa: '/zuː/', forms: { plural: 'zoos' }, image: '🦁', tags: ['place'], exampleEn: 'They will visit the zoo tomorrow.', exampleVi: 'Ngày mai họ sẽ đi thăm vườn thú.' },

  // Tính từ mô tả tương lai & cảm xúc (25)
  { en: 'famous', vi: 'nổi tiếng', pos: 'adjective', ipa: '/ˈfeɪ.məs/', image: '⭐', tags: ['quality'], exampleEn: 'She will be a famous singer.', exampleVi: 'Cô ấy sẽ là một ca sĩ nổi tiếng.' },
  { en: 'great', vi: 'tuyệt vời', pos: 'adjective', ipa: '/ɡreɪt/', image: '🌟', tags: ['quality'], exampleEn: 'It will be a great trip.', exampleVi: 'Đó sẽ là một chuyến đi tuyệt vời.' },
  { en: 'wonderful', vi: 'kỳ diệu, tuyệt diệu', pos: 'adjective', ipa: '/ˈwʌn.dɚ.fəl/', image: '✨', tags: ['quality'], exampleEn: 'We will have a wonderful holiday.', exampleVi: 'Chúng tôi sẽ có một kỳ nghỉ kỳ diệu.' },
  { en: 'sunny', vi: 'nắng, có nắng', pos: 'adjective', ipa: '/ˈsʌn.i/', image: '☀️', tags: ['weather'], exampleEn: 'It will be sunny tomorrow.', exampleVi: 'Ngày mai trời sẽ có nắng.' },
  { en: 'rainy', vi: 'mưa, có mưa', pos: 'adjective', ipa: '/ˈreɪ.ni/', image: '🌧️', tags: ['weather'], exampleEn: 'It will be rainy next Sunday.', exampleVi: 'Chủ nhật tới trời sẽ mưa.' },
  { en: 'cloudy', vi: 'nhiều mây', pos: 'adjective', ipa: '/ˈklaʊ.di/', image: '☁️', tags: ['weather'], exampleEn: 'The sky will be cloudy tonight.', exampleVi: 'Tối nay bầu trời sẽ nhiều mây.' },
  { en: 'windy', vi: 'nhiều gió', pos: 'adjective', ipa: '/ˈwɪn.di/', image: '💨', tags: ['weather'], exampleEn: 'It will be windy tomorrow morning.', exampleVi: 'Sáng mai trời sẽ nhiều gió.' },
  { en: 'cold', vi: 'lạnh giá', pos: 'adjective', ipa: '/koʊld/', image: '🥶', tags: ['weather'], exampleEn: 'It will be cold in the evening.', exampleVi: 'Trời sẽ lạnh vào buổi tối.' },
  { en: 'warm', vi: 'ấm áp', pos: 'adjective', ipa: '/wɔːrm/', image: '🌡️', tags: ['weather'], exampleEn: 'The weather will be warm.', exampleVi: 'Thời tiết sẽ ấm áp.' },
  { en: 'hot', vi: 'nóng bức', pos: 'adjective', ipa: '/hɑːt/', image: '🥵', tags: ['weather'], exampleEn: 'It will be hot this afternoon.', exampleVi: 'Chiều nay trời sẽ nóng.' },
  { en: 'ready', vi: 'sẵn sàng', pos: 'adjective', ipa: '/ˈred.i/', image: '✅', tags: ['state'], exampleEn: 'I will be ready at seven.', exampleVi: 'Tôi sẽ sẵn sàng lúc bảy giờ.' },
  { en: 'busy', vi: 'bận rộn', pos: 'adjective', ipa: '/ˈbɪz.i/', image: '🏃', tags: ['state'], exampleEn: 'He will be busy tomorrow.', exampleVi: 'Ngày mai cậu ấy sẽ bận.' },
  { en: 'excited', vi: 'hào hứng', pos: 'adjective', ipa: '/ɪkˈsaɪ.t̬ɪd/', image: '🤩', tags: ['emotion'], exampleEn: 'The kids will be excited.', exampleVi: 'Lũ trẻ sẽ rất hào hứng.' },
  { en: 'happy', vi: 'hạnh phúc, vui vẻ', pos: 'adjective', ipa: '/ˈhæp.i/', image: '😊', tags: ['emotion'], exampleEn: 'You will be happy there.', exampleVi: 'Bạn sẽ hạnh phúc ở đó.' },
  { en: 'careful', vi: 'cẩn thận', pos: 'adjective', ipa: '/ˈker.fəl/', image: '⚠️', tags: ['manner'], exampleEn: 'He will be careful.', exampleVi: 'Cậu ấy sẽ cẩn thận.' },
  { en: 'tired', vi: 'mệt mỏi', pos: 'adjective', ipa: '/taɪərd/', image: '🥱', tags: ['feeling', 'review'], exampleEn: 'She was tired yesterday.', exampleVi: 'Hôm qua cô ấy đã mệt.' },
  { en: 'hungry', vi: 'đói bụng', pos: 'adjective', ipa: '/ˈhʌŋ.ɡri/', image: '🤤', tags: ['feeling', 'review'], exampleEn: 'He was hungry after school.', exampleVi: 'Cậu ấy đã bị đói sau giờ học.' },
  { en: 'thirsty', vi: 'khát nước', pos: 'adjective', ipa: '/ˈθɜːr.sti/', image: '🥛', tags: ['feeling', 'review'], exampleEn: 'I am thirsty now.', exampleVi: 'Bây giờ tôi đang khát nước.' },
  { en: 'new', vi: 'mới', pos: 'adjective', ipa: '/nuː/', image: '✨', tags: ['quality'], exampleEn: 'She has a new bicycle.', exampleVi: 'Cô ấy có một chiếc xe đạp mới.' },
  { en: 'old', vi: 'cũ, già', pos: 'adjective', ipa: '/oʊld/', image: '👴', tags: ['quality'], exampleEn: 'The tree is very old.', exampleVi: 'Cái cây rất già.' },
  { en: 'big', vi: 'to lớn', pos: 'adjective', ipa: '/bɪɡ/', image: '🐘', tags: ['size'], exampleEn: 'We will visit a big museum.', exampleVi: 'Chúng tôi sẽ đi thăm một bảo tàng to lớn.' },
  { en: 'small', vi: 'nhỏ bé', pos: 'adjective', ipa: '/smɑːl/', image: '🐜', tags: ['size'], exampleEn: 'They live in a small house.', exampleVi: 'Họ sống trong một ngôi nhà nhỏ.' },
  { en: 'fast', vi: 'nhanh nhẹn', pos: 'adjective', ipa: '/fæst/', image: '⚡', tags: ['speed'], exampleEn: 'The train will be fast.', exampleVi: 'Chuyến tàu sẽ chạy rất nhanh.' },
  { en: 'slow', vi: 'chậm chạp', pos: 'adjective', ipa: '/sloʊ/', image: '🐢', tags: ['speed'], exampleEn: 'The turtle is slow.', exampleVi: 'Con rùa thì chậm chạp.' },
  { en: 'interesting', vi: 'thú vị', pos: 'adjective', ipa: '/ˈɪn.trə.stɪŋ/', image: '💡', tags: ['quality'], exampleEn: 'The film will be interesting.', exampleVi: 'Bộ phim sẽ rất thú vị.' }
];

const finalVocab = vocabList.map((item, idx) => ({
  id: `B4-v-${String(idx + 1).padStart(4, '0')}`,
  level: 'B4',
  topic: 'future-review',
  ...item,
  source: 'seed'
}));

fs.writeFileSync(path.join(DATA_DIR, 'B4.vocab.json'), JSON.stringify(applyContentReviewV4('B4.vocab.json', finalVocab), null, 2), 'utf-8');
console.log(`✅ Generated B4.vocab.json with ${finalVocab.length} words (target ≥ 100).`);

// =========================================================================
// 2. SENTENCES GENERATOR B4 (200 sentences)
// =========================================================================
const sentences = [];
let sIdx = 1;

function addSentence(grammarPoint, en, vi, difficulty, tags, tokens, roleSpans, exerciseTypes, blankDef, orderAlternatives) {
  const reconstructed = reconstructEn(tokens);
  if (reconstructed !== en) {
    throw new Error(`Reconstruction mismatch:\nen: "${en}"\nreconstructed: "${reconstructed}"`);
  }

  const id = `B4-s-${String(sIdx++).padStart(4, '0')}`;
  const blank = {
    tokenIndex: blankDef.idx,
    answer: blankDef.ans,
    hint: blankDef.hint,
    promptVi: blankDef.promptVi
  };
  if (blankDef.alt) blank.alt = blankDef.alt;

  const item = {
    id,
    level: 'B4',
    topic: 'future-review',
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

// Helper: Will Affirmative: S + will + V(base) + (O) + (A)
function addWillAff(sTokens, vBaseText, vLemma, restTokens, vi, diff, tags, blankIsWill, promptVi, hint) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of sTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const willIdx = curIdx++;
  tokens.push(tok('will', 'verb', 'verb', 'will', 'aux-future'));

  const vIdx = curIdx++;
  tokens.push(tok(vBaseText, 'verb', 'verb', vLemma, 'base'));

  const restSpans = [];
  if (restTokens && restTokens.length > 0) {
    for (const rt of restTokens) {
      const rIdx = curIdx++;
      tokens.push(rt);
      if (rt.role === 'object') restSpans.push({ clauseId: 'c1', role: 'object', tokenIndices: [rIdx] });
      else if (rt.role === 'adverbial') restSpans.push({ clauseId: 'c1', role: 'adverbial', tokenIndices: [rIdx] });
      else if (rt.role === 'complement') restSpans.push({ clauseId: 'c1', role: 'complement', tokenIndices: [rIdx] });
    }
  }
  tokens.push(punctDot);

  const roleSpans = [
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    { clauseId: 'c1', role: 'verb', tokenIndices: [willIdx, vIdx] },
    ...restSpans
  ];

  const blankDef = blankIsWill
    ? { idx: willIdx, ans: 'will', promptVi, hint }
    : { idx: vIdx, ans: vBaseText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('will-affirmative', en, vi, diff, ['future', 'will', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// Helper: Will Negative: S + won't + V(base) + (O) + (A)
function addWillNeg(sTokens, vBaseText, vLemma, restTokens, vi, diff, tags, blankIsWont, promptVi, hint) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of sTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const wontIdx = curIdx++;
  tokens.push(tok("won't", 'verb', 'verb', 'will', 'aux-future-neg'));

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
    { clauseId: 'c1', role: 'verb', tokenIndices: [wontIdx, vIdx] },
    ...restSpans
  ];

  const blankDef = blankIsWont
    ? { idx: wontIdx, ans: "won't", promptVi, hint }
    : { idx: vIdx, ans: vBaseText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('will-negative', en, vi, diff, ['future', 'negative', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// Helper: Will Question: Will + S + V(base) + (O) + (A)?
function addWillQ(sTokens, vBaseText, vLemma, restTokens, vi, diff, tags, blankIsWill, promptVi, hint) {
  const tokens = [];
  let curIdx = 0;

  const willIdx = curIdx++;
  tokens.push(tok('Will', 'verb', 'verb', 'will', 'aux-future'));

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
    { clauseId: 'c1', role: 'verb', tokenIndices: [willIdx, vIdx] },
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    ...restSpans
  ];

  const blankDef = blankIsWill
    ? { idx: willIdx, ans: 'Will', promptVi, hint }
    : { idx: vIdx, ans: vBaseText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('will-question', en, vi, diff, ['future', 'question', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// Helper: Be going to: S + am/is/are + going + to + V(base) + (O) + (A)
function addBeGoingTo(sTokens, beText, beFeat, vBaseText, vLemma, restTokens, vi, diff, tags, blankField, promptVi, hint) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of sTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const beIdx = curIdx++;
  tokens.push(tok(beText, 'verb', 'verb', 'be', beFeat));

  const goingIdx = curIdx++;
  tokens.push(tok('going', 'verb', 'verb', 'go', 'ing'));

  const toIdx = curIdx++;
  tokens.push(tok('to', 'particle', 'particle'));

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
    { clauseId: 'c1', role: 'verb', tokenIndices: [beIdx, goingIdx, vIdx] },
    ...restSpans
  ];

  let bIdx = beIdx;
  let bAns = beText;
  if (blankField === 'going') { bIdx = goingIdx; bAns = 'going'; }
  else if (blankField === 'verb') { bIdx = vIdx; bAns = vBaseText; }

  const blankDef = { idx: bIdx, ans: bAns, promptVi, hint };
  const en = reconstructEn(tokens);
  addSentence('be-going-to', en, vi, diff, ['future', 'be-going-to', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// -------------------------------------------------------------------------
// NHÓM 1: WILL AFFIRMATIVE (45 câu: B4-s-0001 -> B4-s-0045)
// -------------------------------------------------------------------------
addWillAff([tok('I','pronoun','subject')], 'help', 'help', [tok('you','pronoun','object')], 'Tôi sẽ giúp bạn.', 1, ['daily'], true, 'Điền trợ động từ tương lai will.', 'will + V-base');
addWillAff([tok('He','pronoun','subject')], 'visit', 'visit', [tok('his','determiner','det'), tok('grandparents','noun','object','grandparent','pl'), tok('tomorrow','adverb','adverbial')], 'Ngày mai cậu ấy sẽ thăm ông bà.', 1, ['family'], true, 'Điền will để diễn tả hành động trong tương lai.', 'will');
addWillAff([tok('They','pronoun','subject')], 'travel', 'travel', [tok('to','preposition','adverbial'), tok('Da','noun','modifier','Da','sg'), tok('Nang','noun','adverbial','Nang','sg'), tok('next','adverb','adverbial'), tok('week','noun','adverbial','week','sg')], 'Tuần tới họ sẽ đi du lịch Đà Nẵng.', 1, ['place'], true, 'Điền will cho câu tương lai.', 'will');
addWillAff([tok('She','pronoun','subject')], 'learn', 'learn', [tok('French','noun','object','French','uncountable'), tok('next','adverb','adverbial'), tok('year','noun','adverbial','year','sg')], 'Năm tới cô ấy sẽ học tiếng Pháp.', 1, ['school'], false, 'Sau will động từ giữ nguyên thể base: learn.', 'learn');
addWillAff([tok('We','pronoun','subject')], 'play', 'play', [tok('soccer','noun','object','soccer','uncountable'), tok('tomorrow','adverb','adverbial'), tok('afternoon','noun','adverbial','afternoon','sg')], 'Chiều mai chúng tôi sẽ chơi bóng đá.', 1, ['sport'], false, 'Sau will động từ giữ nguyên thể: play.', 'play');
addWillAff([tok('It','pronoun','subject')], 'rain', 'rain', [tok('tonight','adverb','adverbial')], 'Tối nay trời sẽ mưa.', 1, ['weather'], true, 'Điền will cho dự đoán tương lai.', 'will');
addWillAff([tok('The','article','det'), tok('train','noun','subject','train','sg')], 'arrive', 'arrive', [tok('at','preposition','adverbial'), tok('six','numeral','adverbial')], 'Đoàn tàu sẽ đến lúc sáu giờ.', 1, ['transport'], false, 'Sau will động từ giữ nguyên: arrive.', 'arrive');
addWillAff([tok('Mother','noun','subject','mother','sg')], 'cook', 'cook', [tok('a','article','det'), tok('delicious','adjective','modifier'), tok('meal','noun','object','meal','sg')], 'Mẹ sẽ nấu một bữa ăn ngon.', 1, ['food'], true, 'Điền will để tạo câu khẳng định tương lai.', 'will');
addWillAff([tok('I','pronoun','subject')], 'call', 'call', [tok('you','pronoun','object'), tok('later','adverb','adverbial')], 'Lát nữa tôi sẽ gọi cho bạn.', 1, ['daily'], true, 'Điền will để hứa hẹn.', 'will');
addWillAff([tok('They','pronoun','subject')], 'build', 'build', [tok('a','article','det'), tok('new','adjective','modifier'), tok('school','noun','object','school','sg'), tok('next','adverb','adverbial'), tok('year','noun','adverbial','year','sg')], 'Năm tới họ sẽ xây một ngôi trường mới.', 2, ['place'], false, 'Sau will dùng động từ nguyên thể build.', 'build');

addWillAff([tok('Nam','noun','subject','Nam','sg')], 'become', 'become', [tok('a','article','det'), tok('doctor','noun','object','doctor','sg'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('future','noun','adverbial','future','uncountable')], 'Trong tương lai Nam sẽ trở thành một bác sĩ.', 2, ['job'], true, 'Điền will cho ước mơ tương lai.', 'will');
addWillAff([tok('We','pronoun','subject')], 'fly', 'fly', [tok('kites','noun','object','kite','pl'), tok('tomorrow','adverb','adverbial')], 'Ngày mai chúng tôi sẽ thả diều.', 1, ['toy'], false, 'Sau will dùng động từ nguyên thể: fly.', 'fly');
addWillAff([tok('She','pronoun','subject')], 'buy', 'buy', [tok('a','article','det'), tok('new','adjective','modifier'), tok('bicycle','noun','object','bicycle','sg'), tok('soon','adverb','adverbial')], 'Cô ấy sẽ sớm mua một chiếc xe đạp mới.', 2, ['transport'], true, 'Điền trợ động từ tương lai will.', 'will');
addWillAff([tok('The','article','det'), tok('sun','noun','subject','sun','sg')], 'shine', 'shine', [tok('brightly','adverb','adverbial'), tok('tomorrow','adverb','adverbial')], 'Ngày mai mặt trời sẽ tỏa sáng rực rỡ.', 2, ['weather'], false, 'Sau will dùng động từ nguyên thể: shine.', 'shine');
addWillAff([tok('I','pronoun','subject')], 'clean', 'clean', [tok('my','determiner','det'), tok('room','noun','object','room','sg'), tok('this','determiner','det'), tok('weekend','noun','adverbial','weekend','sg')], 'Cuối tuần này tôi sẽ dọn phòng.', 2, ['home'], false, 'Sau will động từ ở dạng base: clean.', 'clean');
addWillAff([tok('They','pronoun','subject')], 'have', 'have', [tok('a','article','det'), tok('party','noun','object','party','sg'), tok('on','preposition','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg')], 'Họ sẽ tổ chức một bữa tiệc vào Chủ nhật.', 1, ['party'], true, 'Điền will cho kế hoạch tương lai.', 'will');
addWillAff([tok('You','pronoun','subject')], 'pass', 'pass', [tok('the','article','det'), tok('exam','noun','object','exam','sg')], 'Bạn sẽ vượt qua kỳ thi thôi.', 2, ['school'], true, 'Điền will để động viên.', 'will');
addWillAff([tok('Father','noun','subject','father','sg')], 'drive', 'drive', [tok('us','pronoun','object'), tok('to','preposition','adverbial'), tok('the','article','det'), tok('beach','noun','adverbial','beach','sg')], 'Bố sẽ lái xe đưa chúng tôi ra biển.', 2, ['transport'], false, 'Sau will động từ ở dạng base: drive.', 'drive');
addWillAff([tok('The','article','det'), tok('flowers','noun','subject','flower','pl')], 'bloom', 'bloom', [tok('in','preposition','adverbial'), tok('spring','noun','adverbial','spring','uncountable')], 'Hoa sẽ nở rộ vào mùa xuân.', 2, ['nature'], false, 'Sau will dùng động từ nguyên thể: bloom.', 'bloom');
addWillAff([tok('We','pronoun','subject')], 'meet', 'meet', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('cinema','noun','adverbial','cinema','sg'), tok('tonight','adverb','adverbial')], 'Tối nay chúng ta sẽ gặp nhau ở rạp phim.', 2, ['place'], true, 'Điền trợ động từ will.', 'will');

addWillAff([tok('He','pronoun','subject')], 'swim', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('pool','noun','adverbial','pool','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai cậu ấy sẽ bơi ở hồ bơi.', 2, ['sport'], false, 'Sau will dùng dạng nguyên thể: swim.', 'swim');
addWillAff([tok('She','pronoun','subject')], 'wear', 'wear', [tok('a','article','det'), tok('pink','adjective','modifier'), tok('dress','noun','object','dress','sg'), tok('to','preposition','adverbial'), tok('the','article','det'), tok('party','noun','adverbial','party','sg')], 'Cô ấy sẽ mặc một chiếc váy hồng tới bữa tiệc.', 2, ['clothes'], false, 'Sau will dùng wear (nguyên thể).', 'wear');
addWillAff([tok('They','pronoun','subject')], 'join', 'join', [tok('the','article','det'), tok('music','noun','modifier','music','uncountable'), tok('club','noun','object','club','sg')], 'Họ sẽ tham gia câu lạc bộ âm nhạc.', 2, ['music'], true, 'Điền will.', 'will');
addWillAff([tok('I','pronoun','subject')], 'write', 'write', [tok('a','article','det'), tok('letter','noun','object','letter','sg'), tok('to','preposition','adverbial'), tok('my','determiner','det'), tok('friend','noun','adverbial','friend','sg')], 'Tôi sẽ viết một lá thư cho bạn tôi.', 2, ['study'], false, 'Sau will dùng write.', 'write');
addWillAff([tok('Tom','noun','subject','Tom','sg')], 'bring', 'bring', [tok('some','determiner','det'), tok('apples','noun','object','apple','pl'), tok('tomorrow','adverb','adverbial')], 'Ngày mai Tom sẽ mang theo vài quả táo.', 2, ['food'], false, 'Sau will dùng bring.', 'bring');
addWillAff([tok('We','pronoun','subject')], 'watch', 'watch', [tok('the','article','det'), tok('fireworks','noun','object','fireworks','pl'), tok('tonight','adverb','adverbial')], 'Tối nay chúng tôi sẽ ngắm pháo hoa.', 2, ['activity'], true, 'Điền will.', 'will');
addWillAff([tok('The','article','det'), tok('weather','noun','subject','weather','uncountable')], 'be', 'be', [tok('sunny','adjective','complement'), tok('tomorrow','adverb','adverbial')], 'Ngày mai thời tiết sẽ có nắng.', 1, ['weather'], false, 'Chia động từ be sau will.', 'Dạng nguyên thể của to be.');
addWillAff([tok('She','pronoun','subject')], 'bake', 'bake', [tok('a','article','det'), tok('cake','noun','object','cake','sg'), tok('for','preposition','adverbial'), tok('my','determiner','det'), tok('birthday','noun','adverbial','birthday','sg')], 'Cô ấy sẽ nướng một chiếc bánh cho sinh nhật tôi.', 2, ['food'], false, 'Sau will dùng bake.', 'bake');
addWillAff([tok('They','pronoun','subject')], 'stay', 'stay', [tok('at','preposition','adverbial'), tok('home','noun','adverbial','home','uncountable'), tok('tonight','adverb','adverbial')], 'Tối nay họ sẽ ở nhà.', 1, ['home'], true, 'Điền will.', 'will');
addWillAff([tok('He','pronoun','subject')], 'paint', 'paint', [tok('the','article','det'), tok('fence','noun','object','fence','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai cậu ấy sẽ sơn hàng rào.', 2, ['home'], false, 'Sau will dùng paint.', 'paint');

addWillAff([tok('Robots','noun','subject','robot','pl')], 'help', 'help', [tok('people','noun','object','person','pl'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('future','noun','adverbial','future','uncountable')], 'Người máy sẽ giúp đỡ con người trong tương lai.', 2, ['future'], true, 'Điền will.', 'will');
addWillAff([tok('I','pronoun','subject')], 'finish', 'finish', [tok('this','determiner','det'), tok('book','noun','object','book','sg'), tok('soon','adverb','adverbial')], 'Tôi sẽ sớm đọc xong cuốn sách này.', 2, ['study'], false, 'Sau will dùng finish.', 'finish');
addWillAff([tok('Our','determiner','det'), tok('team','noun','subject','team','sg')], 'win', 'win', [tok('the','article','det'), tok('match','noun','object','match','sg')], 'Đội của chúng ta sẽ thắng trận đấu.', 2, ['sport'], true, 'Điền will.', 'will');
addWillAff([tok('She','pronoun','subject')], 'take', 'take', [tok('many','determiner','det'), tok('photos','noun','object','photo','pl'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('trip','noun','adverbial','trip','sg')], 'Cô ấy sẽ chụp nhiều bức ảnh trong chuyến đi.', 2, ['hobby'], false, 'Sau will dùng take.', 'take');
addWillAff([tok('They','pronoun','subject')], 'sing', 'sing', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('festival','noun','adverbial','festival','sg')], 'Họ sẽ hát tại lễ hội.', 2, ['music'], false, 'Sau will dùng sing.', 'sing');
addWillAff([tok('Lan','noun','subject','Lan','sg')], 'dance', 'dance', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('school','noun','modifier','school','sg'), tok('concert','noun','adverbial','concert','sg')], 'Lan sẽ nhảy múa tại buổi hòa nhạc của trường.', 2, ['art'], false, 'Sau will dùng dance.', 'dance');
addWillAff([tok('The','article','det'), tok('doctor','noun','subject','doctor','sg')], 'examine', 'examine', [tok('the','article','det'), tok('patient','noun','object','patient','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai bác sĩ sẽ khám bệnh nhân.', 3, ['job'], true, 'Điền will.', 'will');
addWillAff([tok('We','pronoun','subject')], 'leave', 'leave', [tok('for','preposition','adverbial'), tok('Hue','noun','adverbial','Hue','sg'), tok('early','adverb','adverbial'), tok('tomorrow','adverb','adverbial')], 'Sáng mai chúng tôi sẽ lên đường đi Huế sớm.', 3, ['travel'], false, 'Sau will dùng leave.', 'leave');
addWillAff([tok('Students','noun','subject','student','pl')], 'plant', 'plant', [tok('green','adjective','modifier'), tok('trees','noun','object','tree','pl'), tok('next','adverb','adverbial'), tok('month','noun','adverbial','month','sg')], 'Tháng tới học sinh sẽ trồng cây xanh.', 2, ['nature'], true, 'Điền will.', 'will');
addWillAff([tok('He','pronoun','subject')], 'read', 'read', [tok('a','article','det'), tok('poem','noun','object','poem','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai cậu ấy sẽ đọc một bài thơ.', 2, ['study'], false, 'Sau will dùng read.', 'read');

addWillAff([tok('They','pronoun','subject')], 'open', 'open', [tok('a','article','det'), tok('new','adjective','modifier'), tok('bookstore','noun','object','bookstore','sg'), tok('soon','adverb','adverbial')], 'Họ sẽ sớm mở một hiệu sách mới.', 2, ['place'], true, 'Điền will.', 'will');
addWillAff([tok('I','pronoun','subject')], 'make', 'make', [tok('a','article','det'), tok('card','noun','object','card','sg'), tok('for','preposition','adverbial'), tok('my','determiner','det'), tok('teacher','noun','adverbial','teacher','sg')], 'Tôi sẽ làm một tấm thiệp cho cô giáo tôi.', 2, ['art'], false, 'Sau will dùng make.', 'make');
addWillAff([tok('She','pronoun','subject')], 'eat', 'eat', [tok('lunch','noun','object','lunch','uncountable'), tok('at','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai cô ấy sẽ ăn trưa ở trường.', 1, ['food'], false, 'Sau will dùng eat.', 'eat');
addWillAff([tok('We','pronoun','subject')], 'drink', 'drink', [tok('fresh','adjective','modifier'), tok('milk','noun','object','milk','uncountable'), tok('every','determiner','det'), tok('morning','noun','adverbial','morning','sg')], 'Chúng tôi sẽ uống sữa tươi mỗi sáng.', 2, ['drink'], true, 'Điền will.', 'will');
addWillAff([tok('The','article','det'), tok('children','noun','subject','child','pl')], 'play', 'play', [tok('happily','adverb','adverbial'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('garden','noun','adverbial','garden','sg')], 'Lũ trẻ sẽ chơi vui vẻ trong vườn.', 2, ['nature'], false, 'Sau will dùng play.', 'play');

// -------------------------------------------------------------------------
// NHÓM 2: WILL NEGATIVE (WON'T) (35 câu: B4-s-0046 -> B4-s-0080)
// -------------------------------------------------------------------------
addWillNeg([tok('They','pronoun','subject')], 'come', 'come', [tok('tomorrow','adverb','adverbial')], 'Ngày mai họ sẽ không đến.', 1, ['future'], true, 'Dùng dạng phủ định won\'t của will.', "won't");
addWillNeg([tok('I','pronoun','subject')], 'be', 'be', [tok('late','adjective','complement'), tok('tomorrow','adverb','adverbial')], 'Ngày mai tôi sẽ không bị muộn.', 1, ['future'], true, 'Dùng won\'t cho câu phủ định tương lai.', "won't");
addWillNeg([tok('He','pronoun','subject')], 'go', 'go', [tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('on','preposition','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg')], 'Cậu ấy sẽ không đi học vào Chủ nhật.', 1, ['school'], false, 'Sau won\'t dùng động từ base: go.', 'go');
addWillNeg([tok('She','pronoun','subject')], 'eat', 'eat', [tok('fast','adjective','modifier'), tok('food','noun','object','food','uncountable')], 'Cô ấy sẽ không ăn đồ ăn nhanh.', 1, ['food'], true, 'Phủ định của will là won\'t.', "won't");
addWillNeg([tok('We','pronoun','subject')], 'play', 'play', [tok('tennis','noun','object','tennis','uncountable'), tok('if','conjunction','adverbial'), tok('it','pronoun','adverbial'), tok('rains','verb','adverbial','rain','present-3sg')], 'Chúng tôi sẽ không chơi quần vợt nếu trời mưa.', 2, ['sport'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('It','pronoun','subject')], 'rain', 'rain', [tok('tomorrow','adverb','adverbial')], 'Ngày mai trời sẽ không mưa.', 1, ['weather'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('The','article','det'), tok('shops','noun','subject','shop','pl')], 'open', 'open', [tok('on','preposition','adverbial'), tok('holidays','noun','adverbial','holiday','pl')], 'Các cửa hàng sẽ không mở cửa vào ngày lễ.', 2, ['place'], false, 'Sau won\'t dùng open.', 'open');
addWillNeg([tok('I','pronoun','subject')], 'forget', 'forget', [tok('your','determiner','det'), tok('birthday','noun','object','birthday','sg')], 'Tôi sẽ không quên sinh nhật bạn đâu.', 2, ['daily'], true, 'Dùng won\'t để hứa.', "won't");
addWillNeg([tok('He','pronoun','subject')], 'watch', 'watch', [tok('TV','noun','object','tv','sg'), tok('tonight','adverb','adverbial')], 'Tối nay cậu ấy sẽ không xem tivi.', 1, ['hobby'], false, 'Sau won\'t dùng watch.', 'watch');
addWillNeg([tok('They','pronoun','subject')], 'travel', 'travel', [tok('by','preposition','adverbial'), tok('plane','noun','adverbial','plane','sg')], 'Họ sẽ không đi bằng máy bay.', 2, ['transport'], true, 'Dùng won\'t.', "won't");

addWillNeg([tok('Mother','noun','subject','mother','sg')], 'cook', 'cook', [tok('dinner','noun','object','dinner','uncountable'), tok('tonight','adverb','adverbial')], 'Tối nay mẹ sẽ không nấu cơm.', 1, ['food'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('She','pronoun','subject')], 'buy', 'buy', [tok('that','determiner','det'), tok('expensive','adjective','modifier'), tok('bag','noun','object','bag','sg')], 'Cô ấy sẽ không mua chiếc túi đắt tiền đó.', 2, ['clothes'], false, 'Sau won\'t dùng buy.', 'buy');
addWillNeg([tok('We','pronoun','subject')], 'stay', 'stay', [tok('up','particle','particle'), tok('late','adverb','adverbial')], 'Chúng tôi sẽ không thức khuya.', 2, ['daily'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('Nam','noun','subject','Nam','sg')], 'ride', 'ride', [tok('his','determiner','det'), tok('bike','noun','object','bike','sg'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('rain','noun','adverbial','rain','uncountable')], 'Nam sẽ không đạp xe dưới trời mưa.', 2, ['transport'], false, 'Sau won\'t dùng ride.', 'ride');
addWillNeg([tok('The','article','det'), tok('teacher','noun','subject','teacher','sg')], 'give', 'give', [tok('us','pronoun','object'), tok('homework','noun','object','homework','uncountable'), tok('today','adverb','adverbial')], 'Hôm nay cô giáo sẽ không giao bài tập về nhà.', 2, ['school'], false, 'Sau won\'t dùng give.', 'give');
addWillNeg([tok('You','pronoun','subject')], 'feel', 'feel', [tok('lonely','adjective','complement'), tok('here','adverb','adverbial')], 'Bạn sẽ không cảm thấy cô đơn ở đây đâu.', 2, ['feeling'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('They','pronoun','subject')], 'lose', 'lose', [tok('the','article','det'), tok('game','noun','object','game','sg')], 'Họ sẽ không thua trận đấu đâu.', 2, ['sport'], false, 'Sau won\'t dùng lose.', 'lose');
addWillNeg([tok('I','pronoun','subject')], 'tell', 'tell', [tok('anyone','pronoun','object'), tok('your','determiner','det'), tok('secret','noun','object','secret','sg')], 'Tôi sẽ không nói với ai bí mật của bạn đâu.', 3, ['daily'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('She','pronoun','subject')], 'wear', 'wear', [tok('that','determiner','det'), tok('heavy','adjective','modifier'), tok('coat','noun','object','coat','sg')], 'Cô ấy sẽ không mặc chiếc áo khoác dày đó.', 2, ['clothes'], false, 'Sau won\'t dùng wear.', 'wear');
addWillNeg([tok('The','article','det'), tok('bus','noun','subject','bus','sg')], 'stop', 'stop', [tok('here','adverb','adverbial')], 'Xe buýt sẽ không dừng lại ở đây.', 2, ['transport'], true, 'Dùng won\'t.', "won't");

addWillNeg([tok('We','pronoun','subject')], 'swim', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('cold','adjective','modifier'), tok('lake','noun','adverbial','lake','sg')], 'Chúng tôi sẽ không bơi trong hồ nước lạnh.', 2, ['sport'], false, 'Sau won\'t dùng swim.', 'swim');
addWillNeg([tok('He','pronoun','subject')], 'drink', 'drink', [tok('cold','adjective','modifier'), tok('water','noun','object','water','uncountable')], 'Cậu ấy sẽ không uống nước lạnh.', 1, ['drink'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('They','pronoun','subject')], 'clean', 'clean', [tok('the','article','det'), tok('yard','noun','object','yard','sg'), tok('today','adverb','adverbial')], 'Hôm nay họ sẽ không dọn sân.', 2, ['home'], false, 'Sau won\'t dùng clean.', 'clean');
addWillNeg([tok('She','pronoun','subject')], 'sing', 'sing', [tok('that','determiner','det'), tok('sad','adjective','modifier'), tok('song','noun','object','song','sg')], 'Cô ấy sẽ không hát bài ca buồn đó.', 2, ['music'], false, 'Sau won\'t dùng sing.', 'sing');
addWillNeg([tok('Tom','noun','subject','Tom','sg')], 'climb', 'climb', [tok('that','determiner','det'), tok('tall','adjective','modifier'), tok('tree','noun','object','tree','sg')], 'Tom sẽ không trèo cái cây cao đó.', 2, ['action'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('I','pronoun','subject')], 'leave', 'leave', [tok('without','preposition','adverbial'), tok('you','pronoun','adverbial')], 'Tôi sẽ không rời đi mà không có bạn.', 2, ['daily'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('The','article','det'), tok('baby','noun','subject','baby','sg')], 'cry', 'cry', [tok('if','conjunction','adverbial'), tok('you','pronoun','adverbial'), tok('smile','verb','adverbial','smile','base')], 'Em bé sẽ không khóc nếu bạn mỉm cười.', 2, ['family'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('They','pronoun','subject')], 'visit', 'visit', [tok('the','article','det'), tok('zoo','noun','object','zoo','sg'), tok('this','determiner','det'), tok('week','noun','adverbial','week','sg')], 'Tuần này họ sẽ không đi thăm sở thú.', 2, ['place'], false, 'Sau won\'t dùng visit.', 'visit');
addWillNeg([tok('We','pronoun','subject')], 'have', 'have', [tok('classes','noun','object','class','pl'), tok('tomorrow','adverb','adverbial')], 'Ngày mai chúng tôi sẽ không có giờ học.', 2, ['school'], false, 'Sau won\'t dùng have.', 'have');
addWillNeg([tok('She','pronoun','subject')], 'take', 'take', [tok('the','article','det'), tok('train','noun','object','train','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai cô ấy sẽ không đi tàu hỏa.', 2, ['transport'], false, 'Sau won\'t dùng take.', 'take');

addWillNeg([tok('He','pronoun','subject')], 'read', 'read', [tok('comics','noun','object','comic','pl'), tok('during','preposition','adverbial'), tok('class','noun','adverbial','class','sg')], 'Cậu ấy sẽ không đọc truyện tranh trong giờ học.', 2, ['school'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('They','pronoun','subject')], 'play', 'play', [tok('games','noun','object','game','pl'), tok('all','determiner','det'), tok('night','noun','adverbial','night','sg')], 'Họ sẽ không chơi trò chơi suốt đêm.', 2, ['game'], false, 'Sau won\'t dùng play.', 'play');
addWillNeg([tok('I','pronoun','subject')], 'buy', 'buy', [tok('soda','noun','object','soda','uncountable')], 'Tôi sẽ không mua nước ngọt có ga.', 1, ['drink'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('The','article','det'), tok('weather','noun','subject','weather','uncountable')], 'be', 'be', [tok('cold','adjective','complement'), tok('tomorrow','adverb','adverbial')], 'Ngày mai thời tiết sẽ không lạnh.', 2, ['weather'], true, 'Dùng won\'t.', "won't");
addWillNeg([tok('We','pronoun','subject')], 'wait', 'wait', [tok('any','adverb','adverbial'), tok('longer','adverb','adverbial')], 'Chúng tôi sẽ không chờ đợi thêm nữa.', 3, ['daily'], true, 'Dùng won\'t.', "won't");

// -------------------------------------------------------------------------
// NHÓM 3: WILL QUESTIONS (35 câu: B4-s-0081 -> B4-s-0115)
// -------------------------------------------------------------------------
addWillQ([tok('you','pronoun','subject')], 'help', 'help', [tok('me','pronoun','object')], 'Bạn sẽ giúp tôi chứ?', 1, ['daily'], true, 'Dùng Will ở đầu câu hỏi tương lai.', 'Will');
addWillQ([tok('they','pronoun','subject')], 'come', 'come', [tok('tomorrow','adverb','adverbial')], 'Ngày mai họ sẽ đến chứ?', 1, ['future'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('he','pronoun','subject')], 'play', 'play', [tok('football','noun','object','football','uncountable'), tok('with','preposition','adverbial'), tok('us','pronoun','adverbial')], 'Cậu ấy sẽ chơi bóng đá cùng chúng ta chứ?', 1, ['sport'], false, 'Sau Will dùng động từ base: play.', 'play');
addWillQ([tok('she','pronoun','subject')], 'visit', 'visit', [tok('her','determiner','det'), tok('grandparents','noun','object','grandparent','pl'), tok('next','adverb','adverbial'), tok('week','noun','adverbial','week','sg')], 'Tuần tới cô ấy sẽ về thăm ông bà chứ?', 2, ['family'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('it','pronoun','subject')], 'rain', 'rain', [tok('tomorrow','adverb','adverbial')], 'Ngày mai trời sẽ mưa chứ?', 1, ['weather'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('you','pronoun','subject')], 'join', 'join', [tok('our','determiner','det'), tok('club','noun','object','club','sg')], 'Bạn sẽ tham gia câu lạc bộ của chúng tôi chứ?', 2, ['school'], false, 'Sau Will dùng động từ base: join.', 'join');
addWillQ([tok('they','pronoun','subject')], 'travel', 'travel', [tok('to','preposition','adverbial'), tok('Hanoi','noun','adverbial','Hanoi','sg'), tok('by','preposition','adverbial'), tok('train','noun','adverbial','train','sg')], 'Họ sẽ đi du lịch Hà Nội bằng tàu hỏa chứ?', 2, ['transport'], false, 'Sau Will dùng travel.', 'travel');
addWillQ([tok('Nam','noun','subject','Nam','sg')], 'buy', 'buy', [tok('a','article','det'), tok('new','adjective','modifier'), tok('bike','noun','object','bike','sg')], 'Nam sẽ mua một chiếc xe đạp mới chứ?', 1, ['transport'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('we','pronoun','subject')], 'meet', 'meet', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('park','noun','adverbial','park','sg')], 'Chúng ta sẽ gặp nhau ở công viên chứ?', 1, ['place'], false, 'Sau Will dùng meet.', 'meet');
addWillQ([tok('she','pronoun','subject')], 'sing', 'sing', [tok('a','article','det'), tok('song','noun','object','song','sg'), tok('tonight','adverb','adverbial')], 'Tối nay cô ấy sẽ hát một bài chứ?', 2, ['music'], true, 'Trợ động từ câu hỏi: Will.', 'Will');

addWillQ([tok('you','pronoun','subject')], 'call', 'call', [tok('me','pronoun','object'), tok('later','adverb','adverbial')], 'Lát nữa bạn sẽ gọi cho tôi chứ?', 2, ['daily'], false, 'Sau Will dùng call.', 'call');
addWillQ([tok('he','pronoun','subject')], 'finish', 'finish', [tok('his','determiner','det'), tok('homework','noun','object','homework','uncountable'), tok('before','preposition','adverbial'), tok('dinner','noun','adverbial','dinner','uncountable')], 'Cậu ấy sẽ làm xong bài tập trước bữa tối chứ?', 2, ['school'], false, 'Sau Will dùng finish.', 'finish');
addWillQ([tok('they','pronoun','subject')], 'watch', 'watch', [tok('the','article','det'), tok('match','noun','object','match','sg'), tok('on','preposition','adverbial'), tok('TV','noun','adverbial','tv','sg')], 'Họ sẽ xem trận đấu trên tivi chứ?', 2, ['sport'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('she','pronoun','subject')], 'bake', 'bake', [tok('cookies','noun','object','cookie','pl'), tok('tomorrow','adverb','adverbial')], 'Ngày mai cô ấy sẽ nướng bánh quy chứ?', 2, ['food'], false, 'Sau Will dùng bake.', 'bake');
addWillQ([tok('the','article','det'), tok('weather','noun','subject','weather','uncountable')], 'be', 'be', [tok('warm','adjective','complement'), tok('this','determiner','det'), tok('weekend','noun','adverbial','weekend','sg')], 'Cuối tuần này thời tiết sẽ ấm áp chứ?', 2, ['weather'], false, 'Sau Will dùng be.', 'be');
addWillQ([tok('you','pronoun','subject')], 'wear', 'wear', [tok('your','determiner','det'), tok('new','adjective','modifier'), tok('shoes','noun','object','shoe','pl')], 'Bạn sẽ đi đôi giày mới chứ?', 2, ['clothes'], false, 'Sau Will dùng wear.', 'wear');
addWillQ([tok('they','pronoun','subject')], 'stay', 'stay', [tok('at','preposition','adverbial'), tok('a','article','det'), tok('hotel','noun','adverbial','hotel','sg')], 'Họ sẽ ở tại một khách sạn chứ?', 2, ['place'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('he','pronoun','subject')], 'become', 'become', [tok('a','article','det'), tok('famous','adjective','modifier'), tok('artist','noun','object','artist','sg')], 'Cậu ấy sẽ trở thành một họa sĩ nổi tiếng chứ?', 2, ['job'], false, 'Sau Will dùng become.', 'become');
addWillQ([tok('we','pronoun','subject')], 'have', 'have', [tok('a','article','det'), tok('picnic','noun','object','picnic','sg'), tok('next','adverb','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg')], 'Chủ nhật tới chúng ta sẽ đi dã ngoại chứ?', 2, ['activity'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('she','pronoun','subject')], 'write', 'write', [tok('to','preposition','adverbial'), tok('us','pronoun','adverbial'), tok('soon','adverb','adverbial')], 'Cô ấy sẽ sớm viết thư cho chúng ta chứ?', 2, ['study'], false, 'Sau Will dùng write.', 'write');

addWillQ([tok('you','pronoun','subject')], 'eat', 'eat', [tok('pizza','noun','object','pizza','uncountable'), tok('tonight','adverb','adverbial')], 'Tối nay bạn sẽ ăn bánh pizza chứ?', 1, ['food'], false, 'Sau Will dùng eat.', 'eat');
addWillQ([tok('they','pronoun','subject')], 'swim', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('sea','noun','adverbial','sea','sg')], 'Họ sẽ bơi ở biển chứ?', 2, ['sport'], false, 'Sau Will dùng swim.', 'swim');
addWillQ([tok('Lan','noun','subject','Lan','sg')], 'dance', 'dance', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('party','noun','adverbial','party','sg')], 'Lan sẽ nhảy múa ở bữa tiệc chứ?', 2, ['art'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('the','article','det'), tok('train','noun','subject','train','sg')], 'arrive', 'arrive', [tok('on','preposition','adverbial'), tok('time','noun','adverbial','time','uncountable')], 'Đoàn tàu sẽ đến đúng giờ chứ?', 2, ['transport'], false, 'Sau Will dùng arrive.', 'arrive');
addWillQ([tok('he','pronoun','subject')], 'bring', 'bring', [tok('his','determiner','det'), tok('guitar','noun','object','guitar','sg')], 'Cậu ấy sẽ mang đàn ghi-ta theo chứ?', 2, ['music'], false, 'Sau Will dùng bring.', 'bring');
addWillQ([tok('we','pronoun','subject')], 'see', 'see', [tok('the','article','det'), tok('monkeys','noun','object','monkey','pl'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('zoo','noun','adverbial','zoo','sg')], 'Chúng ta sẽ nhìn thấy các chú khỉ ở vườn thú chứ?', 2, ['animal'], false, 'Sau Will dùng see.', 'see');
addWillQ([tok('you','pronoun','subject')], 'clean', 'clean', [tok('your','determiner','det'), tok('room','noun','object','room','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai bạn sẽ dọn phòng chứ?', 1, ['home'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('they','pronoun','subject')], 'build', 'build', [tok('a','article','det'), tok('sandcastle','noun','object','sandcastle','sg'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('beach','noun','adverbial','beach','sg')], 'Họ sẽ xây lâu đài cát trên bãi biển chứ?', 2, ['toy'], false, 'Sau Will dùng build.', 'build');
addWillQ([tok('she','pronoun','subject')], 'cook', 'cook', [tok('lunch','noun','object','lunch','uncountable'), tok('for','preposition','adverbial'), tok('her','determiner','det'), tok('family','noun','adverbial','family','sg')], 'Cô ấy sẽ nấu bữa trưa cho gia đình chứ?', 2, ['food'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('robots','noun','subject','robot','pl')], 'replace', 'replace', [tok('teachers','noun','object','teacher','pl'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('future','noun','adverbial','future','uncountable')], 'Người máy sẽ thay thế giáo viên trong tương lai chứ?', 3, ['future'], true, 'Trợ động từ câu hỏi: Will.', 'Will');

addWillQ([tok('you','pronoun','subject')], 'be', 'be', [tok('free','adjective','complement'), tok('tomorrow','adverb','adverbial'), tok('evening','noun','adverbial','evening','sg')], 'Tối mai bạn sẽ rảnh chứ?', 2, ['daily'], false, 'Sau Will dùng be.', 'be');
addWillQ([tok('he','pronoun','subject')], 'take', 'take', [tok('an','article','det'), tok('umbrella','noun','object','umbrella','sg')], 'Cậu ấy sẽ mang theo ô chứ?', 2, ['daily'], false, 'Sau Will dùng take.', 'take');
addWillQ([tok('they','pronoun','subject')], 'open', 'open', [tok('the','article','det'), tok('windows','noun','object','window','pl')], 'Họ sẽ mở các cửa sổ chứ?', 1, ['home'], true, 'Trợ động từ câu hỏi: Will.', 'Will');
addWillQ([tok('we','pronoun','subject')], 'win', 'win', [tok('the','article','det'), tok('first','adjective','modifier'), tok('prize','noun','object','prize','sg')], 'Chúng ta sẽ giành giải nhất chứ?', 2, ['sport'], false, 'Sau Will dùng win.', 'win');
addWillQ([tok('she','pronoun','subject')], 'fly', 'fly', [tok('to','preposition','adverbial'), tok('Singapore','noun','adverbial','Singapore','sg'), tok('next','adverb','adverbial'), tok('month','noun','adverbial','month','sg')], 'Tháng tới cô ấy sẽ bay tới Singapore chứ?', 3, ['travel'], true, 'Trợ động từ câu hỏi: Will.', 'Will');

// -------------------------------------------------------------------------
// NHÓM 4: BE GOING TO (35 câu: B4-s-0116 -> B4-s-0150)
// -------------------------------------------------------------------------
addBeGoingTo([tok('I','pronoun','subject')], 'am', 'present-1sg', 'buy', 'buy', [tok('a','article','det'), tok('new','adjective','modifier'), tok('bicycle','noun','object','bicycle','sg')], 'Tôi dự định mua một chiếc xe đạp mới.', 1, ['transport'], 'be', 'Chủ ngữ I đi với to be am trong be going to.', 'I + am');
addBeGoingTo([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'visit', 'visit', [tok('Hanoi','noun','object','Hanoi','sg'), tok('next','adverb','adverbial'), tok('week','noun','adverbial','week','sg')], 'Cậu ấy dự định thăm Hà Nội vào tuần tới.', 1, ['travel'], 'be', 'Chủ ngữ He đi với is.', 'he + is');
addBeGoingTo([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'have', 'have', [tok('a','article','det'), tok('birthday','noun','modifier','birthday','sg'), tok('party','noun','object','party','sg')], 'Họ dự định tổ chức một bữa tiệc sinh nhật.', 1, ['party'], 'be', 'Chủ ngữ They đi với are.', 'they + are');
addBeGoingTo([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'cook', 'cook', [tok('dinner','noun','object','dinner','uncountable'), tok('tonight','adverb','adverbial')], 'Tối nay cô ấy dự định nấu bữa tối.', 1, ['food'], 'going', 'Cấu trúc be going to: điền going.', 'going');
addBeGoingTo([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'play', 'play', [tok('football','noun','object','football','uncountable'), tok('this','determiner','det'), tok('afternoon','noun','adverbial','afternoon','sg')], 'Chiều nay chúng tôi dự định chơi bóng đá.', 1, ['sport'], 'verb', 'Sau to dùng động từ nguyên thể: play.', 'play');
addBeGoingTo([tok('I','pronoun','subject')], 'am', 'present-1sg', 'read', 'read', [tok('this','determiner','det'), tok('storybook','noun','object','storybook','sg')], 'Tôi dự định đọc cuốn truyện này.', 1, ['study'], 'verb', 'Sau to dùng động từ nguyên thể: read.', 'read');
addBeGoingTo([tok('Nam','noun','subject','Nam','sg')], 'is', 'aux-present-3sg', 'clean', 'clean', [tok('his','determiner','det'), tok('room','noun','object','room','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai Nam dự định dọn phòng.', 2, ['home'], 'be', 'Chủ ngữ số ít Nam đi với is.', 'Nam + is');
addBeGoingTo([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'swim', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('lake','noun','adverbial','lake','sg')], 'Họ dự định bơi ở hồ.', 2, ['sport'], 'going', 'Cấu trúc be going to: điền going.', 'going');
addBeGoingTo([tok('Mother','noun','subject','mother','sg')], 'is', 'aux-present-3sg', 'bake', 'bake', [tok('a','article','det'), tok('chocolate','noun','modifier','chocolate','uncountable'), tok('cake','noun','object','cake','sg')], 'Mẹ dự định nướng một chiếc bánh sô-cô-la.', 2, ['food'], 'verb', 'Sau to dùng động từ nguyên thể: bake.', 'bake');
addBeGoingTo([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'watch', 'watch', [tok('a','article','det'), tok('movie','noun','object','movie','sg'), tok('tonight','adverb','adverbial')], 'Tối nay chúng tôi dự định xem phim.', 1, ['hobby'], 'be', 'Chủ ngữ We đi với are.', 'we + are');

addBeGoingTo([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'paint', 'paint', [tok('her','determiner','det'), tok('bedroom','noun','object','bedroom','sg'), tok('pink','adjective','modifier')], 'Cô ấy dự định sơn phòng ngủ màu hồng.', 2, ['home'], 'be', 'Chủ ngữ She đi với is.', 'she + is');
addBeGoingTo([tok('Tom','noun','subject','Tom','sg')], 'is', 'aux-present-3sg', 'fly', 'fly', [tok('to','preposition','adverbial'), tok('Da','noun','modifier','Da','sg'), tok('Nang','noun','adverbial','Nang','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai Tom dự định bay tới Đà Nẵng.', 2, ['travel'], 'verb', 'Sau to dùng động từ nguyên thể fly.', 'fly');
addBeGoingTo([tok('I','pronoun','subject')], 'am', 'present-1sg', 'learn', 'learn', [tok('to','particle','particle'), tok('play','verb','object','play','base'), tok('guitar','noun','object','guitar','sg')], 'Tôi dự định học chơi đàn ghi-ta.', 2, ['music'], 'be', 'I đi với to be am.', 'I + am');
addBeGoingTo([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'plant', 'plant', [tok('more','determiner','det'), tok('trees','noun','object','tree','pl'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('garden','noun','adverbial','garden','sg')], 'Họ dự định trồng thêm cây trong vườn.', 2, ['nature'], 'going', 'Điền going trong be going to.', 'going');
addBeGoingTo([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'write', 'write', [tok('a','article','det'), tok('letter','noun','object','letter','sg'), tok('to','preposition','adverbial'), tok('his','determiner','det'), tok('penpal','noun','adverbial','penpal','sg')], 'Cậu ấy dự định viết thư cho bạn qua thư.', 2, ['study'], 'verb', 'Sau to dùng động từ base: write.', 'write');
addBeGoingTo([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'travel', 'travel', [tok('around','preposition','adverbial'), tok('Vietnam','noun','adverbial','Vietnam','sg'), tok('this','determiner','det'), tok('summer','noun','adverbial','summer','sg')], 'Mùa hè này chúng tôi dự định đi du lịch khắp Việt Nam.', 2, ['travel'], 'be', 'We đi với are.', 'we + are');
addBeGoingTo([tok('My','determiner','det'), tok('father','noun','subject','father','sg')], 'is', 'aux-present-3sg', 'wash', 'wash', [tok('the','article','det'), tok('car','noun','object','car','sg'), tok('tomorrow','adverb','adverbial')], 'Ngày mai bố tôi dự định rửa xe ô tô.', 2, ['transport'], 'be', 'My father đi với is.', 'father + is');
addBeGoingTo([tok('The','article','det'), tok('students','noun','subject','student','pl')], 'are', 'aux-present-other', 'take', 'take', [tok('an','article','det'), tok('exam','noun','object','exam','sg'), tok('next','adverb','adverbial'), tok('Monday','noun','adverbial','Monday','sg')], 'Thứ Hai tới các học sinh dự định làm bài thi.', 2, ['school'], 'going', 'Điền going.', 'going');
addBeGoingTo([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'wear', 'wear', [tok('her','determiner','det'), tok('new','adjective','modifier'), tok('dress','noun','object','dress','sg')], 'Cô ấy dự định mặc chiếc váy mới của mình.', 2, ['clothes'], 'verb', 'Sau to dùng wear.', 'wear');
addBeGoingTo([tok('I','pronoun','subject')], 'am', 'present-1sg', 'help', 'help', [tok('my','determiner','det'), tok('mother','noun','object','mother','sg'), tok('with','preposition','adverbial'), tok('the','article','det'), tok('cooking','noun','adverbial','cooking','uncountable')], 'Tôi dự định giúp mẹ nấu ăn.', 2, ['family'], 'be', 'I đi với am.', 'I + am');

addBeGoingTo([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'build', 'build', [tok('a','article','det'), tok('bridge','noun','object','bridge','sg'), tok('here','adverb','adverbial')], 'Họ dự định xây một cây cầu ở đây.', 3, ['place'], 'verb', 'Sau to dùng build.', 'build');
addBeGoingTo([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'join', 'join', [tok('the','article','det'), tok('school','noun','modifier','school','sg'), tok('band','noun','object','band','sg')], 'Cậu ấy dự định tham gia ban nhạc trường.', 2, ['music'], 'going', 'Điền going.', 'going');
addBeGoingTo([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'eat', 'eat', [tok('seafood','noun','object','seafood','uncountable'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('restaurant','noun','adverbial','restaurant','sg')], 'Chúng tôi dự định ăn hải sản ở nhà hàng.', 2, ['food'], 'verb', 'Sau to dùng eat.', 'eat');
addBeGoingTo([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'buy', 'buy', [tok('some','determiner','det'), tok('fresh','adjective','modifier'), tok('flowers','noun','object','flower','pl')], 'Cô ấy dự định mua vài bông hoa tươi.', 2, ['nature'], 'be', 'She đi với is.', 'she + is');
addBeGoingTo([tok('The','article','det'), tok('children','noun','subject','child','pl')], 'are', 'aux-present-other', 'visit', 'visit', [tok('the','article','det'), tok('history','noun','modifier','history','uncountable'), tok('museum','noun','object','museum','sg')], 'Lũ trẻ dự định đi thăm bảo tàng lịch sử.', 2, ['place'], 'be', 'The children (số nhiều) đi với are.', 'children + are');
addBeGoingTo([tok('I','pronoun','subject')], 'am', 'present-1sg', 'call', 'call', [tok('my','determiner','det'), tok('grandma','noun','object','grandma','sg'), tok('tonight','adverb','adverbial')], 'Tối nay tôi dự định gọi điện cho bà.', 2, ['family'], 'verb', 'Sau to dùng call.', 'call');
addBeGoingTo([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'meet', 'meet', [tok('his','determiner','det'), tok('friends','noun','object','friend','pl'), tok('at','preposition','adverbial'), tok('five','numeral','adverbial')], 'Cậu ấy dự định gặp bạn bè lúc năm giờ.', 2, ['daily'], 'going', 'Điền going.', 'going');
addBeGoingTo([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'stay', 'stay', [tok('with','preposition','adverbial'), tok('their','determiner','det'), tok('aunt','noun','adverbial','aunt','sg'), tok('this','determiner','det'), tok('week','noun','adverbial','week','sg')], 'Tuần này họ dự định ở cùng dì của mình.', 2, ['family'], 'be', 'They đi với are.', 'they + are');
addBeGoingTo([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'clean', 'clean', [tok('the','article','det'), tok('entire','adjective','modifier'), tok('house','noun','object','house','sg')], 'Chúng tôi dự định dọn dẹp toàn bộ ngôi nhà.', 3, ['home'], 'verb', 'Sau to dùng clean.', 'clean');
addBeGoingTo([tok('Lan','noun','subject','Lan','sg')], 'is', 'aux-present-3sg', 'sing', 'sing', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('party','noun','adverbial','party','sg')], 'Lan dự định hát tại bữa tiệc.', 2, ['music'], 'be', 'Lan đi với is.', 'Lan + is');

addBeGoingTo([tok('The','article','det'), tok('dog','noun','subject','dog','sg')], 'is', 'aux-present-3sg', 'catch', 'catch', [tok('the','article','det'), tok('ball','noun','object','ball','sg')], 'Chú chó sắp sửa bắt quả bóng.', 2, ['animal'], 'going', 'Điền going.', 'going');
addBeGoingTo([tok('You','pronoun','subject')], 'are', 'aux-present-other', 'love', 'love', [tok('this','determiner','det'), tok('new','adjective','modifier'), tok('game','noun','object','game','sg')], 'Bạn chắc chắn sẽ yêu thích trò chơi mới này.', 2, ['game'], 'be', 'You đi với are.', 'you + are');
addBeGoingTo([tok('It','pronoun','subject')], 'is', 'aux-present-3sg', 'snow', 'snow', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('mountains','noun','adverbial','mountain','pl')], 'Sắp sửa có tuyết rơi trên núi.', 3, ['weather'], 'be', 'It đi với is.', 'it + is');
addBeGoingTo([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'finish', 'finish', [tok('our','determiner','det'), tok('project','noun','object','project','sg'), tok('soon','adverb','adverbial')], 'Chúng tôi dự định sẽ sớm hoàn thành dự án.', 2, ['school'], 'verb', 'Sau to dùng finish.', 'finish');
addBeGoingTo([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'open', 'open', [tok('their','determiner','det'), tok('gifts','noun','object','gift','pl'), tok('now','adverb','adverbial')], 'Họ sắp sửa mở các món quà của mình.', 2, ['gift'], 'going', 'Điền going.', 'going');

// -------------------------------------------------------------------------
// NHÓM 5: REVIEW 4 TENSES (50 câu: B4-s-0151 -> B4-s-0200)
// Pha ôn tập 4 thì: Hiện tại đơn, Hiện tại tiếp diễn, Quá khứ đơn, Tương lai
// -------------------------------------------------------------------------
function addReviewSentence(gp, en, vi, diff, tags, tokens, roleSpans, blankDef) {
  addSentence(gp, en, vi, diff, ['review', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// 1. Ôn Hiện tại đơn (12 câu)
addReviewSentence('review-present-simple', 'She drinks milk every morning.', 'Cô ấy uống sữa mỗi sáng.', 1, ['present-simple', 'routine'],
  [tok('She','pronoun','subject'), tok('drinks','verb','verb','drink','present-3sg'), tok('milk','noun','object','milk','uncountable'), tok('every','determiner','det'), tok('morning','noun','adverbial','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:1, ans:'drinks', promptVi:'Chia động từ drink theo thói quen mỗi sáng với she.', hint:'drink → drinks'});

addReviewSentence('review-present-simple', 'He usually walks to school.', 'Cậu ấy thường xuyên đi bộ tới trường.', 1, ['present-simple', 'routine'],
  [tok('He','pronoun','subject'), tok('usually','adverb','adverbial'), tok('walks','verb','verb','walk','present-3sg'), tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:2, ans:'walks', promptVi:'Chia walk ở hiện tại đơn với he.', hint:'walk → walks'});

addReviewSentence('review-present-simple', 'They do not like cold weather.', 'Họ không thích thời tiết lạnh.', 2, ['present-simple', 'negative'],
  [tok('They','pronoun','subject'), tok('do','verb','verb','do','aux-present-other'), tok('not','adverb','adverbial'), tok('like','verb','verb','like','base'), tok('cold','adjective','modifier'), tok('weather','noun','object','weather','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:1, ans:'do', promptVi:'Điền trợ động từ phủ định hiện tại đơn với they.', hint:'they + do not'});

addReviewSentence('review-present-simple', 'Does he play tennis on Saturday?', 'Cậu ấy có chơi quần vợt vào thứ Bảy không?', 2, ['present-simple', 'question'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('he','pronoun','subject'), tok('play','verb','verb','play','base'), tok('tennis','noun','object','tennis','uncountable'), tok('on','preposition','adverbial'), tok('Saturday','noun','adverbial','Saturday','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Does', promptVi:'Điền trợ động từ câu hỏi hiện tại đơn với he.', hint:'Does + he'});

addReviewSentence('review-present-simple', 'My cat sleeps on the sofa.', 'Con mèo của tôi ngủ trên ghế sô-pha.', 1, ['present-simple'],
  [tok('My','determiner','det'), tok('cat','noun','subject','cat','sg'), tok('sleeps','verb','verb','sleep','present-3sg'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('sofa','noun','adverbial','sofa','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:2, ans:'sleeps', promptVi:'Chia sleep theo My cat (số ít).', hint:'sleep → sleeps'});

addReviewSentence('review-present-simple', 'We study English on Monday.', 'Chúng tôi học tiếng Anh vào thứ Hai.', 1, ['present-simple'],
  [tok('We','pronoun','subject'), tok('study','verb','verb','study','base'), tok('English','noun','object','English','uncountable'), tok('on','preposition','adverbial'), tok('Monday','noun','adverbial','Monday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:1, ans:'study', promptVi:'Chủ ngữ We đi với động từ nguyên thể study.', hint:'study'});

addReviewSentence('review-present-simple', 'The sun rises in the east.', 'Mặt trời mọc ở hướng đông.', 2, ['present-simple', 'truth'],
  [tok('The','article','det'), tok('sun','noun','subject','sun','sg'), tok('rises','verb','verb','rise','present-3sg'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('east','noun','adverbial','east','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:2, ans:'rises', promptVi:'Sự thật hiển nhiên chia hiện tại đơn: rises.', hint:'rise → rises'});

addReviewSentence('review-present-simple', 'I always brush my teeth.', 'Tôi luôn luôn đánh răng.', 1, ['present-simple'],
  [tok('I','pronoun','subject'), tok('always','adverb','adverbial'), tok('brush','verb','verb','brush','base'), tok('my','determiner','det'), tok('teeth','noun','object','tooth','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}],
  {idx:2, ans:'brush', promptVi:'I đi với động từ nguyên thể brush.', hint:'brush'});

addReviewSentence('review-present-simple', 'She does her homework early.', 'Cô ấy làm bài tập về nhà sớm.', 1, ['present-simple'],
  [tok('She','pronoun','subject'), tok('does','verb','verb','do','present-3sg'), tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), tok('early','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:1, ans:'does', promptVi:'Chia do với chủ ngữ she: does.', hint:'do → does'});

addReviewSentence('review-present-simple', 'Do they live in a big city?', 'Họ có sống ở một thành phố lớn không?', 2, ['present-simple', 'question'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('they','pronoun','subject'), tok('live','verb','verb','live','base'), tok('in','preposition','adverbial'), tok('a','article','det'), tok('big','adjective','modifier'), tok('city','noun','adverbial','city','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5,6]}],
  {idx:0, ans:'Do', promptVi:'Trợ động từ câu hỏi hiện tại đơn với they: Do.', hint:'Do + they'});

addReviewSentence('review-present-simple', 'He never drinks coffee.', 'Cậu ấy không bao giờ uống cà phê.', 2, ['present-simple'],
  [tok('He','pronoun','subject'), tok('never','adverb','adverbial'), tok('drinks','verb','verb','drink','present-3sg'), tok('coffee','noun','object','coffee','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  {idx:2, ans:'drinks', promptVi:'Sau never, chia động từ theo he: drinks.', hint:'drink → drinks'});

addReviewSentence('review-present-simple', 'Birds sing in the morning.', 'Chim chóc hót vào buổi sáng.', 1, ['present-simple'],
  [tok('Birds','noun','subject','bird','pl'), tok('sing','verb','verb','sing','base'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('morning','noun','adverbial','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3,4]}],
  {idx:1, ans:'sing', promptVi:'Birds số nhiều đi với động từ nguyên thể sing.', hint:'sing'});

// 2. Ôn Hiện tại tiếp diễn (12 câu)
addReviewSentence('review-present-continuous', 'He is running in the park now.', 'Bây giờ cậu ấy đang chạy trong công viên.', 2, ['present-continuous'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('running','verb','verb','run','ing'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('park','noun','adverbial','park','sg'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:2, ans:'running', promptVi:'Hành động đang diễn ra now: run gấp đôi n thêm ing.', hint:'run → running'});

addReviewSentence('review-present-continuous', 'She is reading a story right now.', 'Ngay lúc này cô ấy đang đọc truyện.', 2, ['present-continuous'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('reading','verb','verb','read','ing'), tok('a','article','det'), tok('story','noun','object','story','sg'), tok('right','adverb','adverbial'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:2, ans:'reading', promptVi:'Dấu hiệu right now: chia tiếp diễn reading.', hint:'read → reading'});

addReviewSentence('review-present-continuous', 'They are playing basketball at present.', 'Hiện tại họ đang chơi bóng rổ.', 2, ['present-continuous'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','aux-present-other'), tok('playing','verb','verb','play','ing'), tok('basketball','noun','object','basketball','uncountable'), tok('at','preposition','adverbial'), tok('present','noun','adverbial','present','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:1, ans:'are', promptVi:'Chủ ngữ they đi với to be are.', hint:'they + are'});

addReviewSentence('review-present-continuous', 'I am writing an email at the moment.', 'Lúc này tôi đang viết một bức thư điện tử.', 2, ['present-continuous'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('writing','verb','verb','write','ing'), tok('an','article','det'), tok('email','noun','object','email','sg'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('moment','noun','adverbial','moment','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:2, ans:'writing', promptVi:'Write bỏ e thêm -ing: writing.', hint:'write → writing'});

addReviewSentence('review-present-continuous', 'We are not watching TV now.', 'Bây giờ chúng tôi không đang xem tivi.', 2, ['present-continuous', 'negative'],
  [tok('We','pronoun','subject'), tok('are','verb','verb','be','aux-present-other'), tok('not','adverb','adverbial'), tok('watching','verb','verb','watch','ing'), tok('TV','noun','object','tv','sg'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:3, ans:'watching', promptVi:'Chia tiếp diễn của watch: watching.', hint:'watch → watching'});

addReviewSentence('review-present-continuous', 'Is the baby sleeping in the bedroom?', 'Em bé đang ngủ trong phòng ngủ phải không?', 2, ['present-continuous', 'question'],
  [tok('Is','verb','verb','be','aux-present-3sg'), tok('the','article','det'), tok('baby','noun','subject','baby','sg'), tok('sleeping','verb','verb','sleep','ing'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('bedroom','noun','adverbial','bedroom','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,3]}, {clauseId:'c1', role:'subject', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'Is', promptVi:'To be hỏi cho the baby: Is.', hint:'Is + the baby'});

addReviewSentence('review-present-continuous', 'The birds are singing in the tree.', 'Những chú chim đang hót trên cây.', 2, ['present-continuous'],
  [tok('The','article','det'), tok('birds','noun','subject','bird','pl'), tok('are','verb','verb','be','aux-present-other'), tok('singing','verb','verb','sing','ing'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('tree','noun','adverbial','tree','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:2, ans:'are', promptVi:'The birds số nhiều đi với to be are.', hint:'birds + are'});

addReviewSentence('review-present-continuous', 'She is dancing gracefully on the stage.', 'Cô ấy đang khiêu vũ uyển chuyển trên sân khấu.', 3, ['present-continuous'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('dancing','verb','verb','dance','ing'), tok('gracefully','adverb','adverbial'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('stage','noun','adverbial','stage','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:2, ans:'dancing', promptVi:'Dance bỏ e thêm ing: dancing.', hint:'dance → dancing'});

addReviewSentence('review-present-continuous', 'Mother is cooking dinner in the kitchen.', 'Mẹ đang nấu bữa tối trong bếp.', 1, ['present-continuous'],
  [tok('Mother','noun','subject','mother','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('cooking','verb','verb','cook','ing'), tok('dinner','noun','object','dinner','uncountable'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('kitchen','noun','adverbial','kitchen','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:2, ans:'cooking', promptVi:'Chia tiếp diễn của cook: cooking.', hint:'cook → cooking'});

addReviewSentence('review-present-continuous', 'The dog is swimming in the pool.', 'Chú chó đang bơi ở hồ.', 2, ['present-continuous'],
  [tok('The','article','det'), tok('dog','noun','subject','dog','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('swimming','verb','verb','swim','ing'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('pool','noun','adverbial','pool','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:3, ans:'swimming', promptVi:'Swim nhân đôi m thêm ing: swimming.', hint:'swim → swimming'});

addReviewSentence('review-present-continuous', 'We are studying math together.', 'Chúng tôi đang cùng nhau học toán.', 1, ['present-continuous'],
  [tok('We','pronoun','subject'), tok('are','verb','verb','be','aux-present-other'), tok('studying','verb','verb','study','ing'), tok('math','noun','object','math','uncountable'), tok('together','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:2, ans:'studying', promptVi:'Study giữ nguyên y thêm ing: studying.', hint:'study → studying'});

addReviewSentence('review-present-continuous', 'Are they listening to the teacher?', 'Họ đang lắng nghe cô giáo phải không?', 2, ['present-continuous', 'question'],
  [tok('Are','verb','verb','be','aux-present-other'), tok('they','pronoun','subject'), tok('listening','verb','verb','listen','ing'), tok('to','preposition','adverbial'), tok('the','article','det'), tok('teacher','noun','adverbial','teacher','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Are', promptVi:'To be hỏi cho they: Are.', hint:'Are + they'});

// 3. Ôn Quá khứ đơn (13 câu)
addReviewSentence('review-past-simple', 'I went to school yesterday.', 'Hôm qua tôi đã đi học.', 1, ['past-simple', 'irregular'],
  [tok('I','pronoun','subject'), tok('went','verb','verb','go','past'), tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:1, ans:'went', promptVi:'Hôm qua (yesterday) chia go ở quá khứ: went.', hint:'go → went'});

addReviewSentence('review-past-simple', 'She watched TV last night.', 'Tối qua cô ấy đã xem tivi.', 1, ['past-simple', 'regular'],
  [tok('She','pronoun','subject'), tok('watched','verb','verb','watch','past'), tok('TV','noun','object','tv','sg'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:1, ans:'watched', promptVi:'Last night chia watch ở quá khứ: watched.', hint:'watch → watched'});

addReviewSentence('review-past-simple', 'We ate pizza for dinner yesterday.', 'Hôm qua chúng tôi đã ăn bánh pizza cho bữa tối.', 2, ['past-simple', 'irregular'],
  [tok('We','pronoun','subject'), tok('ate','verb','verb','eat','past'), tok('pizza','noun','object','pizza','uncountable'), tok('for','preposition','adverbial'), tok('dinner','noun','adverbial','dinner','uncountable'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:1, ans:'ate', promptVi:'Quá khứ của eat là ate.', hint:'eat → ate'});

addReviewSentence('review-past-simple', 'He was tired last night.', 'Tối qua cậu ấy đã mệt.', 1, ['past-simple', 'was-were'],
  [tok('He','pronoun','subject'), tok('was','verb','verb','be','aux-past'), tok('tired','adjective','complement'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:1, ans:'was', promptVi:'Chủ ngữ He đi với was ở quá khứ.', hint:'He + was'});

addReviewSentence('review-past-simple', 'They were at the zoo last Sunday.', 'Chủ nhật trước họ đã ở vườn thú.', 1, ['past-simple', 'was-were'],
  [tok('They','pronoun','subject'), tok('were','verb','verb','be','aux-past'), tok('at','preposition','prep'), tok('the','article','det'), tok('zoo','noun','prep-object','zoo','sg'), tok('last','adverb','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:1, ans:'were', promptVi:'They đi với were ở quá khứ.', hint:'They + were'});

addReviewSentence('review-past-simple', 'She did not go to school yesterday.', 'Hôm qua cô ấy đã không đi học.', 2, ['past-simple', 'negative'],
  [tok('She','pronoun','subject'), tok('did','verb','verb','do','aux-past'), tok('not','adverb','adverbial'), tok('go','verb','verb','go','base'), tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:3, ans:'go', promptVi:'Sau did not, động từ về nguyên thể base: go.', hint:'go'});

addReviewSentence('review-past-simple', 'Did you see the big elephant?', 'Bạn đã nhìn thấy con voi to chứ?', 2, ['past-simple', 'question'],
  [tok('Did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('see','verb','verb','see','base'), tok('the','article','det'), tok('big','adjective','modifier'), tok('elephant','noun','object','elephant','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Did', promptVi:'Trợ động từ câu hỏi quá khứ: Did.', hint:'Did + S + V'});

addReviewSentence('review-past-simple', 'Mother bought fresh fruit yesterday.', 'Hôm qua mẹ đã mua hoa quả tươi.', 2, ['past-simple', 'irregular'],
  [tok('Mother','noun','subject','mother','sg'), tok('bought','verb','verb','buy','past'), tok('fresh','adjective','modifier'), tok('fruit','noun','object','fruit','uncountable'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:1, ans:'bought', promptVi:'Quá khứ của buy là bought.', hint:'buy → bought'});

addReviewSentence('review-past-simple', 'Nam visited his uncle last week.', 'Tuần trước Nam đã thăm chú mình.', 2, ['past-simple', 'regular'],
  [tok('Nam','noun','subject','Nam','sg'), tok('visited','verb','verb','visit','past'), tok('his','determiner','det'), tok('uncle','noun','object','uncle','sg'), tok('last','adverb','adverbial'), tok('week','noun','adverbial','week','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:1, ans:'visited', promptVi:'Quá khứ của visit: visited.', hint:'visit → visited'});

addReviewSentence('review-past-simple', 'They cleaned the classroom yesterday.', 'Hôm qua họ đã dọn dẹp lớp học.', 1, ['past-simple', 'regular'],
  [tok('They','pronoun','subject'), tok('cleaned','verb','verb','clean','past'), tok('the','article','det'), tok('classroom','noun','object','classroom','sg'), tok('yesterday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:1, ans:'cleaned', promptVi:'Clean thêm ed: cleaned.', hint:'clean → cleaned'});

addReviewSentence('review-past-simple', 'The cat caught a small mouse.', 'Con mèo đã bắt được một con chuột nhỏ.', 2, ['past-simple', 'irregular'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('caught','verb','verb','catch','past'), tok('a','article','det'), tok('small','adjective','modifier'), tok('mouse','noun','object','mouse','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4,5]}],
  {idx:2, ans:'caught', promptVi:'Quá khứ của catch là caught.', hint:'catch → caught'});

addReviewSentence('review-past-simple', 'I wrote a poem two days ago.', 'Cách đây hai ngày tôi đã viết một bài thơ.', 2, ['past-simple', 'irregular'],
  [tok('I','pronoun','subject'), tok('wrote','verb','verb','write','past'), tok('a','article','det'), tok('poem','noun','object','poem','sg'), tok('two','numeral','adverbial'), tok('days','noun','adverbial','day','pl'), tok('ago','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:1, ans:'wrote', promptVi:'Quá khứ của write là wrote.', hint:'write → wrote'});

addReviewSentence('review-past-simple', 'The bus stopped here an hour ago.', 'Xe buýt đã dừng ở đây một giờ trước.', 2, ['past-simple', 'regular'],
  [tok('The','article','det'), tok('bus','noun','subject','bus','sg'), tok('stopped','verb','verb','stop','past'), tok('here','adverb','adverbial'), tok('an','article','det'), tok('hour','noun','adverbial','hour','sg'), tok('ago','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:2, ans:'stopped', promptVi:'Stop nhân đôi p thêm ed: stopped.', hint:'stop → stopped'});

// 4. Ôn Tương lai (13 câu)
addReviewSentence('review-future', 'I will call you tomorrow morning.', 'Sáng mai tôi sẽ gọi điện cho bạn.', 1, ['future', 'will'],
  [tok('I','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('call','verb','verb','call','base'), tok('you','pronoun','object'), tok('tomorrow','adverb','adverbial'), tok('morning','noun','adverbial','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:1, ans:'will', promptVi:'Điền trợ động từ tương lai will.', hint:'will'});

addReviewSentence('review-future', 'She will not come to the party.', 'Cô ấy sẽ không đến bữa tiệc.', 2, ['future', 'negative'],
  [tok('She','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('not','adverb','adverbial'), tok('come','verb','verb','come','base'), tok('to','preposition','adverbial'), tok('the','article','det'), tok('party','noun','adverbial','party','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:1, ans:'will', promptVi:'Điền will not cho phủ định tương lai.', hint:'will'});

addReviewSentence('review-future', 'Will they travel by plane next month?', 'Tháng tới họ sẽ đi bằng máy bay chứ?', 2, ['future', 'question'],
  [tok('Will','verb','verb','will','aux-future'), tok('they','pronoun','subject'), tok('travel','verb','verb','travel','base'), tok('by','preposition','adverbial'), tok('plane','noun','adverbial','plane','sg'), tok('next','adverb','adverbial'), tok('month','noun','adverbial','month','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0,2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'Will', promptVi:'Trợ động từ câu hỏi tương lai: Will.', hint:'Will'});

addReviewSentence('review-future', 'He is going to visit Hanoi soon.', 'Cậu ấy dự định sẽ sớm đi thăm Hà Nội.', 2, ['future', 'be-going-to'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('going','verb','verb','go','ing'), tok('to','particle','particle'), tok('visit','verb','verb','visit','base'), tok('Hanoi','noun','object','Hanoi','sg'), tok('soon','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2,4]}, {clauseId:'c1', role:'object', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:1, ans:'is', promptVi:'He đi với to be is trong be going to.', hint:'He + is'});

addReviewSentence('review-future', 'We are going to have a picnic.', 'Chúng tôi dự định sẽ đi dã ngoại.', 1, ['future', 'be-going-to'],
  [tok('We','pronoun','subject'), tok('are','verb','verb','be','aux-present-other'), tok('going','verb','verb','go','ing'), tok('to','particle','particle'), tok('have','verb','verb','have','base'), tok('a','article','det'), tok('picnic','noun','object','picnic','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2,4]}, {clauseId:'c1', role:'object', tokenIndices:[5,6]}],
  {idx:2, ans:'going', promptVi:'Điền going trong be going to.', hint:'going'});

addReviewSentence('review-future', 'They will play basketball tomorrow.', 'Ngày mai họ sẽ chơi bóng rổ.', 1, ['future', 'will'],
  [tok('They','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('play','verb','verb','play','base'), tok('basketball','noun','object','basketball','uncountable'), tok('tomorrow','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:2, ans:'play', promptVi:'Sau will dùng động từ nguyên thể: play.', hint:'play'});

addReviewSentence('review-future', 'The weather will be nice on Sunday.', 'Thời tiết sẽ đẹp vào Chủ nhật.', 2, ['future', 'will'],
  [tok('The','article','det'), tok('weather','noun','subject','weather','uncountable'), tok('will','verb','verb','will','aux-future'), tok('be','verb','verb','be','base'), tok('nice','adjective','complement'), tok('on','preposition','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:3, ans:'be', promptVi:'Sau will dùng to be dạng base: be.', hint:'be'});

addReviewSentence('review-future', 'I will buy some apples tonight.', 'Tối nay tôi sẽ mua vài quả táo.', 1, ['future', 'will'],
  [tok('I','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('buy','verb','verb','buy','base'), tok('some','determiner','det'), tok('apples','noun','object','apple','pl'), tok('tonight','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:2, ans:'buy', promptVi:'Sau will dùng buy.', hint:'buy'});

addReviewSentence('review-future', 'She is going to bake a cake.', 'Cô ấy dự định nướng một chiếc bánh.', 2, ['future', 'be-going-to'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('going','verb','verb','go','ing'), tok('to','particle','particle'), tok('bake','verb','verb','bake','base'), tok('a','article','det'), tok('cake','noun','object','cake','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2,4]}, {clauseId:'c1', role:'object', tokenIndices:[5,6]}],
  {idx:4, ans:'bake', promptVi:'Sau to dùng động từ nguyên thể bake.', hint:'bake'});

addReviewSentence('review-future', 'We will help you with your bags.', 'Chúng tôi sẽ giúp bạn xách túi.', 2, ['future', 'will'],
  [tok('We','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('help','verb','verb','help','base'), tok('you','pronoun','object'), tok('with','preposition','adverbial'), tok('your','determiner','det'), tok('bags','noun','adverbial','bag','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:1, ans:'will', promptVi:'Điền will để hứa giúp đỡ.', hint:'will'});

addReviewSentence('review-future', 'They are not going to leave today.', 'Hôm nay họ không dự định rời đi.', 2, ['future', 'be-going-to'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','aux-present-other'), tok('not','adverb','adverbial'), tok('going','verb','verb','go','ing'), tok('to','particle','particle'), tok('leave','verb','verb','leave','base'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:3, ans:'going', promptVi:'Điền going trong be not going to.', hint:'going'});

addReviewSentence('review-future', 'Robots will do hard work someday.', 'Một ngày nào đó người máy sẽ làm công việc nặng nhọc.', 3, ['future', 'will'],
  [tok('Robots','noun','subject','robot','pl'), tok('will','verb','verb','will','aux-future'), tok('do','verb','verb','do','base'), tok('hard','adjective','modifier'), tok('work','noun','object','work','uncountable'), tok('someday','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:1, ans:'will', promptVi:'Điền will cho dự đoán tương lai xa.', hint:'will'});

addReviewSentence('review-future', 'I will see you at school tomorrow.', 'Ngày mai tôi sẽ gặp bạn ở trường.', 1, ['future', 'will'],
  [tok('I','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('see','verb','verb','see','base'), tok('you','pronoun','object'), tok('at','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('tomorrow','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:2, ans:'see', promptVi:'Sau will dùng see.', hint:'see'});

// Kiểm tra số lượng câu
console.log(`Generated ${sentences.length} sentences for B4.`);
if (sentences.length !== 200) {
  throw new Error(`Expected 200 sentences, but got ${sentences.length}`);
}

fs.writeFileSync(path.join(DATA_DIR, 'B4.sentences.json'), JSON.stringify(applyContentReviewV4('B4.sentences.json', sentences.map(applyReviewedOrder)), null, 2), 'utf-8');
console.log(`✅ Saved B4.sentences.json (${sentences.length} items)`);

// =========================================================================
// 3. THEORY B4 (Future & Review 4 Tenses)
// =========================================================================
const theoryRaw = {
  id: 'theory-B4',
  level: 'B4',
  topic: 'future-review',
  title: 'Thì Tương lai & Tổng ôn 4 Thì Cốt lõi',
  summary: 'Thì Tương lai đơn (will) và Tương lai gần (be going to) dùng để diễn tả các kế hoạch, dự định hoặc dự đoán trong tương lai. Đây cũng là trạm dừng chân để hệ thống hoá toàn bộ 4 thì cơ bản trong tiếng Anh.',
  formulas: [
    {
      name: 'Tương lai đơn với WILL',
      pattern: 'Khẳng định: S + will + V(base) | Phủ định: S + won\'t + V(base) | Nghi vấn: Will + S + V(base)?',
      examples: [
        'I will help you. (Tôi sẽ giúp bạn.)',
        'They won\'t come tomorrow. (Ngày mai họ sẽ không đến.)',
        'Will you join us? - Yes, I will. / No, I won\'t.'
      ]
    },
    {
      name: 'Tương lai gần với BE GOING TO (kế hoạch dự định trước)',
      pattern: 'S + am / is / are + going to + V(base)',
      examples: [
        'I am going to visit Hanoi next week. (Tôi dự định đi thăm Hà Nội tuần tới.)',
        'They are going to have a party. (Họ dự định tổ chức một bữa tiệc.)'
      ]
    },
    {
      name: 'Bảng quy chiếu 4 thì cốt lõi',
      pattern: 'Hiện tại đơn (thói quen) ↔ Hiện tại tiếp diễn (đang xảy ra) ↔ Quá khứ đơn (đã xong) ↔ Tương lai (sắp xảy ra)',
      examples: [
        'Hiện tại đơn: He plays football every Sunday.',
        'Hiện tại tiếp diễn: He is playing football now.',
        'Quá khứ đơn: He played football yesterday.',
        'Tương lai: He will play football tomorrow.'
      ]
    }
  ],
  sections: [
    {
      title: '1. Cách dùng thì Tương lai với "Will"',
      content: '- Diễn tả một quyết định đưa ra ngay tại thời điểm nói (ví dụ: "I will help you with your bags").\n- Diễn tả lời hứa hoặc dự đoán trong tương lai ("It will rain tonight").\n- Công thức luôn là: will + V(nguyên thể base) cho TẤT CẢ các ngôi (I, you, he, she, it, we, they đều dùng will).'
    },
    {
      title: '2. Thể phủ định của Will: WON\'T',
      content: '- "won\'t" là dạng viết tắt của "will not".\n- Sau won\'t, động từ CHÍNH luôn ở dạng nguyên thể không chia (base):\nVí dụ: "They won\'t come tomorrow." (KHÔNG nói "They won\'t coming" hay "won\'t came").'
    },
    {
      title: '3. Tương lai gần "Be Going To": Kế hoạch đã định',
      content: '- Dùng khi một việc đã được lên kế hoạch, dự định hoặc có bằng chứng cụ thể trước lúc nói.\n- Công thức: S + am / is / are + going to + V(base).\nVí dụ: "We are going to have a picnic this weekend." (Chúng tôi đã chuẩn bị đồ ăn và lên kế hoạch đi dã ngoại).'
    },
    {
      title: '4. Dấu hiệu nhận biết thời gian trong tương lai',
      content: '- tomorrow (ngày mai), tomorrow morning (sáng mai).\n- tonight (tối nay), soon (sớm muộn, chẳng bao lâu nữa), later (lát nữa).\n- next week (tuần tới), next month (tháng tới), next year (năm tới), next Sunday (Chủ nhật tới).\n- in the future (trong tương lai), someday (một ngày nào đó).'
    },
    {
      title: '5. Bí quyết phân biệt 4 thì qua các từ khóa thần thánh',
      content: '1. Hiện tại đơn: every day, always, usually, often, sometimes, never → chia V(s/es) hoặc V-base.\n2. Hiện tại tiếp diễn: now, right now, at the moment, Look!, Listen! → am/is/are + V-ing.\n3. Quá khứ đơn: yesterday, last night, last week, ... ago → V-ed hoặc V2 bất quy tắc.\n4. Tương lai: tomorrow, next..., soon, tonight → will + V-base hoặc be going to.'
    }
  ],
  commonMistakes: [
    {
      wrong: 'He will plays tennis tomorrow.',
      right: 'He will play tennis tomorrow.',
      why: 'Sau trợ động từ "will", động từ BẮT BUỘC giữ nguyên thể (base: play), không được thêm -s hay -es dù chủ ngữ là He.'
    },
    {
      wrong: 'They will going to school.',
      right: 'They will go to school. / They are going to go to school.',
      why: 'Không dùng đuôi -ing sau will. Nếu dùng be going to thì phải có to be: "are going to go".'
    },
    {
      wrong: 'I am go to visit my grandma tomorrow.',
      right: 'I am going to visit my grandma tomorrow.',
      why: 'Cấu trúc tương lai gần bắt buộc phải có đủ "going to": am/is/are + going to + V-base.'
    },
    {
      wrong: 'Yesterday she will buy a book.',
      right: 'Yesterday she bought a book.',
      why: '"Yesterday" là thời gian trong quá khứ, không thể dùng "will". Phải chia thì Quá khứ đơn: bought.'
    }
  ],
  tips: [
    'Quy tắc vàng: Sau WILL hoặc WON\'T, động từ luôn luôn là V-base (nguyên thể không chia bất cứ thứ gì)!',
    'Chủ ngữ nào cũng đi với WILL (I will, you will, he will, she will, we will, they will).',
    'Nhìn thấy "next...", "tomorrow" → chọn ngay will hoặc be going to.'
  ],
  exampleIds: ['B4-s-0001', 'B4-s-0002', 'B4-s-0046', 'B4-s-0081', 'B4-s-0116', 'B4-s-0151', 'B4-s-0163', 'B4-s-0175', 'B4-s-0188']
};

// Chuẩn hoá theory về đúng schema TheoryPage (xem docs/english-content-fix-list-v3.md #02).
const SECTION_EXAMPLE_IDS = [
  ['B4-s-0001', 'B4-s-0081'],
  ['B4-s-0046'],
  ['B4-s-0116', 'B4-s-0117'],
  ['B4-s-0002', 'B4-s-0188'],
  ['B4-s-0151', 'B4-s-0163', 'B4-s-0175', 'B4-s-0002'],
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
fs.writeFileSync(path.join(DATA_DIR, 'B4.theory.json'), JSON.stringify(applyContentReviewV4('B4.theory.json', typeof applyTheoryReview === 'function' ? applyTheoryReview(theory) : theory), null, 2), 'utf-8');
console.log(`✅ Saved B4.theory.json`);
