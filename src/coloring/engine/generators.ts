import type { Page, Region, Tier } from '../model';
import { random } from './core';
export type GeneratorKind = 'mandala' | 'glass' | 'tiles' | 'pixel' | 'symmetry';
export const GENERATORS: Record<GeneratorKind, string> = { mandala: 'Mandala', glass: 'Kính màu', tiles: 'Gạch hoa', pixel: 'Tranh điểm ảnh', symmetry: 'Tô đối xứng' };
type Point = [
    number,
    number
];
const fmt = (n: number) => Math.round(n * 1000) / 1000;
const poly = (p: Point[]) => 'M' + p.map(v => v.map(fmt).join(' ')).join('L') + 'Z';
const bounds = (p: Point[]) => [Math.min(...p.map(v => v[0])), Math.min(...p.map(v => v[1])), Math.max(...p.map(v => v[0])), Math.max(...p.map(v => v[1]))];
// Clip a convex polygon to the half-plane closer to one Voronoi site.
function halfPlane(p: Point[], nx: number, ny: number, c: number) { const out: Point[] = []; for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], da = a[0] * nx + a[1] * ny - c, db = b[0] * nx + b[1] * ny - c;
    if (da <= 0)
        out.push(a);
    if ((da < 0) !== (db < 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
} return out; }
export function generate(kind: GeneratorKind, seed: number, tier: Tier): Page {
    const rnd = random(seed), size = 1024, regions: Region[] = [], level = tier === 'easy' ? 0 : tier === 'medium' ? 1 : 2;
    const add = (d: string, anchor: number[], bbox: number[], area: number, inr = 20, color = Math.floor(rnd() * 8)) => { const id = regions.length + 1; regions.push({ id, d, anchor, bbox, area, inr, bg: false, color, name: `Ô ${id}` }); };
    if (kind === 'mandala') {
        const sectors = [6, 10, 16][level] + 2 * Math.floor(rnd() * 3), rings = [2, 3, 5][level], offset = rnd() * Math.PI;
        const radii = [0, ...Array.from({ length: rings - 1 }, (_, i) => (i + 1 + .25 * (rnd() - .5)) * 460 / rings), 460];
        for (let ring = 0; ring < rings; ring++)
            for (let s = 0; s < sectors; s++) {
                const a = s * 2 * Math.PI / sectors + offset, b = (s + 1) * 2 * Math.PI / sectors + offset, inner = radii[ring], outer = radii[ring + 1], pt = (r: number, t: number): Point => [fmt(512 + r * Math.cos(t)), fmt(512 + r * Math.sin(t))];
                const p = pt(inner, a), q = pt(outer, a), r = pt(outer, b), t = pt(inner, b), c = pt((inner + outer) / 2, (a + b) / 2), samples = [p, q, r, t, ...Array.from({ length: 9 }, (_, i) => pt(outer, a + (b - a) * i / 8))];
                add(`M${p}L${q}A${fmt(outer)} ${fmt(outer)} 0 0 1 ${r}L${t}${inner ? `A${fmt(inner)} ${fmt(inner)} 0 0 0 ${p}` : ''}Z`, c, bounds(samples), Math.PI * (outer ** 2 - inner ** 2) / sectors, Math.min((outer - inner) / 2, (inner + outer) / 2 * Math.sin(Math.PI / sectors)) * .85);
            }
    }
    else if (kind === 'glass') {
        const n = [3, 5, 8][level], step = 920 / n, sites: Point[] = [];
        for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++)
                sites.push([52 + (x + .2 + .6 * rnd()) * step, 52 + (y + .2 + .6 * rnd()) * step]);
        for (const a of sites) {
            let p: Point[] = [[52, 52], [972, 52], [972, 972], [52, 972]];
            for (const b of sites)
                if (a !== b)
                    p = halfPlane(p, b[0] - a[0], b[1] - a[1], (b[0] ** 2 + b[1] ** 2 - a[0] ** 2 - a[1] ** 2) / 2);
            let area = 0, dist = Infinity;
            for (let i = 0; i < p.length; i++) {
                const u = p[i], v = p[(i + 1) % p.length];
                area += u[0] * v[1] - u[1] * v[0];
                dist = Math.min(dist, Math.abs((v[0] - u[0]) * (u[1] - a[1]) - (u[0] - a[0]) * (v[1] - u[1])) / Math.hypot(v[0] - u[0], v[1] - u[1]));
            }
            add(poly(p), a, bounds(p), Math.abs(area) / 2, dist);
        }
    }
    else {
        const n = kind === 'pixel' ? [16, 24, 32][level] : kind === 'symmetry' ? [4, 8, 12][level] : [3, 5, 7][level], step = 920 / n, variant = Math.floor(rnd() * 3), phase = rnd() * Math.PI;
        for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++) {
                const a = 52 + x * step, b = 52 + y * step, rect = `M${fmt(a)} ${fmt(b)}h${fmt(step)}v${fmt(step)}h-${fmt(step)}Z`, cx = a + step / 2, cy = b + step / 2;
                if (kind === 'tiles') {
                    const radius = step * (.24 + rnd() * .12), circle = `M${fmt(cx - radius)} ${fmt(cy)}a${fmt(radius)} ${fmt(radius)} 0 1 0 ${fmt(2 * radius)} 0a${fmt(radius)} ${fmt(radius)} 0 1 0 -${fmt(2 * radius)} 0Z`;
                    add(rect + circle, [a + step * .12, b + step * .12], [a, b, a + step, b + step], step ** 2 - Math.PI * radius ** 2, step * .1);
                    add(circle, [cx, cy], [cx - radius, cy - radius, cx + radius, cy + radius], Math.PI * radius ** 2, radius);
                }
                else {
                    const xx = (x + .5 - n / 2) / (n * .36), yy = (y + .5 - n / 2) / (n * .36), heart = (xx * xx + yy * yy - 1) ** 3 - xx * xx * (-yy) ** 3 < 0, flower = Math.hypot(xx, yy) < .7 + .22 * Math.cos(6 * Math.atan2(yy, xx) + phase), diamond = Math.abs(xx) + Math.abs(yy) < 1.1;
                    const chosen = variant === 0 ? heart : variant === 1 ? flower : diamond, col = kind === 'pixel' ? (chosen ? variant + 1 : 5) : kind === 'symmetry' ? (Math.min(x, n - 1 - x) + y + seed) % 8 : Math.floor(rnd() * 8);
                    add(rect, [cx, cy], [a, b, a + step, b + step], step ** 2, step / 2, col);
                }
            }
    }
    return { id: `gen-${kind}-${tier}-${seed >>> 0}`, title: GENERATORS[kind], book: 'generated', tier, scene: 'garden', count: regions.length, version: 1, rev: '2', size, regions, ink: '', symmetry: kind === 'symmetry' };
}
// Draw each region as its own binary mask: no RGB ID interpolation at antialiased edges.
export async function mapFromPage(page: Page) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = page.size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!, labels = new Uint16Array(page.size ** 2);
    try {
        for (const r of page.regions) {
            const x = Math.max(0, Math.floor(r.bbox[0]) - 1), y = Math.max(0, Math.floor(r.bbox[1]) - 1), w = Math.min(page.size - x, Math.ceil(r.bbox[2]) - x + 2), h = Math.min(page.size - y, Math.ceil(r.bbox[3]) - y + 2);
            ctx.clearRect(x, y, w, h);
            ctx.fillStyle = 'white';
            ctx.fill(new Path2D(r.d), 'evenodd');
            const pixels = ctx.getImageData(x, y, w, h).data;
            for (let j = 0; j < h; j++)
                for (let i = 0; i < w; i++)
                    if (pixels[(j * w + i) * 4 + 3] >= 128)
                        labels[(y + j) * page.size + x + i] = r.id;
        }
    }
    finally {
        canvas.width = canvas.height = 0;
    }
    return labels;
}
