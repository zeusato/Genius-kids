import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grade } from './engine';

const root = fileURLToPath(new URL('../../', import.meta.url));
const DATA_DIR = path.join(root, 'src/data/english');

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

function textToOrderIndices(sentence, text) {
  const clean = text.trim();
  const punctMatch = clean.match(/[.!?]$/);
  const punct = punctMatch ? punctMatch[0] : '';
  const rawWords = clean.replace(/[.!?]$/, '').split(/\s+/);

  const indices = [];
  const used = new Set();

  for (const w of rawWords) {
    const idx = sentence.tokens.findIndex(
      (t, i) => !used.has(i) && t.text.toLowerCase() === w.toLowerCase() && t.pos !== 'punct',
    );
    if (idx === -1) return null;
    used.add(idx);
    indices.push(idx);
  }

  if (punct) {
    const punctIdx = sentence.tokens.findIndex(
      (t, i) => !used.has(i) && t.pos === 'punct' && t.text === punct,
    );
    if (punctIdx !== -1) {
      used.add(punctIdx);
      indices.push(punctIdx);
    }
  }

  return indices;
}

const allLevels = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2'];
const corpus = allLevels.flatMap(level => {
  const file = path.join(DATA_DIR, `${level}.sentences.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
});

const get = (id) => {
  const found = corpus.find(s => s.id === id);
  if (!found) throw new Error(`Sentence not found: ${id}`);
  return found;
};

describe('Content Fixes 07 & 08: Order Alternatives and Full Negative Blanks', () => {
  describe('Mục 07: Bổ sung nghiệm xếp câu hợp lệ (orderAlternatives)', () => {
    it.each([
      ['A1-s-0031', 'The weather today is warm.'],
      ['A1-s-0038', 'The little cute puppy is very playful.'],
      ['A2-s-0016', 'In the lake there is an island.'],
      ['A3-s-0171', 'Whose is this book?'],
      ['B1-s-0023', 'In the morning she drinks warm milk.'],
      ['B1-s-0189', 'Sometimes I read comics.'],
      ['B1-s-0189', 'I read comics sometimes.'],
      ['B2-s-0176', 'Now he is running.'],
      ['B3-s-0001', 'Yesterday I was happy.'],
      ['B4-s-0002', 'Tomorrow he will visit his grandparents.'],
    ])('grades audit order alternative as TRUE in %s: "%s"', (id, candidate) => {
      const s = get(id);
      expect(s.exerciseTypes).toContain('order');
      expect(s.orderAlternatives).toBeDefined();
      expect(s.orderAlternatives).toContain(candidate);

      const indices = textToOrderIndices(s, candidate);
      expect(indices, `${id}: unable to map words to tokens for "${candidate}"`).not.toBeNull();
      expect(grade({ kind: 'order', sentence: s }, indices)).toBe(true);
    });

    it('rejects truly ungrammatical or incorrect word orders', () => {
      const s1 = get('B3-s-0001'); // "I was happy yesterday."
      const bad1 = textToOrderIndices(s1, 'Happy I was yesterday.');
      expect(grade({ kind: 'order', sentence: s1 }, bad1)).toBe(false);

      const bad2 = textToOrderIndices(s1, 'Was I happy yesterday.');
      expect(grade({ kind: 'order', sentence: s1 }, bad2)).toBe(false);

      const s2 = get('B1-s-0023'); // "She drinks warm milk in the morning."
      const bad3 = textToOrderIndices(s2, 'She in the morning drinks warm milk.');
      expect(grade({ kind: 'order', sentence: s2 }, bad3)).toBe(false);

      const bad4 = textToOrderIndices(s2, 'Drinks warm milk she in the morning.');
      expect(grade({ kind: 'order', sentence: s2 }, bad4)).toBe(false);
    });

    it('ensures every orderAlternative strictly preserves the token multiset (bag(alt) === bag(en))', () => {
      let countWithAlts = 0;
      let totalAlts = 0;

      for (const s of corpus) {
        if (!s.orderAlternatives || s.orderAlternatives.length === 0) continue;
        countWithAlts++;
        const enBag = bag(s.en);

        for (const alt of s.orderAlternatives) {
          totalAlts++;
          expect(alt.trim(), `${s.id}: alt cannot match canonical en`).not.toBe(s.en.trim());
          expect(bag(alt), `${s.id}: "${alt}" must have same tokens as "${s.en}"`).toBe(enBag);

          const indices = textToOrderIndices(s, alt);
          expect(indices, `${s.id}: could not map tokens for "${alt}"`).not.toBeNull();
          expect(grade({ kind: 'order', sentence: s }, indices)).toBe(true);
        }
      }

      // Check coverage: A1–C2 must have solid coverage across adverbials/Whose/There
      expect(countWithAlts).toBeGreaterThanOrEqual(300);
      expect(totalAlts).toBeGreaterThanOrEqual(350);
    });
  });

  describe('Mục 08: Cho phép dạng phủ định đầy đủ ở bài điền từ (blanks[].alt)', () => {
    const NEG_PAIRS = [
      ["isn't", 'is not'],
      ["aren't", 'are not'],
      ["wasn't", 'was not'],
      ["weren't", 'were not'],
      ["didn't", 'did not'],
      ["won't", 'will not'],
    ];

    it('covers every negative blank after the curriculum replacements in item 13', () => {
      const counts = { B2: 0, B3: 0, B4: 0 };

      for (const level of ['B2', 'B3', 'B4']) {
        const sentences = corpus.filter(s => s.level === level);
        for (const s of sentences) {
          if (!s.blanks) continue;
          for (const b of s.blanks) {
            const pair = NEG_PAIRS.find(([contracted]) => contracted.toLowerCase() === b.answer.toLowerCase());
            if (pair) {
              counts[level]++;
              const [contracted, fullForm] = pair;
              expect(b.alt, `${s.id}: missing alt for ${b.answer}`).toBeDefined();
              expect(b.alt, `${s.id}: alt must include full form "${fullForm}"`).toContain(fullForm);

              // Grade verification: contracted should pass
              expect(grade({ kind: 'fill', sentence: s, target: 0 }, contracted)).toBe(true);
              // Full form should pass
              expect(grade({ kind: 'fill', sentence: s, target: 0 }, fullForm)).toBe(true);
              // Affirmative or wrong answer must fail
              const wrongAnswer = fullForm.replace(/ not$/, '');
              expect(grade({ kind: 'fill', sentence: s, target: 0 }, wrongAnswer)).toBe(false);
            }
          }
        }
      }

      // Item 13 retargets B2 blanks to agreement and replaces twelve B3 rows
      // with question/reply trios. Check the current corpus, not the old totals.
      expect(counts.B2).toBe(29);
      expect(counts.B3).toBe(21);
      expect(counts.B4).toBe(20);
    });

    it('grades specific test case B2-s-0071 with both "isn\'t" and "is not"', () => {
      const s = get('B2-s-0071'); // "He isn't sleeping."
      expect(s.blanks[0].answer).toBe("isn't");
      expect(s.blanks[0].alt).toContain("is not");
      expect(grade({ kind: 'fill', sentence: s, target: 0 }, "isn't")).toBe(true);
      expect(grade({ kind: 'fill', sentence: s, target: 0 }, "is not")).toBe(true);
      expect(grade({ kind: 'fill', sentence: s, target: 0 }, "is")).toBe(false);
    });
  });
});
