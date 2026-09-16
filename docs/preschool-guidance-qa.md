# Preschool guidance and thumbnails — 2026-09-16

## Changes

- The lowercase matching task appears inside the completed garden scene, with large choices and a brief motion cue. Speech changes with the discovery phase, cancelling the old introduction before announcing the next action.
- Letter tracing speech changes with the stroke index and with each retry. The next stroke's direction stays visible instead of being replaced by generic praise.
- The next-letter action is above the drawing area; the landscape canvas height adapts to the viewport.
- All 13 activities use individual 720 × 480 WebP illustrations (about 0.8 MB total). Generation prompts and source provenance are in `preschool-thumbnails-prompts.json`; runtime assets are in `public/preschool/thumbnails`.

## Verification

- `node node_modules/typescript/bin/tsc --noEmit` — passed.
- `node node_modules/vitest/vitest.mjs run src/components/preschool` — 114 tests passed across 5 files.
- `node node_modules/vite/bin/vite.js build` — passed. Existing warnings remain for font URLs, an unrelated CSS token, mixed imports and large chunks.
- Browser at 1024 × 768: harvest three apples, wrong/correct matching choices, trace all three A strokes, earn sticker. The next-letter button was visible around y=239–283 without scrolling after completion.
- Browser at 390 × 844: matching choices and completed tracing layout fit horizontally; the next-letter action remains above the paper.
- Real components with mock Web Speech voices: verified complete matching narration, each numbered stroke direction, completion narration, retry narration, and transition to letter B.
- Counting and Colors cards render their corresponding artwork and open the selected activities.

## Repeatable speech inspection

Start the Vite dev server and open `/Genius-kids/Previews/preschool-guidance.html`. This development-only fixture renders the real garden component with mock voices that append actual speech calls to the visible “Speech log”. It runs as a guest and does not award progress to an existing profile. Reload the fixture after changing source files before repeating a regression check.

1. Pick all three apples. Check that the log announces the lowercase matching task, including the English letter name.
2. Choose `a`. Trace A from the green anchor, lifting between strokes. Check separate entries for Nét 1, Nét 2, Nét 3 and completion.
3. Select Tô lại. Check that Nét 1 is announced again, including when resetting an untouched first stroke.
4. Complete again and select Chữ tiếp theo. Check that the garden switches to B.

The mock verifies speech scheduling and text, not the quality or availability of installed voices on a physical tablet.
