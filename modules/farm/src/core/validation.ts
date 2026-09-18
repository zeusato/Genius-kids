import { RECIPES as LEGACY_RECIPES } from './legacy/catalog';
import { ASSETS, CROPS, ITEMS, RECIPES, QUESTS, NEW_CROP_IDS, emptyInventory, levelOf, type ItemId } from './catalog';
import { dimensions, placementError, createFarm } from './engine';
import { validateSnapshot as validateLegacy } from './legacy/validation';
import { worldErrors, FAMILIES, BIOMES, ownedAt } from './world';
import type { FarmState, Entity, ProductionJob } from './types';
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const known = (o: object, k: unknown): k is string => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const assert: (v: unknown, message: string) => asserts v = (v, message) => { if (!v)
    throw new Error(`Bản lưu không hợp lệ: ${message}`); };
function items(v: unknown) { assert(object(v), 'kho vật phẩm'); for (const [id, n] of Object.entries(v))
    assert(known(ITEMS, id) && integer(n, 0, 10000000), 'số lượng vật phẩm'); }
export function migrateLegacy(value: unknown): FarmState {
    const old = validateLegacy(value), seed = (old.clock + old.coins + old.nextId * 7919) >>> 0, s = createFarm(old.lastWallTime, seed);
    Object.assign(s, { revision: old.revision, clock: old.clock, lastWallTime: old.lastWallTime, coins: old.coins, xp: old.xp, nextId: old.nextId, expansion: old.expansion, plots: structuredClone(old.plots), inventory: { ...emptyInventory(), ...old.inventory }, claimed: [...old.claimed], orderIndex: old.orderIndex, stats: { ...old.stats, clear: 0, explore: 4, fish: 0 } });
    s.market.epoch = Math.floor(s.clock / 14400000);
    s.entities = old.entities.map(e => ({ ...e, legacy: true, queue: [], output: {}, job: e.job ? { ...e.job, id: `job-${s.nextId++}`, duration: e.job.readyAt - e.job.startedAt, output: LEGACY_RECIPES[e.job.recipe].output, quantity: LEGACY_RECIPES[e.job.recipe].quantity, xp: LEGACY_RECIPES[e.job.recipe].xp, inputs: { ...LEGACY_RECIPES[e.job.recipe].inputs } } : undefined }));
    const level = Math.max(1, ...old.entities.map(e => e.level), Math.min(3, levelOf(old.xp)));
    for (const asset of ['home', 'warehouse'] as const) {
        let location: {
            x: number;
            z: number;
        } | undefined;
        const [w, d] = dimensions(asset, 0);
        for (let z = 0; z <= 32 - d && !location; z++)
            for (let x = 0; x <= 32 - w && !location; x++)
                if (!placementError(s, x, z, w, d))
                    location = { x, z };
        assert(location, 'không đủ vị trí chuyển đổi an toàn; bản cũ được giữ');
        s.entities.push({ id: `entity-${s.nextId++}`, asset, ...location, rotation: 0, level, queue: [], output: {} });
    }
    s.legacyPlotCap = s.plots.length;
    s.legacyStorageCap = Object.values(s.inventory).reduce((a, b) => a + b, 0);
    s.discovered = (Object.keys(s.inventory) as ItemId[]).filter(id => s.inventory[id] > 0 || id === 'wheat' || id === 'carrot');
    s.migrationNotes = [`Chuyển từ bản 0.1: Nhà chính và kho cấp ${level}. Giữ nguyên xu, hàng, ID, vị trí, cây và mẻ đang chạy.`, `${s.plots.length} luống và công trình cũ giữ quyền sở hữu; công thức đã có vẫn dùng được. Bản nguyên gốc được giữ riêng trong nơi lưu trên máy.`];
    return s;
}
/** Validate every economy-bearing field before exposing or persisting a snapshot. */
export function validateSnapshot(value: unknown): FarmState {
    assert(object(value), 'thiếu dữ liệu');
    if (value.schema === 1)
        return validateSnapshot(migrateLegacy(value));
    if (value.schema === 2 && value.contentVersion === 2) {
        // Content-only migration: require the complete old inventory, never mask corruption.
        items(value.inventory);
        const oldIds = Object.keys(ITEMS).filter(id => !(NEW_CROP_IDS as readonly string[]).includes(id));
        assert(Object.keys(value.inventory).length === oldIds.length && oldIds.every(id => known(value.inventory, id)), 'thiếu vật phẩm trong kho cũ');
        return validateSnapshot({ ...value, contentVersion: 3, inventory: { ...emptyInventory(), ...value.inventory } });
    }
    assert(value.schema === 2 && value.contentVersion === 3, 'phiên bản chưa được hỗ trợ');
    assert(value.economy === 'local-unverified', 'không phải dữ liệu local');
    for (const field of ['coins', 'xp', 'clock', 'lastWallTime', 'revision', 'nextId', 'orderIndex'])
        assert(integer(value[field], 0, field === 'clock' || field === 'lastWallTime' ? 8640000000000000 : 1000000000), field);
    assert(integer(value.expansion, 0, 2), 'diện tích cũ');
    items(value.inventory);
    assert(Object.keys(value.inventory).length === Object.keys(ITEMS).length, 'thiếu vật phẩm trong kho');
    items(value.produced);
    items(value.reserve);
    assert(integer(value.legacyPlotCap, 0, 120) && integer(value.legacyStorageCap, 0, 1000000000), 'đặc quyền chuyển đổi');
    assert(Array.isArray(value.migrationNotes) && value.migrationNotes.length <= 10 && value.migrationNotes.every((n: unknown) => typeof n === 'string' && n.length < 1000), 'ghi chú chuyển đổi');
    assert(object(value.stats), 'thống kê');
    for (const k of ['harvest', 'plant', 'produce', 'earn', 'decorate', 'upgrade', 'deliver', 'clear', 'explore', 'fish'])
        assert(integer(value.stats[k], 0, 1000000000), k);
    assert(Array.isArray(value.claimed) && new Set(value.claimed).size === value.claimed.length && value.claimed.every((id: unknown) => typeof id === 'string' && (QUESTS.some(q => q.id === id) || /^chapter:([1-9]|1\d|2[0-5])$/.test(id) || /^profession:(food|materials|craft):[1-3]$/.test(id) || /^project:[0-2]$/.test(id) || /^irrigation:\d{1,10}$/.test(id))), 'biên nhận nhiệm vụ');
    assert(object(value.speedups) && Object.keys(value.speedups).length === 4, 'phiếu');
    for (const n of [5, 10, 30, 60])
        assert(integer(value.speedups[n], 0, 1000000), 'số phiếu');
    assert(Array.isArray(value.discovered) && value.discovered.every((id: unknown) => known(ITEMS, id)) && new Set(value.discovered).size === value.discovered.length, 'sổ hàng hóa');
    assert(object(value.market) && integer(value.market.epoch, 0) && value.market.epoch <= Math.floor(value.clock / 14400000), 'kỳ chợ');
    items(value.market.bought);
    assert(Array.isArray(value.receipts) && value.receipts.length <= 256 && value.receipts.every((r: unknown) => object(r) && typeof r.id === 'string' && r.id.length <= 100 && typeof r.payload === 'string' && r.payload.length < 30000) && new Set(value.receipts.map((r: any) => r.id)).size === value.receipts.length, 'biên nhận lệnh');
    assert(object(value.contract) && integer(value.contract.stage, 0, 2) && integer(value.contract.round, 0, 1000000), 'hợp đồng');
    assert(object(value.fishing) && integer(value.fishing.round, 0, 1000000000) && integer(value.fishing.best, 0, 6) && integer(value.fishing.rewardedEpoch, -1, value.market.epoch), 'câu cá');
    const w = value.world;
    assert(object(w) && (w.version === 1 || w.version === 2) && integer(w.seed, 0, 4294967295) && FAMILIES.includes(w.family) && BIOMES.includes(w.biome), 'thế giới');
    assert(Array.isArray(w.heights) && Array.isArray(w.water) && Array.isArray(w.owned) && w.owned.every((id: unknown) => integer(id, 0, 35)) && new Set(w.owned).size === w.owned.length && [0, 1, 6, 7].every(id => w.owned.includes(id)), 'khu đất');
    assert(Array.isArray(w.obstacles) && w.obstacles.length <= 9216 && Array.isArray(w.bridges) && w.bridges.length === 2, 'địa hình');
    for (const o of w.obstacles) {
        assert(object(o) && typeof o.id === 'string' && o.id === `o-${o.x}-${o.z}` && integer(o.x, 0, 95) && integer(o.z, 0, 95) && ['tree', 'rock', 'ore'].includes(o.kind) && typeof o.cleared === 'boolean' && (o.claimed === undefined || typeof o.claimed === 'boolean'), 'vật cản');
        assert(o.cleared === !!o.claimed && (!o.cleared || o.readyAt === undefined), 'biên nhận khai phá');
        if (o.readyAt !== undefined)
            assert(integer(o.readyAt, 0) && ownedAt(w as FarmState['world'], o.x, o.z), 'job khai phá');
    }
    for (const b of w.bridges)
        assert(object(b) && ['bridge-north', 'bridge-south'].includes(b.id) && integer(b.x, 0, 90) && integer(b.z, 0, 94) && typeof b.built === 'boolean' && (b.readyAt === undefined || integer(b.readyAt)), 'cầu');
    assert(worldErrors(w as FarmState['world']).length === 0, 'thế giới hỏng');
    assert(Array.isArray(value.entities) && value.entities.length <= 300 && Array.isArray(value.plots) && value.plots.length <= 120, 'công trình/ruộng');
    const ids = new Set<string>();
    const id = (v: unknown) => { assert(typeof v === 'string' && v.length > 0 && v.length < 100 && !ids.has(v), 'ID trùng hoặc thiếu'); ids.add(v); };
    const job = (j: any, e: any, active: boolean) => { assert(object(j) && known(RECIPES, j.recipe), 'mẻ'); id(j.id); const r = RECIPES[j.recipe as keyof typeof RECIPES]; assert(r.building === e.asset && r.buildingLevel <= e.level && known(ITEMS, j.output) && integer(j.quantity, 1, 100) && integer(j.xp, 0, 10000), 'công thức/đầu ra'); items(j.inputs); assert(integer(j.duration, 1, 86400000) && integer(j.startedAt) && integer(j.readyAt) && (!active || j.startedAt <= value.clock) && j.readyAt >= j.startedAt, 'thời gian mẻ'); };
    for (const e of value.entities) {
        assert(object(e), 'công trình');
        id(e.id);
        assert(known(ASSETS, e.asset) && integer(e.x, 0, 95) && integer(e.z, 0, 95) && integer(e.rotation, 0, 3) && integer(e.level, 1, 25), 'cấu hình công trình');
        assert(e.legacy === undefined || typeof e.legacy === 'boolean', 'quyền kế thừa');
        assert(e.stored === undefined || typeof e.stored === 'boolean', 'kho decor');
        items(e.output);
        assert(Array.isArray(e.queue) && e.queue.length <= 8, 'hàng đợi');
        if (e.job)
            job(e.job, e, true);
        for (const j of e.queue)
            job(j, e, false);
        if (e.construction) {
            const c = e.construction;
            assert(object(c) && integer(c.target, e.level, Math.min(25, e.level + 1)) && integer(c.duration, 1, 345600000) && integer(c.startedAt) && integer(c.readyAt) && c.startedAt <= value.clock && c.readyAt >= c.startedAt, 'thi công');
            id(c.id);
            assert(object(c.cost) && integer(c.cost.coins), 'giá thi công');
            items(c.cost.items);
            assert(c.waitingFor === undefined || typeof c.waitingFor === 'string' && c.waitingFor === e.job?.id, 'phụ thuộc thi công');
            assert(c.newBuilding === undefined || c.newBuilding === true && e.level === 1, 'xây mới');
        }
        if (ASSETS[e.asset as keyof typeof ASSETS].kind === 'decor')
            assert(e.level === 1 && !e.job && !e.queue.length && !e.construction && !Object.keys(e.output).length, 'decor không sản xuất');
        else
            assert(!e.stored, 'không cất công trình');
    }
    assert(value.entities.filter((e: any) => e.asset === 'home').length === 1 && value.entities.filter((e: any) => e.asset === 'warehouse').length === 1, 'Nhà chính/kho duy nhất');
    for (const p of value.plots) {
        assert(object(p), 'luống');
        id(p.id);
        assert(integer(p.x, 0, 95) && integer(p.z, 0, 95), 'tọa độ luống');
        if (p.crop !== undefined)
            assert(known(CROPS, p.crop) && integer(p.plantedAt) && p.plantedAt <= value.clock && integer(p.readyAt) && p.readyAt >= p.plantedAt && p.readyAt - p.plantedAt <= 86400000 && typeof p.watered === 'boolean', 'vụ cây');
        else
            assert(p.plantedAt === undefined && p.readyAt === undefined && p.watered === undefined, 'dữ liệu vụ cũ');
    }
    if (value.gather)
        assert(object(value.gather) && ['wood', 'stone'].includes(value.gather.item) && integer(value.gather.readyAt), 'thu gom');
    if (value.undo)
        assert(object(value.undo) && value.entities.some((e: any) => e.id === value.undo.entityId) && integer(value.undo.x, 0, 95) && integer(value.undo.z, 0, 95) && integer(value.undo.rotation, 0, 3), 'hoàn tác');
    const state = structuredClone(value) as FarmState;
    for (const e of state.entities) {
        if (e.stored)
            continue;
        const [w, d] = dimensions(e.asset, e.rotation);
        // Reachability gates new commands, not loading existing possessions from older versions.
        assert(!placementError(state, e.x, e.z, w, d, e.id, e.asset, e.rotation, false), 'công trình chồng lấn hoặc sai địa hình');
    }
    const noPlots = { ...state, plots: [] };
    const positions = new Set<string>();
    for (const p of state.plots) {
        const key = `${p.x},${p.z}`;
        assert(!positions.has(key) && !placementError(noPlots, p.x, p.z, 1, 1, undefined, undefined, 0, false), 'luống chồng lấn hoặc sai địa hình');
        positions.add(key);
    }
    assert([...ids].every(k => !/^(entity|plot|job|build)-\d+$/.test(k) || Number(k.split('-')[1]) < state.nextId), 'bộ đếm ID');
    return state;
}
export function parseBackup(text: string): FarmState { if (text.length > 3000000)
    throw new Error('Tệp sao lưu quá lớn.'); const data: unknown = JSON.parse(text); if (!object(data) || data.format !== 'lang-mam-lab-backup')
    throw new Error('Hãy chọn bản sao Làng Mầm.'); return validateSnapshot(data.state); }
export const serializeBackup = (state: FarmState) => JSON.stringify({ format: 'lang-mam-lab-backup', state }, null, 2);
