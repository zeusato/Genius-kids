import { expect, it } from 'vitest';
import fs from 'node:fs';
import { World } from './world';
import { History } from './history';
import { pick } from './pick';
import { suggest } from './place';
import { decodeInto, encodeWorld } from './model';
import { overlaps } from './testkit';
import type { Catalog, V3 } from './types';
const cat: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));
const base = { v: 1 as const, ownerId: 'fuzz', id: 'model', name: 'Fuzz', revision: 0, created: 0, updated: 0 };
const state = (w: World) => encodeWorld(w, base);
const canonical = (value: unknown): unknown => value instanceof Map ? [...value].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([k, v]) => [k, canonical(v)]) : value instanceof Set ? [...value].sort((a, b) => a - b) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, canonical(v)])) : value;

// Gate plan mục 14 GĐ0b / mục 18.3: 100.000 thao tác (BRICKS_STRESS=1); mặc định 2.000 cho bộ test thường.
const operations = process.env.BRICKS_STRESS ? 100000 : 2000;
// Đủ kiểu nối của v1: gạch/tấm/mái, núm cạnh, núm tròn, tấm trơn, tấm nhảy, tấm trục + bánh (chốt), gạch tròn.
const KEYS = ['3001', '3003', '3004', '3005', '3020', '3022', '3023b', '3024', '3039', '3040b', '87087', '3068b', '6141', '3062b', '15573', '4600', 'kit-wheel-small'];
const COLORS = ['red', 'blue', 'yellow', 'white'];

it(`fuzz ${operations} thao tác (lắp mọi hướng, tia chéo, lắp dưới, dời, tháo, sơn, hoàn tác): chỉ mục khớp dựng lại, không chồng lấn, lơ lửng chỉ do tháo`, { timeout: process.env.BRICKS_STRESS ? 900000 : 120000 }, () => {
  const w = new World(cat), h = new History(w, 400);
  let seed = 39821;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const pickInt = (n: number) => Math.floor(rnd() * n);
  /** Tia ngẫu nhiên: thẳng xuống, chéo, hoặc từ dưới lên (gắn treo dưới, có thể nâng cụm). */
  const randomHit = (ignore?: Set<number>) => {
    const x = (rnd() - 0.5) * 360, z = (rnd() - 0.5) * 360, r = rnd();
    const dir: V3 = r < 0.65 ? [0, 1, 0] : r < 0.85 ? [rnd() - 0.5, 0.6, rnd() - 0.5] : [0, -1, 0];
    const from: V3 = dir[1] < 0 ? [x, 2000, z] : [x - dir[0] * 2000, -2000, z - dir[2] * 2000];
    return pick(w, from, dir, ignore);
  };
  const counts = { place: 0, lift: 0, move: 0, remove: 0, color: 0, undo: 0, redo: 0 };
  for (let i = 0; i < operations; i++) {
    const ids = [...w.pieces.keys()], action = rnd();
    if (!ids.length || action < 0.45 && ids.length < 60) {
      const hit = randomHit(); if (!hit) continue;
      const part = KEYS[pickInt(KEYS.length)];
      const c = suggest(w, part, pickInt(24), hit, { radius: 50 }).best;
      if (!c?.ok) continue;
      const before = w.floating();
      const placed = h.place(part, COLORS[pickInt(COLORS.length)], c.pos, c.o, c.lift);
      counts.place++; if (c.lift) counts.lift++;
      // Lắp thêm (kể cả nâng cụm) không làm mảnh cũ mất chỗ bám. Mảnh mới chỉ lơ lửng khi gắn vào cụm vốn đã lơ lửng (sau một lần tháo).
      for (const id of w.floating()) {
        if (before.has(id)) continue;
        expect(id, `lắp ${part} làm #${id} lơ lửng (thao tác ${i})`).toBe(placed.id);
        expect([...w.component(id)].some(n => before.has(n)), `mảnh mới #${id} lơ lửng dù không gắn vào cụm lơ lửng (thao tác ${i})`).toBe(true);
      }
    } else if (action < 0.55) {
      const id = ids[pickInt(ids.length)], p = w.pieces.get(id)!, ignore = new Set([id]);
      const hit = randomHit(ignore); if (!hit) continue;
      const c = suggest(w, p.part, pickInt(24), hit, { radius: 50, ignore }).best;
      if (!c?.ok || c.lift) continue;   // giao diện cũng từ chối dời khi phải nâng cụm
      h.move(id, c.pos, c.o); counts.move++;
    } else if (action < 0.7) { h.remove(ids[pickInt(ids.length)]); counts.remove++; }
    else if (action < 0.8) { h.color(ids[pickInt(ids.length)], COLORS[pickInt(COLORS.length)]); counts.color++; }
    else if (action < 0.9) { if (h.undo()) counts.undo++; }
    else if (h.redo()) counts.redo++;
    if (i % 250 !== 0 && i !== operations - 1) continue;
    const fresh = new World(cat);
    for (const p of w.pieces.values()) fresh.add(p.part, p.color, p.pos, p.o, p.id);
    for (const key of ['cells', 'conns']) expect(canonical((w as any)[key]), `index ${key} after ${i}`).toEqual(canonical((fresh as any)[key]));
    expect(overlaps(w), `chồng lấn sau thao tác ${i}`).toEqual([]);
    const saved = state(w), again = new World(cat);
    decodeInto(again, JSON.parse(JSON.stringify(saved)));
    expect(state(again)).toEqual(saved);
  }
  // fuzz phải thật sự đi qua mọi loại thao tác
  for (const [k, n] of Object.entries(counts)) expect(n, k).toBeGreaterThan(operations / 200);
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
