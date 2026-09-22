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
const punctExcl = { text: '!', pos: 'punct', role: 'punct' };
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
    if (['.', ',', '?', '!', ':', ';'].includes(t.text)) return acc + t.text;
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

  const id = `B2-s-${String(sIdx++).padStart(4, '0')}`;
  const blank = {
    tokenIndex: blankDef.idx,
    answer: blankDef.ans,
    hint: blankDef.hint,
    promptVi: blankDef.promptVi
  };
  if (blankDef.alt) blank.alt = blankDef.alt;

  const item = {
    id,
    level: 'B2',
    topic: 'present-continuous',
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

// =========================================================================
// BUILD 200 SENTENCES
// =========================================================================

// --- Helper for simple affirmative SV(O)(A) ---
function addAff(subjTokens, beText, beFeat, vText, vLemma, restTokens, vi, diff, tags, blankIsV, promptVi, hint, extraSpans = []) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of subjTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const beIdx = curIdx++;
  tokens.push(tok(beText, 'verb', 'verb', 'be', beFeat));

  const vIdx = curIdx++;
  tokens.push(tok(vText, 'verb', 'verb', vLemma, 'ing'));

  const restSpans = [];
  if (restTokens && restTokens.length > 0) {
    for (const rt of restTokens) {
      const rIdx = curIdx++;
      tokens.push(rt);
      if (rt.role === 'object') {
        restSpans.push({ clauseId: 'c1', role: 'object', tokenIndices: [rIdx] });
      } else if (rt.role === 'adverbial') {
        restSpans.push({ clauseId: 'c1', role: 'adverbial', tokenIndices: [rIdx] });
      }
    }
  }
  tokens.push(punctDot);

  const roleSpans = [
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    { clauseId: 'c1', role: 'verb', tokenIndices: [beIdx, vIdx] },
    ...restSpans,
    ...extraSpans
  ];

  const blankDef = blankIsV
    ? { idx: vIdx, ans: vText, promptVi, hint }
    : { idx: beIdx, ans: beText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('affirmative', en, vi, diff, ['affirmative', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// --- Helper for negative SV(O)(A) ---
function addNeg(subjTokens, negBeText, negBeFeat, vText, vLemma, restTokens, vi, diff, tags, blankIsV, promptVi, hint) {
  const tokens = [];
  const sIndices = [];
  let curIdx = 0;

  for (const st of subjTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const beIdx = curIdx++;
  const separateNot = negBeText === 'am not';
  tokens.push(tok(separateNot ? 'am' : negBeText, 'verb', 'verb', 'be', separateNot ? 'present-1sg' : negBeFeat));
  if (separateNot) {
    tokens.push(tok('not', 'adverb', 'adverbial'));
    curIdx++;
  }

  const vIdx = curIdx++;
  tokens.push(tok(vText, 'verb', 'verb', vLemma, 'ing'));

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
    { clauseId: 'c1', role: 'verb', tokenIndices: separateNot ? [beIdx, beIdx + 1, vIdx] : [beIdx, vIdx] },
    ...restSpans
  ];

  const blankDef = blankIsV
    ? { idx: vIdx, ans: vText, promptVi, hint }
    : { idx: beIdx, ans: separateNot ? 'am' : negBeText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('negative', en, vi, diff, ['negative', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// --- Helper for Yes/No Question ---
function addQ(beText, beFeat, subjTokens, vText, vLemma, restTokens, vi, diff, tags, blankIsV, promptVi, hint) {
  const tokens = [];
  let curIdx = 0;

  const beIdx = curIdx++;
  tokens.push(tok(beText, 'verb', 'verb', 'be', beFeat));

  const sIndices = [];
  for (const st of subjTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const vIdx = curIdx++;
  tokens.push(tok(vText, 'verb', 'verb', vLemma, 'ing'));

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
    { clauseId: 'c1', role: 'verb', tokenIndices: [beIdx, vIdx] },
    { clauseId: 'c1', role: 'subject', tokenIndices: sIndices },
    ...restSpans
  ];

  const blankDef = blankIsV
    ? { idx: vIdx, ans: vText, promptVi, hint }
    : { idx: beIdx, ans: beText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('yes-no-question', en, vi, diff, ['question', ...tags], tokens, roleSpans, ['pos', 'fill', 'order', 'roles'], blankDef);
}

// -------------------------------------------------------------------------
// 1. AFFIRMATIVE SENTENCES (60 câu: B2-s-0001 -> B2-s-0060)
// -------------------------------------------------------------------------

// I am + V-ing (10)
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'reading', 'read', [tok('a','article','det'), tok('book','noun','object','book','sg')], 'Tôi đang đọc một cuốn sách.', 1, ['study'], true, 'Điền dạng tiếp diễn của read với chủ ngữ I.', 'read → reading');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'drawing', 'draw', [tok('a','article','det'), tok('cat','noun','object','cat','sg')], 'Tôi đang vẽ một con mèo.', 1, ['art'], true, 'Điền dạng tiếp diễn của draw với chủ ngữ I.', 'draw → drawing');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'eating', 'eat', [tok('lunch','noun','object','lunch','uncountable')], 'Tôi đang ăn bữa trưa.', 1, ['food'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'drinking', 'drink', [tok('water','noun','object','water','uncountable')], 'Tôi đang uống nước.', 1, ['drink'], false, 'Điền trợ động từ to be đi với chủ ngữ I.', 'I + am');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'cooking', 'cook', [tok('dinner','noun','object','dinner','uncountable')], 'Tôi đang nấu bữa tối.', 1, ['daily'], true, 'Điền dạng tiếp diễn của cook.', 'cook → cooking');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'cleaning', 'clean', [tok('my','determiner','det'), tok('room','noun','object','room','sg')], 'Tôi đang dọn dẹp phòng của mình.', 2, ['daily'], true, 'Điền dạng tiếp diễn của clean.', 'clean → cleaning');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'washing', 'wash', [tok('the','article','det'), tok('dishes','noun','object','dish','pl')], 'Tôi đang rửa bát đĩa.', 2, ['daily'], true, 'Điền dạng tiếp diễn của wash.', 'wash → washing');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'waiting', 'wait', [tok('for','preposition','adverbial'), tok('the','article','det'), tok('bus','noun','adverbial','bus','sg')], 'Tôi đang đợi xe buýt.', 2, ['transport'], true, 'Điền dạng tiếp diễn của wait.', 'wait → waiting');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'watering', 'water', [tok('the','article','det'), tok('flowers','noun','object','flower','pl')], 'Tôi đang tưới hoa.', 2, ['nature'], true, 'Điền dạng tiếp diễn của water.', 'water → watering');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'studying', 'study', [tok('English','noun','object','English','uncountable')], 'Tôi đang học tiếng Anh.', 2, ['school'], true, 'Điền dạng tiếp diễn của study.', 'study → studying');

// He / She / It + is + V-ing (20)
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'reading', 'read', [tok('a','article','det'), tok('comic','noun','object','comic','sg')], 'Cậu ấy đang đọc truyện tranh.', 1, ['study'], false, 'Điền dạng đúng của to be với he.', 'he + is');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'singing', 'sing', [tok('a','article','det'), tok('song','noun','object','song','sg')], 'Cô ấy đang hát một bài hát.', 1, ['music'], true, 'Điền dạng tiếp diễn của sing.', 'sing → singing');
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'painting', 'paint', [tok('a','article','det'), tok('picture','noun','object','picture','sg')], 'Cậu ấy đang vẽ một bức tranh màu.', 1, ['art'], true, 'Điền dạng tiếp diễn của paint.', 'paint → painting');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'helping', 'help', [tok('her','determiner','det'), tok('mother','noun','object','mother','sg')], 'Cô ấy đang giúp đỡ mẹ mình.', 1, ['family'], true, 'Điền dạng tiếp diễn của help.', 'help → helping');
addAff([tok('The','article','det'), tok('cat','noun','subject','cat','sg')], 'is', 'aux-present-3sg', 'sleeping', 'sleep', [], 'Con mèo đang ngủ.', 1, ['animal'], true, 'Điền dạng tiếp diễn của sleep.', 'sleep → sleeping');
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'eating', 'eat', [tok('an','article','det'), tok('apple','noun','object','apple','sg')], 'Cậu ấy đang ăn một quả táo.', 1, ['food'], false, 'Điền to be phù hợp với He.', 'he + is');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'drinking', 'drink', [tok('orange','noun','modifier','orange','sg'), tok('juice','noun','object','juice','uncountable')], 'Cô ấy đang uống nước cam.', 1, ['drink'], true, 'Điền dạng tiếp diễn của drink.', 'drink → drinking');
addAff([tok('Nam','noun','subject','Nam','sg')], 'is', 'aux-present-3sg', 'kicking', 'kick', [tok('the','article','det'), tok('ball','noun','object','ball','sg')], 'Nam đang đá quả bóng.', 1, ['sport'], true, 'Điền dạng tiếp diễn của kick.', 'kick → kicking');
addAff([tok('The','article','det'), tok('dog','noun','subject','dog','sg')], 'is', 'aux-present-3sg', 'catching', 'catch', [tok('the','article','det'), tok('ball','noun','object','ball','sg')], 'Chú chó đang bắt quả bóng.', 2, ['animal'], true, 'Điền dạng tiếp diễn của catch.', 'catch → catching');
addAff([tok('My','determiner','det'), tok('mother','noun','subject','mother','sg')], 'is', 'aux-present-3sg', 'cooking', 'cook', [tok('soup','noun','object','soup','uncountable')], 'Mẹ tôi đang nấu súp.', 1, ['family', 'food'], false, 'Điền to be với My mother (ngôi 3 số ít).', 'mother + is');

addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'wearing', 'wear', [tok('a','article','det'), tok('blue','adjective','modifier'), tok('shirt','noun','object','shirt','sg')], 'Cậu ấy đang mặc một chiếc áo sơ mi màu xanh.', 2, ['clothes'], true, 'Điền dạng tiếp diễn của wear.', 'wear → wearing');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'playing', 'play', [tok('the','article','det'), tok('piano','noun','object','piano','sg')], 'Cô ấy đang chơi đàn piano.', 2, ['music'], true, 'Điền dạng tiếp diễn của play.', 'play → playing');
addAff([tok('My','determiner','det'), tok('father','noun','subject','father','sg')], 'is', 'aux-present-3sg', 'watching', 'watch', [tok('television','noun','object','television','uncountable')], 'Bố tôi đang xem truyền hình.', 2, ['family'], true, 'Điền dạng tiếp diễn của watch.', 'watch → watching');
addAff([tok('The','article','det'), tok('bird','noun','subject','bird','sg')], 'is', 'aux-present-3sg', 'flying', 'fly', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('sky','noun','adverbial','sky','sg')], 'Chú chim đang bay trên bầu trời.', 2, ['nature'], true, 'Điền dạng tiếp diễn của fly.', 'fly → flying');
addAff([tok('Lan','noun','subject','Lan','sg')], 'is', 'aux-present-3sg', 'doing', 'do', [tok('her','determiner','det'), tok('homework','noun','object','homework','uncountable')], 'Lan đang làm bài tập về nhà.', 2, ['school'], true, 'Điền dạng tiếp diễn của do.', 'do → doing');
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'brushing', 'brush', [tok('his','determiner','det'), tok('teeth','noun','object','tooth','pl')], 'Cậu ấy đang đánh răng.', 2, ['daily'], true, 'Điền dạng tiếp diễn của brush.', 'brush → brushing');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'listening', 'listen', [tok('to','preposition','adverbial'), tok('music','noun','adverbial','music','uncountable')], 'Cô ấy đang nghe nhạc.', 2, ['music'], true, 'Điền dạng tiếp diễn của listen.', 'listen → listening');
addAff([tok('Tom','noun','subject','Tom','sg')], 'is', 'aux-present-3sg', 'carrying', 'carry', [tok('a','article','det'), tok('schoolbag','noun','object','schoolbag','sg')], 'Tom đang mang một chiếc cặp đi học.', 2, ['school'], true, 'Điền dạng tiếp diễn của carry.', 'carry → carrying');
addAff([tok('The','article','det'), tok('baby','noun','subject','baby','sg')], 'is', 'aux-present-3sg', 'crying','cry', [], 'Em bé đang khóc.', 1, ['daily'], true, 'Điền dạng tiếp diễn của cry.', 'cry → crying');
addAff([tok('Grandfather','noun','subject','grandfather','sg')], 'is', 'aux-present-3sg', 'watering', 'water', [tok('green','adjective','modifier'), tok('trees','noun','object','tree','pl')], 'Ông đang tưới những cái cây xanh.', 2, ['nature'], true, 'Điền dạng tiếp diễn của water.', 'water → watering');

// We / They / Plural + are + V-ing (30)
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'playing', 'play', [tok('football','noun','object','football','uncountable')], 'Chúng tôi đang chơi bóng đá.', 1, ['sport'], false, 'Điền to be đi với We.', 'We + are');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'learning', 'learn', [tok('English','noun','object','English','uncountable')], 'Họ đang học tiếng Anh.', 1, ['school'], false, 'Điền to be đi với They.', 'They + are');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'eating', 'eat', [tok('sandwiches','noun','object','sandwich','pl')], 'Chúng tôi đang ăn bánh mì kẹp.', 1, ['food'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'drinking', 'drink', [tok('milk','noun','object','milk','uncountable')], 'Họ đang uống sữa.', 1, ['drink'], true, 'Điền dạng tiếp diễn của drink.', 'drink → drinking');
addAff([tok('The','article','det'), tok('children','noun','subject','child','pl')], 'are', 'aux-present-other', 'singing', 'sing', [], 'Lũ trẻ đang hát.', 1, ['music'], false, 'Điền to be đi với The children (danh từ số nhiều).', 'children + are');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'watching', 'watch', [tok('a','article','det'), tok('movie','noun','object','movie','sg')], 'Họ đang xem một bộ phim.', 2, ['hobby'], true, 'Điền dạng tiếp diễn của watch.', 'watch → watching');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'building', 'build', [tok('a','article','det'), tok('sandcastle','noun','object','sandcastle','sg')], 'Chúng tôi đang xây một lâu đài cát.', 2, ['toy'], true, 'Điền dạng tiếp diễn của build.', 'build → building');
addAff([tok('Students','noun','subject','student','pl')], 'are', 'aux-present-other', 'cleaning', 'clean', [tok('the','article','det'), tok('classroom','noun','object','classroom','sg')], 'Các học sinh đang lau dọn lớp học.', 2, ['school'], true, 'Điền dạng tiếp diễn của clean.', 'clean → cleaning');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'playing', 'play', [tok('chess','noun','object','chess','uncountable')], 'Họ đang chơi cờ vua.', 1, ['game'], true, 'Điền dạng tiếp diễn của play.', 'play → playing');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'drawing', 'draw', [tok('pictures','noun','object','picture','pl')], 'Chúng tôi đang vẽ những bức tranh.', 1, ['art'], true, 'Điền dạng tiếp diễn của draw.', 'draw → drawing');

addAff([tok('The','article','det'), tok('boys','noun','subject','boy','pl')], 'are', 'aux-present-other', 'flying', 'fly', [tok('kites','noun','object','kite','pl')], 'Những cậu bé đang thả diều.', 2, ['toy'], true, 'Điền dạng tiếp diễn của fly.', 'fly → flying');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'feeding', 'feed', [tok('the','article','det'), tok('ducks','noun','object','duck','pl')], 'Họ đang cho vịt ăn.', 2, ['animal'], true, 'Điền dạng tiếp diễn của feed.', 'feed → feeding');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'waiting', 'wait', [tok('for','preposition','adverbial'), tok('our','determiner','det'), tok('teacher','noun','adverbial','teacher','sg')], 'Chúng tôi đang đợi cô giáo của mình.', 2, ['school'], true, 'Điền dạng tiếp diễn của wait.', 'wait → waiting');
addAff([tok('The','article','det'), tok('girls','noun','subject','girl','pl')], 'are', 'aux-present-other', 'talking', 'talk', [tok('to','preposition','adverbial'), tok('each','determiner','det'), tok('other','pronoun','adverbial')], 'Các cô bé đang trò chuyện với nhau.', 2, ['daily'], true, 'Điền dạng tiếp diễn của talk.', 'talk → talking');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'throwing', 'throw', [tok('the','article','det'), tok('ball','noun','object','ball','sg')], 'Họ đang ném quả bóng.', 2, ['sport'], true, 'Điền dạng tiếp diễn của throw.', 'throw → throwing');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'planting', 'plant', [tok('trees','noun','object','tree','pl')], 'Chúng tôi đang trồng cây.', 2, ['nature'], true, 'Điền dạng tiếp diễn của plant.', 'plant → planting');
addAff([tok('My','determiner','det'), tok('parents','noun','subject','parent','pl')], 'are', 'aux-present-other', 'cooking', 'cook', [tok('lunch','noun','object','lunch','uncountable')], 'Bố mẹ tôi đang nấu bữa trưa.', 2, ['family', 'food'], false, 'Điền to be đi với My parents (danh từ số nhiều).', 'parents + are');
addAff([tok('The','article','det'), tok('birds','noun','subject','bird','pl')], 'are', 'aux-present-other', 'singing', 'sing', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('tree','noun','adverbial','tree','sg')], 'Những chú chim đang hót trên cây.', 2, ['nature'], true, 'Điền dạng tiếp diễn của sing.', 'sing → singing');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'helping', 'help', [tok('the','article','det'), tok('teacher','noun','object','teacher','sg')], 'Họ đang giúp đỡ thầy giáo.', 2, ['school'], true, 'Điền dạng tiếp diễn của help.', 'help → helping');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'reading', 'read', [tok('storybooks','noun','object','storybook','pl')], 'Chúng tôi đang đọc những cuốn truyện.', 2, ['study'], true, 'Điền dạng tiếp diễn của read.', 'read → reading');

