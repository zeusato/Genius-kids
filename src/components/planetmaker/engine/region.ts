export const CELLS = 128;
export const SIZE = 64;
export const STRIDE = CELLS + 1;
export const TILE = 32;
export const MAX_BUILDINGS = 200;
export const MAX_TREES = 5000;
export const MAX_ROADS = SIZE * SIZE;
export const MAX_VEHICLES = 24;
export type GraphicsQuality = 'light' | 'balanced' | 'detailed';
export interface TownLimits { trees: number; roads: number; vehicles: number }
export const DEFAULT_LIMITS: TownLimits = { trees: 1000, roads: MAX_ROADS, vehicles: 8 };
export const limitsOf = (r: Region): TownLimits => ({ ...DEFAULT_LIMITS, ...r.limits });
export const roadCount = (r: Region) => r.roads.reduce((sum, v) => sum + v, 0);
export type Preset = 'meadow' | 'coast' | 'hills' | 'desert' | 'ice';
export const PRESETS: Record<Preset, string> = { meadow: '🌿 Đồng cỏ', coast: '🏖️ Ven biển', hills: '⛰️ Đồi núi', desert: '🏜️ Sa mạc', ice: '❄️ Băng tuyết' };
export const BUILDINGS = {
    home: { name: 'Nhà ở', icon: '🏠', w: 2, d: 2, h: 1.5, color: '#f2a879', water: 2, power: 1 },
    school: { name: 'Trường học', icon: '🏫', w: 4, d: 3, h: 1.7, color: '#ffc75e', water: 3, power: 2 },
    park: { name: 'Công viên', icon: '🌳', w: 3, d: 3, h: .4, color: '#84bc65', water: 1, power: 0 },
    farm: { name: 'Nông trại', icon: '🌾', w: 4, d: 3, h: .6, color: '#d8b871', water: 4, power: 1 },
    water: { name: 'Trạm nước', icon: '💧', w: 2, d: 2, h: 2.1, color: '#72c9dc', water: 0, power: 1 },
    solar: { name: 'Điện mặt trời', icon: '☀️', w: 3, d: 2, h: .6, color: '#617dc4', water: 0, power: 0 },
    observatory: { name: 'Đài thiên văn', icon: '🔭', w: 3, d: 3, h: 2, color: '#c6abe9', water: 1, power: 2 },
    landing: { name: 'Bãi đáp', icon: '🚀', w: 4, d: 4, h: .35, color: '#91a8bc', water: 0, power: 1 },
    hospital: { name: 'Bệnh viện', icon: '🏥', w: 4, d: 3, h: 1.7, color: '#e8e0cf', water: 4, power: 3 },
    library: { name: 'Thư viện', icon: '📚', w: 3, d: 3, h: 1.6, color: '#d5b483', water: 1, power: 2 },
    market: { name: 'Chợ', icon: '🛍️', w: 4, d: 3, h: 1.4, color: '#e6bb79', water: 2, power: 2 },
    firestation: { name: 'Trạm cứu hỏa', icon: '🚒', w: 4, d: 3, h: 1.6, color: '#c97762', water: 3, power: 2 },
    cafe: { name: 'Quán cà phê', icon: '☕', w: 3, d: 2, h: 1.4, color: '#dba58a', water: 2, power: 1 },
    wind: { name: 'Điện gió', icon: '🌬️', w: 3, d: 3, h: 3.5, color: '#c9e0d9', water: 0, power: 0 },
} as const;
export type BuildingType = keyof typeof BUILDINGS;
export const FLOOR_LIMITS: Record<BuildingType, number> = { home: 6, school: 4, observatory: 3, park: 1, farm: 1, water: 1, solar: 1, landing: 1, hospital: 6, library: 4, market: 2, firestation: 3, cafe: 3, wind: 1 };
export const STYLES = ['Cổ điển', 'Hiện đại', 'Sinh thái'] as const;
export const floorsOf = (b: Pick<Building, 'floors'>) => b.floors ?? 1;
export function buildingDemand(b: Building) { const s = BUILDINGS[b.type], floors = floorsOf(b); return { power: s.power * floors, water: s.water * floors }; }
export type RegionTool = 'view' | 'select' | 'raise' | 'lower' | 'smooth' | 'flatten' | 'hill' | 'crater' | 'volcano' | 'forest' | 'eraseForest' | 'grass' | 'sand' | 'rock' | 'snow' | 'road' | 'eraseRoad' | 'build';
export interface Building { id: string; type: BuildingType; x: number; z: number; yaw: number; color: string; roof: number; foundation: number; floors?: number; style?: number }
export interface Tree { id: number; x: number; z: number; scale: number }
export interface Region {
    id: string; name: string; preset: Preset; seed: number; generatorVersion: 1;
    marker: [number, number, number]; height: Float32Array; biome: Uint8Array; roads: Uint8Array;
    buildings: Building[]; trees: Tree[]; seaLevel: number; nextId: number; thumbnail?: string;
    limits?: TownLimits; graphics?: GraphicsQuality;
}
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export function random(seed: number) {
    return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function noise(x: number, z: number, seed: number) {
    const hash = (a: number, b: number) => { const v = Math.sin(a * 127.1 + b * 311.7 + seed * .013) * 43758.5453; return v - Math.floor(v); };
    const ix = Math.floor(x), iz = Math.floor(z), u = x - ix, v = z - iz, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
    return (hash(ix, iz) * (1 - a) + hash(ix + 1, iz) * a) * (1 - b) + (hash(ix, iz + 1) * (1 - a) + hash(ix + 1, iz + 1) * a) * b;
}
export function createRegion(preset: Preset, seed: number): Region {
    const r: Region = { id: 'region-1', name: 'Thị trấn đầu tiên', preset, seed: seed >>> 0, generatorVersion: 1, marker: [0, .3, Math.sqrt(.91)], height: new Float32Array(STRIDE * STRIDE), biome: new Uint8Array(STRIDE * STRIDE), roads: new Uint8Array(SIZE * SIZE), buildings: [], trees: [], seaLevel: 0, nextId: 1 };
    for (let z = 0; z <= CELLS; z++) for (let x = 0; x <= CELLS; x++) {
        const wx = x / 2, wz = z / 2, n = noise(wx / 12, wz / 12, seed) - .5, detail = (noise(wx / 4, wz / 4, seed + 7) - .5) * .15;
        r.height[z * STRIDE + x] = clamp((preset === 'coast' ? (wx - 14) * .12 + Math.sin(wz / 8) * .35 : preset === 'hills' ? 1 + n * 4 : preset === 'desert' ? 1.2 + n * 1.8 : 1.1 + n * .5) + detail, -3, 8);
        r.biome[z * STRIDE + x] = preset === 'desert' ? 2 : preset === 'ice' ? 4 : 1;
    }
    const rng = random(seed);
    if (preset !== 'desert' && preset !== 'ice') for (let i = 0; i < 190; i++) {
        const x = rng() * 62 + 1, z = rng() * 62 + 1;
        if (heightAt(r, x, z) > .3 && !(x > 23 && x < 42 && z > 23 && z < 42)) r.trees.push({ id: r.nextId++, x, z, scale: .6 + rng() * .6 });
    }
    return r;
}
// Interpolation follows the same diagonal as the rendered terrain triangles.
export function heightAt(r: Region, x: number, z: number): number {
    const sx = clamp(x * 2, 0, CELLS), sz = clamp(z * 2, 0, CELLS), ix = Math.min(CELLS - 1, Math.floor(sx)), iz = Math.min(CELLS - 1, Math.floor(sz)), u = sx - ix, v = sz - iz, i = iz * STRIDE + ix;
    return u + v <= 1 ? r.height[i] + (r.height[i + 1] - r.height[i]) * u + (r.height[i + STRIDE] - r.height[i]) * v : r.height[i + STRIDE + 1] + (r.height[i + STRIDE] - r.height[i + STRIDE + 1]) * (1 - u) + (r.height[i + 1] - r.height[i + STRIDE + 1]) * (1 - v);
}
export function footprint(type: BuildingType, yaw: number) { const s = BUILDINGS[type]; return yaw % 2 ? [s.d, s.w] : [s.w, s.d]; }
export function covers(b: Building, x: number, z: number, margin = 0) { const [w, d] = footprint(b.type, b.yaw); return x >= b.x - margin && x <= b.x + w + margin && z >= b.z - margin && z <= b.z + d + margin; }
export function port(b: Building): [number, number] {
    const [w, d] = footprint(b.type, b.yaw);
    return b.yaw === 0 ? [b.x + Math.floor(w / 2), b.z + d] : b.yaw === 1 ? [b.x + w, b.z + Math.floor(d / 2)] : b.yaw === 2 ? [b.x + Math.floor(w / 2), b.z - 1] : [b.x - 1, b.z + Math.floor(d / 2)];
}
export function placement(r: Region, type: BuildingType, x: number, z: number, yaw: number, movingId?: string): { ok: boolean; reason: string; foundation: number } {
    const fail = (reason: string) => ({ ok: false, reason, foundation: 0 });
    if (!BUILDINGS[type] || ![x, z, yaw].every(Number.isInteger) || yaw < 0 || yaw > 3) return fail('Vị trí không hợp lệ');
    const [w, d] = footprint(type, yaw);
    if (x < 1 || z < 1 || x + w >= SIZE || z + d >= SIZE) return fail('Đặt công trình bên trong bản đồ');
    if (movingId && !r.buildings.some(b => b.id === movingId)) return fail('Công trình cần di chuyển không còn tồn tại');
    if (!movingId && r.buildings.length >= MAX_BUILDINGS) return fail('Vùng này đã đủ 200 công trình');
    if (r.buildings.some(b => { const [bw, bd] = footprint(b.type, b.yaw); return b.id !== movingId && x < b.x + bw && x + w > b.x && z < b.z + bd && z + d > b.z; })) return fail('Đang chồng lên công trình khác');
    const touching = r.buildings.filter(b => { const [bw, bd] = footprint(b.type, b.yaw); return b.id !== movingId && x <= b.x + bw && x + w >= b.x && z <= b.z + bd && z + d >= b.z; });
    if (touching.length > 1 && touching.some(b => Math.abs(b.foundation - touching[0].foundation) > .0001)) return fail('Hai nền kề bên khác độ cao — hãy chừa khoảng cách');
    let min = Infinity, max = -Infinity, sum = 0, count = 0;
    for (let zz = z * 2; zz <= (z + d) * 2; zz++) for (let xx = x * 2; xx <= (x + w) * 2; xx++) { const h = r.height[zz * STRIDE + xx]; min = Math.min(min, h); max = Math.max(max, h); sum += h; count++; }
    if (min <= r.seaLevel + .12) return fail('Đất đang ngập hoặc quá sát mặt nước');
    if (max - min > .85) return fail('Đất quá dốc — hãy san phẳng trước');
    for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) if (r.roads[zz * SIZE + xx]) return fail('Có đường trong nền nhà');
    return { ok: true, reason: 'Có thể xây — nền sẽ được san tự động', foundation: touching[0]?.foundation ?? sum / count };
}
export function placeBuilding(r: Region, draft: Omit<Building, 'id' | 'foundation'>, movingId?: string): Building | null {
    if (!Number.isInteger(floorsOf(draft)) || floorsOf(draft) < 1 || floorsOf(draft) > FLOOR_LIMITS[draft.type] || !Number.isInteger(draft.style ?? 0) || (draft.style ?? 0) < 0 || (draft.style ?? 0) > 2) return null;
    const p = placement(r, draft.type, draft.x, draft.z, draft.yaw, movingId);
    if (!p.ok) return null;
    const b: Building = { type: draft.type, x: draft.x, z: draft.z, yaw: draft.yaw, color: draft.color, roof: draft.roof, floors: floorsOf(draft), style: draft.style ?? 0, id: movingId || `${r.id}-b${r.nextId++}`, foundation: p.foundation };
    const [w, d] = footprint(b.type, b.yaw);
    for (let z = b.z * 2; z <= (b.z + d) * 2; z++) for (let x = b.x * 2; x <= (b.x + w) * 2; x++) r.height[z * STRIDE + x] = b.foundation;
    r.trees = r.trees.filter(t => !covers(b, t.x, t.z, .25));
    r.buildings = [...r.buildings.filter(v => v.id !== movingId), b];
    return b;
}
export function markTiles(x: number, z: number, radius: number, dirty: Set<number>) {
    for (let tz = clamp(Math.floor((z * 2 - radius * 2 - 1) / TILE), 0, 3); tz <= clamp(Math.floor((z * 2 + radius * 2 + 1) / TILE), 0, 3); tz++) for (let tx = clamp(Math.floor((x * 2 - radius * 2 - 1) / TILE), 0, 3); tx <= clamp(Math.floor((x * 2 + radius * 2 + 1) / TILE), 0, 3); tx++) dirty.add(tz * 4 + tx);
}
export function brush(r: Region, tool: RegionTool, x: number, z: number, radius: number, strength: number, target: number, strokeSeed: number) {
    const rng = random(strokeSeed);
    if (tool === 'forest') {
        for (let n = 0; n < 12 && r.trees.length < limitsOf(r).trees; n++) {
            const angle = rng() * Math.PI * 2, dist = Math.sqrt(rng()) * radius, tx = x + Math.cos(angle) * dist, tz = z + Math.sin(angle) * dist;
            if (tx < .5 || tz < .5 || tx > SIZE - .5 || tz > SIZE - .5 || heightAt(r, tx, tz) <= r.seaLevel + .15 || r.biome[Math.round(tz * 2) * STRIDE + Math.round(tx * 2)] === 5 || r.buildings.some(b => covers(b, tx, tz, .3)) || r.roads[Math.floor(tz) * SIZE + Math.floor(tx)] || r.trees.some(t => Math.hypot(t.x - tx, t.z - tz) < .65)) continue;
            r.trees.push({ id: r.nextId++, x: tx, z: tz, scale: .6 + rng() * .5 });
        }
        return;
    }
    if (tool === 'eraseForest') { r.trees = r.trees.filter(t => Math.hypot(t.x - x, t.z - z) > radius); return; }
    const source = tool === 'smooth' ? r.height.slice() : r.height;
    const color = ({ grass: 1, sand: 2, rock: 3, snow: 4 } as Partial<Record<RegionTool, number>>)[tool];
    for (let zz = Math.max(0, Math.floor((z - radius) * 2)); zz <= Math.min(CELLS, Math.ceil((z + radius) * 2)); zz++) for (let xx = Math.max(0, Math.floor((x - radius) * 2)); xx <= Math.min(CELLS, Math.ceil((x + radius) * 2)); xx++) {
        const d = Math.hypot(xx / 2 - x, zz / 2 - z) / radius;
        if (d >= 1 || r.buildings.some(b => covers(b, xx / 2, zz / 2))) continue;
        const i = zz * STRIDE + xx, falloff = (1 - d) ** 2;
        if (color) { r.biome[i] = color; continue; }
        let h = source[i];
        if (tool === 'raise' || tool === 'lower') h += (tool === 'raise' ? 1 : -1) * strength * falloff;
        if (tool === 'flatten') h += (target - h) * Math.min(1, strength * 3 * (1 - d));
        if (tool === 'hill') h += Math.cos(d * Math.PI / 2) ** 2 * strength * 7;
        if (tool === 'crater') h += (Math.exp(-(((d - .7) / .15) ** 2)) * .35 - falloff) * strength * 7;
        if (tool === 'volcano') { h += (Math.sin(d * Math.PI) * (1 - d) - Math.max(0, .25 - d)) * strength * 10; r.biome[i] = d < .3 ? 5 : 3; }
        if (tool === 'smooth') {
            let sum = 0, count = 0;
            for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const nx = xx + dx, nz = zz + dz; if (nx >= 0 && nx <= CELLS && nz >= 0 && nz <= CELLS) { sum += source[nz * STRIDE + nx]; count++; } }
            h += (sum / count - h) * Math.min(1, strength * 4) * (1 - d);
        }
        r.height[i] = clamp(h, -3, 8);
    }
}
export function roadAt(r: Region, x: number, z: number, erase = false) {
    x = Math.floor(x); z = Math.floor(z);
    if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) return;
    if (erase) { r.roads[z * SIZE + x] = 0; return; }
    if (r.roads[z * SIZE + x] || roadCount(r) >= limitsOf(r).roads) return;
    if (r.buildings.some(b => covers(b, x + .5, z + .5))) return;
    const hs = [heightAt(r, x, z), heightAt(r, x + 1, z), heightAt(r, x, z + 1), heightAt(r, x + 1, z + 1)];
    if (Math.min(...hs) <= r.seaLevel + .05 || Math.max(...hs) - Math.min(...hs) > .65) return;
    r.roads[z * SIZE + x] = 1;
    r.trees = r.trees.filter(t => Math.floor(t.x) !== x || Math.floor(t.z) !== z);
}
export function roadLine(r: Region, ax: number, az: number, bx: number, bz: number, erase = false) {
    let x = clamp(Math.floor(ax), 0, SIZE - 1), z = clamp(Math.floor(az), 0, SIZE - 1);
    bx = clamp(Math.floor(bx), 0, SIZE - 1); bz = clamp(Math.floor(bz), 0, SIZE - 1);
    roadAt(r, x, z, erase);
    while (x !== bx || z !== bz) { if (Math.abs(bx - x) >= Math.abs(bz - z) && x !== bx) x += Math.sign(bx - x); else z += Math.sign(bz - z); roadAt(r, x, z, erase); }
}
export function cloneRegion(r: Region): Region { return { ...r, ...(r.limits ? { limits: { ...r.limits } } : {}), marker: [...r.marker], height: r.height.slice(), biome: r.biome.slice(), roads: r.roads.slice(), buildings: r.buildings.map(b => ({ ...b })), trees: r.trees.map(t => ({ ...t })) }; }
export function simulate(r: Region) {
    const labels = new Int32Array(SIZE * SIZE).fill(-1);
    let group = 0;
    for (let i = 0; i < labels.length; i++) {
        if (!r.roads[i] || labels[i] >= 0 || heightAt(r, i % SIZE + .5, Math.floor(i / SIZE) + .5) <= r.seaLevel + .03) continue;
        const queue = [i]; labels[i] = group;
        for (let q = 0; q < queue.length; q++) {
            const at = queue[q], x = at % SIZE, z = Math.floor(at / SIZE);
            for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
                const j = nz * SIZE + nx;
                if (nx < 0 || nz < 0 || nx >= SIZE || nz >= SIZE || labels[j] >= 0 || !r.roads[j] || heightAt(r, nx + .5, nz + .5) <= r.seaLevel + .03) continue;
                labels[j] = group; queue.push(j);
            }
        }
        group++;
    }
    const networks = Array.from({ length: group }, () => ({ power: 0, powerNeed: 0, water: 0, waterNeed: 0, homes: 0, school: false, park: false }));
    const status: Record<string, { connected: boolean; flooded: boolean; powered: boolean; watered: boolean; group: number }> = {};
    for (const b of r.buildings) {
        const [px, pz] = port(b), flooded = b.foundation <= r.seaLevel + .1;
        const g = !flooded && px >= 0 && pz >= 0 && px < SIZE && pz < SIZE ? labels[pz * SIZE + px] : -1;
        status[b.id] = { connected: g >= 0, flooded, powered: false, watered: false, group: g };
        if (g < 0) continue;
        const n = networks[g], s = buildingDemand(b); n.powerNeed += s.power; n.waterNeed += s.water;
        if (b.type === 'solar') n.power += 12;
        if (b.type === 'wind') n.power += 18;
        if (b.type === 'water') n.water += 20;
        if (b.type === 'home') n.homes++;
        if (b.type === 'school') n.school = true;
        if (b.type === 'park') n.park = true;
    }
    let residents = 0, servedHomes = 0, connectedHomes = 0;
    for (const b of r.buildings) {
        const s = status[b.id]; if (!s.connected) continue;
        const n = networks[s.group]; s.powered = n.power >= n.powerNeed; s.watered = s.powered && n.water >= n.waterNeed;
        if (b.type === 'home') { connectedHomes++; if (s.powered && s.watered) { servedHomes++; residents += 4 * floorsOf(b); } }
    }
    return { status, labels, networks, residents, servedHomes, connectedHomes, flooded: Object.values(status).filter(s => s.flooded).length, missions: [connectedHomes >= 5, servedHomes >= 3, networks.some(n => n.homes > 0 && n.school && n.park)] };
}

