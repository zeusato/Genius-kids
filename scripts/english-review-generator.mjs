import { applyReviewedOrder } from './english-reviewed-order.mjs';
import { applyContentReviewV4 } from './english-content-review-v4.mjs';
import { reviewedC3Passages } from './english-c3-passages-reviewed.mjs';
// Read-only regeneration harness: capture writes, never execute filesystem writes.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { applyCurriculumReview } from './english-curriculum-review.mjs';
import { applyReviewedAnnotations } from './english-reviewed-annotations.mjs';
import { applyExercisePrompts } from './english-exercise-prompts.mjs';
import { applyTheoryReview } from './english-theory-review.mjs';
import { applyAdjectivePrompts } from './english-adjective-prompts.mjs';

export const reviewedGenerators = [
  'build-a1-full-data.mjs', 'build-a2-data.mjs', 'build-a3-data.mjs',
  'build-b1-data.mjs', 'generate-b1-sentences.mjs', 'build-b2-data.mjs',
  'generate-b2-content.mjs', 'build-b3-full.mjs', 'build-b4-full.mjs',
];
export function generateInMemory(filename, { finalReview = true } = {}) {
  const filepath = fileURLToPath(new URL(filename, import.meta.url));
  const writes = new Map();
  const source = fs.readFileSync(filepath, 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace('fileURLToPath(import.meta.url)', JSON.stringify(filepath));
  vm.runInNewContext(source, {
    fs: { existsSync: () => true, writeFileSync: (name, data) => writes.set(path.basename(name), JSON.parse(data)) },
    path, structuredClone, applyReviewedOrder, applyContentReviewV4: finalReview ? applyContentReviewV4 : (_file, value) => value, reviewedC3Passages, applyCurriculumReview, applyReviewedAnnotations,
    applyExercisePrompts, applyTheoryReview, applyAdjectivePrompts, console: { log() {} },
  }, { filename: filepath, timeout: 10000 });
  return writes;
}
