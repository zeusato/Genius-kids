import { Quality, RegionId, rng } from './model';
import { regionMood } from './art';
import { WorldNode, worldBounds } from './worldLayout';

export type SceneryShape = 'leaf' | 'cone' | 'rock' | 'trunk' | 'crystal' | 'pool';
export type SceneryPart = { shape: SceneryShape; p: [number, number, number]; s: [number, number, number]; color: string };
export type SceneryAnchor = { x: number; z: number; radius: number; kind: 'tree' | 'landmark' };

export function islandsFor(nodes: WorldNode[], id: RegionId) {
  const count = id === 'wind' ? 8 : 7;
  return Array.from({length: count}, (_, i) => {
    const group = nodes.slice(Math.floor(i * nodes.length / count), Math.floor((i + 1) * nodes.length / count));
    const b = worldBounds(group);
    return {x: b.x, z: b.z, y: group.reduce((sum, p) => sum + p.y, 0) / group.length - .85,
      rx: Math.max(4.6, (b.width - 9) / 2 + 4.2), rz: Math.max(4.4, (b.depth - 9) / 2 + 3.8)};
  });
}

/** Clearance from the entire riding path, including the space between tiles. */
export function distanceToRoute(x: number, z: number, nodes: WorldNode[]) {
  let distance = Infinity;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i], dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    distance = Math.min(distance, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return distance;
}

