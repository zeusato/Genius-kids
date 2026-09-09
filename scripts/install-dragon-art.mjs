// Convert exported Flow artwork into small, same-origin game assets.
// Usage: node scripts/install-dragon-art.mjs name absolute-export-path
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const [name, source] = process.argv.slice(2);
if (!['forest','wind','crystal','snow','castle','fairy','goblin','dragon'].includes(name) || !source) throw Error('Expected a known asset name and exported file path');
const destination = resolve('public/dragon/art');
await mkdir(destination,{recursive:true});
const result = await sharp(source).resize({width:1600,withoutEnlargement:true}).webp({quality:83,effort:5}).toFile(resolve(destination,name+'.webp'));
console.log(name, result.width, result.height, result.size);
