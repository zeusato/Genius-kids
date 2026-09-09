import { describe, expect, it } from 'vitest';
import { createMap } from './content';
import { RegionId } from './model';
import { buildScenery, distanceToRoute } from './scenery';
import { worldLayout } from './worldLayout';

describe('Scenery keeps the riding route readable', () => {
  for (const region of ['forest', 'wind', 'crystal', 'snow', 'castle'] as RegionId[]) {
    it(`${region}: populates the islands without placing trees or landmarks over the route`, () => {
      const map = worldLayout(createMap(region + '-1', 42), region);
      const scene = buildScenery(region, map, 42, 'balanced');
      expect(scene.anchors.filter(p => p.kind === 'tree').length).toBeGreaterThanOrEqual(25);
      for (const anchor of scene.anchors) {
        expect(distanceToRoute(anchor.x, anchor.z, map)).toBeGreaterThan(1.05 + anchor.radius);
      }
      expect(scene.parts.every(p => [...p.p, ...p.s].every(Number.isFinite))).toBe(true);
      expect(buildScenery(region, map, 42, 'light').parts.length).toBeLessThan(scene.parts.length);
      expect(buildScenery(region, map, 42, 'balanced')).toEqual(scene);
    });
  }
});
