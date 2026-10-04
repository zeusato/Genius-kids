import type { StudentProfile } from '../../types';
import { migrateProfile } from '../profileService';

export interface StoredRows { database: string; store: string; rows: { key: any; value: any }[] }
export interface ProfileSnapshot { version: 1; profiles: StudentProfile[]; local: Record<string, string>; databases: StoredRows[] }
export const emptySnapshot = (): ProfileSnapshot => ({ version: 1, profiles: [], local: {}, databases: [] });
export const ACTIVE_OWNER = 'genius-profile-owner-v1';
export const MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;
const PREFIXES = ['tellMeWhy_', 'sphinx_profile_', 'evo_notebook_v1_', 'cell_notebook_v1_', 'planet_maker_v1_', 'ptable_collection_v1_',
    'memory-draft:', 'memory-prefs:', 'sound-draft:', 'sound-prefs:', 'sound-studio-draft:', 'dragon-draft:', 'dragon-prefs:',
    'kidcoder-drafts:', 'kidcoder-prefs:', 'speed-draft-v1:', 'speed-config-v1:', 'racing-draft-v2:', 'racing-prefs-v2:', 'racing-display-v2:',
    'gears-workshop:', 'riddle-draft:', 'horse-race-draft-v1:', 'horse-race-party:', 'horse-race-prefs:', 'property-town-v1:', 'property-town-v2:', 'property-town-prefs:'];
const SCOPED = ['caro:', 'sudoku:', 'co-vua:', 'co-tuong:standalone:', 'o-an-quan:'];
export const ownedLocalKey = (key: string, ids: string[]) => ids.some(id => PREFIXES.some(p => key === p + id) || SCOPED.some(p => key.startsWith(p + id + ':')));
type StoreSpec = { name: string; keyPath?: string | string[]; owner?: 'studentId' | 'ownerId'; index?: string };
type DatabaseSpec = { name: string; version: number; stores: StoreSpec[] };
export const databaseSpecs = (ids: string[]): DatabaseSpec[] => [
    { name: 'genius-english-v1', version: 1, stores: [{ name: 'sessions', keyPath: ['studentId', 'id'], owner: 'studentId', index: 'owner' }] },
    { name: 'genius-english-library-v1', version: 1, stores: [{ name: 'entries', keyPath: ['studentId', 'id'], owner: 'studentId', index: 'owner' }] },
    { name: 'genius-english-ai-v1', version: 1, stores: [{ name: 'items', keyPath: ['studentId', 'id'], owner: 'studentId', index: 'owner' }] },
    { name: 'electricity-notebook-v1', version: 1, stores: ['documents', 'drafts', 'thumbnails'].map(name => ({ name, keyPath: 'id', owner: 'ownerId', index: 'ownerId' })) },
    { name: 'planet-maker-worlds', version: 2, stores: ['worlds', 'regions', 'tiles', 'legacy', 'checkpoints'].map(name => ({ name, keyPath: name === 'tiles' ? ['studentId', 'tile'] : 'studentId', owner: 'studentId' })) },
    ...ids.map(id => ({ name: `lang-mam-profile-v1-${encodeURIComponent(id)}`, version: 1, stores: [{ name: 'snapshots' }] })),
];

function openDatabase(spec: DatabaseSpec): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const r = indexedDB.open(spec.name, spec.version);
        r.onupgradeneeded = () => { for (const s of spec.stores) if (!r.result.objectStoreNames.contains(s.name)) {
            const store = r.result.createObjectStore(s.name, s.keyPath ? { keyPath: s.keyPath } : undefined);
            if (s.index && s.owner) store.createIndex(s.index, s.owner);
        } };
        r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
        r.onblocked = () => reject(new Error('Đóng tab cũ rồi thử đồng bộ lại.'));
    });
}

