import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [sheet1, sheet2, sheet3, sheet4, customWorkshop, foxMascot] = process.argv.slice(2);

if (![sheet1, sheet2, sheet3, sheet4, customWorkshop, foxMascot].every(Boolean)) {
  console.error('Usage: node scripts/prepare-alphabet-activities-art.mjs <sheet1> <sheet2> <sheet3> <sheet4> <custom-workshop> <fox-mascot>');
  process.exit(1);
}

const root = process.cwd();
const objectDir = path.join(root, 'public', 'preschool', 'alphabet-games', 'objects');
const sceneDir = path.join(root, 'public', 'preschool', 'alphabet-games', 'scenes');
const qaDir = path.join(root, 'docs', 'qa', 'alphabet-activities');
const mascotOutput = path.join(root, 'public', 'preschool', 'alphabet-games', 'fox-guide.webp');

const sheets = [
  {
    file: sheet1,
    ids: ['apple', 'ant', 'ball', 'banana', 'bear', 'cat', 'car', 'cake', 'dog', 'duck', 'elephant', 'egg', 'fish', 'frog'],
  },
  {
    file: sheet2,
    ids: ['goat', 'grape', 'hat', 'horse', 'ice-cream', 'ice', 'juice', 'jellyfish', 'kite', 'key', 'lion', 'leaf', 'monkey', 'moon'],
  },
  {
    file: sheet3,
    ids: ['nest', 'net', 'orange', 'owl', 'pig', 'panda', 'queen', 'quilt', 'rabbit', 'robot', 'sun', 'star', 'tiger', 'tree'],
  },
  {
    file: sheet4,
    ids: ['umbrella', 'unicorn', 'violin', 'van', 'watermelon', 'whale', 'xylophone', 'yo-yo', 'yarn', 'zebra', 'zipper'],
  },
];

const scenes = [
  ['word-picnic', path.join(root, 'public', 'preschool', 'garden', 'orchard.webp'), 'Reviewed Google Flow garden scene orchard'],
  ['word-workshop', customWorkshop, 'Custom Google Flow workshop scene'],
  ['word-beach', path.join(root, 'public', 'preschool', 'garden', 's-sun.webp'), 'Reviewed Google Flow garden scene s-sun'],
  ['match-garden', path.join(root, 'public', 'preschool', 'garden', 'd-dog.webp'), 'Reviewed Google Flow garden scene d-dog'],
  ['match-riverside', path.join(root, 'public', 'preschool', 'garden', 'u-umbrella.webp'), 'Reviewed Google Flow garden scene u-umbrella'],
  ['match-snowy-village', path.join(root, 'public', 'preschool', 'garden', 'q-queen.webp'), 'Reviewed Google Flow garden scene q-queen'],
  ['pick-garden', path.join(root, 'public', 'preschool', 'garden', 'k-kite.webp'), 'Reviewed Google Flow garden scene k-kite'],
  ['pick-forest', path.join(root, 'public', 'preschool', 'garden', 'm-monkey.webp'), 'Reviewed Google Flow garden scene m-monkey'],
  ['pick-seaside', path.join(root, 'public', 'preschool', 'garden', 'f-fish.webp'), 'Reviewed Google Flow garden scene f-fish'],
];

await Promise.all([objectDir, sceneDir, qaDir].map((directory) => fs.mkdir(directory, { recursive: true })));

