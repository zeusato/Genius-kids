# Xưởng Gốm — implementation notes

Integrated prototype, 2026-10-14; full v1 acceptance is still pending. Enter through **Sảnh khám phá → Xưởng Gốm** for any grade. Route: `/pottery/*` (production base `/Genius-kids/`).

The follow-up [plan audit](plan-audit.md) records implementation gaps beyond hardware testing and the cavity correction. The earlier “delivered” list below describes available features, not completed release acceptance.

## Delivered

- Real Three.js/R3F wheel and vessel. Drag vertically for height; hold the body to pinch; drag outward to expand; open a real cavity; smooth; orbit; undo/redo. Alternative buttons support precise adjustments without dragging.
- 3 clays, 6 glaze finishes, 16 colors, partial dipping, interior color, brush/eraser, 12 stamps and 6 bands. UV wrap, incremental paint replay and seeded procedural glaze variation.
- Preparation, decoration, firing, reveal and finished stages. Saves occur before stage commits; loading a processing stage resumes its presentation. Firing is an accelerated visual simulation, not a ceramic chemistry model.
- Named gallery, WebP thumbnails, PNG capture, editable JSON export/import and independent copies for further shaping or glazing.
- 3 lessons, 8 reference silhouettes, 12 challenges and 6 spoken facts. Bounded milestone rewards use existing student reward storage; imports and copies cannot farm rewards.
- ImageGen cover, responsive layout, reduced motion, optional synthesized sound, low quality tier and context-loss recovery.

## Code map

| Folder | Responsibility |
| --- | --- |
| `src/pottery/engine` | Shape constraints, documents, backups and reward eligibility |
| `src/pottery/render` | Indexed lathe mesh, layered canvas textures, raycast gestures and scene |
| `src/pottery/state` | Gesture history, serialized saves and stage transactions |
| `src/pottery/persistence` | IndexedDB records, checkpoints, thumbnails and revision checks |
| `src/pottery/content` | Lessons, shapes, facts and challenge evaluation |
| `src/pottery/progress` | Idempotent student milestones |
| `src/pottery/ui` | Lobby, workshop, gallery and responsive styles |

## Storage and limits

Database `pottery-studio-v1`, schema v1. Compound key `[account, student, id]` on artworks, checkpoints and thumbnails. Writes compare the expected revision inside one transaction. Conflicting tabs can export or fork instead of overwriting newer data. Deleting a student clears only that student's account scope.

Artwork remains on the device; only small student milestone data participates in existing profile synchronization. Export JSON to transfer an editable artwork. Import rebinds ownership and creates a new ID. Unknown schema/material versions fail closed; a future schema needs an explicit migration.

64 height samples, 96 angular segments normally / 64 in low tier. Textures are 1024² / 512²; DPR caps are 1.5 / 1.25. `?tier=low` forces the smaller tier. Idle scenes render on demand; active rotation and gestures request frames. Paint is not uploaded while shaping. History is bounded to 50 entries and approximately 16 MiB; journals to 1,500 strokes / 60,000 points; imports to 8 MiB.

The existing PWA build includes the module's JavaScript and media. The full offline media download includes the pottery covers. The 3D scene has no remote font, environment map or model dependency.

## Verification — 2026-10-14

- Full Vitest suite: **126 files, 3,767 tests passed**. Includes geometry topology/normals/bounds, 3,000 aggressive sculpt edits, timestep comparison, backup validation, challenge satisfiability, reward deduplication, scope isolation, stale writes/thumbnails, undo/redo and stage transitions.
- Production build succeeded, including service worker generation. Existing shared font/chunk/CSS warnings remain.
- TypeScript has an existing unrelated error at `modules/farm/src/ui/renderSnapshot.ts:26` (`object[]` versus `Obstacle[]`). No pottery TypeScript error in the checked implementation.
- Browser smoke test on the production preview: hub entry, new artwork, direct drag, height tool, cavity opening, preparation, speckled glaze, flower stamp, firing, reward, rename, PNG download, JSON download, gallery, browser reload and JSON reimport. Imported artwork reopened in decoration with the original shape, glaze and stamp. Saved gallery and two earned stars survived reload.
- Exported PNG inspected: actual 3D render with selected background; JSON inspected: correct name, cavity, journal and stage. Desktop and 390 × 844 layout inspected; no horizontal page overflow at the narrow viewport.
- The in-app browser reported an existing music-autoplay warning and a Three shader precision warning, but no JavaScript error during the smoke test.

## Release checks that still need hardware or people

Physical iPad/Android touch and stylus behavior, GPU frame-time/thermal measurements, 20-minute soak and repeated context loss, airplane-mode PWA installation/reload, and testing with children have **not** been certified by this implementation session. Browser viewport emulation is not a substitute for physical touch or GPU testing. The detailed acceptance checklist remains in `../pottery-studio-plan.md`.

Asymmetric sculpting, handles/spouts, cloud artwork synchronization, AR and physical ceramic simulation remain outside this v1 scope.
