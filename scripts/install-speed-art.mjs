// Usage: node scripts/install-speed-art.mjs <station|garden|stars|tia> <Flow bundle file>
// Resize/compress exported Flow art; no network calls or generated runtime URLs.
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const [name,source]=process.argv.slice(2);
if(!['station','garden','stars','tia'].includes(name)||!source)throw new Error('Expected an asset name and exported Flow file');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public/speed-math/art');
const result=await sharp(source).resize({width:name==='tia'?420:1600,withoutEnlargement:true}).webp({quality:82}).toFile(path.join(root,`${name}.webp`));
console.log(`${name}.webp: ${result.width}×${result.height}, ${Math.round(result.size/1024)} KiB`);
