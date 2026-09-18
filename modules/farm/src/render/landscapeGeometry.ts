import * as T from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { heightAt, isWater, valleyLandAt, valleyShelfHeight, random, type World } from '../core/world';
import { LANDCOVER, landcoverAt } from '../core/landcover';

type Point = { x: number; z: number; y: number; field: number };
type MeshData = { positions: number[]; colors: number[] };
const mix = (a: Point, b: Point): Point => {
    const t = a.field / (a.field - b.field);
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, y: a.y + (b.y - a.y) * t, field: 0 };
};
function clip(points: Point[], dry: boolean): Point[] {
    const out: Point[] = [];
    for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        const insideA = dry ? a.field >= 0 : a.field <= 0, insideB = dry ? b.field >= 0 : b.field <= 0;
        if (insideA) out.push(a);
        if (insideA !== insideB) out.push(mix(a, b));
    }
    return out;
}
function geometry(data: MeshData) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(data.positions, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(data.colors, 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
}

/** Shared shoreline intersections for ground, banks and water: no gaps between independently rounded tiles. */
export function createLandscapeGeometry(world: World) {
    const land: MeshData = { positions: [], colors: [] }, water: MeshData = { positions: [], colors: [] }, banks: MeshData = { positions: [], colors: [] };
    const sand = new T.Color('#cfbd8c'), rock = new T.Color('#ac9b7b');
    const deep = new T.Color('#59a8a3'), shallow = new T.Color('#a5cbb2');
    const groundColors = new Map<string, T.Color>();
    const groundColor = (p: Point) => {
        const key = `${p.x},${p.z}`;
        if (!groundColors.has(key)) groundColors.set(key, new T.Color(LANDCOVER[landcoverAt(world, p.x, p.z)]));
        return groundColors.get(key)!;
    };
    const rng = random(world.seed); rng(); rng(); const phase = rng() * Math.PI * 2;
    const shore = new Map<string, { x: number; z: number; neighbors: Set<string> }>();
    const keyOf = (p: { x: number; z: number }) => `${p.x},${p.z}`;
    const append = (data: MeshData, points: Point[], colorAt: (p: Point) => T.Color, surface?: number) => {
        for (let j = 1; j + 1 < points.length; j++) for (const p of [points[0], points[j], points[j + 1]]) {
            data.positions.push(p.x, surface ?? p.y, p.z);
            const c = colorAt(p); data.colors.push(c.r, c.g, c.b);
        }
    };
    const sample = (gx: number, gz: number): Point => {
        const tx = Math.max(0, Math.min(95, gx - 1)), tz = Math.max(0, Math.min(95, gz - 1));
        const outside = gx < 1 || gx > 96 || gz < 1 || gz > 96;
        const riverX = world.bridges[0].x + 1 + Math.round(Math.sin((gz - 1) * .065 + phase) * 4);
        const land = outside ? valleyLandAt(gx - 1, gz - 1, world.seed) && !(gx - 1 >= riverX && gx - 1 < riverX + 3) : !isWater(world, tx, tz);
        return { x: gx - .5, z: gz - .5, y: outside ? land && world.version === 2 ? valleyShelfHeight(gx - 1, gz - 1, phase) : 0 : heightAt(world, tx, tz), field: land ? 1 : -1 };
    };
    let shoreSegments = 0;
    // A non-buildable natural margin surrounds the logical grid, rather than exposing a square board edge.
    for (let z = -22; z < 118; z++) for (let x = -22; x < 118; x++) {
        const a = sample(x, z), b = sample(x, z + 1), c = sample(x + 1, z + 1), d = sample(x + 1, z);
        for (const tri of [[a, b, c], [a, c, d]]) {
            const steep = Math.max(...tri.map(p => p.y)) - Math.min(...tri.map(p => p.y)) > .5;
            const dry = clip(tri, true), wet = clip(tri, false);
            append(land, dry, p => {
                const variation = 1 + Math.sin(p.x * .28 + Math.cos(p.z * .2)) * .028 + Math.sin(p.z * .4) * .018;
                const base = steep ? rock.clone() : groundColor(p).clone();
                return base.multiplyScalar(variation);
            });
            append(water, wet, p => deep.clone().lerp(shallow, 1 + p.field), -.3);
            const edge = dry.filter(p => p.field === 0);
            if (edge.length === 2) {
                shoreSegments++;
                const [p, q] = edge;
                append(banks, [p, q, { ...q, y: -.38 }, { ...p, y: -.38 }], v => sand.clone().multiplyScalar(v.y < -.1 ? .71 : .94));
                for (const [a, b] of [[p, q], [q, p]]) {
                    const key = keyOf(a), node = shore.get(key) ?? { x: a.x, z: a.z, neighbors: new Set<string>() };
                    node.neighbors.add(keyOf(b)); shore.set(key, node);
                }
            }
        }
    }
    // Smooth the common contour, not each tile separately. Every layer uses the same final positions.
    let smooth = new Map([...shore].map(([key, p]) => [key, { x: p.x, z: p.z }]));
    for (let pass = 0; pass < 5; pass++) {
        const next = new Map(smooth);
        for (const [key, node] of shore) if (node.neighbors.size === 2) {
            const [a, b] = [...node.neighbors].map(k => smooth.get(k)!); const p = smooth.get(key)!;
            next.set(key, { x: p.x * .5 + (a.x + b.x) * .25, z: p.z * .5 + (a.z + b.z) * .25 });
        }
        smooth = next;
    }
    for (const data of [land, water, banks]) for (let i = 0; i < data.positions.length; i += 3) {
        const p = smooth.get(`${data.positions[i]},${data.positions[i + 2]}`);
        if (p) {
            data.positions[i] = p.x; data.positions[i + 2] = p.z;
            // Bevel only low shore intersections; logical tile centres and cliff heights stay put.
            if (data !== water && data.positions[i + 1] >= 0 && data.positions[i + 1] < .5) data.positions[i + 1] -= .3;
        }
    }
    // Round the horizontal rim of the plateau while retaining its flat, buildable height.
    // Displacement stays below half a tile; the slope/ramp and shoreline keep their own contours.
    if (world.version === 2) {
        const rim = new Map<string, { x: number; z: number; y: number }>();
        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
        for (let z = 1; z < 96; z++) for (let x = 1; x < 96; x++) {
            const p = sample(x, z);
            if (p.field < 0 || p.y !== 0 && p.y !== 2.5) continue;
            const around = neighbors.map(([dx, dz]) => sample(x + dx, z + dz));
            if (around.some(q => q.field < 0 || q.y > 0 && q.y < 2.5)) continue;
            if (around.some(q => Math.abs(q.y - p.y) > 1)) rim.set(keyOf(p), { x: p.x, z: p.z, y: p.y });
        }
        let rounded = new Map(rim);
        for (let pass = 0; pass < 4; pass++) {
            const next = new Map(rounded);
            for (const [key, p] of rim) {
                const adjacent = neighbors.map(([dx, dz]) => rounded.get(`${p.x + dx},${p.z + dz}`)).filter(q => q?.y === p.y) as { x: number; z: number; y: number }[];
                if (adjacent.length < 2) continue;
                const before = rounded.get(key)!;
                const x = before.x * .5 + adjacent.reduce((n, q) => n + q.x, 0) / adjacent.length * .5;
                const z = before.z * .5 + adjacent.reduce((n, q) => n + q.z, 0) / adjacent.length * .5;
                next.set(key, { x: Math.max(p.x - .4, Math.min(p.x + .4, x)), z: Math.max(p.z - .4, Math.min(p.z + .4, z)), y: p.y });
            }
            rounded = next;
        }
        for (let i = 0; i < land.positions.length; i += 3) {
            const p = rounded.get(`${land.positions[i]},${land.positions[i + 2]}`);
            if (p && land.positions[i + 1] === p.y) { land.positions[i] = p.x; land.positions[i + 2] = p.z; }
        }
    }
    // Distance to the final shared contour, not to binary wet/dry tile corners.
    // Spatial buckets keep this local even on the full 140 × 140 visual margin.
    type Segment = { ax: number; az: number; bx: number; bz: number };
    const buckets = new Map<string, Segment[]>(), bucketSize = 4;
    for (const [key, node] of shore) for (const neighbor of node.neighbors) {
        if (key >= neighbor) continue;
        const a = smooth.get(key)!, b = smooth.get(neighbor)!;
        const segment = { ax: a.x, az: a.z, bx: b.x, bz: b.z };
        for (let z = Math.floor(Math.min(a.z, b.z) / bucketSize); z <= Math.floor(Math.max(a.z, b.z) / bucketSize); z++)
            for (let x = Math.floor(Math.min(a.x, b.x) / bucketSize); x <= Math.floor(Math.max(a.x, b.x) / bucketSize); x++) {
                const key = `${x},${z}`, list = buckets.get(key) ?? []; list.push(segment); buckets.set(key, list);
            }
    }
    const distances = new Map<string, number>();
    const addDistance = (data: MeshData) => {
        const result = geometry(data), values: number[] = [];
        for (let i = 0; i < data.positions.length; i += 3) {
            const x = data.positions[i], z = data.positions[i + 2], key = `${x},${z}`;
            let distance = distances.get(key);
            if (distance === undefined) {
                let squared = 16;
                const bx = Math.floor(x / bucketSize), bz = Math.floor(z / bucketSize);
                for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const e of buckets.get(`${bx + dx},${bz + dz}`) ?? []) {
                    const vx = e.bx - e.ax, vz = e.bz - e.az, length = vx * vx + vz * vz;
                    const t = length > 0 ? T.MathUtils.clamp(((x - e.ax) * vx + (z - e.az) * vz) / length, 0, 1) : 0;
                    squared = Math.min(squared, (x - e.ax - t * vx) ** 2 + (z - e.az - t * vz) ** 2);
                }
                distance = Math.sqrt(squared); distances.set(key, distance);
            }
            values.push(distance);
        }
        result.setAttribute('shoreDistance', new T.Float32BufferAttribute(values, 1));
        // Share normals across the sand bevel, avoiding a row of lit triangular facets.
        result.deleteAttribute('normal');
        const shared = mergeVertices(result, 1e-5); result.dispose();
        shared.computeVertexNormals(); shared.computeBoundingSphere();
        return shared;
    };
    return { land: addDistance(land), water: addDistance(water), banks: geometry(banks), shoreSegments };
}
