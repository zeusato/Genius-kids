import { ASSETS, RECIPES, type BuildingId, type ItemId } from './catalog';
import { HOME_LEVELS, homeLevel } from './progression';
import type { FarmState } from './types';

export type BuildingStep = { asset: BuildingId; level: number; entityId?: string; action: 'build' | 'upgrade' | 'wait' | 'open' };
/** Resolve the first actionable prerequisite, never skipping a Home unlock. */
export function buildingStep(s: FarmState, asset: BuildingId, level = 1): BuildingStep {
    const home = homeLevel(s), entity = s.entities.find(e => e.asset === asset && !e.stored);
    if (asset !== 'home' && home < Math.max(ASSETS[asset].level, level)) return buildingStep(s, 'home', Math.max(ASSETS[asset].level, level));
    if (!entity) return { asset, level, action: 'build' };
    if (entity.construction) return { asset, level, entityId: entity.id, action: 'wait' };
    if (entity.level >= level) return { asset, level, entityId: entity.id, action: 'open' };
    if (asset === 'home') {
        for (const req of HOME_LEVELS[home]?.requires ?? []) {
            if (!s.entities.some(e => e.asset === req.building && e.level >= req.level && !e.construction?.newBuilding))
                return buildingStep(s, req.building as BuildingId, req.level);
        }
    }
    return { asset, level: Math.min(level, entity.level + 1), entityId: entity.id, action: 'upgrade' };
}
export function productBuilding(item: ItemId) {
    const recipe = Object.values(RECIPES).find(r => r.output === item);
    return recipe ? { asset: recipe.building, level: recipe.buildingLevel } : null;
}
