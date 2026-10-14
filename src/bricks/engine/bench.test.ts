// Đo hiệu năng engine (plan mục 9). Chạy: BENCH=1 npx vitest run src/bricks/engine/bench.test.ts
import { it } from 'vitest';
import fs from 'node:fs';
import { World } from './world';
import { pick } from './pick';
import { suggest } from './place';
import type { Catalog, V3 } from './types';

it.skipIf(!process.env.BENCH)('đo: dựng 2.000 mảnh rồi chọn điểm + gợi ý', { timeout: 600000 }, () => {
  const catalog: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));
  const w = new World(catalog);
  let seed = 3;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const keys = ['3001', '3003', '3004', '3010', '3020', '3022', '3039', '3040b', '3062b', '6141', '3068b', '87087'];
  const t0 = performance.now();
  let tries = 0, suggestMs = 0, n = 0;
  while (w.pieces.size < 2000 && tries < 20000) {
    tries++;
    const x = (rnd() - 0.5) * 900, z = (rnd() - 0.5) * 900;
    const hit = pick(w, [x, -3000, z], [0, 1, 0]);
    if (!hit) continue;
    const s0 = performance.now();
    const s = suggest(w, keys[Math.floor(rnd() * keys.length)], [0, 1, 2, 3][Math.floor(rnd() * 4)] === 0 ? 0 : 12, hit);
    suggestMs += performance.now() - s0; n++;
    if (s.best?.ok) w.add(s.best.part, 'red', s.best.pos, s.best.o);
  }
  const build = performance.now() - t0;
  // chọn điểm + gợi ý trên mô hình đầy
  let pickMs = 0, sugMs = 0;
  for (let i = 0; i < 300; i++) {
    const o: V3 = [(rnd() - 0.5) * 1200, -800, (rnd() - 0.5) * 1200], d: V3 = [-o[0] / 1500, 1, -o[2] / 1500];
    const a = performance.now(); const hit = pick(w, o, d); pickMs += performance.now() - a;
    if (hit) { const b = performance.now(); suggest(w, '3001', 0, hit); sugMs += performance.now() - b; }
  }
  const f0 = performance.now(); const fl = w.floating(); const floatMs = performance.now() - f0;
  console.log(JSON.stringify({ pieces: w.pieces.size, tries, buildMs: Math.round(build), avgSuggestWhileBuilding: +(suggestMs / n).toFixed(2), pickAvgMs: +(pickMs / 300).toFixed(3), suggestAvgMs: +(sugMs / 300).toFixed(2), floatingMs: +floatMs.toFixed(1), floating: fl.size }));
});
