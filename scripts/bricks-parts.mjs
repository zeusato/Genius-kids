// Dây chuyền mảnh Xưởng Lắp Ghép (docs/brick-studio-plan.md mục 4.2). Chạy TAY trên máy dev, không gắn vào build/deploy:
//   node scripts/bricks-parts.mjs          → public/bricks/{catalog.json, parts/*.bin}
//   node scripts/bricks-parts.mjs --check  → chỉ kiểm, không ghi
// Cần dữ liệu ở tools/ldraw/ (xem docs/brick-studio/CHECKPOINT.md).
import fs from 'node:fs';
import path from 'node:path';
import { Library } from './bricks/ldraw.mjs';
import { toConnectors } from './bricks/snap.mjs';
import { buildMesh, packMesh, POS_SCALE } from './bricks/mesh.mjs';
import { collisionBoxes } from './bricks/collide.mjs';
import { KITS, flattenKit } from './bricks/kits.mjs';
import { readPartsCsv, GROUPS } from './bricks/select.mjs';
import { readCsv, RB } from './bricks/candidates.mjs';
import { PALETTE, PRESCHOOL_COLORS } from './bricks/palette.mjs';

const CHECK = process.argv.includes('--check');
const OUT = 'public/bricks';
const LITE_FACES = 1500;           // quá ngưỡng thì dùng bản lite (bỏ ống đáy)
const KIND = { stud: 's', antistud: 'a', pin: 'p', pinhole: 'h' };
const r3 = v => Math.round(v * 1000) / 1000;

const lib = new Library('tools/ldraw/lib/ldraw', 'tools/ldraw/shadow/LDCadShadowLibrary-main');
const rows = readPartsCsv().filter(r => r.keep !== '0');
const problems = [];

/** Gom mảng nhị phân của một nhóm vào một file, căn 4 byte. */
class BinWriter {
  constructor() { this.chunks = []; this.size = 0; }
  add(typed) {
    const off = this.size, bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
    this.chunks.push(bytes); this.size += bytes.length;
    const pad = (4 - (this.size % 4)) % 4;
    if (pad) { this.chunks.push(new Uint8Array(pad)); this.size += pad; }
    return [off, typed.length];
  }
  buffer() { return Buffer.concat(this.chunks.map(c => Buffer.from(c))); }
}

function meshRef(writer, packed) {
  return {
    vc: packed.vertexCount, i32: packed.index32,
    pos: writer.add(packed.arrays.pos), nrm: writer.add(packed.arrays.nrm), idx: writer.add(packed.arrays.idx),
    groups: packed.groups,
  };
}

// --- Màu có thật theo mảnh (Rebrickable inventory + elements) ---
const rbToKey = new Map(PALETTE.map(c => [String(c.rb), c.key]));
const avail = new Map();
const note = (part, color) => { const k = rbToKey.get(color); if (!k) return; if (!avail.has(part)) avail.set(part, new Set()); avail.get(part).add(k); };
for (const r of readCsv(`${RB}/inventory_parts.csv.gz`)) if (r.is_spare !== 'True') note(r.part_num, r.color_id);
for (const r of readCsv(`${RB}/elements.csv.gz`)) note(r.part_num, r.color_id);

