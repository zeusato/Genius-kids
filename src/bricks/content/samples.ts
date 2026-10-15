// 10 mô hình mẫu (plan mục 12, D: Claude dựng, chủ dự án duyệt ảnh). Dựng bằng engine thật nên luôn hợp lệ.
// Toạ độ LDraw (LDU): núm nằm ở bội lẻ của 10. `d(part, màu, x, z, hướng)` thả mảnh từ trên xuống tại (x, z) — tự chồng lên mảnh bên dưới.
import { pick } from '../engine/pick';
import { suggest } from '../engine/place';
import { YAW } from '../engine/orient';
import { World } from '../engine/world';
import { History } from '../engine/history';
import { encodeWorld, type BrickModel } from '../engine/model';
import type { Catalog, V3 } from '../engine/types';

type Drop = (part: string, color: string, x: number, z: number, yaw?: number) => boolean;
export interface Tools { /** gắn bánh xe vào mọi chốt của tấm trục bánh */ wheels(color: string): void }
export interface Sample { id: string; name: string; icon: string; build: (d: Drop, t: Tools) => void }

export const SAMPLES: Sample[] = [
  { id: 'vit', name: 'Chú vịt vàng', icon: '🦆', build: d => {
    d('3036', 'azure', 0, 0); // mặt ao 6×8
    d('3020', 'orange', 0, 0); // chân
    d('3001', 'yellow', 0, 0); d('3001', 'yellow', 0, 0); // thân
    d('3040b', 'yellow', -30, 0, 2); // đuôi
    d('3003', 'yellow', 20, 0); // cổ
    d('3023b', 'orange', 36, -10); d('3023b', 'orange', 36, 10); // mỏ nhô ra trước
    d('3003', 'yellow', 20, 0); // đầu
    d('98138p07', 'white', 30, -10); d('98138p07', 'white', 30, 10); // mắt
    for (const [x, z] of [[-70, -50], [70, -50], [-70, 50], [70, 50]]) { d('3005', 'green', x, z); d('3005', 'green', x, z); } // lau sậy
    d('3024', 'bright-green', -50, 50); d('24866', 'pink', -50, 50); // lá súng + hoa
    d('3024', 'bright-green', 50, -50); d('24866', 'white', 50, -50);
  } },
  { id: 'xe-dua', name: 'Xe đua', icon: '🏎️', build: (d, t) => {
    d('4600', 'black', 0, -40); d('4600', 'black', 0, 40);
    d('3034', 'red', 0, 0, 1);
    d('3039', 'red', 0, 50, 3); d('3823', 'trans-clear', 0, 0, 3);
    d('3069bpa0', 'white', 0, -50, 1);
    t.wheels('light-gray');
    for (const x of [-10, 10]) { d('3062b', 'light-gray', x, -70); d('3062b', 'light-gray', x, -70); } // ống xả + chân cánh gió
    d('3023b', 'black', 0, -70); d('3069b', 'yellow', 0, -70); // cánh gió sau
    d('3024', 'trans-yellow', -10, 70); d('3024', 'trans-yellow', 10, 70); // đèn pha
    d('3062b', 'yellow', 0, -10); d('59900', 'white', 0, -10); // tay đua đội mũ
  } },
  { id: 'ten-lua', name: 'Tên lửa', icon: '🚀', build: d => {
    d('3958', 'dark-gray', 0, 0); // bệ phóng 6×6
    d('3022', 'dark-gray', 0, 0);
    for (let i = 0; i < 4; i++) d('92947', i % 2 ? 'red' : 'white', 0, 0);
    d('3942c', 'red', 0, 0);
    for (const [x, z, y] of [[30, 0, 0], [-30, 0, 2], [0, 30, 3], [0, -30, 1]] as const) d('3040b', 'red', x, z, y);
    for (let i = 0; i < 5; i++) d('3005', 'light-gray', 50, -50); // tháp phóng
    d('3062b', 'trans-red', 50, -50); // đèn đỉnh tháp
    for (const [x, z] of [[-50, -50], [-50, 50], [50, 50]]) d('3062b', 'trans-yellow', x, z); // đèn bệ
  } },
  { id: 'nha', name: 'Ngôi nhà nhỏ', icon: '🏠', build: d => {
    d('3958', 'bright-green', 0, 0);
    for (let i = 0; i < 3; i++) for (const [x, z] of [[-50, -50], [50, -50], [-50, 50], [50, 50]]) d('3005', i < 2 ? 'red' : 'white', x, z);
    d('kit-window-1x2x2', 'white', 0, -50); d('kit-door-1x4x6', 'white', 0, 50);
    d('3958', 'blue', 0, 0);
    d('3039', 'blue', -20, 0); d('3039', 'blue', 20, 0, 2);
    d('24866', 'pink', -50, 0); d('24866', 'yellow', 50, 0);
  } },
  { id: 'cay', name: 'Cây anh đào', icon: '🍒', build: d => {
    d('3958', 'bright-green', 0, 0); // bãi cỏ 6×6
    d('3022', 'bright-green', 0, 0);
    for (let i = 0; i < 3; i++) d('3005', 'brown', -10, -10);
    d('3031', 'green', -10, -10); d('2417', 'green', -10, -10);
    for (const [x, z] of [[10, 30], [-30, 30], [-50, 10]]) { d('85861', 'red', x, z); d('22667', 'red', x, z); }
    for (const [x, z, c] of [[50, 50, 'yellow'], [50, -50, 'pink'], [-50, -50, 'white'], [30, -50, 'lavender']] as const) { d('3024', 'green', x, z); d('24866', c, x, z); } // hoa dưới gốc
  } },
  { id: 'robot', name: 'Rô-bốt', icon: '🤖', build: d => {
    d('3020', 'dark-gray', 0, 0); // bàn chân
    for (let i = 0; i < 2; i++) { d('3003', 'blue', -20, 0); d('3003', 'blue', 20, 0); } // hai chân
    d('3001', 'red', 0, 0); d('3001', 'red', 0, 0); // thân
    d('3034', 'light-gray', 0, 0); // vai
    for (const x of [-70, 70]) for (const z of [-10, 10]) { d('3005', 'light-gray', x, z); d('3062b', 'yellow', x, z); } // tay giơ lên + nắm tay
    d('3003', 'white', 0, 0); d('3069bpx8', 'white', 0, -10); // đầu + mắt
    d('59900', 'red', -10, 10); d('59900', 'red', 10, 10); // ăng-ten
  } },
  { id: 'thuyen', name: 'Con thuyền', icon: '⛵', build: d => {
    d('3036', 'azure', 0, 0); // mặt biển 6×8
    d('3034', 'brown', 0, 0); d('3009', 'brown', -10, -20, 0); d('3009', 'brown', -10, 20, 0);
    for (let i = 0; i < 6; i++) d('3005', 'white', 10, 0);
    d('3040b', 'white', -10, 0, 2); d('3039', 'white', 30, 0, 0);
    d('3070bpf3', 'red', 10, 0);
    for (const [x, z] of [[-70, -50], [70, 50], [-50, 50], [50, -50]]) d('3024', 'white', x, z); // sóng
    d('3062b', 'orange', -70, 50); d('3062b', 'orange', 70, -50); // phao
    d('3024', 'white', 70, -30); // thêm sóng
  } },
  { id: 'lau-dai', name: 'Lâu đài nhỏ', icon: '🏰', build: d => {
    d('3958', 'tan', 0, 0);
    for (let i = 0; i < 2; i++) for (const [x, z, y] of [[0, -50, 0], [0, 50, 0], [-50, 0, 1], [50, 0, 1]] as const) d('3010', 'light-gray', x, z, y);
    for (let i = 0; i < 4; i++) for (const [x, z] of [[-50, -50], [50, -50], [-50, 50], [50, 50]]) d('3005', 'dark-gray', x, z);
    for (const [x, z] of [[-50, -50], [50, -50], [-50, 50], [50, 50]]) d('59900', 'red', x, z);
    d('2417', 'green', 0, 0);
  } },
  { id: 'ca', name: 'Con cá', icon: '🐟', build: d => {
    d('3036', 'azure', 0, 0); // đáy biển 6×8
    d('3020', 'orange', 0, 0, 0); d('3020', 'orange', 0, 0, 0);
    d('3021', 'orange', 0, 0, 1);
    d('3040b', 'orange', -40, 0, 2); d('3040b', 'orange', 40, 0, 0);
    d('98138p07', 'white', 10, 10); d('98138p07', 'white', 10, -10); d('3070bpf3', 'red', -10, -10);
    for (const [x, z] of [[-70, -50], [70, 50]]) for (let i = 0; i < 3; i++) d('3005', 'green', x, z); // rong biển
    d('3062b', 'pink', -70, 50); d('3062b', 'pink', 70, -50); // san hô
    for (const [x, z] of [[50, -50], [-50, 50], [-50, -50]]) d('3062b', 'trans-clear', x, z); // bong bóng
  } },
  { id: 'chau-hoa', name: 'Chậu hoa', icon: '🌷', build: d => {
    d('3960', 'light-gray', 0, 0); // đĩa lót
    d('87081', 'orange', 0, 0); d('87081', 'orange', 0, 0); // chậu tròn 4×4
    d('3031', 'brown', 0, 0); // đất
    for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) { d('3005', 'green', x, z); d('3005', 'green', x, z); } // cành
    for (const [x, z, c] of [[-10, -10, 'pink'], [10, -10, 'yellow'], [-10, 10, 'red'], [10, 10, 'lavender']] as const) d('24866', c, x, z);
    for (const [x, z] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) { d('3024', 'bright-green', x, z); d('33291', 'white', x, z); } // hoa nhỏ quanh gốc
  } },
];

