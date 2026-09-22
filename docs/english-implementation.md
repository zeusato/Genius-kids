# English Garden — Current implementation

Updated 2026-09-23. The reviewed A1–C3 curriculum and the independent K track are now published. The dated Phase 1 report below is historical.

## Completed expansion

- Topic catalog for all 11 tracks; preschool profiles enter English Garden directly. Learn pages load the selected topic, with theory, vocabulary, reviewed examples, supported grammar widgets and irregular verb tables. K offers letters, paginated phrases and vocabulary.
- Practice and tests select one or more topics. Practice offers grammar, verb conjugation, word spelling/letter tiles, meanings, listening, K pictures/letters/phrases, C3 reading (MCQ, true/false, short answers) and rewrites. All grading stays offline and uses reviewed answers/alternatives.
- Single-topic exams cover the full skill catalog and use unique sources. C1 needs at least 11 questions; larger mixed exams expand to cover selected skills. Different questions from the same passage do not count as distinct sources. Mixed exams never grant mastery.
- Eight-question placement samples seed topics from A1 through C3 and gives a limited starting suggestion. It awards no stars, mastery or skill statistics.
- Progress keys migrate from legacy A1 names to level:skill. Review stores snapshots of missed/hinted sources. Only correct due-review attempts advance 1 → 3 → 7 → 14 days; same-day repeats do not accelerate the schedule. Review currently awards no stars.
- Existing IndexedDB revision checks, Web Locks, reward ledger, daily reward caps and immutable session snapshots remain in use. Results preserve first-attempt grading.
- Listening requires successful playback before checking. Playback failure offers retry or a written meaning question before any attempt, without a wrong-answer penalty. Device English voice availability still varies.
- Parent content tools reuse Gemini settings/client. Explicit generation creates draft envelopes in a separate owner-scoped IndexedDB store; invalid/duplicate output is quarantined. Approval is required for practice inclusion; seed-only exams and placement exclude AI. Limits: 3 requested items, at most 5 returned items, 200 stored items / 2 MB per profile; 60-second cancellation timeout. Profile deletion clears both stores.
- All 33 canonical JSON files are validated at build, emitted as versioned assets and included in the PWA core cache. UI cache readiness checks actual cached URLs; loading a page alone is not claimed as durable offline availability.

## Verification of the expansion

- 168 tests pass across English content, activity engines, AI isolation, profiles, hub and PWA download rules.
- Tests generate complete exams for every grammar topic, check distinct-source second-exam mastery, C3 alternatives, mixed/placement exclusion, K choices, review timing, migration and AI approval/quarantine.
- Production build passes; all 33 English content assets occur in the service worker manifest.
- Typecheck reports the pre-existing farm error at modules/farm/src/ui/renderSnapshot.ts:26 (object[] is not Obstacle[]); no English module errors in the latest completed typecheck.
- Browser: completed a C3 reading practice with short-answer, true/false and MCQ, received 5/5 and exactly one star, with review explanations saved. Reading layout verified without horizontal overflow at 390 px. A preschool profile opens K directly; the K home has no horizontal overflow at 320 px. A picture question was graded correctly, its selected answer persisted through hot reload, and the home page listed its saved 1/5 draft. Temporary viewport overrides were reset after testing.
- Live Gemini generation was not invoked during verification. API behavior still depends on the configured key and service availability; no external model is used for grading.

---

## Historical Phase 1 report (2026-09-22)

# English Garden — Phase 1

Implemented on 2026-09-22. Entry: **Sảnh khám phá → Tiếng Anh** for primary-school profiles. Preschool stays on the existing alphabet activities. Only A1 is published in this phase; adding JSON for A2 or later does not automatically publish a level.

## Delivered

- `/english`: illustrated landing page, resume drafts, five skill aggregates, recent results, upcoming chapters.
- `/english/learn/A1`: theory, navigation, annotated sentence examples (POS and role groups), pronoun swap, searchable vocabulary and English device speech when available.
- `/english/practice`: 5/10/15 questions, mixed or fill/order/POS/role-group practice. Family-specific practice uses only skills with approved examples for that exercise type; short answers intentionally excluded from POS/roles remain usable in fill/order.
- `/english/test`: 10 unique source sentences, two per required A1 skill; no answer annotations, hints or speech before submission.
- `/english/result/:id`: first-attempt score, explanations, retry-safe reward persistence and review links.

The implementation reads canonical JSON from `src/data/english`; it does not rewrite Gemini's files or content generators. Each session keeps complete exercise snapshots and a hash of its content version. Existing sessions therefore do not change when content is regenerated.

## Persistence and rewards

