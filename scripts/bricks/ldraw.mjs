// Đọc thư viện LDraw và shadow LDCad, làm phẳng một mảnh thành tam giác + núm + điểm nối.
// Toạ độ giữ nguyên quy ước LDraw (LDU, trục Y hướng xuống). Xem docs/brick-studio-plan.md mục 4.2, 5.1.
import fs from 'node:fs';
import path from 'node:path';
import { parseSnapLine, transformSnap, snapAllowed } from './snap.mjs';

/** Ma trận LDraw: [x y z a b c d e f g h i] — p' = R·p + t, R hàng-chính. */
export const IDENTITY = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
export function mul(A, B) {
  const [ax, ay, az, a, b, c, d, e, f, g, h, i] = A, [bx, by, bz, A2, B2, C2, D2, E2, F2, G2, H2, I2] = B;
  return [
    a * bx + b * by + c * bz + ax, d * bx + e * by + f * bz + ay, g * bx + h * by + i * bz + az,
    a * A2 + b * D2 + c * G2, a * B2 + b * E2 + c * H2, a * C2 + b * F2 + c * I2,
    d * A2 + e * D2 + f * G2, d * B2 + e * E2 + f * H2, d * C2 + e * F2 + f * I2,
    g * A2 + h * D2 + i * G2, g * B2 + h * E2 + i * H2, g * C2 + h * F2 + i * I2,
  ];
}
export const apply = (m, x, y, z) => [m[3] * x + m[4] * y + m[5] * z + m[0], m[6] * x + m[7] * y + m[8] * z + m[1], m[9] * x + m[10] * y + m[11] * z + m[2]];
export const det3 = m => m[3] * (m[7] * m[11] - m[8] * m[10]) - m[4] * (m[6] * m[11] - m[8] * m[9]) + m[5] * (m[6] * m[10] - m[7] * m[9]);
/** Ma trận có phải phép quay/soi thuần (không co giãn) không. */
export function isRigid(m, eps = 1e-4) {
  const col = k => Math.hypot(m[3 + k], m[6 + k], m[9 + k]);
  return [0, 1, 2].every(k => Math.abs(col(k) - 1) < eps) && Math.abs(Math.abs(det3(m)) - 1) < eps * 4;
}

/** Primitive núm được tách ra vẽ bằng instancing (mục 8.2). */
export const STUD_FILES = { 'stud.dat': 'solid', 'stud2.dat': 'hollow' };
/** Ống nhận núm dưới đáy: bản 'lite' bỏ hình học nhưng giữ điểm nối (mảnh lớn, mục 4.2 bước 7). */
export const LITE_SKIP = /^stud(3|4|6)[a-z0-9]*.dat$/;

