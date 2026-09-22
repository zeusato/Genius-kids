import { applyContentReviewV4 } from './english-content-review-v4.mjs';
import { applyReviewedOrder } from './english-reviewed-order.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAdjectivePrompts } from './english-adjective-prompts.mjs';

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
    if (t.pos === 'punct') return acc + t.text;
    return acc + ' ' + t.text;
  }, '');
}

// -------------------------------------------------------------
// VOCABULARY A3 (>= 105 words)
// -------------------------------------------------------------
const vocabList = [
  // Tính từ kích thước, tính chất vật lý (25)
  { en: 'big', vi: 'to, lớn', pos: 'adjective', ipa: '/bɪɡ/', image: '🐘', tags: ['description', 'size'], exampleEn: 'The elephant is big.', exampleVi: 'Con voi thì to lớn.' },
  { en: 'small', vi: 'nhỏ, bé', pos: 'adjective', ipa: '/smɔːl/', image: '🐭', tags: ['description', 'size'], exampleEn: 'The mouse is small.', exampleVi: 'Con chuột thì nhỏ bé.' },
  { en: 'tall', vi: 'cao', pos: 'adjective', ipa: '/tɔːl/', image: '🦒', tags: ['description', 'height'], exampleEn: 'My brother is tall.', exampleVi: 'Anh trai tôi thì cao.' },
  { en: 'short', vi: 'thấp, ngắn', pos: 'adjective', ipa: '/ʃɔːrt/', image: '📏', tags: ['description', 'size'], exampleEn: 'Its tail is short.', exampleVi: 'Cái đuôi của nó ngắn.' },
  { en: 'long', vi: 'dài', pos: 'adjective', ipa: '/lɔːŋ/', image: '🐍', tags: ['description', 'size'], exampleEn: 'The snake is long.', exampleVi: 'Con rắn thì dài.' },
  { en: 'fat', vi: 'béo, mập', pos: 'adjective', ipa: '/fæt/', image: '🐼', tags: ['description', 'appearance'], exampleEn: 'The panda is fat.', exampleVi: 'Chú gấu trúc mập mạp.' },
  { en: 'thin', vi: 'gầy, mỏng', pos: 'adjective', ipa: '/θɪn/', image: '🥢', tags: ['description', 'appearance'], exampleEn: 'This book is thin.', exampleVi: 'Cuốn sách này mỏng.' },
  { en: 'heavy', vi: 'nặng', pos: 'adjective', ipa: '/ˈhev.i/', image: '🏋️', tags: ['description'], exampleEn: 'Her bag is heavy.', exampleVi: 'Cặp của cô ấy nặng.' },
  { en: 'light', vi: 'nhẹ', pos: 'adjective', ipa: '/laɪt/', image: '🪶', tags: ['description'], exampleEn: 'The feather is light.', exampleVi: 'Chiếc lông vũ thì nhẹ.' },
  { en: 'fast', vi: 'nhanh', pos: 'adjective', ipa: '/fæst/', image: '🐆', tags: ['description'], exampleEn: 'His car is fast.', exampleVi: 'Xe ô tô của anh ấy chạy nhanh.' },
  { en: 'slow', vi: 'chậm', pos: 'adjective', ipa: '/sloʊ/', image: '🐢', tags: ['description'], exampleEn: 'The turtle is slow.', exampleVi: 'Con rùa thì chậm chạp.' },
  { en: 'hot', vi: 'nóng', pos: 'adjective', ipa: '/hɑːt/', image: '☀️', tags: ['description', 'weather'], exampleEn: 'Today is hot.', exampleVi: 'Hôm nay trời nóng.' },
  { en: 'cold', vi: 'lạnh', pos: 'adjective', ipa: '/koʊld/', image: '❄️', tags: ['description', 'weather'], exampleEn: 'The ice is cold.', exampleVi: 'Đá thì lạnh.' },
  { en: 'warm', vi: 'ấm áp', pos: 'adjective', ipa: '/wɔːrm/', image: '🌤️', tags: ['description', 'weather'], exampleEn: 'My coat is warm.', exampleVi: 'Áo khoác của tôi ấm áp.' },
  { en: 'cool', vi: 'mát mẻ', pos: 'adjective', ipa: '/kuːl/', image: '🍃', tags: ['description', 'weather'], exampleEn: 'The room is cool.', exampleVi: 'Căn phòng mát mẻ.' },
  { en: 'clean', vi: 'sạch sẽ', pos: 'adjective', ipa: '/kliːn/', image: '✨', tags: ['description'], exampleEn: 'Our classroom is clean.', exampleVi: 'Lớp học của chúng tôi sạch sẽ.' },
  { en: 'dirty', vi: 'bẩn thỉu', pos: 'adjective', ipa: '/ˈdɜːr.t̬i/', image: '🧼', tags: ['description'], exampleEn: 'His shoes are dirty.', exampleVi: 'Đôi giày của cậu ấy bị bẩn.' },
  { en: 'new', vi: 'mới', pos: 'adjective', ipa: '/nuː/', image: '🆕', tags: ['description'], exampleEn: 'This is my new bike.', exampleVi: 'Đây là xe đạp mới của tôi.' },
  { en: 'old', vi: 'cũ, già', pos: 'adjective', ipa: '/oʊld/', image: '🏚️', tags: ['description'], exampleEn: 'My grandfather is old.', exampleVi: 'Ông của tôi đã già.' },
  { en: 'young', vi: 'trẻ tuổi', pos: 'adjective', ipa: '/jʌŋ/', image: '👶', tags: ['description'], exampleEn: 'Her sister is young.', exampleVi: 'Em gái của cô ấy còn nhỏ tuổi.' },
  { en: 'quiet', vi: 'yên tĩnh', pos: 'adjective', ipa: '/ˈkwaɪ.ət/', image: '🤫', tags: ['description'], exampleEn: 'The library is quiet.', exampleVi: 'Thư viện rất yên tĩnh.' },
  { en: 'noisy', vi: 'ồn ào', pos: 'adjective', ipa: '/ˈnɔɪ.zi/', image: '📢', tags: ['description'], exampleEn: 'The street is noisy.', exampleVi: 'Đường phố thì ồn ào.' },
  { en: 'soft', vi: 'mềm mại', pos: 'adjective', ipa: '/sɔːft/', image: '🧸', tags: ['description'], exampleEn: 'Her pillow is soft.', exampleVi: 'Chiếc gối của cô ấy rất êm mềm.' },
  { en: 'hard', vi: 'cứng', pos: 'adjective', ipa: '/hɑːrd/', image: '🪨', tags: ['description'], exampleEn: 'The rock is hard.', exampleVi: 'Hòn đá thì cứng.' },
  { en: 'sweet', vi: 'ngọt ngào', pos: 'adjective', ipa: '/swiːt/', image: '🍬', tags: ['description', 'taste'], exampleEn: 'These apples are sweet.', exampleVi: 'Những quả táo này ngọt.' },

  // Tính từ tính cách, ngoại hình & cảm xúc (20)
  { en: 'cute', vi: 'dễ thương', pos: 'adjective', ipa: '/kjuːt/', image: '🐱', tags: ['description', 'appearance'], exampleEn: 'Your puppy is cute.', exampleVi: 'Chú cún của bạn dễ thương.' },
  { en: 'pretty', vi: 'xinh xắn', pos: 'adjective', ipa: '/ˈprɪt.i/', image: '🌸', tags: ['description', 'appearance'], exampleEn: 'She is a pretty girl.', exampleVi: 'Cô ấy là một bé gái xinh xắn.' },
  { en: 'smart', vi: 'thông minh', pos: 'adjective', ipa: '/smɑːrt/', image: '💡', tags: ['description', 'character'], exampleEn: 'Nam is a smart student.', exampleVi: 'Nam là một học sinh thông minh.' },
  { en: 'friendly', vi: 'thân thiện', pos: 'adjective', ipa: '/ˈfrend.li/', image: '🤝', tags: ['description', 'character'], exampleEn: 'Our neighbors are friendly.', exampleVi: 'Hàng xóm của chúng tôi thân thiện.' },
  { en: 'kind', vi: 'tốt bụng', pos: 'adjective', ipa: '/kaɪnd/', image: '❤️', tags: ['description', 'character'], exampleEn: 'Her grandmother is kind.', exampleVi: 'Bà của cô ấy rất tốt bụng.' },
  { en: 'brave', vi: 'dũng cảm', pos: 'adjective', ipa: '/breɪv/', image: '🦁', tags: ['description', 'character'], exampleEn: 'The little boy is brave.', exampleVi: 'Cậu bé rất dũng cảm.' },
  { en: 'busy', vi: 'bận rộn', pos: 'adjective', ipa: '/ˈbɪz.i/', image: '🐝', tags: ['description'], exampleEn: 'My parents are busy.', exampleVi: 'Bố mẹ tôi đang bận.' },
  { en: 'happy', vi: 'vui vẻ', pos: 'adjective', ipa: '/ˈhæp.i/', image: '😊', tags: ['emotion'], exampleEn: 'We are happy.', exampleVi: 'Chúng tôi vui vẻ.' },
  { en: 'sad', vi: 'buồn bã', pos: 'adjective', ipa: '/sæd/', image: '😢', tags: ['emotion'], exampleEn: 'The cat is sad.', exampleVi: 'Chú mèo buồn bã.' },
  { en: 'tired', vi: 'mệt mỏi', pos: 'adjective', ipa: '/ˈtaɪ.ərd/', image: '🥱', tags: ['emotion'], exampleEn: 'His father is tired.', exampleVi: 'Bố cậu ấy bị mệt.' },
  { en: 'hungry', vi: 'đói bụng', pos: 'adjective', ipa: '/ˈhʌŋ.ɡri/', image: '🥪', tags: ['emotion'], exampleEn: 'The baby is hungry.', exampleVi: 'Em bé đang đói bụng.' },
  { en: 'thirsty', vi: 'khát nước', pos: 'adjective', ipa: '/ˈθɜːr.sti/', image: '💧', tags: ['emotion'], exampleEn: 'I am thirsty.', exampleVi: 'Tôi khát nước.' },
  { en: 'funny', vi: 'vui nhộn, hài hước', pos: 'adjective', ipa: '/ˈfʌn.i/', image: '🤡', tags: ['description'], exampleEn: 'That clown is funny.', exampleVi: 'Chú hề kia vui nhộn.' },
  { en: 'strong', vi: 'khoẻ mạnh', pos: 'adjective', ipa: '/strɔːŋ/', image: '💪', tags: ['description'], exampleEn: 'My uncle is strong.', exampleVi: 'Chú của tôi rất khỏe mạnh.' },
  { en: 'neat', vi: 'gọn gàng', pos: 'adjective', ipa: '/niːt/', image: '📦', tags: ['description'], exampleEn: 'Her room is neat.', exampleVi: 'Căn phòng của cô ấy rất gọn gàng.' },
  { en: 'messy', vi: 'bừa bộn', pos: 'adjective', ipa: '/ˈmes.i/', image: '🌪️', tags: ['description'], exampleEn: 'His desk is messy.', exampleVi: 'Bàn học của cậu ấy bừa bộn.' },
  { en: 'bright', vi: 'sáng sủa, rực rỡ', pos: 'adjective', ipa: '/braɪt/', image: '🌟', tags: ['description'], exampleEn: 'The sun is bright.', exampleVi: 'Mặt trời rực sáng.' },
  { en: 'dark', vi: 'tối tăm', pos: 'adjective', ipa: '/dɑːrk/', image: '🌑', tags: ['description'], exampleEn: 'The night is dark.', exampleVi: 'Màn đêm tối tăm.' },
  { en: 'round', vi: 'tròn', pos: 'adjective', ipa: '/raʊnd/', image: '⚪', tags: ['description', 'shape'], exampleEn: 'The ball is round.', exampleVi: 'Quả bóng thì tròn.' },
  { en: 'square', vi: 'vuông vức', pos: 'adjective', ipa: '/skwer/', image: '⬛', tags: ['description', 'shape'], exampleEn: 'The box is square.', exampleVi: 'Chiếc hộp vuông vức.' },

  // Màu sắc (12)
  { en: 'red', vi: 'màu đỏ', pos: 'adjective', ipa: '/red/', image: '🔴', tags: ['color'], exampleEn: 'My bag is red.', exampleVi: 'Cặp của tôi màu đỏ.' },
  { en: 'blue', vi: 'màu xanh da trời', pos: 'adjective', ipa: '/bluː/', image: '🔵', tags: ['color'], exampleEn: 'The sky is blue.', exampleVi: 'Bầu trời màu xanh.' },
  { en: 'green', vi: 'màu xanh lá cây', pos: 'adjective', ipa: '/ɡriːn/', image: '🟢', tags: ['color'], exampleEn: 'The grass is green.', exampleVi: 'Bãi cỏ màu xanh lá cây.' },
  { en: 'yellow', vi: 'màu vàng', pos: 'adjective', ipa: '/ˈjel.oʊ/', image: '🟡', tags: ['color'], exampleEn: 'The sun is yellow.', exampleVi: 'Mặt trời màu vàng.' },
  { en: 'pink', vi: 'màu hồng', pos: 'adjective', ipa: '/pɪŋk/', image: '🌸', tags: ['color'], exampleEn: 'Her dress is pink.', exampleVi: 'Chiếc váy của cô ấy màu hồng.' },
  { en: 'purple', vi: 'màu tím', pos: 'adjective', ipa: '/ˈpɜːr.pəl/', image: '🟣', tags: ['color'], exampleEn: 'These grapes are purple.', exampleVi: 'Những quả nho này màu tím.' },
  { en: 'orange', vi: 'màu cam', pos: 'adjective', ipa: '/ˈɔːr.ɪndʒ/', image: '🟠', tags: ['color'], exampleEn: 'His shirt is orange.', exampleVi: 'Áo của cậu ấy màu cam.' },
  { en: 'brown', vi: 'màu nâu', pos: 'adjective', ipa: '/braʊn/', image: '🟤', tags: ['color'], exampleEn: 'The bear is brown.', exampleVi: 'Con gấu màu nâu.' },
  { en: 'black', vi: 'màu đen', pos: 'adjective', ipa: '/blæk/', image: '⚫', tags: ['color'], exampleEn: 'His shoes are black.', exampleVi: 'Đôi giày của cậu ấy màu đen.' },
  { en: 'white', vi: 'màu trắng', pos: 'adjective', ipa: '/waɪt/', image: '⚪', tags: ['color'], exampleEn: 'Her teeth are white.', exampleVi: 'Hàm răng của cô ấy trắng tinh.' },
  { en: 'gray', vi: 'màu xám', pos: 'adjective', ipa: '/ɡreɪ/', image: '🐘', tags: ['color'], exampleEn: 'The elephant is gray.', exampleVi: 'Con voi màu xám.' },
  { en: 'colorful', vi: 'nhiều màu sắc', pos: 'adjective', ipa: '/ˈkʌl.ɚ.fəl/', image: '🎨', tags: ['color'], exampleEn: 'Her kite is colorful.', exampleVi: 'Chiếc diều của cô bé nhiều màu sắc.' },

  // Tính từ sở hữu & Từ để hỏi (8)
  { en: 'my', vi: 'của tôi', pos: 'determiner', ipa: '/maɪ/', image: '🙋', tags: ['possessive'], exampleEn: 'This is my cat.', exampleVi: 'Đây là con mèo của tôi.' },
  { en: 'your', vi: 'của bạn', pos: 'determiner', ipa: '/jʊr/', image: '👉', tags: ['possessive'], exampleEn: 'Is this your ruler?', exampleVi: 'Đây có phải thước kẻ của bạn không?' },
  { en: 'his', vi: 'của cậu ấy / anh ấy', pos: 'determiner', ipa: '/hɪz/', image: '👦', tags: ['possessive'], exampleEn: 'His brother is tall.', exampleVi: 'Anh trai của cậu ấy cao.' },
  { en: 'her', vi: 'của cô ấy / chị ấy', pos: 'determiner', ipa: '/hɜːr/', image: '👧', tags: ['possessive'], exampleEn: 'Her eyes are brown.', exampleVi: 'Mắt của cô ấy màu nâu.' },
  { en: 'its', vi: 'của nó', pos: 'determiner', ipa: '/ɪts/', image: '🐾', tags: ['possessive'], exampleEn: 'Its tail is long.', exampleVi: 'Đuôi của nó dài.' },
  { en: 'our', vi: 'của chúng tôi / chúng ta', pos: 'determiner', ipa: '/ˈaʊ.ər/', image: '👥', tags: ['possessive'], exampleEn: 'Our house is big.', exampleVi: 'Ngôi nhà của chúng tôi to lớn.' },
  { en: 'their', vi: 'của họ / của chúng nó', pos: 'determiner', ipa: '/ðer/', image: '👨‍👩‍👧‍👦', tags: ['possessive'], exampleEn: 'Their school is new.', exampleVi: 'Trường học của họ mới.' },
  { en: 'whose', vi: 'của ai', pos: 'determiner', ipa: '/huːz/', image: '❓', tags: ['question-word', 'possessive'], exampleEn: 'Whose bag is this?', exampleVi: 'Chiếc cặp này là của ai?' },

  // Gia đình & Con người (14)
  { en: 'father', vi: 'bố, cha', pos: 'noun', ipa: '/ˈfɑː.ðər/', forms: { plural: 'fathers' }, image: '👨', tags: ['family'], exampleEn: 'My father is a doctor.', exampleVi: 'Bố tôi là bác sĩ.' },
  { en: 'mother', vi: 'mẹ', pos: 'noun', ipa: '/ˈmʌð.ər/', forms: { plural: 'mothers' }, image: '👩', tags: ['family'], exampleEn: 'Her mother is kind.', exampleVi: 'Mẹ cô ấy rất tốt bụng.' },
  { en: 'brother', vi: 'anh/em trai', pos: 'noun', ipa: '/ˈbrʌð.ər/', forms: { plural: 'brothers' }, image: '👦', tags: ['family'], exampleEn: 'His brother is nine.', exampleVi: 'Anh trai cậu ấy chín tuổi.' },
  { en: 'sister', vi: 'chị/em gái', pos: 'noun', ipa: '/ˈsɪs.tər/', forms: { plural: 'sisters' }, image: '👧', tags: ['family'], exampleEn: 'This is my sister.', exampleVi: 'Đây là em gái của tôi.' },
  { en: 'grandfather', vi: 'ông', pos: 'noun', ipa: '/ˈɡræn.fɑː.ðər/', forms: { plural: 'grandfathers' }, image: '👴', tags: ['family'], exampleEn: 'My grandfather is old.', exampleVi: 'Ông tôi đã già.' },
  { en: 'grandmother', vi: 'bà', pos: 'noun', ipa: '/ˈɡræn.mʌð.ər/', forms: { plural: 'grandmothers' }, image: '👵', tags: ['family'], exampleEn: 'Her grandmother is happy.', exampleVi: 'Bà của cô ấy rất vui.' },
  { en: 'uncle', vi: 'chú, bác, cậu', pos: 'noun', ipa: '/ˈʌŋ.kəl/', forms: { plural: 'uncles' }, image: '🧔', tags: ['family'], exampleEn: 'His uncle is tall.', exampleVi: 'Chú của cậu ấy cao.' },
  { en: 'aunt', vi: 'cô, dì, bác gái', pos: 'noun', ipa: '/ænt/', forms: { plural: 'aunts' }, image: '👩‍🦰', tags: ['family'], exampleEn: 'Her aunt is pretty.', exampleVi: 'Dì của cô ấy rất xinh.' },
  { en: 'cousin', vi: 'anh chị em họ', pos: 'noun', ipa: '/ˈkʌz.ən/', forms: { plural: 'cousins' }, image: '🧒', tags: ['family'], exampleEn: 'My cousin is funny.', exampleVi: 'Anh họ của tôi vui tính.' },
  { en: 'baby', vi: 'em bé', pos: 'noun', ipa: '/ˈbeɪ.bi/', forms: { plural: 'babies' }, image: '👶', tags: ['family', 'people'], exampleEn: 'The baby is cute.', exampleVi: 'Em bé dễ thương.' },
  {"en":"parent","vi":"cha hoặc mẹ; phụ huynh","pos":"noun","ipa":"/ˈper.ənt/","forms":{"plural":"parents"},"image":"👨‍👩‍👧","tags":["family"],"exampleEn":"A parent is at the school gate.","exampleVi":"Một phụ huynh đang ở cổng trường."},
  { en: 'friend', vi: 'bạn bè', pos: 'noun', ipa: '/frend/', forms: { plural: 'friends' }, image: '👫', tags: ['people'], exampleEn: 'Nam is my best friend.', exampleVi: 'Nam là bạn thân nhất của tôi.' },
  { en: 'pet', vi: 'thú cưng', pos: 'noun', ipa: '/pet/', forms: { plural: 'pets' }, image: '🐶', tags: ['animal'], exampleEn: 'Her pet is a small cat.', exampleVi: 'Thú cưng của cô ấy là một chú mèo nhỏ.' },
  { en: 'puppy', vi: 'chó con', pos: 'noun', ipa: '/ˈpʌp.i/', forms: { plural: 'puppies' }, image: '🐕', tags: ['animal'], exampleEn: 'This puppy is cute.', exampleVi: 'Chú cún này dễ thương.' },

  // Bộ phận cơ thể (10)
  { en: 'eye', vi: 'mắt', pos: 'noun', ipa: '/aɪ/', forms: { plural: 'eyes' }, image: '👁️', tags: ['body'], exampleEn: 'Her eyes are blue.', exampleVi: 'Đôi mắt của cô ấy màu xanh.' },
  { en: 'ear', vi: 'tai', pos: 'noun', ipa: '/ɪr/', forms: { plural: 'ears' }, image: '👂', tags: ['body'], exampleEn: 'Its ears are long.', exampleVi: 'Đôi tai của nó dài.' },
  { en: 'nose', vi: 'mũi', pos: 'noun', ipa: '/noʊz/', forms: { plural: 'noses' }, image: '👃', tags: ['body'], exampleEn: 'His nose is small.', exampleVi: 'Mũi của cậu ấy nhỏ.' },
  { en: 'mouth', vi: 'miệng', pos: 'noun', ipa: '/maʊθ/', forms: { plural: 'mouths' }, image: '👄', tags: ['body'], exampleEn: 'Her mouth is red.', exampleVi: 'Khuôn miệng cô ấy đỏ thắm.' },
  { en: 'face', vi: 'khuôn mặt', pos: 'noun', ipa: '/feɪs/', forms: { plural: 'faces' }, image: '🙂', tags: ['body'], exampleEn: 'Her face is round.', exampleVi: 'Khuôn mặt cô bé tròn trịa.' },
  { en: 'hand', vi: 'bàn tay', pos: 'noun', ipa: '/hænd/', forms: { plural: 'hands' }, image: '✋', tags: ['body'], exampleEn: 'His hands are clean.', exampleVi: 'Đôi bàn tay cậu ấy sạch sẽ.' },
  { en: 'foot', vi: 'bàn chân', pos: 'noun', ipa: '/fʊt/', forms: { plural: 'feet' }, image: '🦶', tags: ['body'], exampleEn: 'My feet are cold.', exampleVi: 'Bàn chân tôi bị lạnh.' },
  { en: 'hair', vi: 'mái tóc', pos: 'noun', ipa: '/her/', image: '💇', tags: ['body'], exampleEn: 'Her hair is long and black.', exampleVi: 'Mái tóc cô ấy dài và đen.' },
  { en: 'leg', vi: 'cẳng chân', pos: 'noun', ipa: '/leɡ/', forms: { plural: 'legs' }, image: '🦵', tags: ['body'], exampleEn: 'Its legs are short.', exampleVi: 'Những chiếc chân của nó ngắn.' },
  { en: 'tail', vi: 'cái đuôi', pos: 'noun', ipa: '/teɪl/', forms: { plural: 'tails' }, image: '🐒', tags: ['body', 'animal'], exampleEn: "The cat's tail is long.", exampleVi: 'Đuôi của con mèo dài.' },

  // Đồ dùng cá nhân & Đồ chơi (16)
  { en: 'bag', vi: 'cặp, túi xách', pos: 'noun', ipa: '/bæɡ/', forms: { plural: 'bags' }, image: '🎒', tags: ['school', 'object'], exampleEn: 'This is my bag.', exampleVi: 'Đây là chiếc cặp của tôi.' },
  { en: 'bike', vi: 'xe đạp', pos: 'noun', ipa: '/baɪk/', forms: { plural: 'bikes' }, image: '🚲', tags: ['toy', 'transport'], exampleEn: 'Nam\'s bike is blue.', exampleVi: 'Xe đạp của Nam màu xanh.' },
  { en: 'car', vi: 'xe ô tô', pos: 'noun', ipa: '/kɑːr/', forms: { plural: 'cars' }, image: '🚗', tags: ['transport'], exampleEn: 'My father\'s car is white.', exampleVi: 'Xe ô tô của bố tôi màu trắng.' },
  { en: 'doll', vi: 'búp bê', pos: 'noun', ipa: '/dɑːl/', forms: { plural: 'dolls' }, image: '🪆', tags: ['toy'], exampleEn: 'Her doll is pretty.', exampleVi: 'Con búp bê của cô bé rất xinh.' },
  { en: 'ball', vi: 'quả bóng', pos: 'noun', ipa: '/bɔːl/', forms: { plural: 'balls' }, image: '⚽', tags: ['toy'], exampleEn: 'Whose ball is this?', exampleVi: 'Quả bóng này của ai?' },
  { en: 'kite', vi: 'con diều', pos: 'noun', ipa: '/kaɪt/', forms: { plural: 'kites' }, image: '🪁', tags: ['toy'], exampleEn: 'Our kite is colorful.', exampleVi: 'Con diều của chúng tôi nhiều màu sắc.' },
  { en: 'robot', vi: 'người máy', pos: 'noun', ipa: '/ˈroʊ.bɑːt/', forms: { plural: 'robots' }, image: '🤖', tags: ['toy'], exampleEn: 'His robot is smart.', exampleVi: 'Người máy của cậu ấy thông minh.' },
  { en: 'hat', vi: 'cái mũ, nón', pos: 'noun', ipa: '/hæt/', forms: { plural: 'hats' }, image: '👒', tags: ['clothes'], exampleEn: 'Her hat is yellow.', exampleVi: 'Chiếc mũ của cô ấy màu vàng.' },
  { en: 'cap', vi: 'mũ lưỡi trai', pos: 'noun', ipa: '/kæp/', forms: { plural: 'caps' }, image: '🧢', tags: ['clothes'], exampleEn: 'My cap is red.', exampleVi: 'Mũ lưỡi trai của tôi màu đỏ.' },
  { en: 'shirt', vi: 'áo sơ mi', pos: 'noun', ipa: '/ʃɜːrt/', forms: { plural: 'shirts' }, image: '👔', tags: ['clothes'], exampleEn: 'His shirt is white.', exampleVi: 'Áo sơ mi của cậu ấy màu trắng.' },
  { en: 'dress', vi: 'chiếc váy liền', pos: 'noun', ipa: '/dres/', forms: { plural: 'dresses' }, image: '👗', tags: ['clothes'], exampleEn: 'This dress is pretty.', exampleVi: 'Chiếc váy này rất xinh.' },
  {"en":"shoe","vi":"chiếc giày","pos":"noun","ipa":"/ʃuː/","forms":{"plural":"shoes"},"image":"👟","tags":["clothes"],"exampleEn":"This shoe is new.","exampleVi":"Chiếc giày này còn mới."},
  { en: 'watch', vi: 'đồng hồ đeo tay', pos: 'noun', ipa: '/wɑːtʃ/', forms: { plural: 'watches' }, image: '⌚', tags: ['object'], exampleEn: 'My watch is new.', exampleVi: 'Đồng hồ của tôi mới tinh.' },
  { en: 'umbrella', vi: 'chiếc ô, chiếc dù', pos: 'noun', ipa: '/ʌmˈbrel.ə/', forms: { plural: 'umbrellas' }, image: '☂️', tags: ['object'], exampleEn: 'Her umbrella is pink.', exampleVi: 'Chiếc ô của cô ấy màu hồng.' },
  { en: 'pencil', vi: 'bút chì', pos: 'noun', ipa: '/ˈpen.səl/', forms: { plural: 'pencils' }, image: '✏️', tags: ['school'], exampleEn: 'This is my short pencil.', exampleVi: 'Đây là chiếc bút chì ngắn của tôi.' },
  { en: 'ruler', vi: 'thước kẻ', pos: 'noun', ipa: '/ˈruː.lər/', forms: { plural: 'rulers' }, image: '📏', tags: ['school'], exampleEn: 'Your ruler is long.', exampleVi: 'Thước kẻ của bạn dài.' }
];

