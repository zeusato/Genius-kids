import { expect, it } from 'vitest';
import fs from 'node:fs';
import { World, overlap } from './world';
import { History } from './history';
import { encodeWorld } from './model';
import type { Catalog, V3 } from './types';
const cat: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));
const base = { v: 1 as const, ownerId: 'fuzz', id: 'model', name: 'Fuzz', revision: 0, created: 0, updated: 0 };
const state = (w: World) => encodeWorld(w, base);
const canonical = (value: unknown): unknown => value instanceof Map ? [...value].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([k, v]) => [k, canonical(v)]) : value instanceof Set ? [...value].sort((a, b) => a - b) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, canonical(v)])) : value;

const operations = process.env.BRICKS_STRESS ? 100000 : 2000;
it(`fuzz ${operations} mutations: indices match a fresh rebuild, no overlaps`, { timeout: process.env.BRICKS_STRESS ? 900000 : 60000 }, () => {
  const w = new World(cat), h = new History(w);
  let seed = 39821;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const keys = ['3005', '3024', '6141', '87087'];
  for (let i = 0; i < operations; i++) {
    const ids = [...w.pieces.keys()], id = ids[Math.floor(rnd() * ids.length)], action = rnd();
    if (!ids.length || (action < 0.4 && ids.length < 36)) {
      const part = keys[Math.floor(rnd() * keys.length)], pos: V3 = [Math.floor(rnd() * 12) * 40 + 10, -24, Math.floor(rnd() * 12) * 40 + 10];
      pos[1] = -cat.parts[part].bbox[1][1];
      const c = w.check(part, pos, 0); if (c.ok) h.place(part, 'red', pos, 0, c.lift);
    } else if (action < 0.65) h.remove(id);
    else if (action < 0.8) h.color(id, rnd() < 0.5 ? 'blue' : 'yellow');
    else if (action < 0.9) h.undo();
    else h.redo();
    if (i % 500 !== 0 && i !== operations - 1) continue;
    const fresh = new World(cat);
    for (const p of w.pieces.values()) fresh.add(p.part, p.color, p.pos, p.o, p.id);
    for (const key of ['cells', 'conns']) expect(canonical((w as any)[key]), `index ${key} after ${i}`).toEqual(canonical((fresh as any)[key]));
    const pieces = [...w.pieces.values()];
    for (let a = 0; a < pieces.length; a++) for (let b = a + 1; b < pieces.length; b++)
      for (const x of pieces[a].boxes) for (const y of pieces[b].boxes) expect(overlap(x, y)).toBe(false);
  }
});

it('undo and redo exactly 200 mixed edits preserve geometry, color and order', () => {
  const w = new World(cat), h = new History(w);
  for (let i = 0; i < 100; i++) h.add('3005', 'red', [(i % 10) * 40, -24, Math.floor(i / 10) * 40], 0);
  for (let i = 1; i <= 100; i++) h.color(i, 'blue');
  const saved = state(w);
  for (let i = 0; i < 200; i++) expect(h.undo()).toBe(true);
  expect(w.pieces.size).toBe(0); expect(h.undo()).toBe(false);
  for (let i = 0; i < 200; i++) expect(h.redo()).toBe(true);
  expect(state(w)).toEqual(saved); expect(h.redo()).toBe(false);
});