addAff([tok('The','article','det'), tok('monkeys','noun','subject','monkey','pl')], 'are', 'aux-present-other', 'climbing', 'climb', [tok('trees','noun','object','tree','pl')], 'Những con khỉ đang trèo cây.', 2, ['animal'], true, 'Điền dạng tiếp diễn của climb.', 'climb → climbing');
addAff([tok('You','pronoun','subject')], 'are', 'aux-present-other', 'doing', 'do', [tok('a','article','det'), tok('good','adjective','modifier'), tok('job','noun','object','job','sg')], 'Bạn đang làm rất tốt.', 2, ['school'], false, 'Điền to be với chủ ngữ You.', 'You + are');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'carrying', 'carry', [tok('heavy','adjective','modifier'), tok('boxes','noun','object','box','pl')], 'Họ đang bê những chiếc hộp nặng.', 3, ['daily'], true, 'Điền dạng tiếp diễn của carry.', 'carry → carrying');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'listening', 'listen', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('radio','noun','adverbial','radio','sg')], 'Chúng tôi đang nghe đài.', 2, ['hobby'], true, 'Điền dạng tiếp diễn của listen.', 'listen → listening');
addAff([tok('The','article','det'), tok('farmers','noun','subject','farmer','pl')], 'are', 'aux-present-other', 'working', 'work', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('field','noun','adverbial','field','sg')], 'Những người nông dân đang làm việc trên cánh đồng.', 3, ['job'], true, 'Điền dạng tiếp diễn của work.', 'work → working');
addAff([tok('You','pronoun','subject')], 'are', 'aux-present-other', 'eating', 'eat', [tok('my','determiner','det'), tok('apple','noun','object','apple','sg')], 'Bạn đang ăn quả táo của tôi.', 1, ['food'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'painting', 'paint', [tok('the','article','det'), tok('wall','noun','object','wall','sg')], 'Họ đang sơn bức tường.', 2, ['art'], true, 'Điền dạng tiếp diễn của paint.', 'paint → painting');
addAff([tok('Students','noun','subject','student','pl')], 'are', 'aux-present-other', 'studying', 'study', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('library','noun','adverbial','library','sg')], 'Các học sinh đang học bài trong thư viện.', 2, ['school'], true, 'Điền dạng tiếp diễn của study.', 'study → studying');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'playing', 'play', [tok('guitar','noun','object','guitar','sg')], 'Chúng tôi đang chơi đàn ghi-ta.', 2, ['music'], true, 'Điền dạng tiếp diễn của play.', 'play → playing');
addAff([tok('The','article','det'), tok('cats','noun','subject','cat','pl')], 'are', 'aux-present-other', 'drinking', 'drink', [tok('fresh','adjective','modifier'), tok('milk','noun','object','milk','uncountable')], 'Những con mèo đang uống sữa tươi.', 2, ['animal'], false, 'Điền to be đi với chủ ngữ The cats (số nhiều).', 'cats + are');

// -------------------------------------------------------------------------
// 2. NEGATIVE SENTENCES (45 câu: B2-s-0061 -> B2-s-0105)
// -------------------------------------------------------------------------

// I am not + V-ing (10)
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'sleeping', 'sleep', [], 'Lúc này, tôi không ngủ.', 1, ['daily'], false, 'Điền to be phủ định với chủ ngữ I.', 'I am not');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'watching', 'watch', [tok('TV','noun','object','TV','uncountable')], 'Hiện giờ, tôi không xem ti-vi.', 1, ['daily'], true, 'Điền dạng tiếp diễn của watch.', 'watch → watching');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'eating', 'eat', [tok('candy','noun','object','candy','uncountable')], 'Lúc này, tôi không ăn kẹo.', 1, ['food'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'playing', 'play', [tok('games','noun','object','game','pl')], 'Hiện giờ, tôi không chơi trò chơi.', 1, ['game'], true, 'Điền dạng tiếp diễn của play.', 'play → playing');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'crying', 'cry', [], 'Lúc này, tôi không khóc.', 1, ['feeling'], true, 'Điền dạng tiếp diễn của cry.', 'cry → crying');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'drinking', 'drink', [tok('coffee','noun','object','coffee','uncountable')], 'Hiện giờ, tôi không uống cà phê.', 2, ['drink'], false, 'Điền to be phủ định đi với I.', 'I am not');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'reading', 'read', [tok('comics','noun','object','comic','pl')], 'Lúc này, tôi không đọc truyện tranh.', 2, ['study'], true, 'Điền dạng tiếp diễn của read.', 'read → reading');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'cooking', 'cook', [tok('dinner','noun','object','dinner','uncountable')], 'Hiện giờ, tôi không nấu bữa tối.', 2, ['daily'], true, 'Điền dạng tiếp diễn của cook.', 'cook → cooking');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'flying', 'fly', [tok('a','article','det'), tok('kite','noun','object','kite','sg')], 'Lúc này, tôi không thả diều.', 2, ['toy'], true, 'Điền dạng tiếp diễn của fly.', 'fly → flying');
addNeg([tok('I','pronoun','subject')], 'am not', 'present-1sg-neg', 'waiting', 'wait', [tok('for','preposition','adverbial'), tok('you','pronoun','adverbial')], 'Hiện giờ, tôi không đợi bạn.', 2, ['daily'], true, 'Điền dạng tiếp diễn của wait.', 'wait → waiting');

