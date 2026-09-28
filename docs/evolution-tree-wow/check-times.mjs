// Kiểm bảng thời gian với cây đích (tham chiếu; GĐ0 chuyển thành vitest đọc dữ liệu TS thật).
// Chạy: node docs/evolution-tree-wow/check-times.mjs docs/evolution-tree-wow/target-tree.txt docs/evolution-tree-wow/times.json
import { readFileSync } from 'node:fs';
const [treePath, timesPath] = process.argv.slice(2);
const lines = readFileSync(treePath, 'utf8').split(/\r?\n/).filter(l => l.trim());
const nodes = new Map(); const stack = [];
for (const l of lines) {
  const depth = (l.length - l.trimStart().length) / 2;
  const parts = l.trim().split(/\s+/);
  const n = { id: parts[0], depth, extinct: parts.includes('X'), parent: null, kids: [] };
  while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
  if (stack.length) { n.parent = stack[stack.length - 1]; n.parent.kids.push(n); }
  nodes.set(n.id, n); stack.push(n);
}
const T = JSON.parse(readFileSync(timesPath, 'utf8'));
const errs = [];
const splits = [...nodes.values()].filter(n => n.kids.length >= 2);
for (const s of splits) if (!T.splits[s.id]) errs.push('missing split time: ' + s.id);
for (const id of Object.keys(T.splits)) { const n = nodes.get(id); if (!n) errs.push('unknown id in splits: ' + id); else if (n.kids.length < 2) errs.push('not a split: ' + id); }
for (const n of nodes.values()) if (n.extinct && !T.extinct[n.id]) errs.push('missing extinct: ' + n.id);
for (const id of Object.keys(T.extinct)) if (!nodes.get(id)?.extinct) errs.push('extinct entry for non-extinct/unknown: ' + id);
// nearest timed ancestor must be older
const timeOf = (n) => T.splits[n.id]?.ma;
const nearestTimedAnc = (n) => { let p = n.parent; while (p && timeOf(p) === undefined) p = p.parent; return p; };
for (const n of nodes.values()) {
  const t = timeOf(n); if (t === undefined) continue;
  const a = nearestTimedAnc(n);
  if (a && !(timeOf(a) > t)) errs.push(`order: ${n.id} (${t}) not younger than ${a.id} (${timeOf(a)})`);
  const r = T.splits[n.id]; if (r.lo !== undefined && !(r.lo <= t && t <= r.hi)) errs.push('range: ' + n.id);
}
for (const [id, e] of Object.entries(T.extinct)) {
  const n = nodes.get(id); const a = nearestTimedAnc(n);
  if (a && !(timeOf(a) > e.endMa)) errs.push(`extinct end ${id} ${e.endMa} not younger than ${a.id} ${timeOf(a)}`);
  if (!(e.firstMa > e.endMa)) errs.push('first<=end ' + id);
}
// interpolated chain preview: single-child untimed nodes
const interp = [];
for (const n of nodes.values()) {
  if (n.kids.length !== 1 || timeOf(n) !== undefined || n.depth === 0) continue;
  interp.push(n.id);
}
console.log({ splits: splits.length, timed: Object.keys(T.splits).length, extinct: Object.keys(T.extinct).length, chainNodes: interp.length });
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'OK: no errors');
console.log('CHAIN (interpolated):', interp.join(', '));
