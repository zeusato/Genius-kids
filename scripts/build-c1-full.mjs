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
// 1. VOCABULARY C1 (>= 105 words)
// =========================================================================
const vocabList = [
  // Từ để hỏi cốt lõi (12)
  { en: 'what', vi: 'cái gì, con gì', pos: 'pronoun', ipa: '/wɑːt/', image: '❓', tags: ['question-word'], exampleEn: 'What is your name?', exampleVi: 'Tên bạn là gì?' },
  { en: 'where', vi: 'ở đâu, nơi nào', pos: 'adverb', ipa: '/wer/', image: '📍', tags: ['question-word'], exampleEn: 'Where do you live?', exampleVi: 'Bạn sống ở đâu?' },
  { en: 'when', vi: 'khi nào, bao giờ', pos: 'adverb', ipa: '/wen/', image: '⏰', tags: ['question-word'], exampleEn: 'When does school start?', exampleVi: 'Khi nào trường học bắt đầu?' },
  { en: 'who', vi: 'ai, người nào', pos: 'pronoun', ipa: '/huː/', image: '👤', tags: ['question-word'], exampleEn: 'Who is your teacher?', exampleVi: 'Ai là giáo viên của bạn?' },
  { en: 'why', vi: 'tại sao, vì sao', pos: 'adverb', ipa: '/waɪ/', image: '🤔', tags: ['question-word'], exampleEn: 'Why are you crying?', exampleVi: 'Tại sao bạn lại khóc?' },
  { en: 'how', vi: 'như thế nào, bằng cách nào', pos: 'adverb', ipa: '/haʊ/', image: '🚲', tags: ['question-word'], exampleEn: 'How do you go to school?', exampleVi: 'Bạn đến trường bằng cách nào?' },
  { en: 'which', vi: 'cái nào, người nào', pos: 'determiner', ipa: '/wɪtʃ/', image: '👉', tags: ['question-word'], exampleEn: 'Which color do you like?', exampleVi: 'Bạn thích màu nào?' },
  { en: 'whose', vi: 'của ai', pos: 'determiner', ipa: '/huːz/', image: '🎒', tags: ['question-word'], exampleEn: 'Whose bag is this?', exampleVi: 'Chiếc túi này của ai?' },
  { en: 'how many', vi: 'bao nhiêu (đếm được)', pos: 'adverb', ipa: '/ˌhaʊ ˈmen.i/', image: '🔢', tags: ['question-word'], exampleEn: 'How many books do you have?', exampleVi: 'Bạn có bao nhiêu cuốn sách?' },
  { en: 'how much', vi: 'bao nhiêu (không đếm được, giá tiền)', pos: 'adverb', ipa: '/ˌhaʊ ˈmʌtʃ/', image: '💵', tags: ['question-word'], exampleEn: 'How much water do you drink?', exampleVi: 'Bạn uống bao nhiêu nước?' },
  { en: 'how old', vi: 'bao nhiêu tuổi', pos: 'adverb', ipa: '/ˌhaʊ ˈoʊld/', image: '🎂', tags: ['question-word'], exampleEn: 'How old are you?', exampleVi: 'Bạn bao nhiêu tuổi?' },
  { en: 'how far', vi: 'bao xa', pos: 'adverb', ipa: '/ˌhaʊ ˈfɑːr/', image: '📏', tags: ['question-word'], exampleEn: 'How far is it to school?', exampleVi: 'Đến trường bao xa?' },

  // Danh từ thông tin & ngữ cảnh hỏi đáp (40)
  { en: 'name', vi: 'tên gọi', pos: 'noun', ipa: '/neɪm/', forms: { plural: 'names' }, image: '🏷️', tags: ['info'], exampleEn: 'What is your name?', exampleVi: 'Tên của bạn là gì?' },
  { en: 'age', vi: 'tuổi tác', pos: 'noun', ipa: '/eɪdʒ/', forms: { plural: 'ages' }, image: '🎂', tags: ['info'], exampleEn: 'What is your age?', exampleVi: 'Tuổi của bạn là bao nhiêu?' },
  { en: 'birthday', vi: 'ngày sinh nhật', pos: 'noun', ipa: '/ˈbɜːrθ.deɪ/', forms: { plural: 'birthdays' }, image: '🎉', tags: ['info'], exampleEn: 'When is your birthday?', exampleVi: 'Sinh nhật của bạn vào khi nào?' },
  { en: 'address', vi: 'địa chỉ', pos: 'noun', ipa: '/ˈæd.res/', forms: { plural: 'addresses' }, image: '🏠', tags: ['info'], exampleEn: 'What is your address?', exampleVi: 'Địa chỉ của bạn là gì?' },
  { en: 'color', vi: 'màu sắc', pos: 'noun', ipa: '/ˈkʌl.ɚ/', forms: { plural: 'colors' }, image: '🎨', tags: ['info'], exampleEn: 'What color is your shirt?', exampleVi: 'Áo của bạn màu gì?' },
  { en: 'time', vi: 'thời gian, giờ giấc', pos: 'noun', ipa: '/taɪm/', forms: { plural: 'times' }, image: '⏰', tags: ['time'], exampleEn: 'What time is it?', exampleVi: 'Mấy giờ rồi?' },
  { en: 'hobby', vi: 'sở thích', pos: 'noun', ipa: '/ˈhɑː.bi/', forms: { plural: 'hobbies' }, image: '🎮', tags: ['info'], exampleEn: 'What is your hobby?', exampleVi: 'Sở thích của bạn là gì?' },
  { en: 'subject', vi: 'môn học', pos: 'noun', ipa: '/ˈsʌb.dʒekt/', forms: { plural: 'subjects' }, image: '📚', tags: ['school'], exampleEn: 'Which subject do you like best?', exampleVi: 'Bạn thích nhất môn học nào?' },
  { en: 'season', vi: 'mùa trong năm', pos: 'noun', ipa: '/ˈsiː.zən/', forms: { plural: 'seasons' }, image: '🍂', tags: ['nature'], exampleEn: 'Which season do you like?', exampleVi: 'Bạn thích mùa nào?' },
  { en: 'weather', vi: 'thời tiết', pos: 'noun', ipa: '/ˈweð.ɚ/', image: '🌤️', tags: ['nature'], exampleEn: 'What is the weather like?', exampleVi: 'Thời tiết như thế nào?' },
  { en: 'animal', vi: 'động vật', pos: 'noun', ipa: '/ˈæn.ə.məl/', forms: { plural: 'animals' }, image: '🐾', tags: ['nature'], exampleEn: 'What animal do you love?', exampleVi: 'Bạn yêu thích con vật nào?' },
  { en: 'fruit', vi: 'trái cây', pos: 'noun', ipa: '/fruːt/', image: '🍎', tags: ['food'], exampleEn: 'Which fruit do you want?', exampleVi: 'Bạn muốn loại trái cây nào?' },
  { en: 'sport', vi: 'thể thao', pos: 'noun', ipa: '/spɔːrt/', forms: { plural: 'sports' }, image: '⚽', tags: ['activity'], exampleEn: 'What sport do you play?', exampleVi: 'Bạn chơi môn thể thao nào?' },
  { en: 'food', vi: 'đồ ăn, thức ăn', pos: 'noun', ipa: '/fuːd/', forms: { plural: 'foods' }, image: '🍱', tags: ['food'], exampleEn: 'What is your favorite food?', exampleVi: 'Món ăn ưa thích của bạn là gì?' },
  { en: 'juice', vi: 'nước ép trái cây', pos: 'noun', ipa: '/dʒuːs/', forms: { plural: 'juices' }, image: '🧃', tags: ['drink'], exampleEn: 'What juice do you like?', exampleVi: 'Bạn thích nước ép nào?' },
  { en: 'city', vi: 'thành phố', pos: 'noun', ipa: '/ˈsɪt̬.i/', forms: { plural: 'cities' }, image: '🏙️', tags: ['place'], exampleEn: 'Which city do you live in?', exampleVi: 'Bạn sống ở thành phố nào?' },
  { en: 'country', vi: 'quốc gia, đất nước', pos: 'noun', ipa: '/ˈkʌn.tri/', forms: { plural: 'countries' }, image: '🌏', tags: ['place'], exampleEn: 'Where are you from?', exampleVi: 'Bạn đến từ đâu?' },
  { en: 'village', vi: 'ngôi làng', pos: 'noun', ipa: '/ˈvɪl.ɪdʒ/', forms: { plural: 'villages' }, image: '🏡', tags: ['place'], exampleEn: 'Where is the small village?', exampleVi: 'Ngôi làng nhỏ ở đâu?' },
  { en: 'town', vi: 'thị trấn', pos: 'noun', ipa: '/taʊn/', forms: { plural: 'towns' }, image: '🏘️', tags: ['place'], exampleEn: 'Which town do you visit?', exampleVi: 'Bạn thăm thị trấn nào?' },
  { en: 'street', vi: 'đường phố', pos: 'noun', ipa: '/striːt/', forms: { plural: 'streets' }, image: '🛣️', tags: ['place'], exampleEn: 'What street do you live on?', exampleVi: 'Bạn sống trên con đường nào?' },
  { en: 'question', vi: 'câu hỏi', pos: 'noun', ipa: '/ˈkwes.tʃən/', forms: { plural: 'questions' }, image: '❓', tags: ['study'], exampleEn: 'Can I ask a question?', exampleVi: 'Tôi có thể hỏi một câu hỏi không?' },
  { en: 'answer', vi: 'câu trả lời', pos: 'noun', ipa: '/ˈæn.sɚ/', forms: { plural: 'answers' }, image: '💡', tags: ['study'], exampleEn: 'What is the answer?', exampleVi: 'Câu trả lời là gì?' },
  { en: 'reason', vi: 'lý do', pos: 'noun', ipa: '/ˈriː.zən/', forms: { plural: 'reasons' }, image: '💬', tags: ['info'], exampleEn: 'What is the reason?', exampleVi: 'Lý do là gì?' },
  { en: 'price', vi: 'giá cả', pos: 'noun', ipa: '/praɪs/', forms: { plural: 'prices' }, image: '🏷️', tags: ['shopping'], exampleEn: 'What is the price of this book?', exampleVi: 'Giá của cuốn sách này là bao nhiêu?' },
  { en: 'friend', vi: 'người bạn', pos: 'noun', ipa: '/frend/', forms: { plural: 'friends' }, image: '🧑‍🤝‍🧑', tags: ['people'], exampleEn: 'Who is your best friend?', exampleVi: 'Ai là bạn thân nhất của bạn?' },
  { en: 'teacher', vi: 'giáo viên', pos: 'noun', ipa: '/ˈtiː.tʃɚ/', forms: { plural: 'teachers' }, image: '🧑‍🏫', tags: ['people'], exampleEn: 'Who is that teacher?', exampleVi: 'Vị giáo viên đó là ai?' },
  { en: 'doctor', vi: 'bác sĩ', pos: 'noun', ipa: '/ˈdɑːk.tɚ/', forms: { plural: 'doctors' }, image: '👨‍⚕️', tags: ['people'], exampleEn: 'Who is the doctor here?', exampleVi: 'Ai là bác sĩ ở đây?' },
  { en: 'police officer', vi: 'cảnh sát viên', pos: 'noun', ipa: '/pəˈliːs ˌɑː.fɪ.sɚ/', forms: { plural: 'police officers' }, image: '👮', tags: ['people'], exampleEn: 'Who is the police officer?', exampleVi: 'Viên cảnh sát là ai?' },
  { en: 'classmate', vi: 'bạn cùng lớp', pos: 'noun', ipa: '/ˈklæs.meɪt/', forms: { plural: 'classmates' }, image: '🎒', tags: ['people'], exampleEn: 'Who is your new classmate?', exampleVi: 'Ai là bạn cùng lớp mới của bạn?' },
  { en: 'parent', vi: 'phụ huynh, bố mẹ', pos: 'noun', ipa: '/ˈper.ənt/', forms: { plural: 'parents' }, image: '👨‍👩‍👧', tags: ['family'], exampleEn: 'Where are your parents?', exampleVi: 'Bố mẹ bạn đang ở đâu?' },
  { en: 'brother', vi: 'anh/em trai', pos: 'noun', ipa: '/ˈbrʌð.ɚ/', forms: { plural: 'brothers' }, image: '👦', tags: ['family'], exampleEn: 'How old is your brother?', exampleVi: 'Anh trai bạn bao nhiêu tuổi?' },
  { en: 'sister', vi: 'chị/em gái', pos: 'noun', ipa: '/ˈsɪs.tɚ/', forms: { plural: 'sisters' }, image: '👧', tags: ['family'], exampleEn: 'What is your sister doing?', exampleVi: 'Em gái bạn đang làm gì?' },
  { en: 'bus stop', vi: 'trạm xe buýt', pos: 'noun', ipa: '/ˈbʌs ˌstɑːp/', forms: { plural: 'bus stops' }, image: '🚏', tags: ['place'], exampleEn: 'Where is the bus stop?', exampleVi: 'Trạm xe buýt ở đâu?' },
  { en: 'train station', vi: 'ga xe lửa', pos: 'noun', ipa: '/ˈtreɪn ˌsteɪ.ʃən/', forms: { plural: 'train stations' }, image: '🚉', tags: ['place'], exampleEn: 'Where is the train station?', exampleVi: 'Ga xe lửa ở đâu?' },
  { en: 'post office', vi: 'bưu điện', pos: 'noun', ipa: '/ˈpoʊst ˌɑː.fɪs/', forms: { plural: 'post offices' }, image: '📮', tags: ['place'], exampleEn: 'Where is the post office?', exampleVi: 'Bưu điện ở đâu?' },
  { en: 'supermarket', vi: 'siêu thị', pos: 'noun', ipa: '/ˈsuː.pɚˌmɑːr.kɪt/', forms: { plural: 'supermarkets' }, image: '🛒', tags: ['place'], exampleEn: 'Where is the nearest supermarket?', exampleVi: 'Siêu thị gần nhất ở đâu?' },
  { en: 'zoo', vi: 'vườn bách thú', pos: 'noun', ipa: '/zuː/', forms: { plural: 'zoos' }, image: '🦁', tags: ['place'], exampleEn: 'When do we go to the zoo?', exampleVi: 'Khi nào chúng ta đi vườn thú?' },
  { en: 'park', vi: 'công viên', pos: 'noun', ipa: '/pɑːrk/', forms: { plural: 'parks' }, image: '🌳', tags: ['place'], exampleEn: 'Where are the children playing?', exampleVi: 'Lũ trẻ đang chơi ở đâu?' },
  { en: 'library', vi: 'thư viện', pos: 'noun', ipa: '/ˈlaɪ.brer.i/', forms: { plural: 'libraries' }, image: '📚', tags: ['place'], exampleEn: 'Where do you read books?', exampleVi: 'Bạn đọc sách ở đâu?' },
  { en: 'classroom', vi: 'phòng học', pos: 'noun', ipa: '/ˈklæs.ruːm/', forms: { plural: 'classrooms' }, image: '🏫', tags: ['place'], exampleEn: 'Which is your classroom?', exampleVi: 'Phòng học của bạn là phòng nào?' },

  // Động từ tương tác hỏi đáp (28)
  { en: 'ask', vi: 'hỏi', pos: 'verb', ipa: '/æsk/', forms: { thirdSg: 'asks', past: 'asked', ing: 'asking', irregular: false }, image: '🙋', tags: ['action'], exampleEn: 'He asked a good question.', exampleVi: 'Cậu ấy đã hỏi một câu hỏi hay.' },
  { en: 'reply', vi: 'phản hồi, đáp lại', pos: 'verb', ipa: '/rɪˈplaɪ/', forms: { thirdSg: 'replies', past: 'replied', ing: 'replying', irregular: false }, image: '💡', tags: ['action'], exampleEn: 'He replied to my message.', exampleVi: 'Cậu ấy đã phản hồi tin nhắn của tôi.' },
  { en: 'tell', vi: 'kể, nói cho biết', pos: 'verb', ipa: '/tel/', forms: { thirdSg: 'tells', past: 'told', ing: 'telling', irregular: true }, image: '🗣️', tags: ['action'], exampleEn: 'Can you tell me the way?', exampleVi: 'Bạn có thể chỉ đường cho tôi không?' },
  { en: 'say', vi: 'nói', pos: 'verb', ipa: '/seɪ/', forms: { thirdSg: 'says', past: 'said', ing: 'saying', irregular: true }, image: '💬', tags: ['action'], exampleEn: 'What did he say?', exampleVi: 'Cậu ấy đã nói gì?' },
  { en: 'speak', vi: 'nói chuyện, phát biểu', pos: 'verb', ipa: '/spiːk/', forms: { thirdSg: 'speaks', past: 'spoke', ing: 'speaking', irregular: true }, image: '🗣️', tags: ['action'], exampleEn: 'Who is speaking?', exampleVi: 'Ai đang phát biểu vậy?' },
  { en: 'know', vi: 'biết', pos: 'verb', ipa: '/noʊ/', forms: { thirdSg: 'knows', past: 'knew', ing: 'knowing', irregular: true }, image: '🧠', tags: ['action'], exampleEn: 'Do you know the answer?', exampleVi: 'Bạn có biết câu trả lời không?' },
  { en: 'think', vi: 'nghĩ rằng', pos: 'verb', ipa: '/θɪŋk/', forms: { thirdSg: 'thinks', past: 'thought', ing: 'thinking', irregular: true }, image: '💭', tags: ['action'], exampleEn: 'What do you think?', exampleVi: 'Bạn nghĩ sao?' },
  { en: 'mean', vi: 'có nghĩa là', pos: 'verb', ipa: '/miːn/', forms: { thirdSg: 'means', past: 'meant', ing: 'meaning', irregular: true }, image: '📖', tags: ['action'], exampleEn: 'What does this word mean?', exampleVi: 'Từ này có nghĩa là gì?' },
  { en: 'spell', vi: 'đánh vần', pos: 'verb', ipa: '/spel/', forms: { thirdSg: 'spells', past: 'spelled', ing: 'spelling', irregular: false }, image: '🔤', tags: ['action'], exampleEn: 'How do you spell your name?', exampleVi: 'Bạn đánh vần tên mình thế nào?' },
  { en: 'find', vi: 'tìm thấy', pos: 'verb', ipa: '/faɪnd/', forms: { thirdSg: 'finds', past: 'found', ing: 'finding', irregular: true }, image: '🔍', tags: ['action'], exampleEn: 'Where did you find it?', exampleVi: 'Bạn tìm thấy nó ở đâu?' },
  { en: 'lose', vi: 'làm mất', pos: 'verb', ipa: '/luːz/', forms: { thirdSg: 'loses', past: 'lost', ing: 'losing', irregular: true }, image: '🤷', tags: ['action'], exampleEn: 'What did you lose?', exampleVi: 'Bạn đã làm mất cái gì?' },
  { en: 'want', vi: 'muốn', pos: 'verb', ipa: '/wɑːnt/', forms: { thirdSg: 'wants', past: 'wanted', ing: 'wanting', irregular: false }, image: '🙋', tags: ['action'], exampleEn: 'What do you want?', exampleVi: 'Bạn muốn cái gì?' },
  { en: 'like', vi: 'thích', pos: 'verb', ipa: '/laɪk/', forms: { thirdSg: 'likes', past: 'liked', ing: 'liking', irregular: false }, image: '👍', tags: ['feeling'], exampleEn: 'Which one do you like?', exampleVi: 'Bạn thích cái nào?' },
  { en: 'prefer', vi: 'thích hơn', pos: 'verb', ipa: '/prɪˈfɝː/', forms: { thirdSg: 'prefers', past: 'preferred', ing: 'preferring', irregular: false }, image: '⭐', tags: ['feeling'], exampleEn: 'Which do you prefer, tea or milk?', exampleVi: 'Bạn thích thứ nào hơn, trà hay sữa?' },
  { en: 'happen', vi: 'xảy ra', pos: 'verb', ipa: '/ˈhæp.ən/', forms: { thirdSg: 'happens', past: 'happened', ing: 'happening', irregular: false }, image: '⚡', tags: ['action'], exampleEn: 'What happened yesterday?', exampleVi: 'Chuyện gì đã xảy ra hôm qua?' },
  { en: 'cost', vi: 'có giá là', pos: 'verb', ipa: '/kɑːst/', forms: { thirdSg: 'costs', past: 'cost', ing: 'costing', irregular: true }, image: '🏷️', tags: ['action'], exampleEn: 'How much does it cost?', exampleVi: 'Nó có giá bao nhiêu?' },
  { en: 'take', vi: 'mất (thời gian)', pos: 'verb', ipa: '/teɪk/', forms: { thirdSg: 'takes', past: 'took', ing: 'taking', irregular: true }, image: '⏱️', tags: ['action'], exampleEn: 'How long does it take?', exampleVi: 'Mất bao lâu thời gian?' },
  { en: 'live', vi: 'sống', pos: 'verb', ipa: '/lɪv/', forms: { thirdSg: 'lives', past: 'lived', ing: 'living', irregular: false }, image: '🏡', tags: ['action'], exampleEn: 'Where do you live?', exampleVi: 'Bạn sống ở đâu?' },
  { en: 'work', vi: 'làm việc', pos: 'verb', ipa: '/wɜːrk/', forms: { thirdSg: 'works', past: 'worked', ing: 'working', irregular: false }, image: '💼', tags: ['action'], exampleEn: 'Where does your father work?', exampleVi: 'Bố bạn làm việc ở đâu?' },
  { en: 'study', vi: 'học', pos: 'verb', ipa: '/ˈstʌd.i/', forms: { thirdSg: 'studies', past: 'studied', ing: 'studying', irregular: false }, image: '📚', tags: ['action'], exampleEn: 'What are you studying?', exampleVi: 'Bạn đang học môn gì vậy?' },
  { en: 'play', vi: 'chơi', pos: 'verb', ipa: '/pleɪ/', forms: { thirdSg: 'plays', past: 'played', ing: 'playing', irregular: false }, image: '⚽', tags: ['action'], exampleEn: 'Where are they playing?', exampleVi: 'Họ đang chơi ở đâu?' },
  { en: 'go', vi: 'đi', pos: 'verb', ipa: '/ɡoʊ/', forms: { thirdSg: 'goes', past: 'went', ing: 'going', irregular: true }, image: '🚶', tags: ['action'], exampleEn: 'Where did you go yesterday?', exampleVi: 'Hôm qua bạn đã đi đâu?' },
  { en: 'eat', vi: 'ăn', pos: 'verb', ipa: '/iːt/', forms: { thirdSg: 'eats', past: 'ate', ing: 'eating', irregular: true }, image: '🍽️', tags: ['action'], exampleEn: 'What did you eat for lunch?', exampleVi: 'Bạn đã ăn gì cho bữa trưa?' },
  { en: 'drink', vi: 'uống', pos: 'verb', ipa: '/drɪŋk/', forms: { thirdSg: 'drinks', past: 'drank', ing: 'drinking', irregular: true }, image: '🥤', tags: ['action'], exampleEn: 'What would you like to drink?', exampleVi: 'Bạn muốn uống gì?' },
  { en: 'see', vi: 'thấy', pos: 'verb', ipa: '/siː/', forms: { thirdSg: 'sees', past: 'saw', ing: 'seeing', irregular: true }, image: '👀', tags: ['action'], exampleEn: 'Who did you see at the zoo?', exampleVi: 'Bạn đã gặp ai ở sở thú?' },
  { en: 'buy', vi: 'mua', pos: 'verb', ipa: '/baɪ/', forms: { thirdSg: 'buys', past: 'bought', ing: 'buying', irregular: true }, image: '🛒', tags: ['action'], exampleEn: 'What will you buy tomorrow?', exampleVi: 'Ngày mai bạn sẽ mua gì?' },
  { en: 'meet', vi: 'gặp', pos: 'verb', ipa: '/miːt/', forms: { thirdSg: 'meets', past: 'met', ing: 'meeting', irregular: true }, image: '🤝', tags: ['action'], exampleEn: 'When will we meet again?', exampleVi: 'Khi nào chúng ta sẽ gặp lại nhau?' },
  { en: 'arrive', vi: 'đến nơi', pos: 'verb', ipa: '/əˈraɪv/', forms: { thirdSg: 'arrives', past: 'arrived', ing: 'arriving', irregular: false }, image: '🛬', tags: ['action'], exampleEn: 'When will the train arrive?', exampleVi: 'Khi nào đoàn tàu sẽ đến?' },

  // Tính từ liên quan (25)
  { en: 'favorite', vi: 'ưa thích nhất', pos: 'adjective', ipa: '/ˈfeɪ.vər.ət/', image: '❤️', tags: ['preference'], exampleEn: 'What is your favorite color?', exampleVi: 'Màu sắc ưa thích nhất của bạn là gì?' },
  { en: 'best', vi: 'tốt nhất, nhất', pos: 'adjective', ipa: '/best/', image: '🥇', tags: ['quality'], exampleEn: 'Who is your best friend?', exampleVi: 'Ai là người bạn tốt nhất của bạn?' },
  { en: 'nearest', vi: 'gần nhất', pos: 'adjective', ipa: '/ˈnɪr.ɪst/', image: '📍', tags: ['place'], exampleEn: 'Where is the nearest hospital?', exampleVi: 'Bệnh viện gần nhất ở đâu?' },
  { en: 'far', vi: 'xa', pos: 'adjective', ipa: '/fɑːr/', image: '🛣️', tags: ['distance'], exampleEn: 'How far is your house?', exampleVi: 'Nhà bạn xa bao nhiêu?' },
  { en: 'near', vi: 'gần', pos: 'adjective', ipa: '/nɪr/', image: '🏡', tags: ['distance'], exampleEn: 'Is your school near here?', exampleVi: 'Trường bạn có gần đây không?' },
  { en: 'late', vi: 'muộn, trễ', pos: 'adjective', ipa: '/leɪt/', image: '⏰', tags: ['time'], exampleEn: 'Why are you late?', exampleVi: 'Tại sao bạn lại đến muộn?' },
  { en: 'early', vi: 'sớm', pos: 'adjective', ipa: '/ˈɜːr.li/', image: '🌅', tags: ['time'], exampleEn: 'Why did you wake up early?', exampleVi: 'Tại sao bạn lại dậy sớm?' },
  { en: 'sad', vi: 'buồn bã', pos: 'adjective', ipa: '/sæd/', image: '😢', tags: ['emotion'], exampleEn: 'Why is she sad?', exampleVi: 'Tại sao cô ấy lại buồn?' },
  { en: 'happy', vi: 'vui vẻ', pos: 'adjective', ipa: '/ˈhæp.i/', image: '😊', tags: ['emotion'], exampleEn: 'Why are you happy?', exampleVi: 'Tại sao bạn lại vui vẻ vậy?' },
  { en: 'angry', vi: 'tức giận', pos: 'adjective', ipa: '/ˈæŋ.ɡri/', image: '😡', tags: ['emotion'], exampleEn: 'Why are you angry?', exampleVi: 'Tại sao bạn lại tức giận?' },
  { en: 'tired', vi: 'mệt mỏi', pos: 'adjective', ipa: '/taɪərd/', image: '🥱', tags: ['feeling'], exampleEn: 'Why are you tired?', exampleVi: 'Tại sao bạn lại mệt?' },
  { en: 'hungry', vi: 'đói bụng', pos: 'adjective', ipa: '/ˈhʌŋ.ɡri/', image: '🤤', tags: ['feeling'], exampleEn: 'Are you hungry?', exampleVi: 'Bạn có đói không?' },
  { en: 'expensive', vi: 'đắt tiền', pos: 'adjective', ipa: '/ɪkˈspen.sɪv/', image: '💎', tags: ['quality'], exampleEn: 'Why is this bag so expensive?', exampleVi: 'Tại sao chiếc túi này lại đắt thế?' },
  { en: 'cheap', vi: 'rẻ tiền', pos: 'adjective', ipa: '/tʃiːp/', image: '🏷️', tags: ['quality'], exampleEn: 'Which shirt is cheap?', exampleVi: 'Chiếc áo nào rẻ?' },
  { en: 'heavy', vi: 'nặng', pos: 'adjective', ipa: '/ˈhev.i/', image: '🏋️', tags: ['size'], exampleEn: 'How heavy is the box?', exampleVi: 'Chiếc hộp nặng bao nhiêu?' },
  { en: 'tall', vi: 'cao lớn', pos: 'adjective', ipa: '/tɔːl/', image: '🦒', tags: ['size'], exampleEn: 'Who is the tall boy?', exampleVi: 'Cậu bé cao lớn đó là ai?' },
  { en: 'short', vi: 'thấp, ngắn', pos: 'adjective', ipa: '/ʃɔːrt/', image: '📏', tags: ['size'], exampleEn: 'Which pencil is short?', exampleVi: 'Chiếc bút chì nào ngắn?' },
  { en: 'big', vi: 'to, lớn', pos: 'adjective', ipa: '/bɪɡ/', image: '🐘', tags: ['size'], exampleEn: 'Which house is big?', exampleVi: 'Ngôi nhà nào to?' },
  { en: 'small', vi: 'nhỏ', pos: 'adjective', ipa: '/smɑːl/', image: '🐁', tags: ['size'], exampleEn: 'How small is the bird?', exampleVi: 'Chú chim nhỏ thế nào?' },
  { en: 'long', vi: 'dài', pos: 'adjective', ipa: '/lɑːŋ/', image: '📏', tags: ['size'], exampleEn: 'How long is the river?', exampleVi: 'Dòng sông dài bao nhiêu?' },
  { en: 'fast', vi: 'nhanh', pos: 'adjective', ipa: '/fæst/', image: '🐆', tags: ['speed'], exampleEn: 'How fast can he run?', exampleVi: 'Cậu ấy có thể chạy nhanh thế nào?' },
  { en: 'difficult', vi: 'khó khăn', pos: 'adjective', ipa: '/ˈdɪf.ə.kəlt/', image: '🧩', tags: ['quality'], exampleEn: 'Why is the test difficult?', exampleVi: 'Tại sao bài kiểm tra lại khó?' },
  { en: 'easy', vi: 'dễ dàng', pos: 'adjective', ipa: '/ˈiː.zi/', image: '👌', tags: ['quality'], exampleEn: 'Which question is easy?', exampleVi: 'Câu hỏi nào dễ?' },
  { en: 'kind', vi: 'tử tế, tốt bụng', pos: 'adjective', ipa: '/kaɪnd/', image: '😇', tags: ['quality'], exampleEn: 'Who is kind to you?', exampleVi: 'Ai là người đối xử tốt bụng với bạn?' },
  { en: 'interesting', vi: 'thú vị', pos: 'adjective', ipa: '/ˈɪn.trə.stɪŋ/', image: '💡', tags: ['quality'], exampleEn: 'What is interesting about this book?', exampleVi: 'Có điều gì thú vị về cuốn sách này?' }
];

