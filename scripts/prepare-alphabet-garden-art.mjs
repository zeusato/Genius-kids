import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Usage: node scripts/prepare-alphabet-garden-art.mjs <orchard> <playground> <hideaway>
// Or:   node scripts/prepare-alphabet-garden-art.mjs --add <scene-name> <image> [...]
const sources = process.argv.slice(2);
const entries = sources[0] === '--add'
    ? sources.slice(1).reduce((pairs, value, index, all) => index % 2 === 0 ? [...pairs, [value, all[index + 1]]] : pairs, [])
    : ['orchard', 'playground', 'hideaway'].map((scene, i) => [scene, sources[i]]);
if (!entries.length || entries.some(([scene, source]) => !/^[a-z-]+$/.test(scene) || !source)) throw new Error('Provide scene names and exported Google Flow images.');
const output = new URL('../public/preschool/garden/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [scene, source] of entries) {
    const result = await sharp(source).resize({ width: 1376, withoutEnlargement: true }).webp({ quality: 85 })
        .toFile(fileURLToPath(new URL(scene + '.webp', output)));
    console.log(`${scene}: ${result.width} x ${result.height}, ${result.size} bytes`);
}
