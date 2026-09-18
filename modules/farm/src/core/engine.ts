import { ASSETS, CROPS, ITEMS, QUESTS, RECIPES, SPEEDUPS, emptyInventory, type AssetId, type BuildingId, type ItemId, type RecipeId } from './catalog';
import { homeLevel, homeSpec, plotCap, regionCap, storageCap, usedStorage, queueCap, outputCap, productionFactor, upgradePrice, upgradeMs, upgradeRequirements, buildMs, chapterReady, orderFor, type Cost } from './progression';
import { generateWorld, heightAt, isWater, ownedAt, bridgeAt, chunkNeighbors, chunkOf, canReachRegion, reachableTiles, tileIndex, canWorkTile, invalidateReachability } from './world';
import { advanceTime, resolveJobs, marketItems, marketHome, marketPrice, marketStock, fishPuzzle } from './simulation';
import { createFarm as createLegacy } from './legacy/engine';
import {RECIPES as LEGACY_RECIPES} from './legacy/catalog';
import { copyFarm } from './copy';
import { initializeHarvesting, resourceHome, resourcePayment, resourceReward } from './harvesting';
import { buildPrice, buildRequirements } from './construction';
import { PROFESSIONS, PROJECTS, professionRank, professionFactor, validPipes } from './activities';
import type { FarmState, Entity, Plot, Rotation, FarmCommand, CommandResult, ProductionJob } from './types';
export { advanceTime };
export const boundsOf = (_s: FarmState) => ({ width: 96, depth: 96 });
export const upgradeCost = (e: Entity) => upgradePrice(e).coins;
export const expansionCost = (s: FarmState) => 120 + (s.world.owned.length - 4) * 90;
export const dimensions = (id: AssetId, r: Rotation) => r % 2 ? [ASSETS[id].depth, ASSETS[id].width] : [ASSETS[id].width, ASSETS[id].depth];
export const progressOf = (start: number, end: number, now: number) => Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start)));
export const growthStage = (p: Plot, now: number) => !p.crop ? -1 : now >= p.readyAt! ? 4 : Math.min(3, Math.floor(progressOf(p.plantedAt!, p.readyAt!, now) * 4));
export function createFarm(now: number, seed = crypto.getRandomValues(new Uint32Array(1))[0]): FarmState {
    const old = createLegacy(now);
    return initializeHarvesting({ ...old, schema: 2, contentVersion: 3, harvestingVersion: 1, energy: { value: 100, capacity: 100, updatedAt: old.clock }, regrowth: { slot: 0 }, inventory: emptyInventory(), entities: [{ id: 'home', asset: 'home', x: 10, z: 2, rotation: 0, level: 1, queue: [], output: {} }, { id: 'warehouse', asset: 'warehouse', x: 2, z: 1, rotation: 0, level: 1, queue: [], output: {} }], world: generateWorld(seed), legacyPlotCap: 0, legacyStorageCap: 0, migrationNotes: [], speedups: { 5: 1, 10: 0, 30: 0, 60: 0 }, produced: {}, discovered: ['wheat', 'carrot'], market: { epoch: 0, bought: {} }, receipts: [], reserve: {}, contract: { stage: 0, round: 0 }, fishing: { round: 0, best: 0, rewardedEpoch: -1 }, stats: { ...old.stats, clear: 0, explore: 4, fish: 0 } });
}
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const overlap = (x: number, z: number, w: number, d: number, bx: number, bz: number, bw: number, bd: number) => x < bx + bw && x + w > bx && z < bz + bd && z + d > bz;
export function placementError(s: FarmState, x: number, z: number, w: number, d: number, ignoreId?: string, asset?: AssetId, rotation: Rotation = 0, requireAccess = true): string | null {
    if (![x, z, w, d].every(Number.isInteger) || x < 0 || z < 0 || x + w > 96 || z + d > 96)
        return 'Chọn vị trí trong bản đồ.';
    const h = heightAt(s.world, x, z);
    for (let dz = 0; dz < d; dz++)
        for (let dx = 0; dx < w; dx++) {
            const xx = x + dx, zz = z + dz;
            if (!ownedAt(s.world, xx, zz))
                return 'Cần nhận khu đất này trước.';
            if (s.world.bridges.some(b => xx >= b.x && xx < b.x + 6 && zz >= b.z && zz < b.z + 2))
                return 'Chừa lối cho cầu qua sông.';
            const water = isWater(s.world, xx, zz);
            if (asset === 'fishing_pier') {
                const localZ = rotation === 0 ? dz : rotation === 1 ? dx : rotation === 2 ? d - 1 - dz : w - 1 - dx;
                if (water !== (localZ >= 1))
                    return 'Cảng cần một hàng chân bờ trên đất và ba hàng sàn trên nước. Hãy thử xoay.';
            }
            else if (water && !bridgeAt(s.world, xx, zz))
                return 'Công trình này cần mặt đất khô.';
            if (!water && heightAt(s.world, xx, zz) !== h)
                return 'Cần một mặt bằng cùng cao độ.';
        }
    for (const e of s.entities) {
        if (e.id === ignoreId || e.stored)
            continue;
        const [ew, ed] = dimensions(e.asset, e.rotation);
        if (overlap(x, z, w, d, e.x, e.z, ew, ed))
            return 'Vị trí đang có công trình hoặc trang trí.';
    }
    if (s.plots.some(p => overlap(x, z, w, d, p.x, p.z, 1, 1)))
        return 'Vị trí đang có luống cây.';
    if (s.world.obstacles.some(o => !o.cleared && overlap(x, z, w, d, o.x, o.z, 1, 1)))
        return 'Cần dọn cây hoặc đá ở đây.';
    // The permanent 24×24 starter clearing is validated as flat, dry and unobstructed.
    // Avoid flood-filling the world for every candidate in building searches there.
    if (requireAccess && (x + w > 24 || z + d > 24)) {
        const reachable = reachableTiles(s.world);
        for (let dz = 0; dz < d; dz++) for (let dx = 0; dx < w; dx++) {
            const xx = x + dx, zz = z + dz;
            if (!isWater(s.world, xx, zz) && !reachable.has(tileIndex(xx, zz)))
                return 'Cần khai phá lối đi hoặc xây cầu tới vị trí này.';
        }
    }
    return null;
}
export const needItems = (s: FarmState, items: Partial<Record<ItemId, number>>) => Object.entries(items).find(([id, n]) => s.inventory[id as ItemId] < n!)?.[0] as ItemId | undefined;
function consume(s: FarmState, items: Partial<Record<ItemId, number>>) { for (const [id, n] of Object.entries(items))
    s.inventory[id as ItemId] -= n!; }
