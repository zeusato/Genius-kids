/**
 * Planet texture pipeline: download originals + convert to WebP at target sizes.
 *
 * Sources & licenses:
 *  - Solar System Scope textures (https://www.solarsystemscope.com/textures/)
 *    License: CC BY 4.0 (attribution: "Solar System Scope")
 *  - NASA Earth Observatory images (public domain):
 *    - Black Marble 2016 (earth night): eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg
 *    - Combined clouds: eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg
 *
 * Usage: node scripts/convert-textures.mjs
 * Downloads originals to .texture-src/ (gitignored/temp), outputs WebP to public/textures/.
 */

import { mkdir, writeFile, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(root, '.texture-src');
const OUT_DIR = path.join(root, 'public', 'textures');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const SSS = 'https://www.solarsystemscope.com/textures/download/';

const DOWNLOADS = [
  { file: '2k_mercury.jpg', url: SSS + '2k_mercury.jpg' },
  { file: '2k_venus_atmosphere.jpg', url: SSS + '2k_venus_atmosphere.jpg' },
  { file: '2k_earth_daymap.jpg', url: SSS + '2k_earth_daymap.jpg' },
  { file: '2k_mars.jpg', url: SSS + '2k_mars.jpg' },
  { file: '2k_jupiter.jpg', url: SSS + '2k_jupiter.jpg' },
  { file: '2k_saturn.jpg', url: SSS + '2k_saturn.jpg' },
  { file: '2k_uranus.jpg', url: SSS + '2k_uranus.jpg' },
  { file: '2k_neptune.jpg', url: SSS + '2k_neptune.jpg' },
  { file: '2k_sun.jpg', url: SSS + '2k_sun.jpg' },
  { file: '8k_saturn_ring_alpha.png', url: SSS + '8k_saturn_ring_alpha.png' },
  { file: '8k_stars_milky_way.jpg', url: SSS + '8k_stars_milky_way.jpg' },
  {
    file: 'BlackMarble_2016_01deg.jpg',
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg',
  },
  {
    file: 'cloud_combined_2048.jpg',
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg',
  },
];

// out name, source file, width, height, webp options
const TARGETS = [
  ['mercury.webp', '2k_mercury.jpg', 1024, 512, { quality: 78 }],
  ['venus.webp', '2k_venus_atmosphere.jpg', 1024, 512, { quality: 78 }],
  ['earth_day.webp', '2k_earth_daymap.jpg', 2048, 1024, { quality: 78 }],
  ['earth_night.webp', 'BlackMarble_2016_01deg.jpg', 1024, 512, { quality: 78 }],
  ['earth_clouds.webp', 'cloud_combined_2048.jpg', 1024, 512, { quality: 80 }],
  ['mars.webp', '2k_mars.jpg', 1024, 512, { quality: 78 }],
  ['jupiter.webp', '2k_jupiter.jpg', 2048, 1024, { quality: 78 }],
  ['saturn.webp', '2k_saturn.jpg', 2048, 1024, { quality: 78 }],
  // Ring texture is RGBA; alpha channel must survive. q90 + alphaQuality 100.
  ['saturn_ring.webp', '8k_saturn_ring_alpha.png', 1024, 64, { quality: 90, alphaQuality: 100 }],
  ['uranus.webp', '2k_uranus.jpg', 512, 256, { quality: 78 }],
  ['neptune.webp', '2k_neptune.jpg', 512, 256, { quality: 78 }],
  ['sun.webp', '2k_sun.jpg', 1024, 512, { quality: 78 }],
  ['stars_2k.webp', '8k_stars_milky_way.jpg', 2048, 1024, { quality: 70 }],
  ['stars_4k.webp', '8k_stars_milky_way.jpg', 4096, 2048, { quality: 70 }],
];

const MAGIC = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
};

async function download({ file, url }) {
  const dest = path.join(SRC_DIR, file);
  if (existsSync(dest)) {
    const ok = await verify(dest, file);
    if (ok) {
      console.log(`skip (cached)  ${file}`);
      return;
    }
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  if (!(await verify(dest, file))) {
    throw new Error(`Downloaded ${file} failed validation (size/magic bytes)`);
  }
  console.log(`downloaded     ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function verify(dest, file) {
  const s = await stat(dest);
  if (s.size < 50 * 1024) return false;
  const fd = await readFile(dest);
  const isPng = file.endsWith('.png');
  return isPng ? MAGIC.png(fd) : MAGIC.jpg(fd);
}

async function convert([out, srcFile, width, height, webpOpts]) {
  const src = path.join(SRC_DIR, srcFile);
  const dest = path.join(OUT_DIR, out);
  await sharp(src, { limitInputPixels: false })
    .resize(width, height, { fit: 'fill' })
    .webp(webpOpts)
    .toFile(dest);
  const meta = await sharp(dest).metadata();
  const size = (await stat(dest)).size;
  console.log(
    `converted      ${out.padEnd(18)} ${meta.width}x${meta.height} ` +
      `channels=${meta.channels} alpha=${meta.hasAlpha} ${(size / 1024).toFixed(1)} KB`
  );
  return { out, ...meta, size };
}

async function main() {
  await mkdir(SRC_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  for (const d of DOWNLOADS) await download(d);

  const results = [];
  for (const t of TARGETS) results.push(await convert(t));

  const total = results.reduce((a, r) => a + r.size, 0);
  console.log(`\nTotal: ${results.length} files, ${(total / 1024).toFixed(1)} KB`);

  // sanity checks
  const ring = results.find((r) => r.out === 'saturn_ring.webp');
  if (!ring.hasAlpha) throw new Error('saturn_ring.webp lost its alpha channel!');
  for (const [out, , w, h] of TARGETS) {
    const r = results.find((x) => x.out === out);
    if (r.width !== w || r.height !== h)
      throw new Error(`${out} is ${r.width}x${r.height}, expected ${w}x${h}`);
  }
  console.log('All dimension + alpha checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
