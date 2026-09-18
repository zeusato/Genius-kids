import { describe, it, expect } from 'vitest';
import { createFarm, execute } from '../src/core/engine';
import { ROAD_DIRECTIONS, roadConnections } from '../src/core/roads';
import { roadGeometry } from '../src/render/roadGeometry';
import type { FarmCommand, FarmState, Entity } from '../src/core/types';
const road = (id: string, x: number, z: number): Entity => ({ id, asset: 'path', x, z, level: 1, rotation: 0, queue: [], output: {} });
describe('connected road surfaces', () => {
    it('covers all 16 four-edge combinations without connecting diagonals', () => {
        const s = createFarm(1800000000000, 42);
        for (let mask = 0; mask < 16; mask++) {
            const roads = [road('center', 20, 20), road('diagonal', 21, 21), ...ROAD_DIRECTIONS.filter(d => mask & d.bit).map(d => road(`edge-${d.bit}`, 20 + d.dx, 20 + d.dz))];
            expect(roadConnections(roads, s.world).find(e => e.id === 'center')!.mask).toBe(mask);
        }
    });
    it('reconnects after actual build, move, store and undo commands without save fields', () => {
        let s = createFarm(1800000000000, 42);
        const run = (c: FarmCommand) => { const r = execute(s, c); expect(r.ok, r.message).toBe(true); s = r.state; };
        for (const [x,z] of [[19,19],[20,19],[20,20]]) run({ type: 'build', asset: 'path', x, z, rotation: 0 });
        const center = s.entities.find(e => e.asset === 'path' && e.x === 20 && e.z === 19)!;
        const east = s.entities.find(e => e.asset === 'path' && e.z === 20)!;
        const mask = () => roadConnections(s.entities, s.world).find(e => e.id === center.id)!.mask;
        expect(mask()).toBe(12); // west + south corner
        run({ type: 'move', entityId: east.id, x: 21, z: 19, rotation: 1 }); expect(mask()).toBe(10);
        run({ type: 'undo' }); expect(mask()).toBe(12);
        run({ type: 'store', entityId: east.id }); expect(mask()).toBe(8);
    });
    it('does not join stored tiles or tiles on different elevations', () => {
        const s = createFarm(1800000000000, 42), a = road('a', 20, 20), b = { ...road('b', 21, 20), stored: true };
        expect(roadConnections([a,b],s.world)[0].mask).toBe(0);
        b.stored = false; s.world.heights[20 * 96 + 21] = 2;
        expect(roadConnections([a,b],s.world).map(e=>e.mask)).toEqual([0,0]);
    });
    it('uses matching geometry and texture coordinates at joined edges for every shape', () => {
        for (let mask = 1; mask < 16; mask++) for (const d of ROAD_DIRECTIONS.filter(d => mask & d.bit)) {
            const other = d.bit === 1 ? 4 : d.bit === 2 ? 8 : d.bit === 4 ? 1 : 2;
            const a = roadGeometry(20,20,0,mask), b = roadGeometry(20+d.dx,20+d.dz,0,other);
            const seam = d.dx ? 20.5+d.dx*.5 : 20.5+d.dz*.5;
            const edge = (g: typeof a) => {
                const p=g.getAttribute('position'), uv=g.getAttribute('uv'), values:string[]=[];
                for(let i=0;i<p.count;i++) if(Math.abs((d.dx?p.getX(i):p.getZ(i))-seam)<1e-5) values.push([p.getX(i),p.getY(i),p.getZ(i),uv.getX(i),uv.getY(i)].map(v=>v.toFixed(4)).join(':'));
                return [...new Set(values)].sort();
            };
            expect(edge(a).length).toBeGreaterThanOrEqual(2); expect(edge(a)).toEqual(edge(b)); a.dispose(); b.dispose();
        }
    });
});
