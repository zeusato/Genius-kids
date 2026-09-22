import { applyContentReviewV4 } from './english-content-review-v4.mjs';
/**
 * scripts/build-k-full.mjs
 * Sinh dữ liệu chuẩn chỉnh cho Track K (mẫu giáo - kindergarten):
 * - K.vocab.json: 125 từ vựng mẫu giáo (image BẮT BUỘC emoji, bảng chữ cái A-Z, số đếm, màu sắc, động vật, thức ăn, cơ thể...)
 * - K.phrases.json: 55 câu khung cực ngắn (2–5 từ) có image emoji và audioHint
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data/english');

// =========================================================================
// 1. TỪ VỰNG K (125 TỪ VỰNG MẪU GIÁO CÓ IMAGE BẮT BUỘC)
// =========================================================================
const rawKVocab = [
  // Bảng chữ cái A - Z (26 từ)
  { en: 'apple', vi: 'quả táo', pos: 'noun', ipa: '/ˈæp.əl/', forms: { plural: 'apples' }, image: '🍎', tags: ['alphabet', 'food', 'letter-a'], exampleEn: 'A is for apple.', exampleVi: 'A là chữ của apple (quả táo).' },
  { en: 'ball', vi: 'quả bóng', pos: 'noun', ipa: '/bɑːl/', forms: { plural: 'balls' }, image: '⚽', tags: ['alphabet', 'toy', 'letter-b'], exampleEn: 'B is for ball.', exampleVi: 'B là chữ của ball (quả bóng).' },
  { en: 'cat', vi: 'con mèo', pos: 'noun', ipa: '/kæt/', forms: { plural: 'cats' }, image: '🐱', tags: ['alphabet', 'animal', 'letter-c'], exampleEn: 'C is for cat.', exampleVi: 'C là chữ của cat (con mèo).' },
  { en: 'dog', vi: 'con chó', pos: 'noun', ipa: '/dɔːɡ/', forms: { plural: 'dogs' }, image: '🐶', tags: ['alphabet', 'animal', 'letter-d'], exampleEn: 'D is for dog.', exampleVi: 'D là chữ của dog (con chó).' },
  { en: 'elephant', vi: 'con voi', pos: 'noun', ipa: '/ˈel.ə.fənt/', forms: { plural: 'elephants' }, image: '🐘', tags: ['alphabet', 'animal', 'letter-e'], exampleEn: 'E is for elephant.', exampleVi: 'E là chữ của elephant (con voi).' },
  { en: 'fish', vi: 'con cá', pos: 'noun', ipa: '/fɪʃ/', forms: { plural: 'fish' }, image: '🐟', tags: ['alphabet', 'animal', 'letter-f'], exampleEn: 'F is for fish.', exampleVi: 'F là chữ của fish (con cá).' },
  { en: 'giraffe', vi: 'hươu cao cổ', pos: 'noun', ipa: '/dʒɪˈræf/', forms: { plural: 'giraffes' }, image: '🦒', tags: ['alphabet', 'animal', 'letter-g'], exampleEn: 'G is for giraffe.', exampleVi: 'G là chữ của giraffe (hươu cao cổ).' },
  { en: 'hat', vi: 'cái mũ', pos: 'noun', ipa: '/hæt/', forms: { plural: 'hats' }, image: '👒', tags: ['alphabet', 'clothes', 'letter-h'], exampleEn: 'H is for hat.', exampleVi: 'H là chữ của hat (cái mũ).' },
  { en: 'ice cream', vi: 'cây kem', pos: 'noun', ipa: '/ˈaɪs ˌkriːm/', forms: { plural: 'ice creams' }, image: '🍦', tags: ['alphabet', 'food', 'letter-i'], exampleEn: 'I is for ice cream.', exampleVi: 'I là chữ của ice cream (cây kem).' },
  { en: 'juice', vi: 'nước ép', pos: 'noun', ipa: '/dʒuːs/', forms: { plural: 'juices' }, image: '🧃', tags: ['alphabet', 'drink', 'letter-j'], exampleEn: 'J is for juice.', exampleVi: 'J là chữ của juice (nước ép).' },
  { en: 'kite', vi: 'cái diều', pos: 'noun', ipa: '/kaɪt/', forms: { plural: 'kites' }, image: '🪁', tags: ['alphabet', 'toy', 'letter-k'], exampleEn: 'K is for kite.', exampleVi: 'K là chữ của kite (cái diều).' },
  { en: 'lion', vi: 'sư tử', pos: 'noun', ipa: '/ˈlaɪ.ən/', forms: { plural: 'lions' }, image: '🦁', tags: ['alphabet', 'animal', 'letter-l'], exampleEn: 'L is for lion.', exampleVi: 'L là chữ của lion (sư tử).' },
  { en: 'monkey', vi: 'con khỉ', pos: 'noun', ipa: '/ˈmʌŋ.ki/', forms: { plural: 'monkeys' }, image: '🐵', tags: ['alphabet', 'animal', 'letter-m'], exampleEn: 'M is for monkey.', exampleVi: 'M là chữ của monkey (con khỉ).' },
  { en: 'nest', vi: 'cái tổ chim', pos: 'noun', ipa: '/nest/', forms: { plural: 'nests' }, image: '🪺', tags: ['alphabet', 'nature', 'letter-n'], exampleEn: 'N is for nest.', exampleVi: 'N là chữ của nest (tổ chim).' },
  { en: 'orange', vi: 'quả cam', pos: 'noun', ipa: '/ˈɔːr.ɪndʒ/', forms: { plural: 'oranges' }, image: '🍊', tags: ['alphabet', 'food', 'letter-o'], exampleEn: 'O is for orange.', exampleVi: 'O là chữ của orange (quả cam).' },
  { en: 'pig', vi: 'con lợn, con heo', pos: 'noun', ipa: '/pɪɡ/', forms: { plural: 'pigs' }, image: '🐷', tags: ['alphabet', 'animal', 'letter-p'], exampleEn: 'P is for pig.', exampleVi: 'P là chữ của pig (con heo).' },
  { en: 'queen', vi: 'nữ hoàng', pos: 'noun', ipa: '/kwiːn/', forms: { plural: 'queens' }, image: '👸', tags: ['alphabet', 'people', 'letter-q'], exampleEn: 'Q is for queen.', exampleVi: 'Q là chữ của queen (nữ hoàng).' },
  { en: 'rabbit', vi: 'con thỏ', pos: 'noun', ipa: '/ˈræb.ɪt/', forms: { plural: 'rabbits' }, image: '🐰', tags: ['alphabet', 'animal', 'letter-r'], exampleEn: 'R is for rabbit.', exampleVi: 'R là chữ của rabbit (con thỏ).' },
  { en: 'sun', vi: 'mặt trời', pos: 'noun', ipa: '/sʌn/', forms: { plural: 'suns' }, image: '☀️', tags: ['alphabet', 'nature', 'letter-s'], exampleEn: 'S is for sun.', exampleVi: 'S là chữ của sun (mặt trời).' },
  { en: 'tiger', vi: 'con hổ', pos: 'noun', ipa: '/ˈtaɪ.ɡɚ/', forms: { plural: 'tigers' }, image: '🐯', tags: ['alphabet', 'animal', 'letter-t'], exampleEn: 'T is for tiger.', exampleVi: 'T là chữ của tiger (con hổ).' },
  { en: 'umbrella', vi: 'cái ô, cây dù', pos: 'noun', ipa: '/ʌmˈbrel.ə/', forms: { plural: 'umbrellas' }, image: '☂️', tags: ['alphabet', 'things', 'letter-u'], exampleEn: 'U is for umbrella.', exampleVi: 'U là chữ của umbrella (cái ô).' },
  { en: 'violin', vi: 'đàn vĩ cầm', pos: 'noun', ipa: '/ˌvaɪəˈlɪn/', forms: { plural: 'violins' }, image: '🎻', tags: ['alphabet', 'music', 'letter-v'], exampleEn: 'V is for violin.', exampleVi: 'V là chữ của violin (đàn vĩ cầm).' },
  { en: 'water', vi: 'nước uống', pos: 'noun', ipa: '/ˈwɑː.t̬ɚ/', image: '💧', tags: ['alphabet', 'drink', 'letter-w'], exampleEn: 'W is for water.', exampleVi: 'W là chữ của water (nước).' },
  { en: 'xylophone', vi: 'mộc cầm', pos: 'noun', ipa: '/ˈzaɪ.lə.foʊn/', forms: { plural: 'xylophones' }, image: '🎵', tags: ['alphabet', 'music', 'letter-x'], exampleEn: 'X is for xylophone.', exampleVi: 'X là chữ của xylophone (mộc cầm).' },
  { en: 'yo-yo', vi: 'con quay yo-yo', pos: 'noun', ipa: '/ˈjoʊ.joʊ/', forms: { plural: 'yo-yos' }, image: '🪀', tags: ['alphabet', 'toy', 'letter-y'], exampleEn: 'Y is for yo-yo.', exampleVi: 'Y là chữ của yo-yo (con quay yo-yo).' },
  { en: 'zebra', vi: 'ngựa vằn', pos: 'noun', ipa: '/ˈziː.brə/', forms: { plural: 'zebras' }, image: '🦓', tags: ['alphabet', 'animal', 'letter-z'], exampleEn: 'Z is for zebra.', exampleVi: 'Z là chữ của zebra (ngựa vằn).' },

  // Số đếm 1 - 10 (10 từ)
  { en: 'one', vi: 'số một', pos: 'numeral', ipa: '/wʌn/', image: '1️⃣', tags: ['number'], exampleEn: 'I see one cat.', exampleVi: 'Tôi thấy một con mèo.' },
  { en: 'two', vi: 'số hai', pos: 'numeral', ipa: '/tuː/', image: '2️⃣', tags: ['number'], exampleEn: 'I have two eyes.', exampleVi: 'Tôi có hai mắt.' },
  { en: 'three', vi: 'số ba', pos: 'numeral', ipa: '/θriː/', image: '3️⃣', tags: ['number'], exampleEn: 'Three little birds sing.', exampleVi: 'Ba chú chim nhỏ đang hót.' },
  { en: 'four', vi: 'số bốn', pos: 'numeral', ipa: '/fɔːr/', image: '4️⃣', tags: ['number'], exampleEn: 'Four legs on a dog.', exampleVi: 'Bốn cái chân trên một con chó.' },
  { en: 'five', vi: 'số năm', pos: 'numeral', ipa: '/faɪv/', image: '5️⃣', tags: ['number'], exampleEn: 'I have five fingers.', exampleVi: 'Tôi có năm ngón tay.' },
  { en: 'six', vi: 'số sáu', pos: 'numeral', ipa: '/sɪks/', image: '6️⃣', tags: ['number'], exampleEn: 'Six colorful balls bounce.', exampleVi: 'Sáu quả bóng nhiều màu nảy tưng tưng.' },
  { en: 'seven', vi: 'số bảy', pos: 'numeral', ipa: '/ˈsev.ən/', image: '7️⃣', tags: ['number'], exampleEn: 'Seven stars in the sky.', exampleVi: 'Bảy vì sao trên bầu trời.' },
  { en: 'eight', vi: 'số tám', pos: 'numeral', ipa: '/eɪt/', image: '8️⃣', tags: ['number'], exampleEn: 'An octopus has eight legs.', exampleVi: 'Bạch tuộc có tám xúc tu.' },
  { en: 'nine', vi: 'số chín', pos: 'numeral', ipa: '/naɪn/', image: '9️⃣', tags: ['number'], exampleEn: 'Nine red apples on tree.', exampleVi: 'Chín quả táo đỏ trên cây.' },
  { en: 'ten', vi: 'số mười', pos: 'numeral', ipa: '/ten/', image: '🔟', tags: ['number'], exampleEn: 'I have ten toes.', exampleVi: 'Tôi có mười ngón chân.' },

  // Màu sắc cơ bản (10 từ)
  { en: 'red', vi: 'màu đỏ', pos: 'adjective', ipa: '/red/', image: '🔴', tags: ['color'], exampleEn: 'It is red.', exampleVi: 'Nó màu đỏ.' },
  { en: 'blue', vi: 'màu xanh dương', pos: 'adjective', ipa: '/bluː/', image: '🔵', tags: ['color'], exampleEn: 'The sky is blue.', exampleVi: 'Bầu trời màu xanh dương.' },
  { en: 'yellow', vi: 'màu vàng', pos: 'adjective', ipa: '/ˈjel.oʊ/', image: '🟡', tags: ['color'], exampleEn: 'The banana is yellow.', exampleVi: 'Quả chuối màu vàng.' },
  { en: 'green', vi: 'màu xanh lá', pos: 'adjective', ipa: '/ɡriːn/', image: '🟢', tags: ['color'], exampleEn: 'Grass is green.', exampleVi: 'Cỏ màu xanh lá.' },
  { en: 'pink', vi: 'màu hồng', pos: 'adjective', ipa: '/pɪŋk/', image: '🌸', tags: ['color'], exampleEn: 'She has a pink dress.', exampleVi: 'Cô bé có chiếc váy hồng.' },
  { en: 'purple', vi: 'màu tím', pos: 'adjective', ipa: '/ˈpɝː.pəl/', image: '🟣', tags: ['color'], exampleEn: 'I like purple grapes.', exampleVi: 'Tôi thích nho tím.' },
  { en: 'black', vi: 'màu đen', pos: 'adjective', ipa: '/blæk/', image: '⚫', tags: ['color'], exampleEn: 'A black cat sleeps.', exampleVi: 'Một chú mèo đen đang ngủ.' },
  { en: 'white', vi: 'màu trắng', pos: 'adjective', ipa: '/waɪt/', image: '⚪', tags: ['color'], exampleEn: 'The snow is white.', exampleVi: 'Tuyết màu trắng.' },
  { en: 'brown', vi: 'màu nâu', pos: 'adjective', ipa: '/braʊn/', image: '🟤', tags: ['color'], exampleEn: 'The bear is brown.', exampleVi: 'Con gấu màu nâu.' },
  { en: 'gray', vi: 'màu xám', pos: 'adjective', ipa: '/ɡreɪ/', image: '🔘', tags: ['color'], exampleEn: 'The elephant is gray.', exampleVi: 'Con voi màu xám.' },

  // Con vật gần gũi (15 từ)
  { en: 'duck', vi: 'con vịt', pos: 'noun', ipa: '/dʌk/', forms: { plural: 'ducks' }, image: '🦆', tags: ['animal'], exampleEn: 'The duck swims.', exampleVi: 'Con vịt bơi.' },
  { en: 'cow', vi: 'con bò', pos: 'noun', ipa: '/kaʊ/', forms: { plural: 'cows' }, image: '🐮', tags: ['animal'], exampleEn: 'The cow says moo.', exampleVi: 'Con bò kêu úm bò.' },
  { en: 'bear', vi: 'con gấu', pos: 'noun', ipa: '/ber/', forms: { plural: 'bears' }, image: '🐻', tags: ['animal'], exampleEn: 'The bear eats honey.', exampleVi: 'Con gấu ăn mật ong.' },
  { en: 'frog', vi: 'con ếch', pos: 'noun', ipa: '/frɑːɡ/', forms: { plural: 'frogs' }, image: '🐸', tags: ['animal'], exampleEn: 'The green frog hops.', exampleVi: 'Chú ếch xanh nhảy tót.' },
  { en: 'mouse', vi: 'con chuột', pos: 'noun', ipa: '/maʊs/', forms: { plural: 'mice' }, image: '🐭', tags: ['animal'], exampleEn: 'The mouse is tiny.', exampleVi: 'Chú chuột bé xíu.' },
  { en: 'sheep', vi: 'con cừu', pos: 'noun', ipa: '/ʃiːp/', forms: { plural: 'sheep' }, image: '🐑', tags: ['animal'], exampleEn: 'The white sheep runs.', exampleVi: 'Chú cừu trắng chạy lon ton.' },
  { en: 'horse', vi: 'con ngựa', pos: 'noun', ipa: '/hɔːrs/', forms: { plural: 'horses' }, image: '🐴', tags: ['animal'], exampleEn: 'The horse runs fast.', exampleVi: 'Con ngựa chạy nhanh.' },
  { en: 'chicken', vi: 'con gà', pos: 'noun', ipa: '/ˈtʃɪk.ɪn/', forms: { plural: 'chickens' }, image: '🐔', tags: ['animal'], exampleEn: 'The chicken pecks seeds.', exampleVi: 'Con gà mổ thóc.' },
  { en: 'bee', vi: 'con ong', pos: 'noun', ipa: '/biː/', forms: { plural: 'bees' }, image: '🐝', tags: ['animal'], exampleEn: 'The busy bee buzzes.', exampleVi: 'Chú ong chăm chỉ bay vo ve.' },
  { en: 'butterfly', vi: 'con bướm', pos: 'noun', ipa: '/ˈbʌt̬.ɚ.flaɪ/', forms: { plural: 'butterflies' }, image: '🦋', tags: ['animal'], exampleEn: 'A butterfly on flower.', exampleVi: 'Một chú bướm trên hoa.' },
  { en: 'turtle', vi: 'con rùa', pos: 'noun', ipa: '/ˈtɝː.t̬əl/', forms: { plural: 'turtles' }, image: '🐢', tags: ['animal'], exampleEn: 'The slow turtle walks.', exampleVi: 'Chú rùa chậm chạp bước đi.' },
  { en: 'spider', vi: 'con nhện', pos: 'noun', ipa: '/ˈspaɪ.dɚ/', forms: { plural: 'spiders' }, image: '🕷️', tags: ['animal'], exampleEn: 'The tiny spider climbs.', exampleVi: 'Chú nhện bé xíu bò lên.' },
  { en: 'panda', vi: 'gấu trúc', pos: 'noun', ipa: '/ˈpæn.də/', forms: { plural: 'pandas' }, image: '🐼', tags: ['animal'], exampleEn: 'The panda eats bamboo.', exampleVi: 'Gấu trúc ăn lá tre.' },
  { en: 'whale', vi: 'cá voi', pos: 'noun', ipa: '/weɪl/', forms: { plural: 'whales' }, image: '🐋', tags: ['animal'], exampleEn: 'The big blue whale.', exampleVi: 'Chú cá voi xanh to lớn.' },
  { en: 'penguin', vi: 'chim cánh cụt', pos: 'noun', ipa: '/ˈpeŋ.ɡwɪn/', forms: { plural: 'penguins' }, image: '🐧', tags: ['animal'], exampleEn: 'The cute penguin waddles.', exampleVi: 'Chú chim cánh cụt lắc lư.' },

  // Gia đình & Con người (10 từ)
  { en: 'baby', vi: 'em bé', pos: 'noun', ipa: '/ˈbeɪ.bi/', forms: { plural: 'babies' }, image: '👶', tags: ['family'], exampleEn: 'The baby sleeps peacefully.', exampleVi: 'Em bé ngủ ngoan.' },
  { en: 'boy', vi: 'bé trai, cậu bé', pos: 'noun', ipa: '/bɔɪ/', forms: { plural: 'boys' }, image: '👦', tags: ['people'], exampleEn: 'He is a boy.', exampleVi: 'Cậu ấy là một cậu bé.' },
  { en: 'girl', vi: 'bé gái, cô bé', pos: 'noun', ipa: '/ɡɝːl/', forms: { plural: 'girls' }, image: '👧', tags: ['people'], exampleEn: 'She is a girl.', exampleVi: 'Cô ấy là một bé gái.' },
  { en: 'mom', vi: 'mẹ', pos: 'noun', ipa: '/mɑːm/', forms: { plural: 'moms' }, image: '👩', tags: ['family'], exampleEn: 'I love my mom.', exampleVi: 'Tôi yêu mẹ tôi.' },
  { en: 'dad', vi: 'bố, ba', pos: 'noun', ipa: '/dæd/', forms: { plural: 'dads' }, image: '👨', tags: ['family'], exampleEn: 'Dad plays with me.', exampleVi: 'Bố chơi cùng tôi.' },
  { en: 'sister', vi: 'chị/em gái', pos: 'noun', ipa: '/ˈsɪs.tɚ/', forms: { plural: 'sisters' }, image: '👧', tags: ['family'], exampleEn: 'My sister is cute.', exampleVi: 'Em gái tôi rất đáng yêu.' },
  { en: 'brother', vi: 'anh/em trai', pos: 'noun', ipa: '/ˈbrʌð.ɚ/', forms: { plural: 'brothers' }, image: '👦', tags: ['family'], exampleEn: 'My brother is tall.', exampleVi: 'Anh trai tôi cao.' },
  { en: 'grandma', vi: 'bà', pos: 'noun', ipa: '/ˈɡræn.mɑː/', forms: { plural: 'grandmas' }, image: '👵', tags: ['family'], exampleEn: 'Grandma tells sweet stories.', exampleVi: 'Bà kể những câu chuyện ngọt ngào.' },
  { en: 'grandpa', vi: 'ông', pos: 'noun', ipa: '/ˈɡræn.pɑː/', forms: { plural: 'grandpas' }, image: '👴', tags: ['family'], exampleEn: 'Grandpa smiles warmly.', exampleVi: 'Ông mỉm cười ấm áp.' },
  { en: 'friend', vi: 'người bạn', pos: 'noun', ipa: '/frend/', forms: { plural: 'friends' }, image: '🧑‍🤝‍🧑', tags: ['people'], exampleEn: 'You are my friend.', exampleVi: 'Bạn là bạn của tôi.' },

  // Đồ ăn & Trái cây (15 từ)
  { en: 'banana', vi: 'quả chuối', pos: 'noun', ipa: '/bəˈnæn.ə/', forms: { plural: 'bananas' }, image: '🍌', tags: ['food'], exampleEn: 'I eat sweet banana.', exampleVi: 'Tôi ăn quả chuối ngọt.' },
  { en: 'bread', vi: 'bánh mì', pos: 'noun', ipa: '/bred/', image: '🍞', tags: ['food'], exampleEn: 'Bread is soft.', exampleVi: 'Bánh mì mềm.' },
  { en: 'milk', vi: 'sữa', pos: 'noun', ipa: '/mɪlk/', image: '🥛', tags: ['drink'], exampleEn: 'Drink warm milk.', exampleVi: 'Hãy uống sữa ấm.' },
  { en: 'egg', vi: 'quả trứng', pos: 'noun', ipa: '/eɡ/', forms: { plural: 'eggs' }, image: '🥚', tags: ['food'], exampleEn: 'One fresh round egg.', exampleVi: 'Một quả trứng tròn tươi.' },
  { en: 'cake', vi: 'chiếc bánh ngọt', pos: 'noun', ipa: '/keɪk/', forms: { plural: 'cakes' }, image: '🎂', tags: ['food'], exampleEn: 'A sweet birthday cake.', exampleVi: 'Một chiếc bánh sinh nhật ngọt ngào.' },
  { en: 'rice', vi: 'cơm, gạo', pos: 'noun', ipa: '/raɪs/', image: '🍚', tags: ['food'], exampleEn: 'I eat warm rice.', exampleVi: 'Tôi ăn cơm nóng.' },
  { en: 'candy', vi: 'kẹo ngọt', pos: 'noun', ipa: '/ˈkæn.di/', forms: { plural: 'candies' }, image: '🍬', tags: ['food'], exampleEn: 'A sweet pink candy.', exampleVi: 'Một viên kẹo hồng ngọt.' },
  { en: 'cheese', vi: 'phô mai', pos: 'noun', ipa: '/tʃiːz/', image: '🧀', tags: ['food'], exampleEn: 'Mice like yellow cheese.', exampleVi: 'Chuột thích phô mai vàng.' },
  { en: 'cookie', vi: 'bánh quy', pos: 'noun', ipa: '/ˈkʊk.i/', forms: { plural: 'cookies' }, image: '🍪', tags: ['food'], exampleEn: 'One crunchy chocolate cookie.', exampleVi: 'Một chiếc bánh quy sô-cô-la giòn.' },
  { en: 'pizza', vi: 'bánh pi-da', pos: 'noun', ipa: '/ˈpiːt.sə/', forms: { plural: 'pizzas' }, image: '🍕', tags: ['food'], exampleEn: 'Hot tasty cheese pizza.', exampleVi: 'Bánh pi-da phô mai thơm ngon.' },
  { en: 'grape', vi: 'quả nho', pos: 'noun', ipa: '/ɡreɪp/', forms: { plural: 'grapes' }, image: '🍇', tags: ['food'], exampleEn: 'Sweet purple grapes.', exampleVi: 'Những quả nho tím ngọt.' },
  { en: 'mango', vi: 'quả xoài', pos: 'noun', ipa: '/ˈmæŋ.ɡoʊ/', forms: { plural: 'mangoes' }, image: '🥭', tags: ['food'], exampleEn: 'Ripe yellow sweet mango.', exampleVi: 'Quả xoài vàng chín ngọt.' },
  { en: 'strawberry', vi: 'quả dâu tây', pos: 'noun', ipa: '/ˈstrɑːˌber.i/', forms: { plural: 'strawberries' }, image: '🍓', tags: ['food'], exampleEn: 'Red sweet juicy strawberry.', exampleVi: 'Quả dâu tây đỏ mọng ngọt.' },
  { en: 'watermelon', vi: 'quả dưa hấu', pos: 'noun', ipa: '/ˈwɑː.t̬ɚˌmel.ən/', forms: { plural: 'watermelons' }, image: '🍉', tags: ['food'], exampleEn: 'Big cool green watermelon.', exampleVi: 'Quả dưa hấu to mát màu xanh.' },
  { en: 'carrot', vi: 'củ cà rốt', pos: 'noun', ipa: '/ˈker.ət/', forms: { plural: 'carrots' }, image: '🥕', tags: ['food'], exampleEn: 'Rabbits love orange carrot.', exampleVi: 'Thỏ thích củ cà rốt cam.' },

  // Bộ phận cơ thể (10 từ)
  { en: 'eye', vi: 'mắt', pos: 'noun', ipa: '/aɪ/', forms: { plural: 'eyes' }, image: '👁️', tags: ['body'], exampleEn: 'I see with eyes.', exampleVi: 'Tôi nhìn bằng mắt.' },
  { en: 'ear', vi: 'tai', pos: 'noun', ipa: '/ɪr/', forms: { plural: 'ears' }, image: '👂', tags: ['body'], exampleEn: 'I hear with ears.', exampleVi: 'Tôi nghe bằng tai.' },
  { en: 'nose', vi: 'mũi', pos: 'noun', ipa: '/noʊz/', forms: { plural: 'noses' }, image: '👃', tags: ['body'], exampleEn: 'Touch your little nose.', exampleVi: 'Chạm vào chiếc mũi nhỏ của bạn.' },
  { en: 'mouth', vi: 'miệng', pos: 'noun', ipa: '/maʊθ/', forms: { plural: 'mouths' }, image: '👄', tags: ['body'], exampleEn: 'Open your mouth wide.', exampleVi: 'Hãy mở rộng miệng nào.' },
  { en: 'hand', vi: 'bàn tay', pos: 'noun', ipa: '/hænd/', forms: { plural: 'hands' }, image: '✋', tags: ['body'], exampleEn: 'Clap your hands together.', exampleVi: 'Hãy vỗ hai tay cùng nhau.' },
  { en: 'foot', vi: 'bàn chân', pos: 'noun', ipa: '/fʊt/', forms: { plural: 'feet' }, image: '🦶', tags: ['body'], exampleEn: 'Stomp your little feet.', exampleVi: 'Dậm bàn chân nhỏ của bạn.' },
  { en: 'head', vi: 'cái đầu', pos: 'noun', ipa: '/hed/', forms: { plural: 'heads' }, image: '👤', tags: ['body'], exampleEn: 'Nod your head yes.', exampleVi: 'Gật đầu đồng ý nào.' },
  { en: 'arm', vi: 'cánh tay', pos: 'noun', ipa: '/ɑːrm/', forms: { plural: 'arms' }, image: '💪', tags: ['body'], exampleEn: 'Raise your two arms.', exampleVi: 'Giơ hai cánh tay lên.' },
  { en: 'leg', vi: 'cái chân', pos: 'noun', ipa: '/leɡ/', forms: { plural: 'legs' }, image: '🦵', tags: ['body'], exampleEn: 'Two strong little legs.', exampleVi: 'Hai cái chân nhỏ khỏe mạnh.' },
  { en: 'finger', vi: 'ngón tay', pos: 'noun', ipa: '/ˈfɪŋ.ɡɚ/', forms: { plural: 'fingers' }, image: '☝️', tags: ['body'], exampleEn: 'Wiggle your ten fingers.', exampleVi: 'Ngọ nguậy mười ngón tay nào.' },

  // Đồ chơi & Đồ vật (10 từ)
  { en: 'doll', vi: 'búp bê', pos: 'noun', ipa: '/dɑːl/', forms: { plural: 'dolls' }, image: '🪆', tags: ['toy'], exampleEn: 'A pretty smiling doll.', exampleVi: 'Một cô búp bê mỉm cười xinh xắn.' },
  { en: 'car', vi: 'ô tô đồ chơi', pos: 'noun', ipa: '/kɑːr/', forms: { plural: 'cars' }, image: '🚗', tags: ['toy'], exampleEn: 'The red toy car.', exampleVi: 'Chiếc ô tô đồ chơi màu đỏ.' },
  { en: 'teddy bear', vi: 'gấu bông', pos: 'noun', ipa: '/ˈted.i ˌber/', forms: { plural: 'teddy bears' }, image: '🧸', tags: ['toy'], exampleEn: 'My soft teddy bear.', exampleVi: 'Chú gấu bông êm ái của tôi.' },
  { en: 'balloon', vi: 'quả bóng bay', pos: 'noun', ipa: '/bəˈluːn/', forms: { plural: 'balloons' }, image: '🎈', tags: ['toy'], exampleEn: 'A big red balloon.', exampleVi: 'Một quả bóng bay to màu đỏ.' },
  { en: 'robot', vi: 'người máy', pos: 'noun', ipa: '/ˈroʊ.bɑːt/', forms: { plural: 'robots' }, image: '🤖', tags: ['toy'], exampleEn: 'The shiny blue robot.', exampleVi: 'Chú người máy màu xanh sáng bóng.' },
  { en: 'train', vi: 'tàu hỏa đồ chơi', pos: 'noun', ipa: '/treɪn/', forms: { plural: 'trains' }, image: '🚂', tags: ['toy'], exampleEn: 'Choo choo goes train.', exampleVi: 'Tu tu xình xịch đoàn tàu chạy.' },
  { en: 'boat', vi: 'con thuyền', pos: 'noun', ipa: '/boʊt/', forms: { plural: 'boats' }, image: '⛵', tags: ['toy'], exampleEn: 'The toy boat floats.', exampleVi: 'Chiếc thuyền đồ chơi trôi nổi.' },
  { en: 'plane', vi: 'máy bay', pos: 'noun', ipa: '/pleɪn/', forms: { plural: 'planes' }, image: '✈️', tags: ['toy'], exampleEn: 'The toy plane flies.', exampleVi: 'Chiếc máy bay đồ chơi bay lượn.' },
  { en: 'drum', vi: 'cái trống', pos: 'noun', ipa: '/drʌm/', forms: { plural: 'drums' }, image: '🥁', tags: ['music'], exampleEn: 'Beat the loud drum.', exampleVi: 'Đánh vang chiếc trống.' },
  { en: 'bell', vi: 'chiếc chuông', pos: 'noun', ipa: '/bel/', forms: { plural: 'bells' }, image: '🔔', tags: ['things'], exampleEn: 'The golden bell rings.', exampleVi: 'Chiếc chuông vàng reo vang.' },

  // Hành động đơn giản (9 từ)
  { en: 'run', vi: 'chạy', pos: 'verb', ipa: '/rʌn/', forms: { thirdSg: 'runs', past: 'ran', ing: 'running', irregular: true }, image: '🏃', tags: ['action'], exampleEn: 'I run very fast.', exampleVi: 'Tôi chạy rất nhanh.' },
  { en: 'jump', vi: 'nhảy', pos: 'verb', ipa: '/dʒʌmp/', forms: { thirdSg: 'jumps', past: 'jumped', ing: 'jumping', irregular: false }, image: '🦘', tags: ['action'], exampleEn: 'Jump up high now.', exampleVi: 'Hãy nhảy cao lên nào.' },
  { en: 'walk', vi: 'đi bộ', pos: 'verb', ipa: '/wɑːk/', forms: { thirdSg: 'walks', past: 'walked', ing: 'walking', irregular: false }, image: '🚶', tags: ['action'], exampleEn: 'We walk to school.', exampleVi: 'Chúng tôi đi bộ đến trường.' },
  { en: 'sleep', vi: 'ngủ', pos: 'verb', ipa: '/sliːp/', forms: { thirdSg: 'sleeps', past: 'slept', ing: 'sleeping', irregular: true }, image: '😴', tags: ['action'], exampleEn: 'Babies sleep so sweet.', exampleVi: 'Các em bé ngủ thật ngoan.' },
  { en: 'eat', vi: 'ăn', pos: 'verb', ipa: '/iːt/', forms: { thirdSg: 'eats', past: 'ate', ing: 'eating', irregular: true }, image: '🍽️', tags: ['action'], exampleEn: 'I eat sweet fruit.', exampleVi: 'Tôi ăn trái cây ngọt.' },
  { en: 'drink', vi: 'uống', pos: 'verb', ipa: '/drɪŋk/', forms: { thirdSg: 'drinks', past: 'drank', ing: 'drinking', irregular: true }, image: '🥤', tags: ['action'], exampleEn: 'Drink clean fresh water.', exampleVi: 'Hãy uống nước lọc sạch.' },
  { en: 'clap', vi: 'vỗ tay', pos: 'verb', ipa: '/klæp/', forms: { thirdSg: 'claps', past: 'clapped', ing: 'clapping', irregular: false }, image: '👏', tags: ['action'], exampleEn: 'Clap your two hands.', exampleVi: 'Hãy vỗ hai tay nào.' },
  { en: 'dance', vi: 'nhảy múa', pos: 'verb', ipa: '/dæns/', forms: { thirdSg: 'dances', past: 'danced', ing: 'dancing', irregular: false }, image: '💃', tags: ['action'], exampleEn: 'We dance and sing.', exampleVi: 'Chúng tôi múa và hát.' },
  { en: 'smile', vi: 'mỉm cười', pos: 'verb', ipa: '/smaɪl/', forms: { thirdSg: 'smiles', past: 'smiled', ing: 'smiling', irregular: false }, image: '😊', tags: ['action'], exampleEn: 'Smile big and bright.', exampleVi: 'Hãy mỉm cười thật rạng rỡ.' },

  // Đồ dùng & Thiên nhiên gần gũi (11 từ)
  { en: 'book', vi: 'quyển sách', pos: 'noun', ipa: '/bʊk/', forms: { plural: 'books' }, image: '📖', tags: ['school'], exampleEn: 'Open your story book.', exampleVi: 'Hãy mở cuốn sách truyện ra.' },
  { en: 'pencil', vi: 'bút chì', pos: 'noun', ipa: '/ˈpen.səl/', forms: { plural: 'pencils' }, image: '✏️', tags: ['school'], exampleEn: 'Draw with yellow pencil.', exampleVi: 'Vẽ bằng bút chì vàng.' },
  { en: 'bag', vi: 'chiếc cặp, túi xách', pos: 'noun', ipa: '/bæɡ/', forms: { plural: 'bags' }, image: '🎒', tags: ['school'], exampleEn: 'My small school bag.', exampleVi: 'Chiếc cặp đi học nhỏ của tôi.' },
  { en: 'door', vi: 'cửa ra vào', pos: 'noun', ipa: '/dɔːr/', forms: { plural: 'doors' }, image: '🚪', tags: ['house'], exampleEn: 'Please knock on door.', exampleVi: 'Làm ơn gõ cửa nhé.' },
  { en: 'window', vi: 'cửa sổ', pos: 'noun', ipa: '/ˈwɪn.doʊ/', forms: { plural: 'windows' }, image: '🪟', tags: ['house'], exampleEn: 'Look out the window.', exampleVi: 'Hãy nhìn ra ngoài cửa sổ.' },
  { en: 'tree', vi: 'cái cây', pos: 'noun', ipa: '/triː/', forms: { plural: 'trees' }, image: '🌳', tags: ['nature'], exampleEn: 'A big green tree.', exampleVi: 'Một cái cây xanh to lớn.' },
  { en: 'flower', vi: 'bông hoa', pos: 'noun', ipa: '/ˈflaʊ.ɚ/', forms: { plural: 'flowers' }, image: '🌸', tags: ['nature'], exampleEn: 'A pretty red flower.', exampleVi: 'Một bông hoa đỏ xinh.' },
  { en: 'star', vi: 'ngôi sao', pos: 'noun', ipa: '/stɑːr/', forms: { plural: 'stars' }, image: '⭐', tags: ['nature'], exampleEn: 'A shiny gold star.', exampleVi: 'Một ngôi sao vàng lấp lánh.' },
  { en: 'moon', vi: 'mặt trăng', pos: 'noun', ipa: '/muːn/', image: '🌙', tags: ['nature'], exampleEn: 'The round bright moon.', exampleVi: 'Mặt trăng tròn sáng ngời.' },
  { en: 'rain', vi: 'cơn mưa', pos: 'noun', ipa: '/reɪn/', image: '🌧️', tags: ['weather'], exampleEn: 'Pitter patter goes rain.', exampleVi: 'Mưa rơi tí tách tí tách.' },
  { en: 'cloud', vi: 'đám mây', pos: 'noun', ipa: '/klaʊd/', forms: { plural: 'clouds' }, image: '☁️', tags: ['weather'], exampleEn: 'A fluffy white cloud.', exampleVi: 'Một đám mây trắng bồng bềnh.' }
];

console.log(`Checking K vocab duplicates... Total vocab: ${rawKVocab.length}`);
const seenKEn = new Set();
for (const v of rawKVocab) {
  if (seenKEn.has(v.en.toLowerCase())) {
    throw new Error(`Duplicate K vocab detected: "${v.en}"`);
  }
  seenKEn.add(v.en.toLowerCase());
}

const kVocab = rawKVocab.map((item, idx) => {
  const idNum = String(idx + 1).padStart(4, '0');
  return {
    id: `K-v-${idNum}`,
    level: 'K',
    topic: 'kindergarten',
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

fs.writeFileSync(path.join(DATA_DIR, 'K.vocab.json'), JSON.stringify(applyContentReviewV4('K.vocab.json', kVocab), null, 2), 'utf-8');
console.log(`✅ Generated K.vocab.json with ${kVocab.length} words (target ≥ 120).`);

// =========================================================================
// 2. CÂU KHUNG NGẮN K (55 CÂU TRONG K.phrases.json)
// =========================================================================
const rawPhrases = [
  { en: 'Hello!', vi: 'Xin chào!', image: '👋', tags: ['greeting'] },
  { en: 'Good morning!', vi: 'Chào buổi sáng!', image: '🌅', tags: ['greeting'] },
  { en: 'Good afternoon!', vi: 'Chào buổi chiều!', image: '☀️', tags: ['greeting'] },
  { en: 'Good night!', vi: 'Chúc ngủ ngon!', image: '🌙', tags: ['greeting'] },
  { en: 'Goodbye!', vi: 'Tạm biệt!', image: '👋', tags: ['greeting'] },
  { en: 'Thank you!', vi: 'Cảm ơn bạn!', image: '🙏', tags: ['politeness'] },
  { en: 'You are welcome!', vi: 'Không có chi!', image: '😊', tags: ['politeness'] },
  { en: 'How are you?', vi: 'Bạn khỏe không?', image: '😃', tags: ['greeting'] },
  { en: 'I am fine.', vi: 'Tôi khỏe.', image: '😄', tags: ['feeling'] },
  { en: 'I am happy.', vi: 'Tôi vui vẻ.', image: '😊', tags: ['feeling'] },
  { en: 'I am hungry.', vi: 'Tôi đói bụng.', image: '🤤', tags: ['feeling'] },
  { en: 'I am thirsty.', vi: 'Tôi khát nước.', image: '🥤', tags: ['feeling'] },
  { en: 'I am sleepy.', vi: 'Tôi buồn ngủ.', image: '🥱', tags: ['feeling'] },
  { en: 'It is red.', vi: 'Nó màu đỏ.', image: '🔴', tags: ['color'] },
  { en: 'It is blue.', vi: 'Nó màu xanh dương.', image: '🔵', tags: ['color'] },
  { en: 'It is yellow.', vi: 'Nó màu vàng.', image: '🟡', tags: ['color'] },
  { en: 'It is green.', vi: 'Nó màu xanh lá.', image: '🟢', tags: ['color'] },
  { en: 'It is pink.', vi: 'Nó màu hồng.', image: '🌸', tags: ['color'] },
  { en: 'I see a cat.', vi: 'Tôi thấy một con mèo.', image: '🐱', tags: ['animal'] },
  { en: 'I see a dog.', vi: 'Tôi thấy một con chó.', image: '🐶', tags: ['animal'] },
  { en: 'I see a bird.', vi: 'Tôi thấy một con chim.', image: '🐦', tags: ['animal'] },
  { en: 'I see a fish.', vi: 'Tôi thấy một con cá.', image: '🐟', tags: ['animal'] },
  { en: 'A big elephant.', vi: 'Một chú voi to lớn.', image: '🐘', tags: ['animal'] },
  { en: 'A tiny mouse.', vi: 'Một chú chuột nhỏ xíu.', image: '🐭', tags: ['animal'] },
  { en: 'This is my mom.', vi: 'Đây là mẹ của tôi.', image: '👩', tags: ['family'] },
  { en: 'This is my dad.', vi: 'Đây là bố của tôi.', image: '👨', tags: ['family'] },
  { en: 'This is my baby.', vi: 'Đây là em bé của tôi.', image: '👶', tags: ['family'] },
  { en: 'I love my family.', vi: 'Tôi yêu gia đình tôi.', image: '👨‍👩‍👧', tags: ['family'] },
  { en: 'I like apples.', vi: 'Tôi thích những quả táo.', image: '🍎', tags: ['food'] },
  { en: 'I like milk.', vi: 'Tôi thích sữa.', image: '🥛', tags: ['drink'] },
  { en: 'I like bread.', vi: 'Tôi thích bánh mì.', image: '🍞', tags: ['food'] },
  { en: 'Eat the cake.', vi: 'Hãy ăn bánh ngọt.', image: '🎂', tags: ['food'] },
  { en: 'Drink fresh water.', vi: 'Hãy uống nước tươi mát.', image: '💧', tags: ['drink'] },
  { en: 'Touch your nose.', vi: 'Chạm vào mũi bạn nào.', image: '👃', tags: ['body'] },
  { en: 'Touch your ears.', vi: 'Chạm vào đôi tai bạn nào.', image: '👂', tags: ['body'] },
  { en: 'Close your eyes.', vi: 'Hãy nhắm mắt lại.', image: '👁️', tags: ['body'] },
  { en: 'Open your mouth.', vi: 'Hãy mở miệng ra.', image: '👄', tags: ['body'] },
  { en: 'Clap your hands.', vi: 'Hãy vỗ tay nào.', image: '👏', tags: ['body'] },
  { en: 'Stomp your feet.', vi: 'Hãy dậm chân nào.', image: '🦶', tags: ['body'] },
  { en: 'Wave your hand.', vi: 'Hãy vẫy tay nào.', image: '👋', tags: ['action'] },
  { en: 'Stand up!', vi: 'Hãy đứng lên!', image: '🧍', tags: ['action'] },
  { en: 'Sit down!', vi: 'Hãy ngồi xuống!', image: '🪑', tags: ['action'] },
  { en: 'Jump up high!', vi: 'Hãy nhảy cao lên!', image: '🦘', tags: ['action'] },
  { en: 'Run very fast!', vi: 'Hãy chạy thật nhanh!', image: '🏃', tags: ['action'] },
  { en: 'Walk slowly.', vi: 'Hãy đi bộ từ tốn.', image: '🚶', tags: ['action'] },
  { en: 'Dance and sing!', vi: 'Hãy múa và hát ca!', image: '💃', tags: ['action'] },
  { en: 'Smile bright!', vi: 'Hãy mỉm cười rạng rỡ!', image: '😊', tags: ['action'] },
  { en: 'A red ball.', vi: 'Một quả bóng đỏ.', image: '⚽', tags: ['toy'] },
  { en: 'A pretty doll.', vi: 'Một con búp bê xinh.', image: '🪆', tags: ['toy'] },
  { en: 'A fast car.', vi: 'Một chiếc ô tô chạy nhanh.', image: '🚗', tags: ['toy'] },
  { en: 'Fly the kite.', vi: 'Thả chiếc diều bay.', image: '🪁', tags: ['toy'] },
  { en: 'A teddy bear.', vi: 'Một chú gấu bông.', image: '🧸', tags: ['toy'] },
  { en: 'One, two, three!', vi: 'Một, hai, ba!', image: '🔢', tags: ['number'] },
  { en: 'Look at that!', vi: 'Hãy nhìn kìa!', image: '👀', tags: ['action'] },
  { en: 'Good job!', vi: 'Làm tốt lắm!', image: '🌟', tags: ['praise'] }
];

console.log(`Checking K phrases count... Total phrases: ${rawPhrases.length}`);
if (rawPhrases.length < 50) {
  throw new Error(`Expected at least 50 phrases, got ${rawPhrases.length}`);
}

const kPhrases = rawPhrases.map((item, idx) => {
  const idNum = String(idx + 1).padStart(4, '0');
  return {
    id: `K-ph-${idNum}`,
    level: 'K',
    topic: 'kindergarten',
    en: item.en,
    vi: item.vi,
    image: item.image,
    audioHint: item.en,
    tags: item.tags,
    source: 'seed'
  };
});

fs.writeFileSync(path.join(DATA_DIR, 'K.phrases.json'), JSON.stringify(applyContentReviewV4('K.phrases.json', kPhrases), null, 2), 'utf-8');
console.log(`✅ Saved K.phrases.json with ${kPhrases.length} phrases (target ≥ 50).`);