// --- Mảnh ---
const writers = new Map(GROUPS.map(g => [g[0], new BinWriter()]));
const parts = {};
const touched = new Set();
for (const row of rows) {
  const kit = row.ldraw.startsWith('kit:') ? KITS.find(k => k.key === row.ldraw.slice(4)) : null;
  try {
    const full = kit ? flattenKit(lib, kit) : lib.flatten(row.ldraw);
    if (full.missing) problems.push(`${row.key}: thiếu file ${[...new Set(full.missing)].join(', ')}`);
    let flat = full, lite = false;
    const fullMesh = buildMesh(full);
    let mesh = fullMesh;
    if (fullMesh.triCount > LITE_FACES && row.note !== 'print') {
      const l = kit ? flattenKit(lib, kit, true) : lib.flatten(row.ldraw, true);
      const lm = buildMesh(l);
      if (lm.triCount < fullMesh.triCount) { flat = l; mesh = lm; lite = true; }
    }
    const conns = toConnectors(full.snaps).filter(c => KIND[c.kind]).map(c => ({ k: KIND[c.kind], p: c.pos.map(r3), a: c.axis }));
    if (!conns.length) problems.push(`${row.key}: không có điểm nối v1`);
    // Khoét thể tích núm/chốt và lòng lỗ nhận (r6/r4) của chính mảnh khỏi hộp va chạm.
    const carve = toConnectors(full.snaps).filter(c => KIND[c.kind]).map(c => ({ p: c.pos, a: c.axis, r: c.kind === 'stud' || c.kind === 'antistud' ? 6 : 4, len: Math.min(c.kind === 'stud' || c.kind === 'pin' ? 4 : c.len || 4, 24) }));
    const { boxes } = collisionBoxes(full.tris, { carve });
    const writer = writers.get(row.group);
    if (!writer) { problems.push(`${row.key}: nhóm lạ ${row.group}`); continue; }
    const rbId = row.rb || (kit ? kit.base.replace(/\.dat$/, '') : '');
    parts[row.key] = {
      name: row.nameVi, group: row.group, ldraw: kit ? null : row.ldraw.replace(/\.dat$/, ''), rb: row.rb || null,
      print: row.note === 'print' || undefined, kit: !!kit || undefined, lite: lite || undefined,
      faces: mesh.triCount, bbox: fullMesh.bbox.map(v => v.map(r3)),
      mesh: meshRef(writer, packMesh(mesh)),
      boxes, conns,
      studs: flat.studs.map(s => ({ k: s.kind === 'hollow' ? 'h' : 's', m: s.m.map(r3), c: s.c })),
      // BOM: mảnh thật (bộ ghép bung ra), kèm tên gốc LDraw và ma trận đặt trong bộ (để xuất .ldr)
      bom: (full.bom || [{ ldraw: row.ldraw, color: 'self', qty: 1 }]).map(b => ({
        ldraw: b.ldraw.replace(/\.dat$/, ''), color: b.color, qty: b.qty,
        name: (lib.parse(b.ldraw).header.title || '').replace(/^[~=_]+/, '').replace(/\s+/g, ' '),
        ...(b.nameVi ? { nameVi: b.nameVi } : {}),
        ...(b.m && b.m.join() !== '0,0,0,1,0,0,0,1,0,0,0,1' ? { m: b.m } : {}),
      })),
      colors: avail.has(rbId) ? PALETTE.filter(c => avail.get(rbId).has(c.key)).map(c => c.key) : null,
    };
  } catch (e) { problems.push(`${row.key}: ${e.message}`); }
}
for (const k of lib.parsed.keys()) touched.add(k);

// --- Núm dùng chung (instancing) ---
const studWriter = new BinWriter();
const studs = {};
for (const [k, file] of [['s', 'stud.dat'], ['h', 'stud2.dat']]) {
  const doc = lib.parse(file);
  const flat = { tris: [], edges: [] };
  // Làm phẳng trực tiếp nội dung file núm (flatten() coi nó là instance nên không cho hình học).
  for (const cmd of doc.cmds) if (cmd.t === 1) {
    const child = lib.flatten(cmd.file);
    for (const t of child.tris) flat.tris.push({ ...t, p: t.p.map((v, i) => { const m = cmd.m, j = i % 3, b = i - j; const [x, y, z] = [t.p[b], t.p[b + 1], t.p[b + 2]]; return [m[3] * x + m[4] * y + m[5] * z + m[0], m[6] * x + m[7] * y + m[8] * z + m[1], m[9] * x + m[10] * y + m[11] * z + m[2]][j]; }), c: 16 });
    for (const e of child.edges) flat.edges.push(e.map((v, i) => { const m = cmd.m, j = i % 3, b = i - j; const [x, y, z] = [e[b], e[b + 1], e[b + 2]]; return [m[3] * x + m[4] * y + m[5] * z + m[0], m[6] * x + m[7] * y + m[8] * z + m[1], m[9] * x + m[10] * y + m[11] * z + m[2]][j]; }));
  }
  const mesh = buildMesh(flat);
  studs[k] = { faces: mesh.triCount, mesh: meshRef(studWriter, packMesh(mesh)) };
}

