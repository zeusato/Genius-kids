import { cloneRegion, covers, footprint, limitsOf, Region, STRIDE, SIZE } from './region';

/** Regeneration keeps identity and optionally restores authored foundations and roads. */
export function regenerateTown(current: Region, generated: Region, keepBuildings: boolean): Region {
    const next = cloneRegion(generated);
    next.name = current.name; next.marker = [...current.marker]; next.thumbnail = undefined;
    next.limits = { ...limitsOf(current) }; next.graphics = current.graphics;
    next.trees = next.trees.slice(0, next.limits.trees);
    if (keepBuildings) {
        next.buildings = current.buildings.map(b => ({ ...b }));
        next.roads = current.roads.slice(); next.nextId = Math.max(current.nextId, generated.nextId);
        for (const b of next.buildings) {
            const [w, d] = footprint(b.type, b.yaw);
            for (let z = b.z * 2; z <= (b.z + d) * 2; z++) for (let x = b.x * 2; x <= (b.x + w) * 2; x++) next.height[z * STRIDE + x] = b.foundation;
        }
        next.trees = next.trees.filter(t => !next.roads[Math.floor(t.z) * SIZE + Math.floor(t.x)] && !next.buildings.some(b => covers(b, t.x, t.z)));
    }
    return next;
}

/** Whole-town creation/deletion shares the edit timeline with terrain diffs. */
export class TownHistory {
    undoStack: (Region | null)[] = []; redoStack: (Region | null)[] = [];
    record(before: Region | null) { this.undoStack.push(before ? cloneRegion(before) : null); if (this.undoStack.length > 8) this.undoStack.shift(); this.redoStack = []; }
    travel(current: Region | null, redo = false): Region | null | undefined {
        const from = redo ? this.redoStack : this.undoStack, to = redo ? this.undoStack : this.redoStack;
        if (!from.length) return undefined;
        to.push(current ? cloneRegion(current) : null);
        const result = from.pop()!;
        return result ? cloneRegion(result) : null;
    }
}