// He / She / It isn't + V-ing (18)
addNeg([tok('He','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'sleeping', 'sleep', [], 'Lúc này, cậu ấy không ngủ.', 1, ['daily'], false, 'Điền dạng phủ định của to be với He.', "he isn't");
addNeg([tok('She','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'studying', 'study', [], 'Hiện giờ, cô ấy không học bài.', 1, ['school'], true, 'Điền dạng tiếp diễn của study.', 'study → studying');
addNeg([tok('The','article','det'), tok('dog','noun','subject','dog','sg')], "isn't", 'aux-present-3sg-neg', 'barking', 'bark', [], 'Lúc này, chú chó không sủa.', 1, ['animal'], false, 'Điền to be phủ định với The dog.', "dog isn't");
addNeg([tok('He','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'listening', 'listen', [tok('to','preposition','adverbial'), tok('music','noun','adverbial','music','uncountable')], 'Hiện giờ, cậu ấy không nghe nhạc.', 2, ['music'], true, 'Điền dạng tiếp diễn của listen.', 'listen → listening');
addNeg([tok('She','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'drawing', 'draw', [tok('a','article','det'), tok('flower','noun','object','flower','sg')], 'Lúc này, cô ấy không vẽ bông hoa.', 2, ['art'], true, 'Điền dạng tiếp diễn của draw.', 'draw → drawing');
addNeg([tok('Nam','noun','subject','Nam','sg')], "isn't", 'aux-present-3sg-neg', 'eating', 'eat', [tok('breakfast','noun','object','breakfast','uncountable')], 'Hiện giờ, Nam không ăn sáng.', 2, ['food'], false, 'Điền to be phủ định với Nam.', "Nam isn't");
addNeg([tok('The','article','det'), tok('baby','noun','subject','baby','sg')], "isn't", 'aux-present-3sg-neg', 'crying', 'cry', [], 'Lúc này, em bé không khóc.', 1, ['family'], true, 'Điền dạng tiếp diễn của cry.', 'cry → crying');
addNeg([tok('He','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'washing', 'wash', [tok('his','determiner','det'), tok('hands','noun','object','hand','pl')], 'Hiện giờ, cậu ấy không rửa tay.', 2, ['daily'], true, 'Điền dạng tiếp diễn của wash.', 'wash → washing');
addNeg([tok('She','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'cleaning', 'clean', [tok('the','article','det'), tok('kitchen','noun','object','kitchen','sg')], 'Lúc này, cô ấy không lau dọn nhà bếp.', 2, ['home'], true, 'Điền dạng tiếp diễn của clean.', 'clean → cleaning');
addNeg([tok('He','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'watching', 'watch', [tok('cartoons','noun','object','cartoon','pl')], 'Hiện giờ, cậu ấy không xem phim hoạt hình.', 2, ['hobby'], false, 'Điền to be phủ định với he.', "he isn't");

addNeg([tok('She','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'wearing', 'wear', [tok('a','article','det'), tok('coat','noun','object','coat','sg')], 'Lúc này, cô ấy không mặc áo khoác.', 2, ['clothes'], true, 'Điền dạng tiếp diễn của wear.', 'wear → wearing');
addNeg([tok('The','article','det'), tok('cat','noun','subject','cat','sg')], "isn't", 'aux-present-3sg-neg', 'drinking', 'drink', [tok('water','noun','object','water','uncountable')], 'Hiện giờ, con mèo không uống nước.', 2, ['animal'], true, 'Điền dạng tiếp diễn của drink.', 'drink → drinking');
addNeg([tok('My','determiner','det'), tok('brother','noun','subject','brother','sg')], "isn't", 'aux-present-3sg-neg', 'playing', 'play', [tok('chess','noun','object','chess','uncountable')], 'Lúc này, anh trai tôi không chơi cờ vua.', 2, ['family'], false, 'Điền to be phủ định với My brother.', "brother isn't");
addNeg([tok('Lan','noun','subject','Lan','sg')], "isn't", 'aux-present-3sg-neg', 'reading', 'read', [tok('a','article','det'), tok('letter','noun','object','letter','sg')], 'Hiện giờ, Lan không đọc một lá thư.', 2, ['daily'], true, 'Điền dạng tiếp diễn của read.', 'read → reading');
addNeg([tok('He','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'kicking', 'kick', [tok('the','article','det'), tok('ball','noun','object','ball','sg')], 'Lúc này, cậu ấy không đá quả bóng.', 2, ['sport'], true, 'Điền dạng tiếp diễn của kick.', 'kick → kicking');
addNeg([tok('She','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'helping', 'help', [tok('her','determiner','det'), tok('sister','noun','object','sister','sg')], 'Hiện giờ, cô ấy không giúp em gái mình.', 2, ['family'], true, 'Điền dạng tiếp diễn của help.', 'help → helping');
addNeg([tok('The','article','det'), tok('bird','noun','subject','bird','sg')], "isn't", 'aux-present-3sg-neg', 'singing', 'sing', [], 'Lúc này, chú chim không hót.', 1, ['nature'], false, 'Điền to be phủ định với The bird.', "bird isn't");
addNeg([tok('He','pronoun','subject')], "isn't", 'aux-present-3sg-neg', 'watering', 'water', [tok('the','article','det'), tok('plants','noun','object','plant','pl')], 'Hiện giờ, cậu ấy không tưới cây.', 2, ['nature'], true, 'Điền dạng tiếp diễn của water.', 'water → watering');

// We / They / Plural aren't + V-ing (17)
addNeg([tok('We','pronoun','subject')], "aren't", 'aux-present-other-neg', 'sleeping', 'sleep', [], 'Lúc này, chúng tôi không ngủ.', 1, ['daily'], false, 'Điền to be phủ định đi với We.', "we aren't");
addNeg([tok('They','pronoun','subject')], "aren't", 'aux-present-other-neg', 'studying', 'study', [tok('math','noun','object','math','uncountable')], 'Hiện giờ, họ không học môn toán.', 2, ['school'], true, 'Điền dạng tiếp diễn của study.', 'study → studying');
addNeg([tok('We','pronoun','subject')], "aren't", 'aux-present-other-neg', 'watching', 'watch', [tok('television','noun','object','television','uncountable')], 'Lúc này, chúng tôi không xem truyền hình.', 2, ['daily'], false, 'Điền to be phủ định đi với We.', "we aren't");
addNeg([tok('They','pronoun','subject')], "aren't", 'aux-present-other-neg', 'eating', 'eat', [tok('dinner','noun','object','dinner','uncountable')], 'Hiện giờ, họ không ăn bữa tối.', 2, ['food'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addNeg([tok('The','article','det'), tok('children','noun','subject','child','pl')], "aren't", 'aux-present-other-neg', 'fighting', 'fight', [], 'Lúc này, lũ trẻ không đánh nhau.', 2, ['daily'], false, 'Điền to be phủ định với The children (số nhiều).', "children aren't");
addNeg([tok('We','pronoun','subject')], "aren't", 'aux-present-other-neg', 'playing', 'play', [tok('badminton','noun','object','badminton','uncountable')], 'Hiện giờ, chúng tôi không chơi cầu lông.', 2, ['sport'], true, 'Điền dạng tiếp diễn của play.', 'play → playing');
addNeg([tok('They','pronoun','subject')], "aren't", 'aux-present-other-neg', 'singing', 'sing', [tok('songs','noun','object','song','pl')], 'Lúc này, họ không hát những bài hát.', 2, ['music'], true, 'Điền dạng tiếp diễn của sing.', 'sing → singing');
addNeg([tok('Students','noun','subject','student','pl')], "aren't", 'aux-present-other-neg', 'talking', 'talk', [tok('in','preposition','adverbial'), tok('class','noun','adverbial','class','sg')], 'Hiện giờ, học sinh không nói chuyện trong lớp.', 2, ['school'], false, 'Điền to be phủ định với Students.', "students aren't");
addNeg([tok('We','pronoun','subject')], "aren't", 'aux-present-other-neg', 'flying', 'fly', [tok('kites','noun','object','kite','pl')], 'Lúc này, chúng tôi không thả diều.', 2, ['toy'], true, 'Điền dạng tiếp diễn của fly.', 'fly → flying');
addNeg([tok('They','pronoun','subject')], "aren't", 'aux-present-other-neg', 'painting', 'paint', [tok('pictures','noun','object','picture','pl')], 'Hiện giờ, họ không vẽ tranh.', 2, ['art'], true, 'Điền dạng tiếp diễn của paint.', 'paint → painting');

addNeg([tok('The','article','det'), tok('boys','noun','subject','boy','pl')], "aren't", 'aux-present-other-neg', 'climbing', 'climb', [tok('the','article','det'), tok('tree','noun','object','tree','sg')], 'Lúc này, các cậu bé không trèo cây.', 2, ['action'], true, 'Điền dạng tiếp diễn của climb.', 'climb → climbing');
addNeg([tok('We','pronoun','subject')], "aren't", 'aux-present-other-neg', 'waiting', 'wait', [tok('for','preposition','adverbial'), tok('the','article','det'), tok('train','noun','adverbial','train','sg')], 'Hiện giờ, chúng tôi không đợi tàu hỏa.', 2, ['transport'], true, 'Điền dạng tiếp diễn của wait.', 'wait → waiting');
addNeg([tok('They','pronoun','subject')], "aren't", 'aux-present-other-neg', 'building', 'build', [tok('sandcastles','noun','object','sandcastle','pl')], 'Lúc này, họ không xây các lâu đài cát.', 2, ['toy'], true, 'Điền dạng tiếp diễn của build.', 'build → building');
addNeg([tok('The','article','det'), tok('girls','noun','subject','girl','pl')], "aren't", 'aux-present-other-neg', 'cleaning', 'clean', [tok('the','article','det'), tok('floor','noun','object','floor','sg')], 'Hiện giờ, các cô bé không lau sàn nhà.', 2, ['daily'], false, 'Điền to be phủ định với The girls.', "girls aren't");
addNeg([tok('We','pronoun','subject')], "aren't", 'aux-present-other-neg', 'drinking', 'drink', [tok('tea','noun','object','tea','uncountable')], 'Lúc này, chúng tôi không uống trà.', 2, ['drink'], true, 'Điền dạng tiếp diễn của drink.', 'drink → drinking');
addNeg([tok('They','pronoun','subject')], "aren't", 'aux-present-other-neg', 'throwing', 'throw', [tok('stones','noun','object','stone','pl')], 'Hiện giờ, họ không ném đá.', 2, ['action'], true, 'Điền dạng tiếp diễn của throw.', 'throw → throwing');
addNeg([tok('My','determiner','det'), tok('friends','noun','subject','friend','pl')], "aren't", 'aux-present-other-neg', 'learning', 'learn', [tok('music','noun','object','music','uncountable')], 'Lúc này, các bạn của tôi không học nhạc.', 2, ['school'], false, 'Điền to be phủ định với My friends.', "friends aren't");

// -------------------------------------------------------------------------
// 3. YES/NO QUESTIONS (45 câu: B2-s-0106 -> B2-s-0150)
// -------------------------------------------------------------------------

// Is he/she/it/singular... V-ing? (20)
addQ('Is', 'aux-present-3sg', [tok('he','pronoun','subject')], 'reading', 'read', [tok('a','article','det'), tok('book','noun','object','book','sg')], 'Có phải cậu ấy đang đọc sách không?', 1, ['study'], false, 'Điền trợ động từ to be hỏi cho chủ ngữ he.', 'Is + he');
addQ('Is', 'aux-present-3sg', [tok('she','pronoun','subject')], 'sleeping', 'sleep', [], 'Có phải cô ấy đang ngủ không?', 1, ['daily'], false, 'Điền to be hỏi cho chủ ngữ she.', 'Is + she');
addQ('Is', 'aux-present-3sg', [tok('he','pronoun','subject')], 'eating', 'eat', [tok('an','article','det'), tok('apple','noun','object','apple','sg')], 'Có phải cậu ấy đang ăn một quả táo không?', 1, ['food'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addQ('Is', 'aux-present-3sg', [tok('she','pronoun','subject')], 'singing', 'sing', [tok('a','article','det'), tok('song','noun','object','song','sg')], 'Có phải cô ấy đang hát một bài hát không?', 1, ['music'], true, 'Điền dạng tiếp diễn của sing.', 'sing → singing');
addQ('Is', 'aux-present-3sg', [tok('the','article','det'), tok('cat','noun','subject','cat','sg')], 'drinking', 'drink', [tok('milk','noun','object','milk','uncountable')], 'Có phải con mèo đang uống sữa không?', 1, ['animal'], false, 'Điền to be hỏi cho the cat (ngôi 3 số ít).', 'Is the cat');
addQ('Is', 'aux-present-3sg', [tok('Nam','noun','subject','Nam','sg')], 'drawing', 'draw', [tok('a','article','det'), tok('car','noun','object','car','sg')], 'Có phải Nam đang vẽ một chiếc ô tô không?', 1, ['art'], true, 'Điền dạng tiếp diễn của draw.', 'draw → drawing');
addQ('Is', 'aux-present-3sg', [tok('he','pronoun','subject')], 'watching', 'watch', [tok('television','noun','object','television','uncountable')], 'Có phải cậu ấy đang xem truyền hình không?', 2, ['daily'], true, 'Điền dạng tiếp diễn của watch.', 'watch → watching');
addQ('Is', 'aux-present-3sg', [tok('she','pronoun','subject')], 'listening', 'listen', [tok('to','preposition','adverbial'), tok('music','noun','adverbial','music','uncountable')], 'Có phải cô ấy đang nghe nhạc không?', 2, ['music'], true, 'Điền dạng tiếp diễn của listen.', 'listen → listening');
addQ('Is', 'aux-present-3sg', [tok('your','determiner','det'), tok('mother','noun','subject','mother','sg')], 'cooking', 'cook', [tok('dinner','noun','object','dinner','uncountable')], 'Có phải mẹ bạn đang nấu bữa tối không?', 2, ['family'], false, 'Điền to be hỏi cho your mother.', 'Is your mother');
addQ('Is', 'aux-present-3sg', [tok('he','pronoun','subject')], 'playing', 'play', [tok('the','article','det'), tok('guitar','noun','object','guitar','sg')], 'Có phải cậu ấy đang chơi đàn ghi-ta không?', 2, ['music'], true, 'Điền dạng tiếp diễn của play.', 'play → playing');

addQ('Is', 'aux-present-3sg', [tok('she','pronoun','subject')], 'wearing', 'wear', [tok('a','article','det'), tok('hat','noun','object','hat','sg')], 'Có phải cô ấy đang đội một chiếc mũ không?', 2, ['clothes'], true, 'Điền dạng tiếp diễn của wear.', 'wear → wearing');
addQ('Is', 'aux-present-3sg', [tok('the','article','det'), tok('dog','noun','subject','dog','sg')], 'sleeping', 'sleep', [tok('under','preposition','adverbial'), tok('the','article','det'), tok('table','noun','adverbial','table','sg')], 'Có phải chú chó đang ngủ dưới bàn không?', 2, ['animal'], true, 'Điền dạng tiếp diễn của sleep.', 'sleep → sleeping');
addQ('Is', 'aux-present-3sg', [tok('Tom','noun','subject','Tom','sg')], 'doing', 'do', [tok('homework','noun','object','homework','uncountable')], 'Có phải Tom đang làm bài tập về nhà không?', 2, ['school'], false, 'Điền to be hỏi cho Tom.', 'Is Tom');
addQ('Is', 'aux-present-3sg', [tok('he','pronoun','subject')], 'waiting', 'wait', [tok('for','preposition','adverbial'), tok('the','article','det'), tok('bus','noun','adverbial','bus','sg')], 'Có phải cậu ấy đang đợi xe buýt không?', 2, ['transport'], true, 'Điền dạng tiếp diễn của wait.', 'wait → waiting');
addQ('Is', 'aux-present-3sg', [tok('she','pronoun','subject')], 'cleaning', 'clean', [tok('her','determiner','det'), tok('room','noun','object','room','sg')], 'Có phải cô ấy đang dọn phòng của mình không?', 2, ['home'], true, 'Điền dạng tiếp diễn của clean.', 'clean → cleaning');
addQ('Is', 'aux-present-3sg', [tok('the','article','det'), tok('bird','noun','subject','bird','sg')], 'flying', 'fly', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('sky','noun','adverbial','sky','sg')], 'Có phải chú chim đang bay trên bầu trời không?', 2, ['nature'], true, 'Điền dạng tiếp diễn của fly.', 'fly → flying');
addQ('Is', 'aux-present-3sg', [tok('he','pronoun','subject')], 'washing', 'wash', [tok('the','article','det'), tok('dishes','noun','object','dish','pl')], 'Có phải cậu ấy đang rửa bát đĩa không?', 2, ['daily'], true, 'Điền dạng tiếp diễn của wash.', 'wash → washing');
addQ('Is', 'aux-present-3sg', [tok('your','determiner','det'), tok('father','noun','subject','father','sg')], 'working', 'work', [tok('now','adverb','adverbial')], 'Có phải bố bạn đang làm việc bây giờ không?', 2, ['family'], false, 'Điền to be hỏi cho your father.', 'Is your father');
addQ('Is', 'aux-present-3sg', [tok('she','pronoun','subject')], 'watering', 'water', [tok('the','article','det'), tok('plants','noun','object','plant','pl')], 'Có phải cô ấy đang tưới cây không?', 2, ['nature'], true, 'Điền dạng tiếp diễn của water.', 'water → watering');
addQ('Is', 'aux-present-3sg', [tok('he','pronoun','subject')], 'carrying', 'carry', [tok('a','article','det'), tok('heavy','adjective','modifier'), tok('bag','noun','object','bag','sg')], 'Có phải cậu ấy đang mang một chiếc túi nặng không?', 2, ['daily'], true, 'Điền dạng tiếp diễn của carry.', 'carry → carrying');

// Are you / they / plural... V-ing? (25)
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'reading', 'read', [tok('a','article','det'), tok('storybook','noun','object','storybook','sg')], 'Có phải bạn đang đọc một cuốn truyện không?', 1, ['study'], false, 'Điền trợ động từ to be hỏi cho chủ ngữ you.', 'Are + you');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'playing', 'play', [tok('football','noun','object','football','uncountable')], 'Có phải họ đang chơi bóng đá không?', 1, ['sport'], false, 'Điền to be hỏi cho chủ ngữ they.', 'Are + they');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'sleeping','sleep', [], 'Có phải bạn đang ngủ không?', 1, ['daily'], false, 'Điền to be hỏi cho chủ ngữ you.', 'Are + you');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'eating', 'eat', [tok('lunch','noun','object','lunch','uncountable')], 'Có phải họ đang ăn trưa không?', 1, ['food'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'drinking', 'drink', [tok('orange','noun','modifier','orange','sg'), tok('juice','noun','object','juice','uncountable')], 'Có phải bạn đang uống nước cam không?', 1, ['drink'], true, 'Điền dạng tiếp diễn của drink.', 'drink → drinking');
addQ('Are', 'aux-present-other', [tok('the','article','det'), tok('children','noun','subject','child','pl')], 'singing', 'sing', [], 'Có phải lũ trẻ đang hát không?', 1, ['music'], false, 'Điền to be hỏi cho the children (danh từ số nhiều).', 'Are the children');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'studying', 'study', [tok('English','noun','object','English','uncountable')], 'Có phải họ đang học tiếng Anh không?', 2, ['school'], true, 'Điền dạng tiếp diễn của study.', 'study → studying');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'watching', 'watch', [tok('cartoons','noun','object','cartoon','pl')], 'Có phải bạn đang xem phim hoạt hình không?', 2, ['hobby'], true, 'Điền dạng tiếp diễn của watch.', 'watch → watching');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'flying', 'fly', [tok('kites','noun','object','kite','pl')], 'Có phải họ đang thả diều không?', 2, ['toy'], true, 'Điền dạng tiếp diễn của fly.', 'fly → flying');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'listening', 'listen', [tok('to','preposition','adverbial'), tok('the','article','det'), tok('teacher','noun','adverbial','teacher','sg')], 'Có phải bạn đang lắng nghe cô giáo không?', 2, ['school'], true, 'Điền dạng tiếp diễn của listen.', 'listen → listening');

addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'drawing', 'draw', [tok('pictures','noun','object','picture','pl')], 'Có phải họ đang vẽ những bức tranh không?', 2, ['art'], true, 'Điền dạng tiếp diễn của draw.', 'draw → drawing');
addQ('Are', 'aux-present-other', [tok('the','article','det'), tok('students','noun','subject','student','pl')], 'cleaning', 'clean', [tok('the','article','det'), tok('board','noun','object','board','sg')], 'Có phải các học sinh đang lau bảng không?', 2, ['school'], false, 'Điền to be hỏi cho the students.', 'Are the students');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'cooking', 'cook', [tok('soup','noun','object','soup','uncountable')], 'Có phải bạn đang nấu súp không?', 2, ['food'], true, 'Điền dạng tiếp diễn của cook.', 'cook → cooking');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'building', 'build', [tok('a','article','det'), tok('sandcastle','noun','object','sandcastle','sg')], 'Có phải họ đang xây một lâu đài cát không?', 2, ['toy'], true, 'Điền dạng tiếp diễn của build.', 'build → building');
addQ('Are', 'aux-present-other', [tok('the','article','det'), tok('boys','noun','subject','boy','pl')], 'playing', 'play', [tok('chess','noun','object','chess','uncountable')], 'Có phải các cậu bé đang chơi cờ vua không?', 2, ['game'], false, 'Điền to be hỏi cho the boys.', 'Are the boys');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'waiting', 'wait', [tok('for','preposition','adverbial'), tok('me','pronoun','adverbial')], 'Có phải bạn đang đợi tôi không?', 2, ['daily'], true, 'Điền dạng tiếp diễn của wait.', 'wait → waiting');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'planting', 'plant', [tok('flowers','noun','object','flower','pl')], 'Có phải họ đang trồng hoa không?', 2, ['nature'], true, 'Điền dạng tiếp diễn của plant.', 'plant → planting');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'wearing', 'wear', [tok('a','article','det'), tok('warm','adjective','modifier'), tok('jacket','noun','object','jacket','sg')], 'Có phải bạn đang mặc một chiếc áo khoác ấm không?', 2, ['clothes'], true, 'Điền dạng tiếp diễn của wear.', 'wear → wearing');
addQ('Are', 'aux-present-other', [tok('the','article','det'), tok('monkeys','noun','subject','monkey','pl')], 'eating', 'eat', [tok('bananas','noun','object','banana','pl')], 'Có phải những con khỉ đang ăn chuối không?', 2, ['animal'], true, 'Điền dạng tiếp diễn của eat.', 'eat → eating');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'climbing', 'climb', [tok('the','article','det'), tok('mountain','noun','object','mountain','sg')], 'Có phải họ đang leo núi không?', 3, ['sport'], true, 'Điền dạng tiếp diễn của climb.', 'climb → climbing');

addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'doing', 'do', [tok('your','determiner','det'), tok('homework','noun','object','homework','uncountable')], 'Có phải bạn đang làm bài tập về nhà không?', 2, ['school'], true, 'Điền dạng tiếp diễn của do.', 'do → doing');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'talking', 'talk', [tok('about','preposition','adverbial'), tok('the','article','det'), tok('game','noun','adverbial','game','sg')], 'Có phải họ đang nói về trận đấu không?', 3, ['sport'], true, 'Điền dạng tiếp diễn của talk.', 'talk → talking');
addQ('Are', 'aux-present-other', [tok('the','article','det'), tok('girls','noun','subject','girl','pl')], 'washing', 'wash', [tok('their','determiner','det'), tok('hands','noun','object','hand','pl')], 'Có phải các bé gái đang rửa tay không?', 2, ['daily'], false, 'Điền to be hỏi cho the girls.', 'Are the girls');
addQ('Are', 'aux-present-other', [tok('you','pronoun','subject')], 'helping', 'help', [tok('your','determiner','det'), tok('grandparents','noun','object','grandparent','pl')], 'Có phải bạn đang giúp đỡ ông bà mình không?', 2, ['family'], true, 'Điền dạng tiếp diễn của help.', 'help → helping');
addQ('Are', 'aux-present-other', [tok('they','pronoun','subject')], 'throwing', 'throw', [tok('the','article','det'), tok('ball','noun','object','ball','sg')], 'Có phải họ đang ném quả bóng không?', 2, ['sport'], true, 'Điền dạng tiếp diễn của throw.', 'throw → throwing');

// -------------------------------------------------------------------------
// 4. SPELLING RULES FOR V-ING (25 câu: B2-s-0151 -> B2-s-0175)
// Quy tắc gấp đôi phụ âm CVC, bỏ 'e' câm, giữ nguyên 'y'
// -------------------------------------------------------------------------

// Quy tắc CVC nhân đôi phụ âm cuối (10)
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'running', 'run', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('park','noun','adverbial','park','sg')], 'Cậu ấy đang chạy trong công viên.', 2, ['spelling', 'sport'], true, 'Quy tắc CVC: run gấp đôi n trước khi thêm -ing.', 'run → running');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'swimming', 'swim', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('pool','noun','adverbial','pool','sg')], 'Cô ấy đang bơi trong hồ bơi.', 2, ['spelling', 'sport'], true, 'Quy tắc CVC: swim gấp đôi m trước khi thêm -ing.', 'swim → swimming');
addAff([tok('The','article','det'), tok('girl','noun','subject','girl','sg')], 'is', 'aux-present-3sg', 'skipping', 'skip', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('yard','noun','adverbial','yard','sg')], 'Bé gái đang nhảy dây trong sân.', 2, ['spelling', 'sport'], true, 'Quy tắc CVC: skip gấp đôi p trước khi thêm -ing.', 'skip → skipping');
addAff([tok('The','article','det'), tok('bus','noun','subject','bus','sg')], 'is', 'aux-present-3sg', 'stopping', 'stop', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('station','noun','adverbial','station','sg')], 'Xe buýt đang dừng lại ở trạm.', 2, ['spelling', 'transport'], true, 'Quy tắc CVC: stop gấp đôi p trước khi thêm -ing.', 'stop → stopping');
addAff([tok('The','article','det'), tok('children','noun','subject','child','pl')], 'are', 'aux-present-other', 'clapping', 'clap', [tok('their','determiner','det'), tok('hands','noun','object','hand','pl')], 'Lũ trẻ đang vỗ tay.', 2, ['spelling', 'action'], true, 'Quy tắc CVC: clap gấp đôi p trước khi thêm -ing.', 'clap → clapping');
addAff([tok('The','article','det'), tok('rabbit','noun','subject','rabbit','sg')], 'is', 'aux-present-3sg', 'hopping', 'hop', [tok('on','preposition','adverbial'), tok('the','article','det'), tok('grass','noun','adverbial','grass','uncountable')], 'Con thỏ đang nhảy lò cò trên bãi cỏ.', 2, ['spelling', 'animal'], true, 'Quy tắc CVC: hop gấp đôi p trước khi thêm -ing.', 'hop → hopping');
addAff([tok('The','article','det'), tok('cat','noun','subject','cat','sg')], 'is', 'aux-present-3sg', 'sitting', 'sit', [tok('on','preposition','adverbial'), tok('the','article','det'), tok('chair','noun','adverbial','chair','sg')], 'Con mèo đang ngồi trên ghế.', 2, ['spelling', 'animal'], true, 'Quy tắc CVC: sit gấp đôi t trước khi thêm -ing.', 'sit → sitting');
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'cutting', 'cut', [tok('paper','noun','object','paper','uncountable')], 'Cậu ấy đang cắt giấy.', 2, ['spelling', 'study'], true, 'Quy tắc CVC: cut gấp đôi t trước khi thêm -ing.', 'cut → cutting');
addAff([tok('The','article','det'), tok('dog','noun','subject','dog','sg')], 'is', 'aux-present-3sg', 'digging', 'dig', [tok('a','article','det'), tok('hole','noun','object','hole','sg')], 'Chú chó đang đào một cái hố.', 3, ['spelling', 'animal'], true, 'Quy tắc CVC: dig gấp đôi g trước khi thêm -ing.', 'dig → digging');
addAff([tok('Our','determiner','det'), tok('team','noun','subject','team','sg')], 'is', 'aux-present-3sg', 'winning', 'win', [tok('the','article','det'), tok('match','noun','object','match','sg')], 'Đội của chúng tôi đang chiến thắng trận đấu.', 3, ['spelling', 'sport'], true, 'Quy tắc CVC: win gấp đôi n trước khi thêm -ing.', 'win → winning');

// Quy tắc bỏ 'e' câm trước khi thêm -ing (10)
addAff([tok('Lan','noun','subject','Lan','sg')], 'is', 'aux-present-3sg', 'dancing', 'dance', [tok('gracefully','adverb','adverbial')], 'Lan đang khiêu vũ uyển chuyển.', 2, ['spelling', 'art'], true, 'Quy tắc bỏ e: dance bỏ e rồi thêm -ing.', 'dance → dancing');
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'writing', 'write', [tok('a','article','det'), tok('letter','noun','object','letter','sg')], 'Cậu ấy đang viết một bức thư.', 2, ['spelling', 'study'], true, 'Quy tắc bỏ e: write bỏ e rồi thêm -ing.', 'write → writing');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'riding', 'ride', [tok('her','determiner','det'), tok('bicycle','noun','object','bicycle','sg')], 'Cô ấy đang đi xe đạp của mình.', 2, ['spelling', 'transport'], true, 'Quy tắc bỏ e: ride bỏ e rồi thêm -ing.', 'ride → riding');
addAff([tok('My','determiner','det'), tok('uncle','noun','subject','uncle','sg')], 'is', 'aux-present-3sg', 'driving', 'drive', [tok('a','article','det'), tok('car','noun','object','car','sg')], 'Chú tôi đang lái xe ô tô.', 2, ['spelling', 'transport'], true, 'Quy tắc bỏ e: drive bỏ e rồi thêm -ing.', 'drive → driving');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'making', 'make', [tok('a','article','det'), tok('paper','noun','modifier','paper','uncountable'), tok('kite','noun','object','kite','sg')], 'Họ đang làm một con diều giấy.', 2, ['spelling', 'toy'], true, 'Quy tắc bỏ e: make bỏ e rồi thêm -ing.', 'make → making');
addAff([tok('Mother','noun','subject','mother','sg')], 'is', 'aux-present-3sg', 'baking', 'bake', [tok('a','article','det'), tok('cake','noun','object','cake','sg')], 'Mẹ đang nướng một chiếc bánh.', 2, ['spelling', 'food'], true, 'Quy tắc bỏ e: bake bỏ e rồi thêm -ing.', 'bake → baking');
addAff([tok('Tom','noun','subject','Tom','sg')], 'is', 'aux-present-3sg', 'closing', 'close', [tok('the','article','det'), tok('window','noun','object','window','sg')], 'Tom đang đóng cửa sổ lại.', 2, ['spelling', 'home'], true, 'Quy tắc bỏ e: close bỏ e rồi thêm -ing.', 'close → closing');
addAff([tok('The','article','det'), tok('baby','noun','subject','baby','sg')], 'is', 'aux-present-3sg', 'smiling', 'smile', [tok('sweetly','adverb','adverbial')], 'Em bé đang mỉm cười ngọt ngào.', 2, ['spelling', 'feeling'], true, 'Quy tắc bỏ e: smile bỏ e rồi thêm -ing.', 'smile → smiling');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'taking', 'take', [tok('photos','noun','object','photo','pl')], 'Cô ấy đang chụp ảnh.', 2, ['spelling', 'hobby'], true, 'Quy tắc bỏ e: take bỏ e rồi thêm -ing.', 'take → taking');
addAff([tok('The','article','det'), tok('sun','noun','subject','sun','sg')], 'is', 'aux-present-3sg', 'shining', 'shine', [tok('brightly','adverb','adverbial')], 'Mặt trời đang tỏa sáng rực rỡ.', 3, ['spelling', 'nature'], true, 'Quy tắc bỏ e: shine bỏ e rồi thêm -ing.', 'shine → shining');

// Quy tắc giữ nguyên 'y' thêm -ing (5)
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'playing', 'play', [tok('tennis','noun','object','tennis','uncountable')], 'Họ đang chơi quần vợt.', 1, ['spelling', 'sport'], true, 'Tận cùng là y giữ nguyên thêm -ing: play → playing.', 'play → playing');
addAff([tok('The','article','det'), tok('boy','noun','subject','boy','sg')], 'is', 'aux-present-3sg', 'flying', 'fly', [tok('a','article','det'), tok('toy','noun','modifier','toy','sg'), tok('plane','noun','object','plane','sg')], 'Cậu bé đang điều khiển một chiếc máy bay đồ chơi.', 2, ['spelling', 'toy'], true, 'Tận cùng là y giữ nguyên thêm -ing: fly → flying.', 'fly → flying');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'studying', 'study', [tok('science','noun','object','science','uncountable')], 'Tôi đang học môn khoa học.', 2, ['spelling', 'school'], true, 'Tận cùng là y giữ nguyên thêm -ing: study → studying.', 'study → studying');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'carrying', 'carry', [tok('an','article','det'), tok('umbrella','noun','object','umbrella','sg')], 'Cô ấy đang mang một chiếc ô.', 2, ['spelling', 'daily'], true, 'Tận cùng là y giữ nguyên thêm -ing: carry → carrying.', 'carry → carrying');
addAff([tok('The','article','det'), tok('little','adjective','modifier'), tok('girl','noun','subject','girl','sg')], 'is', 'aux-present-3sg', 'crying', 'cry', [tok('loudly','adverb','adverbial')], 'Bé gái nhỏ đang khóc to.', 2, ['spelling', 'feeling'], true, 'Tận cùng là y giữ nguyên thêm -ing: cry → crying.', 'cry → crying');

// -------------------------------------------------------------------------
// 5. TIME MARKERS & CONTEXT SIGNALS (25 câu: B2-s-0176 -> B2-s-0200)
// now, right now, at the moment, Look!, Listen!, Be quiet!
// -------------------------------------------------------------------------

// Dấu hiệu now / right now / at the moment / today (15)
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'running', 'run', [tok('now','adverb','adverbial')], 'Bây giờ cậu ấy đang chạy.', 2, ['time', 'sport'], false, 'Chủ ngữ he đi với to be is.', 'he + is');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'swimming', 'swim', [tok('right','adverb','adverbial'), tok('now','adverb','adverbial')], 'Ngay bây giờ cô ấy đang bơi.', 2, ['time', 'sport'], true, 'Dấu hiệu right now: chia tiếp diễn swimming.', 'swim → swimming');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'eating', 'eat', [tok('lunch','noun','object','lunch','uncountable'), tok('now','adverb','adverbial')], 'Bây giờ họ đang ăn trưa.', 2, ['time', 'food'], false, 'Chủ ngữ they đi với to be are.', 'they + are');
addAff([tok('I','pronoun','subject')], 'am', 'present-1sg', 'reading', 'read', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('moment','noun','adverbial','moment','sg')], 'Lúc này tôi đang đọc sách.', 2, ['time', 'study'], true, 'Dấu hiệu at the moment: chia tiếp diễn reading.', 'read → reading');
addAff([tok('Nam','noun','subject','Nam','sg')], 'is', 'aux-present-3sg', 'riding', 'ride', [tok('his','determiner','det'), tok('bike','noun','object','bike','sg'), tok('now','adverb','adverbial')], 'Bây giờ Nam đang đi xe đạp của mình.', 2, ['time', 'transport'], true, 'Chia tiếp diễn của ride: riding.', 'ride → riding');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'learning', 'learn', [tok('English','noun','object','English','uncountable'), tok('right','adverb','adverbial'), tok('now','adverb','adverbial')], 'Ngay lúc này chúng tôi đang học tiếng Anh.', 2, ['time', 'school'], false, 'Chủ ngữ we đi với to be are.', 'we + are');
addAff([tok('The','article','det'), tok('baby','noun','subject','baby','sg')], 'is', 'aux-present-3sg', 'sleeping', 'sleep', [tok('at','preposition','adverbial'), tok('the','article','det'), tok('moment','noun','adverbial','moment','sg')], 'Lúc này em bé đang ngủ.', 2, ['time', 'family'], true, 'Dấu hiệu at the moment: chia tiếp diễn sleeping.', 'sleep → sleeping');
addAff([tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'writing', 'write', [tok('a','article','det'), tok('letter','noun','object','letter','sg'), tok('today','adverb','adverbial')], 'Hôm nay cô ấy đang viết một bức thư.', 2, ['time', 'study'], true, 'Chia tiếp diễn của write: writing.', 'write → writing');
addAff([tok('They','pronoun','subject')], 'are', 'aux-present-other', 'playing', 'play', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('garden','noun','adverbial','garden','sg'), tok('now','adverb','adverbial')], 'Bây giờ họ đang chơi trong vườn.', 2, ['time', 'nature'], false, 'Chủ ngữ they đi với to be are.', 'they + are');
addAff([tok('He','pronoun','subject')], 'is', 'aux-present-3sg', 'cooking', 'cook', [tok('dinner','noun','object','dinner','uncountable'), tok('right','adverb','adverbial'), tok('now','adverb','adverbial')], 'Ngay lúc này cậu ấy đang nấu bữa tối.', 2, ['time', 'food'], true, 'Chia tiếp diễn của cook: cooking.', 'cook → cooking');

