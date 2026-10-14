// Cảnh mẫu cho bản thử (?demo=1): nhà nhỏ + xe có bánh + vài mảnh trang trí. Chỉ dùng ở dev để chụp ảnh kiểm tra.
import { pick } from './engine/pick';
import { suggest } from './engine/place';
import type { World } from './engine/world';
import type { History } from './engine/history';
import type { V3 } from './engine/types';

export function buildDemo(w: World, h: History) {
  const log: string[] = [];
  const drop = (part: string, color: string, x: number, z: number, o = 0) => {
    const hit = pick(w, [x, -4000, z], [0, 1, 0]);
    if (!hit) return null;
    const s = suggest(w, part, o, hit);
    if (s.best?.ok) { h.place(part, color, s.best.pos, s.best.o, s.best.lift); return s.best; }
    log.push(`${part}@${x},${z}: ${s.best?.reason}`);
    return null;
  };
  // Nhà: nền xanh, tường đỏ/trắng, cửa sổ, mái xanh dương
  drop('3958', 'bright-green', 0, 0);
  for (const [x, z] of [[-40, -40], [40, -40], [-40, 40], [40, 40]] as const) drop('3005', 'red', x, z);
  for (let i = 0; i < 2; i++) for (const [x, z] of [[-40, -40], [40, -40], [-40, 40], [40, 40]] as const) drop('3005', i ? 'white' : 'red', x, z);
  drop('kit-window-1x2x2', 'white', 0, -50);
  drop('kit-door-1x4x6', 'white', 0, 50);
  drop('3958', 'blue', 0, 0);
  drop('3039', 'blue', -20, 0); drop('3039', 'blue', 20, 0, 2);
  // trang trí
  drop('98138p07', 'white', -110, -40); drop('24866', 'pink', -110, 0); drop('59900', 'yellow', -110, 40);
  drop('3062b', 'trans-clear', -150, 0); drop('3069bpx8', 'yellow', -150, -50); drop('2417', 'green', -150, 60);
  // Xe: tấm trục + gạch + kính chắn gió, rồi bánh xe (cụm tự nâng lên)
  const holder = drop('4600', 'black', 260, -20);
  drop('4600', 'black', 260, 40);
  drop('3020', 'red', 260, 10, 1);
  drop('3823', 'trans-clear', 260, 0, 1);
  for (const id of [...w.pieces.keys()]) {
    const p = w.pieces.get(id)!;
    if (p.part !== '4600') continue;
    for (const c of p.geo.conns.filter(c => c.k === 'p')) {
      const q: V3 = [c.p[0] + p.pos[0], c.p[1] + p.pos[1], c.p[2] + p.pos[2]];
      // nhắm thẳng đầu chốt (như bé chạm vào chốt)
      const hit = { kind: 'piece' as const, id, t: 0, normal: c.a, point: [q[0] + c.a[0] * 8, q[1], q[2] + c.a[2] * 8] as V3 };
      const s = suggest(w, 'kit-wheel-small', 0, hit, { radius: 60 });
      if (s.best?.ok) h.place('kit-wheel-small', 'light-gray', s.best.pos, s.best.o, s.best.lift);
      else log.push(`bánh: ${s.best?.reason}`);
    }
  }
  if (!holder) log.push('không đặt được tấm trục');
  return log;
}
