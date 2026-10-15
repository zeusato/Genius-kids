// Nạp catalog.json + hình học .bin (theo nhóm, khi cần) → THREE.BufferGeometry trong toạ độ LDraw (LDU).
import * as THREE from 'three';
import type { Catalog, MeshRef } from '../engine/types';

const BASE = `${import.meta.env.BASE_URL}bricks/`;

function octDecode(a: number, b: number, out: Float32Array, i: number) {
  let x = a / 127, y = b / 127;
  const z = 1 - Math.abs(x) - Math.abs(y);
  if (z < 0) { const ox = x; x = (1 - Math.abs(y)) * Math.sign(ox || 1); y = (1 - Math.abs(ox)) * Math.sign(y || 1); }
  const l = Math.hypot(x, y, z) || 1;
  out[i] = x / l; out[i + 1] = y / l; out[i + 2] = z / l;
}

/** Một lưới đã giải mã: hình học + các nhóm màu (16 = màu bé chọn). */
export interface PartGeometry { geometry: THREE.BufferGeometry; groups: { color: number; start: number; count: number }[] }

export function decodeMesh(buf: ArrayBuffer, ref: MeshRef, posScale: number): PartGeometry {
  const pos = new Int16Array(buf, ref.pos[0], ref.pos[1]), nrm = new Int8Array(buf, ref.nrm[0], ref.nrm[1]);
  const idx = ref.i32 ? new Uint32Array(buf, ref.idx[0], ref.idx[1]) : new Uint16Array(buf, ref.idx[0], ref.idx[1]);
  const P = new Float32Array(pos.length), N = new Float32Array(ref.vc * 3);
  for (let i = 0; i < pos.length; i++) P[i] = pos[i] / posScale;
  for (let i = 0; i < ref.vc; i++) octDecode(nrm[i * 2], nrm[i * 2 + 1], N, i * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setIndex(new THREE.BufferAttribute(ref.i32 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
  g.computeBoundingSphere();
  return { geometry: g, groups: ref.groups };
}

/**
 * Bóng che "nướng sẵn" cho núm: vách núm tối dần về chân (y = 0 là mặt mảnh, y = −4 là đỉnh núm, LDraw Y xuống).
 * Vách núm chỉ cao 4 LDU — không có vòng tối ở chân thì núm hoà vào mặt mảnh, trông như trong suốt (lỗi 15/10).
 * Hoạt động ở mọi mức chất lượng (kể cả Thấp, không có N8AO). Vật liệu núm bật vertexColors (Materials.stud).
 */
export function shadeStudBase(g: THREE.BufferGeometry) {
  const P = g.getAttribute('position'), C = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { const t = Math.min(1, Math.max(0, -P.getY(i) / 4)); const v = 0.5 + 0.5 * t; C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = v; }
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
}

/**
 * Sửa vách núm quay vào trong (studs.bin sinh trước bản vá BFC của scripts/bricks-parts.mjs): vách ngoài (r ≈ 6) phải quay ra,
 * vách trong của núm rỗng (r < 5) quay vào. Đảo chiều tam giác + pháp tuyến sai; dữ liệu đúng thì không đổi gì.
 */
export function fixStudWalls(g: THREE.BufferGeometry) {
  const P = g.getAttribute('position'), N = g.getAttribute('normal'), I = g.getIndex()!;
  const want = (x: number, z: number) => { const r = Math.hypot(x, z) || 1, s = r > 5 ? 1 : -1; return [s * x / r, s * z / r]; };
  for (let t = 0; t < I.count; t += 3) {
    const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2);
    const ux = P.getX(b) - P.getX(a), uy = P.getY(b) - P.getY(a), uz = P.getZ(b) - P.getZ(a), vx = P.getX(c) - P.getX(a), vy = P.getY(c) - P.getY(a), vz = P.getZ(c) - P.getZ(a);
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (Math.abs(ny) > 0.3 * Math.hypot(nx, ny, nz)) continue;             // nắp núm: bỏ qua
    const [wx, wz] = want((P.getX(a) + P.getX(b) + P.getX(c)) / 3, (P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3);
    if (nx * wx + nz * wz < 0) { I.setX(t + 1, c); I.setX(t + 2, b); }
  }
  for (let i = 0; i < N.count; i++) {
    if (Math.abs(N.getY(i)) > 0.3) continue;
    const [wx, wz] = want(P.getX(i), P.getZ(i));
    if (N.getX(i) * wx + N.getZ(i) * wz < 0) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i));
  }
  I.needsUpdate = true; N.needsUpdate = true;
}

export class PartLibrary {
  private disposed = false;
  private bins = new Map<string, Promise<ArrayBuffer>>();
  private geos = new Map<string, PartGeometry>();
  stud: Record<'s' | 'h', PartGeometry> | null = null;
  private constructor(readonly catalog: Catalog) {}

  static async load(): Promise<PartLibrary> {
    const res = await fetch(BASE + 'catalog.json');
    if (!res.ok) throw Error('Không tải được danh mục mảnh ghép.');
    const lib = new PartLibrary(await res.json());
    const sb = await lib.bin(lib.catalog.studBin);
    lib.stud = { s: decodeMesh(sb, lib.catalog.studs.s.mesh, lib.catalog.posScale), h: decodeMesh(sb, lib.catalog.studs.h.mesh, lib.catalog.posScale) };
    for (const g of Object.values(lib.stud)) { fixStudWalls(g.geometry); shadeStudBase(g.geometry); }
    return lib;
  }
  private bin(file: string) {
    let p = this.bins.get(file);
    if (!p) { p = fetch(BASE + file).then(r => { if (!r.ok) throw Error('Không tải được hình mảnh ghép.'); return r.arrayBuffer(); }).catch(e => { this.bins.delete(file); throw e; }); this.bins.set(file, p); }
    return p;
  }
  /** Tải sẵn hình học của các nhóm (lần đầu mở nhóm). */
  async ensureGroups(groups: string[]) {
    await Promise.all(groups.map(async id => {
      const g = this.catalog.groups.find(x => x.id === id);
      if (!g) return;
      const buf = await this.bin(g.bin);
      if (this.disposed) return;
      for (const key of g.parts) if (!this.geos.has(key)) this.geos.set(key, decodeMesh(buf, this.catalog.parts[key].mesh, this.catalog.posScale));
    }));
  }
  async ensureParts(keys: Iterable<string>) {
    const groups = new Set<string>();
    for (const k of keys) if (!this.geos.has(k) && this.catalog.parts[k]) groups.add(this.catalog.parts[k].group);
    if (groups.size) await this.ensureGroups([...groups]);
  }
  geometry(key: string) { return this.geos.get(key); }
  has(key: string) { return this.geos.has(key); }
  dispose() { this.disposed = true; this.bins.clear(); for (const g of this.geos.values()) g.geometry.dispose(); this.geos.clear(); if (this.stud) { this.stud.s.geometry.dispose(); this.stud.h.geometry.dispose(); } }
}
