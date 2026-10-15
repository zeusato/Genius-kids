import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { World } from '../engine/world';
import { History } from '../engine/history';
import { SAMPLES, buildSample } from './samples';
import type { Catalog } from '../engine/types';

const catalog: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));

describe('mô hình mẫu', () => {
  it('đủ 10 mẫu, mọi mảnh đặt được, không có mảnh lơ lửng, 20–60 mảnh mỗi mẫu (plan mục 12)', () => {
    expect(SAMPLES).toHaveLength(10);
    const report: Record<string, string[]> = {};
    for (const s of SAMPLES) {
      const w = new World(catalog), h = new History(w);
      const fails = buildSample(w, h, s);
      if (fails.length) report[s.id] = fails;
      if (w.floating().size) report[s.id] = [...(report[s.id] || []), `lơ lửng: ${w.floating().size}`];
      if (w.pieces.size < 20 || w.pieces.size > 60) report[s.id] = [...(report[s.id] || []), `số mảnh ${w.pieces.size}`];
    }
    expect(report).toEqual({});
  });
});
