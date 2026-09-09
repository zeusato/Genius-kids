# Đấu Trường Tia Chớp — art manifest

Created 2026-09-09 in the user-authorized Google Flow project [Game Assets](https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5).
Model: **Nano Banana 2**, landscape 16:9, two candidates per request. Four requests, eight candidates; four selected and inspected. No Suno credits used for this game.

| File | Flow asset ID from export inventory | Dimensions | Approx. size | Use |
| --- | --- | --- | --- | --- |
| station.webp | 0d2b01f6d030244d | 1376 × 768 | 101 KiB | Teal observatory stage |
| garden.webp | 5e8601b0f4c5922c | 1376 × 768 | 146 KiB | Greenhouse stage |
| stars.webp | 60466b940ede194e | 1376 × 768 | 103 KiB | Violet astronomical stage |
| tia.webp | 7d217a39e08fdc76 | 420 × 234 | 4 KiB | Robot host, framed with CSS |

Assets are bundled via Flow's page asset export, then resized and encoded with `scripts/install-speed-art.mjs` (WebP quality 82). They do not depend on expiring signed URLs. No alpha is assumed: Tia uses a soft CSS portrait mask. If an image fails, the stage retains its gradient background and Tia has a CSS robot fallback. Current theme alone is loaded; the PWA caches up to eight art files on demand, outside the app-wide precache. Buttons, words, clocks, counting objects, energy lights and feedback particles are rendered with DOM/SVG/CSS.

## Prompts

**Station:** Original premium children knowledge arcade game show environment, whimsical energy observatory station, tactile stylized 3D illustration, turquoise teal and warm amber gold palette, sweeping glass dome with distant stars, luminous rounded energy columns on left and right, sculptural floating rings, polished cream stage floor, soft cinematic lighting, beautiful layered depth, welcoming magical science mood. Wide 16:9 frontal slightly elevated composition, calm uncluttered central 60 percent reserved for puzzle interface, detailed decorations only along edges. Environment background only, no characters, no robots, no vehicles, no roads, no writing, no letters, no numbers, no UI, no logos. High quality coherent game art, readable silhouettes, gentle contrast in center.

**Garden:** Original premium children knowledge arcade game show environment, whimsical magical greenhouse garden pavilion, tactile stylized 3D illustration, sage green turquoise and apricot palette, enormous soft leafy plants and luminous flowers along left and right edges, sculptural glass dome, cream circular stage floor, welcoming afternoon sunbeams, layered depth. Wide 16:9 frontal slightly elevated composition, calm uncluttered central 60 percent reserved for puzzle interface, detailed decorations only along edges. Environment background only, no characters, no robots, no vehicles, no roads, no writing, no letters, no numbers, no UI, no logos. High quality coherent game art, readable silhouettes, gentle contrast in center.

**Stars:** Original premium children knowledge arcade game show environment, magical astronomical observatory, tactile stylized 3D illustration, midnight violet and lavender palette with honey gold accents, glowing model planets and orbital rings hanging at edges, panoramic dome window with luminous constellations, warm cream stage floor, no recognizable real lettering. Wide 16:9 frontal slightly elevated composition, calm uncluttered central 60 percent reserved for puzzle interface, detailed decorations only along edges. Environment background only, no characters, no robots, no vehicles, no roads, no writing, no letters, no numbers, no UI, no logos. High quality coherent game art, readable silhouettes, gentle contrast in center.

**Tia:** Single original friendly robot mascot Tia for a premium children knowledge arcade, full body centered, small cute rounded retro robot with warm golden cream shell, teal glass face with two luminous cyan eyes and tiny happy smile, short antenna with glowing mint orb, stubby arms and feet, little star emblem on chest, welcoming wave, tactile high quality 3D toy rendering, softly lit, friendly and clever personality. One character only occupying central half of canvas, plain solid dark petrol teal background #123d49, no scenery, no props, no text, no lettering, no watermark, no logos. Broad clean silhouette, frontal three quarter view. Landscape 16:9.

## Audio

Existing local background track: `public/sound/timeAttack-Wonder in the Air.mp3`. Per-event Web Audio tones add combo, correct/incorrect and round-complete feedback. Music and SFX have independent controls; narration ducks background music, pause suspends it without seeking, and component cleanup restores route music. No new remote audio source is required.