type Meta = Omit<Region, 'height' | 'biome' | 'roads'>;
const metadata = (r: Region): Meta => { const { height, biome, roads, thumbnail, ...m } = r; return structuredClone({ ...m, limits: r.limits, graphics: r.graphics }); };
interface Patch { indices: number[]; before: number[]; after: number[] }
interface Command { label: string; height: Patch; biome: Patch; roads: Patch; before: Meta; after: Meta; bytes: number }
export class RegionHistory {
    undoStack: Command[] = []; redoStack: Command[] = []; pending: Region | null = null;
    constructor(private budget = 6 * 1024 * 1024) {}
    begin(r: Region) { if (!this.pending) this.pending = cloneRegion(r); }
    cancel(r: Region) { if (this.pending) Object.assign(r, this.pending); this.pending = null; }
    commit(r: Region, label: string) {
        if (!this.pending) return false;
        const before = this.pending; this.pending = null;
        const diff = (a: Float32Array | Uint8Array, b: Float32Array | Uint8Array): Patch => { const p: Patch = { indices: [], before: [], after: [] }; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { p.indices.push(i); p.before.push(a[i]); p.after.push(b[i]); } return p; };
        const c: Command = { label, height: diff(before.height, r.height), biome: diff(before.biome, r.biome), roads: diff(before.roads, r.roads), before: metadata(before), after: metadata(r), bytes: 0 };
        const a = JSON.stringify(c.before), b = JSON.stringify(c.after);
        if (!c.height.indices.length && !c.biome.indices.length && !c.roads.indices.length && a === b) return false;
        c.bytes = (c.height.indices.length + c.biome.indices.length + c.roads.indices.length) * 32 + (a.length + b.length) * 2;
        this.undoStack.push(c); this.redoStack = [];
        while (this.undoStack.length && this.undoStack.reduce((sum, v) => sum + v.bytes, 0) > this.budget) this.undoStack.shift();
        return true;
    }
    travel(r: Region, redo = false) {
        const from = redo ? this.redoStack : this.undoStack, to = redo ? this.undoStack : this.redoStack, c = from.pop();
        if (!c) return false;
        for (const key of ['height', 'biome', 'roads'] as const) c[key].indices.forEach((i, n) => { r[key][i] = (redo ? c[key].after : c[key].before)[n]; });
        Object.assign(r, structuredClone(redo ? c.after : c.before)); to.push(c); return true;
    }
}

