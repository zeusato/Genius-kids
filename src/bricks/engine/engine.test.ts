import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import { ORIENTS, YAW, det, compose } from './orient';
import { World } from './world';
import { overlaps } from './testkit';
import { pick } from './pick';
import { suggest } from './place';
import { History } from './history';
import { encodeWorld, decodeInto, validateModel, type BrickModel } from './model';
import type { Catalog, V3 } from './types';

const catalog: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));
const base = { v: 1 as const, ownerId: 's1', id: 'm1', name: 'Thử', created: 0, updated: 0, revision: 0 };
let w: World;
beforeEach(() => { w = new World(catalog); });

/** Đặt mảnh qua gợi ý từ một tia bắn thẳng xuống tại (x, z). */
function dropAt(part: string, x: number, z: number, o = 0) {
  const hit = pick(w, [x, -2000, z], [0, 1, 0]);
  const s = suggest(w, part, o, hit!);
  return s.best;
}

describe('hướng', () => {
  it('24 ma trận khác nhau, định thức 1, đơn vị đứng đầu', () => {
    expect(ORIENTS).toHaveLength(24);
    expect(new Set(ORIENTS.map(m => m.join())).size).toBe(24);
    expect(ORIENTS.every(m => det(m) === 1)).toBe(true);
    expect(ORIENTS[0]).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    expect(new Set(YAW).size).toBe(4);
    expect(compose(YAW[1], YAW[3])).toBe(0);
  });
});

describe('đặt mảnh', () => {
  it('gạch 2×4 đặt trên bàn và gạch thứ hai chồng lên', () => {
    const a = dropAt('3001', 0, 0)!;
    expect(a.ok).toBe(true);
    expect(a.joins.some(j => j.other === 'ground')).toBe(true);
    w.add('3001', 'red', a.pos, a.o);
    const b = dropAt('3001', 0, 0)!;
    expect(b.ok).toBe(true);
    expect(b.pos[1]).toBe(a.pos[1] - 24);
    expect(b.joins.some(j => j.other === 1)).toBe(true);
  });

  it('không cho hai mảnh chồng lấn', () => {
    const a = dropAt('3001', 0, 0)!;
    w.add('3001', 'red', a.pos, a.o);
    expect(w.check('3001', a.pos, a.o).reason).toBe('collide');
  });

  it('lệch nửa núm: núm đâm vào thân mảnh trên → va chạm', () => {
    const a = dropAt('3001', 0, 0)!;
    w.add('3001', 'red', a.pos, a.o);
    const r = w.check('3001', [a.pos[0] + 10, a.pos[1] - 24, a.pos[2]], 0);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('collide');
  });

  it('tấm trơn không nhận mảnh phía trên', () => {
    const t = dropAt('3068b', 0, 0)!;
    w.add('3068b', 'blue', t.pos, t.o);
    const s = dropAt('3022', 0, 0)!;
    // gợi ý không thể nối lên mặt trơn; nếu có thì phải là đặt cạnh trên bàn chứ không chồng lên
    if (s?.ok) expect(s.pos[1]).toBeGreaterThan(t.pos[1] - 8);
  });

  it('gạch núm cạnh nhận tấm 1×1 ở mặt bên (hướng nằm ngang)', () => {
    const a = dropAt('87087', 0, 0)!;
    w.add('87087', 'red', a.pos, a.o);
    const side = w.pieces.get(1)!.geo.conns.find(c => c.k === 's' && c.a[1] === 0)!;
    const p: V3 = [side.p[0] + a.pos[0], side.p[1] + a.pos[1], side.p[2] + a.pos[2]];
    const from: V3 = [p[0] + side.a[0] * 100, p[1], p[2] + side.a[2] * 100];
    const hit = pick(w, from, [-side.a[0], 0, -side.a[2]])!;
    expect(hit.kind).toBe('piece');
    const s = suggest(w, '3024', 0, hit);
    expect(s.best?.ok).toBe(true);
    expect(YAW.includes(s.best!.o)).toBe(false);
  });

  it('bánh xe cắm vào chốt của tấm trục', () => {
    const a = dropAt('4600', 0, 0)!;
    w.add('4600', 'black', a.pos, a.o);
    const pin = w.pieces.get(1)!.geo.conns.find(c => c.k === 'p')!;
    const p: V3 = [pin.p[0] + a.pos[0], pin.p[1] + a.pos[1], pin.p[2] + a.pos[2]];
    const dir: V3 = [-pin.a[0], -pin.a[1], -pin.a[2]];
    const hit = pick(w, [p[0] - dir[0] * 200, p[1] - 1, p[2] - dir[2] * 200], dir)!;
    const s = suggest(w, 'kit-wheel-small', 0, hit, { radius: 60 });
    expect(s.best?.ok).toBe(true);
  });

  // Góp ý chủ dự án 15/10: tia lọt khe xuống tầng thấp thì mảnh bị nhét vào tầng trống, không lên được tầng trên.
  // Luật mới (như lắp thật — hạ mảnh từ trên xuống): chỗ ngay trên chân mảnh ở tầng thấp bị mảnh khác che → mảnh đậu lên mặt cao nhất.
  describe('chọn tầng khi tia lọt khe', () => {
    const channel = () => {
      w.add('3035', 'blue', [0, -8, 0], 0);                                            // tầng 1: tấm 4×8
      for (const z of [-30, 30]) { w.add('3666', 'blue', [0, -16, z], 0); w.add('3666', 'blue', [0, -24, z], 0); }   // tầng 2–3: hai mép
      return pick(w, [10, -2000, 0], [0, 1, 0])!;                                      // chạm đáy rãnh (mặt tầng 1)
    };
    it('tấm 1×6 cầm ngang qua rãnh: lên đỉnh tầng 3, giữ hướng đang cầm (không bị xoay nhét vào rãnh)', () => {
      const hit = channel();
      expect(hit.point[1]).toBe(-8);
      const s = suggest(w, '3666', YAW[1], hit).best!;
      expect(s.ok).toBe(true);
      expect(w.def('3666').symClass[s.o]).toBe(w.def('3666').symClass[YAW[1]]);
      expect(s.pos[1]).toBe(-32);                                                      // đáy mảnh nằm trên mặt tầng 3 (y = −24)
    });
    it('mảnh nhỏ vừa rãnh vẫn xuống đáy rãnh', () => {
      const s = suggest(w, '3024', 0, channel()).best!;
      expect(s.ok).toBe(true); expect(s.pos[1]).toBe(-16);
    });
    it('dưới mái cao (còn khoảng trống phía trên) vẫn lắp được trên mặt thấp', () => {
      for (const x of [-30, 30]) for (let i = 1; i <= 3; i++) w.add('3005', 'red', [x, -24 * i, 0], 0);
      w.add('3710', 'red', [0, -80, 0], 0);                                            // mái 1×4 cao 3 gạch
      const s = suggest(w, '3024', 0, pick(w, [10, -40, 0], [0, 1, 0])!).best!;        // tia đi dưới mái, chạm bàn
      expect(s.ok).toBe(true); expect(s.pos[1]).toBe(-8);
    });
  });

  it('chế độ bé chỉ cho hướng đứng', () => {
    const a = dropAt('87087', 0, 0)!;
    w.add('87087', 'red', a.pos, a.o);
    const hit = pick(w, [200, -12, 0], [-1, 0, 0])!;
    const s = suggest(w, '3024', 0, hit, { bottomUpOnly: true });
    if (s.best?.ok) expect(YAW.includes(s.best.o)).toBe(true);
  });
});

