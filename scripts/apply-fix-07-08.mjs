/**
 * scripts/apply-fix-07-08.mjs
 * Áp dụng triệt để hai mục 07 và 08 trong docs/english-content-fix-list-v3.md:
 * - Mục 07: Bổ sung nghiệm xếp câu hợp lệ (orderAlternatives) cho các câu A1-C2 (thời gian đầu/cuối, Whose, There is/are, sometimes, tính từ).
 * - Mục 08: Bổ sung blanks[].alt dạng phủ định đầy đủ cho các câu điền từ dạng rút gọn (isn't -> is not, etc.) và chuẩn hóa promptVi.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('src/data/english');

// =========================================================================
// HÀM HỖ TRỢ XỬ LÝ ORDER ALTERNATIVES (MỤC 07)
// =========================================================================
const norm = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1');

const bag = (s) =>
  (norm(s).match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu) || [])
    .sort()
    .join('\u0000');

const PROPER_NOUNS = new Set([
  'I', 'Hanoi', 'Danang', 'Hue', 'Saigon', 'London', 'Paris', 'England', 'Vietnam',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
  'Nam', 'Lan', 'Minh', 'Mai', 'Hoa', 'Peter', 'Mary', 'Tom', 'John', 'Tony', 'Linda', 'Huy', 'Linh'
]);

function lowerFirst(word) {
  if (PROPER_NOUNS.has(word)) return word;
  return word.charAt(0).toLowerCase() + word.slice(1);
}

function capFirst(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generateOrderAlternatives(s) {
  const en = s.en.trim();
  const alts = new Set((s.orderAlternatives || []).filter(a => !/^Now .* right[.?]$/.test(a)));
  const tokens = s.tokens.map(t => t.text);
  const lastPunct = tokens[tokens.length - 1];

  if (!['.', '?'].includes(lastPunct)) return Array.from(alts);

  const words = tokens.slice(0, -1);

  // 1. Đặc trị các ca review trong docs/english-content-fix-list-v3.md
  if (s.id === 'A1-s-0031') {
    alts.add('The weather today is warm.');
    alts.add('Today the weather is warm.');
    alts.add('The weather is warm today.');
  }
  if (s.id === 'A1-s-0038') {
    alts.add('The cute little puppy is very playful.');
    alts.add('The little cute puppy is very playful.');
  }
  if (s.id === 'A2-s-0016') {
    alts.add('In the lake there is an island.');
  }
  if (s.id === 'A3-s-0171') {
    alts.add('Whose is this book?');
  }
  if (s.id === 'B1-s-0023') {
    alts.add('In the morning she drinks warm milk.');
  }
  if (s.id === 'B1-s-0189') {
    alts.add('Sometimes I read comics.');
    alts.add('I read comics sometimes.');
  }
  if (s.id === 'B2-s-0176') {
    alts.add('Now he is running.');
  }
  if (s.id === 'B3-s-0001') {
    alts.add('Yesterday I was happy.');
  }
  if (s.id === 'B4-s-0002') {
    alts.add('Tomorrow he will visit his grandparents.');
  }

  // 2. Whose book is this? <-> Whose is this book?
  if (words.length === 4 && words[0] === 'Whose' && ['is', 'are'].includes(words[2]) && ['this', 'that', 'these', 'those'].includes(words[3])) {
    const alt = `Whose ${words[2]} ${words[3]} ${words[1]}?`;
    alts.add(alt);
  } else if (words.length === 4 && words[0] === 'Whose' && ['is', 'are'].includes(words[1]) && ['this', 'that', 'these', 'those'].includes(words[2])) {
    const alt = `Whose ${words[3]} ${words[1]} ${words[2]}?`;
    alts.add(alt);
  }

  // 3. Trạng từ đơn thời gian: yesterday, tomorrow, today, tonight, now
  const singleAdverbs = ['yesterday', 'tomorrow', 'today', 'tonight', 'now'];
  const lastWord = words[words.length - 1].toLowerCase();
  const firstWord = words[0].toLowerCase();

  if (singleAdverbs.includes(lastWord) && !(lastWord === 'now' && words.at(-2).toLowerCase() === 'right') && words.length >= 3 && !['?', ','].includes(words[words.length - 2])) {
    const rest = [lowerFirst(words[0]), ...words.slice(1, -1)];
    const alt = `${capFirst(words[words.length - 1])} ${rest.join(' ')}${lastPunct}`;
    alts.add(alt);
  } else if (singleAdverbs.includes(firstWord) && words.length >= 3) {
    const rest = [capFirst(words[1]), ...words.slice(2)];
    const alt = `${rest.join(' ')} ${words[0].toLowerCase()}${lastPunct}`;
    alts.add(alt);
  }

  // 4. Cụm trạng từ thời gian 2-3 từ ở cuối / đầu câu
  const timePhrases = [
    ['right', 'now'],
    ['in', 'the', 'morning'],
    ['in', 'the', 'afternoon'],
    ['in', 'the', 'evening'],
    ['at', 'night'],
    ['at', 'noon'],
    ['last', 'night'],
    ['last', 'week'],
    ['last', 'month'],
    ['last', 'year'],
    ['last', 'Sunday'],
    ['last', 'Saturday'],
    ['next', 'week'],
    ['next', 'month'],
    ['next', 'year'],
    ['next', 'Monday'],
    ['next', 'Sunday'],
    ['every', 'day'],
    ['every', 'week'],
    ['every', 'morning'],
    ['every', 'night'],
    ['on', 'Monday'],
    ['on', 'Tuesday'],
    ['on', 'Wednesday'],
    ['on', 'Thursday'],
    ['on', 'Friday'],
    ['on', 'Saturday'],
    ['on', 'Sunday'],
    ['on', 'weekends']
  ];

  for (const tp of timePhrases) {
    const len = tp.length;
    if (words.length > len + 2) {
      const tail = words.slice(-len).map(w => w.toLowerCase());
      const matchTail = tp.every((w, idx) => w.toLowerCase() === tail[idx]);
      if (matchTail) {
        const tpOriginalCase = words.slice(-len);
        tpOriginalCase[0] = capFirst(tpOriginalCase[0]);
        const rest = [lowerFirst(words[0]), ...words.slice(1, -len)];
        const alt = `${tpOriginalCase.join(' ')} ${rest.join(' ')}${lastPunct}`;
        alts.add(alt);
      }

      const head = words.slice(0, len).map(w => w.toLowerCase());
      const matchHead = tp.every((w, idx) => w.toLowerCase() === head[idx]);
      if (matchHead) {
        const tpLower = words.slice(0, len);
        tpLower[0] = lowerFirst(tpLower[0]);
        const rest = [capFirst(words[len]), ...words.slice(len + 1)];
        const alt = `${rest.join(' ')} ${tpLower.join(' ')}${lastPunct}`;
        alts.add(alt);
      }
    }
  }

  // 5. Cụm nơi chốn với There is / There are
  if (words.length >= 6 && words[0] === 'There' && ['is', 'are'].includes(words[1])) {
    const prepIdx = words.findIndex((w, idx) => idx >= 3 && ['in', 'on', 'at', 'under', 'behind', 'near'].includes(w.toLowerCase()));
    if (prepIdx !== -1 && prepIdx < words.length - 1) {
      const prepPhrase = words.slice(prepIdx);
      prepPhrase[0] = capFirst(prepPhrase[0]);
      const therePart = ['there', words[1], ...words.slice(2, prepIdx)];
      const alt = `${prepPhrase.join(' ')} ${therePart.join(' ')}${lastPunct}`;
      alts.add(alt);
    }
  }

  // 6. Trạng từ tần suất "sometimes"
  const sometimesIdx = words.findIndex(w => w.toLowerCase() === 'sometimes');
  if (sometimesIdx === 1 && words.length >= 4) {
    const alt1 = `Sometimes ${words[0]} ${words.slice(2).join(' ')}${lastPunct}`;
    const alt2 = `${words[0]} ${words.slice(2).join(' ')} sometimes${lastPunct}`;
    alts.add(alt1);
    alts.add(alt2);
  } else if (sometimesIdx === 0 && words.length >= 4) {
    const alt1 = `${capFirst(words[1])} sometimes ${words.slice(2).join(' ')}${lastPunct}`;
    const alt2 = `${capFirst(words[1])} ${words.slice(2).join(' ')} sometimes${lastPunct}`;
    alts.add(alt1);
    alts.add(alt2);
  }

  alts.delete(en);

  const validAlts = [];
  const enBag = bag(en);
  for (const a of alts) {
    if (bag(a) === enBag) {
      validAlts.push(a);
    }
  }

  return validAlts;
}

// =========================================================================
// HÀM HỖ TRỢ XỬ LÝ PHỦ ĐỊNH ĐẦY ĐỦ (MỤC 08)
import { applyExercisePrompts } from './english-exercise-prompts.mjs';

// =========================================================================
// HÀM HỖ TRỢ XỬ LÝ PHỦ ĐỊNH ĐẦY ĐỦ (MỤC 08)
// =========================================================================
const NEG_MAP = {
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "didn't": 'did not',
  "won't": 'will not',
  "don't": 'do not',
  "doesn't": 'does not',
  "can't": 'cannot'
};

function patchNegativeBlank(blank) {
  const lowerAns = blank.answer.toLowerCase();
  const fullForm = NEG_MAP[lowerAns];
  if (!fullForm) return false;

  const currentAlts = blank.alt || [];
  let updated = false;

  if (!currentAlts.some(a => a.toLowerCase() === fullForm)) {
    blank.alt = [...currentAlts, fullForm];
    updated = true;
  }

  return updated;
}

// =========================================================================
// THỰC THI ÁP DỤNG TRÊN TẤT CẢ CÁC FILE SENTENCES
// =========================================================================
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sentences.json'));

let totalFixedBlanks = 0;
let totalSentencesWithOrderAlts = 0;
let totalOrderAltsAdded = 0;

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  let sentences = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let fileBlanksUpdated = 0;
  let fileAltsCount = 0;

  sentences = sentences.map(rawSentence => {
    let s = rawSentence;
    // Đồng bộ chuẩn hoá prompt & alt cho A2/B2/B3/B4
    if (['A2', 'B2', 'B3', 'B4'].includes(s.level)) {
      s = applyExercisePrompts(s);
    }

    // 1. Áp dụng mục 08 cho blanks (bổ sung alt nếu chưa có)
    if (Array.isArray(s.blanks)) {
      s.blanks.forEach(b => {
        if (patchNegativeBlank(b)) {
          fileBlanksUpdated++;
          totalFixedBlanks++;
        }
      });
    }

    // 2. Áp dụng mục 07 cho orderAlternatives
    const generatedAlts = generateOrderAlternatives(s);
    if (generatedAlts.length > 0) {
      s.orderAlternatives = generatedAlts;
      fileAltsCount += generatedAlts.length;
      totalSentencesWithOrderAlts++;
    } else {
      delete s.orderAlternatives; // xóa key rỗng nếu có
    }

    return s;
  });

  fs.writeFileSync(filePath, JSON.stringify(sentences, null, 2), 'utf-8');
  console.log(`✅ ${file}: Cập nhật ${fileBlanksUpdated} blanks phủ định, ${fileAltsCount} orderAlternatives.`);
}

console.log('\n=======================================');
console.log(`🎉 TỔNG KẾT:`);
console.log(`- Mục 08: Đã bổ sung dạng đầy đủ cho ${totalFixedBlanks} ô trống phủ định.`);
console.log(`- Mục 07: Đã cập nhật orderAlternatives cho ${totalSentencesWithOrderAlts} câu (${totalOrderAltsAdded} alternatives).`);