const typed = { Uint8Array, Uint8ClampedArray, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array };
const base64 = (buffer: ArrayBuffer) => { const a = new Uint8Array(buffer); let s = ''; for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode(...a.subarray(i, i + 8192)); return btoa(s); };
export async function encode(value: any): Promise<any> {
    if (value instanceof Blob) return { $binary: 'Blob', data: base64(await value.arrayBuffer()), mime: value.type };
    if (value instanceof ArrayBuffer) return { $binary: 'ArrayBuffer', data: base64(value) };
    if (ArrayBuffer.isView(value)) return { $binary: value.constructor.name, data: base64(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer) };
    if (Array.isArray(value)) return Promise.all(value.map(encode));
    if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.keys(value).sort().map(async k => [k, await encode(value[k])])));
    return value;
}
export function decode(value: any): any {
    if (!value || typeof value !== 'object') return value;
    if (value.$binary) {
        if (typeof value.data !== 'string') throw Error('Dữ liệu đính kèm không hợp lệ.');
        const data = Uint8Array.from(atob(value.data), c => c.charCodeAt(0)).buffer;
        if (value.$binary === 'Blob') return new Blob([data], { type: value.mime || '' });
        if (value.$binary === 'ArrayBuffer') return data;
        const T = typed[value.$binary as keyof typeof typed];
        if (!T) throw Error('Kiểu dữ liệu đính kèm chưa được hỗ trợ.');
        return new T(data);
    }
    return Array.isArray(value) ? value.map(decode) : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
}
export function validateSnapshot(raw: unknown, enforceCloudLimit = true): ProfileSnapshot {
    const s = raw as ProfileSnapshot;
    if (!s || s.version !== 1 || !Array.isArray(s.profiles) || s.profiles.length > 100 || !s.local || typeof s.local !== 'object' || Array.isArray(s.local) || !Array.isArray(s.databases)) throw Error('Bản hồ sơ không hợp lệ.');
    if (s.profiles.some(p => !p || typeof p !== 'object')) throw Error('Hồ sơ học sinh không hợp lệ.');
    const ids = s.profiles.map(p => p.id);
    if (new Set(ids).size !== ids.length || s.profiles.some(p => typeof p.id !== 'string' || !p.id || p.id.length > 160 || typeof p.name !== 'string' || !Number.isInteger(p.grade) || p.grade < 0 || p.grade > 5 || !Number.isFinite(p.stars) || p.stars < 0)) throw Error('Hồ sơ học sinh không hợp lệ.');
    for (const [k, v] of Object.entries(s.local)) if (!ownedLocalKey(k, ids) || typeof v !== 'string') throw Error('Bản lưu chứa dữ liệu ngoài hồ sơ.');
    const specs = databaseSpecs(ids), stores = new Set<string>();
    for (const d of s.databases) {
        if (!d || typeof d !== 'object') throw Error('Kho dữ liệu không hợp lệ.');
        const spec = specs.find(x => x.name === d.database)?.stores.find(x => x.name === d.store);
        const storeKey = d.database + '/' + d.store;
        if (!spec || stores.has(storeKey) || !Array.isArray(d.rows)) throw Error('Kho dữ liệu không hợp lệ.');
        stores.add(storeKey);
        const keys = new Set<string>();
        for (const row of d.rows) {
            if (!row || row.key == null || keys.has(JSON.stringify(row.key))) throw Error('Khoá bản lưu không hợp lệ.');
            keys.add(JSON.stringify(row.key));
            const value = decode(row.value);
            if (spec.owner && !ids.includes(value?.[spec.owner])) throw Error('Dữ liệu thuộc hồ sơ khác.');
            if (spec.keyPath) {
                const key = Array.isArray(spec.keyPath) ? spec.keyPath.map(k => value[k]) : value[spec.keyPath];
                if (JSON.stringify(key) !== JSON.stringify(row.key)) throw Error('Khoá bản lưu không khớp.');
            }
        }
    }
    if (enforceCloudLimit && new TextEncoder().encode(JSON.stringify(s)).length > MAX_SNAPSHOT_BYTES) throw Error('Bản hồ sơ vượt 20 MB; dữ liệu vẫn còn trên máy, chưa gửi lên tài khoản.');
    return s;
}

