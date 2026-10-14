import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import sharp from 'sharp';
import { decodeMap } from '../engine/geometry.mjs';
import { svgDocument } from '../render/svg';
import { random } from '../engine/core';
import type { Page, Op } from '../model';
const root = new URL('../../../', import.meta.url), read = (file: string) => readFileSync(new URL('public/coloring/' + file, root));
const catalog = JSON.parse(read('catalog.json').toString());
it('ships at least 40 unique imagegen pages across 8 books with valid map/anchors', () => { expect(catalog.pages.length).toBeGreaterThanOrEqual(40); expect(catalog.books).toHaveLength(8); const hashes = new Set(); for (const info of catalog.pages) {
    const p: Page = JSON.parse(gunzipSync(read(info.id + '.page.bin')).toString()), labels = decodeMap(gunzipSync(read(info.id + '.bin')));
    hashes.add(p.rev);
    expect(p.size).toBe(2048);
    expect(labels.length).toBe(p.size * p.size);
    expect(p.regions.length).toBeGreaterThan(4);
    expect(p.regions.filter(r => r.listen && r.name && !r.name.startsWith('Vùng ')).length).toBeGreaterThanOrEqual(4);
    for (const r of p.regions) {
        expect(labels[Math.floor(r.anchor[1]) * p.size + Math.floor(r.anchor[0])]).toBe(r.id);
        expect(r.d.endsWith('Z')).toBe(true);
    }
} expect(hashes.size).toBe(catalog.pages.length); });
it('10000 randomized brush strokes stay inside the start region; replay pixels are deterministic', async () => {
    const rnd = random(8192);
    let leaks = 0, strokes = 0;
    for (const info of catalog.pages) {
        const p: Page = JSON.parse(gunzipSync(read(info.id + '.page.bin')).toString()), r = p.regions.filter(r => !r.bg && !r.decor).sort((a, b) => b.area - a.area)[0], ops: Op[] = [];
        for (let i = 0; i < 250; i++) {
            ops.push({ kind: 'stroke', r: r.id, color: '#f25763', brush: (['marker', 'crayon', 'watercolor', 'glitter', 'rainbow', 'erase'] as const)[i % 6], size: 15 + rnd() * 165, seed: i, pts: Array.from({ length: 8 }, () => Math.floor(rnd() * 3000 - 500)) });
            strokes++;
        }
        const raster = async (s: string) => sharp(Buffer.from(s)).resize(512, 512).ensureAlpha().raw().toBuffer();
        const svg = svgDocument(p, ops), [paint, base, mask] = await Promise.all([raster(svg), raster(svgDocument(p, [])), raster(`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048"><path d="${r.d}" fill="white" fill-rule="evenodd"/></svg>`)]);
        for (let i = 0; i < mask.length; i += 4)
            if (mask[i + 3] === 0 && (paint[i] !== base[i] || paint[i + 1] !== base[i + 1] || paint[i + 2] !== base[i + 2]))
                leaks++;
        if (info.id === 'fish')
            expect(await raster(svgDocument(p, ops))).toEqual(paint);
    }
    expect(strokes).toBeGreaterThanOrEqual(10000);
    expect(leaks).toBe(0);
}, 120000);
