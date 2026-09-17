import { ASSETS, CROPS, ITEMS, QUESTS, RECIPES } from './catalog';
import { boundsOf, dimensions, placementError } from './engine';
import type { FarmState } from './types';
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const known = (o: object, k: unknown): k is string => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const assert: (v: unknown, message: string) => asserts v = (v, message) => { if (!v) throw new Error(`Bản lưu không hợp lệ: ${message}`); };

/** Reject corrupt/future snapshots instead of silently replacing a player's farm. */
export function validateSnapshot(value: unknown): FarmState {
  assert(object(value), 'thiếu dữ liệu nông trại.');
  assert(value.schema === 1 && value.contentVersion === 1, 'phiên bản chưa được hỗ trợ.');
  assert(value.economy === 'local-unverified', 'đây không phải bản lưu thử nghiệm cục bộ.');
  for (const field of ['coins', 'xp', 'clock', 'lastWallTime', 'revision', 'nextId', 'orderIndex']) assert(integer(value[field], 0, field === 'clock' || field === 'lastWallTime' ? 8640000000000000 : 1000000000), `trường ${field}.`);
  assert(integer(value.expansion, 0, 2), 'diện tích đất.');
  assert(object(value.inventory) && Object.keys(value.inventory).length === Object.keys(ITEMS).length, 'kho hàng.');
  for (const key of Object.keys(ITEMS)) assert(integer(value.inventory[key], 0, 10000000), `số lượng ${key}.`);
  assert(object(value.stats), 'tiến trình mục tiêu.');
  for (const key of ['harvest', 'plant', 'produce', 'earn', 'decorate', 'upgrade', 'deliver']) assert(integer(value.stats[key], 0, 1000000000), `thống kê ${key}.`);
  assert(Array.isArray(value.claimed) && value.claimed.every(id => typeof id === 'string' && QUESTS.some(q => q.id === id)) && new Set(value.claimed).size === value.claimed.length, 'mục tiêu đã nhận.');
  assert(Array.isArray(value.entities) && value.entities.length <= 300 && Array.isArray(value.plots) && value.plots.length <= 32, 'số công trình/luống.');
  const ids = new Set<string>();
  for (const e of value.entities) {
    assert(object(e) && typeof e.id === 'string' && e.id.length < 100 && !ids.has(e.id), 'ID công trình trùng hoặc thiếu.'); ids.add(e.id);
    assert(known(ASSETS, e.asset) && integer(e.x) && integer(e.z) && integer(e.rotation, 0, 3) && integer(e.level, 1, 3), 'cấu hình công trình.');
    if (ASSETS[e.asset as keyof typeof ASSETS].kind === 'decor') assert(e.level === 1 && e.job === undefined, 'đồ trang trí không sản xuất.');
    if (e.job !== undefined) {
      assert(object(e.job) && known(RECIPES, e.job.recipe), 'công việc sản xuất.');
      const recipe = RECIPES[e.job.recipe as keyof typeof RECIPES];
      assert(recipe.building === e.asset && recipe.buildingLevel <= e.level, 'công thức sai công trình.');
      assert(integer(e.job.startedAt) && integer(e.job.readyAt) && e.job.startedAt <= (value.clock as number) && e.job.readyAt > e.job.startedAt && e.job.readyAt - e.job.startedAt <= 86400000, 'thời gian sản xuất.');
    }
  }
  for (const p of value.plots) {
    assert(object(p) && typeof p.id === 'string' && p.id.length < 100 && !ids.has(p.id), 'ID luống trùng hoặc thiếu.'); ids.add(p.id);
    assert(integer(p.x) && integer(p.z), 'vị trí luống.');
    if (p.crop !== undefined) {
      assert(known(CROPS, p.crop) && integer(p.plantedAt) && integer(p.readyAt) && p.plantedAt <= (value.clock as number) && p.readyAt >= p.plantedAt && p.readyAt - p.plantedAt <= 86400000 && typeof p.watered === 'boolean', 'cây trồng hoặc thời gian.');
    } else assert(p.readyAt === undefined && p.plantedAt === undefined && p.watered === undefined, 'luống trống còn dữ liệu vụ cũ.');
  }
  const state = structuredClone(value) as unknown as FarmState;
  const b = boundsOf(state), seen = new Set<string>();
  for (const e of state.entities) {
    const [w, d] = dimensions(e.asset, e.rotation);
    assert(!placementError(state, e.x, e.z, w, d, e.id), 'công trình chồng lấn hoặc vượt đất.');
  }
  for (const p of state.plots) {
    const key = `${p.x},${p.z}`;
    assert(p.x < b.width && p.z < b.depth && !seen.has(key), 'luống chồng lấn hoặc vượt đất.'); seen.add(key);
  }
  assert([...ids].every(id => !/^(entity|plot)-\d+$/.test(id) || Number(id.split('-')[1]) < state.nextId), 'bộ đếm ID đã được dùng.');
  return state;
}

export function parseBackup(text: string): FarmState {
  if (text.length > 1000000) throw new Error('Tệp sao lưu quá lớn.');
  const data: unknown = JSON.parse(text);
  if (!object(data) || data.format !== 'lang-mam-lab-backup') throw new Error('Hãy chọn bản sao lưu của Làng Mầm.');
  return validateSnapshot(data.state);
}
export const serializeBackup = (state: FarmState) => JSON.stringify({ format: 'lang-mam-lab-backup', state }, null, 2);
