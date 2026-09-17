import { ASSETS, CONTENT_VERSION, CROPS, ITEMS, ORDERS, QUESTS, RECIPES, levelOf, type AssetId, type ItemId } from './catalog';
import type { CommandResult, Entity, FarmCommand, FarmState, Plot, Rotation } from './types';

export const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
export const boundsOf = (s: FarmState) => ({ width: 16 + s.expansion * 4, depth: 14 + s.expansion * 3 });
export const upgradeCost = (e: Entity) => 100 * e.level;
export const expansionCost = (s: FarmState) => 250 * (s.expansion + 1);
export const dimensions = (asset: AssetId, rotation: Rotation) => {
  const a = ASSETS[asset]; return rotation % 2 ? [a.depth, a.width] : [a.width, a.depth];
};
export const progressOf = (start: number, end: number, now: number) => Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start)));
export const growthStage = (p: Plot, now: number) => !p.crop ? -1 : now >= p.readyAt! ? 4 : Math.min(3, Math.floor(progressOf(p.plantedAt!, p.readyAt!, now) * 4));

export function createFarm(now: number): FarmState {
  const clock = 600000;
  const plots: Plot[] = Array.from({ length: 8 }, (_, i) => ({ id: `plot-${i + 1}`, x: 3 + i % 4, z: 7 + Math.floor(i / 4) }));
  const starter = ['wheat', 'wheat', 'carrot', 'corn', 'pumpkin', 'carrot'] as const;
  starter.forEach((crop, i) => Object.assign(plots[i], { crop, plantedAt: clock - CROPS[crop].seconds * 1000, readyAt: clock - 1, watered: false }));
  return {
    schema: 1, contentVersion: CONTENT_VERSION, economy: 'local-unverified', revision: 0,
    coins: 180, xp: 0, clock, lastWallTime: now, nextId: 50, expansion: 0,
    inventory: { wheat: 0, carrot: 0, corn: 0, pumpkin: 0, flour: 0, bread: 0, milk: 0, cake: 0 }, plots,
    entities: [
      { id: 'mill', asset: 'mill', x: 1, z: 1, rotation: 0, level: 1 },
      { id: 'bakery', asset: 'bakery', x: 6, z: 1, rotation: 0, level: 1 },
      { id: 'barn', asset: 'barn', x: 11, z: 2, rotation: 0, level: 1 },
      { id: 'bench', asset: 'bench', x: 10, z: 8, rotation: 0, level: 1 },
      { id: 'flowers', asset: 'flowers', x: 9, z: 8, rotation: 0, level: 1 },
      { id: 'lantern', asset: 'lantern', x: 12, z: 8, rotation: 0, level: 1 },
      { id: 'fence', asset: 'fence', x: 3, z: 10, rotation: 0, level: 1 },
      { id: 'crates', asset: 'crates', x: 7, z: 5, rotation: 0, level: 1 },
    ], stats: { harvest: 0, plant: 0, produce: 0, earn: 0, decorate: 0, upgrade: 0, deliver: 0 }, claimed: [], orderIndex: 0,
  };
}

/** The game clock never goes backwards. A clock rollback is clamped and rebased. */
export function advanceTime(state: FarmState, wallTime: number): FarmState {
  if (!Number.isFinite(wallTime) || wallTime < 0) return state;
  const elapsed = Math.min(MAX_OFFLINE_MS, Math.max(0, wallTime - state.lastWallTime));
  return { ...state, clock: state.clock + elapsed, lastWallTime: wallTime };
}

function overlaps(x: number, z: number, w: number, d: number, bx: number, bz: number, bw: number, bd: number) {
  return x < bx + bw && x + w > bx && z < bz + bd && z + d > bz;
}
export function placementError(state: FarmState, x: number, z: number, w: number, d: number, ignoreId?: string): string | null {
  const b = boundsOf(state);
  if (![x, z, w, d].every(Number.isInteger) || x < 0 || z < 0 || x + w > b.width || z + d > b.depth) return 'Chọn một vị trí nằm trong phần đất đã mở.';
  for (const e of state.entities) {
    if (e.id === ignoreId) continue;
    const [ew, ed] = dimensions(e.asset, e.rotation);
    if (overlaps(x, z, w, d, e.x, e.z, ew, ed)) return 'Vị trí này đang có công trình hoặc đồ trang trí.';
  }
  if (state.plots.some(p => overlaps(x, z, w, d, p.x, p.z, 1, 1))) return 'Vị trí này đang có luống cây.';
  return null;
}
const own = (o: object, key: string) => Object.prototype.hasOwnProperty.call(o, key);
function needItems(s: FarmState, items: Partial<Record<ItemId, number>>): string | null {
  for (const [id, n] of Object.entries(items)) if (s.inventory[id as ItemId] < n!) return `Cần thêm ${n! - s.inventory[id as ItemId]} ${ITEMS[id as ItemId].name.toLowerCase()}.`;
  return null;
}
function consume(s: FarmState, items: Partial<Record<ItemId, number>>) {
  for (const [id, n] of Object.entries(items)) s.inventory[id as ItemId] -= n!;
}