export class Library {
  /** @param {string} root thư mục `ldraw` (chứa parts/, p/) · @param {string} [shadowRoot] thư mục LDCadShadowLibrary */
  constructor(root, shadowRoot) {
    this.root = root; this.shadowRoot = shadowRoot;
    this.files = new Map(); this.shadow = new Map();
    this.parsed = new Map(); this.flat = new Map(); this.snapCache = new Map();
    for (const dir of ['parts', 'p', 'models']) this.#index(path.join(root, dir), '', this.files, dir);
    if (shadowRoot) for (const dir of ['parts', 'p']) this.#index(path.join(shadowRoot, dir), '', this.shadow, dir);
    this.colours = parseColours(fs.readFileSync(path.join(root, 'LDConfig.ldr'), 'utf8'));
  }
  #index(dir, rel, map, top) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? rel + '/' + ent.name : ent.name;
      if (ent.isDirectory()) this.#index(path.join(dir, ent.name), r, map, top);
      else {
        const key = r.toLowerCase();
        // parts/ thắng p/ khi trùng tên (đúng thứ tự tìm của LDraw)
        if (!map.has(key)) map.set(key, path.join(dir, ent.name));
      }
    }
  }
  key(name) { return name.trim().replace(/\\/g, '/').toLowerCase(); }
  has(name) { return this.files.has(this.key(name)); }

  /** Phân tích một file thành lệnh, có cache. */
  parse(name) {
    const key = this.key(name);
    if (this.parsed.has(key)) return this.parsed.get(key);
    const file = this.files.get(key);
    if (!file) throw Error(`Không tìm thấy file LDraw: ${name}`);
    const res = parseLdraw(fs.readFileSync(file, 'utf8'));
    res.key = key;
    this.parsed.set(key, res);
    return res;
  }

  /** Các dòng SNAP_* trực tiếp trong file shadow cùng tên (không đệ quy). */
  shadowMetas(name) {
    const key = this.key(name);
    const file = this.shadow.get(key);
    if (!file) return [];
    const out = [];
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*0\s+!LDCAD\s+(SNAP_\w+)\s*(.*)$/.exec(line);
      if (m) out.push(parseSnapLine(m[1], m[2]));
    }
    return out;
  }

  /**
   * Làm phẳng một file về toạ độ cục bộ của chính nó.
   * Kết quả: tris (mỗi phần tử {p:[9], c, dbl}), edges ([6]), studs ({kind, m, c}), snaps.
   * Màu 16/24 giữ dạng tượng trưng để cha thay bằng màu của dòng tham chiếu.
   */
  flatten(name, lite = false) {
    const key = this.key(name), ck = (lite ? 'lite:' : '') + key;
    if (this.flat.has(ck)) return this.flat.get(ck);
    const base = key.split('/').pop();
    const out = { tris: [], edges: [], studs: [], snaps: [] };
    if (lite && LITE_SKIP.test(base)) {
      const full = this.flatten(name);
      const res = { tris: [], edges: [], studs: [], snaps: full.snaps };
      this.flat.set(ck, res);
      return res;
    }
    if (STUD_FILES[base]) {
      out.studs.push({ kind: STUD_FILES[base], m: IDENTITY, c: 16 });
    } else {
      const doc = this.parse(name);
      for (const cmd of doc.cmds) {
        if (cmd.t === 1) {
          let child;
          try { child = this.flatten(cmd.file, lite); }
          catch (e) { out.missing = [...(out.missing || []), cmd.file]; continue; }
          include(out, child, cmd, doc.certified && cmd.cull, this);
        } else if (cmd.t === 3 || cmd.t === 4) {
          const tri = (p) => out.tris.push({ p, c: cmd.c, dbl: !(doc.certified && cmd.cull) });
          const P = cmd.p;
          const ord = cmd.cw ? (a, b, c) => [...P.slice(a * 3, a * 3 + 3), ...P.slice(c * 3, c * 3 + 3), ...P.slice(b * 3, b * 3 + 3)]
            : (a, b, c) => [...P.slice(a * 3, a * 3 + 3), ...P.slice(b * 3, b * 3 + 3), ...P.slice(c * 3, c * 3 + 3)];
          tri(ord(0, 1, 2));
          if (cmd.t === 4) tri(ord(0, 2, 3));
        } else if (cmd.t === 2) out.edges.push(cmd.p);
      }
    }
    // Shadow: thừa kế từ con đã gom ở trên, rồi áp các dòng của chính file theo thứ tự (CLEAR xoá phần đã có).
    for (const meta of this.shadowMetas(name)) {
      if (meta.type === 'clear') out.snaps = meta.id ? out.snaps.filter(s => (s.id || '').toLowerCase() !== meta.id.toLowerCase()) : [];
      else if (meta.type === 'incl') {
        for (const inc of this.shadowMetas(meta.ref)) {
          if (inc.type === 'clear' || inc.type === 'incl') continue;
          for (const g of gridOffsets(meta.grid)) out.snaps.push(...expandGrid(transformSnap(inc, mul([...addv(meta.pos, applyOri(meta.ori, g)), ...meta.ori], IDENTITY))));
        }
      } else out.snaps.push(...expandGrid(meta));
    }
    this.flat.set(ck, out);
    return out;
  }
}

const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const applyOri = (o, v) => [o[0] * v[0] + o[1] * v[1] + o[2] * v[2], o[3] * v[0] + o[4] * v[1] + o[5] * v[2], o[6] * v[0] + o[7] * v[1] + o[8] * v[2]];

/** Lưới của SNAP: "C 4 C 2 20 20" → danh sách độ lệch (x, 0, z) trong khung `ori`. */
export function gridOffsets(grid) {
  if (!grid) return [[0, 0, 0]];
  const t = grid.trim().split(/\s+/);
  let k = 0;
  const axis = () => { const c = t[k] === 'C' || t[k] === 'c'; if (c) k++; return { c, n: Number(t[k++]) }; };
  const X = axis(), Z = axis(), sx = Number(t[k++]), sz = Number(t[k++]);
  const offs = [];
  for (let i = 0; i < X.n; i++) for (let j = 0; j < Z.n; j++)
    offs.push([(X.c ? i - (X.n - 1) / 2 : i) * sx, 0, (Z.c ? j - (Z.n - 1) / 2 : j) * sz]);
  return offs;
}
/** Bung lưới của một snap thành nhiều snap đơn. */
export function expandGrid(s) {
  if (!s.grid) return [s];
  return gridOffsets(s.grid).map(g => ({ ...s, grid: undefined, pos: addv(s.pos, applyOri(s.ori, g)) }));
}

