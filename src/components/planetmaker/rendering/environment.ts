import { GraphicsQuality, heightAt, Region, SIZE } from '../engine/region';
import { emptyInstances } from './architecture';
export const GRAPHICS = {
    light: { label: 'Nhẹ', dpr: 1, shadow: 0 },
    balanced: { label: 'Cân bằng', dpr: 1.5, shadow: 1024 },
    detailed: { label: 'Chi tiết', dpr: 2, shadow: 2048 },
} as const;

export function environmentInstances(r: Region, quality: GraphicsQuality) {
    const parts = emptyInstances();
    const box = (x: number, y: number, z: number, scale: [number, number, number], color: string) => parts.box.push({ position: [x - 32, y, z - 32], scale, color });
    for (const t of r.trees) {
        const y = heightAt(r, t.x, t.z), s = t.scale; if (y <= r.seaLevel) continue;
        box(t.x, y + s * .55, t.z, [.13 * s, 1.1 * s, .13 * s], '#87664c');
        const conifer = quality === 'light' || t.id % 3 === 0;
        const color = r.preset === 'ice' ? '#c5dbd2' : ['#4f8e6a', '#73a063', '#5b9275'][t.id % 3];
        const layers = quality === 'detailed' ? 3 : 1;
        for (let n = 0; n < layers; n++) {
            const scale = conifer ? s * (1 - n * .2) : s * (n ? .75 : 1.15);
            parts[conifer ? 'cone' : 'sphere'].push({ position: [t.x - 32 + (conifer || !n ? 0 : (n === 1 ? -.28 : .28) * s), y + s * (conifer ? 1 + n * .4 : 1.15 + n * .15), t.z - 32], scale: [scale, scale * (conifer ? 1.8 : 1.15), scale], color });
        }
    }
    r.roads.forEach((v, i) => {
        if (!v) return;
        const x = i % SIZE, z = Math.floor(i / SIZE), y = heightAt(r, x + .5, z + .5);
        box(x + .5, y + .035, z + .5, [.98, .06, .98], quality === 'light' ? '#969e9d' : '#64757b');
        if (quality === 'light' || y <= r.seaLevel) return;
        const north = z > 0 && r.roads[i - SIZE], south = z < SIZE - 1 && r.roads[i + SIZE], west = x > 0 && r.roads[i - 1], east = x < SIZE - 1 && r.roads[i + 1];
        if ((north || south) && !west && !east) box(x + .5, y + .073, z + .5, [.04, .015, .3], '#e1dcc2');
        if ((west || east) && !north && !south) box(x + .5, y + .073, z + .5, [.3, .015, .04], '#e1dcc2');
        if (quality === 'detailed') {
            if (!west) box(x + .05, y + .08, z + .5, [.07, .07, .96], '#b8c3bc');
            if (!east) box(x + .95, y + .08, z + .5, [.07, .07, .96], '#b8c3bc');
            if (!north) box(x + .5, y + .08, z + .05, [.96, .07, .07], '#b8c3bc');
            if (!south) box(x + .5, y + .08, z + .95, [.96, .07, .07], '#b8c3bc');
        }
    });
    return parts;
}
