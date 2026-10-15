// Dựng InstancedMesh cho toàn bộ mô hình (plan mục 8.2): mỗi (mảnh, nhóm vật liệu) một lưới, núm vẽ chung và ẩn núm bị che.
// Mọi toạ độ ở đây là LDraw (LDU); nhóm cha trong cảnh đổi sang không gian three.js.
import * as THREE from 'three';
import { ORIENTS } from '../engine/orient';
import type { World, Placed } from '../engine/world';
import type { V3 } from '../engine/types';
import type { PartLibrary, PartGeometry } from './loader';
import type { Bucket, Materials } from './materials';

const SHRINK = 0.998; // lộ đường ghép giữa hai mảnh cùng màu

export function pieceMatrix(pos: V3, o: number, out = new THREE.Matrix4(), shrink = SHRINK) {
  const r = ORIENTS[o];
  out.set(r[0] * shrink, r[1] * shrink, r[2] * shrink, pos[0], r[3] * shrink, r[4] * shrink, r[5] * shrink, pos[1], r[6] * shrink, r[7] * shrink, r[8] * shrink, pos[2], 0, 0, 0, 1);
  return out;
}
export const ldrawMatrix = (m: number[]) => new THREE.Matrix4().set(m[3], m[4], m[5], m[0], m[6], m[7], m[8], m[1], m[9], m[10], m[11], m[2], 0, 0, 0, 1);

/** Hình học con chỉ vẽ một nhóm màu (dùng chung thuộc tính đỉnh). */
const subCache = new WeakMap<THREE.BufferGeometry, Map<number, THREE.BufferGeometry>>();
export function subGeometry(pg: PartGeometry, color: number): THREE.BufferGeometry | null {
  const grp = pg.groups.find(g => g.color === color);
  if (!grp) return null;
  let map = subCache.get(pg.geometry);
  if (!map) { subCache.set(pg.geometry, (map = new Map())); const owned = map; pg.geometry.addEventListener("dispose", () => { for (const g of owned.values()) g.dispose(); owned.clear(); }); }
  let g = map.get(color);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute('position', pg.geometry.getAttribute('position'));
    g.setAttribute('normal', pg.geometry.getAttribute('normal'));
    g.setIndex(pg.geometry.getIndex());
    g.setDrawRange(grp.start, grp.count);
    g.boundingSphere = pg.geometry.boundingSphere;
    map.set(color, g);
  }
  return g;
}

export class ModelMeshes {
  readonly group = new THREE.Group();
  private meshes: THREE.InstancedMesh[] = [];
  /** Tra ngược: mesh + chỉ số instance → id mảnh (dùng cho tô sáng). */
  stats = { pieces: 0, studs: 0, drawCalls: 0, triangles: 0 };

  constructor(private lib: PartLibrary, private mats: Materials) {}

