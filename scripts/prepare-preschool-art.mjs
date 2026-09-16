import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// Usage: node scripts/prepare-preschool-art.mjs <alphabet image> <counting image> <colors image>
const sources = process.argv.slice(2);
if (sources.length !== 3) throw new Error('Provide three exported Google Flow images: alphabet, counting, colors.');
const output = new URL('../public/hub/art/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [index, topic] of ['alphabet', 'counting', 'colors'].entries()) {
    for (const width of [1200, 400]) {
        const target = new URL(`preschool-${topic}${width === 400 ? '-sm' : ''}.webp`, output);
        const result = await sharp(sources[index]).resize({ width }).webp({ quality: 84 }).toFile(target.pathname.replace(/^\/(\w:)/, '$1'));
        console.log(`${topic}: ${result.width} × ${result.height}, ${result.size} bytes`);
    }
}