Question snapshots, answers and draft revisions live in IndexedDB `genius-english-v1`, keyed by student and session. IndexedDB compare-and-swap rejects stale writes from a second tab. Profile completion uses Web Locks plus a fresh localStorage read, so two English sessions cannot overwrite each other's rewards. A failed profile save keeps the submitted session and its persisted gacha draw available for retry. The profile ledger is authoritative if the final detail write fails.

English aggregates live in optional `StudentProfile.englishProgress` with schema version 1. Practice grants one star for at least five questions and 60% first-attempt accuracy without hints, at most three rewarded sessions per local day. Tests reuse existing star thresholds and album drawing policy, at most two rewarded sessions per local day. General time/question/star counters update; math test history and math-specific achievement checks do not run.

Mastery requires the last two qualifying A1 exams to reach at least 80%, cover all five skills and have at least 50% different sources. Evidence remains separate from the capped recent-history list. Ledger pruning has a monotonically advancing start-time cutoff to reject old session replay.

## Content checks and importing

```sh
node scripts/english-content.mjs validate
node scripts/english-content.mjs merge sentences A2 staging/A2.merged.json staging/batch1.json staging/batch2.json
```

The shared pure validator is `src/english/validation.mjs`. It validates sentences, vocabulary, theory, passages, rewrites and phrases, including unknown fields, enums, role spans, references, answer indices, token reconstruction, alternative token multisets and A1 minimum quotas. Merge refuses duplicate IDs and existing output files. Keep unfinished batches outside the runtime content directory. Production build validates the published A1 bundle; the CLI validates all canonical files, including unpublished levels.

Schema validation does **not** replace human review of grammar, translations, image meaning, scope or pedagogical variety. Gemini's updated content still needs its separate editorial review before content sign-off.

## Visual assets

Created with the built-in imagegen tool, optimized to WebP with Sharp:

- `public/english/garden.webp` — lesson landing illustration.
- `public/hub/art/english.webp` and `english-sm.webp` — discovery card.

Prompt: “Use case: illustration-story. Create one landscape 3:2 premium children's storybook illustration for an English learning app, ages 6–11. A friendly small red fox in a sage green scarf sits with an open cream book on a wooden reading desk in a cozy garden greenhouse. Three wooden alphabet tiles A B C rest next to the book, a little potted sprout and a pencil. Soft hand-painted gouache and paper-cut depth, subtle visible paper texture, beautifully art-directed rather than generic clipart. Warm ivory background, muted sage and forest green foliage, terracotta fox, honey wood. Gentle morning light from upper left, quiet inviting atmosphere, rounded handcrafted shapes. Composition: fox, book, desk grouped centrally with generous cream breathing room around them, no cropping of head or book, lush leaves frame two edges lightly. This is an actual illustration asset, no interface or frames or buttons. No text except the exact single letters A B C on three blocks, no logos, no watermarks.”

The separately requested iPhone wallpaper is an independent output in Codex generated images and is not included in the app assets.

## Verification

Automated suite: 136 passing tests across English, hub catalog, profiles, Sudoku persistence, Caro, Piano and PWA downloads. Includes actual A1 quota checks and generation of every practice family, deterministic grading, grouped roles, duplicated word tiles, first-attempt scoring, balanced exams, mastery, daily reward caps, wrong-owner rejection, draft revisions, concurrent duplicate completion and quota-error retries without another gacha draw.

Typecheck has one pre-existing error in `modules/farm/src/ui/renderSnapshot.ts:26` (`object[]` is incompatible with `Obstacle[]`), reproduced before implementation. No new English errors.

Production build passes, including the content gate and generated service worker. The worker manifest includes the English page, all three A1 JSON chunks and the illustration. Existing build warnings include large chunks, the hub font paths and a Tailwind arbitrary-selector warning from the existing timestamp expression in vite.config.ts.

Browser verification on the production build: completed a five-question role exercise at 320px using mouse and keyboard, including a three-word subject; saved 5/5 and exactly one star. A ten-question test exposed no answer speech, hints or annotation colors, accepted a sentence assembled from word tiles, and scored three answered questions as 3/10 after submission. A real second tab was prevented from overwriting a newer draft and displayed the reload action. Development testing also covered incorrect fill answers, successful retry with first-attempt scoring retained, and resuming the exact saved question after a reload.


Offline verification: stopped the local production HTTP server, confirmed connections failed, then reloaded the app, selected the same profile and opened English again. Both results (5/5 practice, 3/10 test), the one-star balance, theory, pronoun swap and vocabulary search/flip survived. Layout measured no horizontal overflow at 320px, 390px and 1280px. The first offline check exposed an uncached illustration during initial service-worker installation; the three English WebP files are now essential install assets, with a regression test.

After activating that fix, stopped the production server again and reopened English: the illustrated cover loaded successfully from cache (`complete && naturalWidth > 0`), and the existing results and one-star wallet remained intact. No browser console errors were recorded during the final learning/practice/test checks.
