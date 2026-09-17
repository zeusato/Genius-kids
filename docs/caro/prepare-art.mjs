import sharp from 'sharp';
import { mkdir, copyFile, writeFile, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Format/size optimization only. All artwork is created using imagegen built-in.
const sources = process.argv.slice(2);
if (sources.length !== 2) throw new Error('Usage: node docs/caro/prepare-art.mjs cover-source.png backdrop-source.png');
const output = fileURLToPath(new URL('./art/', import.meta.url));
await mkdir(output, { recursive: true });
const entries = [
  { name: 'cover-v1', source: sources[0], width: 1200, role: 'menu-and-setup-cover', fit: 'contain', notes: 'Decorative illustration only; rendered game grid must be exact 15x15.' },
  { name: 'backdrop-v1', source: sources[1], width: 1536, role: 'peripheral-game-background', fit: 'cover-with-solid-board-overlay', safeCenter: { x: 0.24, y: 0.08, width: 0.54, height: 0.84 }, notes: 'Conservative visually reviewed central rectangle; hide ornamental background on narrow screens if needed.' },
];
const assets = [];
for (const entry of entries) {
  const original = path.join(output, entry.name + '.png');
  const optimized = path.join(output, entry.name + '.webp');
  // Refuse overwrites, including output produced by an earlier run.
  for (const target of [original, optimized]) {
    try { await stat(target); throw new Error('Output already exists: ' + target); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await copyFile(entry.source, original, constants.COPYFILE_EXCL);
  const bytes = await sharp(original).resize({ width: entry.width, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toBuffer();
  await writeFile(optimized, bytes, { flag: 'wx' });
  const files = [];
  for (const target of [original, optimized]) {
    const data = await readFile(target), metadata = await sharp(data).metadata();
    files.push({ file: path.basename(target), width: metadata.width, height: metadata.height, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
  }
  assets.push({ ...entry, source: path.resolve(entry.source), files });
}
const manifest = { version: 1, createdAt: new Date().toISOString(), tool: 'imagegen built-in', status: 'planning-art-selected-not-runtime-integrated', promptFile: '../art-prompts.md', assets };
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(manifest, null, 2));
