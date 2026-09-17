import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const songs = JSON.parse((await readFile(new URL('games/Piano/content/songs.generated.json', root), 'utf8')).replace(/^\uFEFF/, ''));
const selected = new Set(songs.map(song => `${song.id}.xml`));
const get = async url => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status}: ${url}`); return Buffer.from(await r.arrayBuffer()); };
await mkdir(new URL('games/Piano/content/sources/', root), { recursive: true });
await mkdir(new URL('public/piano/audio/', root), { recursive: true });
const manifest = [];
for (const book of ['25418', '25432']) {
  const url = `https://www.gutenberg.org/files/${book}/${book}-h/${book}-h.htm`;
  const html = (await get(url)).toString('utf8');
  const links = [...html.matchAll(/href=["']([^"']+)["'][^>]*>\s*(?:<[^>]*>)*MusicXML/gi)].map(m => new URL(m[1], url).href);
  if (links.length < 20) throw new Error(`Missing music links: ${book} ${links.length}`);
  let count = 0;
  for (const source of links) {
    const file = `${book}-${source.split('/').pop()}`;
    if (!selected.has(file)) continue;
    const data = await get(source);
    await writeFile(new URL(`games/Piano/content/sources/${file}`, root), data);
    manifest.push({ book, source, file, sha256: createHash('sha256').update(data).digest('hex') });
    count++;
  }
  console.log(`Book ${book}: ${count} selected scores downloaded.`);
}
if (manifest.length !== selected.size) throw new Error('Some selected scores are missing.');
await writeFile(new URL('games/Piano/content/sources/manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
for (const note of ['C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6']) {
  const data = await get(`https://tonejs.github.io/audio/salamander/${note}.mp3`);
  await writeFile(new URL(`public/piano/audio/${note}.mp3`, root), data);
  console.log(`${note}: ${data.length} bytes`);
}
