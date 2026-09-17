import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Format/size optimization only; the artwork itself is generated with imagegen.
const sources = process.argv.slice(2);
if (sources.length !== 4) throw new Error('Usage: node scripts/prepare-piano-art.mjs hero.png learn.png songs.png free.png');
const output = new URL('../public/piano/art/', import.meta.url);
await mkdir(output, { recursive: true });
const files = [
  ['room.webp', sources[0], 1200],
  ['room-card.webp', sources[0], 600],
  ['learn.webp', sources[1], 640],
  ['songs.webp', sources[2], 640],
  ['free.webp', sources[3], 640],
];
for (const [name, source, width] of files) {
  const target = new URL(name, output);
  await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(fileURLToPath(target));
  console.log(`${name}: ${(await stat(target)).size} bytes`);
}
