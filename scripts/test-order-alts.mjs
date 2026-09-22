import fs from 'fs';
import path from 'path';

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

// Proper nouns that should remain capitalized even when moved from start of sentence
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

// Generate valid alternative word orders for a sentence
function generateOrderAlternatives(s) {
  const en = s.en.trim();
  const alts = new Set((s.orderAlternatives || []).filter(a => !/^Now .* right[.?]$/.test(a)));
  const tokens = s.tokens.map(t => t.text);
  const lastPunct = tokens[tokens.length - 1];

  // Chỉ xét câu trần thuật hoặc nghi vấn có dấu chấm/hỏi cuối câu
  if (!['.', '?'].includes(lastPunct)) return Array.from(alts);

  const words = tokens.slice(0, -1); // bỏ dấu câu cuối

  // 1. Đặc trị các ca review trong docs/english-content-fix-list-v3.md
  if (s.id === 'A1-s-0031') {
    alts.add('The weather today is warm.');
    alts.add('Today the weather is warm.');
  }
  if (s.id === 'A1-s-0038') {
    alts.add('The cute little puppy is very playful.');
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
  // Whose [noun] is/are this/that/these/those?
  if (words.length === 4 && words[0] === 'Whose' && ['is', 'are'].includes(words[2]) && ['this', 'that', 'these', 'those'].includes(words[3])) {
    // Whose book is this? -> Whose is this book?
    const alt = `Whose ${words[2]} ${words[3]} ${words[1]}?`;
    alts.add(alt);
  } else if (words.length === 4 && words[0] === 'Whose' && ['is', 'are'].includes(words[1]) && ['this', 'that', 'these', 'those'].includes(words[2])) {
    // Whose is this book? -> Whose book is this?
    const alt = `Whose ${words[3]} ${words[1]} ${words[2]}?`;
    alts.add(alt);
  }

  // 3. Trạng từ đơn thời gian ở cuối câu: yesterday, tomorrow, today, tonight, now
  const singleAdverbs = ['yesterday', 'tomorrow', 'today', 'tonight', 'now'];
  const lastWord = words[words.length - 1].toLowerCase();
  const firstWord = words[0].toLowerCase();

  if (singleAdverbs.includes(lastWord) && !(lastWord === 'now' && words.at(-2).toLowerCase() === 'right') && words.length >= 3 && !['?', ','].includes(words[words.length - 2])) {
    // Đưa trạng từ lên đầu: "I was happy yesterday." -> "Yesterday I was happy."
    const rest = [lowerFirst(words[0]), ...words.slice(1, -1)];
    const alt = `${capFirst(words[words.length - 1])} ${rest.join(' ')}${lastPunct}`;
    alts.add(alt);
  } else if (singleAdverbs.includes(firstWord) && words.length >= 3) {
    // Trạng từ ở đầu đưa về cuối: "Yesterday I was happy." -> "I was happy yesterday."
    const rest = [capFirst(words[1]), ...words.slice(2)];
    const alt = `${rest.join(' ')} ${words[0].toLowerCase()}${lastPunct}`;
    alts.add(alt);
  }

  // 4. Cụm trạng từ thời gian 2-3 từ ở cuối câu:
  // "in the morning", "in the afternoon", "in the evening", "at night"
  // "on Monday", "on Sunday"...
  // "last night", "last week", "last month", "last year"
  // "next week", "next month", "next year"
  // "every day", "every week", "every year"
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
    // Kiểm tra cuối câu có khớp tp không
    if (words.length > len + 2) {
      const tail = words.slice(-len).map(w => w.toLowerCase());
      const matchTail = tp.every((w, idx) => w.toLowerCase() === tail[idx]);
      if (matchTail) {
        // Đưa tp lên đầu: She drinks milk in the morning. -> In the morning she drinks milk.
        const tpOriginalCase = words.slice(-len);
        tpOriginalCase[0] = capFirst(tpOriginalCase[0]);
        const rest = [lowerFirst(words[0]), ...words.slice(1, -len)];
        const alt = `${tpOriginalCase.join(' ')} ${rest.join(' ')}${lastPunct}`;
        alts.add(alt);
      }

      // Kiểm tra đầu câu có khớp tp không
      const head = words.slice(0, len).map(w => w.toLowerCase());
      const matchHead = tp.every((w, idx) => w.toLowerCase() === head[idx]);
      if (matchHead) {
        // In the morning she drinks milk. -> She drinks milk in the morning.
        const tpLower = words.slice(0, len);
        tpLower[0] = lowerFirst(tpLower[0]);
        const rest = [capFirst(words[len]), ...words.slice(len + 1)];
        const alt = `${rest.join(' ')} ${tpLower.join(' ')}${lastPunct}`;
        alts.add(alt);
      }
    }
  }

  // 5. Cụm nơi chốn với There is / There are
  // "There is an island in the lake." <-> "In the lake there is an island."
  if (words.length >= 6 && words[0] === 'There' && ['is', 'are'].includes(words[1])) {
    // Tìm giới từ in/on/under/behind... ở nửa sau
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
  // S + sometimes + V ... <-> Sometimes + S + V ... <-> S + V ... + sometimes.
  const sometimesIdx = words.findIndex(w => w.toLowerCase() === 'sometimes');
  if (sometimesIdx === 1 && words.length >= 4) {
    // "I sometimes read comics."
    // Alt 1: "Sometimes I read comics."
    const alt1 = `Sometimes ${words[0]} ${words.slice(2).join(' ')}${lastPunct}`;
    // Alt 2: "I read comics sometimes."
    const alt2 = `${words[0]} ${words.slice(2).join(' ')} sometimes${lastPunct}`;
    alts.add(alt1);
    alts.add(alt2);
  } else if (sometimesIdx === 0 && words.length >= 4) {
    // "Sometimes I read comics."
    const alt1 = `${capFirst(words[1])} sometimes ${words.slice(2).join(' ')}${lastPunct}`;
    const alt2 = `${capFirst(words[1])} ${words.slice(2).join(' ')} sometimes${lastPunct}`;
    alts.add(alt1);
    alts.add(alt2);
  }

  // Loại bỏ chính chuỗi en gốc
  alts.delete(en);

  // Validate tất cả alts xem có cùng bag(en) không
  const validAlts = [];
  const enBag = bag(en);
  for (const a of alts) {
    if (bag(a) === enBag) {
      validAlts.push(a);
    } else {
      console.warn(`[WARNING] Invalid alt for ${s.id} (bag mismatch):\n  en:  "${en}"\n  alt: "${a}"`);
    }
  }

  return validAlts;
}

// Chạy test trên tất cả các level
const levels = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2'];
let totalGeneratedAlts = 0;
let totalSentencesWithAlts = 0;

for (const level of levels) {
  const filePath = path.resolve(`src/data/english/${level}.sentences.json`);
  const sentences = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let countWithAlts = 0;
  sentences.forEach(s => {
    const alts = generateOrderAlternatives(s);
    if (alts.length > 0) {
      countWithAlts++;
      totalGeneratedAlts += alts.length;
    }
  });
  console.log(`Level ${level}: ${countWithAlts} / ${sentences.length} sentences will have orderAlternatives`);
  totalSentencesWithAlts += countWithAlts;
}
console.log(`Total sentences with orderAlternatives: ${totalSentencesWithAlts}`);
console.log(`Total generated orderAlternatives: ${totalGeneratedAlts}`);
