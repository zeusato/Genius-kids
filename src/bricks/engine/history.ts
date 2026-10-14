// Hoàn tác / làm lại dạng lệnh (plan mục 10.2), tối đa 200 bước, chỉ trong bộ nhớ.
import type { V3 } from './types';
import type { World } from './world';

export interface PieceState { id: number; part: string; color: string; pos: V3; o: number }
export type Op =
  | { t: 'add'; p: PieceState }
  | { t: 'remove'; p: PieceState; index: number }
  | { t: 'color'; id: number; from: string; to: string }
  | { t: 'shift'; ids: number[]; dy: number }
  | { t: 'batch'; ops: Op[] };

const snap = (w: World, id: number): PieceState => { const p = w.pieces.get(id)!; return { id, part: p.part, color: p.color, pos: [...p.pos] as V3, o: p.o }; };

/** Chèn lại mảnh vào đúng vị trí thứ tự lắp cũ (để "Xem quá trình lắp" và mô hình lưu ra không đổi). */
function reinsert(w: World, s: PieceState, index: number) {
  const rest = [...w.pieces.values()].slice(index).map(p => snap(w, p.id));
  for (const r of rest) w.remove(r.id);
  w.add(s.part, s.color, s.pos, s.o, s.id);
  for (const r of rest) w.add(r.part, r.color, r.pos, r.o, r.id);
}

export class History {
  private undoStack: Op[] = [];
  private redoStack: Op[] = [];
  constructor(private world: World, private limit = 200) {}

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  private push(op: Op) { this.undoStack.push(op); if (this.undoStack.length > this.limit) this.undoStack.shift(); this.redoStack = []; }

  add(part: string, color: string, pos: V3, o: number) {
    const p = this.world.add(part, color, pos, o);
    this.push({ t: 'add', p: snap(this.world, p.id) });
    return p;
  }
  /** Lắp theo kết quả kiểm tra: nếu cần nâng cụm (`lift`) thì nâng trước rồi lắp, gộp thành một bước hoàn tác. */
  place(part: string, color: string, pos: V3, o: number, lift?: { ids: number[]; dy: number }) {
    if (!lift) return this.add(part, color, pos, o);
    this.world.shift(lift.ids, lift.dy);
    const p = this.world.add(part, color, [pos[0], pos[1] + lift.dy, pos[2]], o);
    this.push({ t: 'batch', ops: [{ t: 'shift', ids: lift.ids, dy: lift.dy }, { t: 'add', p: snap(this.world, p.id) }] });
    return p;
  }
  remove(id: number) {
    const index = [...this.world.pieces.keys()].indexOf(id);
    if (index < 0) return;
    const s = snap(this.world, id);
    this.world.remove(id);
    this.push({ t: 'remove', p: s, index });
  }
  color(id: number, to: string) {
    const p = this.world.pieces.get(id);
    if (!p || p.color === to) return;
    const from = p.color;
    this.world.setColor(id, to);
    this.push({ t: 'color', id, from, to });
  }
  /** Dời/xoay: tháo rồi lắp mới ở cuối thứ tự (plan mục 10.1). */
  move(id: number, pos: V3, o: number) {
    const index = [...this.world.pieces.keys()].indexOf(id);
    if (index < 0) return;
    const s = snap(this.world, id);
    this.world.remove(id);
    const n = this.world.add(s.part, s.color, pos, o);
    this.push({ t: 'batch', ops: [{ t: 'remove', p: s, index }, { t: 'add', p: snap(this.world, n.id) }] });
    return n;
  }

  private apply(op: Op, inverse: boolean) {
    const w = this.world;
    switch (op.t) {
      case 'add': if (inverse) w.remove(op.p.id); else w.add(op.p.part, op.p.color, op.p.pos, op.p.o, op.p.id); break;
      case 'remove': if (inverse) reinsert(w, op.p, op.index); else w.remove(op.p.id); break;
      case 'color': w.setColor(op.id, inverse ? op.from : op.to); break;
      case 'shift': w.shift(op.ids, inverse ? -op.dy : op.dy); break;
      case 'batch': for (const o of inverse ? [...op.ops].reverse() : op.ops) this.apply(o, inverse); break;
    }
  }
  undo() { const op = this.undoStack.pop(); if (!op) return false; this.apply(op, true); this.redoStack.push(op); return true; }
  redo() { const op = this.redoStack.pop(); if (!op) return false; this.apply(op, false); this.undoStack.push(op); return true; }
  clear() { this.undoStack = []; this.redoStack = []; }
}