addAff([tok('My','determiner','det'), tok('father','noun','subject','father','sg')], 'is', 'aux-present-3sg', 'driving', 'drive', [tok('to','preposition','adverbial'), tok('work','noun','adverbial','work','uncountable'), tok('now','adverb','adverbial')], 'Bây giờ bố tôi đang lái xe đi làm.', 3, ['time', 'transport'], true, 'Chia tiếp diễn của drive: driving.', 'drive → driving');
addAff([tok('Students','noun','subject','student','pl')], 'are', 'aux-present-other', 'doing', 'do', [tok('tests','noun','object','test','pl'), tok('at','preposition','adverbial'), tok('present','noun','adverbial','present','uncountable')], 'Hiện tại học sinh đang làm bài kiểm tra.', 3, ['time', 'school'], false, 'Chủ ngữ Students đi với are.', 'Students + are');
addAff([tok('Lan','noun','subject','Lan','sg')], 'is', 'aux-present-3sg', 'washing', 'wash', [tok('her','determiner','det'), tok('shoes','noun','object','shoe','pl'), tok('today','adverb','adverbial')], 'Hôm nay Lan đang giặt giày của cô ấy.', 3, ['time', 'daily'], true, 'Chia tiếp diễn của wash: washing.', 'wash → washing');
addAff([tok('We','pronoun','subject')], 'are', 'aux-present-other', 'staying', 'stay', [tok('at','preposition','adverbial'), tok('home','noun','adverbial','home','uncountable'), tok('now','adverb','adverbial')], 'Bây giờ chúng tôi đang ở nhà.', 2, ['time', 'home'], false, 'Chủ ngữ We đi với are.', 'We + are');
addAff([tok('The','article','det'), tok('train','noun','subject','train','sg')], 'is', 'aux-present-3sg', 'coming', 'come', [tok('right','adverb','adverbial'), tok('now','adverb','adverbial')], 'Ngay lúc này đoàn tàu đang đến.', 3, ['time', 'transport'], true, 'Chia tiếp diễn của come: coming (bỏ e thêm ing).', 'come → coming');