function add(s: FarmState, items: Partial<Record<ItemId, number>>) { for (const [id, n] of Object.entries(items)) {
    s.inventory[id as ItemId] += n!;
    if (!s.discovered.includes(id as ItemId))
        s.discovered.push(id as ItemId);
} }
const room = (s: FarmState, items: Partial<Record<ItemId, number>>) => usedStorage(s) + Object.values(items).reduce((a, b) => a + (b ?? 0), 0) <= storageCap(s);
function afford(s: FarmState, c: Cost) { return s.coins >= c.coins && !needItems(s, c.items); }
function pay(s: FarmState, c: Cost) { s.coins -= c.coins; consume(s, c.items); }
export const contractNeed = (s: FarmState): Partial<Record<ItemId, number>> => (homeLevel(s)<15?[{bread:3,juice:2},{cloth:2,butter:2},{soup:2,flowers:2}]:[{ bread: 3, juice: 2 }, { cloth: 2, jam: 2 }, { gift: 2 }])[s.contract.stage];
export function execute(state: FarmState, command: FarmCommand): CommandResult {
    const fail = (message: string): CommandResult => ({ ok: false, state, message });
    if (!command || typeof command !== 'object')
        return fail('Lệnh không hợp lệ.');
    const { requestId, ...action } = command, payload = JSON.stringify(action);
    if (requestId !== undefined) {
        if (typeof requestId !== 'string' || requestId.length > 100 || !requestId)
            return fail('Mã thao tác không hợp lệ.');
        const receipt = state.receipts.find(r => r.id === requestId);
        if (receipt)
            return receipt.payload === payload ? { ok: true, state, message: 'Thao tác này đã được lưu.' } : fail('Mã thao tác đã dùng cho yêu cầu khác.');
    }
    const s = copyFarm(state, ['expand', 'clear', 'collect-obstacle', 'bridge', 'speedup', 'collect'].includes(command.type)), level = homeLevel(s);
    const success = (message: string): CommandResult => { if (s.world !== state.world) invalidateReachability(s.world); s.revision = state.revision + 1; if (requestId)
        s.receipts = [...s.receipts.slice(-255), { id: requestId, payload }]; return { ok: true, state: s, message }; };
    if (command.type === 'batch') {
        if (command.expectedRevision !== state.revision)
            return fail('Nông trại đã thay đổi. Hãy xem lại vùng đã chọn.');
        if (!Array.isArray(command.plotIds) || command.plotIds.length < 1 || command.plotIds.length > 120 || new Set(command.plotIds).size !== command.plotIds.length)
            return fail('Danh sách luống không hợp lệ.');
        let next = state;
        for (const id of command.plotIds) {
            const r = execute(next, command.action === 'plant' ? { type: 'plant', plotId: id, crop: command.crop } : { type: command.action, plotId: id });
            if (!r.ok)
                return fail(r.message);
            next = r.state;
        }
        Object.assign(s, next);
        return success(`${command.action === 'plant' ? 'Đã gieo' : command.action === 'water' ? 'Đã tưới' : 'Đã thu hoạch'} ${command.plotIds.length} ô.`);
    }
    if (command.type === 'plant' || command.type === 'water' || command.type === 'harvest') {
        const p = s.plots.find(v => v.id === command.plotId);
        if (!p)
            return fail('Không tìm thấy luống.');
        if (command.type === 'plant') {
            if (!own(CROPS, command.crop))
                return fail('Giống không hợp lệ.');
            const c = CROPS[command.crop];
            if (p.crop)
                return fail('Luống đã có cây.');
            if (level < c.level)
                return fail(`Cần Nhà chính cấp ${c.level}.`);
            if (s.coins < c.seed)
                return fail('Chưa đủ xu mua giống.');
            s.coins -= c.seed;
            Object.assign(p, { crop: command.crop, plantedAt: s.clock, readyAt: s.clock + c.seconds * 1000, watered: false });
            s.stats.plant++;
            return success(`Đã gieo ${c.name.toLowerCase()}.`);
        }
        if (!p.crop)
            return fail('Luống chưa có cây.');
        const c = CROPS[p.crop];
        if (command.type === 'water') {
            if (p.watered || s.clock >= p.readyAt!)
                return fail('Luống đã tưới hoặc đã chín.');
            p.readyAt = Math.max(s.clock, p.readyAt! - c.seconds * 100);
            p.watered = true;
            return success('Đã tưới · vụ này nhanh hơn 10%.');
        }
        if (s.clock < p.readyAt!)
            return fail('Cây vẫn đang lớn.');
        if (!room(s, { [p.crop]: c.yield }))
            return fail('Kho đầy. Cây chín vẫn được giữ nguyên.');
        add(s, { [p.crop]: c.yield });
        s.produced[p.crop] = (s.produced[p.crop] ?? 0) + c.yield;
        s.xp += c.xp;
        s.stats.harvest++;
        delete p.crop;
        delete p.plantedAt;
        delete p.readyAt;
        delete p.watered;
        return success(`+${c.yield} ${c.name.toLowerCase()}`);
    }
    if (command.type === 'sell' || command.type === 'reserve') {
        if (!own(ITEMS, command.item) || !Number.isSafeInteger(command.quantity) || command.quantity < 0)
            return fail('Số lượng không hợp lệ.');
        if (command.type === 'reserve') {
            if (command.quantity > 10000)
                return fail('Số dự trữ quá lớn.');
            s.reserve[command.item] = command.quantity;
            return success('Đã ghim dự trữ. Bán và giao đơn sẽ giữ lại lượng này.');
        }
        if (command.quantity < 1 || command.quantity > s.inventory[command.item] - (s.reserve[command.item] ?? 0))
            return fail('Không đủ hàng khả dụng; kiểm tra phần dự trữ.');
        s.inventory[command.item] -= command.quantity;
        const coins = ITEMS[command.item].sell * command.quantity;
        s.coins += coins;
        s.stats.earn += coins;
        return success(`Đã bán · +${coins} xu`);
    }
    if (['produce', 'collect', 'upgrade', 'cancel-upgrade', 'cancel-queue', 'store'].includes(command.type)) {
        const c = command as Extract<FarmCommand, {
            entityId: string;
        }>, e = s.entities.find(v => v.id === c.entityId);
        if (!e)
            return fail('Không tìm thấy công trình.');
        if (command.type === 'store') {
            if (ASSETS[e.asset].kind !== 'decor')
                return fail('Chỉ cất được trang trí.');
            e.stored = true;
            return success('Đã cất trang trí. Đặt lại miễn phí từ kho.');
        }
        if (ASSETS[e.asset].kind !== 'building')
            return fail('Đồ trang trí không sản xuất hay nâng cấp.');
        if (command.type === 'produce') {
            if (!own(RECIPES, command.recipe))
                return fail('Công thức không hợp lệ.');
            const r = RECIPES[command.recipe], n = command.quantity ?? 1;
            if (e.construction || e.asset !== r.building || e.level < r.buildingLevel || level < r.home && !(e.legacy&&own(LEGACY_RECIPES,command.recipe)))
                return fail('Công trình chưa mở công thức hoặc đang nâng cấp.');
            if (!Number.isInteger(n) || n < 1 || n > queueCap(e) - (e.job ? 1 : 0) - e.queue.length)
                return fail('Hàng đợi không còn đủ chỗ.');
            const inputs = Object.fromEntries(Object.entries(r.inputs).map(([id, v]) => [id, v * n]));
            if (needItems(s, inputs))
                return fail('Chưa đủ nguyên liệu cho cả số mẻ.');
            consume(s, inputs);
            for (let i = 0; i < n; i++) {
                const qty = r.quantity + (['wood', 'stone', 'ore'].includes(r.output) && s.world.biome === (r.output === 'stone' ? 'stone' : r.output === 'ore' ? 'ore' : 'forest') ? 2 : 0);
                const job: ProductionJob = { id: `job-${s.nextId++}`, recipe: command.recipe, startedAt: s.clock, readyAt: s.clock + Math.round(r.seconds * 1000 * productionFactor(e) * professionFactor(s, command.recipe)), duration: Math.round(r.seconds * 1000 * productionFactor(e) * professionFactor(s, command.recipe)), output: r.output, quantity: qty, xp: r.xp, inputs: { ...r.inputs } };
                if (!e.job)
                    e.job = job;
                else
                    e.queue.push(job);
            }
            return success(`Đã giữ nguyên liệu cho ${n} mẻ.`);
        }
        if (command.type === 'collect') {
            if (!Object.values(e.output).some(n => n! > 0))
                return fail('Chưa có thành phẩm.');
            if (!room(s, e.output))
                return fail('Kho đầy. Thành phẩm vẫn nằm tại công trình.');
            add(s, e.output);
            e.output = {};
            if (e.job && e.job.readyAt < s.clock)
                e.job.readyAt = s.clock;
            resolveJobs(s);
            return success('Đã chuyển thành phẩm vào kho.');
        }
        if (command.type === 'cancel-queue') {
            const refund: Partial<Record<ItemId, number>> = {};
            for (const j of e.queue)
                for (const [id, n] of Object.entries(j.inputs))
                    refund[id as ItemId] = (refund[id as ItemId] ?? 0) + n!;
            if (!e.queue.length)
                return fail('Không có mẻ chờ.');
            if (!room(s, refund))
                return fail('Cần chỗ trong kho để hoàn nguyên liệu.');
            add(s, refund);
            e.queue = [];
            return success('Đã hủy các mẻ chưa chạy và hoàn nguyên liệu.');
        }
        if (command.type === 'cancel-upgrade') {
            if (!e.construction?.waitingFor)
                return fail('Chỉ hủy được lịch chưa khởi công.');
            if (!room(s, e.construction.cost.items))
                return fail('Cần chỗ trong kho để hoàn vật liệu.');
            s.coins += e.construction.cost.coins;
            add(s, e.construction.cost.items);
            delete e.construction;
            return success('Đã hủy lịch nâng và hoàn chi phí.');
        }
        const errors = upgradeRequirements(s, e);
        if (errors.length)
            return fail(errors.join(' · '));
        const cost = upgradePrice(e);
        if (!afford(s, cost))
            return fail('Chưa đủ xu hoặc vật liệu nâng cấp.');
        pay(s, cost);
        e.construction = { id: `build-${s.nextId++}`, target: e.level + 1, startedAt: s.clock, readyAt: s.clock + upgradeMs(e), duration: upgradeMs(e), cost, ...(e.job ? { waitingFor: e.job.id } : {}) };
        return success(e.job ? 'Đã đặt lịch nâng sau mẻ hiện tại.' : 'Đội thợ đã bắt đầu nâng cấp.');
    }
    if (command.type === 'build' || command.type === 'move') {
        const e = command.type === 'move' ? s.entities.find(v => v.id === command.entityId) : undefined;
        if (command.type === 'move' && !e)
            return fail('Không tìm thấy đồ vật.');
        const id = command.type === 'build' ? command.asset : e!.asset;
        if (!own(ASSETS, id) || ![0, 1, 2, 3].includes(command.rotation))
            return fail('Loại hoặc hướng không hợp lệ.');
        const a = ASSETS[id];
        if (e?.construction)
            return fail('Chờ thi công xong trước khi chuyển.');
        const [w, d] = dimensions(id, command.rotation), error = placementError(s, command.x, command.z, w, d, e?.id, id, command.rotation);
        if (error)
            return fail(error);
        if (e) {
            if (e.x === command.x && e.z === command.z && e.rotation === command.rotation && !e.stored)
                return fail('Vị trí không thay đổi.');
            s.undo = { entityId: e.id, x: e.x, z: e.z, rotation: e.rotation };
            Object.assign(e, { x: command.x, z: command.z, rotation: command.rotation, stored: false });
        }
        else {
            const errors = buildRequirements(s, id), cost = buildPrice(id);
            if (errors.length) return fail(errors.join(' · '));
            pay(s, cost);
            const added: Entity = { id: `entity-${s.nextId++}`, asset: id, x: command.x, z: command.z, rotation: command.rotation, level: 1, queue: [], output: {} };
            if (a.kind === 'building')
                added.construction = { id: `build-${s.nextId++}`, target: 1, startedAt: s.clock, readyAt: s.clock + buildMs(id as BuildingId), duration: buildMs(id as BuildingId), cost, newBuilding: true };
            else
                s.stats.decorate++;
            s.entities.push(added);
        }
        return success(e ? 'Đã chuyển. Có thể hoàn tác bố trí.' : a.kind === 'building' ? 'Đã bắt đầu xây.' : 'Đã đặt trang trí.');
    }
    if (command.type === 'undo') {
        const u = s.undo;
        if (!u)
            return fail('Chưa có bố trí để hoàn tác.');
        const r = execute(s, { type: 'move', ...u });
        if (!r.ok)
            return fail(r.message);
        Object.assign(s, r.state);
        delete s.undo;
        return success('Đã hoàn tác bố trí; sản xuất và kho giữ nguyên.');
    }
    if (command.type === 'dig') {
        if (s.plots.length >= plotCap(s))
            return fail('Nâng Nhà chính để mở thêm quyền tạo ruộng.');
        const error = placementError(s, command.x, command.z, 1, 1);
        if (error)
            return fail(error);
        if (s.coins < 15)
            return fail('Cần 15 xu.');
        s.coins -= 15;
        s.plots.push({ id: `plot-${s.nextId++}`, x: command.x, z: command.z });
        return success('Đã tạo luống mới.');
    }
    if (command.type === 'specialize') {
        if (!own(PROFESSIONS, command.profession))
            return fail('Nghề không hợp lệ.');
        const rank = professionRank(s, command.profession), p = PROFESSIONS[command.profession], need = p.items[rank];
        if (rank >= 3 || level < [10, 18, 25][rank])
            return fail('Cần Nhà chính 10 / 18 / 25 cho ba bậc nghề.');
        if (!need || needItems(s, need) || Object.entries(need).some(([id, n]) => (s.produced[id as ItemId] ?? 0) < n!))
            return fail('Cần tự sản xuất và có đủ hàng nộp cho nghề.');
        consume(s, need);
        s.claimed.push(`profession:${command.profession}:${rank + 1}`);
        s.speedups[10]++;
        return success(`${p.name} bậc ${rank + 1}: mẻ mới nhanh thêm 5%. Có thể học cả ba nghề.`);
    }
    if (command.type === 'project') {
        const n = command.stage, p = PROJECTS[n];
        if (!Number.isInteger(n) || !p || level < p.home || s.claimed.includes(`project:${n}`) || n > 0 && !s.claimed.includes(`project:${n - 1}`))
            return fail('Dự án chưa mở hoặc đã nhận.');
        if (needItems(s, p.need) || s.entities.length >= 300)
            return fail('Thiếu vật liệu hoặc túi trang trí đã đầy.');
        consume(s, p.need);
        s.claimed.push(`project:${n}`);
        s.speedups[30]++;
        s.entities.push({ id: `entity-${s.nextId++}`, asset: p.reward, x: 0, z: 0, rotation: 0, level: 1, stored: true, queue: [], output: {} });
        return success('Dự án hoàn tất · trang trí đã vào túi, kèm phiếu 30 phút.');
    }
    if (command.type === 'irrigation') {
        if (level < 3 || command.epoch !== s.market.epoch || !Array.isArray(command.rotations) || !validPipes(command.rotations))
            return fail('Ống phải nối nguồn đến cửa ra qua đủ chín ô, không rò nước.');
        const id = `irrigation:${s.market.epoch}`;
        if (s.claimed.includes(id))
            return success('Nối đúng! Kỳ chợ này đã nhận thưởng; có thể tiếp tục luyện.');
        s.claimed = s.claimed.filter(id => !id.startsWith('irrigation:'));
        s.claimed.push(id);
        s.speedups[5]++;
        return success('Dẫn nước thành công · nhận phiếu 5 phút.');
    }
    if (command.type === 'claim') {
        const q = QUESTS.find(v => v.id === command.questId);
        if (!q || s.claimed.includes(q.id) || s.stats[q.stat] < q.target)
            return fail('Chưa đạt hoặc đã nhận thưởng.');
        s.claimed.push(q.id);
        s.coins += q.coins;
        s.xp += q.xp;
        s.speedups[5]++;
        return success(`Đã nhận ${q.coins} xu và phiếu 5 phút.`);
    }
    if (command.type === 'chapter') {
        const n = command.chapter;
        if (!Number.isInteger(n) || n < 1 || n > 25 || s.claimed.includes(`chapter:${n}`) || !chapterReady(s, n))
            return fail('Chương chưa hoàn thành hoặc đã nhận thưởng.');
        s.claimed.push(`chapter:${n}`);
        s.coins += 80 + n * 40;
        s.speedups[SPEEDUPS[Math.min(3, Math.floor(n / 7))]]++;
        return success(`Hoàn thành chương ${n} · nhận xu và phiếu tăng tốc.`);
    }
    if (command.type === 'deliver' || command.type === 'skip-order' || command.type === 'contract') {
        if (command.type === 'skip-order') {
            s.orderIndex++;
            return success('Đã đổi sang đơn khác.');
        }
        if (command.type === 'contract' && level < 12)
            return fail('Hợp đồng mở ở Nhà chính 12.');
        const o = orderFor(s), need = command.type === 'contract' ? contractNeed(s) : o.need;
        if (Object.entries(need).some(([id, n]) => s.inventory[id as ItemId] - (s.reserve[id as ItemId] ?? 0) < n!))
            return fail('Chưa đủ hàng khả dụng; kiểm tra phần dự trữ.');
        consume(s, need);
        const coins = command.type === 'contract' ? Math.ceil(Object.entries(need).reduce((v, [id, n]) => v + ITEMS[id as ItemId].sell * n!, 0) * 1.5) : o.coins;
        s.coins += coins;
        s.stats.earn += coins;
        s.xp += o.xp;
        s.stats.deliver++;
        if (command.type === 'contract') {
            s.contract.stage++;
            if (s.contract.stage === 3) {
                s.contract.stage = 0;
                s.contract.round++;
                s.speedups[30]++;
            }
        }
        else
            s.orderIndex++;
        return success(`Đã giao hàng · +${coins} xu`);
    }
    if (command.type === 'expand') {
        const chunk = command.chunk;
        if (chunk === undefined || !Number.isInteger(chunk) || chunk < 0 || chunk >= 36 || s.world.owned.includes(chunk))
            return fail('Chọn khu đất chưa sở hữu.');
        if (s.world.owned.length >= regionCap(s))
            return fail('Nâng Nhà chính để được nhận thêm khu.');
        if (!chunkNeighbors(chunk).some(id => s.world.owned.includes(id)))
            return fail('Chọn khu liền kề đất đã có.');
        if (!canReachRegion(s.world, chunk))
            return fail('Cần mở đường hoặc xây cầu tới ranh khu này.');
        if (s.coins < expansionCost(s))
            return fail('Chưa đủ xu nhận đất.');
        s.coins -= expansionCost(s);
        s.world.owned.push(chunk);
        s.stats.explore++;
        return success('Đã nhận khu đất. Dọn cây đá để lấy vật liệu và mặt bằng.');
    }
    if (command.type === 'gather' || command.type === 'collect-gather')
        return fail('Thu gom đã được thay bằng khai phá trên bản đồ.');
    if (command.type === 'collect-obstacle')
        return fail('Khai phá nhận tài nguyên ngay, không cần thu gom lần nữa.');
    if (command.type === 'clear') {
        const o = s.world.obstacles.find(v => v.id === command.obstacleId);
        if (!o || !ownedAt(s.world, o.x, o.z)) return fail('Tài nguyên chưa thuộc đất của mình.');
        if (o.cleared || o.claimed) return fail('Tài nguyên đã được khai phá.');
        if ((command.generation ?? 0) !== (o.generation ?? 0)) return fail('Tài nguyên này đã thay đổi. Hãy chọn lại.');
        if (command.pay !== undefined && !['auto', 'energy', 'tools'].includes(command.pay)) return fail('Cách khai phá không hợp lệ.');
        if (!canWorkTile(s.world, o.x, o.z)) return fail('Cần mở lối tới tài nguyên này trước.');
        const required = resourceHome(s.world, o);
        if (level < required) return fail(`Cần Nhà chính cấp ${required}.`);
        const cost = resourcePayment(s, o, command.pay), reward = resourceReward(s.world, o);
        if (s.inventory.tools < cost.tools) return fail(`Cần ${cost.tools} dụng cụ.`);
        if (s.energy.value < cost.energy) return fail(`Cần ${cost.energy} năng lượng. Hồi 1 điểm mỗi 3 phút.`);
        if (o.kind === 'berry' && s.energy.value >= s.energy.capacity) return fail('Năng lượng đang đầy. Để dành bụi quả cho lần sau.');
        if (usedStorage(s) - cost.tools + Object.values(reward.items).reduce((n, quantity) => n + quantity!, 0) > storageCap(s)) return fail('Kho chưa đủ chỗ. Tài nguyên và năng lượng được giữ nguyên.');
        const gained = Math.min(reward.energy, s.energy.capacity - s.energy.value);
        if (s.energy.value === s.energy.capacity) s.energy.updatedAt = s.clock;
        s.energy.value = Math.min(s.energy.capacity, s.energy.value - cost.energy + gained);
        if (s.energy.value === s.energy.capacity) s.energy.updatedAt = s.clock;
        s.inventory.tools -= cost.tools;
        add(s, reward.items);
        o.cleared = o.claimed = true;
        delete o.readyAt;
        s.stats.clear++;
        return { ...success(o.kind === 'berry' ? `+${gained} năng lượng` : Object.entries(reward.items).map(([id, n]) => `+${n} ${ITEMS[id as ItemId].name.toLowerCase()}`).join(' · ')), harvest: { obstacle: { ...o, cleared: false, claimed: false }, items: reward.items, energy: gained } };
    }
    if (command.type === 'bridge') {
        const b = s.world.bridges.find(v => v.id === command.bridgeId);
        if (!b || b.built || b.readyAt !== undefined)
            return fail('Cầu đã xây hoặc đang xây.');
        if (level < 4 || !ownedAt(s.world, b.x, b.z) || !ownedAt(s.world, b.x + 5, b.z))
            return fail('Cần Nhà chính 4 và sở hữu hai đầu cầu.');
        if (!canWorkTile(s.world, b.x, b.z) && !canWorkTile(s.world, b.x + 5, b.z))
            return fail('Cần mở lối tới một đầu cầu trước.');
        const c = { coins: 100, items: { plank: 6, stone: 4 } };
        if (!afford(s, c))
            return fail('Cần 100 xu, 6 ván và 4 đá.');
        pay(s, c);
        b.readyAt = s.clock + 300000;
        return success('Đang xây cầu · 5 phút.');
    }
    if (command.type === 'buy') {
        if (!marketItems.includes(command.item) || !Number.isInteger(command.quantity) || command.quantity < 1 || command.quantity > marketStock(s, command.item) || command.epoch !== s.market.epoch)
            return fail('Lô hàng đã đổi hoặc không đủ tồn.');
        if (level < marketHome[command.item])
            return fail('Chưa mở nguyên liệu này.');
        const coins = marketPrice(command.item) * command.quantity, goods = { [command.item]: command.quantity };
        if (s.coins < coins || !room(s, goods))
            return fail('Thiếu xu hoặc kho đầy.');
        s.coins -= coins;
        add(s, goods);
        s.market.bought[command.item] = (s.market.bought[command.item] ?? 0) + command.quantity;
        return success('Đã mua vật liệu.');
    }
    if (command.type === 'speedup') {
        if (!SPEEDUPS.includes(command.minutes) || s.speedups[command.minutes] < 1)
            return fail('Không có phiếu này.');
        const e = s.entities.find(e => e.job?.id === command.targetId || e.construction?.id === command.targetId), p = s.plots.find(p => p.id === command.targetId), o = s.world.obstacles.find(o => o.id === command.targetId);
        const job = e?.construction?.id === command.targetId ? e.construction : e?.job ?? p ?? o;
        if (!job || job.readyAt === undefined || job.readyAt <= s.clock || 'waitingFor' in job && job.waitingFor)
            return fail('Chọn công việc đang chạy; phiếu chưa bị tiêu.');
        job.readyAt = Math.max(s.clock, job.readyAt - command.minutes * 60000);
        s.speedups[command.minutes]--;
        resolveJobs(s);
        return success('Đã dùng phiếu cho một công việc. Phần thời gian dư không được hoàn.');
    }
    if (command.type === 'fish') {
        if (level < 11 || !s.entities.some(e => e.asset === 'fishing_pier' && !e.construction))
            return fail('Cần cầu cảng đã xây xong.');
        if (command.round !== s.fishing.round || command.moves.length !== 6 || command.moves.some(n => !Number.isInteger(n) || n < 0 || n > 2))
            return fail('Lượt câu chưa hợp lệ.');
        const pattern = fishPuzzle(s.world.seed, s.fishing.round), score = pattern.filter((n, i) => n === command.moves[i]).length;
        s.fishing.round++;
        s.fishing.best = Math.max(s.fishing.best, score);
        if (score >= 5 && s.fishing.rewardedEpoch !== s.market.epoch) {
            if (!room(s, { fish: 1 }))
                return fail('Kho đầy; hãy giải phóng chỗ trước khi nhận cá.');
            add(s, { fish: 1 });
            s.fishing.rewardedEpoch = s.market.epoch;
            s.stats.fish++;
            return success(`Đúng ${score}/6 nhịp · +1 cá. Thưởng lại sau kỳ chợ.`);
        }
        return success(`Đúng ${score}/6 nhịp. Có thể luyện tiếp miễn phí.`);
    }
    if (command.type === 'help-seeds') {
        if (s.coins >= 3 || Object.values(s.inventory).some(n => n > 0) || s.plots.some(p => p.crop) || s.entities.some(e => e.job || Object.values(e.output).some(n => n! > 0)))
            return fail('Vẫn còn cây hoặc hàng để kiếm xu.');
        s.coins = 6;
        return success('Bà An tặng 6 xu để gieo lại.');
    }
    return fail('Thao tác chưa được hỗ trợ.');
}
