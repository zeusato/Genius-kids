// Kiểm nhanh lưới + hộp va chạm: node scripts/bricks/inspect-mesh.mjs 3001 3039
import { Library } from './ldraw.mjs';
import { buildMesh, packMesh } from './mesh.mjs';
import { collisionBoxes } from './collide.mjs';
const lib = new Library('tools/ldraw/lib/ldraw', 'tools/ldraw/shadow/LDCadShadowLibrary-main');
for (const p of process.argv.slice(2)) {
  const f = lib.flatten(p + '.dat');
  const t0 = performance.now(); const m = buildMesh(f); const t1 = performance.now();
  const pk = packMesh(m); const cb = collisionBoxes(f.tris); const t2 = performance.now();
  const top = f.tris.filter(t => t.p[1] === 0 && t.p[4] === 0 && t.p[7] === 0);
  const nTop = top.map(t => { const a=t.p, u=[a[3]-a[0],a[4]-a[1],a[5]-a[2]], v=[a[6]-a[0],a[7]-a[1],a[8]-a[2]]; return Math.sign(u[2]*v[0]-u[0]*v[2]); });
  const bytes = pk.arrays.pos.byteLength + pk.arrays.nrm.byteLength + pk.arrays.idx.byteLength;
  console.log(p, 'faces', m.triCount, 'verts', pk.vertexCount, 'groups', pk.groups.map(g => g.color + ':' + g.count / 3).join(' '), 'bytes', bytes, 'boxes', cb.boxes.length, '@', cb.res, 'topNormalY', [...new Set(nTop)].join(','), (t1 - t0).toFixed(0) + '/' + (t2 - t1).toFixed(0) + 'ms');
  if (process.env.V) for (const b of cb.boxes) console.log('   ', b.join(' '));
}
