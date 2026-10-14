// Bảng duyệt mảnh (cổng mảnh, mục 4.2 bước 10): node scripts/bricks/sheets.mjs [nhóm...]
// Mỗi mảnh 2 ô: nhìn từ trên (có điểm nối + hộp va chạm) và nhìn từ dưới. Xanh lá = núm, cam = lỗ nhận, tím = chốt, xanh ngọc = lỗ chốt, xanh dương = hộp va chạm.
import fs from 'node:fs';
import sharp from 'sharp';
import { loadCatalog, renderPart } from './raster.mjs';

const TILE = 180, COLS = 6, LABEL = 34;
const lib = loadCatalog();
const want = process.argv.slice(2);
const COLORS = { brick: '#C91A09', plate: '#1E5AA8', tile: '#F4F4F4', slope: '#D67923', curve: '#58AB41', round: '#FAC80A', arch: '#D7BA8C', window: '#F4F4F4', vehicle: '#646464', nature: '#00852B', side: '#68C3E2', decor: '#969696' };
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
fs.mkdirSync('docs/brick-studio/sheets', { recursive: true });
for (const g of lib.catalog.groups) {
  if (want.length && !want.includes(g.id)) continue;
  const keys = g.parts, cell = TILE * 2, rowsN = Math.ceil(keys.length / COLS);
  const W = COLS * cell, H = rowsN * (TILE + LABEL) + 50;
  const comps = [];
  keys.forEach((k, i) => {
    const x = (i % COLS) * cell, y = 50 + Math.floor(i / COLS) * (TILE + LABEL);
    for (const [j, pitch] of [[0, 28], [1, -32]]) {
      const img = renderPart(lib, k, { size: TILE, pitch, yaw: j ? 215 : 35, mainHex: COLORS[g.id], overlay: j === 0 });
      comps.push({ input: img.data, raw: { width: img.width, height: img.height, channels: 3 }, left: x + j * TILE, top: y, _scale: true });
    }
    const p = lib.catalog.parts[k];
    comps.push({ input: Buffer.from(`<svg width="${cell}" height="${LABEL}"><text x="6" y="14" font-family="Segoe UI, Arial" font-size="13" font-weight="700">${esc(p.name)}</text><text x="6" y="29" font-family="Segoe UI, Arial" font-size="11" fill="#555">${esc(k)} · ${p.faces}▲ · ${p.conns.length} nối · ${p.boxes.length} hộp${p.lite ? ' · lite' : ''}${p.kit ? ' · bộ' : ''}</text></svg>`), left: x, top: y + TILE });
  });
  // renderPart trả ảnh 2× → thu về TILE trước khi ghép
  const inputs = await Promise.all(comps.map(async c => c._scale ? { input: await sharp(c.input, { raw: c.raw }).resize(TILE, TILE).png().toBuffer(), left: c.left, top: c.top } : c));
  inputs.unshift({ input: Buffer.from(`<svg width="${W}" height="50"><text x="12" y="34" font-family="Segoe UI, Arial" font-size="24" font-weight="700">${esc(g.nameVi)} — ${keys.length} mảnh</text></svg>`), left: 0, top: 0 });
  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } }).composite(inputs).webp({ quality: 82 }).toFile(`docs/brick-studio/sheets/${g.id}.webp`);
  console.log(g.id, keys.length);
}
