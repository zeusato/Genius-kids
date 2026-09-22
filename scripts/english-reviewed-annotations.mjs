import fs from 'node:fs';

// Editorial decisions for the current B2–B4 corpus, not a grammar parser.
// Keep this ledger in sync when editing tokenization or replacing a sentence.
// B4-s-0027 is intentionally owned by fix-list item 01, outside this review.
export const reviewedAnnotations = JSON.parse(fs.readFileSync(
  new URL('./english-annotations-b2-b4.json', import.meta.url), 'utf8',
));

export function applyReviewedAnnotations(sentence) {
  const review = reviewedAnnotations[sentence.id];
  if (!review) return sentence;
  if (JSON.stringify(sentence.tokens.map(t => t.text)) !== JSON.stringify(review.words)) {
    throw new Error(`${sentence.id}: token sequence changed; re-review english-annotations-b2-b4.json before applying its indices.`);
  }
  // Clone: generators sometimes share token objects between sentences.
  const result = structuredClone(sentence);
  result.roleSpans = structuredClone(review.spans);
  for (const { index, ...patch } of review.patches) Object.assign(result.tokens[index], patch);
  result.exerciseTypes = result.exerciseTypes.filter(type =>
    !(type === 'roles' && review.disableRoles) && !(type === 'pos' && review.disablePos),
  );
  return result;
}
