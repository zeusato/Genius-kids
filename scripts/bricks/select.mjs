// Tuyển bộ mảnh v1 → docs/brick-studio/parts-v1.csv (mục 6). Chạy: node scripts/bricks/select.mjs
// File CSV sinh ra là BẢN NHÁP; sau khi rà tay, sửa trực tiếp CSV (cột `keep` = 0 để loại, sửa `nameVi`).
// Chạy lại script sẽ GIỮ các dòng đã có trong CSV (theo `rb`) và chỉ thêm dòng mới ở cuối.
import fs from 'node:fs';
import { Library } from './ldraw.mjs';
import { toConnectors, V1_KINDS } from './snap.mjs';
import { readCsv, popularity, RB } from './candidates.mjs';
import { buildMesh } from './mesh.mjs';
import { viName } from './names.mjs';

const OUT = 'docs/brick-studio/parts-v1.csv';
export const GROUPS = [
  // id, tên Việt, hạn mức (mục 6.2)
  ['brick', 'Gạch', 30], ['plate', 'Tấm', 40], ['tile', 'Tấm trơn', 30], ['slope', 'Mái dốc', 35],
  ['curve', 'Dốc cong & nêm', 25], ['round', 'Tròn & nón', 25], ['arch', 'Vòm & cột', 15], ['window', 'Cửa & cửa sổ', 25],
  ['vehicle', 'Bánh xe', 15], ['nature', 'Cây & hoa', 15], ['side', 'Gắn cạnh & nhảy', 15], ['decor', 'Trang trí', 15],
];
const CAP = Object.fromEntries(GROUPS.map(g => [g[0], g[2]]));

const EXCLUDE = /Technic|Minifig|Duplo|Sticker|Magnet|Modulex|Fabuland|Belville|Znap|Clikits|Old Style|without Groove|without Bottom|Obsolete|Electric|Train|Monorail|Hose|String|Sign Holder|Baseplate|Pin Hole|Axle|Container|Brick 1[02] x 2[04]|Brick 8 x 1[06]|x 2[04]$|\bx 1[46]$/i;
const SIDE = /Stud on (1 )?Side|Studs on (1 |2 |4 )?Sides?|Bracket|Jumper|Headlight|Offset|Erling/i;

export function groupOf(cat, name) {
  if (SIDE.test(name) && [5, 9, 11, 14, 15, 19].includes(cat)) return 'side';
  if (/Arch/.test(name)) return 'arch';
  if (cat === 11) return 'brick';
  if (cat === 5) return /Grille|Log|Masonry|Profile/.test(name) ? 'decor' : 'brick';
  if (cat === 14 || cat === 9 || cat === 49) return 'plate';
  if (cat === 19 || cat === 67) return 'tile';
  if (cat === 15) return /Grille|Ingot|Gold Bar|Heart|Star/.test(name) ? 'decor' : 'tile';
  if (cat === 3) return 'slope';
  if (cat === 37 || cat === 6) return 'curve';
  if (cat === 20 || cat === 21) return 'round';
  if (cat === 16 || cat === 23 || cat === 32) return 'window';
  if (cat === 29 || cat === 36 || cat === 47) return 'vehicle';
  if (cat === 76 || cat === 28) return 'nature';
  return null;
}

/** "~Moved to 3023b" → "3023b.dat" (đi theo chuỗi chuyển). */
export function resolveMoved(lib, file) {
  for (let i = 0; i < 5; i++) {
    if (!lib.has(file)) return null;
    const t = lib.parse(file).header.title || '';
    const m = /^~Moved to\s+(\S+)/i.exec(t);
    if (!m) return /^~/.test(t) ? null : file;
    file = m[1].replace(/\.dat$/i, '') + '.dat';
  }
  return null;
}

const csvCell = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
export const COLUMNS = ['keep', 'key', 'group', 'nameVi', 'ldraw', 'rb', 'nameEn', 'sets', 'faces', 'conns', 'note'];

export function readPartsCsv(file = OUT) {
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  const head = parseCsvLine(lines.shift());
  return lines.map(l => { const c = parseCsvLine(l); return Object.fromEntries(head.map((h, i) => [h, c[i] ?? ''])); });
}
export function parseCsvLine(line) {
  const out = []; let cell = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { out.push(cell); cell = ''; } else cell += ch;
  }
  out.push(cell);
  return out;
}

if (process.argv[1].endsWith('select.mjs')) {
  const lib = new Library('tools/ldraw/lib/ldraw', 'tools/ldraw/shadow/LDCadShadowLibrary-main');
  const pop = popularity().sets;
  const parts = readCsv(`${RB}/parts.csv.gz`).filter(p => !/pr\d|pat\d|^\d+pb|^\d+p\d/.test(p.part_num));
  parts.sort((a, b) => (pop.get(b.part_num) || 0) - (pop.get(a.part_num) || 0));
  const existing = readPartsCsv();
  const have = new Set(existing.map(r => r.rb)), molds = new Set(existing.map(r => r.ldraw.replace(/\.dat$/, '').replace(/[a-z]$/, '')));
  const count = {};
  for (const r of existing) if (r.keep !== '0') count[r.group] = (count[r.group] || 0) + 1;
  const rows = [...existing];
  for (const p of parts) {
    const cat = Number(p.part_cat_id), group = groupOf(cat, p.name);
    if (!group || have.has(p.part_num) || EXCLUDE.test(p.name) || (count[group] || 0) >= CAP[group]) continue;
    const file = resolveMoved(lib, p.part_num + '.dat');
    if (!file) continue;
    const mold = file.replace(/\.dat$/, '').replace(/[a-z]$/, '');
    if (molds.has(mold)) continue; // biến thể chữ cái của cùng khuôn: giữ bản phổ biến nhất
    const conns = toConnectors(lib.flatten(file).snaps);
    const kinds = {}; for (const c of conns) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    const v1 = conns.some(c => V1_KINDS.has(c.kind)), v2 = conns.some(c => c.kind === 'clip' || c.kind === 'hinge');
    if (!v1 || (v2 && group !== 'window')) continue;
    const faces = buildMesh(lib.flatten(file, true)).triCount;
    molds.add(mold); have.add(p.part_num);
    count[group] = (count[group] || 0) + 1;
    rows.push({ keep: '1', key: file.replace(/\.dat$/, ''), group, nameVi: viName(p.name), ldraw: file, rb: p.part_num, nameEn: p.name, sets: pop.get(p.part_num) || 0, faces, conns: Object.entries(kinds).map(([k, v]) => `${k}:${v}`).join(' '), note: v2 ? 'v2-conn' : '' });
  }
  fs.mkdirSync('docs/brick-studio', { recursive: true });
  const text = '# Bộ mảnh v1 — sinh bởi scripts/bricks/select.mjs rồi rà tay. keep=0 để loại. key không bao giờ đổi.\n'
    + COLUMNS.join(',') + '\n' + rows.map(r => COLUMNS.map(c => csvCell(r[c] ?? '')).join(',')).join('\n') + '\n';
  fs.writeFileSync(OUT, text);
  console.log('rows', rows.length, count);
}
