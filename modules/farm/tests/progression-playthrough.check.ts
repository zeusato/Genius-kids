import {fileURLToPath} from 'node:url';
const reportDirectory=fileURLToPath(new URL('../reports/',import.meta.url));
import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createFarm, execute, advanceTime, dimensions, placementError } from '../src/core/engine';
import { ASSETS, CROPS, RECIPES, ITEMS, type AssetId, type ItemId, type RecipeId, type CropId } from '../src/core/catalog';
import { CHAPTER_PRODUCTS, chapterReady, HOME_LEVELS, homeLevel, upgradePrice, plotCap, storageCap, usedStorage, queueCap, outputCap } from '../src/core/progression';
import { generateWorld, ownedAt, canWorkTile } from '../src/core/world';
import { ENERGY_POINT_MS, resourceHome, resourcePayment, resourceTier, RESOURCE_TIERS } from '../src/core/harvesting';
import { marketStock, marketPrice } from '../src/core/simulation';
import { buildPrice } from '../src/core/construction';
import { validateSnapshot } from '../src/core/validation';
import type { FarmCommand, FarmState, Entity } from '../src/core/types';
/** A legal-command player: no grants, no speedups, no trading, no edits to saved balances. */
class Player {
    s: FarmState;
    actions = 0;
    days = 0;
    activeMs = 0;
    waitMs = 0;
    milestones: {
        home: number;
        days: number;
        actions: number;
    }[] = [];
    constructor(seed: number, readonly minutes: number) { this.s = createFarm(1800000000000, seed); }
    do(c: FarmCommand) { const r = execute(this.s, c); if (!r.ok)
        throw new Error(`${c.type}: ${r.message} (H${homeLevel(this.s)} coins ${this.s.coins} storage ${usedStorage(this.s)}/${storageCap(this.s)})`); this.s = r.state; this.actions++; this.tick(2000); this.activeMs += 2000; if (this.activeMs >= this.minutes * 60000) {
        this.tick(86400000 - this.activeMs);
        this.activeMs = 0;
        this.days++;
    } if (this.actions > 200000)
        throw new Error('Action budget exceeded'); }
    tick(ms: number) { this.waitMs += ms; this.s = advanceTime(this.s, this.s.lastWallTime + Math.max(1, ms)); }
    wait(ms: number) { if (ms <= 0)
        return; const available = this.minutes * 60000 - this.activeMs; if (ms <= available) {
        this.activeMs += ms;
        this.tick(ms);
    }
    else {
        const elapsed = 86400000 - this.activeMs;
        this.tick(elapsed);
        this.activeMs = 0;
        this.days++;
        if (ms > elapsed)
            this.wait(ms - elapsed);
    } }
    entity(id: AssetId) { return this.s.entities.find(e => e.asset === id)!; }
    plot() { const p = this.s.plots.find(p => !p.crop); return p ?? this.s.plots[0]; }
    harvest() {
        const plots=this.s.plots.filter(p=>p.crop&&p.readyAt!<=this.s.clock);
        if(!plots.length)return;
        const quantity=plots.reduce((n,p)=>n+CROPS[p.crop!].yield,0);
        while(usedStorage(this.s)+quantity>storageCap(this.s))this.sellExcess();
        this.do({type:'batch',action:'harvest',crop:'wheat',plotIds:plots.map(p=>p.id),expectedRevision:this.s.revision});
    }
    sellExcess() { const item = (Object.keys(ITEMS) as ItemId[]).filter(id => this.s.inventory[id] > 100).sort((a, b) => this.s.inventory[b] - this.s.inventory[a])[0]; if (item)
        this.do({ type: 'sell', item, quantity: this.s.inventory[item] - 40 });
    else
        throw new Error('Storage deadlock'); }
    money(amount: number) { while (this.s.coins < amount) {
        this.harvest();
        const crop = 'carrot';
        if (this.s.inventory[crop] > 0)
            this.do({ type: 'sell', item: crop, quantity: this.s.inventory[crop] });
        if (this.s.coins >= amount)
            break;
        for (const p of this.s.plots.filter(p => !p.crop)) {
            if (this.s.coins < 5) {
                const sale = (Object.keys(ITEMS) as ItemId[]).find(id => this.s.inventory[id] > 0);
                if (sale)
                    this.do({ type: 'sell', item: sale, quantity: Math.min(this.s.inventory[sale], 5) });
                else if (this.s.coins < 3 && !this.s.plots.some(p => p.crop))
                    this.do({ type: 'help-seeds' });
                else
                    break;
            }
            this.do({ type: 'plant', plotId: p.id, crop });
        }
        const ready = Math.min(...this.s.plots.filter(p => p.crop).map(p => p.readyAt!));
        if (!Number.isFinite(ready))
            throw new Error('No way to earn seed money');
        this.wait(ready - this.s.clock);
    } }
    crop(id: CropId, n: number) { while (this.s.inventory[id] < n) {
        this.harvest();
        if (this.s.inventory[id] >= n)
            break;
        this.money(CROPS[id].seed);
        const p = this.plot();
        if (p.crop) {
            this.wait(p.readyAt! - this.s.clock);
            this.harvest();
            continue;
        }
        this.do({ type: 'plant', plotId: p.id, crop: id });
        this.wait(CROPS[id].seconds * 1000);
    } }
    items(need: Partial<Record<ItemId, number>>) { for (let pass = 0; pass < 20; pass++) {
        for (const [id, n] of Object.entries(need).sort(([a], [b]) => Number(a === 'tools') - Number(b === 'tools')))
            this.item(id as ItemId, n!);
        if (Object.entries(need).every(([id, n]) => this.s.inventory[id as ItemId] >= n!))
            return;
    } throw new Error('Material dependency did not settle'); }
    item(id: ItemId, n: number) {
        if (this.s.inventory[id] >= n)
            return;
        if (id in CROPS) {
            this.crop(id as CropId, n);
            return;
        }
        if (id === 'wood' || id === 'stone') {
            while (this.s.inventory[id] < n) {
                const o = this.s.world.obstacles.filter(o => !o.cleared && o.kind === (id === 'wood' ? 'tree' : 'rock') && ownedAt(this.s.world, o.x, o.z) && resourceHome(this.s.world, o) <= homeLevel(this.s)).sort((a, b) => resourceTier(this.s.world, a) - resourceTier(this.s.world, b)).find(o => canWorkTile(this.s.world, o.x, o.z));
                // Preserve tools earmarked for construction; the legal finite
                // NPC market is the fallback once local resources run out.
                if (o && this.s.inventory.tools === 0) {
                    const cost = resourcePayment(this.s, o), spec = RESOURCE_TIERS[resourceTier(this.s.world, o)];
                    if (this.s.energy.value < cost.energy) this.wait((cost.energy - this.s.energy.value) * ENERGY_POINT_MS);
                    while (usedStorage(this.s) + spec.max + 4 > storageCap(this.s)) this.sellExcess();
                    this.do({ type: 'clear', obstacleId: o.id, generation: o.generation ?? 0 });
                } else {
                    const available = marketStock(this.s, id);
                    if (!available) { this.wait(14400000 - this.s.clock % 14400000); continue; }
                    const quantity = Math.min(available, n - this.s.inventory[id]);
                    this.money(quantity * marketPrice(id));
                    while (usedStorage(this.s) + quantity > storageCap(this.s)) this.sellExcess();
                    this.do({ type: 'buy', item: id, quantity, epoch: this.s.market.epoch });
                }
            }
            return;
        }
        const found = (Object.entries(RECIPES) as [
            RecipeId,
            typeof RECIPES[RecipeId]
        ][]).find(([, r]) => r.output === id && r.home <= homeLevel(this.s));
        if (!found)
            throw new Error(`No source for ${id} at home ${homeLevel(this.s)}`);
        const [key, r] = found;
        this.build(r.building);
        this.upgrade(r.building, r.buildingLevel);
        while (this.s.inventory[id] < n) {
            const e = this.entity(r.building);
            const maxOutput=r.quantity+(['wood','stone','ore'].includes(r.output)?2:0);
            const batches=Math.max(1,Math.min(Math.ceil((n-this.s.inventory[id])/r.quantity),queueCap(e),Math.floor(outputCap(e)/maxOutput)));
            this.items(Object.fromEntries(Object.entries(r.inputs).map(([id,n])=>[id,n*batches])));
            this.do({ type: 'produce', entityId: e.id, recipe: key,quantity:batches });
            if (this.entity(r.building).job)
                this.wait(this.entity(r.building).job!.readyAt - this.s.clock+this.entity(r.building).queue.reduce((n,j)=>n+j.duration,0));
            const out = this.entity(r.building).output;
            if (!Object.values(out).length) {
                this.tick(1);
            }
            this.do({ type: 'collect', entityId: e.id });
        }
    }
    build(asset: AssetId) { if (this.entity(asset))
        return;
        const price = buildPrice(asset);
        for (let pass = 0; pass < 20; pass++) {
            this.money(price.coins + 100);
            this.items(price.items);
            if (this.s.coins >= price.coins) break;
        }
        const [w, d] = dimensions(asset, 0); let spot: {
        x: number;
        z: number;
    } | undefined; for (let z = 0; z < 24 && !spot; z++)
        for (let x = 0; x < 24 && !spot; x++)
            if (!placementError(this.s, x, z, w, d, undefined, asset))
                spot = { x, z }; if (!spot)
        throw new Error(`No room for ${asset}`); this.do({ type: 'build', asset, ...spot, rotation: 0 }); if (this.entity(asset).construction)
        this.wait(this.entity(asset).construction!.readyAt - this.s.clock); }
    upgrade(asset: AssetId, target: number) { this.build(asset); while (this.entity(asset).level < target) {
        if (this.entity(asset).construction) {
            this.wait(this.entity(asset).construction!.readyAt - this.s.clock);
            continue;
        }
        const e = this.entity(asset), price = upgradePrice(e);
        for (let pass = 0; pass < 20; pass++) {
            this.money(price.coins + 100);
            this.items(price.items);
            if (this.s.coins >= price.coins)
                break;
        }
        this.do({ type: 'upgrade', entityId: e.id });
        if (this.entity(asset).construction)
            this.wait(this.entity(asset).construction!.readyAt - this.s.clock);
    } }
    story() { for (let n = 1; n <= 25; n++) {
        while (this.s.stats.harvest < n * 3) {
            this.money(this.s.coins + 100);
        }
        const item = CHAPTER_PRODUCTS[n - 1];
        if (item)
            this.item(item, 1);
        if (!chapterReady(this.s, n) && item) {
            this.s.inventory[item] > 0 && this.do({ type: 'sell', item, quantity: this.s.inventory[item] });
            this.item(item, 1);
        }
        this.do({ type: 'chapter', chapter: n });
    } expect(this.s.claimed.filter(id => id.startsWith('chapter:'))).toHaveLength(25); }
    run(target = 25) { for (let n = 2; n <= target; n++) {
        for (const req of HOME_LEVELS[n - 1].requires)
            this.upgrade(req.building as AssetId, req.level);
        this.upgrade('home', n);
        validateSnapshot(this.s);
        this.milestones.push({ home: n, days: this.days, actions: this.actions });
        mkdirSync(reportDirectory, { recursive: true });
        writeFileSync(reportDirectory+'/solo-progress.json', JSON.stringify({ seed: this.s.world.seed, minutes: this.minutes, milestones: this.milestones }));
    } return { seed: this.s.world.seed, biome: this.s.world.biome, minutes: this.minutes, days: this.days, actions: this.actions, waitDays: Math.round(this.waitMs / 86400000 * 10) / 10, milestones: this.milestones }; }
}
describe('legal solo progression', () => {
    it('reaches Home 25 in every resource biome without injected money, materials or speedups', () => {
        const reports = [];
        const seeds = new Map<string, number>();
        for (let seed = 0; seeds.size < 3; seed++)
            seeds.set(generateWorld(seed).biome, seed);
        for (const seed of seeds.values())
            for (const minutes of [5, 15, 30]) {
                const p = new Player(seed, minutes), r = p.run();
                reports.push(r);
                expect(homeLevel(p.s)).toBe(25);
                expect(p.s.speedups).toEqual({ 5: 1, 10: 0, 30: 0, 60: 0 });
                if (minutes === 15 && p.s.world.biome === 'forest')
                    p.story();
            }
        mkdirSync(reportDirectory, { recursive: true });
        writeFileSync(reportDirectory+'/solo-progression.json', JSON.stringify(reports, null, 2));
    // Nine full playthroughs execute hundreds of thousands of legal commands. Allow slower
    // development machines to complete; the per-player 200000-action deadlock guard remains.
    }, 600000);
});

