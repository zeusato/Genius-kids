// Chỉ mục mảnh đã lắp: va chạm, điểm nối tự do/đã khớp, mảnh lơ lửng, chọn điểm bằng tia.
// Luật (plan mục 5.3): hợp lệ ⇔ trong vùng xây + không va chạm + ≥ 1 cặp điểm nối khớp (hoặc đặt trên mặt bàn).
import { preparePart, type OrientedPart, type PartDef } from './parts';
import type { Box, Catalog, ConnKind, Piece, V3 } from './types';

export const AREA = { min: -640, max: 640, height: 1536 } as const; // 64×64 núm, cao ≈ 61 cm (LDU, Y xuống)
export const TOL = 2.5;        // hai hộp phải lấn nhau > 2,5 LDU mới tính va chạm (hộp voxel có thể phình ≤ 2 LDU; va chạm thật ≥ 4 LDU)
const CELL = 80;               // ô băm không gian (LDU)
const STUD_R = { s: 6, p: 4 } as const;

const q = (v: number) => Math.round(v * 8);
export const connKey = (p: V3, a: V3) => `${q(p[0])},${q(p[1])},${q(p[2])}|${a[0]},${a[1]},${a[2]}`;
const FAMILY: Record<ConnKind, { fam: 'S' | 'P'; male: boolean }> = { s: { fam: 'S', male: true }, a: { fam: 'S', male: false }, p: { fam: 'P', male: true }, h: { fam: 'P', male: false } };

export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const shift = (b: Box, t: V3): Box => [b[0] + t[0], b[1] + t[1], b[2] + t[2], b[3] + t[0], b[4] + t[1], b[5] + t[2]];
export const overlap = (a: Box, b: Box, tol = TOL) => a[0] < b[3] - tol && b[0] < a[3] - tol && a[1] < b[4] - tol && b[1] < a[4] - tol && a[2] < b[5] - tol && b[2] < a[5] - tol;

/** Thể tích của một núm/chốt dùng để chặn núm đâm vào thân mảnh khác khi không có lỗ khớp. */
function studBox(p: V3, a: V3, r: number, len = 4): Box {
  const e = add3(p, [a[0] * len, a[1] * len, a[2] * len]);
  const lo = [0, 1, 2].map(i => Math.min(p[i], e[i]) - (a[i] === 0 ? r : 0));
  const hi = [0, 1, 2].map(i => Math.max(p[i], e[i]) + (a[i] === 0 ? r : 0));
  return [lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]];
}

export interface Placed extends Piece { def: PartDef; geo: OrientedPart; boxes: Box[]; bbox: Box; female: Set<string> }
export type Problem = 'collide' | 'noJoin' | 'outside' | 'smooth';
/** `lift`: mảnh mới thò xuống dưới mặt bàn → nâng cả cụm đang nối lên `dy` (Y âm = lên), như lắp bánh làm xe kênh lên. */
export interface Check { ok: boolean; reason?: Problem; joins: { key: string; other: number | 'ground' }[]; lift?: { ids: number[]; dy: number } }

export class World {
  readonly defs = new Map<string, PartDef>();
  readonly pieces = new Map<number, Placed>();      // giữ thứ tự lắp (Map giữ thứ tự chèn)
  private cells = new Map<string, Set<number>>();
  private conns = new Map<string, { m: Set<number>; f: Set<number> }>(); // khoá: họ|vị trí|trục
  private nextId = 1;
  constructor(readonly catalog: Catalog) {}

  def(key: string): PartDef {
    let d = this.defs.get(key);
    if (!d) { const src = this.catalog.parts[key]; if (!src) throw Error(`Mảnh lạ: ${key}`); d = preparePart(key, src); this.defs.set(key, d); }
    return d;
  }

  /** Hình đặt thử (chưa ghi vào chỉ mục). */
  shape(part: string, pos: V3, o: number) {
    const def = this.def(part), geo = def.oriented(o);
    return { def, geo, boxes: geo.boxes.map(b => shift(b, pos)), bbox: shift(geo.bbox, pos) };
  }

  private cellKeys(b: Box) {
    const out: string[] = [];
    for (let x = Math.floor(b[0] / CELL); x <= Math.floor(b[3] / CELL); x++)
      for (let y = Math.floor(b[1] / CELL); y <= Math.floor(b[4] / CELL); y++)
        for (let z = Math.floor(b[2] / CELL); z <= Math.floor(b[5] / CELL); z++) out.push(`${x},${y},${z}`);
    return out;
  }
  /** Mảnh có hộp bao giao với hộp b. */
  near(b: Box): Placed[] {
    const ids = new Set<number>();
    for (const k of this.cellKeys(b)) for (const id of this.cells.get(k) || []) ids.add(id);
    return [...ids].map(id => this.pieces.get(id)!).filter(p => overlap(p.bbox, b, -1));
  }

