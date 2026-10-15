import { expect, it } from 'vitest';
import fs from 'node:fs';
import { PRESCHOOL_PARTS, subgroupsOf } from './groups';
import type { Catalog } from '../engine/types';
const cat: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));

it('nhóm con của khay: mọi mảnh vào đúng một nhóm con, không nhóm con nào áp đảo cả nhóm', () => {
  const out: Record<string, string> = {};
  for (const g of cat.groups) {
    const subs = subgroupsOf(g.id, g.parts, cat.parts);
    if (!subs.length) continue;
    expect(subs.reduce((a, s) => a + s.parts.length, 0), g.id).toBe(g.parts.length);
    expect(new Set(subs.flatMap(s => s.parts)).size, g.id).toBe(g.parts.length);
    expect(subs.length, g.id).toBeGreaterThan(1);
    expect(Math.max(...subs.map(s => s.parts.length)), g.id).toBeLessThan(g.parts.length * 0.7);
    out[g.id] = subs.map(s => `${s.label}:${s.parts.length}`).join(' ');
  }
  expect(Object.keys(out)).toEqual(['brick', 'plate', 'tile', 'slope', 'curve', 'round']);
});

it('chế độ bé: ~30 mảnh có thật trong catalog, đúng 6 nhóm Gạch, Tấm, Mái, Tròn, Cửa, Cây', () => {
  const keys = [...PRESCHOOL_PARTS];
  expect(keys.filter(k => !cat.parts[k])).toEqual([]);
  expect(keys.length).toBeGreaterThanOrEqual(28); expect(keys.length).toBeLessThanOrEqual(32);
  expect([...new Set(keys.map(k => cat.parts[k].group))].sort()).toEqual(['brick', 'nature', 'plate', 'round', 'slope', 'window']);
});
