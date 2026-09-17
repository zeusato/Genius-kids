import { describe, expect, it } from 'vitest';
import { ASSETS, CROPS, ITEMS, QUESTS, type AssetId } from '../src/core/catalog';
import { advanceTime, createFarm, dimensions, execute, growthStage, MAX_OFFLINE_MS, placementError } from '../src/core/engine';
import { parseBackup, serializeBackup, validateSnapshot } from '../src/core/validation';
import type { FarmCommand, FarmState } from '../src/core/types';
const now = 1800000000000;
function command(state: FarmState, input: FarmCommand) { const r = execute(state, input); expect(r.ok, r.message).toBe(true); validateSnapshot(r.state); return r.state; }

describe('isolated farming economy', () => {
  it('starts with a valid local-only garden and distinct starter gifts', () => {
    const s = validateSnapshot(createFarm(now)); expect(s.economy).toBe('local-unverified');
    expect(s.plots.filter(p => growthStage(p, s.clock) === 4)).toHaveLength(6);
  });
  it('harvests once; a repeat cannot duplicate inventory or XP', () => {
    const a = createFarm(now), before = structuredClone(a), b = command(a, { type: 'harvest', plotId: 'plot-1' });
    expect(a).toEqual(before); expect(b.inventory.wheat).toBe(3); expect(b.xp).toBe(5);
    const repeat = execute(b, { type: 'harvest', plotId: 'plot-1' }); expect(repeat.ok).toBe(false); expect(repeat.state).toEqual(b);
  });
  it('debits seeds once and refuses planting on occupied/locked plots', () => {
    const a = createFarm(now), b = command(a, { type: 'plant', plotId: 'plot-7', crop: 'wheat' });
    expect(b.coins).toBe(a.coins - CROPS.wheat.seed);
    expect(execute(b, { type: 'plant', plotId: 'plot-7', crop: 'wheat' }).ok).toBe(false);
    expect(execute(a, { type: 'plant', plotId: 'plot-8', crop: 'pumpkin' }).ok).toBe(false);
  });
  it('waters once per crop and never lets early harvest through', () => {
    let s = command(createFarm(now), { type: 'plant', plotId: 'plot-7', crop: 'wheat' });
    const end = s.plots[6].readyAt!; s = command(s, { type: 'water', plotId: 'plot-7' });
    expect(s.plots[6].readyAt).toBe(end - 3500);
    expect(execute(s, { type: 'water', plotId: 'plot-7' }).ok).toBe(false);
    expect(execute(s, { type: 'harvest', plotId: 'plot-7' }).ok).toBe(false);
    s = advanceTime(s, now + 31500); expect(execute(s, { type: 'harvest', plotId: 'plot-7' }).ok).toBe(true);
  });
  it('a crop transitions through five stages using saved time', () => {
    const s = command(createFarm(now), { type: 'plant', plotId: 'plot-7', crop: 'wheat' }), p = s.plots[6];
    expect([0, .26, .51, .76, 1].map(v => growthStage(p, p.plantedAt! + v * 35000))).toEqual([0, 1, 2, 3, 4]);
  });
  it.each([0, -1, .5, NaN, Infinity, 9999])('rejects invalid sell quantity %s atomically', quantity => {
    const s = createFarm(now); s.inventory.wheat = 3;
    const result = execute(s, { type: 'sell', item: 'wheat', quantity }); expect(result.ok).toBe(false); expect(result.state).toEqual(s);
  });
  it('produces a complete wheat → flour → bread chain without repeat collection', () => {
    let s = createFarm(now); s.inventory.wheat = 4;
    for (let i = 0; i < 2; i++) {
      s = command(s, { type: 'produce', entityId: 'mill', recipe: 'flour' });
      expect(execute(s, { type: 'produce', entityId: 'mill', recipe: 'flour' }).ok).toBe(false);
      expect(execute(s, { type: 'collect', entityId: 'mill' }).ok).toBe(false);
      s = advanceTime(s, s.lastWallTime + 30000); s = command(s, { type: 'collect', entityId: 'mill' });
    }
    expect(s.inventory).toMatchObject({ wheat: 0, flour: 2 });
    s = command(s, { type: 'produce', entityId: 'bakery', recipe: 'bread' });
    expect(s.inventory.flour).toBe(0); s = advanceTime(s, s.lastWallTime + 50000);
    s = command(s, { type: 'collect', entityId: 'bakery' });
    expect(s.inventory.bread).toBe(1); expect(execute(s, { type: 'collect', entityId: 'bakery' }).ok).toBe(false);
    s = command(s, { type: 'sell', item: 'bread', quantity: 1 }); expect(s.coins).toBe(180 + ITEMS.bread.sell);
  });
  it('reserves animal feed immediately, with finite offline output', () => {
    let s = createFarm(now); s.inventory.corn = 2;
    s = command(s, { type: 'produce', entityId: 'barn', recipe: 'milk' }); expect(s.inventory.corn).toBe(0);
    s = advanceTime(s, now + 7 * MAX_OFFLINE_MS); s = command(s, { type: 'collect', entityId: 'barn' });
    expect(s.inventory.milk).toBe(2); expect(s.entities.find(e => e.id === 'barn')!.job).toBeUndefined();
  });
  it('wrong station and missing inputs never consume any resources', () => {
    const s = createFarm(now); s.inventory.flour = 1;
    for (const input of [{ type: 'produce', entityId: 'mill', recipe: 'bread' }, { type: 'produce', entityId: 'bakery', recipe: 'bread' }] as FarmCommand[]) {
      const r = execute(s, input); expect(r.ok).toBe(false); expect(r.state).toEqual(s);
    }
  });
  it('upgrades visibly while preserving a running job and its deadline', () => {
    let s = createFarm(now); s.xp = 100; s.inventory.flour = 2;
    s = command(s, { type: 'produce', entityId: 'bakery', recipe: 'bread' });
    const deadline = s.entities[1].job!.readyAt; s = command(s, { type: 'upgrade', entityId: 'bakery' });
    expect(s.entities[1].level).toBe(2); expect(s.entities[1].job!.readyAt).toBe(deadline); expect(s.coins).toBe(80);
  });
  it('claims a quest reward once and consumes order goods atomically', () => {
    let s = createFarm(now); s.stats.harvest = 3; s.inventory.carrot = 3;
    s = command(s, { type: 'claim', questId: QUESTS[0].id }); expect(s.coins).toBe(220);
    expect(execute(s, { type: 'claim', questId: QUESTS[0].id }).ok).toBe(false);
    s = command(s, { type: 'deliver' }); expect(s.inventory.carrot).toBe(0); expect(s.orderIndex).toBe(1);
    expect(execute(s, { type: 'deliver' }).ok).toBe(false);
  });
  it('has an escape from a genuinely empty wallet, without a free-coin loop', () => {
    const s = createFarm(now); s.coins = 0; s.plots = s.plots.map(p => ({ id: p.id, x: p.x, z: p.z }));
    const next = command(s, { type: 'help-seeds' }); expect(next.coins).toBe(6);
    expect(execute(next, { type: 'help-seeds' }).ok).toBe(false);
    s.inventory.milk = 1; expect(execute(s, { type: 'help-seeds' }).ok).toBe(false);
  });
});

