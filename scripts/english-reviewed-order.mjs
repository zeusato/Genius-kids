// Preserve existing A1–B4 order reviews during regeneration (handoff item 14).
// This ledger does not generate new permutations or relax the grader.
import fs from 'node:fs';
const reviews = JSON.parse(fs.readFileSync(new URL('./english-reviewed-order.json', import.meta.url), 'utf8'));
export function applyReviewedOrder(sentence) {
  const review = reviews[sentence.id];
  if (!review) return sentence;
  if (JSON.stringify(sentence.tokens.map(t => t.text)) !== JSON.stringify(review.words))
    throw new Error(`${sentence.id}: token sequence changed; re-review saved order alternatives.`);
  return { ...sentence, orderAlternatives: [...new Set([...(sentence.orderAlternatives || []), ...review.alternatives])] };
}