// Ngữ cảnh mệnh lệnh: Look!, Listen!, Be quiet! (10)
// Dùng hàm addSentence trực tiếp để token hóa chuẩn xác
function addContextSentence(cmdTokens, mainSubjTokens, beText, beFeat, vText, vLemma, restTokens, vi, diff, tags, blankIsV, promptVi, hint) {
  const tokens = [...cmdTokens];
  let curIdx = tokens.length;

  const sIndices = [];
  for (const st of mainSubjTokens) {
    tokens.push(st);
    sIndices.push(curIdx++);
  }

  const beIdx = curIdx++;
  tokens.push(tok(beText, 'verb', 'verb', 'be', beFeat));

  const vIdx = curIdx++;
  tokens.push(tok(vText, 'verb', 'verb', vLemma, 'ing'));

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
    { clauseId: 'c1', role: 'verb', tokenIndices: [beIdx, vIdx] },
    ...restSpans
  ];

  const blankDef = blankIsV
    ? { idx: vIdx, ans: vText, promptVi, hint }
    : { idx: beIdx, ans: beText, promptVi, hint };

  const en = reconstructEn(tokens);
  addSentence('time-markers', en, vi, diff, ['context', ...tags], tokens, roleSpans, ['pos', 'fill', 'order'], blankDef);
}

