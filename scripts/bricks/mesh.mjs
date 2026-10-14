// Tam giác LDraw đã làm phẳng → lưới có chỉ số, pháp tuyến mượt theo cạnh cứng, chia nhóm theo màu.
// Cạnh cứng = đường type 2 của LDraw (mục 4.2 bước 3). Mặt hai phía (không chứng nhận BFC) được nhân đôi.

const Q = 16; // khoá hàn đỉnh: 1/16 LDU
const key3 = (x, y, z) => `${Math.round(x * Q)},${Math.round(y * Q)},${Math.round(z * Q)}`;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a); return l > 0 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0]; };

/**
 * @param {{tris:{p:number[],c:number,dbl:boolean}[], edges:number[][]}} flat
 * @param {{smoothDeg?:number}} [opt]
 * @returns {{positions:Float32Array, normals:Float32Array, groups:{color:number, indices:number[]}[], triCount:number, bbox:number[][]}}
 */
export function buildMesh(flat, opt = {}) {
  const cosMax = Math.cos(((opt.smoothDeg ?? 70) * Math.PI) / 180);
  // 1. Mặt: bỏ tam giác suy biến, nhân đôi mặt hai phía.
  const faces = [];
  for (const t of flat.tris) {
    const a = t.p.slice(0, 3), b = t.p.slice(3, 6), c = t.p.slice(6, 9);
    const n = cross(sub(b, a), sub(c, a)), area = Math.hypot(...n) / 2;
    if (area < 1e-6) continue;
    faces.push({ v: [a, b, c], c: t.c, n: norm(n), area });
    if (t.dbl) faces.push({ v: [a, c, b], c: t.c, n: norm(n).map(x => -x), area });
  }
  // 2. Hàn vị trí.
  const posId = new Map(), pos = [];
  const pid = p => { const k = key3(...p); let i = posId.get(k); if (i === undefined) { i = pos.length; posId.set(k, i); pos.push(p); } return i; };
  for (const f of faces) f.ids = f.v.map(pid);
  // 3. Cạnh cứng.
  const hard = new Set();
  const ekey = (i, j) => (i < j ? i + '_' + j : j + '_' + i);
  for (const e of flat.edges) {
    const i = posId.get(key3(e[0], e[1], e[2])), j = posId.get(key3(e[3], e[4], e[5]));
    if (i !== undefined && j !== undefined) hard.add(ekey(i, j));
  }
  // 4. Nhóm làm mượt quanh từng đỉnh: hai mặt nối nếu chung một cạnh không cứng và lệch góc nhỏ.
  const incident = pos.map(() => []);
  faces.forEach((f, fi) => f.ids.forEach((id, k) => incident[id].push([fi, k])));
  const outPos = [], outNrm = [], cornerVert = faces.map(() => [0, 0, 0]);
  for (let v = 0; v < pos.length; v++) {
    const inc = incident[v];
    const parent = inc.map((_, i) => i);
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < inc.length; i++) for (let j = i + 1; j < inc.length; j++) {
      const fa = faces[inc[i][0]], fb = faces[inc[j][0]];
      if (dot(fa.n, fb.n) < cosMax) continue;
      // chung cạnh (v, w) với w khác v
      const shared = fa.ids.find(w => w !== v && fb.ids.includes(w));
      if (shared === undefined || hard.has(ekey(v, shared))) continue;
      parent[find(i)] = find(j);
    }
    const groups = new Map();
    inc.forEach(([fi, k], i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push([fi, k]); });
    for (const members of groups.values()) {
      let n = [0, 0, 0];
      for (const [fi] of members) { const f = faces[fi]; n = [n[0] + f.n[0] * f.area, n[1] + f.n[1] * f.area, n[2] + f.n[2] * f.area]; }
      const id = outPos.length / 3;
      outPos.push(...pos[v]); outNrm.push(...norm(n));
      for (const [fi, k] of members) cornerVert[fi][k] = id;
    }
  }
  // 5. Chỉ số theo màu.
  const byColor = new Map();
  faces.forEach((f, fi) => { const c = f.c === 24 ? 16 : f.c; if (!byColor.has(c)) byColor.set(c, []); byColor.get(c).push(...cornerVert[fi]); });
  const groups = [...byColor.entries()].sort((a, b) => (a[0] === 16 ? -1 : b[0] === 16 ? 1 : a[0] - b[0])).map(([color, indices]) => ({ color, indices }));
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < outPos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], outPos[i + k]); max[k] = Math.max(max[k], outPos[i + k]); }
  return { positions: Float32Array.from(outPos), normals: Float32Array.from(outNrm), groups, triCount: faces.length, bbox: [min, max] };
}

/** Mã hoá pháp tuyến octahedral về 2 số nguyên int8. */
export function octEncode(n) {
  const l1 = Math.abs(n[0]) + Math.abs(n[1]) + Math.abs(n[2]) || 1;
  let x = n[0] / l1, y = n[1] / l1;
  if (n[2] < 0) { const ox = x; x = (1 - Math.abs(y)) * Math.sign(ox || 1); y = (1 - Math.abs(ox)) * Math.sign(y || 1); }
  return [Math.round(x * 127), Math.round(y * 127)];
}
export function octDecode(a, b) {
  let x = a / 127, y = b / 127;
  const z = 1 - Math.abs(x) - Math.abs(y);
  if (z < 0) { const ox = x; x = (1 - Math.abs(y)) * Math.sign(ox || 1); y = (1 - Math.abs(ox)) * Math.sign(y || 1); }
  return norm([x, y, z]);
}

export const POS_SCALE = 8; // Int16 = LDU × 8 (độ phân giải 0,125 LDU = 0,05 mm)

/** Đóng gói lưới thành các mảng nhị phân. Trả về {buffers:[{name, data:TypedArray}], meta}. */
export function packMesh(mesh) {
  const vc = mesh.positions.length / 3;
  const pos = new Int16Array(vc * 3), nrm = new Int8Array(vc * 2);
  for (let i = 0; i < vc * 3; i++) {
    const q = Math.round(mesh.positions[i] * POS_SCALE);
    if (Math.abs(q) > 32767) throw Error('Mảnh quá lớn để lượng tử hoá Int16');
    pos[i] = q;
  }
  for (let i = 0; i < vc; i++) { const [a, b] = octEncode([mesh.normals[i * 3], mesh.normals[i * 3 + 1], mesh.normals[i * 3 + 2]]); nrm[i * 2] = a; nrm[i * 2 + 1] = b; }
  const all = mesh.groups.flatMap(g => g.indices);
  const idx = vc > 65535 ? Uint32Array.from(all) : Uint16Array.from(all);
  let start = 0;
  const groups = mesh.groups.map(g => { const r = { color: g.color, start, count: g.indices.length }; start += g.indices.length; return r; });
  return { vertexCount: vc, index32: vc > 65535, groups, arrays: { pos, nrm, idx } };
}
