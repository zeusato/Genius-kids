// Engine nặn địa hình hành tinh — THUẦN (không import three, test được không cần GL).
// Icosphere hàn đỉnh (indexed) + elevation per-vertex + màu tự động theo độ cao.
// Quy ước 3 tầng như GearsGame/DragonQuest: engine thuần / render / page.

export interface TerrainState {
    dirs: Float32Array;      // hướng đơn vị mỗi đỉnh (xyz liên tiếp)
    index: Uint32Array;      // tam giác
    count: number;           // số đỉnh
    elevation: Float32Array; // độ cao so với mặt cầu chuẩn (bán kính 1)
    paint: Uint8Array;       // 0 = màu tự động, 1 = đá núi lửa, 2 = dung nham
    trees: number[];         // chỉ số đỉnh có cây
}

export type BrushTool = 'raise' | 'lower' | 'smooth' | 'forest' | 'volcano' | 'erase';

export const ELEV_MIN = -0.15;
export const ELEV_MAX = 0.2;
export const MAX_TREES = 600;

// ---------- Icosphere hàn đỉnh ----------

function normalize3(v: number[]): number[] {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
}

export function createTerrain(subdiv = 5): TerrainState {
    const t = (1 + Math.sqrt(5)) / 2;
    const verts: number[][] = [
        [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ].map(normalize3);
    let faces: number[][] = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    for (let s = 0; s < subdiv; s++) {
        const midCache = new Map<number, number>();
        const midpoint = (a: number, b: number): number => {
            const key = a < b ? a * 65536 + b : b * 65536 + a;
            const hit = midCache.get(key);
            if (hit !== undefined) return hit;
            const va = verts[a], vb = verts[b];
            const vm = normalize3([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]);
            verts.push(vm);
            const idx = verts.length - 1;
            midCache.set(key, idx);
            return idx;
        };
        const next: number[][] = [];
        for (const [a, b, c] of faces) {
            const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
            next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
        }
        faces = next;
    }

    const count = verts.length;
    const dirs = new Float32Array(count * 3);
    verts.forEach((v, i) => { dirs[i * 3] = v[0]; dirs[i * 3 + 1] = v[1]; dirs[i * 3 + 2] = v[2]; });
    const index = new Uint32Array(faces.length * 3);
    faces.forEach((f, i) => { index[i * 3] = f[0]; index[i * 3 + 1] = f[1]; index[i * 3 + 2] = f[2]; });

    return { dirs, index, count, elevation: new Float32Array(count), paint: new Uint8Array(count), trees: [] };
}

// ---------- Cọ nặn ----------

const clampE = (e: number) => Math.max(ELEV_MIN, Math.min(ELEV_MAX, e));

function distToPoint(t: TerrainState, i: number, px: number, py: number, pz: number): number {
    const dx = t.dirs[i * 3] - px, dy = t.dirs[i * 3 + 1] - py, dz = t.dirs[i * 3 + 2] - pz;
    return Math.hypot(dx, dy, dz);
}

// Hồ sơ núi lửa: sườn dốc lên, miệng lõm ở tâm (x = d/radius ∈ [0,1])
function volcanoProfile(x: number): number {
    return (1 - x) - (x < 0.25 ? (0.25 - x) * 2.2 : 0);
}

export function applyBrush(
    t: TerrainState,
    tool: BrushTool,
    px: number, py: number, pz: number,
    radius: number,
    strength: number,
    seaLevel: number
): void {
    // chuẩn hoá điểm chạm (raycast trả điểm trên mặt địa hình, bán kính ≠ 1)
    const pl = Math.hypot(px, py, pz) || 1;
    px /= pl; py /= pl; pz /= pl;

    if (tool === 'smooth') {
        // pass 1: trung bình trong vùng, pass 2: kéo về trung bình
        let sum = 0, n = 0;
        for (let i = 0; i < t.count; i++) {
            if (distToPoint(t, i, px, py, pz) < radius) { sum += t.elevation[i]; n++; }
        }
        if (!n) return;
        const avg = sum / n;
        for (let i = 0; i < t.count; i++) {
            const d = distToPoint(t, i, px, py, pz);
            if (d >= radius) continue;
            const f = 1 - d / radius;
            t.elevation[i] = clampE(t.elevation[i] + (avg - t.elevation[i]) * f * f * 0.6);
        }
        return;
    }

    if (tool === 'forest') {
        const treeSet = new Set(t.trees);
        for (let i = 0; i < t.count && t.trees.length < MAX_TREES; i++) {
            if (treeSet.has(i)) continue;
            if (t.elevation[i] < seaLevel + 0.004) continue;      // không trồng dưới nước
            if (t.paint[i] !== 0) continue;                        // không trồng trên núi lửa
            if (distToPoint(t, i, px, py, pz) >= radius) continue;
            if (Math.random() > 0.16) continue;                    // mật độ thưa tự nhiên
            t.trees.push(i);
            treeSet.add(i);
        }
        return;
    }

    if (tool === 'volcano') {
        const r = Math.max(radius, 0.22);
        for (let i = 0; i < t.count; i++) {
            const d = distToPoint(t, i, px, py, pz);
            if (d >= r) continue;
            const x = d / r;
            t.elevation[i] = clampE(t.elevation[i] + volcanoProfile(x) * 0.11);
            if (x < 0.45) t.paint[i] = x < 0.16 ? 2 : 1;
        }
        // cây trong vùng núi lửa bị "thiêu rụi"
        t.trees = t.trees.filter(vi => distToPoint(t, vi, px, py, pz) >= r * 0.5);
        return;
    }

    if (tool === 'erase') {
        for (let i = 0; i < t.count; i++) {
            const d = distToPoint(t, i, px, py, pz);
            if (d >= radius) continue;
            const f = 1 - d / radius;
            t.elevation[i] = clampE(t.elevation[i] * (1 - f * f * 0.55));
            if (f > 0.25) t.paint[i] = 0;
        }
        t.trees = t.trees.filter(vi => distToPoint(t, vi, px, py, pz) >= radius);
        return;
    }

    // raise / lower
    const dir = tool === 'lower' ? -1 : 1;
    for (let i = 0; i < t.count; i++) {
        const d = distToPoint(t, i, px, py, pz);
        if (d >= radius) continue;
        const f = 1 - d / radius;
        t.elevation[i] = clampE(t.elevation[i] + dir * strength * f * f);
    }
}

// ---------- Màu tự động theo độ cao ----------

// Vertex color trong three.js là LINEAR space → chuyển sẵn từ sRGB
function hexToLinear(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    const f = (c: number) => Math.pow(c / 255, 2.2);
    return [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)];
}

