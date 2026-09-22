import fs from 'node:fs';

export const curriculumReview = JSON.parse(fs.readFileSync(
  new URL('./english-curriculum-review.json', import.meta.url), 'utf8',
));
const words = sentence => sentence.tokens.map(t => t.text);
const normalize = value => value.toLowerCase().replace(/[‘’]/g, "'");
const bag = tokens => tokens.map(normalize).sort().join('\0');

export function applyCurriculumReview(sentence) {
  const review = curriculumReview[sentence.id];
  if (!review) return sentence;
  const signature = JSON.stringify(words(sentence));
  const targetWords = words(review.sentence);
  if (![JSON.stringify(review.sourceWords), JSON.stringify(targetWords)].includes(signature))
    throw new Error(`${sentence.id}: re-review curriculum replacement after changing its source tokens.`);
  // Curated replacement of the existing ID. Preserve unrelated metadata and
  // same-token order alternatives added by the parallel order review.
  const result = { ...structuredClone(sentence), ...structuredClone(review.sentence) };
  const compatible = (sentence.orderAlternatives || []).filter(alt => {
    const tokens = alt.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu) || [];
    return bag(tokens) === bag(targetWords);
  });
  const alternatives = [...new Set([...(review.sentence.orderAlternatives || []), ...compatible])].filter(alt => normalize(alt) !== normalize(result.en));
  if (alternatives.length) result.orderAlternatives = alternatives;
  else delete result.orderAlternatives;
  if (!sentence.exerciseTypes.includes('order')) result.exerciseTypes = result.exerciseTypes.filter(type => type !== 'order');
  // Keep negative expansions already approved for the same blank answer.
  for (const blank of result.blanks) {
    const previous = sentence.blanks.find(b => b.answer.toLowerCase() === blank.answer.toLowerCase());
    const alt = [...new Set([...(blank.alt || []), ...(previous?.alt || [])])];
    if (alt.length) blank.alt = alt;
  }
  return result;
}
