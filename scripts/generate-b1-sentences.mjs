import { applyContentReviewV4 } from './english-content-review-v4.mjs';
import { applyReviewedOrder } from './english-reviewed-order.mjs';
import { applyTheoryReview } from './english-theory-review.mjs';
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

const sentences = [];
let sIdx = 1;

function addSentence(grammarPoint, en, vi, difficulty, tags, tokens, roleSpans, exerciseTypes, blankDef, orderAlternatives) {
  const reconstructed = reconstructEn(tokens);
  if (reconstructed !== en) {
    throw new Error(`Reconstruction mismatch:\nen: "${en}"\nreconstructed: "${reconstructed}"`);
  }

  const id = `B1-s-${String(sIdx++).padStart(4, '0')}`;
  const blank = {
    tokenIndex: blankDef.idx,
    answer: blankDef.ans,
    hint: blankDef.hint,
    promptVi: blankDef.promptVi
  };
  if (blankDef.alt) blank.alt = blankDef.alt;

  const item = {
    id,
    level: 'B1',
    topic: 'present-simple',
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

// -------------------------------------------------------------------------
// GROUP 1: third-person-s (50 sentences: 0001 - 0050)
// S (he, she, it, singular) + V(s/es/ies/has) + (O) + (A)
// -------------------------------------------------------------------------

addSentence('third-person-s', 'She plays tennis.', 'Cô ấy chơi quần vợt.', 1, ['affirmative', 'sport'],
  [tok('She','pronoun','subject'), tok('plays','verb','verb','play','present-3sg'), tok('tennis','noun','object','tennis','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'plays', promptVi:'Chia động từ play ở hiện tại đơn với she.', hint:'play → plays'});

addSentence('third-person-s', 'He reads books.', 'Cậu ấy đọc sách.', 1, ['affirmative', 'study'],
  [tok('He','pronoun','subject'), tok('reads','verb','verb','read','present-3sg'), tok('books','noun','object','book','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'reads', promptVi:'Chia động từ read ở hiện tại đơn với he.', hint:'read → reads'});

addSentence('third-person-s', 'The cat drinks milk.', 'Con mèo uống sữa.', 1, ['affirmative', 'animal'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('drinks','verb','verb','drink','present-3sg'), tok('milk','noun','object','milk','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'drinks', promptVi:'Chia động từ drink ở hiện tại đơn với the cat.', hint:'drink → drinks'});

addSentence('third-person-s', 'Nam eats rice.', 'Nam ăn cơm.', 1, ['affirmative', 'food'],
  [tok('Nam','noun','subject','Nam','sg'), tok('eats','verb','verb','eat','present-3sg'), tok('rice','noun','object','rice','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'eats', promptVi:'Chia động từ eat ở hiện tại đơn với Nam.', hint:'eat → eats'});

addSentence('third-person-s', 'She likes apples.', 'Cô ấy thích táo.', 1, ['affirmative', 'food'],
  [tok('She','pronoun','subject'), tok('likes','verb','verb','like','present-3sg'), tok('apples','noun','object','apple','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'likes', promptVi:'Chia động từ like ở hiện tại đơn với she.', hint:'like → likes'});

addSentence('third-person-s', 'The dog runs fast.', 'Chú chó chạy nhanh.', 1, ['affirmative', 'animal'],
  [tok('The','article','det'), tok('dog','noun','subject','dog','sg'), tok('runs','verb','verb','run','present-3sg'), tok('fast','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'runs', promptVi:'Chia động từ run ở hiện tại đơn với the dog.', hint:'run → runs'});

addSentence('third-person-s', 'He loves music.', 'Cậu ấy yêu âm nhạc.', 1, ['affirmative', 'hobby'],
  [tok('He','pronoun','subject'), tok('loves','verb','verb','love','present-3sg'), tok('music','noun','object','music','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'loves', promptVi:'Chia động từ love ở hiện tại đơn với he.', hint:'love → loves'});

addSentence('third-person-s', 'My brother rides a bicycle.', 'Anh trai tôi đạp xe đạp.', 1, ['affirmative', 'transport'],
  [tok('My','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('rides','verb','verb','ride','present-3sg'), tok('a','article','det'), tok('bicycle','noun','object','bicycle','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'rides', promptVi:'Chia động từ ride ở hiện tại đơn với my brother.', hint:'ride → rides'});

addSentence('third-person-s', 'Lan writes a letter.', 'Lan viết một bức thư.', 1, ['affirmative'],
  [tok('Lan','noun','subject','Lan','sg'), tok('writes','verb','verb','write','present-3sg'), tok('a','article','det'), tok('letter','noun','object','letter','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'writes', promptVi:'Chia động từ write ở hiện tại đơn với Lan.', hint:'write → writes'});

addSentence('third-person-s', 'The bird sings.', 'Chú chim hót líu lo.', 1, ['affirmative', 'nature'],
  [tok('The','article','det'), tok('bird','noun','subject','bird','sg'), tok('sings','verb','verb','sing','present-3sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:2, ans:'sings', promptVi:'Chia động từ sing ở hiện tại đơn với the bird.', hint:'sing → sings'});

// Quy tắc -es (watch, wash, brush, teach, catch, go, do)
addSentence('third-person-s', 'He watches TV.', 'Cậu ấy xem tivi.', 1, ['affirmative', 'es-ending'],
  [tok('He','pronoun','subject'), tok('watches','verb','verb','watch','present-3sg'), tok('TV','noun','object','tv','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'watches', promptVi:'Chia động từ watch (-es) ở hiện tại đơn với he.', hint:'watch → watches'});

addSentence('third-person-s', 'She washes her hands.', 'Cô ấy rửa tay.', 1, ['affirmative', 'es-ending'],
  [tok('She','pronoun','subject'), tok('washes','verb','verb','wash','present-3sg'), tok('her','determiner','det'), tok('hands','noun','object','hand','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'washes', promptVi:'Chia động từ wash (-es) ở hiện tại đơn với she.', hint:'wash → washes'});

addSentence('third-person-s', 'Tom brushes his teeth.', 'Tom đánh răng.', 1, ['affirmative', 'es-ending'],
  [tok('Tom','noun','subject','Tom','sg'), tok('brushes','verb','verb','brush','present-3sg'), tok('his','determiner','det'), tok('teeth','noun','object','tooth','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'brushes', promptVi:'Chia động từ brush (-es) ở hiện tại đơn với Tom.', hint:'brush → brushes'});

addSentence('third-person-s', 'She teaches English.', 'Cô ấy dạy tiếng Anh.', 1, ['affirmative', 'es-ending'],
  [tok('She','pronoun','subject'), tok('teaches','verb','verb','teach','present-3sg'), tok('English','noun','object','English','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'teaches', promptVi:'Chia động từ teach (-es) ở hiện tại đơn với she.', hint:'teach → teaches'});

addSentence('third-person-s', 'The cat catches a mouse.', 'Con mèo bắt một con chuột.', 1, ['affirmative', 'es-ending'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('catches','verb','verb','catch','present-3sg'), tok('a','article','det'), tok('mouse','noun','object','mouse','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'catches', promptVi:'Chia động từ catch (-es) ở hiện tại đơn với the cat.', hint:'catch → catches'});

addSentence('third-person-s', 'Nam goes to school.', 'Nam đi đến trường.', 1, ['affirmative', 'es-ending'],
  [tok('Nam','noun','subject','Nam','sg'), tok('goes','verb','verb','go','present-3sg'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'goes', promptVi:'Chia động từ go (-es) ở hiện tại đơn với Nam.', hint:'go → goes'});

addSentence('third-person-s', 'Mary does her homework.', 'Mary làm bài tập về nhà.', 1, ['affirmative', 'es-ending'],
  [tok('Mary','noun','subject','Mary','sg'), tok('does','verb','verb','do','present-3sg'), tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'does', promptVi:'Chia động từ do (-es) ở hiện tại đơn với Mary.', hint:'do → does'});

// Quy tắc -ies (study, fly)
addSentence('third-person-s', 'Peter studies math.', 'Peter học môn toán.', 1, ['affirmative', 'ies-ending'],
  [tok('Peter','noun','subject','Peter','sg'), tok('studies','verb','verb','study','present-3sg'), tok('math','noun','object','math','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'studies', promptVi:'Chia động từ study (y → ies) ở hiện tại đơn với Peter.', hint:'study → studies'});

addSentence('third-person-s', 'The bird flies high.', 'Chú chim bay cao.', 1, ['affirmative', 'ies-ending'],
  [tok('The','article','det'), tok('bird','noun','subject','bird','sg'), tok('flies','verb','verb','fly','present-3sg'), tok('high','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'flies', promptVi:'Chia động từ fly (y → ies) ở hiện tại đơn với the bird.', hint:'fly → flies'});

// has (have)
addSentence('third-person-s', 'She has a new pencil.', 'Cô ấy có một chiếc bút chì mới.', 1, ['affirmative', 'irregular-has'],
  [tok('She','pronoun','subject'), tok('has','verb','verb','have','present-3sg'), tok('a','article','det'), tok('new','adjective','modifier'), tok('pencil','noun','object','pencil','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'has', promptVi:'Chia động từ have dạng ngôi thứ ba số ít.', hint:'have → has'});

addSentence('third-person-s', 'He has two cats.', 'Cậu ấy có hai con mèo.', 1, ['affirmative', 'irregular-has'],
  [tok('He','pronoun','subject'), tok('has','verb','verb','have','present-3sg'), tok('two','numeral','det'), tok('cats','noun','object','cat','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'has', promptVi:'Chia động từ have dạng ngôi thứ ba số ít.', hint:'have → has'});

// 20-35: Mức 2 (có trạng ngữ thời gian, nơi chốn đơn giản)
addSentence('third-person-s', 'He plays soccer on Monday.', 'Cậu ấy chơi bóng đá vào thứ Hai.', 2, ['affirmative', 'sport'],
  [tok('He','pronoun','subject'), tok('plays','verb','verb','play','present-3sg'), tok('soccer','noun','object','soccer','uncountable'), tok('on','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'plays', promptVi:'Chia động từ play ở hiện tại đơn với he.', hint:'play → plays'});

addSentence('third-person-s', 'She drinks warm milk in the morning.', 'Cô ấy uống sữa ấm vào buổi sáng.', 2, ['affirmative', 'daily'],
  [tok('She','pronoun','subject'), tok('drinks','verb','verb','drink','present-3sg'), tok('warm','adjective','modifier'), tok('milk','noun','object','milk','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'drinks', promptVi:'Chia động từ drink ở hiện tại đơn với she.', hint:'drink → drinks'});

addSentence('third-person-s', 'My father works in a big hospital.', 'Bố tôi làm việc ở một bệnh viện lớn.', 2, ['affirmative'],
  [tok('My','determiner','det'), tok('father','noun','subject','father','sg'), tok('works','verb','verb','work','present-3sg'), tok('in','preposition','prep'), tok('a','article','det'), tok('big','adjective','modifier'), tok('hospital','noun','prep-object','hospital','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'works', promptVi:'Chia động từ work ở hiện tại đơn với my father.', hint:'work → works'});

addSentence('third-person-s', 'Nam studies English every day.', 'Nam học tiếng Anh mỗi ngày.', 2, ['affirmative', 'study'],
  [tok('Nam','noun','subject','Nam','sg'), tok('studies','verb','verb','study','present-3sg'), tok('English','noun','object','English','uncountable'), tok('every','determiner','det'), tok('day','noun','adverbial','day','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'studies', promptVi:'Chia động từ study ở hiện tại đơn với Nam.', hint:'study → studies'});

addSentence('third-person-s', 'The little puppy sleeps on the floor.', 'Chú cún nhỏ ngủ trên sàn nhà.', 2, ['affirmative', 'animal'],
  [tok('The','article','det'), tok('little','adjective','modifier'), tok('puppy','noun','subject','puppy','sg'), tok('sleeps','verb','verb','sleep','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('floor','noun','prep-object','floor','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'sleeps', promptVi:'Chia động từ sleep ở hiện tại đơn với the little puppy.', hint:'sleep → sleeps'});

addSentence('third-person-s', 'Lan cooks dinner for her family.', 'Lan nấu bữa tối cho gia đình.', 2, ['affirmative', 'daily'],
  [tok('Lan','noun','subject','Lan','sg'), tok('cooks','verb','verb','cook','present-3sg'), tok('dinner','noun','object','dinner','uncountable'), tok('for','preposition','prep'), tok('her','determiner','det'), tok('family','noun','prep-object','family','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'cooks', promptVi:'Chia động từ cook ở hiện tại đơn với Lan.', hint:'cook → cooks'});

addSentence('third-person-s', 'Tom washes his bicycle on Sunday.', 'Tom rửa xe đạp của mình vào Chủ nhật.', 2, ['affirmative', 'es-ending'],
  [tok('Tom','noun','subject','Tom','sg'), tok('washes','verb','verb','wash','present-3sg'), tok('his','determiner','det'), tok('bicycle','noun','object','bicycle','sg'), tok('on','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'washes', promptVi:'Chia động từ wash ở hiện tại đơn với Tom.', hint:'wash → washes'});

addSentence('third-person-s', 'My sister cleans her room.', 'Chị gái tôi dọn dẹp phòng của mình.', 2, ['affirmative'],
  [tok('My','determiner','det'), tok('sister','noun','subject','sister','sg'), tok('cleans','verb','verb','clean','present-3sg'), tok('her','determiner','det'), tok('room','noun','object','room','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'cleans', promptVi:'Chia động từ clean ở hiện tại đơn với my sister.', hint:'clean → cleans'});

addSentence('third-person-s', 'He swims in the pool on Saturday.', 'Cậu ấy bơi ở hồ bơi vào thứ Bảy.', 2, ['affirmative', 'sport'],
  [tok('He','pronoun','subject'), tok('swims','verb','verb','swim','present-3sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('pool','noun','prep-object','pool','sg'), tok('on','preposition','prep'), tok('Saturday','noun','prep-object','Saturday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'swims', promptVi:'Chia động từ swim ở hiện tại đơn với he.', hint:'swim → swims'});

addSentence('third-person-s', 'She helps her brother with homework.', 'Cô ấy giúp anh trai làm bài tập về nhà.', 2, ['affirmative'],
  [tok('She','pronoun','subject'), tok('helps','verb','verb','help','present-3sg'), tok('her','determiner','det'), tok('brother','noun','object','brother','sg'), tok('with','preposition','prep'), tok('homework','noun','prep-object','homework','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'helps', promptVi:'Chia động từ help ở hiện tại đơn với she.', hint:'help → helps'});

addSentence('third-person-s', 'The teacher opens the window.', 'Cô giáo mở cửa sổ.', 2, ['affirmative', 'school'],
  [tok('The','article','det'), tok('teacher','noun','subject','teacher','sg'), tok('opens','verb','verb','open','present-3sg'), tok('the','article','det'), tok('window','noun','object','window','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'opens', promptVi:'Chia động từ open ở hiện tại đơn với the teacher.', hint:'open → opens'});

addSentence('third-person-s', 'My uncle drives a blue car.', 'Chú tôi lái một chiếc xe ô tô màu xanh.', 2, ['affirmative', 'transport'],
  [tok('My','determiner','det'), tok('uncle','noun','subject','uncle','sg'), tok('drives','verb','verb','drive','present-3sg'), tok('a','article','det'), tok('blue','adjective','modifier'), tok('car','noun','object','car','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'drives', promptVi:'Chia động từ drive ở hiện tại đơn với my uncle.', hint:'drive → drives'});

addSentence('third-person-s', 'She buys fresh fruit at the market.', 'Cô ấy mua trái cây tươi ở chợ.', 2, ['affirmative'],
  [tok('She','pronoun','subject'), tok('buys','verb','verb','buy','present-3sg'), tok('fresh','adjective','modifier'), tok('fruit','noun','object','fruit','uncountable'), tok('at','preposition','prep'), tok('the','article','det'), tok('market','noun','prep-object','market','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'buys', promptVi:'Chia động từ buy ở hiện tại đơn với she.', hint:'buy → buys'});

addSentence('third-person-s', 'Peter plays badminton with his father.', 'Peter chơi cầu lông với bố cậu ấy.', 2, ['affirmative', 'sport'],
  [tok('Peter','noun','subject','Peter','sg'), tok('plays','verb','verb','play','present-3sg'), tok('badminton','noun','object','badminton','uncountable'), tok('with','preposition','prep'), tok('his','determiner','det'), tok('father','noun','prep-object','father','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'plays', promptVi:'Chia động từ play ở hiện tại đơn với Peter.', hint:'play → plays'});

addSentence('third-person-s', 'She wakes up early.', 'Cô ấy thức dậy sớm.', 2, ['affirmative', 'daily'],
  [tok('She','pronoun','subject'), tok('wakes','verb','verb','wake','present-3sg'), tok('up','particle','particle'), tok('early','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'wakes', promptVi:'Chia động từ wake ở hiện tại đơn với she.', hint:'wake → wakes'});

// 36-50: Mức 3 (có trạng ngữ đầu câu với orderAlternatives)
addSentence('third-person-s', 'On Sunday Nam plays soccer with friends.', 'Vào Chủ nhật Nam chơi bóng đá với bạn bè.', 3, ['affirmative', 'sport'],
  [tok('On','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), tok('Nam','noun','subject','Nam','sg'), tok('plays','verb','verb','play','present-3sg'), tok('soccer','noun','object','soccer','uncountable'), tok('with','preposition','prep'), tok('friends','noun','prep-object','friend','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'plays', promptVi:'Chia động từ play ở hiện tại đơn với Nam.', hint:'play → plays'},
  ['Nam plays soccer with friends on Sunday.']);

addSentence('third-person-s', 'In the afternoon she does her homework.', 'Vào buổi chiều cô ấy làm bài tập về nhà.', 3, ['affirmative', 'es-ending'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('afternoon','noun','prep-object','afternoon','sg'), tok('she','pronoun','subject'), tok('does','verb','verb','do','present-3sg'), tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'object', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'does', promptVi:'Chia động từ do ở hiện tại đơn với she.', hint:'do → does'},
  ['She does her homework in the afternoon.']);

addSentence('third-person-s', 'On Friday he washes his car.', 'Vào thứ Sáu cậu ấy rửa xe ô tô của mình.', 3, ['affirmative', 'es-ending'],
  [tok('On','preposition','prep'), tok('Friday','noun','prep-object','Friday','sg'), tok('he','pronoun','subject'), tok('washes','verb','verb','wash','present-3sg'), tok('his','determiner','det'), tok('car','noun','object','car','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:3, ans:'washes', promptVi:'Chia động từ wash ở hiện tại đơn với he.', hint:'wash → washes'},
  ['He washes his car on Friday.']);

addSentence('third-person-s', 'In the morning my mother cooks soup.', 'Vào buổi sáng mẹ tôi nấu món súp.', 3, ['affirmative', 'food'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), tok('my','determiner','det'), tok('mother','noun','subject','mother','sg'), tok('cooks','verb','verb','cook','present-3sg'), tok('soup','noun','object','soup','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'object', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:5, ans:'cooks', promptVi:'Chia động từ cook ở hiện tại đơn với my mother.', hint:'cook → cooks'},
  ['My mother cooks soup in the morning.']);

addSentence('third-person-s', 'Every day the student walks to school.', 'Mỗi ngày bạn học sinh đều đi bộ đến trường.', 3, ['affirmative'],
  [tok('Every','determiner','det'), tok('day','noun','adverbial','day','sg'), tok('the','article','det'), tok('student','noun','subject','student','sg'), tok('walks','verb','verb','walk','present-3sg'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'walks', promptVi:'Chia động từ walk ở hiện tại đơn với the student.', hint:'walk → walks'},
  ['The student walks to school every day.']);

addSentence('third-person-s', 'On Tuesday Mary studies English.', 'Vào thứ Ba Mary học tiếng Anh.', 3, ['affirmative', 'ies-ending'],
  [tok('On','preposition','prep'), tok('Tuesday','noun','prep-object','Tuesday','sg'), tok('Mary','noun','subject','Mary','sg'), tok('studies','verb','verb','study','present-3sg'), tok('English','noun','object','English','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'studies', promptVi:'Chia động từ study ở hiện tại đơn với Mary.', hint:'study → studies'},
  ['Mary studies English on Tuesday.']);

addSentence('third-person-s', 'In the park the dog catches a ball.', 'Trong công viên chú chó bắt lấy quả bóng.', 3, ['affirmative', 'es-ending'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), tok('the','article','det'), tok('dog','noun','subject','dog','sg'), tok('catches','verb','verb','catch','present-3sg'), tok('a','article','det'), tok('ball','noun','object','ball','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'object', tokenIndices:[6, 7]}],
  ['pos','fill','order','roles'], {idx:5, ans:'catches', promptVi:'Chia động từ catch ở hiện tại đơn với the dog.', hint:'catch → catches'},
  ['The dog catches a ball in the park.']);

addSentence('third-person-s', 'At night the baby sleeps well.', 'Vào ban đêm em bé ngủ ngon giấc.', 3, ['affirmative'],
  [tok('At','preposition','prep'), tok('night','noun','prep-object','night','sg'), tok('the','article','det'), tok('baby','noun','subject','baby','sg'), tok('sleeps','verb','verb','sleep','present-3sg'), tok('well','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:4, ans:'sleeps', promptVi:'Chia động từ sleep ở hiện tại đơn với the baby.', hint:'sleep → sleeps'},
  ['The baby sleeps well at night.']);

addSentence('third-person-s', 'On Saturday Peter rides his bicycle to the park.', 'Vào thứ Bảy Peter đạp xe đạp đến công viên.', 3, ['affirmative', 'transport'],
  [tok('On','preposition','prep'), tok('Saturday','noun','prep-object','Saturday','sg'), tok('Peter','noun','subject','Peter','sg'), tok('rides','verb','verb','ride','present-3sg'), tok('his','determiner','det'), tok('bicycle','noun','object','bicycle','sg'), tok('to','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:3, ans:'rides', promptVi:'Chia động từ ride ở hiện tại đơn với Peter.', hint:'ride → rides'},
  ['Peter rides his bicycle to the park on Saturday.']);

addSentence('third-person-s', 'In the garden my grandfather drinks green tea.', 'Ở trong vườn ông tôi uống trà xanh.', 3, ['affirmative', 'daily'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('garden','noun','prep-object','garden','sg'), tok('my','determiner','det'), tok('grandfather','noun','subject','grandfather','sg'), tok('drinks','verb','verb','drink','present-3sg'), tok('green','adjective','modifier'), tok('tea','noun','object','tea','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'object', tokenIndices:[6, 7]}],
  ['pos','fill','order','roles'], {idx:5, ans:'drinks', promptVi:'Chia động từ drink ở hiện tại đơn với my grandfather.', hint:'drink → drinks'},
  ['My grandfather drinks green tea in the garden.']);

addSentence('third-person-s', 'On Thursday she teaches art.', 'Vào thứ Năm cô ấy dạy mỹ thuật.', 3, ['affirmative', 'es-ending'],
  [tok('On','preposition','prep'), tok('Thursday','noun','prep-object','Thursday','sg'), tok('she','pronoun','subject'), tok('teaches','verb','verb','teach','present-3sg'), tok('art','noun','object','art','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'teaches', promptVi:'Chia động từ teach ở hiện tại đơn với she.', hint:'teach → teaches'},
  ['She teaches art on Thursday.']);

addSentence('third-person-s', 'In the morning the bird sings in the tree.', 'Vào buổi sáng chú chim hót trên cây.', 3, ['affirmative', 'nature'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), tok('the','article','det'), tok('bird','noun','subject','bird','sg'), tok('sings','verb','verb','sing','present-3sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('tree','noun','prep-object','tree','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:5, ans:'sings', promptVi:'Chia động từ sing ở hiện tại đơn với the bird.', hint:'sing → sings'},
  ['The bird sings in the tree in the morning.']);

addSentence('third-person-s', 'Every evening he watches a movie.', 'Mỗi buổi tối cậu ấy đều xem một bộ phim.', 3, ['affirmative', 'es-ending'],
  [tok('Every','determiner','det'), tok('evening','noun','adverbial','evening','sg'), tok('he','pronoun','subject'), tok('watches','verb','verb','watch','present-3sg'), tok('a','article','det'), tok('movie','noun','object','movie','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:3, ans:'watches', promptVi:'Chia động từ watch ở hiện tại đơn với he.', hint:'watch → watches'},
  ['He watches a movie every evening.']);

addSentence('third-person-s', 'At seven o\'clock he wakes up.', 'Lúc bảy giờ cậu ấy thức dậy.', 3, ['affirmative', 'daily'],
  [tok('At','preposition','prep'), tok('seven','numeral','det'), tok('o\'clock','adverb','prep-object'), tok('he','pronoun','subject'), tok('wakes','verb','verb','wake','present-3sg'), tok('up','particle','particle'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:4, ans:'wakes', promptVi:'Chia động từ wake ở hiện tại đơn với he.', hint:'wake → wakes'},
  ['He wakes up at seven o\'clock.']);



// -------------------------------------------------------------------------
// GROUP 2: first-second-person (40 sentences: 0051 - 0090)
// I, you, we, they, plural nouns + V(base/present-other)
// -------------------------------------------------------------------------

addSentence('first-second-person', 'I like apples.', 'Tôi thích những quả táo.', 1, ['affirmative', 'food'],
  [tok('I','pronoun','subject'), tok('like','verb','verb','like','present-other'), tok('apples','noun','object','apple','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'like', promptVi:'Chia động từ like ở hiện tại đơn với I.', hint:'like'});

addSentence('first-second-person', 'We play soccer.', 'Chúng tôi chơi bóng đá.', 1, ['affirmative', 'sport'],
  [tok('We','pronoun','subject'), tok('play','verb','verb','play','present-other'), tok('soccer','noun','object','soccer','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'play', promptVi:'Chia động từ play ở hiện tại đơn với we.', hint:'play'});

addSentence('first-second-person', 'They live in Hanoi.', 'Họ sống ở Hà Nội.', 1, ['affirmative'],
  [tok('They','pronoun','subject'), tok('live','verb','verb','live','present-other'), tok('in','preposition','prep'), tok('Hanoi','noun','prep-object','Hanoi','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'live', promptVi:'Chia động từ live ở hiện tại đơn với they.', hint:'live'});

addSentence('first-second-person', 'You read books.', 'Bạn đọc sách.', 1, ['affirmative', 'study'],
  [tok('You','pronoun','subject'), tok('read','verb','verb','read','present-other'), tok('books','noun','object','book','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'read', promptVi:'Chia động từ read ở hiện tại đơn với you.', hint:'read'});

addSentence('first-second-person', 'The students learn English.', 'Các học sinh học tiếng Anh.', 1, ['affirmative', 'school'],
  [tok('The','article','det'), tok('students','noun','subject','student','pl'), tok('learn','verb','verb','learn','present-other'), tok('English','noun','object','English','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'learn', promptVi:'Chia động từ learn ở hiện tại đơn với the students.', hint:'learn'});

addSentence('first-second-person', 'My parents cook dinner.', 'Bố mẹ tôi nấu bữa tối.', 1, ['affirmative', 'family'],
  [tok('My','determiner','det'), tok('parents','noun','subject','parents','pl'), tok('cook','verb','verb','cook','present-other'), tok('dinner','noun','object','dinner','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'cook', promptVi:'Chia động từ cook ở hiện tại đơn với my parents.', hint:'cook'});

addSentence('first-second-person', 'Cats like fish.', 'Mèo thích cá.', 1, ['affirmative', 'animal'],
  [tok('Cats','noun','subject','cat','pl'), tok('like','verb','verb','like','present-other'), tok('fish','noun','object','fish','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'like', promptVi:'Chia động từ like ở hiện tại đơn với cats.', hint:'like'});

addSentence('first-second-person', 'I wash my hands.', 'Tôi rửa tay.', 1, ['affirmative', 'daily'],
  [tok('I','pronoun','subject'), tok('wash','verb','verb','wash','present-other'), tok('my','determiner','det'), tok('hands','noun','object','hand','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'wash', promptVi:'Chia động từ wash ở hiện tại đơn với I.', hint:'wash'});

addSentence('first-second-person', 'We eat breakfast at seven.', 'Chúng tôi ăn sáng lúc bảy giờ.', 1, ['affirmative', 'daily'],
  [tok('We','pronoun','subject'), tok('eat','verb','verb','eat','present-other'), tok('breakfast','noun','object','breakfast','uncountable'), tok('at','preposition','prep'), tok('seven','numeral','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'eat', promptVi:'Chia động từ eat ở hiện tại đơn với we.', hint:'eat'});

addSentence('first-second-person', 'They speak English well.', 'Họ nói tiếng Anh giỏi.', 1, ['affirmative'],
  [tok('They','pronoun','subject'), tok('speak','verb','verb','speak','present-other'), tok('English','noun','object','English','uncountable'), tok('well','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'speak', promptVi:'Chia động từ speak ở hiện tại đơn với they.', hint:'speak'});

addSentence('first-second-person', 'You write nice letters.', 'Bạn viết những lá thư rất hay.', 1, ['affirmative'],
  [tok('You','pronoun','subject'), tok('write','verb','verb','write','present-other'), tok('nice','adjective','modifier'), tok('letters','noun','object','letter','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'write', promptVi:'Chia động từ write ở hiện tại đơn với you.', hint:'write'});

addSentence('first-second-person', 'I walk to school every day.', 'Tôi đi bộ đến trường mỗi ngày.', 1, ['affirmative'],
  [tok('I','pronoun','subject'), tok('walk','verb','verb','walk','present-other'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), tok('every','determiner','det'), tok('day','noun','adverbial','day','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'walk', promptVi:'Chia động từ walk ở hiện tại đơn với I.', hint:'walk'});

addSentence('first-second-person', 'We sing English songs.', 'Chúng tôi hát những bài hát tiếng Anh.', 1, ['affirmative', 'music'],
  [tok('We','pronoun','subject'), tok('sing','verb','verb','sing','present-other'), tok('English','adjective','modifier'), tok('songs','noun','object','song','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sing', promptVi:'Chia động từ sing ở hiện tại đơn với we.', hint:'sing'});

addSentence('first-second-person', 'They swim in the pool.', 'Họ bơi trong hồ bơi.', 1, ['affirmative', 'sport'],
  [tok('They','pronoun','subject'), tok('swim','verb','verb','swim','present-other'), tok('in','preposition','prep'), tok('the','article','det'), tok('pool','noun','prep-object','pool','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'swim', promptVi:'Chia động từ swim ở hiện tại đơn với they.', hint:'swim'});

addSentence('first-second-person', 'I help my mother.', 'Tôi giúp đỡ mẹ tôi.', 1, ['affirmative', 'family'],
  [tok('I','pronoun','subject'), tok('help','verb','verb','help','present-other'), tok('my','determiner','det'), tok('mother','noun','object','mother','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'help', promptVi:'Chia động từ help ở hiện tại đơn với I.', hint:'help'});

addSentence('first-second-person', 'My friends play badminton on Saturday.', 'Các bạn tôi chơi cầu lông vào thứ Bảy.', 2, ['affirmative', 'sport'],
  [tok('My','determiner','det'), tok('friends','noun','subject','friend','pl'), tok('play','verb','verb','play','present-other'), tok('badminton','noun','object','badminton','uncountable'), tok('on','preposition','prep'), tok('Saturday','noun','prep-object','Saturday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'play', promptVi:'Chia động từ play ở hiện tại đơn với my friends.', hint:'play'});

addSentence('first-second-person', 'We clean our classroom on Friday.', 'Chúng tôi dọn dẹp lớp học vào thứ Sáu.', 2, ['affirmative', 'school'],
  [tok('We','pronoun','subject'), tok('clean','verb','verb','clean','present-other'), tok('our','determiner','det'), tok('classroom','noun','object','classroom','sg'), tok('on','preposition','prep'), tok('Friday','noun','prep-object','Friday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'clean', promptVi:'Chia động từ clean ở hiện tại đơn với we.', hint:'clean'});

addSentence('first-second-person', 'You close the door.', 'Bạn đóng cửa lại.', 2, ['affirmative'],
  [tok('You','pronoun','subject'), tok('close','verb','verb','close','present-other'), tok('the','article','det'), tok('door','noun','object','door','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'close', promptVi:'Chia động từ close ở hiện tại đơn với you.', hint:'close'});

addSentence('first-second-person', 'They open their books.', 'Họ mở sách ra.', 2, ['affirmative'],
  [tok('They','pronoun','subject'), tok('open','verb','verb','open','present-other'), tok('their','determiner','det'), tok('books','noun','object','book','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'open', promptVi:'Chia động từ open ở hiện tại đơn với they.', hint:'open'});

addSentence('first-second-person', 'I need a new notebook.', 'Tôi cần một cuốn vở mới.', 2, ['affirmative'],
  [tok('I','pronoun','subject'), tok('need','verb','verb','need','present-other'), tok('a','article','det'), tok('new','adjective','modifier'), tok('notebook','noun','object','notebook','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'need', promptVi:'Chia động từ need ở hiện tại đơn với I.', hint:'need'});

addSentence('first-second-person', 'We want some orange juice.', 'Chúng tôi muốn một ít nước cam.', 2, ['affirmative', 'drink'],
  [tok('We','pronoun','subject'), tok('want','verb','verb','want','present-other'), tok('some','determiner','det'), tok('orange','noun','modifier','orange','sg'), tok('juice','noun','object','juice','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'want', promptVi:'Chia động từ want ở hiện tại đơn với we.', hint:'want'});

addSentence('first-second-person', 'They know the answer.', 'Họ biết câu trả lời.', 2, ['affirmative'],
  [tok('They','pronoun','subject'), tok('know','verb','verb','know','present-other'), tok('the','article','det'), tok('answer','noun','object','answer','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'know', promptVi:'Chia động từ know ở hiện tại đơn với they.', hint:'know'});

addSentence('first-second-person', 'The boys ride their bicycles.', 'Các cậu bé đạp xe đạp của mình.', 2, ['affirmative', 'transport'],
  [tok('The','article','det'), tok('boys','noun','subject','boy','pl'), tok('ride','verb','verb','ride','present-other'), tok('their','determiner','det'), tok('bicycles','noun','object','bicycle','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'ride', promptVi:'Chia động từ ride ở hiện tại đơn với the boys.', hint:'ride'});

addSentence('first-second-person', 'You drink a lot of water.', 'Bạn uống rất nhiều nước.', 2, ['affirmative', 'drink'],
  [tok('You','pronoun','subject'), tok('drink','verb','verb','drink','present-other'), tok('a','article','det'), tok('lot','noun','modifier','lot','sg'), tok('of','preposition','prep'), tok('water','noun','object','water','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'drink', promptVi:'Chia động từ drink ở hiện tại đơn với you.', hint:'drink'});

addSentence('first-second-person', 'I buy fresh bread every morning.', 'Tôi mua bánh mì tươi mỗi sáng.', 2, ['affirmative', 'food'],
  [tok('I','pronoun','subject'), tok('buy','verb','verb','buy','present-other'), tok('fresh','adjective','modifier'), tok('bread','noun','object','bread','uncountable'), tok('every','determiner','det'), tok('morning','noun','adverbial','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'buy', promptVi:'Chia động từ buy ở hiện tại đơn với I.', hint:'buy'});

addSentence('first-second-person', 'We go to bed at ten o\'clock.', 'Chúng tôi đi ngủ lúc mười giờ.', 2, ['affirmative', 'daily'],
  [tok('We','pronoun','subject'), tok('go','verb','verb','go','present-other'), tok('to','preposition','prep'), tok('bed','noun','prep-object','bed','sg'), tok('at','preposition','prep'), tok('ten','numeral','det'), tok('o\'clock','adverb','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order'], {idx:1, ans:'go', promptVi:'Chia động từ go ở hiện tại đơn với we.', hint:'go to bed: đi ngủ'},
  ['At ten o\'clock we go to bed.']);

addSentence('first-second-person', 'They love their pets.', 'Họ rất yêu quý thú cưng của mình.', 2, ['affirmative', 'animal'],
  [tok('They','pronoun','subject'), tok('love','verb','verb','love','present-other'), tok('their','determiner','det'), tok('pets','noun','object','pet','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'love', promptVi:'Chia động từ love ở hiện tại đơn với they.', hint:'love'});

addSentence('first-second-person', 'The birds fly in the blue sky.', 'Những chú chim bay trên bầu trời xanh.', 2, ['affirmative', 'nature'],
  [tok('The','article','det'), tok('birds','noun','subject','bird','pl'), tok('fly','verb','verb','fly','present-other'), tok('in','preposition','prep'), tok('the','article','det'), tok('blue','adjective','modifier'), tok('sky','noun','prep-object','sky','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'fly', promptVi:'Chia động từ fly ở hiện tại đơn với the birds.', hint:'fly'});

addSentence('first-second-person', 'My brother and I play chess.', 'Anh trai tôi và tôi chơi cờ vua.', 2, ['affirmative', 'game'],
  [tok('My','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('and','conjunction','conj'), tok('I','pronoun','subject'), tok('play','verb','verb','play','present-other'), tok('chess','noun','object','chess','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'object', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:4, ans:'play', promptVi:'Chia động từ play ở hiện tại đơn với My brother and I.', hint:'play'});

addSentence('first-second-person', 'You teach English well.', 'Bạn dạy tiếng Anh rất giỏi.', 2, ['affirmative'],
  [tok('You','pronoun','subject'), tok('teach','verb','verb','teach','present-other'), tok('English','noun','object','English','uncountable'), tok('well','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'teach', promptVi:'Chia động từ teach ở hiện tại đơn với you.', hint:'teach'});

// Mức 3 (trạng ngữ đảo đầu câu)
addSentence('first-second-person', 'In the morning I drink warm milk.', 'Vào buổi sáng tôi uống sữa ấm.', 3, ['affirmative', 'daily'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), tok('I','pronoun','subject'), tok('drink','verb','verb','drink','present-other'), tok('warm','adjective','modifier'), tok('milk','noun','object','milk','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'object', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'drink', promptVi:'Chia động từ drink ở hiện tại đơn với I.', hint:'drink'},
  ['I drink warm milk in the morning.']);

addSentence('first-second-person', 'On Monday they study math.', 'Vào thứ Hai họ học môn toán.', 3, ['affirmative', 'school'],
  [tok('On','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), tok('they','pronoun','subject'), tok('study','verb','verb','study','present-other'), tok('math','noun','object','math','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'study', promptVi:'Chia động từ study ở hiện tại đơn với they.', hint:'study'},
  ['They study math on Monday.']);

addSentence('first-second-person', 'In the afternoon we play soccer in the yard.', 'Vào buổi chiều chúng tôi chơi bóng đá ở sân.', 3, ['affirmative', 'sport'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('afternoon','noun','prep-object','afternoon','sg'), tok('we','pronoun','subject'), tok('play','verb','verb','play','present-other'), tok('soccer','noun','object','soccer','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('yard','noun','prep-object','yard','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'object', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:4, ans:'play', promptVi:'Chia động từ play ở hiện tại đơn với we.', hint:'play'},
  ['We play soccer in the yard in the afternoon.']);

addSentence('first-second-person', 'On Sunday you visit your grandparents.', 'Vào Chủ nhật bạn đến thăm ông bà.', 3, ['affirmative', 'family'],
  [tok('On','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), tok('you','pronoun','subject'), tok('visit','verb','verb','visit','present-other'), tok('your','determiner','det'), tok('grandparents','noun','object','grandparents','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:3, ans:'visit', promptVi:'Chia động từ visit ở hiện tại đơn với you.', hint:'visit'},
  ['You visit your grandparents on Sunday.']);

addSentence('first-second-person', 'Every day the children learn new words.', 'Mỗi ngày lũ trẻ đều học những từ mới.', 3, ['affirmative', 'school'],
  [tok('Every','determiner','det'), tok('day','noun','adverbial','day','sg'), tok('the','article','det'), tok('children','noun','subject','children','pl'), tok('learn','verb','verb','learn','present-other'), tok('new','adjective','modifier'), tok('words','noun','object','word','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'object', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'learn', promptVi:'Chia động từ learn ở hiện tại đơn với the children.', hint:'learn'},
  ['The children learn new words every day.']);

addSentence('first-second-person', 'In the evening my parents read newspapers.', 'Vào buổi tối bố mẹ tôi đọc báo.', 3, ['affirmative', 'family'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('evening','noun','prep-object','evening','sg'), tok('my','determiner','det'), tok('parents','noun','subject','parents','pl'), tok('read','verb','verb','read','present-other'), tok('newspapers','noun','object','newspaper','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'object', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:5, ans:'read', promptVi:'Chia động từ read ở hiện tại đơn với my parents.', hint:'read'},
  ['My parents read newspapers in the evening.']);

addSentence('first-second-person', 'At the weekend we relax at home.', 'Vào cuối tuần chúng tôi thư giãn ở nhà.', 3, ['affirmative'],
  [tok('At','preposition','prep'), tok('the','article','det'), tok('weekend','noun','prep-object','weekend','sg'), tok('we','pronoun','subject'), tok('relax','verb','verb','relax','present-other'), tok('at','preposition','prep'), tok('home','noun','prep-object','home','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'relax', promptVi:'Chia động từ relax ở hiện tại đơn với we.', hint:'relax'},
  ['We relax at home at the weekend.']);

addSentence('first-second-person', 'On Saturday I ride my bicycle with my friend.', 'Vào thứ Bảy tôi đạp xe cùng bạn.', 3, ['affirmative', 'transport'],
  [tok('On','preposition','prep'), tok('Saturday','noun','prep-object','Saturday','sg'), tok('I','pronoun','subject'), tok('ride','verb','verb','ride','present-other'), tok('my','determiner','det'), tok('bicycle','noun','object','bicycle','sg'), tok('with','preposition','prep'), tok('my','determiner','det'), tok('friend','noun','prep-object','friend','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:3, ans:'ride', promptVi:'Chia động từ ride ở hiện tại đơn với I.', hint:'ride'},
  ['I ride my bicycle with my friend on Saturday.']);

addSentence('first-second-person', 'In the library they read books.', 'Trong thư viện họ đọc sách.', 3, ['affirmative', 'study'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('library','noun','prep-object','library','sg'), tok('they','pronoun','subject'), tok('read','verb','verb','read','present-other'), tok('books','noun','object','book','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'object', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:4, ans:'read', promptVi:'Chia động từ read ở hiện tại đơn với they.', hint:'read'},
  ['They read books in the library.']);

addSentence('first-second-person', 'Every morning we wash our faces.', 'Mỗi sáng chúng tôi đều rửa mặt.', 3, ['affirmative', 'daily'],
  [tok('Every','determiner','det'), tok('morning','noun','adverbial','morning','sg'), tok('we','pronoun','subject'), tok('wash','verb','verb','wash','present-other'), tok('our','determiner','det'), tok('faces','noun','object','face','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:3, ans:'wash', promptVi:'Chia động từ wash ở hiện tại đơn với we.', hint:'wash'},
  ['We wash our faces every morning.']);

console.log(`B1 Group 2 done: ${sentences.length} sentences.`);

// -------------------------------------------------------------------------
// GROUP 3: negative-don-doesnt (40 sentences: 0091 - 0130)
// don't (20 sentences) + doesn't (20 sentences) + V(base)
// -------------------------------------------------------------------------

// don't (20)
addSentence('negative-don-doesnt', 'They don\'t like fish.', 'Họ không thích cá.', 1, ['negative', 'food'],
  [tok('They','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('like','verb','verb','like','base'), tok('fish','noun','object','fish','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với they.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'I don\'t drink coffee.', 'Tôi không uống cà phê.', 1, ['negative', 'drink'],
  [tok('I','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('drink','verb','verb','drink','base'), tok('coffee','noun','object','coffee','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với I.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'We don\'t watch TV in the morning.', 'Chúng tôi không xem tivi vào buổi sáng.', 1, ['negative'],
  [tok('We','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('watch','verb','verb','watch','base'), tok('TV','noun','object','tv','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với we.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'You don\'t eat meat.', 'Bạn không ăn thịt.', 1, ['negative', 'food'],
  [tok('You','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('eat','verb','verb','eat','base'), tok('meat','noun','object','meat','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với you.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'The students don\'t walk to school.', 'Các học sinh không đi bộ đến trường.', 1, ['negative'],
  [tok('The','article','det'), tok('students','noun','subject','student','pl'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('walk','verb','verb','walk','base'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với the students.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'They don\'t live in a big house.', 'Họ không sống ở một ngôi nhà lớn.', 2, ['negative'],
  [tok('They','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('live','verb','verb','live','base'), tok('in','preposition','prep'), tok('a','article','det'), tok('big','adjective','modifier'), tok('house','noun','prep-object','house','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với they.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'I don\'t ride a bicycle to school.', 'Tôi không đạp xe đến trường.', 2, ['negative', 'transport'],
  [tok('I','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('ride','verb','verb','ride','base'), tok('a','article','det'), tok('bicycle','noun','object','bicycle','sg'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với I.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'We don\'t have English on Wednesday.', 'Chúng tôi không có môn tiếng Anh vào thứ Tư.', 2, ['negative', 'school'],
  [tok('We','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('have','verb','verb','have','base'), tok('English','noun','object','English','uncountable'), tok('on','preposition','prep'), tok('Wednesday','noun','prep-object','Wednesday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với we.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'You don\'t read comics in class.', 'Bạn không đọc truyện tranh trong lớp.', 2, ['negative'],
  [tok('You','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('read','verb','verb','read','base'), tok('comics','noun','object','comic','pl'), tok('in','preposition','prep'), tok('class','noun','prep-object','class','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với you.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'Cats don\'t swim in the pool.', 'Mèo không bơi trong hồ bơi.', 2, ['negative', 'animal'],
  [tok('Cats','noun','subject','cat','pl'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('swim','verb','verb','swim','base'), tok('in','preposition','prep'), tok('the','article','det'), tok('pool','noun','prep-object','pool','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với cats.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'My parents don\'t wake up late.', 'Bố mẹ tôi không thức dậy muộn.', 2, ['negative', 'family'],
  [tok('My','determiner','det'), tok('parents','noun','subject','parents','pl'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('wake','verb','verb','wake','base'), tok('up','particle','particle'), tok('late','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với my parents.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'We don\'t buy expensive toys.', 'Chúng tôi không mua đồ chơi đắt tiền.', 2, ['negative'],
  [tok('We','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('buy','verb','verb','buy','base'), tok('expensive','adjective','modifier'), tok('toys','noun','object','toy','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với we.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'They don\'t speak French well.', 'Họ không nói tiếng Pháp giỏi.', 2, ['negative'],
  [tok('They','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('speak','verb','verb','speak','base'), tok('French','noun','object','French','uncountable'), tok('well','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với they.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'You don\'t clean your desk.', 'Bạn không dọn dẹp bàn học của mình.', 2, ['negative'],
  [tok('You','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('clean','verb','verb','clean','base'), tok('your','determiner','det'), tok('desk','noun','object','desk','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với you.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'I don\'t eat candy before dinner.', 'Tôi không ăn kẹo trước bữa tối.', 2, ['negative', 'food'],
  [tok('I','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('eat','verb','verb','eat','base'), tok('candy','noun','object','candy','uncountable'), tok('before','preposition','prep'), tok('dinner','noun','prep-object','dinner','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với I.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'We don\'t play games on Monday.', 'Chúng tôi không chơi trò chơi vào thứ Hai.', 2, ['negative', 'game'],
  [tok('We','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('play','verb','verb','play','base'), tok('games','noun','object','game','pl'), tok('on','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với we.', hint:'do not / don\'t'});

addSentence('negative-don-doesnt', 'On Sunday they don\'t go to school.', 'Vào Chủ nhật họ không đi học.', 3, ['negative'],
  [tok('On','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), tok('they','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('go','verb','verb','go','base'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với they.', hint:'do not / don\'t'},
  ['They don\'t go to school on Sunday.']);

addSentence('negative-don-doesnt', 'In the evening I don\'t drink green tea.', 'Vào buổi tối tôi không uống trà xanh.', 3, ['negative', 'drink'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('evening','noun','prep-object','evening','sg'), tok('I','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('drink','verb','verb','drink','base'), tok('green','adjective','modifier'), tok('tea','noun','object','tea','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4, 5]}, {clauseId:'c1', role:'object', tokenIndices:[6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với I.', hint:'do not / don\'t'},
  ['I don\'t drink green tea in the evening.']);

addSentence('negative-don-doesnt', 'Today we don\'t have math.', 'Hôm nay chúng tôi không có môn toán.', 3, ['negative', 'school'],
  [tok('Today','adverb','adverbial'), tok('we','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('have','verb','verb','have','base'), tok('math','noun','object','math','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với we.', hint:'do not / don\'t'},
  ['We don\'t have math today.']);

addSentence('negative-don-doesnt', 'At night the children don\'t play outside.', 'Vào ban đêm lũ trẻ không chơi ở ngoài.', 3, ['negative'],
  [tok('At','preposition','prep'), tok('night','noun','prep-object','night','sg'), tok('the','article','det'), tok('children','noun','subject','children','pl'), tok('don\'t','verb','verb','do','aux-present-other-neg'), tok('play','verb','verb','play','base'), tok('outside','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4, 5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'don\'t', alt:['do not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với the children.', hint:'do not / don\'t'},
  ['The children don\'t play outside at night.']);

// doesn't (20)
addSentence('negative-don-doesnt', 'He doesn\'t like spiders.', 'Cậu ấy không thích nhện.', 1, ['negative', 'animal'],
  [tok('He','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('like','verb','verb','like','base'), tok('spiders','noun','object','spider','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với he.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'She doesn\'t eat meat.', 'Cô ấy không ăn thịt.', 1, ['negative', 'food'],
  [tok('She','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('eat','verb','verb','eat','base'), tok('meat','noun','object','meat','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với she.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'Nam doesn\'t play tennis on Monday.', 'Nam không chơi quần vợt vào thứ Hai.', 1, ['negative', 'sport'],
  [tok('Nam','noun','subject','Nam','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('play','verb','verb','play','base'), tok('tennis','noun','object','tennis','uncountable'), tok('on','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với Nam.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'The dog doesn\'t bite.', 'Chú chó không cắn người.', 1, ['negative', 'animal'],
  [tok('The','article','det'), tok('dog','noun','subject','dog','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('bite','verb','verb','bite','base'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với the dog.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'My brother doesn\'t drink milk.', 'Anh trai tôi không uống sữa.', 1, ['negative', 'drink', 'family'],
  [tok('My','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('drink','verb','verb','drink','base'), tok('milk','noun','object','milk','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với my brother.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'She doesn\'t watch horror movies.', 'Cô ấy không xem phim kinh dị.', 2, ['negative'],
  [tok('She','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('watch','verb','verb','watch','base'), tok('horror','noun','modifier','horror','sg'), tok('movies','noun','object','movie','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với she.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'He doesn\'t drive a car.', 'Cậu ấy không lái xe ô tô.', 2, ['negative', 'transport'],
  [tok('He','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('drive','verb','verb','drive','base'), tok('a','article','det'), tok('car','noun','object','car','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với he.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'Lan doesn\'t study science on Tuesday.', 'Lan không học môn khoa học vào thứ Ba.', 2, ['negative', 'school'],
  [tok('Lan','noun','subject','Lan','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('study','verb','verb','study','base'), tok('science','noun','object','science','uncountable'), tok('on','preposition','prep'), tok('Tuesday','noun','prep-object','Tuesday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với Lan.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'The cat doesn\'t eat bread.', 'Con mèo không ăn bánh mì.', 2, ['negative', 'animal'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('eat','verb','verb','eat','base'), tok('bread','noun','object','bread','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với the cat.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'Peter doesn\'t ride a bike to school.', 'Peter không đi xe đạp đến trường.', 2, ['negative', 'transport'],
  [tok('Peter','noun','subject','Peter','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('ride','verb','verb','ride','base'), tok('a','article','det'), tok('bike','noun','object','bike','sg'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với Peter.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'His father doesn\'t work on Sunday.', 'Bố cậu ấy không làm việc vào Chủ nhật.', 2, ['negative', 'family'],
  [tok('His','determiner','det'), tok('father','noun','subject','father','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('work','verb','verb','work','base'), tok('on','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với his father.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'She doesn\'t speak Chinese.', 'Cô ấy không nói tiếng Trung.', 2, ['negative'],
  [tok('She','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('speak','verb','verb','speak','base'), tok('Chinese','noun','object','Chinese','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với she.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'He doesn\'t clean his room.', 'Cậu ấy không dọn phòng của mình.', 2, ['negative'],
  [tok('He','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('clean','verb','verb','clean','base'), tok('his','determiner','det'), tok('room','noun','object','room','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với he.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'The bird doesn\'t fly at night.', 'Chú chim không bay vào ban đêm.', 2, ['negative', 'nature'],
  [tok('The','article','det'), tok('bird','noun','subject','bird','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('fly','verb','verb','fly','base'), tok('at','preposition','prep'), tok('night','noun','prep-object','night','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với the bird.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'Mary doesn\'t cook dinner.', 'Mary không nấu bữa tối.', 2, ['negative'],
  [tok('Mary','noun','subject','Mary','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('cook','verb','verb','cook','base'), tok('dinner','noun','object','dinner','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với Mary.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'Tom doesn\'t play tennis.', 'Tom không chơi quần vợt.', 2, ['negative', 'sport'],
  [tok('Tom','noun','subject','Tom','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('play','verb','verb','play','base'), tok('tennis','noun','object','tennis','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với Tom.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'My sister doesn\'t like cold milk.', 'Em gái tôi không thích sữa lạnh.', 2, ['negative', 'family'],
  [tok('My','determiner','det'), tok('sister','noun','subject','sister','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('like','verb','verb','like','base'), tok('cold','adjective','modifier'), tok('milk','noun','object','milk','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2, 3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với my sister.', hint:'does not / doesn\'t'});

addSentence('negative-don-doesnt', 'On Friday he doesn\'t swim.', 'Vào thứ Sáu cậu ấy không bơi.', 3, ['negative', 'sport'],
  [tok('On','preposition','prep'), tok('Friday','noun','prep-object','Friday','sg'), tok('he','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('swim','verb','verb','swim','base'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1]}, {clauseId:'c1', role:'subject', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với he.', hint:'does not / doesn\'t'},
  ['He doesn\'t swim on Friday.']);

addSentence('negative-don-doesnt', 'In the morning she doesn\'t drink tea.', 'Vào buổi sáng cô ấy không uống trà.', 3, ['negative', 'drink'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('morning','noun','prep-object','morning','sg'), tok('she','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('drink','verb','verb','drink','base'), tok('tea','noun','object','tea','uncountable'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4, 5]}, {clauseId:'c1', role:'object', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với she.', hint:'does not / doesn\'t'},
  ['She doesn\'t drink tea in the morning.']);

addSentence('negative-don-doesnt', 'At the weekend Nam doesn\'t wake up early.', 'Vào cuối tuần Nam không thức dậy sớm.', 3, ['negative'],
  [tok('At','preposition','prep'), tok('the','article','det'), tok('weekend','noun','prep-object','weekend','sg'), tok('Nam','noun','subject','Nam','sg'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), tok('wake','verb','verb','wake','base'), tok('up','particle','particle'), tok('early','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3]}, {clauseId:'c1', role:'verb', tokenIndices:[4, 5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'doesn\'t', alt:['does not'], promptVi:'Điền trợ động từ phủ định ở hiện tại đơn với Nam.', hint:'does not / doesn\'t'},
  ['Nam doesn\'t wake up early at the weekend.']);

console.log(`B1 Group 3 done: ${sentences.length} sentences.`);

// -------------------------------------------------------------------------
// GROUP 4: question-do-does (40 sentences: 0131 - 0170)
// Do / Does + S + V(base)...? + Short answers
// -------------------------------------------------------------------------

// Do questions (20)
addSentence('question-do-does', 'Do you like apples?', 'Bạn có thích táo không?', 1, ['question', 'food'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('like','verb','verb','like','base'), tok('apples','noun','object','apple','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với you.', hint:'Do'});

addSentence('question-do-does', 'Yes, I do.', 'Vâng, tôi thích.', 1, ['short-answer'],
  [tok('Yes','interjection','particle'), punctComma, tok('I','pronoun','subject'), tok('do','verb','verb','do','present-other'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'do', promptVi:'Hoàn thành câu trả lời ngắn khẳng định với I.', hint:'do'});

addSentence('question-do-does', 'No, I don\'t.', 'Không, tôi không thích.', 1, ['short-answer', 'negative'],
  [tok('No','interjection','particle'), punctComma, tok('I','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'don\'t', alt:['do not'], promptVi:'Hoàn thành câu trả lời ngắn phủ định với I.', hint:'don\'t'});

addSentence('question-do-does', 'Do they play badminton?', 'Họ có chơi cầu lông không?', 1, ['question', 'sport'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('they','pronoun','subject'), tok('play','verb','verb','play','base'), tok('badminton','noun','object','badminton','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với they.', hint:'Do'});

addSentence('question-do-does', 'Yes, they do.', 'Vâng, họ có chơi.', 1, ['short-answer'],
  [tok('Yes','interjection','particle'), punctComma, tok('they','pronoun','subject'), tok('do','verb','verb','do','present-other'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'do', promptVi:'Hoàn thành câu trả lời ngắn khẳng định với they.', hint:'do'});

addSentence('question-do-does', 'No, they don\'t.', 'Không, họ không chơi.', 1, ['short-answer', 'negative'],
  [tok('No','interjection','particle'), punctComma, tok('they','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'don\'t', alt:['do not'], promptVi:'Hoàn thành câu trả lời ngắn phủ định với they.', hint:'don\'t'});

addSentence('question-do-does', 'Do you speak English?', 'Bạn có nói tiếng Anh không?', 1, ['question'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('speak','verb','verb','speak','base'), tok('English','noun','object','English','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với you.', hint:'Do'});

addSentence('question-do-does', 'Do we have English today?', 'Hôm nay chúng ta có môn tiếng Anh không?', 2, ['question', 'school'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('we','pronoun','subject'), tok('have','verb','verb','have','base'), tok('English','noun','object','English','uncountable'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với we.', hint:'Do'});

addSentence('question-do-does', 'Yes, we do.', 'Vâng, chúng ta có.', 1, ['short-answer'],
  [tok('Yes','interjection','particle'), punctComma, tok('we','pronoun','subject'), tok('do','verb','verb','do','present-other'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'do', promptVi:'Hoàn thành câu trả lời ngắn khẳng định với we.', hint:'do'});

addSentence('question-do-does', 'No, we don\'t.', 'Không, chúng ta không có.', 1, ['short-answer', 'negative'],
  [tok('No','interjection','particle'), punctComma, tok('we','pronoun','subject'), tok('don\'t','verb','verb','do','aux-present-other-neg'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'don\'t', alt:['do not'], promptVi:'Hoàn thành câu trả lời ngắn phủ định với we.', hint:'don\'t'});

addSentence('question-do-does', 'Do you drink milk every morning?', 'Bạn có uống sữa mỗi sáng không?', 2, ['question', 'drink'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('drink','verb','verb','drink','base'), tok('milk','noun','object','milk','uncountable'), tok('every','determiner','det'), tok('morning','noun','adverbial','morning','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với you.', hint:'Do'});

addSentence('question-do-does', 'Do the students walk to school?', 'Các bạn học sinh có đi bộ đến trường không?', 2, ['question'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('the','article','det'), tok('students','noun','subject','student','pl'), tok('walk','verb','verb','walk','base'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 3]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với the students.', hint:'Do'});

addSentence('question-do-does', 'Do they live near the park?', 'Họ có sống ở gần công viên không?', 2, ['question'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('they','pronoun','subject'), tok('live','verb','verb','live','base'), tok('near','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với they.', hint:'Do'});

addSentence('question-do-does', 'Do you eat breakfast at seven?', 'Bạn có ăn sáng lúc bảy giờ không?', 2, ['question', 'daily'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('eat','verb','verb','eat','base'), tok('breakfast','noun','object','breakfast','uncountable'), tok('at','preposition','prep'), tok('seven','numeral','prep-object'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với you.', hint:'Do'});

addSentence('question-do-does', 'Do your friends play soccer on Sunday?', 'Bạn bè của bạn có chơi bóng đá vào Chủ nhật không?', 2, ['question', 'sport'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('your','determiner','det'), tok('friends','noun','subject','friend','pl'), tok('play','verb','verb','play','base'), tok('soccer','noun','object','soccer','uncountable'), tok('on','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 3]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với your friends.', hint:'Do'});

addSentence('question-do-does', 'Do cats like water?', 'Mèo có thích nước không?', 2, ['question', 'animal'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('cats','noun','subject','cat','pl'), tok('like','verb','verb','like','base'), tok('water','noun','object','water','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với cats.', hint:'Do'});

addSentence('question-do-does', 'Do you wash your hands before dinner?', 'Bạn có rửa tay trước bữa tối không?', 2, ['question', 'daily'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('wash','verb','verb','wash','base'), tok('your','determiner','det'), tok('hands','noun','object','hand','pl'), tok('before','preposition','prep'), tok('dinner','noun','prep-object','dinner','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với you.', hint:'Do'});

addSentence('question-do-does', 'Do they read books in the library?', 'Họ có đọc sách trong thư viện không?', 3, ['question', 'study'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('they','pronoun','subject'), tok('read','verb','verb','read','base'), tok('books','noun','object','book','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('library','noun','prep-object','library','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với they.', hint:'Do'});

addSentence('question-do-does', 'Do we clean the room on Friday?', 'Chúng ta có dọn phòng vào thứ Sáu không?', 3, ['question'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('we','pronoun','subject'), tok('clean','verb','verb','clean','base'), tok('the','article','det'), tok('room','noun','object','room','sg'), tok('on','preposition','prep'), tok('Friday','noun','prep-object','Friday','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với we.', hint:'Do'});

addSentence('question-do-does', 'Do you wake up early on Monday?', 'Bạn có thức dậy sớm vào thứ Hai không?', 3, ['question', 'daily'],
  [tok('Do','verb','verb','do','aux-present-other'), tok('you','pronoun','subject'), tok('wake','verb','verb','wake','base'), tok('up','particle','particle'), tok('early','adverb','adverbial'), tok('on','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Do', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với you.', hint:'Do'});

// Does questions (20)
addSentence('question-do-does', 'Does he play soccer?', 'Cậu ấy có chơi bóng đá không?', 1, ['question', 'sport'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('he','pronoun','subject'), tok('play','verb','verb','play','base'), tok('soccer','noun','object','soccer','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với he.', hint:'Does'});

addSentence('question-do-does', 'Yes, he does.', 'Vâng, cậu ấy có chơi.', 1, ['short-answer'],
  [tok('Yes','interjection','particle'), punctComma, tok('he','pronoun','subject'), tok('does','verb','verb','do','present-3sg'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'does', promptVi:'Hoàn thành câu trả lời ngắn khẳng định với he.', hint:'does'});

addSentence('question-do-does', 'No, he doesn\'t.', 'Không, cậu ấy không chơi.', 1, ['short-answer', 'negative'],
  [tok('No','interjection','particle'), punctComma, tok('he','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'doesn\'t', alt:['does not'], promptVi:'Hoàn thành câu trả lời ngắn phủ định với he.', hint:'doesn\'t'});

addSentence('question-do-does', 'Does she speak English?', 'Cô ấy có nói tiếng Anh không?', 1, ['question'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('she','pronoun','subject'), tok('speak','verb','verb','speak','base'), tok('English','noun','object','English','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với she.', hint:'Does'});

addSentence('question-do-does', 'Yes, she does.', 'Vâng, cô ấy có nói.', 1, ['short-answer'],
  [tok('Yes','interjection','particle'), punctComma, tok('she','pronoun','subject'), tok('does','verb','verb','do','present-3sg'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'does', promptVi:'Hoàn thành câu trả lời ngắn khẳng định với she.', hint:'does'});

addSentence('question-do-does', 'No, she doesn\'t.', 'Không, cô ấy không nói.', 1, ['short-answer', 'negative'],
  [tok('No','interjection','particle'), punctComma, tok('she','pronoun','subject'), tok('doesn\'t','verb','verb','do','aux-present-3sg-neg'), punctDot],
  [], ['pos','fill','order'], {idx:3, ans:'doesn\'t', alt:['does not'], promptVi:'Hoàn thành câu trả lời ngắn phủ định với she.', hint:'doesn\'t'});

addSentence('question-do-does', 'Does the cat drink milk?', 'Con mèo có uống sữa không?', 1, ['question', 'animal'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('the','article','det'), tok('cat','noun','subject','cat','sg'), tok('drink','verb','verb','drink','base'), tok('milk','noun','object','milk','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 3]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với the cat.', hint:'Does'});

addSentence('question-do-does', 'Does Nam live in Hanoi?', 'Nam có sống ở Hà Nội không?', 1, ['question'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('Nam','noun','subject','Nam','sg'), tok('live','verb','verb','live','base'), tok('in','preposition','prep'), tok('Hanoi','noun','prep-object','Hanoi','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với Nam.', hint:'Does'});

addSentence('question-do-does', 'Does your father drive a car?', 'Bố của bạn có lái xe ô tô không?', 2, ['question', 'transport', 'family'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('your','determiner','det'), tok('father','noun','subject','father','sg'), tok('drive','verb','verb','drive','base'), tok('a','article','det'), tok('car','noun','object','car','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 3]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với your father.', hint:'Does'});

addSentence('question-do-does', 'Does Lan study math on Monday?', 'Lan có học môn toán vào thứ Hai không?', 2, ['question', 'school'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('Lan','noun','subject','Lan','sg'), tok('study','verb','verb','study','base'), tok('math','noun','object','math','uncountable'), tok('on','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với Lan.', hint:'Does'});

addSentence('question-do-does', 'Does Peter ride a bicycle to school?', 'Peter có đạp xe đến trường không?', 2, ['question', 'transport'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('Peter','noun','subject','Peter','sg'), tok('ride','verb','verb','ride','base'), tok('a','article','det'), tok('bicycle','noun','object','bicycle','sg'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với Peter.', hint:'Does'});

addSentence('question-do-does', 'Does your mother cook dinner every day?', 'Mẹ của bạn có nấu bữa tối mỗi ngày không?', 2, ['question', 'family'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('your','determiner','det'), tok('mother','noun','subject','mother','sg'), tok('cook','verb','verb','cook','base'), tok('dinner','noun','object','dinner','uncountable'), tok('every','determiner','det'), tok('day','noun','adverbial','day','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 3]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'object', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với your mother.', hint:'Does'});

addSentence('question-do-does', 'Does he watch TV in the evening?', 'Cậu ấy có xem tivi vào buổi tối không?', 2, ['question'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('he','pronoun','subject'), tok('watch','verb','verb','watch','base'), tok('TV','noun','object','tv','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('evening','noun','prep-object','evening','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với he.', hint:'Does'});

addSentence('question-do-does', 'Does Tom wash his hands before lunch?', 'Tom có rửa tay trước bữa trưa không?', 2, ['question', 'daily'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('Tom','noun','subject','Tom','sg'), tok('wash','verb','verb','wash','base'), tok('his','determiner','det'), tok('hands','noun','object','hand','pl'), tok('before','preposition','prep'), tok('lunch','noun','prep-object','lunch','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với Tom.', hint:'Does'});

addSentence('question-do-does', 'Does Mary do her homework in the afternoon?', 'Mary có làm bài tập về nhà vào buổi chiều không?', 2, ['question'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('Mary','noun','subject','Mary','sg'), tok('do','verb','verb','do','base'), tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('afternoon','noun','prep-object','afternoon','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với Mary.', hint:'Does'});

addSentence('question-do-does', 'Does she teach English at school?', 'Cô ấy có dạy tiếng Anh ở trường không?', 2, ['question', 'school'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('she','pronoun','subject'), tok('teach','verb','verb','teach','base'), tok('English','noun','object','English','uncountable'), tok('at','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với she.', hint:'Does'});

addSentence('question-do-does', 'Does he play badminton with his father on Saturday?', 'Cậu ấy có chơi cầu lông với bố vào thứ Bảy không?', 3, ['question', 'sport'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('he','pronoun','subject'), tok('play','verb','verb','play','base'), tok('badminton','noun','object','badminton','uncountable'), tok('with','preposition','prep'), tok('his','determiner','det'), tok('father','noun','prep-object','father','sg'), tok('on','preposition','prep'), tok('Saturday','noun','prep-object','Saturday','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7, 8]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với he.', hint:'Does'});

addSentence('question-do-does', 'Does the bird sing in the tree every morning?', 'Chú chim có hót trên cây mỗi sáng không?', 3, ['question', 'nature'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('the','article','det'), tok('bird','noun','subject','bird','sg'), tok('sing','verb','verb','sing','base'), tok('in','preposition','prep'), tok('the','article','det'), tok('tree','noun','prep-object','tree','sg'), tok('every','determiner','det'), tok('morning','noun','adverbial','morning','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 3]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7, 8]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với the bird.', hint:'Does'});

addSentence('question-do-does', 'Does she buy fresh fruit at the market on Sunday?', 'Cô ấy có mua trái cây tươi ở chợ vào Chủ nhật không?', 3, ['question'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('she','pronoun','subject'), tok('buy','verb','verb','buy','base'), tok('fresh','adjective','modifier'), tok('fruit','noun','object','fruit','uncountable'), tok('at','preposition','prep'), tok('the','article','det'), tok('market','noun','prep-object','market','sg'), tok('on','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}, {clauseId:'c1', role:'adverbial', tokenIndices:[8, 9]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với she.', hint:'Does'});

addSentence('question-do-does', 'Does Nam wake up early on Sunday morning?', 'Nam có thức dậy sớm vào sáng Chủ nhật không?', 3, ['question', 'daily'],
  [tok('Does','verb','verb','do','aux-present-3sg'), tok('Nam','noun','subject','Nam','sg'), tok('wake','verb','verb','wake','base'), tok('up','particle','particle'), tok('early','adverb','adverbial'), tok('on','preposition','prep'), tok('Sunday','noun','modifier','Sunday','sg'), tok('morning','noun','prep-object','morning','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Does', promptVi:'Điền trợ động từ nghi vấn hiện tại đơn với Nam.', hint:'Does'});

console.log(`B1 Group 4 done: ${sentences.length} sentences.`);

// -------------------------------------------------------------------------
// GROUP 5: adverbs-frequency (30 sentences: 0171 - 0200)
// always, usually, often, sometimes, never + V
// -------------------------------------------------------------------------

// always (6)
addSentence('adverbs-frequency', 'He always gets up early.', 'Cậu ấy luôn luôn thức dậy sớm.', 1, ['frequency', 'daily'],
  [tok('He','pronoun','subject'), tok('always','adverb','adverbial'), tok('gets','verb','verb','get','present-3sg'), tok('up','particle','particle'), tok('early','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'always', promptVi:'Điền trạng từ tần suất: luôn luôn (100%).', hint:'always'});

addSentence('adverbs-frequency', 'She always brushes her teeth.', 'Cô ấy luôn luôn đánh răng.', 1, ['frequency', 'daily'],
  [tok('She','pronoun','subject'), tok('always','adverb','adverbial'), tok('brushes','verb','verb','brush','present-3sg'), tok('her','determiner','det'), tok('teeth','noun','object','tooth','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'always', promptVi:'Điền trạng từ tần suất: luôn luôn.', hint:'always'});

addSentence('adverbs-frequency', 'They always eat breakfast.', 'Họ luôn luôn ăn sáng.', 1, ['frequency', 'daily'],
  [tok('They','pronoun','subject'), tok('always','adverb','adverbial'), tok('eat','verb','verb','eat','present-other'), tok('breakfast','noun','object','breakfast','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'always', promptVi:'Điền trạng từ tần suất: luôn luôn.', hint:'always'});

addSentence('adverbs-frequency', 'I always do my homework.', 'Tôi luôn luôn làm bài tập về nhà.', 2, ['frequency', 'school'],
  [tok('I','pronoun','subject'), tok('always','adverb','adverbial'), tok('do','verb','verb','do','present-other'), tok('my','determiner','det'), tok('homework','noun','object','homework','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'always', promptVi:'Điền trạng từ tần suất: luôn luôn.', hint:'always'});

addSentence('adverbs-frequency', 'We always listen to the teacher.', 'Chúng tôi luôn luôn lắng nghe cô giáo.', 2, ['frequency', 'school'],
  [tok('We','pronoun','subject'), tok('always','adverb','adverbial'), tok('listen','verb','verb','listen','present-other'), tok('to','preposition','prep'), tok('the','article','det'), tok('teacher','noun','prep-object','teacher','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'always', promptVi:'Điền trạng từ tần suất: luôn luôn.', hint:'always'});

addSentence('adverbs-frequency', 'My father always reads the newspaper.', 'Bố tôi luôn luôn đọc báo.', 3, ['frequency', 'family'],
  [tok('My','determiner','det'), tok('father','noun','subject','father','sg'), tok('always','adverb','adverbial'), tok('reads','verb','verb','read','present-3sg'), tok('the','article','det'), tok('newspaper','noun','object','newspaper','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'always', promptVi:'Điền trạng từ tần suất: luôn luôn.', hint:'always'});

// usually (6)
addSentence('adverbs-frequency', 'She usually walks to school.', 'Cô ấy thường xuyên đi bộ đến trường.', 1, ['frequency'],
  [tok('She','pronoun','subject'), tok('usually','adverb','adverbial'), tok('walks','verb','verb','walk','present-3sg'), tok('to','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'usually', promptVi:'Điền trạng từ tần suất: thường xuyên (~80%).', hint:'usually'});

addSentence('adverbs-frequency', 'He usually plays soccer after school.', 'Cậu ấy thường xuyên chơi bóng đá sau giờ học.', 1, ['frequency', 'sport'],
  [tok('He','pronoun','subject'), tok('usually','adverb','adverbial'), tok('plays','verb','verb','play','present-3sg'), tok('soccer','noun','object','soccer','uncountable'), tok('after','preposition','prep'), tok('school','noun','prep-object','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'usually', promptVi:'Điền trạng từ tần suất: thường xuyên.', hint:'usually'});

addSentence('adverbs-frequency', 'They usually eat lunch at home.', 'Họ thường xuyên ăn trưa ở nhà.', 2, ['frequency', 'daily'],
  [tok('They','pronoun','subject'), tok('usually','adverb','adverbial'), tok('eat','verb','verb','eat','present-other'), tok('lunch','noun','object','lunch','uncountable'), tok('at','preposition','prep'), tok('home','noun','prep-object','home','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'usually', promptVi:'Điền trạng từ tần suất: thường xuyên.', hint:'usually'});

addSentence('adverbs-frequency', 'I usually drink warm milk.', 'Tôi thường xuyên uống sữa ấm.', 2, ['frequency', 'drink'],
  [tok('I','pronoun','subject'), tok('usually','adverb','adverbial'), tok('drink','verb','verb','drink','present-other'), tok('warm','adjective','modifier'), tok('milk','noun','object','milk','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'usually', promptVi:'Điền trạng từ tần suất: thường xuyên.', hint:'usually'});

addSentence('adverbs-frequency', 'We usually visit our grandparents on Sunday.', 'Chúng tôi thường xuyên thăm ông bà vào Chủ nhật.', 2, ['frequency', 'family'],
  [tok('We','pronoun','subject'), tok('usually','adverb','adverbial'), tok('visit','verb','verb','visit','present-other'), tok('our','determiner','det'), tok('grandparents','noun','object','grandparents','pl'), tok('on','preposition','prep'), tok('Sunday','noun','prep-object','Sunday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'usually', promptVi:'Điền trạng từ tần suất: thường xuyên.', hint:'usually'});

addSentence('adverbs-frequency', 'Lan usually does her homework in the afternoon.', 'Lan thường xuyên làm bài tập về nhà vào buổi chiều.', 3, ['frequency', 'study'],
  [tok('Lan','noun','subject','Lan','sg'), tok('usually','adverb','adverbial'), tok('does','verb','verb','do','present-3sg'), tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('afternoon','noun','prep-object','afternoon','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'usually', promptVi:'Điền trạng từ tần suất: thường xuyên.', hint:'usually'});

// often (6)
addSentence('adverbs-frequency', 'They often play badminton in the park.', 'Họ thường chơi cầu lông trong công viên.', 1, ['frequency', 'sport'],
  [tok('They','pronoun','subject'), tok('often','adverb','adverbial'), tok('play','verb','verb','play','present-other'), tok('badminton','noun','object','badminton','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'often', promptVi:'Điền trạng từ tần suất: thường (~60%).', hint:'often'});

addSentence('adverbs-frequency', 'He often reads books in the library.', 'Cậu ấy thường đọc sách trong thư viện.', 1, ['frequency', 'study'],
  [tok('He','pronoun','subject'), tok('often','adverb','adverbial'), tok('reads','verb','verb','read','present-3sg'), tok('books','noun','object','book','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('library','noun','prep-object','library','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'often', promptVi:'Điền trạng từ tần suất: thường.', hint:'often'});

addSentence('adverbs-frequency', 'I often help my mother.', 'Tôi thường giúp đỡ mẹ tôi.', 2, ['frequency', 'family'],
  [tok('I','pronoun','subject'), tok('often','adverb','adverbial'), tok('help','verb','verb','help','present-other'), tok('my','determiner','det'), tok('mother','noun','object','mother','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'often', promptVi:'Điền trạng từ tần suất: thường.', hint:'often'});

addSentence('adverbs-frequency', 'She often watches movies on Saturday.', 'Cô ấy thường xem phim vào thứ Bảy.', 2, ['frequency'],
  [tok('She','pronoun','subject'), tok('often','adverb','adverbial'), tok('watches','verb','verb','watch','present-3sg'), tok('movies','noun','object','movie','pl'), tok('on','preposition','prep'), tok('Saturday','noun','prep-object','Saturday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'often', promptVi:'Điền trạng từ tần suất: thường.', hint:'often'});

addSentence('adverbs-frequency', 'We often swim in the summer.', 'Chúng tôi thường đi bơi vào mùa hè.', 2, ['frequency', 'sport'],
  [tok('We','pronoun','subject'), tok('often','adverb','adverbial'), tok('swim','verb','verb','swim','present-other'), tok('in','preposition','prep'), tok('the','article','det'), tok('summer','noun','prep-object','summer','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'often', promptVi:'Điền trạng từ tần suất: thường.', hint:'often'});

addSentence('adverbs-frequency', 'Tom often rides his bicycle in the afternoon.', 'Tom thường đạp xe vào buổi chiều.', 3, ['frequency', 'transport'],
  [tok('Tom','noun','subject','Tom','sg'), tok('often','adverb','adverbial'), tok('rides','verb','verb','ride','present-3sg'), tok('his','determiner','det'), tok('bicycle','noun','object','bicycle','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('afternoon','noun','prep-object','afternoon','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'often', promptVi:'Điền trạng từ tần suất: thường.', hint:'often'});

// sometimes (6)
addSentence('adverbs-frequency', 'I sometimes read comics.', 'Thỉnh thoảng tôi đọc truyện tranh.', 1, ['frequency'],
  [tok('I','pronoun','subject'), tok('sometimes','adverb','adverbial'), tok('read','verb','verb','read','present-other'), tok('comics','noun','object','comic','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sometimes', promptVi:'Điền trạng từ tần suất: thỉnh thoảng (~40%).', hint:'sometimes'});

addSentence('adverbs-frequency', 'She sometimes eats ice cream.', 'Thỉnh thoảng cô ấy ăn kem.', 1, ['frequency', 'food'],
  [tok('She','pronoun','subject'), tok('sometimes','adverb','adverbial'), tok('eats','verb','verb','eat','present-3sg'), tok('ice','noun','modifier','ice','uncountable'), tok('cream','noun','object','cream','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sometimes', promptVi:'Điền trạng từ tần suất: thỉnh thoảng.', hint:'sometimes'});

addSentence('adverbs-frequency', 'He sometimes plays chess with his father.', 'Thỉnh thoảng cậu ấy chơi cờ vua với bố.', 2, ['frequency', 'game'],
  [tok('He','pronoun','subject'), tok('sometimes','adverb','adverbial'), tok('plays','verb','verb','play','present-3sg'), tok('chess','noun','object','chess','uncountable'), tok('with','preposition','prep'), tok('his','determiner','det'), tok('father','noun','prep-object','father','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sometimes', promptVi:'Điền trạng từ tần suất: thỉnh thoảng.', hint:'sometimes'});

addSentence('adverbs-frequency', 'They sometimes go to the cinema.', 'Thỉnh thoảng họ đi xem phim.', 2, ['frequency'],
  [tok('They','pronoun','subject'), tok('sometimes','adverb','adverbial'), tok('go','verb','verb','go','present-other'), tok('to','preposition','prep'), tok('the','article','det'), tok('cinema','noun','prep-object','cinema','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sometimes', promptVi:'Điền trạng từ tần suất: thỉnh thoảng.', hint:'sometimes'});

addSentence('adverbs-frequency', 'We sometimes cook dinner together.', 'Thỉnh thoảng chúng tôi cùng nhau nấu bữa tối.', 2, ['frequency', 'daily'],
  [tok('We','pronoun','subject'), tok('sometimes','adverb','adverbial'), tok('cook','verb','verb','cook','present-other'), tok('dinner','noun','object','dinner','uncountable'), tok('together','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sometimes', promptVi:'Điền trạng từ tần suất: thỉnh thoảng.', hint:'sometimes'});

addSentence('adverbs-frequency', 'The cat sometimes sleeps on the chair.', 'Thỉnh thoảng con mèo ngủ trên ghế.', 3, ['frequency', 'animal'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('sometimes','adverb','adverbial'), tok('sleeps','verb','verb','sleep','present-3sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('chair','noun','prep-object','chair','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'sometimes', promptVi:'Điền trạng từ tần suất: thỉnh thoảng.', hint:'sometimes'});

// never (6)
addSentence('adverbs-frequency', 'She never drinks coffee.', 'Cô ấy không bao giờ uống cà phê.', 1, ['frequency', 'drink'],
  [tok('She','pronoun','subject'), tok('never','adverb','adverbial'), tok('drinks','verb','verb','drink','present-3sg'), tok('coffee','noun','object','coffee','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'never', promptVi:'Điền trạng từ tần suất: không bao giờ (0%).', hint:'never'});

addSentence('adverbs-frequency', 'He never eats spicy food.', 'Cậu ấy không bao giờ ăn đồ cay.', 1, ['frequency', 'food'],
  [tok('He','pronoun','subject'), tok('never','adverb','adverbial'), tok('eats','verb','verb','eat','present-3sg'), tok('spicy','adjective','modifier'), tok('food','noun','object','food','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'never', promptVi:'Điền trạng từ tần suất: không bao giờ.', hint:'never'});

addSentence('adverbs-frequency', 'They never wake up late on Monday.', 'Họ không bao giờ thức dậy muộn vào thứ Hai.', 2, ['frequency', 'daily'],
  [tok('They','pronoun','subject'), tok('never','adverb','adverbial'), tok('wake','verb','verb','wake','present-other'), tok('up','particle','particle'), tok('late','adverb','adverbial'), tok('on','preposition','prep'), tok('Monday','noun','prep-object','Monday','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'never', promptVi:'Điền trạng từ tần suất: không bao giờ.', hint:'never'});

addSentence('adverbs-frequency', 'I never watch TV at midnight.', 'Tôi không bao giờ xem tivi vào lúc nửa đêm.', 2, ['frequency'],
  [tok('I','pronoun','subject'), tok('never','adverb','adverbial'), tok('watch','verb','verb','watch','present-other'), tok('TV','noun','object','tv','sg'), tok('at','preposition','prep'), tok('midnight','noun','prep-object','midnight','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'object', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'never', promptVi:'Điền trạng từ tần suất: không bao giờ.', hint:'never'});

addSentence('adverbs-frequency', 'We never talk in the library.', 'Chúng tôi không bao giờ nói chuyện trong thư viện.', 2, ['frequency'],
  [tok('We','pronoun','subject'), tok('never','adverb','adverbial'), tok('talk','verb','verb','talk','present-other'), tok('in','preposition','prep'), tok('the','article','det'), tok('library','noun','prep-object','library','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'adverbial', tokenIndices:[1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'never', promptVi:'Điền trạng từ tần suất: không bao giờ.', hint:'never'});

addSentence('adverbs-frequency', 'The dog never bites children.', 'Chú chó không bao giờ cắn trẻ em.', 3, ['frequency', 'animal'],
  [tok('The','article','det'), tok('dog','noun','subject','dog','sg'), tok('never','adverb','adverbial'), tok('bites','verb','verb','bite','present-3sg'), tok('children','noun','object','children','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'object', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'bites', promptVi:'Chia động từ bite ở hiện tại đơn với the dog.', hint:'bite → bites'});

console.log(`Total B1 sentences: ${sentences.length}`);

// Fix #10.1/#10.2/#10.3 (docs/english-content-fix-list-v3.md): particle vào cụm động từ; lemma số nhiều; trợ động từ câu trả lời ngắn.
{
  const PLURAL_LEMMA = { parents: 'parent', grandparents: 'grandparent', children: 'child' };
  const AUX = { 'present-other': 'aux-present-other', 'present-3sg': 'aux-present-3sg' };
  for (const s of sentences) {
    // #10.2: danh từ số nhiều dùng lemma số ít
    for (const t of s.tokens)
      if (t.pos === 'noun' && t.feature === 'pl' && PLURAL_LEMMA[t.lemma]) t.lemma = PLURAL_LEMMA[t.lemma];
    // #10.1: gom particle (pos 'particle', KHÔNG phải interjection "Yes") vào cụm động từ
    const verbSpan = s.roleSpans.find((r) => r.role === 'verb');
    if (verbSpan) {
      const parts = s.tokens.map((t, i) => (t.pos === 'particle' ? i : -1)).filter((i) => i >= 0);
      if (parts.length)
        verbSpan.tokenIndices = [...new Set([...verbSpan.tokenIndices, ...parts])].sort((a, b) => a - b);
    }
    // #10.3: do/does là trợ động từ khi là động từ cuối cùng của câu trả lời ngắn
    const nonPunct = s.tokens.filter((t) => t.pos !== 'punct');
    const last = nonPunct[nonPunct.length - 1];
    if (last && last.pos === 'verb' && last.lemma === 'do' && AUX[last.feature]) last.feature = AUX[last.feature];
  }
}

// Lưu sentences B1
fs.writeFileSync(path.join(DATA_DIR, 'B1.sentences.json'), JSON.stringify(applyContentReviewV4('B1.sentences.json', sentences.map(applyReviewedOrder)), null, 2), 'utf-8');
console.log(`✅ Generated B1.sentences.json with ${sentences.length} sentences.`);

// -------------------------------------------------------------------------
// THEORY PAGE: B1.theory.json
// -------------------------------------------------------------------------
const theory = {
  id: 'B1',
  title: 'Thì Hiện tại đơn (Present Simple Tense)',
  level: 'B1',
  summary: 'Học cách sử dụng thì Hiện tại đơn để nói về thói quen, sự thật hiển nhiên; cách chia động từ theo các ngôi; cách dùng trợ động từ do/does trong câu phủ định, nghi vấn và các trạng từ tần suất.',
  formulas: [
    {
      label: 'Khẳng định với I / You / We / They / Số nhiều',
      pattern: 'S + V (nguyên mẫu)',
      example: 'I like apples. / They play soccer.'
    },
    {
      label: 'Khẳng định với He / She / It / Số ít',
      pattern: 'S + V-s / -es / -ies / has',
      example: 'She plays tennis. / He watches TV. / Nam studies English.'
    },
    {
      label: 'Phủ định',
      pattern: 'S + don\'t / doesn\'t + V (nguyên mẫu)',
      example: 'They don\'t like fish. / He doesn\'t drink coffee.'
    },
    {
      label: 'Nghi vấn Yes/No',
      pattern: 'Do / Does + S + V (nguyên mẫu)? → Yes, S + do/does. | No, S + don\'t/doesn\'t.',
      example: 'Do you play badminton? → Yes, I do. / Does she speak English? → No, she doesn\'t.'
    },
    {
      label: 'Trạng từ tần suất',
      pattern: 'S + [always / usually / often / sometimes / never] + V',
      example: 'He always gets up early. / She never drinks coffee.'
    }
  ],
  sections: [
    {
      heading: '1. Khẳng định: Quy tắc thêm -s / -es / -ies vào động từ',
      body: 'Ở thì Hiện tại đơn, khi chủ ngữ là ngôi thứ ba số ít (he, she, it hoặc danh từ số ít như Nam, the cat, my brother), động từ phải chia thêm đuôi:\n- Thêm \'-s\' vào hầu hết các động từ thông thường: play → plays, read → reads, eat → eats.\n- Thêm \'-es\' vào động từ tận cùng bằng ch, sh, s, x, z, o: watch → watches, wash → washes, brush → brushes, teach → teaches, go → goes, do → does.\n- Động từ kết thúc bằng phụ âm + y: đổi y thành \'-ies\': study → studies, fly → flies.\n- Động từ bất quy tắc đặc biệt: have đổi thành has.',
      table: {
        columns: ['Đuôi động từ', 'Quy tắc chia', 'Ví dụ'],
        rows: [
          ['Thông thường', 'Thêm -s', 'plays, reads, eats, drinks, runs, clean, cooks'],
          ['Tận cùng ch, sh, s, x, z, o', 'Thêm -es', 'watches, washes, brushes, teaches, goes, does'],
          ['Phụ âm + y', 'Đổi y thành -ies', 'study → studies, fly → flies'],
          ['Động từ have', 'has', 'have → has']
        ]
      },
      exampleIds: ['B1-s-0001', 'B1-s-0011', 'B1-s-0012', 'B1-s-0018', 'B1-s-0020']
    },
    {
      heading: '2. Khẳng định với I, You, We, They và Danh từ số nhiều',
      body: 'Khi chủ ngữ là I, You, We, They hoặc danh từ số nhiều (the students, my parents, cats), động từ giữ NGUYÊN MẪU (không thêm -s hay -es).',
      table: {
        columns: ['Chủ ngữ', 'Dạng động từ', 'Ví dụ'],
        rows: [
          ['I / You / We / They', 'V nguyên mẫu', 'I like apples. / We play soccer. / They live in Hanoi.'],
          ['Danh từ số nhiều', 'V nguyên mẫu', 'The students learn English. / My parents cook dinner.']
        ]
      },
      exampleIds: ['B1-s-0052', 'B1-s-0053', 'B1-s-0054', 'B1-s-0056']
    },
    {
      heading: '3. Phủ định: Don\'t và Doesn\'t',
      body: 'Để tạo câu phủ định, ta thêm trợ động từ do/does cùng với not (don\'t hoặc doesn\'t) đứng trước động từ chính:\n- Chủ ngữ I, You, We, They, danh từ số nhiều → dùng \'don\'t\' (do not).\n- Chủ ngữ He, She, It, danh từ số ít → dùng \'doesn\'t\' (does not).\nLưu ý quan trọng: Sau don\'t và doesn\'t, động từ chính luôn trở về NGUYÊN MẪU (bỏ đuôi -s/-es)!',
      table: {
        columns: ['Chủ ngữ', 'Trợ động từ phủ định', 'Động từ chính', 'Ví dụ'],
        rows: [
          ['I / You / We / They', 'don\'t', 'V nguyên mẫu', 'They don\'t like fish. / I don\'t drink coffee.'],
          ['He / She / It', 'doesn\'t', 'V nguyên mẫu (bỏ s)', 'He doesn\'t like spiders. / She doesn\'t eat meat.']
        ]
      },
      exampleIds: ['B1-s-0092', 'B1-s-0093', 'B1-s-0112', 'B1-s-0113']
    },
    {
      heading: '4. Nghi vấn Yes/No với Do và Does',
      body: 'Để đặt câu hỏi Yes/No, ta đảo trợ động từ Do hoặc Does lên đầu câu:\n- Do + I / you / we / they + V nguyên mẫu ...?\n- Does + he / she / it + V nguyên mẫu ...?\nCách trả lời ngắn:\n- Yes, S + do/does. (Ví dụ: Yes, I do. / Yes, he does.)\n- No, S + don\'t/doesn\'t. (Ví dụ: No, I don\'t. / No, she doesn\'t.)',
      table: {
        columns: ['Cấu trúc hỏi', 'Trả lời Yes', 'Trả lời No', 'Ví dụ'],
        rows: [
          ['Do + you/they/we + V?', 'Yes, S + do.', 'No, S + don\'t.', 'Do you like apples? → Yes, I do.'],
          ['Does + he/she/it + V?', 'Yes, S + does.', 'No, S + doesn\'t.', 'Does he play soccer? → No, he doesn\'t.']
        ]
      },
      exampleIds: ['B1-s-0132', 'B1-s-0133', 'B1-s-0134', 'B1-s-0152', 'B1-s-0153', 'B1-s-0154']
    },
    {
      heading: '5. Trạng từ chỉ tần suất (Adverbs of Frequency)',
      body: 'Trạng từ chỉ tần suất diễn tả mức độ thường xuyên của hành động:\n- always (100% - luôn luôn)\n- usually (~80% - thường xuyên)\n- often (~60% - thường)\n- sometimes (~40% - thỉnh thoảng)\n- never (0% - không bao giờ)\nVị trí: Đứng TRƯỚC động từ thường (He always gets up early) nhưng đứng SAU động từ To Be (He is always happy).',
      table: {
        columns: ['Trạng từ', 'Mức độ', 'Ví dụ'],
        rows: [
          ['always', '100% (luôn luôn)', 'He always gets up early.'],
          ['usually', '~80% (thường xuyên)', 'She usually walks to school.'],
          ['often', '~60% (thường)', 'They often play badminton in the park.'],
          ['sometimes', '~40% (thỉnh thoảng)', 'I sometimes read comics.'],
          ['never', '0% (không bao giờ)', 'She never drinks coffee.']
        ]
      },
      exampleIds: ['B1-s-0172', 'B1-s-0178', 'B1-s-0184', 'B1-s-0190', 'B1-s-0196']
    }
  ],
  commonMistakes: [
    {
      wrong: 'He play soccer on Monday.',
      right: 'He plays soccer on Monday.',
      why: 'Chủ ngữ ngôi thứ ba số ít (he) ở câu khẳng định hiện tại đơn bắt buộc động từ phải thêm -s (plays).'
    },
    {
      wrong: 'She doesn\'t likes apples.',
      right: 'She doesn\'t like apples.',
      why: 'Sau trợ động từ doesn\'t, động từ chính like bắt buộc trở về dạng nguyên mẫu (bỏ đuôi s).'
    },
    {
      wrong: 'Does he plays tennis?',
      right: 'Does he play tennis?',
      why: 'Trong câu hỏi có trợ động từ Does, động từ chính play phải ở dạng nguyên mẫu.'
    },
    {
      wrong: 'He gets up always early.',
      right: 'He always gets up early.',
      why: 'Trạng từ chỉ tần suất (always) đứng trước động từ thường (gets up).'
    }
  ],
  tips: [
    'Quy tắc -s/-es: Cứ thấy he, she, it hoặc danh từ số ít làm chủ ngữ khẳng định thì động từ phải "thêm đuôi s/es" nhé!',
    'Quy tắc trợ động từ: Một khi đã có Do / Does / Don\'t / Doesn\'t "gánh vác" thì động từ chính phía sau được "nghỉ ngơi" ở dạng nguyên mẫu!',
    'Vị trí trạng từ tần suất: Đứng TRƯỚC động từ thường (always play) nhưng đứng SAU To Be (is always).'
  ]
};

fs.writeFileSync(path.join(DATA_DIR, 'B1.theory.json'), JSON.stringify(applyContentReviewV4('B1.theory.json', applyTheoryReview(theory)), null, 2), 'utf-8');
console.log('✅ Generated B1.theory.json.');
