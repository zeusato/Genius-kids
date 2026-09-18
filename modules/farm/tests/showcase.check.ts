import { describe, expect, it } from 'vitest';
import { showcaseFarm } from '../src/dev/fixtures';
import { validateSnapshot } from '../src/core/validation';
import { ASSETS } from '../src/core/catalog';
import { dimensions } from '../src/core/engine';
describe('developer showcase is distinct from the new-player garden', () => {
    it('starts with just Home, storage and eight plots', () => {
        const s = showcaseFarm(1, 1800000000000);
        expect(s.entities.map(e => e.asset)).toEqual(['home', 'warehouse']);
        expect(s.plots).toHaveLength(8); expect(s.coins).toBe(180);
        expect(() => validateSnapshot(s)).not.toThrow();
    });
    it('exhibits every building with circulation space and four distinct crop fields', () => {
        const s = showcaseFarm(25, 1800000000000);
        expect(() => validateSnapshot(s)).not.toThrow();
        const buildings = s.entities.filter(e => ASSETS[e.asset].kind === 'building');
        expect(buildings).toHaveLength(29); expect(s.plots).toHaveLength(120);
        for (let i = 0; i < buildings.length; i++) for (let j = i + 1; j < buildings.length; j++) {
            const a = buildings[i], b = buildings[j], [aw, ad] = dimensions(a.asset, a.rotation), [bw, bd] = dimensions(b.asset, b.rotation);
            expect(a.x + aw + 1 <= b.x || b.x + bw + 1 <= a.x || a.z + ad + 1 <= b.z || b.z + bd + 1 <= a.z, `${a.asset}/${b.asset}`).toBe(true);
        }
    });
});
