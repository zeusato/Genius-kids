# Piano Nhí — imagegen artwork

Generated 2026-09-17 with the built-in imagegen tool (no CLI/API fallback). Four original illustrations; five optimized WebP files, 446,648 bytes total. Optimization changes format and resolution only, without cropping, repainting or compositing. `scripts/prepare-piano-art.mjs` reproduces the optimization from the four original PNGs.

## Saved project assets

- `public/piano/art/room.webp` — main room, 1200 px wide.
- `public/piano/art/room-card.webp` — same room at 600 px for the home hub.
- `public/piano/art/learn.webp` — first-note lesson, 640 px.
- `public/piano/art/songs.webp` — listening to a music book, 640 px.
- `public/piano/art/free.webp` — inventing melodies, 640 px.

These are decorative storybook illustrations. The actual interactive keyboard and teaching score are rendered by code, not from painted notation.

## Hero prompt

Use case: illustration-story. Asset type: wide hero illustration for a children's piano learning app called Piano Nhí; this is artwork only, no UI. Create a beautiful, quietly joyful hand-painted children's picture-book illustration of a little music room opening onto a garden. A honey-colored wooden upright piano with ivory and charcoal keys, small green piano bench, open music book with tiny musical marks (no words), a friendly small russet fox with cream muzzle/chest/tail tip sitting attentively beside it, potted leafy plants, arched window with warm morning sunlight and a soft garden beyond. A few small musical notes float naturally above the piano. Composition: landscape 3:2, whole piano and fox comfortably visible, elegant asymmetrical storybook composition with breathing room, eye-level gentle perspective. Medium: matte gouache and watercolor on warm ivory cold-pressed paper, real paper grain, subtle colored-pencil contours and expressive brushwork, tactile imperfect edges. Palette coordinated with a cream and sage-green app: muted sage, moss green, warm ochre wood, terracotta fox, dusty peach, ivory. Sophisticated editorial illustration suitable for ages 4–10, warm and tender, appealing but not babyish. No lettering, logos, watermark, border or UI. Avoid plastic, shiny 3D, clay render, toy-like bevels, gradients that look digitally airbrushed, photorealism, neon, clutter, distorted piano keys. The keyboard should read naturally as real grouped black and white piano keys, without an exaggerated close-up.

## Three mode-card prompts

The generated hero image was supplied as the style/character reference for each card; it was not an edit target.

### learn

Use case: illustration-story. Asset type: square illustrated mode-card artwork for a children's piano-learning app; not a UI mockup. Input image is a STYLE and FOX CHARACTER REFERENCE only; generate a new composition. Match its matte watercolor/gouache, colored-pencil detail, natural warm paper grain, russet fox with cream face/chest/tail tip, honey-colored wood and sage foliage. Make one beautiful, simple, legible spot illustration centered on an uninterrupted warm ivory paper background, with generous clear margins and delicate soft watercolor vignette edges. Square composition, large central subject, readable even at thumbnail size. A warm, gently humorous picture-book feeling, tactile brushwork, no 3D or plastic or shiny toy rendering. No text, letters, logos, watermark, border, frame or UI. Subject: the small curious fox sitting beside a SHORT SECTION of a wooden piano keyboard, gently reaching one front paw onto a white key, as if discovering its first note; two grouped black keys visibly rise behind it. A tiny green seedling in a terracotta pot beside the keys, and two tiny golden musical marks floating above. Keep fox, paw, keys and seedling close together as one charming learning vignette. Friendly face, believable animal anatomy.

### songs

Use case: illustration-story. Asset type: square illustrated mode-card artwork for a children's piano-learning app; not a UI mockup. Input image is a STYLE and FOX CHARACTER REFERENCE only; generate a new composition. Match its matte watercolor/gouache, colored-pencil detail, natural warm paper grain, russet fox with cream face/chest/tail tip, honey-colored wood and sage foliage. Make one beautiful, simple, legible spot illustration centered on an uninterrupted warm ivory paper background, with generous clear margins and delicate soft watercolor vignette edges. Square composition, large central subject, readable even at thumbnail size. A warm, gently humorous picture-book feeling, tactile brushwork, no 3D or plastic or shiny toy rendering. No text, letters, logos, watermark, border, frame or UI. Subject: the small attentive fox sitting beside an open music book propped on a small wooden stand, listening to a winding trail of just a few golden musical notes. Simple visible staff lines and musical marks in the book without readable words. A small sage leafy sprig at the base. Fox and music book form one balanced central vignette, expressive eyes looking toward the musical notes, inviting a child to play a song.

### free

Use case: illustration-story. Asset type: square illustrated mode-card artwork for a children's piano-learning app; not a UI mockup. Input image is a STYLE and FOX CHARACTER REFERENCE only; generate a new composition. Match its matte watercolor/gouache, colored-pencil detail, natural warm paper grain, russet fox with cream face/chest/tail tip, honey-colored wood and sage foliage. Make one beautiful, simple, legible spot illustration centered on an uninterrupted warm ivory paper background, with generous clear margins and delicate soft watercolor vignette edges. Square composition, large central subject, readable even at thumbnail size. A warm, gently humorous picture-book feeling, tactile brushwork, no 3D or plastic or shiny toy rendering. No text, letters, logos, watermark, border, frame or UI. Subject: the little happy fox playing a small honey-wood upright piano, seen from a gentle side angle with one front paw on its keys. A loose arc of three musical notes and two small peach-and-sage butterflies rises above the piano to suggest freely inventing melodies. A few little wildflowers beside the stool. One balanced compact vignette, joyful yet calm, generous blank warm-paper surroundings, no busy room or large background scene.

