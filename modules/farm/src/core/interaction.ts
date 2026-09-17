import { execute } from './engine';
import type { CropId } from './catalog';
import type { FarmState } from './types';
export type Tool = 'select' | 'plant' | 'water' | 'harvest' | 'arrange' | 'clear';
export function previewStroke(state: FarmState, action: 'plant' | 'water' | 'harvest', crop: CropId, ids: string[]) {
    let s = state;
    const accepted: string[] = [], skipped: {
        id: string;
        reason: string;
    }[] = [];
    for (const id of new Set(ids)) {
        const r = execute(s, action === 'plant' ? { type: 'plant', plotId: id, crop } : { type: action, plotId: id });
        if (r.ok) {
            accepted.push(id);
            s = r.state;
        }
        else
            skipped.push({ id, reason: r.message });
    }
    return { accepted, skipped, cost: state.coins - s.coins, quantity: Object.values(s.inventory).reduce((a, b) => a + b, 0) - Object.values(state.inventory).reduce((a, b) => a + b, 0) };
}