/** Pure transaction: no timers, DOM, network, auth or writes. An invalid command preserves all gameplay state. */
export function execute(state: FarmState, command: FarmCommand): CommandResult {
  const s = structuredClone(state), level = levelOf(s.xp);
  const fail = (message: string): CommandResult => ({ ok: false, state, message });
  const success = (message: string): CommandResult => { s.revision++; return { ok: true, state: s, message }; };
  if (command.type === 'plant' || command.type === 'water' || command.type === 'harvest') {
    const p = s.plots.find(v => v.id === command.plotId);
    if (!p) return fail('Không tìm thấy luống cây.');
    if (command.type === 'plant') {
      if (!own(CROPS, command.crop)) return fail('Giống cây chưa có trong khu vườn.');
      const c = CROPS[command.crop];
      if (p.crop) return fail('Luống đã có cây.');
      if (level < c.level) return fail(`Giống này mở ở cấp ${c.level}.`);
      if (s.coins < c.seed) return fail('Chưa đủ xu mua hạt giống.');
      s.coins -= c.seed; p.crop = command.crop; p.plantedAt = s.clock; p.readyAt = s.clock + c.seconds * 1000; p.watered = false; s.stats.plant++;
      return success(`Đã gieo ${c.name.toLowerCase()}.`);
    }
    if (!p.crop) return fail('Luống này chưa gieo hạt.');
    if (command.type === 'water') {
      if (p.watered) return fail('Luống đã được tưới trong vụ này.');
      if (s.clock >= p.readyAt!) return fail('Cây đã chín, hãy thu hoạch.');
      p.readyAt = Math.max(s.clock, p.readyAt! - CROPS[p.crop].seconds * 100); p.watered = true;
      return success('Một chút nước, cây lớn nhanh hơn 10%.');
    }
    if (s.clock < p.readyAt!) return fail('Cây vẫn đang lớn.');
    const c = CROPS[p.crop]; s.inventory[p.crop] += c.yield; s.xp += c.xp; s.stats.harvest++;
    delete p.crop; delete p.plantedAt; delete p.readyAt; delete p.watered;
    return success(`+${c.yield} ${c.name.toLowerCase()} · +${c.xp} kinh nghiệm`);
  }
  if (command.type === 'sell') {
    if (!own(ITEMS, command.item) || !Number.isSafeInteger(command.quantity) || command.quantity < 1 || command.quantity > s.inventory[command.item]) return fail('Số lượng bán chưa hợp lệ.');
    const coins = ITEMS[command.item].sell * command.quantity;
    s.inventory[command.item] -= command.quantity; s.coins += coins; s.stats.earn += coins;
    return success(`Đã bán cho cửa hàng · +${coins} xu`);
  }
  if (command.type === 'produce' || command.type === 'collect' || command.type === 'upgrade') {
    const e = s.entities.find(v => v.id === command.entityId);
    if (!e || ASSETS[e.asset].kind !== 'building') return fail('Không tìm thấy công trình sản xuất.');
    if (command.type === 'produce') {
      if (!own(RECIPES, command.recipe)) return fail('Công thức chưa có.');
      const r = RECIPES[command.recipe];
      if (e.asset !== r.building || e.level < r.buildingLevel) return fail('Công trình chưa mở công thức này.');
      if (e.job) return fail('Hãy nhận mẻ trước rồi bắt đầu mẻ mới.');
      const missing = needItems(s, r.inputs); if (missing) return fail(missing);
      consume(s, r.inputs);
      e.job = { recipe: command.recipe, startedAt: s.clock, readyAt: s.clock + Math.round(r.seconds * 1000 * (1 - (e.level - 1) * .15)) };
      return success(e.asset === 'barn' ? 'Mây đang ăn ngô. Sữa sẽ sẵn sàng một lát nữa.' : 'Một mẻ mới đã bắt đầu.');
    }
    if (command.type === 'collect') {
      if (!e.job || e.job.readyAt > s.clock) return fail('Chưa có sản phẩm để nhận.');
      const r = RECIPES[e.job.recipe]; s.inventory[r.output] += r.quantity; s.xp += r.xp; s.stats.produce++; delete e.job;
      return success(`+${r.quantity} ${ITEMS[r.output].name.toLowerCase()} · +${r.xp} kinh nghiệm`);
    }
    if (e.level >= 3) return fail('Công trình đã đạt cấp cao nhất của bản thử.');
    if (level < e.level + 1) return fail(`Nâng cấp mở ở cấp nông trại ${e.level + 1}.`);
    if (s.coins < upgradeCost(e)) return fail('Chưa đủ xu nâng cấp.');
    s.coins -= upgradeCost(e); e.level++; s.stats.upgrade++;
    return success(`Công trình đã lên cấp ${e.level}. Các mẻ mới sẽ nhanh hơn.`);
  }
  if (command.type === 'build' || command.type === 'move') {
    const e = command.type === 'move' ? s.entities.find(v => v.id === command.entityId) : null;
    if (command.type === 'move' && !e) return fail('Không tìm thấy đồ vật cần chuyển.');
    const id = command.type === 'build' ? command.asset : e!.asset;
    if (!own(ASSETS, id) || ![0, 1, 2, 3].includes(command.rotation)) return fail('Mẫu hoặc hướng đặt chưa hợp lệ.');
    const a = ASSETS[id], [w, d] = dimensions(id, command.rotation);
    const error = placementError(s, command.x, command.z, w, d, e?.id); if (error) return fail(error);
    if (command.type === 'build') {
      if (s.entities.length >= 300) return fail('Bản thử hỗ trợ tối đa 300 công trình và đồ trang trí.');
      if (level < a.level) return fail(`Mẫu này mở ở cấp ${a.level}.`);
      if (s.coins < a.price) return fail('Chưa đủ xu mua đồ.');
      s.coins -= a.price;
      s.entities.push({ id: `entity-${s.nextId++}`, asset: id, x: command.x, z: command.z, rotation: command.rotation, level: 1 });
      if (a.kind === 'decor') s.stats.decorate++;
    } else Object.assign(e!, { x: command.x, z: command.z, rotation: command.rotation });
    return success(command.type === 'move' ? 'Đã chuyển đến góc mới.' : `Đã đặt ${a.name.toLowerCase()}.`);
  }
  if (command.type === 'dig') {
    if (s.plots.length >= 32) return fail('Bản thử hỗ trợ tối đa 32 luống.');
    const error = placementError(s, command.x, command.z, 1, 1); if (error) return fail(error);
    if (s.coins < 15) return fail('Cần 15 xu để làm một luống mới.');
    s.coins -= 15; s.plots.push({ id: `plot-${s.nextId++}`, x: command.x, z: command.z });
    return success('Một luống đất mới đang chờ hạt giống.');
  }
  if (command.type === 'claim') {
    const q = QUESTS.find(v => v.id === command.questId);
    if (!q || s.claimed.includes(q.id) || s.stats[q.stat] < q.target) return fail('Mục tiêu chưa hoàn thành hoặc đã nhận thưởng.');
    s.claimed.push(q.id); s.coins += q.coins; s.xp += q.xp;
    return success(`Hoàn thành “${q.name}” · +${q.coins} xu`);
  }
  if (command.type === 'deliver') {
    const order = ORDERS[s.orderIndex % ORDERS.length];
    const missing = needItems(s, order.need); if (missing) return fail(missing);
    consume(s, order.need); s.coins += order.coins; s.xp += order.xp; s.stats.earn += order.coins; s.stats.deliver++; s.orderIndex++;
    return success(`${order.person} đã nhận hàng · +${order.coins} xu`);
  }
  if (command.type === 'expand') {
    if (s.expansion >= 2) return fail('Đã mở hết đất của bản thử.');
    if (level < 3 + s.expansion * 2) return fail(`Mở đất ở cấp ${3 + s.expansion * 2}.`);
    if (s.coins < expansionCost(s)) return fail('Chưa đủ xu mở đất.');
    s.coins -= expansionCost(s); s.expansion++;
    return success('Thêm một khoảng trời cho nông trại!');
  }
  if (command.type === 'help-seeds') {
    if (s.coins >= 3 || Object.values(s.inventory).some(n => n > 0) || s.plots.some(p => p.crop) || s.entities.some(e => e.job)) return fail('Vườn vẫn còn hàng hoặc cây để tiếp tục kiếm xu.');
    s.coins = 6; return success('Bà An tặng 6 xu để gieo lại hai luống lúa mì.');
  }
  return fail('Thao tác chưa được hỗ trợ.');
}