function include(out, child, cmd, cull, lib) {
  const m = cmd.m, flip = (det3(m) < 0) !== !!cmd.invert;
  const col = c => c === 16 ? cmd.c : c === 24 ? (cmd.c === 16 ? 24 : lib.colours.get(cmd.c)?.edgeCode ?? 24) : c;
  for (const t of child.tris) {
    const a = apply(m, t.p[0], t.p[1], t.p[2]), b = apply(m, t.p[3], t.p[4], t.p[5]), c = apply(m, t.p[6], t.p[7], t.p[8]);
    out.tris.push({ p: flip ? [...a, ...c, ...b] : [...a, ...b, ...c], c: col(t.c), dbl: t.dbl || !cull });
  }
  for (const e of child.edges) out.edges.push([...apply(m, e[0], e[1], e[2]), ...apply(m, e[3], e[4], e[5])]);
  for (const s of child.studs) out.studs.push({ kind: s.kind, m: mul(m, s.m), c: col(s.c) });
  const rigid = isRigid(m), mirrored = det3(m) < 0;
  for (const s of child.snaps) if (snapAllowed(s, rigid, mirrored)) out.snaps.push(transformSnap(s, m));
  if (child.missing) out.missing = [...(out.missing || []), ...child.missing];
}

/** Phân tích văn bản LDraw (một file). */
export function parseLdraw(text) {
  const doc = { header: {}, cmds: [], certified: false };
  let ccw = true, invertNext = false, clip = true, seenGeometry = false;
  const lines = text.split(/\r?\n/);
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n].trim();
    if (!line) continue;
    const tok = line.split(/\s+/), type = tok[0];
    if (type === '0') {
      const rest = line.slice(1).trim();
      // Dòng 0 đầu tiên của file là tiêu đề (đặc tả LDraw).
      if (doc.header.title === undefined) { doc.header.title = rest; continue; }
      let m;
      if ((m = /^Name:\s*(.+)$/i.exec(rest))) doc.header.name = m[1].trim();
      else if ((m = /^Author:\s*(.+)$/i.exec(rest))) doc.header.author = m[1].trim();
      else if ((m = /^!LICENSE\s+(.+)$/i.exec(rest))) doc.header.license = m[1].trim();
      else if ((m = /^!LDRAW_ORG\s+(.+)$/i.exec(rest))) doc.header.type = m[1].trim();
      else if ((m = /^!CATEGORY\s+(.+)$/i.exec(rest))) doc.header.category = m[1].trim();
      else if ((m = /^!KEYWORDS\s+(.+)$/i.exec(rest))) doc.header.keywords = [...(doc.header.keywords || []), ...m[1].split(',').map(s => s.trim()).filter(Boolean)];
      else if ((m = /^BFC\s+(.*)$/i.exec(rest))) {
        const w = m[1].toUpperCase().split(/\s+/);
        if (w.includes('NOCERTIFY')) doc.certified = false;
        else if (w.includes('CERTIFY')) doc.certified = true;
        if (w.includes('CW')) ccw = false;
        if (w.includes('CCW')) ccw = true;
        if (w.includes('INVERTNEXT')) invertNext = true;
        if (w.includes('NOCLIP')) clip = false;
        else if (w.includes('CLIP')) clip = true;
      }
      continue;
    }
    seenGeometry = true;
    const nums = tok.slice(1).map(Number);
    if (type === '1') {
      doc.cmds.push({ t: 1, c: nums[0], m: nums.slice(1, 13), file: tok.slice(14).join(' '), invert: invertNext, cull: clip });
      invertNext = false;
    } else if (type === '2') doc.cmds.push({ t: 2, c: nums[0], p: nums.slice(1, 7) });
    else if (type === '3') doc.cmds.push({ t: 3, c: nums[0], p: nums.slice(1, 10), cw: !ccw, cull: clip });
    else if (type === '4') doc.cmds.push({ t: 4, c: nums[0], p: nums.slice(1, 13), cw: !ccw, cull: clip });
    else if (type === '5') doc.cmds.push({ t: 5, c: nums[0], p: nums.slice(1, 13) });
  }
  return doc;
}

/** Bảng màu LDConfig: code → {name, value, edge, edgeCode, alpha, material}. */
export function parseColours(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*0\s+!COLOUR\s+(\S+)\s+CODE\s+(\d+)\s+VALUE\s+#?([0-9A-Fa-f]{6})\s+EDGE\s+#?(\S+)(.*)$/.exec(line);
    if (!m) continue;
    const rest = m[5];
    const alpha = /ALPHA\s+(\d+)/.exec(rest);
    map.set(Number(m[2]), {
      name: m[1], code: Number(m[2]), value: '#' + m[3].toUpperCase(), edge: '#' + m[4].toUpperCase(),
      alpha: alpha ? Number(alpha[1]) : 255,
      material: /CHROME/.test(rest) ? 'chrome' : /PEARLESCENT/.test(rest) ? 'pearl' : /METAL/.test(rest) ? 'metal' : /RUBBER/.test(rest) ? 'rubber' : /MATERIAL/.test(rest) ? 'special' : 'plastic',
    });
  }
  return map;
}
