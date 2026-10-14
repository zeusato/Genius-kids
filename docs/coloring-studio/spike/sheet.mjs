// Bảng xem trước OpenMoji: nét (đã làm mảnh) | vùng tách được tô bằng màu gợi ý lấy từ bản màu.
// node sheet.mjs <thư mục openmoji-dl> <out.png>
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const sharp = require('sharp');
const [dir, outFile] = process.argv.slice(2);
const S = 640, N = S * S, STROKE = 1.5;

async function raster(svg, gray) {
    const img = sharp(Buffer.from(svg), { density: 72 * S / 72 }).resize(S, S).flatten({ background: '#fff' });
    return (gray ? img.greyscale() : img.removeAlpha()).raw().toBuffer();
}
function regions(luma) {
    const line = new Uint8Array(N); for (let i = 0; i < N; i++) line[i] = luma[i] < 160;
    const label = new Int32Array(N), stack = new Int32Array(N), area = [0]; let next = 0;
    const open = i => !label[i] && !line[i];
    for (let s = 0; s < N; s++) {
        if (!open(s)) continue; const id = ++next; let sp = 0, a = 0; stack[sp++] = s;
        while (sp) { const i = stack[--sp]; if (!open(i)) continue; label[i] = id; a++; const x = i % S;
            if (x > 0) stack[sp++] = i - 1; if (x < S - 1) stack[sp++] = i + 1; if (i >= S) stack[sp++] = i - S; if (i < N - S) stack[sp++] = i + S; }
        area.push(a);
    }
    const keep = new Int32Array(next + 1); let kept = 0;
    for (let id = 1; id <= next; id++) if (area[id] >= 40) keep[id] = ++kept;
    for (let i = 0; i < N; i++) label[i] = label[i] ? keep[label[i]] : 0;
    return { label, line, count: kept };
}
const files = readdirSync(path.join(dir, 'black')).filter(f => f.endsWith('.svg'));
const tiles = [], stats = [];
for (const f of files) {
    const thin = readFileSync(path.join(dir, 'black', f), 'utf8').replace(/stroke-width="2"/g, `stroke-width="${STROKE}"`);
    const luma = await raster(thin, true);
    const colorSvg = readFileSync(path.join(dir, 'color', f), 'utf8').replace(/<g id="line">[\s\S]*?<\/g>/, '');
    const ref = await raster(colorSvg, false);
    const { label, line, count } = regions(luma);
    // màu gợi ý = màu xuất hiện nhiều nhất trong vùng ở bản màu (bỏ trắng nền)
    const votes = Array.from({ length: count + 1 }, () => new Map());
    for (let i = 0; i < N; i++) if (label[i]) { const k = ref[i * 3] << 16 | ref[i * 3 + 1] << 8 | ref[i * 3 + 2]; const m = votes[label[i]]; m.set(k, (m.get(k) || 0) + 1); }
    const pick = votes.map(m => [...m].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0xffffff);
    const out = Buffer.alloc(N * 3);
    for (let i = 0; i < N; i++) { const c = label[i] ? pick[label[i]] : 0xffffff, k = luma[i] / 255;
        out[i * 3] = (c >> 16 & 255) * k; out[i * 3 + 1] = (c >> 8 & 255) * k; out[i * 3 + 2] = (c & 255) * k; }
    const lineTile = await sharp(Buffer.from(luma), { raw: { width: S, height: S, channels: 1 } }).resize(220).png().toBuffer();
    const colTile = await sharp(out, { raw: { width: S, height: S, channels: 3 } }).resize(220).png().toBuffer();
    tiles.push([lineTile, colTile]); stats.push(`${f.replace('.svg', '')}:${count}`);
}
const cols = 8, cw = 240, rh = 480, rows = Math.ceil(tiles.length / cols);
const comp = tiles.flatMap(([a, b], i) => { const x = (i % cols) * cw + 10, y = Math.floor(i / cols) * rh + 10; return [{ input: a, left: x, top: y }, { input: b, left: x, top: y + 230 }]; });
await sharp({ create: { width: cols * cw, height: rows * rh, channels: 3, background: '#fffaf0' } }).composite(comp).png().toFile(outFile);
console.log('vùng/hình:', stats.join(' '));
