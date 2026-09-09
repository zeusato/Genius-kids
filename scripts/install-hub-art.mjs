// Convert a selected local Flow export or existing game image into responsive covers.
// Usage: node scripts/install-hub-art.mjs <name> <source>
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const [name, source] = process.argv.slice(2);
if (!['study','library','riddle','science','station','tia','forest','knight','car'].includes(name) || !source) throw new Error('Expected cover name and local source');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/hub/art');
for (const width of [800, 400]) {
    const suffix = width === 400 ? '-sm' : '';
    const result = await sharp(source).resize({width, height:Math.round(width * 9 / 16), fit:name === 'car' ? 'contain' : 'cover', background:{r:0,g:0,b:0,alpha:0}}).webp({quality:82}).toFile(path.join(root, name + suffix + '.webp'));
    console.log(name + suffix + ': ' + result.width + 'x' + result.height + ', ' + result.size + ' bytes');
}
