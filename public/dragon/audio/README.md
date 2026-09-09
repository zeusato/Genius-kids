# Dragon adventure soundtrack

Two instrumental variations generated in the user's Suno account on 2026-09-09. One generation action was used: 10 of the user's 50-credit budget, leaving 40 credits unspent by this task. The user downloaded and supplied the MP3s in `public/`, and explicitly asked to move them into the game.

| Runtime file | User-supplied source | Song |
| --- | --- | --- |
| forest-of-dawn.mp3 | Suno AI Music.mp3 | https://suno.com/song/23f8ff40-6b09-4a90-b6aa-7adcc0fdcc8c |
| enchanted-journey.mp3 | Suno AI Music 2.mp3 | https://suno.com/song/9bddefdf-391f-4163-b159-f9f44e12f383 |

Prompt: instrumental whimsical fantasy adventure; warm flute, woodwinds, pizzicato strings, marimba, harp and soft hand percussion; 105 BPM; hopeful forest exploration; gentle dynamics with room for spoken questions; no vocals, choir or loud drops; repeating sections suitable for looping.

Forest and snow use the first variation. Wind, crystal and castle use the second. `musicManager` fades between tracks, honors the existing music toggle, pauses without resetting position, and lowers volume during spoken questions. Small game cues are synthesized separately by `useAdventureSound` and follow the sound-effects toggle.

The account displayed Free-plan restrictions during generation. User-supplied downloads do not change the applicable Suno usage license; retain this provenance when preparing a public release.