// --- Ghi công ---
const authors = new Map(), licenses = new Map();
for (const key of touched) {
  const h = lib.parsed.get(key).header;
  if (h.author) authors.set(h.author, (authors.get(h.author) || 0) + 1);
  const lic = (h.license || 'không ghi').replace(/\s*:.*$/, '');
  licenses.set(lic, (licenses.get(lic) || 0) + 1);
}

const catalog = {
  version: 1, generated: new Date().toISOString().slice(0, 10), posScale: POS_SCALE,
  groups: GROUPS.map(([id, nameVi]) => ({ id, nameVi, parts: Object.keys(parts).filter(k => parts[k].group === id) })),
  palette: PALETTE.map(c => ({ ...c, hex: lib.colours.get(c.ldraw).value, alpha: lib.colours.get(c.ldraw).alpha, material: lib.colours.get(c.ldraw).material })),
  preschoolColors: PRESCHOOL_COLORS,
  // Màu cố định xuất hiện trong phần in / mảnh phụ của bộ
  fixedColors: Object.fromEntries([...new Set(Object.values(parts).flatMap(p => p.mesh.groups.map(g => g.color)).concat(Object.values(studs).flatMap(s => s.mesh.groups.map(g => g.color))))]
    .filter(c => c !== 16).map(c => { const col = lib.colours.get(c); return [c, col ? { hex: col.value, alpha: col.alpha, material: col.material, name: col.name } : { hex: '#888888', alpha: 255, material: 'plastic', name: 'unknown' }]; })),
  studs, parts,
  credits: {
    ldraw: { source: 'LDraw.org Parts Library (library.ldraw.org, complete.zip tải 14/10/2026)', files: touched.size, licenses: Object.fromEntries(licenses), authors: [...authors.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a) },
    ldcad: { source: 'LDCad Shadow Library — Roland Melkert và cộng tác viên (github.com/RolandMelkert/LDCadShadowLibrary)', license: 'CC BY-SA 4.0', note: 'Điểm nối (conns) trong file này được suy ra từ thư viện shadow, phát hành lại theo CC BY-SA 4.0.' },
    rebrickable: { source: 'Rebrickable.com (dữ liệu tải về, dùng để xếp hạng mảnh và kiểm màu có thật)' },
  },
};

// --- Kiểm ---
for (const [k, p] of Object.entries(parts)) {
  for (const b of p.boxes) for (let i = 0; i < 3; i++) if (b[i] < p.bbox[0][i] - 0.5 || b[i + 3] > p.bbox[1][i] + 0.5) { problems.push(`${k}: hộp va chạm ra ngoài hộp bao`); break; }
  if (!p.mesh.vc) problems.push(`${k}: không có hình học`);
}
const sizes = [...writers.entries()].map(([g, w]) => [g, w.size]);
const total = sizes.reduce((a, [, s]) => a + s, 0) + studWriter.size;
console.log('mảnh', Object.keys(parts).length, '/', rows.length, '· nhị phân', (total / 1024).toFixed(0), 'KB', Object.fromEntries(sizes.map(([g, s]) => [g, (s / 1024).toFixed(0) + 'KB'])));
console.log('mảnh lite', Object.values(parts).filter(p => p.lite).length, '· tam giác lớn nhất', Object.entries(parts).sort((a, b) => b[1].faces - a[1].faces).slice(0, 5).map(([k, p]) => k + ':' + p.faces).join(' '));
if (problems.length) { console.log('VẤN ĐỀ (' + problems.length + '):\n  ' + problems.join('\n  ')); }

if (!CHECK) {
  fs.mkdirSync(path.join(OUT, 'parts'), { recursive: true });
  for (const [g, w] of writers) { catalog.groups.find(x => x.id === g).bin = `parts/${g}.bin`; fs.writeFileSync(path.join(OUT, 'parts', g + '.bin'), w.buffer()); }
  catalog.studBin = 'parts/studs.bin';
  fs.writeFileSync(path.join(OUT, 'parts', 'studs.bin'), studWriter.buffer());
  const json = JSON.stringify(catalog);
  fs.writeFileSync(path.join(OUT, 'catalog.json'), json);
  console.log('đã ghi', OUT, '· catalog.json', (json.length / 1024).toFixed(0), 'KB');
}
if (problems.some(p => !/thiếu file/.test(p))) process.exitCode = CHECK ? 1 : 0;
