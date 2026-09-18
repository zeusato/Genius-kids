import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { CROPS, NEW_CROP_IDS, type ItemId } from '../src/core/catalog';
import { createFarm, execute, advanceTime } from '../src/core/engine';
import { validateSnapshot, parseBackup, serializeBackup } from '../src/core/validation';
import { LocalFarmGateway, LocalFarmRepository } from '../src/adapters/local';
import { showcaseFarm } from '../src/dev/fixtures';
const now = 1800000000000;
function oldContent() {
    const s = createFarm(now, 42);
    const inventory: Record<string, number> = { ...s.inventory };
    for (const id of NEW_CROP_IDS) delete inventory[id];
    return { ...s, contentVersion: 2, inventory };
}

describe('24 crop collection and safe content migration', () => {
    it('adds twelve distinct crops through Home 25, with a maximum of exactly 24 hours', () => {
        expect(Object.keys(CROPS)).toHaveLength(24);
        expect(new Set(Object.values(CROPS).map(c => c.name)).size).toBe(24);
        expect(Math.max(...Object.values(CROPS).map(c => c.seconds))).toBe(86400);
        expect(CROPS.saffron.seconds).toBe(86400);
        expect(CROPS.tea.seconds).toBe(28800);
        for (const id of NEW_CROP_IDS) expect(CROPS[id].sell * CROPS[id].yield).toBeGreaterThan(CROPS[id].seed);
        expect(new Set(showcaseFarm(25, now).plots.map(p => p.crop)).size).toBe(24);
    });
    it('migrates only the old inventory shape without mutating the input or resetting any running crop', () => {
        const old = oldContent(); old.inventory.wood = 9; old.revision = 7;
        const before = structuredClone(old), migrated = validateSnapshot(old);
        expect(old).toEqual(before);
        expect(migrated).toEqual({ ...old, contentVersion: 3, inventory: { ...createFarm(now, 42).inventory, ...old.inventory } });
        expect(parseBackup(JSON.stringify({ format: 'lang-mam-lab-backup', state: old }))).toEqual(migrated);
        expect(validateSnapshot(migrated)).toEqual(migrated);
        for (const id of NEW_CROP_IDS) expect(migrated.inventory[id]).toBe(0);
        delete old.inventory.wood;
        expect(() => validateSnapshot(old)).toThrow('kho cũ');
        const broken = structuredClone(migrated); delete (broken.inventory as Partial<Record<ItemId, number>>).saffron;
        expect(() => validateSnapshot(broken)).toThrow('thiếu vật phẩm');
        expect(() => validateSnapshot({ ...migrated, contentVersion: 4 })).toThrow('phiên bản');
    });
    it.each(NEW_CROP_IDS)('%s unlocks at its Home level, persists, matures offline and can be sold', id => {
        let s = createFarm(now, 42); s.coins = 10000;
        const p = s.plots[0]; s.plots[0] = { id: p.id, x: p.x, z: p.z };
        s.entities.find(e => e.asset === 'home')!.level = CROPS[id].level - 1;
        expect(execute(s, { type: 'plant', plotId: p.id, crop: id }).ok).toBe(false);
        s.entities.find(e => e.asset === 'home')!.level++;
        const planted = execute(s, { type: 'plant', plotId: p.id, crop: id }); expect(planted.ok, planted.message).toBe(true);
        s = parseBackup(serializeBackup(planted.state));
        expect(s.plots[0].readyAt! - s.clock).toBe(CROPS[id].seconds * 1000);
        expect(execute(s, { type: 'harvest', plotId: p.id }).ok).toBe(false);
        s = advanceTime(s, now + CROPS[id].seconds * 1000);
        const harvested = execute(s, { type: 'harvest', plotId: p.id }); expect(harvested.ok, harvested.message).toBe(true);
        expect(harvested.state.inventory[id]).toBe(CROPS[id].yield);
        expect(harvested.state.discovered).toContain(id);
        expect(execute(harvested.state, { type: 'harvest', plotId: p.id }).ok).toBe(false);
        const sold = execute(harvested.state, { type: 'sell', item: id, quantity: CROPS[id].yield });
        expect(sold.ok, sold.message).toBe(true);
        expect(sold.state.coins).toBe(10000 - CROPS[id].seed + CROPS[id].sell * CROPS[id].yield);
        expect(validateSnapshot(sold.state)).toEqual(sold.state);
    });
    it('waters the 24-hour crop once, subtracting 2 hours 24 minutes without duplicated harvests', () => {
        const s = createFarm(now, 42); s.entities[0].level = 25; s.coins = 1000;
        const p = s.plots[0]; s.plots[0] = { id: p.id, x: p.x, z: p.z };
        const planted = execute(s, { type: 'plant', plotId: p.id, crop: 'saffron' }).state;
        const watered = execute(planted, { type: 'water', plotId: p.id }); expect(watered.ok).toBe(true);
        expect(watered.state.plots[0].readyAt! - watered.state.clock).toBe(77760000);
        expect(execute(watered.state, { type: 'water', plotId: p.id }).ok).toBe(false);
        expect(parseBackup(serializeBackup(watered.state))).toEqual(watered.state);
    });
    it('loads an existing raw v2 IndexedDB save, saves a command in v3 and reloads it', async () => {
        const name = `farm-crops-${crypto.randomUUID()}`, old = oldContent();
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const r = indexedDB.open(name, 1); r.onupgradeneeded = () => r.result.createObjectStore('snapshots'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
        });
        await new Promise<void>((resolve, reject) => { const tx = db.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').put(old, 'main'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
        const repo = new LocalFarmRepository(name), gateway = await LocalFarmGateway.open(repo, () => now);
        expect(gateway.getSnapshot().contentVersion).toBe(3);
        expect((await gateway.execute({ type: 'harvest', plotId: 'plot-1' })).ok).toBe(true);
        const loaded = await repo.load(); expect(loaded!.inventory.wheat).toBe(CROPS.wheat.yield);
        expect(loaded!.inventory.coffee).toBe(0); expect(loaded!.contentVersion).toBe(3);
        await gateway.close();
    });
});
