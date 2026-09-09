# Discovery hub artwork

Created 2026-09-09 in the user-authorized [Google Flow Game Assets project](https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5).

Four new Nano Banana 2 requests, landscape 16:9, two candidates per request. Eight candidates exported, four selected and visually inspected. The mounted knight was reused from the existing Flow project; other raster sources already belonged to the game. No new audio generation.

| File (plus `-sm` variant) | Selected source | Purpose |
| --- | --- | --- |
| study.webp | Flow export `df0d6d437de723c4` | Wooden abacus, desk lamp and counting objects |
| library.webp | Flow export `b80cbc7d3020b12a` | Storybook unfolding into a reading garden |
| riddle.webp | Flow export `43c7dd12f1ccd5dc` | Friendly sphinx and puzzle gate |
| science.webp | Flow export `9eeae4cab94ad6a2` | Miniature observatory and planetary model |
| knight.webp | Existing Flow export `8a8d6b3101bd01d8` | Young knight riding a horse |
| station.webp | `public/speed-math/art/station.webp` | Tia's game-show environment |
| tia.webp | `public/speed-math/art/tia.webp` | Robot mascot |
| forest.webp | `public/dragon/art/forest.webp` | Dragon adventure setting |
| car.webp | `games/MathRacing/CarIcon.png` | Existing racing-game car |

`scripts/install-hub-art.mjs` converts each local source into 800×450 and 400×225 WebP at quality 82. The car keeps transparency. Total for all 18 responsive files: **350,714 bytes**. The interface loads the size appropriate to its card and lazily loads lower cards. Text, numbers, buttons, memory illustrations, band, rover, geometry and machine illustrations are rendered from code. No expiring Flow URLs are requested at runtime.

## Prompts used

Shared prompt: Original premium children learning app cover illustration, tactile miniature diorama, three-quarter view, rounded sculptural forms, warm soft daylight, cream and sage teal palette with restrained honey gold accents, clear friendly silhouettes, layered depth, polished high quality toy-like 3D illustration. Main subject fully visible in central 60 percent, safe to crop to square, wide 16:9. Calm pale sage background, no interface, no text, no letters, no numerals, no logos, no watermark.

- **Study:** A curious learning desk on an oval miniature platform with a beautiful wooden abacus, teal and amber counting beads, tactile counting blocks, a wooden ruler without markings, and simple geometric solids. A little leafy plant, warm desk lamp. Large appealing shapes, delightful educational discovery scene.
- **Library:** An open beautiful storybook unfolding into a tiny welcoming garden and cozy reading pavilion with an arched doorway, paper-like rounded trees, warm reading lantern and a winding paper path. The entire miniature magical world rests on the open book. Whimsical inviting sense of wonder, clear dominant book silhouette, large appealing forms.
- **Riddle:** A friendly adorable young sphinx guardian with a cheerful face, golden sandstone body and a teal and honey gold ancient Egyptian headdress, seated beside a small sandstone puzzle gate with simple geometric carvings and small desert plants. Magical miniature world, welcoming and clever, no scary features. Single sphinx, clear broad silhouette.
- **Science:** A miniature science observatory with a rounded ivory dome, a brass telescope pointing up, a beautiful orrery of colorful stylized planets orbiting a warm golden sun, and teal crystals on an oval platform. Curious magical science discovery mood, clear readable planets, no real astronomical labels.

## Font

`../fonts/` bundles Nunito variable WOFF2 (Latin and Vietnamese subsets), 52,224 bytes combined, served locally with font-display swap. Source: Google Fonts CSS API, Nunito v32. The upstream SIL Open Font License is included in `../fonts/OFL.txt`. The CSS family name `HubNunito` scopes this choice to the hub.