export function buildScenery(id: RegionId, nodes: WorldNode[], seed: number, quality: Quality) {
  const mood = regionMood[id], random = rng(seed ^ 381), islands = islandsFor(nodes, id);
  const parts: SceneryPart[] = [], anchors: SceneryAnchor[] = [];
  const add = (shape: SceneryShape, x: number, y: number, z: number, s: SceneryPart['s'], color: string) => parts.push({shape, p: [x, y, z], s, color});
  const surfaceAt = (x: number, z: number) => Math.max(...islands.filter(p => ((x - p.x) / p.rx) ** 2 + ((z - p.z) / p.rz) ** 2 < .98).map(p => p.y + .375));
  const boss = nodes[nodes.length - 1];
  const clear = (x: number, z: number, radius: number) => distanceToRoute(x, z, nodes) > 1.05 + radius
    && Math.hypot(x - boss.x, z - (boss.z - 2.4)) > 3 + radius
    && anchors.every(a => Math.hypot(x - a.x, z - a.z) > (radius + a.radius) * .82);

  for (const [islandIndex, island] of islands.entries()) {
    // Populate the usable banks of each island, instead of rejecting most trees near the path.
    const target = quality === 'light' ? 5 : quality === 'detailed' ? 11 : 8;
    for (let attempt = 0, placed = 0; attempt < 200 && placed < target; attempt++) {
      const angle = random() * Math.PI * 2, radius = .45 + random() * .41;
      const x = island.x + Math.cos(angle) * island.rx * radius, z = island.z + Math.sin(angle) * island.rz * radius;
      if (!clear(x, z, .95)) continue;
      const y = surfaceAt(x, z), h = 1.65 + random() * 1.15;
      anchors.push({x, z, radius: .95, kind: 'tree'}); placed++;
      if (id === 'crystal') {
        add('crystal', x, y + h * .55, z, [.5, h * .72, .5], placed % 2 ? '#9c82d2' : '#60cbd5');
        add('crystal', x + .5, y + .5, z + .1, [.26, .75, .3], '#c7b2e9');
        add('crystal', x - .35, y + .25, z + .35, [.22, .45, .25], '#a0e5d9');
      } else if (id === 'snow') {
        add('trunk', x, y + h * .35, z, [.13, h * .7, .13], '#69766a');
        add('cone', x, y + h * .63, z, [.85, h, .85], '#397573');
        add('cone', x, y + h * .91, z, [.69, h * .78, .69], '#e9f2e8');
        add('cone', x, y + h * 1.12, z, [.4, h * .48, .4], '#fafaf2');
      } else if (id === 'castle' && placed % 3 === 0) {
        add('trunk', x, y + .7, z, [.48, 1.4, .48], '#dfd3b7');
        add('cone', x, y + 1.75, z, [.72, .85, .72], '#975447');
      } else {
        add('trunk', x, y + h * .38, z, [.13, h * .76, .14], '#746049');
        add('leaf', x, y + h * .79, z, [.78, h * .4, .78], mood.leaf);
        add('leaf', x + .22, y + h * 1.03, z - .08, [.59, h * .32, .59], id === 'wind' ? '#8ac8a2' : '#7cac62');
        if (quality !== 'light') add('leaf', x - .28, y + h * .87, z + .22, [.5, h * .27, .52], id === 'castle' ? '#c5ab64' : '#a3bd6b');
      }
      add('rock', x + .45, y + .12, z + .4, [.35, .24, .32], mood.rock);
      add('leaf', x - .35, y + .2, z + .3, [.4, .28, .36], id === 'snow' ? '#e8f1e8' : mood.leaf);
    }

    // One quiet landmark per island: pools, rocky knolls or courtyard ruins.
    for (let attempt = 0; attempt < 70; attempt++) {
      const a = random() * Math.PI * 2;
      const x = island.x + Math.cos(a) * island.rx * .63, z = island.z + Math.sin(a) * island.rz * .63;
      if (!clear(x, z, 1.25)) continue;
      const y = surfaceAt(x, z);
      anchors.push({x, z, radius: 1.25, kind: 'landmark'});
      if ((id === 'forest' || id === 'wind') && islandIndex % 2 === 0) {
        add('pool', x, y + .025, z, [1.22, .06, .94], '#acbc87');
        add('pool', x, y + .065, z, [1.04, .065, .76], '#65aaa6');
        add('rock', x + .85, y + .18, z + .1, [.31, .26, .4], '#99aa80');
      } else {
        add('rock', x, y + .38, z, [1.12, .85, .95], mood.rock);
        add(id === 'crystal' ? 'crystal' : 'rock', x + .25, y + .95, z - .16, [.65, 1.05, .62], id === 'snow' ? '#f2f5e9' : id === 'crystal' ? '#b2a3e9' : id === 'castle' ? '#d8c7a5' : '#8fa277');
      }
      break;
    }
    // Exposed rock shelves make the otherwise cylindrical island edge irregular.
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + islandIndex;
      add('rock', island.x + Math.cos(a) * island.rx * .95, island.y - .65, island.z + Math.sin(a) * island.rz * .95,
        [.55 + random() * .45, .6 + random() * .65, .65], i % 3 ? mood.rock : id === 'snow' ? '#a9c6c7' : '#7b9470');
    }
  }
  const coverCount = quality === 'light' ? 150 : quality === 'detailed' ? 420 : 300;
  for (let i = 0; i < coverCount; i++) {
    const island = islands[i % islands.length], a = random() * Math.PI * 2, r = Math.sqrt(random()) * .91;
    const x = island.x + Math.cos(a) * island.rx * r, z = island.z + Math.sin(a) * island.rz * r;
    if (distanceToRoute(x, z, nodes) < 1.04) continue;
    const y = surfaceAt(x, z);
    if (i % 5 === 0) add('rock', x, y + .1, z, [.26, .18, .2], mood.rock);
    else if (id === 'crystal') add('crystal', x, y + .15, z, [.13, .3, .15], i % 2 ? '#a6c1e8' : '#8fa9cc');
    else {
      add('leaf', x, y + .1, z, [.18, .15, .19], id === 'snow' ? '#eef4e9' : mood.leaf);
      if (i % 3 === 0 && id !== 'snow') add('leaf', x + .06, y + .24, z, [.085, .07, .085], i % 2 ? '#f3d784' : '#e7b4b1');
    }
  }
  return {parts, anchors, islands};
}
