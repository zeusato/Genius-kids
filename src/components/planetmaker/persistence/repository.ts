import { createTerrain, deserializeTerrain, randomizeTerrain, serializeTerrain, TerrainSnap, TerrainState } from '../terrainOps';
import { CustomPlanetDoc, DEFAULT_COSMETICS } from '../planetStore';
import { cloneRegion, Region, simulate, STRIDE, TILE, validateRegion } from '../engine/region';

export interface World { schema: 2; studentId: string; revision: number; doc: CustomPlanetDoc; globe: TerrainSnap; seed: number; region: Region | null }
type Header = Omit<World, 'region'>;
type RegionRecord = Omit<Region, 'height' | 'biome'> & { studentId: string };
interface TileRecord { studentId: string; tile: number; height: Float32Array; biome: Uint8Array }
export class ConflictError extends Error { constructor() { super('Một tab khác đã lưu bản mới. Hãy xuất bản sao của em, rồi tải lại để tránh ghi đè.'); } }
let connection: Promise<IDBDatabase> | undefined;
function database() {
    if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('planet-maker-worlds', 2);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('worlds')) db.createObjectStore('worlds', { keyPath: 'studentId' });
            if (!db.objectStoreNames.contains('regions')) db.createObjectStore('regions', { keyPath: 'studentId' });
            if (!db.objectStoreNames.contains('tiles')) db.createObjectStore('tiles', { keyPath: ['studentId', 'tile'] });
            if (!db.objectStoreNames.contains('legacy')) db.createObjectStore('legacy', { keyPath: 'studentId' });
            if (!db.objectStoreNames.contains('checkpoints')) db.createObjectStore('checkpoints', { keyPath: 'studentId' });
        };
        req.onerror = () => { connection = undefined; reject(req.error); };
        req.onblocked = () => { connection = undefined; reject(new Error('Hãy đóng tab Xưởng cũ rồi thử lại.')); };
        req.onsuccess = () => { const db = req.result; db.onversionchange = () => { db.close(); connection = undefined; }; resolve(db); };
    });
    return connection;
}
const request = <T>(req: IDBRequest<T>) => new Promise<T>((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
const complete = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error || new Error('Lưu bị gián đoạn. Bản lưu trước vẫn còn.')); tx.onerror = () => {}; });
export function validateDoc(d: CustomPlanetDoc) {
    if (!d || d.version !== 1 || typeof d.name !== 'string' || d.name.length > 80 || !Number.isFinite(d.seaLevel) || d.seaLevel < -.15 || d.seaLevel > .2 || typeof d.showInSolar !== 'boolean' || !d.cosmetics || !(d.cosmetics.atmosphere === null || /^#[a-f0-9]{6}$/i.test(d.cosmetics.atmosphere)) || typeof d.cosmetics.clouds !== 'boolean' || typeof d.cosmetics.rings !== 'boolean' || !Number.isInteger(d.cosmetics.moons) || d.cosmetics.moons < 0 || d.cosmetics.moons > 2) throw new Error('Thông tin hành tinh không hợp lệ. Bản gốc được giữ nguyên.');
    if ([d.elevation, d.paint, d.trees].some(s => typeof s !== 'string' || s.length > 100000) || !deserializeTerrain(createTerrain(5), d)) throw new Error('Địa hình hành tinh bị hỏng. Bản gốc được giữ nguyên.');
    const s = d.settlement;
    if (s && (typeof s.name !== 'string' || s.name.length > 80 || !Number.isInteger(s.buildings) || s.buildings < 0 || s.buildings > 200 || !Number.isInteger(s.residents) || s.residents < 0 || s.residents > 4800 || !Array.isArray(s.marker) || s.marker.length !== 3 || !s.marker.every(Number.isFinite) || Math.abs(Math.hypot(...s.marker) - 1) > .01)) throw new Error('Thông tin thị trấn không hợp lệ.');
}
export function validateWorld(w: World) {
    if (!w || w.schema !== 2 || typeof w.studentId !== 'string' || !Number.isInteger(w.revision) || w.revision < 0 || !Number.isInteger(w.seed)) throw new Error('Phiên bản bản lưu chưa được hỗ trợ.');
    validateDoc(w.doc);
    const g = w.globe;
    if (!g || !(g.elevation instanceof Float32Array) || g.elevation.length !== 10242 || g.elevation.some(h => !Number.isFinite(h) || h < -.151 || h > .201) || !(g.paint instanceof Uint8Array) || g.paint.length !== g.elevation.length || g.paint.some(p => p > 2) || !Array.isArray(g.trees) || g.trees.length > 600 || new Set(g.trees).size !== g.trees.length || g.trees.some(i => !Number.isInteger(i) || i < 0 || i >= g.elevation.length)) throw new Error('Dữ liệu địa hình không hợp lệ. Bản lưu chưa bị thay đổi.');
    if (w.region) validateRegion(w.region);
    else if (w.doc.settlement) throw new Error('Bản lưu thiếu dữ liệu vùng xây dựng. Hãy phục hồi từ bản sao.');
}
export function cloneWorld(w: World): World { return { ...w, doc: structuredClone(w.doc), globe: { elevation: w.globe.elevation.slice(), paint: w.globe.paint.slice(), trees: [...w.globe.trees] }, region: w.region ? cloneRegion(w.region) : null }; }
export function publish(w: World, terrain: TerrainState) {
    w.globe = { elevation: terrain.elevation.slice(), paint: terrain.paint.slice(), trees: [...terrain.trees] };
    w.doc = { ...w.doc, ...serializeTerrain(terrain), updatedAt: new Date().toISOString(), settlement: w.region ? { name: w.region.name, buildings: w.region.buildings.length, residents: simulate(w.region).residents, marker: [...w.region.marker] } : undefined };
}
export function packTile(studentId: string, r: Region, tile: number): TileRecord {
    const height = new Float32Array((TILE + 1) ** 2), biome = new Uint8Array(height.length), ox = tile % 4 * TILE, oz = Math.floor(tile / 4) * TILE;
    for (let z = 0; z <= TILE; z++) for (let x = 0; x <= TILE; x++) { const to = z * (TILE + 1) + x, from = (oz + z) * STRIDE + ox + x; height[to] = r.height[from]; biome[to] = r.biome[from]; }
    return { studentId, tile, height, biome };
}
export function unpackTiles(meta: RegionRecord, tiles: TileRecord[]): Region {
    const { studentId, ...data } = meta;
    const r: Region = { ...data, height: new Float32Array(STRIDE * STRIDE), biome: new Uint8Array(STRIDE * STRIDE) }, seen = new Uint8Array(r.height.length), ids = new Set<number>();
    if (tiles.length !== 16) throw new Error('Bản đồ thiếu mảnh địa hình.');
    for (const t of tiles) {
        if (t.studentId !== studentId || !Number.isInteger(t.tile) || t.tile < 0 || t.tile > 15 || ids.has(t.tile) || !(t.height instanceof Float32Array) || t.height.length !== 1089 || !(t.biome instanceof Uint8Array) || t.biome.length !== 1089) throw new Error('Mảnh địa hình không hợp lệ.');
        ids.add(t.tile); const ox = t.tile % 4 * TILE, oz = Math.floor(t.tile / 4) * TILE;
        for (let z = 0; z <= TILE; z++) for (let x = 0; x <= TILE; x++) { const from = z * (TILE + 1) + x, to = (oz + z) * STRIDE + ox + x; if (seen[to] && (r.height[to] !== t.height[from] || r.biome[to] !== t.biome[from])) throw new Error('Biên địa hình không khớp. Hãy phục hồi từ bản sao.'); r.height[to] = t.height[from]; r.biome[to] = t.biome[from]; seen[to] = 1; }
    }
    validateRegion(r); return r;
}
export async function saveWorld(w: World, dirtyTiles: Set<number> = new Set(Array.from({ length: 16 }, (_, i) => i)), legacyRaw?: string): Promise<number> {
    validateWorld(w);
    const db = await database(), tx = db.transaction(['worlds', 'regions', 'tiles', 'legacy', 'checkpoints'], 'readwrite'), done = complete(tx);
    let conflict = false, failure: unknown;
    const req = tx.objectStore('worlds').get(w.studentId);
    req.onsuccess = () => {
        try {
        const current = req.result as Header | undefined;
        if ((current?.revision ?? 0) !== w.revision) { conflict = true; tx.abort(); return; }
        if (current) {
            const oldRegion = tx.objectStore('regions').get(w.studentId), oldTiles = tx.objectStore('tiles').getAll(IDBKeyRange.bound([w.studentId, 0], [w.studentId, 15]));
            oldTiles.onsuccess = () => { try { tx.objectStore('checkpoints').put({ studentId: w.studentId, header: current, region: oldRegion.result || null, tiles: oldTiles.result }); } catch (e) { failure = e; tx.abort(); } };
        }
        const { region, ...header } = w;
        tx.objectStore('worlds').put({ ...header, revision: w.revision + 1 });
        if (legacyRaw) tx.objectStore('legacy').put({ studentId: w.studentId, raw: legacyRaw, migratedAt: new Date().toISOString() });
        if (region) {
            const { height, biome, ...meta } = region;
            tx.objectStore('regions').put({ ...meta, studentId: w.studentId });
            for (const tile of dirtyTiles) tx.objectStore('tiles').put(packTile(w.studentId, region, tile));
        } else {
            tx.objectStore('regions').delete(w.studentId);
            tx.objectStore('tiles').delete(IDBKeyRange.bound([w.studentId, 0], [w.studentId, 15]));
        }
        } catch (e) { failure = e; tx.abort(); }
    };
    try { await done; } catch (error) { if (conflict) throw new ConflictError(); throw failure || error; }
    return w.revision + 1;
}
export async function loadWorld(studentId: string, studentName: string): Promise<World> {
    const db = await database(), tx = db.transaction(['worlds', 'regions', 'tiles'], 'readonly'), done = complete(tx);
    const [header, region, tiles] = await Promise.all([request<Header>(tx.objectStore('worlds').get(studentId)), request<RegionRecord>(tx.objectStore('regions').get(studentId)), request<TileRecord[]>(tx.objectStore('tiles').getAll(IDBKeyRange.bound([studentId, 0], [studentId, 15])))]);
    await done;
    if (header) { const w = { ...header, region: region ? unpackTiles(region, tiles) : null }; validateWorld(w); return w; }
    const raw = localStorage.getItem(`planet_maker_v1_${studentId}`), terrain = createTerrain(5), seed = Math.floor(Math.random() * 0xffffffff);
    let doc: CustomPlanetDoc;
    if (raw) { doc = JSON.parse(raw); validateDoc(doc); deserializeTerrain(terrain, doc); }
    else { randomizeTerrain(terrain, seed, .02); doc = { version: 1, name: `Hành tinh ${studentName}`.slice(0, 80), ...serializeTerrain(terrain), seaLevel: .02, cosmetics: { ...DEFAULT_COSMETICS }, showInSolar: true, updatedAt: new Date().toISOString() }; }
    const w: World = { schema: 2, studentId, revision: 0, doc, seed, globe: { elevation: terrain.elevation, paint: terrain.paint, trees: terrain.trees }, region: null };
    try { w.revision = await saveWorld(w, new Set(), raw || undefined); }
    catch (error) { if (error instanceof ConflictError) return loadWorld(studentId, studentName); throw error; }
    return w;
}
export async function loadPublishedPlanet(studentId: string): Promise<CustomPlanetDoc | null> {
    const db = await database(), tx = db.transaction('worlds', 'readonly'), h = await request<Header>(tx.objectStore('worlds').get(studentId));
    if (!h) return null; validateDoc(h.doc); return h.doc;
}
export function exportWorld(w: World): string {
    return JSON.stringify({ format: 'planet-maker-backup', version: 2, world: w }, (_key, value) => value instanceof Float32Array ? { type: 'Float32Array', data: Array.from(value) } : value instanceof Uint8Array ? { type: 'Uint8Array', data: Array.from(value) } : value);
}
export function importWorld(raw: string, studentId: string, revision: number): World {
    if (raw.length > 5_000_000) throw new Error('Bản sao quá lớn (tối đa 5 MB).');
    const parsed = JSON.parse(raw, (_key, v) => {
        if (v && (v.type === 'Float32Array' || v.type === 'Uint8Array')) {
            if (!Array.isArray(v.data) || v.data.length > STRIDE * STRIDE || v.data.some((n: unknown) => typeof n !== 'number' || !Number.isFinite(n) || (v.type === 'Uint8Array' && (!Number.isInteger(n) || n < 0 || n > 255)))) throw new Error('Mảng dữ liệu bản sao không hợp lệ.');
            return v.type === 'Float32Array' ? new Float32Array(v.data) : new Uint8Array(v.data);
        }
        return v;
    });
    if (parsed.format !== 'planet-maker-backup' || parsed.version !== 2) throw new Error('Hãy chọn bản sao .json từ Xưởng Hành Tinh.');
    validateWorld(parsed.world); return { ...parsed.world, studentId, revision };
}
export async function recoveryBackup(studentId: string): Promise<string> {
    const db = await database(), tx = db.transaction(['worlds', 'regions', 'tiles', 'legacy', 'checkpoints'], 'readonly');
    const records = await Promise.all(['worlds', 'regions', 'tiles', 'legacy', 'checkpoints'].map(name => request(tx.objectStore(name).getAll())));
    return JSON.stringify({ format: 'planet-maker-recovery', studentId, legacyRaw: localStorage.getItem(`planet_maker_v1_${studentId}`), records: records.map(rows => rows.filter(r => r.studentId === studentId)) }, (_key, v) => ArrayBuffer.isView(v) ? Array.from(v as unknown as number[]) : v);
}
export async function restoreCheckpoint(studentId: string): Promise<World> {
    const db = await database(), tx = db.transaction(['worlds', 'checkpoints'], 'readonly');
    const [header, saved] = await Promise.all([request<Header>(tx.objectStore('worlds').get(studentId)), request<{ header: Header; region: RegionRecord | null; tiles: TileRecord[] }>(tx.objectStore('checkpoints').get(studentId))]);
    if (!saved || !header) throw new Error('Chưa có bản lưu dự phòng. Hãy dùng tệp dữ liệu đã xuất.');
    const w: World = { ...saved.header, studentId, revision: header.revision, region: saved.region ? unpackTiles(saved.region, saved.tiles) : null };
    validateWorld(w); w.revision = await saveWorld(w); return w;
}