describe('land and layout', () => {
  it('accounts for rotated rectangular footprints and bounds', () => {
    const s = createFarm(now); expect(dimensions('barn', 1)).toEqual([3, 4]);
    expect(placementError(s, 14, 12, 3, 4)).not.toBeNull();
    expect(placementError(s, 6, 1, 3, 3)).not.toBeNull();
    expect(placementError(s, 3, 7, 1, 1)).not.toBeNull();
    expect(placementError(s, 0, 11, 2, 1)).toBeNull();
  });
  it('does not charge for failed placement and charges once for accepted decor', () => {
    const s = createFarm(now), failed = execute(s, { type: 'build', asset: 'flowers', x: 3, z: 7, rotation: 0 });
    expect(failed.ok).toBe(false); expect(failed.state).toEqual(s);
    const built = command(s, { type: 'build', asset: 'flowers', x: 0, z: 11, rotation: 0 });
    expect(built.coins).toBe(s.coins - ASSETS.flowers.price); expect(built.stats.decorate).toBe(1);
  });
  it('moves and rotates a busy barn without resetting production or spending coins', () => {
    let s = createFarm(now); s.inventory.corn = 2;
    s = command(s, { type: 'produce', entityId: 'barn', recipe: 'milk' }); const job = s.entities[2].job;
    s = command(s, { type: 'move', entityId: 'barn', x: 13, z: 9, rotation: 1 });
    expect(s.entities[2].job).toEqual(job); expect(s.coins).toBe(180);
  });
  it('expands land without moving existing objects', () => {
    const s = createFarm(now); s.coins = 1000; s.xp = 100;
    const n = command(s, { type: 'expand' }); expect(n.expansion).toBe(1); expect(n.entities).toEqual(s.entities); expect(n.plots).toEqual(s.plots);
  });
  it('makes a new plot once and blocks overlapping digging', () => {
    const s = command(createFarm(now), { type: 'dig', x: 1, z: 11 });
    expect(s.plots).toHaveLength(9); expect(execute(s, { type: 'dig', x: 1, z: 11 }).ok).toBe(false);
  });
});

describe('time and saved data', () => {
  it('caps elapsed time and rebases after rollback instead of reversing progress', () => {
    const s = createFarm(now), future = advanceTime(s, now + MAX_OFFLINE_MS * 7);
    expect(future.clock - s.clock).toBe(MAX_OFFLINE_MS);
    const back = advanceTime(s, now - 1000); expect(back.clock).toBe(s.clock);
    expect(advanceTime(back, now).clock).toBe(s.clock + 1000);
    expect(advanceTime(s, NaN)).toEqual(s);
  });
  it('roundtrips backup, rejects future schema, negative money, corrupt times and overlap', () => {
    const s = createFarm(now); expect(parseBackup(serializeBackup(s))).toEqual(s);
    for (const bad of [{ ...s, schema: 2 }, { ...s, coins: -1 }, { ...s, economy: 'online' }, { ...s, nextId: 3 }, { ...s, inventory: {} }]) expect(() => validateSnapshot(bad)).toThrow();
    const overlap = structuredClone(s); overlap.entities[0].x = 3; overlap.entities[0].z = 7; expect(() => validateSnapshot(overlap)).toThrow();
    const duplicate = structuredClone(s); duplicate.plots[1].x = duplicate.plots[0].x; expect(() => validateSnapshot(duplicate)).toThrow();
    const times = structuredClone(s); times.plots[0].readyAt = -1; expect(() => validateSnapshot(times)).toThrow();
  });
  it('rejects unknown catalog keys including inherited object properties', () => {
    const s = createFarm(now);
    expect(execute(s, { type: 'build', asset: 'toString' as AssetId, x: 0, z: 12, rotation: 0 }).ok).toBe(false);
    expect(() => parseBackup('{"format":"different-game"}')).toThrow();
  });
});