const finalVocab = vocabList.map((item, idx) => ({
  id: `A3-v-${String(idx + 1).padStart(4, '0')}`,
  level: 'A3',
  topic: 'adjectives-possessives',
  ...item,
  source: 'seed'
}));

fs.writeFileSync(path.join(DATA_DIR, 'A3.vocab.json'), JSON.stringify(applyContentReviewV4('A3.vocab.json', finalVocab), null, 2), 'utf-8');
console.log(`✅ Generated A3.vocab.json with ${finalVocab.length} words (target ≥ 100).`);

// -------------------------------------------------------------
// SENTENCE BUILDER & 200 SENTENCES
// -------------------------------------------------------------
const sentences = [];
let sIdx = 1;

function addSentence(grammarPoint, en, vi, difficulty, tags, tokens, roleSpans, exerciseTypes, blankDef, orderAlternatives) {
  const reconstructed = reconstructEn(tokens);
  if (reconstructed !== en) {
    throw new Error(`Reconstruction mismatch:\nen: "${en}"\nreconstructed: "${reconstructed}"`);
  }

  const id = `A3-s-${String(sIdx++).padStart(4, '0')}`;
  const blank = {
    tokenIndex: blankDef.idx,
    answer: blankDef.ans,
    hint: blankDef.hint,
    promptVi: blankDef.promptVi
  };
  if (blankDef.alt) blank.alt = blankDef.alt;

  const item = {
    id,
    level: 'A3',
    topic: 'adjectives-possessives',
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

  sentences.push(applyAdjectivePrompts(item));
}

// =========================================================================
// GROUP 1: adj-predicate (40 sentences: 0001 - 0040)
// S + be + Adjective (Tính từ làm vị ngữ / bổ ngữ đứng sau to be)
// =========================================================================

addSentence('adj-predicate', 'The cat is cute.', 'Con mèo thì dễ thương.', 1, ['adjective', 'animal'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('is','verb','verb','be','present-3sg'), tok('cute','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'cute', promptVi:'Điền tính từ miêu tả con mèo.', hint:'tính từ: dễ thương'});

addSentence('adj-predicate', 'My brother is tall.', 'Anh trai tôi thì cao.', 1, ['adjective', 'family'],
  [tok('My','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('is','verb','verb','be','present-3sg'), tok('tall','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'tall', promptVi:'Điền tính từ miêu tả chiều cao.', hint:'tính từ: cao'});

addSentence('adj-predicate', 'This ball is round.', 'Quả bóng này thì tròn.', 1, ['adjective', 'toy'],
  [tok('This','determiner','det'), tok('ball','noun','subject','ball','sg'), tok('is','verb','verb','be','present-3sg'), tok('round','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'round', promptVi:'Điền tính từ chỉ hình dáng.', hint:'tính từ: tròn'});

addSentence('adj-predicate', 'Her dress is pink.', 'Chiếc váy của cô ấy màu hồng.', 1, ['adjective', 'color', 'clothes'],
  [tok('Her','determiner','det'), tok('dress','noun','subject','dress','sg'), tok('is','verb','verb','be','present-3sg'), tok('pink','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'pink', promptVi:'Điền tính từ chỉ màu sắc.', hint:'tính từ: màu hồng'});

addSentence('adj-predicate', 'The turtle is slow.', 'Con rùa thì chậm chạp.', 1, ['adjective', 'animal'],
  [tok('The','article','det'), tok('turtle','noun','subject','turtle','sg'), tok('is','verb','verb','be','present-3sg'), tok('slow','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'slow', promptVi:'Điền tính từ chỉ tốc độ.', hint:'tính từ: chậm'});

addSentence('adj-predicate', 'The sun is hot.', 'Mặt trời thì nóng bức.', 1, ['adjective', 'nature'],
  [tok('The','article','det'), tok('sun','noun','subject','sun','sg'), tok('is','verb','verb','be','present-3sg'), tok('hot','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'hot', promptVi:'Điền tính từ chỉ nhiệt độ.', hint:'tính từ: nóng'});

addSentence('adj-predicate', 'That dog is big.', 'Con chó kia thì to lớn.', 1, ['adjective', 'animal'],
  [tok('That','determiner','det'), tok('dog','noun','subject','dog','sg'), tok('is','verb','verb','be','present-3sg'), tok('big','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'big', promptVi:'Điền tính từ chỉ kích thước.', hint:'tính từ: to lớn'});

addSentence('adj-predicate', 'My hands are clean.', 'Đôi bàn tay tôi sạch sẽ.', 1, ['adjective', 'body'],
  [tok('My','determiner','det'), tok('hands','noun','subject','hand','pl'), tok('are','verb','verb','be','present-other'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'clean', promptVi:'Điền tính từ sạch sẽ.', hint:'tính từ: sạch sẽ'});

addSentence('adj-predicate', 'These apples are sweet.', 'Những quả táo này ngọt ngào.', 1, ['adjective', 'food'],
  [tok('These','determiner','det'), tok('apples','noun','subject','apple','pl'), tok('are','verb','verb','be','present-other'), tok('sweet','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'sweet', promptVi:'Điền tính từ chỉ vị ngọt.', hint:'tính từ: ngọt'});

addSentence('adj-predicate', 'His shoes are new.', 'Đôi giày của cậu ấy còn mới.', 1, ['adjective', 'clothes'],
  [tok('His','determiner','det'), tok('shoes','noun','subject','shoe','pl'), tok('are','verb','verb','be','present-other'), tok('new','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'new', promptVi:'Điền tính từ mới.', hint:'tính từ: mới'});

addSentence('adj-predicate', 'The mouse is small.', 'Con chuột thì nhỏ bé.', 1, ['adjective', 'animal'],
  [tok('The','article','det'), tok('mouse','noun','subject','mouse','sg'), tok('is','verb','verb','be','present-3sg'), tok('small','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'small', promptVi:'Điền tính từ nhỏ bé.', hint:'tính từ: nhỏ bé'});

addSentence('adj-predicate', 'The ice is cold.', 'Cục đá thì lạnh giá.', 1, ['adjective', 'nature'],
  [tok('The','article','det'), tok('ice','noun','subject','ice','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('cold','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'cold', promptVi:'Điền tính từ lạnh.', hint:'tính từ: lạnh'});

addSentence('adj-predicate', 'Her doll is pretty.', 'Búp bê của cô bé rất xinh xắn.', 1, ['adjective', 'toy'],
  [tok('Her','determiner','det'), tok('doll','noun','subject','doll','sg'), tok('is','verb','verb','be','present-3sg'), tok('pretty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'pretty', promptVi:'Điền tính từ xinh xắn.', hint:'tính từ: xinh'});

addSentence('adj-predicate', 'The snake is long.', 'Con rắn thì dài.', 1, ['adjective', 'animal'],
  [tok('The','article','det'), tok('snake','noun','subject','snake','sg'), tok('is','verb','verb','be','present-3sg'), tok('long','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'long', promptVi:'Điền tính từ dài.', hint:'tính từ: dài'});

addSentence('adj-predicate', 'Our classroom is neat.', 'Lớp học của chúng tôi gọn gàng.', 1, ['adjective', 'school'],
  [tok('Our','determiner','det'), tok('classroom','noun','subject','classroom','sg'), tok('is','verb','verb','be','present-3sg'), tok('neat','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'neat', promptVi:'Điền tính từ gọn gàng.', hint:'tính từ: gọn gàng'});

addSentence('adj-predicate', 'The baby is happy.', 'Em bé thì vui vẻ.', 1, ['adjective', 'emotion'],
  [tok('The','article','det'), tok('baby','noun','subject','baby','sg'), tok('is','verb','verb','be','present-3sg'), tok('happy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'happy', promptVi:'Điền tính từ vui vẻ.', hint:'tính từ: vui vẻ'});

addSentence('adj-predicate', 'His shirt is white.', 'Áo sơ mi của cậu ấy màu trắng.', 1, ['adjective', 'color', 'clothes'],
  [tok('His','determiner','det'), tok('shirt','noun','subject','shirt','sg'), tok('is','verb','verb','be','present-3sg'), tok('white','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'white', promptVi:'Điền tính từ màu trắng.', hint:'tính từ: màu trắng'});

addSentence('adj-predicate', 'Those grapes are purple.', 'Những quả nho kia màu tím.', 1, ['adjective', 'color', 'food'],
  [tok('Those','determiner','det'), tok('grapes','noun','subject','grape','pl'), tok('are','verb','verb','be','present-other'), tok('purple','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'purple', promptVi:'Điền tính từ màu tím.', hint:'tính từ: màu tím'});

addSentence('adj-predicate', 'That elephant is gray.', 'Con voi kia màu xám.', 1, ['adjective', 'color', 'animal'],
  [tok('That','determiner','det'), tok('elephant','noun','subject','elephant','sg'), tok('is','verb','verb','be','present-3sg'), tok('gray','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'gray', promptVi:'Điền tính từ màu xám.', hint:'tính từ: màu xám'});

addSentence('adj-predicate', 'Her teeth are white.', 'Hàm răng của cô ấy trắng tinh.', 1, ['adjective', 'body'],
  [tok('Her','determiner','det'), tok('teeth','noun','subject','tooth','pl'), tok('are','verb','verb','be','present-other'), tok('white','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'white', promptVi:'Điền tính từ màu trắng.', hint:'tính từ: màu trắng'});

addSentence('adj-predicate', 'The little bird isn\'t sad.', 'Chú chim nhỏ không buồn bã.', 2, ['adjective', 'emotion', 'negative'],
  [tok('The','article','det'), tok('little','adjective','modifier'), tok('bird','noun','subject','bird','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('sad','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'sad', promptVi:'Điền tính từ chỉ cảm xúc buồn.', hint:'tính từ: buồn'});

addSentence('adj-predicate', 'This room isn\'t messy.', 'Căn phòng này không bừa bộn.', 2, ['adjective', 'negative'],
  [tok('This','determiner','det'), tok('room','noun','subject','room','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('messy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'messy', promptVi:'Điền tính từ bừa bộn.', hint:'tính từ: bừa bộn'});

addSentence('adj-predicate', 'Is your puppy cute?', 'Chú cún của bạn có dễ thương không?', 2, ['adjective', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('puppy','noun','subject','puppy','sg'), tok('cute','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'cute', promptVi:'Điền tính từ dễ thương trong câu hỏi.', hint:'tính từ: dễ thương'});

addSentence('adj-predicate', 'His bag isn\'t heavy.', 'Chiếc cặp của cậu ấy không nặng.', 2, ['adjective', 'negative'],
  [tok('His','determiner','det'), tok('bag','noun','subject','bag','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('heavy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'heavy', promptVi:'Điền tính từ nặng.', hint:'tính từ: nặng'});

addSentence('adj-predicate', 'Are those apples sweet?', 'Những quả táo kia có ngọt không?', 2, ['adjective', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('those','determiner','det'), tok('apples','noun','subject','apple','pl'), tok('sweet','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'sweet', promptVi:'Điền tính từ ngọt.', hint:'tính từ: ngọt'});

addSentence('adj-predicate', 'The stone is very hard.', 'Hòn đá thì rất cứng.', 2, ['adjective', 'nature'],
  [tok('The','article','det'), tok('stone','noun','subject','stone','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('hard','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'hard', promptVi:'Điền tính từ cứng.', hint:'tính từ: cứng'});

addSentence('adj-predicate', 'Her pillow is very soft.', 'Chiếc gối của cô ấy rất mềm mại.', 2, ['adjective'],
  [tok('Her','determiner','det'), tok('pillow','noun','subject','pillow','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('soft','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'soft', promptVi:'Điền tính từ mềm mại.', hint:'tính từ: mềm'});

addSentence('adj-predicate', 'Nam\'s robot is very smart.', 'Người máy của Nam rất thông minh.', 2, ['adjective', 'toy'],
  [tok('Nam\'s','noun','det','Nam','sg'), tok('robot','noun','subject','robot','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('smart','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'smart', promptVi:'Điền tính từ thông minh.', hint:'tính từ: thông minh'});

addSentence('adj-predicate', 'The street isn\'t quiet today.', 'Đường phố hôm nay không yên tĩnh.', 2, ['adjective', 'negative'],
  [tok('The','article','det'), tok('street','noun','subject','street','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('quiet','adjective','complement'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'quiet', promptVi:'Điền tính từ yên tĩnh.', hint:'tính từ: yên tĩnh'},
  ['Today the street isn\'t quiet.']);

addSentence('adj-predicate', 'Is that lion brave?', 'Chú sư tử kia có dũng cảm không?', 2, ['adjective', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('lion','noun','subject','lion','sg'), tok('brave','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'brave', promptVi:'Điền tính từ dũng cảm.', hint:'tính từ: dũng cảm'});

addSentence('adj-predicate', 'Our neighbors are very friendly.', 'Những người hàng xóm của chúng tôi rất thân thiện.', 2, ['adjective', 'people'],
  [tok('Our','determiner','det'), tok('neighbors','noun','subject','neighbor','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('friendly','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'friendly', promptVi:'Điền tính từ thân thiện.', hint:'tính từ: thân thiện'});

addSentence('adj-predicate', 'The yellow duck isn\'t hungry.', 'Chú vịt vàng không đói bụng.', 2, ['adjective', 'negative'],
  [tok('The','article','det'), tok('yellow','adjective','modifier'), tok('duck','noun','subject','duck','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('hungry','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'hungry', promptVi:'Điền tính từ đói bụng.', hint:'tính từ: đói bụng'});

addSentence('adj-predicate', 'Are your new shoes clean?', 'Đôi giày mới của bạn có sạch sẽ không?', 2, ['adjective', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('your','determiner','det'), tok('new','adjective','modifier'), tok('shoes','noun','subject','shoe','pl'), tok('clean','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'clean', promptVi:'Điền tính từ sạch sẽ.', hint:'tính từ: sạch sẽ'});

addSentence('adj-predicate', 'His desk isn\'t dirty.', 'Bàn học của cậu ấy không bị bẩn.', 2, ['adjective', 'negative'],
  [tok('His','determiner','det'), tok('desk','noun','subject','desk','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('dirty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'dirty', promptVi:'Điền tính từ bẩn.', hint:'tính từ: bẩn'});

addSentence('adj-predicate', 'In the morning the air is cool.', 'Vào buổi sáng không khí rất mát mẻ.', 3, ['adjective', 'weather'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), tok('the','article','det'), tok('air','noun','subject','air','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('cool','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:6, ans:'cool', promptVi:'Điền tính từ mát mẻ.', hint:'tính từ: mát mẻ'},
  ['The air is cool in the morning.']);

addSentence('adj-predicate', 'Today the library is very quiet.', 'Hôm nay thư viện rất yên tĩnh.', 3, ['adjective'],
  [tok('Today','adverb','adverbial'), tok('the','article','det'), tok('library','noun','subject','library','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('quiet','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:5, ans:'quiet', promptVi:'Điền tính từ yên tĩnh.', hint:'tính từ: yên tĩnh'},
  ['The library is very quiet today.']);

addSentence('adj-predicate', 'In the winter the weather is cold.', 'Vào mùa đông thời tiết thì lạnh giá.', 3, ['adjective', 'weather'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('winter','noun','prep-object','winter','sg'), tok('the','article','det'), tok('weather','noun','subject','weather','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('cold','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:6, ans:'cold', promptVi:'Điền tính từ lạnh.', hint:'tính từ: lạnh'},
  ['The weather is cold in the winter.']);

addSentence('adj-predicate', 'Those three young girls are very kind.', 'Ba cô bé trẻ tuổi kia rất tốt bụng.', 3, ['adjective', 'people'],
  [tok('Those','determiner','det'), tok('three','numeral','det'), tok('young','adjective','modifier'), tok('girls','noun','subject','girl','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:6, ans:'kind', promptVi:'Điền tính từ tốt bụng.', hint:'tính từ: tốt bụng'});

addSentence('adj-predicate', 'Today my parents aren\'t busy.', 'Hôm nay bố mẹ tôi không bận rộn.', 3, ['adjective', 'negative'],
  [tok('Today','adverb','adverbial'), tok('my','determiner','det'), tok('parents','noun','subject','parents','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('busy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'busy', promptVi:'Điền tính từ bận rộn.', hint:'tính từ: bận rộn'},
  ['My parents aren\'t busy today.']);

addSentence('adj-predicate', 'In the summer the days are long.', 'Vào mùa hè ngày thì dài.', 3, ['adjective', 'nature'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('summer','noun','prep-object','summer','sg'), tok('the','article','det'), tok('days','noun','subject','day','pl'), tok('are','verb','verb','be','present-other'), tok('long','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:6, ans:'long', promptVi:'Điền tính từ dài.', hint:'tính từ: dài'},
  ['The days are long in the summer.']);

console.log(`Group 1 done: ${sentences.length} sentences.`);

// =========================================================================
// GROUP 2: adj-attributive (40 sentences: 0041 - 0080)
// Tính từ đứng trước danh từ làm định ngữ (modifier)
// =========================================================================

addSentence('adj-attributive', 'This is a big elephant.', 'Đây là một con voi to lớn.', 1, ['adjective', 'animal'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('big','adjective','modifier'), tok('elephant','noun','complement','elephant','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'big', promptVi:'Điền tính từ to lớn trước danh từ.', hint:'tính từ: to lớn'});

addSentence('adj-attributive', 'That is a small mouse.', 'Kia là một con chuột nhỏ bé.', 1, ['adjective', 'animal'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('small','adjective','modifier'), tok('mouse','noun','complement','mouse','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'small', promptVi:'Điền tính từ nhỏ bé trước danh từ.', hint:'tính từ: nhỏ bé'});

addSentence('adj-attributive', 'It is a long snake.', 'Nó là một con rắn dài.', 1, ['adjective', 'animal'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('long','adjective','modifier'), tok('snake','noun','complement','snake','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'long', promptVi:'Điền tính từ dài trước danh từ.', hint:'tính từ: dài'});

addSentence('adj-attributive', 'She is a pretty girl.', 'Cô ấy là một bé gái xinh xắn.', 1, ['adjective', 'people'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('pretty','adjective','modifier'), tok('girl','noun','complement','girl','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'pretty', promptVi:'Điền tính từ xinh xắn trước danh từ.', hint:'tính từ: xinh xắn'});

addSentence('adj-attributive', 'He is a tall boy.', 'Cậu ấy là một cậu bé cao lớn.', 1, ['adjective', 'people'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('tall','adjective','modifier'), tok('boy','noun','complement','boy','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'tall', promptVi:'Điền tính từ cao trước danh từ.', hint:'tính từ: cao'});

addSentence('adj-attributive', 'This is a new bike.', 'Đây là một chiếc xe đạp mới.', 1, ['adjective', 'transport'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('new','adjective','modifier'), tok('bike','noun','complement','bike','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'new', promptVi:'Điền tính từ mới trước danh từ.', hint:'tính từ: mới'});

addSentence('adj-attributive', 'That is an old car.', 'Kia là một chiếc xe ô tô cũ.', 1, ['adjective', 'transport'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('old','adjective','modifier'), tok('car','noun','complement','car','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'old', promptVi:'Điền tính từ cũ trước car.', hint:'tính từ: cũ'});

addSentence('adj-attributive', 'It is a cute puppy.', 'Nó là một chú cún con dễ thương.', 1, ['adjective', 'animal'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('cute','adjective','modifier'), tok('puppy','noun','complement','puppy','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'cute', promptVi:'Điền tính từ dễ thương trước puppy.', hint:'tính từ: dễ thương'});

addSentence('adj-attributive', 'These are sweet apples.', 'Đây là những quả táo ngọt.', 1, ['adjective', 'food'],
  [tok('These','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('sweet','adjective','modifier'), tok('apples','noun','complement','apple','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'sweet', promptVi:'Điền tính từ ngọt trước apples.', hint:'tính từ: ngọt'});

addSentence('adj-attributive', 'Those are red balls.', 'Kia là những quả bóng màu đỏ.', 1, ['adjective', 'toy', 'color'],
  [tok('Those','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('red','adjective','modifier'), tok('balls','noun','complement','ball','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'red', promptVi:'Điền tính từ màu đỏ trước balls.', hint:'tính từ: màu đỏ'});

addSentence('adj-attributive', 'This is a short ruler.', 'Đây là một chiếc thước kẻ ngắn.', 1, ['adjective', 'school'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('short','adjective','modifier'), tok('ruler','noun','complement','ruler','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'short', promptVi:'Điền tính từ ngắn trước ruler.', hint:'tính từ: ngắn'});

addSentence('adj-attributive', 'It is a clean room.', 'Nó là một căn phòng sạch sẽ.', 1, ['adjective'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('clean','adjective','modifier'), tok('room','noun','complement','room','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'clean', promptVi:'Điền tính từ sạch sẽ trước room.', hint:'tính từ: sạch sẽ'});

addSentence('adj-attributive', 'She is a kind teacher.', 'Cô ấy là một giáo viên tốt bụng.', 1, ['adjective', 'people'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('kind','adjective','modifier'), tok('teacher','noun','complement','teacher','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'kind', promptVi:'Điền tính từ tốt bụng trước teacher.', hint:'tính từ: tốt bụng'});

addSentence('adj-attributive', 'He is a funny clown.', 'Chú ấy là một chú hề vui nhộn.', 1, ['adjective', 'people'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('funny','adjective','modifier'), tok('clown','noun','complement','clown','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'funny', promptVi:'Điền tính từ vui nhộn trước clown.', hint:'tính từ: vui nhộn'});

addSentence('adj-attributive', 'This is a soft pillow.', 'Đây là một chiếc gối êm mềm.', 1, ['adjective'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('soft','adjective','modifier'), tok('pillow','noun','complement','pillow','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'soft', promptVi:'Điền tính từ mềm mại trước pillow.', hint:'tính từ: mềm'});

addSentence('adj-attributive', 'That is a fast train.', 'Kia là một đoàn tàu chạy nhanh.', 1, ['adjective', 'transport'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('fast','adjective','modifier'), tok('train','noun','complement','train','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'fast', promptVi:'Điền tính từ nhanh trước train.', hint:'tính từ: nhanh'});

addSentence('adj-attributive', 'These are round tables.', 'Đây là những chiếc bàn tròn.', 1, ['adjective'],
  [tok('These','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('round','adjective','modifier'), tok('tables','noun','complement','table','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'round', promptVi:'Điền tính từ tròn trước tables.', hint:'tính từ: tròn'});

addSentence('adj-attributive', 'Those are green trees.', 'Kia là những cái cây màu xanh lá.', 1, ['adjective', 'nature'],
  [tok('Those','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('green','adjective','modifier'), tok('trees','noun','complement','tree','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'green', promptVi:'Điền tính từ màu xanh lá.', hint:'tính từ: màu xanh lá'});

addSentence('adj-attributive', 'It is a heavy box.', 'Nó là một chiếc hộp nặng.', 1, ['adjective'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('heavy','adjective','modifier'), tok('box','noun','complement','box','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'heavy', promptVi:'Điền tính từ nặng trước box.', hint:'tính từ: nặng'});

addSentence('adj-attributive', 'She is a happy baby.', 'Bé là một em bé vui vẻ.', 1, ['adjective', 'emotion'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('happy','adjective','modifier'), tok('baby','noun','complement','baby','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'happy', promptVi:'Điền tính từ vui vẻ trước baby.', hint:'tính từ: vui vẻ'});

addSentence('adj-attributive', 'This isn\'t a dirty table.', 'Đây không phải là một chiếc bàn bẩn.', 2, ['adjective', 'negative'],
  [tok('This','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('dirty','adjective','modifier'), tok('table','noun','complement','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'dirty', promptVi:'Điền tính từ bẩn.', hint:'tính từ: bẩn'});

addSentence('adj-predicative', 'Is that soup hot?', 'Món súp kia có nóng không?', 2, ['adjective', 'question', 'food'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('soup','noun','subject','soup','uncountable'), tok('hot','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1,2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:3, ans:'hot', promptVi:'Điền tính từ nóng.', hint:'tính từ: nóng'});

addSentence('adj-attributive', 'These aren\'t sour oranges.', 'Đây không phải là những quả cam chua.', 2, ['adjective', 'negative', 'food'],
  [tok('These','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('sour','adjective','modifier'), tok('oranges','noun','complement','orange','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'sour', promptVi:'Điền tính từ chua.', hint:'tính từ: chua'});

addSentence('adj-attributive', 'Are those expensive toys?', 'Kia có phải là những món đồ chơi đắt tiền không?', 2, ['adjective', 'question', 'toy'],
  [tok('Are','verb','verb','be','present-other'), tok('those','pronoun','subject'), tok('expensive','adjective','modifier'), tok('toys','noun','complement','toy','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'expensive', promptVi:'Điền tính từ đắt tiền.', hint:'tính từ: đắt'});

addSentence('adj-attributive', 'He is a very smart student.', 'Cậu ấy là một học sinh rất thông minh.', 2, ['adjective', 'people'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('very','adverb','modifier'), tok('smart','adjective','modifier'), tok('student','noun','complement','student','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:4, ans:'smart', promptVi:'Điền tính từ thông minh.', hint:'tính từ: thông minh'});

addSentence('adj-attributive', 'This is a colorful kite.', 'Đây là một con diều nhiều màu sắc.', 2, ['adjective', 'toy'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('colorful','adjective','modifier'), tok('kite','noun','complement','kite','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'colorful', promptVi:'Điền tính từ nhiều màu sắc.', hint:'tính từ: nhiều màu sắc'});

addSentence('adj-attributive', 'That isn\'t a quiet street.', 'Kia không phải là một con phố yên tĩnh.', 2, ['adjective', 'negative'],
  [tok('That','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('quiet','adjective','modifier'), tok('street','noun','complement','street','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'quiet', promptVi:'Điền tính từ yên tĩnh.', hint:'tính từ: yên tĩnh'});

addSentence('adj-attributive', 'Is she a brave doctor?', 'Cô ấy có phải là một bác sĩ dũng cảm không?', 2, ['adjective', 'question', 'people'],
  [tok('Is','verb','verb','be','present-3sg'), tok('she','pronoun','subject'), tok('a','article','det'), tok('brave','adjective','modifier'), tok('doctor','noun','complement','doctor','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'brave', promptVi:'Điền tính từ dũng cảm.', hint:'tính từ: dũng cảm'});

addSentence('adj-attributive', 'These are four yellow bananas.', 'Đây là bốn quả chuối màu vàng.', 2, ['adjective', 'food', 'color'],
  [tok('These','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('four','numeral','det'), tok('yellow','adjective','modifier'), tok('bananas','noun','complement','banana','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'yellow', promptVi:'Điền tính từ màu vàng.', hint:'tính từ: màu vàng'});

addSentence('adj-attributive', 'Those are two fat pandas.', 'Kia là hai chú gấu trúc mập mạp.', 2, ['adjective', 'animal'],
  [tok('Those','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('two','numeral','det'), tok('fat','adjective','modifier'), tok('pandas','noun','complement','panda','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'fat', promptVi:'Điền tính từ béo mập.', hint:'tính từ: béo mập'});

addSentence('adj-attributive', 'It isn\'t a hard test.', 'Nó không phải là một bài kiểm tra khó.', 2, ['adjective', 'negative'],
  [tok('It','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('hard','adjective','modifier'), tok('test','noun','complement','test','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'hard', promptVi:'Điền tính từ khó.', hint:'tính từ: khó'});

addSentence('adj-attributive', 'Are they friendly neighbors?', 'Họ có phải là những người hàng xóm thân thiện không?', 2, ['adjective', 'question', 'people'],
  [tok('Are','verb','verb','be','present-other'), tok('they','pronoun','subject'), tok('friendly','adjective','modifier'), tok('neighbors','noun','complement','neighbor','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'friendly', promptVi:'Điền tính từ thân thiện.', hint:'tính từ: thân thiện'});

addSentence('adj-attributive', 'This is a bright star.', 'Đây là một ngôi sao rực sáng.', 2, ['adjective', 'nature'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('bright','adjective','modifier'), tok('star','noun','complement','star','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'bright', promptVi:'Điền tính từ sáng rực.', hint:'tính từ: sáng'});

addSentence('adj-attributive', 'That isn\'t a messy room.', 'Kia không phải là một căn phòng bừa bộn.', 2, ['adjective', 'negative'],
  [tok('That','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('messy','adjective','modifier'), tok('room','noun','complement','room','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'messy', promptVi:'Điền tính từ bừa bộn.', hint:'tính từ: bừa bộn'});

addSentence('adj-attributive', 'On the desk there is a long ruler.', 'Trên bàn học có một chiếc thước kẻ dài.', 3, ['adjective', 'school'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('desk','noun','prep-object','desk','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('long','adjective','modifier'), tok('ruler','noun','subject','ruler','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:6, ans:'long', promptVi:'Điền tính từ dài.', hint:'tính từ: dài'},
  ['There is a long ruler on the desk.']);

addSentence('adj-attributive', 'In the garden there are five red roses.', 'Trong vườn có năm bông hoa hồng màu đỏ.', 3, ['adjective', 'nature'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('garden','noun','prep-object','garden','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('five','numeral','det'), tok('red','adjective','modifier'), tok('roses','noun','subject','rose','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:6, ans:'red', promptVi:'Điền tính từ màu đỏ.', hint:'tính từ: màu đỏ'},
  ['There are five red roses in the garden.']);

addSentence('adj-attributive', 'These two little boys are smart students.', 'Hai cậu bé nhỏ tuổi này là học sinh thông minh.', 3, ['adjective', 'people'],
  [tok('These','determiner','det'), tok('two','numeral','det'), tok('little','adjective','modifier'), tok('boys','noun','subject','boy','pl'), tok('are','verb','verb','be','present-other'), tok('smart','adjective','modifier'), tok('students','noun','complement','student','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:5, ans:'smart', promptVi:'Điền tính từ thông minh.', hint:'tính từ: thông minh'});

addSentence('adj-attributive', 'Under the tree there is a brown dog.', 'Dưới gốc cây có một chú chó màu nâu.', 3, ['adjective', 'animal'],
  [tok('Under','preposition','prep'), tok('the','article','det'), tok('tree','noun','prep-object','tree','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('brown','adjective','modifier'), tok('dog','noun','subject','dog','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:6, ans:'brown', promptVi:'Điền tính từ màu nâu.', hint:'tính từ: màu nâu'},
  ['There is a brown dog under the tree.']);

addSentence('adj-attributive', 'Today this is a very busy street.', 'Hôm nay đây là một con phố rất bận rộn.', 3, ['adjective'],
  [tok('Today','adverb','adverbial'), tok('this','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('very','adverb','modifier'), tok('busy','adjective','modifier'), tok('street','noun','complement','street','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:5, ans:'busy', promptVi:'Điền tính từ bận rộn.', hint:'tính từ: bận rộn'},
  ['This is a very busy street today.']);

addSentence('adj-attributive', 'In the basket there are six fresh eggs.', 'Trong giỏ có sáu quả trứng tươi.', 3, ['adjective', 'food'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('basket','noun','prep-object','basket','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('six','numeral','det'), tok('fresh','adjective','modifier'), tok('eggs','noun','subject','egg','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:6, ans:'fresh', promptVi:'Điền tính từ tươi.', hint:'tính từ: tươi'},
  ['There are six fresh eggs in the basket.']);

console.log(`Group 2 done: ${sentences.length} sentences.`);

// =========================================================================
// GROUP 3: possessive-determiner (45 sentences: 0081 - 0125)
// Tính từ sở hữu: my, your, his, her, its, our, their
// =========================================================================

// my (6 sentences)
addSentence('possessive-determiner', 'This is my bag.', 'Đây là chiếc cặp của tôi.', 1, ['possessive'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('my','determiner','det'), tok('bag','noun','complement','bag','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'my', promptVi:'Điền tính từ sở hữu của I.', hint:'tính từ sở hữu: của tôi'});

addSentence('possessive-determiner', 'My father is a doctor.', 'Bố tôi là bác sĩ.', 1, ['possessive', 'family'],
  [tok('My','determiner','det'), tok('father','noun','subject','father','sg'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('doctor','noun','complement','doctor','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'My', promptVi:'Điền tính từ sở hữu của I đầu câu.', hint:'tính từ sở hữu: của tôi'});

addSentence('possessive-determiner', 'These are my new shoes.', 'Đây là đôi giày mới của tôi.', 1, ['possessive', 'clothes'],
  [tok('These','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('my','determiner','det'), tok('new','adjective','modifier'), tok('shoes','noun','complement','shoe','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'my', promptVi:'Điền tính từ sở hữu của I.', hint:'tính từ sở hữu: của tôi'});

addSentence('possessive-determiner', 'My hands aren\'t dirty.', 'Đôi bàn tay tôi không bị bẩn.', 2, ['possessive', 'negative'],
  [tok('My','determiner','det'), tok('hands','noun','subject','hand','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('dirty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'My', promptVi:'Điền tính từ sở hữu của I đầu câu.', hint:'tính từ sở hữu: của tôi'});

addSentence('possessive-determiner', 'Is that my blue pen?', 'Kia có phải là bút mực xanh của tôi không?', 2, ['possessive', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), tok('my','determiner','det'), tok('blue','adjective','modifier'), tok('pen','noun','complement','pen','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'my', promptVi:'Điền tính từ sở hữu của I.', hint:'tính từ sở hữu: của tôi'});

addSentence('possessive-determiner', 'Today my mother is very busy.', 'Hôm nay mẹ tôi rất bận rộn.', 3, ['possessive', 'family'],
  [tok('Today','adverb','adverbial'), tok('my','determiner','det'), tok('mother','noun','subject','mother','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('busy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'my', promptVi:'Điền tính từ sở hữu của I.', hint:'tính từ sở hữu: của tôi'},
  ['My mother is very busy today.']);

// your (6 sentences)
addSentence('possessive-determiner', 'Is this your ruler?', 'Đây có phải thước kẻ của bạn không?', 1, ['possessive', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), tok('your','determiner','det'), tok('ruler','noun','complement','ruler','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'your', promptVi:'Điền tính từ sở hữu của you.', hint:'tính từ sở hữu: của bạn'});

addSentence('possessive-determiner', 'Your puppy is very cute.', 'Chú cún của bạn rất dễ thương.', 1, ['possessive', 'animal'],
  [tok('Your','determiner','det'), tok('puppy','noun','subject','puppy','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('cute','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Your', promptVi:'Điền tính từ sở hữu của you đầu câu.', hint:'tính từ sở hữu: của bạn'});

addSentence('possessive-determiner', 'That is your red hat.', 'Kia là chiếc mũ màu đỏ của bạn.', 1, ['possessive', 'clothes'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('red','adjective','modifier'), tok('hat','noun','complement','hat','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'your', promptVi:'Điền tính từ sở hữu của you.', hint:'tính từ sở hữu: của bạn'});

addSentence('possessive-determiner', 'Are these your pencils?', 'Đây có phải là những chiếc bút chì của bạn không?', 2, ['possessive', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('these','pronoun','subject'), tok('your','determiner','det'), tok('pencils','noun','complement','pencil','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'your', promptVi:'Điền tính từ sở hữu của you.', hint:'tính từ sở hữu: của bạn'});

addSentence('possessive-determiner', 'Your room isn\'t messy.', 'Phòng của bạn không bừa bộn.', 2, ['possessive', 'negative'],
  [tok('Your','determiner','det'), tok('room','noun','subject','room','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('messy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Your', promptVi:'Điền tính từ sở hữu của you.', hint:'tính từ sở hữu: của bạn'});

addSentence('possessive-determiner', 'In your bag there is a short ruler.', 'Trong cặp của bạn có một chiếc thước ngắn.', 3, ['possessive', 'school'],
  [tok('In','preposition','prep'), tok('your','determiner','det'), tok('bag','noun','prep-object','bag','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('short','adjective','modifier'), tok('ruler','noun','subject','ruler','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'your', promptVi:'Điền tính từ sở hữu của you.', hint:'tính từ sở hữu: của bạn'},
  ['There is a short ruler in your bag.']);

// his (7 sentences)
addSentence('possessive-determiner', 'His brother is tall.', 'Anh trai của cậu ấy thì cao.', 1, ['possessive', 'family'],
  [tok('His','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('is','verb','verb','be','present-3sg'), tok('tall','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'His', promptVi:'Điền tính từ sở hữu của he.', hint:'tính từ sở hữu: của cậu ấy'});

addSentence('possessive-determiner', 'That is his bike.', 'Kia là xe đạp của cậu ấy.', 1, ['possessive', 'transport'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('his','determiner','det'), tok('bike','noun','complement','bike','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'his', promptVi:'Điền tính từ sở hữu của he.', hint:'tính từ sở hữu: của cậu ấy'});

addSentence('possessive-determiner', 'His car is black.', 'Xe ô tô của anh ấy màu đen.', 1, ['possessive', 'color'],
  [tok('His','determiner','det'), tok('car','noun','subject','car','sg'), tok('is','verb','verb','be','present-3sg'), tok('black','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'His', promptVi:'Điền tính từ sở hữu của he.', hint:'tính từ sở hữu: của anh ấy'});

addSentence('possessive-determiner', 'His shoes are clean.', 'Đôi giày của cậu ấy sạch sẽ.', 2, ['possessive', 'clothes'],
  [tok('His','determiner','det'), tok('shoes','noun','subject','shoe','pl'), tok('are','verb','verb','be','present-other'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'His', promptVi:'Điền tính từ sở hữu của he.', hint:'tính từ sở hữu: của cậu ấy'});

addSentence('possessive-determiner', 'Is his uncle a teacher?', 'Chú của cậu ấy có phải là giáo viên không?', 2, ['possessive', 'question', 'family'],
  [tok('Is','verb','verb','be','present-3sg'), tok('his','determiner','det'), tok('uncle','noun','subject','uncle','sg'), tok('a','article','det'), tok('teacher','noun','complement','teacher','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'his', promptVi:'Điền tính từ sở hữu của he.', hint:'tính từ sở hữu: của cậu ấy'});

addSentence('possessive-determiner', 'His little sister isn\'t tall.', 'Em gái nhỏ của cậu ấy không cao.', 2, ['possessive', 'negative', 'family'],
  [tok('His','determiner','det'), tok('little','adjective','modifier'), tok('sister','noun','subject','sister','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('tall','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'His', promptVi:'Điền tính từ sở hữu của he.', hint:'tính từ sở hữu: của cậu ấy'});

addSentence('possessive-determiner', 'On his desk there are three new books.', 'Trên bàn học của cậu ấy có ba cuốn sách mới.', 3, ['possessive', 'school'],
  [tok('On','preposition','prep'), tok('his','determiner','det'), tok('desk','noun','prep-object','desk','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('three','numeral','det'), tok('new','adjective','modifier'), tok('books','noun','subject','book','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'his', promptVi:'Điền tính từ sở hữu của he.', hint:'tính từ sở hữu: của cậu ấy'},
  ['There are three new books on his desk.']);

// her (7 sentences)
addSentence('possessive-determiner', 'Her eyes are blue.', 'Đôi mắt của cô ấy màu xanh.', 1, ['possessive', 'body'],
  [tok('Her','determiner','det'), tok('eyes','noun','subject','eye','pl'), tok('are','verb','verb','be','present-other'), tok('blue','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Her', promptVi:'Điền tính từ sở hữu của she.', hint:'tính từ sở hữu: của cô ấy'});

addSentence('possessive-determiner', 'This is her doll.', 'Đây là con búp bê của cô bé.', 1, ['possessive', 'toy'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('her','determiner','det'), tok('doll','noun','complement','doll','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'her', promptVi:'Điền tính từ sở hữu của she.', hint:'tính từ sở hữu: của cô ấy'});

addSentence('possessive-determiner', 'Her hat is yellow.', 'Chiếc mũ của cô ấy màu vàng.', 1, ['possessive', 'clothes'],
  [tok('Her','determiner','det'), tok('hat','noun','subject','hat','sg'), tok('is','verb','verb','be','present-3sg'), tok('yellow','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Her', promptVi:'Điền tính từ sở hữu của she.', hint:'tính từ sở hữu: của cô ấy'});

addSentence('possessive-determiner', 'Her grandmother is very kind.', 'Bà của cô ấy rất tốt bụng.', 2, ['possessive', 'family'],
  [tok('Her','determiner','det'), tok('grandmother','noun','subject','grandmother','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Her', promptVi:'Điền tính từ sở hữu của she.', hint:'tính từ sở hữu: của cô ấy'});

addSentence('possessive-determiner', 'Are those her new shoes?', 'Kia có phải là đôi giày mới của cô ấy không?', 2, ['possessive', 'question', 'clothes'],
  [tok('Are','verb','verb','be','present-other'), tok('those','pronoun','subject'), tok('her','determiner','det'), tok('new','adjective','modifier'), tok('shoes','noun','complement','shoe','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'her', promptVi:'Điền tính từ sở hữu của she.', hint:'tính từ sở hữu: của cô ấy'});

addSentence('possessive-determiner', 'Her umbrella isn\'t green.', 'Chiếc ô của cô ấy không phải màu xanh lá.', 2, ['possessive', 'negative'],
  [tok('Her','determiner','det'), tok('umbrella','noun','subject','umbrella','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('green','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Her', promptVi:'Điền tính từ sở hữu của she.', hint:'tính từ sở hữu: của cô ấy'});

addSentence('possessive-determiner', 'In her room there is a pretty bed.', 'Trong phòng của cô ấy có một chiếc giường xinh xắn.', 3, ['possessive'],
  [tok('In','preposition','prep'), tok('her','determiner','det'), tok('room','noun','prep-object','room','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('pretty','adjective','modifier'), tok('bed','noun','subject','bed','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'her', promptVi:'Điền tính từ sở hữu của she.', hint:'tính từ sở hữu: của cô ấy'},
  ['There is a pretty bed in her room.']);

// its (6 sentences)
addSentence('possessive-determiner', 'Its tail is short.', 'Cái đuôi của nó ngắn.', 1, ['possessive', 'animal'],
  [tok('Its','determiner','det'), tok('tail','noun','subject','tail','sg'), tok('is','verb','verb','be','present-3sg'), tok('short','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Its', promptVi:'Điền tính từ sở hữu của it.', hint:'tính từ sở hữu: của nó'});

addSentence('possessive-determiner', 'Its ears are long.', 'Đôi tai của nó dài.', 1, ['possessive', 'animal'],
  [tok('Its','determiner','det'), tok('ears','noun','subject','ear','pl'), tok('are','verb','verb','be','present-other'), tok('long','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Its', promptVi:'Điền tính từ sở hữu của it.', hint:'tính từ sở hữu: của nó'});

addSentence('possessive-determiner', 'Its nose is black.', 'Mũi của nó màu đen.', 1, ['possessive', 'animal'],
  [tok('Its','determiner','det'), tok('nose','noun','subject','nose','sg'), tok('is','verb','verb','be','present-3sg'), tok('black','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Its', promptVi:'Điền tính từ sở hữu của it.', hint:'tính từ sở hữu: của nó'});

addSentence('possessive-determiner', 'Its fur is very soft.', 'Bộ lông của nó rất mềm mại.', 2, ['possessive', 'animal'],
  [tok('Its','determiner','det'), tok('fur','noun','subject','fur','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('soft','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Its', promptVi:'Điền tính từ sở hữu của it.', hint:'tính từ sở hữu: của nó'});

addSentence('possessive-determiner', 'Its legs aren\'t long.', 'Những chiếc chân của nó không dài.', 2, ['possessive', 'negative', 'animal'],
  [tok('Its','determiner','det'), tok('legs','noun','subject','leg','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('long','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Its', promptVi:'Điền tính từ sở hữu của it.', hint:'tính từ sở hữu: của nó'});

addSentence('possessive-determiner', 'Under the table its ball is green.', 'Ở dưới bàn quả bóng của nó màu xanh lá.', 3, ['possessive', 'toy'],
  [tok('Under','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), tok('its','determiner','det'), tok('ball','noun','subject','ball','sg'), tok('is','verb','verb','be','present-3sg'), tok('green','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'its', promptVi:'Điền tính từ sở hữu của it.', hint:'tính từ sở hữu: của nó'},
  ['Its ball is green under the table.']);

// our (6 sentences)
addSentence('possessive-determiner', 'Our house is big.', 'Ngôi nhà của chúng tôi to lớn.', 1, ['possessive'],
  [tok('Our','determiner','det'), tok('house','noun','subject','house','sg'), tok('is','verb','verb','be','present-3sg'), tok('big','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Our', promptVi:'Điền tính từ sở hữu của we.', hint:'tính từ sở hữu: của chúng tôi'});

addSentence('possessive-determiner', 'This is our school.', 'Đây là trường học của chúng tôi.', 1, ['possessive', 'school'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('our','determiner','det'), tok('school','noun','complement','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'our', promptVi:'Điền tính từ sở hữu của we.', hint:'tính từ sở hữu: của chúng tôi'});

addSentence('possessive-determiner', 'Our classroom is clean.', 'Lớp học của chúng tôi sạch sẽ.', 1, ['possessive', 'school'],
  [tok('Our','determiner','det'), tok('classroom','noun','subject','classroom','sg'), tok('is','verb','verb','be','present-3sg'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Our', promptVi:'Điền tính từ sở hữu của we.', hint:'tính từ sở hữu: của chúng tôi'});

addSentence('possessive-determiner', 'Our teacher is very kind.', 'Thầy giáo của chúng tôi rất tốt bụng.', 2, ['possessive', 'school'],
  [tok('Our','determiner','det'), tok('teacher','noun','subject','teacher','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Our', promptVi:'Điền tính từ sở hữu của we.', hint:'tính từ sở hữu: của chúng tôi'});

addSentence('possessive-determiner', 'Are these our new notebooks?', 'Đây có phải là những cuốn vở mới của chúng ta không?', 2, ['possessive', 'question', 'school'],
  [tok('Are','verb','verb','be','present-other'), tok('these','pronoun','subject'), tok('our','determiner','det'), tok('new','adjective','modifier'), tok('notebooks','noun','complement','notebook','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'our', promptVi:'Điền tính từ sở hữu của we.', hint:'tính từ sở hữu: của chúng ta'});

addSentence('possessive-determiner', 'Today our school isn\'t open.', 'Hôm nay trường học của chúng tôi không mở cửa.', 3, ['possessive', 'negative', 'school'],
  [tok('Today','adverb','adverbial'), tok('our','determiner','det'), tok('school','noun','subject','school','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('open','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'our', promptVi:'Điền tính từ sở hữu của we.', hint:'tính từ sở hữu: của chúng tôi'},
  ['Our school isn\'t open today.']);

// their (7 sentences)
addSentence('possessive-determiner', 'Their car is red.', 'Xe ô tô của họ màu đỏ.', 1, ['possessive', 'transport'],
  [tok('Their','determiner','det'), tok('car','noun','subject','car','sg'), tok('is','verb','verb','be','present-3sg'), tok('red','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Their', promptVi:'Điền tính từ sở hữu của they.', hint:'tính từ sở hữu: của họ'});

addSentence('possessive-determiner', 'That is their house.', 'Kia là ngôi nhà của họ.', 1, ['possessive'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('their','determiner','det'), tok('house','noun','complement','house','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'their', promptVi:'Điền tính từ sở hữu của they.', hint:'tính từ sở hữu: của họ'});

addSentence('possessive-determiner', 'Their dog is very friendly.', 'Chú chó của họ rất thân thiện.', 2, ['possessive', 'animal'],
  [tok('Their','determiner','det'), tok('dog','noun','subject','dog','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('friendly','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Their', promptVi:'Điền tính từ sở hữu của they.', hint:'tính từ sở hữu: của họ'});

addSentence('possessive-determiner', 'Are those their bicycles?', 'Kia có phải là những chiếc xe đạp của họ không?', 2, ['possessive', 'question', 'transport'],
  [tok('Are','verb','verb','be','present-other'), tok('those','pronoun','subject'), tok('their','determiner','det'), tok('bicycles','noun','complement','bicycle','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'their', promptVi:'Điền tính từ sở hữu của they.', hint:'tính từ sở hữu: của họ'});

addSentence('possessive-determiner', 'Their garden isn\'t small.', 'Khu vườn của họ không hề nhỏ.', 2, ['possessive', 'negative'],
  [tok('Their','determiner','det'), tok('garden','noun','subject','garden','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('small','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Their', promptVi:'Điền tính từ sở hữu của they.', hint:'tính từ sở hữu: của họ'});

addSentence('possessive-determiner', 'Now their parents aren\'t at home.', 'Bây giờ bố mẹ họ không có ở nhà.', 3, ['possessive', 'family'],
  [tok('Now','adverb','adverbial'), tok('their','determiner','det'), tok('parents','noun','subject','parents','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('at','preposition','prep'), tok('home','noun','prep-object','home','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'their', promptVi:'Điền tính từ sở hữu của they.', hint:'tính từ sở hữu: của họ'},
  ['Their parents aren\'t at home now.']);

addSentence('possessive-determiner', 'In their garden there are four tall trees.', 'Trong vườn của họ có bốn cái cây cao.', 3, ['possessive', 'nature'],
  [tok('In','preposition','prep'), tok('their','determiner','det'), tok('garden','noun','prep-object','garden','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('four','numeral','det'), tok('tall','adjective','modifier'), tok('trees','noun','subject','tree','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'their', promptVi:'Điền tính từ sở hữu của they.', hint:'tính từ sở hữu: của họ'},
  ['There are four tall trees in their garden.']);

console.log(`Group 3 done: ${sentences.length} sentences.`);

// =========================================================================
// GROUP 4: possessive-case (45 sentences: 0126 - 0170)
// Sở hữu cách: Danh từ + 's / ' (Nam's book, the students' classroom)
// =========================================================================

addSentence('possessive-case', 'Nam\'s bike is blue.', 'Xe đạp của Nam màu xanh da trời.', 1, ['possessive', 'name'],
  [tok('Nam\'s','noun','det','Nam','sg'), tok('bike','noun','subject','bike','sg'), tok('is','verb','verb','be','present-3sg'), tok('blue','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Nam\'s', promptVi:'Điền dạng sở hữu cách của Nam.', hint:'Nam + \'s'});

addSentence('possessive-case', 'My mother\'s bag is red.', 'Chiếc cặp của mẹ tôi màu đỏ.', 1, ['possessive', 'family'],
  [tok('My','determiner','det'), tok('mother\'s','noun','det','mother','sg'), tok('bag','noun','subject','bag','sg'), tok('is','verb','verb','be','present-3sg'), tok('red','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'mother\'s', promptVi:'Điền dạng sở hữu cách của mother.', hint:'mother + \'s'});

addSentence('possessive-case', 'The cat\'s tail is long.', 'Cái đuôi của con mèo thì dài.', 1, ['possessive', 'animal'],
  [tok('The','article','det'), tok('cat\'s','noun','det','cat','sg'), tok('tail','noun','subject','tail','sg'), tok('is','verb','verb','be','present-3sg'), tok('long','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'cat\'s', promptVi:'Điền dạng sở hữu cách của cat.', hint:'cat + \'s'});

addSentence('possessive-case', 'Lan\'s doll is pretty.', 'Búp bê của Lan rất xinh xắn.', 1, ['possessive', 'name'],
  [tok('Lan\'s','noun','det','Lan','sg'), tok('doll','noun','subject','doll','sg'), tok('is','verb','verb','be','present-3sg'), tok('pretty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Lan\'s', promptVi:'Điền dạng sở hữu cách của Lan.', hint:'Lan + \'s'});

addSentence('possessive-case', 'My father\'s car is white.', 'Xe ô tô của bố tôi màu trắng.', 1, ['possessive', 'family'],
  [tok('My','determiner','det'), tok('father\'s','noun','det','father','sg'), tok('car','noun','subject','car','sg'), tok('is','verb','verb','be','present-3sg'), tok('white','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'father\'s', promptVi:'Điền dạng sở hữu cách của father.', hint:'father + \'s'});

addSentence('possessive-case', 'Tom\'s dog is big.', 'Chú chó của Tom thì to lớn.', 1, ['possessive', 'name'],
  [tok('Tom\'s','noun','det','Tom','sg'), tok('dog','noun','subject','dog','sg'), tok('is','verb','verb','be','present-3sg'), tok('big','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Tom\'s', promptVi:'Điền dạng sở hữu cách của Tom.', hint:'Tom + \'s'});

addSentence('possessive-case', 'Peter\'s ruler is short.', 'Thước kẻ của Peter thì ngắn.', 1, ['possessive', 'name'],
  [tok('Peter\'s','noun','det','Peter','sg'), tok('ruler','noun','subject','ruler','sg'), tok('is','verb','verb','be','present-3sg'), tok('short','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Peter\'s', promptVi:'Điền dạng sở hữu cách của Peter.', hint:'Peter + \'s'});

addSentence('possessive-case', 'The baby\'s hands are small.', 'Đôi bàn tay của em bé thì nhỏ nhắn.', 1, ['possessive', 'family'],
  [tok('The','article','det'), tok('baby\'s','noun','det','baby','sg'), tok('hands','noun','subject','hand','pl'), tok('are','verb','verb','be','present-other'), tok('small','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'baby\'s', promptVi:'Điền dạng sở hữu cách của baby.', hint:'baby + \'s'});

addSentence('possessive-case', 'Mary\'s dress is yellow.', 'Chiếc váy của Mary màu vàng.', 1, ['possessive', 'name'],
  [tok('Mary\'s','noun','det','Mary','sg'), tok('dress','noun','subject','dress','sg'), tok('is','verb','verb','be','present-3sg'), tok('yellow','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Mary\'s', promptVi:'Điền dạng sở hữu cách của Mary.', hint:'Mary + \'s'});

addSentence('possessive-case', 'The teacher\'s desk is neat.', 'Bàn làm việc của cô giáo rất gọn gàng.', 1, ['possessive', 'school'],
  [tok('The','article','det'), tok('teacher\'s','noun','det','teacher','sg'), tok('desk','noun','subject','desk','sg'), tok('is','verb','verb','be','present-3sg'), tok('neat','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'teacher\'s', promptVi:'Điền dạng sở hữu cách của teacher.', hint:'teacher + \'s'});

addSentence('possessive-case', 'My brother\'s shoes are dirty.', 'Đôi giày của anh trai tôi bị bẩn.', 2, ['possessive', 'family'],
  [tok('My','determiner','det'), tok('brother\'s','noun','det','brother','sg'), tok('shoes','noun','subject','shoe','pl'), tok('are','verb','verb','be','present-other'), tok('dirty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'brother\'s', promptVi:'Điền dạng sở hữu cách của brother.', hint:'brother + \'s'});

addSentence('possessive-case', 'Is Nam\'s cat cute?', 'Con mèo của Nam có dễ thương không?', 2, ['possessive', 'question', 'name'],
  [tok('Is','verb','verb','be','present-3sg'), tok('Nam\'s','noun','det','Nam','sg'), tok('cat','noun','subject','cat','sg'), tok('cute','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'Nam\'s', promptVi:'Điền dạng sở hữu cách của Nam.', hint:'Nam + \'s'});

addSentence('possessive-case', 'Anna\'s room isn\'t messy.', 'Căn phòng của Anna không bừa bộn.', 2, ['possessive', 'negative', 'name'],
  [tok('Anna\'s','noun','det','Anna','sg'), tok('room','noun','subject','room','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('messy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Anna\'s', promptVi:'Điền dạng sở hữu cách của Anna.', hint:'Anna + \'s'});

addSentence('possessive-case', 'The boy\'s kite is colorful.', 'Con diều của cậu bé nhiều màu sắc.', 2, ['possessive', 'toy'],
  [tok('The','article','det'), tok('boy\'s','noun','det','boy','sg'), tok('kite','noun','subject','kite','sg'), tok('is','verb','verb','be','present-3sg'), tok('colorful','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'boy\'s', promptVi:'Điền dạng sở hữu cách của boy.', hint:'boy + \'s'});

addSentence('possessive-case', 'Are Tom\'s eyes brown?', 'Đôi mắt của Tom có màu nâu không?', 2, ['possessive', 'question', 'name'],
  [tok('Are','verb','verb','be','present-other'), tok('Tom\'s','noun','det','Tom','sg'), tok('eyes','noun','subject','eye','pl'), tok('brown','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'Tom\'s', promptVi:'Điền dạng sở hữu cách của Tom.', hint:'Tom + \'s'});

addSentence('possessive-case', 'My sister\'s umbrella isn\'t pink.', 'Chiếc ô của em gái tôi không phải màu hồng.', 2, ['possessive', 'negative', 'family'],
  [tok('My','determiner','det'), tok('sister\'s','noun','det','sister','sg'), tok('umbrella','noun','subject','umbrella','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('pink','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sister\'s', promptVi:'Điền dạng sở hữu cách của sister.', hint:'sister + \'s'});

addSentence('possessive-case', 'Lan\'s brother is a doctor.', 'Anh trai của Lan là bác sĩ.', 2, ['possessive', 'name', 'family'],
  [tok('Lan\'s','noun','det','Lan','sg'), tok('brother','noun','subject','brother','sg'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('doctor','noun','complement','doctor','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Lan\'s', promptVi:'Điền dạng sở hữu cách của Lan.', hint:'Lan + \'s'});

addSentence('possessive-case', 'The elephant\'s ears are very big.', 'Đôi tai của chú voi rất to.', 2, ['possessive', 'animal'],
  [tok('The','article','det'), tok('elephant\'s','noun','det','elephant','sg'), tok('ears','noun','subject','ear','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('big','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'elephant\'s', promptVi:'Điền dạng sở hữu cách của elephant.', hint:'elephant + \'s'});

addSentence('possessive-case', 'Is this Peter\'s cap?', 'Đây có phải là mũ lưỡi trai của Peter không?', 2, ['possessive', 'question', 'name'],
  [tok('Is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), tok('Peter\'s','noun','det','Peter','sg'), tok('cap','noun','complement','cap','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'Peter\'s', promptVi:'Điền dạng sở hữu cách của Peter.', hint:'Peter + \'s'});

addSentence('possessive-case', 'That isn\'t Mary\'s watch.', 'Kia không phải là đồng hồ của Mary.', 2, ['possessive', 'negative', 'name'],
  [tok('That','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('Mary\'s','noun','det','Mary','sg'), tok('watch','noun','complement','watch','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'Mary\'s', promptVi:'Điền dạng sở hữu cách của Mary.', hint:'Mary + \'s'});

addSentence('possessive-case', 'Hoa\'s pencil case is on the table.', 'Hộp bút của Hoa ở trên bàn.', 2, ['possessive', 'name', 'school'],
  [tok('Hoa\'s','noun','det','Hoa','sg'), tok('pencil','noun','modifier','pencil','sg'), tok('case','noun','subject','case','sg'), tok('is','verb','verb','be','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Hoa\'s', promptVi:'Điền dạng sở hữu cách của Hoa.', hint:'Hoa + \'s'});

addSentence('possessive-case', 'The rabbit\'s tail is very short.', 'Cái đuôi của con thỏ rất ngắn.', 2, ['possessive', 'animal'],
  [tok('The','article','det'), tok('rabbit\'s','noun','det','rabbit','sg'), tok('tail','noun','subject','tail','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('short','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'rabbit\'s', promptVi:'Điền dạng sở hữu cách của rabbit.', hint:'rabbit + \'s'});

addSentence('possessive-case', 'Is that your brother\'s bicycle?', 'Kia có phải là xe đạp của anh trai bạn không?', 2, ['possessive', 'question', 'family'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), tok('your','determiner','det'), tok('brother\'s','noun','det','brother','sg'), tok('bicycle','noun','complement','bicycle','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'brother\'s', promptVi:'Điền dạng sở hữu cách của brother.', hint:'brother + \'s'});

addSentence('possessive-case', 'My grandmother\'s hair is white.', 'Mái tóc của bà tôi bạc trắng.', 2, ['possessive', 'family'],
  [tok('My','determiner','det'), tok('grandmother\'s','noun','det','grandmother','sg'), tok('hair','noun','subject','hair','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('white','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'grandmother\'s', promptVi:'Điền dạng sở hữu cách của grandmother.', hint:'grandmother + \'s'});

addSentence('possessive-case', 'The doctor\'s car is very fast.', 'Xe ô tô của bác sĩ chạy rất nhanh.', 2, ['possessive'],
  [tok('The','article','det'), tok('doctor\'s','noun','det','doctor','sg'), tok('car','noun','subject','car','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('fast','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doctor\'s', promptVi:'Điền dạng sở hữu cách của doctor.', hint:'doctor + \'s'});

addSentence('possessive-case', 'In the park Nam\'s kite is high.', 'Ở công viên con diều của Nam bay cao.', 3, ['possessive', 'name'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), tok('Nam\'s','noun','det','Nam','sg'), tok('kite','noun','subject','kite','sg'), tok('is','verb','verb','be','present-3sg'), tok('high','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'Nam\'s', promptVi:'Điền dạng sở hữu cách của Nam.', hint:'Nam + \'s'},
  ['Nam\'s kite is high in the park.']);

addSentence('possessive-case', 'On the table my father\'s watch is old.', 'Ở trên bàn chiếc đồng hồ của bố tôi đã cũ.', 3, ['possessive', 'family'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), tok('my','determiner','det'), tok('father\'s','noun','det','father','sg'), tok('watch','noun','subject','watch','sg'), tok('is','verb','verb','be','present-3sg'), tok('old','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'father\'s', promptVi:'Điền dạng sở hữu cách của father.', hint:'father + \'s'},
  ['My father\'s watch is old on the table.']);

addSentence('possessive-case', 'Today my uncle\'s car is in the garage.', 'Hôm nay xe ô tô của chú tôi ở trong nhà xe.', 3, ['possessive', 'family'],
  [tok('Today','adverb','adverbial'), tok('my','determiner','det'), tok('uncle\'s','noun','det','uncle','sg'), tok('car','noun','subject','car','sg'), tok('is','verb','verb','be','present-3sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('garage','noun','prep-object','garage','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'uncle\'s', promptVi:'Điền dạng sở hữu cách của uncle.', hint:'uncle + \'s'},
  ['My uncle\'s car is in the garage today.']);

addSentence('possessive-case', 'In this room Lan\'s desk is very clean.', 'Ở trong phòng này bàn học của Lan rất sạch sẽ.', 3, ['possessive', 'name'],
  [tok('In','preposition','prep'), tok('this','determiner','det'), tok('room','noun','prep-object','room','sg'), tok('Lan\'s','noun','det','Lan','sg'), tok('desk','noun','subject','desk','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6, 7]}],
  ['pos','fill','order','roles'], {idx:3, ans:'Lan\'s', promptVi:'Điền dạng sở hữu cách của Lan.', hint:'Lan + \'s'},
  ['Lan\'s desk is very clean in this room.']);

addSentence('possessive-case', 'Are these three long rulers Peter\'s?', 'Ba chiếc thước kẻ dài này có phải của Peter không?', 3, ['possessive', 'name'],
  [tok('Are','verb','verb','be','present-other'), tok('these','determiner','det'), tok('three','numeral','det'), tok('long','adjective','modifier'), tok('rulers','noun','subject','ruler','pl'), tok('Peter\'s','noun','complement','Peter','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:5, ans:'Peter\'s', promptVi:'Điền dạng sở hữu cách của Peter ở vị trí bổ ngữ.', hint:'Peter + \'s'});

addSentence('possessive-case', 'Those four books are Mary\'s.', 'Bốn cuốn sách kia là của Mary.', 3, ['possessive', 'name'],
  [tok('Those','determiner','det'), tok('four','numeral','det'), tok('books','noun','subject','book','pl'), tok('are','verb','verb','be','present-other'), tok('Mary\'s','noun','complement','Mary','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'Mary\'s', promptVi:'Điền dạng sở hữu cách của Mary.', hint:'Mary + \'s'});

addSentence('possessive-case', 'My aunt\'s house is near the park.', 'Nhà của dì tôi ở gần công viên.', 3, ['possessive', 'family'],
  [tok('My','determiner','det'), tok('aunt\'s','noun','det','aunt','sg'), tok('house','noun','subject','house','sg'), tok('is','verb','verb','be','present-3sg'), tok('near','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aunt\'s', promptVi:'Điền dạng sở hữu cách của aunt.', hint:'aunt + \'s'});

addSentence('possessive-case', 'Under the chair the cat\'s ball is yellow.', 'Ở dưới ghế quả bóng của con mèo màu vàng.', 3, ['possessive', 'animal'],
  [tok('Under','preposition','prep'), tok('the','article','det'), tok('chair','noun','prep-object','chair','sg'), tok('the','article','det'), tok('cat\'s','noun','det','cat','sg'), tok('ball','noun','subject','ball','sg'), tok('is','verb','verb','be','present-3sg'), tok('yellow','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'cat\'s', promptVi:'Điền dạng sở hữu cách của cat.', hint:'cat + \'s'},
  ['The cat\'s ball is yellow under the chair.']);

addSentence('possessive-case', 'Today the teacher\'s lesson is very good.', 'Hôm nay bài giảng của cô giáo rất hay.', 3, ['possessive', 'school'],
  [tok('Today','adverb','adverbial'), tok('the','article','det'), tok('teacher\'s','noun','det','teacher','sg'), tok('lesson','noun','subject','lesson','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('good','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'teacher\'s', promptVi:'Điền dạng sở hữu cách của teacher.', hint:'teacher + \'s'},
  ['The teacher\'s lesson is very good today.']);

addSentence('possessive-case', 'In the garden the dog\'s puppy is cute.', 'Trong vườn chú cún con của chó mẹ rất dễ thương.', 3, ['possessive', 'animal'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('garden','noun','prep-object','garden','sg'), tok('the','article','det'), tok('dog\'s','noun','det','dog','sg'), tok('puppy','noun','subject','puppy','sg'), tok('is','verb','verb','be','present-3sg'), tok('cute','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'dog\'s', promptVi:'Điền dạng sở hữu cách của dog.', hint:'dog + \'s'},
  ['The dog\'s puppy is cute in the garden.']);

// Số nhiều có đuôi ' (10 sentences)
addSentence('possessive-case', 'The students\' classroom is clean.', 'Lớp học của các bạn học sinh rất sạch sẽ.', 2, ['possessive', 'school', 'plural'],
  [tok('The','article','det'), tok('students\'','noun','det','student','pl'), tok('classroom','noun','subject','classroom','sg'), tok('is','verb','verb','be','present-3sg'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'students\'', promptVi:'Điền sở hữu cách của danh từ số nhiều students.', hint:'students + \''});

addSentence('possessive-case', 'My parents\' room is large.', 'Phòng của bố mẹ tôi rất rộng rãi.', 2, ['possessive', 'family', 'plural'],
  [tok('My','determiner','det'), tok('parents\'','noun','det','parents','pl'), tok('room','noun','subject','room','sg'), tok('is','verb','verb','be','present-3sg'), tok('large','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'parents\'', promptVi:'Điền sở hữu cách của danh từ số nhiều parents.', hint:'parents + \''});

addSentence('possessive-case', 'The girls\' hats are pink.', 'Những chiếc mũ của các bé gái màu hồng.', 2, ['possessive', 'clothes', 'plural'],
  [tok('The','article','det'), tok('girls\'','noun','det','girl','pl'), tok('hats','noun','subject','hat','pl'), tok('are','verb','verb','be','present-other'), tok('pink','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'girls\'', promptVi:'Điền sở hữu cách của danh từ số nhiều girls.', hint:'girls + \''});

addSentence('possessive-case', 'The boys\' football is new.', 'Quả bóng đá của các cậu bé còn mới.', 2, ['possessive', 'toy', 'plural'],
  [tok('The','article','det'), tok('boys\'','noun','det','boy','pl'), tok('football','noun','subject','football','sg'), tok('is','verb','verb','be','present-3sg'), tok('new','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'boys\'', promptVi:'Điền sở hữu cách của danh từ số nhiều boys.', hint:'boys + \''});

addSentence('possessive-case', 'The teachers\' table is neat.', 'Bàn của các giáo viên rất gọn gàng.', 2, ['possessive', 'school', 'plural'],
  [tok('The','article','det'), tok('teachers\'','noun','det','teacher','pl'), tok('table','noun','subject','table','sg'), tok('is','verb','verb','be','present-3sg'), tok('neat','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'teachers\'', promptVi:'Điền sở hữu cách của danh từ số nhiều teachers.', hint:'teachers + \''});

addSentence('possessive-case', 'Are the birds\' nests small?', 'Tổ của những chú chim có nhỏ không?', 2, ['possessive', 'question', 'animal', 'plural'],
  [tok('Are','verb','verb','be','present-other'), tok('the','article','det'), tok('birds\'','noun','det','bird','pl'), tok('nests','noun','subject','nest','pl'), tok('small','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'birds\'', promptVi:'Điền sở hữu cách của danh từ số nhiều birds.', hint:'birds + \''});

addSentence('possessive-case', 'The puppies\' mother is brown.', 'Mẹ của những chú cún con màu nâu.', 2, ['possessive', 'animal', 'plural'],
  [tok('The','article','det'), tok('puppies\'','noun','det','puppy','pl'), tok('mother','noun','subject','mother','sg'), tok('is','verb','verb','be','present-3sg'), tok('brown','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'puppies\'', promptVi:'Điền sở hữu cách của danh từ số nhiều puppies.', hint:'puppies + \''});

addSentence('possessive-case', 'In the yard the children\'s toys are colorful.', 'Ở trong sân đồ chơi của lũ trẻ rất nhiều màu sắc.', 3, ['possessive', 'toy', 'plural'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('yard','noun','prep-object','yard','sg'), tok('the','article','det'), tok('children\'s','noun','det','children','pl'), tok('toys','noun','subject','toy','pl'), tok('are','verb','verb','be','present-other'), tok('colorful','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'children\'s', promptVi:'Điền sở hữu cách của danh từ số nhiều bất quy tắc children.', hint:'children + \'s'},
  ['The children\'s toys are colorful in the yard.']);

addSentence('possessive-case', 'Today the students\' uniforms are neat.', 'Hôm nay đồng phục của các bạn học sinh rất chỉnh tề.', 3, ['possessive', 'school', 'plural'],
  [tok('Today','adverb','adverbial'), tok('the','article','det'), tok('students\'','noun','det','student','pl'), tok('uniforms','noun','subject','uniform','pl'), tok('are','verb','verb','be','present-other'), tok('neat','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'students\'', promptVi:'Điền sở hữu cách của danh từ số nhiều students.', hint:'students + \''},
  ['The students\' uniforms are neat today.']);

addSentence('possessive-case', 'In the garage my parents\' cars are clean.', 'Ở trong nhà xe những chiếc ô tô của bố mẹ tôi rất sạch sẽ.', 3, ['possessive', 'family', 'plural'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('garage','noun','prep-object','garage','sg'), tok('my','determiner','det'), tok('parents\'','noun','det','parents','pl'), tok('cars','noun','subject','car','pl'), tok('are','verb','verb','be','present-other'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'parents\'', promptVi:'Điền sở hữu cách của danh từ số nhiều parents.', hint:'parents + \''},
  ['My parents\' cars are clean in the garage.']);

console.log(`Group 4 done: ${sentences.length} sentences.`);

// =========================================================================
// GROUP 5: whose-question (30 sentences: 0171 - 0200)
// Câu hỏi với Whose và câu trả lời xác định quyền sở hữu
// =========================================================================

addSentence('whose-question', 'Whose book is this?', 'Cuốn sách này là của ai?', 1, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('book','noun','complement','book','sg'), tok('is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is my book.', 'Nó là cuốn sách của tôi.', 1, ['answer', 'possessive'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('my','determiner','det'), tok('book','noun','complement','book','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'my', promptVi:'Điền tính từ sở hữu của I.', hint:'của tôi'});

addSentence('whose-question', 'Whose pen is that?', 'Chiếc bút mực kia là của ai?', 1, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('pen','noun','complement','pen','sg'), tok('is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is Nam\'s pen.', 'Nó là chiếc bút mực của Nam.', 1, ['answer', 'possessive', 'name'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('Nam\'s','noun','det','Nam','sg'), tok('pen','noun','complement','pen','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'Nam\'s', promptVi:'Điền sở hữu cách của Nam.', hint:'Nam + \'s'});

addSentence('whose-question', 'Whose bag is this?', 'Chiếc cặp này là của ai?', 1, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('bag','noun','complement','bag','sg'), tok('is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is her bag.', 'Nó là chiếc cặp của cô ấy.', 1, ['answer', 'possessive'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('her','determiner','det'), tok('bag','noun','complement','bag','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'her', promptVi:'Điền tính từ sở hữu của she.', hint:'của cô ấy'});

addSentence('whose-question', 'Whose ruler is that?', 'Chiếc thước kẻ kia là của ai?', 1, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('ruler','noun','complement','ruler','sg'), tok('is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is his ruler.', 'Nó là chiếc thước kẻ của cậu ấy.', 1, ['answer', 'possessive'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('his','determiner','det'), tok('ruler','noun','complement','ruler','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'his', promptVi:'Điền tính từ sở hữu của he.', hint:'của cậu ấy'});

addSentence('whose-question', 'Whose ball is this?', 'Quả bóng này là của ai?', 1, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('ball','noun','complement','ball','sg'), tok('is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is their ball.', 'Nó là quả bóng của họ.', 1, ['answer', 'possessive'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('their','determiner','det'), tok('ball','noun','complement','ball','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'their', promptVi:'Điền tính từ sở hữu của they.', hint:'của họ'});

addSentence('whose-question', 'Whose shoes are these?', 'Đôi giày này là của ai?', 2, ['question', 'whose', 'plural'],
  [tok('Whose','determiner','det'), tok('shoes','noun','complement','shoe','pl'), tok('are','verb','verb','be','present-other'), tok('these','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'They are my shoes.', 'Chúng là đôi giày của tôi.', 1, ['answer', 'possessive', 'plural'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('my','determiner','det'), tok('shoes','noun','complement','shoe','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'my', promptVi:'Điền tính từ sở hữu của I.', hint:'của tôi'});

addSentence('whose-question', 'Whose pens are those?', 'Những chiếc bút mực kia là của ai?', 2, ['question', 'whose', 'plural'],
  [tok('Whose','determiner','det'), tok('pens','noun','complement','pen','pl'), tok('are','verb','verb','be','present-other'), tok('those','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'They are Peter\'s pens.', 'Chúng là những chiếc bút mực của Peter.', 2, ['answer', 'possessive', 'name', 'plural'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('Peter\'s','noun','det','Peter','sg'), tok('pens','noun','complement','pen','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'Peter\'s', promptVi:'Điền sở hữu cách của Peter.', hint:'Peter + \'s'});

addSentence('whose-question', 'Whose hats are these?', 'Những chiếc mũ này là của ai?', 2, ['question', 'whose', 'plural'],
  [tok('Whose','determiner','det'), tok('hats','noun','complement','hat','pl'), tok('are','verb','verb','be','present-other'), tok('these','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'They are the girls\' hats.', 'Chúng là những chiếc mũ của các bé gái.', 2, ['answer', 'possessive', 'plural'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('the','article','det'), tok('girls\'','noun','det','girl','pl'), tok('hats','noun','complement','hat','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'girls\'', promptVi:'Điền sở hữu cách của danh từ số nhiều girls.', hint:'girls + \''});

addSentence('whose-question', 'Whose puppy is this?', 'Chú cún này là của ai?', 2, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('puppy','noun','complement','puppy','sg'), tok('is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is our puppy.', 'Nó là chú cún của chúng tôi.', 2, ['answer', 'possessive'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('our','determiner','det'), tok('puppy','noun','complement','puppy','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'our', promptVi:'Điền tính từ sở hữu của we.', hint:'của chúng tôi'});

addSentence('whose-question', 'Whose toys are those?', 'Những món đồ chơi kia là của ai?', 2, ['question', 'whose', 'plural'],
  [tok('Whose','determiner','det'), tok('toys','noun','complement','toy','pl'), tok('are','verb','verb','be','present-other'), tok('those','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'They are the baby\'s toys.', 'Chúng là những món đồ chơi của em bé.', 2, ['answer', 'possessive', 'plural'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('the','article','det'), tok('baby\'s','noun','det','baby','sg'), tok('toys','noun','complement','toy','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'baby\'s', promptVi:'Điền sở hữu cách của baby.', hint:'baby + \'s'});

addSentence('whose-question', 'Whose blue bike is that?', 'Chiếc xe đạp màu xanh kia là của ai?', 2, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('blue','adjective','modifier'), tok('bike','noun','complement','bike','sg'), tok('is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is Lan\'s blue bike.', 'Nó là chiếc xe đạp màu xanh của Lan.', 2, ['answer', 'possessive', 'name'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('Lan\'s','noun','det','Lan','sg'), tok('blue','adjective','modifier'), tok('bike','noun','complement','bike','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'Lan\'s', promptVi:'Điền sở hữu cách của Lan.', hint:'Lan + \'s'});

addSentence('whose-question', 'Whose pink umbrella is this?', 'Chiếc ô màu hồng này là của ai?', 2, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('pink','adjective','modifier'), tok('umbrella','noun','complement','umbrella','sg'), tok('is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'complement', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'subject', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is my mother\'s umbrella.', 'Nó là chiếc ô của mẹ tôi.', 2, ['answer', 'possessive', 'family'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('my','determiner','det'), tok('mother\'s','noun','det','mother','sg'), tok('umbrella','noun','complement','umbrella','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'mother\'s', promptVi:'Điền sở hữu cách của mother.', hint:'mother + \'s'});

addSentence('whose-question', 'On the desk whose pencil is this?', 'Ở trên bàn chiếc bút chì này là của ai?', 3, ['question', 'whose', 'school'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('desk','noun','prep-object','desk','sg'), tok('whose','determiner','det'), tok('pencil','noun','complement','pencil','sg'), tok('is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'subject', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'},
  ['Whose pencil is this on the desk?']);

addSentence('whose-question', 'In the yard whose balls are these?', 'Ở trong sân những quả bóng này là của ai?', 3, ['question', 'whose', 'plural'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('yard','noun','prep-object','yard','sg'), tok('whose','determiner','det'), tok('balls','noun','complement','ball','pl'), tok('are','verb','verb','be','present-other'), tok('these','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'subject', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'},
  ['Whose balls are these in the yard?']);

addSentence('whose-question', 'Whose green bag is on the chair?', 'Chiếc cặp màu xanh lá ở trên ghế là của ai?', 3, ['question', 'whose'],
  [tok('Whose','determiner','det'), tok('green','adjective','modifier'), tok('bag','noun','subject','bag','sg'), tok('is','verb','verb','be','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('chair','noun','prep-object','chair','sg'), punctQ],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'});

addSentence('whose-question', 'It is his teacher\'s bag.', 'Nó là chiếc cặp của cô giáo cậu ấy.', 3, ['answer', 'possessive', 'school'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('his','determiner','det'), tok('teacher\'s','noun','det','teacher','sg'), tok('bag','noun','complement','bag','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'teacher\'s', promptVi:'Điền sở hữu cách của teacher.', hint:'teacher + \'s'});

addSentence('whose-question', 'Under the table whose cats are those?', 'Ở dưới gầm bàn những con mèo kia là của ai?', 3, ['question', 'whose', 'plural'],
  [tok('Under','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), tok('whose','determiner','det'), tok('cats','noun','complement','cat','pl'), tok('are','verb','verb','be','present-other'), tok('those','pronoun','subject'), punctQ],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'subject', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'whose', promptVi:'Điền từ để hỏi quyền sở hữu: của ai.', hint:'từ để hỏi: của ai'},
  ['Whose cats are those under the table?']);

addSentence('whose-question', 'They are my grandmother\'s cats.', 'Chúng là những con mèo của bà tôi.', 3, ['answer', 'possessive', 'family', 'plural'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('my','determiner','det'), tok('grandmother\'s','noun','det','grandmother','sg'), tok('cats','noun','complement','cat','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'grandmother\'s', promptVi:'Điền sở hữu cách của grandmother.', hint:'grandmother + \'s'});

console.log(`Total sentences generated: ${sentences.length}`);

// Fix #09 + #10.2 (docs/english-content-fix-list-v3.md): bỏ roles ở câu "there" tồn tại; danh từ số nhiều dùng lemma số ít.
{
  const PLURAL_LEMMA = { parents: 'parent', grandparents: 'grandparent', children: 'child' };
  for (const s of sentences) {
    if (s.tokens.some((t) => t.role === 'expletive'))
      s.exerciseTypes = s.exerciseTypes.filter((x) => x !== 'roles');
    for (const t of s.tokens)
      if (t.pos === 'noun' && t.feature === 'pl' && PLURAL_LEMMA[t.lemma]) t.lemma = PLURAL_LEMMA[t.lemma];
  }
}

// Write sentences
fs.writeFileSync(path.join(DATA_DIR, 'A3.sentences.json'), JSON.stringify(applyContentReviewV4('A3.sentences.json', sentences.map(applyReviewedOrder)), null, 2), 'utf-8');
console.log(`✅ Generated A3.sentences.json with ${sentences.length} sentences (target: 200).`);

// Difficulty distribution
const diffCounts = { 1: 0, 2: 0, 3: 0 };
sentences.forEach(s => { diffCounts[s.difficulty]++; });
console.log(`Difficulty distribution: 1: ${diffCounts[1]} (${(diffCounts[1]/sentences.length*100).toFixed(1)}%), 2: ${diffCounts[2]} (${(diffCounts[2]/sentences.length*100).toFixed(1)}%), 3: ${diffCounts[3]} (${(diffCounts[3]/sentences.length*100).toFixed(1)}%)`);

// -------------------------------------------------------------
// THEORY PAGE: A3.theory.json
// -------------------------------------------------------------
const theory = {
  id: 'A3',
  title: 'Tính từ & Sở hữu (Tính từ sở hữu, Sở hữu cách và Whose)',
  level: 'A3',
  summary: 'Học cách sử dụng tính từ miêu tả (đứng sau to be và trước danh từ), tính từ sở hữu (my, your, his, her, its, our, their), sở hữu cách (\'s và \') và mẫu câu hỏi Whose.',
  formulas: [
    {
      label: 'Tính từ đứng sau To Be',
      pattern: 'S + be (am / is / are) + Adjective',
      example: 'The cat is cute. / My brother is tall.'
    },
    {
      label: 'Tính từ đứng trước Danh từ',
      pattern: 'a / an / the / Đại từ chỉ định + Adjective + Noun',
      example: 'This is a big elephant. / These are sweet apples.'
    },
    {
      label: 'Tính từ sở hữu',
      pattern: 'my / your / his / her / its / our / their + Noun',
      example: 'This is my bag. / Her eyes are blue.'
    },
    {
      label: 'Sở hữu cách (\'s / \')',
      pattern: 'Danh từ số ít + \'s + Noun / Danh từ số nhiều tận cùng s + \' + Noun',
      example: 'Nam\'s bike / the students\' classroom'
    },
    {
      label: 'Câu hỏi sở hữu với Whose',
      pattern: 'Whose + Noun + is this / are these? → It is... / They are...',
      example: 'Whose book is this? → It is my book.'
    }
  ],
  sections: [
    {
      heading: '1. Tính từ miêu tả: Vị trí trong câu',
      body: 'Tính từ dùng để miêu tả đặc điểm, màu sắc, kích thước, cảm xúc của người và sự vật. Trong tiếng Anh, tính từ có hai vị trí cơ bản:\n- Đứng SAU động từ To Be để làm vị ngữ: Subject + am/is/are + Adjective (ví dụ: The sun is hot, His shoes are new).\n- Đứng TRƯỚC danh từ để bổ nghĩa trực tiếp cho danh từ đó (ví dụ: a big elephant, sweet apples).',
      table: {
        columns: ['Vị trí', 'Cấu trúc', 'Ví dụ'],
        rows: [
          ['Sau To Be', 'S + be + Adjective', 'The cat is cute. / My hands are clean.'],
          ['Trước Danh từ', 'a/an/the + Adj + Noun', 'This is a new bike. / These are red balls.']
        ]
      },
      exampleIds: ['A3-s-0001', 'A3-s-0002', 'A3-s-0041', 'A3-s-0046']
    },
    {
      heading: '2. Tính từ sở hữu (Possessive Determiners)',
      body: 'Tính từ sở hữu đứng trước danh từ để chỉ sự vật đó thuộc về ai. Mỗi đại từ nhân xưng có một tính từ sở hữu tương ứng:\n- I → my (của tôi)\n- You → your (của bạn)\n- He → his (của cậu ấy)\n- She → her (của cô ấy)\n- It → its (của nó)\n- We → our (của chúng tôi)\n- They → their (của họ)\nLưu ý: Không nhầm lẫn giữa its (tính từ sở hữu) và it\'s (dạng viết tắt của it is).',
      table: {
        columns: ['Đại từ', 'Tính từ sở hữu', 'Nghĩa', 'Ví dụ'],
        rows: [
          ['I', 'my', 'của tôi', 'This is my bag.'],
          ['You', 'your', 'của bạn', 'Is this your ruler?'],
          ['He', 'his', 'của anh ấy/cậu ấy', 'His car is black.'],
          ['She', 'her', 'của chị ấy/cô ấy', 'Her dress is pink.'],
          ['It', 'its', 'của nó', 'Its tail is short.'],
          ['We', 'our', 'của chúng tôi', 'Our house is big.'],
          ['They', 'their', 'của họ', 'Their car is red.']
        ]
      },
      exampleIds: ['A3-s-0081', 'A3-s-0087', 'A3-s-0093', 'A3-s-0100', 'A3-s-0107', 'A3-s-0113', 'A3-s-0120']
    },
    {
      heading: '3. Sở hữu cách với \'s và \'',
      body: 'Sở hữu cách dùng để thể hiện quyền sở hữu của người hoặc động vật đối với đồ vật hoặc mối quan hệ:\n- Với danh từ số ít hoặc tên riêng: Thêm \'s (ví dụ: Nam\'s bike, my mother\'s bag, the cat\'s tail).\n- Với danh từ số nhiều có đuôi -s: Chỉ cần thêm dấu phẩy trên \' (ví dụ: the students\' classroom, the girls\' hats).\n- Với danh từ số nhiều bất quy tắc (không có đuôi s): Vẫn thêm \'s như số ít (ví dụ: the children\'s toys, the men\'s cars).',
      table: {
        columns: ['Dạng danh từ', 'Quy tắc', 'Ví dụ'],
        rows: [
          ['Số ít / Tên riêng', 'Thêm \'s', 'Nam\'s bike, Tom\'s dog, the teacher\'s desk'],
          ['Số nhiều tận cùng bằng -s', 'Chỉ thêm dấu \'', 'the students\' classroom, the boys\' football'],
          ['Số nhiều bất quy tắc (men, children...)', 'Thêm \'s', 'the children\'s toys, the women\'s bags']
        ]
      },
      exampleIds: ['A3-s-0126', 'A3-s-0127', 'A3-s-0161', 'A3-s-0168']
    },
    {
      heading: '4. Câu hỏi sở hữu với Whose (Của ai)',
      body: 'Từ để hỏi Whose dùng để hỏi về quyền sở hữu (Của ai):\n- Số ít: Whose + danh từ số ít + is this / that? → Trả lời: It is + cụm sở hữu.\n- Số nhiều: Whose + danh từ số nhiều + are these / those? → Trả lời: They are + cụm sở hữu.',
      table: {
        columns: ['Mẫu câu hỏi', 'Cách trả lời', 'Ví dụ'],
        rows: [
          ['Whose + N (số ít) + is this/that?', 'It is [my / his / Nam\'s] N.', 'Whose book is this? → It is my book.'],
          ['Whose + N (số nhiều) + are these/those?', 'They are [my / her / Lan\'s] N.', 'Whose shoes are these? → They are my shoes.']
        ]
      },
      exampleIds: ['A3-s-0171', 'A3-s-0172', 'A3-s-0173', 'A3-s-0174', 'A3-s-0181', 'A3-s-0182']
    }
  ],
  commonMistakes: [
    {
      wrong: "It's tail is long.",
      right: "Its tail is long.",
      why: "Its là tính từ sở hữu (của nó), không có dấu nháy. It's là viết tắt của It is."
    },
    {
      wrong: "I bag is red.",
      right: "My bag is red.",
      why: "Trước danh từ bag phải dùng tính từ sở hữu 'my', không dùng đại từ nhân xưng 'I'."
    },
    {
      wrong: "This is a ball red.",
      right: "This is a red ball.",
      why: "Trong tiếng Anh, tính từ miêu tả đứng TRƯỚC danh từ, ngược lại với tiếng Việt."
    },
    {
      wrong: "The students's classroom",
      right: "The students' classroom",
      why: "Danh từ số nhiều kết thúc bằng 's' chỉ cần thêm dấu nháy đơn ('), không thêm 's."
    }
  ],
  tips: [
    "Vị trí tính từ: Trong tiếng Anh tính từ đứng trước danh từ (a cute cat, a big ball). Hãy nhớ đảo vị trí so với tiếng Việt nhé!",
    "Phân biệt Its và It's: 'Its' là của nó (chỉ quyền sở hữu), còn 'It's' là viết tắt của 'It is'.",
    "Sở hữu cách: Số ít thêm 's (Nam's car), số nhiều có sẵn s chỉ thêm dấu phẩy trên ' (the students' books)."
  ]
};

fs.writeFileSync(path.join(DATA_DIR, 'A3.theory.json'), JSON.stringify(applyContentReviewV4('A3.theory.json', theory), null, 2), 'utf-8');
console.log('✅ Generated A3.theory.json.');