export async function captureSnapshot(attempt = 0): Promise<ProfileSnapshot> {
    const rawProfiles = localStorage.getItem('math_profiles') || '[]';
    const profiles = (JSON.parse(rawProfiles) as StudentProfile[]).map(migrateProfile);
    const ids = profiles.map(p => p.id), local: Record<string, string> = {}, databases: StoredRows[] = [];
    for (const key of Object.keys(localStorage).sort()) if (ownedLocalKey(key, ids)) local[key] = localStorage.getItem(key)!;
    for (const spec of databaseSpecs(ids)) {
        const db = await openDatabase(spec);
        try {
            const rows = await new Promise<{ store: string; rows: { key: any; value: any }[] }[]>((resolve, reject) => {
                const tx = db.transaction(spec.stores.map(s => s.name));
                const result = spec.stores.map(s => ({ store: s.name, rows: [] as { key: any; value: any }[] }));
                spec.stores.forEach((s, i) => { const r = tx.objectStore(s.name).openCursor(); r.onsuccess = () => { const c = r.result; if (!c) return;
                    if (!s.owner || ids.includes(c.value[s.owner])) result[i].rows.push({ key: c.primaryKey, value: c.value }); c.continue();
                }; });
                tx.oncomplete = () => resolve(result); tx.onabort = tx.onerror = () => reject(tx.error);
            });
            for (const r of rows) if (r.rows.length) databases.push({ database: spec.name, store: r.store, rows: await encode(r.rows) });
        } finally { db.close(); }
    }
    if ((localStorage.getItem('math_profiles') || '[]') !== rawProfiles) {
        if (attempt < 2) return captureSnapshot(attempt + 1);
        throw Error('Hồ sơ đang được cập nhật. Tiến trình đã lưu trên máy và sẽ đồng bộ ở lần kế tiếp.');
    }
    return validateSnapshot({ version: 1, profiles: await encode(profiles.sort((a, b) => a.id.localeCompare(b.id))), local, databases }, false);
}

/** Only call while the app is unmounted. Caller saves a recovery snapshot first. */
export async function restoreSnapshot(input: ProfileSnapshot): Promise<void> {
    const s = validateSnapshot(input, false);
    const previous = JSON.parse(localStorage.getItem('math_profiles') || '[]') as StudentProfile[];
    const ids = [...new Set([...previous.map(p => p.id), ...s.profiles.map(p => p.id)])];
    for (const spec of databaseSpecs(ids)) {
        const db = await openDatabase(spec);
        try { await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(spec.stores.map(x => x.name), 'readwrite');
            for (const storeSpec of spec.stores) {
                const store = tx.objectStore(storeSpec.name), cursor = store.openCursor();
                cursor.onsuccess = () => {
                    const c = cursor.result;
                    if (c) { if (!storeSpec.owner || ids.includes(c.value[storeSpec.owner])) c.delete(); c.continue(); return; }
                    const incoming = s.databases.find(d => d.database === spec.name && d.store === storeSpec.name);
                    for (const r of incoming?.rows ?? []) storeSpec.keyPath ? store.put(decode(r.value)) : store.put(decode(r.value), decode(r.key));
                };
            }
            tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error);
        }); } finally { db.close(); }
    }
    for (const key of Object.keys(localStorage)) if (ownedLocalKey(key, ids)) localStorage.removeItem(key);
    for (const [k, v] of Object.entries(s.local)) localStorage.setItem(k, v);
    localStorage.setItem('math_profiles', JSON.stringify(s.profiles));
}
export const fingerprint = async (s: ProfileSnapshot) => {
    const canonical = { ...s, profiles: [...s.profiles].sort((a, b) => a.id.localeCompare(b.id)),
        databases: s.databases.map(d => ({ ...d, rows: [...d.rows].sort((a, b) => JSON.stringify(a.key).localeCompare(JSON.stringify(b.key))) }))
            .sort((a, b) => (a.database + '/' + a.store).localeCompare(b.database + '/' + b.store)) };
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(await encode(canonical))));
    return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
};