export function validateRegion(r: Region): void {
    const bad = () => { throw new Error('Bản đồ xây dựng bị hỏng hoặc không được hỗ trợ. Bản lưu chưa bị thay đổi.'); };
    if (r?.thumbnail !== undefined && (typeof r.thumbnail !== 'string' || r.thumbnail.length > 100000 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(r.thumbnail))) bad();
    if (!r || r.id !== 'region-1' || typeof r.name !== 'string' || r.name.length > 80 || !Object.hasOwn(PRESETS, r.preset) || r.generatorVersion !== 1 || !Number.isInteger(r.seed) || !Number.isSafeInteger(r.nextId) || r.nextId < 1 || !Number.isFinite(r.seaLevel) || r.seaLevel < -2 || r.seaLevel > 6 || !Array.isArray(r.marker) || r.marker.length !== 3 || !r.marker.every(Number.isFinite) || Math.abs(Math.hypot(...r.marker) - 1) > .01) bad();
    if (!(r.height instanceof Float32Array) || r.height.length !== STRIDE * STRIDE || r.height.some(h => !Number.isFinite(h) || h < -3 || h > 8) || !(r.biome instanceof Uint8Array) || r.biome.length !== r.height.length || r.biome.some(b => b > 5) || !(r.roads instanceof Uint8Array) || r.roads.length !== SIZE * SIZE || r.roads.some(v => v > 1)) bad();
    if (!Array.isArray(r.buildings) || r.buildings.length > MAX_BUILDINGS || !Array.isArray(r.trees) || r.trees.length > MAX_TREES) bad();
    if (r.limits !== undefined && (!r.limits || !Number.isInteger(r.limits.trees) || r.limits.trees < 0 || r.limits.trees > MAX_TREES || !Number.isInteger(r.limits.roads) || r.limits.roads < 0 || r.limits.roads > MAX_ROADS || !Number.isInteger(r.limits.vehicles) || r.limits.vehicles < 0 || r.limits.vehicles > MAX_VEHICLES)) bad();
    if (r.graphics !== undefined && !['light', 'balanced', 'detailed'].includes(r.graphics)) bad();
    const ids = new Set<string>();
    for (const b of r.buildings) {
        if (!b || typeof b.id !== 'string' || b.id.length > 100 || ids.has(b.id) || !Object.hasOwn(BUILDINGS, b.type) || ![b.x, b.z, b.yaw, b.roof].every(Number.isInteger) || b.yaw < 0 || b.yaw > 3 || b.roof < 0 || b.roof > 2 || !/^#[0-9a-f]{6}$/i.test(b.color) || !Number.isFinite(b.foundation) || b.foundation < -3 || b.foundation > 8) bad();
        ids.add(b.id); const [w, d] = footprint(b.type, b.yaw); if (b.x < 1 || b.z < 1 || b.x + w >= SIZE || b.z + d >= SIZE) bad();
        if (!Number.isInteger(floorsOf(b)) || floorsOf(b) < 1 || floorsOf(b) > FLOOR_LIMITS[b.type] || !Number.isInteger(b.style ?? 0) || (b.style ?? 0) < 0 || (b.style ?? 0) > 2) bad();
        const serial = /^region-1-b([1-9][0-9]*)$/.exec(b.id); if (!serial || Number(serial[1]) >= r.nextId) bad();
        if (r.buildings.some(other => { if (b.id === other.id || !Object.hasOwn(BUILDINGS, other.type)) return false; const [ow, od] = footprint(other.type, other.yaw); return b.x < other.x + ow && b.x + w > other.x && b.z < other.z + od && b.z + d > other.z; })) bad();
    }
    const treeIds = new Set<number>();
    for (const t of r.trees) { if (!t || !Number.isInteger(t.id) || t.id < 1 || t.id >= r.nextId || treeIds.has(t.id) || ![t.x, t.z, t.scale].every(Number.isFinite) || t.x < 0 || t.z < 0 || t.x > SIZE || t.z > SIZE || t.scale < .2 || t.scale > 2) bad(); treeIds.add(t.id); }
}