const lookCmd = [tok('Look','verb','verb','look','base'), punctExcl];
const listenCmd = [tok('Listen','verb','verb','listen','base'), punctExcl];

addContextSentence(lookCmd, [tok('The','article','det'), tok('bus','noun','subject','bus','sg')], 'is', 'aux-present-3sg', 'coming', 'come', [], 'Nhìn kìa! Xe buýt đang đến.', 2, ['look'], true, 'Sau Look!, hành động đang diễn ra: come → coming.', 'come → coming');
addContextSentence(lookCmd, [tok('The','article','det'), tok('bird','noun','subject','bird','sg')], 'is', 'aux-present-3sg', 'flying', 'fly', [], 'Nhìn kìa! Chú chim đang bay.', 2, ['look'], true, 'Sau Look!, chia tiếp diễn: fly → flying.', 'fly → flying');
addContextSentence(lookCmd, [tok('The','article','det'), tok('boys','noun','subject','boy','pl')], 'are', 'aux-present-other', 'running', 'run', [], 'Nhìn kìa! Các cậu bé đang chạy.', 2, ['look'], false, 'Chủ ngữ The boys số nhiều đi với are.', 'boys + are');
addContextSentence(lookCmd, [tok('Lan','noun','subject','Lan','sg')], 'is', 'aux-present-3sg', 'dancing', 'dance', [], 'Nhìn kìa! Lan đang khiêu vũ.', 2, ['look'], true, 'Chia tiếp diễn của dance: dancing.', 'dance → dancing');
addContextSentence(lookCmd, [tok('A','article','det'), tok('plane','noun','subject','plane','sg')], 'is', 'aux-present-3sg', 'flying', 'fly', [tok('in','preposition','adverbial'), tok('the','article','det'), tok('sky','noun','adverbial','sky','sg')], 'Nhìn kìa! Một chiếc máy bay đang bay trên bầu trời.', 3, ['look'], true, 'Chia tiếp diễn của fly: flying.', 'fly → flying');

