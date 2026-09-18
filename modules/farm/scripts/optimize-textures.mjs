// Re-encode source art without resizing or altering any visible pixel.
// Run from the repo root: node modules/farm/scripts/optimize-textures.mjs
import sharp from 'sharp';
import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const assets = fileURLToPath(new URL('../src/assets/', import.meta.url));
let originalBytes = 0, encodedBytes = 0, count = 0;
for (const directory of ['terrain', 'ui']) {
    const source = path.join(assets, directory), output = path.join(source, 'optimized');
    await mkdir(output, { recursive: true });
    for (const name of (await readdir(source)).filter(name => name.endsWith('.png') && name !== 'birch-v1.png').sort()) {
        const input = await readFile(path.join(source, name));
        const encoded = await sharp(input).webp({ lossless: true, effort: 6 }).toBuffer();
        const before = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const after = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        if (before.info.width !== after.info.width || before.info.height !== after.info.height || before.data.length !== after.data.length) throw new Error(`Dimensions changed: ${name}`);
        for (let i = 0; i < before.data.length; i += 4) {
            if (before.data[i + 3] !== after.data[i + 3] || before.data[i + 3] > 0 && (before.data[i] !== after.data[i] || before.data[i + 1] !== after.data[i + 1] || before.data[i + 2] !== after.data[i + 2])) throw new Error(`Visible pixel changed: ${name} at ${i / 4}`);
        }
        await writeFile(path.join(output, name.replace(/\.png$/, '.webp')), encoded);
        originalBytes += input.length; encodedBytes += encoded.length; count++;
        console.log(`${name}: ${input.length} -> ${encoded.length} bytes; visible RGBA identical`);
    }
}
console.log(JSON.stringify({ count, originalBytes, encodedBytes, reductionPercent: +(100 * (1 - encodedBytes / originalBytes)).toFixed(1) }));
