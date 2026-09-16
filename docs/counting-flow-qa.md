# Counting flow and app context menus — 2026-09-16

## Behavior

- Landscape play uses the available viewport height. Story, tracing, controls, and completion actions stay in the game frame. The ready-to-trace action is above the scene, with a brief attention cue.
- Completing a learning number opens the next number directly. The sequence wraps from 10 to 1. Choosing a particular number remains available separately.
- Number audio plays bundled English then Vietnamese recordings, followed by the instruction when entering a learning step. Replays, collection feedback, and listening games use the same sequence. Cancellation stops queued clips; listening answers unlock only after successful completion of both languages.
- Count, Listen, Add, and Compare start new trips from the full 1–10 pool. Only Learn shows the number picker. Existing saved trips are preserved.
- App mounts one capturing document context-menu handler for all routes and dialogs. Global CSS suppresses tablet touch callouts; text entry remains selectable in input fields.

## Verification

- TypeScript check passed.
- Preschool suite: 116 tests passed in 5 files, including 49 counting tests. New audio cases cover ordering, guidance after both languages, cancellation between clips, late callbacks, and failure/timeout results.
- Production build passed. Existing warnings remain for an unrelated CSS token, font URLs, mixed imports, and chunk sizes.
- In-app browser, 1024 × 768: complete the sun task; the trace action is visible above the scene.
- In-app browser, 1024 × 600: complete 1 with assistance, select Next, and enter the flower task for 2 directly. Water both flowers, trace 2 using a real pointer drag, and reach completion with Next 3 visible. The game frame measures about y=12–588 with matching client and scroll heights.
- At 1024 × 600, stack all eight blocks; tower stays within the scene. Launch the first rocket with a held pointer gesture, then finish the remaining rockets with keyboard activation. Complete 10, select Next 1, and verify the sun task starts fresh.
- Right-click on a rocket does not interrupt the game. The global handler is mounted in App rather than a counting component.
- All four other activity introductions show the 1–10 range and omit the individual-number picker.
- At 390 × 844, the learning page has no horizontal overflow and the visible main controls are at least 44 pixels high. Portrait content may scroll vertically; viewport fitting targets landscape tablets.

These browser checks use desktop Chromium with viewport emulation. Native long-press callouts on physical iPad/Android hardware still need a device check.
