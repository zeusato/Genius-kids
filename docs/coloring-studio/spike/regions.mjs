// Spike: tách vùng tô từ nét vẽ — đo thời gian, số vùng, dung lượng mã hoá.
// node regions.mjs <svg|png> <size> <gapPx>
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import zlib from 'node:zlib';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const sharp = require('sharp');

const [file, sizeArg = '2048', gapArg = '6'] = process.argv.slice(2);
const S = +sizeArg, GAP = +gapArg, N = S * S;
const t = {}; let t0 = performance.now();
const lap = k => { const n = performance.now(); t[k] = +(n - t0).toFixed(1); t0 = n; };

const luma = await sharp(readFileSync(file), { density: 72 * S / 1024 }).resize(S, S, { fit: 'contain', background: '#fff' })
    .flatten({ background: '#fff' }).greyscale().raw().toBuffer();
lap('rasterize(sharp)');
t0 = performance.now();

// 1. mặt nạ nét
const line = new Uint8Array(N);
for (let i = 0; i < N; i++) line[i] = luma[i] < 160 ? 1 : 0;
// 2. biến đổi khoảng cách chamfer 3-4 tới nét gần nhất (đơn vị: px*3)
function chamfer(mask) {
    const d = new Uint16Array(N), INF = 65000;
    for (let i = 0; i < N; i++) d[i] = mask[i] ? 0 : INF;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const i = y * S + x; let v = d[i]; if (!v) continue;
        if (x > 0) v = Math.min(v, d[i - 1] + 3);
        if (y > 0) { v = Math.min(v, d[i - S] + 3); if (x > 0) v = Math.min(v, d[i - S - 1] + 4); if (x < S - 1) v = Math.min(v, d[i - S + 1] + 4); }
        d[i] = v;
    }
    for (let y = S - 1; y >= 0; y--) for (let x = S - 1; x >= 0; x--) {
        const i = y * S + x; let v = d[i]; if (!v) continue;
        if (x < S - 1) v = Math.min(v, d[i + 1] + 3);
        if (y < S - 1) { v = Math.min(v, d[i + S] + 3); if (x < S - 1) v = Math.min(v, d[i + S + 1] + 4); if (x > 0) v = Math.min(v, d[i + S - 1] + 4); }
        d[i] = v;
    }
    return d;
}
const dist = chamfer(line);
lap('distance');
// 3. khép khe hở: nét "dày thêm" GAP/2 px chỉ để chia vùng
const R3 = Math.ceil(GAP / 2) * 3;
// 4. gán nhãn bằng loang theo dòng quét (4 lân cận)
const label = new Int32Array(N); let next = 0; const stack = new Int32Array(N);
const open = i => label[i] === 0 && dist[i] > R3;
const area = [0];
for (let s = 0; s < N; s++) {
    if (!open(s)) continue;
    const id = ++next; let sp = 0, a = 0; stack[sp++] = s;
    while (sp) {
        let i = stack[--sp]; if (!open(i)) continue;
        const y = (i / S) | 0, row = y * S; let l = i, r = i;
        while (l > row && open(l - 1)) l--;
        while (r < row + S - 1 && open(r + 1)) r++;
        for (let k = l; k <= r; k++) {
            label[k] = id; a++;
            if (y > 0 && open(k - S) && (k === l || !open(k - S - 1))) stack[sp++] = k - S;
            if (y < S - 1 && open(k + S) && (k === l || !open(k + S - 1))) stack[sp++] = k + S;
        }
    }
    area.push(a);
}
lap('label');
// 5. bỏ vùng vụn: diện tích < MIN px
const MIN = Math.round(0.00004 * N); const MININR = +(process.env.MININR||0)*3; const mx = new Uint16Array(next+1); for (let i=0;i<N;i++) if(label[i]&&dist[i]>mx[label[i]]) mx[label[i]]=dist[i];
let dropped = 0; const keep = new Int32Array(next + 1); let kept = 0;
for (let id = 1; id <= next; id++) if (area[id] >= MIN && mx[id] - R3 >= MININR) keep[id] = ++kept; else dropped++;
for (let i = 0; i < N; i++) label[i] = label[i] ? keep[label[i]] : 0;
lap('drop-specks');
// 6. lan nhãn ra phủ kín vùng nét (tô chui dưới nét, chạm vào nét = vùng gần nhất)
let q = new Int32Array(N), qh = 0, qt = 0;
for (let i = 0; i < N; i++) if (label[i]) q[qt++] = i;
while (qh < qt) {
    const i = q[qh++], v = label[i], x = i % S;
    if (x > 0 && !label[i - 1]) { label[i - 1] = v; q[qt++] = i - 1; }
    if (x < S - 1 && !label[i + 1]) { label[i + 1] = v; q[qt++] = i + 1; }
    if (i >= S && !label[i - S]) { label[i - S] = v; q[qt++] = i - S; }
    if (i < N - S && !label[i + S]) { label[i + S] = v; q[qt++] = i + S; }
}
lap('grow-under-lines');
// 7. thống kê: diện tích thật, bán kính nội tiếp (điểm đặt số), khung bao
const reg = Array.from({ length: kept + 1 }, () => ({ area: 0, inr: 0, px: 0, py: 0, x0: S, y0: S, x1: 0, y1: 0 }));
for (let i = 0; i < N; i++) {
    const r = reg[label[i]], x = i % S, y = (i / S) | 0;
    if (!line[i]) r.area++;
    if (dist[i] > r.inr) { r.inr = dist[i]; r.px = x; r.py = y; }
    if (x < r.x0) r.x0 = x; if (x > r.x1) r.x1 = x; if (y < r.y0) r.y0 = y; if (y > r.y1) r.y1 = y;
}
lap('stats');
// 8. mã hoá: RLE theo dòng + PNG 16-bit nhãn
let runs = 0; const rle = [];
for (let y = 0; y < S; y++) { let x = 0; while (x < S) { const v = label[y * S + x]; let e = x; while (e < S && label[y * S + e] === v) e++; rle.push(v, e - x); runs++; x = e; } }
const rleBin = Buffer.from(new Uint16Array(rle).buffer);
const rleGz = zlib.gzipSync(rleBin, { level: 9 }).length;
const rgb = Buffer.alloc(N * 3); for (let i = 0; i < N; i++) { rgb[i * 3] = label[i] >> 8; rgb[i * 3 + 1] = label[i] & 255; }
const png = await sharp(rgb, { raw: { width: S, height: S, channels: 3 } }).png({ compressionLevel: 9, palette: false }).toBuffer();
const lineAlpha = Buffer.alloc(N * 2); for (let i = 0; i < N; i++) { lineAlpha[i * 2] = 30; lineAlpha[i * 2 + 1] = 255 - luma[i]; }
const linePng = await sharp(lineAlpha, { raw: { width: S, height: S, channels: 2 } }).png({ compressionLevel: 9 }).toBuffer();
const lineWebp = await sharp(lineAlpha, { raw: { width: S, height: S, channels: 2 } }).webp({ lossless: true }).toBuffer();
t0 = performance.now();
// 9. đo tô: mỗi vùng tô 1 lần qua RLE vào bộ đệm RGBA
const paint = new Uint32Array(N);
const byRegion = Array.from({ length: kept + 1 }, () => []);
{ let p = 0; for (let k = 0; k < rle.length; k += 2) { byRegion[rle[k]].push(p, rle[k + 1]); p += rle[k + 1]; } }
lap('index-runs');
const t1 = performance.now();
let maxFill = 0;
for (let id = 1; id <= kept; id++) {
    const a = performance.now(), r = byRegion[id], c = 0xff000000 | (id * 2654435761 >>> 8);
    for (let k = 0; k < r.length; k += 2) paint.fill(c, r[k], r[k] + r[k + 1]);
    maxFill = Math.max(maxFill, performance.now() - a);
}
const fillAll = performance.now() - t1;
// ảnh xem trước: tô màu giả theo nhãn, nhân với nét
const out = Buffer.alloc(N * 3);
for (let i = 0; i < N; i++) { const c = paint[i], k = luma[i] / 255; out[i * 3] = (c & 255) * k; out[i * 3 + 1] = (c >> 8 & 255) * k; out[i * 3 + 2] = (c >> 16 & 255) * k; }
await sharp(out, { raw: { width: S, height: S, channels: 3 } }).resize(1024).png().toFile(file.replace(/\.\w+$/, `-regions-${S}.png`));

const sorted = reg.slice(1).map(r => r.area).sort((a, b) => a - b);
const inr = reg.slice(1).map(r => r.inr / 3).sort((a, b) => a - b);
console.log(JSON.stringify({
    size: S, gapPx: GAP, timings_ms: t, fillAll_ms: +fillAll.toFixed(1), fillMaxRegion_ms: +maxFill.toFixed(2),
    regions: kept, droppedSpecks: dropped, linePixelsPct: +(100 * line.reduce((a, b) => a + b, 0) / N).toFixed(2),
    area_px: { min: sorted[0], p10: sorted[Math.floor(sorted.length * .1)], median: sorted[sorted.length >> 1], max: sorted.at(-1) },
    inradius_px: { min: +inr[0].toFixed(1), p10: +inr[Math.floor(inr.length * .1)].toFixed(1), median: +inr[inr.length >> 1].toFixed(1) },
    bytes: { rleRuns: runs, rleRaw: rleBin.length, rleGzip: rleGz, labelPng: png.length, linePng: linePng.length, lineWebpLossless: lineWebp.length, svg: readFileSync(file).length },
}, null, 1));