  /** `explode` 0..1: các mảnh bay tách xa tâm mô hình (plan mục 12 "Nổ tung"), tầng cao tách nhiều hơn. */
  rebuild(world: World, opts: { hidden?: Set<number>; explode?: number } = {}) {
    this.clear();
    const byPart = new Map<string, Placed[]>();
    for (const p of world.pieces.values()) {
      if (opts.hidden?.has(p.id)) continue;
      let list = byPart.get(p.part); if (!list) byPart.set(p.part, (list = [])); list.push(p);
    }
    const m = new THREE.Matrix4(), sm = new THREE.Matrix4(), tmp = new THREE.Matrix4();
    const shift = explodeOffsets(world, opts.explode ?? 0);
    const at = (p: Placed): V3 => { const d = shift.get(p.id); return d ? [p.pos[0] + d[0], p.pos[1] + d[1], p.pos[2] + d[2]] : p.pos; };
    const studs: Record<'s' | 'h', { m: THREE.Matrix4; color: THREE.Color; bucket: Bucket }[]> = { s: [], h: [] };
    let tris = 0;
    for (const [key, pieces] of byPart) {
      const pg = this.lib.geometry(key);
      if (!pg) continue;
      const part = world.catalog.parts[key];
      // nhóm màu chính, chia theo vật liệu
      const buckets: Record<Bucket, Placed[]> = { opaque: [], trans: [], shiny: [] };
      for (const p of pieces) buckets[this.mats.color(p.color).bucket].push(p);
      const main = subGeometry(pg, 16);
      for (const b of ['opaque', 'trans', 'shiny'] as Bucket[]) {
        const list = buckets[b];
        if (!list.length || !main) continue;
        const mesh = new THREE.InstancedMesh(main, this.mats.bucket[b], list.length);
        list.forEach((p, i) => { mesh.setMatrixAt(i, pieceMatrix(at(p), p.o, m)); mesh.setColorAt(i, this.mats.color(p.color).color); });
        this.add(mesh, b !== 'trans');
        tris += (pg.groups.find(g => g.color === 16)!.count / 3) * list.length;
      }
      // nhóm màu cố định (phần in, kính của bộ, lốp)
      for (const g of pg.groups) {
        if (g.color === 16) continue;
        const sub = subGeometry(pg, g.color)!;
        const mesh = new THREE.InstancedMesh(sub, this.mats.fixedMaterial(g.color), pieces.length);
        pieces.forEach((p, i) => mesh.setMatrixAt(i, pieceMatrix(at(p), p.o, m)));
        this.add(mesh, true);
        tris += (g.count / 3) * pieces.length;
      }
      // núm: bỏ núm đã bị mảnh khác cắm
      for (const p of pieces) {
        pieceMatrix(at(p), p.o, m, 1);
        for (const s of part.studs) {
          sm.copy(m).multiply(ldrawMatrix(s.m));
          const base = new THREE.Vector3().setFromMatrixPosition(sm);
          const ax = new THREE.Vector3(0, -1, 0).transformDirection(sm);
          const a: V3 = [Math.round(ax.x), Math.round(ax.y), Math.round(ax.z)];
          if (world.isCovered([Math.round(base.x * 8) / 8, Math.round(base.y * 8) / 8, Math.round(base.z * 8) / 8], a, 's')) continue;
          const col = s.c === 16 ? this.mats.color(p.color) : { color: new THREE.Color((world.catalog.fixedColors[String(s.c)]?.hex) ?? '#888'), bucket: 'opaque' as Bucket };
          studs[s.k].push({ m: tmp.copy(sm).clone(), color: col.color, bucket: col.bucket });
        }
      }
    }
    for (const k of ['s', 'h'] as const) {
      const sg = this.lib.stud![k];
      for (const b of ['opaque', 'trans', 'shiny'] as Bucket[]) {
        const list = studs[k].filter(s => s.bucket === b);
        if (!list.length) continue;
        const mesh = new THREE.InstancedMesh(sg.geometry, this.mats.stud(b), list.length);
        list.forEach((s, i) => { mesh.setMatrixAt(i, s.m); mesh.setColorAt(i, s.color); });
        this.add(mesh, b !== 'trans');
        tris += sg.geometry.getIndex()!.count / 3 * list.length;
        this.stats.studs += list.length;
      }
    }
    this.stats.pieces = world.pieces.size;
    this.stats.drawCalls = this.meshes.length;
    this.stats.triangles = Math.round(tris);
  }

  private add(mesh: THREE.InstancedMesh, opaque: boolean) {
    mesh.frustumCulled = false; // hộp bao của InstancedMesh là của hình gốc → tắt để không mất cả loại mảnh khi xoay
    mesh.castShadow = opaque; mesh.receiveShadow = true;
    if (!opaque) mesh.renderOrder = 2;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.meshes.push(mesh);
    this.group.add(mesh);
  }
  clear() {
    for (const m of this.meshes) { this.group.remove(m); m.dispose(); }
    this.meshes = [];
    this.stats = { pieces: 0, studs: 0, drawCalls: 0, triangles: 0 };
  }
}

/** Độ dời của từng mảnh khi "Nổ tung": theo hướng từ tâm mô hình ra, cộng tách tầng theo chiều cao. */
export function explodeOffsets(world: World, f: number): Map<number, V3> {
  const out = new Map<number, V3>();
  if (f <= 0 || !world.pieces.size) return out;
  let cx = 0, cz = 0, n = 0, top = 0;
  for (const p of world.pieces.values()) { cx += (p.bbox[0] + p.bbox[3]) / 2; cz += (p.bbox[2] + p.bbox[5]) / 2; n++; top = Math.min(top, p.bbox[1]); }
  cx /= n; cz /= n;
  for (const p of world.pieces.values()) {
    const x = (p.bbox[0] + p.bbox[3]) / 2 - cx, z = (p.bbox[2] + p.bbox[5]) / 2 - cz, y = (p.bbox[1] + p.bbox[4]) / 2;
    out.set(p.id, [x * 0.9 * f, y * 1.2 * f, z * 0.9 * f]);
  }
  return out;
}

/** Một mảnh đơn lẻ (bóng mờ, tô sáng): các Mesh con theo nhóm màu + núm. */
export function buildSingle(lib: PartLibrary, catalog: World['catalog'], key: string, material: (color: number) => THREE.Material): THREE.Group {
  const g = new THREE.Group(), pg = lib.geometry(key);
  if (!pg) return g;
  for (const grp of pg.groups) { const sub = subGeometry(pg, grp.color); if (sub) g.add(new THREE.Mesh(sub, material(grp.color))); }
  for (const s of catalog.parts[key].studs) {
    const mesh = new THREE.Mesh(lib.stud![s.k].geometry, material(s.c));
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(ldrawMatrix(s.m));
    g.add(mesh);
  }
  return g;
}