const finalVocab = vocabList.map((item, idx) => ({
  id: `C1-v-${String(idx + 1).padStart(4, '0')}`,
  level: 'C1',
  topic: 'wh-questions',
  ...item,
  source: 'seed'
}));

fs.writeFileSync(path.join(DATA_DIR, 'C1.vocab.json'), JSON.stringify(applyContentReviewV4('C1.vocab.json', finalVocab), null, 2), 'utf-8');
console.log(`✅ Generated C1.vocab.json with ${finalVocab.length} words (target ≥ 100).`);

// =========================================================================
// 2. SENTENCES GENERATOR C1 (200 sentences)
// =========================================================================
const sentences = [];
let sIdx = 1;

function addSentence(grammarPoint, en, vi, difficulty, tags, tokens, roleSpans, exerciseTypes, blankDef, orderAlternatives) {
  const reconstructed = reconstructEn(tokens);
  if (reconstructed !== en) {
    throw new Error(`Reconstruction mismatch:\nen: "${en}"\nreconstructed: "${reconstructed}"`);
  }

  const id = `C1-s-${String(sIdx++).padStart(4, '0')}`;
  const blank = {
    tokenIndex: blankDef.idx,
    answer: blankDef.ans,
    hint: blankDef.hint,
    promptVi: blankDef.promptVi
  };
  if (blankDef.alt) blank.alt = blankDef.alt;

  const item = {
    id,
    level: 'C1',
    topic: 'wh-questions',
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

  sentences.push(item);
}

function addQ(gp, en, vi, diff, tags, tokens, roleSpans, blankDef) {
  addSentence(gp, en, vi, diff, ['wh-question', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// -------------------------------------------------------------------------
// 1. WHAT (35 câu: C1-s-0001 -> C1-s-0035)
// -------------------------------------------------------------------------
addQ('what', 'What is your name?', 'Tên bạn là gì?', 1, ['what', 'be'],
  [tok('What','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('name','noun','subject','name','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Điền từ để hỏi tên.', hint:'What'});

addQ('what', 'What color is your bag?', 'Túi của bạn màu gì?', 1, ['what', 'color'],
  [tok('What','determiner','det'), tok('color','noun','complement','color','sg'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('bag','noun','subject','bag','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3,4]}],
  {idx:0, ans:'What', promptVi:'Điền What để hỏi về màu sắc.', hint:'What color'});

addQ('what', 'What time is it now?', 'Bây giờ là mấy giờ?', 1, ['what', 'time'],
  [tok('What','determiner','det'), tok('time','noun','complement','time','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('it','pronoun','subject'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'What', promptVi:'Điền What để hỏi giờ.', hint:'What time'});

addQ('what', 'What do you want to eat?', 'Bạn muốn ăn gì?', 1, ['what', 'present-simple'],
  [tok('What','pronoun','object'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('want','verb','verb','want','base'), tok('to','particle','particle'), tok('eat','verb','object','eat','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'What', promptVi:'Điền từ để hỏi đồ vật/sự việc.', hint:'What'});

addQ('what', 'What are you doing now?', 'Bây giờ bạn đang làm gì vậy?', 2, ['what', 'present-continuous'],
  [tok('What','pronoun','object'), tok('are','verb','verb','be','aux-present-other'), tok('you','pronoun','subject'), tok('doing','verb','verb','do','ing'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'What', promptVi:'Hỏi hành động đang làm.', hint:'What'});

addQ('what', 'What is he reading?', 'Cậu ấy đang đọc cái gì vậy?', 1, ['what', 'present-continuous'],
  [tok('What','pronoun','object'), tok('is','verb','verb','be','aux-present-3sg'), tok('he','pronoun','subject'), tok('reading','verb','verb','read','ing'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'What', promptVi:'Hỏi vật đang đọc.', hint:'What'});

addQ('what', 'What did you eat yesterday?', 'Hôm qua bạn đã ăn gì?', 2, ['what', 'past-simple'],
  [tok('What','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('eat','verb','verb','eat','base'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'What', promptVi:'Hỏi món đã ăn trong quá khứ.', hint:'What'});

addQ('what', 'What did she buy at the market?', 'Cô ấy đã mua gì ở chợ?', 2, ['what', 'past-simple'],
  [tok('What','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('she','pronoun','subject'), tok('buy','verb','verb','buy','base'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('market','noun','adverbial','market','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'What', promptVi:'Hỏi đồ vật đã mua.', hint:'What'});

addQ('what', 'What will you do tomorrow?', 'Ngày mai bạn sẽ làm gì?', 2, ['what', 'future'],
  [tok('What','pronoun','object'), tok('will','verb','verb','will','aux-future'), tok('you','pronoun','subject'), tok('do','verb','verb','do','base'), tok('tomorrow','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'What', promptVi:'Hỏi hành động tương lai.', hint:'What'});

addQ('what', 'What will the weather be like?', 'Thời tiết sẽ như thế nào?', 2, ['what', 'future'],
  [tok('What','pronoun','complement'), tok('will','verb','verb','will','aux-future'), tok('the','article','det'), tok('weather','noun','subject','weather','uncountable'), tok('be','verb','verb','be','base'), tok('like','preposition','prep'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Hỏi thời tiết: What ... like?', hint:'What'});

addQ('what', 'What is your favorite animal?', 'Con vật yêu thích của bạn là gì?', 2, ['what', 'animal'],
  [tok('What','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('favorite','adjective','modifier'), tok('animal','noun','subject','animal','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'What', promptVi:'Điền What để hỏi sở thích.', hint:'What'});

addQ('what', 'What does your father do?', 'Bố bạn làm nghề gì?', 2, ['what', 'job'],
  [tok('What','pronoun','object'), tok('does','verb','verb','do','aux-present-3sg'), tok('your','determiner','det'), tok('father','noun','subject','father','sg'), tok('do','verb','verb','do','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Hỏi nghề nghiệp: What does ... do?', hint:'What'});

addQ('what', 'What does this word mean?', 'Từ này có nghĩa là gì?', 2, ['what', 'meaning'],
  [tok('What','pronoun','object'), tok('does','verb','verb','do','aux-present-3sg'), tok('this','determiner','det'), tok('word','noun','subject','word','sg'), tok('mean','verb','verb','mean','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Hỏi ý nghĩa từ ngữ.', hint:'What'});

addQ('what', 'What is on the table?', 'Có cái gì trên bàn thế?', 1, ['what', 'place'],
  [tok('What','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2,3,4]}],
  {idx:0, ans:'What', promptVi:'Hỏi vật thể làm chủ ngữ.', hint:'What'});

addQ('what', 'What happened yesterday morning?', 'Chuyện gì đã xảy ra sáng hôm qua thế?', 3, ['what', 'past-simple'],
  [tok('What','pronoun','subject'), tok('happened','verb','verb','happen','past'), tok('yesterday','adverb','adverbial'), tok('morning','noun','adverbial','morning','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Hỏi sự việc đã xảy ra.', hint:'What'});

addQ('what', 'What are they watching?', 'Họ đang xem cái gì vậy?', 1, ['what', 'present-continuous'],
  [tok('What','pronoun','object'), tok('are','verb','verb','be','aux-present-other'), tok('they','pronoun','subject'), tok('watching','verb','verb','watch','ing'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What did Tom see at the zoo?', 'Tom đã nhìn thấy gì ở sở thú?', 2, ['what', 'past-simple'],
  [tok('What','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('Tom','noun','subject','Tom','sg'), tok('see','verb','verb','see','base'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('zoo','noun','adverbial','zoo','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What are you cooking for dinner?', 'Bạn đang nấu món gì cho bữa tối thế?', 2, ['what', 'food'],
  [tok('What','pronoun','object'), tok('are','verb','verb','be','aux-present-other'), tok('you','pronoun','subject'), tok('cooking','verb','verb','cook','ing'), tok('for','preposition','adverbial'), tok('dinner','noun','adverbial','dinner','uncountable'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What is that noise?', 'Tiếng ồn đó là gì vậy?', 1, ['what', 'sound'],
  [tok('What','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('noise','noun','subject','noise','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What do you usually do on Sunday?', 'Bạn thường làm gì vào Chủ nhật?', 2, ['what', 'routine'],
  [tok('What','pronoun','object'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('usually','adverb','adverbial'), tok('do','verb','verb','do','base'), tok('on','preposition','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What did he say to you?', 'Cậu ấy đã nói gì với bạn?', 2, ['what', 'speech'],
  [tok('What','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('he','pronoun','subject'), tok('say','verb','verb','say','base'), tok('to','preposition','adverbial'), tok('you','pronoun','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What is inside the box?', 'Bên trong chiếc hộp có cái gì?', 2, ['what', 'place'],
  [tok('What','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('inside','preposition','prep'), tok('the','article','det'), tok('box','noun','prep-object','box','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2,3,4]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What will happen next?', 'Điều gì sẽ xảy ra tiếp theo?', 2, ['what', 'future'],
  [tok('What','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('happen','verb','verb','happen','base'), tok('next','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What sport do you like best?', 'Bạn thích nhất môn thể thao nào?', 2, ['what', 'sport'],
  [tok('What','determiner','det'), tok('sport','noun','object','sport','sg'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('like','verb','verb','like','base'), tok('best','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What kind of music do you like?', 'Bạn thích thể loại nhạc nào?', 3, ['what', 'music'],
  [tok('What','determiner','det'), tok('kind','noun','object','kind','sg'), tok('of','preposition','object'), tok('music','noun','prep-object','music','uncountable'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('like','verb','verb','like','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2,3]}, {clauseId:'c1', role:'verb', tokenIndices:[4,6]}, {clauseId:'c1', role:'subject', tokenIndices:[5]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What kind'});

addQ('what', 'What is your mother cooking?', 'Mẹ bạn đang nấu món gì thế?', 2, ['what', 'family'],
  [tok('What','pronoun','object'), tok('is','verb','verb','be','aux-present-3sg'), tok('your','determiner','det'), tok('mother','noun','subject','mother','sg'), tok('cooking','verb','verb','cook','ing'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What did they learn today?', 'Hôm nay họ đã học được điều gì?', 2, ['what', 'school'],
  [tok('What','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('they','pronoun','subject'), tok('learn','verb','verb','learn','base'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What are the children playing?', 'Lũ trẻ đang chơi trò gì vậy?', 2, ['what', 'toy'],
  [tok('What','pronoun','object'), tok('are','verb','verb','be','aux-present-other'), tok('the','article','det'), tok('children','noun','subject','child','pl'), tok('playing','verb','verb','play','ing'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What is your address?', 'Địa chỉ của bạn là gì?', 1, ['what', 'info'],
  [tok('What','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('address','noun','subject','address','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What did you draw on the paper?', 'Bạn đã vẽ gì lên giấy vậy?', 2, ['what', 'art'],
  [tok('What','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('draw','verb','verb','draw','base'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('paper','noun','adverbial','paper','uncountable'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What is her telephone number?', 'Số điện thoại của cô ấy là gì?', 1, ['what', 'info'],
  [tok('What','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('her','determiner','det'), tok('telephone','noun','modifier','telephone','sg'), tok('number','noun','subject','number','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What makes you happy?', 'Điều gì làm bạn vui?', 2, ['what', 'emotion'],
  [tok('What','pronoun','subject'), tok('makes','verb','verb','make','present-3sg'), tok('you','pronoun','object'), tok('happy','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What did you bring to school today?', 'Hôm nay bạn mang gì đến trường thế?', 2, ['what', 'school'],
  [tok('What','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('bring','verb','verb','bring','base'), tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What will they buy tomorrow morning?', 'Sáng mai họ sẽ mua gì?', 2, ['what', 'future'],
  [tok('What','pronoun','object'), tok('will','verb','verb','will','aux-future'), tok('they','pronoun','subject'), tok('buy','verb','verb','buy','base'), tok('tomorrow','adverb','adverbial'), tok('morning','noun','adverbial','morning','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('what', 'What is that bird doing in the tree?', 'Chú chim kia đang làm gì trên cây thế?', 2, ['what', 'animal'],
  [tok('What','pronoun','object'), tok('is','verb','verb','be','aux-present-3sg'), tok('that','determiner','det'), tok('bird','noun','subject','bird','sg'), tok('doing','verb','verb','do','ing'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('tree','noun','adverbial','tree','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

// -------------------------------------------------------------------------
// 2. WHERE (30 câu: C1-s-0036 -> C1-s-0065)
// -------------------------------------------------------------------------
addQ('where', 'Where do you live?', 'Bạn sống ở đâu?', 1, ['where', 'routine'],
  [tok('Where','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('live','verb','verb','live','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'Where', promptVi:'Hỏi nơi chốn sinh sống.', hint:'Where'});

addQ('where', 'Where is the cat?', 'Con mèo ở đâu rồi?', 1, ['where', 'animal'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('cat','noun','subject','cat','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Where', promptVi:'Hỏi vị trí con mèo.', hint:'Where'});

addQ('where', 'Where did you go yesterday?', 'Hôm qua bạn đã đi đâu?', 1, ['where', 'past-simple'],
  [tok('Where','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('go','verb','verb','go','base'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Where', promptVi:'Hỏi địa điểm trong quá khứ.', hint:'Where'});

addQ('where', 'Where are you going now?', 'Bây giờ bạn đang đi đâu thế?', 1, ['where', 'present-continuous'],
  [tok('Where','adverb','adverbial'), tok('are','verb','verb','be','aux-present-other'), tok('you','pronoun','subject'), tok('going','verb','verb','go','ing'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Where', promptVi:'Hỏi nơi đang đi tới.', hint:'Where'});

addQ('where', 'Where will we meet tomorrow?', 'Ngày mai chúng ta sẽ gặp nhau ở đâu?', 2, ['where', 'future'],
  [tok('Where','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('we','pronoun','subject'), tok('meet','verb','verb','meet','base'), tok('tomorrow','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Where', promptVi:'Hỏi nơi gặp trong tương lai.', hint:'Where'});

addQ('where', 'Where does your father work?', 'Bố bạn làm việc ở đâu?', 1, ['where', 'job'],
  [tok('Where','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('your','determiner','det'), tok('father','noun','subject','father','sg'), tok('work','verb','verb','work','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where are my books?', 'Những cuốn sách của tôi ở đâu rồi?', 1, ['where', 'study'],
  [tok('Where','adverb','adverbial'), tok('are','verb','verb','be','present-other'), tok('my','determiner','det'), tok('books','noun','subject','book','pl'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where did she buy that dress?', 'Cô ấy đã mua chiếc váy đó ở đâu?', 2, ['where', 'clothes'],
  [tok('Where','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('she','pronoun','subject'), tok('buy','verb','verb','buy','base'), tok('that','determiner','det'), tok('dress','noun','object','dress','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where are the children playing?', 'Lũ trẻ đang chơi ở đâu vậy?', 2, ['where', 'present-continuous'],
  [tok('Where','adverb','adverbial'), tok('are','verb','verb','be','aux-present-other'), tok('the','article','det'), tok('children','noun','subject','child','pl'), tok('playing','verb','verb','play','ing'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where is the nearest hospital?', 'Bệnh viện gần nhất ở đâu?', 2, ['where', 'place'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('nearest','adjective','modifier'), tok('hospital','noun','subject','hospital','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where did you put my pencil?', 'Bạn đã để chiếc bút chì của tôi ở đâu?', 2, ['where', 'past-simple'],
  [tok('Where','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('put','verb','verb','put','base'), tok('my','determiner','det'), tok('pencil','noun','object','pencil','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where will they stay in Hanoi?', 'Họ sẽ ở đâu khi đến Hà Nội?', 2, ['where', 'future'],
  [tok('Where','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('they','pronoun','subject'), tok('stay','verb','verb','stay','base'), tok('in','preposition','adverbial'), tok('Hanoi','noun','adverbial','Hanoi','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where is your schoolbag?', 'Cặp sách của bạn ở đâu?', 1, ['where', 'school'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('schoolbag','noun','subject','schoolbag','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where are they going for vacation?', 'Họ dự định đi nghỉ mát ở đâu?', 2, ['where', 'travel'],
  [tok('Where','adverb','adverbial'), tok('are','verb','verb','be','aux-present-other'), tok('they','pronoun','subject'), tok('going','verb','verb','go','ing'), tok('for','preposition','adverbial'), tok('vacation','noun','adverbial','vacation','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where did Tom find the key?', 'Tom đã tìm thấy chiếc chìa khóa ở đâu?', 2, ['where', 'past-simple'],
  [tok('Where','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('Tom','noun','subject','Tom','sg'), tok('find','verb','verb','find','base'), tok('the','article','det'), tok('key','noun','object','key','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where is the bus stop?', 'Trạm xe buýt ở đâu thế?', 1, ['where', 'transport'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('bus','noun','modifier','bus','sg'), tok('stop','noun','subject','stop','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where do you often play soccer?', 'Bạn thường chơi bóng đá ở đâu?', 2, ['where', 'sport'],
  [tok('Where','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('often','adverb','adverbial'), tok('play','verb','verb','play','base'), tok('soccer','noun','object','soccer','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where was Nam yesterday morning?', 'Sáng hôm qua Nam đã ở đâu?', 2, ['where', 'was-were'],
  [tok('Where','adverb','adverbial'), tok('was','verb','verb','be','aux-past'), tok('Nam','noun','subject','Nam','sg'), tok('yesterday','adverb','adverbial'), tok('morning','noun','adverbial','morning','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where were they last night?', 'Tối qua họ đã ở đâu thế?', 2, ['where', 'was-were'],
  [tok('Where','adverb','adverbial'), tok('were','verb','verb','be','aux-past'), tok('they','pronoun','subject'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where is the post office?', 'Bưu điện ở đâu vậy?', 1, ['where', 'place'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('post','noun','modifier','post','sg'), tok('office','noun','subject','office','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where did you spend your weekend?', 'Bạn đã trải qua cuối tuần ở đâu?', 3, ['where', 'past-simple'],
  [tok('Where','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('spend','verb','verb','spend','base'), tok('your','determiner','det'), tok('weekend','noun','object','weekend','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where is the train station?', 'Ga xe lửa ở đâu?', 1, ['where', 'transport'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('train','noun','modifier','train','sg'), tok('station','noun','subject','station','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where do these birds fly in winter?', 'Những chú chim này bay đi đâu vào mùa đông?', 2, ['where', 'nature'],
  [tok('Where','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('these','determiner','det'), tok('birds','noun','subject','bird','pl'), tok('fly','verb','verb','fly','base'), tok('in','preposition','adverbial'), tok('winter','noun','adverbial','winter','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where did you leave your shoes?', 'Bạn đã để giày ở đâu?', 2, ['where', 'daily'],
  [tok('Where','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('leave','verb','verb','leave','base'), tok('your','determiner','det'), tok('shoes','noun','object','shoe','pl'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where can I find some water?', 'Tôi có thể tìm thấy chút nước ở đâu?', 2, ['where', 'drink'],
  [tok('Where','adverb','adverbial'), tok('can','verb','verb','can','base'), tok('I','pronoun','subject'), tok('find','verb','verb','find','base'), tok('some','determiner','det'), tok('water','noun','object','water','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where is your classroom?', 'Phòng học của bạn ở đâu?', 1, ['where', 'school'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('classroom','noun','subject','classroom','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where are you from?', 'Bạn đến từ đâu?', 1, ['where', 'place'],
  [tok('Where','adverb','adverbial'), tok('are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('from','preposition','prep'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where did she go on holiday?', 'Cô ấy đã đi đâu vào kỳ nghỉ?', 2, ['where', 'travel'],
  [tok('Where','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('she','pronoun','subject'), tok('go','verb','verb','go','base'), tok('on','preposition','adverbial'), tok('holiday','noun','adverbial','holiday','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where will the band play tomorrow?', 'Ngày mai ban nhạc sẽ biểu diễn ở đâu?', 2, ['where', 'music'],
  [tok('Where','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('the','article','det'), tok('band','noun','subject','band','sg'), tok('play','verb','verb','play','base'), tok('tomorrow','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('where', 'Where is my yellow hat?', 'Chiếc mũ màu vàng của tôi ở đâu?', 1, ['where', 'clothes'],
  [tok('Where','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('my','determiner','det'), tok('yellow','adjective','modifier'), tok('hat','noun','subject','hat','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

// -------------------------------------------------------------------------
// 3. WHEN (25 câu: C1-s-0066 -> C1-s-0090)
// -------------------------------------------------------------------------
addQ('when', 'When is your birthday?', 'Sinh nhật của bạn vào khi nào?', 1, ['when', 'birthday'],
  [tok('When','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('birthday','noun','subject','birthday','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'When', promptVi:'Hỏi thời điểm sinh nhật.', hint:'When'});

addQ('when', 'When does school start?', 'Khi nào trường học bắt đầu?', 1, ['when', 'school'],
  [tok('When','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('school','noun','subject','school','sg'), tok('start','verb','verb','start','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'When', promptVi:'Hỏi thời điểm bắt đầu.', hint:'When'});

addQ('when', 'When do you get up in the morning?', 'Buổi sáng bạn thức dậy lúc mấy giờ?', 1, ['when', 'daily'],
  [tok('When','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('get','verb','verb','get','base'), tok('up','particle','particle'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('morning','noun','adverbial','morning','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6,7]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did they arrive?', 'Họ đã đến khi nào thế?', 2, ['when', 'past-simple'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('they','pronoun','subject'), tok('arrive','verb','verb','arrive','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When will the train arrive?', 'Khi nào đoàn tàu sẽ đến?', 2, ['when', 'future'],
  [tok('When','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('the','article','det'), tok('train','noun','subject','train','sg'), tok('arrive','verb','verb','arrive','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did you buy this car?', 'Bạn đã mua chiếc xe này khi nào?', 2, ['when', 'transport'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('buy','verb','verb','buy','base'), tok('this','determiner','det'), tok('car','noun','object','car','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When does the movie start?', 'Bộ phim bắt đầu lúc nào?', 1, ['when', 'hobby'],
  [tok('When','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('the','article','det'), tok('movie','noun','subject','movie','sg'), tok('start','verb','verb','start','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When do you do your homework?', 'Bạn làm bài tập về nhà khi nào?', 2, ['when', 'school'],
  [tok('When','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('do','verb','verb','do','base'), tok('your','determiner','det'), tok('homework','noun','object','homework','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did she finish her homework?', 'Cô ấy đã làm xong bài tập khi nào?', 2, ['when', 'past-simple'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('she','pronoun','subject'), tok('finish','verb','verb','finish','base'), tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When will they visit grandparents?', 'Khi nào họ sẽ thăm ông bà?', 2, ['when', 'future'],
  [tok('When','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('they','pronoun','subject'), tok('visit','verb','verb','visit','base'), tok('grandparents','noun','object','grandparent','pl'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When is the party tonight?', 'Tối nay bữa tiệc bắt đầu khi nào?', 2, ['when', 'party'],
  [tok('When','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('party','noun','subject','party','sg'), tok('tonight','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did you clean your room?', 'Bạn đã dọn phòng khi nào thế?', 2, ['when', 'home'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('clean','verb','verb','clean','base'), tok('your','determiner','det'), tok('room','noun','object','room','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When does the library close?', 'Thư viện đóng cửa lúc mấy giờ?', 2, ['when', 'place'],
  [tok('When','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('the','article','det'), tok('library','noun','subject','library','sg'), tok('close','verb','verb','close','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did they win the game?', 'Họ đã chiến thắng trận đấu khi nào?', 2, ['when', 'sport'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('they','pronoun','subject'), tok('win','verb','verb','win','base'), tok('the','article','det'), tok('game','noun','object','game','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When will we have dinner?', 'Khi nào chúng ta sẽ ăn tối?', 1, ['when', 'food'],
  [tok('When','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('we','pronoun','subject'), tok('have','verb','verb','have','base'), tok('dinner','noun','object','dinner','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When does spring begin in Vietnam?', 'Mùa xuân ở Việt Nam bắt đầu khi nào?', 3, ['when', 'season'],
  [tok('When','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('spring','noun','subject','spring','uncountable'), tok('begin','verb','verb','begin','base'), tok('in','preposition','adverbial'), tok('Vietnam','noun','adverbial','Vietnam','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did you see him?', 'Bạn đã nhìn thấy cậu ấy khi nào?', 1, ['when', 'past-simple'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('see','verb','verb','see','base'), tok('him','pronoun','object'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When will the bus come?', 'Khi nào xe buýt sẽ tới?', 1, ['when', 'transport'],
  [tok('When','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('the','article','det'), tok('bus','noun','subject','bus','sg'), tok('come','verb','verb','come','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did Nam buy that book?', 'Nam đã mua cuốn sách đó khi nào thế?', 2, ['when', 'study'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('Nam','noun','subject','Nam','sg'), tok('buy','verb','verb','buy','base'), tok('that','determiner','det'), tok('book','noun','object','book','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When do you usually go to bed?', 'Bạn thường đi ngủ vào lúc mấy giờ?', 2, ['when', 'routine'],
  [tok('When','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('usually','adverb','adverbial'), tok('go','verb','verb','go','base'), tok('to','preposition','adverbial'), tok('bed','noun','adverbial','bed','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When will you be back home?', 'Khi nào bạn sẽ về nhà?', 2, ['when', 'home'],
  [tok('When','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('you','pronoun','subject'), tok('be','verb','verb','be','base'), tok('back','adverb','adverbial'), tok('home','noun','adverbial','home','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When does the morning class end?', 'Khi nào lớp học buổi sáng kết thúc?', 2, ['when', 'school'],
  [tok('When','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('the','article','det'), tok('morning','noun','modifier','morning','sg'), tok('class','noun','subject','class','sg'), tok('end','verb','verb','end','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,5]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did the rain stop?', 'Cơn mưa đã tạnh khi nào?', 2, ['when', 'weather'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('the','article','det'), tok('rain','noun','subject','rain','uncountable'), tok('stop','verb','verb','stop','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When will the music festival take place?', 'Lễ hội âm nhạc sẽ diễn ra khi nào?', 3, ['when', 'event'],
  [tok('When','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('the','article','det'), tok('music','noun','modifier','music','uncountable'), tok('festival','noun','subject','festival','sg'), tok('take','verb','verb','take','base'), tok('place','noun','object','place','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,5]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'object', tokenIndices:[6]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('when', 'When did they visit the museum?', 'Họ đã thăm viện bảo tàng khi nào?', 2, ['when', 'place'],
  [tok('When','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('they','pronoun','subject'), tok('visit','verb','verb','visit','base'), tok('the','article','det'), tok('museum','noun','object','museum','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

// -------------------------------------------------------------------------
// 4. WHO (25 câu: C1-s-0091 -> C1-s-0115)
// -------------------------------------------------------------------------
addQ('who', 'Who is that tall boy?', 'Cậu bé cao lớn đó là ai thế?', 1, ['who', 'people'],
  [tok('Who','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('tall','adjective','modifier'), tok('boy','noun','subject','boy','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Hỏi người: Who.', hint:'Who'});

addQ('who', 'Who is your English teacher?', 'Ai là giáo viên tiếng Anh của bạn?', 1, ['who', 'school'],
  [tok('Who','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('English','noun','modifier','English','uncountable'), tok('teacher','noun','subject','teacher','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Hỏi người: Who.', hint:'Who'});

addQ('who', 'Who is playing piano in the room?', 'Ai đang chơi đàn piano trong phòng vậy?', 2, ['who', 'music'],
  [tok('Who','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('playing','verb','verb','play','ing'), tok('piano','noun','object','piano','sg'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('room','noun','adverbial','room','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'Who', promptVi:'Điền Who làm chủ ngữ.', hint:'Who'});

addQ('who', 'Who did you meet yesterday?', 'Hôm qua bạn đã gặp ai thế?', 2, ['who', 'past-simple'],
  [tok('Who','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('meet','verb','verb','meet','base'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Who', promptVi:'Hỏi người làm tân ngữ: Who.', hint:'Who'});

addQ('who', 'Who will help us with the work?', 'Ai sẽ giúp chúng ta công việc này?', 2, ['who', 'future'],
  [tok('Who','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('help','verb','verb','help','base'), tok('us','pronoun','object'), tok('with','preposition','adverbial'), tok('the','article','det'), tok('work','noun','adverbial','work','uncountable'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who is your best friend?', 'Ai là người bạn tốt nhất của bạn?', 1, ['who', 'friend'],
  [tok('Who','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('best','adjective','modifier'), tok('friend','noun','subject','friend','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who cooked this delicious soup?', 'Ai đã nấu món súp ngon tuyệt này thế?', 2, ['who', 'food'],
  [tok('Who','pronoun','subject'), tok('cooked','verb','verb','cook','past'), tok('this','determiner','det'), tok('delicious','adjective','modifier'), tok('soup','noun','object','soup','uncountable'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who làm chủ ngữ.', hint:'Who'});

addQ('who', 'Who broke the window yesterday?', 'Hôm qua ai đã làm vỡ cửa sổ thế?', 2, ['who', 'past-simple'],
  [tok('Who','pronoun','subject'), tok('broke','verb','verb','break','past'), tok('the','article','det'), tok('window','noun','object','window','sg'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who is knocking at the door?', 'Ai đang gõ cửa vậy?', 2, ['who', 'present-continuous'],
  [tok('Who','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('knocking','verb','verb','knock','ing'), tok('at','preposition','adverbial'), tok('the','article','det'), tok('door','noun','adverbial','door','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who wrote this lovely poem?', 'Ai đã viết bài thơ đáng yêu này?', 2, ['who', 'study'],
  [tok('Who','pronoun','subject'), tok('wrote','verb','verb','write','past'), tok('this','determiner','det'), tok('lovely','adjective','modifier'), tok('poem','noun','object','poem','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who wants some ice cream?', 'Ai muốn ăn chút kem nào?', 1, ['who', 'food'],
  [tok('Who','pronoun','subject'), tok('wants','verb','verb','want','present-3sg'), tok('some','determiner','det'), tok('ice','noun','modifier','ice','uncountable'), tok('cream','noun','object','cream','uncountable'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who is sitting next to you?', 'Ai đang ngồi cạnh bạn thế?', 2, ['who', 'present-continuous'],
  [tok('Who','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('sitting','verb','verb','sit','ing'), tok('next','preposition','adverbial'), tok('to','preposition','adverbial'), tok('you','pronoun','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who will drive the car tomorrow?', 'Ngày mai ai sẽ lái xe ô tô?', 2, ['who', 'future'],
  [tok('Who','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('drive','verb','verb','drive','base'), tok('the','article','det'), tok('car','noun','object','car','sg'), tok('tomorrow','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who gave you that present?', 'Ai đã tặng bạn món quà đó vậy?', 2, ['who', 'gift'],
  [tok('Who','pronoun','subject'), tok('gave','verb','verb','give','past'), tok('you','pronoun','object'), tok('that','determiner','det'), tok('present','noun','object','present','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who was at the door?', 'Ai đã ở cửa thế?', 1, ['who', 'was-were'],
  [tok('Who','pronoun','subject'), tok('was','verb','verb','be','aux-past'), tok('at','preposition','prep'), tok('the','article','det'), tok('door','noun','prep-object','door','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who teaches you science?', 'Ai dạy môn khoa học cho bạn?', 2, ['who', 'school'],
  [tok('Who','pronoun','subject'), tok('teaches','verb','verb','teach','present-3sg'), tok('you','pronoun','object'), tok('science','noun','object','science','uncountable'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who knows the right answer?', 'Ai biết câu trả lời đúng nào?', 2, ['who', 'school'],
  [tok('Who','pronoun','subject'), tok('knows','verb','verb','know','present-3sg'), tok('the','article','det'), tok('right','adjective','modifier'), tok('answer','noun','object','answer','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who cleaned the kitchen yesterday?', 'Hôm qua ai đã lau dọn nhà bếp thế?', 2, ['who', 'home'],
  [tok('Who','pronoun','subject'), tok('cleaned','verb','verb','clean','past'), tok('the','article','det'), tok('kitchen','noun','object','kitchen','sg'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who can sing this song?', 'Ai có thể hát bài ca này?', 1, ['who', 'music'],
  [tok('Who','pronoun','subject'), tok('can','verb','verb','can','base'), tok('sing','verb','verb','sing','base'), tok('this','determiner','det'), tok('song','noun','object','song','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who took my red pen?', 'Ai đã cầm chiếc bút đỏ của tôi thế?', 2, ['who', 'study'],
  [tok('Who','pronoun','subject'), tok('took','verb','verb','take','past'), tok('my','determiner','det'), tok('red','adjective','modifier'), tok('pen','noun','object','pen','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who is that woman over there?', 'Người phụ nữ đằng kia là ai vậy?', 2, ['who', 'people'],
  [tok('Who','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('woman','noun','subject','woman','sg'), tok('over','preposition','adverbial'), tok('there','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who did you call last night?', 'Tối qua bạn đã gọi điện cho ai?', 2, ['who', 'past-simple'],
  [tok('Who','pronoun','object'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('call','verb','verb','call','base'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who will bake the birthday cake?', 'Ai sẽ nướng chiếc bánh sinh nhật?', 2, ['who', 'food'],
  [tok('Who','pronoun','subject'), tok('will','verb','verb','will','aux-future'), tok('bake','verb','verb','bake','base'), tok('the','article','det'), tok('birthday','noun','modifier','birthday','sg'), tok('cake','noun','object','cake','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'object', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who is drawing on the board?', 'Ai đang vẽ lên bảng thế?', 2, ['who', 'art'],
  [tok('Who','pronoun','subject'), tok('is','verb','verb','be','aux-present-3sg'), tok('drawing','verb','verb','draw','ing'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('board','noun','adverbial','board','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('who', 'Who is the fastest runner here?', 'Ai là người chạy nhanh nhất ở đây?', 2, ['who', 'sport'],
  [tok('Who','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('fastest','adjective','modifier'), tok('runner','noun','subject','runner','sg'), tok('here','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

// -------------------------------------------------------------------------
// 5. WHY (20 câu: C1-s-0116 -> C1-s-0135)
// -------------------------------------------------------------------------
addQ('why', 'Why are you late today?', 'Tại sao hôm nay bạn lại đến muộn?', 1, ['why', 'be'],
  [tok('Why','adverb','adverbial'), tok('are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('late','adjective','complement'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Why', promptVi:'Hỏi lý do: Why.', hint:'Why'});

addQ('why', 'Why is she crying?', 'Tại sao cô ấy lại khóc?', 1, ['why', 'present-continuous'],
  [tok('Why','adverb','adverbial'), tok('is','verb','verb','be','aux-present-3sg'), tok('she','pronoun','subject'), tok('crying','verb','verb','cry','ing'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why do you like cats?', 'Tại sao bạn lại thích mèo?', 1, ['why', 'animal'],
  [tok('Why','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('like','verb','verb','like','base'), tok('cats','noun','object','cat','pl'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why did you run so fast?', 'Tại sao bạn lại chạy nhanh thế?', 2, ['why', 'past-simple'],
  [tok('Why','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('run','verb','verb','run','base'), tok('so','adverb','adverbial'), tok('fast','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why are they happy today?', 'Tại sao hôm nay họ lại vui vẻ thế?', 1, ['why', 'emotion'],
  [tok('Why','adverb','adverbial'), tok('are','verb','verb','be','present-other'), tok('they','pronoun','subject'), tok('happy','adjective','complement'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why did he leave early yesterday?', 'Hôm qua tại sao cậu ấy lại về sớm?', 2, ['why', 'past-simple'],
  [tok('Why','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('he','pronoun','subject'), tok('leave','verb','verb','leave','base'), tok('early','adverb','adverbial'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why are you smiling?', 'Tại sao bạn lại mỉm cười thế?', 1, ['why', 'present-continuous'],
  [tok('Why','adverb','adverbial'), tok('are','verb','verb','be','aux-present-other'), tok('you','pronoun','subject'), tok('smiling','verb','verb','smile','ing'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why do birds fly south in winter?', 'Tại sao chim lại bay về phương nam vào mùa đông?', 3, ['why', 'nature'],
  [tok('Why','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('birds','noun','subject','bird','pl'), tok('fly','verb','verb','fly','base'), tok('south','adverb','adverbial'), tok('in','preposition','adverbial'), tok('winter','noun','adverbial','winter','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why is this test so difficult?', 'Tại sao bài kiểm tra này khó thế?', 2, ['why', 'school'],
  [tok('Why','adverb','adverbial'), tok('is','verb','verb','be','present-3sg'), tok('this','determiner','det'), tok('test','noun','subject','test','sg'), tok('so','adverb','modifier'), tok('difficult','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'complement', tokenIndices:[4,5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why did you not call me?', 'Tại sao bạn đã không gọi cho tôi?', 2, ['why', 'past-simple'],
  [tok('Why','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('not','adverb','adverbial'), tok('call','verb','verb','call','base'), tok('me','pronoun','object'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why do we need water?', 'Tại sao chúng ta lại cần nước?', 1, ['why', 'daily'],
  [tok('Why','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('we','pronoun','subject'), tok('need','verb','verb','need','base'), tok('water','noun','object','water','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why were they angry yesterday?', 'Hôm qua tại sao họ lại tức giận?', 2, ['why', 'was-were'],
  [tok('Why','adverb','adverbial'), tok('were','verb','verb','be','aux-past'), tok('they','pronoun','subject'), tok('angry','adjective','complement'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why is he wearing a coat?', 'Tại sao cậu ấy lại đang mặc áo khoác thế?', 2, ['why', 'clothes'],
  [tok('Why','adverb','adverbial'), tok('is','verb','verb','be','aux-present-3sg'), tok('he','pronoun','subject'), tok('wearing','verb','verb','wear','ing'), tok('a','article','det'), tok('coat','noun','object','coat','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why will she not come?', 'Tại sao cô ấy sẽ không đến?', 2, ['why', 'future'],
  [tok('Why','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('she','pronoun','subject'), tok('not','adverb','adverbial'), tok('come','verb','verb','come','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why do you study English?', 'Tại sao bạn lại học tiếng Anh?', 1, ['why', 'school'],
  [tok('Why','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('study','verb','verb','study','base'), tok('English','noun','object','English','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why did the dog bark last night?', 'Tối qua tại sao chú chó lại sủa thế?', 2, ['why', 'animal'],
  [tok('Why','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('the','article','det'), tok('dog','noun','subject','dog','sg'), tok('bark','verb','verb','bark','base'), tok('last','adverb','adverbial'), tok('night','noun','adverbial','night','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why are the streets so crowded?', 'Tại sao đường phố lại đông đúc thế?', 2, ['why', 'place'],
  [tok('Why','adverb','adverbial'), tok('are','verb','verb','be','present-other'), tok('the','article','det'), tok('streets','noun','subject','street','pl'), tok('so','adverb','modifier'), tok('crowded','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'complement', tokenIndices:[4,5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why did you choose this book?', 'Tại sao bạn lại chọn cuốn sách này?', 2, ['why', 'study'],
  [tok('Why','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('choose','verb','verb','choose','base'), tok('this','determiner','det'), tok('book','noun','object','book','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why is baby Tom sleeping now?', 'Tại sao bây giờ bé Tom lại đang ngủ thế?', 2, ['why', 'family'],
  [tok('Why','adverb','adverbial'), tok('is','verb','verb','be','aux-present-3sg'), tok('baby','noun','modifier','baby','sg'), tok('Tom','noun','subject','Tom','sg'), tok('sleeping','verb','verb','sleep','ing'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('why', 'Why do we celebrate birthdays?', 'Tại sao chúng ta lại tổ chức sinh nhật?', 2, ['why', 'custom'],
  [tok('Why','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('we','pronoun','subject'), tok('celebrate','verb','verb','celebrate','base'), tok('birthdays','noun','object','birthday','pl'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

// -------------------------------------------------------------------------
// 6. HOW & HOW OLD/MANY/MUCH (35 câu: C1-s-0136 -> C1-s-0170)
// -------------------------------------------------------------------------
addQ('how', 'How are you today?', 'Hôm nay bạn thế nào?', 1, ['how', 'feeling'],
  [tok('How','adverb','complement'), tok('are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  {idx:0, ans:'How', promptVi:'Hỏi thăm sức khỏe: How.', hint:'How'});

addQ('how', 'How do you go to school?', 'Bạn đến trường bằng phương tiện gì?', 1, ['how', 'transport'],
  [tok('How','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('go','verb','verb','go','base'), tok('to','preposition','adverbial'), tok('school','noun','adverbial','school','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'How', promptVi:'Hỏi cách thức di chuyển: How.', hint:'How'});

addQ('how-old', 'How old are you?', 'Bạn bao nhiêu tuổi?', 1, ['how-old', 'age'],
  [tok('How','adverb','modifier'), tok('old','adjective','complement'), tok('are','verb','verb','be','present-other'), tok('you','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  {idx:0, ans:'How', promptVi:'Hỏi tuổi: How old.', hint:'How'});

addQ('how-old', 'How old is your sister?', 'Em gái bạn bao nhiêu tuổi?', 1, ['how-old', 'age'],
  [tok('How','adverb','modifier'), tok('old','adjective','complement'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('sister','noun','subject','sister','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3,4]}],
  {idx:0, ans:'How', promptVi:'Hỏi tuổi: How old.', hint:'How'});

addQ('how-many', 'How many books do you have?', 'Bạn có bao nhiêu cuốn sách?', 1, ['how-many', 'quantity'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('books','noun','object','book','pl'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('have','verb','verb','have','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}],
  {idx:1, ans:'many', promptVi:'Hỏi số lượng danh từ đếm được: How many.', hint:'many'});

addQ('how-many', 'How many students are in the classroom?', 'Có bao nhiêu học sinh trong lớp học?', 2, ['how-many', 'school'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('students','noun','subject','student','pl'), tok('are','verb','verb','be','present-other'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('classroom','noun','adverbial','classroom','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:1, ans:'many', promptVi:'Điền many sau How.', hint:'many'});

addQ('how-many', 'How many apples did you buy?', 'Bạn đã mua bao nhiêu quả táo?', 2, ['how-many', 'past-simple'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('apples','noun','object','apple','pl'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('buy','verb','verb','buy','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-much', 'How much water do you drink every day?', 'Mỗi ngày bạn uống bao nhiêu nước?', 2, ['how-much', 'health'],
  [tok('How','adverb','modifier'), tok('much','determiner','det'), tok('water','noun','object','water','uncountable'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('drink','verb','verb','drink','base'), tok('every','determiner','det'), tok('day','noun','adverbial','day','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6,7]}],
  {idx:1, ans:'much', promptVi:'Hỏi lượng danh từ không đếm được: How much.', hint:'much'});

addQ('how-much', 'How much is this schoolbag?', 'Chiếc cặp này giá bao nhiêu tiền?', 1, ['how-much', 'price'],
  [tok('How','adverb','modifier'), tok('much','adjective','complement'), tok('is','verb','verb','be','present-3sg'), tok('this','determiner','det'), tok('schoolbag','noun','subject','schoolbag','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3,4]}],
  {idx:0, ans:'How', promptVi:'Hỏi giá tiền: How much.', hint:'How'});

addQ('how', 'How do you spell your name?', 'Bạn đánh vần tên mình thế nào?', 1, ['how', 'spelling'],
  [tok('How','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('spell','verb','verb','spell','base'), tok('your','determiner','det'), tok('name','noun','object','name','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'How', promptVi:'Hỏi cách đánh vần: How.', hint:'How'});

addQ('how', 'How does your father travel to work?', 'Bố bạn đi làm bằng phương tiện gì?', 2, ['how', 'transport'],
  [tok('How','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('your','determiner','det'), tok('father','noun','subject','father','sg'), tok('travel','verb','verb','travel','base'), tok('to','preposition','adverbial'), tok('work','noun','adverbial','work','uncountable'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-many', 'How many pens are in your pencil case?', 'Có bao nhiêu chiếc bút trong hộp bút của bạn?', 2, ['how-many', 'school'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('pens','noun','subject','pen','pl'), tok('are','verb','verb','be','present-other'), tok('in','preposition','adverbial'), tok('your','determiner','det'), tok('pencil','noun','modifier','pencil','sg'), tok('case','noun','adverbial','case','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:1, ans:'many', promptVi:'Điền many.', hint:'many'});

addQ('how-much', 'How much does that shirt cost?', 'Chiếc áo sơ mi đó giá bao nhiêu tiền?', 2, ['how-much', 'price'],
  [tok('How','adverb','modifier'), tok('much','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('that','determiner','det'), tok('shirt','noun','subject','shirt','sg'), tok('cost','verb','verb','cost','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,5]}, {clauseId:'c1', role:'subject', tokenIndices:[3,4]}],
  {idx:1, ans:'much', promptVi:'Điền much trong How much does it cost.', hint:'much'});

addQ('how', 'How was your weekend trip?', 'Chuyến đi cuối tuần của bạn thế nào?', 2, ['how', 'trip'],
  [tok('How','adverb','complement'), tok('was','verb','verb','be','aux-past'), tok('your','determiner','det'), tok('weekend','noun','modifier','weekend','sg'), tok('trip','noun','subject','trip','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'How', promptVi:'Hỏi cảm nhận: How was...', hint:'How'});

addQ('how', 'How can I solve this problem?', 'Tôi có thể giải quyết bài toán này như thế nào?', 3, ['how', 'school'],
  [tok('How','adverb','adverbial'), tok('can','verb','verb','can','base'), tok('I','pronoun','subject'), tok('solve','verb','verb','solve','base'), tok('this','determiner','det'), tok('problem','noun','object','problem','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-many', 'How many brothers do you have?', 'Bạn có bao nhiêu anh em trai?', 1, ['how-many', 'family'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('brothers','noun','object','brother','pl'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('have','verb','verb','have','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}],
  {idx:1, ans:'many', promptVi:'Điền many.', hint:'many'});

addQ('how-many', 'How many seasons are there in Vietnam?', 'Ở Việt Nam có bao nhiêu mùa?', 2, ['how-many', 'season'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('seasons','noun','subject','season','pl'), tok('are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('in','preposition','adverbial'), tok('Vietnam','noun','adverbial','Vietnam','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:1, ans:'many', promptVi:'Điền many.', hint:'many'});

addQ('how-much', 'How much milk is in the bottle?', 'Có bao nhiêu sữa trong chai?', 2, ['how-much', 'drink'],
  [tok('How','adverb','modifier'), tok('much','determiner','det'), tok('milk','noun','subject','milk','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('bottle','noun','adverbial','bottle','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:1, ans:'much', promptVi:'Sữa không đếm được: How much.', hint:'much'});

addQ('how', 'How did they travel to Da Nang?', 'Họ đã đi du lịch Đà Nẵng bằng cách nào?', 2, ['how', 'past-simple'],
  [tok('How','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('they','pronoun','subject'), tok('travel','verb','verb','travel','base'), tok('to','preposition','adverbial'), tok('Da','noun','modifier','Da','sg'), tok('Nang','noun','adverbial','Nang','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-old', 'How old was Nam last year?', 'Năm ngoái Nam bao nhiêu tuổi?', 2, ['how-old', 'was-were'],
  [tok('How','adverb','modifier'), tok('old','adjective','complement'), tok('was','verb','verb','be','aux-past'), tok('Nam','noun','subject','Nam','sg'), tok('last','adverb','adverbial'), tok('year','noun','adverbial','year','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how', 'How does this toy work?', 'Món đồ chơi này hoạt động như thế nào?', 2, ['how', 'toy'],
  [tok('How','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('this','determiner','det'), tok('toy','noun','subject','toy','sg'), tok('work','verb','verb','work','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-many', 'How many lessons do you have on Monday?', 'Bạn có bao nhiêu tiết học vào thứ Hai?', 2, ['how-many', 'school'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('lessons','noun','object','lesson','pl'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('have','verb','verb','have','base'), tok('on','preposition','adverbial'), tok('Monday','noun','adverbial','Monday','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6,7]}],
  {idx:1, ans:'many', promptVi:'Điền many.', hint:'many'});

addQ('how-much', 'How much time do we have left?', 'Chúng ta còn lại bao nhiêu thời gian?', 2, ['how-much', 'time'],
  [tok('How','adverb','modifier'), tok('much','determiner','det'), tok('time','noun','object','time','uncountable'), tok('do','verb','verb','do','aux-present-other'), tok('we','pronoun','subject'), tok('have','verb','verb','have','base'), tok('left','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  {idx:1, ans:'much', promptVi:'Điền much.', hint:'much'});

addQ('how', 'How will you get there tomorrow?', 'Ngày mai bạn sẽ đến đó bằng phương tiện gì?', 2, ['how', 'future'],
  [tok('How','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('you','pronoun','subject'), tok('get','verb','verb','get','base'), tok('there','adverb','adverbial'), tok('tomorrow','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-old', 'How old will you be next year?', 'Năm tới bạn sẽ bao nhiêu tuổi?', 2, ['how-old', 'future'],
  [tok('How','adverb','modifier'), tok('old','adjective','complement'), tok('will','verb','verb','will','aux-future'), tok('you','pronoun','subject'), tok('be','verb','verb','be','base'), tok('next','adverb','adverbial'), tok('year','noun','adverbial','year','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5,6]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how', 'How is the weather today?', 'Hôm nay thời tiết thế nào?', 1, ['how', 'weather'],
  [tok('How','adverb','complement'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('weather','noun','subject','weather','uncountable'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-many', 'How many cookies did mother bake?', 'Mẹ đã nướng bao nhiêu chiếc bánh quy?', 2, ['how-many', 'food'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('cookies','noun','object','cookie','pl'), tok('did','verb','verb','do','aux-past'), tok('mother','noun','subject','mother','sg'), tok('bake','verb','verb','bake','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}],
  {idx:1, ans:'many', promptVi:'Điền many.', hint:'many'});

addQ('how-much', 'How much rice did they buy yesterday?', 'Hôm qua họ đã mua bao nhiêu gạo?', 2, ['how-much', 'food'],
  [tok('How','adverb','modifier'), tok('much','determiner','det'), tok('rice','noun','object','rice','uncountable'), tok('did','verb','verb','do','aux-past'), tok('they','pronoun','subject'), tok('buy','verb','verb','buy','base'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  {idx:1, ans:'much', promptVi:'Gạo (rice) không đếm được: How much.', hint:'much'});

addQ('how', 'How do you feel right now?', 'Ngay lúc này bạn cảm thấy thế nào?', 2, ['how', 'feeling'],
  [tok('How','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('feel','verb','verb','feel','base'), tok('right','adverb','adverbial'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-many', 'How many cars can you see on the street?', 'Bạn có thể nhìn thấy bao nhiêu chiếc ô tô trên đường?', 2, ['how-many', 'transport'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('cars','noun','object','car','pl'), tok('can','verb','verb','can','base'), tok('you','pronoun','subject'), tok('see','verb','verb','see','base'), tok('on','preposition','adverbial'), tok('the','article','det'), tok('street','noun','adverbial','street','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6,7,8]}],
  {idx:1, ans:'many', promptVi:'Điền many.', hint:'many'});

addQ('how-old', 'How old is this big banyan tree?', 'Cây đa to lớn này bao nhiêu tuổi rồi?', 3, ['how-old', 'nature'],
  [tok('How','adverb','modifier'), tok('old','adjective','complement'), tok('is','verb','verb','be','present-3sg'), tok('this','determiner','det'), tok('big','adjective','modifier'), tok('banyan','noun','modifier','banyan','sg'), tok('tree','noun','subject','tree','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3,4,5,6]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how', 'How fast does the train run?', 'Đoàn tàu chạy nhanh thế nào?', 2, ['how', 'speed'],
  [tok('How','adverb','modifier'), tok('fast','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('the','article','det'), tok('train','noun','subject','train','sg'), tok('run','verb','verb','run','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,5]}, {clauseId:'c1', role:'subject', tokenIndices:[3,4]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('how-many', 'How many stars are in the sky tonight?', 'Tối nay có bao nhiêu ngôi sao trên bầu trời?', 2, ['how-many', 'nature'],
  [tok('How','adverb','modifier'), tok('many','determiner','det'), tok('stars','noun','subject','star','pl'), tok('are','verb','verb','be','present-other'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('sky','noun','adverbial','sky','sg'), tok('tonight','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7]}],
  {idx:1, ans:'many', promptVi:'Điền many.', hint:'many'});

addQ('how-much', 'How much sugar do you want in your tea?', 'Bạn muốn bao nhiêu đường trong trà?', 2, ['how-much', 'drink'],
  [tok('How','adverb','modifier'), tok('much','determiner','det'), tok('sugar','noun','object','sugar','uncountable'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('want','verb','verb','want','base'), tok('in','preposition','adverbial'), tok('your','determiner','det'), tok('tea','noun','adverbial','tea','uncountable'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3,5]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6,7,8]}],
  {idx:1, ans:'much', promptVi:'Đường không đếm được: How much.', hint:'much'});

addQ('how', 'How did she bake such a delicious cake?', 'Làm sao mà cô ấy nướng được chiếc bánh ngon như thế?', 3, ['how', 'food'],
  [tok('How','adverb','adverbial'), tok('did','verb','verb','do','aux-past'), tok('she','pronoun','subject'), tok('bake','verb','verb','bake','base'), tok('such','determiner','det'), tok('a','article','det'), tok('delicious','adjective','modifier'), tok('cake','noun','object','cake','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5,6,7]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

// -------------------------------------------------------------------------
// 7. WHICH & WHOSE & ANSWERS (30 câu: C1-s-0171 -> C1-s-0200)
// -------------------------------------------------------------------------
addQ('which', 'Which book do you want to read?', 'Bạn muốn đọc cuốn sách nào?', 1, ['which', 'study'],
  [tok('Which','determiner','det'), tok('book','noun','object','book','sg'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('want','verb','verb','want','base'), tok('to','particle','particle'), tok('read','verb','object','read','base'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  {idx:0, ans:'Which', promptVi:'Hỏi lựa chọn: Which.', hint:'Which'});

addQ('which', 'Which color do you like best?', 'Bạn thích màu nào nhất?', 1, ['which', 'color'],
  [tok('Which','determiner','det'), tok('color','noun','object','color','sg'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('like','verb','verb','like','base'), tok('best','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Which', promptVi:'Hỏi lựa chọn trong các màu.', hint:'Which'});

addQ('which', 'Which is your classroom?', 'Phòng học của bạn là phòng nào?', 1, ['which', 'school'],
  [tok('Which','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('classroom','noun','subject','classroom','sg'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('which', 'Which season do you like most?', 'Bạn thích mùa nào nhất?', 2, ['which', 'season'],
  [tok('Which','determiner','det'), tok('season','noun','object','season','sg'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('like','verb','verb','like','base'), tok('most','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('which', 'Which dress did she choose yesterday?', 'Hôm qua cô ấy đã chọn chiếc váy nào thế?', 2, ['which', 'clothes'],
  [tok('Which','determiner','det'), tok('dress','noun','object','dress','sg'), tok('did','verb','verb','do','aux-past'), tok('she','pronoun','subject'), tok('choose','verb','verb','choose','base'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('which', 'Which sport will you play tomorrow?', 'Ngày mai bạn sẽ chơi môn thể thao nào?', 2, ['which', 'sport'],
  [tok('Which','determiner','det'), tok('sport','noun','object','sport','sg'), tok('will','verb','verb','will','aux-future'), tok('you','pronoun','subject'), tok('play','verb','verb','play','base'), tok('tomorrow','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('which', 'Which animal runs faster?', 'Con vật nào chạy nhanh hơn?', 2, ['which', 'animal'],
  [tok('Which','determiner','det'), tok('animal','noun','subject','animal','sg'), tok('runs','verb','verb','run','present-3sg'), tok('faster','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('which', 'Which house is yours?', 'Ngôi nhà nào là của bạn?', 1, ['which', 'home'],
  [tok('Which','determiner','det'), tok('house','noun','subject','house','sg'), tok('is','verb','verb','be','present-3sg'), tok('yours','pronoun','complement'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('which', 'Which song are they singing now?', 'Họ đang hát bài hát nào vậy?', 2, ['which', 'music'],
  [tok('Which','determiner','det'), tok('song','noun','object','song','sg'), tok('are','verb','verb','be','aux-present-other'), tok('they','pronoun','subject'), tok('singing','verb','verb','sing','ing'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('which', 'Which pen writes better?', 'Chiếc bút nào viết êm hơn?', 2, ['which', 'study'],
  [tok('Which','determiner','det'), tok('pen','noun','subject','pen','sg'), tok('writes','verb','verb','write','present-3sg'), tok('better','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('whose', 'Whose bag is this?', 'Chiếc túi này của ai?', 1, ['whose', 'possession'],
  [tok('Whose','determiner','det'), tok('bag','noun','complement','bag','sg'), tok('is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  {idx:0, ans:'Whose', promptVi:'Hỏi sở hữu của ai: Whose.', hint:'Whose'});

addQ('whose', 'Whose shoes are those?', 'Đôi giày kia là của ai thế?', 1, ['whose', 'clothes'],
  [tok('Whose','determiner','det'), tok('shoes','noun','complement','shoe','pl'), tok('are','verb','verb','be','present-other'), tok('those','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  {idx:0, ans:'Whose', promptVi:'Hỏi sở hữu: Whose.', hint:'Whose'});

addQ('whose', 'Whose bicycle is parked outside?', 'Chiếc xe đạp đỗ bên ngoài của ai vậy?', 2, ['whose', 'transport'],
  [tok('Whose','determiner','det'), tok('bicycle','noun','subject','bicycle','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('parked','verb','verb','park','past'), tok('outside','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('whose', 'Whose jacket are you wearing?', 'Bạn đang mặc áo khoác của ai thế?', 2, ['whose', 'clothes'],
  [tok('Whose','determiner','det'), tok('jacket','noun','object','jacket','sg'), tok('are','verb','verb','be','aux-present-other'), tok('you','pronoun','subject'), tok('wearing','verb','verb','wear','ing'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('whose', 'Whose pencil did you borrow yesterday?', 'Hôm qua bạn đã mượn bút chì của ai?', 2, ['whose', 'study'],
  [tok('Whose','determiner','det'), tok('pencil','noun','object','pencil','sg'), tok('did','verb','verb','do','aux-past'), tok('you','pronoun','subject'), tok('borrow','verb','verb','borrow','base'), tok('yesterday','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,4]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('whose', 'Whose dog is barking in the yard?', 'Chú chó của ai đang sủa ngoài sân thế?', 2, ['whose', 'animal'],
  [tok('Whose','determiner','det'), tok('dog','noun','subject','dog','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('barking','verb','verb','bark','ing'), tok('in','preposition','adverbial'), tok('the','article','det'), tok('yard','noun','adverbial','yard','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('whose', 'Whose turn is it to speak?', 'Đến lượt ai phát biểu rồi?', 2, ['whose', 'school'],
  [tok('Whose','determiner','det'), tok('turn','noun','complement','turn','sg'), tok('is','verb','verb','be','present-3sg'), tok('it','pronoun','subject'), tok('to','particle','particle'), tok('speak','verb','object','speak','base'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('whose', 'Whose house is near the park?', 'Nhà của ai ở gần công viên thế?', 2, ['whose', 'home'],
  [tok('Whose','determiner','det'), tok('house','noun','subject','house','sg'), tok('is','verb','verb','be','present-3sg'), tok('near','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('whose', 'Whose books are on the floor?', 'Sách của ai đang ở trên sàn nhà thế?', 2, ['whose', 'study'],
  [tok('Whose','determiner','det'), tok('books','noun','subject','book','pl'), tok('are','verb','verb','be','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('floor','noun','prep-object','floor','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('whose', 'Whose birthday party is next Saturday?', 'Tiệc sinh nhật của ai vào thứ Bảy tới thế?', 2, ['whose', 'party'],
  [tok('Whose','determiner','det'), tok('birthday','noun','modifier','birthday','sg'), tok('party','noun','subject','party','sg'), tok('is','verb','verb','be','present-3sg'), tok('next','adverb','adverbial'), tok('Saturday','noun','adverbial','Saturday','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1,2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

// 10 câu mẫu hỏi - đáp tương tác kết hợp
addQ('what', 'What time does your train leave?', 'Tàu của bạn rời đi lúc mấy giờ?', 2, ['what', 'transport'],
  [tok('What','determiner','det'), tok('time','noun','adverbial','time','uncountable'), tok('does','verb','verb','do','aux-present-3sg'), tok('your','determiner','det'), tok('train','noun','subject','train','sg'), tok('leave','verb','verb','leave','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,5]}, {clauseId:'c1', role:'subject', tokenIndices:[3,4]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What time'});

addQ('where', 'Where do you buy your storybooks?', 'Bạn mua truyện ở đâu thế?', 2, ['where', 'study'],
  [tok('Where','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('buy','verb','verb','buy','base'), tok('your','determiner','det'), tok('storybooks','noun','object','storybook','pl'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

addQ('when', 'When will the teacher announce the test results?', 'Khi nào cô giáo sẽ công bố kết quả bài thi?', 3, ['when', 'school'],
  [tok('When','adverb','adverbial'), tok('will','verb','verb','will','aux-future'), tok('the','article','det'), tok('teacher','noun','subject','teacher','sg'), tok('announce','verb','verb','announce','base'), tok('the','article','det'), tok('test','noun','modifier','test','sg'), tok('results','noun','object','result','pl'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,4]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}, {clauseId:'c1', role:'object', tokenIndices:[5,6,7]}],
  {idx:0, ans:'When', promptVi:'Điền When.', hint:'When'});

addQ('who', 'Who is the girl wearing pink shoes?', 'Cô bé đang đi giày hồng là ai vậy?', 3, ['who', 'clothes'],
  [tok('Who','pronoun','complement'), tok('is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('girl','noun','subject','girl','sg'), tok('wearing','verb','modifier','wear','ing'), tok('pink','adjective','modifier'), tok('shoes','noun','object','shoe','pl'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3]}],
  {idx:0, ans:'Who', promptVi:'Điền Who.', hint:'Who'});

addQ('why', 'Why do you wake up early on Sunday?', 'Tại sao bạn lại dậy sớm vào Chủ nhật?', 2, ['why', 'routine'],
  [tok('Why','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('wake','verb','verb','wake','base'), tok('up','particle','particle'), tok('early','adverb','adverbial'), tok('on','preposition','adverbial'), tok('Sunday','noun','adverbial','Sunday','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6,7]}],
  {idx:0, ans:'Why', promptVi:'Điền Why.', hint:'Why'});

addQ('how', 'How do you make a paper kite?', 'Bạn làm diều giấy như thế nào?', 2, ['how', 'toy'],
  [tok('How','adverb','adverbial'), tok('do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('make','verb','verb','make','base'), tok('a','article','det'), tok('paper','noun','modifier','paper','uncountable'), tok('kite','noun','object','kite','sg'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[4,5,6]}],
  {idx:0, ans:'How', promptVi:'Điền How.', hint:'How'});

addQ('which', 'Which path leads to the village?', 'Con đường nào dẫn về ngôi làng?', 2, ['which', 'place'],
  [tok('Which','determiner','det'), tok('path','noun','subject','path','sg'), tok('leads','verb','verb','lead','present-3sg'), tok('to','preposition','adverbial'), tok('the','article','det'), tok('village','noun','adverbial','village','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3,4,5]}],
  {idx:0, ans:'Which', promptVi:'Điền Which.', hint:'Which'});

addQ('whose', 'Whose cat is sleeping on my chair?', 'Con mèo của ai đang ngủ trên ghế của tôi thế?', 2, ['whose', 'animal'],
  [tok('Whose','determiner','det'), tok('cat','noun','subject','cat','sg'), tok('is','verb','verb','be','aux-present-3sg'), tok('sleeping','verb','verb','sleep','ing'), tok('on','preposition','adverbial'), tok('my','determiner','det'), tok('chair','noun','adverbial','chair','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0,1]}, {clauseId:'c1', role:'verb', tokenIndices:[2,3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6]}],
  {idx:0, ans:'Whose', promptVi:'Điền Whose.', hint:'Whose'});

addQ('what', 'What will you draw for the art competition?', 'Bạn sẽ vẽ gì cho cuộc thi mỹ thuật?', 3, ['what', 'art'],
  [tok('What','pronoun','object'), tok('will','verb','verb','will','aux-future'), tok('you','pronoun','subject'), tok('draw','verb','verb','draw','base'), tok('for','preposition','adverbial'), tok('the','article','det'), tok('art','noun','modifier','art','uncountable'), tok('competition','noun','adverbial','competition','sg'), punctQ],
  [{clauseId:'c1', role:'object', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,3]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4,5,6,7]}],
  {idx:0, ans:'What', promptVi:'Điền What.', hint:'What'});

addQ('where', 'Where does the beautiful rainbow appear?', 'Cầu vồng tuyệt đẹp xuất hiện ở đâu vậy?', 3, ['where', 'nature'],
  [tok('Where','adverb','adverbial'), tok('does','verb','verb','do','aux-present-3sg'), tok('the','article','det'), tok('beautiful','adjective','modifier'), tok('rainbow','noun','subject','rainbow','sg'), tok('appear','verb','verb','appear','base'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1,5]}, {clauseId:'c1', role:'subject', tokenIndices:[2,3,4]}],
  {idx:0, ans:'Where', promptVi:'Điền Where.', hint:'Where'});

// Kiểm tra số lượng câu
console.log(`Generated ${sentences.length} sentences for C1.`);
if (sentences.length !== 200) {
  throw new Error(`Expected 200 sentences, but got ${sentences.length}`);
}

fs.writeFileSync(path.join(DATA_DIR, 'C1.sentences.json'), JSON.stringify(applyContentReviewV4('C1.sentences.json', sentences), null, 2), 'utf-8');
console.log(`✅ Saved C1.sentences.json (${sentences.length} items)`);

// =========================================================================
// 3. THEORY C1 (Wh-questions)
// =========================================================================
const theory = {
  id: 'theory-C1',
  level: 'C1',
  topic: 'wh-questions',
  title: 'Câu hỏi với Từ để hỏi Wh- (Wh-questions)',
  summary: 'Câu hỏi Wh- dùng để tìm kiếm thông tin cụ thể (ai, cái gì, ở đâu, khi nào, tại sao, bằng cách nào) thay vì chỉ trả lời Có (Yes) hoặc Không (No).',
  formulas: [
    {
      name: 'Câu hỏi Wh- với động từ To Be',
      pattern: 'Wh-word + am / is / are / was / were + S...?',
      examples: [
        'What is your name? (Tên bạn là gì?)',
        'Where was he yesterday? (Hôm qua cậu ấy đã ở đâu?)',
        'Who are those students? (Những học sinh kia là ai?)'
      ]
    },
    {
      name: 'Câu hỏi Wh- với Động từ thường (Hiện tại / Quá khứ / Tương lai)',
      pattern: 'Wh-word + do / does / did / will + S + V(nguyên thể base)...?',
      examples: [
        'Where do you live? (Bạn sống ở đâu?)',
        'When did they arrive? (Họ đã đến khi nào?)',
        'What will you do tomorrow? (Ngày mai bạn sẽ làm gì?)'
      ]
    },
    {
      name: 'Câu hỏi Wh- với thì Hiện tại tiếp diễn',
      pattern: 'Wh-word + am / is / are + S + V-ing...?',
      examples: [
        'What are you doing? (Bạn đang làm gì thế?)',
        'Where is he going? (Cậu ấy đang đi đâu vậy?)'
      ]
    }
  ],
  sections: [
    {
      title: '1. Ý nghĩa của 8 từ để hỏi Wh- cơ bản',
      content: '- WHAT: Cái gì, con gì, nghề gì (hỏi sự vật, hành động, thông tin).\n- WHERE: Ở đâu, nơi nào (hỏi nơi chốn, vị trí, địa điểm).\n- WHEN: Khi nào, bao giờ (hỏi mốc thời gian, giờ giấc, ngày tháng).\n- WHO: Ai, người nào (hỏi người làm chủ ngữ hoặc tân ngữ).\n- WHY: Tại sao, vì sao (hỏi nguyên nhân, lý do — câu trả lời thường bắt đầu bằng "Because...").\n- HOW: Như thế nào, bằng cách nào (hỏi tình trạng sức khỏe, cách thức, phương tiện đi lại).\n- WHICH: Cái nào, người nào (hỏi sự lựa chọn trong một nhóm giới hạn).\n- WHOSE: Của ai (hỏi người sở hữu đồ vật).'
    },
    {
      title: '2. Các cụm từ hỏi với "HOW" cực kỳ quen thuộc',
      content: '- HOW OLD: Bao nhiêu tuổi? (How old are you?)\n- HOW MANY + Danh từ số nhiều: Có bao nhiêu? (How many books do you have?)\n- HOW MUCH + Danh từ không đếm được: Có bao nhiêu? Hoặc hỏi giá tiền: Bao nhiêu tiền? (How much is this bag?)\n- HOW FAR: Bao xa? (How far is it to your school?)'
    },
    {
      title: '3. Quy tắc vàng về trật tự từ trong câu hỏi Wh-',
      content: 'Trật tự câu hỏi tiếng Anh luôn tuân thủ nguyên tắc "Đảo ngữ":\n[TỪ ĐỂ HỎI Wh-] + [TRỢ ĐỘNG TỪ: do / does / did / will / to be] + [CHỦ NGỮ] + [ĐỘNG TỪ CHÍNH NGUYÊN THỂ] + ?\nLưu ý: Động từ chính luôn ở dạng BASE khi đã có trợ động từ do/does/did/will!'
    }
  ],
  commonMistakes: [
    {
      wrong: 'Where you live?',
      right: 'Where do you live?',
      why: 'Câu hỏi thì hiện tại đơn với động từ thường bắt buộc phải mượn trợ động từ "do" hoặc "does".'
    },
    {
      wrong: 'What did you ate yesterday?',
      right: 'What did you eat yesterday?',
      why: 'Đã có trợ động từ quá khứ "did" thì động từ chính bắt buộc phải về nguyên thể base (eat).'
    },
    {
      wrong: 'How much pens do you have?',
      right: 'How many pens do you have?',
      why: '"Pens" là danh từ đếm được số nhiều, phải dùng "How many", không dùng "How much".'
    },
    {
      wrong: 'Who book is this?',
      right: 'Whose book is this?',
      why: 'Hỏi quyền sở hữu "của ai" phải dùng "Whose", không dùng "Who".'
    }
  ],
  tips: [
    'Hỏi về NƠI CHỐN → nghĩ ngay tới WHERE.',
    'Hỏi về THỜI GIAN → nghĩ ngay tới WHEN.',
    'Hỏi LÝ DO ("Tại sao") → dùng WHY (trả lời bằng Because).',
    'Nhớ thần chú: "Có did/do/does/will đứng trước thì động từ phía sau luôn là V-base!"'
  ],
  exampleIds: ['C1-s-0001', 'C1-s-0005', 'C1-s-0007', 'C1-s-0036', 'C1-s-0066', 'C1-s-0091', 'C1-s-0116', 'C1-s-0136', 'C1-s-0140']
};

fs.writeFileSync(path.join(DATA_DIR, 'C1.theory.json'), JSON.stringify(applyContentReviewV4('C1.theory.json', theory), null, 2), 'utf-8');
console.log(`✅ Saved C1.theory.json`);
