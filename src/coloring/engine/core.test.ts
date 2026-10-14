import { describe, it, expect } from 'vitest';
import { segment, contours, encodeMap, decodeMap } from './geometry.mjs';
import { coverage, completion, regionAt, mathLabel, random } from './core';
import { generate, GENERATORS } from './generators';
import type { Page, Op, Tier } from '../model';
describe('region geometry', () => {
    it('retains a one-pixel dot and represents holes with closed contours', () => { const size = 9, g = new Uint8Array(size * size).fill(255); for (let y = 2; y <= 6; y++)
        for (let x = 2; x <= 6; x++)
            g[y * size + x] = 0; g[4 * size + 4] = 255; const { labels, regions } = segment(g, size), paths = contours(labels, size); expect(regions.map(r => r.area)).toEqual([56, 1]); expect(paths.get(1).match(/M/g)).toHaveLength(2); expect(paths.get(2)).toMatch(/Z$/); expect(decodeMap(encodeMap(labels, size))).toEqual(labels); });
    it('rejects incomplete, overflowing and zero-length runs', () => { const valid = encodeMap(new Uint16Array(16).fill(1), 4); expect(() => decodeMap(valid.slice(0, -1))).toThrow(); const bad = valid.slice(); bad[10] = 0; bad[11] = 0; expect(() => decodeMap(bad)).toThrow(); bad[10] = 17; expect(() => decodeMap(bad)).toThrow(); });
    it('snaps to the nearest region above, below, left and right without crossing page bounds', () => { for (const [dx, dy] of [[0, 3], [0, -3], [3, 0], [-3, 0]]) {
        const m = new Uint16Array(400);
        m[(10 + dy) * 20 + 10 + dx] = 7;
        expect(regionAt(m, 20, 10, 10)).toBe(7);
    } expect(regionAt(new Uint16Array(400).fill(1), 20, -1, 10)).toBe(0); });
    it('erasing reduces completion; crossing a region does not paint its neighbour', () => { const page = generate('symmetry', 1, 'easy'); const a = page.regions[0], b = page.regions[1], labels = new Uint16Array(1024 ** 2); for (const r of [a, b])
        for (let y = Math.ceil(r.bbox[1]); y < r.bbox[3]; y++)
            for (let x = Math.ceil(r.bbox[0]); x < r.bbox[2]; x++)
                labels[y * 1024 + x] = r.id; const p = { ...page, regions: [a, b] } as Page; const fill: Op = { kind: 'fill', r: 1, color: '#ff0000', style: 'solid', seed: 1 }; const erase: Op = { kind: 'stroke', r: 1, color: '#ff0000', brush: 'erase', size: 250, pts: [...a.anchor, ...b.anchor], seed: 2 }; expect(completion(p, coverage(p, [fill], labels))).toBe(.5); expect(coverage(p, [fill, erase], labels).get(1)).toBeLessThan(1); expect(coverage(p, [{ ...erase, brush: 'marker' }], labels).get(2)).toBe(0); });
});
describe('learning and procedural pages', () => {
    it('math prompts have the requested answer and grade-appropriate operations', () => { for (let grade = 0; grade <= 5; grade++)
        for (let seed = 0; seed < 100; seed++)
            for (let n = 1; n <= 8; n++) {
                const text = mathLabel(n, grade, seed), [a, sign, b] = text.split(' '), value = sign === '+' ? +a + (+b) : sign === '−' ? +a - (+b) : +a / (+b);
                expect(value).toBeCloseTo(n, 8);
                if (grade <= 1)
                    expect(sign).toBe('+');
                if (grade === 2)
                    expect(sign).toBe('−');
            } });
    it('1000 seeds: reproducible, closed finite regions, bounded anchors, mirrored targets', () => { for (let seed = 1; seed <= 1000; seed++) {
        const kind = Object.keys(GENERATORS)[seed % 5] as keyof typeof GENERATORS, tier = (['easy', 'medium', 'hard'] as Tier[])[seed % 3], p = generate(kind, seed, tier);
        expect(generate(kind, seed, tier)).toEqual(p);
        expect(p.regions.length).toBeGreaterThan(3);
        for (const r of p.regions) {
            expect(r.d.endsWith('Z')).toBe(true);
            expect(r.d).not.toMatch(/NaN|Infinity/);
            expect(r.area).toBeGreaterThan(0);
            expect(r.anchor.every(v => v >= 0 && v < 1024)).toBe(true);
            expect(r.inr).toBeGreaterThan(0);
        }
        if (p.symmetry) {
            const n = Math.sqrt(p.regions.length);
            for (let x = 0; x < n; x++)
                expect(p.regions[x].color).toBe(p.regions[n - 1 - x].color);
        }
    } }, 30000);
    it('seeded textures repeat exactly', () => { const a = random(42), b = random(42); for (let i = 0; i < 1000; i++)
        expect(a()).toBe(b()); });
});
