// Xem nhanh một mảnh: node scripts/bricks/inspect.mjs 3001 3039 (V=1 để in từng điểm nối).
import { Library } from './ldraw.mjs';
import { toConnectors } from './snap.mjs';
const lib = new Library('D:/Dev/Genius-kids/tools/ldraw/lib/ldraw', 'D:/Dev/Genius-kids/tools/ldraw/shadow/LDCadShadowLibrary-main');
console.log('files', lib.files.size, 'shadow', lib.shadow.size, 'colours', lib.colours.size);
for (const p of process.argv.slice(2)) {
  const t0 = performance.now(); const f = lib.flatten(p + '.dat'); const doc = lib.parse(p + '.dat');
  const con = toConnectors(f.snaps);
  const counts = {}; for (const c of con) counts[c.kind] = (counts[c.kind] || 0) + 1;
  const xs = f.tris.flatMap(t => [t.p[0], t.p[3], t.p[6]]), ys = f.tris.flatMap(t => [t.p[1], t.p[4], t.p[7]]), zs = f.tris.flatMap(t => [t.p[2], t.p[5], t.p[8]]);
  console.log(p, JSON.stringify(doc.header.title), 'tris', f.tris.length, 'dbl', f.tris.filter(t => t.dbl).length, 'studs', f.studs.length, 'conns', JSON.stringify(counts), 'bbox', [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), Math.min(...zs), Math.max(...zs)].map(v=>+v.toFixed(1)).join(' '), (performance.now()-t0).toFixed(0)+'ms', f.missing ? 'MISSING ' + f.missing : '');
  if (process.env.V) for (const c of con) console.log('   ', c.kind, c.pos.join(','), 'axis', c.axis.join(','), 'len', c.len);
}