/** Dựng một mẫu vào thế giới; trả về danh sách mảnh không đặt được (để kiểm). */
export function buildSample(w: World, h: History, s: Sample, ox = 0, oz = 0) {
  const fails: string[] = [];
  const wheels = (color: string) => {
    for (const id of [...w.pieces.keys()]) {
      const p = w.pieces.get(id)!;
      if (p.part !== '4600') continue;
      for (const c of p.geo.conns.filter(c => c.k === 'p')) {
        const q: V3 = [c.p[0] + p.pos[0], c.p[1] + p.pos[1], c.p[2] + p.pos[2]];
        const hit = { kind: 'piece' as const, id, t: 0, normal: c.a, point: [q[0] + c.a[0] * 8, q[1], q[2] + c.a[2] * 8] as V3 };
        const r = suggest(w, 'kit-wheel-small', 0, hit, { radius: 60 });
        if (r.best?.ok) h.place('kit-wheel-small', color, r.best.pos, r.best.o, r.best.lift); else fails.push(`bánh: ${r.best?.reason}`);
      }
    }
  };
  s.build((part, color, x, z, yaw = 0) => {
    const hit = pick(w, [x + ox, -4000, z + oz], [0, 1, 0]);
    if (!hit) { fails.push(`${part}@${x},${z}: không trúng`); return false; }
    const r = suggest(w, part, YAW[yaw], hit);
    if (!r.best?.ok) { fails.push(`${part}@${x},${z}: ${r.best?.reason}`); return false; }
    h.place(part, color, r.best.pos, r.best.o, r.best.lift);
    return true;
  }, { wheels });
  return fails;
}

/** Mẫu → BrickModel (để chép vào tủ của bé khi bấm "Lắp lại cho riêng em"). */
export function sampleModel(catalog: Catalog, s: Sample, ownerId: string, id: string): BrickModel {
  const w = new World(catalog), h = new History(w);
  buildSample(w, h, s);
  const now = Date.now();
  return encodeWorld(w, { v: 1, ownerId, id, name: s.name, created: now, updated: now, revision: 0, idea: 'sample:' + s.id });
}
