import type { Artwork } from '../model';
let connection: Promise<IDBDatabase> | undefined;
function validate(value: Artwork | undefined) { if (!value)
    return value; if (!Array.isArray(value.ops) || value.ops.length > 20000 || value.ops.some(o => !Number.isInteger(o.r) || o.r < 1 || !Number.isFinite(o.seed) || !/^#[0-9a-f]{6}$/i.test(o.color) || (o.kind !== 'fill' && o.kind !== 'stroke') || (o.kind === 'fill' && ((o.color2 !== undefined && !/^#[0-9a-f]{6}$/i.test(o.color2)) || (o.at !== undefined && (!Array.isArray(o.at) || o.at.length !== 2 || o.at.some(p => !Number.isFinite(p)))))) || (o.kind === 'stroke' && (!Number.isFinite(o.size) || !Array.isArray(o.pts) || o.pts.length % 2 !== 0 || o.pts.length > 12000 || o.pts.some(p => !Number.isFinite(p) || Math.abs(p) > 1000000)))))
    throw Error('Bản lưu không hợp lệ. Dữ liệu gốc vẫn được giữ.'); return value; }
function db() { return connection ||= new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open('coloring-studio', 1); req.onupgradeneeded = () => { const s = req.result.createObjectStore('artworks', { keyPath: ['owner', 'id'] }); s.createIndex('owner', 'owner'); }; req.onsuccess = () => { req.result.onversionchange = () => { req.result.close(); connection = undefined; }; resolve(req.result); }; req.onerror = () => { connection = undefined; reject(req.error); }; req.onblocked = () => { connection = undefined; reject(Error('Đóng tab Xưởng tô màu cũ để lưu tranh.')); }; }); }
export async function readArt(owner: string, id: string): Promise<Artwork | undefined> { const d = await db(); return new Promise((resolve, reject) => { const r = d.transaction('artworks').objectStore('artworks').get([owner, id]); r.onsuccess = () => { try {
    resolve(validate(r.result));
}
catch (e) {
    reject(e);
} }; r.onerror = () => reject(r.error); }); }
export async function listArt(owner: string): Promise<Artwork[]> { const d = await db(); return new Promise((resolve, reject) => { const r = d.transaction('artworks').objectStore('artworks').index('owner').getAll(owner); r.onsuccess = () => resolve(r.result.sort((a: Artwork, b: Artwork) => b.updated - a.updated)); r.onerror = () => reject(r.error); }); }
export async function saveArt(art: Artwork, expected: number): Promise<number> { const d = await db(); return new Promise((resolve, reject) => { const tx = d.transaction('artworks', 'readwrite'), s = tx.objectStore('artworks'); let error: Error | undefined; const r = s.get([art.owner, art.id]); r.onsuccess = () => { if ((r.result?.revision || 0) !== expected) {
    error = Error('Tranh đã được lưu ở tab khác. Xuất PNG trước khi tải lại.');
    tx.abort();
    return;
} if (!r.result) {
    const count = s.index('owner').count(art.owner);
    count.onsuccess = () => { if (count.result >= 300) {
        error = Error('Phòng tranh đã có 300 tranh. Em vẫn có thể xuất PNG để giữ bức mới.');
        tx.abort();
    }
    else
        s.put({ ...art, revision: expected + 1 }); };
}
else
    s.put({ ...art, revision: expected + 1 }); }; tx.oncomplete = () => resolve(expected + 1); tx.onabort = () => reject(error || tx.error || Error('Không lưu được tranh')); tx.onerror = () => { }; }); }
export async function clearColoringData(owner: string) { const d = await db(); return new Promise<void>((resolve, reject) => { const tx = d.transaction('artworks', 'readwrite'), s = tx.objectStore('artworks'), r = s.index('owner').openKeyCursor(IDBKeyRange.only(owner)); r.onsuccess = () => { const c = r.result; if (c) {
    s.delete(c.primaryKey);
    c.continue();
} }; tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); }); }

// A late thumbnail must never replace a newer journal from this or another tab.
export async function updateThumbnail(owner:string,id:string,revision:number,thumb:string,livingThumb?:string){
    const d=await db();
    return new Promise<void>((resolve,reject)=>{
        const tx=d.transaction('artworks','readwrite'),store=tx.objectStore('artworks'),request=store.get([owner,id]);
        request.onsuccess=()=>{const current:Artwork|undefined=request.result;if(current?.revision===revision)store.put({...current,thumb,livingThumb});};
        tx.oncomplete=()=>resolve();
        tx.onabort=()=>reject(tx.error);
    });
}