const objectReport = [];
for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex += 1) {
  const sheet = sheets[sheetIndex];
  const meta = await sharp(sheet.file).metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot read sprite sheet ${sheet.file}`);
  const cellWidth = Math.floor(meta.width / 4);
  const cellHeight = Math.floor(meta.height / 4);
  const inset = Math.max(14, Math.round(Math.min(cellWidth, cellHeight) * 0.05));

  for (let cellIndex = 0; cellIndex < sheet.ids.length; cellIndex += 1) {
    const id = sheet.ids[cellIndex];
    const row = Math.floor(cellIndex / 4);
    const col = cellIndex % 4;
    const output = path.join(objectDir, `${id}.webp`);
    const cell = await sharp(sheet.file)
      .extract({
        left: col * cellWidth + inset,
        top: row * cellHeight + inset,
        width: cellWidth - inset * 2,
        height: cellHeight - inset * 2,
      })
      .png()
      .toBuffer();
    await sharp(cell)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
      .resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 75, alphaQuality: 88, effort: 6 })
      .toFile(output);
    if (id === 'leaf') {
      const originalLeaf = await fs.readFile(output);
      const cleanedLeaf = await sharp(originalLeaf).extract({ left: 0, top: 12, width: 240, height: 228 }).png().toBuffer();
      const cleanedLeafWebp = await sharp(cleanedLeaf)
        .extend({ top: 12, bottom: 0, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 75, alphaQuality: 88, effort: 6 })
        .toBuffer();
      await fs.writeFile(output, cleanedLeafWebp);
    }
    const stat = await fs.stat(output);
    objectReport.push({ id, file: path.relative(root, output).replaceAll('\\', '/'), bytes: stat.size, sourceSheet: sheetIndex + 1 });
  }
}

const sceneReport = [];
for (const [id, source, sourceNote] of scenes) {
  const output = path.join(sceneDir, `${id}.webp`);
  await sharp(source)
    .resize(1376, 768, { fit: 'cover', position: 'centre' })
    .webp({ quality: 72, effort: 6 })
    .toFile(output);
  const stat = await fs.stat(output);
  sceneReport.push({ id, file: path.relative(root, output).replaceAll('\\', '/'), bytes: stat.size, source: sourceNote });
}

await sharp(foxMascot)
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 3 })
  .resize(620, 620, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 86, alphaQuality: 94, effort: 6 })
  .toFile(mascotOutput);
const mascotStat = await fs.stat(mascotOutput);

const svgLabel = (text, width) => Buffer.from(`<svg width="${width}" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#173f35"/><text x="12" y="22" fill="white" font-size="15" font-family="Arial, sans-serif">${text}</text></svg>`);

const objectTiles = await Promise.all(objectReport.map(async ({ id, file }) => {
  const art = await sharp(path.join(root, file)).resize(144, 144, { fit: 'contain' }).png().toBuffer();
  return sharp({ create: { width: 160, height: 192, channels: 4, background: '#fff8e8' } })
    .composite([
      { input: art, left: 8, top: 8 },
      { input: svgLabel(id, 160), left: 0, top: 160 },
    ])
    .png()
    .toBuffer();
}));

const objectColumns = 8;
const objectRows = Math.ceil(objectTiles.length / objectColumns);
await sharp({ create: { width: objectColumns * 160, height: objectRows * 192, channels: 4, background: '#dcead8' } })
  .composite(objectTiles.map((input, index) => ({ input, left: (index % objectColumns) * 160, top: Math.floor(index / objectColumns) * 192 })))
  .webp({ quality: 88 })
  .toFile(path.join(qaDir, 'objects-contact-sheet.webp'));

const sceneTiles = await Promise.all(sceneReport.map(async ({ id, file }) => {
  const art = await sharp(path.join(root, file)).resize(448, 250, { fit: 'cover' }).png().toBuffer();
  return sharp({ create: { width: 448, height: 282, channels: 4, background: '#fff8e8' } })
    .composite([{ input: art, left: 0, top: 0 }, { input: svgLabel(id, 448), left: 0, top: 250 }])
    .png()
    .toBuffer();
}));

await sharp({ create: { width: 3 * 448, height: 3 * 282, channels: 4, background: '#dcead8' } })
  .composite(sceneTiles.map((input, index) => ({ input, left: (index % 3) * 448, top: Math.floor(index / 3) * 282 })))
  .webp({ quality: 86 })
  .toFile(path.join(qaDir, 'scenes-contact-sheet.webp'));

const report = {
  generatedAt: new Date().toISOString(),
  generator: 'Google Flow backgrounds plus ImageGen object sprite sheets',
  objects: objectReport,
  scenes: sceneReport,
  mascot: { file: path.relative(root, mascotOutput).replaceAll('\\', '/'), bytes: mascotStat.size, source: 'ImageGen transparent fox guide' },
  totals: {
    objects: objectReport.length,
    scenes: sceneReport.length,
    bytes: [...objectReport, ...sceneReport].reduce((total, item) => total + item.bytes, mascotStat.size),
  },
};

await fs.writeFile(path.join(qaDir, 'asset-report.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(sceneDir, 'manifest.json'), `${JSON.stringify(sceneReport, null, 2)}\n`);
console.log(`Prepared ${objectReport.length} objects and ${sceneReport.length} scenes (${report.totals.bytes} bytes).`);
