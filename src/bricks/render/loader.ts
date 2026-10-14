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
