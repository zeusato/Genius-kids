import { ITEMS, type ItemId } from './catalog';
import { outputCap } from './progression';
import type { FarmState } from './types';
import { copyFarm } from './copy';
import { recoverEnergy, regrowResources, REGROWTH_SLOT_MS } from './harvesting';
/** Resolve finite, reserved work chronologically. No production is invented for idle time. */
export function resolveJobs(s: FarmState): FarmState {
    for (const e of s.entities) {
        for (let step = 0; step < 16; step++) {
            if (e.construction && !e.construction.waitingFor && e.construction.readyAt <= s.clock) {
                const finish = e.construction.readyAt;
                e.level = e.construction.target;
                delete e.construction;
                s.stats.upgrade++;
                const next = e.queue.shift();
                if (next) {
                    next.startedAt = finish;
                    next.readyAt = finish + next.duration;
                    e.job = next;
                }
                continue;
            }
            if (e.construction && !e.construction.waitingFor)
                break;
            if (!e.job || e.job.readyAt > s.clock)
                break;
            const job = e.job, used = Object.values(e.output).reduce((a, b) => a + (b ?? 0), 0);
            if (used + job.quantity > outputCap(e))
                break;
            e.output[job.output] = (e.output[job.output] ?? 0) + job.quantity;
            s.produced[job.output] = (s.produced[job.output] ?? 0) + job.quantity;
            s.stats.produce++;
            s.xp += job.xp;
            if (!s.discovered.includes(job.output))
                s.discovered.push(job.output);
            delete e.job;
            if (e.construction?.waitingFor === job.id) {
                delete e.construction.waitingFor;
                e.construction.startedAt = job.readyAt;
                e.construction.readyAt = job.readyAt + e.construction.duration;
                continue;
            }
            const next = e.queue.shift();
            if (next) {
                next.startedAt = job.readyAt;
                next.readyAt = next.startedAt + next.duration;
                e.job = next;
            }
        }
        // Resuming after construction uses its finish time, not the time the tab reopened.
    }
    for (const b of s.world.bridges)
        if (b.readyAt !== undefined && b.readyAt <= s.clock) {
            b.built = true;
            delete b.readyAt;
        }
    return s;
}
export function advanceTime(state: FarmState, wallTime: number): FarmState {
    if (!Number.isFinite(wallTime) || wallTime < 0)
        return state;
    const elapsed = Math.max(0, Math.floor(wallTime) - state.lastWallTime);
    const s = copyFarm(state, state.world.bridges.some(b => b.readyAt !== undefined) || Math.floor((state.clock + elapsed) / REGROWTH_SLOT_MS) > state.regrowth.slot);
    s.clock += elapsed;
    s.lastWallTime = Math.max(s.lastWallTime, Math.floor(wallTime));
    const epoch = Math.floor(s.clock / (4 * 3600000));
    if (epoch > s.market.epoch)
        s.market = { epoch, bought: {} };
    resolveJobs(s);
    recoverEnergy(s);
    regrowResources(s);
    return s;
}
export const marketItems: ItemId[] = ['wood', 'stone', 'ore', 'clay', 'sand', 'plank', 'iron', 'tools'];
export const marketHome: Record<string, number> = { wood: 1, stone: 1, ore: 4, clay: 3, sand: 5, plank: 3, iron: 5, tools: 8 };
export const marketPrice = (id: ItemId) => ITEMS[id].sell * 4;
export const marketStock = (s: FarmState, id: ItemId) => Math.max(0, (id === 'wood' || id === 'stone' ? 30 : 12) - (s.market.bought[id] ?? 0));
export function fishPuzzle(seed: number, round: number) { return Array.from({ length: 6 }, (_, i) => (Math.imul(seed + round * 17 + i * 13, 2654435761) >>> 0) % 3); }
