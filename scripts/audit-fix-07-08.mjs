import fs from 'fs';
import path from 'path';

const data = ['B2', 'B3', 'B4'];
const negMap = {
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

for (const level of data) {
  const content = JSON.parse(fs.readFileSync(`src/data/english/${level}.sentences.json`, 'utf-8'));
  console.log(`\n=== LEVEL ${level} ===`);
  content.forEach(s => {
    (s.blanks || []).forEach(b => {
      const lower = b.answer.toLowerCase();
      if (negMap[lower]) {
        console.log(`${s.id} | ans: "${b.answer}" | alt: ${JSON.stringify(b.alt || [])} | prompt: "${b.promptVi}"`);
      }
    });
  });
}
