// Liệt kê mảnh ứng viên theo độ phổ biến (Rebrickable) để tuyển parts-v1.csv (mục 6.1).
// node scripts/bricks/candidates.mjs [sốMỗiNhóm=40] > tools/ldraw/candidates.tsv
import fs from 'node:fs';
import zlib from 'node:zlib';
import { Library } from './ldraw.mjs';
import { toConnectors, V1_KINDS } from './snap.mjs';

export const RB = 'tools/ldraw/rebrickable';
export function readCsv(file) {
  const text = zlib.gunzipSync(fs.readFileSync(file)).toString('utf8');
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

/** Số bộ (inventory) có dùng mảnh, và số bộ theo từng (mảnh, màu). */
export function popularity() {
  const sets = new Map(), byColor = new Map();
  for (const r of readCsv(`${RB}/inventory_parts.csv.gz`)) {
    if (r.is_spare === 'True') continue;
    const k = r.part_num;
    if (!sets.has(k)) sets.set(k, new Set());
    sets.get(k).add(r.inventory_id);
    const kc = k + '|' + r.color_id;
    byColor.set(kc, (byColor.get(kc) || 0) + 1);
  }
  return { sets: new Map([...sets].map(([k, v]) => [k, v.size])), byColor };
}

// Nhóm Rebrickable được xét cho v1 (bỏ Technic, minifig, Duplo, nhãn dán…)
export const CATS = new Set([3, 5, 6, 9, 11, 14, 15, 16, 19, 20, 21, 23, 28, 29, 32, 36, 37, 47, 49, 67, 76]);

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('candidates.mjs')) {
  const perCat = Number(process.argv[2] || 40);
  const lib = new Library('tools/ldraw/lib/ldraw', 'tools/ldraw/shadow/LDCadShadowLibrary-main');
  const cats = new Map(readCsv(`${RB}/part_categories.csv.gz`).map(r => [Number(r.id), r.name]));
  const pop = popularity().sets;
  const parts = readCsv(`${RB}/parts.csv.gz`).filter(p => CATS.has(Number(p.part_cat_id)) && !/pr\d|pat\d|^\d+pb/.test(p.part_num));
  parts.sort((a, b) => (pop.get(b.part_num) || 0) - (pop.get(a.part_num) || 0));
  const taken = new Map();
  console.log(['cat', 'part', 'sets', 'name', 'ldraw', 'conns', 'note'].join('\t'));
  for (const p of parts) {
    const cat = Number(p.part_cat_id);
    if ((taken.get(cat) || 0) >= perCat) continue;
    const file = p.part_num + '.dat';
    let note = '', conns = '';
    if (!lib.has(file)) note = 'NO_LDRAW';
    else {
      const doc = lib.parse(file);
      if (/^~/.test(doc.header.title || '')) note = 'MOVED:' + doc.header.title;
      else {
        const c = toConnectors(lib.flatten(file).snaps), cnt = {};
        for (const x of c) cnt[x.kind] = (cnt[x.kind] || 0) + 1;
        conns = Object.entries(cnt).map(([k, v]) => k + ':' + v).join(' ');
        if (!c.some(x => V1_KINDS.has(x.kind))) note = 'NO_V1_CONN';
        else if (c.some(x => x.kind === 'clip' || x.kind === 'hinge')) note = 'V2_CONN';
      }
    }
    if (note.startsWith('NO_LDRAW')) continue;
    taken.set(cat, (taken.get(cat) || 0) + 1);
    console.log([cats.get(cat), p.part_num, pop.get(p.part_num) || 0, p.name, file, conns, note].join('\t'));
  }
}