describe('mọi mảnh v1', () => {
  // Đế thử là gạch 1×1 (một núm, một lỗ): mảnh nào có lỗ nhận núm cũng phải gắn lên được,
  // mảnh nào có núm cũng phải gắn xuống dưới được. (Đĩa 2×2 chỉ có lỗ ở tâm nên không ngồi được giữa 4 núm của gạch 2×4 — đúng ngoài đời.)
  it('mảnh có lỗ nhận núm gắn được lên gạch 1×1; mảnh có núm gắn được xuống dưới gạch 1×1', { timeout: 300000 }, () => {
    const fails: string[] = [];
    for (const key of Object.keys(catalog.parts)) {
      const def = catalog.parts[key];
      for (const [kind, from, dir] of [['a', -2000, 1], ['s', 2000, -1]] as const) {
        if (!def.conns.some(c => c.k === kind)) continue;
        const ww = new World(catalog);
        ww.add('3005', 'red', [0, -400, 0], 0); // gạch treo lơ lửng làm đế thử
        // bắn từ trên xuống (gắn lên) hoặc từ dưới lên (gắn xuống)
        const hit = pick(ww, [0, from, 0], [0, dir, 0])!;
        const ok = [0, ...YAW.slice(1), ...ORIENTS.map((_, o) => o)].some(o => suggest(ww, key, o, hit, { radius: 60, maxChecks: 200 }).best?.ok);
        if (!ok) fails.push(`${key}:${kind}`);
      }
    }
    // 3957a (ăng-ten): núm ở đế nằm trong thân cột — ngoài đời không gắn gì vào được, engine báo va chạm là đúng.
    expect(fails.filter(f => f !== '3957a:s')).toEqual([]);
  });

  // Plan mục 14 GĐ0b "mọi mảnh × mọi hướng": với MỖI hướng khác nhau thật sự (theo symClass) mà mảnh có lỗ nhận
  // quay xuống (hoặc núm quay lên), khớp đúng điểm nối đó vào núm trên (hoặc lỗ dưới) của gạch 1×1 phải hợp lệ.
  it('mọi mảnh × mọi hướng có điểm nối đứng: gắn lên và gắn xuống gạch 1×1', { timeout: 300000 }, () => {
    const ww = new World(catalog);
    const baseBrick = ww.add('3005', 'red', [0, -400, 0], 0);
    const conn = (k: 's' | 'a') => { const c = baseBrick.geo.conns.find(c => c.k === k && c.a[1] === -1)!; return { p: [c.p[0], c.p[1] - 400, c.p[2]] as V3, a: c.a }; };
    const top = conn('s'), bottom = conn('a');
    const fails: string[] = [];
    let tried = 0;
    for (const key of Object.keys(catalog.parts)) {
      const def = ww.def(key);
      for (const [want, target] of [['a', top], ['s', bottom]] as const) {
        for (let o = 0; o < 24; o++) {
          if (def.symClass[o] !== o) continue;
          const mine = def.oriented(o).conns.filter(c => c.k === want && c.a.every((v, i) => v === target.a[i]));
          if (!mine.length) continue;
          tried++;
          const ok = mine.some(c => ww.check(key, [target.p[0] - c.p[0], target.p[1] - c.p[1], target.p[2] - c.p[2]], o).ok);
          if (!ok) fails.push(`${key}:${want}:o${o}`);
        }
      }
    }
    expect(tried).toBeGreaterThan(500);
    // Va chạm có thật (đã soi `why` của check), không phải lỗi dữ liệu:
    // - 3957a (ăng-ten): núm ở đế nằm trong thân cột.
    // - 3633 (hàng rào) nằm úp, núm cắm vào miệng lỗ mặt trong: đế hàng rào đâm vào gạch.
    // - 60212 (chắn bùn có lỗ) lật ngược cắm lỗ giữa: 4 núm quanh lỗ đâm xuống thân gạch.
    const known = (f: string) => f.startsWith('3957a:s') || /^3633:a:o(4|6|12|14)$/.test(f) || /^60212:a:o(1|3|21|23)$/.test(f);
    expect(fails.filter(f => !known(f))).toEqual([]);
  });
});