const C_DEEP = hexToLinear('#1E3F63');
const C_FLOOR = hexToLinear('#C4B37C');   // đáy biển nông (cát)
const C_BEACH = hexToLinear('#E7D493');
const C_GRASS = hexToLinear('#5FA84C');
const C_GRASS2 = hexToLinear('#47893B');
const C_ROCK = hexToLinear('#8A7059');
const C_SNOW = hexToLinear('#F2F5F7');
const C_LAVA_ROCK = hexToLinear('#453733');
const C_LAVA = hexToLinear('#FF5A22');

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// nhiễu nhỏ theo chỉ số đỉnh — bề mặt bớt "nhựa", đẹp hơn hẳn với chi phí 0
function vhash(i: number): number {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

export function computeColors(t: TerrainState, seaLevel: number, out: Float32Array): void {
    for (let i = 0; i < t.count; i++) {
        let c: [number, number, number];
        if (t.paint[i] === 2) {
            c = C_LAVA;
        } else if (t.paint[i] === 1) {
            c = C_LAVA_ROCK;
        } else {
            const h = t.elevation[i] - seaLevel;
            if (h < 0) {
                c = lerp3(C_FLOOR, C_DEEP, Math.min(1, -h / 0.07));
            } else if (h < 0.008) {
                c = C_BEACH;
            } else if (h < 0.05) {
                c = lerp3(C_GRASS, C_GRASS2, Math.min(1, (h - 0.008) / 0.042));
            } else if (h < 0.1) {
                c = lerp3(C_GRASS2, C_ROCK, (h - 0.05) / 0.05);
            } else {
                c = lerp3(C_ROCK, C_SNOW, Math.min(1, (h - 0.1) / 0.035));
            }
        }
        const v = 0.92 + vhash(i) * 0.16; // ±8% biến thiên
        out[i * 3] = c[0] * v;
        out[i * 3 + 1] = c[1] * v;
        out[i * 3 + 2] = c[2] * v;
    }
}

// ---------- Undo snapshot ----------

export interface TerrainSnap {
    elevation: Float32Array;
    paint: Uint8Array;
    trees: number[];
}

export function makeSnap(t: TerrainState): TerrainSnap {
    return { elevation: t.elevation.slice(), paint: t.paint.slice(), trees: [...t.trees] };
}

export function restoreSnap(t: TerrainState, s: TerrainSnap): void {
    t.elevation.set(s.elevation);
    t.paint.set(s.paint);
    t.trees = [...s.trees];
}

// ---------- Gieo hành tinh ngẫu nhiên (value noise fBm trên cầu) ----------

function hash3(x: number, y: number, z: number, seed: number): number {
    const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 913.3) * 43758.5453;
    return v - Math.floor(v);
}

