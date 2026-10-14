import { expect, it } from 'vitest';
import fs from 'node:fs';
import { World, add3 } from '../engine/world';
import { History } from '../engine/history';
import { pick } from '../engine/pick';
import { suggest } from '../engine/place';
import { buildSteps } from './steps';
import type { Catalog, V3 } from '../engine/types';
const cat: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));
it('replays 200 randomized models, each with side and underside connections', { timeout: 300000 }, () => {
  let seed = 412;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let run = 0; run < 200; run++) {
    const w = new World(cat), h = new History(w);
    const put = (part: string, from: V3, dir: V3) => {
      const hit = pick(w, from, dir)!;
      const c = suggest(w, part, 0, hit, { radius: 50 }).best!;
      expect(c?.ok, `${run}:${part}`).toBe(true);
      return h.place(part, ['red', 'yellow', 'blue'][run % 3], c.pos, c.o, c.lift);
    };
    const x = Math.floor(rnd() * 12) * 20 - 120, z = Math.floor(rnd() * 12) * 20 - 120;
    const sideBrick = put('87087', [x, -2000, z], [0, 1, 0]);
    const side = sideBrick.geo.conns.find(c => c.k === 's' && c.a[1] === 0)!;
    const pos = add3(side.p, sideBrick.pos);
    const attached = put('3024', add3(pos, side.a.map(v => v * 100) as V3), side.a.map(v => -v) as V3);
    expect(attached.geo.conns.some(c => c.a[1] === 0)).toBe(true);
    // Attach underneath from below; the engine raises the existing cluster off the table.
    put('3005', [sideBrick.pos[0], 2000, sideBrick.pos[2]], [0, -1, 0]);
    for (let i = 0; i < 8; i++) put(rnd() < 0.5 ? '3005' : '3024', [x + Math.floor(rnd() * 5) * 20, -2000, z + Math.floor(rnd() * 5) * 20], [0, 1, 0]);
    const steps = buildSteps(w), replay = new World(cat);
    for (const step of steps) {
      for (const id of step.pieces) {
        const p = w.pieces.get(id)!;
        const conns = p.geo.conns.map(c => ({ ...c, p: add3(c.p, p.pos) }));
        expect(p.bbox[4] >= -2.5 || replay.joinsOf(conns).some(j => j.other !== 'ground'), `floating ${run}:${id}`).toBe(true);
        const checked = replay.check(p.part, p.pos, p.o);
        expect(checked.reason, `collision ${run}:${id}`).not.toBe('collide');
      }
      for (const id of step.pieces) { const p = w.pieces.get(id)!; replay.add(p.part, p.color, p.pos, p.o, id); }
      expect(replay.floating().size).toBe(0);
    }
    expect([...replay.pieces.values()].map(p => [p.id, p.part, p.color, p.pos, p.o]).sort()).toEqual([...w.pieces.values()].map(p => [p.id, p.part, p.color, p.pos, p.o]).sort());
  }
});
it('refuses instructions for floating pieces instead of silently inventing unsupported steps', () => {
  const w = new World(cat); w.add('3005', 'red', [0, -100, 0], 0);
  expect(() => buildSteps(w)).toThrow('lơ lửng');
});