addContextSentence(listenCmd, [tok('Someone','pronoun','subject')], 'is', 'aux-present-3sg', 'singing', 'sing', [], 'Lắng nghe này! Ai đó đang hát.', 3, ['listen'], true, 'Sau Listen!, hành động đang diễn ra: sing → singing.', 'sing → singing');
addContextSentence(listenCmd, [tok('The','article','det'), tok('baby','noun','subject','baby','sg')], 'is', 'aux-present-3sg', 'crying', 'cry', [], 'Lắng nghe này! Em bé đang khóc.', 2, ['listen'], false, 'Chủ ngữ The baby số ít đi với is.', 'baby + is');
addContextSentence(listenCmd, [tok('She','pronoun','subject')], 'is', 'aux-present-3sg', 'playing', 'play', [tok('the','article','det'), tok('piano','noun','object','piano','sg')], 'Lắng nghe này! Cô ấy đang chơi đàn piano.', 3, ['listen'], true, 'Sau Listen!, chia tiếp diễn: play → playing.', 'play → playing');
addContextSentence(listenCmd, [tok('The','article','det'), tok('birds','noun','subject','bird','pl')], 'are', 'aux-present-other', 'singing', 'sing', [tok('sweetly','adverb','adverbial')], 'Lắng nghe này! Những chú chim đang hót líu lo.', 3, ['listen'], false, 'Chủ ngữ The birds số nhiều đi với are.', 'birds + are');
addContextSentence(listenCmd, [tok('The','article','det'), tok('teacher','noun','subject','teacher','sg')], 'is', 'aux-present-3sg', 'speaking', 'speak', [], 'Lắng nghe này! Cô giáo đang nói.', 3, ['listen'], true, 'Sau Listen!, chia tiếp diễn: speak → speaking.', 'speak → speaking');

// Kiểm tra số lượng
console.log(`Generated ${sentences.length} sentences for B2.`);
if (sentences.length !== 200) {
  throw new Error(`Expected 200 sentences, but got ${sentences.length}`);
}

// -------------------------------------------------------------------------
// WRITE B2.sentences.json
// -------------------------------------------------------------------------
fs.writeFileSync(path.join(DATA_DIR, 'B2.sentences.json'), JSON.stringify(applyContentReviewV4('B2.sentences.json', sentences.map(applyReviewedOrder)), null, 2), 'utf-8');
console.log(`✅ Saved B2.sentences.json (${sentences.length} items)`);

// -------------------------------------------------------------------------
// BUILD B2.theory.json
// -------------------------------------------------------------------------
const theoryRaw = {
  id: 'theory-B2',
  level: 'B2',
  topic: 'present-continuous',
  title: 'Thì Hiện tại tiếp diễn (Present Continuous Tense)',
  summary: 'Thì Hiện tại tiếp diễn dùng để diễn tả một hành động hoặc sự việc đang diễn ra ngay tại thời điểm nói hoặc xung quanh thời điểm nói.',
  formulas: [
    {
      name: 'Khẳng định (Affirmative)',
      pattern: 'S + am / is / are + V-ing',
      examples: [
        'I am reading a book. (Tôi đang đọc một cuốn sách.)',
        'He is running in the park. (Cậu ấy đang chạy trong công viên.)',
        'They are playing football. (Họ đang chơi bóng đá.)'
      ]
    },
    {
      name: 'Phủ định (Negative)',
      pattern: 'S + am not / isn\'t / aren\'t + V-ing',
      examples: [
        'I am not sleeping. (Lúc này, tôi không ngủ.)',
        'She isn\'t watching TV. (Cô ấy không đang xem ti-vi.)',
        'We aren\'t fighting. (Chúng tôi không đang đánh nhau.)'
      ]
    },
    {
      name: 'Nghi vấn Yes/No (Yes/No Question)',
      pattern: 'Am / Is / Are + S + V-ing?',
      examples: [
        'Is he eating an apple? - Yes, he is. / No, he isn\'t.',
        'Are they studying English? - Yes, they are. / No, they aren\'t.'
      ]
    }
  ],
  sections: [
    {
      title: '1. Cách dùng thì Hiện tại tiếp diễn',
      content: 'Thì Hiện tại tiếp diễn được sử dụng khi muốn nói về một hành động đang thực sự xảy ra ngay trước mắt bạn tại thời điểm nói.\nVí dụ: Bạn nhìn thấy ai đó đang chạy, bạn nói: "He is running."\nCông thức cốt lõi luôn gồm hai thành phần không thể thiếu: Động từ to be (am / is / are) + Động từ đuôi -ing (V-ing).'
    },
    {
      title: '2. Quy tắc lựa chọn to be (am / is / are)',
      content: '- Chủ ngữ "I" đi với "am" (viết tắt: I\'m; phủ định: I am not).\n- Chủ ngữ số ít "He / She / It / Danh từ số ít" đi với "is" (phủ định: isn\'t = is not).\n- Chủ ngữ số nhiều "We / You / They / Danh từ số nhiều" đi với "are" (phủ định: aren\'t = are not).'
    },
    {
      title: '3. Quy tắc vàng khi thêm đuôi -ing vào động từ',
      content: 'Thông thường ta chỉ cần thêm -ing vào sau động từ nguyên thể (read → reading, sing → singing).\nTuy nhiên, cần đặc biệt lưu ý 3 trường hợp sau:\n1. Tận cùng là 1 chữ "e" câm: BỎ "e" rồi thêm "-ing" (write → writing, dance → dancing, ride → riding, make → making).\n2. Động từ 1 âm tiết, tận cùng là 1 phụ âm đứng sau 1 nguyên âm đơn (C-V-C): GẤP ĐÔI phụ âm cuối rồi thêm "-ing" (run → running, swim → swimming, skip → skipping, stop → stopping, sit → sitting).\n3. Tận cùng là "y": GIỮ NGUYÊN "y" và thêm "-ing", KHÔNG đổi thành "i" (play → playing, fly → flying, study → studying).'
    },
    {
      title: '4. Các dấu hiệu nhận biết thì Hiện tại tiếp diễn',
      content: '- Trạng từ thời gian: now (bây giờ), right now (ngay bây giờ), at the moment (vào lúc này), at present (hiện tại), today (hôm nay).\n- Câu mệnh lệnh / Từ gây chú ý có dấu chấm than (!): Look! (Nhìn kìa!), Listen! (Lắng nghe này!), Be quiet! (Hãy giữ trật tự!).\nKhi thấy những từ này, câu luôn chia ở thì Hiện tại tiếp diễn.'
    }
  ],
  commonMistakes: [
    {
      wrong: 'He running in the park.',
      right: 'He is running in the park.',
      why: 'Thì tiếp diễn BẮT BUỘC phải có cả to be và V-ing. Thiếu to be là sai ngữ pháp nghiêm trọng.'
    },
    {
      wrong: 'She is runing fast.',
      right: 'She is running fast.',
      why: 'Động từ "run" kết thúc bằng C-V-C (phụ âm - nguyên âm - phụ âm), cần gấp đôi phụ âm "n" thành "running".'
    },
    {
      wrong: 'They are danceing.',
      right: 'They are dancing.',
      why: 'Động từ "dance" có tận cùng là chữ "e" câm, cần bỏ "e" trước khi thêm đuôi "-ing".'
    },
    {
      wrong: 'I am playying chess.',
      right: 'I am playing chess.',
      why: 'Động từ tận cùng bằng "y" (play, fly, study) chỉ cần thêm "-ing", không được nhân đôi chữ "y".'
    }
  ],
  tips: [
    'Luôn ghi nhớ thần chú: "Có BE thì mới có ING!" - Không bao giờ được bỏ rơi am/is/are.',
    'Khi nhìn thấy "Look!" hoặc "Listen!", hãy tìm ngay đáp án có "am/is/are + V-ing".',
    'Chỉ gấp đôi phụ âm với những từ 1 âm tiết có dạng 1 nguyên âm kẹp giữa 2 phụ âm (run, swim, sit, cut).'
  ],
  exampleIds: ['B2-s-0001', 'B2-s-0012', 'B2-s-0021', 'B2-s-0061', 'B2-s-0106', 'B2-s-0151', 'B2-s-0176']
};

// Chuẩn hoá theory về đúng schema TheoryPage (xem docs/english-content-fix-list-v3.md #02).
const SECTION_EXAMPLE_IDS = [
  ['B2-s-0001', 'B2-s-0012'],
  ['B2-s-0021', 'B2-s-0106'],
  ['B2-s-0151', 'B2-s-0152', 'B2-s-0157'],
  ['B2-s-0176', 'B2-s-0178'],
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
fs.writeFileSync(path.join(DATA_DIR, 'B2.theory.json'), JSON.stringify(applyContentReviewV4('B2.theory.json', typeof applyTheoryReview === 'function' ? applyTheoryReview(theory) : theory), null, 2), 'utf-8');
console.log(`✅ Saved B2.theory.json`);