function valueNoise(px: number, py: number, pz: number, seed: number): number {
    const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
    const fx = px - ix, fy = py - iy, fz = pz - iz;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
    let r = 0;
    for (let dz = 0; dz <= 1; dz++)
        for (let dy = 0; dy <= 1; dy++)
            for (let dx = 0; dx <= 1; dx++) {
                const w = (dx ? sx : 1 - sx) * (dy ? sy : 1 - sy) * (dz ? sz : 1 - sz);
                r += hash3(ix + dx, iy + dy, iz + dz, seed) * w;
            }
    return r;
}

export function randomizeTerrain(t: TerrainState, seed: number, seaLevel: number): void {
    for (let i = 0; i < t.count; i++) {
        const x = t.dirs[i * 3], y = t.dirs[i * 3 + 1], z = t.dirs[i * 3 + 2];
        let n = 0, amp = 1, freq = 1.7, total = 0;
        for (let o = 0; o < 4; o++) {
            n += valueNoise(x * freq + 7, y * freq + 7, z * freq + 7, seed + o * 17) * amp;
            total += amp;
            amp *= 0.5;
            freq *= 2.1;
        }
        t.elevation[i] = clampE((n / total - 0.52) * 0.28);
        t.paint[i] = 0;
    }
    // rắc sẵn ít rừng trên đồng bằng cho hành tinh có sức sống ngay
    t.trees = [];
    for (let i = 0; i < t.count && t.trees.length < 160; i++) {
        const h = t.elevation[i] - seaLevel;
        if (h > 0.012 && h < 0.05 && hash3(i, seed, 3, 9) > 0.9) t.trees.push(i);
    }
}

// ---------- Serialize (lưu localStorage) ----------

function toB64(bytes: Uint8Array): string {
    let s = '';
    for (let i = 0; i < bytes.length; i += 8192) {
        s += String.fromCharCode(...Array.from(bytes.subarray(i, i + 8192)));
    }
    return btoa(s);
}

function fromB64(b64: string): Uint8Array {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
}

const Q_SCALE = ELEV_MAX; // quantize Int8 theo biên độ lớn nhất

export function serializeTerrain(t: TerrainState): { elevation: string; paint: string; trees: string } {
    const q = new Uint8Array(t.count);
    for (let i = 0; i < t.count; i++) {
        q[i] = Math.round(Math.max(-1, Math.min(1, t.elevation[i] / Q_SCALE)) * 127) + 128;
    }
    const treeArr = new Uint16Array(t.trees);
    return {
        elevation: toB64(q),
        paint: toB64(t.paint),
        trees: toB64(new Uint8Array(treeArr.buffer))
    };
}

export function deserializeTerrain(t: TerrainState, data: { elevation: string; paint: string; trees: string }): boolean {
    try {
        const q = fromB64(data.elevation);
        if (q.length !== t.count) return false; // subdiv khác phiên bản cũ → bỏ
        for (let i = 0; i < t.count; i++) t.elevation[i] = ((q[i] - 128) / 127) * Q_SCALE;
        const p = fromB64(data.paint);
        if (p.length === t.count) t.paint.set(p);
        const tb = fromB64(data.trees);
        t.trees = Array.from(new Uint16Array(tb.buffer, 0, Math.floor(tb.length / 2)));
        return true;
    } catch {
        return false;
    }
}
