import type { Op, Page, Region } from '../model';
export function random(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
export function regionAt(labels: Uint16Array, size: number, x: number, y: number) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= size || y >= size)
    return 0; const id = labels[y * size + x]; if (id)
    return id; let best = 0, distance = Infinity; for (let dy = -12; dy <= 12; dy++)
    for (let dx = -12; dx <= 12; dx++) {
        const xx = x + dx, yy = y + dy, dist = dx * dx + dy * dy;
        if (dist <= 144 && dist < distance && xx >= 0 && xx < size && yy >= 0 && yy < size && labels[yy * size + xx]) {
            best = labels[yy * size + xx];
            distance = dist;
        }
    } return best; }
export function effectiveOps(ops: Op[], id: number) { const list = ops.filter(o => o.r === id); let start = 0; for (let i = list.length - 1; i >= 0; i--)
    if (list[i].kind === 'fill') {
        start = i;
        break;
    } return list.slice(start); }
export function latestColor(ops: Op[], id: number) { const op = ops.findLast(o => o.r === id); return op?.kind === 'fill' ? op.color : undefined; }
export function mathLabel(answer: number, grade: number, seed: number) { const rnd = random(seed); if (grade <= 1) {
    const a = Math.floor(rnd() * (answer + 1));
    return `${a} + ${answer - a}`;
} if (grade === 2) {
    const a = answer + 1 + Math.floor(rnd() * (20 - answer));
    return `${a} − ${a - answer}`;
} if (grade >= 5) {
    const whole = 1 + Math.floor(rnd() * 9), fraction = (1 + Math.floor(rnd() * 9)) / 10;
    return `${(answer + whole + fraction).toFixed(1)} − ${(whole + fraction).toFixed(1)}`;
} const m = grade === 4 ? 10 + Math.floor(rnd() * 40) : 2 + Math.floor(rnd() * 8); if (grade === 4 || grade >= 3 && seed % 2)
    return `${answer * m} ÷ ${m}`; const a = answer + Math.floor(rnd() * 30); return `${a} − ${a - answer}`; }
function segmentDistance(x: number, y: number, a: number, b: number, c: number, d: number) { const dx = c - a, dy = d - b, t = Math.max(0, Math.min(1, ((x - a) * dx + (y - b) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - a - t * dx, y - b - t * dy); }
// Deterministic stratified coverage, clipped against the actual label map. Tiny regions use an interior anchor.
export function coverage(page: Page, ops: Op[], labels: Uint16Array) {
    const counts = new Map<number, number>();
    for (const r of page.regions) {
        const list = effectiveOps(ops, r.id);
        if (!list.length) {
            counts.set(r.id, 0);
            continue;
        }
        const points: number[][] = [r.anchor];
        const [x0, y0, x1, y1] = r.bbox, step = Math.max(1, Math.ceil(Math.max(x1 - x0, y1 - y0) / 12));
        for (let y = y0; y <= y1; y += step)
            for (let x = x0; x <= x1; x += step)
                if (labels[Math.floor(y) * page.size + Math.floor(x)] === r.id)
                    points.push([x, y]);
        let filled = 0;
        for (const [x, y] of points) {
            let painted = false;
            for (const op of list) {
                if (op.kind === 'fill') {
                    painted = true;
                    continue;
                }
                for (let i = 0; i < op.pts.length; i += 2) {
                    const j = Math.max(0, i - 2);
                    if (segmentDistance(x, y, op.pts[j], op.pts[j + 1], op.pts[i], op.pts[i + 1]) <= op.size / 2) {
                        painted = op.brush !== 'erase';
                        break;
                    }
                }
            }
            if (painted)
                filled++;
        }
        counts.set(r.id, filled / points.length);
    }
    return counts;
}
export function completion(page: Page, covered: Map<number, number>) { const rs = page.regions.filter(r => !r.bg && !r.decor); return rs.length ? rs.filter(r => (covered.get(r.id) || 0) >= .95).length / rs.length : 0; }
export function targetColor(r: Region) { return r.color % 8; }
export function dayIndex(now = new Date()) { return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000); }