  /** Kiểm tra đặt mảnh. `ignore`: mảnh bỏ qua (khi dời/xoay tại chỗ). */
  check(part: string, pos: V3, o: number, ignore?: Set<number>, why?: string[]): Check {
    const { geo, boxes, bbox } = this.shape(part, pos, o);
    if (bbox[0] < AREA.min || bbox[3] > AREA.max || bbox[2] < AREA.min || bbox[5] > AREA.max || bbox[1] < -AREA.height) return { ok: false, reason: 'outside', joins: [] };
    const myConns = geo.conns.map(c => ({ ...c, p: add3(c.p, pos) }));
    const myFemale = new Set(myConns.filter(c => !FAMILY[c.k].male).map(c => FAMILY[c.k].fam + connKey(c.p, c.a)));
    const neighbors = this.near([bbox[0] - 8, bbox[1] - 8, bbox[2] - 8, bbox[3] + 8, bbox[4] + 8, bbox[5] + 8]).filter(p => !ignore?.has(p.id));
    for (const n of neighbors) {
      // lọc nhanh: chỉ so những hộp con nằm trong vùng giao của hai hộp bao
      const nb = n.bbox;
      const mine = boxes.filter(a => overlap(a, nb));
      if (mine.length) {
        const theirs = n.boxes.filter(b => overlap(b, bbox));
        for (const a of mine) for (const b of theirs) if (overlap(a, b)) { why?.push(`box ${a} × ${n.part}#${n.id} ${b}`); return { ok: false, reason: 'collide', joins: [] }; }
      }
      // núm của mảnh mới đâm vào thân mảnh cũ (trừ khi mảnh cũ có lỗ khớp đúng chỗ)
      const theirFemale = n.female;
      for (const c of myConns) if (FAMILY[c.k].male) {
        const sb = studBox(c.p, c.a, STUD_R[c.k as 's' | 'p'] - 1);
        if (!overlap(sb, nb) || theirFemale.has(FAMILY[c.k].fam + connKey(c.p, c.a))) continue;
        if (n.boxes.some(b => overlap(sb, b))) { why?.push(`my stud ${c.k}@${c.p} × ${n.part}`); return { ok: false, reason: 'collide', joins: [] }; }
      }
      for (const c of n.geo.studs) {
        const p = add3(c.p, n.pos), sb = studBox(p, c.a, STUD_R[c.k as 's' | 'p'] - 1);
        if (!overlap(sb, bbox) || myFemale.has(FAMILY[c.k].fam + connKey(p, c.a))) continue;
        if (boxes.some(b => overlap(sb, b))) { why?.push(`their stud ${c.k}@${p} of ${n.part}`); return { ok: false, reason: 'collide', joins: [] }; }
      }
    }
    const joins = this.joinsOf(myConns, ignore);
    if (!joins.length) return { ok: false, reason: geo.conns.some(c => !FAMILY[c.k].male) || geo.studs.length ? 'noJoin' : 'smooth', joins };
    if (bbox[4] > TOL) {
      // Thò xuống dưới mặt bàn: chỉ được khi nối vào mảnh khác, và cả cụm nâng lên được mà không va chạm.
      const dy = -Math.ceil(bbox[4]);
      const group = new Set<number>();
      for (const j of joins) if (j.other !== 'ground') for (const id of this.component(j.other, ignore)) group.add(id);
      if (!group.size) return { ok: false, reason: 'outside', joins };
      if (!this.canShift(group, dy, boxes.map(b => [b[0], b[1] + dy, b[2], b[3], b[4] + dy, b[5]] as Box), ignore)) return { ok: false, reason: 'collide', joins };
      return { ok: true, joins, lift: { ids: [...group], dy } };
    }
    return { ok: true, joins };
  }

  /** Các cặp khớp giữa tập điểm nối (toạ độ thế giới) và chỉ mục, kể cả mặt bàn. */
  joinsOf(conns: { k: ConnKind; p: V3; a: V3 }[], ignore?: Set<number>) {
    const joins: { key: string; other: number | 'ground' }[] = [];
    for (const c of conns) {
      const f = FAMILY[c.k], key = connKey(c.p, c.a), slot = this.conns.get(f.fam + key);
      const others = slot ? (f.male ? slot.f : slot.m) : undefined;
      if (others) for (const id of others) if (!ignore?.has(id)) joins.push({ key, other: id });
      if (c.k === 'a' && isGroundStud(c.p, c.a)) joins.push({ key, other: 'ground' });
    }
    return joins;
  }

