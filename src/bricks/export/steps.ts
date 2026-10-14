// Thứ tự các bước lắp (plan mục 11.4): theo đồ thị kết nối + thấp trước + kiểm tra đường cắm (sweep).
// - Tập "lắp được": mảnh chạm bàn, hoặc nối vào mảnh đã lắp.
// - Trong tập đó lấy tầng thấp nhất (LDraw Y lớn nhất = thấp); hoà thì theo thứ tự bé đã lắp.
// - Đường cắm: mảnh phải trượt vào chỗ dọc trục cắm mà không đụng mảnh đã lắp; bị chặn thì để sau, và nếu
//   không còn mảnh nào trượt được thì lấy mảnh thấp nhất kèm cờ `hard` (ghi chú "lắp cụm này riêng").
// - Tối đa `maxPerStep` mảnh mỗi bước, cùng tầng (lệch ≤ 8 LDU) và gần nhau.
import type { Box, V3 } from '../engine/types';
import { add3, overlap, type Placed, type World } from '../engine/world';

export interface Step { pieces: number[]; hard?: boolean }

const FAR = 4000;

/** Hướng mảnh đi vào chỗ khi lắp, suy từ điểm nối khớp với phần đã có; mặc định: từ trên xuống (+Y LDraw). */
function insertionDir(world: World, p: Placed, built: Set<number>): V3 {
  for (const c of p.geo.conns) {
    const pos = add3(c.p, p.pos);
    for (const j of world.joinsOf([{ k: c.k, p: pos, a: c.a }])) {
      if (j.other === 'ground' || built.has(j.other as number)) {
        // lỗ nhận (a/h): mảnh di chuyển ngược trục; núm/chốt (s/p): di chuyển theo trục
        const female = c.k === 'a' || c.k === 'h';
        return female ? [-c.a[0], -c.a[1], -c.a[2]] : [c.a[0], c.a[1], c.a[2]];
      }
    }
  }
  return [0, 1, 0];
}

/** Khối quét: mỗi hộp kéo dài ngược hướng đi vào tới tận xa (mảnh đến từ phía đó). */
function sweptBoxes(p: Placed, dir: V3): Box[] {
  return p.boxes.map(b => {
    const out = [...b] as Box;
    for (let i = 0; i < 3; i++) {
      if (dir[i] > 0.5) out[i] = b[i] - FAR;       // đi theo +i → đến từ phía −i
      else if (dir[i] < -0.5) out[i + 3] = b[i + 3] + FAR;
    }
    return out;
  });
}

function blocked(world: World, p: Placed, built: Set<number>): boolean {
  const dir = insertionDir(world, p, built);
  const swept = sweptBoxes(p, dir);
  for (const id of built) {
    const q = world.pieces.get(id)!;
    for (const a of swept) if (overlap(a, q.bbox)) for (const b of q.boxes) if (overlap(a, b)) return true;
  }
  return false;
}

export function buildSteps(world: World, maxPerStep = 6): Step[] {
  if (world.floating().size) throw Error('Còn mảnh lơ lửng. Gắn lại hoặc tháo các mảnh viền đỏ trước khi xuất hướng dẫn.');
  const order = [...world.pieces.keys()];
  const rank = new Map(order.map((id, i) => [id, i]));
  const built = new Set<number>(), steps: Step[] = [];
  const touchesTable = (p: Placed) => p.bbox[4] >= -2.5;
  const connected = (id: number) => { for (const n of world.neighbors(id)) if (n === 'ground' || built.has(n as number)) return true; return false; };
  const remaining = new Set(order);
  while (remaining.size) {
    const ready = [...remaining].map(id => world.pieces.get(id)!).filter(p => touchesTable(p) || connected(p.id));
    // cụm không nối gì với phần đã có và không chạm bàn (lơ lửng): vẫn phải đưa vào, để cuối
    const pool = ready.length ? ready : [...remaining].map(id => world.pieces.get(id)!);
    const free = pool.filter(p => !blocked(world, p, built));
    const hard = !free.length;
    const cand = (free.length ? free : pool).sort((a, b) => b.bbox[4] - a.bbox[4] || rank.get(a.id)! - rank.get(b.id)!);
    const first = cand[0], level = first.bbox[4];
    const step: number[] = [first.id];
    const center = (p: Placed): V3 => [(p.bbox[0] + p.bbox[3]) / 2, 0, (p.bbox[2] + p.bbox[5]) / 2];
    const c0 = center(first);
    for (const p of cand.slice(1)) {
      if (step.length >= maxPerStep) break;
      if (Math.abs(p.bbox[4] - level) > 8) continue;
      const c = center(p);
      if (Math.hypot(c[0] - c0[0], c[2] - c0[2]) > 160) continue;
      step.push(p.id);
    }
    for (const id of step) { built.add(id); remaining.delete(id); }
    steps.push(hard ? { pieces: step, hard } : { pieces: step });
  }
  return steps;
}