describe('lơ lửng, mô hình, hoàn tác', () => {
  it('tháo mảnh đỡ → mảnh trên thành lơ lửng', () => {
    const a = dropAt('3001', 0, 0)!; w.add('3001', 'red', a.pos, a.o);
    const b = dropAt('3001', 0, 0)!; w.add('3001', 'red', b.pos, b.o);
    expect(w.floating().size).toBe(0);
    w.remove(1);
    expect([...w.floating()]).toEqual([2]);
  });

  it('mã hoá và giải mã giữ nguyên', () => {
    const a = dropAt('3001', 0, 0)!; w.add('3001', 'red', a.pos, a.o);
    const b = dropAt('3039', 0, 0, YAW[1])!; w.add('3039', 'blue', b.pos, b.o);
    const m = encodeWorld(w, base);
    expect(m.stats.count).toBe(2);
    const w2 = new World(catalog);
    decodeInto(w2, JSON.parse(JSON.stringify(m)));
    expect(encodeWorld(w2, base)).toEqual(m);
    expect(() => validateModel({ ...m, b: [0, 0, 0, 0, 0, 99] })).toThrow();
    expect(() => validateModel({ ...m, b: [5, 0, 0, 0, 0, 0] })).toThrow();
  });

  it('mảnh lạ được bỏ qua và báo lại', () => {
    const m: BrickModel = { ...base, parts: ['3001', 'mảnh-tương-lai'], colors: ['red'], b: [0, 0, 10, 0, 10, 0, 1, 0, 0, -24, 0, 0], stats: { count: 2, size: [0, 0, 0] } };
    const r = decodeInto(w, m);
    expect(r.unknownParts).toEqual(['mảnh-tương-lai']);
    expect(w.pieces.size).toBe(1);
  });

  it('fuzz: thao tác ngẫu nhiên không bao giờ tạo chồng lấn; hoàn tác hết về rỗng, làm lại hết khớp', { timeout: 300000 }, () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const keys = ['3001', '3003', '3004', '3005', '3020', '3022', '3023b', '3039', '3040b', '87087', '3068b', '6141', '3062b', '15573', '4600'];
    const colors = ['red', 'blue', 'yellow'];
    const h = new History(w, 100000);
    for (let i = 0; i < 400; i++) {
      const r = rnd();
      if (r < 0.7 || w.pieces.size < 3) {
        const x = (rnd() - 0.5) * 300, z = (rnd() - 0.5) * 300;
        const dir: V3 = rnd() < 0.8 ? [0, 1, 0] : [rnd() - 0.5, 0.6, rnd() - 0.5];
        const hit = pick(w, [x - dir[0] * 2000, -2000, z - dir[2] * 2000], dir);
        if (!hit) continue;
        const part = keys[Math.floor(rnd() * keys.length)], o = Math.floor(rnd() * 24);
        const s = suggest(w, part, o, hit);
        if (s.best?.ok) h.place(part, colors[i % 3], s.best.pos, s.best.o, s.best.lift);
      } else if (r < 0.85) {
        const ids = [...w.pieces.keys()]; h.remove(ids[Math.floor(rnd() * ids.length)]);
      } else {
        const ids = [...w.pieces.keys()]; h.color(ids[Math.floor(rnd() * ids.length)], colors[Math.floor(rnd() * 3)]);
      }
    }
    expect(overlaps(w)).toEqual([]);
    const snapshot = encodeWorld(w, base);
    while (h.undo());
    expect(w.pieces.size).toBe(0);
    while (h.redo());
    expect(encodeWorld(w, base)).toEqual(snapshot);
  });
});