  add(part: string, color: string, pos: V3, o: number, id?: number): Placed {
    const s = this.shape(part, pos, o);
    const female = new Set(s.geo.conns.filter(c => !FAMILY[c.k].male).map(c => FAMILY[c.k].fam + connKey(add3(c.p, pos), c.a)));
    const piece: Placed = { id: id ?? this.nextId++, part, color, pos, o, ...s, female };
    if (id && id >= this.nextId) this.nextId = id + 1;
    this.pieces.set(piece.id, piece);
    this.index(piece);
    return piece;
  }
  private index(piece: Placed) {
    for (const k of this.cellKeys(piece.bbox)) { let set = this.cells.get(k); if (!set) this.cells.set(k, (set = new Set())); set.add(piece.id); }
    for (const c of piece.geo.conns) {
      const f = FAMILY[c.k], key = f.fam + connKey(add3(c.p, piece.pos), c.a);
      let slot = this.conns.get(key); if (!slot) this.conns.set(key, (slot = { m: new Set(), f: new Set() }));
      (f.male ? slot.m : slot.f).add(piece.id);
    }
  }
  private unindex(piece: Placed) {
    for (const k of this.cellKeys(piece.bbox)) {
      const cell = this.cells.get(k);
      if (cell) { cell.delete(piece.id); if (!cell.size) this.cells.delete(k); }
    }
    for (const c of piece.geo.conns) {
      const f = FAMILY[c.k], key = f.fam + connKey(add3(c.p, piece.pos), c.a), slot = this.conns.get(key);
      if (slot) { (f.male ? slot.m : slot.f).delete(piece.id); if (!slot.m.size && !slot.f.size) this.conns.delete(key); }
    }
  }
  remove(id: number): Placed | undefined {
    const piece = this.pieces.get(id);
    if (!piece) return;
    this.pieces.delete(id);
    this.unindex(piece);
    return piece;
  }
  setColor(id: number, color: string) { const p = this.pieces.get(id); if (p) p.color = color; }

  /** Núm (đực) đang có mảnh khác cắm vào → không cần vẽ. */
  isCovered(p: V3, a: V3, kind: 's' | 'p') {
    const slot = this.conns.get((kind === 's' ? 'S' : 'P') + connKey(p, a));
    return !!slot && slot.f.size > 0;
  }

  /** Láng giềng nối trực tiếp của một mảnh. */
  neighbors(id: number): Set<number | 'ground'> {
    const p = this.pieces.get(id)!, out = new Set<number | 'ground'>();
    for (const j of this.joinsOf(p.geo.conns.map(c => ({ ...c, p: add3(c.p, p.pos) })))) if (j.other !== id) out.add(j.other);
    return out;
  }
  /** Cụm mảnh nối liền với `id` (không tính mặt bàn). */
  component(id: number, ignore?: Set<number>): Set<number> {
    const seen = new Set<number>([id]), queue = [id];
    while (queue.length) for (const n of this.neighbors(queue.pop()!)) if (n !== 'ground' && !seen.has(n) && !ignore?.has(n)) { seen.add(n); queue.push(n); }
    return seen;
  }
  /** Dời cả cụm theo trục đứng có va chạm với phần còn lại không (kèm hộp của mảnh sắp thêm). */
  canShift(ids: Set<number>, dy: number, extra: Box[] = [], ignore?: Set<number>) {
    const moved: Box[] = [...extra];
    for (const id of ids) { const p = this.pieces.get(id)!; if (p.bbox[1] + dy < -AREA.height) return false; for (const b of p.boxes) moved.push([b[0], b[1] + dy, b[2], b[3], b[4] + dy, b[5]]); }
    for (const b of moved) for (const n of this.near(b)) if (!ids.has(n.id) && !ignore?.has(n.id) && n.boxes.some(c => overlap(b, c))) return false;
    return true;
  }
  /** Dời các mảnh theo trục đứng, GIỮ thứ tự lắp. */
  shift(ids: Iterable<number>, dy: number) {
    for (const id of ids) {
      const p = this.pieces.get(id)!;
      this.unindex(p);
      p.pos = [p.pos[0], p.pos[1] + dy, p.pos[2]];
      Object.assign(p, this.shape(p.part, p.pos, p.o));
      p.female = new Set(p.geo.conns.filter(c => !FAMILY[c.k].male).map(c => FAMILY[c.k].fam + connKey(add3(c.p, p.pos), c.a)));
      this.index(p);
    }
  }
  /** Mảnh không có đường nối tới một mảnh chạm mặt bàn (mục 4.3; mặt bàn là chỗ đỡ). */
  floating(): Set<number> {
    const grounded = new Set<number>(), queue: number[] = [];
    const adj = new Map<number, Set<number | 'ground'>>();
    for (const [id, p] of this.pieces) { const n = this.neighbors(id); adj.set(id, n); if (n.has('ground') || p.bbox[4] >= -TOL) { grounded.add(id); queue.push(id); } }
    while (queue.length) { const id = queue.pop()!; for (const n of adj.get(id)!) if (n !== 'ground' && !grounded.has(n)) { grounded.add(n); queue.push(n); } }
    return new Set([...this.pieces.keys()].filter(id => !grounded.has(id)));
  }

  clear() { this.pieces.clear(); this.cells.clear(); this.conns.clear(); this.nextId = 1; }
}

/** Mặt bàn: núm ảo hướng lên ở mọi (20i+10, 0, 20k+10) trong vùng xây. */
export function isGroundStud(p: V3, a: V3) {
  return a[0] === 0 && a[1] === -1 && a[2] === 0 && Math.abs(p[1]) < 1e-6 && mod20(p[0]) === 10 && mod20(p[2]) === 10 && p[0] > AREA.min && p[0] < AREA.max && p[2] > AREA.min && p[2] < AREA.max;
}
const mod20 = (v: number) => ((Math.round(v) % 20) + 20) % 20;
